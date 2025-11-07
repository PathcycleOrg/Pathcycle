"use client"

import { FileText, Settings2 } from "lucide-react"

export default function ReportConfiguration() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: Configuration */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-pathcycle-gray-100">
        <div className="p-6 border-b border-pathcycle-gray-100">
          <h2 className="text-base font-bold text-pathcycle-gray-800 uppercase">Configuración del Reporte</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Type */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-pathcycle-gray-800">1. Tipo de Reporte</h3>
            <div className="space-y-2">
              {[
                "Análisis completo de red actual",
                "Evaluación de escenario propuesto",
                "Comparación de múltiples escenarios",
                "Informe de priorización de inversiones",
              ].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 p-3 rounded-lg border border-pathcycle-gray-100 hover:bg-pathcycle-gray-50 transition-all"
                >
                  <input type="radio" name="report_type" className="w-4 h-4" />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Content to Include */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-pathcycle-gray-800">2. Contenido a Incluir</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Resumen ejecutivo", checked: true },
                { label: "Métricas algorítmicas", checked: true },
                { label: "Visualizaciones de mapas", checked: true },
                { label: "Gráficos de conectividad", checked: true },
              ].map((item) => (
                <label key={item.label} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" defaultChecked={item.checked} className="w-4 h-4 rounded" />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <button className="text-sm font-medium text-pathcycle-primary hover:underline flex items-center gap-1">
            <Settings2 className="w-4 h-4" />
            Opciones Avanzadas
          </button>
        </div>

        <div className="p-6 border-t border-pathcycle-gray-100 bg-pathcycle-gray-50 rounded-b-lg">
          <button className="w-full py-3 px-5 bg-pathcycle-primary text-white text-base font-bold rounded-lg shadow-sm hover:bg-opacity-90 transition-all flex items-center justify-center gap-2">
            <FileText className="w-5 h-5" />
            GENERAR REPORTE
          </button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="lg:col-span-3 bg-pathcycle-gray-100 rounded-lg p-6 border border-pathcycle-gray-200">
        <h2 className="text-base font-bold text-pathcycle-gray-800 uppercase mb-4">Vista Previa</h2>
        <div className="bg-white shadow-xl h-[500px] rounded-lg border border-pathcycle-gray-200 flex items-center justify-center text-pathcycle-gray-400">
          [Vista Previa del Reporte PDF]
        </div>
      </div>
    </div>
  )
}
