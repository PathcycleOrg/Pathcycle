import { Ciclovia, ReporteAccidente, Trafico , PreviewConfig , ReporteItem } from "./types";

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
// RUTA ÓPTIMA (con manejo de errores del backend)
// ===========================
export async function fetchRutaOptima(
  inicio: { lon: number; lat: number },
  fin: { lon: number; lat: number }
): Promise<{
  error?: string;

  // datos extra cuando NO hay ruta
  start_id?: string;
  end_id?: string;
  start_dist_m?: number;
  end_dist_m?: number;

  // datos cuando SÍ hay ruta
  inicio_nodo?: { lon: number; lat: number };
  fin_nodo?: { lon: number; lat: number };
  distance_m?: number;
  path_coords?: [number, number][]; // [lon, lat]
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
    return { error: "Error obteniendo ruta óptima" };
  }

  const data = await res.json();

  if (data.error) {
    console.warn("Backend indica que no existe ruta:", data.error);
    return {
      error: data.error,
      start_id: data.start_id,
      end_id: data.end_id,
      start_dist_m: data.start_dist_m,
      end_dist_m: data.end_dist_m,
    };
  }

  if (!Array.isArray(data.path_coords)) {
    return { error: "Respuesta inválida del backend" };
  }

  return data;
}



// ====================================
// REPORTES - DESCARGA DE ARCHIVO
// ====================================
export async function downloadReporte(reportId: number) {
  const res = await fetch(`${API_URL}/reports/download/${reportId}`);

  if (!res.ok) throw new Error("Error descargando el reporte");

  const blob = await res.blob();

  // Extraer nombre real del archivo desde 'Content-Disposition'
  const disposition = res.headers.get("Content-Disposition");
  let filename = "reporte_descargado";

  if (disposition && disposition.includes("filename=")) {
    filename = disposition.split("filename=")[1].replace(/"/g, "");
  }

  return { blob, filename };
}



// ====================================
// REPORTES - GENERAR PREVIEW
// ====================================
export async function previewReporte(
  config: PreviewConfig
): Promise<string> {

  const res = await fetch(`${API_URL}/reports/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config)
  });

  if (!res.ok) throw new Error("Error generando vista previa del reporte");

  const data = await res.json();
  return data.html;  // ✔ HTML REAL
}


// ====================================
// REPORTES - GUARDAR REPORTE
// ====================================
export async function saveReporte(payload: {
  title: string;
  html: string;
  export_format: "html" | "pdf";
}) {
  const res = await fetch(`${API_URL}/reports/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error("Error guardando reporte");

  return res.json();
}

// ====================================
// REPORTES - LISTA DE RECIENTES
// ====================================
export async function fetchReportesRecientes(
  limit: number = 10
): Promise<ReporteItem[]> {

  const res = await fetch(`${API_URL}/reports/recent?limit=${limit}`);

  if (!res.ok) throw new Error("Error obteniendo reportes recientes");

  return res.json();
}