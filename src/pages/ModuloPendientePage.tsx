interface Props {
  titulo: string
  descripcion: string
}

export default function ModuloPendientePage({ titulo, descripcion }: Props) {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">{titulo}</h1>
      <p className="text-sm text-slate-600">{descripcion}</p>

      <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
        Este modulo fue mapeado desde el sistema legado y quedo registrado para migracion completa.
      </div>
    </main>
  )
}
