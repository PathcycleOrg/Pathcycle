"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Feature, LineString, FeatureCollection } from "geojson";

mapboxgl.accessToken =
  "pk.eyJ1IjoiaXRhbG83NTEiLCJhIjoiY21pOWJsN3ZxMGp3YzJxcHpnbDFveWhrNSJ9.38wcg6EhQeqr7IcWnRKvZA";

export interface MapVisualizationRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  drawRoute: (coords: [number, number][]) => void;
  clearRoute: () => void;

  // NUEVO
  hideCycleways: () => void;
  showCycleways: () => void;
}

interface MapVisualizationProps {
  cycleways: Feature<LineString>[];
  initialZoom?: number;
  maxZoom?: number;
  minZoom?: number;
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [-77.0824, -12.0464];
const DEFAULT_ZOOM = 12;

export const MapVisualization = forwardRef<
  MapVisualizationRef,
  MapVisualizationProps
>(({ cycleways, initialZoom = DEFAULT_ZOOM, maxZoom = 18, minZoom = 1, className = "" }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // ---------------------------
  // INIT MAP
  // ---------------------------
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEFAULT_CENTER,
      zoom: initialZoom,
      maxZoom,
      minZoom,
    });

    map.current.on("load", () => setMapLoaded(true));

    return () => map.current?.remove();
  }, []);

  // ---------------------------
  // CARGAR CICLOVÍAS
  // ---------------------------
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const geojson: FeatureCollection<LineString> = {
      type: "FeatureCollection",
      features: cycleways,
    };

    const existingSource = map.current.getSource("cycleways");

    if (!existingSource) {
      map.current.addSource("cycleways", { type: "geojson", data: geojson });

      map.current.addLayer({
        id: "cycleways-layer",
        type: "line",
        source: "cycleways",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#4CAF50", "line-width": 3, "line-opacity": 0.9 },
      });
    } else {
      (existingSource as mapboxgl.GeoJSONSource).setData(geojson);
    }
  }, [cycleways, mapLoaded]);

  // ---------------------------
  // OCULTAR CICLOVÍAS
  // ---------------------------
  const hideCycleways = () => {
    if (!mapLoaded || !map.current) return;
    if (map.current.getLayer("cycleways-layer")) {
      map.current.setLayoutProperty("cycleways-layer", "visibility", "none");
    }
  };

  // MOSTRAR CICLOVÍAS
  const showCycleways = () => {
    if (!mapLoaded || !map.current) return;
    if (map.current.getLayer("cycleways-layer")) {
      map.current.setLayoutProperty("cycleways-layer", "visibility", "visible");
    }
  };

  // ---------------------------
  // DIBUJAR RUTA ÓPTIMA
  // ---------------------------
  const drawRoute = (coords: [number, number][]) => {
    if (!mapLoaded || !map.current) return;
    if (!coords || coords.length < 2) return;

    // LIMPIAR
    if (map.current.getLayer("route-layer")) map.current.removeLayer("route-layer");
    if (map.current.getSource("route")) map.current.removeSource("route");

    const routeGeoJSON: Feature<LineString> = {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: coords },
    };

    map.current.addSource("route", { type: "geojson", data: routeGeoJSON });

    map.current.addLayer({
      id: "route-layer",
      type: "line",
      source: "route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#FF0000",
        "line-width": 5,
        "line-opacity": 0.9,
      },
    });

    // FIT BOUNDS
    const bounds = new mapboxgl.LngLatBounds();
    coords.forEach(([lng, lat]) => bounds.extend([lng, lat]));

    map.current.fitBounds(bounds, {
      padding: 40,
      maxZoom: 15,
      duration: 1200,
    });
  };

  // ---------------------------
  // LIMPIAR RUTA
  // ---------------------------
  const clearRoute = () => {
    if (!mapLoaded || !map.current) return;

    if (map.current.getLayer("route-layer")) map.current.removeLayer("route-layer");
    if (map.current.getSource("route")) map.current.removeSource("route");

    map.current.flyTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
  };

  // ---------------------------
  // MÉTODOS EXPUESTOS
  // ---------------------------
  useImperativeHandle(ref, () => ({
    zoomIn: () => map.current?.zoomIn(),
    zoomOut: () => map.current?.zoomOut(),
    resetZoom: () => map.current?.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }),
    drawRoute,
    clearRoute,

    hideCycleways,
    showCycleways,
  }));

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full rounded-lg overflow-hidden ${className}`}
    />
  );
});

MapVisualization.displayName = "MapVisualization";
