"use client"

import { FileText, Settings2 } from "lucide-react"
import { useState } from "react"

type OptionItem = {
  label: string
  checked: boolean
}

export default function ReportConfiguration() {
  const reportTypes = [
    "Análisis completo de red actual",
    "Evaluación de escenario propuesto",
    "Comparación de múltiples escenarios",
    "Informe de priorización de inversiones",
  ]

  const defaultContent: OptionItem[] = [
    { label: "Resumen ejecutivo", checked: true },
    { label: "Métricas algorítmicas", checked: true },
    { label: "Visualizaciones de mapas", checked: true },
    { label: "Gráficos de conectividad", checked: true },
  ]

  const [selectedType, setSelectedType] = useState(reportTypes[0])
  const [contentOptions, setContentOptions] = useState<OptionItem[]>(defaultContent)
  const [loading, setLoading] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [districts, setDistricts] = useState<string>("") // comma-separated
  const [exportFormat, setExportFormat] = useState<string>("html")

  async function generatePreview() {
    setLoading(true)
    try {
      const body = {
        report_type: selectedType,
        include_summary: contentOptions.find((c) => c.label === "Resumen ejecutivo")?.checked ?? true,
        include_metrics: contentOptions.find((c) => c.label === "Métricas algorítmicas")?.checked ?? true,
        include_maps: contentOptions.find((c) => c.label === "Visualizaciones de mapas")?.checked ?? false,
        include_graph: contentOptions.find((c) => c.label === "Gráficos de conectividad")?.checked ?? true,
        // Advanced
        date_from: dateFrom,
        date_to: dateTo,
        districts: districts ? districts.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        export_format: exportFormat,
      }

      const API_URL = (process.env.NEXT_PUBLIC_API_URL as string) || "http://127.0.0.1:8001"

      const res = await fetch(`${API_URL}/reports/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error("Error generando preview")

      const data = await res.json()
      setPreviewHtml(data.html)

      // Auto-save the generated preview so it appears in "Reportes Generados Recientemente"
      ;(async () => {
        try {
          const title = `${selectedType} - ${new Date().toLocaleString()}`
          const API_URL = (process.env.NEXT_PUBLIC_API_URL as string) || "http://127.0.0.1:8001"
          const r = await fetch(`${API_URL}/reports/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, html: data.html, export_format: exportFormat }),
          })
          if (r.ok) {
            const saved = await r.json().catch(() => null)
            try {
              window.dispatchEvent(new CustomEvent("reports:updated", { detail: saved }))
            } catch {}
          } else {
            // non-blocking: log silently
            console.warn("Auto-save preview failed", r.status, r.statusText)
          }
        } catch (e) {
          console.warn("Auto-save preview error:", e)
        }
      })()
    } catch (e) {
      console.error(e)
      setPreviewHtml(`<html><body><p style='color:red'>Error al generar vista previa: ${String(e)}</p></body></html>`)
    } finally {
      setLoading(false)
    }
  }

  function toggleOption(label: string) {
    setContentOptions((prev) => prev.map((p) => (p.label === label ? { ...p, checked: !p.checked } : p)))
  }

  function exportPdf() {
    // Abrir la vista previa en una ventana nueva y forzar print (el usuario podrá elegir "Guardar como PDF")
    if (!previewHtml) return
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(previewHtml)
    w.document.close()
    // esperar un momento para que cargue y forzar diálogo de impresión
    setTimeout(() => {
      try {
        w.focus()
        w.print()
      } catch (e) {
        console.error("No se pudo iniciar impresión automática:", e)
      }
    }, 500)
  }

  async function saveReport() {
    if (!previewHtml) return alert("Genera la vista previa antes de guardar")
    setSaveLoading(true)
    try {
      const title = `${selectedType} - ${new Date().toLocaleString()}`
      const API_URL = (process.env.NEXT_PUBLIC_API_URL as string) || "http://127.0.0.1:8001"
      const res = await fetch(`${API_URL}/reports/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, html: previewHtml, export_format: exportFormat }),
      })
      if (!res.ok) throw new Error("Error guardando reporte")
      const data = await res.json()
      // trigger recent reports refresh (emit event so the table reloads)
      try {
        window.dispatchEvent(new CustomEvent("reports:updated", { detail: { id: data.id } }))
      } catch {}
      alert("Reporte guardado (id: " + data.id + ")")
    } catch (e) {
      console.error(e)
      alert("Error guardando reporte: " + String(e))
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: Configuration */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-pathcycle-gray-100">
        <div className="p-6 border-b border-pathcycle-gray-100">
          <h2 className="text-base font-bold text-pathcycle-gray-800 uppercase">Configuración del Reporte</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Type */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-pathcycle-gray-800">1. Tipo de Reporte</h3>
            <div className="space-y-2">
              {reportTypes.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-2 p-3 rounded-lg border border-pathcycle-gray-100 hover:bg-pathcycle-gray-50 transition-all ${selectedType === option ? "ring-2 ring-pathcycle-primary" : ""}`}
                >
                  <input type="radio" name="report_type" className="w-4 h-4" checked={selectedType === option} onChange={() => setSelectedType(option)} />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Content to Include */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-pathcycle-gray-800">2. Contenido a Incluir</h3>
            <div className="grid grid-cols-2 gap-3">
              {contentOptions.map((item) => (
                <label key={item.label} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={item.checked} className="w-4 h-4 rounded" onChange={() => toggleOption(item.label)} />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <button onClick={() => setAdvancedOpen(!advancedOpen)} className="text-sm font-medium text-pathcycle-primary hover:underline flex items-center gap-1">
              <Settings2 className="w-4 h-4" />
              Opciones Avanzadas
            </button>

            {advancedOpen && (
              <div className="mt-4 p-4 border border-pathcycle-gray-100 rounded-lg bg-pathcycle-gray-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">Fecha desde (YYYYMMDD)
                    <input type="text" value={dateFrom ?? ""} onChange={(e) => setDateFrom(e.target.value || null)} className="mt-1 w-full border p-2 rounded" placeholder="20230101" />
                  </label>
                  <label className="text-sm">Fecha hasta (YYYYMMDD)
                    <input type="text" value={dateTo ?? ""} onChange={(e) => setDateTo(e.target.value || null)} className="mt-1 w-full border p-2 rounded" placeholder="20231231" />
                  </label>
                </div>

                <label className="text-sm">Distritos (coma-separados)
                  <input type="text" value={districts} onChange={(e) => setDistricts(e.target.value)} className="mt-1 w-full border p-2 rounded" placeholder="SAN MIGUEL, LIMA, SURCO" />
                </label>

                <label className="text-sm">Formato de exportación
                  <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="mt-1 w-full border p-2 rounded">
                    <option value="html">HTML</option>
                    <option value="pdf">PDF (cliente)</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-3">
              <div className="flex-1 flex gap-3">
                <button onClick={generatePreview} disabled={loading} className="flex-1 py-2 px-4 bg-pathcycle-primary text-white rounded-md font-semibold">
                  {loading ? "Generando..." : "Generar vista previa"}
                </button>
                <button onClick={exportPdf} disabled={!previewHtml} className="py-2 px-4 bg-white border border-pathcycle-gray-200 rounded-md">
                  Exportar PDF
                </button>
              </div>
          </div>
        </div>

        <div className="p-6 border-t border-pathcycle-gray-100 bg-pathcycle-gray-50 rounded-b-lg">
          {/* Removed duplicate big button — kept primary actions above. Provide small hint */}
          <div className="text-sm text-pathcycle-gray-600">Usa "Generar vista previa" para validar el contenido; luego exporta o guarda según sea necesario.</div>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="lg:col-span-3 bg-pathcycle-gray-100 rounded-lg p-6 border border-pathcycle-gray-200">
        <h2 className="text-base font-bold text-pathcycle-gray-800 uppercase mb-4">Vista Previa</h2>
        <div className="bg-white shadow-xl rounded-lg border border-pathcycle-gray-200 overflow-hidden h-[620px]">
          {previewHtml ? (
            // iframe con srcDoc para mostrar la preview retornada por el backend
            <iframe title="preview" srcDoc={previewHtml} className="w-full h-full border-0" />
          ) : (
            <div className="h-full flex items-center justify-center text-pathcycle-gray-400">[Genera una vista previa para verla aquí]</div>
          )}
        </div>
      </div>
    </div>
  )
}
