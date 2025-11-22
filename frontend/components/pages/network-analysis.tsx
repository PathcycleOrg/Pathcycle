"use client";

import { Plus, Minus, RotateCcw, ImageIcon, Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";
import FilterPanel from "@/components/ui/filter-panel";
import GraphVisualization from "@/components/ui/graph-visualization";
import { fetchNodosCriticos } from "@/lib/api";
import CriticalNodesPanel from "@/components/ui/critical-nodes-panel";
import { CriticalNode } from "@/components/ui/critical-nodes-panel";

export default function NetworkAnalysis() {
  const [criticalNodes, setCriticalNodes] = useState<CriticalNode[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({
    nodes: [],
    links: [],
  });

  const [selectedComponent, setSelectedComponent] = useState<number | null>(null);

  // ================================
  // CARGAR NODOS CRÍTICOS
  // ================================
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchNodosCriticos();

        // Formato del backend: ["distrito_SAN ISIDRO", 0.076]
        const parsed: CriticalNode[] = response.top_grado.map(
          (item: { nodo: string; valor: number }) => ({
            id: item.nodo,
            location: item.nodo
              .replace("distrito_", "")
              .replace(/_/g, " ")
              .toUpperCase(),
            centrality: item.valor,
          })
        );
        
        setCriticalNodes(parsed);
      } catch (error) {
        console.error("Error cargando nodos críticos", error);
      }
    }

    loadData();
  }, []);

  return (
    <main className="flex-1 flex overflow-hidden">
      
      {/* PANEL DE FILTROS (ENVÍA LOS FILTROS AL GRAFO) */}
      <FilterPanel onApplyFilters={(data) => setGraphData(data)} />

      <section className="flex-1 bg-pathcycle-gray-100 relative overflow-hidden">

        {/* CONTROLES DEL GRÁFICO */}
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

        {/* GRAFO ACTUALIZADO CON LOS FILTERS */}
        <GraphVisualization data={graphData.nodes.length > 0 ? graphData : undefined} />

      </section>

      {/* PANEL DERECHA: NODOS CRÍTICOS */}
      <CriticalNodesPanel criticalNodes={criticalNodes} />
    </main>
  );
}
