import { AlertCircle, ChevronDown, ChevronUp, Search, TriangleAlert, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAlarmData } from '../context/AlarmDataContext.jsx'

function AlarmsPage() {
  const { alarms, loading, error } = useAlarmData()
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'datetime', direction: 'desc' })
  const [selectedAlarm, setSelectedAlarm] = useState(null)

  const zones = useMemo(() => [...new Set(alarms.map((alarm) => alarm.zone))].sort(), [alarms])

  const displayedAlarms = useMemo(() => {
    const value = query.trim().toLowerCase()

    const filtered = alarms.filter((alarm) => {
      const matchesSearch = !value || [alarm.priority, alarm.timestamp, alarm.tag, alarm.zone, alarm.message, alarm.possible_cause]
        .join(' ')
        .toLowerCase()
        .includes(value)
      const matchesPriority = !priorityFilter || alarm.priority === priorityFilter
      const matchesZone = !zoneFilter || alarm.zone === zoneFilter

      return matchesSearch && matchesPriority && matchesZone
    })

    const priorityRank = { High: 3, Medium: 2, Low: 1 }

    return [...filtered].sort((a, b) => {
      let first = a[sortConfig.key]
      let second = b[sortConfig.key]

      if (sortConfig.key === 'priority') {
        first = priorityRank[a.priority] ?? 0
        second = priorityRank[b.priority] ?? 0
      }

      if (sortConfig.key === 'datetime') {
        first = new Date(a.datetime).getTime()
        second = new Date(b.datetime).getTime()
      }

      if (typeof first === 'string') first = first.toLowerCase()
      if (typeof second === 'string') second = second.toLowerCase()

      if (first < second) return sortConfig.direction === 'asc' ? -1 : 1
      if (first > second) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [alarms, priorityFilter, query, sortConfig, zoneFilter])

  function handleSort(key) {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  function SortIcon({ column }) {
    if (sortConfig.key !== column) {
      return <ChevronDown className="h-3 w-3 opacity-20" />
    }

    return sortConfig.direction === 'asc'
      ? <ChevronUp className="h-3 w-3 text-[#00f5b8]" />
      : <ChevronDown className="h-3 w-3 text-[#00f5b8]" />
  }

  const priorityClass = {
    High: 'text-[#ff4055]',
    Medium: 'text-[#facc15]',
    Low: 'text-[#22c55e]',
  }

  const rowClass = {
    High: 'bg-[#171014] hover:bg-[#211418]',
    Medium: 'bg-[#18150f] hover:bg-[#221b12]',
    Low: 'bg-[#101713] hover:bg-[#152119]',
  }

  const priorityIcon = {
    High: AlertCircle,
    Medium: TriangleAlert,
    Low: AlertCircle,
  }

  if (loading) return <div className="text-[#8b96a8]">Загрузка аварий...</div>
  if (error) return <div className="text-[#ef4444]">{error}</div>

  return (
    <div className="space-y-4">
      <header>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide text-white">Аварии</h1>
            <p className="mt-1 text-[12px] text-[#8b96a8]">Оперативный журнал активных событий</p>
          </div>
          <div className="grid w-full gap-3 lg:w-auto lg:grid-cols-[24rem_11rem_14rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b96a8]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по тегу, зоне, причине..."
                className="w-full rounded-lg border border-[#20283a] bg-[#101725] px-10 py-2.5 text-sm text-white outline-none transition placeholder:text-[#687385] focus:border-[#00f5b8]"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="rounded-lg border border-[#20283a] bg-[#101725] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00f5b8]"
            >
              <option value="" className="bg-[#101725] text-white">Все приоритеты</option>
              <option value="High" className="bg-[#101725] text-white">High</option>
              <option value="Medium" className="bg-[#101725] text-white">Medium</option>
              <option value="Low" className="bg-[#101725] text-white">Low</option>
            </select>
            <select
              value={zoneFilter}
              onChange={(event) => setZoneFilter(event.target.value)}
              className="rounded-lg border border-[#20283a] bg-[#101725] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00f5b8]"
            >
              <option value="" className="bg-[#101725] text-white">Все зоны</option>
              {zones.map((zone) => (
                <option key={zone} value={zone} className="bg-[#101725] text-white">{zone}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-[#20283a] bg-[#090e17]">
        <table className="w-full table-fixed text-left text-[12px]">
          <thead className="border-b border-[#20283a] bg-[#0a0f19] text-[10px] uppercase tracking-[0.16em] text-[#7f8da3]">
            <tr>
              <th className="w-[140px] px-4 py-3">
                <button type="button" onClick={() => handleSort('priority')} className="flex items-center gap-1 hover:text-white">
                  Приоритет <SortIcon column="priority" />
                </button>
              </th>
              <th className="w-[170px] px-4 py-3">
                <button type="button" onClick={() => handleSort('datetime')} className="flex items-center gap-1 hover:text-white">
                  Время <SortIcon column="datetime" />
                </button>
              </th>
              <th className="w-[250px] px-4 py-3">
                <button type="button" onClick={() => handleSort('tag')} className="flex items-center gap-1 hover:text-white">
                  Тег <SortIcon column="tag" />
                </button>
              </th>
              <th className="w-[260px] px-4 py-3">
                <button type="button" onClick={() => handleSort('zone')} className="flex items-center gap-1 hover:text-white">
                  Узел / Зона <SortIcon column="zone" />
                </button>
              </th>
              <th className="px-4 py-3">Сообщение</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#20283a]">
            {displayedAlarms.slice(0, 150).map((alarm, index) => {
              const PriorityIcon = priorityIcon[alarm.priority] ?? AlertCircle

              return (
                <tr
                  key={`${alarm.datetime}-${index}`}
                  onClick={() => setSelectedAlarm(alarm)}
                  className={`cursor-pointer transition ${rowClass[alarm.priority] ?? 'bg-[#101725] hover:bg-[#151d2d]'}`}
                >
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-2 font-bold ${priorityClass[alarm.priority] ?? 'text-[#8b96a8]'}`}>
                      <PriorityIcon className="h-3.5 w-3.5" />
                      {alarm.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#c7d2e0]">{alarm.timestamp}</td>
                  <td className="truncate px-4 py-3 font-mono text-[12px] font-bold text-[#e5e7eb]">{alarm.tag}</td>
                  <td className="truncate px-4 py-3 text-[12px] text-[#cbd5e1]">{alarm.zone}</td>
                  <td className="truncate px-4 py-3 text-[12px] text-[#e5e7eb]">{alarm.message}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-accent">Alarm details</p>
                <h2 className="mt-2 font-mono text-xl font-bold text-text">{selectedAlarm.tag}</h2>
                <p className="mt-1 text-sm text-muted">{selectedAlarm.zone} • {selectedAlarm.datetime}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlarm(null)}
                className="rounded-xl border border-border-muted bg-surface-2 p-2 text-muted transition hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border-muted bg-bg p-4">
                <p className="text-xs uppercase tracking-wider text-muted">Приоритет</p>
                <p className="mt-2 text-lg font-bold text-text">{selectedAlarm.priority}</p>
              </div>
              <div className="rounded-2xl border border-border-muted bg-bg p-4">
                <p className="text-xs uppercase tracking-wider text-muted">Bad Actor</p>
                <p className="mt-2 text-lg font-bold text-text">{selectedAlarm.is_bad_actor ? 'Да' : 'Нет'}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border-muted bg-bg p-4">
              <p className="text-xs uppercase tracking-wider text-muted">Сообщение</p>
              <p className="mt-2 text-text">{selectedAlarm.message}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-border-muted bg-bg p-4">
              <p className="text-xs uppercase tracking-wider text-muted">Возможная причина</p>
              <p className="mt-2 leading-6 text-text">{selectedAlarm.possible_cause}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlarmsPage
