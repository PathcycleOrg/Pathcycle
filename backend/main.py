# main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Union

from .database import Base, engine, get_db
from .models import Ciclovia, ReporteAccidente, Trafico
from .schemas import CicloviaSchema, ReporteAccidenteSchema, TraficoSchema

import math
import heapq

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

def merge_close_nodes(nodes, threshold=3):
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
            if abs((d1 + d2) - d_total) < 2:  # margen de 2 metros
                cortes.append(inter)

        # Ordenar cortes por distancia
        cortes.sort(key=lambda x: haversine(p1, x))

        # Construir los segmentos finales
        puntos = [p1] + cortes + [p2]
        for i in range(len(puntos) - 1):
            nuevos_segmentos.append((puntos[i], puntos[i+1]))

    return nuevos_segmentos


# ============================================================
# 7. Construcción del grafo final
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

    # -------------------------------
    # 1. Snapping / Merge nodos
    # -------------------------------
    merged_nodes, mapping = merge_close_nodes(nodes)

    # -------------------------------
    # 2. Detectar intersecciones
    # -------------------------------
    segmentos, inters = detectar_intersecciones(ciclovias)

    # -------------------------------
    # 3. Cortar segmentos por intersecciones
    # -------------------------------
    segmentos_finales = dividir_segmentos_por_intersecciones(segmentos, inters)

    # -------------------------------
    # 4. Agregar intersecciones al merge de nodos
    # -------------------------------
    for inter in inters:
        id_inter = f"{inter[0]},{inter[1]}"
        merged_nodes[id_inter] = inter

    # -------------------------------
    # 5. Crear grafo vacío
    # -------------------------------
    graph = {nid: {} for nid in merged_nodes}

    # -------------------------------
    # 6. Crear aristas del grafo
    # -------------------------------
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

    # -------------------------------
    # 7. Retornar grafo listo
    # -------------------------------
    return graph, merged_nodes



# =====================================================
# BASE DE DATOS
# =====================================================
Base.metadata.create_all(bind=engine)

# =====================================================
# FASTAPI
# =====================================================
app = FastAPI(title="API PathCycle 🚴‍♀️")

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
    return {"mensaje": "API de PathCycle 🚴‍♂️ funcionando con Ciclovias_Staging"}

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
    # 1. Traer ciclovías desde la BD
    ciclovias = db.query(Ciclovia).all()

    # 2. Detectar intersecciones reales
    segmentos_originales, intersecciones = detectar_intersecciones(ciclovias)

    # 3. Cortar los segmentos en cada punto de cruce
    segmentos_divididos = dividir_segmentos_por_intersecciones(
        segmentos_originales,
        intersecciones
    )

    # 4. Reconstruir grafo usando segmentos divididos
    #    IMPORTANTE: construir_grafo usa Ciclovia, así que lo adaptamos aquí
    nodes = {}
    graph = {}

    # Crear nodos únicos
    for s in segmentos_divididos:
        p1, p2 = s
        id1 = f"{p1[0]},{p1[1]}"
        id2 = f"{p2[0]},{p2[1]}"
        nodes[id1] = p1
        nodes[id2] = p2

    # Unificar nodos cercanos
    merged_nodes, mapping = merge_close_nodes(nodes)

    # Construir grafo vacío
    graph = {nid: {} for nid in merged_nodes.keys()}

    # Agregar aristas
    for s in segmentos_divididos:
        p1, p2 = s

        id1 = mapping[f"{p1[0]},{p1[1]}"]
        id2 = mapping[f"{p2[0]},{p2[1]}"]

        if id1 == id2:
            continue

        dist = haversine(merged_nodes[id1], merged_nodes[id2])
        graph[id1][id2] = dist
        graph[id2][id1] = dist

    # 5. Buscar nodo más cercano al punto inicial
    start = min(
        merged_nodes.keys(),
        key=lambda n: haversine((lon_inicio, lat_inicio), merged_nodes[n])
    )

    # 6. Buscar nodo más cercano al punto final
    end = min(
        merged_nodes.keys(),
        key=lambda n: haversine((lon_fin, lat_fin), merged_nodes[n])
    )

    # 7. Ejecutar Dijkstra
    path, dist = dijkstra(graph, start, end)

    if not path:
        return {"error": "No existe ruta conectada entre esos puntos"}

    # 8. Convertir IDs en coordenadas
    coords = [merged_nodes[p] for p in path]

    return {
        "inicio_nodo": start,
        "fin_nodo": end,
        "distance_m": dist,
        "path_coords": coords
    }
