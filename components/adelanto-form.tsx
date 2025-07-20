"use client"

import type React from "react"

import { useState } from "react"
import { X, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { doc, updateDoc, arrayUnion } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface AdelantoFormProps {
  corteId: string
  onClose: () => void
}

export function AdelantoForm({ corteId, onClose }: AdelantoFormProps) {
  const [valor, setValor] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [descripcion, setDescripcion] = useState("")
  const [foto, setFoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFoto(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!valor || !fecha) {
      setError("Por favor completa los campos requeridos")
      return
    }

    setLoading(true)
    console.log("Iniciando handleSubmit para añadir adelanto...")

    try {
      const valorNum = Number.parseFloat(valor)

      if (isNaN(valorNum) || valorNum <= 0) {
        setError("Por favor ingresa un valor válido mayor a 0")
        return
      }

      let fotoUrl = ""

      if (foto) {
        console.log("Subiendo foto a Cloudinary...");
        const url = 'https://api.cloudinary.com/v1_1/duruqbipv/image/upload';
        const formData = new FormData();
        formData.append('file', foto);
        formData.append('upload_preset', 'ml_default'); // Nombre exacto del preset sin firmar

        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Error al subir la imagen a Cloudinary');
        const data = await response.json();
        fotoUrl = data.secure_url;
        console.log("✅ Foto subida a Cloudinary:", fotoUrl);
      }

      const nuevoAdelanto = {
        id: Date.now().toString(), // ID simple para el adelanto dentro del array
        valor: valorNum,
        fecha,
        descripcion: descripcion.trim(),
        foto: fotoUrl
      }

      console.log("Añadiendo adelanto al corte:", nuevoAdelanto)

      // Timeout para la actualización del documento
      const updateTimeoutPromise = new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("Timeout: La actualización del adelanto tardó demasiado")), 15000), // 15 segundos
      )

      const updatePromise = updateDoc(doc(db, "cortes", corteId), {
        adelantos: arrayUnion(nuevoAdelanto),
      })

      await Promise.race([updatePromise, updateTimeoutPromise])
      console.log("✅ Adelanto añadido exitosamente al corte.")

      // Pequeña pausa para asegurar que se complete la escritura
      await new Promise((resolve) => setTimeout(resolve, 500))

      onClose()
    } catch (error: any) {
      console.error("❌ Error al añadir adelanto:", error)
      let errorMessage = "Error desconocido al añadir el adelanto."

      if (error.code) {
        errorMessage = `Error de Firebase (${error.code}): ${error.message}`
        if (error.code === "permission-denied") {
          errorMessage = "Permiso denegado. Revisa las reglas de seguridad de Firestore/Storage."
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
      console.log("Finalizado handleSubmit para añadir adelanto.")
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-xs mx-auto p-2 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Nuevo Adelanto</CardTitle>
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
              <Label htmlFor="valor">Valor del Adelanto *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ej: 500"
                min="0"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Notas adicionales..."
                rows={2}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="foto">Foto (opcional)</Label>
              <div className="mt-2">
                <input
                  id="foto"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("foto")?.click()}
                  className="w-full flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Tomar o elegir foto
                </Button>

                {previewUrl && (
                  <div className="mt-3">
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>

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
                  "Guardar"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
