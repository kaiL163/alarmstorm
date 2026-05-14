import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAlarmData } from '../context/AlarmDataContext.jsx'
import ExportNoteButton from './ExportNoteButton.jsx'

const SOP_ACTIONS = [
  'Снизить обороты турбины А до 3000 об/мин',
  'Переключить на резервный компрессор B',
  'Проверить давление смазочного масла',
]

function SopCard() {
  const { analytics } = useAlarmData()
  const summary = analytics?.analytics
  const badActor = summary?.bad_actor ?? '—'
  const badZone = summary?.bad_zone ?? '—'

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
        <CheckCircle2 className="h-4 w-4 text-success" />
        Что нажать первым (SOP)
      </div>
      <p className="mt-1 text-xs text-muted">Рекомендации по текущему шторму</p>

      <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-danger">
          <AlertTriangle className="h-3.5 w-3.5" />
          Гипотеза первопричины
        </div>
        <p className="mt-2 text-sm leading-6 text-danger/80">
          Множественные срабатывания{' '}
          <span className="font-mono font-bold text-danger">{badActor}</span> указывают на возможный сбой оборудования в зоне{' '}
          <span className="font-semibold text-danger">{badZone}</span>.
        </p>
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wider text-muted">Топ-3 действия (SOP)</p>
        <ol className="mt-3 space-y-2">
          {SOP_ACTIONS.map((action, index) => (
            <li key={action} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-[10px] font-bold text-accent">
                {index + 1}
              </span>
              <span className="text-sm leading-5 text-text">{action}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-auto pt-4">
        <ExportNoteButton />
      </div>
    </div>
  )
}

export default SopCard
