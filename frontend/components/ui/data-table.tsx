interface DataTableProps {
  data: any[]
  columns: string[]
}

export default function DataTable({ data, columns }: DataTableProps) {
  const columnLabels: Record<string, string> = {
    name: "Componente",
    nodes: "Nodos",
    km: "Km",
    districts: "Distritos",
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-pathcycle-gray-100 text-xs text-pathcycle-gray-400 uppercase">
          <tr>
            {columns.map((col) => (
              <th key={col} className="py-3 pr-3 last:pl-3">
                {columnLabels[col] || col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-pathcycle-gray-100">
              {columns.map((col) => (
                <td key={col} className="py-3 pr-3 last:pl-3 font-medium">
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
