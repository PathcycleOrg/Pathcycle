"use client"

import { Search, Bell, ChevronDown } from "lucide-react"

interface HeaderProps {
  currentPage: string
}

export default function Header({ currentPage }: HeaderProps) {
  const pageLabels: Record<string, string> = {
    dashboard: "Vista General",
    "network-analysis": "Análisis de Red",
    simulator: "Simulador de Escenarios",
    reports: "Generador de Reportes",
    "optimal-route": "Ruta Óptima",
    settings: "Configuración",
  }

  return (
    <header className="bg-white border-b border-pathcycle-gray-100 h-16 flex-shrink-0 flex items-center justify-between px-6">
      {/* Breadcrumb */}
      <div>
        <span className="text-sm text-pathcycle-gray-400">Dashboard /</span>
        <span className="text-sm font-medium text-pathcycle-gray-800 ml-1">
          {pageLabels[currentPage] || "Dashboard"}
        </span>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-sm relative mx-8">
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-pathcycle-gray-50 border border-pathcycle-gray-200 rounded-lg focus:ring-2 focus:ring-pathcycle-primary/50 focus:border-pathcycle-primary outline-none"
        />
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-pathcycle-gray-400" />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="relative text-pathcycle-gray-400 hover:text-pathcycle-gray-800 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-pathcycle-danger ring-1 ring-white"></span>
        </button>

        <button className="flex items-center gap-2">
          <img src="/abstract-geometric-shapes.png" alt="User Avatar" className="w-8 h-8 rounded-full" />
          <span className="hidden md:block text-sm font-medium">Usuario...</span>
          <ChevronDown className="w-4 h-4 text-pathcycle-gray-400" />
        </button>
      </div>
    </header>
  )
}
