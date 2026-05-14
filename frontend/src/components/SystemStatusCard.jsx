import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { useAlarmData } from '../context/AlarmDataContext.jsx'

function SystemStatusCard() {
  const { analytics } = useAlarmData()
  const summary = analytics?.analytics
  const activeDate = analytics?.date ?? analytics?.latest_day
  const stormToday = summary?.storm_days?.find((day) => day.date === activeDate)
  const isStorm = Boolean(stormToday?.is_storm)
  const stormPriorityCount = stormToday?.high_medium_count ?? stormToday?.high_count ?? 0

  if (isStorm) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-[#ef4444]/40 bg-[#25111b] p-4 shadow-[0_0_22px_rgba(239,68,68,0.12)]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ef4444]/40 bg-[#ef4444]/10">
          <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ca3af]">Статус системы</p>
          <p className="mt-2 text-[12px] font-black uppercase text-[#ff4055]">Шторм аварий</p>
          <p className="mt-2 text-[11px] font-bold text-[#ff4055]">↗ &gt;50 событий</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#22c55e]/40 bg-[#0f2119] p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10">
        <ShieldCheck className="h-4 w-4 text-[#22c55e]" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ca3af]">Статус системы</p>
        <p className="mt-2 text-[12px] font-black uppercase text-[#22c55e]">Норма</p>
        <p className="mt-2 text-[11px] font-bold text-[#22c55e]">{stormPriorityCount} High + Medium</p>
      </div>
    </div>
  )
}

export default SystemStatusCard
