import { Activity, BarChart3, Bell, FileText, LayoutDashboard, Monitor, Settings, UserCircle } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Панель управления', icon: LayoutDashboard },
  { to: '/alarms', label: 'Аварии', icon: Bell },
  { to: '/monitor', label: 'Мониторинг', icon: Activity },
  { to: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { to: '/archive', label: 'Отчеты', icon: FileText },
  { to: '/settings', label: 'Настройки', icon: Settings },
]

function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[210px] shrink-0 flex-col border-r border-[#1b2230] bg-[#0b1019]">
      <div className="h-[58px] border-b border-[#1b2230] px-4 py-3">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-[#00f5b8]" />
          <div>
            <p className="text-[15px] font-bold leading-4 text-white">AlarmStorm</p>
            <p className="text-[12px] leading-4 text-[#8b96a8]">Triage</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition',
                isActive
                  ? 'border border-[#1e3148] bg-[#121b2c] text-[#00f5b8]'
                  : 'text-[#8b96a8] hover:bg-[#111827] hover:text-white',
              ].join(' ')
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="text-[13px]">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-[#1b2230] px-4 py-4 text-[12px] text-[#8b96a8]">
        <UserCircle className="h-7 w-7 text-[#7f8da3]" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">Оператор #04</p>
          <p>Смена A</p>
        </div>
        <Monitor className="h-4 w-4" />
      </div>
    </aside>
  )
}

export default Sidebar
