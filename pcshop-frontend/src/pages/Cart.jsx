import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Trash, Plus, Minus, ArrowRight, Tag,
  Package, CircleNotch, Warning, Check,
} from '@phosphor-icons/react'
import { cartAPI } from '../services/api'
import { imgUrl } from '../utils/imgUrl'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'

export default function Cart() {
  const { user, isAuthenticated } = useAuthStore()
  const { setCart: setGlobalCart, clearCart } = useCartStore()
  const navigate = useNavigate()
  const [cart, setCart] = useState({ items: [], total_items: 0, total_price: 0 })
  const [loading, setLoading] = useState(true)
  const [stockErrors, setStockErrors] = useState({})

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    loadCart()
  }, [isAuthenticated])

  const loadCart = async () => {
    try {
      const res = await cartAPI.get(user.id)
      setCart(res.data)
      setGlobalCart(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleUpdate = async (itemId, quantity) => {
    setStockErrors(prev => ({ ...prev, [itemId]: '' }))
    try { await cartAPI.update(itemId, { quantity }); loadCart() }
    catch (err) {
      const msg = err.response?.data?.detail || 'Eroare la actualizare'
      setStockErrors(prev => ({ ...prev, [itemId]: msg }))
    }
  }

  const handleRemove = async (itemId) => {
    try { await cartAPI.remove(itemId); loadCart() }
    catch (err) { console.error(err) }
  }

  const handleClear = async () => {
    try { await cartAPI.clear(user.id); clearCart(); setCart({ items: [], total_items: 0, total_price: 0 }) }
    catch (err) { console.error(err) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted text-lg gap-3">
      <CircleNotch size={24} className="animate-spin" />
      <span>Se incarca...</span>
    </div>
  )

  const shipping = parseFloat(cart.total_price) >= 500 ? 0 : 19.99
  const total = (parseFloat(cart.total_price) + shipping).toFixed(2)
  const freeShippingLeft = (500 - parseFloat(cart.total_price)).toFixed(2)
  const freeShippingPct = Math.min(100, (parseFloat(cart.total_price) / 500) * 100)

  return (
    <div className="max-w-7xl mx-auto pb-20">

      {/* HERO */}
      <div className="relative overflow-hidden bg-surface border border-default rounded-2xl px-12 py-11 mb-8 flex items-center justify-between gap-6 shadow-elevated">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-accent-dim border border-accent-border flex items-center justify-center shadow-glow-cyan flex-shrink-0">
            <ShoppingCart size={30} weight="duotone" className="text-accent" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-primary text-3xl mb-1 tracking-tight">
              Cosul meu
            </h1>
            <p className="text-muted text-sm">
              {cart.items?.length
                ? `${cart.total_items} ${cart.total_items === 1 ? 'produs' : 'produse'} in cos`
                : 'Cosul tau este gol'}
            </p>
          </div>
        </div>

        {cart.items?.length > 0 && (
          <div className="flex gap-8 flex-shrink-0">
            <div className="text-center">
              <div className="text-accent font-extrabold text-xl">{cart.total_items}</div>
              <div className="text-muted text-xs mt-1">Produse</div>
            </div>
            <div className="text-center">
              <div className="text-success font-extrabold text-xl">{parseFloat(cart.total_price).toFixed(2)} RON</div>
              <div className="text-muted text-xs mt-1">Subtotal</div>
            </div>
            <div className="text-center">
              <div className={`font-extrabold text-xl ${shipping === 0 ? 'text-success' : 'text-price'}`}>
                {shipping === 0 ? 'Gratuit' : `${shipping} RON`}
              </div>
              <div className="text-muted text-xs mt-1">Transport</div>
            </div>
          </div>
        )}
      </div>

      {!cart.items?.length ? (
        /* COS GOL */
        <div className="bg-surface border border-default rounded-2xl py-20 px-10 text-center">
          <ShoppingCart size={64} weight="duotone" className="text-muted mx-auto block mb-4" />
          <h2 className="text-primary font-bold text-2xl mb-3">
            Cosul tau este gol
          </h2>
          <p className="text-muted text-sm mb-8">
            Adauga produse din catalog pentru a incepe cumparaturile.
          </p>
          <Link to="/catalog" className="btn-primary inline-flex items-center gap-2">
            Mergi la catalog
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 360px' }}>

          {/* PRODUSE */}
          <div className="flex flex-col gap-3">
            {cart.items?.map(item => (
              <div key={item.cart_item_id}>
                <div className="bg-surface border border-default rounded-xl p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-border">

                  {/* Imagine */}
                  <div className="product-img-bg rounded-lg w-20 h-20 object-contain flex-shrink-0 flex items-center justify-center">
                    {item.image_url
                      ? <img src={imgUrl(item.image_url)} alt={item.name} className="w-full h-full object-contain rounded-lg" />
                      : <Package size={36} className="text-muted" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-primary font-bold text-base mb-0.5 truncate">
                      {item.name}
                    </h3>
                    <p className="text-muted text-sm mb-2">{item.brand}</p>
                    <p className="text-accent font-bold text-sm">
                      {item.price} RON / buc
                    </p>
                  </div>

                  {/* Cantitate */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => handleUpdate(item.cart_item_id, item.quantity - 1)}
                      className="bg-base-2 border border-default rounded-lg w-9 h-9 flex items-center justify-center text-primary hover:text-danger hover:border-danger transition-colors cursor-pointer">
                      <Minus size={14} />
                    </button>
                    <span className="text-primary font-extrabold text-lg min-w-7 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdate(item.cart_item_id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      title={item.quantity >= item.stock ? `Stoc maxim: ${item.stock} buc` : ''}
                      className="bg-base-2 border border-default rounded-lg w-9 h-9 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:border-accent-border enabled:hover:text-accent enabled:cursor-pointer text-primary">
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Subtotal + sterge */}
                  <div className="text-right min-w-28 flex-shrink-0">
                    <p className="font-mono font-extrabold text-price text-lg mb-2">
                      {parseFloat(item.subtotal).toFixed(2)} RON
                    </p>
                    <button
                      onClick={() => handleRemove(item.cart_item_id)}
                      className="flex items-center gap-1.5 ml-auto text-sm font-semibold px-3 py-1 rounded-lg border border-danger/20 bg-danger/5 hover:bg-danger/15 transition-colors cursor-pointer">
                      <Trash size={16} weight="regular" className="text-muted hover:text-danger transition-colors" />
                      <span className="text-danger">Sterge</span>
                    </button>
                  </div>
                </div>
                {stockErrors[item.cart_item_id] && (
                  <div className="flex items-center gap-1.5 text-danger text-xs mt-1 pl-1">
                    <Warning size={14} />
                    {stockErrors[item.cart_item_id]}
                  </div>
                )}
                {item.quantity >= item.stock && item.stock > 0 && !stockErrors[item.cart_item_id] && (
                  <div className="flex items-center gap-1.5 text-xs mt-1 pl-1" style={{ color: '#FF9800' }}>
                    <Warning size={14} />
                    Stoc maxim atins ({item.stock} buc disponibile)
                  </div>
                )}
              </div>
            ))}

            {/* Goleste cosul */}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleClear}
                className="btn-outline flex items-center gap-2 text-danger border-danger/30 hover:bg-danger/10">
                <Trash size={14} />
                Goleste cosul
              </button>
            </div>
          </div>

          {/* SUMAR */}
          <div className="bg-surface border border-default rounded-2xl p-6 h-fit sticky top-22">
            {/* Header sumar */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-default">
              <div className="w-10 h-10 rounded-xl bg-accent-dim border border-accent-border flex items-center justify-center shadow-glow-cyan flex-shrink-0">
                <Package size={18} className="text-accent" />
              </div>
              <h2 className="font-display font-bold text-primary text-lg">
                Sumar comanda
              </h2>
            </div>

            {/* Linii */}
            <div className="flex flex-col gap-2 mb-5">
              <div className="flex justify-between text-sm text-secondary py-1">
                <span>Produse ({cart.total_items})</span>
                <span className="font-semibold">{parseFloat(cart.total_price).toFixed(2)} RON</span>
              </div>
              <div className="flex justify-between text-sm text-secondary py-1">
                <span>Transport</span>
                <span className={`font-semibold flex items-center gap-1 ${shipping === 0 ? 'text-success' : ''}`}>
                  {shipping === 0 ? <><Check size={13} />Gratuit</> : `${shipping} RON`}
                </span>
              </div>
            </div>

            {/* Bara transport gratuit */}
            {shipping > 0 && (
              <div className="mb-5">
                <div className="flex justify-between mb-1.5">
                  <span className="text-muted text-xs">Progres transport gratuit</span>
                  <span className="text-success text-xs font-semibold">mai {freeShippingLeft} RON</span>
                </div>
                <div className="h-1.5 rounded-full bg-base-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-success to-accent transition-all duration-500"
                    style={{ width: `${freeShippingPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between font-mono font-extrabold text-2xl text-price border-t border-default pt-3 mt-2 mb-6">
              <span className="font-display font-bold text-primary text-lg">Total</span>
              <span>{total} RON</span>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
              Plaseaza comanda
              <ArrowRight size={16} />
            </button>

            <Link
              to="/catalog"
              className="block text-center text-muted text-sm py-2 px-3 rounded-lg border border-default hover:text-secondary hover:border-accent-border transition-all">
              Continua cumparaturile
            </Link>

            {/* Garantii */}
            <div className="mt-5 pt-4 border-t border-default flex flex-col gap-2">
              {[
                { icon: <Check size={13} className="text-success" />, text: 'Plata 100% securizata' },
                { icon: <Check size={13} className="text-success" />, text: 'Retur in 14 zile' },
                { icon: <Check size={13} className="text-success" />, text: 'Livrare 1-3 zile lucratoare' },
              ].map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  {g.icon}
                  <span className="text-muted text-xs">{g.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
