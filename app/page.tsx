"use client"

import { useState, useEffect } from "react"
import { Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CorteForm } from "@/components/corte-form"
import { CorteCard } from "@/components/corte-card"
import { ConnectionStatus } from "@/components/connection-status"
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Adelanto {
  id: string
  valor: number
  fecha: string
  foto?: string
  descripcion?: string
}

export interface Corte {
  id: string
  cantidad: number
  valor: number
  descripcion: string
  total: number
  adelantos: Adelanto[]
  fechaCreacion: string | Timestamp
  finalizado: boolean
  montoRestante: number
}

export default function HomePage() {
  const [cortes, setCortes] = useState<Corte[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)

  const initializeFirestore = () => {
    console.log("Iniciando conexión a Firebase... (intento", retryCount + 1, ")")
    setError("")

    const q = query(collection(db, "cortes"), orderBy("fechaCreacion", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("✅ Datos recibidos de Firebase:", snapshot.size, "documentos")
        const cortesData = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            // Convertir Timestamp a string si es necesario
            fechaCreacion:
              data.fechaCreacion instanceof Timestamp ? data.fechaCreacion.toDate().toISOString() : data.fechaCreacion,
          }
        }) as Corte[]

        setCortes(cortesData)
        setLoading(false)
        setError("")
      },
      (error) => {
        console.error("❌ Error al escuchar cambios:", error)
        setLoading(false)
        setError(`Error de conexión: ${error.message}`)

        // Auto-retry después de 5 segundos
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
            setLoading(true)
            initializeFirestore()
          }, 5000)
        }
      },
    )

    return unsubscribe
  }

  useEffect(() => {
    const unsubscribe = initializeFirestore()
    return () => unsubscribe?.()
  }, [])

  const handleRetry = () => {
    setRetryCount(0)
    setLoading(true)
    initializeFirestore()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Conectando a Firebase...
            {retryCount > 0 && <span className="block text-sm">Reintento {retryCount}/3</span>}
          </p>
        </div>
      </div>
    )
  }

  if (error && cortes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error de Conexión</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ConnectionStatus />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Control de Cortes</h1>
            <p className="text-gray-600 mt-1">Gestiona tus cortes y adelantos</p>
            {error && (
              <p className="text-red-600 text-sm mt-1">
                ⚠️ Problemas de conexión - Los datos pueden no estar actualizados
              </p>
            )}
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2" size="lg">
            <Plus className="w-5 h-5" />
            Nuevo Corte
          </Button>
        </div>

        {showForm && <CorteForm onClose={() => setShowForm(false)} />}

        <div className="space-y-6">
          {cortes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <Plus className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay cortes registrados</h3>
              <p className="text-gray-600 mb-6">Comienza creando tu primer corte</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Corte
              </Button>
            </div>
          ) : (
            cortes.map((corte) => <CorteCard key={corte.id} corte={corte} />)
          )}
        </div>
      </div>
    </div>
  )
}
