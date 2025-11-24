# models.py
from sqlalchemy import Column, String, Float, Integer, Date, Time
from .database import Base  # Asegúrate de importar tu Base desde donde la defines

class Ciclovia(Base):
    __tablename__ = "Ciclovias"

    # Usamos UBIGEO como clave primaria, ya que no hay columna id.
    UBIGEO = Column(String(10), primary_key=True, index=True)

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
    fecha = Column(Date)
