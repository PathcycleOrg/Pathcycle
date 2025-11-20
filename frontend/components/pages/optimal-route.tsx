"use client"

import { ArrowLeftRight, Download, CheckCircle } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import GraphVisualization from "@/components/ui/graph-visualization"
import { MapVisualization } from "@/components/ui/map-visualization"
import type { MapVisualizationRef } from "@/components/ui/map-visualization"

type GraphData = { nodes: any[]; links: any[] }

export default function OptimalRoute({ open = true, onClose }: { open?: boolean; onClose?: () => void }) {
  if (!open) return null
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [origin, setOrigin] = useState<string | null>(null)
  const [destination, setDestination] = useState<string | null>(null)
  const [route, setRoute] = useState<string[] | null>(null)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [timeMin, setTimeMin] = useState<number | null>(null)
  const [isComputing, setIsComputing] = useState(false)
  const miniMapRef = useRef<MapVisualizationRef | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/sample-network.json')
      .then(r => r.json())
      .then((data) => {
        if (!mounted) return
        // augment with simulated length (km) if absent
        const rawNodes = (data.nodes || []).map((n: any) => ({ ...n }))
        // Ensure nodes have coordinates: generate deterministic-ish test coords around Lima center when missing
        const CENTER: [number, number] = [-77.0424, -12.0464]
        const nodes = rawNodes.map((n: any, i: number) => {
          const hasCoord = (
            Array.isArray(n.coordinates) && n.coordinates.length >= 2
          ) || (n.geometry && Array.isArray(n.geometry.coordinates)) || (n.lng !== undefined && n.lat !== undefined) || (n.longitude !== undefined && n.latitude !== undefined) || (n.x !== undefined && n.y !== undefined)
          if (hasCoord) return { ...n }
          // generate a grid-like offset to avoid overlaps
          const col = i % 6
          const row = Math.floor(i / 6)
          const lng = CENTER[0] + (col - 2.5) * 0.008 + ((i % 2) ? 0.001 : -0.001)
          const lat = CENTER[1] + (row - 1.5) * 0.004 + ((i % 3) ? -0.0008 : 0.0008)
          return { ...n, coordinates: [lng, lat], lng, lat, geometry: { type: 'Point', coordinates: [lng, lat] } }
        })
        const links = (data.links || []).map((l: any, i: number) => ({
          ...l,
          length: l.length ?? +(Math.random() * 5 + 0.2).toFixed(2),
        }))
        setGraph({ nodes, links })
      })
      .catch(console.error)
    return () => { mounted = false }
  }, [])

  const swap = () => {
    setOrigin(destination)
    setDestination(origin)
    setRoute(null)
  }

  const computeRoute = () => {
    if (!graph || !origin || !destination || origin === destination) return
    setIsComputing(true)
    // Dijkstra
    const nodes = graph.nodes.map(n => n.id)
    const adj: Record<string, Array<{ to: string; w: number }>> = {}
    nodes.forEach(id => adj[id] = [])
    graph.links.forEach((l: any) => {
      const s = String(l.source)
      const t = String(l.target)
      const w = Number(l.length ?? l.value ?? 1)
      if (adj[s]) adj[s].push({ to: t, w })
      if (adj[t]) adj[t].push({ to: s, w })
    })

    const dist: Record<string, number> = {}
    const prev: Record<string, string | null> = {}
    const Q = new Set(nodes)
    nodes.forEach(n => { dist[n] = Infinity; prev[n] = null })
    dist[origin] = 0

    while (Q.size) {
      // pick min dist
      let u: string | null = null
      let best = Infinity
      for (const v of Q) {
        if (dist[v] < best) { best = dist[v]; u = v }
      }
      if (u === null) break
      Q.delete(u)
      if (u === destination) break
      const neighbors = adj[u] || []
      for (const e of neighbors) {
        const alt = dist[u] + e.w
        if (alt < dist[e.to]) {
          dist[e.to] = alt
          prev[e.to] = u
        }
      }
    }

    // reconstruct path
    const path: string[] = []
    let cur: string | null = destination
    while (cur) {
      path.push(cur)
      cur = prev[cur]
    }
    path.reverse()
    if (path.length === 0 || path[0] !== origin) {
      setRoute(null)
      setDistanceKm(null)
      setTimeMin(null)
      setIsComputing(false)
      return
    }

    // compute distance
    let total = 0
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i+1]
      const link = graph.links.find((L: any) => (String(L.source) === a && String(L.target) === b) || (String(L.source) === b && String(L.target) === a))
      if (link) total += Number(link.length ?? link.value ?? 0)
    }
    // estimate time assuming average cycling speed 15 km/h
    const time = total / 15 * 60

    setRoute(path)
    setDistanceKm(Number(total.toFixed(2)))
    setTimeMin(Math.round(time))
    // dispatch a preview event so the map can draw the polyline without applying the route to the graph
    try {
      const nodesPayload = graph.nodes.filter(n => path.includes(n.id))
      const linksPayload = graph.links.filter((l: any) => {
        for (let i = 0; i < path.length -1; i++) {
          const a = path[i], b = path[i+1]
          if ((String(l.source) === a && String(l.target) === b) || (String(l.source) === b && String(l.target) === a)) return true
        }
        return false
      })
      const payload = { route: path, nodes: nodesPayload, links: linksPayload, distanceKm: Number(total.toFixed(2)), timeMin: Math.round(time) }
      window.dispatchEvent(new CustomEvent('pathcycle:preview-route', { detail: payload }))
    } catch (e) {
      console.warn('No se pudo emitir preview-route', e)
    }

    setIsComputing(false)
  }

  const exportRoute = () => {
    if (!route || !graph) return
    const nodes = graph.nodes.filter(n => route.includes(n.id))
    const links = graph.links.filter((l: any) => {
      for (let i = 0; i < route.length -1; i++) {
        const a = route[i], b = route[i+1]
        if ((String(l.source) === a && String(l.target) === b) || (String(l.source) === b && String(l.target) === a)) return true
      }
      return false
    })
    const payload = { nodes, links, distanceKm, timeMin }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ruta-optima.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // prepare visualization data: highlight route nodes
  const vizData = (() => {
    if (!graph) return undefined
    if (!route) return graph
    const nodes = graph.nodes.map(n => ({ ...n, val: route.includes(n.id) ? (n.val ?? 2) + 6 : n.val }))
    const links = graph.links.map(l => ({ ...l, value: (route && route.some((r,i) => r === String(l.source) && route[i+1] === String(l.target))) ? 3 : (l.value ?? 1) }))
    return { nodes, links }
  })()

  // draw preview on the mini-map when route updates
  useEffect(() => {
    if (!miniMapRef.current || !graph || !route) return

    const findNode = (id: string) => graph.nodes.find(n => String(n.id) === String(id))
    const getCoord = (n: any): [number, number] | null => {
      if (!n) return null
      if (Array.isArray(n.coordinates) && n.coordinates.length >= 2) return [Number(n.coordinates[0]), Number(n.coordinates[1])]
      if (n.geometry && Array.isArray(n.geometry.coordinates)) return [Number(n.geometry.coordinates[0]), Number(n.geometry.coordinates[1])]
      if (n.lng !== undefined && n.lat !== undefined) return [Number(n.lng), Number(n.lat)]
      if (n.lon !== undefined && n.lat !== undefined) return [Number(n.lon), Number(n.lat)]
      if (n.longitude !== undefined && n.latitude !== undefined) return [Number(n.longitude), Number(n.latitude)]
      if (n.x !== undefined && n.y !== undefined) return [Number(n.x), Number(n.y)]
      return null
    }

    const coords: number[][] = []
    for (const id of route) {
      const n = findNode(id)
      const c = getCoord(n)
      if (c) coords.push(c)
    }

    if (coords.length >= 2) {
      try { miniMapRef.current.drawRoute(coords); miniMapRef.current.fitToBounds(coords) } catch (e) { console.warn('mini-map draw failed', e) }
    } else {
      try { miniMapRef.current.clearRoute() } catch {}
    }

    return () => { try { miniMapRef.current?.clearRoute() } catch {} }
  }, [route, graph])

  return (
    <main className="flex-1 relative overflow-hidden">
      {/* Background Map */}
      <div className="absolute inset-0 bg-pathcycle-gray-100 flex items-center justify-center text-pathcycle-gray-300">
        [Mapa de fondo]
      </div>

      {/* Modal Overlay */}
      <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[700px] flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between p-4 bg-pathcycle-primary text-white">
            <h2 className="text-lg font-bold">🚴 Calculadora de Ruta Óptima</h2>
            <button className="p-1 rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-all" onClick={() => { if (onClose) onClose(); else setRoute(null) }}>
              ✕
            </button>
          </header>

          {/* Content */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
            {/* Input Section */}
            <div className="relative grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-pathcycle-gray-400 mb-1">Punto de Origen</label>
                <select value={origin ?? ''} onChange={(e) => setOrigin(e.target.value || null)} className="w-full pl-3 pr-4 py-2 text-sm bg-white border border-pathcycle-gray-200 rounded-lg focus:ring-2 focus:ring-pathcycle-primary/50 focus:border-pathcycle-primary outline-none">
                  <option value="">-- Seleccionar origen --</option>
                  {graph?.nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name ?? n.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-pathcycle-gray-400 mb-1">Punto de Destino</label>
                <select value={destination ?? ''} onChange={(e) => setDestination(e.target.value || null)} className="w-full pl-3 pr-4 py-2 text-sm bg-white border border-pathcycle-gray-200 rounded-lg focus:ring-2 focus:ring-pathcycle-primary/50 focus:border-pathcycle-primary outline-none">
                  <option value="">-- Seleccionar destino --</option>
                  {graph?.nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name ?? n.id}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={swap} className="absolute left-1/2 top-1/2 -translate-x-1/2 mt-2 p-1.5 bg-white border border-pathcycle-gray-200 rounded-full text-pathcycle-primary hover:bg-pathcycle-gray-50 hover:border-pathcycle-primary transition-all">
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Route Options */}
            <div className="border border-pathcycle-gray-100 rounded-lg">
              <h3 className="text-sm font-medium p-3 border-b border-pathcycle-gray-100">Opciones de Ruta</h3>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    Minimizar distancia
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="w-4 h-4 rounded" />
                    Priorizar seguridad (no implementado)
                  </label>
                </div>

                <div className="flex items-center gap-3 justify-end">
                  <button disabled={!origin || !destination || origin === destination || isComputing} onClick={computeRoute} className="px-4 py-2 bg-pathcycle-primary text-white rounded-lg font-medium disabled:opacity-60">
                    Calcular Ruta
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div>
              <div className="flex items-baseline border-b border-pathcycle-gray-200 mb-4">
                <button className="py-2 px-4 border-b-2 border-pathcycle-primary text-sm font-medium text-pathcycle-primary">
                  Ruta Calculada
                </button>
              </div>
              <div className="grid grid-cols-5 gap-4 h-[320px]">
                <div className="col-span-2 border border-pathcycle-gray-100 rounded-lg flex flex-col">
                  <h3 className="text-sm font-bold uppercase p-3 bg-pathcycle-gray-50 rounded-t-lg border-b">
                    Ruta Óptima
                  </h3>
                  <div className="p-3 text-sm space-y-1">
                    <p>
                      Distancia: <span className="float-right font-medium">{distanceKm ? `${distanceKm} km` : '—'}</span>
                    </p>
                    <p>
                      Tiempo: <span className="float-right font-medium">{timeMin ? `${timeMin} min` : '—'}</span>
                    </p>
                    <p>
                      Segmentos: <span className="float-right font-medium">{route ? route.length - 1 : '—'}</span>
                    </p>
                  </div>
                  <div className="p-3 text-sm">
                    <h4 className="text-xs font-medium mb-2">Pasos</h4>
                    <ol className="list-decimal ml-5 text-xs space-y-1 max-h-40 overflow-auto">
                      {route ? route.map((id, i) => (
                        <li key={id}>{graph?.nodes.find(n => n.id === id)?.name ?? id}</li>
                      )) : <li className="text-pathcycle-gray-400">No hay ruta calculada</li>}
                    </ol>
                  </div>
                </div>
                <div className="col-span-3 rounded-lg bg-pathcycle-gray-50 border border-pathcycle-gray-100 flex flex-col overflow-hidden">
                  <div className="p-3 border-b">
                    <h4 className="text-sm font-medium">Previsualización de Ruta</h4>
                    <div className="mt-2 w-full h-40 rounded overflow-hidden">
                      <MapVisualization ref={miniMapRef} initialZoom={13} className="w-full h-full" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <GraphVisualization data={vizData ?? undefined} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="flex justify-between items-center p-4 bg-pathcycle-gray-50 border-t border-pathcycle-gray-100">
            <div className="text-xs text-pathcycle-gray-400">
              <p>Cálculo basado en algoritmo de Dijkstra (distancia)</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                // clear route locally and notify global listeners
                try { window.dispatchEvent(new CustomEvent('pathcycle:clear-route')) } catch (e) { console.warn('clear-route dispatch failed', e) }
                setRoute(null); setDistanceKm(null); setTimeMin(null);
                try { miniMapRef.current?.clearRoute() } catch {}
              }} className="py-2 px-3 text-sm bg-white text-pathcycle-danger border border-pathcycle-danger font-medium rounded-lg hover:bg-pathcycle-danger/5">
                Limpiar ruta
              </button>
              <button onClick={exportRoute} className="py-2 px-3 text-sm bg-white text-pathcycle-primary border border-pathcycle-primary font-medium rounded-lg hover:bg-pathcycle-primary/5">
                <Download className="inline w-4 h-4 mr-1" />
                Exportar
              </button>
              <button onClick={() => {
                if (!route || !graph) return
                const nodes = graph.nodes.filter(n => route.includes(n.id))
                const links = graph.links.filter((l: any) => {
                  for (let i = 0; i < route.length -1; i++) {
                    const a = route[i], b = route[i+1]
                    if ((String(l.source) === a && String(l.target) === b) || (String(l.source) === b && String(l.target) === a)) return true
                  }
                  return false
                })
                const payload = { route, nodes, links, distanceKm, timeMin }
                try {
                  window.dispatchEvent(new CustomEvent('pathcycle:use-route', { detail: payload }))
                } catch (e) {
                  console.warn('No se pudo emitir evento de ruta', e)
                }
                if (onClose) onClose()
              }} className="py-2 px-5 bg-pathcycle-primary text-white font-medium rounded-lg shadow-sm hover:bg-opacity-90">
                <CheckCircle className="inline w-4 h-4 mr-1" />
                Usar Esta Ruta
              </button>
            </div>
          </footer>
        </div>
      </div>
    </main>
  )
}
