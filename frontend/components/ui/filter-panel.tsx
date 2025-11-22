"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { fetchRedFiltrada, fetchMetricasRed } from "@/lib/api";

export default function FilterPanel({ onApplyFilters }: { onApplyFilters: (data: any) => void }) {
  const [distrito, setDistrito] = useState<string | null>(null);
  const [tipoVia, setTipoVia] = useState<string>("Ambas");
  const [minKm, setMinKm] = useState<number>(0);

  const [metricas, setMetricas] = useState<any>({
    nodos: 0,
    aristas: 0,
    componentes: 0,
    componente_principal: "0%",
  });

  // ==========================
  // CARGAR MÉTRICAS DESDE API
  // ==========================
  useEffect(() => {
    async function cargarMetricas() {
      try {
        const data = await fetchMetricasRed();
        setMetricas(data);
      } catch (error) {
        console.error("Error cargando métricas:", error);
      }
    }
    cargarMetricas();
  }, []);

  // ==========================
  // APLICAR FILTROS
  // ==========================
  async function aplicarFiltros() {
    try {
      const redFiltrada = await fetchRedFiltrada({
        distrito,
        tipo_via: tipoVia === "Ambas" ? null : tipoVia,
        min_km: minKm,
      });

      onApplyFilters(redFiltrada); // <= Enviamos los datos al gráfico
    } catch (error) {
      console.error("Error aplicando filtros:", error);
    }
  }

  return (
    <aside className="w-[300px] bg-white border-r border-pathcycle-gray-100 p-6 overflow-y-auto space-y-6 flex-shrink-0">
      <div className="space-y-4">
        <h2 className="text-base font-bold text-pathcycle-gray-800">FILTROS Y OPCIONES</h2>

        {/* ==============================
            DISTRITO (próximamente dropdown real)
        =============================== */}
        <div>
          <label className="block text-sm font-medium text-pathcycle-gray-800 mb-1">
            Seleccionar Distrito
          </label>

          <input
            type="text"
            placeholder="Miraflores, San Isidro..."
            value={distrito ?? ""}
            onChange={(e) => setDistrito(e.target.value)}
            className="w-full py-2 px-3 text-sm bg-pathcycle-gray-50 border border-pathcycle-gray-200 rounded-lg"
          />
        </div>

        {/* ==============================
            TIPO DE VÍA
        =============================== */}
        <div>
          <label className="block text-sm font-medium text-pathcycle-gray-800 mb-1">
            Tipo de Vía
          </label>

          <select
            className="w-full py-2 px-3 text-sm bg-pathcycle-gray-50 border border-pathcycle-gray-200 rounded-lg"
            value={tipoVia}
            onChange={(e) => setTipoVia(e.target.value)}
          >
            <option>Ambas</option>
            <option>Metropolitana</option>
            <option>Local</option>
          </select>
        </div>

        {/* ==============================
            LONGITUD MÍNIMA
        =============================== */}
        <div>
          <label className="block text-sm font-medium text-pathcycle-gray-800 mb-1">
            Longitud mínima (km)
          </label>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="15"
              value={minKm}
              onChange={(e) => setMinKm(Number(e.target.value))}
              className="w-full h-2 bg-pathcycle-gray-100 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium text-pathcycle-gray-800 w-8 text-right">
              {minKm}
            </span>
          </div>
        </div>

        {/* ==============================
            OPCIONES EXTRA
        =============================== */}
        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-pathcycle-gray-800">
              Mostrar componentes conexas
            </span>
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-pathcycle-gray-800">
              Resaltar nodos críticos
            </span>
            <input type="checkbox" className="w-4 h-4 rounded" />
          </label>
        </div>

        {/* ==============================
            BOTÓN
        =============================== */}
        <button
          onClick={aplicarFiltros}
          className="w-full py-2 px-4 bg-pathcycle-primary text-white font-medium rounded-lg shadow-sm hover:bg-opacity-90"
        >
          Aplicar Filtros
        </button>
      </div>

      {/* ==============================
          MÉTRICAS
      =============================== */}
      <hr className="border-pathcycle-gray-100" />

      <div className="space-y-3">
        <h2 className="text-base font-bold text-pathcycle-gray-800">MÉTRICAS ALGORÍTMICAS</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-pathcycle-gray-50 p-3 rounded-lg border border-pathcycle-gray-100 text-center">
            <p className="text-xs text-pathcycle-gray-400">Nodos totales</p>
            <p className="text-lg font-bold">{metricas.nodos}</p>
          </div>

          <div className="bg-pathcycle-gray-50 p-3 rounded-lg border border-pathcycle-gray-100 text-center">
            <p className="text-xs text-pathcycle-gray-400">Aristas totales</p>
            <p className="text-lg font-bold">{metricas.aristas}</p>
          </div>

          <div className="bg-pathcycle-gray-50 p-3 rounded-lg border border-pathcycle-gray-100 text-center">
            <p className="text-xs text-pathcycle-gray-400">Componentes</p>
            <p className="text-lg font-bold text-pathcycle-danger">{metricas.componentes}</p>
          </div>

          <div className="bg-pathcycle-gray-50 p-3 rounded-lg border border-pathcycle-gray-100 text-center">
            <p className="text-xs text-pathcycle-gray-400">Comp. Principal</p>
            <p className="text-lg font-bold">{metricas.componente_principal}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
