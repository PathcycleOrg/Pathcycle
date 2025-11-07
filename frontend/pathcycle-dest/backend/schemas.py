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

    class Config:
        orm_mode = True


class ReporteAccidenteSchema(BaseModel):
    DISTRITO: str
    TIPO_VIA: str
    TIPO_ACCIDENTE: str
    NUMERO_HERIDOS: str
    NUMERO_FALLECIDOS: str
    FECHA: str
    HORA: str

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
