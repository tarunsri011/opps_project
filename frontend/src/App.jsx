import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Expiry from './pages/Expiry'
import Donations from './pages/Donations'
import Recipients from './pages/Recipients'
import Pickups from './pages/Pickups'
import Statistics from './pages/Statistics'
import { getUser } from './services/api'

function Page({ roles, children }) {
  return (
    <ProtectedRoute roles={roles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <Page>
            <Dashboard />
          </Page>
        }
      />
      <Route
        path="/inventory"
        element={
          <Page roles={['ADMIN', 'DONOR']}>
            <Inventory />
          </Page>
        }
      />
      <Route
        path="/expiry"
        element={
          <Page roles={['ADMIN']}>
            <Expiry />
          </Page>
        }
      />
      <Route
        path="/donations"
        element={
          <Page>
            <Donations />
          </Page>
        }
      />
      <Route
        path="/recipients"
        element={
          <Page roles={['ADMIN']}>
            <Recipients />
          </Page>
        }
      />
      <Route
        path="/pickups"
        element={
          <Page roles={['ADMIN', 'RECIPIENT']}>
            <Pickups />
          </Page>
        }
      />
      <Route
        path="/statistics"
        element={
          <Page roles={['ADMIN']}>
            <Statistics />
          </Page>
        }
      />

      <Route
        path="*"
        element={<Navigate to={getUser() ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  )
}
