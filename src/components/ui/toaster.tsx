import { useNotificationStore } from '@/store/notificationStore'

export default function Toaster() {
  const items = useNotificationStore((s) => s.items)
  const remove = useNotificationStore((s) => s.remove)

  return (
    <div className="fixed top-4 right-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => remove(item.id)}
          className={`w-full rounded-md border px-4 py-3 text-left text-sm shadow-lg transition hover:opacity-90 ${
            item.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : item.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-slate-200 bg-white text-slate-800'
          }`}
        >
          {item.message}
        </button>
      ))}
    </div>
  )
}
