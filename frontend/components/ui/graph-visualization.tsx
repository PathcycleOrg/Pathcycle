"use client"

import React, { useEffect, useRef, useState } from "react"
import { NodeType, LinkType, NODE_COLORS } from "@/lib/types"
import ColorLegend from "./color-legend"
import NodeDetailsPanel from "./node-details-panel"
import { fetchRed } from "@/lib/api"

interface GraphVisualizationProps {
  data?: { nodes: NodeType[]; links: LinkType[] }
  onNodeSelect?: (node: NodeType) => void
}

export default function GraphVisualization({ data, onNodeSelect }: GraphVisualizationProps) {
  const fgRef = useRef<any>(null)
  const [ForceGraphComp, setForceGraphComp] = useState<any | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const [internalData, setInternalData] = useState<{ nodes: NodeType[]; links: LinkType[] }>({
    nodes: [],
    links: []
  })

  const graphData = data ?? internalData

  // ============================
  // Cargar red completa
  // ============================
  useEffect(() => {
    if (data) return
    async function load() {
      try {
        const r = await fetchRed()
        setInternalData(r)
      } catch (err) {
        console.error("Error cargando /red:", err)
      }
    }
    load()
  }, [data])

  // Cargar react-force-graph
  useEffect(() => {
    let mounted = true
    import("react-force-graph-2d")
      .then((mod) => mounted && setForceGraphComp(() => mod.default))
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  const fitToGraph = () => fgRef.current?.zoomToFit?.(400, 40)
  const zoomIn = () => fgRef.current?.zoom?.(1.25, 200)
  const zoomOut = () => fgRef.current?.zoom?.(0.8, 200)

  // SVG fallback
  const FallbackSVG = () => {
    const w = 800
    const h = 600
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(w, h) / 3
    const n = graphData.nodes.length

    const coords: Record<string, { x: number; y: number }> = {}
    graphData.nodes.forEach((node, i) => {
      const angle = (i / n) * 2 * Math.PI
      coords[node.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
    })

    return (
      <svg width={w} height={h} className="rounded">
        <g>
          {graphData.links.map((link, i) => {
            const a = coords[String(link.source)]
            const b = coords[String(link.target)]
            return (
              <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cbd5e1" strokeWidth={1} />
            )
          })}

          {graphData.nodes.map((node) => {
            const p = coords[node.id]
            return (
              <g key={node.id}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={6}
                  fill={node.id === selected ? "#ff8c00" : "#4f46e5"}
                  stroke="#fff"
                  onClick={() => {
                    setSelected(node.id)
                    onNodeSelect?.(node)
                  }}
                />
                <text x={p.x} y={p.y + 10} fontSize={11} textAnchor="middle" fill="#111827">
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

      {/* ZOOM BUTTONS */}
      <div className="absolute top-3 left-3 z-20 flex gap-2">
        <button className="px-2 py-1 bg-white rounded shadow text-sm" onClick={fitToGraph}>Fit</button>
        <button className="px-2 py-1 bg-white rounded shadow text-sm" onClick={zoomIn}>+</button>
        <button className="px-2 py-1 bg-white rounded shadow text-sm" onClick={zoomOut}>-</button>
      </div>

      <div className="flex items-center justify-center">

        {ForceGraphComp ? (
          <ForceGraphComp
            ref={fgRef}
            graphData={graphData as any}

            // ======================================================
            // 🔥🔥 FÍSICAS OPTIMIZADAS (arreglan tu problema)
            // ======================================================
            d3Force="charge"
            d3Charge={-950}              // separa más los nodos
            d3ChargeDistance={500}       // evita clustering en círculo
            linkStrength={0.45}
            d3VelocityDecay={0.28}
            cooldownTime={2600}

            // 🔥 linkDistance FIX (source puede ser string o nodo)
            linkDistance={(link: any) => {
              const src = typeof link.source === "object" ? link.source : graphData.nodes.find(n => n.id === link.source)

              if (!src) return 140
              if (src.group === 99) return 220  // distritos → separados
              return 140
            }}

            // ======================================================
            // INTERACCIÓN
            // ======================================================
            nodeLabel={(n: any) => `${n.name ?? n.id}`}
            onNodeClick={(node: any) => {
              setSelected(node.id)
              fgRef.current?.centerAt(node.x ?? 0, node.y ?? 0, 400)
              fgRef.current?.zoom(2, 400)
              onNodeSelect?.(node)
            }}
            onBackgroundClick={() => setSelected(null)}

            // ======================================================
            // RENDER CUSTOM
            // ======================================================
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.name ?? node.id;

              const baseSize =
                node.group === 99 ? 12 :
                node.group === 1 ? 7 :
                node.group === 2 ? 6 :
                node.group === 3 ? 6 :
                5;

              const size = node.id === selected ? baseSize * 1.8 : baseSize;

              const color =
                node.id === selected
                  ? "#ff8c00"
                  : NODE_COLORS[node.group?.toString() ?? "default"];

              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);

              ctx.shadowColor = "rgba(0,0,0,0.2)";
              ctx.shadowBlur = 8 * globalScale;

              ctx.fillStyle = color;
              ctx.fill();

              ctx.shadowBlur = 0;

              ctx.lineWidth = 1;
              ctx.strokeStyle = "white";
              ctx.stroke();

              // Label
              const fontSize = 8 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = "#111827";
              ctx.fillText(label, node.x, node.y + size + 2);
            }}

            width={1400}
            height={800}
          />
        ) : (
          <FallbackSVG />
        )}

        <ColorLegend />

        <NodeDetailsPanel
          node={selected ? graphData.nodes.find((n) => n.id === selected) || null : null}
          onClose={() => setSelected(null)}
        />
      </div>
    </div>
  )
}
