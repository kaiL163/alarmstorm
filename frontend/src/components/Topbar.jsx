import { useEffect, useState } from 'react'

function formatTime(date) {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(date) {
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
}

function Topbar({ selectedDate, setSelectedDate }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-11 items-center justify-between border-b border-border bg-surface px-5 text-xs">
      <div className="flex items-center gap-3 text-muted">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        <span className="font-semibold tracking-[0.05em] text-success">SYSTEM ONLINE</span>
        <span className="text-border">/</span>
        <span className="font-mono">{formatDate(now)}</span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="rounded-xl border border-border bg-bg px-3 py-2 font-mono text-xs text-text outline-none transition [color-scheme:dark] hover:border-accent focus:border-accent"
        />
        <div className="font-mono text-sm font-semibold text-text">
          {formatTime(now)}
        </div>
      </div>
    </div>
  )
}

export default Topbar
