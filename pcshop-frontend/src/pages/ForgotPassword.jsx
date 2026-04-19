import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  EnvelopeSimple, Lock, Warning, CircleNotch,
  CheckCircle, ArrowLeft, Key,
} from '@phosphor-icons/react'
import { authAPI } from '../services/api'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep]       = useState('email')   // 'email' | 'code'
  const [email, setEmail]     = useState('')
  const [code, setCode]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const handleSendCode = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Introdu adresa de email.'); return }
    setError(''); setLoading(true)
    try {
      await authAPI.forgotPassword(email.trim())
      setStep('code')
    } catch (err) {
      setError(err.response?.data?.detail || 'A apărut o eroare. Încearcă din nou.')
    } finally { setLoading(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (code.trim().length !== 6) { setError('Codul trebuie să aibă 6 cifre.'); return }
    if (password.length < 8) { setError('Parola trebuie să aibă minim 8 caractere.'); return }
    if (!/[A-Z]/.test(password)) { setError('Parola trebuie să conțină cel puțin o literă mare.'); return }
    if (!/\d/.test(password)) { setError('Parola trebuie să conțină cel puțin o cifră.'); return }
    if (password !== confirm) { setError('Parolele nu coincid.'); return }
    setError(''); setLoading(true)
    try {
      await authAPI.resetPassword(email.trim(), code.trim(), password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Cod invalid sau expirat.')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-[420px] mx-auto mt-16">
      <div className="bg-surface rounded-2xl p-10 border border-default shadow-elevated">

        {success ? (
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center">
              <CheckCircle size={32} className="text-success" />
            </div>
            <p className="text-success font-bold text-lg">Parola a fost resetată!</p>
            <p className="text-muted text-sm">Ești redirecționat la login...</p>
          </div>

        ) : step === 'email' ? (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-cyan">
                <EnvelopeSimple size={28} weight="bold" className="text-dark" />
              </div>
              <h2 className="font-display font-bold text-primary text-2xl mb-1.5">Resetare parolă</h2>
              <p className="text-muted text-sm">Trimitem un cod de 6 cifre pe emailul tău</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl mb-5 text-sm">
                <Warning size={16} weight="bold" className="shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSendCode} className="flex flex-col gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-secondary text-[13px] mb-2 font-medium">
                  <EnvelopeSimple size={13} /> Email
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
              <button
                type="submit"
                disabled={loading}
                className={`btn-primary w-full mt-1 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {loading
                  ? <><CircleNotch size={16} className="animate-spin" /> Se trimite...</>
                  : 'Trimite codul'}
              </button>
            </form>

            <div className="border-t border-default mt-6 pt-5 text-center">
              <Link to="/login" className="text-accent text-sm no-underline font-semibold hover:underline flex items-center justify-center gap-1.5">
                <ArrowLeft size={14} /> Înapoi la login
              </Link>
            </div>
          </>

        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-cyan">
                <Key size={28} weight="bold" className="text-dark" />
              </div>
              <h2 className="font-display font-bold text-primary text-2xl mb-1.5">Introdu codul</h2>
              <p className="text-muted text-sm">
                Am trimis un cod de 6 cifre la <strong className="text-primary">{email}</strong>
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl mb-5 text-sm">
                <Warning size={16} weight="bold" className="shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div>
                <label className="text-secondary text-[13px] mb-2 font-medium block">Cod primit pe email</label>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="input-field text-center text-2xl font-mono tracking-[0.4em]"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-secondary text-[13px] mb-2 font-medium">
                  <Lock size={13} /> Parolă nouă
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minim 8 caractere, o literă mare, o cifră"
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

            <div className="border-t border-default mt-6 pt-5 text-center flex flex-col gap-2">
              <button
                onClick={() => { setStep('email'); setError(''); setCode('') }}
                className="text-muted text-xs hover:text-accent transition-colors cursor-pointer bg-transparent border-none">
                Nu ai primit codul? Trimite din nou
              </button>
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
