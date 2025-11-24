import { Ciclovia, ReporteAccidente, Trafico } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ===========================
// CICLOVÍAS
// ===========================
export async function fetchCiclovias(): Promise<Ciclovia[]> {
  const res = await fetch(`${API_URL}/ciclovias`);
  if (!res.ok) throw new Error("Error obteniendo ciclovías");
  return res.json();
}

// ===========================
// ACCIDENTES
// ===========================
export async function fetchAccidentes(): Promise<ReporteAccidente[]> {
  const res = await fetch(`${API_URL}/accidentes`);
  if (!res.ok) throw new Error("Error obteniendo accidentes");
  return res.json();
}

// ===========================
// TRÁFICO
// ===========================
export async function fetchTrafico(): Promise<Trafico[]> {
  const res = await fetch(`${API_URL}/trafico`);
  if (!res.ok) throw new Error("Error obteniendo tráfico");
  return res.json();
}

// ===========================
// NODOS CRÍTICOS
// ===========================
export async function fetchNodosCriticos(): Promise<any> {
  const res = await fetch(`${API_URL}/nodos-criticos`);
  if (!res.ok) throw new Error("Error obteniendo nodos críticos");
  return res.json(); // 👈 aquí se retorna el JSON completo, no NodoCritico[]
}


// ===========================
//  RED COMPLETA (ciclovías + distritos + enlaces)
// ===========================
export async function fetchRed(): Promise<{
  nodes: any[];
  links: any[];
}> {
  const res = await fetch(`${API_URL}/red`);
  if (!res.ok) throw new Error("Error obteniendo red completa");
  return res.json();
}

// ===========================
// RED FILTRADA
// ===========================
export async function fetchRedFiltrada(params: {
  distrito?: string | null;
  tipo_via?: string | null;
  min_km?: number | null;
}) {
  const query = new URLSearchParams();

  if (params.distrito) query.set("distrito", params.distrito);
  if (params.tipo_via) query.set("tipo_via", params.tipo_via);
  if (params.min_km !== null && params.min_km !== undefined)
    query.set("min_km", String(params.min_km));

  const res = await fetch(`${API_URL}/red-filtrada?${query.toString()}`);
  if (!res.ok) throw new Error("Error obteniendo red filtrada");

  return res.json();
}


export async function fetchMetricasRed() {
  const res = await fetch(`${API_URL}/metrics`);
  if (!res.ok) throw new Error("Error obteniendo métricas de red");

  const data = await res.json();

  return {
    nodos: data.total_nodes,
    aristas: data.total_edges,
    componentes: data.components_count,
    componente_principal: `${(data.largest_component_percent * 100).toFixed(1)}%`,
    densidad: data.density
  };
}



// ===========================
// RUTA ÓPTIMA (Funciona con intersecciones reales)
// ===========================
export async function fetchRutaOptima(
  inicio: { lon: number; lat: number },
  fin: { lon: number; lat: number }
): Promise<{
  inicio_nodo: string;
  fin_nodo: string;
  distance_m: number;
  path_coords: [number, number][]; // [lon, lat]
}> {

  const params = new URLSearchParams({
    lat_inicio: String(inicio.lat),
    lon_inicio: String(inicio.lon),
    lat_fin: String(fin.lat),
    lon_fin: String(fin.lon),
  });

  const res = await fetch(`${API_URL}/ruta-optima?${params}`);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Error en backend:", errorText);
    throw new Error("Error obteniendo ruta óptima");
  }

  const data = await res.json();

  // Validación extra para evitar errores en drawRoute
  if (!data.path_coords || !Array.isArray(data.path_coords)) {
    throw new Error("Respuesta inválida del backend");
  }

  return data;
}
