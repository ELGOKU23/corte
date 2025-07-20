"use client"

import { useState } from "react"
import { Calendar, Plus, Check } from "lucide-react"
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
    <Card className={`${corte.finalizado ? "bg-green-50 border-green-200" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{corte.descripcion}</CardTitle>
              {corte.finalizado && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  Finalizado
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(corte.fechaCreacion)}
              </span>
              <span>Cantidad: {corte.cantidad}</span>
              <span>Valor: S/ {corte.valor.toLocaleString("es-PE")}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-xl font-bold text-gray-900">S/ {corte.total.toLocaleString("es-PE")}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Adelantos</p>
            <p className="text-xl font-bold text-blue-600">S/ {totalAdelantos.toLocaleString("es-PE")}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Restante</p>
            <p className={`text-xl font-bold ${montoRestante > 0 ? "text-orange-600" : "text-green-600"}`}>
              S/ {montoRestante.toLocaleString("es-PE")}
            </p>
          </div>
        </div>

        {corte.adelantos.length > 0 && <AdelantosList adelantos={corte.adelantos} />}

        {!corte.finalizado && (
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAdelantoForm(true)} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Añadir Adelanto
            </Button>
            {/* Mostrar botón Finalizar solo si el corte fue iniciado y no está finalizado */}
            {corte.fechaEmpezar && !corte.finalizado && (
              <Button
                onClick={handleFinalizarCorte}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                {loading ? "Finalizando..." : "Finalizar"}
              </Button>
            )}
            {/* Botón para iniciar corte si no tiene fechaEmpezar */}
            {!corte.fechaEmpezar && !corte.finalizado && (
              <Button onClick={handleIniciarCorte} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                Iniciar Corte
              </Button>
            )}
            {/* Mostrar fecha de empezar si existe */}
            {corte.fechaEmpezar && (
              <div className="text-sm text-gray-600 mt-2">
                <b>Fecha de empezar:</b> {formatDateTime(corte.fechaEmpezar || "")}
              </div>
            )}
            <Button variant="outline" onClick={() => setShowEditModal(true)} className="flex-1">
              Editar
            </Button>
          </div>
        )}

        {showAdelantoForm && <AdelantoForm corteId={corte.id} onClose={() => setShowAdelantoForm(false)} />}
        {showEditModal && (
          <CorteForm onClose={() => setShowEditModal(false)} corte={corte} modoEdicion={true} />
        )}
      </CardContent>
      {showReporteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Reporte de Corte</h2>
            <p><b>Descripción:</b> {corte.descripcion}</p>
            <p><b>Fecha de entrega:</b> {formatDate(corte.fechaCreacion || "")}</p>
            <p><b>Fecha de empezar:</b> {formatDateTime(corte.fechaEmpezar || "")}</p>
            <p><b>Fecha de finalización:</b> {formatDateTime(corte.fechaFinalizacion || "")}</p>
            <p><b>Duración (inicio a fin):</b> {corte.fechaEmpezar && corte.fechaFinalizacion ? `${Math.round((new Date(formatDateTime(corte.fechaFinalizacion || "")).getTime() - new Date(formatDateTime(corte.fechaEmpezar || "")).getTime()) / (1000 * 60 * 60 * 24))} días` : "-"}</p>
            <p><b>Monto total:</b> S/ {corte.total.toLocaleString("es-PE")}</p>
            <p><b>Monto restante:</b> S/ {montoRestante.toLocaleString("es-PE")}</p>
            <p><b>Adelantos:</b></p>
            <ul className="mb-2">
              {corte.adelantos.map((a: any) => (
                <li key={a.id}>
                  S/ {a.valor} - {a.descripcion || "Sin descripción"} - {formatDateTime(a.fecha || "")}
                </li>
              ))}
            </ul>
            <p><b>Tiempo de demora:</b> {corte.fechaEmpezar && corte.fechaCreacion ? `${Math.round((new Date(formatDateTime(corte.fechaCreacion || "")).getTime() - new Date(formatDateTime(corte.fechaEmpezar || "")).getTime()) / (1000 * 60 * 60 * 24))} días` : "-"}</p>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setShowReporteModal(false)} variant="outline">Cerrar</Button>
              {/* En el modal de reporte, el botón Imprimir PDF ya está presente si el corte está finalizado. */}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
