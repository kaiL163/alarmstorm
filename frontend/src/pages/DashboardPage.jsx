import { Activity, BarChart3, Bell, Clock3, RadioTower } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ExportNoteButton from '../components/ExportNoteButton.jsx'
import SopCard from '../components/SopCard.jsx'
import SystemStatusCard from '../components/SystemStatusCard.jsx'
import { useAlarmData } from '../context/AlarmDataContext.jsx'

function DashboardPage() {
  const { analytics, loading, error } = useAlarmData()
  const summary = analytics?.analytics
  const intensityData = (summary?.minute_intensity ?? []).map((bucket, index) => ({
    slot: new Date(bucket.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) || `${index + 1}`,
    count: bucket.count,
  }))
  const activeClustersCount = (summary?.clusters ?? []).filter((cluster) => cluster.count > 5).length

  if (loading) {
    return <div className="text-muted">Загрузка данных...</div>
  }

  if (error) {
    return <div className="rounded-2xl border border-danger/40 bg-danger/10 p-5 text-danger">{error}</div>
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-success">AlarmStorm</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-text">Dashboard</h1>
          </div>
          <ExportNoteButton />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SystemStatusCard />
        <div className="rounded-2xl border border-border bg-surface p-5">
          <Bell className="h-6 w-6 text-danger" />
          <p className="mt-4 text-sm text-muted">Всего аварий</p>
          <p className="mt-1 text-3xl font-bold text-text">{summary?.total ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <Clock3 className="h-6 w-6 text-accent" />
          <p className="mt-4 text-sm text-muted">Событий за 1 час</p>
          <p className="mt-1 text-3xl font-bold text-text">{summary?.events_last_hour ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <BarChart3 className="h-6 w-6 text-success" />
          <p className="mt-4 text-sm text-muted">Активные кластеры</p>
          <p className="mt-1 text-3xl font-bold text-text">{activeClustersCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <Activity className="h-6 w-6 text-warning" />
          <p className="mt-4 text-sm text-muted">В кластерах</p>
          <p className="mt-1 text-3xl font-bold text-text">{summary?.in_clusters ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <RadioTower className="h-6 w-6 text-yellow" />
          <p className="mt-4 text-sm text-muted">Bad Actor</p>
          <p className="mt-1 truncate font-mono text-sm font-bold text-text">{summary?.bad_actor ?? '—'}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text">График интенсивности</h2>
            <p className="mt-1 text-sm text-muted">Алармов в минуту за последний час.</p>
          </div>
          <BarChart3 className="h-5 w-5 text-accent" />
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={intensityData}>
              <defs>
                <linearGradient id="intensityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#21262d" strokeDasharray="3 3" />
              <XAxis dataKey="slot" stroke="#7d8590" tick={{ fontSize: 11 }} />
              <YAxis stroke="#7d8590" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#58a6ff" fill="url(#intensityFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-text">Топ-5 кластеров</h2>
            <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              Активные: {activeClustersCount}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {summary?.clusters?.slice(0, 5).map((cluster) => (
              <div key={cluster.zone} className="rounded-xl border border-border-muted bg-surface-2 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-text">{cluster.zone}</p>
                    <p className="mt-1 font-mono text-xs text-accent">{cluster.bad_actor}</p>
                  </div>
                  <p className="text-2xl font-bold text-text">{cluster.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <SopCard />
      </section>
    </div>
  )
}

export default DashboardPage
