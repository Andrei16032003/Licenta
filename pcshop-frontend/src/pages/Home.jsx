import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { productsAPI, wishlistAPI, cartAPI } from '../services/api'
import { imgUrl } from '../utils/imgUrl'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import useCompareStore from '../store/compareStore'
import useBuildStore from '../store/buildStore'
import PCBuilderSidebar from '../components/PCBuilderSidebar'
import {
  Cpu, Monitor, Memory, Circuitry, HardDrive, Lightning,
  Package, Thermometer, Mouse, Desktop,
  ShoppingCart, Heart, Scales, Check, CircleNotch, Warning,
  SlidersHorizontal, MagnifyingGlass, X, Funnel,
} from '@phosphor-icons/react'

const PAGE_SIZE = 20
const BUILD_SLOT_KEYS = new Set(['cpu', 'gpu', 'motherboard', 'ram', 'psu', 'case', 'storage', 'cooler'])

const categoryIconMap = {
  cpu: Cpu, gpu: Monitor, ram: Memory, motherboard: Circuitry,
  storage: HardDrive, psu: Lightning, case: Package,
  cooler: Thermometer, monitor: Desktop, peripherals: Mouse,
}
const categoryColors = {
  cpu: '#0EF6FF', gpu: '#A78BFA', ram: '#00E5A0', motherboard: '#FF8C00',
  storage: '#FFD700', psu: '#FF4757', case: '#80CBC4', cooler: '#81D4FA',
  monitor: '#F48FB1', peripherals: '#A5D6A7',
}

export default function Home() {
  const { user, isAuthenticated } = useAuthStore()
  const { setCart } = useCartStore()
  const { items: compareItems, categorySlug: compareCategory, add: addToCompare, remove: removeFromCompare } = useCompareStore()
  const { components: buildComponents, addComponent: addToBuild } = useBuildStore()

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [allProducts, setAllProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [inStock, setInStock] = useState(false)
  const [selectedBrands, setSelectedBrands] = useState([])
  const [selectedSpecs, setSelectedSpecs] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const [wishlistLoading, setWishlistLoading] = useState(new Set())
  const [cartLoading, setCartLoading] = useState(new Set())
  const [cartAdded, setCartAdded] = useState(new Set())

  // Derived
  const brands = useMemo(() =>
    [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort()
  , [allProducts])

  const [categoryFilters, setCategoryFilters] = useState([])

  const filteredProducts = useMemo(() => {
    let products = allProducts
    if (selectedBrands.length > 0) {
      products = products.filter(p => selectedBrands.includes(p.brand))
    }
    const specEntries = Object.entries(selectedSpecs).filter(([, vals]) => vals.length > 0)
    if (specEntries.length > 0) {
      products = products.filter(p => {
        if (!p.specs) return false
        return specEntries.every(([key, vals]) => {
          const productVal = p.specs[key]
          if (productVal === null || productVal === undefined) return false
          return vals.includes(String(productVal))
        })
      })
    }
    return products
  }, [allProducts, selectedBrands, selectedSpecs])

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE)
  const pagedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    const cat = searchParams.get('category')
    const q = searchParams.get('search')
    loadCategories()
    setSelectedBrands([])
    setSelectedSpecs({})
    setCurrentPage(1)
    setSearch(q || '')
    if (cat) {
      setSelectedCategory(cat)
      doLoad({ category: cat, search: q || undefined })
    } else {
      setSelectedCategory('')
      doLoad({ search: q || undefined })
    }
  }, [searchParams])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      wishlistAPI.get(user.id).then(res => {
        setWishlistIds(new Set(res.data.map(i => i.product_id)))
      }).catch(() => {})
    }
  }, [isAuthenticated, user?.id])

  const doLoad = async (params) => {
    setLoading(true)
    try {
      const res = await productsAPI.getAll({ limit: 500, ...params })
      setAllProducts(res.data.products)
      setCurrentPage(1)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const loadCategories = async () => {
    try { const res = await productsAPI.getCategories(); setCategories(res.data) }
    catch (err) { console.error(err) }
  }

  useEffect(() => {
    if (!selectedCategory) { setCategoryFilters([]); return }
    productsAPI.getFilters(selectedCategory)
      .then(res => setCategoryFilters(res.data))
      .catch(() => setCategoryFilters([]))
  }, [selectedCategory])

  const handleFilter = () => {
    setSelectedBrands([])
    setSelectedSpecs({})
    setCurrentPage(1)
    doLoad({
      search: search.trim() || undefined,
      category: selectedCategory || undefined,
      min_price: minPrice || undefined,
      max_price: maxPrice || undefined,
      sort_by: sortBy || undefined,
      in_stock: inStock || undefined,
    })
  }

  const handleReset = () => {
    setSearch(''); setSelectedCategory(''); setMinPrice(''); setMaxPrice('')
    setSortBy(''); setInStock(false); setSelectedBrands([]); setSelectedSpecs({}); setCurrentPage(1)
    doLoad({})
  }

  const handleCategoryClick = (slug) => {
    setSelectedCategory(slug)
    setSearch(''); setMinPrice(''); setMaxPrice('')
    setSelectedBrands([]); setSelectedSpecs({}); setCurrentPage(1)
    doLoad({ category: slug, sort_by: sortBy || undefined, in_stock: inStock || undefined })
  }

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    setCurrentPage(1)
    doLoad({
      search: search.trim() || undefined,
      category: selectedCategory || undefined,
      min_price: minPrice || undefined,
      max_price: maxPrice || undefined,
      sort_by: newSort || undefined,
      in_stock: inStock || undefined,
    })
  }

  const handleInStockToggle = () => {
    const newVal = !inStock
    setInStock(newVal)
    setCurrentPage(1)
    doLoad({
      search: search.trim() || undefined,
      category: selectedCategory || undefined,
      min_price: minPrice || undefined,
      max_price: maxPrice || undefined,
      sort_by: sortBy || undefined,
      in_stock: newVal || undefined,
    })
  }

  const toggleBrand = (brand) => {
    setCurrentPage(1)
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const toggleSpec = (key, val) => {
    setCurrentPage(1)
    setSelectedSpecs(prev => {
      const current = prev[key] || []
      const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val]
      if (next.length === 0) {
        const { [key]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [key]: next }
    })
  }

  const clearSpecs = () => { setSelectedSpecs({}); setCurrentPage(1) }

  const handleAddToCart = async (e, product) => {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) { navigate('/login'); return }
    setCartLoading(s => new Set([...s, product.id]))
    try {
      await cartAPI.add({ user_id: user.id, product_id: product.id, quantity: 1 })
      const cartRes = await cartAPI.get(user.id)
      setCart(cartRes.data)
      setCartAdded(s => new Set([...s, product.id]))
      setTimeout(() => setCartAdded(s => { const n = new Set(s); n.delete(product.id); return n }), 2000)
    } catch (err) { console.error(err) }
    finally { setCartLoading(s => { const n = new Set(s); n.delete(product.id); return n }) }
  }

  const toggleWishlist = async (e, productId) => {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) return
    setWishlistLoading(s => new Set([...s, productId]))
    try {
      if (wishlistIds.has(productId)) {
        await wishlistAPI.remove(user.id, productId)
        setWishlistIds(s => { const n = new Set(s); n.delete(productId); return n })
      } else {
        await wishlistAPI.add({ user_id: user.id, product_id: productId })
        setWishlistIds(s => new Set([...s, productId]))
      }
    } catch (err) { console.error(err) }
    finally { setWishlistLoading(s => { const n = new Set(s); n.delete(productId); return n }) }
  }

  const handleCompare = (e, product) => {
    e.preventDefault(); e.stopPropagation()
    if (compareItems.find(p => p.id === product.id)) {
      removeFromCompare(product.id)
    } else if (!compareCategory || product.category_slug === compareCategory) {
      addToCompare(product)
    }
  }

  const handleAddToBuild = (e, product) => {
    e.preventDefault(); e.stopPropagation()
    const slot = product.category_slug || categories.find(c => c.name === product.category)?.slug
    if (slot && BUILD_SLOT_KEYS.has(slot)) addToBuild(slot, product)
  }

  const getBadge = (p) => {
    if (p.stock === 0) return { text: 'Epuizat', bg: 'rgba(100,100,110,0.92)' }
    if (p.stock <= 3) return { text: 'Stoc limitat', bg: 'rgba(230,110,0,0.92)' }
    if (p.old_price && p.old_price > p.price) {
      const pct = Math.round((1 - p.price / p.old_price) * 100)
      return { text: `-${pct}%`, bg: 'rgba(220,38,38,0.92)' }
    }
    return null
  }

  const getPageNumbers = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages = [1]
    if (current > 3) pages.push('…')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
    if (current < total - 2) pages.push('…')
    pages.push(total)
    return pages
  }

  const DISPLAY_LABELS = { 'true': 'Da', 'false': 'Nu', 'air': 'Aer', 'aio': 'Lichid (AIO)' }
  const hasSidebar = !!(selectedCategory && (brands.length > 1 || categoryFilters.length > 0))
  const activeFilterCount = selectedBrands.length + Object.keys(selectedSpecs).length

  return (
    <div>
      {/* HERO */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: '20px', padding: '64px 48px',
        marginBottom: '20px', textAlign: 'center',
        background: 'linear-gradient(135deg, #0D1B3E 0%, #0A1628 50%, #0D1B3E 100%)',
        border: '1px solid rgba(14,246,255,0.2)',
        boxShadow: '0 0 80px rgba(14,246,255,0.12)',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '340px', height: '340px', background: 'radial-gradient(circle, rgba(14,246,255,0.13) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '8%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(0,229,160,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-[20px] mb-6"
          style={{ background: 'linear-gradient(135deg, #0EF6FF33, #0EF6FF)', boxShadow: '0 12px 36px rgba(14,246,255,0.45)' }}>
          <Lightning size={34} weight="fill" className="text-dark" />
        </div>
        <h1 className="font-display text-[52px] font-extrabold m-0 mb-4 leading-[1.1] tracking-tight">
          <span className="text-primary">Construieste PC-ul </span>
          <span style={{ background: 'linear-gradient(135deg, #0EF6FF, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>perfect</span>
        </h1>
        <p className="text-secondary text-[19px] max-w-[520px] mx-auto mb-10 leading-[1.7]">
          Cele mai bune componente PC la cele mai bune prețuri din România
        </p>
        <div className="grid grid-cols-4 gap-4 justify-center">
          {[
            { value: allProducts.length + '+', label: 'Produse', Icon: Package, color: '#0EF6FF' },
            { value: '100%', label: 'Garantie', Icon: Check, color: '#00E5A0' },
            { value: '24/7', Label: 'Suport', Icon: Warning, color: '#A78BFA' },
            { value: '500+', label: 'Clienti', Icon: Desktop, color: '#FF8C00' },
          ].map(stat => (
            <div key={stat.label || stat.Label} style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${stat.color}25`,
              borderRadius: '16px', padding: '18px 28px', textAlign: 'center',
              minWidth: '110px',
            }}>
              <stat.Icon size={20} style={{ color: stat.color, marginBottom: '6px', display: 'block', margin: '0 auto 6px' }} />
              <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color, lineHeight: '1' }}>{stat.value}</div>
              <div className="text-muted text-[13px] mt-[5px]">{stat.label || stat.Label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORY PILLS */}
      <div className="flex gap-[10px] flex-wrap mb-6 px-5 py-[18px] bg-surface rounded-2xl border border-default">
        <button
          onClick={handleReset}
          className={`px-[22px] py-[10px] rounded-3xl text-[15px] font-semibold cursor-pointer transition-all border ${
            selectedCategory === ''
              ? 'bg-accent-dim border-accent text-accent'
              : 'bg-base-2 border-default text-secondary hover:text-primary hover:border-accent/30'
          }`}
        >
          Toate
        </button>
        {categories.map(c => {
          const cc = categoryColors[c.slug] || '#0EF6FF'
          const CatIcon = categoryIconMap[c.slug] || Package
          const isActive = selectedCategory === c.slug
          return (
            <button
              key={c.id}
              onClick={() => handleCategoryClick(c.slug)}
              className="px-[22px] py-[10px] rounded-3xl text-[15px] cursor-pointer transition-all border flex items-center gap-2"
              style={{
                background: isActive ? `${cc}22` : undefined,
                color: isActive ? cc : undefined,
                borderColor: isActive ? `${cc}60` : undefined,
                fontWeight: isActive ? '700' : '500',
                boxShadow: isActive ? `0 4px 14px ${cc}25` : 'none',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = '' } }}
            >
              <CatIcon size={16} weight={isActive ? 'fill' : 'regular'} />
              {c.name}
            </button>
          )
        })}
      </div>

      <div>

      {/* FILTERS */}
      <div className="bg-surface border border-default rounded-xl p-5 mb-[14px] flex flex-wrap gap-[14px] items-end" style={{ backdropFilter: 'blur(10px)' }}>
        <div className="flex-1 min-w-[180px]">
          <label className="text-muted text-[13px] block mb-[6px]">Cauta produs</label>
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              className="input-field w-full pl-9"
              placeholder="ex: Ryzen, RTX, Samsung..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFilter()}
            />
          </div>
        </div>
        <div>
          <label className="text-muted text-[13px] block mb-[6px]">Categorie</label>
          <select
            className="bg-base-2 border border-default text-primary rounded-xl px-3 py-2 outline-none text-sm cursor-pointer"
            value={selectedCategory}
            onChange={e => { setSelectedCategory(e.target.value); doLoad({ search: search.trim() || undefined, category: e.target.value || undefined, min_price: minPrice || undefined, max_price: maxPrice || undefined, sort_by: sortBy || undefined, in_stock: inStock || undefined }) }}>
            <option value="" style={{ background: '#0A0E1A' }}>Toate categoriile</option>
            {categories.map(c => <option key={c.id} value={c.slug} style={{ background: '#0A0E1A' }}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-muted text-[13px] block mb-[6px]">Pret min</label>
          <input
            type="number"
            className="input-field w-[100px]"
            placeholder="0"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="text-muted text-[13px] block mb-[6px]">Pret max</label>
          <input
            type="number"
            className="input-field w-[100px]"
            placeholder="99999"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="text-muted text-[13px] block mb-[6px]">Sorteaza</label>
          <select
            className="bg-base-2 border border-default text-primary rounded-xl px-3 py-2 outline-none text-sm cursor-pointer"
            value={sortBy}
            onChange={e => handleSortChange(e.target.value)}>
            <option value="" style={{ background: '#0A0E1A' }}>Cele mai noi</option>
            <option value="price_asc" style={{ background: '#0A0E1A' }}>Pret crescator</option>
            <option value="price_desc" style={{ background: '#0A0E1A' }}>Pret descrescator</option>
            <option value="name_asc" style={{ background: '#0A0E1A' }}>Nume A-Z</option>
          </select>
        </div>
        <div className="flex flex-col gap-[6px]">
          <label className="text-muted text-[13px]">Disponibilitate</label>
          <button
            onClick={handleInStockToggle}
            className={`flex items-center gap-2 px-[14px] py-[9px] rounded-lg text-[13px] font-semibold cursor-pointer transition-all border whitespace-nowrap ${
              inStock
                ? 'bg-success/15 border-success/40 text-success'
                : 'bg-base-2 border-default text-secondary hover:text-primary'
            }`}
          >
            {inStock ? <Check size={14} weight="bold" /> : null}
            Doar in stoc
          </button>
        </div>
        <button
          onClick={handleFilter}
          className="btn-primary flex items-center gap-2"
        >
          <Funnel size={16} />
          Filtreaza
        </button>
        <button
          onClick={handleReset}
          className="bg-base-2 border border-default text-secondary hover:text-primary px-7 py-[11px] rounded-lg text-[15px] cursor-pointer transition-all flex items-center gap-2"
        >
          <X size={16} />
          Reset
        </button>
      </div>

      {/* SIDEBAR + MAIN LAYOUT */}
      <div className="flex gap-5 items-start">

            {/* SIDEBAR */}
            {hasSidebar && (
              <div className="w-[220px] shrink-0 sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto">

                {/* Clear all */}
                {activeFilterCount > 0 && (
                  <div className="bg-surface border border-default rounded-xl p-[10px_14px] mb-[14px] flex justify-between items-center">
                    <span className="text-accent text-[13px] font-semibold">{activeFilterCount} filtre active</span>
                    <button
                      onClick={() => { setSelectedBrands([]); clearSpecs() }}
                      className="bg-transparent border-none text-danger cursor-pointer text-[12px] font-semibold flex items-center gap-1 hover:opacity-80"
                    >
                      <X size={12} />
                      Sterge tot
                    </button>
                  </div>
                )}

                {/* Brand */}
                {brands.length > 1 && (
                  <div className="bg-surface border border-default rounded-xl p-4 mb-[14px]">
                    <div className="flex justify-between items-center mb-[10px]">
                      <span className="text-muted text-[12px] font-bold uppercase tracking-[0.8px]">Brand</span>
                      {selectedBrands.length > 0 && (
                        <button
                          onClick={() => setSelectedBrands([])}
                          className="bg-transparent border-none text-muted cursor-pointer text-[11px] flex items-center gap-1 hover:text-secondary"
                        >
                          <X size={10} /> sterge
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {brands.map(b => {
                        const active = selectedBrands.includes(b)
                        return (
                          <label
                            key={b}
                            onClick={() => toggleBrand(b)}
                            className={`flex items-center gap-2 cursor-pointer px-2 py-[5px] rounded-lg transition-all ${active ? 'bg-accent-dim' : 'hover:bg-white/5'}`}
                          >
                            <div className={`w-4 h-4 rounded shrink-0 transition-all flex items-center justify-center ${active ? 'bg-accent border-2 border-accent' : 'border-2 border-white/20 bg-transparent'}`}>
                              {active && <Check size={10} weight="bold" className="text-dark" />}
                            </div>
                            <span className={`text-[13px] ${active ? 'text-accent font-semibold' : 'text-secondary'}`}>{b}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Spec filters */}
                {categoryFilters.map(({ key, label, values }) => {
                  const activeVals = selectedSpecs[key] || []
                  return (
                    <div key={key} className="bg-surface border border-default rounded-xl p-4 mb-[14px]">
                      <div className="flex justify-between items-center mb-[10px]">
                        <span className="text-muted text-[12px] font-bold uppercase tracking-[0.8px]">{label}</span>
                        {activeVals.length > 0 && (
                          <button
                            onClick={() => { setCurrentPage(1); setSelectedSpecs(prev => { const { [key]: _, ...rest } = prev; return rest }) }}
                            className="bg-transparent border-none text-muted cursor-pointer text-[11px] flex items-center gap-1 hover:text-secondary"
                          >
                            <X size={10} /> sterge
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {values.map(val => {
                          const active = activeVals.includes(val)
                          const displayVal = DISPLAY_LABELS[val] || val
                          return (
                            <label
                              key={val}
                              onClick={() => toggleSpec(key, val)}
                              className={`flex items-center gap-2 cursor-pointer px-2 py-[5px] rounded-lg transition-all ${active ? 'bg-accent-dim' : 'hover:bg-white/5'}`}
                            >
                              <div className={`w-4 h-4 rounded shrink-0 transition-all flex items-center justify-center ${active ? 'bg-accent border-2 border-accent' : 'border-2 border-white/20 bg-transparent'}`}>
                                {active && <Check size={10} weight="bold" className="text-dark" />}
                              </div>
                              <span className={`text-[13px] ${active ? 'text-accent font-semibold' : 'text-secondary'}`}>{displayVal}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* MAIN CONTENT */}
            <div className="flex-1 min-w-0">

              {/* RESULTS INFO */}
              <div className="flex justify-between items-center mb-[18px]">
                <p className="text-muted text-[14px]">
                  {loading ? 'Se incarca...' : `${filteredProducts.length} produse`}
                  {selectedCategory && categories.find(c => c.slug === selectedCategory) && (
                    <span className="text-accent ml-[6px]">in {categories.find(c => c.slug === selectedCategory)?.name}</span>
                  )}
                  {search && <span className="text-accent ml-[6px]">pentru "{search}"</span>}
                  {selectedBrands.length > 0 && <span className="text-[#A78BFA] ml-[6px]">· {selectedBrands.join(', ')}</span>}
                  {Object.keys(selectedSpecs).length > 0 && <span className="text-[#FFD700] ml-[6px]">· {Object.keys(selectedSpecs).length} filtre spec</span>}
                </p>
                {totalPages > 1 && (
                  <p className="text-muted text-[12px]">Pagina {currentPage} din {totalPages}</p>
                )}
              </div>

              {/* PRODUCTS */}
              {loading ? (
                <div className="text-center py-20">
                  <CircleNotch size={32} className="animate-spin text-accent mx-auto block" />
                  <p className="text-muted mt-4 text-lg">Se incarca produsele...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-[60px] bg-surface rounded-2xl border border-default">
                  <MagnifyingGlass size={48} className="text-muted mx-auto mb-3" />
                  <p className="text-secondary text-[18px] mb-5">Nu s-au gasit produse</p>
                  <button onClick={handleReset} className="btn-primary">
                    Reseteaza filtrele
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-5 gap-4">
            {pagedProducts.map(p => {
              const catSlug = p.category_slug || categories.find(c => c.name === p.category)?.slug
              const catColor = categoryColors[catSlug] || '#0EF6FF'
              const CatIcon = categoryIconMap[catSlug] || Desktop
              const inWishlist = wishlistIds.has(p.id)
              const wLoading = wishlistLoading.has(p.id)
              const badge = getBadge(p)
              const isComparing = !!compareItems.find(c => c.id === p.id)
              const wrongCategory = !isComparing && compareCategory && (p.category_slug || p.category) !== compareCategory
              const isAdded = cartAdded.has(p.id)
              const isCartLoading = cartLoading.has(p.id)
              return (
                <Link key={p.id} to={`/product/${p.id}`} className="no-underline block h-full">
                  <div
                    className="product-card p-[18px] h-full relative"
                    style={{
                      boxShadow: isComparing ? `0 0 0 2px ${catColor}, 0 8px 32px ${catColor}40` : undefined,
                      border: isComparing ? `1px solid ${catColor}` : undefined,
                      transform: hoveredCard === p.id ? 'translateY(-6px)' : 'translateY(0)',
                      transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={() => setHoveredCard(p.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Wishlist */}
                    {isAuthenticated && (
                      <button
                        onClick={e => toggleWishlist(e, p.id)}
                        disabled={wLoading}
                        className={`absolute top-3 right-3 w-[30px] h-[30px] rounded-lg flex items-center justify-center cursor-pointer transition-all z-[2] border hover:scale-110 ${
                          inWishlist
                            ? 'bg-red-500/15 border-red-500/40'
                            : 'bg-white/7 border-white/12'
                        } ${wLoading ? 'opacity-50' : ''}`}
                      >
                        <Heart
                          size={14}
                          weight={inWishlist ? 'fill' : 'regular'}
                          className={inWishlist ? 'text-red-400' : 'text-muted'}
                        />
                      </button>
                    )}

                    {/* Image */}
                    <div className="product-img-bg rounded-xl h-[170px] flex items-center justify-center mb-4 overflow-hidden" style={{ border: `1px solid ${catColor}22` }}>
                      {badge && (
                        <div
                          className="absolute top-2 left-2 z-[2] text-white px-[9px] py-[3px] rounded-md text-[11px] font-bold"
                          style={{ background: badge.bg, backdropFilter: 'blur(4px)' }}
                        >
                          {badge.text}
                        </div>
                      )}
                      {p.image_url ? (
                        <img src={imgUrl(p.image_url)} alt={p.name} />
                      ) : (
                        <>
                          <CatIcon size={44} style={{ color: catColor }} />
                          <span className="text-[10px] font-extrabold tracking-[2px] opacity-70" style={{ color: catColor }}>
                            {(catSlug || 'PC').toUpperCase()}
                          </span>
                        </>
                      )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div className="text-[12px] font-bold mb-[6px] uppercase tracking-[1px]" style={{ color: catColor }}>
                        {p.category}
                      </div>
                      <h3 className="text-primary text-[15px] font-semibold mb-[5px] leading-[1.45] flex-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.name}
                      </h3>
                      <p className="text-muted text-[13px]" style={{ marginBottom: p.review_count > 0 ? '8px' : '14px' }}>{p.brand}</p>
                      {p.review_count > 0 && (
                        <div className="flex items-center gap-[5px] mb-3">
                          <div className="flex gap-px">
                            {[1,2,3,4,5].map(s => (
                              <span key={s} className="text-[11px]" style={{ color: s <= Math.round(p.average_rating) ? '#FFD700' : '#374151' }}>★</span>
                            ))}
                          </div>
                          <span className="text-[#FFD700] font-bold text-[12px]">{p.average_rating.toFixed(1)}</span>
                          <span className="text-muted text-[11px]">({p.review_count})</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t border-white/[0.06] pt-3">
                        <div>
                          <span className="font-mono font-extrabold text-xl text-price">{p.price} RON</span>
                          {p.old_price && (
                            <span className="font-mono text-muted line-through text-sm ml-[6px]">{p.old_price}</span>
                          )}
                        </div>
                        <span className={`text-[12px] px-3 py-[5px] rounded-[20px] font-semibold border ${
                          p.stock > 0
                            ? 'bg-success/10 text-success border-success/30'
                            : 'bg-danger/10 text-danger border-danger/30'
                        }`}>
                          {p.stock > 0 ? 'Stoc' : 'Epuizat'}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-[6px] mt-[10px]">
                        <button
                          onClick={e => handleAddToCart(e, p)}
                          disabled={p.stock === 0 || isCartLoading}
                          className={`flex-1 flex items-center justify-center gap-2 py-[10px] px-2 rounded-lg font-semibold text-[13px] transition-all border-none ${
                            isAdded
                              ? 'bg-success/80 text-dark cursor-pointer'
                              : p.stock === 0
                              ? 'bg-white/5 text-muted cursor-not-allowed'
                              : 'bg-accent text-dark cursor-pointer hover:opacity-90'
                          } ${isCartLoading ? 'opacity-70' : ''}`}
                        >
                          {isCartLoading
                            ? <CircleNotch size={14} className="animate-spin" />
                            : isAdded
                            ? <><Check size={14} weight="bold" /> Adaugat!</>
                            : p.stock === 0
                            ? 'Epuizat'
                            : <><ShoppingCart size={14} weight="bold" /> Cos</>
                          }
                        </button>
                        <button
                          onClick={e => handleCompare(e, p)}
                          title={isComparing ? 'Elimina din comparare' : wrongCategory ? `Doar produse din aceeasi categorie` : compareItems.length >= 3 ? 'Maxim 3 produse' : 'Adauga la comparare'}
                          disabled={!isComparing && (compareItems.length >= 3 || wrongCategory)}
                          className={`w-[38px] shrink-0 rounded-lg flex items-center justify-center transition-all border ${
                            isComparing
                              ? 'bg-accent-dim border-accent text-accent cursor-pointer'
                              : wrongCategory
                              ? 'bg-orange-500/8 border-orange-500/30 text-muted cursor-not-allowed opacity-40'
                              : 'bg-white/5 border-white/12 text-secondary cursor-pointer hover:text-primary'
                          } ${(!isComparing && (compareItems.length >= 3 || wrongCategory)) ? 'opacity-40' : ''}`}
                        >
                          <Scales size={16} />
                        </button>
                        {catSlug && BUILD_SLOT_KEYS.has(catSlug) && (
                          <button
                            onClick={e => handleAddToBuild(e, p)}
                            title={buildComponents[catSlug]?.id === p.id ? 'In PC Build' : `Adauga la PC Build`}
                            className={`w-[38px] shrink-0 rounded-lg flex items-center justify-center transition-all border cursor-pointer ${
                              buildComponents[catSlug]?.id === p.id
                                ? 'bg-[#FFD700]/15 border-[#FFD700]/50 text-[#FFD700]'
                                : 'bg-white/5 border-white/12 text-secondary hover:text-primary'
                            }`}
                          >
                            <Lightning size={16} weight={buildComponents[catSlug]?.id === p.id ? 'fill' : 'regular'} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 justify-center mt-6 flex-wrap py-5 bg-surface rounded-2xl border border-default">
              <button
                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0) }}
                disabled={currentPage === 1}
                className={`bg-surface border border-default px-[18px] py-[10px] rounded-[10px] text-[14px] font-semibold ${currentPage === 1 ? 'text-muted cursor-not-allowed' : 'text-secondary hover:text-primary cursor-pointer'}`}
              >
                Prev
              </button>
              {getPageNumbers(currentPage, totalPages).map((page, i) =>
                page === '…' ? (
                  <span key={`ellipsis-${i}`} className="text-muted px-[6px] py-[10px] text-[14px]">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => { setCurrentPage(page); window.scrollTo(0, 0) }}
                    className={`px-4 py-2 rounded-lg text-[14px] min-w-[42px] cursor-pointer border ${
                      currentPage === page
                        ? 'bg-accent text-dark font-bold border-transparent'
                        : 'bg-surface border-default text-secondary hover:text-primary'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0) }}
                disabled={currentPage === totalPages}
                className={`bg-surface border border-default px-[18px] py-[10px] rounded-[10px] text-[14px] font-semibold ${currentPage === totalPages ? 'text-muted cursor-not-allowed' : 'text-secondary hover:text-primary cursor-pointer'}`}
              >
                Next
              </button>
            </div>
          )}
                </>
              )}

            </div> {/* /main content */}
          </div> {/* /flex container */}

      </div>

    </div>
  )
}
