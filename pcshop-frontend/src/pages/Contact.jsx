import { useState } from 'react'
import {
  MapPin, Phone, EnvelopeSimple, Check, Warning, CircleNotch, ChatCircleDots, Clock,
  ArrowUp as Rocket,
} from '@phosphor-icons/react'
import { contactAPI } from '../services/api'

const infoCards = [
  { Icon: MapPin,         title: 'Adresă',  lines: ['Strada Științei nr. 2', 'Galați, România'], color: '#42A5F5' },
  { Icon: Phone,          title: 'Telefon', lines: ['0770 648 476', 'Luni–Vineri, 09:00–18:00'], color: '#00E676' },
  { Icon: EnvelopeSimple, title: 'Email',   lines: ['aa387@student.ugal.ro', 'Răspuns în max. 24h'], color: '#CE93D8' },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Numele este obligatoriu.'
    if (!form.email.trim()) {
      e.email = 'Email-ul este obligatoriu.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Adresa de email nu este validă.'
    }
    if (!form.subject.trim()) e.subject = 'Subiectul este obligatoriu.'
    if (!form.message.trim()) {
      e.message = 'Mesajul este obligatoriu.'
    } else if (form.message.trim().length < 10) {
      e.message = 'Mesajul trebuie să aibă cel puțin 10 caractere.'
    }
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setLoading(true)
    try {
      await contactAPI.send(form)
      setSent(true)
    } catch {
      setErrors({ message: 'A apărut o eroare. Te rugăm să încerci din nou.' })
    } finally {
      setLoading(false)
    }
  }

  const field = (key, label, type = 'text', rows = null) => (
    <div style={{ marginBottom: '18px' }}>
      <label className="block text-muted text-xs font-semibold mb-1.5 uppercase tracking-wide">
        {label} <span className="text-danger">*</span>
      </label>
      {rows ? (
        <textarea
          rows={rows}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={`Introdu ${label.toLowerCase()}...`}
          className={`input-field ${errors[key] ? 'border-danger' : ''}`}
          style={{ resize: 'vertical', fontFamily: 'inherit' }}
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={`Introdu ${label.toLowerCase()}...`}
          className={`input-field ${errors[key] ? 'border-danger' : ''}`}
        />
      )}
      {errors[key] && <p className="text-danger text-xs mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 0 80px' }}>

      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0D1B3E 0%, #0A1628 50%, #0D1B3E 100%)',
        borderRadius: '20px', padding: '56px 48px',
        marginBottom: '32px', textAlign: 'center',
        border: '1px solid rgba(66,165,245,0.2)',
        boxShadow: '0 0 80px rgba(41,121,255,0.12)',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(66,165,245,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '240px', height: '240px', background: 'radial-gradient(circle, rgba(206,147,216,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '5%', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(0,230,118,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="w-[68px] h-[68px] rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5 shadow-glow-cyan">
          <EnvelopeSimple size={32} weight="bold" className="text-dark" />
        </div>

        <h1 style={{ color: '#F1F5F9', fontSize: '44px', fontWeight: '800', margin: '0 0 14px', letterSpacing: '-0.5px' }}>
          Ia{' '}
          <span style={{ background: 'linear-gradient(135deg, var(--cyan), var(--violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>legătura</span>
          {' '}cu noi
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '18px', maxWidth: '520px', margin: '0 auto' }}>
          Suntem aici să te ajutăm. Trimite-ne un mesaj și îți vom răspunde în cel mai scurt timp.
        </p>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {infoCards.map((info, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${info.color}25`,
            borderRadius: '16px', padding: '24px',
            display: 'flex', gap: '16px', alignItems: 'flex-start',
            transition: 'border-color 0.2s, transform 0.2s',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
              background: `${info.color}15`,
              border: `1px solid ${info.color}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <info.Icon size={22} style={{ color: info.color }} />
            </div>
            <div>
              <p style={{ color: info.color, fontWeight: '700', fontSize: '14px', margin: '0 0 6px' }}>{info.title}</p>
              {info.lines.map((l, j) => (
                <p key={j} style={{ color: j === 0 ? '#F1F5F9' : '#6B7280', fontSize: '14px', margin: 0, lineHeight: '1.6', fontWeight: j === 0 ? '600' : '400' }}>{l}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Form + Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', alignItems: 'start' }}>

        {/* Form */}
        <div className="bg-surface border border-accent/15 rounded-2xl p-9 relative overflow-hidden">
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(66,165,245,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          {sent ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="w-20 h-20 rounded-full bg-success/15 border-2 border-success/40 flex items-center justify-center mx-auto mb-5">
                <Check size={40} className="text-success" />
              </div>
              <h3 className="text-success font-bold text-xl mb-3">Mesaj trimis!</h3>
              <p style={{ color: '#9CA3AF', fontSize: '15px', margin: '0 0 28px', lineHeight: '1.6' }}>
                Îți mulțumim! Te vom contacta în cel mai scurt timp la adresa{' '}
                <strong className="text-accent font-semibold">{form.email}</strong>.
              </p>
              <button
                onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                className="btn-outline">
                Trimite alt mesaj
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
                <div className="w-9 h-9 rounded-xl bg-accent-dim border border-accent flex items-center justify-center shrink-0">
                  <ChatCircleDots size={18} weight="bold" className="text-accent" />
                </div>
                <h2 style={{ color: '#F1F5F9', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                  Trimite un mesaj
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div>{field('name', 'Nume')}</div>
                <div>{field('email', 'Email', 'email')}</div>
              </div>
              {field('subject', 'Subiect')}
              {field('message', 'Mesaj', 'text', 6)}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-[15px] flex items-center justify-center gap-2">
                {loading
                  ? <><CircleNotch className="animate-spin" size={16} /> Se trimite...</>
                  : <><Rocket size={16} weight="bold" /> Trimite mesajul</>
                }
              </button>
            </form>
          )}
        </div>

        {/* Right: map + schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Map placeholder */}
          <div style={{
            borderRadius: '20px', overflow: 'hidden',
            border: '1px solid rgba(66,165,245,0.2)',
            background: 'linear-gradient(135deg, rgba(13,27,62,0.9), rgba(10,22,40,0.95))',
            height: '220px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '10px',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(66,165,245,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <MapPin size={40} weight="duotone" className="ph-duotone text-accent" />
            <p style={{ color: '#42A5F5', fontWeight: '700', fontSize: '14px', margin: 0 }}>Strada Științei nr. 2</p>
            <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>Galați, România</p>
          </div>

          {/* Schedule */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div className="w-9 h-9 rounded-xl bg-price-dim border border-price-border flex items-center justify-center shrink-0">
                <Clock size={18} weight="bold" className="text-price" />
              </div>
              <p style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px', margin: 0 }}>Program</p>
            </div>
            {[
              { zi: 'Luni – Vineri', ore: '09:00 – 18:00', activ: true },
              { zi: 'Sâmbătă',       ore: '10:00 – 14:00', activ: true },
              { zi: 'Duminică',      ore: 'Închis',         activ: false },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0',
                borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <span style={{ color: '#9CA3AF', fontSize: '14px' }}>{r.zi}</span>
                <span className={r.activ ? 'text-success font-semibold text-sm' : 'text-danger font-semibold text-sm'}>
                  {r.ore}
                </span>
              </div>
            ))}
          </div>

          {/* 24h response card */}
          <div className="bg-gradient-to-br from-accent/[0.1] to-transparent border border-accent/25 rounded-2xl p-5.5 text-center">
            <p style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 10px' }}>
              Răspuns garantat în maximum
            </p>
            <p className="text-accent font-extrabold text-3xl mb-1">24h</p>
            <p style={{ color: '#6B7280', fontSize: '12px', margin: 0 }}>în zilele lucrătoare</p>
          </div>
        </div>
      </div>
    </div>
  )
}
