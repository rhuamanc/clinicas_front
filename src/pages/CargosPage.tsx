import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { crearCargo, listarCargosRango } from '@/api/operacionesApi'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { FieldError, OptionalLabel, RequiredLabel, fieldClass, isBlank } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

export default function CargosPage() {
  const queryClient = useQueryClient()
  const idZona = useAuthStore((s) => s.idZona) ?? 1
  const today = new Date().toISOString().slice(0, 10)
  const [fechaIni, setFechaIni] = useState(today)
  const [fechaFin, setFechaFin] = useState(today)
  const [tipo, setTipo] = useState('INGRESO')
  const [monto, setMonto] = useState(0)
  const [descripcion, setDescripcion] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: cargos = [] } = useQuery({ queryKey: ['cargos', idZona, fechaIni, fechaFin], queryFn: () => listarCargosRango(idZona, fechaIni, fechaFin) })

  const createMutation = useMutation({
    mutationFn: crearCargo,
    onSuccess: () => {
      setMonto(0)
      setDescripcion('')
      queryClient.invalidateQueries({ queryKey: ['cargos', idZona, fechaIni, fechaFin] })
      notifySuccess('Cargo guardado correctamente.')
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo guardar el cargo.')),
  })

  return (
    <main className="p-6 space-y-6">


      <section className="grid gap-4 md:grid-cols-4">
        <div className="space-y-1"><RequiredLabel>Tipo</RequiredLabel><select className={fieldClass(Boolean(errors.tipo)) + ' h-10 rounded-md bg-background px-3 w-full'} value={tipo} onChange={(e) => { setTipo(e.target.value); setErrors((prev) => ({ ...prev, tipo: '' })) }}>
          <option value="INGRESO">INGRESO</option>
          <option value="EGRESO">EGRESO</option>
        </select><FieldError message={errors.tipo} /></div>
        <div className="space-y-1"><RequiredLabel>Monto</RequiredLabel><Input className={fieldClass(Boolean(errors.monto))} type="number" step="0.01" value={monto} onChange={(e) => { setMonto(Number(e.target.value)); setErrors((prev) => ({ ...prev, monto: '' })) }} /><FieldError message={errors.monto} /></div>
        <div className="space-y-1"><OptionalLabel>Descripcion</OptionalLabel><Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></div>
        <Button className="self-end" onClick={() => {
          const nextErrors: Record<string, string> = {}
          if (isBlank(tipo)) nextErrors.tipo = 'El tipo es obligatorio.'
          if (!monto || monto <= 0) nextErrors.monto = 'El monto debe ser mayor a 0.'
          setErrors(nextErrors)
          if (Object.keys(nextErrors).length > 0) {
            notifyError('Completa los campos obligatorios del cargo.')
            return
          }
          createMutation.mutate({ tipo, monto, descripcion })
        }}>Registrar</Button>
      </section>

      <section className="grid gap-2 md:grid-cols-2">
        <Input type="date" value={fechaIni} onChange={(e) => setFechaIni(e.target.value)} />
        <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
      </section>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead>Monto</TableHead><TableHead>Descripcion</TableHead></TableRow></TableHeader>
          <TableBody>
            {cargos.map((c) => (
              <TableRow key={c.idCargo}>
                <TableCell>{c.fecha?.slice(0, 19).replace('T', ' ')}</TableCell>
                <TableCell>{c.tipo}</TableCell>
                <TableCell>S/ {c.monto.toFixed(2)}</TableCell>
                <TableCell>{c.descripcion ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
