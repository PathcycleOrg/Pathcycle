# main.py
from fastapi import FastAPI, Depends , Body , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Union , Optional
from sqlalchemy.orm import Session
from datetime import datetime
import html

from .database import Base, engine, get_db
from .models import Ciclovia, ReporteAccidente, Trafico , ReportSaved
from .schemas import CicloviaSchema, ReporteAccidenteSchema, TraficoSchema , ReportRequestSchema, SaveReportRequest, ReportSavedResponse

import math
import heapq
import base64
import tempfile
import pdfkit  

# ============================================================
# 1. Haversine
# ============================================================

def haversine(coord1, coord2):
    """Distancia en metros entre 2 coordenadas (lon, lat)."""
    R = 6371000
    lat1, lon1 = math.radians(coord1[1]), math.radians(coord1[0])
    lat2, lon2 = math.radians(coord2[1]), math.radians(coord2[0])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 2 * R * math.asin(math.sqrt(a))


# ============================================================
# 2. Intersecciones — helpers
# ============================================================

def ccw(A, B, C):
    return (C[1]-A[1])*(B[0]-A[0]) > (B[1]-A[1])*(C[0]-A[0])

def segments_intersect(p1, p2, p3, p4):
    """Devuelve True si los segmentos p1-p2 y p3-p4 se cruzan."""
    return ccw(p1, p3, p4) != ccw(p2, p3, p4) and ccw(p1, p2, p3) != ccw(p1, p2, p4)

def line_intersection(p1, p2, p3, p4):
    """Calcula punto exacto de intersección entre dos segmentos."""
    x1, y1 = p1; x2, y2 = p2
    x3, y3 = p3; x4, y4 = p4

    den = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4)
    if abs(den) < 1e-12:
        return None  # paralelas

    px = ((x1*y2 - y1*x2)*(x3-x4) - (x1-x2)*(x3*y4 - y3*x4)) / den
    py = ((x1*y2 - y1*x2)*(y3-y4) - (y1-y2)*(x3*y4 - y3*x4)) / den

    return (px, py)


# ============================================================
# 3. Dijkstra
# ============================================================

def dijkstra(graph, start, end):
    queue = [(0, start, [])]
    visited = set()

    while queue:
        (cost, node, path) = heapq.heappop(queue)

        if node in visited:
            continue

        visited.add(node)
        path = path + [node]

        if node == end:
            return path, cost

        for neighbor, weight in graph[node].items():
            if neighbor not in visited:
                heapq.heappush(queue, (cost + weight, neighbor, path))

    return None, float("inf")


# ============================================================
# 4. Merge de nodos cercanos (snapping)
# ============================================================

def merge_close_nodes(nodes, threshold=15):
    """
    Une nodos que están a menos de 'threshold' metros.
    Retorna:
      - merged: nodos finales
      - mapping: id_original → id_mergeado
    """
    merged = {}
    mapping = {}

    for id1, coord1 in nodes.items():
        assigned = False
        for id2, coord2 in merged.items():
            if haversine(coord1, coord2) < threshold:
                mapping[id1] = id2
                assigned = True
                break

        if not assigned:
            merged[id1] = coord1
            mapping[id1] = id1

    return merged, mapping


# ============================================================
# 5. Intersecciones entre ciclovías
# ============================================================

def detectar_intersecciones(ciclovias):
    segmentos = []
    intersecciones = []

    # Crear lista de segmentos (lon,lat)
    for c in ciclovias:
        if None in (c.lat_inicio, c.lon_inicio, c.lat_fin, c.lon_fin):
            continue
        p1 = (c.lon_inicio, c.lat_inicio)
        p2 = (c.lon_fin, c.lat_fin)
        segmentos.append([p1, p2])

    # Buscar intersecciones entre TODOS los segmentos
    for i in range(len(segmentos)):
        for j in range(i + 1, len(segmentos)):
            a1, a2 = segmentos[i]
            b1, b2 = segmentos[j]

            if segments_intersect(a1, a2, b1, b2):
                punto = line_intersection(a1, a2, b1, b2)
                if punto:
                    intersecciones.append(punto)

    return segmentos, intersecciones


# ============================================================
# 6. Dividir segmentos por intersecciones reales
# ============================================================

def dividir_segmentos_por_intersecciones(segmentos, intersecciones):
    nuevos_segmentos = []

    for p1, p2 in segmentos:
        cortes = []

        for inter in intersecciones:
            d_total = haversine(p1, p2)
            d1 = haversine(p1, inter)
            d2 = haversine(inter, p2)

            # Si pertenece al segmento
            if abs((d1 + d2) - d_total) < 8:  # margen de 2 metros
                cortes.append(inter)

        # Ordenar cortes por distancia
        cortes.sort(key=lambda x: haversine(p1, x))

        # Construir los segmentos finales
        puntos = [p1] + cortes + [p2]
        for i in range(len(puntos) - 1):
            nuevos_segmentos.append((puntos[i], puntos[i+1]))

    return nuevos_segmentos


# ============================================================
# 7. Construcción del grafo 
# ============================================================

def construir_grafo(ciclovias):
    nodes = {}

    # Crear nodos originales
    for c in ciclovias:
        if None in (c.lat_inicio, c.lon_inicio, c.lat_fin, c.lon_fin):
            continue

        start = (c.lon_inicio, c.lat_inicio)
        end = (c.lon_fin, c.lat_fin)

        id_start = f"{start[0]},{start[1]}"
        id_end = f"{end[0]},{end[1]}"

        nodes[id_start] = start
        nodes[id_end] = end

    
    merged_nodes, mapping = merge_close_nodes(nodes)


    segmentos, inters = detectar_intersecciones(ciclovias)

    segmentos_finales = dividir_segmentos_por_intersecciones(segmentos, inters)

    for inter in inters:
        id_inter = f"{inter[0]},{inter[1]}"
        merged_nodes[id_inter] = inter

    
    graph = {nid: {} for nid in merged_nodes}

    for p1, p2 in segmentos_finales:
        id1 = f"{p1[0]},{p1[1]}"
        id2 = f"{p2[0]},{p2[1]}"

        if id1 not in merged_nodes:
            merged_nodes[id1] = p1
        if id2 not in merged_nodes:
            merged_nodes[id2] = p2

        dist = haversine(p1, p2)

        if id1 != id2:
            graph[id1][id2] = dist
            graph[id2][id1] = dist

   
    return graph, merged_nodes



# =====================================================
# BASE DE DATOS
# =====================================================
Base.metadata.create_all(bind=engine)

# =====================================================
# FASTAPI
# =====================================================
app = FastAPI(title="API PathCycle ")

# =====================================================
# CORS
# =====================================================
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# ROOT
# =====================================================
@app.get("/")
def root():
    return {"mensaje": "API de PathCycle  funcionando con Ciclovias_Staging"}

# =====================================================
# CICLOVÍAS
# =====================================================
@app.get("/ciclovias", response_model=List[CicloviaSchema])
def listar_ciclovias(db: Session = Depends(get_db)):
    return db.query(Ciclovia).all()


@app.get("/ciclovias/{distrito}", response_model=Union[List[CicloviaSchema], dict])
def ciclovias_por_distrito(distrito: str, db: Session = Depends(get_db)):
    resultados = (
        db.query(Ciclovia)
        .filter(func.lower(Ciclovia.DISTRITO_CICLOVIA) == distrito.lower())
        .all()
    )
    if not resultados:
        return {"mensaje": f"No se encontraron ciclovías en el distrito '{distrito}'"}
    return resultados


@app.get("/ciclovias/tipo/{tipo_via}", response_model=Union[List[CicloviaSchema], dict])
def ciclovias_por_tipo(tipo_via: str, db: Session = Depends(get_db)):
    resultados = (
        db.query(Ciclovia)
        .filter(func.lower(Ciclovia.TIPO_VIA) == tipo_via.lower())
        .all()
    )
    if not resultados:
        return {"mensaje": f"No se encontraron ciclovías del tipo '{tipo_via}'"}
    return resultados


@app.get("/ciclovias/longitud/{min_km}", response_model=Union[List[CicloviaSchema], dict])
def ciclovias_por_longitud(min_km: float, db: Session = Depends(get_db)):
    try:
        resultados = db.query(Ciclovia).all()

        filtrados = []
        for c in resultados:
            try:
                valor = str(c.LONGITUD_KM).replace(",", ".").replace("km", "").strip()
                longitud = float(valor)
                if longitud >= min_km:
                    filtrados.append(c)
            except:
                continue

        if not filtrados:
            return {"mensaje": f"No se encontraron ciclovías con longitud ≥ {min_km} km"}

        return filtrados
    except Exception as e:
        return {"error": str(e)}


# =====================================================
# ACCIDENTES
# =====================================================
@app.get("/accidentes", response_model=List[ReporteAccidenteSchema])
def listar_accidentes(db: Session = Depends(get_db)):
    return db.query(ReporteAccidente).all()


@app.get("/accidentes/{distrito}", response_model=Union[List[ReporteAccidenteSchema], dict])
def accidentes_por_distrito(distrito: str, db: Session = Depends(get_db)):
    resultados = (
        db.query(ReporteAccidente)
        .filter(func.lower(ReporteAccidente.distrito) == distrito.lower())
        .all()
    )
    if not resultados:
        return {"mensaje": f"No se encontraron accidentes en '{distrito}'"}
    return resultados


@app.get("/accidentes/tipo/{tipo}", response_model=Union[List[ReporteAccidenteSchema], dict])
def accidentes_por_tipo(tipo: str, db: Session = Depends(get_db)):
    resultados = (
        db.query(ReporteAccidente)
        .filter(func.lower(ReporteAccidente.tipo_accidente) == tipo.lower())
        .all()
    )
    if not resultados:
        return {"mensaje": f"No se encontraron accidentes del tipo '{tipo}'"}
    return resultados


# =====================================================
# TRÁFICO
# =====================================================
@app.get("/trafico", response_model=List[TraficoSchema])
def listar_trafico(db: Session = Depends(get_db)):
    return db.query(Trafico).all()


@app.get("/trafico/{distrito}", response_model=Union[List[TraficoSchema], dict])
def trafico_por_distrito(distrito: str, db: Session = Depends(get_db)):
    resultados = (
        db.query(Trafico)
        .filter(func.lower(Trafico.distrito) == distrito.lower())
        .all()
    )
    if not resultados:
        return {"mensaje": f"No se encontraron registros de tráfico en '{distrito}'"}
    return resultados


@app.get("/trafico/tipo/{tipo_via}", response_model=Union[List[TraficoSchema], dict])
def trafico_por_tipo(tipo_via: str, db: Session = Depends(get_db)):
    resultados = (
        db.query(Trafico)
        .filter(func.lower(Trafico.tipo_via) == tipo_via.lower())
        .all()
    )
    if not resultados:
        return {"mensaje": f"No se encontraron registros de tráfico para '{tipo_via}'"}
    return resultados


# =====================================================
# RED – GRAFO COMPLETO
# =====================================================
@app.get("/red")
def generar_red(db: Session = Depends(get_db)):

    nodes = []
    links = []

    # ============================
    # CICLOVÍAS (group 1)
    # ============================
    ciclovias = db.query(Ciclovia).all()
    for c in ciclovias:
        nodes.append({
            "id": f"ciclovia_{c.id}",
            "name": c.NOMBRE_CICLOVIA,
            "group": 1,
            "longitud_km": c.LONGITUD_KM,
            "distrito": c.DISTRITO_CICLOVIA
        })

        links.append({
            "source": f"ciclovia_{c.id}",
            "target": f"distrito_{c.DISTRITO_CICLOVIA}",
            "value": 1
        })


    # ============================
    # ACCIDENTES (group 2)
    # ============================
    accidentes = db.query(ReporteAccidente).all()
    for a in accidentes:
        nodes.append({
            "id": f"accidente_{a.id}",
            "name": a.tipo_accidente,
            "group": 2,
            "heridos": a.numero_heridos,
            "fallecidos": a.numero_fallecidos,
            "distrito": a.distrito
        })

        links.append({
            "source": f"accidente_{a.id}",
            "target": f"distrito_{a.distrito}",
            "value": 1
        })


    # ============================
    # TRÁFICO (group 3)
    # ============================
    trafico = db.query(Trafico).all()
    for t in trafico:
        nodes.append({
            "id": f"trafico_{t.id}",
            "name": t.intensidad_trafico,
            "group": 3,
            "velocidad": t.velocidad_promedio,
            "distrito": t.distrito
        })

        links.append({
            "source": f"trafico_{t.id}",
            "target": f"distrito_{t.distrito}",
            "value": 1
        })


    # ============================
    # DISTRITOS (group 99)
    # ============================
    distritos = set(
        [c.DISTRITO_CICLOVIA for c in ciclovias] +
        [a.distrito for a in accidentes] +
        [t.distrito for t in trafico]
    )

    for d in distritos:
        nodes.append({
            "id": f"distrito_{d}",
            "name": d,
            "group": 99
        })

    return {
        "nodes": nodes,
        "links": links
    }


# =====================================================
# NODE CRITICALITY – CENTRALIDAD DE NODOS
# =====================================================
import networkx as nx

@app.get("/nodos-criticos")
def nodos_criticos(db: Session = Depends(get_db)):

    G = nx.Graph()

    # ======================
    #  CICLOVIAS
    # ======================
    for c in db.query(Ciclovia).all():
        n_c = f"ciclovia_{c.id}"
        n_d = f"distrito_{c.DISTRITO_CICLOVIA}"

        G.add_node(n_c, tipo="ciclovia", distrito=c.DISTRITO_CICLOVIA)
        G.add_node(n_d, tipo="distrito")

        G.add_edge(n_c, n_d)

    # ======================
    #  ACCIDENTES
    # ======================
    for a in db.query(ReporteAccidente).all():
        n_a = f"accidente_{a.id}"
        n_d = f"distrito_{a.distrito}"

        G.add_node(n_a, tipo="accidente")
        G.add_node(n_d, tipo="distrito")

        G.add_edge(n_a, n_d)

    # ======================
    #  TRAFICO
    # ======================
    for t in db.query(Trafico).all():
        n_t = f"trafico_{t.id}"
        n_d = f"distrito_{t.distrito}"

        G.add_node(n_t, tipo="trafico")
        G.add_node(n_d, tipo="distrito")

        G.add_edge(n_t, n_d)

    # ======================
    #  CENTRALIDADES
    # ======================
    grado = nx.degree_centrality(G)
    intermediacion = nx.betweenness_centrality(G, normalized=True)
    pr = nx.pagerank(G)

    top_n = 10

    return {
        "top_grado": sorted(
            [{"nodo": k, "valor": v} for k, v in grado.items()],
            key=lambda x: x["valor"],
            reverse=True
        )[:top_n],

        "top_intermediacion": sorted(
            [{"nodo": k, "valor": v} for k, v in intermediacion.items()],
            key=lambda x: x["valor"],
            reverse=True
        )[:top_n],

        "top_pagerank": sorted(
            [{"nodo": k, "valor": v} for k, v in pr.items()],
            key=lambda x: x["valor"],
            reverse=True
        )[:top_n],

        "total_nodos": len(G.nodes),
        "total_enlaces": len(G.edges),
    }


# =====================================================
# RED FILTRADA – OPCIÓN 1
# =====================================================
@app.get("/red-filtrada")
def red_filtrada(
    distrito: str | None = None,
    tipo_via: str | None = None,
    min_km: float | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Ciclovia)

    # FILTROS
    if distrito:
        query = query.filter(func.lower(Ciclovia.DISTRITO_CICLOVIA) == distrito.lower())

    if tipo_via:
        query = query.filter(func.lower(Ciclovia.TIPO_VIA) == tipo_via.lower())

    if min_km:
        # convertir strings raros "1,80", "1.80", "1.80km", etc
        ciclovias_all = query.all()
        filtradas = []
        for c in ciclovias_all:
            try:
                valor = str(c.LONGITUD_KM).replace("km", "").replace(",", ".").strip()
                longitud = float(valor)
                if longitud >= min_km:
                    filtradas.append(c)
            except:
                continue
        ciclovias = filtradas
    else:
        ciclovias = query.all()

    # === Construcción de nodos y enlaces ===
    nodes = []
    links = []

    # ciclovías
    for c in ciclovias:
        # nodo ciclovía
        nodes.append({
            "id": f"ciclovia_{c.id}",
            "name": c.NOMBRE_CICLOVIA,
            "group": 1,
            "longitud_km": c.LONGITUD_KM,
            "distrito": c.DISTRITO_CICLOVIA
        })

        # nodo distrito
        nodes.append({
            "id": f"distrito_{c.DISTRITO_CICLOVIA}",
            "name": c.DISTRITO_CICLOVIA,
            "group": 99
        })

        # enlace
        links.append({
            "source": f"ciclovia_{c.id}",
            "target": f"distrito_{c.DISTRITO_CICLOVIA}",
            "value": 1
        })

    # evitar nodos duplicados
    unique_nodes = list({n["id"]: n for n in nodes}.values())

    return {
        "nodes": unique_nodes,
        "links": links
    }


# =====================================================
# MÉTRICAS DEL GRAFO 
@app.get("/metrics")
def metrics(db: Session = Depends(get_db)):

    G = nx.Graph()

    # Construimos SOLO ciclovías (como ya lo tienes)
    for c in db.query(Ciclovia).all():
        n_c = f"ciclovia_{c.id}"
        n_d = f"distrito_{c.DISTRITO_CICLOVIA}"

        G.add_node(n_c, tipo="ciclovia")
        G.add_node(n_d, tipo="distrito")

        G.add_edge(n_c, n_d)

    # ---- MÉTRICAS ----
    components = list(nx.connected_components(G))
    main_component = max(components, key=len)

    num_nodes = len(G.nodes)
    num_edges = len(G.edges)

    densidad = 0
    if num_nodes > 1:
        densidad = round((2 * num_edges) / (num_nodes * (num_nodes - 1)), 4)

    return {
        "total_nodes": num_nodes,
        "total_edges": num_edges,
        "components_count": len(components),
        "largest_component_size": len(main_component),
        "largest_component_percent": round(len(main_component) / num_nodes, 3),
        "density": densidad
    }




@app.get("/ruta-optima")
def ruta_optima(
    lat_inicio: float,
    lon_inicio: float,
    lat_fin: float,
    lon_fin: float,
    db: Session = Depends(get_db)
):

    # 1. Traer ciclovías
    ciclovias = db.query(Ciclovia).all()

    # 2. Intersecciones reales
    segmentos_originales, intersecciones = detectar_intersecciones(ciclovias)

    # 3. Cortar los segmentos
    segmentos_divididos = dividir_segmentos_por_intersecciones(
        segmentos_originales,
        intersecciones
    )

    # 4. Reconstruir grafo base
    nodes = {}
    for s in segmentos_divididos:
        p1, p2 = s
        id1 = f"{p1[0]},{p1[1]}"
        id2 = f"{p2[0]},{p2[1]}"
        nodes[id1] = p1
        nodes[id2] = p2

    merged_nodes, mapping = merge_close_nodes(nodes)

    # Crear grafo vacío
    graph = {nid: {} for nid in merged_nodes.keys()}

    # Agregar aristas
    for s in segmentos_divididos:
        p1, p2 = s
        id1 = mapping.get(f"{p1[0]},{p1[1]}", f"{p1[0]},{p1[1]}")
        id2 = mapping.get(f"{p2[0]},{p2[1]}", f"{p2[0]},{p2[1]}")

        if id1 == id2:
            continue

        coord1 = merged_nodes[id1]  # (lon,lat)
        coord2 = merged_nodes[id2]

        dist = haversine((coord1[1], coord1[0]), (coord2[1], coord2[0]))

        graph[id1][id2] = dist
        graph[id2][id1] = dist

    # 5. Buscar nodos más cercanos
    def nearest_node(latp, lonp):
        best = None
        best_d = float("inf")
        for nid, coord in merged_nodes.items():
            d = haversine((latp, lonp), (coord[1], coord[0]))
            if d < best_d:
                best = nid
                best_d = d
        return best, best_d

    start, start_dist = nearest_node(lat_inicio, lon_inicio)
    end, end_dist = nearest_node(lat_fin, lon_fin)

    # 6. Detectar componentes
    def connected_components(g):
        seen = set()
        comps = []
        for nid in g:
            if nid in seen:
                continue
            stack = [nid]
            comp = set()
            while stack:
                u = stack.pop()
                if u not in comp:
                    comp.add(u)
                    seen.add(u)
                    stack.extend(g[u].keys())
            comps.append(comp)
        return comps

    comps = connected_components(graph)

    comp_of = {}
    for idx, comp in enumerate(comps):
        for n in comp:
            comp_of[n] = idx

    start_comp = comp_of.get(start, None)
    end_comp = comp_of.get(end, None)

    # 7. Si están en componentes separadas → intentar unirlas
    if start_comp is not None and end_comp is not None and start_comp != end_comp:

        comp_A = comps[start_comp]
        comp_B = comps[end_comp]

        min_pair = None
        min_d = float("inf")

        for a in comp_A:
            for b in comp_B:
                ca = merged_nodes[a]
                cb = merged_nodes[b]
                d = haversine((ca[1], ca[0]), (cb[1], cb[0]))
                if d < min_d:
                    min_d = d
                    min_pair = (a, b)

        bridge_threshold = 60  # metros

        if min_d <= bridge_threshold:
            a, b = min_pair
            graph[a][b] = min_d
            graph[b][a] = min_d
        else:
            # 🔴 CASO FINAL: NO EXISTE CONEXIÓN
            return {
                "error": "No existe ruta conectada entre esos puntos",
                "start_dist_m": start_dist,
                "end_dist_m": end_dist,
                "start_id": start,
                "end_id": end
            }

    # 8. Ejecutar Dijkstra
    path, dist = dijkstra(graph, start, end)

    if not path:
        return {
            "error": "No existe ruta conectada entre esos puntos",
            "start_id": start,
            "end_id": end
        }

    # 9. Construir coordenadas finales
    coords = [merged_nodes[n] for n in path]

    return {
        "inicio_nodo": {"lon": merged_nodes[start][0], "lat": merged_nodes[start][1]},
        "fin_nodo": {"lon": merged_nodes[end][0], "lat": merged_nodes[end][1]},
        "distance_m": dist,
        "path_coords": coords
    }





# ----------------------------
# Helpers: parse fechas y filtros
# ----------------------------
def parse_date_str(s: str):
    """Permite 'YYYYMMDD' o 'YYYY-MM-DD'"""
    if not s:
        return None
    s = s.strip()
    if "-" in s:
        try:
            return datetime.fromisoformat(s)
        except:
            return None
    else:
        # YYYYMMDD
        try:
            return datetime.strptime(s, "%Y%m%d")
        except:
            return None

def apply_district_filter(queryset, districts):
    if not districts:
        return queryset
    lowered = [d.strip().lower() for d in districts if d and d.strip()]
    return [r for r in queryset if getattr(r, "DISTRITO_CICLOVIA", getattr(r, "distrito", "")).lower() in lowered]

# ----------------------------
# Reutiliza las funciones de grafo/metrics ya definidas
# ----------------------------
def compute_metrics(db: Session):
    # reutiliza lógica de /metrics pero devuelve estructura python directamente
    import networkx as nx
    G = nx.Graph()
    for c in db.query(Ciclovia).all():
        n_c = f"ciclovia_{c.id}"
        n_d = f"distrito_{c.DISTRITO_CICLOVIA}"
        G.add_node(n_c, tipo="ciclovia")
        G.add_node(n_d, tipo="distrito")
        G.add_edge(n_c, n_d)
    components = list(nx.connected_components(G))
    if components:
        main_component = max(components, key=len)
    else:
        main_component = set()
    num_nodes = len(G.nodes)
    num_edges = len(G.edges)
    densidad = 0
    if num_nodes > 1:
        densidad = round((2 * num_edges) / (num_nodes * (num_nodes - 1)), 4)
    return {
        "total_nodes": num_nodes,
        "total_edges": num_edges,
        "components_count": len(components),
        "largest_component_size": len(main_component),
        "largest_component_percent": round(len(main_component) / num_nodes, 3) if num_nodes else 0,
        "density": densidad
    }

def build_network_data(db: Session, districts: Optional[list] = None):
    """Construye nodes/links combinando ciclovias, accidentes y trafico (puedes filtrar por districts)."""
    ciclovias = db.query(Ciclovia).all()
    accidentes = db.query(ReporteAccidente).all()
    trafico = db.query(Trafico).all()

    if districts:
        # filtrar
        ciclovias = apply_district_filter(ciclovias, districts)
        accidentes = [a for a in accidentes if a.distrito.lower() in [d.lower() for d in districts]]
        trafico = [t for t in trafico if t.distrito.lower() in [d.lower() for d in districts]]

    nodes = []
    links = []

    for c in ciclovias:
        nodes.append({
            "id": f"ciclovia_{c.id}",
            "label": c.NOMBRE_CICLOVIA,
            "type": "ciclovia",
            "distrito": c.DISTRITO_CICLOVIA,
            "longitud_km": c.LONGITUD_KM
        })
        links.append({"source": f"ciclovia_{c.id}", "target": f"distrito_{c.DISTRITO_CICLOVIA}", "value": 1})

    for a in accidentes:
        nodes.append({
            "id": f"accidente_{a.id}",
            "label": a.tipo_accidente,
            "type": "accidente",
            "distrito": a.distrito,
            "heridos": a.numero_heridos,
            "fallecidos": a.numero_fallecidos
        })
        links.append({"source": f"accidente_{a.id}", "target": f"distrito_{a.distrito}", "value": 1})

    for t in trafico:
        nodes.append({
            "id": f"trafico_{t.id}",
            "label": t.intensidad_trafico,
            "type": "trafico",
            "distrito": t.distrito,
            "velocidad": t.velocidad_promedio
        })
        links.append({"source": f"trafico_{t.id}", "target": f"distrito_{t.distrito}", "value": 1})

    # distritos
    distritos = set(
        [c.DISTRITO_CICLOVIA for c in ciclovias] +
        [a.distrito for a in accidentes] +
        [t.distrito for t in trafico]
    )
    for d in distritos:
        nodes.append({"id": f"distrito_{d}", "label": d, "type": "distrito"})

    # eliminar duplicados por id (mantener último)
    unique = {}
    for n in nodes:
        unique[n["id"]] = n
    nodes = list(unique.values())

    return {"nodes": nodes, "links": links}

# ----------------------------
# HTML builder (simple, extensible)
# ----------------------------
def generate_report_html(options: ReportRequestSchema, db: Session):
    # Data fetch
    date_from = parse_date_str(options.date_from) if options.date_from else None
    date_to = parse_date_str(options.date_to) if options.date_to else None
    districts = options.districts

    # Fetch filtered data (for simplicity, we filter on Python lists)
    ciclovias = db.query(Ciclovia).all()
    accidentes = db.query(ReporteAccidente).all()
    trafico = db.query(Trafico).all()

    if districts:
        ciclovias = apply_district_filter(ciclovias, districts)
        accidentes = [a for a in accidentes if a.distrito.lower() in [d.lower() for d in districts]]
        trafico = [t for t in trafico if t.distrito.lower() in [d.lower() for d in districts]]

    # Start HTML
    html_parts = []
    html_parts.append("<!doctype html><html><head><meta charset='utf-8'><title>Reporte PathCycle</title>")
    # Basic styles for PDF
    html_parts.append("""
    <style>
      body{font-family: Arial, Helvetica, sans-serif; margin:20px; color:#222}
      h1,h2,h3{color:#0f766e}
      table{border-collapse:collapse;width:100%; margin-bottom:16px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      .section{margin-bottom:28px}
      .muted{color:#666;font-size:0.9em}
    </style>
    """)
    html_parts.append("</head><body>")

    # Header
    html_parts.append(f"<h1>Reporte — {html.escape(options.report_type)}</h1>")
    html_parts.append(f"<div class='muted'>Generado: {datetime.utcnow().isoformat()} UTC</div>")

    # Resumen ejecutivo
    if options.include_summary:
        html_parts.append("<div class='section'><h2>Resumen ejecutivo</h2>")
        total_ciclo = len(ciclovias)
        total_acc = len(accidentes)
        total_traf = len(trafico)
        html_parts.append(f"<p>Total ciclovías analizadas: <strong>{total_ciclo}</strong></p>")
        html_parts.append(f"<p>Total incidentes registrados: <strong>{total_acc}</strong></p>")
        html_parts.append(f"<p>Total registros de tráfico: <strong>{total_traf}</strong></p>")
        html_parts.append("</div>")

    # Mapa general (en HTML insertamos un placeholder; el frontend puede renderizar Mapbox si quiere)
    if options.include_maps:
        html_parts.append("<div class='section'><h2>Mapa general</h2>")
        html_parts.append("<p class='muted'>A continuación se incluye la geometría de inicio/fin de cada ciclovía. Renderiza este HTML en el frontend para mostrar un mapa interactivo (Mapbox/Leaflet).</p>")
        # Lista de puntos (puedes convertirlo a GeoJSON si lo prefieres)
        html_parts.append("<table><thead><tr><th>Id</th><th>Nombre</th><th>Distrito</th><th>Lat inicio</th><th>Lon inicio</th><th>Lat fin</th><th>Lon fin</th></tr></thead><tbody>")
        for c in ciclovias:
            html_parts.append(f"<tr><td>{c.id}</td><td>{html.escape(c.NOMBRE_CICLOVIA or '')}</td><td>{html.escape(c.DISTRITO_CICLOVIA or '')}</td><td>{c.lat_inicio or ''}</td><td>{c.lon_inicio or ''}</td><td>{c.lat_fin or ''}</td><td>{c.lon_fin or ''}</td></tr>")
        html_parts.append("</tbody></table></div>")

        # Mapas por distrito: resumen rápido
        html_parts.append("<div class='section'><h3>Mapas por distrito (resumen)</h3>")
        distr_counts = {}
        for c in ciclovias:
            d = c.DISTRITO_CICLOVIA or "N/A"
            distr_counts[d] = distr_counts.get(d, 0) + 1
        html_parts.append("<ul>")
        for d, cnt in distr_counts.items():
            html_parts.append(f"<li>{html.escape(d)}: {cnt} ciclovía(s)</li>")
        html_parts.append("</ul></div>")

    # Accidentes
    if options.include_maps:
        html_parts.append("<div class='section'><h2>Accidentes</h2>")
        if accidentes:
            html_parts.append("<table><thead><tr><th>Id</th><th>Distrito</th><th>Tipo</th><th>Heridos</th><th>Fallecidos</th><th>Fecha</th><th>Hora</th></tr></thead><tbody>")
            for a in accidentes:
                html_parts.append(f"<tr><td>{a.id}</td><td>{html.escape(a.distrito or '')}</td><td>{html.escape(a.tipo_accidente or '')}</td><td>{a.numero_heridos}</td><td>{a.numero_fallecidos}</td><td>{html.escape(str(a.fecha) or '')}</td><td>{html.escape(str(a.hora) or '')}</td></tr>")
            html_parts.append("</tbody></table>")
        else:
            html_parts.append("<p>No hay registros de accidentes para los filtros aplicados.</p>")
        html_parts.append("</div>")

    # Tráfico
    if options.include_maps:
        html_parts.append("<div class='section'><h2>Tráfico</h2>")
        if trafico:
            html_parts.append("<table><thead><tr><th>Id</th><th>Distrito</th><th>Nivel</th><th>Velocidad</th><th>Horario</th><th>Fecha</th></tr></thead><tbody>")
            for t in trafico:
                html_parts.append(f"<tr><td>{t.id}</td><td>{html.escape(t.distrito or '')}</td><td>{html.escape(t.intensidad_trafico or '')}</td><td>{t.velocidad_promedio}</td><td>{html.escape(t.hora_pico or '')}</td><td>{html.escape(str(t.fecha) or '')}</td></tr>")
            html_parts.append("</tbody></table>")
        else:
            html_parts.append("<p>No hay registros de tráfico para los filtros aplicados.</p>")
        html_parts.append("</div>")

    # Métricas algorítmicas
    if options.include_metrics:
        metrics = compute_metrics(db)
        html_parts.append("<div class='section'><h2>Métricas algorítmicas</h2>")
        html_parts.append("<table><tbody>")
        for k, v in metrics.items():
            html_parts.append(f"<tr><th style='width:40%'>{html.escape(str(k))}</th><td>{html.escape(str(v))}</td></tr>")
        html_parts.append("</tbody></table></div>")

    # Gráficos de conectividad (incluir tabla nodes/links)
    if options.include_graph:
        net = build_network_data(db, districts)
        html_parts.append("<div class='section'><h2>Gráficos de conectividad</h2>")
        html_parts.append("<p class='muted'>Se incluyen nodos y enlaces. Para visualizar en frontend: convierta a formato de su librería (D3/Force/Mapbox).</p>")
        # Small summary
        html_parts.append(f"<p>Nodos totales: {len(net['nodes'])} — Enlaces totales: {len(net['links'])}</p>")
        # Incluir un JSON embebido (para facilitar render en frontend)
        import json
        html_parts.append("<pre style='max-height:300px;overflow:auto;background:#f6f8fa;padding:10px;border:1px solid #eee'>")
        html_parts.append(html.escape(json.dumps(net, indent=2, ensure_ascii=False)))
        html_parts.append("</pre></div>")

    # Footer
    html_parts.append("<div class='muted' style='margin-top:30px'>Reporte generado por PathCycle</div>")

    html_parts.append("</body></html>")
    return "".join(html_parts)

# ----------------------------
# Endpoint: preview
# ----------------------------
@app.post("/reports/preview")
def reports_preview(payload: ReportRequestSchema = Body(...), db: Session = Depends(get_db)):
    """
    Genera el HTML del reporte según la configuración y lo devuelve.
    El frontend puede mostrar el HTML en un iframe (srcDoc) para preview.
    """
    html_content = generate_report_html(payload, db)
    return {"html": html_content}

# ----------------------------
# Endpoint: save report
# ----------------------------


@app.post("/reports/save", response_model=ReportSavedResponse)
def reports_save(payload: SaveReportRequest, db: Session = Depends(get_db)):
    try:
        # 🔥 Decodificar HTML Base64
        decoded_html = base64.b64decode(payload.html).decode("utf-8")
    except:
        decoded_html = payload.html  # si ya viene normal

    r = ReportSaved(
        title=payload.title,
        html=decoded_html,
        export_format=payload.export_format
    )

    db.add(r)
    db.commit()
    db.refresh(r)
    return r

# ----------------------------
# Endpoint: recent reports
# ----------------------------
@app.get("/reports/recent", response_model=List[ReportSavedResponse])
def reports_recent(limit: int = 10, db: Session = Depends(get_db)):
    rows = db.query(ReportSaved).order_by(ReportSaved.created_at.desc()).limit(limit).all()
    return rows


@app.get("/reports/download/{report_id}")
def reports_download(report_id: int, db: Session = Depends(get_db)):
    """
    Devuelve el archivo del reporte (HTML o PDF) según el formato guardado.
    """
    r = db.query(ReportSaved).filter(ReportSaved.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    # =====================================
    # 1) Decodificar HTML si está en Base64
    # =====================================
    html_content = r.html

    try:
        # Intenta decodificar Base64
        html_content = base64.b64decode(html_content).decode("utf-8")
    except Exception:
        # Si falla, se asume que ya es texto normal
        pass

    # =====================================
    # 2) HTML
    # =====================================
    if r.export_format == "html":
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".html")
        tmp.write(html_content.encode("utf-8"))
        tmp.close()

        return StreamingResponse(
            open(tmp.name, "rb"),
            media_type="text/html",
            headers={
                "Content-Disposition": f"attachment; filename=reporte_{report_id}.html",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Expose-Headers": "Content-Disposition",
            }
        )

    # =====================================
    # 3) PDF
    # =====================================
    elif r.export_format == "pdf":
        tmp_html = tempfile.NamedTemporaryFile(delete=False, suffix=".html")
        tmp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")

        # Guardar HTML temporal
        tmp_html.write(html_content.encode("utf-8"))
        tmp_html.close()

        # Convertir HTML → PDF
        try:
            pdfkit.from_file(tmp_html.name, tmp_pdf.name)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generando PDF: {str(e)}")

        return StreamingResponse(
            open(tmp_pdf.name, "rb"),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=reporte_{report_id}.pdf",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Expose-Headers": "Content-Disposition",
            }
        )

    # =====================================
    # 4) Formato inválido
    # =====================================
    else:
        raise HTTPException(status_code=400, detail="Formato no soportado")
