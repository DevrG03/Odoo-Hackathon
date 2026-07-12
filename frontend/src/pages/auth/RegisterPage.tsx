import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'

export function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('employee')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1. Register User
      const user = await authApi.register(email, password, role)
      
      // 2. Login User to get access token
      const res = await authApi.login(email, password)
      login(res.access_token)

      // 3. Create Employee entry if employee role is selected
      if (role === 'employee') {
        await authApi.createEmployee({
          user_id: user.id,
          name: name,
        })
      }

      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Registration failed. Please try again.')
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
          <span className="text-[11px] text-sage uppercase tracking-[0.5px]">Create Account</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="input-label">Full Name</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              required={role === 'employee'}
            />
          </div>
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
          <div>
            <label className="input-label">Role</label>
            <select
              className="input"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <div className="text-red-600 text-[11.5px] mt-1">{error}</div>}

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center mt-2"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="text-center mt-6 text-[12px] text-[#3d5248]">
          Already have an account?{' '}
          <Link to="/login" className="text-forest font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
