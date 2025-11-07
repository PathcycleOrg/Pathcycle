"use client"

import { Bike, LayoutDashboard, Map, RotateCw, FileText, Route, Settings } from "lucide-react"

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "network-analysis", label: "Análisis de Red", icon: Map },
    { id: "simulator", label: "Simulador", icon: RotateCw },
    { id: "reports", label: "Reportes", icon: FileText },
    { id: "optimal-route", label: "Ruta Óptima", icon: Route },
    { id: "settings", label: "Configuración", icon: Settings },
  ]

  return (
    <aside className="w-60 bg-pathcycle-sidebar text-white flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center px-4 gap-2 border-b border-white/10">
        <Bike className="w-7 h-7" />
        <span className="text-2xl font-bold tracking-tight">PathCycle</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <img src="/diverse-user-avatars.png" alt="User Avatar" className="w-10 h-10 rounded-full" />
          <div>
            <p className="text-sm font-medium">Usuario Planificador</p>
            <p className="text-xs text-white/70">Municipalidad de Lima</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
