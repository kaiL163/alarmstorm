import { Bell, Globe2, LogOut, Shield, User, UserRound } from 'lucide-react'

function Field({ label, value, accent }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold text-[#7f8da3]">{label}</span>
      <div className={[
        'mt-2 flex h-10 items-center rounded-lg border border-[#20283a] bg-[#172033] px-4 text-[13px] font-bold',
        accent ? 'text-[#00d4a6]' : 'text-[#cbd5e1]',
      ].join(' ')}
      >
        {value}
      </div>
    </label>
  )
}

function SectionTitle({ icon: Icon, title, color }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#1b2230] pb-5">
      <Icon className="h-5 w-5" style={{ color }} />
      <h2 className="text-[17px] font-black text-white">{title}</h2>
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="mx-auto max-w-[900px] space-y-7 pb-12">
      <h1 className="text-3xl font-black text-white">Настройки системы</h1>

      <section className="rounded-2xl border border-[#20283a] bg-[#101725] p-7">
        <SectionTitle icon={User} title="Профиль оператора" color="#00d4a6" />
        <div className="mt-6 grid gap-6 md:grid-cols-[96px_minmax(0,1fr)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#263247] bg-[#172033]">
            <UserRound className="h-10 w-10 text-[#687385]" />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="ID Оператора" value="OP-04-A" />
            <Field label="Смена" value="Смена A" />
            <Field label="Имя пользователя" value="Иван Иванов" />
            <Field label="Роль" value="Старший инженер-технолог" accent />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#20283a] bg-[#101725] p-7">
        <SectionTitle icon={Shield} title="Безопасность" color="#3b82f6" />
        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_170px] md:items-end">
          <Field label="Текущий пароль" value="••••••••" />
          <button type="button" className="h-10 rounded-lg border border-[#1d4ed8]/60 bg-[#10213b] px-4 text-[13px] font-black text-[#3b82f6] transition hover:border-[#3b82f6] hover:text-[#60a5fa]">
            Сменить пароль
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[#20283a] bg-[#101725] p-7">
        <SectionTitle icon={Bell} title="Системные предпочтения" color="#facc15" />
        <div className="mt-6 space-y-4">
          <div className="flex h-12 items-center justify-between rounded-lg border border-[#20283a] bg-[#172033] px-4">
            <div className="flex items-center gap-3 text-[13px] font-bold text-[#cbd5e1]">
              <Bell className="h-4 w-4 text-[#8b96a8]" />
              Звуковые уведомления о критических авариях
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" defaultChecked className="peer sr-only" />
              <span className="h-7 w-12 rounded-full bg-[#263247] transition peer-checked:bg-[#00d4a6]" />
              <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
            </label>
          </div>

          <div className="grid h-12 grid-cols-[1fr_160px] items-center gap-4 rounded-lg border border-[#20283a] bg-[#172033] px-4">
            <div className="flex items-center gap-3 text-[13px] font-bold text-[#cbd5e1]">
              <Globe2 className="h-4 w-4 text-[#8b96a8]" />
              Язык интерфейса
            </div>
            <select className="h-8 rounded-md border border-[#0b111d] bg-[#0b111d] px-3 text-[12px] font-bold text-white outline-none">
              <option>Русский</option>
              <option>English</option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" className="inline-flex h-11 items-center gap-3 rounded-lg border border-[#ef4444]/40 bg-[#3a1420] px-6 text-[13px] font-black text-[#ff4055] transition hover:border-[#ef4444]">
          <LogOut className="h-4 w-4" />
          Выйти из системы
        </button>
      </div>
    </div>
  )
}

export default SettingsPage
