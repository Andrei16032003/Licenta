import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChatCircleDots, X, Robot, ArrowLeft, User, Package,
  Tag, Heart, ShieldCheck, ArrowCounterClockwise, Wrench,
  Phone, CircleNotch, Warning, CaretRight, MagnifyingGlass,
} from '@phosphor-icons/react'
import {
  ordersAPI, profileAPI, wishlistAPI,
  retururiAPI, serviceAPI, vouchersAPI, productsAPI, chatAPI,
} from '../services/api'
import useAuthStore from '../store/authStore'

// ── Constants ────────────────────────────────────────────────
const STATUS_MAP = {
  pending:    { label: 'În așteptare', color: '#f59e0b' },
  confirmed:  { label: 'Confirmată',   color: '#38bdf8' },
  processing: { label: 'În procesare', color: '#a78bfa' },
  shipped:    { label: 'Expediată',    color: '#38bdf8' },
  delivered:  { label: 'Livrată',      color: '#00e5a0' },
  cancelled:  { label: 'Anulată',      color: '#f87171' },
}
const PAYMENT_MAP = {
  pending:  { label: 'Neplătită',  color: '#f59e0b' },
  paid:     { label: 'Plătită',    color: '#00e5a0' },
  failed:   { label: 'Eșuată',     color: '#f87171' },
  refunded: { label: 'Rambursată', color: '#a78bfa' },
}
const RETUR_STATUS = {
  pending:   'În așteptare',
  approved:  'Aprobat',
  rejected:  'Respins',
  completed: 'Finalizat',
}
const SERVICE_STATUS = {
  pending:    'În așteptare',
  in_service: 'În service',
  completed:  'Finalizat',
  rejected:   'Respins',
}
const MENU = [
  { id: 'cautare',  label: 'Caută produs',     Icon: MagnifyingGlass,       color: '#38bdf8' },
  { id: 'comenzi',  label: 'Comenzile mele',   Icon: Package,               color: '#a78bfa' },
  { id: 'retururi', label: 'Retururi',         Icon: ArrowCounterClockwise, color: '#fb923c' },
  { id: 'service',  label: 'Service',          Icon: Wrench,                color: '#c084fc' },
  { id: 'garantii', label: 'Garanții',         Icon: ShieldCheck,           color: '#00e5a0' },
  { id: 'favorite', label: 'Favorite',         Icon: Heart,                 color: '#f87171' },
  { id: 'vouchere', label: 'Vouchere',         Icon: Tag,                   color: '#f59e0b' },
  { id: 'profil',   label: 'Profilul meu',     Icon: User,                  color: '#38bdf8' },
]

// ── Shared UI (outside ChatWidget — stable references, no remount) ──
function BotMsg({ children }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-full bg-accent-dim border border-accent-border
                      flex items-center justify-center shrink-0 mt-0.5">
        <Robot size={13} weight="duotone" className="text-accent" />
      </div>
      <div className="bg-accent-dim border border-accent-border rounded-xl rounded-tl-sm
                      px-3 py-2 text-[13px] text-primary leading-relaxed flex-1">
        {children}
      </div>
    </div>
  )
}

function OptionBtn({ Icon, label, color, onClick, sub }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                 bg-white/[0.04] border border-white/10 cursor-pointer text-left
                 hover:border-white/20 hover:bg-white/[0.07] transition-all duration-150 group">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
           style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-primary text-[13px] font-semibold">{label}</div>
        {sub && <div className="text-muted text-[11px]">{sub}</div>}
      </div>
      <CaretRight size={12} className="text-muted group-hover:text-primary transition-colors shrink-0" />
    </button>
  )
}

function InfoSteps({ steps }) {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex flex-col gap-2.5">
      <div className="text-muted text-[10px] uppercase tracking-wide font-bold mb-0.5">Cum funcționează</div>
      {steps.map(({ n, text }) => (
        <div key={n} className="flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/40
                          flex items-center justify-center text-accent text-[10px] font-bold shrink-0 mt-0.5">
            {n}
          </div>
          <span className="text-primary text-[12px] leading-relaxed">{text}</span>
        </div>
      ))}
    </div>
  )
}

function CheckList({ title, items }) {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex flex-col gap-1.5">
      <div className="text-muted text-[10px] uppercase tracking-wide font-bold mb-0.5">{title}</div>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-accent text-[11px] mt-0.5 shrink-0">✓</span>
          <span className="text-primary text-[12px]">{item}</span>
        </div>
      ))}
    </div>
  )
}

function BtnPrimary({ onClick, children }) {
  return (
    <button onClick={onClick}
            className="w-full py-2.5 rounded-xl bg-accent text-base text-[13px] font-bold
                       cursor-pointer hover:shadow-glow-cyan transition-all">
      {children}
    </button>
  )
}

function BtnSecondary({ onClick, children }) {
  return (
    <button onClick={onClick}
            className="w-full py-2 rounded-xl bg-white/5 border border-white/10
                       text-secondary text-[13px] cursor-pointer hover:text-primary transition-all">
      {children}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────
export default function ChatWidget() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [open, setOpen]             = useState(false)
  const [screen, setScreen]         = useState('home')
  // cache[key]: undefined = not fetched, 'loading' = in progress, 'error' = failed, array/obj = data
  const [cache, setCache]           = useState({})
  const [selOrder, setSelOrder]     = useState(null)
  const [probStep, setProbStep]     = useState(null)
  const [svcInfo, setSvcInfo]       = useState(false)
  const [retInfo, setRetInfo]       = useState(false)
  const [aiQuery, setAiQuery]   = useState('')
  const [aiState, setAiState]   = useState({ status: 'idle' })
  // status: idle | thinking | searching | ok | fallback | error
  const bodyRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current)
      setTimeout(() => bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }, [screen, selOrder, probStep, svcInfo, retInfo])

  const runAiSearch = async (q) => {
    if (!q.trim()) return
    setAiState({ status: 'thinking' })
    try {
      // Step 1: Ollama extrage categoria + filtrele
      const extRes = await chatAPI.extractFilters(q.trim())
      const extracted = extRes.data || {}

      if (extracted.category_slug) {
        setAiState({ status: 'searching', extracted })
        // Step 2: cauta in DB cu filtrele extrase
        const srchRes = await chatAPI.search({
          category_slug: extracted.category_slug,
          filters: extracted.filters || {},
          limit: 6,
        })
        const results = srchRes.data?.products ?? srchRes.data ?? []
        setAiState({ status: 'ok', extracted, results })
      } else {
        // Ollama nu a extras o categorie — fallback la search clasic
        throw new Error('no_category')
      }
    } catch {
      // Fallback: search clasic
      try {
        const res = await productsAPI.getAll({ search: q.trim(), limit: 6 })
        const results = Array.isArray(res.data) ? res.data : (res.data?.items ?? [])
        setAiState({ status: 'fallback', results })
      } catch {
        setAiState({ status: 'error' })
      }
    }
  }

  const load = async (key, fetcher) => {
    if (cache[key] !== undefined) return
    setCache(p => ({ ...p, [key]: 'loading' }))
    try {
      const res = await fetcher()
      setCache(p => ({ ...p, [key]: res.data }))
    } catch {
      setCache(p => ({ ...p, [key]: 'error' }))
    }
  }

  const retry = (key, fetcher) => {
    setCache(p => { const n = { ...p }; delete n[key]; return n })
    setTimeout(() => load(key, fetcher), 0)
  }

  const goTo = (s) => {
    setScreen(s); setSelOrder(null); setProbStep(null); setSvcInfo(false); setRetInfo(false)
    if (s !== 'cautare') { setAiQuery(''); setAiState({ status: 'idle' }) }
    if (!isAuthenticated) return
    const uid = user.id
    if (s === 'comenzi' || s === 'garantii') load('orders',    () => ordersAPI.getUserOrders(uid))
    if (s === 'profil')                       load('addresses', () => profileAPI.getAddresses(uid))
    if (s === 'favorite')                     load('wishlist',  () => wishlistAPI.get(uid))
    if (s === 'retururi')                     load('retururi',  () => retururiAPI.get(uid))
    if (s === 'service')                      load('service',   () => serviceAPI.get(uid))
    if (s === 'vouchere')                     load('vouchere',  () => vouchersAPI.getMy(uid))
  }

  const goHome = () => {
    setScreen('home'); setSelOrder(null); setProbStep(null); setSvcInfo(false); setRetInfo(false)
  }

  // ── Inline helpers ───────────────────────────────────────

  const Spinner = () => (
    <div className="flex items-center justify-center py-5">
      <CircleNotch size={18} className="animate-spin text-accent" />
    </div>
  )

  const ErrorBlock = ({ onRetry }) => (
    <div className="bg-danger/10 border border-danger/30 rounded-xl px-3 py-2.5 flex items-center justify-between">
      <span className="text-danger text-[12px]">Nu s-au putut încărca datele.</span>
      <button onClick={onRetry} className="text-accent text-[12px] underline cursor-pointer ml-2">
        Reîncearcă
      </button>
    </div>
  )

  const NotAuth = () => (
    <BotMsg>
      Trebuie să fii autentificat.{' '}
      <button onClick={() => navigate('/login')} className="text-accent underline cursor-pointer">
        Conectează-te
      </button>
    </BotMsg>
  )

  const ContactCard = () => (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex flex-col gap-2">
      <a href="tel:0770648476" className="flex items-center gap-3 cursor-pointer group">
        <div className="w-7 h-7 rounded-lg bg-success/15 border border-success/30
                        flex items-center justify-center shrink-0">
          <Phone size={13} className="text-success" />
        </div>
        <div>
          <div className="text-primary text-[13px] font-semibold group-hover:text-accent transition-colors">
            0770 648 476
          </div>
          <div className="text-muted text-[11px]">Luni–Vineri, 09:00–18:00</div>
        </div>
      </a>
      <button onClick={() => navigate('/contact')}
              className="text-accent text-[12px] text-left cursor-pointer hover:underline">
        Sau completează formularul de contact →
      </button>
    </div>
  )

  const NavLinks = ({ links }) => (
    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
      {links.map(({ label, onClick }, i) => (
        <button key={i} onClick={onClick}
                className="text-accent text-[12px] cursor-pointer hover:underline">
          {label}
        </button>
      ))}
    </div>
  )

  // ── SCREENS (render functions, not components — avoids React remount bug) ──

  const renderCautare = () => {
    const { status, results, extracted } = aiState
    const busy = status === 'thinking' || status === 'searching'

    const ProductCard = ({ p }) => {
      const hasDiscount = p.discount_percent > 0
      const finalPrice  = hasDiscount
        ? (p.price * (1 - p.discount_percent / 100)).toFixed(0)
        : p.price
      const img = p.image_url || p.images?.[0]?.url
      return (
        <button onClick={() => navigate(`/product/${p.id}`)}
                className="w-full flex items-center gap-3 bg-white/[0.04] border border-white/10
                           rounded-xl p-2.5 cursor-pointer text-left
                           hover:border-accent/30 hover:bg-white/[0.07] transition-all group">
          {img
            ? <img src={img} alt={p.name} className="w-10 h-10 object-contain rounded-lg bg-white/5 shrink-0" />
            : <div className="w-10 h-10 rounded-lg bg-white/5 shrink-0 flex items-center justify-center">
                <Package size={16} className="text-muted/40" />
              </div>
          }
          <div className="flex-1 min-w-0">
            <div className="text-primary text-[12px] font-semibold truncate leading-snug">{p.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-accent font-mono font-bold text-[12px]">{finalPrice} RON</span>
              {hasDiscount && <span className="text-muted text-[11px] line-through">{p.price} RON</span>}
              {hasDiscount && <span className="text-[10px] font-bold text-success">-{p.discount_percent}%</span>}
            </div>
          </div>
          <CaretRight size={12} className="text-muted group-hover:text-primary transition-colors shrink-0" />
        </button>
      )
    }

    return (
      <>
        <BotMsg>
          Descrie ce cauți cu cuvintele tale — asistentul AI înțelege limbaj natural.
        </BotMsg>

        {/* Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !busy && runAiSearch(aiQuery)}
              placeholder="Ex: placă video bună pentru gaming sub 2000 lei..."
              disabled={busy}
              autoFocus
              className="w-full bg-white/[0.06] border border-white/15 rounded-xl pl-9 pr-3 py-2.5
                         text-primary text-[13px] outline-none placeholder:text-muted/40
                         focus:border-accent/50 transition-colors disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => runAiSearch(aiQuery)}
            disabled={busy || !aiQuery.trim()}
            className="px-3.5 py-2.5 rounded-xl bg-accent text-base text-[13px] font-bold
                       cursor-pointer hover:shadow-glow-cyan transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
          >
            {busy
              ? <CircleNotch size={14} className="animate-spin" />
              : <MagnifyingGlass size={14} weight="bold" />
            }
          </button>
        </div>

        {/* Status AI */}
        {status === 'thinking' && (
          <div className="flex items-center gap-2 text-muted text-[12px] px-1">
            <CircleNotch size={13} className="animate-spin text-accent shrink-0" />
            Asistentul analizează cererea...
          </div>
        )}
        {status === 'searching' && (
          <div className="flex items-center gap-2 text-muted text-[12px] px-1">
            <CircleNotch size={13} className="animate-spin text-accent shrink-0" />
            Caut produse potrivite...
          </div>
        )}

        {/* Filtrele înțelese de AI */}
        {status === 'ok' && extracted && (
          <div className="flex flex-wrap gap-1.5">
            {extracted.category_slug && (
              <span className="px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30
                               text-accent text-[11px] font-semibold">
                {extracted.category_slug.replace(/-/g, ' ')}
              </span>
            )}
            {Object.entries(extracted.filters || {}).map(([k, v]) => (
              <span key={k} className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/15
                                       text-primary text-[11px]">
                {k.replace(/_/g, ' ')}: <strong>{String(v)}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Fallback notice */}
        {status === 'fallback' && (
          <BotMsg>
            Nu am identificat o categorie exactă. Iată cele mai relevante rezultate:
          </BotMsg>
        )}

        {/* Error */}
        {status === 'error' && (
          <ErrorBlock onRetry={() => runAiSearch(aiQuery)} />
        )}

        {/* Niciun rezultat */}
        {(status === 'ok' || status === 'fallback') && results?.length === 0 && (
          <BotMsg>
            Niciun produs găsit pentru „<strong>{aiQuery}</strong>".
            Încearcă să reformulezi sau caută cu alți termeni.
          </BotMsg>
        )}

        {/* Rezultate */}
        {(status === 'ok' || status === 'fallback') && results?.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {results.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        )}

        {/* Nou search */}
        {(status === 'ok' || status === 'fallback' || status === 'error') && (
          <button onClick={() => { setAiQuery(''); setAiState({ status: 'idle' }) }}
                  className="text-accent text-[12px] cursor-pointer hover:underline text-center w-full pt-1">
            ← Caută din nou
          </button>
        )}
      </>
    )
  }

  const renderHome = () => (
    <>
      <BotMsg>Bună ziua! 👋 Sunt asistentul tău virtual. Cu ce vă pot ajuta astăzi?</BotMsg>
      <div className="flex flex-col gap-1.5 mt-1">
        {MENU.map(m => (
          <OptionBtn key={m.id} Icon={m.Icon} label={m.label} color={m.color} onClick={() => goTo(m.id)} />
        ))}
      </div>
    </>
  )

  // ── COMENZI ──────────────────────────────────────────────

  const renderComenzi = () => {
    const raw = cache['orders']
    const isLoading = raw === 'loading' || raw === undefined
    const isError   = raw === 'error'
    const orders    = Array.isArray(raw) ? raw : null

    return (
      <>
        <BotMsg>
          <strong>Comenzile tale</strong> — statusul, plata și detaliile. Ultimele 3 sunt afișate mai jos.
        </BotMsg>
        {!isAuthenticated ? <NotAuth /> : isLoading ? <Spinner /> : isError ? (
          <ErrorBlock onRetry={() => retry('orders', () => ordersAPI.getUserOrders(user.id))} />
        ) : !orders?.length ? (
          <BotMsg>Nu ai nicio comandă încă. 🛒</BotMsg>
        ) : (
          <div className="flex flex-col gap-1.5">
            {orders.slice(0, 3).map(o => {
              const st  = STATUS_MAP[o.status]          || { label: o.status,         color: '#94a3b8' }
              const pay = PAYMENT_MAP[o.payment_status]  || { label: o.payment_status, color: '#94a3b8' }
              return (
                <button key={o.id} onClick={() => setSelOrder(o)}
                        className="w-full text-left bg-white/[0.04] border border-white/10 rounded-xl p-3
                                   hover:border-accent/30 hover:bg-white/[0.07] transition-all cursor-pointer">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="text-primary text-[12px] font-semibold">
                      #{o.invoice_number || String(o.id).slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: st.color }}>{st.label}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-[11px]">{o.items_count} produs(e)</span>
                    <span className="text-accent font-bold text-[13px] font-mono">{o.total_price} RON</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-muted text-[11px]">
                      {new Date(o.created_at).toLocaleDateString('ro-RO')}
                    </span>
                    <span className="text-[11px] font-semibold" style={{ color: pay.color }}>{pay.label}</span>
                  </div>
                </button>
              )
            })}
            {orders.length > 3 && (
              <button onClick={() => navigate('/orders')}
                      className="text-center text-accent text-[12px] cursor-pointer hover:underline py-1">
                Vezi toate comenzile ({orders.length}) →
              </button>
            )}
          </div>
        )}
      </>
    )
  }

  const renderComandaDetail = (order) => {
    const st  = STATUS_MAP[order.status]          || { label: order.status,         color: '#94a3b8' }
    const pay = PAYMENT_MAP[order.payment_status]  || { label: order.payment_status, color: '#94a3b8' }
    const oid = `#${(order.invoice_number || String(order.id).slice(0, 8)).toUpperCase()}`

    if (probStep === 'type') return (
      <>
        <BotMsg>Ce s-a întâmplat cu comanda <strong>{oid}</strong>?</BotMsg>
        <div className="flex flex-col gap-1.5">
          <OptionBtn Icon={ArrowCounterClockwise} color="#fb923c"
            label="Produs defect / nu corespunde" sub="Inițiază un retur"
            onClick={() => setProbStep('retur')} />
          <OptionBtn Icon={Wrench} color="#c084fc"
            label="Defecțiune tehnică" sub="Trimite la service"
            onClick={() => setProbStep('service')} />
          <OptionBtn Icon={Warning} color="#f59e0b"
            label="Nu am primit comanda / altă problemă" sub="Contactează suportul"
            onClick={() => setProbStep('contact')} />
        </div>
      </>
    )

    if (probStep === 'retur') return (
      <>
        <BotMsg>
          Poți iniția un <strong>retur</strong> în termen de <strong>30 de zile</strong> de la livrare.
        </BotMsg>
        <InfoSteps steps={[
          { n: '1', text: 'Mergi la secțiunea Retururi' },
          { n: '2', text: 'Selectează comanda și produsul' },
          { n: '3', text: 'Descrie motivul returului' },
          { n: '4', text: 'Aștepți confirmare în 1–2 zile lucrătoare' },
        ]} />
        <div className="flex gap-2">
          <button onClick={() => goTo('retururi')}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-base text-[13px] font-bold
                             cursor-pointer hover:shadow-glow-cyan transition-all">
            Mergi la Retururi →
          </button>
          <BtnSecondary onClick={() => setProbStep(null)}>Înapoi</BtnSecondary>
        </div>
      </>
    )

    if (probStep === 'service') return (
      <>
        <BotMsg>
          Pentru o <strong>defecțiune tehnică</strong>, deschide o cerere de service.
          Produsele în garanție sunt reparate gratuit.
        </BotMsg>
        <InfoSteps steps={[
          { n: '1', text: 'Mergi la secțiunea Service din profil' },
          { n: '2', text: 'Completează formularul cu descrierea problemei' },
          { n: '3', text: 'Ești contactat pentru programarea ridicării' },
          { n: '4', text: 'Urmărești statusul prin numărul de ticket' },
        ]} />
        <div className="flex gap-2">
          <button onClick={() => navigate('/profile?tab=service')}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-base text-[13px] font-bold
                             cursor-pointer hover:shadow-glow-cyan transition-all">
            Deschide cerere service →
          </button>
          <BtnSecondary onClick={() => setProbStep(null)}>Înapoi</BtnSecondary>
        </div>
      </>
    )

    if (probStep === 'contact') return (
      <>
        <BotMsg>Contactează echipa noastră — disponibili <strong>Luni–Vineri, 09:00–18:00</strong>.</BotMsg>
        <ContactCard />
        <BtnSecondary onClick={() => setProbStep(null)}>← Înapoi</BtnSecondary>
      </>
    )

    return (
      <>
        <BotMsg>
          Comanda <strong>{oid}</strong> din{' '}
          {new Date(order.created_at).toLocaleDateString('ro-RO')} — total{' '}
          <strong>{order.total_price} RON</strong>.
        </BotMsg>

        <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted">Status</span>
            <span className="font-bold" style={{ color: st.color }}>{st.label}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-muted">Plată</span>
            <span className="font-bold" style={{ color: pay.color }}>{pay.label}</span>
          </div>
          {order.tracking_number && (
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">AWB</span>
              <span className="text-primary font-mono text-[12px]">{order.tracking_number}</span>
            </div>
          )}
        </div>

        {(order.items || []).length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-muted text-[10px] uppercase tracking-wide font-bold mb-1">Produse</div>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-[12px] py-1
                                       border-b border-white/5 last:border-0">
                <span className="text-primary truncate flex-1 mr-2">{item.product_name}</span>
                <span className="text-muted shrink-0">×{item.quantity}</span>
                <span className="text-accent font-mono ml-3 shrink-0">{item.unit_price} RON</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setProbStep('type')}
                className="w-full py-2.5 rounded-xl border border-danger/30 text-danger text-[13px]
                           font-semibold cursor-pointer hover:bg-danger/[0.08] transition-all">
          Am o problemă cu această comandă
        </button>

        <NavLinks links={[
          { label: 'Retururi →',  onClick: () => goTo('retururi') },
          { label: 'Service →',   onClick: () => goTo('service')  },
          { label: 'Garanții →',  onClick: () => goTo('garantii') },
        ]} />
      </>
    )
  }

  // ── RETURURI ─────────────────────────────────────────────

  const renderRetururi = () => {
    const raw = cache['retururi']
    const isLoading = raw === 'loading' || raw === undefined
    const isError   = raw === 'error'
    const retururi  = Array.isArray(raw) ? raw : null

    if (retInfo) return (
      <>
        <BotMsg>Iată ce trebuie să știi înainte de a iniția un retur:</BotMsg>
        <InfoSteps steps={[
          { n: '1', text: 'Completezi formularul cu comanda și motivul returului' },
          { n: '2', text: 'Cererea este analizată în 1–2 zile lucrătoare' },
          { n: '3', text: 'Ești contactat pentru ridicarea coletului' },
          { n: '4', text: 'Rambursarea se procesează în 5–7 zile după primire' },
        ]} />
        <CheckList title="Condiții retur" items={[
          'Produs în termen de 30 de zile de la livrare',
          'Ambalaj original intact (dacă este posibil)',
          'Toate accesoriile și documentele incluse',
          'Produsul să nu prezinte deteriorări fizice',
        ]} />
        <BtnPrimary onClick={() => navigate('/profile?tab=returns')}>
          Inițiază retur →
        </BtnPrimary>
        <BtnSecondary onClick={() => setRetInfo(false)}>← Înapoi</BtnSecondary>
      </>
    )

    return (
      <>
        <BotMsg>
          <strong>Retururile</strong> se pot iniția în <strong>30 de zile</strong> de la livrare.
        </BotMsg>
        {!isAuthenticated ? <NotAuth /> : isLoading ? <Spinner /> : isError ? (
          <ErrorBlock onRetry={() => retry('retururi', () => retururiAPI.get(user.id))} />
        ) : (
          <>
            {retururi?.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <div className="text-muted text-[11px] font-bold uppercase tracking-wide">Retururile tale</div>
                {retururi.slice(0, 3).map(r => (
                  <div key={r.id} className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-primary text-[12px] font-semibold truncate flex-1">{r.product_name}</span>
                      <span className="text-[11px] font-bold ml-2" style={{
                        color: r.status === 'approved' || r.status === 'completed' ? '#00e5a0'
                             : r.status === 'rejected' ? '#f87171' : '#f59e0b'
                      }}>
                        {RETUR_STATUS[r.status] || r.status}
                      </span>
                    </div>
                    <div className="text-muted text-[11px]">{new Date(r.created_at).toLocaleDateString('ro-RO')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <BotMsg>Nu ai niciun retur în curs momentan.</BotMsg>
            )}
            <BtnPrimary onClick={() => setRetInfo(true)}>Inițiază retur nou →</BtnPrimary>
            <NavLinks links={[
              { label: 'Comenzile mele →', onClick: () => goTo('comenzi') },
              { label: 'Service →',        onClick: () => goTo('service') },
            ]} />
          </>
        )}
      </>
    )
  }

  // ── SERVICE ──────────────────────────────────────────────

  const renderService = () => {
    const raw = cache['service']
    const isLoading = raw === 'loading' || raw === undefined
    const isError   = raw === 'error'
    const tickets   = Array.isArray(raw) ? raw : null

    if (svcInfo) return (
      <>
        <BotMsg>Iată ce trebuie să știi înainte de a deschide o cerere de service:</BotMsg>
        <InfoSteps steps={[
          { n: '1', text: 'Completezi formularul cu datele produsului și descrierea problemei' },
          { n: '2', text: 'Cererea este analizată în 1–2 zile lucrătoare' },
          { n: '3', text: 'Ești contactat pentru programarea ridicării produsului' },
          { n: '4', text: 'Primești număr de ticket pentru urmărirea statusului' },
        ]} />
        <CheckList title="Ce să pregătești" items={[
          'Numărul comenzii din care face parte produsul',
          'Descrierea clară a defecțiunii sau problemei',
          'Număr de telefon la care poți fi contactat',
          'Produsul în ambalaj original (dacă este posibil)',
        ]} />
        <BotMsg>
          Durata: <strong>7–14 zile lucrătoare</strong>. Produsele în garanție — reparație <strong>gratuită</strong>.
        </BotMsg>
        <BtnPrimary onClick={() => navigate('/profile?tab=service')}>
          Deschide cerere service →
        </BtnPrimary>
        <BtnSecondary onClick={() => setSvcInfo(false)}>← Înapoi</BtnSecondary>
      </>
    )

    return (
      <>
        <BotMsg>
          <strong>Service-ul</strong> este disponibil pentru produse defecte sau cu probleme tehnice.
        </BotMsg>
        {!isAuthenticated ? <NotAuth /> : isLoading ? <Spinner /> : isError ? (
          <ErrorBlock onRetry={() => retry('service', () => serviceAPI.get(user.id))} />
        ) : (
          <>
            {tickets?.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <div className="text-muted text-[11px] font-bold uppercase tracking-wide">Tichetele tale</div>
                {tickets.slice(0, 3).map(t => (
                  <div key={t.id} className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-primary text-[12px] font-semibold truncate flex-1">{t.product_name}</span>
                      <span className="text-[11px] font-bold ml-2" style={{
                        color: t.status === 'completed' ? '#00e5a0'
                             : t.status === 'in_service' ? '#38bdf8'
                             : t.status === 'rejected'   ? '#f87171' : '#f59e0b'
                      }}>
                        {SERVICE_STATUS[t.status] || t.status}
                      </span>
                    </div>
                    {t.nr_ticket && <div className="text-muted text-[11px]">Ticket #{t.nr_ticket}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <BotMsg>Nu ai niciun tichet de service activ.</BotMsg>
            )}
            <BtnPrimary onClick={() => setSvcInfo(true)}>Deschide cerere service nouă →</BtnPrimary>
            <BotMsg>Ai o problemă urgentă? Contactează-ne direct:</BotMsg>
            <ContactCard />
            <NavLinks links={[
              { label: 'Retururi →',       onClick: () => goTo('retururi') },
              { label: 'Garanții →',       onClick: () => goTo('garantii') },
              { label: 'Comenzile mele →', onClick: () => goTo('comenzi')  },
            ]} />
          </>
        )}
      </>
    )
  }

  // ── GARANTII ─────────────────────────────────────────────

  const renderGarantii = () => {
    const raw = cache['orders']
    const isLoading = raw === 'loading' || raw === undefined
    const isError   = raw === 'error'
    const orders    = Array.isArray(raw) ? raw : null

    const delivered = orders?.filter(o => o.status === 'delivered') ?? []
    const items = delivered
      .flatMap(o => (o.items || []).map(item => ({ ...item, order_date: o.created_at })))
      .slice(0, 5)

    return (
      <>
        <BotMsg>
          <strong>Garanțiile</strong> sunt valabile de la data livrării — <strong>24 luni</strong> pentru produse electronice.
        </BotMsg>
        {!isAuthenticated ? <NotAuth /> : isLoading ? <Spinner /> : isError ? (
          <ErrorBlock onRetry={() => retry('orders', () => ordersAPI.getUserOrders(user.id))} />
        ) : !orders?.length ? (
          <BotMsg>Garanțiile apar după prima livrare.</BotMsg>
        ) : !delivered.length ? (
          <BotMsg>Garanțiile devin active după livrarea comenzii.</BotMsg>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              {items.map((item, i) => {
                const expiry = new Date(item.order_date)
                expiry.setMonth(expiry.getMonth() + (item.warranty_months || 24))
                const isValid = expiry > new Date()
                return (
                  <div key={i} className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                    <div className="text-primary text-[12px] font-semibold truncate mb-1">{item.product_name}</div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted">Garanție</span>
                      <span className="font-bold" style={{ color: isValid ? '#00e5a0' : '#f87171' }}>
                        {isValid ? `Validă până ${expiry.toLocaleDateString('ro-RO')}` : 'Expirată'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <BotMsg>Ai o problemă cu un produs în garanție? Reparația este gratuită.</BotMsg>
            <BtnPrimary onClick={() => navigate('/profile?tab=service')}>
              Deschide cerere service →
            </BtnPrimary>
            <NavLinks links={[
              { label: 'Comenzile mele →', onClick: () => goTo('comenzi') },
            ]} />
          </>
        )}
      </>
    )
  }

  // ── FAVORITE ─────────────────────────────────────────────

  const renderFavorite = () => {
    const raw = cache['wishlist']
    const isLoading = raw === 'loading' || raw === undefined
    const isError   = raw === 'error'
    const wishlist  = Array.isArray(raw) ? raw : null

    return (
      <>
        <BotMsg><strong>Produsele tale favorite</strong> — salvate în wishlist pentru mai târziu.</BotMsg>
        {!isAuthenticated ? <NotAuth /> : isLoading ? <Spinner /> : isError ? (
          <ErrorBlock onRetry={() => retry('wishlist', () => wishlistAPI.get(user.id))} />
        ) : !wishlist?.length ? (
          <BotMsg>Nu ai niciun produs salvat la favorite. Apasă ❤️ pe pagina produsului.</BotMsg>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              {wishlist.slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-xl p-2.5">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name}
                           className="w-9 h-9 object-contain rounded-lg bg-white/5 shrink-0" />
                    : <div className="w-9 h-9 rounded-lg bg-white/5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-primary text-[12px] font-semibold truncate">{item.name || item.product_name}</div>
                    {item.price && <div className="text-accent text-[12px] font-mono">{item.price} RON</div>}
                  </div>
                </div>
              ))}
            </div>
            <BtnPrimary onClick={() => navigate('/wishlist')}>
              Vezi toate favoritele →
            </BtnPrimary>
          </>
        )}
      </>
    )
  }

  // ── VOUCHERE ─────────────────────────────────────────────

  const renderVouchere = () => {
    const raw = cache['vouchere']
    const isLoading = raw === 'loading' || raw === undefined
    const isError   = raw === 'error'
    const vouchers  = Array.isArray(raw) ? raw : null
    const active    = vouchers?.filter(v => v.is_active) ?? []

    return (
      <>
        <BotMsg><strong>Voucherele tale active</strong> — folosește-le la checkout pentru reduceri.</BotMsg>
        {!isAuthenticated ? <NotAuth /> : isLoading ? <Spinner /> : isError ? (
          <ErrorBlock onRetry={() => retry('vouchere', () => vouchersAPI.getMy(user.id))} />
        ) : !active.length ? (
          <BotMsg>Nu ai niciun voucher activ momentan. Urmărește promoțiile noastre! 🎁</BotMsg>
        ) : (
          <div className="flex flex-col gap-1.5">
            {active.map(v => (
              <div key={v.id} className="bg-white/[0.04] border border-amber-500/20 rounded-xl p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-amber-400 text-[14px]">{v.code}</span>
                  <span className="text-success font-bold text-[13px]">
                    {v.type === 'percent' ? `-${v.value}%` : `-${v.value} RON`}
                  </span>
                </div>
                {v.description && <div className="text-muted text-[11px]">{v.description}</div>}
                {v.expires_at && (
                  <div className="text-muted text-[11px] mt-1">
                    Expiră: {new Date(v.expires_at).toLocaleDateString('ro-RO')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  // ── PROFIL ───────────────────────────────────────────────

  const renderProfil = () => {
    const raw = cache['addresses']
    const isLoading = raw === 'loading' || raw === undefined
    const addresses = Array.isArray(raw) ? raw : null

    return (
      <>
        <BotMsg><strong>Profilul tău</strong> — date personale și adrese de livrare.</BotMsg>
        {!isAuthenticated ? <NotAuth /> : (
          <>
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex flex-col gap-1.5">
              <div className="text-muted text-[10px] uppercase tracking-wide font-bold mb-1">Date cont</div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted">Nume</span>
                <span className="text-primary font-semibold">{user?.name || '—'}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted">Email</span>
                <span className="text-primary truncate ml-4">{user?.email || '—'}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted">Telefon</span>
                <span className="text-primary">{user?.phone || 'Necompletat'}</span>
              </div>
            </div>

            {isLoading ? <Spinner /> : addresses?.length > 0 ? (
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                <div className="text-muted text-[10px] uppercase tracking-wide font-bold mb-2">Adresă implicită</div>
                {(() => {
                  const a = addresses.find(x => x.is_default) || addresses[0]
                  return (
                    <div className="text-[13px] text-primary leading-relaxed">
                      {a.full_name}<br />{a.street}, {a.city}, {a.county}
                      {a.postal_code && <><br /><span className="text-muted">{a.postal_code}</span></>}
                    </div>
                  )
                })()}
              </div>
            ) : (
              <BotMsg>Nu ai nicio adresă salvată.</BotMsg>
            )}

            <BtnPrimary onClick={() => navigate('/profile')}>
              Mergi la Profilul meu →
            </BtnPrimary>
          </>
        )}
      </>
    )
  }

  // ── ROUTING ───────────────────────────────────────────────

  const renderScreen = () => {
    if (selOrder) return renderComandaDetail(selOrder)
    switch (screen) {
      case 'cautare':  return renderCautare()
      case 'comenzi':  return renderComenzi()
      case 'retururi': return renderRetururi()
      case 'service':  return renderService()
      case 'garantii': return renderGarantii()
      case 'favorite': return renderFavorite()
      case 'vouchere': return renderVouchere()
      case 'profil':   return renderProfil()
      default:         return renderHome()
    }
  }

  const activeMenu  = MENU.find(m => m.id === screen)
  const headerTitle = selOrder
    ? `Comandă #${(selOrder.invoice_number || String(selOrder.id).slice(0, 8)).toUpperCase()}`
    : svcInfo ? 'Cerere service'
    : retInfo ? 'Inițiază retur'
    : screen === 'home' ? 'Asistent virtual'
    : activeMenu?.label || 'Asistent'
  const headerColor = selOrder ? '#a78bfa' : activeMenu?.color || 'var(--cyan)'
  const showBack    = screen !== 'home' || !!selOrder || svcInfo || retInfo

  const handleBack = () => {
    if (svcInfo)         { setSvcInfo(false); return }
    if (retInfo)         { setRetInfo(false); return }
    if (probStep)        { setProbStep(null); return }
    if (selOrder)        { setSelOrder(null); return }
    goHome()
  }

  // ── RENDER ────────────────────────────────────────────────

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {open && (
        <div className="absolute bottom-[76px] right-0 w-[360px] max-h-[600px]
                        bg-base/98 rounded-2xl border border-accent/15 flex flex-col overflow-hidden
                        backdrop-blur-xl shadow-elevated animate-fade-in">

          {/* Header */}
          <div className="bg-gradient-to-r from-base-1 to-base-2 px-4 py-3
                          border-b border-accent/20 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                   style={{ background: `${headerColor}18`, border: `1px solid ${headerColor}35` }}>
                <Robot size={16} weight="duotone" style={{ color: headerColor }} />
              </div>
              <div>
                <div className="text-primary font-semibold text-[13px]">{headerTitle}</div>
                <div className="text-[11px] flex items-center gap-1" style={{ color: headerColor }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#00e5a0' }} />
                  {screen === 'home' ? 'Cu ce vă pot ajuta?' : 'Asistent virtual'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {showBack && (
                <button onClick={handleBack}
                        className="w-7 h-7 rounded-full bg-white/10 border-none text-secondary
                                   flex items-center justify-center cursor-pointer
                                   hover:bg-white/20 hover:text-primary transition-all"
                        title="Înapoi">
                  <ArrowLeft size={11} weight="bold" />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                      className="w-7 h-7 rounded-full bg-white/10 border-none text-secondary
                                 flex items-center justify-center cursor-pointer
                                 hover:bg-white/20 hover:text-primary transition-all">
                <X size={13} weight="bold" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {renderScreen()}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-14 h-14 rounded-full cursor-pointer flex items-center justify-center
                   transition-all duration-300 hover:scale-110
                   ${open
                     ? 'bg-white/10 border border-white/10 text-secondary'
                     : 'bg-accent text-base border-none shadow-glow-cyan animate-glow-pulse'
                   }`}
      >
        {open ? <X size={20} weight="bold" /> : <ChatCircleDots size={26} weight="duotone" />}
      </button>
    </div>
  )
}
