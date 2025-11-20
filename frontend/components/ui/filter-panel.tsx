"use client"

import React from "react"

interface Filters {
  districts: string[]
  typeVia: string
  minLength: number
  sampleSize?: number
  sampleStrategy?: string
  showComponents: boolean
  highlightCritical: boolean
}

interface FilterPanelProps {
  districts?: string[]
  onApply?: (filters: Filters) => void
}

export default function FilterPanel({ districts = [], onApply }: FilterPanelProps) {
  const [selectedDistricts, setSelectedDistricts] = React.useState<string[]>([])
  const [typeVia, setTypeVia] = React.useState<string>("Ambas")
  const [minLength, setMinLength] = React.useState<number>(0)
  const [showComponents, setShowComponents] = React.useState<boolean>(true)
  const [highlightCritical, setHighlightCritical] = React.useState<boolean>(false)
  const [sampleSize, setSampleSize] = React.useState<number>(60)
  const [sampleStrategy, setSampleStrategy] = React.useState<string>("high-degree")

  const apply = () => {
    onApply?.({
      districts: selectedDistricts,
      typeVia,
      minLength,
      showComponents,
      highlightCritical,
      sampleSize,
      sampleStrategy,
    })
  }

  const toggleDistrict = (d: string) => {
    setSelectedDistricts((prev) => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]))
  }

  return (
    <aside className="w-[300px] bg-white border-r border-pathcycle-gray-100 p-6 overflow-y-auto space-y-6 flex-shrink-0">
      <div className="space-y-4">
        <h2 className="text-base font-bold text-pathcycle-gray-800">FILTROS Y OPCIONES</h2>
        <div>
          <label className="block text-sm font-medium text-pathcycle-gray-800 mb-1">Seleccionar Distrito</label>
          <div className="grid grid-cols-1 gap-2">
            {districts.length > 0 ? districts.map(d => (
              <label key={d} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selectedDistricts.includes(d)} onChange={() => toggleDistrict(d)} className="w-4 h-4" />
                <span>{d}</span>
              </label>
            )) : (
              <div className="text-sm text-pathcycle-gray-500">No hay distritos cargados</div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-pathcycle-gray-800 mb-1">Tipo de Vía</label>
          <select value={typeVia} onChange={(e) => setTypeVia(e.target.value)} className="w-full py-2 px-3 text-sm bg-pathcycle-gray-50 border border-pathcycle-gray-200 rounded-lg">
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
              value={minLength}
              onChange={(e) => setMinLength(Number(e.target.value))}
              className="w-full h-2 bg-pathcycle-gray-100 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium text-pathcycle-gray-800 w-8 text-right">{minLength}</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-pathcycle-gray-800">Mostrar componentes conexas</span>
            <input type="checkbox" checked={showComponents} onChange={(e) => setShowComponents(e.target.checked)} className="w-4 h-4 rounded" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-pathcycle-gray-800">Resaltar nodos críticos</span>
            <input type="checkbox" checked={highlightCritical} onChange={(e) => setHighlightCritical(e.target.checked)} className="w-4 h-4 rounded" />
          </label>
          {highlightCritical && (
            <div className="space-y-2 pt-2">
              <label className="block text-sm font-medium text-pathcycle-gray-800">Estrategia de muestreo</label>
              <select value={sampleStrategy} onChange={(e) => setSampleStrategy(e.target.value)} className="w-full py-2 px-3 text-sm bg-pathcycle-gray-50 border border-pathcycle-gray-200 rounded-lg">
                <option value="auto">Auto (muestra si mayor al umbral)</option>
                <option value="random">Aleatorio</option>
                <option value="high-degree">Nodos de mayor grado</option>
                <option value="full">Completo (sin muestreo)</option>
              </select>

              <label className="block text-sm font-medium text-pathcycle-gray-800">Tamaño de muestra (fuentes)</label>
              <input
                type="range"
                min={10}
                max={200}
                value={sampleSize}
                onChange={(e) => setSampleSize(Number(e.target.value))}
                className="w-full h-2 bg-pathcycle-gray-100 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-end text-xs text-pathcycle-gray-600">{sampleSize} fuentes</div>
            </div>
          )}
        </div>
        <button onClick={apply} className="w-full py-2 px-4 bg-pathcycle-primary text-white font-medium rounded-lg shadow-sm hover:bg-opacity-90">
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
