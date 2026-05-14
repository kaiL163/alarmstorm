import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlarmData } from '../context/AlarmDataContext.jsx'

const API_BASE_URL = 'http://127.0.0.1:8000'

function AnalyticsPage() {
  const navigate = useNavigate()
  const { setSelectedDate } = useAlarmData()
  const [dailyAnalytics, setDailyAnalytics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadDailyAnalytics() {
      setLoading(true)
      setError(null)

      try {
        const response = await axios.get(`${API_BASE_URL}/api/analytics`)
        setDailyAnalytics(Array.isArray(response.data) ? response.data : [])
      } catch (requestError) {
        setError(requestError.message || 'Ошибка загрузки аналитики')
      } finally {
        setLoading(false)
      }
    }

    loadDailyAnalytics()
  }, [])

  function openDate(row) {
    setSelectedDate(row.date)
    navigate('/')
  }

  function exportPeriodReport() {
    const lines = [
      '=== ОТЧЕТ ПО АНАЛИТИКЕ ЗА ПЕРИОД ===',
      `Сформировано: ${new Date().toLocaleString('ru-RU')}`,
      '',
      'Дата | Статус | Всего событий | Критических | Главный Bad Actor | Пик интенсивности',
      ...dailyAnalytics.map((row) => (
        `${row.date} | ${row.status} | ${row.total_count} | ${row.critical_count} | ${row.top_bad_actor ?? '—'} | ${row.intensity_peak}`
      )),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `analytics_${new Date().toISOString().slice(0, 10)}.txt`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (loading) return <div className="text-muted">Загрузка аналитики...</div>
  if (error) return <div className="text-danger">{error}</div>

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">Аналитика</h1>
          </div>
          <button
            type="button"
            onClick={exportPeriodReport}
            className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent"
          >
            Экспорт отчета за период
          </button>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-muted bg-surface-2 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Всего событий</th>
              <th className="px-4 py-3">Критических</th>
              <th className="px-4 py-3">Главный Bad Actor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {dailyAnalytics.map((row) => {
              const isStorm = row.status === 'ШТОРМ'

              return (
                <tr
                  key={row.date}
                  onClick={() => openDate(row)}
                  className="cursor-pointer transition hover:bg-surface-2/70"
                >
                  <td className="px-4 py-3 font-mono text-xs text-accent">{row.date}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      isStorm
                        ? 'border-danger/40 bg-danger/10 text-danger'
                        : 'border-success/40 bg-success/10 text-success'
                    }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-text">{row.total_count}</td>
                  <td className="px-4 py-3 font-semibold text-text">{row.critical_count}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{row.top_bad_actor ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AnalyticsPage
