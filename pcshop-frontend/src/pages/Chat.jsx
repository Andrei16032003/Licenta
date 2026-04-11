import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatAPI, cartAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import {
  Robot, Cpu, Monitor, Circuitry, Memory, Lightning, Package, HardDrive, Thermometer,
  ArrowCounterClockwise, Check, Warning, CircleNotch, ShoppingCart, ArrowUp, Rocket,
} from '@phosphor-icons/react'

const USE_CASES = [
  {
    value: 'gaming',
    label: 'Gaming',
    desc: 'Focusat pe GPU puternic pentru FPS maxim. CPU rapid, RAM 16-32GB DDR5. Ideal pentru 1080p, 1440p sau 4K.',
    focus: ['GPU puternic', 'CPU rapid', 'RAM 16-32GB'],
  },
  {
    value: 'video',
    label: 'Editare video',
    desc: 'Prioritizeaza CPU multi-core pentru render si export rapid. RAM 32GB+, SSD NVMe rapid, GPU ajuta la accelerare.',
    focus: ['CPU multi-core', 'RAM 32GB+', 'SSD NVMe'],
  },
  {
    value: 'office',
    label: 'Office',
    desc: 'CPU eficient, RAM 16GB, SSD rapid. Nu necesita GPU dedicat. Perfect pentru Word, Excel, browser, email.',
    focus: ['CPU eficient', 'RAM 16GB', 'SSD rapid'],
  },
  {
    value: 'productivity',
    label: 'Productivitate',
    desc: 'Echilibru intre CPU puternic si RAM generos. Ideal pentru multitasking intens, compilare cod si masini virtuale.',
    focus: ['CPU puternic', 'RAM mare', 'Multitasking'],
  },
  {
    value: 'streaming',
    label: 'Streaming',
    desc: 'CPU puternic pentru encoding live, GPU mediu, RAM 32GB. Ruleaza gaming si OBS simultan fara lag.',
    focus: ['CPU encoding', 'RAM 32GB', 'GPU mediu'],
  },
]

const COMP_META = {
  cpu:         { label: 'Procesor',      Icon: Cpu,         color: '#42A5F5' },
  gpu:         { label: 'Placa video',   Icon: Monitor,     color: '#CE93D8' },
  motherboard: { label: 'Placa de baza', Icon: Circuitry,   color: '#FF9800' },
  ram:         { label: 'Memorie RAM',   Icon: Memory,      color: '#00E676' },
  psu:         { label: 'Sursa',         Icon: Lightning,   color: '#FF5252' },
  case:        { label: 'Carcasa',       Icon: Package,     color: '#80CBC4' },
  storage:     { label: 'Stocare',       Icon: HardDrive,   color: '#FFD700' },
  cooler:      { label: 'Cooler',        Icon: Thermometer, color: '#81D4FA' },
}

export default function Chat() {
  const { user, isAuthenticated } = useAuthStore()
  const { setCart } = useCartStore()
  const navigate = useNavigate()

  const [budget, setBudget] = useState('')
  const [useCase, setUseCase] = useState('gaming')
  const [result, setResult] = useState(null)
  const [minBudget, setMinBudget] = useState(null)
  const [maxBudget, setMaxBudget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMin, setLoadingMin] = useState(true)
  const [error, setError] = useState('')
  const [cartLoading, setCartLoading] = useState(false)
  const [cartAdded, setCartAdded] = useState(false)

  useEffect(() => {
    setLoadingMin(true)
    chatAPI.minPrice()
      .then(res => {
        setMinBudget(res.data.min_budget)
        setMaxBudget(res.data.max_budget)
      })
      .catch(() => {
        setMinBudget(2080)
        setMaxBudget(null)  // nu folosim o valoare falsa; bara de buget se ascunde automat
      })
      .finally(() => setLoadingMin(false))
  }, [])

  const budgetNum = parseFloat(budget) || 0
  const budgetInsufficient = minBudget && budgetNum > 0 && budgetNum < minBudget

  // Trimite cererea de generare configuratie AI si actualizeaza rezultatul
  const handleGenerate = async () => {
    if (!budget || budgetNum <= 0) { setError('Introdu un buget valid'); return }
    if (minBudget && budgetNum < minBudget) {
      setError(`Buget insuficient! Minimul pentru un PC complet este ${Math.ceil(minBudget)} RON`)
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    setCartAdded(false)
    try {
      const res = await chatAPI.suggest({ budget: budgetNum, use_case: useCase })
      if (!res.data.success || !res.data.suggestion) {
        setError(res.data.error || 'Buget insuficient pentru o configuratie completa!')
        return
      }
      setResult(res.data.suggestion)
    } catch (err) {
      setError(err.response?.data?.detail || 'Eroare. Incearca din nou!')
    } finally { setLoading(false) }
  }

  // Adauga toate componentele configuratiei in cos in paralel, apoi sincronizeaza store-ul
  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!result?.configuration) return
    setCartLoading(true)
    try {
      await Promise.all(
        Object.values(result.configuration).map(comp =>
          cartAPI.add({ user_id: user.id, product_id: comp.id, quantity: 1 })
        )
      )
      const cartRes = await cartAPI.get(user.id)
      setCart(cartRes.data)
      setCartAdded(true)
    } catch { /* silent */ }
    finally { setCartLoading(false) }
  }

  const stats = minBudget && maxBudget ? [
    { Icon: ArrowCounterClockwise, value: `${Math.ceil(minBudget).toLocaleString('ro-RO')} RON`, label: 'Buget minim', color: '#00E676' },
    { Icon: ArrowUp,               value: `${Math.ceil(maxBudget).toLocaleString('ro-RO')} RON`, label: 'Buget maxim', color: '#42A5F5' },
    { Icon: Cpu,                   value: '8',  label: 'Componente verificate', color: '#CE93D8' },
    { Icon: Check,                 value: '11', label: 'Reguli compatibilitate', color: '#FF9800' },
  ] : []

  return (
    <div style={{ maxWidth: '1500px', margin: '0 auto' }}>
      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0D1B3E 0%, #0A1628 50%, #0D1B3E 100%)',
        borderRadius: '20px', padding: '52px 48px',
        marginBottom: '24px', textAlign: 'center',
        border: '1px solid rgba(66,165,245,0.2)',
        boxShadow: '0 0 80px rgba(41,121,255,0.12)',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(66,165,245,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '240px', height: '240px', background: 'radial-gradient(circle, rgba(206,147,216,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '10%', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(0,230,118,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5 shadow-glow-cyan">
          <Robot size={30} weight="bold" className="text-dark" />
        </div>
        <h1 style={{ fontSize: '44px', fontWeight: '800', color: '#F1F5F9', marginBottom: '14px', letterSpacing: '-0.5px' }}>
          Configuratie PC pe{' '}
          <span style={{ background: 'linear-gradient(135deg, var(--cyan), var(--violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>bugetul tau</span>
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '18px', maxWidth: '560px', margin: '0 auto' }}>
          Spune-ne bugetul si ce folosesti PC-ul — iti recomandam configuratia optima
        </p>
      </div>

      {/* Stats grid */}
      {minBudget && maxBudget && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${s.color}25`,
              borderRadius: '16px', padding: '20px', textAlign: 'center',
              transition: 'border-color 0.2s, transform 0.2s',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '44px', height: '44px', borderRadius: '12px',
                background: `${s.color}18`, border: `1px solid ${s.color}35`,
                marginBottom: '10px',
              }}>
                <s.Icon size={20} style={{ color: s.color }} />
              </div>
              <div style={{ color: s.color, fontWeight: '800', fontSize: '20px', lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '5px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Left: form */}
        <div className="bg-surface border border-accent/15 rounded-2xl p-5">
          {/* Panel header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '20px', paddingBottom: '16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div className="w-9 h-9 rounded-xl bg-accent-dim border border-accent flex items-center justify-center shrink-0">
              <Cpu size={16} weight="bold" className="text-accent" />
            </div>
            <h2 style={{ color: '#F1F5F9', fontSize: '17px', fontWeight: '700', margin: 0 }}>
              Preferintele tale
            </h2>
          </div>

          {/* Budget */}
          <div style={{ marginBottom: '12px' }}>
            <label className="block text-muted text-xs font-semibold mb-1.5 uppercase tracking-wide">
              BUGET (RON)
            </label>
            <input
              type="number"
              value={budget}
              onChange={e => { setBudget(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              className="input-field"
              placeholder={loadingMin ? 'Se incarca...' : `min. ${minBudget ? Math.ceil(minBudget).toLocaleString('ro-RO') : '2080'} RON`}
            />

            {/* Budget bar */}
            {minBudget && maxBudget && budgetNum > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{
                  height: '6px', borderRadius: '3px',
                  background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    width: `${Math.min(100, Math.max(0, ((budgetNum - minBudget) / (maxBudget - minBudget)) * 100))}%`,
                    background: budgetInsufficient
                      ? '#FF5252'
                      : budgetNum > maxBudget * 0.8
                        ? 'linear-gradient(90deg, var(--cyan), var(--violet))'
                        : 'linear-gradient(90deg, var(--green), var(--cyan))',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: '#4B5563', fontSize: '12px' }}>
                    {Math.ceil(minBudget).toLocaleString('ro-RO')} RON
                  </span>
                  <span style={{ color: '#4B5563', fontSize: '12px' }}>
                    {Math.ceil(maxBudget).toLocaleString('ro-RO')} RON
                  </span>
                </div>
              </div>
            )}

            {/* Min price hint */}
            {minBudget && (
              <div style={{
                marginTop: '8px', padding: '8px 12px', borderRadius: '8px',
                background: budgetInsufficient ? 'rgba(255,82,82,0.08)' : 'rgba(66,165,245,0.06)',
                border: `1px solid ${budgetInsufficient ? 'rgba(255,82,82,0.25)' : 'rgba(66,165,245,0.2)'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ color: '#6B7280', fontSize: '12px' }}>
                  Pret minim config. completa:
                </span>
                <span style={{
                  color: budgetInsufficient ? '#FF5252' : 'var(--cyan)',
                  fontWeight: '700', fontSize: '13px',
                }}>
                  {Math.ceil(minBudget).toLocaleString('ro-RO')} RON
                </span>
              </div>
            )}
            {budgetInsufficient && (
              <div className="bg-danger/[0.08] border border-danger/30 text-danger text-sm font-semibold px-3.5 py-2.5 rounded-lg mt-2 flex items-center gap-1.5">
                <Warning size={13} />
                Buget insuficient! Minimul este <strong>{Math.ceil(minBudget).toLocaleString('ro-RO')} RON</strong>
              </div>
            )}
          </div>

          {/* Use case */}
          <div style={{ marginBottom: '14px' }}>
            <label className="block text-muted text-xs font-semibold mb-2 uppercase tracking-wide">
              UTILIZARE
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {USE_CASES.map(uc => {
                const active = useCase === uc.value
                return (
                  <button
                    key={uc.value}
                    onClick={() => { setUseCase(uc.value); setResult(null); setError('') }}
                    className={active
                      ? 'w-full text-left px-3 py-2.5 rounded-xl bg-accent-dim border border-accent cursor-pointer transition-all'
                      : 'w-full text-left px-3 py-2 rounded-xl bg-base-2/50 border border-default cursor-pointer hover:border-accent/30 transition-all'
                    }>
                    <div className={active ? 'text-primary font-bold text-sm mb-1.5' : 'text-secondary text-sm'}>
                      {uc.label}
                    </div>
                    {active && (
                      <>
                        <div style={{ color: '#9CA3AF', fontSize: '12px', lineHeight: '1.4', marginBottom: '6px' }}>
                          {uc.desc}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {uc.focus.map(f => (
                            <span key={f} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-dim border border-accent text-accent">
                              {f}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-3.5 py-2.5 rounded-lg mb-4 flex items-center gap-1.5">
              <Warning size={13} />
              {error}
            </div>
          )}

          {loading || budgetInsufficient ? (
            <button
              onClick={handleGenerate}
              disabled
              className="w-full py-3 text-[15px] bg-base-2 border border-default text-muted rounded-xl cursor-not-allowed">
              {loading
                ? <span className="flex items-center justify-center gap-2"><CircleNotch className="animate-spin" size={16} /> Se genereaza...</span>
                : 'Genereaza configuratie'
              }
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="btn-primary w-full py-3 text-[15px] flex items-center justify-center gap-2">
              <Rocket size={16} weight="bold" />
              Genereaza configuratie
            </button>
          )}
        </div>

        {/* Right: result */}
        {result ? (
          <div className="bg-surface border border-success/20 rounded-2xl p-5">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="w-9 h-9 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center shrink-0">
                  <Check size={16} weight="bold" className="text-success" />
                </div>
                <div>
                  <h2 style={{ color: '#F1F5F9', fontSize: '17px', fontWeight: '700', marginBottom: '3px' }}>
                    Configuratie recomandata
                  </h2>
                  <p style={{ color: '#4B5563', fontSize: '13px' }}>
                    {USE_CASES.find(u => u.value === useCase)?.label} · buget {budgetNum.toLocaleString('ro-RO')} RON
                  </p>
                </div>
              </div>
              {result.is_compatible ? (
                <div className="bg-success/10 border border-success/30 text-success text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Check size={11} />
                  100% Compatibil
                </div>
              ) : (
                <div className="bg-price-dim border border-price-border text-price text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Warning size={11} />
                  Verificati compatibilitatea
                </div>
              )}
            </div>

            {/* Compatibility notes */}
            {result.compatibility_notes?.length > 0 && (
              <div className="bg-price-dim border border-price-border rounded-xl px-3.5 py-2.5 mb-4 text-price text-xs space-y-1">
                {result.compatibility_notes.map((w, i) => (
                  <div key={i}>
                    <Warning size={11} className="inline mr-1" />
                    {w}
                  </div>
                ))}
              </div>
            )}

            {/* Component list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
              {Object.entries(result.configuration || {}).map(([role, comp]) => {
                const meta = COMP_META[role] || { label: role, Icon: Package, color: '#42A5F5' }
                return (
                  <div key={role} className="bg-base-2/50 border border-default rounded-lg px-3 py-2 flex items-center gap-2.5">
                    <div style={{
                      width: '32px', height: '32px', flexShrink: 0,
                      background: `${meta.color}15`,
                      border: `1px solid ${meta.color}35`,
                      borderRadius: '8px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <meta.Icon size={15} style={{ color: meta.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '1px' }}>
                        {meta.label}
                      </div>
                      <div style={{
                        color: '#F1F5F9', fontWeight: '600', fontSize: '14px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {comp.name}
                      </div>
                      {comp.brand && (
                        <div style={{ color: '#4B5563', fontSize: '12px' }}>{comp.brand}</div>
                      )}
                    </div>
                    <div style={{ color: meta.color, fontWeight: '700', fontSize: '15px', flexShrink: 0 }}>
                      {comp.price} RON
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total + cart */}
            <div className="border-t border-default pt-4 mt-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="text-secondary font-semibold">Total</span>
                <span className="text-price font-mono font-extrabold text-2xl">
                  {result.total_price} RON
                </span>
              </div>
              {result.budget_remaining > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <span className="bg-success/[0.08] border border-success/20 text-success text-xs px-2.5 py-0.5 rounded-full">
                    Ramas: {result.budget_remaining} RON
                  </span>
                </div>
              )}

              {cartAdded ? (
                <button
                  disabled
                  className="w-full py-3 bg-success/15 text-success border border-success/30 rounded-xl flex items-center justify-center gap-2 font-semibold">
                  <Check size={16} />
                  Adaugat in cos!
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {cartLoading
                    ? <><CircleNotch className="animate-spin" size={16} /> Se adauga...</>
                    : <><ShoppingCart size={16} /> Adauga toate în coș</>
                  }
                </button>
              )}

              {result.performance_notes && (
                <p className="text-muted text-xs mt-3.5 text-center leading-relaxed">
                  {result.performance_notes}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-base-2/30 border border-default rounded-2xl p-7 min-h-[400px] flex flex-col justify-center items-center">
            <Robot size={48} weight="duotone" className="ph-duotone text-muted/20 mb-3" />
            <p className="text-muted text-sm text-center leading-relaxed mb-6">
              Introdu bugetul si apasa<br />
              <span className="text-accent font-semibold">Generează configurație</span>
            </p>
            {minBudget && maxBudget && (
              <div className="flex flex-col gap-2 w-full max-w-[320px]">
                {[
                  { label: 'PC entry level', budget: Math.ceil(minBudget * 1.1), color: '#00E676' },
                  { label: 'PC mid range', budget: Math.ceil((minBudget + maxBudget) * 0.25), color: '#42A5F5' },
                  { label: 'PC high end', budget: Math.ceil((minBudget + maxBudget) * 0.5), color: '#CE93D8' },
                  { label: 'PC enthusiast', budget: Math.ceil(maxBudget * 0.8), color: '#FF9800' },
                ].map(tier => (
                  <button
                    key={tier.label}
                    onClick={() => { setBudget(String(tier.budget)); setError('') }}
                    className="bg-surface border border-default rounded-lg px-3.5 py-2.5 cursor-pointer flex justify-between items-center hover:border-accent/30 hover:bg-accent-dim transition-all">
                    <span className="text-secondary text-sm">{tier.label}</span>
                    <span style={{ color: tier.color }} className="font-bold text-base">
                      ~{tier.budget.toLocaleString('ro-RO')} RON
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
