"use client";

import { useEffect, useState } from "react";
import { Calculator, Link2, Printer } from "lucide-react";

import MetricCard from "@/components/ui/metric-card";
import MapContainer from "@/components/ui/map-container";
import DataTable from "@/components/ui/data-table";
import "mapbox-gl/dist/mapbox-gl.css";


import { Ciclovia, ReporteAccidente, Trafico } from "@/lib/types";
import { fetchCiclovias, fetchAccidentes, fetchTrafico } from "@/lib/api";

export default function Dashboard() {
  const [ciclovias, setCiclovias] = useState<Ciclovia[]>([]);
  const [accidentes, setAccidentes] = useState<ReporteAccidente[]>([]);
  const [trafico, setTrafico] = useState<Trafico[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabla manual original
  const components = [
    { name: "Red Principal Costa Verde", nodes: 128, km: 45.2, districts: "Miraflores, Barranco, Chorrillos" },
    { name: "Eje Arequipa", nodes: 76, km: 12.8, districts: "Cercado, Lince, San Isidro" },
    { name: "Interdistrital Norte", nodes: 54, km: 9.1, districts: "Los Olivos, Independencia" },
    { name: "Componente San Juan L.", nodes: 32, km: 6.5, districts: "San Juan de Lurigancho" },
    { name: "Componente Ate", nodes: 21, km: 4.3, districts: "Ate" },
  ];

  // ======================
  //   Cargar API
  // ======================
  useEffect(() => {
    async function loadData() {
      try {
        console.log("Consultando backend...");
  
        const [cicloData, accData, trafData] = await Promise.all([
          fetchCiclovias(),
          fetchAccidentes(),
          fetchTrafico(),
        ]);
  
        console.log(" Ciclovías desde backend:", cicloData);
        console.log(" Accidentes desde backend:", accData);
        console.log(" Tráfico desde backend:", trafData);
  
        setCiclovias(cicloData);
        setAccidentes(accData);
        setTrafico(trafData);
  
      } catch (error) {
        console.error(" Error consultando API:", error);
      } finally {
        setLoading(false);
      }
    }
  
    loadData();
  }, []);
  

  // ======================
  //     LOADING
  // ======================
  if (loading) {
    return <p className="p-6">Cargando datos del backend...</p>;
  }

  // ======================
  //   CALCULAR KM
  // ======================
  const totalKm = ciclovias
    .map((c) => {
      let v = c.LONGITUD_KM;
      if (v === null || v === undefined) return 0;

      const clean = String(v)
        .replace(",", ".")
        .replace("km", "")
        .trim();

      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    })
    .reduce((a, b) => a + b, 0)
    .toFixed(2);

  return (
    <main className="flex-1 overflow-y-auto p-8 space-y-6">

      {/* METRICS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Kilómetros Totales" value={`${totalKm} km`} highlight="primary" />
        <MetricCard label="Accidentes Registrados" value={accidentes.length.toString()} highlight="danger" />
        <MetricCard label="Registros de Tráfico" value={trafico.length.toString()} highlight="secondary" />
        <MetricCard label="Ciclovías Registradas" value={ciclovias.length.toString()} highlight="primary" />
      </section>

      {/* MAPA */}
      <section className="bg-white rounded-lg shadow-sm border border-pathcycle-gray-100 h-96">
        <MapContainer ciclovias={ciclovias} />
      </section>

      {/* TABLAS + ACCIONES */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Tabla izquierda */}
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border border-pathcycle-gray-100">
          <h2 className="text-lg font-bold text-pathcycle-gray-800 mb-4">Componentes Más Grandes</h2>
          <DataTable data={components} columns={["name", "nodes", "km", "districts"]} />
        </div>

        {/* Acciones rápidas */}
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
  );
}
