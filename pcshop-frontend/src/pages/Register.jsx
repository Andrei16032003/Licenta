import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserPlus, EnvelopeSimple, Lock, User, Warning,
  CircleNotch, Eye, EyeSlash, CheckCircle, XCircle, Key,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import LegalModal from '../components/LegalModal'

function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8)               score++
  if (pw.length >= 12)              score++
  if (/[A-Z]/.test(pw))            score++
  if (/\d/.test(pw))               score++
  if (/[^A-Za-z0-9]/.test(pw))    score++
  if (score <= 1) return { score, label: 'Slabă',   color: 'bg-danger'  }
  if (score <= 2) return { score, label: 'Medie',   color: 'bg-warning' }
  if (score <= 3) return { score, label: 'Bună',    color: 'bg-accent'  }
  return              { score, label: 'Puternică', color: 'bg-success' }
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register() {
  const navigate   = useNavigate()
  const storeLogin = useAuthStore(s => s.login)

  const [step,     setStep]     = useState('form')  // 'form' | 'verify'
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [terms,    setTerms]    = useState(false)
  const [showPw,   setShowPw]   = useState(false)
  const [showCf,   setShowCf]   = useState(false)
  const [touched,  setTouch]    = useState({})
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [modal,    setModal]    = useState(null)
  const [code,     setCode]     = useState('')
  const [resendOk, setResendOk] = useState(false)

  const touch = (field) => setTouch(p => ({ ...p, [field]: true }))

  const strength = useMemo(() => passwordStrength(password), [password])

  const nameErr    = name.trim().length > 0 && name.trim().length < 2
  const emailErr   = email.length > 0 && !emailRe.test(email)
  const confirmErr = confirm.length > 0 && confirm !== password
  const pwRules    = [
    { ok: password.length >= 8,       text: 'Minim 8 caractere'    },
    { ok: /[A-Z]/.test(password),     text: 'O literă mare'        },
    { ok: /\d/.test(password),        text: 'O cifră'              },
  ]

  const canSubmit =
    name.trim().length >= 2 &&
    emailRe.test(email) &&
    pwRules.every(r => r.ok) &&
    password === confirm &&
    terms && !loading

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true); setError('')
    try {
      await authAPI.register({ name: name.trim(), email: email.trim().toLowerCase(), password })
      setStep('verify')
    } catch (err) {
      const detail = err.response?.data?.detail || ''
      if (detail === 'EMAIL_ALREADY_REGISTERED') {
        setError('__already_registered__')
      } else {
        setError(detail || 'Eroare la înregistrare.')
      }
    } finally { setLoading(false) }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (code.length !== 6) { setError('Codul trebuie să aibă 6 cifre.'); return }
    setLoading(true); setError('')
    try {
      const r = await authAPI.verifyEmail(email.trim().toLowerCase(), code.trim())
      const payload = JSON.parse(atob(r.data.access_token.split('.')[1]))
      storeLogin({ id: payload.sub, name: r.data.name, role: r.data.role }, r.data.access_token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Cod invalid sau expirat.')
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    setResendOk(false); setError('')
    try {
      await authAPI.resendVerification(email.trim().toLowerCase())
      setResendOk(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Eroare la retrimitere.')
    }
  }

  if (step === 'verify') {
    return (
      <div className="max-w-[440px] mx-auto mt-12 mb-16">
        <div className="bg-surface rounded-2xl p-10 border border-default shadow-elevated">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-cyan">
              <Key size={28} weight="bold" className="text-dark" />
            </div>
            <h2 className="font-display font-bold text-primary text-2xl mb-1.5">Verifică emailul</h2>
            <p className="text-muted text-sm">
              Am trimis un cod de 6 cifre la <strong className="text-primary">{email}</strong>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl mb-5 text-sm">
              <Warning size={16} weight="bold" className="shrink-0" /> {error}
            </div>
          )}
          {resendOk && (
            <div className="flex items-center gap-2 bg-success/10 border border-success/30 text-success px-4 py-3 rounded-xl mb-5 text-sm">
              <CheckCircle size={16} weight="bold" className="shrink-0" /> Cod retrimis pe email!
            </div>
          )}

          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div>
              <label className="text-secondary text-[13px] mb-2 font-medium block">Cod primit pe email</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="input-field text-center text-2xl font-mono tracking-[0.4em]"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className={`btn-primary w-full flex items-center justify-center gap-2 ${loading || code.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {loading
                ? <><CircleNotch size={16} className="animate-spin" /> Se verifică...</>
                : 'Activează contul'}
            </button>
          </form>

          <div className="border-t border-default mt-6 pt-5 text-center">
            <button
              onClick={handleResend}
              className="text-muted text-xs hover:text-accent transition-colors cursor-pointer bg-transparent border-none">
              Nu ai primit codul? Trimite din nou
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    {modal && <LegalModal type={modal} onClose={() => setModal(null)} />}
    <div className="max-w-[440px] mx-auto mt-12 mb-16">
      <div className="bg-surface rounded-2xl p-10 border border-default shadow-elevated backdrop-blur-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center
                          mx-auto mb-4 shadow-glow-cyan">
            <UserPlus size={28} weight="bold" className="text-dark" />
          </div>
          <h2 className="font-display font-bold text-primary text-2xl mb-1.5">Creează cont</h2>
        </div>

        {/* Error banner */}
        {error && error === '__already_registered__' ? (
          <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl mb-5 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <Warning size={16} weight="bold" className="shrink-0" />
              <span>Acest email este deja înregistrat.</span>
            </div>
            <Link to="/login" className="text-accent font-semibold hover:underline text-xs ml-6">
              Mergi la login →
            </Link>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger
                          px-4 py-3 rounded-xl mb-5 text-sm">
            <Warning size={16} weight="bold" className="shrink-0" />
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

          {/* Nume */}
          <div>
            <label className="flex items-center gap-1.5 text-secondary text-[13px] mb-2 font-medium">
              <User size={13} /> Nume complet
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => touch('name')}
              placeholder="Ion Popescu"
              className={`input-field ${touched.name && nameErr ? 'border-danger/60' : ''}`}
            />
            {touched.name && nameErr && (
              <p className="text-danger text-[11px] mt-1">Minim 2 caractere.</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-1.5 text-secondary text-[13px] mb-2 font-medium">
              <EnvelopeSimple size={13} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => touch('email')}
              placeholder="email@exemplu.com"
              className={`input-field ${touched.email && emailErr ? 'border-danger/60' : ''}`}
            />
            {touched.email && emailErr && (
              <p className="text-danger text-[11px] mt-1">Adresă de email invalidă.</p>
            )}
          </div>

          {/* Parola */}
          <div>
            <label className="flex items-center gap-1.5 text-secondary text-[13px] mb-2 font-medium">
              <Lock size={13} /> Parolă
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => touch('password')}
                placeholder="Minim 8 caractere"
                className="input-field pr-10"
              />
              <button type="button" tabIndex={-1}
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted
                                 hover:text-primary transition-colors cursor-pointer">
                {showPw ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 h-1 rounded-full overflow-hidden">
                  {[1,2,3,4].map(i => (
                    <div key={i}
                         className={`flex-1 rounded-full transition-all duration-300
                                     ${strength.score >= i ? strength.color : 'bg-white/10'}`} />
                  ))}
                </div>
                <p className="text-[11px] mt-1 text-muted">
                  Putere parolă: <span className="font-semibold text-primary">{strength.label}</span>
                </p>
              </div>
            )}

            {/* Rules */}
            {touched.password && (
              <ul className="mt-2 flex flex-col gap-0.5">
                {pwRules.map(r => (
                  <li key={r.text}
                      className={`flex items-center gap-1.5 text-[11px]
                                  ${r.ok ? 'text-success' : 'text-muted'}`}>
                    {r.ok
                      ? <CheckCircle size={12} weight="fill" />
                      : <XCircle    size={12} weight="fill" className="text-white/20" />}
                    {r.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Confirmare parola */}
          <div>
            <label className="flex items-center gap-1.5 text-secondary text-[13px] mb-2 font-medium">
              <Lock size={13} /> Confirmă parola
            </label>
            <div className="relative">
              <input
                type={showCf ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onBlur={() => touch('confirm')}
                placeholder="Repetă parola"
                className={`input-field pr-10 ${touched.confirm && confirmErr ? 'border-danger/60' : ''}`}
              />
              <button type="button" tabIndex={-1}
                      onClick={() => setShowCf(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted
                                 hover:text-primary transition-colors cursor-pointer">
                {showCf ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {touched.confirm && confirmErr && (
              <p className="text-danger text-[11px] mt-1">Parolele nu coincid.</p>
            )}
            {touched.confirm && !confirmErr && confirm.length > 0 && (
              <p className="text-success text-[11px] mt-1 flex items-center gap-1">
                <CheckCircle size={11} weight="fill" /> Parolele coincid
              </p>
            )}
          </div>

          {/* Termeni */}
          <div className="flex items-start gap-2.5 mt-1">
            <div
              onClick={() => setTerms(p => !p)}
              className={`w-4 h-4 mt-0.5 shrink-0 rounded border flex items-center justify-center cursor-pointer transition-all
                          ${terms ? 'bg-accent border-accent' : 'border-white/20 bg-white/5 hover:border-white/40'}`}>
              {terms && <CheckCircle size={12} weight="fill" className="text-dark" />}
            </div>
            <span className="text-muted text-[12px] leading-relaxed">
              Am citit și accept{' '}
              <button type="button" onClick={() => setModal('termeni')}
                      className="text-accent hover:underline cursor-pointer bg-transparent border-none p-0">
                Termenii și condițiile
              </button>
              {' '}și{' '}
              <button type="button" onClick={() => setModal('confidentialitate')}
                      className="text-accent hover:underline cursor-pointer bg-transparent border-none p-0">
                Politica de confidențialitate
              </button>
              .
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`btn-primary w-full mt-2 flex items-center justify-center gap-2
                        ${!canSubmit ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {loading
              ? <><CircleNotch size={16} weight="bold" className="animate-spin" /> Se procesează...</>
              : <>Creează cont →</>
            }
          </button>
        </form>

        <div className="border-t border-default mt-6 pt-5 text-center">
          <p className="text-muted text-sm">
            Ai deja cont?{' '}
            <Link to="/login" className="text-accent no-underline font-semibold hover:underline">
              Autentifică-te →
            </Link>
          </p>
        </div>
      </div>
    </div>
    </>
  )
}
