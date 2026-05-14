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
      <div className="rounded-2xl border border-danger/40 bg-danger/10 p-5">
        <AlertTriangle className="h-6 w-6 text-danger" />
        <p className="mt-4 text-xs uppercase tracking-wider text-danger/80">Статус системы</p>
        <p className="mt-1 text-xl font-bold text-danger">ШТОРМ АВАРИЙ</p>
        <p className="mt-2 text-xs text-danger/80">↗ {stormPriorityCount} High + Medium за день</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-success/40 bg-success/10 p-5">
      <ShieldCheck className="h-6 w-6 text-success" />
      <p className="mt-4 text-xs uppercase tracking-wider text-success/80">Статус системы</p>
      <p className="mt-1 text-xl font-bold text-success">НОРМА</p>
      <p className="mt-2 text-xs text-success/80">{stormPriorityCount} High + Medium за день</p>
    </div>
  )
}

export default SystemStatusCard
