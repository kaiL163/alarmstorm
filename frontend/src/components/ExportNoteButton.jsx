import { Download } from 'lucide-react'
import { useAlarmData } from '../context/AlarmDataContext.jsx'

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function ExportNoteButton() {
  const { analytics, selectedDate } = useAlarmData()
  const summary = analytics?.analytics
  const badActor = summary?.bad_actor ?? 'Unknown'
  const badZone = summary?.bad_zone ?? 'Unknown zone'
  const eventsLastHour = summary?.events_last_hour ?? 0
  const totalAlarms = summary?.total ?? 0

  function exportNote() {
    const generatedAt = new Date()
    const rows = [
      ['ПОЛЕ', 'ЗНАЧЕНИЕ'],
      ['ПЕРИОД ДАННЫХ', selectedDate || 'Не выбран'],
      ['СГЕНЕРИРОВАНО', generatedAt.toLocaleString('ru-RU')],
      ['ОПЕРАТОР', '#04 (Смена A)'],
      ['СТАТУС', 'ШТОРМ АВАРИЙ'],
      ['BAD ACTOR', badActor],
      ['ЗОНА', badZone],
      ['СОБЫТИЙ ЗА 1 ЧАС', eventsLastHour],
      ['ВСЕГО АЛАРМОВ', totalAlarms],
      ['ГИПОТЕЗА', `Множественные срабатывания ${badActor} указывают на возможный сбой оборудования.`],
      ['SOP 1', 'Снизить обороты турбины А до 3000 об/мин'],
      ['SOP 2', 'Переключить на резервный компрессор B'],
      ['SOP 3', 'Проверить давление смазочного масла'],
    ]
    const text = rows.map((row) => row.map(csvCell).join(';')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([`\uFEFF${text}`], { type: 'text/csv;charset=utf-8' }))
    link.download = `смена_${generatedAt.toISOString().slice(0, 16).replace('T', '_')}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <button
      type="button"
      onClick={exportNote}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#23324a] bg-[#111827] px-4 py-2.5 text-[11px] font-bold text-white transition hover:border-[#3b82f6]"
    >
      <Download className="h-3.5 w-3.5" />
      Экспорт заметки смены
    </button>
  )
}

export default ExportNoteButton
