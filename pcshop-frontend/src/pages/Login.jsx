import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SignIn, EnvelopeSimple, Lock, Warning, CircleNotch } from '@phosphor-icons/react'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.login({ email, password })
      const token = res.data.access_token
      const payload = JSON.parse(atob(token.split('.')[1]))
      login({ id: payload.sub, name: res.data.name, role: res.data.role }, token)
      navigate('/')
    } catch {
      setError('Email sau parolă incorectă!')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-[420px] mx-auto mt-16">
      <div className="bg-surface rounded-2xl p-10 border border-default shadow-elevated backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center
                          mx-auto mb-4 shadow-glow-cyan">
            <SignIn size={28} weight="bold" className="text-dark" />
          </div>
          <h2 className="font-display font-bold text-primary text-2xl mb-1.5">Bine ai revenit!</h2>
          <p className="text-muted text-sm">Loghează-te în contul tău</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger
                          px-4 py-3 rounded-xl mb-5 text-sm">
            <Warning size={16} weight="bold" className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-secondary text-[13px] mb-2 font-medium">
              <EnvelopeSimple size={13} weight="regular" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplu.com"
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-secondary text-[13px] mb-2 font-medium">
              <Lock size={13} weight="regular" /> Parolă
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input-field"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full mt-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {loading
              ? <><CircleNotch size={16} weight="bold" className="animate-spin" /> Se încarcă...</>
              : <>Autentificare →</>
            }
          </button>
        </form>

        <div className="border-t border-default mt-6 pt-5 text-center">
          <p className="text-muted text-sm">
            Nu ai cont?{' '}
            <Link to="/register" className="text-accent no-underline font-semibold hover:underline">
              Crează cont gratuit →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
