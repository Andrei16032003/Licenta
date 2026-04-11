import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { configuratorAPI, cartAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import useBuildStore from '../store/buildStore'
import {
  Cpu, Circuitry, Memory, Monitor, Lightning, Package, HardDrive, Thermometer,
  Check, X, CircleNotch, ShoppingCart, MagnifyingGlass, Wrench,
} from '@phosphor-icons/react'

const BUILD_SLOTS = [
  { key: 'cpu',         label: 'Procesor',      Icon: Cpu },
  { key: 'gpu',         label: 'Placa video',    Icon: Monitor },
  { key: 'motherboard', label: 'Placa de baza',  Icon: Circuitry },
  { key: 'ram',         label: 'Memorie RAM',    Icon: Memory },
  { key: 'psu',         label: 'Sursa',          Icon: Lightning },
  { key: 'case',        label: 'Carcasa',        Icon: Package },
  { key: 'storage',     label: 'Stocare',        Icon: HardDrive },
  { key: 'cooler',      label: 'Cooler',         Icon: Thermometer },
]

export default function PCBuilderSidebar() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { setCart } = useCartStore()
  const { components, removeComponent, clear } = useBuildStore()

  const [compatibility, setCompatibility] = useState(null)
  const [checking, setChecking] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartAdded, setCartAdded] = useState(false)

  const filledCount = Object.keys(components).length
  const total = Object.values(components).reduce((s, p) => s + parseFloat(p.price || 0), 0)

  // Verifica compatibilitatea componentelor selectate prin API
  const handleCheck = async () => {
    if (filledCount === 0) return
    setChecking(true)
    setCompatibility(null)
    try {
      const ids = {}
      Object.entries(components).forEach(([k, p]) => { ids[k] = p.id })
      const res = await configuratorAPI.check({ name: 'PC Build', components: ids })
      setCompatibility(res.data)
    } catch {
      setCompatibility({ is_compatible: false, warnings: ['Eroare la verificare.'] })
    } finally { setChecking(false) }
  }

  // Adauga toate componentele din build in cos in paralel, apoi sincronizeaza store-ul
  const handleAddAllToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (filledCount === 0) return
    setCartLoading(true)
    try {
      await Promise.all(
        Object.values(components).map(p =>
          cartAPI.add({ user_id: user.id, product_id: p.id, quantity: 1 })
        )
      )
      const cartRes = await cartAPI.get(user.id)
      setCart(cartRes.data)
      setCartAdded(true)
      setTimeout(() => setCartAdded(false), 3000)
    } catch { /* silent */ }
    finally { setCartLoading(false) }
  }

  const compat = compatibility

  return (
    <div className="sticky top-[88px] bg-surface border border-accent/20 rounded-2xl p-4 shadow-card">
      {/* Header */}
      <div className="flex justify-between items-center mb-3.5">
        <div>
          <h3 className="text-primary font-bold text-[15px] mb-0.5 flex items-center gap-1.5">
            <Wrench size={15} weight="bold" className="text-accent" /> PC Builder
          </h3>
          <span className="text-muted text-[11px]">{filledCount}/{BUILD_SLOTS.length} componente</span>
        </div>
        {filledCount > 0 && (
          <button
            onClick={() => { clear(); setCompatibility(null); setCartAdded(false) }}
            className="text-muted hover:text-danger transition-colors bg-transparent border-none cursor-pointer text-xs flex items-center gap-1"
          >
            <X size={12} /> Goleste
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden mb-3.5">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${(filledCount / BUILD_SLOTS.length) * 100}%` }}
        />
      </div>

      {/* Slot list */}
      <div className="flex flex-col gap-[5px] mb-3.5">
        {BUILD_SLOTS.map(slot => {
          const comp = components[slot.key]
          return (
            <div
              key={slot.key}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg min-h-[38px] ${comp ? 'bg-accent-dim border border-accent/15' : 'bg-base-2/30 border border-default'}`}
            >
              <slot.Icon size={12} className={comp ? 'text-accent' : 'text-muted/50'} />
              <div className="flex-1 min-w-0">
                {comp ? (
                  <>
                    <div className="flex-1 min-w-0 text-primary text-[11px] font-semibold truncate">{comp.name}</div>
                    <div className="text-price text-[10px] font-mono">{comp.price} RON</div>
                  </>
                ) : (
                  <span className="flex-1 text-muted/50 text-[11px]">{slot.label}</span>
                )}
              </div>
              {comp && (
                <button
                  onClick={() => { removeComponent(slot.key); setCompatibility(null) }}
                  className="text-muted hover:text-danger transition-colors bg-transparent border-none cursor-pointer p-0 shrink-0"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Total */}
      {filledCount > 0 && (
        <div className="border-t border-default pt-2.5 mb-2.5 flex justify-between items-center">
          <span className="text-muted text-sm">Total</span>
          <span className="text-price font-mono font-bold text-base">{total.toFixed(2)} RON</span>
        </div>
      )}

      {/* Compatibility result */}
      {compat && (
        <div className={`rounded-lg px-3 py-2.5 mb-2.5 border ${compat.is_compatible ? 'bg-success/[0.06] border-success/20' : 'bg-danger/[0.06] border-danger/20'}`}>
          <div className={`font-bold text-xs flex items-center gap-1 ${compat.is_compatible ? 'text-success' : 'text-danger'} ${compat.warnings?.length ? 'mb-1.5' : ''}`}>
            {compat.is_compatible ? <Check size={11} /> : <X size={11} />}
            {compat.is_compatible ? 'Compatibil!' : 'Incompatibil'}
          </div>
          {compat.warnings?.map((w, i) => (
            <div key={i} className="text-danger/80 text-[11px] mt-1 leading-relaxed">• {w}</div>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-[7px]">
        {filledCount > 0 ? (
          <button
            onClick={handleCheck}
            disabled={checking}
            className="w-full btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
          >
            {checking ? <CircleNotch size={13} className="animate-spin" /> : <MagnifyingGlass size={13} />}
            {checking ? 'Verific...' : 'Verifica compatibilitate'}
          </button>
        ) : (
          <button disabled className="w-full bg-base-2 border border-default text-muted text-xs py-2 rounded-lg cursor-not-allowed">
            Verifica compatibilitate
          </button>
        )}

        {filledCount > 0 ? (
          cartAdded ? (
            <button
              disabled
              className="w-full bg-success/15 text-success border border-success/30 text-xs py-2 rounded-lg flex items-center justify-center gap-1.5"
            >
              <Check size={13} /> Adăugat în coș!
            </button>
          ) : (
            <button
              onClick={handleAddAllToCart}
              disabled={cartLoading}
              className="w-full btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
            >
              {cartLoading ? <CircleNotch size={13} className="animate-spin" /> : <ShoppingCart size={13} />}
              {cartLoading ? 'Se adauga...' : 'Adauga tot in cos'}
            </button>
          )
        ) : (
          <button disabled className="w-full bg-base-2 border border-default text-muted text-xs py-2 rounded-lg cursor-not-allowed">
            Adauga tot in cos
          </button>
        )}
      </div>

      {filledCount === 0 && (
        <p className="text-muted/50 text-[11px] text-center mt-3 leading-relaxed">
          Apasă pe un produs din catalog pentru a-l adăuga
        </p>
      )}
    </div>
  )
}
