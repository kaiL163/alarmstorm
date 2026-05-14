import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
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
      return <ChevronDown className="h-3 w-3 opacity-30" />
    }

    return sortConfig.direction === 'asc'
      ? <ChevronUp className="h-3 w-3 text-accent" />
      : <ChevronDown className="h-3 w-3 text-accent" />
  }

  const priorityClass = {
    High: 'border-danger/40 bg-danger/10 text-danger',
    Medium: 'border-warning/40 bg-warning/10 text-warning',
    Low: 'border-success/40 bg-success/10 text-success',
  }

  if (loading) return <div className="text-muted">Загрузка аварий...</div>
  if (error) return <div className="text-danger">{error}</div>

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Аварии</h1>
          </div>
          <div className="grid w-full gap-3 lg:w-auto lg:grid-cols-[24rem_11rem_14rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по тегу, зоне, причине..."
                className="w-full rounded-xl border border-border bg-surface px-10 py-2.5 text-sm text-text outline-none transition placeholder:text-muted focus:border-accent"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            >
              <option value="" className="bg-surface text-text">Все приоритеты</option>
              <option value="High" className="bg-surface text-text">High</option>
              <option value="Medium" className="bg-surface text-text">Medium</option>
              <option value="Low" className="bg-surface text-text">Low</option>
            </select>
            <select
              value={zoneFilter}
              onChange={(event) => setZoneFilter(event.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            >
              <option value="" className="bg-surface text-text">Все зоны</option>
              {zones.map((zone) => (
                <option key={zone} value={zone} className="bg-surface text-text">{zone}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-muted bg-surface-2 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">
                <button type="button" onClick={() => handleSort('datetime')} className="flex items-center gap-1 hover:text-text">
                  Время <SortIcon column="datetime" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => handleSort('priority')} className="flex items-center gap-1 hover:text-text">
                  Приоритет <SortIcon column="priority" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => handleSort('tag')} className="flex items-center gap-1 hover:text-text">
                  Тег <SortIcon column="tag" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => handleSort('zone')} className="flex items-center gap-1 hover:text-text">
                  Зона <SortIcon column="zone" />
                </button>
              </th>
              <th className="px-4 py-3">Сообщение</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {displayedAlarms.slice(0, 150).map((alarm, index) => (
              <tr
                key={`${alarm.datetime}-${index}`}
                onClick={() => setSelectedAlarm(alarm)}
                className="cursor-pointer hover:bg-surface-2/70"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted">{alarm.timestamp}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-1 text-xs ${priorityClass[alarm.priority] ?? 'border-border text-muted'}`}>
                    {alarm.priority}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-accent">{alarm.tag}</td>
                <td className="px-4 py-3 text-text">{alarm.zone}</td>
                <td className="px-4 py-3 text-muted">{alarm.message}</td>
              </tr>
            ))}
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
