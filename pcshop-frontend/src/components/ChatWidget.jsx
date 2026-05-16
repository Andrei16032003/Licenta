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

const CAT_KEYWORDS = {
  cpu:         ['procesor', 'cpu', 'ryzen', 'intel', 'i5', 'i7', 'i9', 'amd'],
  gpu:         ['placa video', 'gpu', 'rtx', 'gtx', 'radeon', 'nvidia', 'geforce', 'grafica'],
  ram:         ['ram', 'memorie', 'ddr4', 'ddr5', 'ddr3'],
  motherboard: ['placa de baza', 'motherboard', 'mainboard'],
  storage:     ['ssd', 'hdd', 'nvme', 'stocare', 'm.2', 'disc'],
  psu:         ['sursa', 'psu', 'alimentare', 'watt'],
  case:        ['carcasa', 'tower', 'cabinet'],
  cooler:      ['cooler', 'racire', 'ventilator', 'aio'],
  monitor:     ['monitor', 'ecran', 'display', '144hz', '4k'],
  mouse:       ['mouse', 'soarece'],
  keyboard:    ['tastatura', 'keyboard'],
  headset:     ['casti', 'headset', 'headphone'],
}

function detectCatFromText(text, catsList) {
  const lower = text.toLowerCase()
  for (const [slug, kws] of Object.entries(CAT_KEYWORDS)) {
    if (kws.some(kw => lower.includes(kw))) {
      const cat = catsList.find(c => c.slug === slug)
      if (cat) return cat
    }
  }
  for (const cat of catsList) {
    if (lower.includes(cat.name.toLowerCase())) return cat
  }
  return null
}

function extractPrice(text) {
  const s = text.toLowerCase().trim()
  if (/nu\s*conteaz|orice|fara\s*buget|nu\s*am\s*buget/.test(s))
    return { min: undefined, max: undefined }
  const toNum = v => parseFloat(v.replace(',', '.'))
  const range = s.match(/(\d[\d.,]*)\s*[-–]\s*(\d[\d.,]*)/)
    || s.match(/intre\s+(\d[\d.,]*)\s+si\s+(\d[\d.,]*)/)
    || s.match(/(\d[\d.,]*)\s+pana\s+(?:la\s+)?(\d[\d.,]*)/)
  if (range) return { min: toNum(range[1]), max: toNum(range[2]) }
  const mx = s.match(/(?:maxim|max|pana\s+la|sub)\s*(\d[\d.,]*)/)
  if (mx) return { min: undefined, max: toNum(mx[1]) }
  const mn = s.match(/(?:minim|min|cel\s+putin|peste|de\s+la)\s*(\d[\d.,]*)/)
  if (mn) return { min: toNum(mn[1]), max: undefined }
  const num = s.match(/^(\d[\d.,]*)(?:\s*ron)?$/)
  if (num) return { min: undefined, max: toNum(num[1]) }
  return null
}

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
  const [cache, setCache]           = useState({})
  const [selOrder, setSelOrder]     = useState(null)
  const [probStep, setProbStep]     = useState(null)
  const [svcInfo, setSvcInfo]       = useState(false)
  const [retInfo, setRetInfo]       = useState(false)
  const [convMsgs, setConvMsgs]     = useState([])
  const [convPhase, setConvPhase]   = useState('idle')
  const [convCat, setConvCat]       = useState(null)
  const [convMin, setConvMin]       = useState(undefined)
  const [convMax, setConvMax]       = useState(undefined)
  const [convInput, setConvInput]   = useState('')
  const [convBusy, setConvBusy]       = useState(false)
  const [convPriceMode, setConvPriceMode] = useState(null) // null | 'max' | 'range'
  const [convPriceMax, setConvPriceMax]   = useState('')
  const [convPriceMin, setConvPriceMin]   = useState('')
  const [copiedCode, setCopiedCode] = useState(null)
  const bodyRef    = useRef(null)
  const msgsEndRef = useRef(null)

  const catsData = cache['cats']

  useEffect(() => {
    if (screen === 'cautare') {
      setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
    } else if (bodyRef.current) {
      setTimeout(() => bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50)
    }
  }, [screen, selOrder, probStep, svcInfo, retInfo, convMsgs])

  useEffect(() => {
    if (screen === 'cautare' && convPhase === 'idle' && Array.isArray(catsData)) {
      setConvMsgs([{ role: 'bot', type: 'intro', content: '' }])
      setConvPhase('awaiting_cat')
    }
  }, [screen, catsData, convPhase])

  const convReset = () => {
    setConvMsgs([])
    setConvPhase('idle')
    setConvCat(null)
    setConvMin(undefined)
    setConvMax(undefined)
    setConvInput('')
    setConvBusy(false)
    setConvPriceMode(null)
    setConvPriceMax('')
    setConvPriceMin('')
  }

  const convDoSearch = async (specs, cat, minP, maxP) => {
    setConvBusy(true)
    setConvMsgs(prev => [...prev, { role: 'bot', type: 'loading', content: '' }])
    try {
      const isGeneric = /^(orice|toate|nu\s*conteaza|nu\s*contează)$/i.test(specs.trim())
      const res = await chatAPI.semanticSearch({
        message:       isGeneric ? cat.name : specs,
        category_slug: cat.slug,
        filters:       {},
        max_price:     maxP,
        min_price:     minP,
        limit:         8,
      })
      const results = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
      const aiMsg   = res.data?.message ?? null
      const budgetDesc = maxP && minP ? `${minP}–${maxP} RON`
        : maxP ? `maxim ${maxP} RON`
        : minP ? `minim ${minP} RON`
        : null
      const noResultsMsg = budgetDesc
        ? `Nu am găsit ${cat.name} cu bugetul ${budgetDesc}. Probabil bugetul este prea mic — încearcă un preț mai mare sau caută fără restricții.`
        : `Nu am găsit produse cu aceste specificații în ${cat.name}. Încearcă alte cuvinte cheie.`
      setConvMsgs(prev => {
        const filtered = prev.filter(m => m.type !== 'loading')
        return [...filtered, {
          role: 'bot',
          type: 'results',
          content: results.length > 0
            ? (aiMsg || `Am găsit ${results.length} produs${results.length !== 1 ? 'e' : ''} pentru ${cat.name}.`)
            : noResultsMsg,
          products: results,
          cat,
          minP,
          maxP,
        }]
      })
      setConvPhase('results')
    } catch {
      setConvMsgs(prev => {
        const filtered = prev.filter(m => m.type !== 'loading')
        return [...filtered, { role: 'bot', type: 'error', content: 'A apărut o eroare. Încearcă din nou.' }]
      })
    } finally {
      setConvBusy(false)
    }
  }

  const convHandleSubmit = async () => {
    const text = convInput.trim()
    if (!text || convBusy) return
    setConvInput('')

    if (convPhase === 'awaiting_cat') {
      setConvMsgs(prev => [...prev, { role: 'user', content: text }])
      const cats = Array.isArray(catsData) ? catsData : []
      const found = detectCatFromText(text, cats)
      if (!found) {
        setConvMsgs(prev => [...prev, {
          role: 'bot',
          content: `Nu am recunoscut categoria. Poți alege din: ${cats.map(c => c.name).join(', ')}.`,
        }])
        return
      }
      setConvCat(found)
      setConvMsgs(prev => [...prev, {
        role: 'bot', type: 'price_select',
        content: `Am înțeles — cauți în categoria ${found.name}. Ce buget ai în vedere?`,
      }])
      setConvPhase('awaiting_price')
      return
    }

    if (convPhase === 'awaiting_specs') {
      setConvMsgs(prev => [...prev, { role: 'user', content: text }])
      await convDoSearch(text, convCat, convMin, convMax)
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
    convReset()
    if (s === 'cautare') load('cats', () => chatAPI.categories())
    if (!isAuthenticated) return
    const uid = user.id
    if (s === 'comenzi' || s === 'garantii') load('orders',   () => ordersAPI.getUserOrders(uid))
    if (s === 'favorite')                    load('wishlist', () => wishlistAPI.get(uid))
    if (s === 'vouchere')                    load('vouchere', () => vouchersAPI.getMy(uid))
  }

  const goHome = () => {
    setScreen('home'); setSelOrder(null); setProbStep(null); setSvcInfo(false); setRetInfo(false)
    convReset()
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

  // ── SCREENS ──────────────────────────────────────────────────

  const renderCautare = () => {
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

    const botAvatar = (
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent/25 to-accent/5
                      border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
        <Robot size={11} weight="duotone" className="text-accent" />
      </div>
    )

    const cats = Array.isArray(catsData) ? catsData : []
    const lastIntroIdx = convMsgs.reduce((acc, m, j) => m.type === 'intro' ? j : acc, -1)

    if (convMsgs.length === 0) {
      return (
        <div className="flex items-center justify-center py-10">
          <CircleNotch size={18} className="animate-spin text-accent" />
        </div>
      )
    }

    return convMsgs.map((msg, i) => {
      if (msg.role === 'user') {
        return (
          <div key={i} className="flex justify-end">
            <div className="bg-accent/15 border border-accent/25 rounded-2xl rounded-tr-sm
                            px-3 py-2 text-[12px] text-primary leading-relaxed max-w-[80%]">
              {msg.content}
            </div>
          </div>
        )
      }

      if (msg.type === 'loading') {
        return (
          <div key={i} className="flex items-start gap-2.5">
            {botAvatar}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm px-3 py-3">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent/70 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-accent/70 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-accent/70 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )
      }

      if (msg.type === 'intro') {
        const isActiveIntro = i === lastIntroIdx && convPhase === 'awaiting_cat'
        return (
          <div key={i} className="flex items-start gap-2.5">
            {botAvatar}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm
                            px-3 py-2.5 text-[12px] text-primary leading-relaxed flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-primary font-semibold text-[12.5px]">Asistent virtual PCShop</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40
                                 text-amber-400 text-[9px] font-bold shrink-0">AI</span>
              </div>
              <p>Bună! Sunt un asistent bazat pe inteligență artificială și te pot ajuta să găsești produse PC. Pot face greșeli uneori, dar fac tot posibilul.</p>
              <p className="text-secondary">Avem aceste categorii — apasă una sau scrie mai jos:</p>
              {cats.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {cats.map(c => {
                    const { Icon, color } = CAT_META[c.slug] || { Icon: Package, color: '#94a3b8' }
                    return (
                      <button key={c.slug}
                              disabled={!isActiveIntro}
                              onClick={() => {
                                if (!isActiveIntro) return
                                setConvCat(c)
                                setConvMsgs(prev => [...prev,
                                  { role: 'user', content: c.name },
                                  { role: 'bot', type: 'price_select', content: `Am înțeles — cauți în categoria ${c.name}. Ce buget ai în vedere?` },
                                ])
                                setConvPhase('awaiting_price')
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                                         border transition-all
                                         ${isActiveIntro
                                           ? 'bg-white/[0.06] border-white/15 cursor-pointer hover:border-accent/40 hover:bg-accent/10'
                                           : 'bg-white/[0.03] border-white/[0.06] cursor-default opacity-50'}`}>
                        <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                             style={{ background: `${color}20` }}>
                          <Icon size={9} style={{ color }} />
                        </div>
                        <span className="text-primary text-[11px] font-semibold">{c.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      }

      if (msg.type === 'price_select') {
        const lastPriceIdx = convMsgs.reduce((acc, m, j) => m.type === 'price_select' ? j : acc, -1)
        const isActive = convPhase === 'awaiting_price' && i === lastPriceIdx

        const specsMsg = `Ai vreo preferință de specificații? (ex: "AMD Ryzen 5 gaming", "8 nuclee") Sau scrie "orice" pentru toate produsele.`

        const confirmMax = () => {
          const val = parseFloat(convPriceMax)
          if (!val || val <= 0) return
          setConvMin(undefined); setConvMax(val)
          setConvMsgs(prev => [...prev,
            { role: 'user', content: `Maxim ${val} RON` },
            { role: 'bot', content: `Înțeles — buget maxim ${val} RON.\n\n${specsMsg}` },
          ])
          setConvPhase('awaiting_specs')
          setConvPriceMode(null); setConvPriceMax(''); setConvPriceMin('')
        }

        const confirmRange = () => {
          const min = parseFloat(convPriceMin)
          const max = parseFloat(convPriceMax)
          if (!min || !max || min >= max) return
          setConvMin(min); setConvMax(max)
          setConvMsgs(prev => [...prev,
            { role: 'user', content: `${min}–${max} RON` },
            { role: 'bot', content: `Înțeles — buget ${min}–${max} RON.\n\n${specsMsg}` },
          ])
          setConvPhase('awaiting_specs')
          setConvPriceMode(null); setConvPriceMax(''); setConvPriceMin('')
        }

        const confirmAny = () => {
          setConvMin(undefined); setConvMax(undefined)
          setConvMsgs(prev => [...prev,
            { role: 'user', content: 'Orice preț' },
            { role: 'bot', content: `Fără restricții de preț.\n\n${specsMsg}` },
          ])
          setConvPhase('awaiting_specs')
          setConvPriceMode(null)
        }

        const btnRow = "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-left transition-all bg-white/[0.04] border"
        const inputCls = "w-full bg-white/[0.06] border border-white/15 rounded-xl px-3 py-2 text-primary text-[12.5px] outline-none placeholder:text-muted/35 focus:border-accent/50 transition-colors"

        return (
          <div key={i} className="flex items-start gap-2.5">
            {botAvatar}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm
                            px-3 py-2.5 text-[12px] text-primary leading-relaxed flex-1 flex flex-col gap-2.5">
              <span className="font-medium">{msg.content}</span>

              {isActive && convPriceMode === null && (
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => setConvPriceMode('max')}
                          className={`${btnRow} border-white/10 hover:border-accent/40 hover:bg-accent/[0.08]`}>
                    <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
                      <span className="text-accent text-[9px] font-bold">MAX</span>
                    </div>
                    <div>
                      <div className="text-primary text-[11.5px] font-semibold leading-tight">Preț maxim</div>
                      <div className="text-muted text-[10.5px]">ex: maxim 500 RON</div>
                    </div>
                  </button>
                  <button onClick={() => setConvPriceMode('range')}
                          className={`${btnRow} border-white/10 hover:border-accent/40 hover:bg-accent/[0.08]`}>
                    <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
                      <span className="text-accent text-[10px] font-bold">↔</span>
                    </div>
                    <div>
                      <div className="text-primary text-[11.5px] font-semibold leading-tight">Interval de preț</div>
                      <div className="text-muted text-[10.5px]">ex: 300 – 1500 RON</div>
                    </div>
                  </button>
                  <button onClick={confirmAny}
                          className={`${btnRow} border-white/10 hover:border-success/40 hover:bg-success/[0.06]`}>
                    <div className="w-7 h-7 rounded-lg bg-success/15 border border-success/30 flex items-center justify-center shrink-0">
                      <span className="text-success text-[11px] font-bold">✓</span>
                    </div>
                    <div>
                      <div className="text-primary text-[11.5px] font-semibold leading-tight">Orice preț</div>
                      <div className="text-muted text-[10.5px]">fără restricții de buget</div>
                    </div>
                  </button>
                </div>
              )}

              {isActive && convPriceMode === 'max' && (
                <div className="flex flex-col gap-2">
                  <input type="number" min="0" value={convPriceMax}
                         onChange={e => setConvPriceMax(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && confirmMax()}
                         placeholder="Preț maxim (RON)" autoFocus className={inputCls} />
                  <div className="flex gap-2">
                    <button onClick={confirmMax}
                            disabled={!convPriceMax || parseFloat(convPriceMax) <= 0}
                            className="flex-1 py-2 rounded-xl bg-accent text-base text-[12px] font-bold
                                       cursor-pointer hover:brightness-110 transition-all
                                       disabled:opacity-40 disabled:cursor-not-allowed">
                      Confirmă
                    </button>
                    <button onClick={() => { setConvPriceMode(null); setConvPriceMax('') }}
                            className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10
                                       text-secondary text-[12px] cursor-pointer hover:border-white/25 transition-all">
                      ←
                    </button>
                  </div>
                </div>
              )}

              {isActive && convPriceMode === 'range' && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input type="number" min="0" value={convPriceMin}
                           onChange={e => setConvPriceMin(e.target.value)}
                           placeholder="De la (RON)" autoFocus
                           className={`flex-1 bg-white/[0.06] border border-white/15 rounded-xl px-3 py-2
                                       text-primary text-[12.5px] outline-none placeholder:text-muted/35
                                       focus:border-accent/50 transition-colors`} />
                    <input type="number" min="0" value={convPriceMax}
                           onChange={e => setConvPriceMax(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && confirmRange()}
                           placeholder="Până la (RON)"
                           className={`flex-1 bg-white/[0.06] border border-white/15 rounded-xl px-3 py-2
                                       text-primary text-[12.5px] outline-none placeholder:text-muted/35
                                       focus:border-accent/50 transition-colors`} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={confirmRange}
                            disabled={!convPriceMin || !convPriceMax || parseFloat(convPriceMin) >= parseFloat(convPriceMax)}
                            className="flex-1 py-2 rounded-xl bg-accent text-base text-[12px] font-bold
                                       cursor-pointer hover:brightness-110 transition-all
                                       disabled:opacity-40 disabled:cursor-not-allowed">
                      Confirmă
                    </button>
                    <button onClick={() => { setConvPriceMode(null); setConvPriceMin(''); setConvPriceMax('') }}
                            className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10
                                       text-secondary text-[12px] cursor-pointer hover:border-white/25 transition-all">
                      ←
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }

      if (msg.type === 'results') {
        const hasProducts = msg.products?.length > 0
        const hasBudget   = msg.maxP || msg.minP
        return (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              {botAvatar}
              <div className={`rounded-2xl rounded-tl-sm px-3 py-2 text-[12px] leading-relaxed flex-1
                              ${hasProducts
                                ? 'bg-white/[0.04] border border-white/[0.08] text-primary'
                                : 'bg-warning/10 border border-warning/30 text-warning'}`}>
                {msg.content}
              </div>
            </div>
            {hasProducts && (
              <div className="flex flex-col gap-1.5 pl-[34px]">
                {msg.products.map(p => renderProductCard(p))}
              </div>
            )}
            <div className="flex flex-col gap-1.5 pl-[34px]">
              {!hasProducts && (
                <>
                  <button
                    onClick={() => {
                      setConvMsgs(prev => [...prev, {
                        role: 'bot',
                        content: `Ce specificații vrei să cauți? (ex: "AMD Ryzen 5", "8 nuclee") Sau scrie "orice" pentru toate produsele.`,
                      }])
                      setConvPhase('awaiting_specs')
                    }}
                    className="w-full py-2 rounded-xl bg-accent/10 border border-accent/30
                               text-accent text-[11.5px] font-semibold cursor-pointer
                               hover:bg-accent/20 transition-all">
                    Încearcă alte specificații
                  </button>
                  {hasBudget && (
                    <button
                      onClick={() => {
                        setConvMin(undefined); setConvMax(undefined)
                        setConvPriceMode(null); setConvPriceMax(''); setConvPriceMin('')
                        setConvMsgs(prev => [...prev, {
                          role: 'bot', type: 'price_select',
                          content: `Ce buget ai în vedere?`,
                        }])
                        setConvPhase('awaiting_price')
                      }}
                      className="w-full py-2 rounded-xl bg-white/[0.04] border border-white/10
                                 text-secondary text-[11.5px] font-medium cursor-pointer
                                 hover:border-white/25 hover:text-primary transition-all">
                      Schimbă bugetul
                    </button>
                  )}
                </>
              )}
              {hasProducts && (
                <button
                  onClick={() => {
                    setConvMin(undefined); setConvMax(undefined)
                    setConvPriceMode(null); setConvPriceMax(''); setConvPriceMin('')
                    setConvMsgs(prev => [...prev, {
                      role: 'bot', type: 'price_select',
                      content: `Ce buget ai în vedere?`,
                    }])
                    setConvPhase('awaiting_price')
                  }}
                  className="w-full py-1.5 rounded-xl bg-white/[0.04] border border-white/10
                             text-secondary text-[11px] font-medium cursor-pointer
                             hover:border-accent/30 hover:text-primary transition-all">
                  Caută din nou
                </button>
              )}
              <button
                onClick={() => {
                  setConvCat(null); setConvMin(undefined); setConvMax(undefined)
                  setConvMsgs(prev => [...prev, { role: 'bot', type: 'intro', content: '' }])
                  setConvPhase('awaiting_cat')
                }}
                className="w-full py-1.5 rounded-xl bg-white/[0.04] border border-white/10
                           text-secondary text-[11px] font-medium cursor-pointer
                           hover:border-accent/30 hover:text-primary transition-all">
                Altă categorie
              </button>
            </div>
          </div>
        )
      }

      if (msg.type === 'error') {
        return (
          <div key={i} className="flex items-start gap-2.5">
            {botAvatar}
            <div className="bg-danger/10 border border-danger/30 rounded-2xl rounded-tl-sm
                            px-3 py-2 text-[12px] text-danger leading-relaxed">
              {msg.content}
            </div>
          </div>
        )
      }

      const lines = msg.content.split('\n').filter(Boolean)
      return (
        <div key={i} className="flex items-start gap-2.5">
          {botAvatar}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm
                          px-3 py-2 text-[12px] text-primary leading-relaxed flex-1">
            {lines.length > 1
              ? <div className="flex flex-col gap-1">{lines.map((l, j) => <span key={j}>{l}</span>)}</div>
              : msg.content}
          </div>
        </div>
      )
    })
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
          {screen === 'cautare' ? (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div ref={bodyRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
                {renderCautare()}
                <div ref={msgsEndRef} />
              </div>
              {convPhase !== 'idle' && convPhase !== 'results' && convPhase !== 'awaiting_price' && (
                <div className="shrink-0 px-3 pb-3 pt-2 border-t border-white/[0.06]">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={convInput}
                      onChange={e => setConvInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') convHandleSubmit() }}
                      placeholder={
                        convPhase === 'awaiting_cat'   ? 'Scrie categoria (ex: procesor, GPU...)' :
                        convPhase === 'awaiting_price' ? 'ex: maxim 500, 300-1500, nu contează' :
                                                         'Descrie ce cauți...'
                      }
                      disabled={convBusy}
                      className="flex-1 bg-white/[0.06] border border-white/15 rounded-xl px-3 py-2
                                 text-primary text-[12.5px] outline-none placeholder:text-muted/35
                                 focus:border-accent/50 transition-colors disabled:opacity-50"
                    />
                    <button onClick={convHandleSubmit}
                            disabled={convBusy || !convInput.trim()}
                            className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center
                                       cursor-pointer hover:brightness-110 transition-all shrink-0
                                       disabled:opacity-40 disabled:cursor-not-allowed">
                      {convBusy
                        ? <CircleNotch size={13} className="animate-spin text-base" />
                        : <CaretRight size={14} weight="bold" className="text-base" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div ref={bodyRef} className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
              {renderScreen()}
            </div>
          )}
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
