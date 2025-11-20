"use client"

import { Calculator, Link2, Printer } from "lucide-react"
import MetricCard from "@/components/ui/metric-card"
import MapContainer from "@/components/ui/map-container"
import DataTable from "@/components/ui/data-table"

export default function Dashboard() {
  const components = [
    { name: "Red Principal Costa Verde", nodes: 128, km: 45.2, districts: "Miraflores, Barranco, Chorrillos" },
    { name: "Eje Arequipa", nodes: 76, km: 12.8, districts: "Cercado, Lince, San Isidro" },
    { name: "Interdistrital Norte", nodes: 54, km: 9.1, districts: "Los Olivos, Independencia" },
    { name: "Componente San Juan L.", nodes: 32, km: 6.5, districts: "San Juan de Lurigancho" },
    { name: "Componente Ate", nodes: 21, km: 4.3, districts: "Ate" },
  ]

  return (
    <main className="flex-1 overflow-y-auto p-8 space-y-6">
      {/* Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Kilómetros Totales" value="323.43 km" highlight="primary" />
        <MetricCard label="Componentes Conexas" value="47" highlight="danger" />
        <MetricCard label="Conectividad" value="78%" highlight="secondary" />
        <MetricCard label="Distritos Cubiertos" value="34/43" highlight="primary" />
      </section>

      {/* Map Section */}
      <section className="bg-white rounded-lg shadow-sm border border-pathcycle-gray-100 min-h-96">
        <MapContainer />
      </section>

      {/* Bottom Section */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border border-pathcycle-gray-100">
          <h2 className="text-lg font-bold text-pathcycle-gray-800 mb-4">Componentes Más Grandes</h2>
          <DataTable data={components} columns={["name", "nodes", "km", "districts"]} />
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-pathcycle-gray-100">
          <h2 className="text-lg font-bold text-pathcycle-gray-800 mb-4">Acciones Rápidas</h2>
          <div className="flex flex-col gap-4">
            <button className="w-full flex items-center gap-3 py-3 px-4 bg-pathcycle-primary text-white font-medium rounded-lg shadow-sm hover:bg-opacity-90 transition-all">
              <Calculator className="w-5 h-5" />
              <span>Calcular Ruta Óptima</span>
            </button>
            <button className="w-full flex items-center gap-3 py-3 px-4 bg-pathcycle-secondary text-white font-medium rounded-lg shadow-sm hover:bg-opacity-90 transition-all">
              <Link2 className="w-5 h-5" />
              <span>Proponer Conexiones</span>
            </button>
            <button className="w-full flex items-center gap-3 py-3 px-4 bg-pathcycle-accent text-white font-medium rounded-lg shadow-sm hover:bg-opacity-90 transition-all">
              <Printer className="w-5 h-5" />
              <span>Generar Reporte</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
