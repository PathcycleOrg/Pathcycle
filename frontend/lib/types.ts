export type NodeType = {
  id: string
  name?: string
  group?: string | number
  val?: number
  distrito?: string 
}

export type LinkType = {
  source: string
  target: string
  value?: number
}

export const NODE_GROUPS = {
  '1': 'Estaciones Principales',
  '2': 'Puntos de Tráfico',
  '3': 'Centros Logísticos',
  '4': 'Mantenimiento',
  '5': 'Emergencias'
} as const

export const NODE_COLORS: Record<string, string> = {
  '1': '#4f46e5', // Primary blue - Estaciones
  '2': '#0ea5e9', // Light blue - Tráfico
  '3': '#84cc16', // Green - Logística
  '4': '#eab308', // Yellow - Mantenimiento
  '5': '#ef4444', // Red - Emergencias
  'default': '#94a3b8' // Gray
  
}

// ============================
// TIPOS DEL BACKEND
// ============================

export interface Ciclovia {
  UBIGEO: string;
  DEPARTAMENTO: string;
  PROVINCIA: string;
  DISTRITO: string;
  CANTIDAD: string;
  NOMBRE_CICLOVIA: string;
  TRAMO: string | null;
  DISTRITO_CICLOVIA: string;
  TIPO_VIA: string;
  LONGITUD_KM: string | number | null;
  FECHA_CORTE: string;
  lat_inicio: number | string | null;
  lon_inicio: number | string | null;
  lat_fin: number | string | null;
  lon_fin: number | string | null;


}

export interface ReporteAccidente {
  id: number;
  distrito: string;
  tipo_via: string;
  tipo_accidente: string;
  numero_heridos: number;
  numero_fallecidos: number;
  fecha: string;
  hora: string;
}

export interface Trafico {
  id: number;
  distrito: string;
  tipo_via: string;
  intensidad_trafico: string;
  velocidad_promedio: number;
  hora_pico: string;
  fecha: string;
}


export interface NodoCritico {
  id: string;
  score: number;
}