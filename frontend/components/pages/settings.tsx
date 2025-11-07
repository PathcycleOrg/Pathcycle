"use client"

import { Camera, UserCog, MapPin, Network, Bell, Lock, Database, Palette, Info } from "lucide-react"
import { useState } from "react"

export default function Settings() {
  const [activeSection, setActiveSection] = useState("profile")

  const sections = [
    { id: "profile", label: "Perfil de Usuario", icon: UserCog },
    { id: "maps", label: "Configuración de Mapas", icon: MapPin },
    { id: "algorithms", label: "Parámetros Algorítmicos", icon: Network },
    { id: "notifications", label: "Notificaciones", icon: Bell },
    { id: "security", label: "Seguridad y Acceso", icon: Lock },
    { id: "data", label: "Gestión de Datos", icon: Database },
    { id: "appearance", label: "Apariencia", icon: Palette },
    { id: "about", label: "Acerca de", icon: Info },
  ]

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <h1 className="text-3xl font-bold text-pathcycle-gray-800 mb-6">Configuración del Sistema</h1>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-full max-w-xs xl:max-w-[280px] flex-shrink-0">
          <nav className="flex flex-col space-y-1">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium border-l-2 transition-colors ${
                    isActive
                      ? "bg-pathcycle-primary/10 text-pathcycle-primary border-pathcycle-primary"
                      : "text-pathcycle-gray-400 hover:text-pathcycle-gray-800 hover:bg-pathcycle-gray-50 border-transparent"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{section.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-pathcycle-gray-100 divide-y divide-pathcycle-gray-100">
          {activeSection === "profile" && (
            <section className="pb-6">
              <h2 className="text-xl font-bold text-pathcycle-gray-800 mb-4">Información del Usuario</h2>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <img
                    src="/user-profile-illustration.png"
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                  <button className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-md text-pathcycle-primary hover:bg-pathcycle-gray-50">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-pathcycle-gray-400 mb-1">Nombre completo</label>
                    <input
                      type="text"
                      defaultValue="Usuario Planificador"
                      className="w-full text-sm bg-pathcycle-gray-50 border border-pathcycle-gray-200 rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pathcycle-gray-400 mb-1">Cargo</label>
                    <input
                      type="text"
                      defaultValue="Planificador Urbano"
                      className="w-full text-sm bg-pathcycle-gray-50 border border-pathcycle-gray-200 rounded-lg p-2.5"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button className="py-2 px-5 bg-pathcycle-primary text-white font-medium rounded-lg shadow-sm hover:bg-opacity-90 transition-all">
                  Guardar Cambios
                </button>
              </div>
            </section>
          )}

          {activeSection !== "profile" && (
            <section className="py-6 text-center text-pathcycle-gray-400">
              <p>Contenido para {sections.find((s) => s.id === activeSection)?.label} próximamente</p>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
