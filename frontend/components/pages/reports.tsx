"use client";

import { useEffect, useState } from "react";
import { Download, Eye, Trash2 } from "lucide-react";
import ReportConfiguration from "@/components/ui/report-configuration";

interface RecentReport {
  id: number;
  title: string;
  export_format: string;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Reports() {
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);

  // ==========================
  // Cargar reportes recientes
  // ==========================
  async function loadReports() {
    try {
      const res = await fetch(`${API_URL}/reports/recent?limit=10`);
      const data = await res.json();
      setRecentReports(data);
    } catch (err) {
      console.error("Error cargando reportes:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  // ==========================
  // Descargar archivo
  // ==========================
  const handleDownload = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/reports/download/${id}`);
      if (!res.ok) throw new Error("Error descargando archivo");
  
      const blob = await res.blob();
  
      // Leer el nombre real desde Content-Disposition
      const disposition = res.headers.get("Content-Disposition");
      let filename = `reporte_${id}`;
  
      if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/"/g, "");
      }
  
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
  
      a.href = url;
      a.download = filename; // ← nombre correcto del backend
      a.click();
  
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("No se pudo descargar el archivo.");
    }
  };

  // ==========================
  // Ver reporte
  // ==========================
  const handleView = (id: number) => {
    window.open(`${API_URL}/reports/view/${id}`, "_blank");
  };

  // ==========================
  // Eliminar reporte
  // ==========================
  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este reporte?")) return;

    try {
      const res = await fetch(`${API_URL}/reports/delete/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error eliminando reporte");

      loadReports();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el reporte.");
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-pathcycle-gray-800">
          Generación de Reportes Técnicos
        </h1>
        <p className="text-pathcycle-gray-400">
          Configure y genere informes detallados sobre la red de ciclovías.
        </p>
      </div>

      {/* ==========================
          Configurador de Reportes
      ========================== */}
      <ReportConfiguration onSaved={loadReports} />

      {/* ==========================
          Tabla de reportes recientes
      ========================== */}
      <div className="bg-white rounded-lg shadow-sm border border-pathcycle-gray-100">
        <div className="p-4 border-b border-pathcycle-gray-100">
          <h2 className="text-base font-bold text-pathcycle-gray-800 uppercase">
            Reportes Generados Recientemente
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-pathcycle-gray-400">
            Cargando...
          </div>
        ) : recentReports.length === 0 ? (
          <div className="p-6 text-center text-pathcycle-gray-400">
            No hay reportes generados aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-pathcycle-gray-100 text-xs text-pathcycle-gray-400 uppercase">
                <tr>
                  <th className="py-3 px-5">Nombre</th>
                  <th className="py-3 px-5">Fecha</th>
                  <th className="py-3 px-5">Tipo</th>
                  <th className="py-3 px-5">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-pathcycle-gray-100">
                {recentReports.map((report) => (
                  <tr key={report.id}>
                    <td className="py-3 px-5 font-medium">{report.title}</td>

                    <td className="py-3 px-5 text-pathcycle-gray-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {report.export_format.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">

                        <button
                          onClick={() => handleDownload(report.id)}
                          className="p-1 text-pathcycle-primary hover:bg-pathcycle-primary/10 rounded-full"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleView(report.id)}
                          className="p-1 text-pathcycle-gray-400 hover:bg-pathcycle-gray-100 rounded-full"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(report.id)}
                          className="p-1 text-pathcycle-danger hover:bg-pathcycle-danger/10 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>
    </main>
  );
}
