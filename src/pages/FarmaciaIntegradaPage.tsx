import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dispensarReceta, listarRecetasPendientes } from '@/api/clinicaApi'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

export default function FarmaciaIntegradaPage() {
  const queryClient = useQueryClient()

  const recetasQuery = useQuery({
    queryKey: ['clinica', 'recetas-pendientes'],
    queryFn: () => listarRecetasPendientes(),
    refetchInterval: 20000,
  })

  const dispensarMutation = useMutation({
    mutationFn: dispensarReceta,
    onSuccess: () => {
      notifySuccess('Receta dispensada y convertida en venta')
      queryClient.invalidateQueries({ queryKey: ['clinica', 'recetas-pendientes'] })
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo dispensar receta')),
  })

  const recetas = recetasQuery.data ?? []

  return (
    <main className="p-6 space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold text-slate-900">Farmacia Integrada</h1>
        <p className="text-sm text-slate-600 mt-1">Recepcion de recetas medicas y dispensacion con descuento de stock.</p>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Receta</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recetas.map((receta) => (
              <TableRow key={receta.idReceta}>
                <TableCell>{receta.idReceta}</TableCell>
                <TableCell>{receta.atencion.admision.paciente.apellidos}, {receta.atencion.admision.paciente.nombres}</TableCell>
                <TableCell>{new Date(receta.fechaReceta).toLocaleString()}</TableCell>
                <TableCell>{receta.estado}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" disabled={dispensarMutation.isPending} onClick={() => dispensarMutation.mutate(receta.idReceta)}>
                    Dispensar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {recetas.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-slate-500">No hay recetas pendientes.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </main>
  )
}
