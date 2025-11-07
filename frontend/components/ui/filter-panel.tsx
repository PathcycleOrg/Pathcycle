"use client"

import { ChevronDown } from "lucide-react"

export default function FilterPanel() {
  return (
    <aside className="w-[300px] bg-white border-r border-pathcycle-gray-100 p-6 overflow-y-auto space-y-6 flex-shrink-0">
      <div className="space-y-4">
        <h2 className="text-base font-bold text-pathcycle-gray-800">FILTROS Y OPCIONES</h2>

        <div>
          <label className="block text-sm font-medium text-pathcycle-gray-800 mb-1">Seleccionar Distrito</label>
          <button className="w-full flex justify-between items-center text-left py-2 px-3 text-sm bg-pathcycle-gray-50 border border-pathcycle-gray-200 rounded-lg">
            <span>Miraflores, San Isidro...</span>
            <ChevronDown className="w-4 h-4 text-pathcycle-gray-400" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-pathcycle-gray-800 mb-1">Tipo de Vía</label>
          <select className="w-full py-2 px-3 text-sm bg-pathcycle-gray-50 border border-pathcycle-gray-200 rounded-lg">
            <option>Ambas</option>
            <option>Metropolitana</option>
            <option>Local</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-pathcycle-gray-800 mb-1">Longitud mínima (km)</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="15"
              defaultValue="0"
              className="w-full h-2 bg-pathcycle-gray-100 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium text-pathcycle-gray-800 w-8 text-right">0</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-pathcycle-gray-800">Mostrar componentes conexas</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-pathcycle-gray-800">Resaltar nodos críticos</span>
            <input type="checkbox" className="w-4 h-4 rounded" />
          </label>
        </div>

        <button className="w-full py-2 px-4 bg-pathcycle-primary text-white font-medium rounded-lg shadow-sm hover:bg-opacity-90">
          Aplicar Filtros
        </button>
      </div>

      <hr className="border-pathcycle-gray-100" />

      <div className="space-y-3">
        <h2 className="text-base font-bold text-pathcycle-gray-800">MÉTRICAS ALGORÍTMICAS</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-pathcycle-gray-50 p-3 rounded-lg border border-pathcycle-gray-100 text-center">
            <p className="text-xs text-pathcycle-gray-400">Nodos totales</p>
            <p className="text-lg font-bold">2,237</p>
          </div>
          <div className="bg-pathcycle-gray-50 p-3 rounded-lg border border-pathcycle-gray-100 text-center">
            <p className="text-xs text-pathcycle-gray-400">Aristas totales</p>
            <p className="text-lg font-bold">1,902</p>
          </div>
          <div className="bg-pathcycle-gray-50 p-3 rounded-lg border border-pathcycle-gray-100 text-center">
            <p className="text-xs text-pathcycle-gray-400">Componentes</p>
            <p className="text-lg font-bold text-pathcycle-danger">47</p>
          </div>
          <div className="bg-pathcycle-gray-50 p-3 rounded-lg border border-pathcycle-gray-100 text-center">
            <p className="text-xs text-pathcycle-gray-400">Comp. Principal</p>
            <p className="text-lg font-bold">78%</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
