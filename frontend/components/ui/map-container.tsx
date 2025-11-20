"use client"

import { useRef, useState, useEffect } from "react"
import { Expand, Minimize, Plus, Minus } from "lucide-react"
import { MapVisualization } from "@/components/ui/map-visualization"

import type { MapVisualizationRef } from './map-visualization'

type MapRef = MapVisualizationRef

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  // refs for custom left-side drag scrollbar
  const isDraggingRef = useRef(false)
  const dragStartYRef = useRef(0)

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
    // Toggle state and schedule a map resize after the CSS transition
    setIsExpanded((prev) => {
      const next = !prev

      // After transition completes, ensure map canvas is resized and scroll into view when expanding
      setTimeout(() => {
        try {
          if (next) {
            const el = document.querySelector('[data-map-container]') as HTMLElement | null
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        } finally {
          mapRef.current?.resize()
        }
      }, 50)

      return next
    })
  }

  // Drag handlers for the left-side scrollbar: scroll the page by the drag delta
  const onDragStart = (e: React.PointerEvent) => {
    isDraggingRef.current = true
    dragStartYRef.current = e.clientY
    const target = e.target as Element
    try { target.setPointerCapture?.(e.pointerId) } catch {}
  }

  const onDragMove = (e: PointerEvent) => {
    if (!isDraggingRef.current) return
    const dy = e.clientY - dragStartYRef.current
    // Scroll the document vertically by the delta; this is simple and responsive
    window.scrollBy({ top: dy, left: 0, behavior: 'auto' })
    dragStartYRef.current = e.clientY
  }

  const onDragEnd = (_e: PointerEvent) => {
    isDraggingRef.current = false
  }

  useEffect(() => {
    document.addEventListener('pointermove', onDragMove)
    document.addEventListener('pointerup', onDragEnd)
    document.addEventListener('pointercancel', onDragEnd)
    return () => {
      document.removeEventListener('pointermove', onDragMove)
      document.removeEventListener('pointerup', onDragEnd)
      document.removeEventListener('pointercancel', onDragEnd)
    }
  }, [])

  // Listen for route events and draw polyline on the map when nodes include coordinates
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent
      const payload = ce.detail || {}
      const nodes: any[] = payload.nodes || []
      const route: string[] = payload.route || []

      if (!mapRef.current) return

      const findNode = (id: string) => nodes.find(n => String(n.id) === String(id))

      const getCoord = (n: any): [number, number] | null => {
        if (!n) return null
        if (Array.isArray(n.coordinates) && n.coordinates.length >= 2) return [Number(n.coordinates[0]), Number(n.coordinates[1])]
        if (n.geometry && Array.isArray(n.geometry.coordinates)) return [Number(n.geometry.coordinates[0]), Number(n.geometry.coordinates[1])]
        if (n.lng !== undefined && n.lat !== undefined) return [Number(n.lng), Number(n.lat)]
        if (n.lon !== undefined && n.lat !== undefined) return [Number(n.lon), Number(n.lat)]
        if (n.longitude !== undefined && n.latitude !== undefined) return [Number(n.longitude), Number(n.latitude)]
        if (n.x !== undefined && n.y !== undefined) return [Number(n.x), Number(n.y)]
        return null
      }

      const coords: number[][] = []
      for (const id of route) {
        const n = findNode(id)
        const c = getCoord(n)
        if (c) coords.push(c)
        else {
          // missing coord for this node — abort drawing
          console.warn('Nodo sin coordenadas para ruta:', id, n)
        }
      }

      if (coords.length >= 2) {
        try {
          mapRef.current.drawRoute(coords)
          mapRef.current.fitToBounds(coords)
        } catch (err) {
          console.error('Error dibujando ruta en mapa', err)
        }
      } else {
        // not enough coordinates — clear any existing route
        try { mapRef.current.clearRoute() } catch {}
      }
    }

    window.addEventListener('pathcycle:use-route', handler as EventListener)
    window.addEventListener('pathcycle:preview-route', handler as EventListener)

    const clearHandler = () => {
      try { mapRef.current?.clearRoute() } catch (e) { console.warn('clear route failed', e) }
    }
    window.addEventListener('pathcycle:clear-route', clearHandler as EventListener)

    return () => {
      window.removeEventListener('pathcycle:use-route', handler as EventListener)
      window.removeEventListener('pathcycle:preview-route', handler as EventListener)
      window.removeEventListener('pathcycle:clear-route', clearHandler as EventListener)
    }
  }, [mapRef])

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
        {/* Left-side drag scrollbar: small visible track + knob to allow dragging to scroll the page */}
        <div className="absolute left-0 top-0 h-full z-40 flex items-start pointer-events-auto">
          <div className="flex items-start h-full" style={{ width: 18 }}>
            <div className="w-2 bg-pathcycle-gray-100 rounded-r-lg mr-2" style={{ opacity: 0.9 }} />
            <div
              role="slider"
              aria-label="Arrastrar para desplazarse"
              onPointerDown={onDragStart}
              className="w-4 h-12 bg-pathcycle-gray-300 rounded-md shadow-inner cursor-grab touch-none"
              style={{ marginLeft: -18 }}
            />
          </div>
        </div>
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
