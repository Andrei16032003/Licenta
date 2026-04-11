import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, EnvelopeSimple, Lock, User, Warning, CircleNotch } from '@phosphor-icons/react'
import { authAPI } from '../services/api'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authAPI.register({ name, email, password })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Eroare la inregistrare!')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-[420px] mx-auto mt-16">
      <div className="bg-surface rounded-2xl p-10 border border-default shadow-elevated backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center
                          mx-auto mb-4 shadow-glow-cyan">
            <UserPlus size={28} weight="bold" className="text-dark" />
          </div>
          <h2 className="font-display font-bold text-primary text-2xl mb-1.5">Creeaza cont</h2>
          <p className="text-muted text-sm">Inregistreaza-te gratuit</p>
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
              <User size={13} weight="regular" /> Nume
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Numele tau"
              required
              className="input-field"
            />
          </div>
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
              <Lock size={13} weight="regular" /> Parola
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minim 6 caractere"
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
              ? <><CircleNotch size={16} weight="bold" className="animate-spin" /> Se incarca...</>
              : <>Creeaza cont →</>
            }
          </button>
        </form>

        <div className="border-t border-default mt-6 pt-5 text-center">
          <p className="text-muted text-sm">
            Ai deja cont?{' '}
            <Link to="/login" className="text-accent no-underline font-semibold hover:underline">
              Autentifica-te →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
