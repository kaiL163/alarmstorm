import { ChevronDown, ChevronUp, Clock3, Download, FileText, Search, SlidersHorizontal } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useAlarmData } from '../context/AlarmDataContext.jsx'

const EVENTS_PER_DAY_STEP = 8

function escapePdfText(value) {
  return String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replace(/[^\x20-\x7E]/g, '?')
}

function createPdfBlob(lines) {
  const pageLines = []
  for (let index = 0; index < lines.length; index += 36) {
    pageLines.push(lines.slice(index, index + 36))
  }

  const pages = pageLines.length ? pageLines : [['AlarmStorm report', 'No data']]
  const objects = []
  const pageObjectIds = []

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'

  pages.forEach((page, index) => {
    const contentId = 4 + index * 2
    const pageId = contentId + 1
    pageObjectIds.push(pageId)
    const streamLines = [
      'BT',
      '/F1 10 Tf',
      '40 800 Td',
      '14 TL',
      ...page.map((line, index) => `${index === 0 ? '' : 'T* '}(${escapePdfText(line)}) Tj`),
      'ET',
    ]
    const stream = streamLines.join('\n')
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`
  })

  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`

  const body = ['%PDF-1.4']
  const offsets = [0]

  objects.slice(1).forEach((object, index) => {
    offsets.push(body.join('\n').length + 1)
    body.push(`${index + 1} 0 obj`)
    body.push(object)
    body.push('endobj')
  })

  const xrefOffset = body.join('\n').length + 1
  body.push('xref')
  body.push(`0 ${objects.length}`)
  body.push('0000000000 65535 f ')
  offsets.slice(1).forEach((offset) => {
    body.push(`${String(offset).padStart(10, '0')} 00000 n `)
  })
  body.push('trailer')
  body.push(`<< /Size ${objects.length} /Root 1 0 R >>`)
  body.push('startxref')
  body.push(String(xrefOffset))
  body.push('%%EOF')

  return new Blob([body.join('\n')], { type: 'application/pdf' })
}

function ArchivePage() {
  const { archive, loadArchive, archiveLoading, archiveError } = useAlarmData()
  const [selectedDay, setSelectedDay] = useState('')
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [collapsedDays, setCollapsedDays] = useState({})
  const [visibleByDay, setVisibleByDay] = useState({})
  const [sortConfig, setSortConfig] = useState({ key: 'datetime', direction: 'desc' })

  useEffect(() => {
    loadArchive(selectedDay || undefined)
  }, [selectedDay])

  // Инициализируем все даты как свернутые по умолчанию
  useEffect(() => {
    if (archive?.items) {
      const dates = [...new Set(archive.items.map((alarm) => alarm.date))]
      setCollapsedDays(
        dates.reduce((acc, date) => {
          acc[date] = true
          return acc
        }, {})
      )
    }
  }, [archive?.items])

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
    const lines = [
      'AlarmStorm report',
      `Generated: ${new Date().toLocaleString('ru-RU')}`,
      `Rows: ${sortedItems.length}`,
      '',
      'Date | Time | Priority | Tag | Zone | Message',
      ...sortedItems.map((alarm) => (
        `${alarm.date} | ${alarm.timestamp} | ${alarm.priority} | ${alarm.tag} | ${alarm.zone} | ${alarm.message}`
      )),
    ]
    const link = document.createElement('a')
    link.href = URL.createObjectURL(createPdfBlob(lines))
    link.download = `alarmstorm_report_${new Date().toISOString().slice(0, 10)}.pdf`
    link.click()
    URL.revokeObjectURL(link.href)
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

  if (archiveLoading) return <div className="text-[#8b96a8]">Загрузка архива...</div>
  if (archiveError) return <div className="text-[#ef4444]">{archiveError}</div>

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
            className="appearance-none h-9 rounded-lg border border-[#263247] bg-[#101725] px-3 pr-8 text-[12px] text-white outline-none focus:border-[#00f5b8] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMiA0TDYgOEwxMCA0IiBzdHJva2U9IiM4Yjk2YTgiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=')] bg-no-repeat bg-[right_10px_center]"
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
            className="h-9 appearance-none rounded-lg border border-[#263247] bg-[#0b111d] px-3 pr-9 text-[12px] text-white outline-none focus:border-[#00f5b8] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMiA0TDYgOEwxMCA0IiBzdHJva2U9IiM4Yjk2YTgiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=')] bg-no-repeat bg-[right_12px_center]"
          >
            <option value="" className="bg-[#101725] text-white">Все приоритеты</option>
            <option value="High" className="bg-[#101725] text-white">High</option>
            <option value="Medium" className="bg-[#101725] text-white">Medium</option>
            <option value="Low" className="bg-[#101725] text-white">Low</option>
          </select>
          <select
            value={zoneFilter}
            onChange={(event) => setZoneFilter(event.target.value)}
            className="h-9 appearance-none rounded-lg border border-[#263247] bg-[#0b111d] px-3 pr-9 text-[12px] text-white outline-none focus:border-[#00f5b8] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMiA0TDYgOEwxMCA0IiBzdHJva2U9IiM4Yjk2YTgiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=')] bg-no-repeat bg-[right_12px_center]"
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
