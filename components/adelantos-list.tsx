"use client"

import { Calendar, DollarSign, ImageIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Adelanto } from "@/app/page"

interface AdelantosListProps {
  adelantos: Adelanto[]
}

export function AdelantosList({ adelantos }: AdelantosListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Adelantos ({adelantos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {adelantos.map((adelanto) => (
            <div key={adelanto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-green-600">S/ {adelanto.valor.toLocaleString("es-PE")}</span>
                  {adelanto.foto && (
                    <Badge variant="secondary" className="text-xs">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      Con foto
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-3 h-3" />
                  {formatDate(adelanto.fecha)}
                </div>
                {adelanto.descripcion && <p className="text-sm text-gray-700 mt-1">{adelanto.descripcion}</p>}
              </div>

              {adelanto.foto && (
                <div className="ml-3">
                  <img
                    src={adelanto.foto || "/placeholder.svg"}
                    alt="Adelanto"
                    className="w-12 h-12 object-cover rounded-lg border cursor-pointer"
                    onClick={() => window.open(adelanto.foto, "_blank")}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
