# main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Float
from typing import List, Union

from .database import Base, engine, get_db
from .models import Ciclovia, ReporteAccidente, Trafico
from .schemas import CicloviaSchema, ReporteAccidenteSchema, TraficoSchema

# =========================
# CONFIGURACIÓN INICIAL
# =========================
Base.metadata.create_all(bind=engine)

app = FastAPI(title="API PathCycle 🚴‍♀️")

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# ROOT
# =========================
@app.get("/")
def root():
    return {"mensaje": "API de PathCycle 🚴‍♂️ funcionando con Ciclovias_Staging"}

# =========================
# CICLOVÍAS
# =========================
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
    resultados = (
        db.query(Ciclovia)
        .filter(cast(Ciclovia.LONGITUD_KM, Float) >= min_km)
        .all()
    )
    if not resultados:
        return {"mensaje": f"No se encontraron ciclovías con longitud mayor a {min_km} km"}
    return resultados

# =========================
# ACCIDENTES
# =========================
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
        return {"mensaje": f"No se encontraron accidentes en el distrito '{distrito}'"}
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

# =========================
# TRÁFICO
# =========================
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
        return {"mensaje": f"No se encontraron registros de tráfico para el tipo '{tipo_via}'"}
    return resultados
