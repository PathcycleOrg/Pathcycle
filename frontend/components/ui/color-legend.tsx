"use client"

import { NODE_COLORS, NODE_GROUPS } from "@/lib/types"

interface ColorLegendProps {
  colorMap?: Record<string, string>
}

export default function ColorLegend({ colorMap }: ColorLegendProps) {
  const map = colorMap ?? NODE_COLORS

  const entries = Object.entries(map).filter(([k]) => k !== 'default')

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-pathcycle-gray-100 p-3">
      <h3 className="text-xs font-bold mb-2">Tipos de Nodos</h3>
      <div className="space-y-1.5 max-h-44 overflow-auto">
        {entries.map(([group, color]) => {
          // Prefer known labels, otherwise fallback to a generic label
          const label = NODE_GROUPS[group as keyof typeof NODE_GROUPS] ?? (group.startsWith('comp-') ? `Componente ${group.replace('comp-', '')}` : `Grupo ${group}`)
          return (
            <div key={group} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-pathcycle-gray-600">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}