# Pathcycle — Ejecución local rápida

Este README explica de forma breve y sencilla cómo levantar el full stack (DB, backend y frontend) para desarrollo local.

**Resumen rápido:**
- Backend: FastAPI (puerto `8001`) — ejecutar desde la raíz del repo.
- Frontend: Next.js (pnpm) — carpeta `frontend`, puerto `3000`.
- Base de datos: SQL Server (docker-compose incluido en `backend/docker-compose.yml`).

Requisitos
- Windows (PowerShell o cmd)
- Python 3.11+ (recomendado 3.11 o 3.12+)
- Node.js 18+ y `pnpm` (para frontend)
- Docker (para levantar la base de datos con `docker-compose`)

Pasos (rápido)

1) Clonar y situarse en el proyecto

```powershell
cd "E:\Ciclo 4\Complejidad Algoritmica\Proyecto\Pathcycle-main"
```

2) Levantar la base de datos (opcional: si ya tiene SQL Server, puede omitir)

```powershell
# Desde la carpeta backend (contiene docker-compose.yml)
cd backend
docker-compose up -d
# Espere unos segundos para que SQL Server inicialice
```

3) Configurar variables de entorno

- Crear un archivo `.env` en la raíz del proyecto o en `backend/` (según configuración). Ejemplo mínimo:

```
# ejemplo .env (ajuste según su entorno)
DATABASE_HOST=127.0.0.1
DATABASE_PORT=1433
DATABASE_NAME=Ciclovias_Staging
DATABASE_USER=sa
DATABASE_PASSWORD=YourStrong!Passw0rd
API_PORT=8001
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001
```

(El backend usa `python-dotenv` para leer `.env`.)

4) Backend: crear/activar entorno virtual e instalar dependencias

PowerShell (recomendado):

```powershell
# desde la raíz del repo
cd backend
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r ..\requirements.txt
# ejecutar el servidor FastAPI (desde la raíz del repo para evitar import issues)
cd ..
. backend\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --port 8001
```

CMD (si prefiere cmd.exe):

```cmd
cd backend
python -m venv .venv
backend\.venv\Scripts\activate
pip install -r ..\requirements.txt
cd ..
backend\.venv\Scripts\activate
python -m uvicorn backend.main:app --reload --port 8001
```

Nota: si ve errores de importación, asegúrese de ejecutar `uvicorn` desde la raíz del repositorio (ruta `Pathcycle-main`) como se muestra.

5) Frontend: instalar dependencias y ejecutar (en otra terminal)

```powershell
cd frontend
pnpm install
pnpm dev
# Abra http://localhost:3000
```

6) Pruebas rápidas
- Endpoint nodos críticos: `GET http://127.0.0.1:8001/nodos-criticos`
- Reportes:
  - POST `http://127.0.0.1:8001/reports/preview` para obtener HTML de vista previa
  - POST `http://127.0.0.1:8001/reports/save` para guardar
  - GET `http://127.0.0.1:8001/reports/list` para listar reportes guardados

Notas y recomendaciones
- Si necesita Pagerank completo de NetworkX, instale `scipy` en el venv del backend:

```powershell
. .venv\Scripts\Activate.ps1
pip install scipy
```

- PowerShell: para ejecutar scripts de política (opcional), puede necesitar abrir PowerShell como Administrador para `Set-ExecutionPolicy -Scope LocalMachine`.

- Si el frontend muestra una advertencia sobre el "workspace root" debido a múltiples lockfiles, es solo una advertencia; el servidor Next debe funcionar normalmente.


- Nota para producción: considerar almacenar los reportes exportados en un blob/storage y generar PDFs en el servidor en lugar de usar el método de impresión del cliente.