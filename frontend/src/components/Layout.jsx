import { NavLink } from 'react-router-dom'
import { getUser, logout } from '../services/api'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'DONOR', 'RECIPIENT'] },
  { to: '/inventory', label: 'Inventory', roles: ['ADMIN', 'DONOR'] },
  { to: '/expiry', label: 'Expiry Alerts', roles: ['ADMIN'] },
  { to: '/donations', label: 'Donations', roles: ['ADMIN', 'DONOR', 'RECIPIENT'] },
  { to: '/recipients', label: 'Recipients', roles: ['ADMIN'] },
  { to: '/pickups', label: 'Pickups', roles: ['ADMIN', 'RECIPIENT'] },
  { to: '/statistics', label: 'Statistics', roles: ['ADMIN'] },
]

const ROLE_COLORS = {
  ADMIN: 'bg-violet-100 text-violet-700',
  DONOR: 'bg-emerald-100 text-emerald-700',
  RECIPIENT: 'bg-sky-100 text-sky-700',
}

export default function Layout({ children }) {
  const user = getUser()
  const items = NAV.filter((item) => item.roles.includes(user?.role))

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="text-lg font-semibold leading-tight">FoodShare</div>
          <div className="text-xs text-slate-400 mt-1">Surplus Redistribution</div>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-slate-800">
          <div className="text-sm font-medium truncate">{user?.name}</div>
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                ROLE_COLORS[user?.role] || 'bg-slate-200 text-slate-700'
              }`}
            >
              {user?.role}
            </span>
            <button
              onClick={logout}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  )
}
