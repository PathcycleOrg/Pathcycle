# Guía de Instalación - PathCycle

Este documento contiene las instrucciones para instalar y configurar el proyecto PathCycle en tu PC.

## ✅ Instalación Completada

Las siguientes dependencias ya han sido instaladas:

### Backend (Python)
- ✅ Entorno virtual creado en `venv/`
- ✅ Todas las dependencias de Python instaladas desde `requirements.txt`
- ✅ FastAPI, SQLAlchemy, pandas, numpy, pyodbc, etc.

### Frontend (React)
- ✅ Todas las dependencias de Node.js instaladas en `frontend/`
- ✅ React, Leaflet, Recharts, axios, etc.

### Base de Datos
- ✅ Contenedor Docker de SQL Server 2022 levantado

## ✅ Driver ODBC para macOS - INSTALADO

El **Microsoft ODBC Driver 18 for SQL Server** ha sido instalado y configurado correctamente.

### Verificación

Puedes verificar que el driver esté disponible con:

```bash
# Verificar con odbcinst
odbcinst -q -d

# Verificar con Python (en el entorno virtual)
source venv/bin/activate
python3 -c "import pyodbc; print([d for d in pyodbc.drivers() if 'SQL Server' in d])"
```

Deberías ver:
```
[ODBC Driver 18 for SQL Server]
```

## 🚀 Cómo Ejecutar el Proyecto

### 1. Activar el Entorno Virtual de Python

```bash
cd /Users/pieroantonioaguilaranticona/Documents/ProyectoCA/Pathcycle
source venv/bin/activate
```

### 2. Iniciar SQL Server (si no está corriendo)

```bash
cd backend
docker-compose up -d
```

Verificar que esté corriendo:
```bash
docker ps | grep sqlserver
```

### 3. Iniciar el Backend (FastAPI)

```bash
cd backend
source ../venv/bin/activate  # Si no está activado
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

El backend estará disponible en: http://localhost:8000
Documentación API: http://localhost:8000/docs

### 4. Iniciar el Frontend (React)

En una nueva terminal:

```bash
cd frontend
npm start
```

El frontend estará disponible en: http://localhost:3000

## 📝 Notas Importantes

1. **Contraseña de SQL Server**: La contraseña configurada en `docker-compose.yml` es `TuNuevaContraseñaSegura123!`. Asegúrate de que coincida con la configuración en `backend/database.py`.

2. **Base de Datos**: El proyecto espera una base de datos llamada `Ciclovias_Staging` en SQL Server. Asegúrate de que exista o créala si es necesario.

3. **CORS**: El backend está configurado para aceptar peticiones desde cualquier origen (`allow_origins=["*"]`). En producción, deberías restringir esto.

4. **Variables de Entorno**: Actualmente la conexión a la BD está hardcodeada en `database.py`. Para producción, considera usar un archivo `.env` con `python-dotenv`.

## 🔧 Solución de Problemas

### Error: "No module named 'pyodbc'"
- Asegúrate de tener el entorno virtual activado: `source venv/bin/activate`

### Error: "Driver not found" o problemas de conexión a SQL Server
- Verifica que el driver ODBC esté instalado (ver sección anterior)
- Verifica que el contenedor de SQL Server esté corriendo: `docker ps`

### Error: "Port 1433 already in use"
- Otro servicio está usando el puerto. Detén el contenedor: `docker-compose down`
- O cambia el puerto en `docker-compose.yml`

### Error: "Database does not exist"
- Conéctate a SQL Server y crea la base de datos `Ciclovias_Staging`
- O modifica la cadena de conexión en `database.py` para usar una base de datos existente

## 📚 Recursos

- [Documentación FastAPI](https://fastapi.tiangolo.com/)
- [Documentación SQLAlchemy](https://docs.sqlalchemy.org/)
- [Documentación React](https://react.dev/)
- [Documentación Leaflet](https://leafletjs.com/)
- [Documentación Recharts](https://recharts.org/)

