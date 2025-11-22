# schemas.py
from pydantic import BaseModel
from typing import Optional

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
