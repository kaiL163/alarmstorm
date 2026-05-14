import { Activity, Archive, BarChart3, Bell, LayoutDashboard } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alarms', label: 'Аварии', icon: Bell },
  { to: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { to: '/monitor', label: 'Мониторинг', icon: Activity },
  { to: '/archive', label: 'Архив', icon: Archive },
]

function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-border-muted bg-surface">
      <div className="border-b border-border-muted px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-success/30 bg-success/10 text-success">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-text">AlarmStorm</p>
            <p className="text-xs text-muted">Triage</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-surface-2 text-text ring-1 ring-border'
                  : 'text-muted hover:bg-surface-2 hover:text-text',
              ].join(' ')
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border-muted px-5 py-4 text-xs text-muted">
        Backend API
        <div className="mt-1 font-mono text-[11px] text-accent">127.0.0.1:8000</div>
      </div>
    </aside>
  )
}

export default Sidebar
