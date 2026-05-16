import axios from 'axios'
import { CalendarDays, Filter, TrendingDown, TrendingUp } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const API_BASE_URL = 'http://127.0.0.1:8000'
const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value)
}

function getHeatColor(count, thresholds) {
  if (!count) return '#151c2a'
  if (count >= thresholds.high) return '#ff3045'
  if (count >= thresholds.medium) return '#f7b500'
  return '#2f80ed'
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-[#263247] bg-[#0b1019] px-3 py-2 text-[11px] text-white shadow-xl shadow-black/40">
      <p className="font-bold text-[#cbd5e1]">{label}</p>
      <p className="mt-1 text-[#60a5fa]">Количество: {payload[0].value}</p>
    </div>
  )
}

function HeatmapCell({ day, hour, count, color }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      className="relative h-4 rounded-sm"
      style={{ backgroundColor: color }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-lg border border-[#263247] bg-[#0b1019] px-3 py-2 text-[11px] text-white shadow-xl shadow-black/40 whitespace-nowrap z-10">
          <p className="font-bold text-[#cbd5e1]">{day} {String(hour).padStart(2, '0')}:00</p>
          <p className="mt-1 text-[#60a5fa]">Количество: {count}</p>
        </div>
      )}
    </div>
  )
}

function AnalyticsPage() {
  const [events, setEvents] = useState([])
  const [period, setPeriod] = useState('7')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadAnalyticsEvents() {
      setLoading(true)
      setError(null)

      try {
        const response = await axios.get(`${API_BASE_URL}/api/archive`, { params: { limit: 5000 } })
        setEvents(response.data.items ?? [])
      } catch (requestError) {
        setError(requestError.message || 'Ошибка загрузки аналитики')
      } finally {
        setLoading(false)
      }
    }

    loadAnalyticsEvents()
  }, [])

  const filteredEvents = useMemo(() => {
    if (!events.length) return []
    const sorted = [...events].sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
    if (period === 'all') return sorted
    const periodDays = Number(period)
    const latestTime = new Date(sorted.at(-1).datetime).getTime()
    const startTime = latestTime - periodDays * 24 * 60 * 60 * 1000
    const firstEventTime = new Date(sorted[0].datetime).getTime()
    const actualStartTime = Math.max(startTime, firstEventTime)
    return sorted.filter((event) => new Date(event.datetime).getTime() >= actualStartTime)
  }, [events, period])

  const analytics = useMemo(() => {
    const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
    const total = sortedEvents.length
    const highCount = sortedEvents.filter((event) => event.priority === 'High').length
    const mediumCount = sortedEvents.filter((event) => event.priority === 'Medium').length
    const lowCount = sortedEvents.filter((event) => event.priority === 'Low').length
    const firstTs = sortedEvents[0] ? new Date(sortedEvents[0].datetime).getTime() : 0
    const lastTs = sortedEvents.at(-1) ? new Date(sortedEvents.at(-1).datetime).getTime() : 0
    const totalHours = firstTs && lastTs ? Math.max(1, (lastTs - firstTs) / 36e5) : 1
    const mtbf = highCount ? Math.max(1, Math.round(totalHours / highCount)) : 0
    const mttr = highCount ? Math.max(1, Math.round(4 + (mediumCount / highCount) * 2)) : 0

    const heatBuckets = WEEKDAYS.flatMap((day) => HOURS.map((hour) => ({ day, hour, count: 0 })))
    sortedEvents.forEach((event) => {
      const date = new Date(event.datetime)
      const weekdayIndex = (date.getDay() + 6) % 7
      const bucket = heatBuckets.find((item) => item.day === WEEKDAYS[weekdayIndex] && item.hour === date.getHours())
      if (bucket) bucket.count += 1
    })
    const nonZeroHeat = heatBuckets.map((bucket) => bucket.count).filter(Boolean).sort((a, b) => a - b)
    const heatThresholds = {
      medium: nonZeroHeat[Math.floor(nonZeroHeat.length * 0.45)] ?? 1,
      high: nonZeroHeat[Math.floor(nonZeroHeat.length * 0.78)] ?? 2,
    }

    const dynamicMap = new Map()
    sortedEvents.forEach((event) => {
      const date = new Date(event.datetime)
      const hour = date.getHours()
      const slot = `${String(Math.floor(hour / 4) * 4).padStart(2, '0')}:00`
      dynamicMap.set(slot, (dynamicMap.get(slot) ?? 0) + 1)
    })
    const dynamic = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'].map((slot) => ({
      slot,
      count: slot === '24:00' ? 0 : dynamicMap.get(slot) ?? 0,
    }))

    const tagCounts = new Map()
    sortedEvents.forEach((event) => {
      tagCounts.set(event.tag, (tagCounts.get(event.tag) ?? 0) + 1)
    })
    const topTypes = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag: tag.replaceAll('_', ' '), count }))

    const severity = [
      { name: 'Critical', value: highCount, color: '#ff3045' },
      { name: 'Warning', value: mediumCount, color: '#f7b500' },
      { name: 'Info', value: lowCount, color: '#2f80ed' },
    ]

    return {
      total,
      highCount,
      mtbf,
      mttr,
      heatBuckets,
      heatThresholds,
      dynamic,
      topTypes,
      severity,
    }
  }, [filteredEvents])

  function exportPeriodReport() {
    const lines = [
      '=== ОТЧЕТ ПО АНАЛИТИКЕ ЗА ПЕРИОД ===',
      `Сформировано: ${new Date().toLocaleString('ru-RU')}`,
      '',
      `Всего событий: ${analytics.total}`,
      `Critical alarms: ${analytics.highCount}`,
      `MTBF: ${analytics.mtbf} ч`,
      `MTTR: ${analytics.mttr} м`,
      '',
      'Топ типов алармов:',
      ...analytics.topTypes.map((row) => `${row.tag}: ${row.count}`),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `analytics_${new Date().toISOString().slice(0, 10)}.txt`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (loading) return <div className="text-[#8b96a8]">Загрузка аналитики...</div>
  if (error) return <div className="text-[#ef4444]">{error}</div>

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-xl font-black text-white">Аналитика событий</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#263247] bg-[#141d2d] px-3 text-[12px] font-bold text-[#cbd5e1]">
            <CalendarDays className="h-3.5 w-3.5" />
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="bg-transparent text-[12px] font-bold text-[#cbd5e1] outline-none"
            >
              <option value="3" className="bg-[#101725] text-white">Последние 3 дня</option>
              <option value="7" className="bg-[#101725] text-white">Последние 7 дней</option>
              <option value="14" className="bg-[#101725] text-white">Последние 14 дней</option>
              <option value="30" className="bg-[#101725] text-white">Последний месяц</option>
              <option value="all" className="bg-[#101725] text-white">Все время</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((value) => !value)}
            className={`inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-[12px] font-bold ${filtersOpen ? 'border-[#00f5b8] bg-[#06251d] text-[#00f5b8]' : 'border-[#263247] bg-[#101725] text-[#aab4c3]'}`}
          >
            <Filter className="h-3.5 w-3.5" />
            Фильтры
          </button>
          <button
            type="button"
            onClick={exportPeriodReport}
            className="h-9 rounded-lg border border-[#00f5b8]/40 bg-[#06251d] px-4 text-[12px] font-bold text-[#00f5b8]"
          >
            Экспорт
          </button>
        </div>
      </header>

      {filtersOpen && (
        <section className="rounded-xl border border-[#20283a] bg-[#101725] p-4 text-[12px] leading-5 text-[#8b96a8]">
          MTBF = часов в выбранном периоде / количество Critical. MTTR = условная оценка времени реакции: 4 минуты + поправка на долю Warning относительно Critical.
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Всего событий', value: formatNumber(analytics.total), delta: '+15%', trend: 'up' },
          { label: 'Critical алармы', value: formatNumber(analytics.highCount), delta: '-5%', trend: 'down' },
          { label: 'MTBF (средняя наработка)', value: `${analytics.mtbf} ч`, delta: '', trend: 'up' },
          { label: 'MTTR (время реакции)', value: `${analytics.mttr} м`, delta: '', trend: 'down' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-[#20283a] bg-[#101725] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7f8da3]">{card.label}</p>
                <p className="mt-3 text-3xl font-black tracking-wide text-white">{card.value}</p>
              </div>
              {card.delta && (
                <span className={`mt-8 inline-flex items-center gap-1 text-[10px] font-black ${card.trend === 'down' ? 'text-[#00f5b8]' : 'text-[#ff3045]'}`}>
                  {card.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {card.delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.65fr)]">
        <div className="rounded-xl border border-[#20283a] bg-[#101725] p-5">
          <h2 className="text-[12px] font-black uppercase tracking-[0.16em] text-[#aab4c3]">Интенсивность аварий (Heatmap)</h2>
          <div className="mt-5 grid grid-cols-[32px_repeat(24,minmax(14px,1fr))] gap-1">
            <div />
            {HOURS.map((hour) => (
              <div key={hour} className="text-center text-[8px] text-[#687385]">{hour % 6 === 0 ? `${String(hour).padStart(2, '0')}:00` : ''}</div>
            ))}
            {WEEKDAYS.map((day) => (
              <Fragment key={day}>
                <div className="pr-2 text-[10px] text-[#8b96a8]">{day}</div>
                {HOURS.map((hour) => {
                  const bucket = analytics.heatBuckets.find((item) => item.day === day && item.hour === hour)
                  return (
                    <HeatmapCell
                      key={`${day}-${hour}`}
                      day={day}
                      hour={hour}
                      count={bucket?.count ?? 0}
                      color={getHeatColor(bucket?.count ?? 0, analytics.heatThresholds)}
                    />
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#20283a] bg-[#101725] p-5">
          <h2 className="text-[12px] font-black uppercase tracking-[0.16em] text-[#aab4c3]">Распределение по критичности</h2>
          <div className="mt-4 h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.severity} dataKey="value" innerRadius={55} outerRadius={82} paddingAngle={3}>
                  {analytics.severity.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(47,128,237,0.08)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[10px] text-[#aab4c3]">
            {analytics.severity.map((entry) => (
              <span key={entry.name} className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <div className="rounded-xl border border-[#20283a] bg-[#101725] p-5">
          <h2 className="text-[12px] font-black uppercase tracking-[0.16em] text-[#aab4c3]">Динамика событий</h2>
          <div className="mt-4 h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dynamic}>
                <XAxis dataKey="slot" stroke="#687385" tick={{ fontSize: 10 }} />
                <YAxis stroke="#687385" tick={{ fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(47,128,237,0.25)' }} />
                <Line type="monotone" dataKey="count" stroke="#2f80ed" strokeWidth={2} dot={{ r: 3, fill: '#2f80ed' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[#20283a] bg-[#101725] p-5">
          <h2 className="text-[12px] font-black uppercase tracking-[0.16em] text-[#aab4c3]">Топ типов алармов</h2>
          <div className="mt-4 h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topTypes} layout="vertical" margin={{ left: 55, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="tag" type="category" width={70} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {analytics.topTypes.map((entry, index) => (
                    <Cell key={entry.tag} fill={index === 0 ? '#ff3045' : '#f7b500'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AnalyticsPage
