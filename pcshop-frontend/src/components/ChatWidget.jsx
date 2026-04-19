import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChatCircleDots, X, Robot, ArrowLeft, User, Package,
  Tag, Heart, ShieldCheck, ArrowCounterClockwise, Wrench,
  Phone, CircleNotch, Warning, CaretRight, MagnifyingGlass,
  Cpu, HardDrive, Monitor, Keyboard, Mouse, Headphones,
  Lightning, Wind, Memory,
} from '@phosphor-icons/react'
import {
  ordersAPI, profileAPI, wishlistAPI,
  retururiAPI, serviceAPI, vouchersAPI, productsAPI, chatAPI,
} from '../services/api'
import useAuthStore from '../store/authStore'
import { detectSlug } from '../utils/categorySearch'

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
    <div className="flex items-start gap-1.5">
      <div className="w-5 h-5 rounded-full bg-accent-dim border border-accent-border
                      flex items-center justify-center shrink-0 mt-0.5">
        <Robot size={11} weight="duotone" className="text-accent" />
      </div>
      <div className="bg-accent-dim border border-accent-border rounded-xl rounded-tl-sm
                      px-2.5 py-1.5 text-[12px] text-primary leading-relaxed flex-1">
        {children}
      </div>
    </div>
  )
}

function OptionBtn({ Icon, label, color, onClick, sub }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl
                 bg-white/[0.04] border border-white/10 cursor-pointer text-left
                 hover:border-white/20 hover:bg-white/[0.07] transition-all duration-150 group">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
           style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
        <Icon size={12} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-primary text-[12px] font-semibold">{label}</div>
        {sub && <div className="text-muted text-[10px]">{sub}</div>}
      </div>
      <CaretRight size={11} className="text-muted group-hover:text-primary transition-colors shrink-0" />
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
            className="w-full py-2 rounded-xl bg-accent text-base text-[12px] font-bold
                       cursor-pointer hover:shadow-glow-cyan transition-all">
      {children}
    </button>
  )
}

function BtnSecondary({ onClick, children }) {
  return (
    <button onClick={onClick}
            className="w-full py-1.5 rounded-xl bg-white/5 border border-white/10
                       text-secondary text-[12px] cursor-pointer hover:text-primary transition-all">
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
  const [searchMode, setSearchMode]       = useState(null)   // null | 'ai' | 'manual'
  const [aiInput, setAiInput]             = useState('')
  const [aiQuick, setAiQuick]             = useState('')
  const [aiMessages, setAiMessages]       = useState([])
  const [aiBusy, setAiBusy]               = useState(false)
  const [aiPhase, setAiPhase]             = useState('cat')   // 'cat' | 'followup'
  const [aiDetected, setAiDetected]       = useState(null)   // {slug, catName, filters}
  const [aiOffline, setAiOffline]         = useState(false)
  const [manualCat, setManualCat]           = useState(null)
  const [manualSearch, setManualSearch]     = useState('')
  const [manualFilters, setManualFilters]   = useState({})
  const [manualResults, setManualResults]   = useState(null)
  const [expandedFilter, setExpandedFilter] = useState(null)
  const bodyRef    = useRef(null)
  const msgsRef    = useRef(null)

  useEffect(() => {
    if (bodyRef.current)
      setTimeout(() => bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }, [screen, selOrder, probStep, svcInfo, retInfo, searchMode, manualCat])

  useEffect(() => {
    if (msgsRef.current)
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [aiMessages])

  // builds hint text from available filter keys
  const buildHints = (filters) => {
    const parts = []
    if (filters.brand?.length)
      parts.push(`brand (${filters.brand.slice(0, 3).join(', ')})`)
    Object.entries(filters)
      .filter(([k]) => k !== 'brand')
      .slice(0, 2)
      .forEach(([k, vals]) =>
        parts.push(`${k.replace(/_/g, ' ')} (${vals.slice(0, 3).join(', ')})`)
      )
    return parts
  }

  // Phase 1: user picks a category → load filters → ask follow-up
  const pickAiCategory = async (slug, catName) => {
    if (aiBusy) return
    setAiBusy(true)
    setAiMessages([])
    try {
      const filRes = await chatAPI.filters(slug)
      const avail  = filRes.data || {}
      const hints  = buildHints(avail)
      setAiDetected({ slug, catName, filters: avail })
      setAiPhase('followup')
      setAiMessages([{ id: Date.now(), role: 'bot', type: 'followup', catName, hints }])
    } catch {
      setAiMessages([{ id: Date.now(), role: 'bot', type: 'error' }])
    } finally {
      setAiBusy(false)
    }
  }

  // Phase 2: receive preferences, extract filters, search
  const runFollowup = async (q) => {
    if (!aiDetected || aiBusy) return
    const query = q.trim()
    const { slug, catName } = aiDetected
    setAiBusy(true)
    setAiInput('')
    const ts = Date.now()
    setAiMessages(prev => [...prev,
      { id: ts,     role: 'user', content: query || 'Orice' },
      { id: ts + 1, role: 'bot',  type: 'searching' },
    ])
    try {
      const SKIP = ['nu conteaza', 'nu contează', 'orice', 'toate', 'nu stiu', 'nu știu', 'oricare', 'fara', 'fără']
      const skip = !query || SKIP.some(w => query.toLowerCase().includes(w))
      let filters = {}, max_price, min_price
      if (!skip) {
        const ext = await chatAPI.extractFilters(`${catName} ${query}`)
        filters   = ext.data?.filters   || {}
        max_price = ext.data?.max_price  ?? undefined
        min_price = ext.data?.min_price  ?? undefined
      }
      const res = await chatAPI.search({ category_slug: slug, filters, max_price, min_price, limit: 6 })
      const results = Array.isArray(res.data) ? res.data : (res.data?.products ?? [])
      if (!results.length && Object.keys(filters).length > 0) {
        setAiMessages(prev => [...prev.slice(0, -1),
          { id: ts + 2, role: 'bot', type: 'empty_retry', slug, catName },
        ])
      } else if (results.length) {
        setAiMessages(prev => [...prev.slice(0, -1),
          { id: ts + 2, role: 'bot', type: 'results', results, extracted: { category_slug: slug, filters } },
        ])
      } else {
        setAiMessages(prev => [...prev.slice(0, -1),
          { id: ts + 2, role: 'bot', type: 'empty', query: catName, slug, catName },
        ])
      }
    } catch {
      setAiMessages(prev => [...prev.slice(0, -1), { id: ts + 2, role: 'bot', type: 'error' }])
    } finally {
      setAiBusy(false)
    }
  }

  // Search all products in a category (no filters) — used by empty_retry button
  const searchAllInCategory = async (slug, catName) => {
    if (aiBusy) return
    setAiBusy(true)
    const ts = Date.now()
    setAiMessages(prev => [...prev, { id: ts, role: 'bot', type: 'searching' }])
    try {
      const res = await chatAPI.search({ category_slug: slug, filters: {}, limit: 6 })
      const results = Array.isArray(res.data) ? res.data : []
      if (results.length) {
        setAiMessages(prev => [...prev.slice(0, -1),
          { id: ts + 1, role: 'bot', type: 'results', results, extracted: { category_slug: slug, filters: {} } },
        ])
      } else {
        setAiMessages(prev => [...prev.slice(0, -1),
          { id: ts + 1, role: 'bot', type: 'empty', query: catName },
        ])
      }
    } catch {
      setAiMessages(prev => [...prev.slice(0, -1), { id: ts + 1, role: 'bot', type: 'error' }])
    } finally {
      setAiBusy(false)
    }
  }

  // Quick search: user types full query → auto-detect category + price → show results
  const runQuickSearch = async (q) => {
    const query = q.trim()
    if (!query || aiBusy) return
    setAiBusy(true)
    setAiQuick('')
    setAiPhase('followup')
    const ts = Date.now()
    setAiMessages([
      { id: ts,     role: 'user',    content: query },
      { id: ts + 1, role: 'bot',     type: 'searching' },
    ])
    try {
      const ext       = await chatAPI.extractFilters(query)
      const slug      = ext.data?.category_slug
      const filters   = ext.data?.filters   || {}
      const max_price = ext.data?.max_price  ?? undefined
      const min_price = ext.data?.min_price  ?? undefined

      if (!slug) {
        setAiMessages(prev => [...prev.slice(0, -1),
          { id: ts + 2, role: 'bot', type: 'no_cat' },
        ])
        setAiPhase('cat')
        return
      }

      const cats    = cache['cats']
      const catName = Array.isArray(cats) ? (cats.find(c => c.slug === slug)?.name || slug) : slug
      setAiDetected({ slug, catName, filters: {} })
      load(`filters_${slug}`, () => chatAPI.filters(slug))

      const res     = await chatAPI.search({ category_slug: slug, filters, max_price, min_price, limit: 6 })
      const results = Array.isArray(res.data) ? res.data : []

      if (results.length) {
        setAiMessages(prev => [...prev.slice(0, -1),
          { id: ts + 2, role: 'bot', type: 'results', results, extracted: { category_slug: slug, filters } },
        ])
      } else if (Object.keys(filters).length > 0 || max_price || min_price) {
        setAiMessages(prev => [...prev.slice(0, -1),
          { id: ts + 2, role: 'bot', type: 'empty_retry', slug, catName },
        ])
      } else {
        setAiMessages(prev => [...prev.slice(0, -1),
          { id: ts + 2, role: 'bot', type: 'empty', query: catName, slug, catName },
        ])
      }
    } catch {
      setAiMessages(prev => [...prev.slice(0, -1),
        { id: ts + 2, role: 'bot', type: 'error' },
      ])
      setAiPhase('cat')
    } finally {
      setAiBusy(false)
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
    if (s !== 'cautare') {
      setAiInput(''); setAiMessages([]); setAiBusy(false); setAiPhase('cat'); setAiDetected(null)
      setSearchMode(null); setManualCat(null); setManualSearch(''); setManualFilters({}); setManualResults(null); setExpandedFilter(null)
    }
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
    setAiInput(''); setAiMessages([]); setAiBusy(false); setAiPhase('cat'); setAiDetected(null)
    setSearchMode(null); setManualCat(null); setManualSearch(''); setManualFilters({}); setManualResults(null); setExpandedFilter(null)
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
    // shared product card renderer (render fn, not component)
    const renderProductCard = (p) => {
      const hasDiscount = p.discount_percent > 0
      const img = p.image_url || p.image || p.images?.[0]?.url
      const finalPrice = hasDiscount
        ? (p.price * (1 - p.discount_percent / 100)).toFixed(0)
        : p.price
      return (
        <button key={p.id} onClick={() => navigate(`/product/${p.id}`)}
                className="w-full flex items-center gap-2 bg-white/[0.04] border border-white/10
                           rounded-xl p-2 cursor-pointer text-left
                           hover:border-accent/30 hover:bg-white/[0.07] transition-all group">
          {img
            ? <img src={img} alt={p.name} className="w-8 h-8 object-contain rounded-lg bg-white/5 shrink-0" />
            : <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0 flex items-center justify-center">
                <Package size={13} className="text-muted/40" />
              </div>
          }
          <div className="flex-1 min-w-0">
            <div className="text-primary text-[11px] font-semibold truncate leading-snug">{p.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-accent font-mono font-bold text-[11px]">{finalPrice} RON</span>
              {hasDiscount && <span className="text-muted text-[10px] line-through">{p.price} RON</span>}
              {hasDiscount && <span className="text-[10px] font-bold text-success">-{p.discount_percent}%</span>}
            </div>
          </div>
          <CaretRight size={11} className="text-muted group-hover:text-primary transition-colors shrink-0" />
        </button>
      )
    }

    // ── Mode selection ──────────────────────────────────────────
    if (!searchMode) return (
      <>
        <BotMsg>Cum preferi să cauți produsul?</BotMsg>
        <OptionBtn Icon={Robot} label="Căutare AI" color="#38bdf8"
          sub="Descrie ce vrei în cuvinte proprii"
          onClick={() => {
            setSearchMode('ai')
            load('cats', () => chatAPI.categories())
            chatAPI.aiStatus().then(r => setAiOffline(!r.data?.available)).catch(() => setAiOffline(true))
          }} />
        <OptionBtn Icon={MagnifyingGlass} label="Căutare manuală cu filtre" color="#a78bfa"
          sub="Alege categoria și filtrele dorite"
          onClick={() => { setSearchMode('manual'); load('cats', () => chatAPI.categories()) }} />
      </>
    )

    // ── AI search (category pick → natural language → Ollama) ──
    if (searchMode === 'ai') {
      const CAT_META = {
        cpu:         { Icon: Cpu,           color: '#38bdf8' },
        gpu:         { Icon: Monitor,       color: '#a78bfa' },
        ram:         { Icon: Memory,  color: '#00e5a0' },
        motherboard: { Icon: Memory,  color: '#fb923c' },
        storage:     { Icon: HardDrive,     color: '#f59e0b' },
        psu:         { Icon: Lightning,     color: '#f87171' },
        case:        { Icon: Package,       color: '#94a3b8' },
        cooler:      { Icon: Wind,          color: '#38bdf8' },
        monitor:     { Icon: Monitor,       color: '#00e5a0' },
        mouse:       { Icon: Mouse,         color: '#a78bfa' },
        keyboard:    { Icon: Keyboard,      color: '#fb923c' },
        headset:     { Icon: Headphones,    color: '#f59e0b' },
      }

      const renderMsg = (msg) => {
        if (msg.role === 'user') return (
          <div key={msg.id} className="flex justify-end">
            <div className="max-w-[78%] px-3 py-2 rounded-2xl rounded-tr-sm
                            bg-accent/20 border border-accent/30 text-primary text-[13px] leading-relaxed">
              {msg.content}
            </div>
          </div>
        )
        if (msg.type === 'searching') return (
          <div key={msg.id} className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-accent-dim border border-accent-border
                            flex items-center justify-center shrink-0 mt-0.5">
              <Robot size={13} weight="duotone" className="text-accent" />
            </div>
            <div className="bg-accent-dim border border-accent-border rounded-xl rounded-tl-sm
                            px-3 py-2 flex items-center gap-2">
              <CircleNotch size={13} className="animate-spin text-accent shrink-0" />
              <span className="text-muted text-[13px]">Caut produse...</span>
            </div>
          </div>
        )
        if (msg.type === 'followup') return (
          <div key={msg.id} className="flex flex-col gap-2">
            <BotMsg>
              Ai ales <strong>{msg.catName}</strong>. Ce preferințe ai?
            </BotMsg>
            {msg.hints.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pl-8">
                {msg.hints.map((h, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/15
                                           text-secondary text-[11px]">{h}</span>
                ))}
                <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10
                                 text-muted text-[11px] italic">sau „orice"</span>
              </div>
            )}
          </div>
        )
        if (msg.type === 'results') return (
          <div key={msg.id} className="flex flex-col gap-1.5">
            <BotMsg>
              {msg.results.length} produs{msg.results.length !== 1 ? 'e' : ''} găsite
              {Object.keys(msg.extracted?.filters || {}).length > 0 && (
                <span className="text-muted text-[12px]"> · {
                  Object.entries(msg.extracted.filters)
                    .map(([k, v]) => `${k.replace(/_/g, ' ')} ${v}`)
                    .join(', ')
                }</span>
              )}:
            </BotMsg>
            <div className="flex flex-col gap-1.5">{msg.results.map(p => renderProductCard(p))}</div>
          </div>
        )
        if (msg.type === 'new_search') return null
        if (msg.type === 'empty') return (
          <div key={msg.id} className="flex flex-col gap-2">
            <BotMsg>
              Nu am găsit niciun produs conform cerințelor tale pentru <strong>{msg.catName || msg.query}</strong>.
              Încearcă să modifici preferințele sau descrie altfel ce cauți.
            </BotMsg>
            <BtnSecondary onClick={() => {
              if (aiDetected) {
                const hints = buildHints(aiDetected.filters)
                setAiMessages(prev => [...prev,
                  { id: Date.now(), role: 'bot', type: 'followup', catName: aiDetected.catName, hints }
                ])
              }
            }}>← Modifică preferințele</BtnSecondary>
          </div>
        )
        if (msg.type === 'empty_retry') return (
          <div key={msg.id} className="flex flex-col gap-2">
            <BotMsg>
              Nu am identificat produse cu specificațiile exacte solicitate în categoria{' '}
              <strong>{msg.catName}</strong>. Dorești să vizualizezi toate produsele disponibile din această categorie?
            </BotMsg>
            <BtnSecondary onClick={() => searchAllInCategory(msg.slug, msg.catName)}>
              Arată toate produsele din {msg.catName} →
            </BtnSecondary>
          </div>
        )
        if (msg.type === 'no_cat') return (
          <BotMsg key={msg.id}>
            Nu am înțeles categoria produsului. Încearcă să fii mai specific, de ex:{' '}
            <em>"procesor Intel sub 500 lei"</em> sau <em>"placa video RTX 4060"</em>.
          </BotMsg>
        )
        if (msg.type === 'error') return (
          <BotMsg key={msg.id}>A apărut o eroare. Încearcă din nou.</BotMsg>
        )
        return null
      }

      // ── Phase: category picker ──────────────────────────────
      if (aiPhase === 'cat') {
        const cats = cache['cats']
        const loading = cats === 'loading' || cats === undefined
        const catsList = Array.isArray(cats) ? cats : []
        return (
          <div className="flex flex-col gap-3">
            {aiOffline && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/25
                              rounded-xl px-3 py-2.5">
                <Warning size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="text-amber-300 text-[11px] leading-relaxed">
                  Asistentul AI nu este disponibil momentan. Căutarea manuală cu filtre funcționează normal.
                </span>
              </div>
            )}
            <BotMsg>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[13px]">Bună! Sunt asistentul virtual.</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40
                                   text-amber-400 text-[10px] font-bold shrink-0">BETA</span>
                </div>
                <span className="text-[13px]">Descrie ce cauți sau alege o categorie:</span>
              </div>
            </BotMsg>

            {/* Quick search input */}
            <form onSubmit={e => { e.preventDefault(); runQuickSearch(aiQuick) }}
                  className="flex gap-2">
              <input
                value={aiQuick}
                onChange={e => setAiQuick(e.target.value)}
                placeholder='ex: "procesor Intel sub 500 lei"'
                disabled={aiBusy}
                className="flex-1 bg-white/[0.06] border border-white/15 rounded-xl px-3 py-2
                           text-primary text-[12px] outline-none placeholder:text-muted/40
                           focus:border-accent/50 transition-colors disabled:opacity-50"
              />
              <button type="submit" disabled={aiBusy || !aiQuick.trim()}
                      className="px-3 py-2 rounded-xl bg-accent text-base font-bold cursor-pointer
                                 hover:shadow-glow-cyan transition-all shrink-0
                                 disabled:opacity-40 disabled:cursor-not-allowed flex items-center">
                {aiBusy
                  ? <CircleNotch size={13} className="animate-spin" />
                  : <MagnifyingGlass size={13} weight="bold" />}
              </button>
            </form>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-muted text-[10px] uppercase tracking-wide">sau alege categoria</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            {loading ? <Spinner /> : (
              <div className="grid grid-cols-2 gap-1.5">
                {catsList.map(c => {
                  const meta = CAT_META[c.slug] || { Icon: Package, color: '#94a3b8' }
                  const { Icon, color } = meta
                  return (
                    <button key={c.slug}
                            onClick={() => pickAiCategory(c.slug, c.name)}
                            disabled={aiBusy}
                            className="flex items-center gap-2 px-2 py-2 rounded-xl
                                       bg-white/[0.04] border border-white/10 cursor-pointer text-left
                                       hover:border-white/25 hover:bg-white/[0.08] transition-all
                                       disabled:opacity-50">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                           style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
                        <Icon size={12} style={{ color }} />
                      </div>
                      <span className="text-primary text-[11px] font-semibold leading-tight">{c.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      }

      // ── Phase: conversation (followup + results) ────────────
      const hasResults = aiMessages.some(m => m.type === 'results')
      const catLabel   = aiDetected?.catName || ''
      return (
        <div className="flex flex-col h-full -m-3">
          {/* Category bar */}
          <div className="shrink-0 px-3 py-2 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-1.5">
              <span className="text-muted text-[11px]">Categorie:</span>
              <span className="text-primary text-[11px] font-semibold">{catLabel}</span>
            </div>
            <button
              onClick={() => { setAiPhase('cat'); setAiMessages([]); setAiDetected(null); setAiInput('') }}
              className="text-accent text-[11px] cursor-pointer hover:underline flex items-center gap-1">
              <ArrowLeft size={10} weight="bold" /> Schimbă
            </button>
          </div>

          <div ref={msgsRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">
            {aiMessages.map(msg => renderMsg(msg))}
          </div>

          {aiPhase === 'followup' && (
            <div className="shrink-0 px-3 py-2.5 border-t border-white/[0.08] bg-base/60">
              <div className="flex gap-2">
                <input
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runFollowup(aiInput)}
                  placeholder={hasResults
                    ? 'Rafinează: ex. max 500 RON, AMD, 32GB...'
                    : 'Brand, specs, buget... sau „orice"'}
                  disabled={aiBusy}
                  autoFocus
                  className="flex-1 bg-white/[0.06] border border-white/15 rounded-xl px-3 py-2
                             text-primary text-[13px] outline-none placeholder:text-muted/40
                             focus:border-accent/50 transition-colors disabled:opacity-50"
                />
                <button onClick={() => runFollowup(aiInput)}
                        disabled={aiBusy || !aiInput.trim()}
                        className="px-3 py-2 rounded-xl bg-accent text-base font-bold cursor-pointer
                                   hover:shadow-glow-cyan transition-all
                                   disabled:opacity-40 disabled:cursor-not-allowed flex items-center shrink-0">
                  {aiBusy
                    ? <CircleNotch size={14} className="animate-spin" />
                    : <MagnifyingGlass size={14} weight="bold" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )
    }

    // ── Manual search ───────────────────────────────────────────
    if (searchMode === 'manual') {
      const cats          = cache['cats']
      const isCatsLoading = cats === 'loading' || cats === undefined
      const isCatsError   = cats === 'error'
      const catsList      = Array.isArray(cats) ? cats : []

      const CAT_META = {
        cpu:         { Icon: Cpu,        color: '#38bdf8' },
        gpu:         { Icon: Monitor,    color: '#a78bfa' },
        ram:         { Icon: Memory,     color: '#00e5a0' },
        motherboard: { Icon: Memory,     color: '#fb923c' },
        storage:     { Icon: HardDrive,  color: '#f59e0b' },
        psu:         { Icon: Lightning,  color: '#f87171' },
        case:        { Icon: Package,    color: '#94a3b8' },
        cooler:      { Icon: Wind,       color: '#38bdf8' },
        monitor:     { Icon: Monitor,    color: '#00e5a0' },
        mouse:       { Icon: Mouse,      color: '#a78bfa' },
        keyboard:    { Icon: Keyboard,   color: '#fb923c' },
        headset:     { Icon: Headphones, color: '#f59e0b' },
      }

      // Step 1 — alege categoria
      if (!manualCat) {
        const pickCat = (slug) => {
          setManualCat(slug)
          setManualSearch('')
          setManualFilters({})
          setManualResults(null)
          setExpandedFilter(null)
          load(`filters_${slug}`, () => chatAPI.filters(slug))
        }

        const handleManualSearchSubmit = (e) => {
          e.preventDefault()
          const slug = detectSlug(manualSearch)
          if (slug) { pickCat(slug); return }
          const match = catsList.find(c =>
            c.name.toLowerCase().includes(manualSearch.toLowerCase())
          )
          if (match) pickCat(match.slug)
        }

        const filtered = manualSearch.trim()
          ? catsList.filter(c => {
              const q = manualSearch.toLowerCase()
              if (c.name.toLowerCase().includes(q)) return true
              if (c.slug.includes(q)) return true
              return detectSlug(q) === c.slug
            })
          : catsList

        return (
        <>
          <BotMsg>Alege categoria sau scrie ce cauți:</BotMsg>
          <form onSubmit={handleManualSearchSubmit} className="flex gap-2">
            <input
              value={manualSearch}
              onChange={e => setManualSearch(e.target.value)}
              placeholder="ex: ram, placa video, mouse..."
              className="flex-1 bg-white/[0.06] border border-white/15 rounded-xl px-3 py-2
                         text-primary text-[13px] outline-none placeholder:text-muted/40
                         focus:border-accent/50 transition-colors"
            />
            <button type="submit"
                    className="px-3 py-2 rounded-xl bg-accent text-base font-bold cursor-pointer
                               hover:shadow-glow-cyan transition-all shrink-0">
              <MagnifyingGlass size={14} weight="bold" />
            </button>
          </form>
          {isCatsLoading ? <Spinner /> : isCatsError ? (
            <ErrorBlock onRetry={() => retry('cats', () => chatAPI.categories())} />
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {filtered.map(c => {
                const { Icon, color } = CAT_META[c.slug] || { Icon: Package, color: '#94a3b8' }
                return (
                  <button key={c.slug}
                          onClick={() => pickCat(c.slug)}
                          className="flex items-center gap-2 px-2 py-2 rounded-xl
                                     bg-white/[0.04] border border-white/10 cursor-pointer text-left
                                     hover:border-white/25 hover:bg-white/[0.08] transition-all">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                         style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
                      <Icon size={12} style={{ color }} />
                    </div>
                    <span className="text-primary text-[11px] font-semibold leading-tight">{c.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </>
        )
      }

      // Step 2 — filtre + căutare
      const filterData       = cache[`filters_${manualCat}`]
      const isFiltersLoading = filterData === 'loading' || filterData === undefined
      const isFiltersError   = filterData === 'error'
      const filters          = filterData && typeof filterData === 'object' && !Array.isArray(filterData) ? filterData : null
      const catName          = catsList.find(c => c.slug === manualCat)?.name || manualCat
      const activeCount      = Object.keys(manualFilters).length

      const runManualSearch = async () => {
        setManualResults('loading')
        try {
          const res = await chatAPI.search({ category_slug: manualCat, filters: manualFilters, limit: 40 })
          const products = Array.isArray(res.data) ? res.data : []
          setManualResults(products.length === 0 ? 'empty' : products)
        } catch {
          setManualResults('error')
        }
      }

      return (
        <>
          <BotMsg>
            <strong>{catName}</strong>
            {activeCount > 0 && <span className="text-muted text-[12px]"> · {activeCount} filtru activ</span>}
            {' '}— alege filtrele sau caută direct:
          </BotMsg>

          {isFiltersLoading ? <Spinner /> : isFiltersError ? (
            <ErrorBlock onRetry={() => retry(`filters_${manualCat}`, () => chatAPI.filters(manualCat))} />
          ) : filters && Object.keys(filters).length > 0 ? (
            <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
              {Object.entries(filters).map(([key, vals], idx, arr) => {
                const selected = manualFilters[key]
                const isOpen   = expandedFilter === key
                const isLast   = idx === arr.length - 1
                return (
                  <div key={key} className={!isLast ? 'border-b border-white/[0.06]' : ''}>
                    <button onClick={() => setExpandedFilter(isOpen ? null : key)}
                            className="w-full flex items-center justify-between px-3 py-2 cursor-pointer
                                       hover:bg-white/[0.04] transition-colors">
                      <span className="text-secondary text-[12px]">{key.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        {selected && (
                          <span className="px-2 py-0.5 rounded-full bg-accent/20 border border-accent/40
                                           text-accent text-[10px] font-semibold max-w-[80px] truncate">
                            {selected}
                          </span>
                        )}
                        <CaretRight size={11} className={`text-muted transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-2.5 flex flex-wrap gap-1.5">
                        {vals.map(val => {
                          const isSel = manualFilters[key] === String(val)
                          return (
                            <button key={val}
                                    onClick={() => {
                                      setManualFilters(prev => {
                                        const next = { ...prev }
                                        if (isSel) delete next[key]
                                        else next[key] = String(val)
                                        return next
                                      })
                                      setExpandedFilter(null)
                                      setManualResults(null)
                                    }}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border
                                               transition-all cursor-pointer
                                               ${isSel
                                                 ? 'bg-accent/20 border-accent/50 text-accent'
                                                 : 'bg-white/[0.06] border-white/15 text-secondary hover:border-white/30 hover:text-primary'
                                               }`}>
                              {String(val)}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : null}

          {manualResults !== 'loading' && (
            <BtnPrimary onClick={runManualSearch}>
              {activeCount > 0 ? `Caută cu ${activeCount} filtru` : `Caută toate în ${catName}`}
            </BtnPrimary>
          )}

          {manualResults === 'loading' && <Spinner />}

          {manualResults === 'empty' && (
            <>
              <BotMsg>
                Niciun produs conform selecției. Modifică sau elimină filtrele.
              </BotMsg>
              <BtnSecondary onClick={() => setManualResults(null)}>← Modifică filtrele</BtnSecondary>
            </>
          )}

          {manualResults === 'error' && <ErrorBlock onRetry={runManualSearch} />}

          {Array.isArray(manualResults) && manualResults.length > 0 && (
            <>
              <div className="text-muted text-[10px] uppercase tracking-wide font-bold">
                {manualResults.length} produs{manualResults.length !== 1 ? 'e' : ''} găsite
              </div>
              <div className="flex flex-col gap-1.5">
                {manualResults.map(p => renderProductCard(p))}
              </div>
              <BtnSecondary onClick={() => { setManualResults(null); setManualFilters({}) }}>
                ← Caută din nou
              </BtnSecondary>
            </>
          )}
        </>
      )
    }
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
            <BotMsg>Ai o problemă urgentă? Contactează-ne direct:</BotMsg>
            <ContactCard />
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
    if (svcInfo)  { setSvcInfo(false); return }
    if (retInfo)  { setRetInfo(false); return }
    if (probStep) { setProbStep(null); return }
    if (selOrder) { setSelOrder(null); return }
    if (screen === 'cautare' && manualCat) {
      setManualCat(null); setManualSearch(''); setManualFilters({}); setManualResults(null); setExpandedFilter(null); return
    }
    if (screen === 'cautare' && searchMode === 'ai' && aiPhase === 'followup') {
      setAiPhase('cat'); setAiMessages([]); setAiDetected(null); setAiInput(''); return
    }
    if (screen === 'cautare' && searchMode) {
      setSearchMode(null); setAiPhase('cat'); setAiDetected(null); setAiInput(''); return
    }
    goHome()
  }

  // ── RENDER ────────────────────────────────────────────────

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {open && (
        <div className="absolute bottom-[72px] right-0 w-[320px] h-[520px]
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
          {screen === 'cautare' && searchMode === 'ai'
            ? <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{renderScreen()}</div>
            : <div ref={bodyRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">{renderScreen()}</div>
          }
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
