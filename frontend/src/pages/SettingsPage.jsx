import { BellRing, Database, Download, KeyRound, RefreshCw, Save, ShieldCheck, SlidersHorizontal } from 'lucide-react'

const settingSections = [
  {
    title: 'Оповещения',
    description: 'Правила уведомлений для операторов и смены.',
    icon: BellRing,
    actions: ['Настроить каналы', 'Тест уведомления'],
  },
  {
    title: 'Пороговые значения',
    description: 'Параметры определения шторма и критичности алармов.',
    icon: SlidersHorizontal,
    actions: ['Изменить пороги', 'Сбросить по умолчанию'],
  },
  {
    title: 'Источники данных',
    description: 'Подключение SCADA-тегов и синхронизация архива.',
    icon: Database,
    actions: ['Проверить соединение', 'Обновить справочники'],
  },
  {
    title: 'Безопасность',
    description: 'Роли, доступы и подтверждение критических действий.',
    icon: ShieldCheck,
    actions: ['Управление ролями', 'Журнал доступа'],
  },
]

function SettingsPage() {
  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-wide text-white">Настройки</h1>
          <p className="mt-1 text-[12px] text-[#8b96a8]">Системные параметры и служебные действия</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#00f5b8]/40 bg-[#06251d] px-4 text-[12px] font-bold text-[#00f5b8] transition hover:border-[#00f5b8]">
            <Save className="h-3.5 w-3.5" />
            Сохранить
          </button>
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#263247] bg-[#101725] px-4 text-[12px] font-bold text-[#9ca3af] transition hover:border-[#3b82f6] hover:text-white">
            <RefreshCw className="h-3.5 w-3.5" />
            Обновить
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Профиль', value: 'Оператор #04', icon: KeyRound },
          { label: 'Роль', value: 'Смена A', icon: ShieldCheck },
          { label: 'Экспорт', value: 'CSV / PDF', icon: Download },
          { label: 'Синхронизация', value: 'Авто', icon: RefreshCw },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-xl border border-[#20283a] bg-[#101725] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7f8da3]">{item.label}</p>
                  <p className="mt-3 text-lg font-black text-white">{item.value}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1d4ed8]/40 bg-[#10213b]">
                  <Icon className="h-4 w-4 text-[#60a5fa]" />
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {settingSections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title} className="rounded-xl border border-[#20283a] bg-[#101725] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#00f5b8]/30 bg-[#06251d]">
                  <Icon className="h-5 w-5 text-[#00f5b8]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[13px] font-black uppercase tracking-wide text-white">{section.title}</h2>
                  <p className="mt-1 text-[12px] leading-5 text-[#8b96a8]">{section.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {section.actions.map((action) => (
                      <button key={action} type="button" className="rounded-lg border border-[#263247] bg-[#0b111d] px-3 py-2 text-[11px] font-bold text-[#cbd5e1] transition hover:border-[#3b82f6] hover:text-white">
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className="rounded-xl border border-[#20283a] bg-[#101725] p-5">
        <h2 className="text-[13px] font-black uppercase tracking-wide text-white">Служебные переключатели</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {['Автообновление данных', 'Звуковые уведомления', 'Подтверждать критические действия'].map((label, index) => (
            <label key={label} className="flex cursor-pointer items-center justify-between rounded-lg border border-[#263247] bg-[#0b111d] px-4 py-3 text-[12px] text-[#cbd5e1]">
              <span>{label}</span>
              <input type="checkbox" defaultChecked={index !== 1} className="h-4 w-4 accent-[#00f5b8]" />
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}

export default SettingsPage
