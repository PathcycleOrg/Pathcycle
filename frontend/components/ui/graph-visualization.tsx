"use client"

import React, { useEffect, useRef, useState } from "react"
import { NodeType, LinkType, NODE_COLORS } from "@/lib/types"
import ColorLegend from "./color-legend"
import NodeDetailsPanel from "./node-details-panel"

interface GraphVisualizationProps {
  data?: {
    nodes: NodeType[]
    links: LinkType[]
  }
  onNodeSelect?: (node: NodeType) => void
}

async function loadSampleData() {
  const response = await fetch('/sample-network.json')
  return await response.json()
}

const sample = {
  nodes: [],
  links: []
}

export default function GraphVisualization({ data, onNodeSelect }: GraphVisualizationProps) {
  const fgRef = useRef<any>(null)
  const [ForceGraphComp, setForceGraphComp] = useState<any | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [sampleData, setSampleData] = useState(sample)
  const graphData = data ?? sampleData

  useEffect(() => {
    // Load sample data if no data prop provided
    if (!data) {
      loadSampleData().then(setSampleData).catch(console.error)
    }
  }, [data])

  useEffect(() => {
    // Try to dynamically import the heavy visualization lib. If unavailable,
    // we silently fallback to the lightweight SVG renderer below.
    let mounted = true
    import("react-force-graph-2d")
      .then((mod) => {
        if (mounted) setForceGraphComp(() => mod.default)
      })
      .catch(() => {
        // ignore - fallback rendering will be used
      })

    return () => {
      mounted = false
    }
  }, [])

  // center/fit helper
  const fitToGraph = () => fgRef.current?.zoomToFit?.(400, 40)
  const zoomIn = () => fgRef.current?.zoom?.(1.25, 200)
  const zoomOut = () => fgRef.current?.zoom?.(0.8, 200)

  // Simple SVG fallback: place nodes on a circle and draw links.
  const FallbackSVG = () => {
    const w = 800
    const h = 600
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(w, h) / 3
    const n = graphData.nodes.length
    const coords: Record<string, { x: number; y: number }> = {}
    graphData.nodes.forEach((node: any, i: number) => {
      const angle = (i / n) * 2 * Math.PI
      coords[node.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
    })

    return (
      <svg width={w} height={h} className="rounded">
        <g>
          {graphData.links.map((link: any, i: number) => {
            const a = coords[link.source]
            const b = coords[link.target]
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cbd5e1" strokeWidth={1} />
          })}
          {graphData.nodes.map((node: any, i: number) => {
            const p = coords[node.id]
            return (
              <g key={node.id}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={6 + (node.val ?? 0)}
                  fill={node.id === selected ? "#ff8c00" : "#4f46e5"}
                  stroke="#fff"
                  onClick={() => {
                    setSelected(node.id)
                    onNodeSelect?.(node)
                  }}
                />
                <text x={p.x} y={p.y + 10} fontSize={12} textAnchor="middle" fill="#111827">
                  {node.name ?? node.id}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    )
  }

  return (
    <div className="h-full w-full relative bg-pathcycle-gray-50 rounded-lg border border-pathcycle-gray-100 p-2">
      <div className="absolute top-3 left-3 z-20 flex gap-2">
        <button type="button" className="px-2 py-1 bg-white rounded shadow-sm text-sm" onClick={fitToGraph}>
          Fit
        </button>
        <button type="button" className="px-2 py-1 bg-white rounded shadow-sm text-sm" onClick={zoomIn}>
          +
        </button>
        <button type="button" className="px-2 py-1 bg-white rounded shadow-sm text-sm" onClick={zoomOut}>
          -
        </button>
      </div>

      <div className="flex items-center justify-center">
        {ForceGraphComp ? (
          <ForceGraphComp
            ref={fgRef}
            graphData={graphData as any}
            nodeLabel={(n: any) => `${n.name ?? n.id}`}
            nodeRelSize={7}
            linkWidth={(l: any) => (selected && (l.source.id === selected || l.target.id === selected) ? 2.5 : 1)}
            onNodeClick={(node: any) => {
              setSelected(node.id)
              fgRef.current?.centerAt(node.x ?? 0, node.y ?? 0, 400)
              fgRef.current?.zoom(1.6, 400)
              onNodeSelect?.(node)
            }}
            onBackgroundClick={() => setSelected(null)}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.name ?? node.id
              const fontSize = 12 / globalScale
              const size = (node.val ?? 2) * (node.id === selected ? 6 : 4)
              const color = node.id === selected ? "#ff8c00" : NODE_COLORS[node.group?.toString() ?? 'default']

              ctx.beginPath()
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false)
              ctx.fillStyle = color
              ctx.fill()

              ctx.font = `${fontSize}px Sans-Serif`
              ctx.textAlign = "center"
              ctx.textBaseline = "top"
              ctx.fillStyle = "#111827"
              ctx.fillText(label, node.x, node.y + size + 4 / globalScale)
            }}
            width={800}
            height={600}
          />
        ) : (
          <FallbackSVG />
        )}

        <ColorLegend />
        <NodeDetailsPanel
          node={selected ? graphData.nodes.find(n => n.id === selected) || null : null}
          onClose={() => setSelected(null)}
        />
      </div>
    </div>
  )
}
