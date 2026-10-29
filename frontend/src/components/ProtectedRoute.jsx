import { Navigate } from 'react-router-dom'
import { getUser } from '../services/api'

/**
 * Guards a route: requires login, and optionally one of the given roles.
 * Unauthenticated users go to /login; wrong-role users to /dashboard.
 */
export default function ProtectedRoute({ roles, children }) {
  const user = getUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
