import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const nombre = useAuthStore((s) => s.nombre)
  const rol = useAuthStore((s) => s.rol)
  const idZona = useAuthStore((s) => s.idZona)

  return (
    <main className="p-6 space-y-6">


      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{nombre}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rol</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{rol}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sucursal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">Zona {idZona}</p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
