import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Warning, CircleNotch, CheckCircle, ArrowLeft } from '@phosphor-icons/react'
import { authAPI } from '../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) { setError('Token lipsă. Folosește link-ul primit.'); return }
    if (password.length < 8) { setError('Parola trebuie să aibă minim 8 caractere.'); return }
    if (!/[A-Z]/.test(password)) { setError('Parola trebuie să conțină cel puțin o literă mare.'); return }
    if (!/\d/.test(password)) { setError('Parola trebuie să conțină cel puțin o cifră.'); return }
    if (password !== confirm) { setError('Parolele nu coincid.'); return }

    setError(''); setLoading(true)
    try {
      await authAPI.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Token invalid sau expirat.')
    } finally { setLoading(false) }
  }

  if (!token) {
    return (
      <div className="max-w-[420px] mx-auto mt-16">
        <div className="bg-surface rounded-2xl p-10 border border-default shadow-elevated text-center">
          <Warning size={36} className="text-danger mx-auto mb-4" />
          <p className="text-primary font-bold text-lg mb-2">Link invalid</p>
          <p className="text-muted text-sm mb-5">Token-ul de resetare lipsește din URL.</p>
          <Link to="/forgot-password" className="btn-primary">Cere un link nou</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[420px] mx-auto mt-16">
      <div className="bg-surface rounded-2xl p-10 border border-default shadow-elevated">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-cyan">
            <Lock size={28} weight="bold" className="text-dark" />
          </div>
          <h2 className="font-display font-bold text-primary text-2xl mb-1.5">Parolă nouă</h2>
          <p className="text-muted text-sm">Alege o parolă nouă pentru contul tău</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center">
              <CheckCircle size={32} className="text-success" />
            </div>
            <p className="text-success font-bold text-lg">Parola a fost resetată!</p>
            <p className="text-muted text-sm">Ești redirecționat la login...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl mb-5 text-sm">
                <Warning size={16} weight="bold" className="shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-secondary text-[13px] mb-2 font-medium">
                  <Lock size={13} /> Parolă nouă
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minim 8 caractere, o literă mare, o cifră"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-secondary text-[13px] mb-2 font-medium">
                  <Lock size={13} /> Confirmă parola
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`btn-primary w-full mt-1 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {loading
                  ? <><CircleNotch size={16} className="animate-spin" /> Se procesează...</>
                  : 'Setează parola nouă'}
              </button>
            </form>

            <div className="border-t border-default mt-6 pt-5 text-center">
              <Link to="/login" className="text-accent text-sm no-underline font-semibold hover:underline flex items-center justify-center gap-1.5">
                <ArrowLeft size={14} /> Înapoi la login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
