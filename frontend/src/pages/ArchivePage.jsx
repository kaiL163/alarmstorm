import { ChevronDown, ChevronUp, Clock3, Download, FileText, Search, SlidersHorizontal } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useAlarmData } from '../context/AlarmDataContext.jsx'

const EVENTS_PER_DAY_STEP = 8

function ArchivePage() {
  const { archive, loadArchive, loading, error } = useAlarmData()
  const [selectedDay, setSelectedDay] = useState('')
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [collapsedDays, setCollapsedDays] = useState({})
  const [visibleByDay, setVisibleByDay] = useState({})
  const [sortConfig, setSortConfig] = useState({ key: 'datetime', direction: 'desc' })

  useEffect(() => {
    if (!loading) {
      loadArchive(selectedDay || undefined)
    }
  }, [selectedDay])

  const sortedItems = useMemo(() => {
    const priorityRank = { High: 3, Medium: 2, Low: 1 }

    const value = query.trim().toLowerCase()
    const filtered = (archive?.items ?? []).filter((alarm) => (
      (!value || [alarm.tag, alarm.zone, alarm.priority, alarm.message, alarm.possible_cause]
        .join(' ')
        .toLowerCase()
        .includes(value))
      && (!priorityFilter || alarm.priority === priorityFilter)
      && (!zoneFilter || alarm.zone === zoneFilter)
    ))

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
  }, [archive?.items, priorityFilter, query, sortConfig, zoneFilter])

  const zones = useMemo(() => [...new Set((archive?.items ?? []).map((alarm) => alarm.zone))].sort(), [archive?.items])

  function handleSort(key) {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  function toggleDay(day) {
    setCollapsedDays((current) => ({
      ...current,
      [day]: !current[day],
    }))
  }

  function showMoreForDay(day) {
    setVisibleByDay((current) => ({
      ...current,
      [day]: (current[day] ?? EVENTS_PER_DAY_STEP) + EVENTS_PER_DAY_STEP,
    }))
  }

  function exportCsv() {
    const rows = [
      ['date', 'time', 'priority', 'tag', 'zone', 'message', 'possible_cause'],
      ...sortedItems.map((alarm) => [
        alarm.date,
        alarm.timestamp,
        alarm.priority,
        alarm.tag,
        alarm.zone,
        alarm.message,
        alarm.possible_cause,
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.download = `alarmstorm_report_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  function exportPdf() {
    const rows = sortedItems.map((alarm) => (
      `<tr><td>${alarm.date}</td><td>${alarm.timestamp}</td><td>${alarm.priority}</td><td>${alarm.tag}</td><td>${alarm.zone}</td><td>${alarm.message}</td></tr>`
    )).join('')
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>AlarmStorm report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>AlarmStorm report</h1>
          <p>Generated: ${new Date().toLocaleString('ru-RU')}</p>
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Priority</th><th>Tag</th><th>Zone</th><th>Message</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  function SortIcon({ column }) {
    if (sortConfig.key !== column) {
      return <ChevronDown className="h-3 w-3 opacity-20" />
    }

    return sortConfig.direction === 'asc'
      ? <ChevronUp className="h-3 w-3 text-[#00f5b8]" />
      : <ChevronDown className="h-3 w-3 text-[#00f5b8]" />
  }

  const groupedPageItems = sortedItems.reduce((acc, alarm) => {
    if (!acc[alarm.date]) acc[alarm.date] = []
    acc[alarm.date].push(alarm)
    return acc
  }, {})

  const priorityClass = {
    High: 'border-[#ef4444]/45 bg-[#2a1216] text-[#ff4055]',
    Medium: 'border-[#f59e0b]/45 bg-[#2a1d0f] text-[#facc15]',
    Low: 'border-[#3b82f6]/45 bg-[#10213b] text-[#60a5fa]',
  }

  const priorityLabel = {
    High: 'CRITICAL',
    Medium: 'WARNING',
    Low: 'INFO',
  }

  if (loading) return <div className="text-[#8b96a8]">Загрузка архива...</div>
  if (error) return <div className="text-[#ef4444]">{error}</div>

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-white">Отчеты и история</h1>
          <span className="rounded-md border border-[#263247] bg-[#141d2d] px-3 py-1.5 text-[11px] font-bold text-[#aab4c3]">
            Всего записей: {archive?.total ?? 0}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8b96a8]" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setVisibleByDay({})
              }}
              placeholder="Поиск по тегу, зоне..."
              className="h-9 w-80 rounded-lg border border-[#263247] bg-[#101725] px-9 text-[12px] text-white outline-none placeholder:text-[#687385] focus:border-[#00f5b8]"
            />
          </div>
          <select
            value={selectedDay}
            onChange={(event) => {
              setSelectedDay(event.target.value)
              setVisibleByDay({})
            }}
            className="h-9 rounded-lg border border-[#263247] bg-[#101725] px-3 text-[12px] text-white outline-none focus:border-[#00f5b8]"
          >
            <option value="" className="bg-[#101725] text-white">Все даты</option>
            {archive?.available_days?.map((day) => (
              <option key={day} value={day} className="bg-[#101725] text-white">{day}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFiltersOpen((value) => !value)}
            className={`h-9 rounded-lg border px-3 ${filtersOpen ? 'border-[#00f5b8] bg-[#06251d] text-[#00f5b8]' : 'border-[#263247] bg-[#101725] text-[#9ca3af]'}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button type="button" onClick={exportPdf} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#1d4ed8]/50 bg-[#10213b] px-4 text-[12px] font-bold text-[#60a5fa]">
            <FileText className="h-3.5 w-3.5" />
            PDF
          </button>
          <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#00f5b8]/40 bg-[#06251d] px-4 text-[12px] font-bold text-[#00f5b8]">
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
        </div>
      </header>

      {filtersOpen && (
        <section className="grid gap-3 rounded-xl border border-[#20283a] bg-[#101725] p-4 md:grid-cols-3">
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="h-9 rounded-lg border border-[#263247] bg-[#0b111d] px-3 text-[12px] text-white outline-none focus:border-[#00f5b8]"
          >
            <option value="" className="bg-[#101725] text-white">Все приоритеты</option>
            <option value="High" className="bg-[#101725] text-white">High</option>
            <option value="Medium" className="bg-[#101725] text-white">Medium</option>
            <option value="Low" className="bg-[#101725] text-white">Low</option>
          </select>
          <select
            value={zoneFilter}
            onChange={(event) => setZoneFilter(event.target.value)}
            className="h-9 rounded-lg border border-[#263247] bg-[#0b111d] px-3 text-[12px] text-white outline-none focus:border-[#00f5b8]"
          >
            <option value="" className="bg-[#101725] text-white">Все зоны</option>
            {zones.map((zone) => (
              <option key={zone} value={zone} className="bg-[#101725] text-white">{zone}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setPriorityFilter('')
              setZoneFilter('')
              setQuery('')
              setVisibleByDay({})
            }}
            className="h-9 rounded-lg border border-[#263247] bg-[#0b111d] px-3 text-[12px] font-bold text-[#aab4c3] transition hover:border-[#00f5b8]"
          >
            Сбросить фильтры
          </button>
        </section>
      )}

      <div className="overflow-hidden rounded-xl border border-[#20283a] bg-[#090e17]">
        <table className="w-full table-fixed text-left text-[12px]">
          <thead className="border-b border-[#20283a] bg-[#141b2a] text-[10px] uppercase tracking-[0.16em] text-[#7f8da3]">
            <tr>
              <th className="w-[150px] px-4 py-3">
                <button type="button" onClick={() => handleSort('datetime')} className="flex items-center gap-1 hover:text-white">
                  Дата / Время <SortIcon column="datetime" />
                </button>
              </th>
              <th className="w-[150px] px-4 py-3">
                <button type="button" onClick={() => handleSort('priority')} className="flex items-center gap-1 hover:text-white">
                  Приоритет <SortIcon column="priority" />
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
              <th className="w-[240px] px-4 py-3">Событие</th>
              <th className="w-[150px] px-4 py-3">Оператор</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#20283a]">
            {Object.entries(groupedPageItems).map(([date, items]) => {
              const visibleCount = visibleByDay[date] ?? EVENTS_PER_DAY_STEP
              const visibleItems = items.slice(0, visibleCount)
              const hasMore = visibleCount < items.length

              return (
              <Fragment key={date}>
                <tr key={`${date}-group`} className="bg-[#111827]">
                  <td className="px-4 py-3 font-bold text-white">
                    <button
                      type="button"
                      onClick={() => toggleDay(date)}
                      className="inline-flex items-center gap-2 text-left transition hover:text-[#00f5b8]"
                    >
                      <ChevronDown className={`h-3.5 w-3.5 text-[#8b96a8] transition ${collapsedDays[date] ? '-rotate-90' : ''}`} />
                      <span>{date}</span>
                      <span className="text-[10px] text-[#687385]">({items.length})</span>
                    </button>
                  </td>
                  <td className="px-4 py-3" colSpan={5}>
                    <span className="text-[12px] text-[#aab4c3]">
                      {items.length > 50 ? 'Шторм аварий' : 'Штатный режим'}. {items.length} событий
                    </span>
                  </td>
                </tr>
                {!collapsedDays[date] && visibleItems.map((alarm, index) => (
                  <tr key={`${alarm.datetime}-${index}`} className="bg-[#0c121e] transition hover:bg-[#121b2b]">
                    <td className="px-4 py-3 font-mono text-[11px] text-[#9ca3af]">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-3 w-3" />
                        {alarm.timestamp}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded border px-2 py-1 text-[10px] font-black ${priorityClass[alarm.priority] ?? priorityClass.Low}`}>
                        {priorityLabel[alarm.priority] ?? alarm.priority}
                      </span>
                    </td>
                    <td className="truncate px-4 py-3 font-mono text-[11px] font-bold text-white">{alarm.tag}</td>
                    <td className="truncate px-4 py-3 text-[12px] text-[#cbd5e1]">{alarm.zone}</td>
                    <td className="truncate px-4 py-3 text-[12px] text-white">{alarm.message}</td>
                    <td className="px-4 py-3 text-[12px] text-[#8b96a8]">Operator #04</td>
                  </tr>
                ))}
                {!collapsedDays[date] && hasMore && (
                  <tr className="bg-[#0c121e]">
                    <td className="px-4 py-3" colSpan={6}>
                      <button
                        type="button"
                        onClick={() => showMoreForDay(date)}
                        className="rounded-md border border-[#263247] bg-[#101725] px-3 py-1.5 text-[11px] font-bold text-[#60a5fa] transition hover:border-[#60a5fa]"
                      >
                        Показать ещё {Math.min(EVENTS_PER_DAY_STEP, items.length - visibleCount)} из {items.length - visibleCount}
                      </button>
                    </td>
                  </tr>
                )}
              </Fragment>
              )
            })}
          </tbody>
        </table>
        <div className="border-t border-[#20283a] px-4 py-3 text-[12px] text-[#8b96a8]">
          Показано групп по датам: {Object.keys(groupedPageItems).length}. Всего событий после фильтра: {sortedItems.length}.
        </div>
      </div>
    </div>
  )
}

export default ArchivePage
