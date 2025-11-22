"use client";

import { useEffect, useRef, useState } from "react";
import { fetchCiclovias, fetchRutaOptima } from "@/lib/api";
import { MapVisualization, MapVisualizationRef } from "@/components/ui/map-visualization";
import type { Ciclovia } from "@/lib/types";
import type { Feature, LineString } from "geojson";

// ------------------------------------------------------
// CICLOVÍA → GEOJSON
// ------------------------------------------------------
function cicloviaToGeoJSON(c: Ciclovia): Feature<LineString> {
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: [
        [c.lon_inicio as number, c.lat_inicio as number],
        [c.lon_fin as number, c.lat_fin as number],
      ],
    },
    properties: {
      nombre: c.NOMBRE_CICLOVIA,
    },
  };
}

export default function OptimalRoute() {
  const mapRef = useRef<MapVisualizationRef>(null);

  const [ciclovias, setCiclovias] = useState<Ciclovia[]>([]);
  const [cyclewaysGeoJSON, setCyclewaysGeoJSON] = useState<Feature<LineString>[]>([]);

  const [startCoord, setStartCoord] = useState("");
  const [endCoord, setEndCoord] = useState("");
  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------
  // CARGAR CICLOVÍAS
  // ------------------------------------------------------
  useEffect(() => {
    fetchCiclovias()
      .then((data) => {
        const valid = data.filter(
          (c) =>
            c.lat_inicio !== null &&
            c.lon_inicio !== null &&
            c.lat_fin !== null &&
            c.lon_fin !== null
        );

        const numeric = valid.map((c) => ({
          ...c,
          lat_inicio: Number(c.lat_inicio),
          lon_inicio: Number(c.lon_inicio),
          lat_fin: Number(c.lat_fin),
          lon_fin: Number(c.lon_fin),
        }));

        setCiclovias(numeric);
        setCyclewaysGeoJSON(numeric.map(cicloviaToGeoJSON));
      })
      .catch((e) => console.error("Error cargando ciclovías:", e));
  }, []);

  // ------------------------------------------------------
  // CALCULAR RUTA ÓPTIMA (con ocultar ciclovías)
  // ------------------------------------------------------
  const handleCalcularRuta = async () => {
    if (!startCoord || !endCoord) {
      alert("Selecciona inicio y fin.");
      return;
    }

    try {
      setLoading(true);

      const [lon_inicio, lat_inicio] = startCoord.split(",").map(Number);
      const [lon_fin, lat_fin] = endCoord.split(",").map(Number);

      if (
        isNaN(lon_inicio) ||
        isNaN(lat_inicio) ||
        isNaN(lon_fin) ||
        isNaN(lat_fin)
      ) {
        alert("Coordenadas inválidas.");
        return;
      }

      // LIMPIA RUTA ANTERIOR
      mapRef.current?.clearRoute();

      // OCULTA CICLOVÍAS
      mapRef.current?.hideCycleways();

      // PETICIÓN AL BACKEND
      const ruta = await fetchRutaOptima(
        { lon: lon_inicio, lat: lat_inicio },
        { lon: lon_fin, lat: lat_fin }
      );

      if (!ruta?.path_coords || ruta.path_coords.length < 2) {
        alert("No se encontró una ruta válida.");
        // si falla, vuelve a mostrar ciclovías
        mapRef.current?.showCycleways();
        return;
      }

      console.log("Ruta óptima recibida:", ruta);

      // DIBUJAR RUTA
      mapRef.current?.drawRoute(ruta.path_coords);

    } catch (e) {
      console.error("Error calculando ruta:", e);
      alert("No se pudo calcular la ruta óptima.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------
  // LIMPIAR RUTA (con mostrar ciclovías)
  // ------------------------------------------------------
  const handleLimpiar = () => {
    mapRef.current?.clearRoute();
    mapRef.current?.showCycleways();   // <<--- aquí se muestra de nuevo
  };

  // ------------------------------------------------------
  // OPCIONES DEL SELECT
  // ------------------------------------------------------
  const formatOption = (c: Ciclovia, type: "inicio" | "fin") => {
    const lon = type === "inicio" ? c.lon_inicio : c.lon_fin;
    const lat = type === "inicio" ? c.lat_inicio : c.lat_fin;
    return `${lon},${lat}`;
  };

  // ------------------------------------------------------
  // UI
  // ------------------------------------------------------
  return (
    <div className="w-full h-full p-2 flex flex-col gap-2">

      {/* Selects */}
      <div className="flex gap-2 items-center">

        <select
          className="border px-2 py-1"
          value={startCoord}
          onChange={(e) => setStartCoord(e.target.value)}
        >
          <option value="">Inicio</option>
          {ciclovias.map((c, i) => (
            <option key={i} value={formatOption(c, "inicio")}>
              {c.NOMBRE_CICLOVIA} (Inicio)
            </option>
          ))}
        </select>

        <select
          className="border px-2 py-1"
          value={endCoord}
          onChange={(e) => setEndCoord(e.target.value)}
        >
          <option value="">Fin</option>
          {ciclovias.map((c, i) => (
            <option key={i} value={formatOption(c, "fin")}>
              {c.NOMBRE_CICLOVIA} (Fin)
            </option>
          ))}
        </select>

        <button
          onClick={handleCalcularRuta}
          className="px-3 py-1 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          {loading ? "Calculando..." : "Calcular Ruta"}
        </button>

        <button
          onClick={handleLimpiar}
          className="px-3 py-1 bg-gray-500 text-white rounded"
        >
          Limpiar
        </button>
      </div>

      {/* Mapa */}
      <div className="flex-1 border rounded overflow-hidden">
        <MapVisualization
          ref={mapRef}
          cycleways={cyclewaysGeoJSON}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
