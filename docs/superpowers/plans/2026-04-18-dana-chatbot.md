# Dana Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Înlocuiește `ChatWidget.jsx` cu un asistent virtual tip Dana (eMAG) care afișează date reale din DB pentru comenzi, profil, vouchere, favorite, garanții, retururi și service.

**Architecture:** Component unic `ChatWidget.jsx` cu state machine bazat pe `screen`. Date încărcate lazy per ecran și cache-uite local în state. Niciun endpoint backend nou — folosește exclusiv API-urile existente. Utilizatori neautentificați văd un mesaj de login.

**Tech Stack:** React, Tailwind, @phosphor-icons/react, API-uri existente (ordersAPI, profileAPI, wishlistAPI, retururiAPI, serviceAPI, vouchersAPI, useAuthStore)

---

## File Map

| Fișier | Acțiune |
|--------|---------|
| `pcshop-frontend/src/components/ChatWidget.jsx` | REWRITE complet |

---

## Task 1: ChatWidget — Dana Bot

**Files:**
- Rewrite: `pcshop-frontend/src/components/ChatWidget.jsx`

- [ ] **Step 1: Înlocuiește complet `ChatWidget.jsx`**

Suprascrie `pcshop-frontend/src/components/ChatWidget.jsx` cu:

```jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChatCircleDots, X, Robot, ArrowLeft, User, Package,
  Tag, Heart, ShieldCheck, ArrowCounterClockwise, Wrench,
  Phone, CircleNotch, Warning, CaretRight, CheckCircle,
  XCircle, Clock, Truck,
} from '@phosphor-icons/react'
import {
  ordersAPI, profileAPI, wishlistAPI,
  retururiAPI, serviceAPI, vouchersAPI,
} from '../services/api'
import useAuthStore from '../store/authStore'

const STATUS_MAP = {
  pending:    { label: 'În așteptare', Icon: Clock,        color: '#f59e0b' },
  confirmed:  { label: 'Confirmată',   Icon: CheckCircle,  color: '#38bdf8' },
  processing: { label: 'În procesare', Icon: Clock,        color: '#a78bfa' },
  shipped:    { label: 'Expediată',    Icon: Truck,        color: '#38bdf8' },
  delivered:  { label: 'Livrată',     Icon: CheckCircle,  color: '#00e5a0' },
  cancelled:  { label: 'Anulată',     Icon: XCircle,      color: '#f87171' },
}
const PAYMENT_MAP = {
  pending:  { label: 'Neplătită',   color: '#f59e0b' },
  paid:     { label: 'Plătită',     color: '#00e5a0' },
  failed:   { label: 'Eșuată',      color: '#f87171' },
  refunded: { label: 'Rambursată',  color: '#a78bfa' },
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
  { id: 'profil',   label: 'Profilul meu',    Icon: User,                 color: '#38bdf8' },
  { id: 'comenzi',  label: 'Comenzile mele',  Icon: Package,              color: '#a78bfa' },
  { id: 'vouchere', label: 'Vouchere',         Icon: Tag,                  color: '#f59e0b' },
  { id: 'favorite', label: 'Favorite',         Icon: Heart,                color: '#f87171' },
  { id: 'garantii', label: 'Garanții',         Icon: ShieldCheck,          color: '#00e5a0' },
  { id: 'retururi', label: 'Retururi',         Icon: ArrowCounterClockwise, color: '#fb923c' },
  { id: 'service',  label: 'Service',          Icon: Wrench,               color: '#c084fc' },
]

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [open, setOpen]           = useState(false)
  const [screen, setScreen]       = useState('home')
  const [cache, setCache]         = useState({})
  const [loading, setLoading]     = useState(false)
  const [selOrder, setSelOrder]   = useState(null)
  const [probStep, setProbStep]   = useState(null)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current) {
      setTimeout(() => bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50)
    }
  }, [screen, selOrder, probStep])

  const load = async (key, fetcher) => {
    if (cache[key] !== undefined) return
    setLoading(true)
    try {
      const res = await fetcher()
      setCache(p => ({ ...p, [key]: res.data }))
    } catch {
      setCache(p => ({ ...p, [key]: null }))
    } finally {
      setLoading(false)
    }
  }

  const goTo = (s) => {
    setScreen(s)
    setSelOrder(null)
    setProbStep(null)
    if (!isAuthenticated) return
    const uid = user.id
    if (s === 'comenzi' || s === 'garantii') load('orders', () => ordersAPI.getUserOrders(uid))
    if (s === 'profil')   load('addresses', () => profileAPI.getAddresses(uid))
    if (s === 'favorite') load('wishlist',  () => wishlistAPI.get(uid))
    if (s === 'retururi') load('retururi',  () => retururiAPI.get(uid))
    if (s === 'service')  load('service',   () => serviceAPI.get(uid))
    if (s === 'vouchere') load('vouchere',  () => vouchersAPI.getMy(uid))
  }

  const goHome = () => { setScreen('home'); setSelOrder(null); setProbStep(null) }

  const handleClose = () => { setOpen(false) }
  const handleOpen  = () => {
    setOpen(true)
    if (screen !== 'home') goHome()
  }

  // ── Shared UI ────────────────────────────────────────────

  const BotMsg = ({ children }) => (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full bg-accent-dim border border-accent-border
                      flex items-center justify-center shrink-0 mt-0.5">
        <Robot size={14} weight="duotone" className="text-accent" />
      </div>
      <div className="bg-accent-dim border border-accent-border rounded-xl rounded-tl-sm
                      px-3 py-2.5 text-[13px] text-primary leading-relaxed flex-1">
        {children}
      </div>
    </div>
  )

  const OptionBtn = ({ Icon, label, color, onClick, sub }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                 bg-white/[0.04] border border-white/10 cursor-pointer text-left
                 hover:border-white/20 hover:bg-white/[0.07] transition-all duration-150 group"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
           style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-primary text-[13px] font-semibold">{label}</div>
        {sub && <div className="text-muted text-[11px]">{sub}</div>}
      </div>
      <CaretRight size={13} className="text-muted group-hover:text-primary transition-colors shrink-0" />
    </button>
  )

  const Loader = () => (
    <div className="flex items-center justify-center py-6">
      <CircleNotch size={20} className="animate-spin text-accent" />
    </div>
  )

  const NotAuth = () => (
    <BotMsg>
      Trebuie să fii autentificat pentru a vedea aceste informații.{' '}
      <button onClick={() => { handleClose(); navigate('/login') }}
              className="text-accent underline cursor-pointer">
        Conectează-te
      </button>
    </BotMsg>
  )

  // ── SCREENS ───────────────────────────────────────────────

  // HOME
  const HomeScreen = () => (
    <>
      <BotMsg>
        Bună ziua! 👋 Sunt asistentul tău virtual. Cu ce vă pot ajuta astăzi?
      </BotMsg>
      <div className="flex flex-col gap-1.5 mt-1">
        {MENU.map(m => (
          <OptionBtn key={m.id} Icon={m.Icon} label={m.label} color={m.color} onClick={() => goTo(m.id)} />
        ))}
      </div>
    </>
  )

  // PROFIL
  const ProfilScreen = () => {
    const addresses = cache['addresses']
    return <>
      <BotMsg>
        <strong>Profilul tău</strong> conține datele personale (nume, email, telefon) și adresele de livrare salvate. Le poți modifica oricând din pagina de profil.
      </BotMsg>
      {!isAuthenticated ? <NotAuth /> : <>
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

        {loading ? <Loader /> : addresses?.length > 0 ? (
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
            <div className="text-muted text-[10px] uppercase tracking-wide font-bold mb-2">
              Adresă implicită
            </div>
            {(() => {
              const a = addresses.find(x => x.is_default) || addresses[0]
              return (
                <div className="text-[13px] text-primary leading-relaxed">
                  {a.full_name}<br />
                  {a.street}, {a.city}, {a.county}<br />
                  {a.postal_code && <span className="text-muted">{a.postal_code}</span>}
                </div>
              )
            })()}
          </div>
        ) : (
          <BotMsg>Nu ai nicio adresă salvată. Adaugă una din pagina de profil pentru livrări mai rapide.</BotMsg>
        )}

        <button onClick={() => { handleClose(); navigate('/profile') }}
                className="w-full py-2.5 rounded-xl bg-accent text-base text-[13px] font-bold
                           cursor-pointer hover:shadow-glow-cyan transition-all duration-150">
          Mergi la Profilul meu →
        </button>
      </>}
    </>
  }

  // COMENZI
  const ComenziScreen = () => {
    const orders = cache['orders']
    return <>
      <BotMsg>
        <strong>Comenzile tale</strong> — poți vedea statusul fiecărei comenzi, dacă e plătită și detaliile produselor. Ultimele 3 comenzi sunt afișate mai jos.
      </BotMsg>
      {!isAuthenticated ? <NotAuth /> : loading ? <Loader /> : !orders?.length ? (
        <BotMsg>Nu ai nicio comandă încă. Descoperă produsele noastre! 🛒</BotMsg>
      ) : (
        <div className="flex flex-col gap-1.5">
          {orders.slice(0, 3).map(o => {
            const st = STATUS_MAP[o.status] || { label: o.status, Icon: Clock, color: '#94a3b8' }
            const pay = PAYMENT_MAP[o.payment_status] || { label: o.payment_status, color: '#94a3b8' }
            return (
              <button key={o.id} onClick={() => setSelOrder(o)}
                      className="w-full text-left bg-white/[0.04] border border-white/10 rounded-xl p-3
                                 hover:border-accent/30 hover:bg-white/[0.07] transition-all duration-150 cursor-pointer group">
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <div className="text-primary text-[12px] font-semibold">
                    #{o.invoice_number || o.id.slice(0, 8).toUpperCase()}
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: st.color }}>
                    {st.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted text-[11px]">{o.items_count} produs(e)</span>
                  <span className="text-accent font-bold text-[13px] font-mono">{o.total_price} RON</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-muted text-[11px]">
                    {new Date(o.created_at).toLocaleDateString('ro-RO')}
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: pay.color }}>
                    {pay.label}
                  </span>
                </div>
              </button>
            )
          })}
          {orders.length > 3 && (
            <button onClick={() => { handleClose(); navigate('/orders') }}
                    className="text-center text-accent text-[12px] cursor-pointer hover:underline py-1">
              Vezi toate comenzile ({orders.length}) →
            </button>
          )}
        </div>
      )}
    </>
  }

  // DETALIU COMANDA
  const ComandaDetailScreen = ({ order }) => {
    const st = STATUS_MAP[order.status] || { label: order.status, Icon: Clock, color: '#94a3b8' }
    const pay = PAYMENT_MAP[order.payment_status] || { label: order.payment_status, color: '#94a3b8' }

    if (probStep === 'type') return <>
      <BotMsg>Îmi pare rău că ai o problemă. Ce s-a întâmplat cu comanda <strong>#{order.invoice_number || order.id.slice(0,8).toUpperCase()}</strong>?</BotMsg>
      <div className="flex flex-col gap-1.5">
        <OptionBtn Icon={ArrowCounterClockwise} color="#fb923c" label="Produs defect / nu corespunde"
          sub="Vrei să faci un retur"
          onClick={() => setProbStep('retur')} />
        <OptionBtn Icon={Truck} color="#38bdf8" label="Nu am primit comanda"
          sub="Problemă cu livrarea"
          onClick={() => setProbStep('contact')} />
        <OptionBtn Icon={Warning} color="#f59e0b" label="Altă problemă"
          sub="Te conectăm cu suportul"
          onClick={() => setProbStep('contact')} />
      </div>
    </>

    if (probStep === 'retur') return <>
      <BotMsg>
        Pentru a iniția un <strong>retur</strong>, mergi la secțiunea <em>Retururi</em> din contul tău și completează formularul. Poți returna produsele în termen de <strong>30 de zile</strong> de la livrare.
        <br /><br />
        Dacă ai nevoie de ajutor suplimentar, contactează-ne:
      </BotMsg>
      <ContactCard />
      <div className="flex gap-2">
        <button onClick={() => { handleClose(); navigate('/retururi') }}
                className="flex-1 py-2.5 rounded-xl bg-accent text-base text-[13px] font-bold
                           cursor-pointer hover:shadow-glow-cyan transition-all duration-150">
          Inițiază retur →
        </button>
        <button onClick={() => setProbStep(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                           text-secondary text-[13px] cursor-pointer hover:text-primary transition-all">
          Înapoi
        </button>
      </div>
    </>

    if (probStep === 'contact') return <>
      <BotMsg>
        Te rugăm să contactezi echipa noastră de suport. Suntem disponibili <strong>Luni–Vineri, 09:00–18:00</strong>.
      </BotMsg>
      <ContactCard />
      <button onClick={() => setProbStep(null)}
              className="w-full py-2 rounded-xl bg-white/5 border border-white/10
                         text-secondary text-[13px] cursor-pointer hover:text-primary transition-all">
        ← Înapoi
      </button>
    </>

    return <>
      <BotMsg>
        Comanda <strong>#{order.invoice_number || order.id.slice(0,8).toUpperCase()}</strong> din{' '}
        {new Date(order.created_at).toLocaleDateString('ro-RO')} — total{' '}
        <strong>{order.total_price} RON</strong>.
      </BotMsg>

      <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex justify-between text-[13px]">
          <span className="text-muted">Status comandă</span>
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

      <div className="flex flex-col gap-1">
        <div className="text-muted text-[10px] uppercase tracking-wide font-bold mb-1">Produse</div>
        {(order.items || []).map((item, i) => (
          <div key={i} className="flex justify-between items-center text-[12px] py-1
                                   border-b border-white/5 last:border-0">
            <span className="text-primary truncate flex-1 mr-2">{item.product_name}</span>
            <span className="text-muted shrink-0">×{item.quantity}</span>
            <span className="text-accent font-mono ml-3 shrink-0">{item.unit_price} RON</span>
          </div>
        ))}
      </div>

      <button onClick={() => setProbStep('type')}
              className="w-full py-2.5 rounded-xl border border-danger/30 text-danger text-[13px]
                         font-semibold cursor-pointer hover:bg-danger/[0.08] transition-all duration-150">
        Am o problemă cu această comandă
      </button>
    </>
  }

  // VOUCHERE
  const VouchereScreen = () => {
    const vouchers = cache['vouchere']
    return <>
      <BotMsg>
        <strong>Voucherele tale active</strong> — le poți folosi la checkout pentru a obține reduceri. Verifică data de expirare!
      </BotMsg>
      {!isAuthenticated ? <NotAuth /> : loading ? <Loader /> : !vouchers?.length ? (
        <BotMsg>Nu ai niciun voucher activ momentan. Urmărește promoțiile noastre! 🎁</BotMsg>
      ) : (
        <div className="flex flex-col gap-1.5">
          {vouchers.filter(v => v.is_active).map(v => (
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
  }

  // FAVORITE
  const FavoriteScreen = () => {
    const wishlist = cache['wishlist']
    return <>
      <BotMsg>
        <strong>Produsele tale favorite</strong> sunt salvate în wishlist. Le poți adăuga oricând în coș de acolo.
      </BotMsg>
      {!isAuthenticated ? <NotAuth /> : loading ? <Loader /> : !wishlist?.length ? (
        <BotMsg>Nu ai niciun produs salvat la favorite. Adaugă produse apăsând ❤️ pe pagina produsului.</BotMsg>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            {wishlist.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/[0.04] border border-white/10
                                      rounded-xl p-2.5">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name}
                       className="w-10 h-10 object-contain rounded-lg bg-white/5 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-primary text-[12px] font-semibold truncate">{item.name || item.product_name}</div>
                  {item.price && <div className="text-accent text-[12px] font-mono">{item.price} RON</div>}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => { handleClose(); navigate('/wishlist') }}
                  className="w-full py-2.5 rounded-xl bg-accent text-base text-[13px] font-bold
                             cursor-pointer hover:shadow-glow-cyan transition-all duration-150">
            Vezi toate favoritele →
          </button>
        </>
      )}
    </>
  }

  // GARANTII
  const GarantiiScreen = () => {
    const orders = cache['orders']
    return <>
      <BotMsg>
        <strong>Garanțiile</strong> produselor tale sunt valabile de la data livrării. Perioada standard este de <strong>24 luni</strong> pentru produse electronice. Mai jos găsești produsele cu garanție din comenzile tale.
      </BotMsg>
      {!isAuthenticated ? <NotAuth /> : loading ? <Loader /> : !orders?.length ? (
        <BotMsg>Nu ai comenzi finalizate. Garanțiile apar după prima livrare.</BotMsg>
      ) : (() => {
        const delivered = orders.filter(o => o.status === 'delivered')
        if (!delivered.length) return <BotMsg>Garanțiile devin active după livrarea comenzii.</BotMsg>
        const items = delivered.flatMap(o =>
          (o.items || []).map(item => ({
            ...item,
            order_date: o.created_at,
          }))
        ).slice(0, 5)
        return (
          <div className="flex flex-col gap-1.5">
            {items.map((item, i) => {
              const deliveryDate = new Date(item.order_date)
              const expiryDate = new Date(deliveryDate)
              expiryDate.setMonth(expiryDate.getMonth() + (item.warranty_months || 24))
              const isValid = expiryDate > new Date()
              return (
                <div key={i} className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                  <div className="text-primary text-[12px] font-semibold truncate mb-1">{item.product_name}</div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted">Garanție</span>
                    <span className="font-bold" style={{ color: isValid ? '#00e5a0' : '#f87171' }}>
                      {isValid ? `Validă până ${expiryDate.toLocaleDateString('ro-RO')}` : 'Expirată'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}
      <BotMsg>
        Pentru orice problemă în garanție, mergi la <strong>Service</strong> sau contactează-ne.
      </BotMsg>
    </>
  }

  // RETURURI
  const RetururiScreen = () => {
    const retururi = cache['retururi']
    return <>
      <BotMsg>
        <strong>Retururile</strong> se pot iniția în termen de <strong>30 de zile</strong> de la livrare. Completezi un formular simplu, iar noi îți preluăm coletul și procesăm rambursarea.
      </BotMsg>
      {!isAuthenticated ? <NotAuth /> : loading ? <Loader /> : (
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
          <button onClick={() => { handleClose(); navigate('/retururi') }}
                  className="w-full py-2.5 rounded-xl bg-accent text-base text-[13px] font-bold
                             cursor-pointer hover:shadow-glow-cyan transition-all duration-150">
            Inițiază un retur nou →
          </button>
        </>
      )}
    </>
  }

  // SERVICE
  const ServiceScreen = () => {
    const tickets = cache['service']
    return <>
      <BotMsg>
        <strong>Service-ul</strong> este disponibil pentru produse defecte sau cu probleme tehnice. Completezi un formular cu descrierea problemei și noi ne ocupăm de diagnosticare și reparație.
      </BotMsg>
      {!isAuthenticated ? <NotAuth /> : loading ? <Loader /> : (
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
          <button onClick={() => { handleClose(); navigate('/service') }}
                  className="w-full py-2.5 rounded-xl bg-accent text-base text-[13px] font-bold
                             cursor-pointer hover:shadow-glow-cyan transition-all duration-150">
            Deschide tichet service →
          </button>
          <BotMsg>
            Ai o problemă urgentă? Contactează-ne direct:
          </BotMsg>
          <ContactCard />
        </>
      )}
    </>
  }

  // CONTACT CARD (reusable)
  const ContactCard = () => (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex flex-col gap-2">
      <a href="tel:0770648476"
         className="flex items-center gap-3 cursor-pointer group">
        <div className="w-8 h-8 rounded-lg bg-success/15 border border-success/30 flex items-center justify-center shrink-0">
          <Phone size={14} className="text-success" />
        </div>
        <div>
          <div className="text-primary text-[13px] font-semibold group-hover:text-accent transition-colors">
            0770 648 476
          </div>
          <div className="text-muted text-[11px]">Luni–Vineri, 09:00–18:00</div>
        </div>
      </a>
      <button onClick={() => { handleClose(); navigate('/contact') }}
              className="text-accent text-[12px] text-left cursor-pointer hover:underline">
        Sau completează formularul de contact →
      </button>
    </div>
  )

  // ── ROUTING ───────────────────────────────────────────────

  const renderScreen = () => {
    if (selOrder) return <ComandaDetailScreen order={selOrder} />
    switch (screen) {
      case 'home':     return <HomeScreen />
      case 'profil':   return <ProfilScreen />
      case 'comenzi':  return <ComenziScreen />
      case 'vouchere': return <VouchereScreen />
      case 'favorite': return <FavoriteScreen />
      case 'garantii': return <GarantiiScreen />
      case 'retururi': return <RetururiScreen />
      case 'service':  return <ServiceScreen />
      default:         return <HomeScreen />
    }
  }

  const headerTitle = selOrder
    ? `Comandă #${(selOrder.invoice_number || selOrder.id.slice(0,8)).toUpperCase()}`
    : screen === 'home' ? 'Asistent virtual' : MENU.find(m => m.id === screen)?.label || 'Asistent'

  const headerColor = selOrder ? '#a78bfa' : MENU.find(m => m.id === screen)?.color || 'var(--cyan)'

  // ── RENDER ────────────────────────────────────────────────

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {open && (
        <div className="absolute bottom-[76px] right-0 w-[360px] max-h-[580px]
                        bg-base/98 rounded-2xl border border-accent/15 flex flex-col overflow-hidden
                        backdrop-blur-xl shadow-elevated animate-fade-in">

          {/* Header */}
          <div className="bg-gradient-to-r from-base-1 to-base-2 px-4 py-3.5
                          border-b border-accent/20 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                   style={{ background: `${headerColor}18`, border: `1px solid ${headerColor}35` }}>
                <Robot size={18} weight="duotone" style={{ color: headerColor }} />
              </div>
              <div>
                <div className="text-primary font-semibold text-sm">{headerTitle}</div>
                <div className="text-[11px] flex items-center gap-1" style={{ color: headerColor }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#00e5a0' }} />
                  {screen === 'home' ? 'Cu ce vă pot ajuta?' : 'Asistent virtual'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {(screen !== 'home' || selOrder) && (
                <button
                  onClick={selOrder ? () => { setSelOrder(null); setProbStep(null) } : goHome}
                  className="w-7 h-7 rounded-full bg-white/10 border-none text-secondary
                             flex items-center justify-center cursor-pointer
                             hover:bg-white/20 hover:text-primary transition-all duration-150"
                  title="Înapoi"
                >
                  <ArrowLeft size={11} weight="bold" />
                </button>
              )}
              <button onClick={handleClose}
                      className="w-7 h-7 rounded-full bg-white/10 border-none text-secondary
                                 flex items-center justify-center cursor-pointer
                                 hover:bg-white/20 hover:text-primary transition-all duration-150">
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
        onClick={open ? handleClose : handleOpen}
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
```

- [ ] **Step 2: Verifică build-ul**

```bash
cd pcshop-frontend && npm run build
```

Așteptat: `✓ built in Xs` fără erori. Warning-ul despre chunk size e ok.

- [ ] **Step 3: Pornește dev server și testează Home Screen**

```bash
npm run dev
```

Deschide `http://localhost:5173`. Click pe butonul chat → Verifică:
- Apare "Bună ziua! 👋 Sunt asistentul tău virtual."
- 7 opțiuni în meniu: Profil, Comenzi, Vouchere, Favorite, Garanții, Retururi, Service
- Butonul ← nu apare pe home

- [ ] **Step 4: Testează Profil (autentificat)**

Loghează-te → click chat → Profilul meu. Verifică:
- Apar numele, email-ul, telefonul din contul tău
- Apare adresa implicită (dacă există) sau mesaj că nu ai nicio adresă
- Butonul "Mergi la Profilul meu →" navighează la `/profile`

- [ ] **Step 5: Testează Comenzi + detaliu comandă**

Click Comenzile mele → Verifică:
- Apar ultimele 3 comenzi cu numărul, statusul colorat, total, data, plată
- Click pe o comandă → apare detaliu cu produsele și statusuri
- Butonul "Am o problemă" → apar 3 opțiuni
- "Produs defect / nu corespunde" → ghid retur + buton Inițiază retur
- "Nu am primit comanda" / "Altă problemă" → apare ContactCard cu telefon

- [ ] **Step 6: Testează Garanții**

Click Garanții → Verifică:
- Apar produsele din comenzile livrate cu data expirării garanției
- Garanțiile valide apar în verde, cele expirate în roșu

- [ ] **Step 7: Testează neautentificat**

Deloghează-te → deschide chat → click orice secțiune. Verifică:
- Apare mesajul "Trebuie să fii autentificat" cu link spre login
- Meniul Home e accesibil fără autentificare

- [ ] **Step 8: Testează navigarea**

- Butonul ← din header: de pe orice secțiune → revine la home
- De pe detaliu comandă → revine la lista comenzi
- De pe problemă tip/retur/contact → butonul Înapoi revine la detaliu comandă
