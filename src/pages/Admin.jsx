import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Admin() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [loading, user, navigate])

  const handleLogout = async () => {
    const { error } = await logout()
    if (!error) {
      navigate('/login', { replace: true })
    }
  }

  if (loading) {
    return <div>Checking authentication...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="admin-page">
      <h1>Admin Portal</h1>
      <p>Welcome back, {user.email}</p>
      <button onClick={handleLogout}>Logout</button>
      <p>This dashboard is protected. Add admin features here later.</p>
    </div>
  )
}
