"use client"

import { NodeType } from "@/lib/types"

import { NODE_GROUPS } from "@/lib/types"

interface NodeDetailsPanelProps {
  node: NodeType | null
  onClose: () => void
}

export default function NodeDetailsPanel({ node, onClose }: NodeDetailsPanelProps) {
  if (!node) return null

  const groupName = node.group ? NODE_GROUPS[node.group.toString() as keyof typeof NODE_GROUPS] : 'Sin grupo'

  return (
    <div className="absolute bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-pathcycle-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-pathcycle-gray-100 bg-pathcycle-gray-50">
        <h3 className="font-bold text-sm">Detalles del Nodo</h3>
        <button
          onClick={onClose}
          className="text-pathcycle-gray-400 hover:text-pathcycle-gray-600"
        >
          ✕
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs text-pathcycle-gray-500">ID</label>
          <p className="font-mono text-sm">{node.id}</p>
        </div>
        {node.name && (
          <div>
            <label className="text-xs text-pathcycle-gray-500">Nombre</label>
            <p className="text-sm">{node.name}</p>
          </div>
        )}
        <div>
          <label className="text-xs text-pathcycle-gray-500">Tipo</label>
          <p className="text-sm">{groupName}</p>
        </div>
        {node.val && (
          <div>
            <label className="text-xs text-pathcycle-gray-500">Prioridad</label>
            <p className="text-sm">{node.val} de 4</p>
          </div>
        )}
      </div>
    </div>
  )
}