"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Feature, LineString, FeatureCollection } from "geojson";
import { Ciclovia } from "@/lib/types";
import "mapbox-gl/dist/mapbox-gl.css";


mapboxgl.accessToken =
  "pk.eyJ1IjoiaXRhbG83NTEiLCJhIjoiY21pOWJsN3ZxMGp3YzJxcHpnbDFveWhrNSJ9.38wcg6EhQeqr7IcWnRKvZA";

export default function MapContainer({ ciclovias }: { ciclovias: Ciclovia[] }) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-77.0428, -12.0464],
      zoom: 11,
    });

    map.on("load", () => {
      // ✅ Convertir ciclovias a GeoJSON correctamente tipado
      const lineFeatures: Feature<LineString>[] = ciclovias.map((c) => ({
        type: "Feature", // literal exacto
        properties: {
          UBIGEO: c.UBIGEO,
          DEPARTAMENTO: c.DEPARTAMENTO,
          PROVINCIA: c.PROVINCIA,
          DISTRITO: c.DISTRITO,
          NOMBRE_CICLOVIA: c.NOMBRE_CICLOVIA,
          TRAMO: c.TRAMO,
          DISTRITO_CICLOVIA: c.DISTRITO_CICLOVIA,
          TIPO_VIA: c.TIPO_VIA,
          LONGITUD_KM: Number(c.LONGITUD_KM),
          FECHA_CORTE: c.FECHA_CORTE,
        },
        geometry: {
          type: "LineString", // literal exacto
          coordinates: [
            [Number(c.lon_inicio), Number(c.lat_inicio)],
            [Number(c.lon_fin), Number(c.lat_fin)],
          ],
        },
      }));

      const geojson: FeatureCollection<LineString> = {
        type: "FeatureCollection", // literal exacto
        features: lineFeatures,
      };

      map.addSource("cycleways", { type: "geojson", data: geojson });

      map.addLayer({
        id: "cycleways-layer",
        type: "line",
        source: "cycleways",
        paint: {
          "line-width": 3,
          "line-color": "#00b3ff",
          "line-opacity": 0.9,
        },
      });
    });

    return () => map.remove();
  }, [ciclovias]);

  return <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />;
}
