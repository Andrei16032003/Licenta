import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Tag, ShoppingCart, Check, CircleNotch, Package,
  Cpu, Monitor, Memory, Circuitry, HardDrive,
  Lightning, Thermometer, Mouse, Desktop,
  Fire, SortAscending,
} from '@phosphor-icons/react'
import { productsAPI, cartAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import ProductImg from '../components/ProductImg'

const categoryIconMap = {
  cpu: Cpu, gpu: Monitor, ram: Memory, motherboard: Circuitry,
  storage: HardDrive, psu: Lightning, case: Package, cooler: Thermometer,
  monitor: Desktop, peripherals: Mouse,
}
const categoryColors = {
  cpu: '#0EF6FF', gpu: '#A78BFA', ram: '#00E5A0', motherboard: '#FF8C00',
  storage: '#FFD700', psu: '#FF4757', case: '#80CBC4', cooler: '#81D4FA',
  monitor: '#F48FB1', peripherals: '#A5D6A7',
}

const SORT_OPTIONS = [
  { value: 'discount_desc', label: 'Reducere maximă' },
  { value: 'price_asc',     label: 'Preț: mic → mare' },
  { value: 'price_desc',    label: 'Preț: mare → mic' },
  { value: 'newest',        label: 'Cele mai noi' },
]

export default function Promotii() {
  const { user, isAuthenticated } = useAuthStore()
  const { setCart } = useCartStore()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('discount_desc')
  const [activeCategory, setActiveCategory] = useState('all')
  const [cartLoading, setCartLoading] = useState(new Set())
  const [cartAdded, setCartAdded] = useState(new Set())

  useEffect(() => {
    setLoading(true)
    Promise.all([
      productsAPI.getAll({ sort_by: 'discount_desc', limit: 500 }),
      productsAPI.getCategories(),
    ]).then(([prodsRes, catsRes]) => {
      const prods = prodsRes.data.products.filter(
        p => p.old_price && parseFloat(p.old_price) > parseFloat(p.price)
      )
      setProducts(prods)
      setCategories(catsRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const discountedCategorySlugs = useMemo(() => {
    const slugs = new Set(products.map(p => p.category_slug).filter(Boolean))
    return slugs
  }, [products])

  const filteredProducts = useMemo(() => {
    let list = activeCategory === 'all'
      ? [...products]
      : products.filter(p => p.category_slug === activeCategory || p.category === activeCategory)

    if (sortBy === 'discount_desc') {
      list.sort((a, b) => {
        const dA = (parseFloat(a.old_price) - parseFloat(a.price)) / parseFloat(a.old_price)
        const dB = (parseFloat(b.old_price) - parseFloat(b.price)) / parseFloat(b.old_price)
        return dB - dA
      })
    } else if (sortBy === 'price_asc') {
      list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
    }

    return list
  }, [products, sortBy, activeCategory])

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

  const totalSavings = useMemo(() => {
    return filteredProducts.reduce((sum, p) => {
      return sum + (parseFloat(p.old_price) - parseFloat(p.price))
    }, 0)
  }, [filteredProducts])

  const maxDiscount = useMemo(() => {
    if (!filteredProducts.length) return 0
    return Math.max(...filteredProducts.map(p =>
      Math.round((1 - parseFloat(p.price) / parseFloat(p.old_price)) * 100)
    ))
  }, [filteredProducts])

  const availableCats = categories.filter(c =>
    discountedCategorySlugs.has(c.slug)
  )

  return (
    <div className="flex flex-col gap-8">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl px-10 py-14 text-center"
           style={{ background: 'linear-gradient(135deg, #1a0505 0%, #2d0a0a 40%, #1a0505 100%)',
                    border: '1px solid rgba(255,71,87,0.3)' }}>
        <div className="absolute -top-16 -right-16 w-[360px] h-[360px] rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(255,71,87,0.2) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-12 -left-12 w-72 h-72 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(255,140,0,0.15) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
               style={{ background: 'linear-gradient(135deg, #FF4757, #FF6B35)',
                        boxShadow: '0 8px 32px rgba(255,71,87,0.4)' }}>
            <Fire size={30} weight="fill" color="#fff" />
          </div>
          <h1 className="font-display font-black text-[46px] leading-[1.1] tracking-[-1.5px] mb-3 m-0">
            <span className="text-primary">Promoții </span>
            <span style={{ background: 'linear-gradient(135deg, #FF4757, #FF8C00)',
                           WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              exclusive
            </span>
          </h1>
          <p className="text-secondary text-lg max-w-[480px] mx-auto mb-8 leading-relaxed">
            Cele mai mari reduceri la componente PC. Stocuri limitate — profită acum!
          </p>

          <div className="flex gap-6 justify-center flex-wrap">
            {[
              { val: `${filteredProducts.length}`, lbl: 'Produse în promoție', color: '#FF4757' },
              { val: `${maxDiscount}%`,             lbl: 'Reducere maximă',     color: '#FF8C00' },
              { val: `${Math.round(totalSavings)} RON`, lbl: 'Total economii disponibile', color: '#00E5A0' },
            ].map(s => (
              <div key={s.lbl} className="rounded-xl px-6 py-4 text-center"
                   style={{ background: `${s.color}12`, border: `1px solid ${s.color}30` }}>
                <div className="font-mono font-black text-2xl mb-1" style={{ color: s.color }}>{s.val}</div>
                <div className="text-muted text-xs">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className="text-sm font-semibold px-4 py-2 rounded-lg border transition-all duration-150 cursor-pointer"
            style={{
              background: activeCategory === 'all' ? 'rgba(255,71,87,0.2)' : 'rgba(255,255,255,0.04)',
              borderColor: activeCategory === 'all' ? 'rgba(255,71,87,0.5)' : 'rgba(255,255,255,0.1)',
              color: activeCategory === 'all' ? '#FF4757' : '#8B9EBA',
            }}
          >
            Toate ({products.length})
          </button>
          {availableCats.map(c => {
            const count = products.filter(p => p.category_slug === c.slug || p.category === c.slug).length
            const color = categoryColors[c.slug] || '#8B9EBA'
            const active = activeCategory === c.slug
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.slug)}
                className="text-sm font-semibold px-4 py-2 rounded-lg border transition-all duration-150 cursor-pointer"
                style={{
                  background: active ? `${color}20` : 'rgba(255,255,255,0.04)',
                  borderColor: active ? `${color}50` : 'rgba(255,255,255,0.1)',
                  color: active ? color : '#8B9EBA',
                }}
              >
                {c.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <SortAscending size={16} className="text-muted" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 cursor-pointer"
            style={{
              background: '#0B1726',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#EEF2F7',
              outline: 'none',
            }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <CircleNotch size={32} weight="bold" className="text-accent animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <Tag size={48} weight="duotone" className="mb-4 mx-auto block opacity-30" />
          <p>Nu există produse în promoție în această categorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          {filteredProducts.map(p => {
            const catSlug = p.category_slug || ''
            const catColor = categoryColors[catSlug] || '#8B9EBA'
            const CatIcon = categoryIconMap[catSlug] || Package
            const pct = Math.round((1 - parseFloat(p.price) / parseFloat(p.old_price)) * 100)
            const savings = (parseFloat(p.old_price) - parseFloat(p.price)).toFixed(0)

            return (
              <Link key={p.id} to={`/product/${p.id}`} className="no-underline">
                <div className="product-card flex flex-col h-full p-[18px] relative">
                  {/* Discount badge */}
                  <div className="absolute top-3 left-3 z-10 text-white font-black text-[12px] px-2.5 py-1 rounded-lg"
                       style={{ background: 'linear-gradient(135deg, #FF4757, #FF6B35)',
                                boxShadow: '0 4px 12px rgba(255,71,87,0.4)' }}>
                    -{pct}%
                  </div>

                  <div className="product-img-bg rounded-xl h-[160px] flex items-center justify-center mb-4 overflow-hidden"
                       style={{ border: `1px solid ${catColor}22` }}>
                    {p.image_url
                      ? <ProductImg src={p.image_url} alt={p.name} className="w-full h-full object-contain" iconSize={44} />
                      : <CatIcon size={44} weight="duotone" style={{ color: catColor }} />
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

                    <div className="mb-3 border-t border-default pt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-extrabold text-xl" style={{ color: '#FF4757' }}>
                          {parseFloat(p.price).toFixed(0)} RON
                        </span>
                        <span className="font-mono text-muted line-through text-[13px]">
                          {parseFloat(p.old_price).toFixed(0)} RON
                        </span>
                      </div>
                      <div className="text-[12px] font-semibold" style={{ color: '#00E5A0' }}>
                        Economisești {savings} RON
                      </div>
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
                                     : 'cursor-pointer text-white hover:-translate-y-0.5'
                                 }`}
                      style={
                        !cartAdded.has(p.id) && p.stock > 0
                          ? { background: 'linear-gradient(135deg, #FF4757, #FF6B35)',
                              boxShadow: '0 4px 16px rgba(255,71,87,0.35)' }
                          : {}
                      }
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
      )}
    </div>
  )
}
