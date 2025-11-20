'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Public Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoiY29yZW5nMSIsImEiOiJjbWhrc3UwZmUwOG9qMmpwcGxwcnlpY2t6In0.GTIoOl8FyhJ1ioyswHMdpQ';

export interface MapVisualizationRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  resize: () => void;
  drawRoute: (coords: number[][]) => void;
  clearRoute: () => void;
  fitToBounds: (coords: number[][], padding?: number) => void;
}

interface MapVisualizationProps {
  cycleways?: Array<{
    type: 'Feature';
    geometry: {
      type: 'LineString';
      coordinates: number[][];
    };
    properties: {
      name: string;
      distance: number;
      type: string;
    };
  }>;
  initialZoom?: number;
  maxZoom?: number;
  minZoom?: number;
  onMapLoad?: (map: mapboxgl.Map) => void;
  className?: string;
}

const DEFAULT_CENTER = [-77.0824, -12.0464] as [number, number]; // Lima coordinates
const DEFAULT_ZOOM = 12;
const DEFAULT_STYLE = 'mapbox://styles/mapbox/streets-v12';

export const MapVisualization = forwardRef<MapVisualizationRef, MapVisualizationProps>(
  ({
    cycleways = [],
    initialZoom = DEFAULT_ZOOM,
    maxZoom = 18,
    minZoom = 1,
    onMapLoad,
    className = '',
  }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const drawAnimRef = useRef<number | null>(null)
    const animCoordsRef = useRef<number[][] | null>(null)
    const animStartRef = useRef<number | null>(null)

    useEffect(() => {
      if (!mapContainer.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: DEFAULT_STYLE,
        center: DEFAULT_CENTER,
        zoom: initialZoom,
        maxZoom,
        minZoom,
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        if (onMapLoad && map.current) {
          onMapLoad(map.current);
        }
      });

      return () => {
        map.current?.remove();
      };
    }, [initialZoom, maxZoom, minZoom, onMapLoad]);

    useEffect(() => {
      if (!mapLoaded || !map.current) return;

      if (cycleways.length > 0) {
        const source = map.current.getSource('cycleways');

        if (!source) {
          map.current.addSource('cycleways', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: cycleways,
            },
          });

          map.current.addLayer({
            id: 'cycleways-layer',
            type: 'line',
            source: 'cycleways',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#4CAF50',
              'line-width': 4,
              'line-opacity': 0.8,
            },
          });
        } else {
          (source as mapboxgl.GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: cycleways,
          });
        }
      }
    }, [mapLoaded, cycleways]);

    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        map.current?.zoomIn();
      },
      zoomOut: () => {
        map.current?.zoomOut();
      },
      resetZoom: () => {
        map.current?.flyTo({
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          essential: true,
        });
      },
      resize: () => {
        // give the browser a tick to apply layout changes before resizing the map canvas
        setTimeout(() => map.current?.resize(), 50);
      }
    ,
    drawRoute: (coords: number[][]) => {
      if (!map.current || !mapLoaded) return
      const sourceId = 'route-source'
      const layerId = 'route-layer'

      // cancel any running animation
      if (drawAnimRef.current) {
        cancelAnimationFrame(drawAnimRef.current)
        drawAnimRef.current = null
      }

      animCoordsRef.current = coords
      animStartRef.current = null

      // ensure source/layer exist
      if (!map.current.getSource(sourceId)) {
        map.current.addSource(sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } as any })
        map.current.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#FF5722', 'line-width': 6, 'line-opacity': 0.95 }
        })
      }

      const src = map.current.getSource(sourceId) as mapboxgl.GeoJSONSource

      // animate by progressively revealing coordinates
      const duration = 800 // ms
      const totalPts = coords.length

      const step = (ts: number) => {
        if (!animStartRef.current) animStartRef.current = ts
        const elapsed = ts - (animStartRef.current || 0)
        const t = Math.min(1, elapsed / duration)
        const count = Math.max(2, Math.floor(t * totalPts))
        const partial = coords.slice(0, count)
        const geo = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: partial } }] }
        try { src.setData(geo as any) } catch (e) { /* ignore */ }

        if (t < 1) {
          drawAnimRef.current = requestAnimationFrame(step)
        } else {
          drawAnimRef.current = null
        }
      }

      drawAnimRef.current = requestAnimationFrame(step)
    },
    clearRoute: () => {
      if (!map.current || !mapLoaded) return
      const sourceId = 'route-source'
      const layerId = 'route-layer'
      if (drawAnimRef.current) {
        cancelAnimationFrame(drawAnimRef.current)
        drawAnimRef.current = null
      }
      animCoordsRef.current = null
      animStartRef.current = null
      if (map.current.getLayer(layerId)) {
        try { map.current.removeLayer(layerId) } catch {}
      }
      if (map.current.getSource(sourceId)) {
        try { map.current.removeSource(sourceId) } catch {}
      }
    },
    fitToBounds: (coords: number[][], padding = 40) => {
      if (!map.current || !mapLoaded || !coords || coords.length === 0) return
      const bounds = coords.reduce((b, c) => b.extend(c as [number, number]), new mapboxgl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number]))
      try { map.current.fitBounds(bounds, { padding, maxZoom: 16, duration: 800 }) } catch (e) { console.warn('fitBounds failed', e) }
    }
    }), []);

    return (
      <div 
        ref={mapContainer} 
        className={`w-full h-full rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${className}`}
        style={{ position: 'relative' }}
      />
    );
  }
);

MapVisualization.displayName = 'MapVisualization';