import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { chatAPI } from '../services/api'
import {
  Cpu, HardDrive, Monitor, Keyboard, Mouse, Headphones,
  Lightning, Wind, Memory, Package, CircleNotch,
  Funnel, X, MagnifyingGlass,
} from '@phosphor-icons/react'

const CAT_META = {
  cpu:         { Icon: Cpu,          color: '#38bdf8' },
  gpu:         { Icon: Monitor,      color: '#a78bfa' },
  ram:         { Icon: Memory, color: '#00e5a0' },
  motherboard: { Icon: Memory, color: '#fb923c' },
  storage:     { Icon: HardDrive,    color: '#f59e0b' },
  psu:         { Icon: Lightning,    color: '#f87171' },
  case:        { Icon: Package,      color: '#94a3b8' },
  cooler:      { Icon: Wind,         color: '#38bdf8' },
  monitor:     { Icon: Monitor,      color: '#00e5a0' },
  mouse:       { Icon: Mouse,        color: '#a78bfa' },
  keyboard:    { Icon: Keyboard,     color: '#fb923c' },
  headset:     { Icon: Headphones,   color: '#f59e0b' },
}

export default function Search() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCat = searchParams.get('cat') || ''

  const [categories, setCategories]     = useState([])
  const [filters, setFilters]           = useState({})
  const [selectedFilters, setSelected]  = useState({})
  const [products, setProducts]         = useState([])
  const [catsLoading, setCatsLoading]   = useState(true)
  const [filtersLoading, setFilLoad]    = useState(false)
  const [loading, setLoading]           = useState(false)
  const [expandedKey, setExpandedKey]   = useState(null)

  useEffect(() => {
    chatAPI.categories()
      .then(r => setCategories(Array.isArray(r.data) ? r.data : []))
      .finally(() => setCatsLoading(false))
  }, [])

  const doSearch = useCallback(async (cat, fil) => {
    if (!cat) return
    setLoading(true)
    try {
      const r = await chatAPI.search({ category_slug: cat, filters: fil, limit: 40 })
      setProducts(Array.isArray(r.data) ? r.data : [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedCat) { setFilters({}); setProducts([]); setSelected({}); return }
    setFilLoad(true)
    setSelected({})
    setExpandedKey(null)
    chatAPI.filters(selectedCat)
      .then(r => { setFilters(r.data || {}); setFilLoad(false) })
      .catch(() => setFilLoad(false))
    doSearch(selectedCat, {})
  }, [selectedCat, doSearch])

  const toggleFilter = (key, val) => {
    setSelected(prev => {
      const next = { ...prev }
      if (next[key] === val) delete next[key]
      else next[key] = val
      doSearch(selectedCat, next)
      return next
    })
    setExpandedKey(null)
  }

  const clearFilters = () => {
    setSelected({})
    doSearch(selectedCat, {})
  }

  const catName  = categories.find(c => c.slug === selectedCat)?.name || ''
  const catMeta  = CAT_META[selectedCat] || { Icon: Package, color: '#94a3b8' }
  const activeN  = Object.keys(selectedFilters).length

  return (
    <div className="min-h-screen bg-base text-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Caută produse</h1>
          <p className="text-muted text-[13px] mt-1">Alege o categorie, aplică filtre și găsește produsul dorit.</p>
        </div>

        {/* Category chips */}
        {catsLoading ? (
          <div className="flex items-center gap-2 text-muted mb-6">
            <CircleNotch size={15} className="animate-spin" /> Se încarcă categoriile...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(c => {
              const { Icon, color } = CAT_META[c.slug] || { Icon: Package, color: '#94a3b8' }
              const active = selectedCat === c.slug
              return (
                <button key={c.slug}
                        onClick={() => setSearchParams(active ? {} : { cat: c.slug })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[13px]
                                   font-semibold transition-all cursor-pointer
                                   ${active
                                     ? 'border-accent/50 bg-accent/10 text-accent'
                                     : 'border-white/10 bg-white/[0.04] text-secondary hover:border-white/25 hover:bg-white/[0.07] hover:text-primary'
                                   }`}>
                  <Icon size={14} style={{ color: active ? undefined : color }} />
                  {c.name}
                  {active && <X size={11} className="ml-0.5" />}
                </button>
              )
            })}
          </div>
        )}

        {/* No category selected */}
        {!selectedCat && !catsLoading && (
          <div className="flex flex-col items-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20
                            flex items-center justify-center">
              <Funnel size={28} className="text-accent/60" />
            </div>
            <p className="text-secondary text-[15px] font-medium">Selectează o categorie pentru a începe</p>
            <p className="text-muted text-[13px]">Vei putea filtra produsele după specificații exacte.</p>
          </div>
        )}

        {/* Category selected: filters + products */}
        {selectedCat && (
          <div className="flex gap-6 items-start">

            {/* ── Filters sidebar ── */}
            <aside className="w-52 shrink-0 sticky top-4">
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
                {/* Sidebar header */}
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Funnel size={13} className="text-accent" />
                    <span className="text-primary text-[13px] font-semibold">Filtre</span>
                    {activeN > 0 && (
                      <span className="w-4 h-4 rounded-full bg-accent text-base text-[10px]
                                       font-bold flex items-center justify-center">{activeN}</span>
                    )}
                  </div>
                  {activeN > 0 && (
                    <button onClick={clearFilters}
                            className="text-muted text-[11px] hover:text-primary cursor-pointer transition-colors">
                      Resetează
                    </button>
                  )}
                </div>

                {/* Filter keys */}
                <div className="max-h-[70vh] overflow-y-auto">
                  {filtersLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <CircleNotch size={18} className="animate-spin text-accent" />
                    </div>
                  ) : Object.keys(filters).length === 0 ? (
                    <p className="text-muted text-[12px] px-4 py-4">Niciun filtru disponibil.</p>
                  ) : (
                    Object.entries(filters).map(([key, vals], idx, arr) => {
                      const sel      = selectedFilters[key]
                      const isOpen   = expandedKey === key
                      const isLast   = idx === arr.length - 1
                      return (
                        <div key={key} className={!isLast ? 'border-b border-white/[0.05]' : ''}>
                          <button
                            onClick={() => setExpandedKey(isOpen ? null : key)}
                            className="w-full flex items-center justify-between px-4 py-2.5
                                       cursor-pointer hover:bg-white/[0.04] transition-colors">
                            <span className="text-secondary text-[12px]">{key.replace(/_/g, ' ')}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {sel && (
                                <span className="px-1.5 py-0.5 rounded-full bg-accent/20 border border-accent/40
                                                 text-accent text-[10px] font-semibold max-w-[70px] truncate">{sel}</span>
                              )}
                              <span className={`text-muted text-[11px] transition-transform inline-block
                                               ${isOpen ? 'rotate-90' : ''}`}>›</span>
                            </div>
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                              {vals.map(val => {
                                const isSel = selectedFilters[key] === String(val)
                                return (
                                  <button key={val}
                                          onClick={() => toggleFilter(key, String(val))}
                                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold
                                                     border cursor-pointer transition-all
                                                     ${isSel
                                                       ? 'bg-accent/20 border-accent/50 text-accent'
                                                       : 'bg-white/[0.04] border-white/15 text-secondary hover:border-white/30 hover:text-primary'
                                                     }`}>
                                    {String(val)}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </aside>

            {/* ── Products main ── */}
            <main className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: `${catMeta.color}15`, border: `1px solid ${catMeta.color}30` }}>
                    <catMeta.Icon size={17} style={{ color: catMeta.color }} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-primary leading-tight">{catName}</h2>
                    <p className="text-muted text-[12px]">
                      {loading ? 'Se caută...' : `${products.length} produs${products.length !== 1 ? 'e' : ''}`}
                    </p>
                  </div>
                </div>
                {/* Active filter chips */}
                {activeN > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(selectedFilters).map(([k, v]) => (
                      <span key={k}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full
                                       bg-accent/15 border border-accent/30 text-accent text-[11px]">
                        {k.replace(/_/g, ' ')}: <strong>{v}</strong>
                        <button onClick={() => toggleFilter(k, v)}
                                className="hover:text-white cursor-pointer ml-0.5 leading-none">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Products grid */}
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <CircleNotch size={26} className="animate-spin text-accent" />
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                  <MagnifyingGlass size={44} className="text-muted/20" />
                  <p className="text-secondary text-[14px] font-medium">Niciun produs conform selecției</p>
                  {activeN > 0 && (
                    <button onClick={clearFilters}
                            className="text-accent text-[13px] hover:underline cursor-pointer mt-1">
                      Resetează filtrele
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {products.map(p => {
                    const hasDisc    = p.discount_percent > 0
                    const finalPrice = hasDisc
                      ? (p.price * (1 - p.discount_percent / 100)).toFixed(0)
                      : p.price
                    return (
                      <button key={p.id}
                              onClick={() => navigate(`/product/${p.id}`)}
                              className="group bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3
                                         text-left cursor-pointer transition-all flex flex-col gap-2.5
                                         hover:border-accent/25 hover:bg-white/[0.07]">
                        {p.image
                          ? <img src={p.image} alt={p.name}
                                 className="w-full h-28 object-contain rounded-xl bg-white/5" />
                          : <div className="w-full h-28 rounded-xl bg-white/5 flex items-center justify-center">
                              <Package size={28} className="text-muted/20" />
                            </div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-primary text-[12px] font-semibold leading-snug line-clamp-2">{p.name}</p>
                          {p.brand && <p className="text-muted text-[11px] mt-0.5">{p.brand}</p>}
                        </div>
                        <div className="flex items-end justify-between gap-1">
                          <div>
                            <span className="text-accent font-mono font-bold text-[14px]">{finalPrice} RON</span>
                            {hasDisc && (
                              <span className="text-muted text-[10px] line-through ml-1">{p.price} RON</span>
                            )}
                          </div>
                          {hasDisc && (
                            <span className="px-1.5 py-0.5 rounded-lg bg-success/20 border border-success/30
                                             text-success text-[10px] font-bold shrink-0">
                              -{p.discount_percent}%
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  )
}
