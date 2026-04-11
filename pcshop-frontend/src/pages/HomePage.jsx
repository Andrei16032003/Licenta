import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Lightning, Storefront, Wrench, Robot, ShoppingCart, Check,
  CircleNotch, Star, Truck, ShieldCheck, Lock, Cpu,
  Monitor, Memory, Circuitry, HardDrive, Package,
  Thermometer, Mouse, Desktop, Question, CaretDown,
  ArrowRight,
} from '@phosphor-icons/react'
import { productsAPI, cartAPI } from '../services/api'
import { imgUrl } from '../utils/imgUrl'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'

const categoryIconMap = {
  cpu:         Cpu,
  gpu:         Monitor,
  ram:         Memory,
  motherboard: Circuitry,
  storage:     HardDrive,
  psu:         Lightning,
  case:        Package,
  cooler:      Thermometer,
  monitor:     Desktop,
  peripherals: Mouse,
}

const categoryColors = {
  cpu: '#0EF6FF', gpu: '#A78BFA', ram: '#00E5A0', motherboard: '#FF8C00',
  storage: '#FFD700', psu: '#FF4757', case: '#80CBC4', cooler: '#81D4FA',
  monitor: '#F48FB1', peripherals: '#A5D6A7',
}

/* Intrebarile frecvente afisate pe homepage — subset din pagina /faq */
const HOME_FAQS = [
  {
    q: 'Cât durează livrarea?',
    a: 'Produsele în stoc sunt livrate în 1–3 zile lucrătoare. Comenzile plasate înainte de ora 14:00 sunt procesate în aceeași zi.',
    color: '#FF9800',
  },
  {
    q: 'Livrarea este gratuită?',
    a: 'Da, livrarea este gratuită pentru comenzile peste 500 RON. Sub această valoare, costul de livrare este de 19,99 RON.',
    color: '#FF9800',
  },
  {
    q: 'Pot returna un produs?',
    a: 'Da, ai 14 zile calendaristice de la primire pentru a returna orice produs, fără justificare. Produsul trebuie să fie în starea originală.',
    color: '#FF5252',
  },
  {
    q: 'Care sunt metodele de plată?',
    a: 'Acceptăm card bancar (Visa, Mastercard), transfer bancar și ramburs. Toate tranzacțiile sunt securizate SSL/TLS 256-bit.',
    color: '#00E676',
  },
  {
    q: 'Oferiți garanție?',
    a: 'Toate produsele au garanție comercială de minimum 2 ani conform specificațiilor producătorului. Garanția acoperă defectele de fabricație.',
    color: '#FFD700',
  },
  {
    q: 'Trebuie să am cont pentru a cumpăra?',
    a: 'Nu este obligatoriu — poți cumpăra ca vizitator. Un cont gratuit îți oferă istoric comenzi, wishlist, vouchere și gestionare retururi.',
    color: '#CE93D8',
  },
]

/* Sectiunea mini-FAQ de pe homepage cu accordion si link catre pagina completa */
function HomeFAQ() {
  const [open, setOpen] = useState(null)

  return (
    <div className="rounded-2xl overflow-hidden"
         style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b"
           style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <Question size={18} weight="bold" className="text-dark" />
          </div>
          <div>
            <div className="text-primary font-bold text-[16px]">Întrebări frecvente</div>
            <div className="text-muted text-xs">Cele mai comune întrebări ale clienților noștri</div>
          </div>
        </div>
        <Link to="/faq"
              className="no-underline flex items-center gap-1.5 text-accent text-sm font-semibold
                         hover:gap-2.5 transition-all duration-200">
          Vezi toate <ArrowRight size={15} weight="bold" />
        </Link>
      </div>

      {/* Accordion items */}
      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {HOME_FAQS.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={i}
                 style={{ background: isOpen ? `${item.color}06` : 'transparent',
                          transition: 'background 0.2s' }}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full text-left flex items-center gap-4 px-7 py-4 bg-transparent border-none cursor-pointer">
                <span className="shrink-0 w-2 h-2 rounded-full mt-0.5"
                      style={{ background: isOpen ? item.color : 'rgba(255,255,255,0.15)',
                               transition: 'background 0.2s' }} />
                <span className="flex-1 text-sm font-semibold transition-colors duration-200"
                      style={{ color: isOpen ? item.color : '#F1F5F9' }}>
                  {item.q}
                </span>
                <CaretDown size={15}
                           className={`shrink-0 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                           style={{ color: isOpen ? item.color : undefined }} />
              </button>
              {isOpen && (
                <div className="px-7 pb-4 text-secondary text-sm leading-relaxed"
                     style={{ paddingLeft: '52px' }}>
                  {item.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore()
  const { setCart } = useCartStore()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState([])
  const [cartLoading, setCartLoading] = useState(new Set())
  const [cartAdded, setCartAdded] = useState(new Set())

  useEffect(() => {
    productsAPI.getCategories().then(r => setCategories(r.data)).catch(() => {})
    productsAPI.getAll({ featured: true, limit: 6 }).then(r => {
      const prods = r.data.products
      setFeatured(prods.length > 0 ? prods : [])
      if (prods.length === 0) {
        productsAPI.getAll({ limit: 6 }).then(r2 => setFeatured(r2.data.products)).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  const handleAddToCart = async (e, product) => {
    e.preventDefault()
    if (!isAuthenticated) { navigate('/login'); return }
    setCartLoading(s => new Set([...s, product.id]))
    try {
      await cartAPI.add({ user_id: user.id, product_id: product.id, quantity: 1 })
      const cartRes = await cartAPI.get(user.id)
      setCart(cartRes.data)
      setCartAdded(s => new Set([...s, product.id]))
      setTimeout(() => setCartAdded(s => { const n = new Set(s); n.delete(product.id); return n }), 2000)
    } catch { /* ignore */ }
    finally { setCartLoading(s => { const n = new Set(s); n.delete(product.id); return n }) }
  }

  return (
    <div className="flex flex-col gap-8">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-xl px-12 py-20 text-center
                      border border-accent/20 shadow-[0_0_100px_rgba(14,246,255,0.08)]"
           style={{ background: 'linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 40%, var(--bg-2) 70%, var(--bg-0) 100%)' }}>
        <div className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(14,246,255,0.15) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl
                          bg-accent shadow-glow-cyan mb-7">
            <Lightning size={38} weight="bold" color="#050910" />
          </div>

          <h1 className="font-display font-black text-[56px] leading-[1.05] tracking-[-1.5px] mb-5 m-0">
            <span className="text-primary">Componentele tale,{' '}</span>
            <span style={{ background: 'linear-gradient(135deg, var(--cyan), var(--violet))',
                           WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              configurate perfect
            </span>
          </h1>

          <p className="text-secondary text-xl max-w-[560px] mx-auto mb-11 leading-relaxed">
            Cele mai bune componente PC la prețuri imbatabile. Livrare rapidă, garanție 24 luni.
          </p>

          <div className="flex gap-4 justify-center flex-wrap mb-12">
            <Link to="/catalog"
              className="flex items-center gap-2 bg-accent text-dark px-10 py-4 rounded-xl
                         font-bold text-[17px] no-underline shadow-glow-cyan
                         hover:shadow-[0_8px_36px_rgba(14,246,255,0.55)] hover:-translate-y-1
                         transition-all duration-200">
              <Storefront size={20} weight="bold" />
              Explorează Catalogul
            </Link>
            <Link to="/builder"
              className="flex items-center gap-2 bg-white/[0.07] text-primary px-10 py-4 rounded-xl
                         font-bold text-[17px] no-underline border border-white/[0.18]
                         hover:bg-white/[0.12] hover:-translate-y-1 transition-all duration-200">
              <Wrench size={20} weight="regular" />
              PC Builder
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-[600px] mx-auto">
            {[
              { val: '500+',    lbl: 'Produse',            Icon: Package,     color: 'var(--cyan)'   },
              { val: '24 luni', lbl: 'Garanție',           Icon: ShieldCheck, color: 'var(--green)'  },
              { val: 'Gratuit', lbl: 'Transport 500+ RON', Icon: Truck,       color: 'var(--amber)'  },
              { val: '24/7',    lbl: 'Suport',             Icon: Robot,       color: 'var(--violet)' },
            ].map(s => (
              <div key={s.lbl} className="bg-white/5 rounded-xl px-4 py-4 text-center"
                   style={{ border: `1px solid ${s.color}25` }}>
                <s.Icon size={22} weight="duotone" style={{ color: s.color }} className="mb-2 mx-auto block" />
                <div className="text-xl font-extrabold leading-none mb-1" style={{ color: s.color }}>{s.val}</div>
                <div className="text-muted text-xs mt-1">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CATEGORII */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-accent-dim border border-accent-border flex items-center justify-center">
            <Package size={20} weight="duotone" className="text-accent" />
          </div>
          <div>
            <h2 className="text-primary text-xl font-extrabold m-0 font-display">Categorii</h2>
            <p className="text-muted text-sm m-0">Alege categoria și găsește exact ce cauți</p>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3.5">
          {categories.map(c => {
            const color = categoryColors[c.slug] || 'var(--cyan)'
            const CatIcon = categoryIconMap[c.slug] || Package
            return (
              <Link key={c.id} to={`/catalog?category=${c.slug}`} className="no-underline">
                <div
                  className="rounded-2xl py-[22px] px-3.5 text-center cursor-pointer transition-all duration-200 hover:-translate-y-1.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}22` }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${color}12`
                    e.currentTarget.style.borderColor = `${color}55`
                    e.currentTarget.style.boxShadow = `0 8px 24px ${color}20`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.borderColor = `${color}22`
                    e.currentTarget.style.boxShadow = ''
                  }}
                >
                  <CatIcon size={32} weight="duotone" style={{ color }} className="mb-2.5 mx-auto block" />
                  <div className="text-secondary text-[13px] font-semibold leading-snug">{c.name}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* PRODUSE FEATURED */}
      {featured.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.35)' }}>
                <Star size={20} weight="duotone" style={{ color: '#FFD700' }} />
              </div>
              <div>
                <h2 className="text-primary text-xl font-extrabold m-0 font-display">Produse recomandate</h2>
                <p className="text-muted text-sm m-0">Selecția noastră de top</p>
              </div>
            </div>
            <Link to="/catalog"
              className="text-accent no-underline text-sm font-bold flex items-center gap-1.5
                         bg-accent-dim border border-accent-border px-[18px] py-2 rounded-lg
                         hover:bg-accent/15 transition-colors duration-150">
              Vezi toate →
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
            {featured.map(p => {
              const catSlug = categories.find(c => c.name === p.category)?.slug
              const catColor = categoryColors[catSlug] || 'var(--cyan)'
              const CatIcon = categoryIconMap[catSlug] || Package
              return (
                <Link key={p.id} to={`/product/${p.id}`} className="no-underline">
                  <div className="product-card flex flex-col h-full p-[18px]">
                    <div className="product-img-bg rounded-xl h-[170px] flex items-center justify-center mb-4 overflow-hidden"
                         style={{ border: `1px solid ${catColor}22` }}>
                      {p.image_url
                        ? <img src={imgUrl(p.image_url)} alt={p.name}
                               className="w-full h-full object-contain p-2.5 mix-blend-multiply" />
                        : <CatIcon size={46} weight="duotone" style={{ color: catColor }} />
                      }
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="text-[11px] font-bold mb-1.5 uppercase tracking-wide" style={{ color: catColor }}>
                        {p.category}
                      </div>
                      <h3 className="text-primary text-[15px] font-semibold mb-1 leading-snug flex-1 line-clamp-2 m-0">
                        {p.name}
                      </h3>
                      <p className="text-muted text-[13px] mb-3 m-0">{p.brand}</p>
                      <div className="flex justify-between items-center mb-3 border-t border-default pt-3">
                        <span className="font-mono font-extrabold text-xl text-price">{p.price} RON</span>
                        {p.old_price && <span className="font-mono text-muted line-through text-[13px]">{p.old_price}</span>}
                      </div>
                      <button
                        onClick={e => handleAddToCart(e, p)}
                        disabled={p.stock === 0 || cartLoading.has(p.id)}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                                   font-bold text-[14px] border-none transition-all duration-200
                                   ${cartAdded.has(p.id)
                                     ? 'bg-success text-dark cursor-pointer'
                                     : p.stock === 0
                                       ? 'bg-white/5 text-muted cursor-not-allowed'
                                       : 'bg-accent text-dark cursor-pointer shadow-glow-cyan hover:shadow-[0_6px_24px_rgba(14,246,255,0.55)] hover:-translate-y-0.5'
                                   }`}
                      >
                        {cartLoading.has(p.id)
                          ? <><CircleNotch size={16} weight="bold" className="animate-spin" /> Se adaugă...</>
                          : cartAdded.has(p.id)
                            ? <><Check size={16} weight="bold" /> Adăugat!</>
                            : p.stock === 0
                              ? 'Stoc epuizat'
                              : <><ShoppingCart size={16} weight="bold" /> Adaugă în coș</>
                        }
                      </button>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* AVANTAJE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { Icon: Truck,       title: 'Transport gratuit',    desc: 'La comenzi peste 500 RON, livrare gratuită în toată țara', color: 'var(--green)'  },
          { Icon: ShieldCheck, title: 'Garanție 24 luni',     desc: 'Toate produsele vin cu garanție minimă de 2 ani',          color: 'var(--cyan)'   },
          { Icon: Lock,        title: 'Plată securizată',     desc: 'Tranzacții protejate prin criptare SSL 256-bit',            color: 'var(--violet)' },
          { Icon: Wrench,      title: 'Configurator gratuit', desc: 'Verifică compatibilitatea componentelor fără costuri',      color: '#FFD700'       },
        ].map(b => (
          <div key={b.title}
            className="rounded-2xl p-6 flex gap-4 items-start transition-all duration-200 hover:-translate-y-1"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${b.color}22` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${b.color}50` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${b.color}22` }}
          >
            <div className="w-[50px] h-[50px] shrink-0 rounded-2xl flex items-center justify-center"
                 style={{ background: `${b.color}15`, border: `1px solid ${b.color}33` }}>
              <b.Icon size={24} weight="duotone" style={{ color: b.color }} />
            </div>
            <div>
              <div className="text-primary font-bold text-[15px] mb-1.5">{b.title}</div>
              <div className="text-muted text-[13px] leading-relaxed">{b.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* MINI FAQ */}
      <HomeFAQ />

      {/* PROMO BANNERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/builder" className="no-underline">
          <div className="rounded-[18px] p-8 h-full transition-all duration-200 hover:-translate-y-1 cursor-pointer"
               style={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #1A2A5E 100%)', border: '1px solid rgba(14,246,255,0.25)' }}
               onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(14,246,255,0.2)'; e.currentTarget.style.borderColor = 'rgba(14,246,255,0.5)' }}
               onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'rgba(14,246,255,0.25)' }}>
            <div className="w-[54px] h-[54px] rounded-xl bg-accent-dim border border-accent-border flex items-center justify-center mb-4">
              <Wrench size={26} weight="duotone" className="text-accent" />
            </div>
            <div className="text-accent font-extrabold text-[19px] mb-2">Configurator PC</div>
            <div className="text-secondary text-sm leading-relaxed mb-[18px]">
              Verifică compatibilitatea componentelor tale în timp real. Socket, RAM, PSU și mai mult.
            </div>
            <span className="inline-flex items-center gap-1.5 text-primary text-sm font-bold
                             bg-accent-dim border border-accent-border px-[18px] py-2 rounded-lg">
              Încearcă acum →
            </span>
          </div>
        </Link>
        <Link to="/chat" className="no-underline">
          <div className="rounded-[18px] p-8 h-full transition-all duration-200 hover:-translate-y-1 cursor-pointer"
               style={{ background: 'linear-gradient(135deg, #1A0D3E 0%, #2A1A5E 100%)', border: '1px solid rgba(167,139,250,0.25)' }}
               onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(167,139,250,0.2)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)' }}
               onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.25)' }}>
            <div className="w-[54px] h-[54px] rounded-xl flex items-center justify-center mb-4"
                 style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)' }}>
              <Robot size={26} weight="duotone" className="text-violet" />
            </div>
            <div className="text-violet font-extrabold text-[19px] mb-2">Asistent AI</div>
            <div className="text-secondary text-sm leading-relaxed mb-[18px]">
              Spune-ne bugetul și scopul și îți recomandăm configurația perfectă pentru tine.
            </div>
            <span className="inline-flex items-center gap-1.5 text-primary text-sm font-bold px-[18px] py-2 rounded-lg"
                  style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)' }}>
              Încearcă acum →
            </span>
          </div>
        </Link>
      </div>
    </div>
  )
}
