import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  Lightning, ShoppingCart, User, CaretDown, SignOut,
  Package, Heart, ShieldCheck, ArrowCounterClockwise,
  Wrench, GearSix, MagnifyingGlass, Desktop,
  Tag, Question, Info, Phone, House, Storefront, Cpu, Robot,
} from '@phosphor-icons/react'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import useFavoriteStore from '../store/favoriteStore'
import { cartAPI, wishlistAPI, chatAPI, productsAPI } from '../services/api'
import { imgUrl } from '../utils/imgUrl'
import { SLUG_ALIASES } from '../utils/categorySearch'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { totalItems, setCart } = useCartStore()
  const { items: favItems, totalItems: favTotal, setFavorites, clearFavorites } = useFavoriteStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchVal, setSearchVal]       = useState('')
  const [searchOpen, setSearchOpen]     = useState(false)
  const [suggestions, setSuggestions]   = useState({ cats: [], products: [] })
  const [catalogCats, setCatalogCats]   = useState([])
  const [favOpen, setFavOpen]           = useState(false)
  const [favLoaded, setFavLoaded]       = useState(false)

  const dropdownRef = useRef(null)
  const searchRef   = useRef(null)
  const favRef      = useRef(null)
  const debounceRef = useRef(null)

  const isActive = (path) => location.pathname === path

  /* ── Load catalog categories ── */
  useEffect(() => {
    chatAPI.categories()
      .then(r => setCatalogCats(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
  }, [])

  /* ── Live search suggestions ── */
  useEffect(() => {
    const q = searchVal.trim()
    if (!q) { setSuggestions({ cats: [], products: [] }); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const lower = q.toLowerCase()
      const matchedCats = catalogCats.filter(c => {
        if (c.name.toLowerCase().includes(lower)) return true
        const aliases = SLUG_ALIASES[c.slug] || []
        return aliases.some(a => a.includes(lower) || lower.includes(a))
      })
      let products = []
      try {
        const r = await productsAPI.getAll({ search: q, limit: 5 })
        products = r.data?.products || []
      } catch { products = [] }
      setSuggestions({ cats: matchedCats.slice(0, 4), products })
    }, 250)
  }, [searchVal, catalogCats])

  /* ── Auth sync ── */
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      cartAPI.get(user.id).then(res => setCart(res.data)).catch(() => {})
      wishlistAPI.get(user.id).then(res => {
        setFavorites(Array.isArray(res.data) ? res.data : (res.data.items || []))
        setFavLoaded(true)
      }).catch(() => {})
    } else {
      clearFavorites()
      setFavLoaded(false)
    }
  }, [isAuthenticated, user?.id])

  /* ── Click-outside + Escape ── */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
      if (searchRef.current   && !searchRef.current.contains(e.target))   setSearchOpen(false)
      if (favRef.current      && !favRef.current.contains(e.target))      setFavOpen(false)
    }
    const onEsc = (e) => {
      if (e.key === 'Escape') { setSearchOpen(false); setDropdownOpen(false) }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  /* ── Close dropdowns on route change ── */
  useEffect(() => {
    setDropdownOpen(false); setSearchOpen(false); setFavOpen(false)
  }, [location.pathname])

  const closeSearch = () => {
    setSearchOpen(false); setSearchVal(''); setSuggestions({ cats: [], products: [] })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchVal.trim()
    if (!q) return
    navigate(`/catalog?search=${encodeURIComponent(q)}`)
    closeSearch()
  }

  const goToProduct = (id) => { navigate(`/product/${id}`); closeSearch() }

  /* ── Data ── */
  const navLinks = [
    { to: '/',           label: 'Acasă'       },
    { to: '/catalog',    label: 'Catalog'     },
    { to: '/builder',    label: 'PC Builder'  },
    { to: '/chat',       label: 'Prebuilt PC' },
    { to: '/promotii',   label: 'Promoții'    },
    { to: '/faq',        label: 'FAQ'         },
    { to: '/despre-noi', label: 'Despre noi'  },
    { to: '/contact',    label: 'Contact'     },
  ]

  const dropItems = [
    { to: '/profile',                Icon: User,                  label: 'Profilul meu'    },
    { to: '/orders',                 Icon: Package,               label: 'Comenzile mele'  },
    { to: '/profile?tab=vouchers',   Icon: Tag,                   label: 'Voucherele mele' },
    { to: '/wishlist',               Icon: Heart,                 label: 'Favorite'        },
    { to: '/profile?tab=warranties', Icon: ShieldCheck,           label: 'Garanții'        },
    { to: '/profile?tab=returns',    Icon: ArrowCounterClockwise, label: 'Retururi'        },
    { to: '/profile?tab=service',    Icon: Wrench,                label: 'Service'         },
  ]

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <nav className="sticky top-0 z-[1000]">

      {/* ══ TOP ACCENT LINE ══ */}
      <div style={{
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, #0EF6FF 30%, #0EF6FF 70%, transparent 100%)',
        opacity: 0.6,
      }} />

      {/* ══ ROW 1 — Logo · Search · Actions ══ */}
      <div
        className="flex items-center gap-4 px-8"
        style={{
          height: '56px',
          background: 'rgba(7, 16, 28, 0.97)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0 group mr-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: '#0EF6FF',
              boxShadow: '0 0 20px rgba(14,246,255,0.4)',
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 32px rgba(14,246,255,0.7)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(14,246,255,0.4)'}
          >
            <Lightning size={17} weight="bold" color="#050910" />
          </div>
          <span className="font-display font-extrabold tracking-tight" style={{ fontSize: '16px' }}>
            <span style={{ color: '#EEF2F7' }}>ALEX </span>
            <span style={{ color: '#0EF6FF' }}>COMPUTERS</span>
          </span>
        </Link>

        {/* SEARCH — grows to fill space */}
        <div ref={searchRef} className="relative flex-1" style={{ maxWidth: '460px' }}>
          <form
            onSubmit={handleSearch}
            className="flex items-center overflow-hidden"
            style={{
              background: '#0B1726',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={() => {
              const el = document.getElementById('nav-search-form')
              if (el) { el.style.borderColor = 'rgba(14,246,255,0.35)'; el.style.boxShadow = '0 0 0 3px rgba(14,246,255,0.07)' }
            }}
          >
            <input
              id="nav-search-input"
              value={searchVal}
              onChange={e => { setSearchVal(e.target.value); setSearchOpen(true) }}
              onFocus={(e) => {
                setSearchOpen(true)
                e.currentTarget.closest('form').style.borderColor = 'rgba(14,246,255,0.35)'
                e.currentTarget.closest('form').style.boxShadow = '0 0 0 3px rgba(14,246,255,0.07)'
              }}
              onBlur={(e) => {
                e.currentTarget.closest('form').style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.closest('form').style.boxShadow = 'none'
              }}
              placeholder="Caută produse, categorii..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#EEF2F7',
                fontSize: '13px',
                padding: '9px 14px',
                fontFamily: 'Outfit, sans-serif',
              }}
            />
            <button
              type="submit"
              style={{
                flexShrink: 0,
                padding: '9px 14px',
                background: 'transparent',
                border: 'none',
                borderLeft: '1px solid rgba(255,255,255,0.06)',
                color: '#8B9EBA',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#0EF6FF'}
              onMouseLeave={e => e.currentTarget.style.color = '#8B9EBA'}
            >
              <MagnifyingGlass size={15} />
            </button>
          </form>

          {/* Search suggestions */}
          {searchOpen && searchVal.trim() && suggestions.products.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-2 overflow-hidden animate-slide-down"
              style={{
                background: '#07101C',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
                zIndex: 9999,
              }}
            >
              <p style={{ color: '#3E5268', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 14px 6px' }}>
                Produse
              </p>
              {suggestions.products.map(p => {
                const imgSrc = p.image_url || p.image
                const price = p.discount_percent > 0
                  ? (p.price * (1 - p.discount_percent / 100)).toFixed(0)
                  : p.price
                return (
                  <button
                    key={p.id}
                    onClick={() => goToProduct(p.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 14px', background: 'transparent', border: 'none',
                      cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {imgSrc
                      ? <img src={imgUrl(imgSrc)} alt={p.name} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 8, background: '#162B3D', flexShrink: 0 }} />
                      : <div style={{ width: 32, height: 32, borderRadius: 8, background: '#162B3D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={14} style={{ color: 'rgba(62,82,104,0.6)' }} />
                        </div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#EEF2F7', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      <p style={{ color: '#FF8C00', fontSize: 11, fontFamily: '"Space Mono", monospace', margin: 0 }}>{price} RON</p>
                    </div>
                  </button>
                )
              })}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 14px' }}>
                <button
                  onClick={handleSearch}
                  style={{ color: '#0EF6FF', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                >
                  Caută „{searchVal.trim()}" în tot catalogul →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SPACER */}
        <div style={{ flex: 1 }} />

        {/* ── ACTION ITEMS ── */}
        <div className="flex items-center" style={{ gap: '2px' }}>

          {/* Contul meu */}
          {isAuthenticated ? (
            <div ref={dropdownRef} className="relative">
              <ActionButton
                onClick={() => setDropdownOpen(o => !o)}
                active={dropdownOpen}
                label="Contul meu"
                sublabel={`Salut, ${user?.name?.split(' ')[0]}`}
                badge={null}
                icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: '#0EF6FF', color: '#050910',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, fontFamily: 'Syne, sans-serif', flexShrink: 0,
                  }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                }
                caret
                caretOpen={dropdownOpen}
              />

              {dropdownOpen && (
                <div
                  className="absolute animate-slide-down"
                  style={{
                    top: 'calc(100% + 8px)', right: 0,
                    background: '#07101C', border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 16, minWidth: 210,
                    boxShadow: '0 12px 48px rgba(0,0,0,0.7)', overflow: 'hidden', zIndex: 200,
                  }}
                >
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(14,246,255,0.04)' }}>
                    <p style={{ color: '#EEF2F7', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, margin: 0 }}>{user?.name}</p>
                    <p style={{ color: '#3E5268', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', margin: 0, marginTop: 2 }}>
                      {{ admin: 'Administrator', manager: 'Manager', achizitii: 'Achizitii', marketing: 'Marketing', suport: 'Suport Clienti' }[user?.role] || 'Client'}
                    </p>
                  </div>
                  <div style={{ padding: '6px 0' }}>
                    {dropItems.map(item => (
                      <DropItem key={item.to} {...item} navigate={navigate} isActive={isActive} />
                    ))}
                    {['admin','manager','achizitii','marketing','suport'].includes(user?.role) && (
                      <>
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                        <DropItem
                          to="/admin"
                          Icon={GearSix}
                          label={{ admin: 'Panou Admin', manager: 'Panou Manager', achizitii: 'Panou Achizitii', marketing: 'Panou Marketing', suport: 'Panou Suport' }[user?.role]}
                          navigate={navigate} isActive={isActive} accent
                        />
                      </>
                    )}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                    <button
                      onClick={() => { logout(); navigate('/') }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '9px 16px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        color: '#FF4757', fontSize: 13,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        transition: 'background 0.15s', fontFamily: 'Outfit, sans-serif',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <SignOut size={14} /> Deconectare
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <ActionButton
                label="Contul meu"
                sublabel="Autentificare"
                badge={null}
                icon={
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <User size={14} style={{ color: '#8B9EBA' }} />
                  </div>
                }
              />
            </Link>
          )}

          {/* Separator */}
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)', margin: '0 4px' }} />

          {/* Favorite */}
          <div
            ref={favRef}
            className="relative"
            onMouseEnter={() => setFavOpen(true)}
            onMouseLeave={() => setFavOpen(false)}
          >
            <Link to="/wishlist" style={{ textDecoration: 'none' }}>
              <ActionButton
                active={isActive('/wishlist')}
                label="Favorite"
                sublabel={favTotal > 0 ? `${favTotal} ${favTotal === 1 ? 'produs' : 'produse'}` : 'Lista ta'}
                badge={favTotal > 0 ? favTotal : null}
                badgeColor="#FF4757"
                icon={
                  <Heart
                    size={20}
                    weight={isActive('/wishlist') ? 'fill' : 'regular'}
                    style={{ color: isActive('/wishlist') ? '#FF4757' : '#8B9EBA', flexShrink: 0 }}
                  />
                }
                hoverDanger
              />
            </Link>

            {favOpen && favLoaded && (
              <div
                className="absolute animate-slide-down"
                style={{
                  top: 'calc(100% + 8px)', right: 0,
                  background: '#07101C', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 16, minWidth: 280,
                  boxShadow: '0 12px 48px rgba(0,0,0,0.7)', overflow: 'hidden', zIndex: 200,
                }}
              >
                <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#EEF2F7', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Heart size={13} weight="fill" style={{ color: '#FF4757' }} /> Favorite
                  </span>
                  <span style={{ color: '#3E5268', fontSize: 11 }}>{favTotal} {favTotal === 1 ? 'produs' : 'produse'}</span>
                </div>
                {favItems.length === 0 ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center', color: '#3E5268', fontSize: 13 }}>
                    Niciun produs favorit încă
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '6px 0' }}>
                      {[...favItems].slice(-3).reverse().map((item) => (
                        <button
                          key={item.wishlist_id || item.product_id}
                          onClick={() => navigate(`/product/${item.product_id}`)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                            padding: '8px 14px', background: 'transparent', border: 'none',
                            cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f8f9fa', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {item.image_url
                              ? <img src={imgUrl(item.image_url)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              : <Desktop size={20} style={{ color: 'rgba(62,82,104,0.5)' }} />
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: '#EEF2F7', fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                            <p style={{ color: '#FF8C00', fontSize: 12, fontFamily: '"Space Mono", monospace', margin: 0, marginTop: 2 }}>
                              {parseFloat(item.price).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div style={{ padding: '0 12px 12px' }}>
                      <button
                        onClick={() => navigate('/wishlist')}
                        style={{
                          width: '100%', padding: '8px', textAlign: 'center',
                          color: '#0EF6FF', fontSize: 12, fontWeight: 600,
                          background: 'rgba(14,246,255,0.06)', border: '1px solid rgba(14,246,255,0.2)',
                          borderRadius: 10, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,246,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(14,246,255,0.06)'}
                      >
                        Vezi toate favoritele →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)', margin: '0 4px' }} />

          {/* Coșul meu */}
          <Link to="/cart" style={{ textDecoration: 'none' }}>
            <ActionButton
              active={isActive('/cart')}
              label="Coșul meu"
              sublabel={totalItems > 0 ? `${totalItems} ${totalItems === 1 ? 'produs' : 'produse'}` : '0 produse'}
              badge={totalItems > 0 ? totalItems : null}
              badgeColor="#0EF6FF"
              badgeTextColor="#050910"
              badgeGlow
              icon={
                <ShoppingCart
                  size={20}
                  weight={isActive('/cart') ? 'bold' : 'regular'}
                  style={{ color: isActive('/cart') ? '#0EF6FF' : '#8B9EBA', flexShrink: 0 }}
                />
              }
              hoverAccent
            />
          </Link>

        </div>
      </div>

      {/* ══ ROW 2 — Navigation links ══ */}
      <div
        className="flex items-center justify-center"
        style={{
          height: '36px',
          background: 'rgba(5, 9, 16, 0.97)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(14,246,255,0.08)',
        }}
      >
        <div className="flex items-center" style={{ gap: 2 }}>
          {navLinks.map(({ to, label }) => {
            const active = isActive(to)
            return (
              <NavLink key={to} to={to} label={label} active={active} />
            )
          })}
        </div>
      </div>

    </nav>
  )
}

/* ─────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────── */

function ActionButton({ icon, label, sublabel, badge, badgeColor = '#FF4757', badgeTextColor = '#fff', badgeGlow, active, onClick, hoverDanger, hoverAccent, caret, caretOpen }) {
  const [hovered, setHovered] = useState(false)

  const borderColor = active
    ? hoverDanger ? 'rgba(255,71,87,0.3)' : 'rgba(14,246,255,0.3)'
    : hovered
    ? hoverDanger ? 'rgba(255,71,87,0.2)' : 'rgba(255,255,255,0.1)'
    : 'transparent'

  const bgColor = active
    ? hoverDanger ? 'rgba(255,71,87,0.08)' : 'rgba(14,246,255,0.08)'
    : hovered
    ? 'rgba(255,255,255,0.04)'
    : 'transparent'

  const labelColor = active
    ? hoverDanger ? '#FF4757' : '#0EF6FF'
    : hovered
    ? hoverDanger ? '#FF4757' : hoverAccent ? '#0EF6FF' : '#EEF2F7'
    : '#EEF2F7'

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px', borderRadius: 10,
        background: bgColor, border: `1px solid ${borderColor}`,
        cursor: 'pointer', transition: 'all 0.15s',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      {/* Icon + badge */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {icon}
        {badge != null && (
          <span style={{
            position: 'absolute', top: -6, right: -6,
            background: badgeColor, color: badgeTextColor,
            fontSize: 9, fontWeight: 800, lineHeight: 1,
            minWidth: 15, height: 15, borderRadius: 99,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', fontFamily: 'Outfit, sans-serif',
            boxShadow: badgeGlow ? `0 0 8px ${badgeColor}80` : 'none',
          }}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, lineHeight: 1 }}>
        <span style={{ color: '#3E5268', fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap' }}>
          {sublabel}
        </span>
        <span style={{ color: labelColor, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
          {label}
        </span>
      </div>

      {caret && (
        <CaretDown
          size={9}
          weight="bold"
          style={{
            color: '#3E5268',
            transform: caretOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      )}
    </button>
  )
}

function NavLink({ to, label, active }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '6px 12px',
        borderRadius: 7,
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? '#0EF6FF' : hovered ? '#EEF2F7' : '#8B9EBA',
        textDecoration: 'none',
        transition: 'color 0.15s, background 0.15s',
        background: active ? 'rgba(14,246,255,0.07)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        whiteSpace: 'nowrap',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      {label}
      {active && (
        <span style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: 20, height: 2, borderRadius: 2,
          background: '#0EF6FF',
          boxShadow: '0 0 8px rgba(14,246,255,0.6)',
        }} />
      )}
    </Link>
  )
}

function DropItem({ to, Icon, label, navigate, isActive, accent }) {
  const active = isActive(to)
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={() => navigate(to)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', textAlign: 'left',
        padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 13,
        color: accent ? '#FF8C00' : active ? '#0EF6FF' : hovered ? '#EEF2F7' : '#8B9EBA',
        background: active ? 'rgba(14,246,255,0.06)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Outfit, sans-serif',
      }}
    >
      <Icon size={14} weight={active ? 'bold' : 'regular'} />
      {label}
    </button>
  )
}
