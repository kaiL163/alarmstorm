import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import { AlarmDataProvider } from './context/AlarmDataContext.jsx'
import AlarmsPage from './pages/AlarmsPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import ArchivePage from './pages/ArchivePage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import MonitorPage from './pages/MonitorPage.jsx'

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  return (
    <AlarmDataProvider selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
      <div className="flex min-h-screen bg-bg text-text">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <Topbar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
          <div className="mx-auto w-full max-w-7xl px-6 py-8">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/alarms" element={<AlarmsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/monitor" element={<MonitorPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </AlarmDataProvider>
  )
}

export default App
