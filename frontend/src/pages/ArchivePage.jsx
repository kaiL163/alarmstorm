import { CalendarDays, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAlarmData } from '../context/AlarmDataContext.jsx'

const PAGE_SIZE = 20

function ArchivePage() {
  const { archive, archiveLoading, loadArchive, loading, error } = useAlarmData()
  const [selectedDay, setSelectedDay] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [sortConfig, setSortConfig] = useState({ key: 'datetime', direction: 'desc' })

  useEffect(() => {
    if (!loading) {
      loadArchive(selectedDay || undefined)
      setCurrentPage(1)
    }
  }, [selectedDay])

  const sortedItems = useMemo(() => {
    const priorityRank = { High: 3, Medium: 2, Low: 1 }

    return [...(archive?.items ?? [])].sort((a, b) => {
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
  }, [archive?.items, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageItems = sortedItems.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE)

  useEffect(() => {
    setPageInput(String(safeCurrentPage))
  }, [safeCurrentPage])

  function handleSort(key) {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
    setCurrentPage(1)
  }

  function applyPageInput() {
    const nextPage = Number(pageInput)

    if (!Number.isInteger(nextPage)) {
      setPageInput(String(safeCurrentPage))
      return
    }

    setCurrentPage(Math.min(totalPages, Math.max(1, nextPage)))
  }

  function SortIcon({ column }) {
    if (sortConfig.key !== column) {
      return <ChevronDown className="h-3 w-3 opacity-30" />
    }

    return sortConfig.direction === 'asc'
      ? <ChevronUp className="h-3 w-3 text-accent" />
      : <ChevronDown className="h-3 w-3 text-accent" />
  }

  if (loading) return <div className="text-muted">Загрузка архива...</div>
  if (error) return <div className="text-danger">{error}</div>

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Архив</h1>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
            <CalendarDays className="h-4 w-4 text-accent" />
            <select
              value={selectedDay}
              onChange={(event) => setSelectedDay(event.target.value)}
              className="bg-transparent text-sm text-text outline-none"
            >
              <option value="" className="bg-surface text-text">Все даты</option>
              {archive?.available_days?.map((day) => (
                <option key={day} value={day} className="bg-surface text-text">{day}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Всего записей</p>
          <p className="mt-1 text-3xl font-bold text-text">{archive?.total ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Активный фильтр</p>
          <p className="mt-1 font-mono text-xl font-bold text-accent">{selectedDay || 'Все даты'}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <Filter className="h-6 w-6 text-warning" />
          <p className="mt-3 text-sm text-muted">{archiveLoading ? 'Обновление архива...' : 'Фильтр применён'}</p>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-muted bg-surface-2 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">
                <button type="button" onClick={() => handleSort('date')} className="flex items-center gap-1 hover:text-text">
                  Дата <SortIcon column="date" />
                </button>
              </th>
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
              <th className="px-4 py-3">Причина</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {pageItems.map((alarm, index) => (
              <tr key={`${alarm.datetime}-${index}`} className="hover:bg-surface-2/70">
                <td className="px-4 py-3 font-mono text-xs text-muted">{alarm.date}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{alarm.timestamp}</td>
                <td className="px-4 py-3 text-text">{alarm.priority}</td>
                <td className="px-4 py-3 font-mono text-xs text-accent">{alarm.tag}</td>
                <td className="px-4 py-3 text-text">{alarm.zone}</td>
                <td className="max-w-lg px-4 py-3 text-muted">{alarm.possible_cause}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col gap-3 border-t border-border-muted px-4 py-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span>Страница</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              onBlur={applyPageInput}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  applyPageInput()
                }
              }}
              className="w-20 rounded-lg border border-border bg-bg px-3 py-2 text-center font-mono text-text outline-none focus:border-accent"
            />
            <span>из {totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-text transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Предыдущая
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-text transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Следующая
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArchivePage
