import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { productsAPI, configuratorAPI, cartAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import {
  Cpu, Circuitry, Memory, Monitor, Lightning, Package, HardDrive, Thermometer,
  Check, Warning, X, CircleNotch, ShoppingCart, MagnifyingGlass, ClipboardText, Wrench,
} from '@phosphor-icons/react'

const SLOTS = [
  { key: 'cpu',         label: 'Procesor',      Icon: Cpu,         color: '#42A5F5' },
  { key: 'gpu',         label: 'Placa video',    Icon: Monitor,     color: '#CE93D8' },
  { key: 'motherboard', label: 'Placa de baza',  Icon: Circuitry,   color: '#FF9800' },
  { key: 'ram',         label: 'Memorie RAM',    Icon: Memory,      color: '#00E676' },
  { key: 'psu',         label: 'Sursa',          Icon: Lightning,   color: '#FF5252' },
  { key: 'case',        label: 'Carcasa',        Icon: Package,     color: '#80CBC4' },
  { key: 'storage',     label: 'Stocare',        Icon: HardDrive,   color: '#FFD700' },
  { key: 'cooler',      label: 'Cooler',         Icon: Thermometer, color: '#81D4FA' },
]

// Filtreaza produsele dintr-o categorie in functie de componentele deja selectate si stoc
function getCompatible(category, allProds, sel) {
  const all = allProds[category] || []
  // Considera doar produsele in stoc pentru lista compatibila
  const inStock = all.filter(p => (p.stock || 0) > 0)

  const safe = (arr, fn) => {
    const f = arr.filter(fn)
    return f.length > 0 ? f : arr   // fallback la arr daca nu exista match
  }

  if (category === 'cpu') {
    let result = [...inStock]
    // Filtreaza dupa socket-ul placii de baza selectate
    if (sel.motherboard?.specs?.socket) {
      const f = result.filter(p => p.specs?.socket === sel.motherboard.specs.socket)
      if (f.length > 0) result = f
    }
    return result
  }

  if (category === 'motherboard') {
    const FORM_RANK = { ITX: 1, MINIITX: 1, MATX: 2, MICROATX: 2, ATX: 3, EATX: 4 }
    const normFF = s => String(s || '').toUpperCase().replace(/[-\s]/g, '')
    let result = [...inStock]
    // Filtreaza dupa socket CPU
    if (sel.cpu?.specs?.socket) {
      const f = result.filter(p => p.specs?.socket === sel.cpu.specs.socket)
      if (f.length > 0) result = f
    }
    // Filtreaza dupa form factor carcasa (MB trebuie sa incapa in carcasa aleasa)
    if (sel.case?.specs?.form_factor) {
      const caseRank = FORM_RANK[normFF(sel.case.specs.form_factor)] || 0
      if (caseRank) {
        const f = result.filter(p => {
          const mbRank = FORM_RANK[normFF(p.specs?.form_factor)] || 0
          return mbRank <= caseRank
        })
        if (f.length > 0) result = f
      }
    }
    return result
  }

  if (category === 'ram') {
    // Filtreaza dupa tipul de memorie: prioritate MB, fallback CPU
    const memType = sel.motherboard?.specs?.memory_type || sel.cpu?.specs?.memory_type
    if (memType) {
      return safe(inStock, p =>
        String(p.specs?.type || '').toLowerCase() === String(memType).toLowerCase()
      )
    }
  }

  if (category === 'cooler') {
    let result = [...inStock]
    // Filtreaza dupa socket CPU (foloseste campuri booleane: socket_am4, socket_am5, socket_lga1700)
    if (sel.cpu?.specs?.socket) {
      const socketKey = `socket_${String(sel.cpu.specs.socket).toLowerCase()}`
      const f = result.filter(p => p.specs?.[socketKey] === true)
      if (f.length > 0) result = f
    }
    // Filtreaza dupa inaltimea maxima permisa de carcasa
    if (sel.case?.specs?.max_cooler_height_mm) {
      const maxH = Number(sel.case.specs.max_cooler_height_mm)
      const f = result.filter(p => !p.specs?.height_mm || Number(p.specs.height_mm) <= maxH)
      if (f.length > 0) result = f
    }
    // Filtreaza AIO dupa dimensiunea maxima a radiatorului suportata de carcasa
    if (sel.case?.specs?.max_radiator_mm) {
      const maxR = Number(sel.case.specs.max_radiator_mm)
      const f = result.filter(p => !p.specs?.radiator_mm || Number(p.specs.radiator_mm) <= maxR)
      if (f.length > 0) result = f
    }
    return result
  }

  if (category === 'case') {
    const FORM_RANK = { ITX: 1, MINIITX: 1, MATX: 2, MICROATX: 2, ATX: 3, EATX: 4 }
    const normFF = s => String(s || '').toUpperCase().replace(/[-\s]/g, '')

    let result = [...inStock]
    // Carcasa trebuie sa aiba rank >= rank placa de baza (ATX MB → numai carcase ATX/E-ATX)
    if (sel.motherboard?.specs?.form_factor) {
      const mbRank = FORM_RANK[normFF(sel.motherboard.specs.form_factor)] || 0
      if (mbRank) {
        const f = result.filter(p => {
          const caseRank = FORM_RANK[normFF(p.specs?.form_factor)] || 0
          return caseRank >= mbRank
        })
        if (f.length > 0) result = f
      }
    }
    if (sel.gpu?.specs?.length_mm) {
      const f = result.filter(p =>
        !p.specs?.max_gpu_length_mm ||
        Number(p.specs.max_gpu_length_mm) >= Number(sel.gpu.specs.length_mm)
      )
      if (f.length > 0) result = f
    }
    if (sel.cooler?.specs?.height_mm) {
      const f = result.filter(p =>
        !p.specs?.max_cooler_height_mm ||
        Number(p.specs.max_cooler_height_mm) >= Number(sel.cooler.specs.height_mm)
      )
      if (f.length > 0) result = f
    }
    if (sel.cooler?.specs?.radiator_mm) {
      const f = result.filter(p =>
        !p.specs?.max_radiator_mm ||
        Number(p.specs.max_radiator_mm) >= Number(sel.cooler.specs.radiator_mm)
      )
      if (f.length > 0) result = f
    }
    return result
  }

  if (category === 'gpu') {
    let result = [...inStock]
    // Filtreaza dupa lungimea maxima permisa de carcasa
    if (sel.case?.specs?.max_gpu_length_mm) {
      const maxLen = Number(sel.case.specs.max_gpu_length_mm)
      const f = result.filter(p => !p.specs?.length_mm || Number(p.specs.length_mm) <= maxLen)
      if (f.length > 0) result = f
    }
    return result
  }

  if (category === 'psu') {
    const need = (Number(sel.cpu?.specs?.tdp || 0) + Number(sel.gpu?.specs?.power_w || 0) + 50) * 1.2
    if (need > 50) {
      return safe(inStock, p => !p.specs?.wattage || Number(p.specs.wattage) >= need)
    }
  }

  return inStock
}

export default function PCBuilder() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { setCart } = useCartStore()

  const [allProducts, setAllProducts] = useState({})
  const [loadingProds, setLoadingProds] = useState(true)
  const [selected, setSelected] = useState({})

  const [compatibility, setCompatibility] = useState(null)
  const [checking, setChecking] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartAdded, setCartAdded] = useState(false)
  const [showRules, setShowRules] = useState(false)

  // Incarca produsele pentru toate sloturile in paralel la montarea componentei
  useEffect(() => {
    const load = async () => {
      setLoadingProds(true)
      const results = await Promise.allSettled(
        SLOTS.map(slot => productsAPI.getAll({ category: slot.key, limit: 200 }))
      )
      const data = {}
      results.forEach((result, i) => {
        data[SLOTS[i].key] = result.status === 'fulfilled'
          ? (result.value.data.products || []).sort((a, b) => a.price - b.price)
          : []
      })
      setAllProducts(data)
      setLoadingProds(false)
    }
    load()
  }, [])

  const handleSelect = (key, productId) => {
    setCompatibility(null)
    setCartAdded(false)
    if (!productId) {
      const next = { ...selected }
      delete next[key]
      setSelected(next)
    } else {
      const product = (allProducts[key] || []).find(p => p.id === productId)
      if (product) setSelected(prev => ({ ...prev, [key]: product }))
    }
  }

  // Trimite componentele selectate la API pentru verificare compatibilitate
  const handleCheck = async () => {
    const count = Object.keys(selected).length
    if (count === 0) return
    setChecking(true)
    setCompatibility(null)
    try {
      const ids = {}
      Object.entries(selected).forEach(([k, p]) => { ids[k] = p.id })
      const res = await configuratorAPI.check({ name: 'PC Build', components: ids })
      setCompatibility(res.data)
    } catch {
      setCompatibility({ is_compatible: false, warnings: ['Eroare la verificare.'] })
    } finally { setChecking(false) }
  }

  // Adauga toate componentele selectate in cos in paralel, apoi sincronizeaza store-ul
  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    const count = Object.keys(selected).length
    if (count === 0) return
    setCartLoading(true)
    try {
      await Promise.all(
        Object.values(selected).map(p =>
          cartAPI.add({ user_id: user.id, product_id: p.id, quantity: 1 })
        )
      )
      const cartRes = await cartAPI.get(user.id)
      setCart(cartRes.data)
      setCartAdded(true)
    } catch { /* silent */ }
    finally { setCartLoading(false) }
  }

  const filledCount = Object.keys(selected).length
  const total = Object.values(selected).reduce((s, p) => s + parseFloat(p.price || 0), 0)

  const RULES = [
    { Icon: Cpu,         label: 'Socket CPU ↔ Placa de baza',   color: '#42A5F5', text: 'Socket-ul procesorului trebuie sa fie identic cu socket-ul placii de baza (ex. LGA1700, AM4, AM5).' },
    { Icon: Memory,      label: 'Tip RAM ↔ Placa de baza',       color: '#00E676', text: 'Tipul memoriei RAM (DDR4 sau DDR5) trebuie sa coincida cu ce suporta placa de baza.' },
    { Icon: Thermometer, label: 'Cooler ↔ Socket CPU',           color: '#81D4FA', text: 'Cooler-ul trebuie sa fie compatibil cu socket-ul CPU-ului (LGA1700, AM4, AM5).' },
    { Icon: Lightning,   label: 'Sursa ↔ Consum total',          color: '#FFD700', text: 'Puterea sursei trebuie sa fie ≥ (TDP CPU + Consum GPU + 50W) × 1.2 pentru siguranta.' },
    { Icon: Package,     label: 'Form factor MB ↔ Carcasa',      color: '#80CBC4', text: 'Placa de baza trebuie sa incapa in carcasa. mATX si ITX intra in carcase ATX; ITX intra si in mATX.' },
    { Icon: Monitor,     label: 'Lungime GPU ↔ Carcasa',         color: '#CE93D8', text: 'Lungimea placii video (mm) trebuie sa fie mai mica decat spatiul maxim permis de carcasa.' },
    { Icon: Thermometer, label: 'Inaltime Cooler ↔ Carcasa',     color: '#FF9800', text: 'Inaltimea cooler-ului (mm) trebuie sa se incadreze in spatiul disponibil in carcasa.' },
    { Icon: Cpu,         label: 'TDP Cooler ≥ TDP CPU',          color: '#FF5252', text: 'Cooler-ul trebuie sa aiba un rating TDP egal sau mai mare decat TDP-ul procesorului.' },
    { Icon: HardDrive,   label: 'Radiator AIO ↔ Carcasa',        color: '#4FC3F7', text: 'Marimea radiatorului AIO (120/240/360mm) trebuie sa fie suportata de carcasa.' },
    { Icon: Memory,      label: 'Capacitate RAM ↔ Max MB',       color: '#00E676', text: 'Capacitatea totala a RAM-ului nu poate depasi memoria maxima acceptata de placa de baza.' },
    { Icon: HardDrive,   label: 'SSD M.2 ↔ Sloturi MB',         color: '#FFD700', text: 'Daca alegi un SSD M.2, placa de baza trebuie sa aiba cel putin un slot M.2 disponibil.' },
  ]

  const stats = [
    { Icon: Wrench,  value: '8',      label: 'Componente',      color: '#42A5F5' },
    { Icon: Check,   value: '11',     label: 'Reguli verificate', color: '#00E676' },
    { Icon: Cpu,     value: 'Auto',   label: 'Filtrare socket',  color: '#FF9800' },
    { Icon: Memory,  value: 'DDR4/5', label: 'Compatibil RAM',   color: '#CE93D8' },
  ]

  return (
    <div style={{ maxWidth: '1500px', margin: '0 auto' }}>

      {/* Rules Modal */}
      {showRules && (
        <div
          className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => setShowRules(false)}
        >
          <div
            className="bg-base-1 border border-accent/25 rounded-2xl p-8 max-w-[680px] w-full max-h-[88vh] overflow-y-auto shadow-elevated"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="section-chip mb-2 inline-block">
                  <Wrench size={11} className="inline mr-1" /> PC Builder
                </div>
                <h2 className="text-primary font-extrabold text-xl m-0">Reguli de compatibilitate</h2>
                <p className="text-muted text-[12px] mt-1 mb-0">{RULES.length} reguli verificate automat la fiecare build</p>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="bg-base-2 border border-default text-muted rounded-lg px-3 py-1.5 cursor-pointer text-lg leading-none hover:text-danger hover:border-danger/30 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Rules list */}
            <div className="flex flex-col gap-2">
              {RULES.map((rule, i) => (
                <div
                  key={i}
                  className="bg-surface border border-default rounded-xl px-5 py-4 flex gap-3.5 items-start"
                >
                  <div
                    className="w-[38px] h-[38px] shrink-0 rounded-[10px] flex items-center justify-center"
                    style={{ background: `${rule.color}15`, border: `1px solid ${rule.color}30` }}
                  >
                    <rule.Icon size={18} style={{ color: rule.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md"
                        style={{ background: `${rule.color}20`, color: rule.color }}
                      >
                        R{i + 1}
                      </span>
                      <span className="text-primary font-bold text-[13px]">{rule.label}</span>
                    </div>
                    <p className="text-muted text-[12px] leading-relaxed m-0">{rule.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-5 bg-accent-dim border border-accent/20 rounded-xl px-4 py-3 text-secondary text-sm flex items-center gap-2.5">
              <Check size={18} className="text-success shrink-0" />
              <p className="text-secondary text-[12px] leading-relaxed m-0">
                Dropdown-urile din PC Builder se filtreaza <strong className="text-accent">automat</strong> in timp real
                pentru a afisa doar componentele compatibile cu ce ai ales deja.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0D1B3E 0%, #0A1628 50%, #0D1B3E 100%)',
        borderRadius: '20px', padding: '56px 48px',
        marginBottom: '20px', textAlign: 'center',
        border: '1px solid rgba(66,165,245,0.2)',
        boxShadow: '0 0 80px rgba(41,121,255,0.12)',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '340px', height: '340px', background: 'radial-gradient(circle, rgba(66,165,245,0.13) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(206,147,216,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '6%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(0,230,118,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-6 shadow-glow-cyan mx-auto">
          <Wrench size={34} weight="bold" className="text-dark" />
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '800', margin: '0 0 16px', letterSpacing: '-1px' }}>
          <span className="text-primary">Construieste-ti </span>
          <span style={{ background: 'linear-gradient(135deg, var(--cyan), var(--violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PC-ul ideal</span>
        </h1>
        <p className="text-secondary" style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.7' }}>
          Selecteaza componentele — dropdown-urile se filtreaza automat pentru compatibilitate maxima
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-surface rounded-2xl p-5 text-center"
            style={{ border: `1px solid ${s.color}25` }}
          >
            <div
              className="inline-flex items-center justify-center w-[46px] h-[46px] rounded-[13px] mb-2.5"
              style={{ background: `${s.color}18`, border: `1px solid ${s.color}35` }}
            >
              <s.Icon size={22} style={{ color: s.color }} />
            </div>
            <div className="font-extrabold text-[26px] leading-none" style={{ color: s.color }}>{s.value}</div>
            <div className="text-muted text-[13px] mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 460px', gap: '32px', alignItems: 'start' }}>

        {/* LEFT: component slots */}
        <div>
          {loadingProds && (
            <div className="text-center py-10 text-muted">
              <CircleNotch size={20} className="animate-spin inline mr-2" />
              Se incarca produsele...
            </div>
          )}

          <div className="grid grid-cols-2 gap-[22px]">
            {SLOTS.map(slot => {
              const compatible = getCompatible(slot.key, allProducts, selected)
              const all = allProducts[slot.key] || []
              const isFiltered = compatible.length > 0 && compatible.length < all.length
              const current = selected[slot.key]

              return (
                <div
                  key={slot.key}
                  style={{
                    background: current
                      ? `linear-gradient(135deg, ${slot.color}14 0%, rgba(10,14,26,0) 100%)`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${current ? slot.color + '40' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '18px', padding: '28px',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Slot header */}
                  <div className="flex items-center gap-3 mb-3.5">
                    <div
                      className="w-[54px] h-[54px] shrink-0 rounded-[14px] flex items-center justify-center"
                      style={{
                        background: current ? `${slot.color}20` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${current ? slot.color + '50' : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      <slot.Icon
                        size={26}
                        style={{ color: current ? slot.color : undefined }}
                        className={current ? '' : 'text-muted'}
                        weight={current ? 'bold' : 'duotone'}
                      />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold text-[17px] ${current ? 'text-primary' : 'text-secondary'}`}>
                        {slot.label}
                      </div>
                      {isFiltered && (
                        <div
                          className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-lg mt-0.5"
                          style={{
                            background: `${slot.color}20`,
                            border: `1px solid ${slot.color}50`,
                            color: slot.color,
                          }}
                        >
                          <Check size={11} className="inline mr-0.5" /> {compatible.length} compatibile
                        </div>
                      )}
                    </div>
                    {current && (
                      <button
                        onClick={() => handleSelect(slot.key, null)}
                        className="text-muted hover:text-danger transition-colors bg-transparent border-none cursor-pointer p-0.5 shrink-0 text-base"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  <select
                    className="input-field cursor-pointer"
                    value={current?.id || ''}
                    onChange={e => handleSelect(slot.key, e.target.value || null)}
                    disabled={loadingProds}
                    style={{ borderColor: `${slot.color}50` }}
                  >
                    <option value="" style={{ background: '#0A0E1A' }}>
                      {loadingProds ? 'Se incarca...' : `— Alege ${slot.label} —`}
                    </option>
                    {compatible.map(p => (
                      <option key={p.id} value={p.id} style={{ background: '#0A0E1A' }}>
                        {p.name} — {p.price} RON
                      </option>
                    ))}
                    {/* Produse incompatibile sau fara stoc — afisate gri la finalul listei */}
                    {isFiltered && (() => {
                      const incompatible = all.filter(p => !compatible.find(c => c.id === p.id))
                      return incompatible.length > 0 ? (
                        <>
                          <option disabled style={{ background: '#0A0E1A', color: '#374151' }}>
                            ── Incompatibile / Stoc 0 ({incompatible.length}) ──
                          </option>
                          {incompatible.map(p => {
                            const noStock = (p.stock || 0) === 0
                            return (
                              <option key={p.id} value={p.id} style={{ background: '#0A0E1A', color: '#4B5563' }}>
                                {noStock ? '✕' : '⚠'} {p.name} — {p.price} RON{noStock ? ' (Stoc 0)' : ''}
                              </option>
                            )
                          })}
                        </>
                      ) : null
                    })()}
                  </select>

                  {/* Selected product info */}
                  {current && (
                    <div
                      className="bg-black/20 rounded-xl p-3 mt-3 flex justify-between items-center"
                      style={{ border: `1px solid ${slot.color}25` }}
                    >
                      <div>
                        <div className="text-secondary text-[12px] mb-0.5">{current.brand}</div>
                        <div className="text-primary text-sm font-semibold max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {current.name}
                        </div>
                      </div>
                      <div className="font-bold text-base shrink-0" style={{ color: slot.color }}>
                        {current.price} RON
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT: summary panel */}
        <div className="sticky top-[88px] bg-surface border border-accent/20 rounded-2xl p-7 shadow-glow-cyan/[0.06]">
          {/* Panel header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-dim border border-accent flex items-center justify-center shrink-0">
              <ClipboardText size={20} weight="bold" className="text-accent" />
            </div>
            <div>
              <h3 className="text-primary font-bold text-[17px] m-0">Sumar build</h3>
              <p className="text-muted text-[13px] m-0">{filledCount}/{SLOTS.length} componente selectate</p>
            </div>
          </div>
          <div className="border-t border-default mb-4" />

          {/* Progress bar */}
          <div className="h-[4px] bg-white/[0.06] rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${(filledCount / SLOTS.length) * 100}%` }}
            />
          </div>

          {/* Component list */}
          <div className="flex flex-col gap-2 mb-4">
            {SLOTS.map(slot => {
              const comp = selected[slot.key]
              return (
                <div
                  key={slot.key}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${comp ? 'bg-accent-dim border border-accent/15' : 'bg-base-2/50 border border-default'}`}
                >
                  <slot.Icon size={15} className={comp ? 'text-accent' : 'text-muted'} />
                  <div className="flex-1 min-w-0">
                    {comp ? (
                      <div className="text-primary text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                        {comp.name}
                      </div>
                    ) : (
                      <span className="text-muted text-[13px]">{slot.label}</span>
                    )}
                  </div>
                  {comp && (
                    <span className="text-price font-semibold text-sm shrink-0">{comp.price} RON</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Total */}
          {filledCount > 0 && (
            <div className="border-t border-default pt-3 mb-3 flex justify-between items-center">
              <span className="text-secondary font-semibold">Total</span>
              <span className="text-price font-mono font-extrabold text-2xl">{total.toFixed(2)} RON</span>
            </div>
          )}

          {/* Compatibility result */}
          {compatibility && (
            <div className={`rounded-xl p-3 mb-3 border ${compatibility.is_compatible ? 'bg-success/[0.07] border-success/25' : 'bg-danger/[0.07] border-danger/25'}`}>
              <div className={`flex items-center gap-1.5 font-bold text-sm ${compatibility.is_compatible ? 'text-success' : 'text-danger'} ${compatibility.warnings?.length ? 'mb-2' : ''}`}>
                {compatibility.is_compatible ? <Check size={13} /> : <X size={13} />}
                {compatibility.is_compatible ? 'Configuratie compatibila!' : 'Incompatibilitati detectate'}
              </div>
              {compatibility.warnings?.map((w, i) => (
                <div key={i} className="text-danger/80 text-[11px] leading-relaxed mt-1 pl-3 border-l-2 border-danger/40">
                  {w}
                </div>
              ))}
              {compatibility.is_compatible && compatibility.total_price && (
                <div className="text-muted text-[11px] mt-1.5">
                  Total: {compatibility.total_price} RON
                  {compatibility.total_power_needed && ` · ${compatibility.total_power_needed}W consum`}
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            {filledCount > 0 ? (
              <button
                onClick={handleCheck}
                disabled={checking}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
              >
                {checking ? <CircleNotch size={16} className="animate-spin" /> : <MagnifyingGlass size={16} />}
                {checking ? 'Se verifica...' : 'Verifica compatibilitate'}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3.5 flex items-center justify-center gap-2 bg-base-2 border border-default text-muted rounded-xl cursor-not-allowed text-sm font-semibold"
              >
                <MagnifyingGlass size={16} />
                Verifica compatibilitate
              </button>
            )}

            {filledCount > 0 ? (
              <button
                onClick={handleAddToCart}
                disabled={cartLoading || cartAdded}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {cartLoading
                  ? <><CircleNotch size={16} className="animate-spin" /> Se adauga...</>
                  : cartAdded
                    ? <><Check size={16} /> Adăugat în coș!</>
                    : <><ShoppingCart size={16} /> Adauga tot in cos</>
                }
              </button>
            ) : (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 bg-base-2 border border-default text-muted rounded-xl cursor-not-allowed text-sm font-semibold py-3.5"
              >
                <ShoppingCart size={16} />
                Adauga tot in cos
              </button>
            )}

            {filledCount > 0 && (
              <button
                onClick={() => { setSelected({}); setCompatibility(null); setCartAdded(false) }}
                className="w-full border border-default text-muted hover:border-danger/30 hover:text-danger rounded-lg py-2 text-xs transition-colors bg-transparent cursor-pointer"
              >
                <X size={13} className="inline mr-1" />
                Goleste build
              </button>
            )}
          </div>

          {filledCount === 0 && (
            <p className="text-muted text-[11px] text-center mt-3 leading-relaxed">
              Selecteaza componentele din stanga.<br />
              Dropdown-urile se filtreaza automat<br />
              pentru a-ti arata doar optiunile<br />
              compatibile cu ce ai ales deja.
            </p>
          )}

          {/* Compatibility Rules button */}
          <div className="mt-3 border-t border-default pt-3">
            <button
              onClick={() => setShowRules(true)}
              className="w-full btn-outline flex items-center justify-center gap-2 text-xs"
            >
              <ClipboardText size={13} />
              Reguli de compatibilitate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
