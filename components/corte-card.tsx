"use client"

import { useState } from "react"
import { Calendar, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AdelantoForm } from "@/components/adelanto-form"
import { AdelantosList } from "@/components/adelantos-list"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Corte } from "@/app/page"

interface CorteCardProps {
  corte: Corte
}

export function CorteCard({ corte }: CorteCardProps) {
  const [showAdelantoForm, setShowAdelantoForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFinalizarCorte = async () => {
    setLoading(true)
    try {
      await updateDoc(doc(db, "cortes", corte.id), {
        finalizado: true,
      })
    } catch (error) {
      console.error("Error al finalizar corte:", error)
      alert("Error al finalizar el corte")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

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
            {montoRestante <= 0 && (
              <Button
                onClick={handleFinalizarCorte}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                {loading ? "Finalizando..." : "Finalizar"}
              </Button>
            )}
          </div>
        )}

        {showAdelantoForm && <AdelantoForm corteId={corte.id} onClose={() => setShowAdelantoForm(false)} />}
      </CardContent>
    </Card>
  )
}
