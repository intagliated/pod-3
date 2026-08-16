import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Mail, FileText, ClipboardList } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/questions', label: 'Questions', icon: ListChecks },
  { to: '/emails', label: 'Emails', icon: Mail },
  { to: '/responses', label: 'Responses', icon: FileText },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-screen">
        <div className="px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">FormFlow</h1>
              <p className="text-xs text-slate-500">Survey Automation</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200">
          <a
            href="#/form"
            onClick={(e) => {
              e.preventDefault()
              window.open(`${window.location.origin}/form`, '_blank')
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <FileText className="w-4 h-4" />
            View Public Form
          </a>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  )
}
