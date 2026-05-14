import { Construction } from 'lucide-react'

function MonitorPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <section className="w-full max-w-3xl rounded-3xl border border-border bg-surface p-8 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-accent/30 bg-accent/10 text-accent">
          <Construction className="h-10 w-10" />
        </div>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-text">Модуль в разработке</h1>
      </section>
    </div>
  )
}

export default MonitorPage
