import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAlarmData } from '../context/AlarmDataContext.jsx'
import ExportNoteButton from './ExportNoteButton.jsx'

const SOP_ACTIONS = [
  'Снизить обороты турбины А до 3000 об/мин',
  'Переключить на резервный компрессор B',
  'Проверить давление смазочного масла',
]

const SOP_ACTIONS_BY_BAD_ACTOR = {
  Vib_Sensor_04_Err: [
    'Снизить нагрузку компрессора на 15% и вывести агрегат из резонансной зоны',
    'Проверить тренд вибрации по опорам NDE/DE за последние 30 минут',
    'Подготовить обход: крепления датчика, муфту и состояние подшипникового узла',
  ],
  Steam_Press_High: [
    'Приоткрыть байпасную линию сброса пара до стабилизации давления',
    'Проверить положение регулирующего клапана и ответ привода',
    'Поставить котёл в режим ограниченной мощности до подтверждения оператора',
  ],
  Pump_Cavitation: [
    'Снизить производительность насоса и проверить давление на всасе',
    'Переключить поток на резервный насос при сохранении кавитации более 3 минут',
    'Проверить уровень в приёмной ёмкости и состояние входного фильтра',
  ],
  HX_FoulingAlarm: [
    'Уменьшить тепловую нагрузку контура и стабилизировать перепад температур',
    'Открыть обходную линию теплообменника на 20% для разгрузки потока',
    'Запланировать химическую промывку и проверить загрязнение сетчатого фильтра',
  ],
}

function SopCard() {
  const { analytics } = useAlarmData()
  const summary = analytics?.analytics
  const badActor = summary?.bad_actor ?? '—'
  const badZone = summary?.bad_zone ?? '—'
  const sopActions = SOP_ACTIONS_BY_BAD_ACTOR[badActor] ?? SOP_ACTIONS

  const highCount = summary?.clusters?.reduce((sum, c) => sum + c.count, 0) ?? 0
  const isNormalMode = highCount < 50

  return (
    <div className="flex h-full min-h-[266px] flex-col overflow-hidden rounded-xl border border-[#20283a] bg-[#101725]">
      <div className="border-b border-[#1b2230] px-4 py-3">
        <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wide text-[#00f5b8]">
          <CheckCircle2 className="h-4 w-4" />
          Что нажать первым
        </div>
        <p className="mt-1 text-[11px] text-[#8b96a8]">
          {isNormalMode ? 'Состояние системы' : 'Рекомендации по текущему шторму'}
        </p>
      </div>

      {isNormalMode ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div className="space-y-3">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[#00f5b8]" />
            <p className="text-[13px] font-semibold text-white">Система работает в штатном режиме</p>
            <p className="text-[11px] text-[#8b96a8]">Действия не требуются</p>
          </div>
        </div>
      ) : (
        <>
          <div className="m-4 rounded-md border border-[#ef4444]/35 bg-[#3a1420] p-4">
            <div className="flex items-center gap-2 text-[11px] font-black text-[#ff5a6b]">
              <AlertTriangle className="h-3.5 w-3.5" />
              Гипотеза первопричины:
            </div>
            <p className="mt-2 text-[12px] leading-5 text-[#f4c2c8]">
              Множественные срабатывания{' '}
              <span className="font-mono font-black text-[#fde047]">{badActor}</span> указывают на возможный сбой оборудования в зоне{' '}
              <span className="font-semibold text-white">{badZone}</span>.
            </p>
          </div>

          <div className="px-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8b96a8]">Топ-3 действия (SOP)</p>
            <ol className="mt-3 space-y-2">
              {sopActions.map((action, index) => (
                <li key={action} className="flex items-center gap-3 rounded-md border border-[#1b2230] bg-[#0b111d] px-3 py-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#3b82f6]/40 bg-[#10213b] text-[10px] font-black text-[#60a5fa]">
                    {index + 1}
                  </span>
                  <span className="text-[11px] leading-4 text-[#cbd5e1]">{action}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-auto p-4">
            <ExportNoteButton />
          </div>
        </>
      )}
    </div>
  )
}

export default SopCard
