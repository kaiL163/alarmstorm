import axios from 'axios'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const API_BASE_URL = 'http://127.0.0.1:8000'

const AlarmDataContext = createContext(null)

export function AlarmDataProvider({ children, selectedDate, setSelectedDate }) {
  const [alarms, setAlarms] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [monitor, setMonitor] = useState(null)
  const [archive, setArchive] = useState(null)
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadData(date) {
    setLoading(true)
    setError(null)

    try {
      const params = date ? { date } : undefined
      const [alarmsResponse, analyticsResponse, monitorResponse, archiveResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/alarms`, { params }),
        axios.get(`${API_BASE_URL}/api/analytics`, { params }),
        axios.get(`${API_BASE_URL}/api/monitor`),
        axios.get(`${API_BASE_URL}/api/archive`, { params: { limit: 5000 } }),
      ])

      setAlarms(alarmsResponse.data)
      setAnalytics(analyticsResponse.data)
      setMonitor(monitorResponse.data)
      setArchive(archiveResponse.data)
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        setAlarms([])
        setAnalytics(null)
        setError('Нет данных за выбранный период')
      } else {
        setError(requestError.message || 'Ошибка загрузки данных')
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadArchive(day) {
    setArchiveLoading(true)
    setError(null)

    try {
      const response = await axios.get(`${API_BASE_URL}/api/archive`, {
        params: { ...(day ? { day } : {}), limit: 5000 },
      })
      setArchive(response.data)
    } catch (requestError) {
      setError(requestError.message || 'Ошибка загрузки архива')
    } finally {
      setArchiveLoading(false)
    }
  }

  async function loadLatestAvailableDate() {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(`${API_BASE_URL}/api/archive`, {
        params: { limit: 1 },
      })
      setArchive(response.data)
      setSelectedDate(response.data.available_days?.at(-1) ?? '')
    } catch (requestError) {
      setError(requestError.message || 'Ошибка загрузки доступных дат')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedDate) {
      loadLatestAvailableDate()
      return
    }

    loadData(selectedDate || undefined)
  }, [selectedDate])

  const value = useMemo(() => ({
    alarms,
    analytics,
    monitor,
    archive,
    selectedDate,
    setSelectedDate,
    archiveLoading,
    loading,
    error,
    loadArchive,
    reload: () => loadData(selectedDate || undefined),
  }), [alarms, analytics, monitor, archive, selectedDate, setSelectedDate, archiveLoading, loading, error])

  return <AlarmDataContext.Provider value={value}>{children}</AlarmDataContext.Provider>
}

export function useAlarmData() {
  const context = useContext(AlarmDataContext)

  if (!context) {
    throw new Error('useAlarmData must be used within AlarmDataProvider')
  }

  return context
}
