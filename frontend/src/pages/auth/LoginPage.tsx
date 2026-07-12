import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      login(res.access_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dew p-4">
      <div className="card w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-forest rounded-lg flex items-center justify-center">
            <i className="ti ti-leaf text-white text-xl" aria-hidden="true" />
          </div>
          <span className="text-[20px] font-semibold text-charcoal tracking-tight">EcoSphere</span>
          <span className="text-[11px] text-sage uppercase tracking-[0.5px]">ESG Management Platform</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-red-600 text-[11.5px] mt-1">{error}</div>}

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center mt-2"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="text-center mt-6 text-[12px] text-[#3d5248]">
          Don't have an account?{' '}
          <Link to="/register" className="text-forest font-semibold hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
