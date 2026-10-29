import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getUser, errorMessage } from '../services/api'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import ExpiryBadge from '../components/ExpiryBadge'

export default function Dashboard() {
  const user = getUser()
  const [stats, setStats] = useState(null)
  const [items, setItems] = useState([])
  const [matches, setMatches] = useState([])
  const [pickups, setPickups] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        if (user.role === 'ADMIN') {
          const { data } = await api.get('/api/statistics')
          setStats(data)
        }
        const [itemsRes, matchesRes] = await Promise.all([
          api.get('/api/food-items'),
          api.get('/api/donations'),
        ])
        setItems(itemsRes.data)
        setMatches(matchesRes.data)
        if (user.role === 'RECIPIENT') {
          const { data } = await api.get('/api/pickups')
          setPickups(data)
        }
      } catch (err) {
        setError(errorMessage(err))
      }
    }
    load()
  }, [user.role])

  const myItems = user.role === 'DONOR' ? items.filter((i) => i.donorId === user.id) : items
  const expiring = myItems
    .filter((i) => i.daysToExpiry <= 3 && i.status !== 'DONATED')
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
  const surplus = items.filter((i) => i.status === 'SURPLUS')
  const activeMatches = matches.filter(
    (m) => m.status === 'PENDING' || m.status === 'CONFIRMED',
  )

  if (error) {
    return (
      <div className="p-8 text-red-600">{error}</div>
    )
  }

  return (
    <div className="p-8">
      <PageHeader
        title={`Hello, ${user.name}`}
        subtitle={`You are signed in as ${user.role.toLowerCase()}`}
      />

      {user.role === 'ADMIN' && stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total items" value={stats.totalItems} accent="slate" />
            <StatCard label="Available" value={stats.availableItems} accent="emerald" />
            <StatCard label="Surplus" value={stats.surplusItems} accent="orange" />
            <StatCard label="Donated" value={stats.donatedItems} accent="sky" />
            <StatCard
              label="Expiring ≤3 days"
              value={stats.expiringIn3Days}
              accent="red"
              hint="Needs immediate action"
            />
            <StatCard label="Expired / wasted" value={stats.expiredItems} accent="red" />
            <StatCard label="Active matches" value={stats.pendingMatches + stats.confirmedMatches} accent="violet" />
            <StatCard label="Pickups done" value={`${stats.completedPickups}/${stats.totalPickups}`} accent="yellow" />
          </div>

          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            <Panel title="Expiry alerts">
              {expiring.length === 0 ? (
                <Empty text="Nothing expiring in the next 3 days" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {expiring.slice(0, 6).map((item) => (
                    <Row key={item.id} item={item} />
                  ))}
                </ul>
              )}
              <Link className="text-sm text-emerald-600 font-medium mt-3 inline-block" to="/expiry">
                Open expiry view →
              </Link>
            </Panel>

            <Panel title="Recent donation matches">
              {matches.length === 0 ? (
                <Empty text="No matches yet" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {matches.slice(0, 6).map((m) => (
                    <li key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {m.foodItemName} → {m.recipientName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(m.matchedAt).toLocaleString()}
                        </div>
                      </div>
                      <StatusPill status={m.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}

      {user.role === 'DONOR' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="My items" value={myItems.length} accent="slate" />
            <StatCard
              label="Expiring ≤3 days"
              value={expiring.length}
              accent="red"
              hint="Act before they go to waste"
            />
            <StatCard
              label="Surplus"
              value={myItems.filter((i) => i.status === 'SURPLUS').length}
              accent="orange"
            />
            <StatCard
              label="Donated"
              value={myItems.filter((i) => i.status === 'DONATED').length}
              accent="sky"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Panel title="Items needing attention">
              {expiring.length === 0 ? (
                <Empty text="Nothing expiring soon — nice work" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {expiring.map((item) => (
                    <Row key={item.id} item={item} />
                  ))}
                </ul>
              )}
              <Link className="text-sm text-emerald-600 font-medium mt-3 inline-block" to="/inventory">
                Manage inventory →
              </Link>
            </Panel>

            <Panel title="My donation activity">
              {matches.length === 0 ? (
                <Empty text="No donation matches yet — mark items as surplus to get matched" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {matches.slice(0, 6).map((m) => (
                    <li key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {m.foodItemName} → {m.recipientName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(m.matchedAt).toLocaleString()}
                        </div>
                      </div>
                      <StatusPill status={m.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}

      {user.role === 'RECIPIENT' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Available surplus" value={surplus.length} accent="orange" />
            <StatCard label="My matches" value={matches.length} accent="violet" />
            <StatCard
              label="Upcoming pickups"
              value={pickups.filter((p) => p.status === 'SCHEDULED').length}
              accent="emerald"
            />
            <StatCard
              label="Completed pickups"
              value={pickups.filter((p) => p.status === 'COMPLETED').length}
              accent="sky"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Panel title="Available surplus food">
              {surplus.length === 0 ? (
                <Empty text="No surplus food available right now" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {surplus.slice(0, 6).map((item) => (
                    <Row key={item.id} item={item} />
                  ))}
                </ul>
              )}
              <Link className="text-sm text-emerald-600 font-medium mt-3 inline-block" to="/donations">
                Browse donations →
              </Link>
            </Panel>

            <Panel title="My pickup schedule">
              {pickups.length === 0 ? (
                <Empty text="No pickups scheduled yet" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {pickups.slice(0, 6).map((p) => (
                    <li key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {p.foodItemName || 'Donation'} · {p.recipientName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(p.scheduledAt).toLocaleString()}
                        </div>
                      </div>
                      <StatusPill status={p.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Empty({ text }) {
  return <p className="text-sm text-slate-400 py-6 text-center">{text}</p>
}

function Row({ item }) {
  return (
    <li className="py-2.5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-800 truncate">{item.name}</div>
        <div className="text-xs text-slate-500">
          {item.quantity} {item.unit} · {item.category}
        </div>
      </div>
      <ExpiryBadge days={item.daysToExpiry} />
    </li>
  )
}

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-sky-100 text-sky-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
  SCHEDULED: 'bg-emerald-100 text-emerald-700',
}

function StatusPill({ status }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'
      }`}
    >
      {status}
    </span>
  )
}
