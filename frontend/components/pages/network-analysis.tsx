"use client"

import { Plus, Minus, RotateCcw, ImageIcon, Maximize2 } from "lucide-react"
import { useEffect, useState } from "react"
import FilterPanel from "@/components/ui/filter-panel"
import GraphVisualization from "@/components/ui/graph-visualization"
import CriticalNodesPanel from "@/components/ui/critical-nodes-panel"
import { Spinner } from "@/components/ui/spinner"

type GraphData = {
  nodes: any[]
  links: any[]
}

export default function NetworkAnalysis() {
  const [selectedComponent, setSelectedComponent] = useState<number | null>(null)
  const [originalData, setOriginalData] = useState<GraphData | null>(null)
  const [filteredData, setFilteredData] = useState<GraphData | null>(null)
  const [rawData, setRawData] = useState<GraphData | null>(null) // pristine copy to avoid mutations by force-graph
  const [isComputingCentrality, setIsComputingCentrality] = useState(false)

  const criticalNodes = [
    { id: "N-0721", location: "Av. Arequipa c/ Angamos", centrality: 0.82 },
    { id: "N-1034", location: "Óvalo de Miraflores", centrality: 0.79 },
    { id: "N-0045", location: "Puente Benavides (Pan.)", centrality: 0.75 },
    { id: "N-0881", location: "Av. Universitaria c/ La Mar", centrality: 0.71 },
  ]

  // Load sample network once
  useEffect(() => {
    let mounted = true
    fetch('/sample-network.json')
      .then(r => r.json())
      .then((data) => {
        if (!mounted) return
        // augment sample data with simulated attributes: district, link length, link type
        const districts = ['Miraflores', 'San Isidro', 'Cercado', 'Ate', 'Los Olivos']
        const nodes = (data.nodes || []).map((n: any, i: number) => ({
          ...n,
          district: districts[i % districts.length],
        }))

        const links = (data.links || []).map((l: any, i: number) => ({
          ...l,
          length: +(Math.random() * 5 + 0.2).toFixed(2), // km
          type: i % 2 === 0 ? 'Metropolitana' : 'Local',
        }))

        const graph = { nodes, links }
        // keep a pristine deep clone so downstream mutation by visualization doesn't corrupt our source
        const pristine = JSON.parse(JSON.stringify(graph)) as GraphData
        setRawData(pristine)
        setOriginalData(pristine)
        setFilteredData(JSON.parse(JSON.stringify(pristine)))
      })
      .catch(console.error)
    return () => { mounted = false }
  }, [])

  // Listen for clear-route events to revert filteredData to the pristine rawData
  useEffect(() => {
    const handler = () => {
      if (!rawData) return
      try {
        const clone = JSON.parse(JSON.stringify(rawData)) as GraphData
        setFilteredData(clone)
        setSelectedComponent(null)
      } catch (err) {
        console.error('Failed to clear route and restore data', err)
      }
    }
    window.addEventListener('pathcycle:clear-route', handler)
    return () => window.removeEventListener('pathcycle:clear-route', handler)
  }, [rawData])

  // Listen for routes emitted by the OptimalRoute modal and apply them to the visualization
  useEffect(() => {
    const handler = (e: Event) => {
      // event is CustomEvent with detail payload
      const ce = e as CustomEvent
      const payload = ce.detail || {}
      if (!rawData) return
      try {
        const base = JSON.parse(JSON.stringify(rawData)) as GraphData
        const route: string[] = payload.route || (payload.nodes || []).map((n: any) => n.id)
        const routeLinks: any[] = payload.links || []

        // Boost node values for visual emphasis
        base.nodes.forEach(n => {
          if (route && route.includes(n.id)) {
            n.val = (n.val ?? 1) + 6
          } else {
            n.val = n.val ?? 1
          }
        })

        // Emphasize links that are part of the route
        base.links.forEach(l => {
          const match = routeLinks.some(rl => (
            (String(rl.source) === String(l.source) && String(rl.target) === String(l.target)) ||
            (String(rl.source) === String(l.target) && String(rl.target) === String(l.source))
          ))
          if (match) l.value = (l.value ?? 1) * 3
        })

        setFilteredData(base)
      } catch (err) {
        console.error('Error applying route payload', err)
      }
    }

    window.addEventListener('pathcycle:use-route', handler as EventListener)
    return () => window.removeEventListener('pathcycle:use-route', handler as EventListener)
  }, [rawData])

  const applyFilters = async (filters: any) => {
    // Use pristine rawData as the source of truth to avoid mutations from the visualization library
    if (!rawData) return
    const { districts, typeVia, minLength, showComponents, highlightCritical } = filters

    // deep clone the raw data to work on fresh objects
    const base = JSON.parse(JSON.stringify(rawData)) as GraphData
    let nodes = base.nodes as any[]
    let links = base.links as any[]

    // keep maps of original values so we can restore when toggles are off
    const originalGroupMap = Object.fromEntries((rawData.nodes || []).map(n => [n.id, n.group]))
    const originalValMap = Object.fromEntries((rawData.nodes || []).map(n => [n.id, n.val]))

    // Filter links by type (if selected)
    if (typeVia && typeVia !== 'Ambas') {
      links = links.filter(l => l.type === typeVia)
    }

    // Filter links by minLength
    if (minLength && Number(minLength) > 0) {
      links = links.filter(l => Number(l.length) >= Number(minLength))
    }

    // If districts filtering is applied, keep only nodes in those districts and links between them
    if (districts && districts.length > 0) {
      const keepNodeIds = new Set(nodes.filter(n => districts.includes(n.district)).map(n => n.id))
      links = links.filter(l => keepNodeIds.has(String(l.source)) && keepNodeIds.has(String(l.target)))
      nodes = nodes.filter(n => keepNodeIds.has(n.id))
    } else {
      // otherwise remove nodes that are not connected to any remaining link
      const connected = new Set<string>()
      links.forEach(l => { connected.add(String(l.source)); connected.add(String(l.target)) })
      nodes = nodes.filter(n => connected.has(n.id))
    }

    // Reassign types on links to ensure source/target remain ids (avoid object refs)
    links = links.map(l => ({ ...l, source: String(l.source), target: String(l.target) }))

    // If requested, compute connected components and color nodes by component index
    if (showComponents) {
      const adj: Record<string, string[]> = {}
      nodes.forEach(n => { adj[n.id] = [] })
      links.forEach(l => {
        const s = String(l.source)
        const t = String(l.target)
        if (adj[s]) adj[s].push(t)
        if (adj[t]) adj[t].push(s)
      })

      const visited = new Set<string>()
      let compIndex = 1
      for (const n of nodes) {
        const id = n.id
        if (visited.has(id)) continue
        // BFS
        const queue = [id]
        while (queue.length) {
            const cur = queue.shift() as string
            if (visited.has(cur)) continue
            visited.add(cur)
            // set component as group (string) so GraphVisualization can color by component without colliding
            const nodeObj = nodes.find(x => x.id === cur)
            if (nodeObj) nodeObj.group = `comp-${compIndex}`
            const neighbors = adj[cur] || []
            neighbors.forEach(nb => { if (!visited.has(nb)) queue.push(nb) })
          }
        compIndex += 1
      }
    } else {
      // restore original groups
      nodes.forEach(n => { n.group = originalGroupMap[n.id] ?? n.group })
    }

    // If requested, compute betweenness in a Web Worker to avoid blocking the UI
    if (highlightCritical) {
      setIsComputingCentrality(true)
      try {
        const worker = new Worker('/workers/centrality-worker.js')
        const payload = { type: 'compute', nodes, links, sampleSize: filters.sampleSize, sampleStrategy: filters.sampleStrategy }

        const betweenness: Record<string, number> | null = await new Promise((resolve, reject) => {
          const onMessage = (e: MessageEvent) => {
            const d = e.data || {}
            if (d.type === 'result') {
              worker.removeEventListener('message', onMessage)
              resolve(d.betweenness)
            }
          }
          worker.addEventListener('message', onMessage)
          worker.postMessage(payload)
          // timeout
          const to = setTimeout(() => {
            worker.removeEventListener('message', onMessage)
            try { worker.terminate() } catch (e) {}
            reject(new Error('centrality worker timeout'))
          }, 30000)
        }).catch(err => {
          console.error('Centrality worker error', err)
          return null
        })

        if (betweenness) {
          const max = Math.max(...Object.values(betweenness)) || 0
          nodes.forEach(n => {
            const baseVal = originalValMap[n.id] ?? (n.val ?? 1)
            const score = max > 0 ? (betweenness[n.id] || 0) / max : 0
            n.val = baseVal + Math.round(score * 6)
          })
        } else {
          nodes.forEach(n => { n.val = originalValMap[n.id] ?? n.val })
        }
      } catch (err) {
        console.error('Failed to compute centrality in worker', err)
        nodes.forEach(n => { n.val = originalValMap[n.id] ?? n.val })
      } finally {
        setIsComputingCentrality(false)
      }
    } else {
      // restore original values
      nodes.forEach(n => { n.val = originalValMap[n.id] ?? n.val })
    }

    const newGraph = { nodes, links }
    setFilteredData(newGraph)
  }

  return (
    <main className="flex-1 flex overflow-hidden">
      {/* Left Panel: Filters */}
      <FilterPanel districts={["Miraflores","San Isidro","Cercado","Ate","Los Olivos"]} onApply={applyFilters} />

      {/* Center: Graph Visualization */}
      <section className="flex-1 bg-pathcycle-gray-100 relative overflow-hidden">
        {/* Floating Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
          <button className="w-9 h-9 flex items-center justify-center bg-white text-pathcycle-gray-800 hover:bg-pathcycle-gray-50 rounded-t-lg shadow-sm border border-pathcycle-gray-100">
            <Plus className="w-5 h-5" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center bg-white text-pathcycle-gray-800 hover:bg-pathcycle-gray-50 shadow-sm border-b border-pathcycle-gray-100">
            <Minus className="w-5 h-5" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center bg-white text-pathcycle-gray-800 hover:bg-pathcycle-gray-50 rounded-b-lg shadow-sm border border-pathcycle-gray-100">
            <RotateCcw className="w-5 h-5" />
          </button>

          <button className="w-9 h-9 mt-2 flex items-center justify-center bg-white text-pathcycle-gray-800 hover:bg-pathcycle-gray-50 rounded-lg shadow-sm border border-pathcycle-gray-100">
            <ImageIcon className="w-5 h-5" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center bg-white text-pathcycle-gray-800 hover:bg-pathcycle-gray-50 rounded-lg shadow-sm border border-pathcycle-gray-100">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>

        <GraphVisualization data={filteredData ?? undefined} />
        {isComputingCentrality && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
            <div className="bg-white/95 p-4 rounded-md shadow-md flex items-center gap-3">
              <Spinner className="w-5 h-5 text-pathcycle-primary" />
              <div className="text-sm font-medium">Calculando centralidad...</div>
            </div>
          </div>
        )}
      </section>

      {/* Right Panel: Critical Nodes */}
      <CriticalNodesPanel criticalNodes={criticalNodes} />
    </main>
  )
}
