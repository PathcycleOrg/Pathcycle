"use client"

import { Plus, Minus, RotateCcw, ImageIcon, Maximize2 } from "lucide-react"
import { useState } from "react"
import FilterPanel from "@/components/ui/filter-panel"
import GraphVisualization from "@/components/ui/graph-visualization"
import CriticalNodesPanel from "@/components/ui/critical-nodes-panel"

export default function NetworkAnalysis() {
  const [selectedComponent, setSelectedComponent] = useState<number | null>(null)

  const criticalNodes = [
    { id: "N-0721", location: "Av. Arequipa c/ Angamos", centrality: 0.82 },
    { id: "N-1034", location: "Óvalo de Miraflores", centrality: 0.79 },
    { id: "N-0045", location: "Puente Benavides (Pan.)", centrality: 0.75 },
    { id: "N-0881", location: "Av. Universitaria c/ La Mar", centrality: 0.71 },
  ]

  return (
    <main className="flex-1 flex overflow-hidden">
      {/* Left Panel: Filters */}
      <FilterPanel />

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

        <GraphVisualization />
      </section>

      {/* Right Panel: Critical Nodes */}
      <CriticalNodesPanel criticalNodes={criticalNodes} />
    </main>
  )
}
