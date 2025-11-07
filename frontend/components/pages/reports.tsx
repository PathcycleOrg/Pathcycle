"use client"

import { Download, Eye, Trash2 } from "lucide-react"
import ReportConfiguration from "@/components/ui/report-configuration"

export default function Reports() {
  const recentReports = [
    { name: "Análisis Q4 2025", date: "20/10/2025", type: "PDF Técnico", size: "8.4 MB" },
    { name: "Escenario A vs B", date: "18/10/2025", type: "PDF Ejecutivo", size: "2.1 MB" },
    { name: "Datos Crudos - San Isidro", date: "17/10/2025", type: "Excel", size: "12.2 MB" },
  ]

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-pathcycle-gray-800">Generación de Reportes Técnicos</h1>
        <p className="text-pathcycle-gray-400">Configure y genere informes detallados sobre la red de ciclovías.</p>
      </div>

      {/* Configuration Section */}
      <ReportConfiguration />

      {/* Recent Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border border-pathcycle-gray-100">
        <div className="p-4 border-b border-pathcycle-gray-100">
          <h2 className="text-base font-bold text-pathcycle-gray-800 uppercase">Reportes Generados Recientemente</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-pathcycle-gray-100 text-xs text-pathcycle-gray-400 uppercase">
              <tr>
                <th className="py-3 px-5">Nombre</th>
                <th className="py-3 px-5">Fecha</th>
                <th className="py-3 px-5">Tipo</th>
                <th className="py-3 px-5">Tamaño</th>
                <th className="py-3 px-5">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pathcycle-gray-100">
              {recentReports.map((report, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-5 font-medium">{report.name}</td>
                  <td className="py-3 px-5 text-pathcycle-gray-400">{report.date}</td>
                  <td className="py-3 px-5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {report.type}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-pathcycle-gray-400">{report.size}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-pathcycle-primary hover:bg-pathcycle-primary/10 rounded-full">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-pathcycle-gray-400 hover:bg-pathcycle-gray-100 rounded-full">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-pathcycle-danger hover:bg-pathcycle-danger/10 rounded-full">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
