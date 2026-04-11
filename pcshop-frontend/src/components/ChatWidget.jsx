import { useState, useEffect, useRef } from 'react'
import {
  ChatCircleDots, X, Robot, CurrencyDollar, Target,
  ArrowLeft, ShoppingCart, Check, Warning, Cpu,
  Monitor, Circuitry, Memory, Lightning,
  Package, HardDrive, Thermometer, CircleNotch,
} from '@phosphor-icons/react'
import { chatAPI, cartAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'

const USE_CASES = [
  { value: 'gaming',       label: 'Gaming'         },
  { value: 'video',        label: 'Editare video'   },
  { value: 'office',       label: 'Office'          },
  { value: 'productivity', label: 'Productivitate'  },
  { value: 'streaming',    label: 'Streaming'       },
]

const COMP_META = {
  cpu:         { label: 'Procesor',      Icon: Cpu,          color: 'var(--cyan)'   },
  gpu:         { label: 'Placa video',   Icon: Monitor,      color: 'var(--violet)' },
  motherboard: { label: 'Placa de baza', Icon: Circuitry,    color: 'var(--amber)'  },
  ram:         { label: 'Memorie RAM',   Icon: Memory,       color: 'var(--green)'  },
  psu:         { label: 'Sursa',         Icon: Lightning,    color: 'var(--red)'    },
  case:        { label: 'Carcasa',       Icon: Package,      color: '#80CBC4'       },
  storage:     { label: 'Stocare',       Icon: HardDrive,    color: 'var(--amber)'  },
  cooler:      { label: 'Cooler',        Icon: Thermometer,  color: '#81D4FA'       },
}

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuthStore()
  const { setCart } = useCartStore()

  const [open, setOpen]           = useState(false)
  const [budget, setBudget]       = useState('')
  const [useCase, setUseCase]     = useState('gaming')
  const [minBudget, setMinBudget] = useState(null)
  const [maxBudget, setMaxBudget] = useState(null)
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [cartLoading, setCartLoading] = useState(false)
  const [cartAdded, setCartAdded] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    chatAPI.minPrice()
      .then(res => { setMinBudget(res.data.min_budget); setMaxBudget(res.data.max_budget) })
      .catch(() => { setMinBudget(2080); setMaxBudget(22000) })
  }, [])

  useEffect(() => {
    if (result && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [result])

  const budgetNum = parseFloat(budget) || 0

  // Trimite cererea de generare configuratie catre AI si afiseaza rezultatul
  const handleGenerate = async () => {
    if (!budget || budgetNum <= 0) { setError('Introdu un buget valid'); return }
    if (minBudget && budgetNum < minBudget) {
      setError(`Minim ${Math.ceil(minBudget)} RON pentru un PC complet`)
      return
    }
    setLoading(true); setError(''); setResult(null); setCartAdded(false)
    try {
      const res = await chatAPI.suggest({ budget: budgetNum, use_case: useCase })
      if (!res.data.success || !res.data.suggestion) {
        setError(res.data.error || 'Buget insuficient!'); return
      }
      setResult(res.data.suggestion)
    } catch (err) {
      setError(err.response?.data?.detail || 'Eroare la generare.')
    } finally { setLoading(false) }
  }

  // Adauga toate componentele configuratiei in cos in paralel, apoi sincronizeaza store-ul
  const handleAddToCart = async () => {
    if (!isAuthenticated) { setError('Trebuie sa fii autentificat!'); return }
    setCartLoading(true)
    try {
      await Promise.all(
        Object.values(result.configuration || {}).map(comp =>
          cartAPI.add({ user_id: user.id, product_id: comp.id, quantity: 1 })
        )
      )
      const cartRes = await cartAPI.get(user.id)
      setCart(cartRes.data)
      setCartAdded(true)
    } catch { setError('Eroare la adaugarea in cos.') }
    finally { setCartLoading(false) }
  }

  // Reseteaza formularul pentru o noua generare
  const handleReset = () => { setResult(null); setError(''); setCartAdded(false) }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {open && (
        <div className="absolute bottom-[76px] right-0 w-[360px] max-h-[560px]
                        bg-base/98 rounded-2xl border border-accent/15 flex flex-col overflow-hidden
                        backdrop-blur-xl shadow-elevated animate-fade-in">

          {/* Header */}
          <div className="bg-gradient-to-r from-base-1 to-base-2 px-4 py-3.5
                          border-b border-accent/20 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-accent-dim border border-accent-border
                              flex items-center justify-center">
                <Robot size={18} weight="duotone" className="text-accent" />
              </div>
              <div>
                <div className="text-primary font-semibold text-sm">Configurator PC</div>
                <div className="text-accent text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                  Îți fac o configurație pe buget
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 border-none text-secondary
                         flex items-center justify-center cursor-pointer
                         hover:bg-white/20 hover:text-primary transition-all duration-150"
            >
              <X size={13} weight="bold" />
            </button>
          </div>

          {/* Body */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
            {!result ? (
              <>
                <div className="bg-accent-dim border border-accent-border rounded-xl p-3 pr-4">
                  <p className="text-primary text-[13px] leading-relaxed m-0">
                    <strong>Salut!</strong> Spune-mi bugetul și pentru ce vrei PC-ul, și îți generez o configurație completă, 100% compatibilă!
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-secondary text-xs font-semibold mb-1.5">
                    <CurrencyDollar size={13} weight="bold" className="text-accent" />
                    Buget (RON)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={e => { setBudget(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && !result && handleGenerate()}
                    placeholder={minBudget ? `Minim ${Math.ceil(minBudget)} RON` : 'Ex: 5000'}
                    className="w-full bg-white/5 border border-white/10 text-primary px-3.5 py-2.5
                               rounded-xl text-[15px] font-semibold outline-none placeholder:text-muted
                               focus:border-accent/40 focus:shadow-[0_0_0_3px_rgba(14,246,255,0.08)]
                               transition-all duration-150"
                    style={error && budgetNum > 0 && budgetNum < minBudget ? { borderColor: 'var(--red)' } : {}}
                  />
                  {minBudget && (
                    <div className="flex justify-between mt-1.5">
                      <span className="text-muted text-[11px]">Min: {Math.ceil(minBudget)} RON</span>
                      <span className="text-muted text-[11px]">Max: {Math.ceil(maxBudget)} RON</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-secondary text-xs font-semibold mb-2">
                    <Target size={13} weight="bold" className="text-accent" />
                    Pentru ce folosești PC-ul?
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {USE_CASES.map(uc => (
                      <button
                        key={uc.value}
                        onClick={() => setUseCase(uc.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer
                                   border transition-all duration-150
                                   ${useCase === uc.value
                                     ? 'bg-accent text-base border-accent font-bold'
                                     : 'bg-white/5 border-white/10 text-secondary hover:border-accent/30 hover:text-primary'
                                   }`}
                      >
                        {uc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-danger text-xs bg-danger/[0.08]
                                  border border-danger/20 rounded-xl px-3 py-2">
                    <Warning size={13} weight="bold" className="shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading || !budget}
                  className={`w-full py-3 rounded-xl text-sm font-bold border-none transition-all duration-150
                             ${loading || !budget
                               ? 'bg-white/5 text-muted cursor-not-allowed'
                               : 'bg-accent text-base cursor-pointer hover:shadow-glow-cyan hover:-translate-y-px'
                             }`}
                >
                  {loading
                    ? <span className="flex items-center justify-center gap-2">
                        <CircleNotch size={14} weight="bold" className="animate-spin" /> Se generează...
                      </span>
                    : 'Generează configurația'
                  }
                </button>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-success text-[13px] font-bold flex items-center gap-1.5">
                    <Check size={14} weight="bold" />
                    Configurație {USE_CASES.find(u => u.value === useCase)?.label}
                  </span>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 bg-white/[0.06] border border-white/10
                               text-secondary px-2.5 py-1 rounded-lg text-[11px] cursor-pointer
                               hover:text-primary transition-colors duration-150"
                  >
                    <ArrowLeft size={11} weight="bold" /> Înapoi
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  {Object.entries(result.configuration || {}).map(([role, comp]) => {
                    const meta = COMP_META[role] || { label: role, Icon: Package, color: 'var(--text-2)' }
                    const { Icon: CompIcon } = meta
                    return (
                      <div
                        key={role}
                        className="bg-white/[0.04] rounded-xl p-2.5 flex justify-between items-center"
                        style={{ borderLeft: `2px solid ${meta.color}` }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <CompIcon size={14} weight="duotone" style={{ color: meta.color, flexShrink: 0 }} />
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>
                              {meta.label}
                            </div>
                            <div className="text-primary text-[12px] truncate">{comp.name}</div>
                          </div>
                        </div>
                        <span className="text-accent font-bold text-xs font-mono shrink-0 ml-2">
                          {comp.price} RON
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="bg-success/[0.06] border border-success/20 rounded-xl p-2.5
                                flex justify-between items-center">
                  <div>
                    <div className="text-success text-[13px] font-bold">Total: {result.total_price} RON</div>
                    {result.budget_remaining > 0 && (
                      <div className="text-muted text-[11px]">Rămas: {result.budget_remaining} RON</div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[11px] font-bold
                    ${result.is_compatible ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                    {result.is_compatible
                      ? <span className="flex items-center gap-1"><Check size={11} weight="bold" /> Compatibil</span>
                      : <span className="flex items-center gap-1"><Warning size={11} weight="bold" /> Verificați</span>
                    }
                  </span>
                </div>

                {result.compatibility_notes?.length > 0 && (
                  <div className="bg-price/[0.08] border border-price/20 rounded-xl p-2.5 flex flex-col gap-1">
                    {result.compatibility_notes.map((w, i) => (
                      <div key={i} className="text-price text-[11px] flex items-center gap-1.5">
                        <Warning size={11} weight="bold" /> {w}
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-1.5 text-danger text-xs">
                    <Warning size={12} weight="bold" /> {error}
                  </div>
                )}

                {cartAdded ? (
                  <div className="text-center py-2.5 bg-success/[0.08] rounded-xl
                                  border border-success/20 text-success text-[13px] font-bold
                                  flex items-center justify-center gap-2">
                    <Check size={14} weight="bold" /> Adăugat în coș!
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={cartLoading}
                    className={`w-full py-2.5 rounded-xl text-[13px] font-bold border-none
                               transition-all duration-150
                               ${cartLoading
                                 ? 'bg-white/5 text-muted cursor-not-allowed'
                                 : 'bg-success text-base cursor-pointer hover:shadow-[0_4px_16px_rgba(0,229,160,0.4)] hover:-translate-y-px'
                               }`}
                  >
                    {cartLoading
                      ? <span className="flex items-center justify-center gap-2">
                          <CircleNotch size={14} weight="bold" className="animate-spin" /> Se adaugă...
                        </span>
                      : <span className="flex items-center justify-center gap-2">
                          <ShoppingCart size={14} weight="bold" /> Adaugă toate în coș
                        </span>
                    }
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full cursor-pointer flex items-center justify-center
                   transition-all duration-300 hover:scale-110
                   ${open
                     ? 'bg-white/10 border border-white/10 text-secondary'
                     : 'bg-accent text-base border-none shadow-glow-cyan animate-glow-pulse'
                   }`}
      >
        {open
          ? <X size={20} weight="bold" />
          : <ChatCircleDots size={26} weight="duotone" />
        }
      </button>
    </div>
  )
}
