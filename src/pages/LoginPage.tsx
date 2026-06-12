import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { login } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  nombre: z.string().min(3, 'Usuario mínimo 3 caracteres'),
  password: z.string().min(4, 'Contraseña mínimo 4 caracteres'),
  idZona: z.coerce.number().min(1, 'Zona requerida'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.login)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { idZona: 1 },
  })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data)
      navigate('/')
    },
  })

  const onSubmit = (values: FormValues) => mutation.mutate(values)

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-100 via-sky-100 to-cyan-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Ingreso al Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input placeholder="Usuario" {...register('nombre')} />
              {errors.nombre && <p className="text-sm text-red-600 mt-1">{errors.nombre.message}</p>}
            </div>
            <div>
              <Input type="password" placeholder="Contraseña" {...register('password')} />
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <Input type="number" min={1} placeholder="Zona" {...register('idZona')} />
              {errors.idZona && <p className="text-sm text-red-600 mt-1">{errors.idZona.message}</p>}
            </div>
            {mutation.isError && (
              <p className="text-sm text-red-600">No se pudo iniciar sesión. Verifica tus credenciales.</p>
            )}
            <Button className="w-full" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
