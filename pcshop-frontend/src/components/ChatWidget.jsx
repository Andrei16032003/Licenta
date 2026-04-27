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
    <div className="flex items-start gap-2.5">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent/25 to-accent/5
                      border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
        <Robot size={11} weight="duotone" className="text-accent" />
      </div>
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm
                      px-3 py-2 text-[12px] text-primary leading-relaxed flex-1">
        {children}
      </div>
    </div>
  )
}

function OptionBtn({ Icon, label, color, onClick, sub }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                 bg-white/[0.04] border border-white/[0.08] cursor-pointer text-left
                 hover:border-white/[0.18] hover:bg-white/[0.07]
                 active:scale-[0.99] transition-all duration-150 group">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
           style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-primary text-[12.5px] font-semibold leading-tight">{label}</div>
        {sub && <div className="text-muted text-[11px] mt-0.5 leading-tight">{sub}</div>}
      </div>
      <CaretRight size={11} className="text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
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
            className="w-full py-2.5 rounded-xl bg-accent text-base text-[12.5px] font-bold
                       cursor-pointer hover:brightness-110 hover:shadow-glow-cyan
                       active:scale-[0.98] transition-all tracking-wide">
      {children}
    </button>
  )
}

function BtnSecondary({ onClick, children }) {
  return (
    <button onClick={onClick}
            className="w-full py-2 rounded-xl bg-transparent border border-white/[0.1]
                       text-secondary text-[12px] font-medium cursor-pointer
                       hover:border-white/25 hover:text-primary hover:bg-white/[0.04]
                       active:scale-[0.98] transition-all">
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
  const [manualMaxPrice, setManualMaxPrice] = useState('')
  const [manualResults, setManualResults]   = useState(null)
  const [expandedFilter, setExpandedFilter] = useState(null)
  const [chatSelProduct, setChatSelProduct] = useState(null)
  const [copiedCode, setCopiedCode]         = useState(null)
  const [allCatProducts, setAllCatProducts] = useState([])   // all prods in category (for faceting)
  const bodyRef          = useRef(null)
  const msgsRef          = useRef(null)
  const liveTimerRef     = useRef(null)
  const prevManualCatRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current)
      setTimeout(() => bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }, [screen, selOrder, probStep, svcInfo, retInfo, searchMode, manualCat, chatSelProduct])

  useEffect(() => {
    if (msgsRef.current)
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [aiMessages])

  // Manual search effect: only loads allCatProducts for faceting when category changes
  useEffect(() => {
    if (!manualCat) {
      prevManualCatRef.current = null
      setAllCatProducts([])
      return
    }
    if (manualCat === prevManualCatRef.current) return
    prevManualCatRef.current = manualCat
    clearTimeout(liveTimerRef.current)
    setManualResults(null)
    setChatSelProduct(null)
    chatAPI.search({ category_slug: manualCat, filters: {}, limit: 200 })
      .then(res => setAllCatProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAllCatProducts([]))
  }, [manualCat])

  // Returns set of available values for a filter key given current other filters
  const getAvailableValues = (filterKey, currentFilters, allProds) => {
    if (!allProds.length) return null   // not loaded yet → don't restrict
    const otherFilters = Object.fromEntries(Object.entries(currentFilters).filter(([k]) => k !== filterKey))
    const matching = allProds.filter(p =>
      Object.entries(otherFilters).every(([k, v]) => {
        const val = p[k] ?? p.specs?.[k] ?? p.attributes?.[k] ?? p.specifications?.[k]
        return val !== undefined && String(val) === v
      })
    )
    const available = new Set()
    matching.forEach(p => {
      const val = p[filterKey] ?? p.specs?.[filterKey] ?? p.attributes?.[filterKey] ?? p.specifications?.[filterKey]
      if (val != null) available.add(String(val))
    })
    return available
  }

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
          { id: ts + 2, role: 'bot', type: 'results', results, extracted: { category_slug: slug, filters, max_price, min_price } },
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
          { id: ts + 2, role: 'bot', type: 'no_cat',
            price_hint: (max_price || min_price)
              ? { max_price: max_price ?? null, min_price: min_price ?? null }
              : null },
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
          { id: ts + 2, role: 'bot', type: 'results', results, extracted: { category_slug: slug, filters, max_price, min_price } },
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

  const resetManual = () => {
    clearTimeout(liveTimerRef.current)
    prevManualCatRef.current = null
    setManualCat(null); setManualSearch(''); setManualFilters({}); setManualMaxPrice('')
    setManualResults(null); setExpandedFilter(null); setChatSelProduct(null); setAllCatProducts([])
  }

  const goTo = (s) => {
    setScreen(s); setSelOrder(null); setProbStep(null); setSvcInfo(false); setRetInfo(false)
    if (s !== 'cautare') {
      setAiInput(''); setAiMessages([]); setAiBusy(false); setAiPhase('cat'); setAiDetected(null)
      setSearchMode(null); resetManual()
    }
    if (!isAuthenticated) return
    const uid = user.id
    if (s === 'comenzi' || s === 'garantii') load('orders',   () => ordersAPI.getUserOrders(uid))
    if (s === 'favorite')                    load('wishlist', () => wishlistAPI.get(uid))
    if (s === 'vouchere')                    load('vouchere', () => vouchersAPI.getMy(uid))
  }

  const goHome = () => {
    setScreen('home'); setSelOrder(null); setProbStep(null); setSvcInfo(false); setRetInfo(false)
    setAiInput(''); setAiMessages([]); setAiBusy(false); setAiPhase('cat'); setAiDetected(null)
    setSearchMode(null); resetManual()
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
                className="w-full flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08]
                           rounded-xl p-2.5 cursor-pointer text-left
                           hover:border-accent/30 hover:bg-white/[0.07] transition-all group">
          {img
            ? <img src={img} alt={p.name} className="w-9 h-9 object-contain rounded-lg bg-white/5 shrink-0" />
            : <div className="w-9 h-9 rounded-lg bg-white/5 shrink-0 flex items-center justify-center">
                <Package size={14} className="text-muted/30" />
              </div>
          }
          <div className="flex-1 min-w-0">
            <div className="text-primary text-[11.5px] font-semibold truncate leading-snug">{p.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-accent font-mono font-bold text-[12px]">{finalPrice} RON</span>
              {hasDiscount && <span className="text-muted text-[10px] line-through">{p.price} RON</span>}
              {hasDiscount && (
                <span className="px-1 py-0.5 rounded bg-success/15 border border-success/25 text-success text-[9px] font-bold">
                  -{p.discount_percent}%
                </span>
              )}
            </div>
          </div>
          <CaretRight size={11} className="text-white/15 group-hover:text-white/50 transition-colors shrink-0" />
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
        <BtnSecondary onClick={goHome}>← Înapoi la meniu</BtnSecondary>
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
              {(() => {
                const chips = [
                  ...Object.entries(msg.extracted?.filters || {})
                    .map(([k, v]) => `${k.replace(/_/g, ' ')} ${v}`),
                  msg.extracted?.max_price && `max ${msg.extracted.max_price} RON`,
                  msg.extracted?.min_price && `min ${msg.extracted.min_price} RON`,
                ].filter(Boolean)
                return chips.length > 0
                  ? <span className="text-muted text-[12px]"> · {chips.join(' · ')}</span>
                  : null
              })()}:
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
            Nu am înțeles tipul produsului
            {msg.price_hint ? <span className="text-accent"> (preț detectat: {[
              msg.price_hint.min_price && `min ${msg.price_hint.min_price}`,
              msg.price_hint.max_price && `max ${msg.price_hint.max_price}`,
            ].filter(Boolean).join(' – ')} RON)</span> : ''}.
            {' '}Încearcă: <em>"procesor Intel sub 500 lei"</em>, <em>"placa video nvidia"</em>, <em>"RAM DDR5 32GB"</em>.
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
            <BtnSecondary onClick={() => setSearchMode(null)}>← Înapoi la tipul de căutare</BtnSecondary>
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
          <BtnSecondary onClick={() => setSearchMode(null)}>← Înapoi la tipul de căutare</BtnSecondary>
        </>
        )
      }

      // Step 2 — filtre cu faceting + buget + căutare manuală
      const filterData       = cache[`filters_${manualCat}`]
      const isFiltersLoading = filterData === 'loading' || filterData === undefined
      const isFiltersError   = filterData === 'error'
      const filters          = filterData && typeof filterData === 'object' && !Array.isArray(filterData) ? filterData : null
      const catName          = catsList.find(c => c.slug === manualCat)?.name || manualCat
      const activeFilterKeys = Object.keys(manualFilters)
      const activeCount      = activeFilterKeys.length + (manualMaxPrice ? 1 : 0)

      // Client-side count from cached products (for button label)
      const approxCount = allCatProducts.length > 0
        ? allCatProducts.filter(p => {
            const mf = Object.entries(manualFilters).every(([k, v]) => {
              const val = p[k] ?? p.specs?.[k] ?? p.attributes?.[k] ?? p.specifications?.[k]
              return val != null && String(val) === v
            })
            const mp = !manualMaxPrice || (p.price != null && p.price <= parseFloat(manualMaxPrice))
            return mf && mp
          }).length
        : null

      const runSearch = async () => {
        setManualResults('loading')
        setChatSelProduct(null)
        try {
          const maxP = manualMaxPrice ? parseFloat(manualMaxPrice) : undefined
          const res  = await chatAPI.search({ category_slug: manualCat, filters: manualFilters, max_price: maxP, limit: 40 })
          const prods = Array.isArray(res.data) ? res.data : []
          setManualResults(prods.length === 0 ? 'empty' : prods)
        } catch {
          setManualResults('error')
        }
      }

      // product detail view
      if (chatSelProduct) {
        const p = chatSelProduct
        const hasDiscount = p.discount_percent > 0
        const finalPrice  = hasDiscount
          ? (p.price * (1 - p.discount_percent / 100)).toFixed(0)
          : p.price
        const img = p.image_url || p.image || p.images?.[0]?.url
        const specs = p.specs || p.specifications || {}
        return (
          <>
            <div className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden">
              {img && (
                <div className="w-full bg-white/5 flex items-center justify-center h-32 border-b border-white/[0.06]">
                  <img src={img} alt={p.name} className="h-28 object-contain" />
                </div>
              )}
              <div className="p-3 flex flex-col gap-2">
                <div className="text-primary font-semibold text-[13px] leading-snug">{p.name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-accent font-mono font-bold text-[16px]">{finalPrice} RON</span>
                  {hasDiscount && (
                    <>
                      <span className="text-muted text-[12px] line-through">{p.price} RON</span>
                      <span className="px-1.5 py-0.5 rounded bg-success/15 border border-success/25
                                       text-success text-[10px] font-bold">-{p.discount_percent}%</span>
                    </>
                  )}
                </div>
                {Object.keys(specs).length > 0 && (
                  <div className="border-t border-white/[0.06] pt-2 flex flex-col gap-1">
                    {Object.entries(specs).slice(0, 5).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[11px]">
                        <span className="text-muted capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="text-primary font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <BtnPrimary onClick={() => navigate(`/product/${p.id}`)}>
              Vezi pagina produsului →
            </BtnPrimary>
            <BtnSecondary onClick={() => setChatSelProduct(null)}>← Înapoi la rezultate</BtnSecondary>
          </>
        )
      }

      // Renderer for a single product row (used in results list)
      const renderProdRow = (p) => {
        const hasDiscount = p.discount_percent > 0
        const img         = p.image_url || p.image || p.images?.[0]?.url
        const finalPrice  = hasDiscount
          ? (p.price * (1 - p.discount_percent / 100)).toFixed(0)
          : p.price
        return (
          <button key={p.id} onClick={() => setChatSelProduct(p)}
                  className="w-full flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.07]
                             rounded-xl p-2.5 cursor-pointer text-left
                             hover:border-accent/35 hover:bg-white/[0.07] transition-all group">
            {img
              ? <img src={img} alt={p.name} className="w-9 h-9 object-contain rounded-lg bg-white/5 shrink-0" />
              : <div className="w-9 h-9 rounded-lg bg-white/5 shrink-0 flex items-center justify-center">
                  <Package size={14} className="text-muted/30" />
                </div>
            }
            <div className="flex-1 min-w-0">
              <div className="text-primary text-[11.5px] font-semibold truncate leading-snug">{p.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-accent font-mono font-bold text-[12px]">{finalPrice} RON</span>
                {hasDiscount && <span className="text-muted text-[10px] line-through">{p.price} RON</span>}
                {hasDiscount && (
                  <span className="px-1 py-0.5 rounded bg-success/15 border border-success/25 text-success text-[9px] font-bold">
                    -{p.discount_percent}%
                  </span>
                )}
              </div>
            </div>
            <CaretRight size={11} className="text-white/15 group-hover:text-accent/50 transition-colors shrink-0" />
          </button>
        )
      }

      const searchBtnLabel = approxCount === 0
        ? 'Niciun produs disponibil'
        : approxCount != null && activeCount > 0
          ? `Caută — aprox. ${approxCount} produs${approxCount !== 1 ? 'e' : ''}`
          : activeCount > 0 ? 'Caută cu filtrele selectate' : `Caută toate în ${catName}`

      return (
        <>

            {/* Header + chips */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-primary text-[12.5px] font-semibold">{catName}</span>
                {activeCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-accent/20 border border-accent/30
                                   text-accent text-[10px] font-bold">{activeCount}</span>
                )}
              </div>
              {activeCount > 0 && (
                <button onClick={() => { setManualFilters({}); setManualMaxPrice('') }}
                        className="text-muted/50 text-[11px] cursor-pointer hover:text-danger/70 transition-colors">
                  Șterge filtre
                </button>
              )}
            </div>

            {activeCount > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(manualFilters).map(([k, v]) => (
                  <button key={k}
                          onClick={() => setManualFilters(prev => { const n = {...prev}; delete n[k]; return n })}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30
                                     text-accent text-[11px] cursor-pointer hover:bg-accent/25 transition-all">
                    <span className="capitalize">{k.replace(/_/g,' ')}: {v}</span>
                    <X size={9} weight="bold" />
                  </button>
                ))}
                {manualMaxPrice && (
                  <button onClick={() => setManualMaxPrice('')}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 border border-success/30
                                     text-success text-[11px] cursor-pointer hover:bg-success/25 transition-all">
                    <span>max {manualMaxPrice} RON</span>
                    <X size={9} weight="bold" />
                  </button>
                )}
              </div>
            )}

            {/* Buget maxim */}
            <input
              type="number" min="0"
              value={manualMaxPrice}
              onChange={e => setManualMaxPrice(e.target.value)}
              placeholder="Buget maxim (RON) — opțional"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2
                         text-primary text-[12px] outline-none placeholder:text-muted/35
                         focus:border-accent/40 transition-colors"
            />

            {/* Filtere acordion cu faceting */}
            {isFiltersLoading ? <Spinner /> : isFiltersError ? (
              <ErrorBlock onRetry={() => retry(`filters_${manualCat}`, () => chatAPI.filters(manualCat))} />
            ) : filters && Object.keys(filters).length > 0 ? (
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
                {Object.entries(filters).slice(0, 5).map(([key, vals], idx, arr) => {
                  const selected = manualFilters[key]
                  const isOpen   = expandedFilter === key
                  const isLast   = idx === arr.length - 1
                  const availSet = getAvailableValues(key, manualFilters, allCatProducts)
                  return (
                    <div key={key} className={!isLast ? 'border-b border-white/[0.05]' : ''}>
                      <button onClick={() => setExpandedFilter(isOpen ? null : key)}
                              className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer
                                         hover:bg-white/[0.04] transition-colors">
                        <span className="text-secondary text-[12px] capitalize font-medium">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          {selected && (
                            <span className="px-2 py-0.5 rounded-full bg-accent/20 border border-accent/35
                                             text-accent text-[10px] font-semibold max-w-[90px] truncate">
                              {selected}
                            </span>
                          )}
                          <CaretRight size={11} className={`text-muted/50 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 flex flex-wrap gap-1.5 max-h-[168px] overflow-y-auto">
                          {vals.map(val => {
                            const strVal    = String(val)
                            const isSel     = selected === strVal
                            const available = availSet === null || availSet.has(strVal) || isSel
                            return (
                              <button key={val}
                                      disabled={!available}
                                      onClick={() => {
                                        if (!available) return
                                        setManualFilters(prev => {
                                          const next = { ...prev }
                                          if (isSel) delete next[key]
                                          else next[key] = strVal
                                          return next
                                        })
                                        setExpandedFilter(null)
                                      }}
                                      title={!available ? 'Niciun produs cu această valoare' : undefined}
                                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
                                                 ${isSel
                                                   ? 'bg-accent/20 border-accent/50 text-accent cursor-pointer'
                                                   : available
                                                     ? 'bg-white/[0.06] border-white/15 text-secondary cursor-pointer hover:border-white/30 hover:text-primary'
                                                     : 'bg-white/[0.02] border-white/[0.05] text-muted/25 cursor-not-allowed line-through'
                                                 }`}>
                                {strVal}
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

            {/* Rezultate */}
            {manualResults === 'empty' && (
              <div className="bg-danger/[0.06] border border-danger/20 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <Warning size={14} className="text-danger shrink-0 mt-0.5" />
                <span className="text-danger/90 text-[12px]">
                  Niciun produs cu aceste filtre. Elimină un filtru sau mărește bugetul.
                </span>
              </div>
            )}

            {manualResults === 'error' && <ErrorBlock onRetry={runSearch} />}

            {Array.isArray(manualResults) && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted/60 text-[10.5px] uppercase tracking-wide font-bold">
                    {manualResults.length} produs{manualResults.length !== 1 ? 'e' : ''} găsite
                  </span>
                  <span className="text-accent/60 text-[10.5px]">{catName}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {manualResults.map(p => renderProdRow(p))}
                </div>
              </>
            )}

          {/* ── Footer sticky — buton Caută + înapoi ── */}
          <div className="sticky bottom-0 -mx-3.5 px-3.5 py-3 border-t border-white/[0.07] flex flex-col gap-2 bg-base">
            {manualResults === 'loading' ? (
              <div className="w-full py-2.5 rounded-xl bg-accent/10 border border-accent/20
                              flex items-center justify-center gap-2">
                <CircleNotch size={13} className="animate-spin text-accent shrink-0" />
                <span className="text-accent text-[12.5px] font-medium">Se caută...</span>
              </div>
            ) : (
              <button onClick={runSearch}
                      disabled={approxCount === 0}
                      className={`w-full py-2.5 rounded-xl text-[12.5px] font-bold tracking-wide
                                 flex items-center justify-center gap-2 transition-all
                                 ${approxCount === 0
                                   ? 'bg-white/[0.04] border border-white/[0.08] text-muted/40 cursor-not-allowed'
                                   : 'bg-accent text-base cursor-pointer hover:brightness-110 hover:shadow-glow-cyan active:scale-[0.98]'
                                 }`}>
                <MagnifyingGlass size={13} weight="bold" />
                {searchBtnLabel}
              </button>
            )}
            <BtnSecondary onClick={() => setManualCat(null)}>← Schimbă categoria</BtnSecondary>
          </div>
        </>
      )
    }
  }

  const renderHome = () => (
    <>
      <div className="flex flex-col items-center text-center pt-1 pb-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10
                        border border-accent/40 flex items-center justify-center mb-3 shadow-glow-cyan">
          <Robot size={22} weight="duotone" className="text-accent" />
        </div>
        <p className="text-primary font-semibold text-[13px]">Bună ziua! Sunt asistentul tău.</p>
        <p className="text-muted text-[11.5px] mt-0.5">Alege o opțiune din meniu:</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {MENU.map(m => (
          <button key={m.id} onClick={() => goTo(m.id)}
            className="flex flex-col items-center gap-2 px-2 py-3 rounded-xl
                       bg-white/[0.04] border border-white/[0.08] cursor-pointer
                       hover:border-white/20 hover:bg-white/[0.07] transition-all duration-150 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: `${m.color}20`, border: `1px solid ${m.color}40` }}>
              <m.Icon size={16} style={{ color: m.color }} />
            </div>
            <span className="text-primary text-[11px] font-semibold text-center leading-tight px-1">
              {m.label}
            </span>
          </button>
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
        <BtnSecondary onClick={goHome}>← Înapoi la meniu</BtnSecondary>
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
        <div className="flex flex-col gap-2">
          <BtnPrimary onClick={() => goTo('retururi')}>Mergi la Retururi →</BtnPrimary>
          <BtnSecondary onClick={() => setProbStep(null)}>← Înapoi</BtnSecondary>
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
        <div className="flex flex-col gap-2">
          <BtnPrimary onClick={() => navigate('/profile?tab=service')}>Deschide cerere service →</BtnPrimary>
          <BtnSecondary onClick={() => setProbStep(null)}>← Înapoi</BtnSecondary>
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

  const renderRetururi = () => (
    <>
      <BotMsg>
        Retur în <strong>30 de zile</strong> de la livrare.
        Rambursare în <strong>5–7 zile</strong> după primirea produsului.
      </BotMsg>
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 flex flex-col gap-2">
        <div className="text-muted text-[10px] uppercase tracking-wider font-bold">Cum funcționează</div>
        {[
          { n: '1', text: 'Completezi formularul cu comanda și motivul' },
          { n: '2', text: 'Cererea este analizată în 1–2 zile' },
          { n: '3', text: 'Ești contactat pentru ridicarea coletului' },
          { n: '4', text: 'Rambursarea în 5–7 zile după primire' },
        ].map(({ n, text }) => (
          <div key={n} className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-accent/15 border border-accent/35
                            flex items-center justify-center text-accent text-[10px] font-bold shrink-0">
              {n}
            </div>
            <span className="text-primary text-[12px]">{text}</span>
          </div>
        ))}
      </div>
      <div className="bg-white/[0.03] border border-accent/20 rounded-xl p-3 flex flex-col gap-2.5">
        <div className="flex flex-col gap-1.5">
          {['Produs în 30 de zile de la livrare', 'Ambalaj original intact', 'Accesorii și documente incluse'].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-[11.5px]">
              <span className="text-accent shrink-0">✓</span>
              <span className="text-secondary">{item}</span>
            </div>
          ))}
        </div>
        <BtnPrimary onClick={() => navigate('/profile?tab=returns')}>Inițiază retur →</BtnPrimary>
      </div>
    </>
  )

  // ── SERVICE ──────────────────────────────────────────────

  const renderService = () => (
    <>
      <BotMsg>
        <strong>Service</strong> pentru produse defecte sau cu probleme tehnice.
        Produsele în garanție sunt reparate <strong>gratuit</strong>.
      </BotMsg>
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 flex flex-col gap-2">
        <div className="text-muted text-[10px] uppercase tracking-wider font-bold">Cum funcționează</div>
        {[
          { n: '1', text: 'Completezi formularul cu descrierea problemei' },
          { n: '2', text: 'Cererea analizată în 1–2 zile lucrătoare' },
          { n: '3', text: 'Ești contactat pentru ridicarea produsului' },
          { n: '4', text: 'Urmărești statusul cu numărul de ticket' },
        ].map(({ n, text }) => (
          <div key={n} className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-accent/15 border border-accent/35
                            flex items-center justify-center text-accent text-[10px] font-bold shrink-0">
              {n}
            </div>
            <span className="text-primary text-[12px]">{text}</span>
          </div>
        ))}
      </div>
      <div className="bg-white/[0.03] border border-accent/20 rounded-xl p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted">Durată estimată</span>
          <span className="text-primary font-semibold">7–14 zile lucrătoare</span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted">Produse în garanție</span>
          <span className="text-success font-semibold">Reparație gratuită</span>
        </div>
        <BtnPrimary onClick={() => navigate('/profile?tab=service')}>Deschide cerere service →</BtnPrimary>
      </div>
    </>
  )

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
            <BtnSecondary onClick={goHome}>← Înapoi la meniu</BtnSecondary>
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
            <BtnSecondary onClick={goHome}>← Înapoi la meniu</BtnSecondary>
          </>
        )}
      </>
    )
  }

  // ── VOUCHERE ─────────────────────────────────────────────

  const renderVouchere = () => {
    const raw     = cache['vouchere']
    const loading = raw === 'loading' || raw === undefined
    const isError = raw === 'error'
    const active  = Array.isArray(raw) ? raw.filter(v => v.is_active) : []

    const copyCode = (code) => {
      navigator.clipboard.writeText(code).catch(() => {})
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    }

    return (
      <>
        <BotMsg>
          <strong>Voucherele tale</strong> — aplică codul la checkout pentru reducere instantă.
        </BotMsg>
        {!isAuthenticated ? <NotAuth /> : loading ? <Spinner /> : isError ? (
          <ErrorBlock onRetry={() => retry('vouchere', () => vouchersAPI.getMy(user.id))} />
        ) : !active.length ? (
          <>
            <div className="flex flex-col items-center gap-2 py-4 bg-white/[0.03] border border-white/[0.07]
                            rounded-xl text-center">
              <Tag size={28} className="text-amber-400/40" />
              <p className="text-muted text-[12px]">Nu ai niciun voucher activ momentan.</p>
              <p className="text-muted/60 text-[11px]">Urmărește promoțiile noastre pentru oferte exclusive.</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {active.map(v => (
              <div key={v.id}
                   className="relative bg-white/[0.04] border border-amber-500/25 rounded-xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/60 via-amber-400/40 to-transparent" />
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/35
                                       text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                        Voucher
                      </span>
                      {v.value != null && (
                        <span className="font-mono font-bold text-success text-[14px]">
                          {v.type === 'percent' ? `-${v.value}%` : `-${v.value} RON`}
                        </span>
                      )}
                    </div>
                    <button onClick={() => copyCode(v.code)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold
                                       border transition-all cursor-pointer
                                       ${copiedCode === v.code
                                         ? 'bg-success/20 border-success/40 text-success'
                                         : 'bg-white/[0.06] border-white/15 text-secondary hover:border-amber-500/40 hover:text-amber-400'
                                       }`}>
                      {copiedCode === v.code ? '✓ Copiat' : 'Copiază'}
                    </button>
                  </div>
                  <div className="font-mono text-amber-300 text-[15px] font-bold tracking-widest mb-1.5">
                    {v.code}
                  </div>
                  {v.description && (
                    <div className="text-muted text-[11px] mb-1">{v.description}</div>
                  )}
                  {v.expires_at && (
                    <div className="text-muted/60 text-[10.5px]">
                      Expiră: {new Date(v.expires_at).toLocaleDateString('ro-RO')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <p className="text-muted/60 text-[11px] text-center">
              Introdu codul la pasul de plată din checkout.
            </p>
          </div>
        )}
        <BtnSecondary onClick={goHome}>← Înapoi la meniu</BtnSecondary>
      </>
    )
  }

  // ── PROFIL ───────────────────────────────────────────────

  const renderProfil = () => (
    <>
      <BotMsg>
        <strong>Profilul tău</strong> — gestionează datele contului și adresele de livrare.
      </BotMsg>
      {!isAuthenticated ? <NotAuth /> : (
        <>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 flex items-center gap-3 mb-0.5">
            <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30
                            flex items-center justify-center shrink-0">
              <User size={16} weight="duotone" className="text-accent" />
            </div>
            <div className="min-w-0">
              <div className="text-primary text-[13px] font-semibold truncate">{user?.name || '—'}</div>
              <div className="text-muted text-[11px] truncate">{user?.email || '—'}</div>
            </div>
          </div>
          <OptionBtn Icon={User} label="Date cont" color="#38bdf8"
            sub="Modifică nume, telefon, parolă"
            onClick={() => navigate('/profile?tab=personal')} />
          <OptionBtn Icon={Package} label="Adrese de livrare" color="#a78bfa"
            sub="Adaugă sau editează adresele salvate"
            onClick={() => navigate('/profile?tab=addresses')} />
          <BtnSecondary onClick={goHome}>← Înapoi la meniu</BtnSecondary>
        </>
      )}
    </>
  )

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
    : chatSelProduct ? 'Detalii produs'
    : svcInfo ? 'Cerere service'
    : retInfo ? 'Inițiază retur'
    : screen === 'home' ? 'Asistent virtual'
    : activeMenu?.label || 'Asistent'
  const headerColor = selOrder ? '#a78bfa' : activeMenu?.color || 'var(--cyan)'
  const showBack    = screen !== 'home' || !!selOrder || svcInfo || retInfo || !!chatSelProduct

  const handleBack = () => {
    if (svcInfo)  { setSvcInfo(false); return }
    if (retInfo)  { setRetInfo(false); return }
    if (probStep) { setProbStep(null); return }
    if (selOrder) { setSelOrder(null); return }
    if (screen === 'cautare' && chatSelProduct) { setChatSelProduct(null); return }
    if (screen === 'cautare' && manualCat) { resetManual(); return }
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
        <div className="absolute bottom-[72px] right-0 w-[340px] h-[600px]
                        bg-base/98 rounded-2xl border border-white/[0.1] flex flex-col overflow-hidden
                        backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(14,246,255,0.08)] animate-fade-in">

          {/* Header */}
          <div className="shrink-0 px-4 py-3 border-b border-white/[0.07] flex justify-between items-center"
               style={{ background: 'linear-gradient(135deg, rgba(14,246,255,0.06) 0%, rgba(10,14,26,0.95) 100%)' }}>
            <div className="flex items-center gap-3">
              {showBack ? (
                <button onClick={handleBack}
                        className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/10 text-secondary
                                   flex items-center justify-center cursor-pointer
                                   hover:bg-white/15 hover:text-primary transition-all shrink-0">
                  <ArrowLeft size={12} weight="bold" />
                </button>
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                     style={{ background: `${headerColor}20`, border: `1px solid ${headerColor}40` }}>
                  <Robot size={14} weight="duotone" style={{ color: headerColor }} />
                </div>
              )}
              <div>
                <div className="text-primary font-bold text-[13px] leading-tight">{headerTitle}</div>
                <div className="text-[10.5px] flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span className="text-white/35">{screen === 'home' ? 'Online · Răspunde instant' : 'Asistent virtual PCShop'}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
                    className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/40
                               flex items-center justify-center cursor-pointer
                               hover:bg-white/15 hover:text-white/80 transition-all shrink-0">
              <X size={13} weight="bold" />
            </button>
          </div>

          {/* Body */}
          {screen === 'cautare' && searchMode === 'ai'
            ? <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{renderScreen()}</div>
            : <div ref={bodyRef} className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">{renderScreen()}</div>
          }
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-14 h-14 rounded-2xl cursor-pointer flex items-center justify-center
                   transition-all duration-300 hover:scale-105 active:scale-95
                   ${open
                     ? 'bg-white/[0.08] border border-white/10 text-white/60'
                     : 'bg-accent text-base border-none shadow-glow-cyan animate-glow-pulse'
                   }`}
      >
        {open
          ? <X size={18} weight="bold" />
          : <ChatCircleDots size={24} weight="duotone" />}
      </button>
    </div>
  )
}
