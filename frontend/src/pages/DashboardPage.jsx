import { Bell, RadioTower, Server, Zap } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import SopCard from '../components/SopCard.jsx'
import SystemStatusCard from '../components/SystemStatusCard.jsx'
import { useAlarmData } from '../context/AlarmDataContext.jsx'

function DashboardPage() {
  const { analytics, loading, error } = useAlarmData()
  const summary = analytics?.analytics
  const intensityData = (summary?.intensity ?? []).map((bucket, index) => ({
    slot: new Date(bucket.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) || `${index + 1}`,
    count: bucket.count,
  }))
  const clusters = summary?.clusters ?? []
  const topClusters = clusters

  if (loading) {
    return <div className="text-[#8b96a8]">Загрузка данных...</div>
  }

  if (error) {
    return <div className="rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 p-5 text-[#ef4444]">{error}</div>
  }

  return (
    <div className="w-full space-y-4">
      <section className="grid gap-4 lg:grid-cols-4 2xl:grid-cols-[1fr_1.5fr_1.1fr_1fr]">
        <SystemStatusCard />
        <div className="flex items-center justify-between rounded-xl border border-[#20283a] bg-[#101725] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b96a8]">Текущий Bad Actor</p>
            <p className="mt-2 max-w-[220px] truncate font-mono text-xl font-black text-white">{summary?.bad_actor ?? '—'}</p>
            <p className="mt-1 text-[11px] text-[#8b96a8]">{summary?.bad_zone ?? '—'}</p>
          </div>
          <div className="rounded-lg border border-[#24324a] bg-[#151f31] p-3 text-[#facc15]">
            <Zap className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[#20283a] bg-[#101725] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b96a8]">Событий за 1 час</p>
            <p className="mt-2 text-3xl font-black text-white">{summary?.events_last_hour ?? 0}</p>
            <p className="mt-1 text-[11px] text-[#8b96a8]">Последний час выбранного дня</p>
          </div>
          <div className="rounded-lg border border-[#1d4ed8]/40 bg-[#10213b] p-3 text-[#3b82f6]">
            <Server className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[#20283a] bg-[#101725] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b96a8]">Всего алармов</p>
            <p className="mt-2 text-3xl font-black text-white">{summary?.total ?? 0}</p>
            <p className="mt-1 text-[11px] text-[#8b96a8]">За выбранную дату</p>
          </div>
          <div className="rounded-lg border border-[#ef4444]/40 bg-[#2a1216] p-3 text-[#ff4055]">
            <Bell className="h-5 w-5" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.9fr)] 2xl:grid-cols-[minmax(0,1.5fr)_minmax(420px,0.85fr)]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-[#20283a] bg-[#101725]">
            <div className="flex items-center justify-between border-b border-[#1b2230] px-4 py-3">
              <div className="flex items-center gap-2">
                <RadioTower className="h-4 w-4 text-[#60a5fa]" />
                <h2 className="text-[12px] font-black uppercase tracking-wide text-white">Кластеры аварий</h2>
              </div>
              <span className="rounded border border-[#1d4ed8]/40 bg-[#10213b] px-2 py-1 text-[9px] font-bold text-[#60a5fa]">
                Активные: {topClusters.length}
              </span>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-3 custom-scrollbar">
              {topClusters.length ? (
                <div className="space-y-2">
                  {topClusters.map((cluster) => (
                    <div key={cluster.zone} className="border-l-4 border-[#ff263d] bg-[#0c121e] p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-mono text-[10px] text-[#8b96a8]">{cluster.t_start} — {cluster.t_end}</p>
                          <p className="mt-1 text-[12px] font-black text-white">{cluster.zone}</p>
                          <div className="mt-3 rounded border border-[#20283a] bg-[#121a29] px-3 py-2">
                            <span className="text-[10px] text-[#8b96a8]">BAD ACTOR:</span>{' '}
                            <span className="bg-[#fde047] px-1 font-mono text-[10px] font-black text-black">{cluster.bad_actor}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="text-[9px] text-[#8b96a8]">Состав:</span>
                            {cluster.tags?.slice(0, 3).map((tag) => (
                              <span key={tag} className="rounded bg-[#1b2435] px-2 py-0.5 font-mono text-[8px] text-[#cbd5e1]">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-[#ff4055]">{cluster.count}</p>
                          <p className="text-[8px] uppercase text-[#8b96a8]">алармов</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-[12px] text-[#8b96a8]">Нет активных кластеров</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#20283a] bg-[#101725] p-4">
            <h2 className="text-[11px] font-black uppercase tracking-wide text-[#aab4c3]">График интенсивности за день (по часам)</h2>
            <div className="mt-3 h-[118px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={intensityData}>
                  <CartesianGrid stroke="#1b2230" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="slot" stroke="#687385" tick={{ fontSize: 8 }} interval="preserveStartEnd" />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: '#0b1019', border: '1px solid #263247', borderRadius: 8, fontSize: 11 }} />
                  <Line type="monotone" dataKey="count" stroke="#ff263d" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <SopCard />
      </section>
    </div>
  )
}

export default DashboardPage
