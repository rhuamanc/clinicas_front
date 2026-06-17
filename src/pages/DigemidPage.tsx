import React, { useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { buscarDigemid, sincronizarDigemid } from '@/api/operacionesApi'
import api from '@/api/axios'
import { actualizarCodigoDigemid } from '@/api/operacionesApi'

async function descargarZipDigemid(idZona: number) {
  try {
    const response = await api.get(`/digemid/export/csv-zip`, {
      params: { idZona },
      responseType: 'blob',
    })
    const blob = response.data
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = 'digemid.zip'
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch {
    alert('Error al descargar ZIP')
  }
}

function exportarExcel() {
  // Exportar tabla a Excel usando SheetJS (xlsx) solo lo visible
  import('xlsx').then(XLSX => {
    const table = document.querySelector('table');
    if (!table) return;
    const wb = XLSX.utils.table_to_book(table, { sheet: 'Digemid' });
    XLSX.writeFile(wb, 'digemid.xlsx');
  });
}
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getApiErrorMessage, notifyError, notifySuccess } from '@/store/notificationStore'

export default function DigemidPage() {
  const idZona = useAuthStore((s) => s.idZona) ?? 1
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState('')
  const [editRow, setEditRow] = useState<{ [id: number]: string }>({})

  const { data: rows = [], refetch } = useQuery({
    queryKey: ['digemid', idZona, filtro],
    queryFn: () => buscarDigemid(filtro, idZona),
  })

  const syncMutation = useMutation({
    mutationFn: () => sincronizarDigemid(idZona),
    onSuccess: (data) => notifySuccess(data?.mensaje ?? 'Sincronizacion completada correctamente.'),
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo sincronizar Digemid.')),
  })

  const updateCodigoMutation = useMutation({
    mutationFn: async ({ idProducto, codigoDigemid }: { idProducto: number, codigoDigemid: string }) => {
      await actualizarCodigoDigemid(idProducto, idZona, codigoDigemid)
    },
    onSuccess: () => {
      notifySuccess('Código Digemid actualizado')
      refetch()
    },
    onError: (error) => notifyError(getApiErrorMessage(error, 'No se pudo actualizar el código Digemid.')),
  })

  // Pre-cargar el valor editable con el valor original al cargar los datos
  React.useEffect(() => {
    if (rows.length > 0) {
      const nuevos: { [id: number]: string } = {}
      rows.forEach(r => { nuevos[r.idProducto] = r.codigoDigemid ?? '' })
      setEditRow(nuevos)
    }
  }, [rows])

  return (
    <main className="p-6 space-y-6">


      <section className="flex gap-2">
        <Input placeholder="Buscar por nombre" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={() => setFiltro(q.trim())}>Buscar</Button>
        <Button variant="outline" onClick={() => syncMutation.mutate()}>Sincronizar</Button>
        <Button variant="outline" onClick={() => descargarZipDigemid(idZona)}>Descargar ZIP (CSV)</Button>
        <Button variant="outline" onClick={exportarExcel}>Exportar a Excel</Button>
      </section>

      {syncMutation.isSuccess ? <p className="text-sm text-emerald-600">{syncMutation.data?.mensaje}</p> : null}

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Presentación</TableHead>
              <TableHead>Laboratorio</TableHead>
              <TableHead>Código Digemid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.idProducto}>
                <TableCell>{r.nombreProducto}</TableCell>
                <TableCell>{r.presentacion ?? '-'}</TableCell>
                <TableCell>{r.laboratorio ?? '-'}</TableCell>
                <TableCell>
                  <input
                    className="border rounded px-2 py-1 w-32"
                    value={editRow[r.idProducto] ?? r.codigoDigemid ?? ''}
                    onChange={e => setEditRow({ ...editRow, [r.idProducto]: e.target.value })}
                    onBlur={() => {
                      if ((r.codigoDigemid ?? '') !== (editRow[r.idProducto] ?? '')) {
                        updateCodigoMutation.mutate({ idProducto: r.idProducto, codigoDigemid: editRow[r.idProducto] ?? '' })
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
