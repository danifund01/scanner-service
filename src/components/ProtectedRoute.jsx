import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user } = useAuth()

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <svg className="w-6 h-6 text-emerald-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }

  if (user === null) return <Navigate to="/login" replace />

  return children
}
