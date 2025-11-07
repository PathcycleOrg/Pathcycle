export type NodeType = {
  id: string
  name?: string
  group?: string | number
  val?: number
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