import { Download } from 'lucide-react'
import { useAlarmData } from '../context/AlarmDataContext.jsx'

function ExportNoteButton() {
  const { analytics } = useAlarmData()
  const summary = analytics?.analytics
  const badActor = summary?.bad_actor ?? 'Unknown'
  const badZone = summary?.bad_zone ?? 'Unknown zone'
  const eventsLastHour = summary?.events_last_hour ?? 0
  const inClusters = summary?.in_clusters ?? 0

  function exportNote() {
    const text = `=== ЗАМЕТКА СМЕНЫ ===\nВремя: ${new Date().toLocaleString('ru-RU')}\nОператор: #04 (Смена A)\n\nШТОРМ АВАРИЙ\nBad Actor: ${badActor} — ${badZone}\nСобытий за 1 час: ${eventsLastHour}\nВ кластерах: ${inClusters}\n\nГипотеза: Множественные срабатывания ${badActor}\nуказывают на возможный сбой оборудования.\n\nДействия (SOP):\n1. Снизить обороты турбины А до 3000 об/мин\n2. Переключить на резервный компрессор B\n3. Проверить давление смазочного масла\n====================`
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    link.download = `смена_${new Date().toISOString().slice(0, 16).replace('T', '_')}.txt`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <button
      type="button"
      onClick={exportNote}
      className="inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20"
    >
      <Download className="h-4 w-4" />
      Экспорт в заметки
    </button>
  )
}

export default ExportNoteButton
