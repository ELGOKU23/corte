"use client"

import type React from "react"

import { useState } from "react"
import { X, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface CorteFormProps {
  onClose: () => void
}

export function CorteForm({ onClose }: CorteFormProps) {
  const [cantidad, setCantidad] = useState("")
  const [valor, setValor] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!cantidad || !valor || !descripcion) {
      setError("Por favor completa todos los campos")
      return
    }

    setLoading(true)
    console.log("Iniciando handleSubmit para crear corte...")

    try {
      const cantidadNum = Number.parseInt(cantidad)
      const valorNum = Number.parseFloat(valor)

      if (isNaN(cantidadNum) || isNaN(valorNum)) {
        setError("Por favor ingresa valores numéricos válidos")
        return
      }

      if (cantidadNum <= 0 || valorNum <= 0) {
        setError("Los valores deben ser mayores a 0")
        return
      }

      const total = cantidadNum * valorNum

      const nuevoCorte = {
        cantidad: cantidadNum,
        valor: valorNum,
        descripcion: descripcion.trim(),
        total,
        adelantos: [],
        fechaCreacion: serverTimestamp(), // Usa serverTimestamp para la fecha
        finalizado: false,
        montoRestante: total,
      }

      console.log("Datos del nuevo corte a guardar:", nuevoCorte)

      // Configura un timeout para la operación de guardado
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Timeout: La operación de guardado tardó demasiado")), 15000), // Aumentado a 15 segundos
      )

      console.log("Intentando añadir documento a Firestore...")
      const savePromise = addDoc(collection(db, "cortes"), nuevoCorte)

      const docRef = await Promise.race([savePromise, timeoutPromise])
      console.log("✅ Documento de corte añadido con ID:", docRef.id)

      // Pequeña pausa para asegurar que se complete la escritura antes de cerrar el formulario
      await new Promise((resolve) => setTimeout(resolve, 500))

      onClose()
    } catch (error: any) {
      console.error("❌ Error al crear corte:", error)
      let errorMessage = "Error desconocido al crear el corte."

      if (error.code) {
        // Errores específicos de Firebase
        errorMessage = `Error de Firebase (${error.code}): ${error.message}`
        if (error.code === "permission-denied") {
          errorMessage = "Permiso denegado. Revisa las reglas de seguridad de Firestore."
        } else if (error.code === "unavailable") {
          errorMessage = "Servicio no disponible. Problema de red o servidor de Firebase."
        }
      } else if (error.message.includes("Timeout")) {
        errorMessage = "La operación tardó demasiado. Posible problema de red o reglas de seguridad."
      } else {
        errorMessage = `Error: ${error.message}`
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
      console.log("Finalizado handleSubmit para crear corte.")
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Nuevo Corte
            {navigator.onLine ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ej: 10"
                min="1"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="valor">Valor Unitario (S/)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ej: 150.00"
                min="0"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el trabajo a realizar..."
                rows={3}
                disabled={loading}
              />
            </div>

            {cantidad && valor && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>
                    Total: S/{" "}
                    {(Number.parseInt(cantidad || "0") * Number.parseFloat(valor || "0")).toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-transparent"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </div>
                ) : (
                  "Crear Corte"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
