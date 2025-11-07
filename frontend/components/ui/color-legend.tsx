"use client"

import { NODE_COLORS, NODE_GROUPS } from "@/lib/types"

export default function ColorLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-pathcycle-gray-100 p-3">
      <h3 className="text-xs font-bold mb-2">Tipos de Nodos</h3>
      <div className="space-y-1.5">
        {Object.entries(NODE_COLORS).map(([group, color]) => {
          if (group === 'default') return null
          return (
            <div key={group} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-pathcycle-gray-600">
                {NODE_GROUPS[group as keyof typeof NODE_GROUPS]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}