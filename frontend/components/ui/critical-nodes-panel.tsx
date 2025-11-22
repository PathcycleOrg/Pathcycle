import { Eye } from "lucide-react"

export interface CriticalNode {
  id: string
  location: string
  centrality: number
}

interface CriticalNodesPanelProps {
  criticalNodes: CriticalNode[]
}

export default function CriticalNodesPanel({ criticalNodes }: CriticalNodesPanelProps) {
  return (
    <aside className="w-[350px] bg-white border-l border-pathcycle-gray-100 p-6 overflow-y-auto space-y-6 flex-shrink-0">
      <div className="space-y-4">
        <h2 className="text-base font-bold text-pathcycle-gray-800">NODOS CRÍTICOS (TOP 10)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-pathcycle-gray-100 text-xs text-pathcycle-gray-400 uppercase">
              <tr>
                <th className="py-2 pr-2">Nodo ID</th>
                <th className="py-2 px-2">Ubicación</th>
                <th className="py-2 pl-2">Centralidad</th>
              </tr>
            </thead>
            <tbody>
              {criticalNodes.map((node) => (
                <tr key={node.id} className="border-b border-pathcycle-gray-100">
                  <td className="py-2.5 pr-2 font-mono text-xs">{node.id}</td>
                  <td className="py-2.5 px-2 text-xs">{node.location}</td>
                  <td className="py-2.5 pl-2 flex items-center justify-between">
                    <span className="font-medium">{node.centrality}</span>
                    <button className="p-1 text-pathcycle-primary hover:bg-pathcycle-primary/10 rounded-full">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </aside>
  )
}
