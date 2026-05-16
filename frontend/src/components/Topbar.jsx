import { Calendar } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function formatTime(date) {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(date) {
  return date.toLocaleDateString('ru-RU')
}

function formatDisplayDate(dateString) {
  if (!dateString) return 'Выберите дату'
  const [year, month, day] = dateString.split('-')
  return `${day}.${month}.${year}`
}

function Topbar({ selectedDate, setSelectedDate }) {
  const [now, setNow] = useState(() => new Date())
  const dateInputRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleDateClick = () => {
    const input = dateInputRef.current
    if (!input) return
    if (input.showPicker) {
      input.showPicker()
      return
    }
    input.focus()
  }

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
        <div
          onClick={handleDateClick}
          className="relative flex cursor-pointer items-center gap-2 rounded-md border border-[#1b2230] bg-[#0d1422] px-2 py-1 font-mono text-[10px] text-white outline-none transition hover:border-[#00f5b8] focus:border-[#00f5b8]"
        >
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            onKeyDown={(event) => event.preventDefault()}
            onPaste={(event) => event.preventDefault()}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <Calendar className="h-3.5 w-3.5 text-[#8b96a8] pointer-events-none" />
          <span className="pointer-events-none select-none">{formatDisplayDate(selectedDate)}</span>
        </div>
        <div className="text-right font-mono">
          <p className="text-[10px] font-bold leading-3 text-white">{formatTime(now)}</p>
          <p className="text-[9px] leading-3 text-[#8b96a8]">{formatDate(now)}</p>
        </div>
      </div>
    </div>
  )
}

export default Topbar
