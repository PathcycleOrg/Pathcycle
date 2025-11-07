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