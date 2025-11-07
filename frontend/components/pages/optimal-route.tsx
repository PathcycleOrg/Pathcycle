"use client"

import { ArrowLeftRight, Download, CheckCircle } from "lucide-react"

export default function OptimalRoute() {
  return (
    <main className="flex-1 relative overflow-hidden">
      {/* Background Map */}
      <div className="absolute inset-0 bg-pathcycle-gray-100 flex items-center justify-center text-pathcycle-gray-300">
        [Placeholder del Mapa de Lima]
      </div>

      {/* Modal Overlay */}
      <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[600px] flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between p-4 bg-pathcycle-primary text-white">
            <h2 className="text-lg font-bold">🚴 Calculadora de Ruta Óptima</h2>
            <button className="p-1 rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-all">
              ✕
            </button>
          </header>

          {/* Content */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
            {/* Input Section */}
            <div className="relative grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-pathcycle-gray-400 mb-1">Punto de Origen</label>
                <input
                  type="text"
                  placeholder="Buscar distrito, avenida..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-pathcycle-gray-200 rounded-lg focus:ring-2 focus:ring-pathcycle-primary/50 focus:border-pathcycle-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-pathcycle-gray-400 mb-1">Punto de Destino</label>
                <input
                  type="text"
                  placeholder="Buscar distrito, avenida..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-pathcycle-gray-200 rounded-lg focus:ring-2 focus:ring-pathcycle-primary/50 focus:border-pathcycle-primary outline-none"
                />
              </div>
              <button className="absolute left-1/2 top-1/2 -translate-x-1/2 mt-2 p-1.5 bg-white border border-pathcycle-gray-200 rounded-full text-pathcycle-primary hover:bg-pathcycle-gray-50 hover:border-pathcycle-primary transition-all">
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
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    Priorizar seguridad
                  </label>
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
              <div className="grid grid-cols-5 gap-4 h-[250px]">
                <div className="col-span-2 border border-pathcycle-gray-100 rounded-lg flex flex-col">
                  <h3 className="text-sm font-bold uppercase p-3 bg-pathcycle-gray-50 rounded-t-lg border-b">
                    Ruta Óptima
                  </h3>
                  <div className="p-3 text-sm space-y-1">
                    <p>
                      Distancia: <span className="float-right font-medium">8.4 km</span>
                    </p>
                    <p>
                      Tiempo: <span className="float-right font-medium">34 min</span>
                    </p>
                    <p>
                      Segmentos: <span className="float-right font-medium">12</span>
                    </p>
                  </div>
                </div>
                <div className="col-span-3 rounded-lg bg-pathcycle-gray-50 border border-pathcycle-gray-100 flex items-center justify-center text-pathcycle-gray-400">
                  [Mini-Mapa con Ruta]
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="flex justify-between items-center p-4 bg-pathcycle-gray-50 border-t border-pathcycle-gray-100">
            <div className="text-xs text-pathcycle-gray-400">
              <p>Cálculo basado en algoritmo de Dijkstra</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="py-2 px-3 text-sm bg-white text-pathcycle-primary border border-pathcycle-primary font-medium rounded-lg hover:bg-pathcycle-primary/5">
                <Download className="inline w-4 h-4 mr-1" />
                Exportar
              </button>
              <button className="py-2 px-5 bg-pathcycle-primary text-white font-medium rounded-lg shadow-sm hover:bg-opacity-90">
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
