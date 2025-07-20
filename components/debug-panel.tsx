"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function DebugPanel() {
  const [loading, setLoading] = useState(false)
  const [collections, setCollections] = useState<any[]>([])

  const checkFirebaseConnection = async () => {
    setLoading(true)
    try {
      console.log("Verificando conexión a Firebase...")
      const cortesRef = collection(db, "cortes")
      const snapshot = await getDocs(cortesRef)

      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }))

      setCollections(docs)
      console.log("Documentos encontrados:", docs)
      alert(`Conexión exitosa! Encontrados ${docs.length} documentos`)
    } catch (error) {
      console.error("Error de conexión:", error)
      alert(`Error de conexión: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const clearAllData = async () => {
    if (!confirm("¿Estás seguro de eliminar todos los cortes?")) return

    setLoading(true)
    try {
      const cortesRef = collection(db, "cortes")
      const snapshot = await getDocs(cortesRef)

      const deletePromises = snapshot.docs.map((docSnapshot) => deleteDoc(doc(db, "cortes", docSnapshot.id)))

      await Promise.all(deletePromises)
      setCollections([])
      alert("Todos los datos han sido eliminados")
    } catch (error) {
      console.error("Error al eliminar:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6 border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Panel de Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkFirebaseConnection} disabled={loading} variant="outline">
            {loading ? "Verificando..." : "Verificar Firebase"}
          </Button>
          <Button onClick={clearAllData} disabled={loading} variant="destructive">
            Limpiar Datos
          </Button>
        </div>

        {collections.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Documentos en Firebase:</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(collections, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
