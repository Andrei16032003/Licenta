import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { wishlistAPI, cartAPI } from '../services/api'
import { imgUrl } from '../utils/imgUrl'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import { Heart, CircleNotch, ShoppingCart, Trash, Desktop } from '@phosphor-icons/react'

export default function Wishlist() {
  const { user, isAuthenticated } = useAuthStore()
  const { setCart } = useCartStore()
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(null)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    load()
  }, [isAuthenticated])

  const load = async () => {
    try {
      const res = await wishlistAPI.get(user.id)
      setItems(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleRemove = async (productId) => {
    try {
      await wishlistAPI.remove(user.id, productId)
      setItems(prev => prev.filter(i => i.product_id !== productId))
    } catch (err) { console.error(err) }
  }

  const handleAddToCart = async (productId) => {
    setAddingToCart(productId)
    try {
      await cartAPI.add({ user_id: user.id, product_id: productId, quantity: 1 })
      const cartRes = await cartAPI.get(user.id)
      setCart(cartRes.data)
      setIsSuccess(true)
      setMessage('Produs adăugat în coș!')
      setTimeout(() => setMessage(''), 2500)
    } catch (err) {
      setIsSuccess(false)
      setMessage(err.response?.data?.detail || 'Eroare!')
      setTimeout(() => setMessage(''), 3000)
    } finally { setAddingToCart(null) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <CircleNotch size={32} className="animate-spin text-accent" />
    </div>
  )

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-primary text-[26px] font-bold flex items-center gap-2.5">
          <Heart size={28} weight="fill" className="text-danger" />
          Favorite
        </h1>
        <span className="text-muted text-sm">
          {items.length} {items.length === 1 ? 'produs' : 'produse'}
        </span>
      </div>

      {message && (
        <div className={`${isSuccess ? 'bg-success/10 border border-success/30 text-success' : 'bg-danger/10 border border-danger/30 text-danger'} px-4 py-3 rounded-xl mb-4 text-sm`}>
          {message}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-surface border border-default rounded-2xl py-16 text-center">
          <Heart size={64} weight="duotone" className="ph-duotone text-muted mx-auto mb-4" />
          <p className="text-muted text-lg mb-5">
            Nu ai niciun produs favorit
          </p>
          <Link to="/" className="btn-primary inline-block">
            Explorează catalogul
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {items.map(item => (
            <div key={item.wishlist_id} className="product-card flex flex-col">
              {/* Image placeholder */}
              <Link to={`/product/${item.product_id}`} className="no-underline">
                <div className="product-img-bg h-[130px] overflow-hidden flex items-center justify-center border-b border-default">
                  {item.image_url
                    ? <img src={imgUrl(item.image_url)} alt={item.name} />
                    : <Desktop size={64} className="text-muted/40" />}
                </div>
              </Link>

              <div className="p-4 flex-1 flex flex-col gap-2">
                <div>
                  <p className="text-accent text-[11px] font-semibold uppercase tracking-wide mb-1">
                    {item.category}
                  </p>
                  <Link to={`/product/${item.product_id}`} className="no-underline hover:text-accent transition-colors">
                    <h3 className="text-primary text-sm font-semibold leading-snug line-clamp-2 mb-0.5">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-muted text-xs">{item.brand}</p>
                </div>

                <div className="flex items-center gap-2 mt-auto flex-wrap">
                  <span className="text-price font-mono font-extrabold text-lg">
                    {item.price} RON
                  </span>
                  {item.old_price && (
                    <span className="text-muted line-through text-xs">
                      {item.old_price} RON
                    </span>
                  )}
                  <span className={`ml-auto text-[11px] px-2 py-0.5 rounded-full ${item.stock > 0 ? 'bg-success/10 text-success border border-success/30' : 'bg-danger/10 text-danger border border-danger/30'}`}>
                    {item.stock > 0 ? 'În stoc' : 'Epuizat'}
                  </span>
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => handleAddToCart(item.product_id)}
                    disabled={addingToCart === item.product_id || item.stock === 0}
                    className="btn-primary w-full py-2 text-sm flex items-center justify-center gap-1.5">
                    {addingToCart === item.product_id
                      ? <CircleNotch size={15} className="animate-spin" />
                      : <ShoppingCart size={15} weight="bold" />
                    }
                    {addingToCart === item.product_id ? 'Se adaugă...' : 'Adaugă în coș'}
                  </button>
                  <button
                    onClick={() => handleRemove(item.product_id)}
                    className="p-2 rounded-lg text-danger border border-danger/30 hover:bg-danger/10 transition-colors cursor-pointer bg-transparent">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
