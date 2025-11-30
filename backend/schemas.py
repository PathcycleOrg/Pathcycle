# schemas.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CicloviaSchema(BaseModel):
    UBIGEO: str
    DEPARTAMENTO: str
    PROVINCIA: str
    DISTRITO: str
    CANTIDAD: str
    NOMBRE_CICLOVIA: str
    TRAMO: Optional[str]
    DISTRITO_CICLOVIA: str
    TIPO_VIA: str
    LONGITUD_KM: str
    FECHA_CORTE: str
    lat_inicio: Optional[float] = None
    lon_inicio: Optional[float] = None
    lat_fin: Optional[float] = None
    lon_fin: Optional[float] = None


    class Config:
        orm_mode = True


class ReporteAccidenteSchema(BaseModel):
    distrito: str
    tipo_via: str
    tipo_accidente: str
    numero_heridos: str
    numero_fallecidos: str
    fecha: str
    hora: str

    class Config:
        orm_mode = True


class TraficoSchema(BaseModel):
    distrito: str
    tipo_via: str
    intensidad_trafico: str
    velocidad_promedio: float
    hora_pico: str
    fecha: str

    class Config:
        orm_mode = True


class ReportRequestSchema(BaseModel):
    report_type: str                    # "Análisis completo", "Comparación...", "Escenario propuesto"
    include_summary: bool = True
    include_metrics: bool = True
    include_maps: bool = True
    include_graph: bool = True
    date_from: Optional[str] = None     # "YYYYMMDD" o "YYYY-MM-DD"
    date_to: Optional[str] = None
    districts: Optional[List[str]] = None
    export_format: Optional[str] = "html"  # html | pdf

class SaveReportRequest(BaseModel):
    title: str
    html: str
    export_format: Optional[str] = "html"

class ReportSavedResponse(BaseModel):
    id: int
    title: str
    export_format: str
    created_at: datetime

    class Config:
        orm_mode = True