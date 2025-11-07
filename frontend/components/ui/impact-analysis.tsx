export default function ImpactAnalysis() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-pathcycle-gray-100">
      <div className="flex justify-between items-center border-b border-pathcycle-gray-100">
        <h2 className="text-base font-bold text-pathcycle-gray-800 p-4 uppercase">Análisis de Impacto</h2>
        <div className="flex items-baseline border-b border-pathcycle-gray-100">
          <button className="py-4 px-3 border-b-2 border-pathcycle-primary text-sm font-medium text-pathcycle-primary">
            Conectividad
          </button>
          <button className="py-4 px-3 border-b-2 border-transparent text-sm font-medium text-pathcycle-gray-400 hover:text-pathcycle-gray-800">
            Población beneficiada
          </button>
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm text-pathcycle-gray-400 mb-4">
          Comparación de conectividad antes y después de la simulación.
        </p>
        <div className="h-64 bg-pathcycle-gray-50 rounded-lg flex items-center justify-center text-pathcycle-gray-400">
          [Gráfico de Comparación]
        </div>
      </div>
    </div>
  )
}
