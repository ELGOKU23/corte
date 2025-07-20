"use client"

import { useState } from "react"
import { Calendar, Plus, Check, CheckCircle, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AdelantoForm } from "@/components/adelanto-form"
import { AdelantosList } from "@/components/adelantos-list"
import { CorteForm } from "@/components/corte-form"
import { doc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Corte as CorteBase } from "@/app/page"
import jsPDF from "jspdf";

interface Corte extends CorteBase {
  fechaEmpezar?: string | import("firebase/firestore").Timestamp;
  fechaFinalizacion?: string | import("firebase/firestore").Timestamp;
}

interface CorteCardProps {
  corte: Corte
}

export function CorteCard({ corte: corteBase }: CorteCardProps) {
  const corte = corteBase as Corte;
  const [showAdelantoForm, setShowAdelantoForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReporteModal, setShowReporteModal] = useState(false);

  const handleFinalizarCorte = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const fechaFinalizacion = Timestamp.fromDate(now);
      await updateDoc(doc(db, "cortes", corte.id), {
        finalizado: true,
        fechaFinalizacion,
      });
      setShowReporteModal(true);
    } catch (error) {
      console.error("Error al finalizar corte:", error);
      alert("Error al finalizar el corte");
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarCorte = async () => {
    setLoading(true);
    try {
      const now = new Date();
      // Convertir a Timestamp de Firestore
      const fechaEmpezar = Timestamp.fromDate(now);
      await updateDoc(doc(db, "cortes", corte.id), {
        fechaEmpezar,
      });
    } catch (error) {
      alert("Error al iniciar el corte");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | import("firebase/firestore").Timestamp) => {
    if (!date) return "-";
    if (typeof date === "string") return new Date(date).toLocaleDateString("es-PE", { timeZone: "America/Lima" });
    if (typeof date.toDate === "function") return date.toDate().toLocaleDateString("es-PE", { timeZone: "America/Lima" });
    return "-";
  };
  const formatDateTime = (date: string | import("firebase/firestore").Timestamp) => {
    if (!date) return "-";
    if (typeof date === "string") return new Date(date).toLocaleString("es-PE", { timeZone: "America/Lima" });
    if (typeof date.toDate === "function") return date.toDate().toLocaleString("es-PE", { timeZone: "America/Lima" });
    return "-";
  };

  const totalAdelantos = corte.adelantos.reduce((sum, adelanto) => sum + adelanto.valor, 0)
  const montoRestante = corte.total - totalAdelantos

  return (
    <Card className={`${corte.finalizado ? "bg-green-50 border-green-200" : ""} w-full max-w-md mx-auto p-2 text-base shadow-lg rounded-xl transition-all duration-300 md:max-w-lg lg:max-w-2xl`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-extrabold text-gray-800 truncate max-w-[120px]">{corte.descripcion.charAt(0).toUpperCase() + corte.descripcion.slice(1)}</span>
              {corte.finalizado && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1 px-2 py-1 text-xs">
                  <CheckCircle className="w-4 h-4 mr-1" /> Finalizado
                </Badge>
              )}
              {corte.finalizado && (
                <Printer 
                  className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-900 ml-1" 
                  onClick={() => {
                    const doc = new jsPDF();
                    doc.text("Reporte de Corte", 10, 10);
                    doc.text(`Descripción: ${corte.descripcion}`, 10, 20);
                    doc.text(`Fecha de entrega: ${formatDate(corte.fechaCreacion || "")}`, 10, 30);
                    doc.text(`Fecha de empezar: ${formatDateTime(corte.fechaEmpezar || "")}`, 10, 40);
                    doc.text(`Fecha de finalización: ${formatDateTime(corte.fechaFinalizacion || "")}`, 10, 50);
                    doc.text(`Duración (inicio a fin): ${corte.fechaEmpezar && corte.fechaFinalizacion && formatDateTime(corte.fechaEmpezar) !== "-" && formatDateTime(corte.fechaFinalizacion) !== "-" ? `${Math.round((new Date(formatDateTime(corte.fechaFinalizacion || "")).getTime() - new Date(formatDateTime(corte.fechaEmpezar || "")).getTime()) / (1000 * 60 * 60 * 24))} días` : "-"}`, 10, 60);
                    doc.text(`Monto total: S/ ${corte.total.toLocaleString("es-PE")}`, 10, 70);
                    doc.text(`Monto restante: S/ ${montoRestante.toLocaleString("es-PE")}`, 10, 80);
                    doc.text(`Adelantos:`, 10, 90);
                    corte.adelantos.forEach((a: any, idx: number) => {
                      doc.text(`- S/ ${a.valor} - ${a.descripcion || "Sin descripción"} - ${formatDateTime(a.fecha || "")}`, 12, 100 + idx * 10);
                    });
                    doc.text(`Tiempo de demora: ${corte.fechaEmpezar && corte.fechaFinalizacion && formatDateTime(corte.fechaEmpezar) !== "-" && formatDateTime(corte.fechaFinalizacion) !== "-" ? `${Math.round((new Date(formatDateTime(corte.fechaFinalizacion || "")).getTime() - new Date(formatDateTime(corte.fechaEmpezar || "")).getTime()) / (1000 * 60 * 60 * 24))} días` : "-"}`, 10, 110 + corte.adelantos.length * 10);
                    doc.save("reporte-corte.pdf");
                  }}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(corte.fechaCreacion)}</span>
              <span>Cantidad: <b>{corte.cantidad}</b></span>
              <span>Valor: <b>S/ {corte.valor.toLocaleString("es-PE")}</b></span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 p-3 bg-gray-50 rounded-lg shadow-sm">
          <div className="text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">S/ {corte.total.toLocaleString("es-PE")}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Adelantos</p>
            <p className="text-lg font-bold text-blue-600">S/ {totalAdelantos.toLocaleString("es-PE")}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Restante</p>
            <p className={`text-lg font-bold ${montoRestante > 0 ? "text-orange-600" : "text-green-600"}`}>S/ {montoRestante.toLocaleString("es-PE")}</p>
          </div>
        </div>
        {corte.adelantos.length > 0 && <AdelantosList adelantos={corte.adelantos} />}
        {!corte.finalizado && (
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowAdelantoForm(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Añadir Adelanto
            </Button>
            {corte.fechaEmpezar && !corte.finalizado && (
              <Button onClick={handleFinalizarCorte} disabled={loading} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                <Check className="w-4 h-4 mr-2" /> {loading ? "Finalizando..." : "Finalizar"}
              </Button>
            )}
            {!corte.fechaEmpezar && !corte.finalizado && (
              <Button onClick={handleIniciarCorte} disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                Iniciar Corte
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowEditModal(true)} className="w-full sm:w-auto">
              Editar
            </Button>
          </div>
        )}
        {corte.fechaEmpezar && (
          <div className="text-xs text-gray-600 mt-2"><b>Fecha de empezar:</b> {formatDateTime(corte.fechaEmpezar || "")}</div>
        )}
        {showAdelantoForm && <AdelantoForm corteId={corte.id} onClose={() => setShowAdelantoForm(false)} />}
        {showEditModal && (
          <CorteForm onClose={() => setShowEditModal(false)} corte={corte} modoEdicion={true} />
        )}
      </CardContent>
      {showReporteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full text-sm overflow-y-auto max-h-[90vh] shadow-xl">
            <h2 className="text-lg font-bold mb-4">Reporte de Corte</h2>
            <div className="space-y-2 text-sm">
              <p><b>Descripción:</b> {corte.descripcion}</p>
              <p><b>Fecha de entrega:</b> {formatDate(corte.fechaCreacion || "")}</p>
              <p><b>Fecha de empezar:</b> {formatDateTime(corte.fechaEmpezar || "")}</p>
              <p><b>Fecha de finalización:</b> {formatDateTime(corte.fechaFinalizacion || "")}</p>
              <p><b>Duración (inicio a fin):</b> {corte.fechaEmpezar && corte.fechaFinalizacion && formatDateTime(corte.fechaEmpezar) !== "-" && formatDateTime(corte.fechaFinalizacion) !== "-" ? `${Math.round((new Date(formatDateTime(corte.fechaFinalizacion || "")).getTime() - new Date(formatDateTime(corte.fechaEmpezar || "")).getTime()) / (1000 * 60 * 60 * 24))} días` : "-"}</p>
              <p><b>Monto total:</b> S/ {corte.total.toLocaleString("es-PE")}</p>
              <p><b>Monto restante:</b> S/ {montoRestante.toLocaleString("es-PE")}</p>
              <p><b>Adelantos:</b></p>
              <ul className="mb-2 text-xs">
                {corte.adelantos.map((a: any) => (
                  <li key={a.id} className="mb-1">
                    S/ {a.valor} - {a.descripcion || "Sin descripción"} - {formatDateTime(a.fecha || "")}
                  </li>
                ))}
              </ul>
              <p><b>Tiempo de demora:</b> {corte.fechaEmpezar && corte.fechaFinalizacion && formatDateTime(corte.fechaEmpezar) !== "-" && formatDateTime(corte.fechaFinalizacion) !== "-" ? `${Math.round((new Date(formatDateTime(corte.fechaFinalizacion || "")).getTime() - new Date(formatDateTime(corte.fechaEmpezar || "")).getTime()) / (1000 * 60 * 60 * 24))} días` : "-"}</p>
            </div>
            <div className="flex flex-col gap-2 mt-4 w-full">
              <Button onClick={() => setShowReporteModal(false)} variant="outline" className="w-full">
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  const doc = new jsPDF();
                  doc.text("Reporte de Corte", 10, 10);
                  doc.text(`Descripción: ${corte.descripcion}`, 10, 20);
                  doc.text(`Fecha de entrega: ${formatDate(corte.fechaCreacion || "")}`, 10, 30);
                  doc.text(`Fecha de empezar: ${formatDateTime(corte.fechaEmpezar || "")}`, 10, 40);
                  doc.text(`Fecha de finalización: ${formatDateTime(corte.fechaFinalizacion || "")}`, 10, 50);
                  doc.text(`Duración (inicio a fin): ${corte.fechaEmpezar && corte.fechaFinalizacion && formatDateTime(corte.fechaEmpezar) !== "-" && formatDateTime(corte.fechaFinalizacion) !== "-" ? `${Math.round((new Date(formatDateTime(corte.fechaFinalizacion || "")).getTime() - new Date(formatDateTime(corte.fechaEmpezar || "")).getTime()) / (1000 * 60 * 60 * 24))} días` : "-"}`, 10, 60);
                  doc.text(`Monto total: S/ ${corte.total.toLocaleString("es-PE")}`, 10, 70);
                  doc.text(`Monto restante: S/ ${montoRestante.toLocaleString("es-PE")}`, 10, 80);
                  doc.text(`Adelantos:`, 10, 90);
                  corte.adelantos.forEach((a: any, idx: number) => {
                    doc.text(`- S/ ${a.valor} - ${a.descripcion || "Sin descripción"} - ${formatDateTime(a.fecha || "")}`, 12, 100 + idx * 10);
                  });
                  doc.text(`Tiempo de demora: ${corte.fechaEmpezar && corte.fechaFinalizacion && formatDateTime(corte.fechaEmpezar) !== "-" && formatDateTime(corte.fechaFinalizacion) !== "-" ? `${Math.round((new Date(formatDateTime(corte.fechaFinalizacion || "")).getTime() - new Date(formatDateTime(corte.fechaEmpezar || "")).getTime()) / (1000 * 60 * 60 * 24))} días` : "-"}`, 10, 110 + corte.adelantos.length * 10);
                  doc.save("reporte-corte.pdf");
                }}
                className="w-full bg-gray-700 hover:bg-gray-900 text-white mt-2"
              >
                Imprimir PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
