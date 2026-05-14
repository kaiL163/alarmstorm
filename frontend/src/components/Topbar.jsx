import { useEffect, useState } from 'react'

function formatTime(date) {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(date) {
  return date.toLocaleDateString('ru-RU')
}

function Topbar({ selectedDate, setSelectedDate }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-[43px] items-center justify-between border-b border-[#1b2230] bg-[#090e17] px-4 text-[10px]">
      <div className="flex items-center gap-3 text-[#8b96a8]">
        <span className="rounded-md border border-[#173b42] bg-[#102337] px-3 py-1 font-bold uppercase tracking-wide text-[#00f5b8]">
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#00f5b8]" />
          System Online
        </span>
        <span>/</span>
        <span>Узел: Нефтепереработка, Цех 1</span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="h-7 rounded-md border border-[#1b2230] bg-[#0d1422] px-2 font-mono text-[10px] text-white outline-none transition [color-scheme:dark] hover:border-[#00f5b8] focus:border-[#00f5b8]"
        />
        <div className="text-right font-mono">
          <p className="text-[10px] font-bold leading-3 text-white">{formatTime(now)}</p>
          <p className="text-[9px] leading-3 text-[#8b96a8]">{formatDate(now)}</p>
        </div>
      </div>
    </div>
  )
}

export default Topbar
