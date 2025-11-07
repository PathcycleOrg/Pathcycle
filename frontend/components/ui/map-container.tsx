"use client"

import { useRef, useState } from "react"
import { Expand, Minimize, Plus, Minus } from "lucide-react"
import { MapVisualization } from "@/components/ui/map-visualization"

import type { MapVisualizationRef } from './map-visualization'

type MapRef = MapVisualizationRef

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const SAMPLE_CYCLEWAYS = [
    {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-77.0324, -12.0464],
          [-77.0424, -12.0564],
          [-77.0524, -12.0664],
        ],
      },
      properties: {
        name: 'Ciclovía Universitaria',
        distance: 2.5,
        type: 'dedicated',
      },
    },
  ]

  const handleZoomIn = () => {
    if (mapRef.current?.zoomIn) {
      mapRef.current.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (mapRef.current?.zoomOut) {
      mapRef.current.zoomOut()
    }
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
    // Asegurar que el mapa se redimensione después de la transición y el scroll
    setTimeout(() => {
      if (mapRef.current?.zoomIn) {
        const map = (mapRef.current as any)?._map;
        if (map && typeof map.resize === 'function') {
          // Hacer scroll a la posición del mapa si se está expandiendo
          if (!isExpanded) {
            const mapElement = document.querySelector('[data-map-container]');
            mapElement?.scrollIntoView({ behavior: 'smooth' });
          }
          map.resize();
        }
      }
    }, 300); // Mismo tiempo que la duración de la transición
  }

  return (
    <div 
      data-map-container
      className={`relative w-full rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'h-[calc(100vh-8rem)]' : 'h-96'
      }`}>
      {/* Map */}
      <div className="w-full h-full">
        <MapVisualization
          ref={mapRef}
          cycleways={SAMPLE_CYCLEWAYS}
          initialZoom={12}
          className="w-full h-full"
        />
      </div>

      {/* Map Controls */}
      <div className="absolute top-3 left-3 z-10 bg-white p-1 rounded-lg shadow-sm border border-pathcycle-gray-100">
        <button
          onClick={toggleExpand}
          className="w-8 h-8 flex items-center justify-center text-pathcycle-gray-800 hover:bg-pathcycle-gray-50 rounded"
        >
          {isExpanded ? <Minimize className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
        </button>
      </div>

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center bg-white text-pathcycle-gray-800 hover:bg-pathcycle-gray-50 rounded-t-lg shadow-sm border border-pathcycle-gray-100"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center bg-white text-pathcycle-gray-800 hover:bg-pathcycle-gray-50 rounded-b-lg shadow-sm border border-pathcycle-gray-100"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white p-3 rounded-lg shadow-sm border border-pathcycle-gray-100 w-48">
        <h4 className="font-bold text-xs mb-2">Leyenda</h4>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2">
            <span className="h-1 w-4 bg-pathcycle-secondary rounded-full"></span>
            <span className="text-xs text-pathcycle-gray-800">Conectada</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1 w-4 bg-pathcycle-danger rounded-full"></span>
            <span className="text-xs text-pathcycle-gray-800">Aislada</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1 w-4 border-t-2 border-dashed border-pathcycle-primary"></span>
            <span className="text-xs text-pathcycle-gray-800">Propuesta</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
