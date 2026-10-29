import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
})

// Auto-attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Expired/invalid token -> clear the session and go to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const onAuthPage = ['/login', '/register'].includes(window.location.pathname)
    if (status === 401 && !onAuthPage) {
      clearSession()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export function saveSession(authResponse) {
  localStorage.setItem('token', authResponse.token)
  localStorage.setItem(
    'user',
    JSON.stringify({
      id: authResponse.id,
      name: authResponse.name,
      email: authResponse.email,
      role: authResponse.role,
    }),
  )
}

export function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

export function logout() {
  clearSession()
  window.location.href = '/login'
}

export function errorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    'Something went wrong'
  )
}

export default api
