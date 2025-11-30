# models.py
from sqlalchemy import Column, String, Float, Integer, Date, Time, Text, DateTime
from .database import Base
from datetime import datetime


class Ciclovia(Base):
    __tablename__ = "Ciclovias"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    UBIGEO = Column(String(10))

    DEPARTAMENTO = Column(String(100))
    PROVINCIA = Column(String(100))
    DISTRITO = Column(String(100))
    CANTIDAD = Column(String(50))
    NOMBRE_CICLOVIA = Column(String(255))
    TRAMO = Column(String)
    DISTRITO_CICLOVIA = Column(String(100))
    TIPO_VIA = Column(String(100))
    LONGITUD_KM = Column(String(50))  # Es texto, aunque represente un número
    FECHA_CORTE = Column(String(50))
    lat_inicio = Column(Float, nullable=True)
    lon_inicio = Column(Float, nullable=True)
    lat_fin = Column(Float, nullable=True)
    lon_fin = Column(Float, nullable=True)


class ReporteAccidente(Base):
    __tablename__ = "reportes_accidentes_lima"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    distrito = Column(String(100))
    tipo_via = Column(String(100))
    tipo_accidente = Column(String(100))
    numero_heridos = Column(Integer)
    numero_fallecidos = Column(Integer)
    fecha = Column(String(50))  # Cambiado de Date a String
    hora = Column(String(50))   # Cambiado de Time a String



class Trafico(Base):
    __tablename__ = "trafico_lima_dataset"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    distrito = Column(String(100))
    tipo_via = Column(String(100))
    intensidad_trafico = Column(String(50))
    velocidad_promedio = Column(Float)
    hora_pico = Column(String(50))
    fecha = Column(String(50))


class ReportSaved(Base):
    __tablename__ = "reports_saved"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255))
    html = Column(Text)           # Guardamos HTML del reporte
    export_format = Column(String(10), default="html")
    created_at = Column(DateTime, default=datetime.utcnow)