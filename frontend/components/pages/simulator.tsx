"use client"

import { Trash2, Save, BarChart3, CheckCircle } from "lucide-react"
import SimulationCard from "@/components/ui/simulation-card"
import ImpactAnalysis from "@/components/ui/impact-analysis"

export default function Simulator() {
  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-pathcycle-gray-800">Simulador de Expansión de Red Ciclista</h1>
        <p className="text-pathcycle-gray-400">Compare escenarios de inversión y evalúe su impacto algorítmico</p>
      </div>

      {/* Comparison Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimulationCard
          title="Red Existente - Octubre 2025"
          metrics={{
            components: 47,
            connectivity: "78%",
            population: "2.1M",
            investment: "S/156M",
          }}
          status="Fragmentado"
        />
        <SimulationCard
          title="Propuesta de Expansión"
          metrics={{
            components: 12,
            connectivity: "95%",
            population: "3.8M",
            investment: "S/179M",
          }}
          status="Conectado"
          isPrimary
        />
      </div>

      {/* Impact Analysis */}
      <ImpactAnalysis />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button className="py-2 px-4 bg-white text-pathcycle-danger border border-pathcycle-danger font-medium rounded-lg hover:bg-pathcycle-danger/5 transition-all flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Descartar
        </button>
        <button className="py-2 px-4 bg-white text-pathcycle-primary border border-pathcycle-primary font-medium rounded-lg hover:bg-pathcycle-primary/5 transition-all flex items-center gap-2">
          <Save className="w-4 h-4" />
          Guardar Escenario
        </button>
        <button className="py-2 px-4 bg-white text-pathcycle-primary border border-pathcycle-primary font-medium rounded-lg hover:bg-pathcycle-primary/5 transition-all flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Comparar con otros
        </button>
        <button className="py-2 px-5 bg-pathcycle-primary text-white font-medium rounded-lg shadow-sm hover:bg-opacity-90 transition-all flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Aprobar para Reporte
        </button>
      </div>
    </main>
  )
}
