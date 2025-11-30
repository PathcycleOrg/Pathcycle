"use client";

import { useState } from "react";
import { FileText, Settings2, Download, Save } from "lucide-react";
import { previewReporte, saveReporte, downloadReporte } from "@/lib/api";
import type { PreviewConfig } from "@/lib/types";

interface ReportConfigurationProps {
  onSaved?: () => void;
}

export default function ReportConfiguration({ onSaved }: ReportConfigurationProps) {

  const [reportType, setReportType] = useState<PreviewConfig["report_type"]>("analisis");

  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeMaps, setIncludeMaps] = useState(true);
  const [includeGraph, setIncludeGraph] = useState(true);

  const [loading, setLoading] = useState(false);
  const [previewHTML, setPreviewHTML] = useState("");
  const [savedReportId, setSavedReportId] = useState<number | null>(null);

  // ============================
  // 1. GENERAR PREVIEW
  // ============================
  const generarReporte = async () => {
    setLoading(true);
    try {
      const payload: PreviewConfig = {
        report_type: reportType,
        include_summary: includeSummary,
        include_metrics: includeMetrics,
        include_maps: includeMaps,
        include_graph: includeGraph,
        export_format: "html",
      };

      const html = await previewReporte(payload);
      setPreviewHTML(html);

    } catch (err) {
      console.error("Error generando reporte:", err);
      alert("Error al generar reporte");
    }
    setLoading(false);
  };

  // ============================
  // 2. GUARDAR REPORTE
  // ============================
  const guardarReporte = async () => {
    if (!previewHTML) return alert("Genera un reporte antes de guardar.");
  
    try {
      // 🔥 Convertir HTML a Base64
      const encodedHTML = btoa(unescape(encodeURIComponent(previewHTML)));
  
      const res = await saveReporte({
        title: "Reporte generado desde UI",
        html: encodedHTML,      // ⬅️ Enviar Base64
        export_format: "html",
      });
  
      setSavedReportId(res.id);
      alert("Reporte guardado correctamente.");
  
      if (onSaved) onSaved();
  
    } catch (err) {
      console.error("Error guardando reporte:", err);
      alert("No se pudo guardar el reporte.");
    }
  };
  // ============================
  // 3. DESCARGAR REPORTE
  // ============================
  const descargarReporte = async () => {
    if (!savedReportId) return alert("Guarda un reporte antes de descargar.");
  
    try {
      const { blob, filename } = await downloadReporte(savedReportId);
  
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
  
      a.href = url;
      a.download = filename;   // ← nombre real desde el backend
      a.click();
  
      window.URL.revokeObjectURL(url);
  
    } catch (err) {
      console.error("Error descargando reporte:", err);
      alert("No se pudo descargar el archivo.");
    }
  };
  

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* LEFT PANEL */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-pathcycle-gray-100">

        <div className="p-6 border-b border-pathcycle-gray-100">
          <h2 className="text-base font-bold text-pathcycle-gray-800 uppercase">
            Configuración del Reporte
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* TYPE */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-pathcycle-gray-800">1. Tipo de Reporte</h3>

            <div className="space-y-2">
              {[
                { label: "Análisis completo de red actual", value: "analisis" },
                { label: "Evaluación de escenario propuesto", value: "escenario" },
                { label: "Comparación de múltiples escenarios", value: "comparacion" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-pathcycle-gray-50">
                  <input
                    type="radio"
                    checked={reportType === opt.value}
                    onChange={() => setReportType(opt.value as any)}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* CHECKBOXES */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-pathcycle-gray-800">2. Contenido a Incluir</h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeSummary} onChange={() => setIncludeSummary(!includeSummary)} />
                Resumen
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeMetrics} onChange={() => setIncludeMetrics(!includeMetrics)} />
                Métricas
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeMaps} onChange={() => setIncludeMaps(!includeMaps)} />
                Mapas
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeGraph} onChange={() => setIncludeGraph(!includeGraph)} />
                Gráficos
              </label>
            </div>
          </div>

          <button className="text-sm font-medium text-pathcycle-primary flex items-center gap-1 hover:underline">
            <Settings2 className="w-4 h-4" /> Opciones Avanzadas
          </button>
        </div>

        {/* BUTTONS */}
        <div className="p-6 border-t bg-pathcycle-gray-50 rounded-b-lg space-y-3">

          <button
            onClick={generarReporte}
            disabled={loading}
            className="w-full py-3 bg-pathcycle-primary text-white font-bold rounded-lg"
          >
            <FileText className="w-5 h-5 inline-block" /> {loading ? "Generando..." : "GENERAR REPORTE"}
          </button>

          <button
            onClick={guardarReporte}
            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg"
          >
            <Save className="w-5 h-5 inline-block" /> GUARDAR REPORTE
          </button>

          <button
            onClick={descargarReporte}
            disabled={!savedReportId}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50"
          >
            <Download className="w-5 h-5 inline-block" /> DESCARGAR REPORTE
          </button>
        </div>
      </div>

      {/* PREVIEW PANEL */}
      <div className="lg:col-span-3 rounded-lg p-6 bg-pathcycle-gray-100 border">
        <h2 className="font-bold text-pathcycle-gray-800 uppercase mb-4">Vista Previa</h2>

        <div className="bg-white shadow-xl h-[500px] rounded-lg border overflow-hidden">
          {previewHTML ? (
            <iframe srcDoc={previewHTML} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-pathcycle-gray-400">
              [Vista previa del reporte]
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
