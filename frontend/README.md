# PathCycle - Sistema de Análisis de Ciclovías

## 🚲 Descripción

PathCycle es una aplicación web desarrollada con Next.js que permite analizar y visualizar la red de ciclovías de Lima Metropolitana. La aplicación incluye funcionalidades como:

- Visualización interactiva de ciclovías en mapa
- Análisis de conectividad de la red
- Identificación de puntos críticos
- Simulación de impacto de nuevas ciclovías
- Generación de reportes y métricas
- Planificación de rutas óptimas

## 🛠 Requisitos Previos

Asegúrate de tener instalado:

- Node.js (versión 18 o superior)
- npm o pnpm
- Git

## ⚙ Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd CA_ProyectoFinal
```

2. Instala las dependencias:
```bash
# Si usas npm
npm install --legacy-peer-deps

# Si usas pnpm
pnpm install --no-strict-peer-deps
```

> **Nota**: Los flags `--legacy-peer-deps` o `--no-strict-peer-deps` son necesarios debido a algunas incompatibilidades de versiones entre las dependencias.

3. Configura las variables de entorno:
   - Crea un archivo `.env.local` en la raíz del proyecto
   - Añade las siguientes variables:
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoianVhbmFuZHJlc3BlcmV6IiwiYSI6ImNscG9iMnQzdjBxbnYyanBkZjRlcmJuOG4ifQ.ziOIwQibswDz8lwnpFQaig
```

## 🚀 Ejecución

1. Inicia el servidor de desarrollo:
```bash
# Si usas npm
npm run dev

# Si usas pnpm
pnpm dev
```

2. Abre tu navegador y visita:
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
CA_ProyectoFinal/
├── app/                      # Rutas y layouts de la aplicación
├── components/              
│   ├── layout/              # Componentes de estructura (header, sidebar)
│   ├── pages/               # Componentes específicos de página
│   └── ui/                  # Componentes reutilizables
├── lib/                     # Utilidades y funciones helpers
├── public/                  # Archivos estáticos
└── styles/                  # Estilos globales
```

## 🔍 Páginas Principales

- `/` - Dashboard principal
- `/simulador` - Simulación de nuevas ciclovías
- `/analisis-red` - Análisis de conectividad
- `/ruta-optima` - Planificación de rutas
- `/reportes` - Generación de reportes
- `/configuracion` - Ajustes del sistema

## 🛠 Stack Tecnológico

- **Framework**: Next.js 14
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **UI Components**: 
  - Radix UI
  - Shadcn/ui
- **Mapas**: Mapbox GL
- **Gráficos**: 
  - React Force Graph
  - Recharts
- **State Management**: React Hooks
- **Forms**: React Hook Form
- **Validación**: Zod

## 🤝 Contribución

1. Crea una rama para tu feature:
```bash
git checkout -b feature/nombre-feature
```

2. Realiza tus cambios y haz commit:
```bash
git add .
git commit -m "feat: descripción del cambio"
```

3. Sube tus cambios y crea un Pull Request

## 🐛 Problemas Conocidos

1. El componente de expansión del mapa en el dashboard necesita ajustes en su comportamiento de scroll y layout.
2. [Otros problemas conocidos por documentar]

## 📝 Notas Adicionales

- La aplicación está en desarrollo activo
- Se recomienda usar Node.js 18+ para evitar problemas de compatibilidad
- En caso de problemas con las dependencias, intenta borrar `node_modules/` y el archivo de lock antes de reinstalar

## 📄 Licencia

[Tipo de Licencia]

## 👥 Equipo

[Nombres de los miembros del equipo]