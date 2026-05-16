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
import SettingsPage from './pages/SettingsPage.jsx'

function App() {
  const [selectedDate, setSelectedDate] = useState('')

  return (
    <AlarmDataProvider selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
      <div className="flex min-h-screen bg-[#070b12] text-text">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <Topbar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
          <div className="w-full px-3 py-4 xl:px-5">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/alarms" element={<AlarmsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/monitor" element={<MonitorPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </AlarmDataProvider>
  )
}

export default App
