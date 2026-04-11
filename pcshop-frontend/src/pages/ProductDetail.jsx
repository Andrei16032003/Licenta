import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { productsAPI, cartAPI, reviewsAPI, wishlistAPI } from '../services/api'
import { imgUrl } from '../utils/imgUrl'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import useCompareStore from '../store/compareStore'
import useFavoriteStore from '../store/favoriteStore'
import {
  ArrowLeft, ShoppingCart, Heart, Scales, Star, Check, CircleNotch,
  Warning, Package, Cpu, Monitor, Memory, Circuitry, HardDrive,
  Lightning, Thermometer, Mouse, Desktop, CaretRight, Share,
} from '@phosphor-icons/react'


const SPEC_LABELS = {
  socket: 'Socket', cores: 'Nuclee', threads: 'Thread-uri', base_clock: 'Frecventa de baza',
  boost_clock: 'Frecventa boost', tdp: 'TDP (W)', memory_type: 'Tip memorie', max_memory_gb: 'Memorie max (GB)',
  m2_slots: 'Sloturi M.2', form_factor: 'Form factor', capacity_gb: 'Capacitate (GB)',
  type: 'Tip', speed_mhz: 'Viteza (MHz)', interface: 'Interfata', read_speed: 'Citire (MB/s)',
  write_speed: 'Scriere (MB/s)', vram_gb: 'VRAM (GB)', power_w: 'Consum (W)', length_mm: 'Lungime (mm)',
  wattage: 'Putere (W)', efficiency: 'Eficienta', modular: 'Modular', max_gpu_length_mm: 'GPU max (mm)',
  max_cooler_height_mm: 'Cooler max (mm)', max_radiator_mm: 'Radiator max (mm)',
  height_mm: 'Inaltime (mm)', tdp_w: 'TDP racit (W)', radiator_mm: 'Radiator (mm)',
  socket_am4: 'AM4 compat.', socket_am5: 'AM5 compat.', socket_lga1700: 'LGA1700 compat.',
  bandwidth: 'Latime de banda', latency: 'Latenta', color: 'Culoare',
}

function formatSpecValue(key, val) {
  if (typeof val === 'boolean') return val ? 'Da' : 'Nu'
  if (key === 'modular') return val ? 'Da' : 'Nu'
  return String(val)
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { setCart } = useCartStore()
  const { items: compareItems, categorySlug: compareCategory, add: addToCompare, remove: removeFromCompare } = useCompareStore()
  const { setFavorites } = useFavoriteStore()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewTitle, setReviewTitle] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('specs')
  const [selectedImg, setSelectedImg] = useState(0)

  useEffect(() => { loadProduct(); loadReviews() }, [id])
  useEffect(() => { setSelectedImg(0) }, [id])

  useEffect(() => {
    if (isAuthenticated && user?.id && id) {
      wishlistAPI.get(user.id).then(res => {
        setInWishlist(res.data.some(i => i.product_id === id))
      }).catch(() => {})
    }
  }, [isAuthenticated, user?.id, id])

  const loadProduct = async () => {
    try {
      const res = await productsAPI.getById(id)
      setProduct(res.data)
      if (res.data.category_slug) {
        productsAPI.getAll({ category: res.data.category_slug, limit: 6 }).then(r => {
          setSimilar(r.data.products.filter(p => p.id !== id).slice(0, 4))
        }).catch(() => {})
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const loadReviews = async () => {
    try { const res = await reviewsAPI.getByProduct(id); setReviews(res.data) }
    catch (err) { console.error(err) }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setAddingToCart(true)
    try {
      await cartAPI.add({ user_id: user.id, product_id: id, quantity: 1 })
      const cartRes = await cartAPI.get(user.id)
      setCart(cartRes.data)
      setMessage('success')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Eroare la adaugare'
      setMessage(detail)
      setTimeout(() => setMessage(''), 4000)
    } finally { setAddingToCart(false) }
  }

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setWishlistLoading(true)
    try {
      if (inWishlist) {
        await wishlistAPI.remove(user.id, id)
        setInWishlist(false)
      } else {
        await wishlistAPI.add({ user_id: user.id, product_id: id })
        setInWishlist(true)
      }
      // Sincronizeaza store-ul global (folosit de dropdown-ul din Navbar)
      wishlistAPI.get(user.id).then(res => {
        setFavorites(Array.isArray(res.data) ? res.data : [])
      }).catch(() => {})
    } catch { /* silent */ }
    finally { setWishlistLoading(false) }
  }

  const handleAddReview = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) { navigate('/login'); return }
    try {
      await reviewsAPI.add({
        user_id: user.id,
        product_id: id,
        rating,
        title: reviewTitle || null,
        comment,
        is_anonymous: isAnonymous,
        author_name: isAnonymous ? null : (user.full_name || user.email || 'Utilizator'),
      })
      setComment(''); setRating(5); setReviewTitle(''); setIsAnonymous(false)
      setReviewSubmitted(true)
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data || err.message || 'Eroare necunoscuta'
      alert(typeof detail === 'string' ? detail : JSON.stringify(detail))
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 text-muted">
      <CircleNotch size={48} className="animate-spin opacity-30 mb-4" />
      <p className="text-base">Se incarca produsul...</p>
    </div>
  )
  if (!product) return (
    <div className="flex flex-col items-center justify-center py-24 text-muted">
      <Warning size={48} className="opacity-30 mb-4" />
      <p>Produsul nu a fost gasit</p>
    </div>
  )

  const images = product.images || []
  const discount = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null
  const avgRating = reviews.average_rating || product.average_rating || 0
  const totalReviews = reviews.total_reviews ?? product.review_count ?? 0

  const productForCompare = {
    id: product.id, name: product.name, brand: product.brand,
    price: product.price, old_price: product.old_price,
    stock: product.stock, specs: product.specs,
    category: product.category, category_slug: product.category_slug,
    image_url: images[0]?.url || null,
    warranty_months: product.warranty_months,
  }
  const isComparing = !!compareItems.find(p => p.id === product.id)
  const wrongCategory = !isComparing && compareCategory && (product.category_slug || product.category) !== compareCategory
  const handleCompare = () => {
    if (isComparing) removeFromCompare(product.id)
    else if (!wrongCategory) addToCompare(productForCompare)
  }

  const TABS = [
    { key: 'specs', label: 'Specificatii', icon: <Circuitry size={15} /> },
    { key: 'description', label: 'Descriere', icon: <Monitor size={15} /> },
    { key: 'reviews', label: `Recenzii (${totalReviews})`, icon: <Star size={15} /> },
    { key: 'warranty', label: 'Garantie & Retur', icon: <Package size={15} /> },
  ]

  return (
    <div className="max-w-[1200px] mx-auto pb-16">

      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 mb-5 text-[13px]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-secondary hover:text-primary text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Inapoi</span>
        </button>
        <CaretRight size={12} className="text-muted" />
        <Link to="/" className="text-accent hover:underline">Acasa</Link>
        <CaretRight size={12} className="text-muted" />
        <Link to={`/?category=${product.category_slug}`} className="text-accent hover:underline">
          {product.category}
        </Link>
        <CaretRight size={12} className="text-muted" />
        <span className="text-muted overflow-hidden text-ellipsis whitespace-nowrap max-w-[300px]">
          {product.name}
        </span>
      </div>

      {/* MAIN CARD */}
      <div className="bg-surface border border-default rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden mb-5">
        <div className="grid grid-cols-2">

          {/* LEFT: Image gallery */}
          <div className="bg-base p-8 border-r border-default flex flex-col gap-4">
            {/* Main image */}
            <div className="product-img-bg rounded-2xl h-[340px] flex items-center justify-center overflow-hidden relative">
              {images.length > 0 ? (
                <img
                  src={imgUrl(images[selectedImg]?.url || images[0].url)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <Desktop size={80} className="text-muted opacity-15 mx-auto" />
                  <p className="text-muted text-[13px] mt-2">Imagine indisponibila</p>
                </div>
              )}
              {discount && (
                <div className="absolute top-3.5 left-3.5 bg-danger text-white font-extrabold text-[13px] px-2.5 py-1 rounded-lg shadow-[0_4px_12px_rgba(239,68,68,0.4)]">
                  -{discount}%
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`w-[60px] h-[60px] rounded-lg overflow-hidden cursor-pointer bg-[#f8f9fa] transition-all flex-shrink-0 border-2 ${selectedImg === i ? 'border-accent' : 'border-default'}`}
                  >
                    <img
                      src={imgUrl(img.url)}
                      alt={`${product.name} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            {/* Trust mini badges */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { icon: <Lightning size={14} />, text: 'Plata securizata' },
                { icon: <Package size={14} />, text: 'Livrare 1-3 zile' },
                { icon: <ArrowLeft size={14} />, text: 'Retur 30 zile' },
                { icon: <Check size={14} />, text: 'Garantie 24 luni' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2 bg-base-2 border border-default rounded-lg px-2.5 py-2">
                  <span className="text-accent">{b.icon}</span>
                  <span className="text-muted text-[11px] font-semibold">{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Product info */}
          <div className="p-8 flex flex-col gap-0">

            {/* Category + brand */}
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-accent-dim border border-accent-border text-accent text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-[0.8px]">
                {product.category}
              </span>
              {product.brand && (
                <span className="bg-base-2 border border-default text-muted text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                  {product.brand}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-primary text-[22px] font-extrabold leading-[1.35] mb-3 tracking-[-0.3px]">
              {product.name}
            </h1>

            {/* Rating summary */}
            <div
              onClick={() => setActiveTab('reviews')}
              className="inline-flex items-center gap-2 mb-4 cursor-pointer px-3 py-1.5 bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.15)] rounded-xl"
            >
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  s <= Math.round(avgRating)
                    ? <Star key={s} size={15} weight="fill" style={{ color: '#FFD700' }} />
                    : <Star key={s} size={15} weight="regular" className="text-muted" />
                ))}
              </div>
              <span className="text-[#FFD700] font-extrabold text-[15px]">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
              <span className="text-muted text-[12px]">din 5</span>
              <span className="text-[rgba(255,255,255,0.15)] text-[12px]">·</span>
              <span className="text-muted text-[12px]">
                {totalReviews > 0 ? `${totalReviews} ${totalReviews === 1 ? 'recenzie' : 'recenzii'}` : 'Fii primul care recenzeaza'}
              </span>
            </div>

            {/* Price */}
            <div className="bg-accent-dim border border-accent-border rounded-2xl px-5 py-4 mb-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-mono font-extrabold text-3xl text-price">
                  {product.price.toLocaleString('ro-RO')} RON
                </span>
                {product.old_price && (
                  <span className="font-mono text-muted line-through text-lg">
                    {product.old_price.toLocaleString('ro-RO')} RON
                  </span>
                )}
              </div>
              {discount && (
                <p className="text-success text-[13px] mt-1 font-semibold">
                  Economisesti {(product.old_price - product.price).toLocaleString('ro-RO')} RON ({discount}% reducere)
                </p>
              )}
              <p className="text-muted text-[12px] mt-1.5">
                Pret cu TVA inclus
              </p>
            </div>

            {/* Stock */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                {product.stock > 5 ? (
                  <span className="bg-success/15 text-success border border-success/30 px-3 py-1 rounded-full text-xs font-bold">
                    In stoc
                  </span>
                ) : product.stock > 0 ? (
                  <span className="bg-[rgba(255,179,0,0.15)] text-[#FFB300] border border-[rgba(255,179,0,0.3)] px-3 py-1 rounded-full text-xs font-bold">
                    Stoc limitat ({product.stock} buc)
                  </span>
                ) : (
                  <span className="bg-danger/15 text-danger border border-danger/30 px-3 py-1 rounded-full text-xs font-bold">
                    Stoc epuizat
                  </span>
                )}
              </div>
              {product.stock > 0 && (
                <p className="text-muted text-[12px]">
                  Livrat in 1-3 zile lucratoare
                </p>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-3.5 text-[14px] font-semibold border ${message === 'success' ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'}`}>
                {message === 'success'
                  ? <><Check size={16} /> Produs adaugat in cos!</>
                  : <><Warning size={16} /> {message}</>
                }
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2.5 mb-5">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock === 0}
                className={`btn-primary flex-1 flex items-center justify-center gap-2 ${product.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {addingToCart
                  ? <><CircleNotch size={18} className="animate-spin" /> Se adauga...</>
                  : product.stock === 0
                  ? 'Stoc epuizat'
                  : <><ShoppingCart size={18} /> Adauga in cos</>
                }
              </button>
              <button
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                title={inWishlist ? 'Elimina din favorite' : 'Adauga la favorite'}
                className={`w-[52px] h-[52px] flex-shrink-0 flex items-center justify-center rounded-xl border transition-all cursor-pointer
                  ${inWishlist
                    ? 'border-danger/50 text-danger bg-danger/10 hover:bg-danger/15'
                    : 'border-white/[0.13] text-secondary hover:text-danger hover:border-danger/40 hover:bg-danger/[0.07]'
                  } ${wishlistLoading ? 'opacity-60' : ''}`}
              >
                <Heart size={22} weight={inWishlist ? 'fill' : 'regular'} />
              </button>
              <button
                onClick={handleCompare}
                disabled={!isComparing && (compareItems.length >= 3 || !!wrongCategory)}
                title={isComparing ? 'Elimina din comparare' : wrongCategory ? 'Doar produse din aceeasi categorie' : compareItems.length >= 3 ? 'Maxim 3 produse' : 'Compara produse'}
                className={`w-[52px] h-[52px] flex-shrink-0 flex items-center justify-center rounded-xl border transition-all cursor-pointer
                  ${isComparing
                    ? 'border-accent/50 text-accent bg-accent-dim hover:bg-accent/15'
                    : 'border-white/[0.13] text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/[0.07]'
                  } ${!isComparing && (compareItems.length >= 3 || wrongCategory) ? 'opacity-35 cursor-not-allowed' : ''}`}
              >
                <Scales size={20} />
              </button>
            </div>

            {/* Key info row */}
            <div className="flex flex-col gap-0">
              {[
                { icon: <Check size={16} />, label: 'Garantie', value: `${product.warranty_months || 24} luni producator` },
                { icon: <ArrowLeft size={16} />, label: 'Retur', value: '30 de zile, fara intrebari' },
                { icon: <Package size={16} />, label: 'Livrare', value: 'Gratuita peste 500 RON' },
                { icon: <Lightning size={16} />, label: 'Plata', value: 'Card, transfer, ramburs' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 py-2.5 ${i < 3 ? 'border-b border-default' : ''}`}>
                  <span className="text-accent flex-shrink-0">{item.icon}</span>
                  <span className="text-muted text-[13px] min-w-[60px] flex-shrink-0">{item.label}:</span>
                  <span className="text-secondary text-[13px] font-semibold">{item.value}</span>
                </div>
              ))}
            </div>

            {/* SKU */}
            {product.sku && (
              <p className="text-muted text-[12px] mt-3">
                Cod produs: {product.sku}
              </p>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="border-t border-default">
          {/* Tab headers */}
          <div className="flex border-b border-default px-8">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-5 py-4 text-[14px] font-semibold border-b-2 -mb-px transition-colors ${
                  activeTab === tab.key
                    ? 'text-accent border-accent'
                    : 'text-muted border-transparent hover:text-secondary'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-8">

            {/* SPECIFICATII */}
            {activeTab === 'specs' && (
              <div>
                {product.specs && Object.keys(product.specs).length > 0 ? (
                  <div className="bg-surface border border-default rounded-2xl overflow-hidden">
                    <div className="bg-base-2 border-b border-default px-4 py-3">
                      <span className="font-display font-bold text-primary">Specificatii tehnice</span>
                    </div>
                    <div className="grid grid-cols-2">
                      {Object.entries(product.specs).map(([key, value], i) => (
                        <div key={key} className={`flex justify-between items-center px-4 py-3 border-b border-default ${i % 2 === 0 ? 'bg-surface' : 'bg-base-2/50'}`}>
                          <span className="text-muted text-[13px]">
                            {SPEC_LABELS[key] || key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-primary font-semibold text-[13px] text-right">
                            {formatSpecValue(key, value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted text-center py-10">
                    Specificatiile tehnice nu sunt disponibile momentan.
                  </p>
                )}
              </div>
            )}

            {/* DESCRIERE */}
            {activeTab === 'description' && (
              <div className="max-w-[760px]">
                {product.description ? (
                  <>
                    <p className="text-secondary text-[15px] leading-[1.9] mb-6">
                      {product.description}
                    </p>
                    {/* Feature highlights */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: <Lightning size={24} />, title: 'Performanta', desc: 'Componenta de calitate superioara' },
                        { icon: <Circuitry size={24} />, title: 'Compatibilitate', desc: 'Verificata cu cele mai populare sisteme' },
                        { icon: <Package size={24} />, title: 'Ambalat sigur', desc: 'Protectie maxima la transport' },
                      ].map((f, i) => (
                        <div key={i} className="bg-base-2 border border-default rounded-xl p-4 text-center">
                          <div className="text-accent flex justify-center mb-2">{f.icon}</div>
                          <p className="text-primary text-[13px] font-bold mb-1">{f.title}</p>
                          <p className="text-muted text-[12px]">{f.desc}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-muted text-center py-10">
                    Descrierea produsului nu este disponibila momentan.
                  </p>
                )}
              </div>
            )}

            {/* RECENZII */}
            {activeTab === 'reviews' && (
              <div>
                {/* Rating overview */}
                {totalReviews > 0 && (
                  <div className="flex items-center gap-8 bg-surface border border-default rounded-2xl p-6 mb-7">
                    <div className="text-center flex-shrink-0">
                      <div className="text-[#FFD700] text-[52px] font-black leading-none">
                        {avgRating.toFixed(1)}
                      </div>
                      <div className="flex gap-0.5 justify-center my-1.5">
                        {[1,2,3,4,5].map(s => (
                          s <= Math.round(avgRating)
                            ? <Star key={s} size={18} weight="fill" style={{ color: '#FFD700' }} />
                            : <Star key={s} size={18} weight="regular" className="text-muted" />
                        ))}
                      </div>
                      <p className="text-muted text-[13px]">{totalReviews} recenzii</p>
                    </div>
                    <div className="flex-1">
                      {[5,4,3,2,1].map(star => {
                        const count = reviews.reviews?.filter(r => r.rating === star).length || 0
                        const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                        return (
                          <div key={star} className="flex items-center gap-2.5 mb-1.5">
                            <span className="text-muted text-[12px] min-w-[20px]">{star}</span>
                            <Star size={11} weight="fill" style={{ color: '#FFD700' }} />
                            <div className="flex-1 h-1.5 bg-base-2 rounded-full overflow-hidden">
                              <div style={{ width: `${pct}%` }} className="h-full bg-[#FFD700] rounded-full transition-all duration-400" />
                            </div>
                            <span className="text-muted text-[12px] min-w-[20px]">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Add review form */}
                {isAuthenticated && (
                  reviewSubmitted ? (
                    <div className="bg-success/5 border border-success/25 rounded-2xl px-6 py-7 mb-7 text-center">
                      <Check size={36} className="text-success mx-auto mb-2.5" weight="bold" />
                      <div className="text-success font-bold text-[16px] mb-1.5">
                        Review trimis spre moderare!
                      </div>
                      <p className="text-muted text-[13px] m-0">
                        Va aparea pe pagina produsului dupa ce este aprobat de un administrator.
                      </p>
                    </div>
                  ) : (
                  <form onSubmit={handleAddReview} className="bg-surface border border-default rounded-2xl p-6 mb-7">
                    <h3 className="text-primary text-[16px] font-bold mb-4">
                      Scrie o recenzie
                    </h3>
                    <div className="mb-3.5">
                      <label className="text-muted text-[12px] block mb-2 font-semibold tracking-[0.4px]">
                        RATING
                      </label>
                      <div className="flex gap-1.5">
                        {[1,2,3,4,5].map(s => (
                          <button
                            key={s} type="button"
                            onClick={() => setRating(s)}
                            className="bg-transparent border-none cursor-pointer p-0.5 transition-transform"
                            style={{ transform: s <= rating ? 'scale(1.1)' : 'scale(1)' }}
                          >
                            {s <= rating
                              ? <Star size={28} weight="fill" style={{ color: '#FFD700' }} />
                              : <Star size={28} weight="regular" className="text-muted" />
                            }
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3.5">
                      <label className="text-muted text-[12px] block mb-2 font-semibold tracking-[0.4px]">
                        TITLU (optional)
                      </label>
                      <input
                        value={reviewTitle} onChange={e => setReviewTitle(e.target.value)}
                        className="input-field" maxLength={150}
                        placeholder="Ex: Produs excelent, livrare rapida..."
                      />
                    </div>
                    <div className="mb-4">
                      <label className="text-muted text-[12px] block mb-2 font-semibold tracking-[0.4px]">
                        COMENTARIU
                      </label>
                      <textarea
                        value={comment} onChange={e => setComment(e.target.value)}
                        className="input-field resize-y"
                        rows={4} placeholder="Spune-ne parerea ta despre acest produs..."
                      />
                    </div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <input
                        type="checkbox" id="anon-check"
                        checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 cursor-pointer accent-accent"
                      />
                      <label htmlFor="anon-check" className="text-secondary text-[13px] cursor-pointer select-none">
                        Posteaza anonim (numele tau nu va fi afisat)
                      </label>
                    </div>
                    <button type="submit" className="btn-primary">
                      Trimite recenzia
                    </button>
                  </form>
                  )
                )}

                {/* Reviews list */}
                {!reviews.reviews?.length ? (
                  <div className="text-center py-12 text-muted">
                    <Star size={40} className="opacity-30 mx-auto mb-3" />
                    <p>Nicio recenzie inca. Fii primul care scrie!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {reviews.reviews.map(r => (
                      <div key={r.id} className="bg-surface border border-default rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                s <= r.rating
                                  ? <Star key={s} size={14} weight="fill" style={{ color: '#FFD700' }} />
                                  : <Star key={s} size={14} weight="regular" className="text-muted" />
                              ))}
                            </div>
                            <span className="text-primary text-[13px] font-semibold">
                              {r.author_name || 'Utilizator'}
                            </span>
                            {r.is_verified && (
                              <span className="text-[11px] bg-success/10 text-success border border-success/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                <Check size={10} weight="bold" /> Cumparator verificat
                              </span>
                            )}
                          </div>
                          <span className="text-muted text-[12px] flex-shrink-0">
                            {new Date(r.created_at).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        {r.title && (
                          <p className="text-primary text-[14px] font-semibold mb-1.5">
                            {r.title}
                          </p>
                        )}
                        {r.comment && (
                          <p className="text-secondary text-[14px] leading-[1.7] m-0">
                            {r.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* GARANTIE & RETUR */}
            {activeTab === 'warranty' && (
              <div className="grid grid-cols-2 gap-5">
                {[
                  {
                    icon: <Check size={18} />, colorClass: 'text-accent', bgClass: 'bg-accent-dim', borderClass: 'border-accent-border',
                    title: 'Garantie comerciala',
                    items: [
                      `${product.warranty_months || 24} luni garantie de la data achizitiei`,
                      'Acoperire pentru defecte de fabricatie',
                      'Service autorizat in toata Romania',
                      'Inlocuire gratuita in primele 30 de zile',
                      'Reparatie sau inlocuire fara costuri suplimentare',
                    ],
                    note: 'Garantia nu acopera defectele cauzate de utilizare necorespunzatoare sau daune fizice.',
                  },
                  {
                    icon: <ArrowLeft size={18} />, colorClass: 'text-success', bgClass: 'bg-success/10', borderClass: 'border-success/20',
                    title: 'Politica de retur',
                    items: [
                      '30 de zile drept de retur (conform OUG 34/2014)',
                      'Produs sigilat — returnare completa fara taxe',
                      'Produs deschis — returnare cu verificare stare',
                      'Rambursare in 5-7 zile lucratoare',
                      'Retur gratuit pentru produse defecte',
                    ],
                    note: 'Software-ul activat si consumabilele deschise nu sunt returnabile.',
                  },
                  {
                    icon: <Package size={18} />, colorClass: 'text-violet', bgClass: 'bg-violet/10', borderClass: 'border-violet/20',
                    title: 'Informatii livrare',
                    items: [
                      'Livrare standard: 1-3 zile lucratoare',
                      'Livrare gratuita pentru comenzi peste 500 RON',
                      'Curier Fan Courier / DPD / Cargus',
                      'Tracking in timp real prin SMS si email',
                      'Livrare la etaj disponibila contra cost',
                    ],
                    note: 'Termenul de livrare poate varia in perioadele de sarbatori.',
                  },
                  {
                    icon: <Lightning size={18} />, colorClass: 'text-[#FFD700]', bgClass: 'bg-[rgba(255,215,0,0.1)]', borderClass: 'border-[rgba(255,215,0,0.2)]',
                    title: 'Metode de plata',
                    items: [
                      'Card bancar Visa / Mastercard (3D Secure)',
                      'Transfer bancar (procesare 1-2 zile)',
                      'Ramburs la livrare (+ 15 RON taxa curier)',
                      'Rate fara dobanda — 3, 6 sau 12 rate',
                      'Plata in magazin — ridicare personala',
                    ],
                    note: 'Platile cu cardul sunt procesate securizat prin gateway certificat PCI DSS.',
                  },
                ].map((card, i) => (
                  <div key={i} className={`bg-surface border ${card.borderClass} rounded-2xl p-6`}>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className={`w-10 h-10 rounded-xl ${card.bgClass} border ${card.borderClass} flex items-center justify-center flex-shrink-0 ${card.colorClass}`}>
                        {card.icon}
                      </div>
                      <h3 className="text-primary text-[15px] font-bold m-0">
                        {card.title}
                      </h3>
                    </div>
                    <ul className="m-0 p-0 list-none flex flex-col gap-2">
                      {card.items.map((item, j) => (
                        <li key={j} className="flex gap-2 items-start">
                          <Check size={12} className={`${card.colorClass} mt-0.5 flex-shrink-0`} />
                          <span className="text-secondary text-[13px] leading-[1.5]">{item}</span>
                        </li>
                      ))}
                    </ul>
                    {card.note && (
                      <p className="text-muted text-[11px] mt-3.5 pt-3 border-t border-default leading-[1.6] italic">
                        * {card.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* SIMILAR PRODUCTS */}
      {similar.length > 0 && (
        <div className="bg-surface border border-default rounded-2xl p-7 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="section-chip">
              <Share size={16} />
            </div>
            <h2 className="text-primary text-[18px] font-bold m-0">
              Produse similare
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-3.5">
            {similar.map(p => (
              <Link key={p.id} to={`/product/${p.id}`} className="no-underline">
                <div className="bg-base-2 rounded-2xl p-3.5 border border-default transition-all cursor-pointer h-full hover:bg-surface hover:border-accent hover:-translate-y-1">
                  <div className="product-img-bg rounded-xl h-[130px] mb-3 overflow-hidden flex items-center justify-center">
                    {p.image_url
                      ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-full h-full" />
                      : <Desktop size={36} className="text-muted opacity-20" />
                    }
                  </div>
                  {p.brand && (
                    <p className="text-muted text-[11px] font-semibold mb-1 uppercase tracking-[0.5px]">{p.brand}</p>
                  )}
                  <p className="text-secondary text-[13px] font-semibold mb-2.5 line-clamp-2 leading-[1.4]">
                    {p.name}
                  </p>
                  <p className="font-mono font-extrabold text-price text-[16px] m-0">
                    {p.price.toLocaleString('ro-RO')} RON
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
