import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Lightning, ShoppingCart, User, CaretDown, SignOut,
  Package, Heart, ShieldCheck, ArrowCounterClockwise,
  Wrench, GearSix, MagnifyingGlass, House, Storefront,
  Desktop, Cpu, Robot, Info, Phone, Tag, Question,
} from '@phosphor-icons/react'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import useFavoriteStore from '../store/favoriteStore'
import { cartAPI, wishlistAPI, chatAPI, productsAPI } from '../services/api'
import { imgUrl } from '../utils/imgUrl'
import { detectSlug } from '../utils/categorySearch'

// Navbar fix sticky cu cautare, cos si meniu utilizator cu dropdown
export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { totalItems, setCart } = useCartStore()
  const { items: favItems, totalItems: favTotal, setFavorites, clearFavorites } = useFavoriteStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [suggestions, setSuggestions] = useState({ cats: [], products: [] })
  const [sugLoading, setSugLoading] = useState(false)
  const [catalogCats, setCatalogCats] = useState([])
  const [favOpen, setFavOpen] = useState(false)
  const [favLoaded, setFavLoaded] = useState(false)
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const favRef = useRef(null)
  const debounceRef = useRef(null)
  const isActive = (path) => location.pathname === path

  // Încarcă categoriile din catalog o singură dată
  useEffect(() => {
    chatAPI.categories()
      .then(r => setCatalogCats(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
  }, [])

  // Caută sugestii când utilizatorul scrie
  useEffect(() => {
    const q = searchVal.trim()
    if (!q) { setSuggestions({ cats: [], products: [] }); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSugLoading(true)
      const lower = q.toLowerCase()

      // Potrivire categorii: numele categoriei + aliasuri
      const matchedCats = catalogCats.filter(c => {
        if (c.name.toLowerCase().includes(lower)) return true
        if (c.slug.includes(lower)) return true
        const aliases = SLUG_ALIASES[c.slug] || []
        return aliases.some(a => a.includes(lower) || lower.includes(a))
      })

      // Produse din catalog
      let products = []
      try {
        const r = await productsAPI.getAll({ search: q, limit: 5 })
        products = r.data?.products || []
      } catch { products = [] }

      setSuggestions({ cats: matchedCats.slice(0, 4), products })
      setSugLoading(false)
    }, 250)
  }, [searchVal, catalogCats])

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      cartAPI.get(user.id).then(res => setCart(res.data)).catch(() => {})
      wishlistAPI.get(user.id).then(res => { setFavorites(Array.isArray(res.data) ? res.data : (res.data.items || [])); setFavLoaded(true) }).catch(() => {})
    } else {
      clearFavorites()
      setFavLoaded(false)
    }
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
      if (favRef.current && !favRef.current.contains(e.target)) setFavOpen(false)
    }
    const escHandler = (e) => {
      if (e.key === 'Escape') { setSearchOpen(false); setDropdownOpen(false) }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setDropdownOpen(false); setSearchOpen(false); setFavOpen(false) }, [location.pathname])

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchVal('')
    setSuggestions({ cats: [], products: [] })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchVal.trim()
    if (!q) return
    navigate(`/catalog?search=${encodeURIComponent(q)}`)
    closeSearch()
  }

  const goToProduct = (id) => {
    navigate(`/product/${id}`)
    closeSearch()
  }

  const navLinks = [
    { to: '/',             label: 'Acasă',       Icon: House       },
    { to: '/catalog',      label: 'Catalog',     Icon: Storefront  },
    { to: '/builder',      label: 'PC Builder',  Icon: Cpu         },
    { to: '/chat',         label: 'Prebuilt PC', Icon: Robot       },
    { to: '/faq',          label: 'FAQ',         Icon: Question    },
    { to: '/despre-noi',   label: 'Despre noi',  Icon: Info        },
    { to: '/contact',      label: 'Contact',     Icon: Phone       },
  ]

  const dropItems = [
    { to: '/profile',                Icon: User,                    label: 'Profilul meu'    },
    { to: '/orders',                 Icon: Package,                 label: 'Comenzile mele'  },
    { to: '/profile?tab=vouchers',   Icon: Tag,                     label: 'Voucherele mele' },
    { to: '/wishlist',               Icon: Heart,                   label: 'Favorite'        },
    { to: '/profile?tab=warranties', Icon: ShieldCheck,             label: 'Garanții'        },
    { to: '/profile?tab=returns',    Icon: ArrowCounterClockwise,   label: 'Retururi'        },
    { to: '/profile?tab=service',    Icon: Wrench,                  label: 'Service'         },
  ]

  return (
    <nav className="sticky top-0 z-[1000] h-16 flex items-center justify-between gap-6 px-8
                    bg-base/90 backdrop-blur-xl border-b border-accent/10">

      {/* LOGO */}
      <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0 group">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center
                        shadow-glow-cyan group-hover:shadow-[0_0_28px_rgba(14,246,255,0.55)]
                        transition-shadow duration-200">
          <Lightning size={18} weight="bold" color="#050910" />
        </div>
        <span className="font-display font-extrabold text-[17px] tracking-tight text-primary">
          ALEX <span className="text-accent">COMPUTERS</span>
        </span>
      </Link>

      {/* NAV LINKS */}
      <div className="flex items-center gap-1 flex-1 justify-center">
        {navLinks.map(({ to, label, Icon }) => {
          const active = isActive(to)
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                         no-underline transition-all duration-150 whitespace-nowrap relative
                         ${active
                           ? 'text-accent font-semibold'
                           : 'text-secondary hover:text-primary hover:bg-white/[0.04]'
                         }`}
            >
              <Icon size={15} weight={active ? 'bold' : 'regular'} />
              {label}
              {active && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-accent rounded-full" />
              )}
            </Link>
          )
        })}
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Search */}
        <div ref={searchRef} className="relative flex items-center">
          {searchOpen ? (
            <div className="relative">
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  autoFocus
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  placeholder="Caută produse, categorii..."
                  className="w-64 bg-base-2 border border-accent/20 text-primary text-sm
                             rounded-lg px-3 py-1.5 outline-none placeholder:text-muted
                             focus:border-accent/40 focus:shadow-[0_0_0_3px_rgba(14,246,255,0.08)]"
                />
                <button type="submit" className="ml-1 p-1.5 text-secondary hover:text-accent transition-colors">
                  <MagnifyingGlass size={16} weight="regular" />
                </button>
              </form>

              {/* Dropdown sugestii produse */}
              {searchVal.trim() && suggestions.products.length > 0 && (
                <div className="absolute top-full left-0 mt-1.5 w-80 bg-[#0d1117] border border-white/[0.1]
                                rounded-xl shadow-2xl overflow-hidden z-[9999]">
                  <p className="text-muted text-[11px] font-semibold uppercase tracking-wider px-3 pt-3 pb-1">
                    Produse
                  </p>
                  {suggestions.products.map(p => {
                    const imgSrc = p.image_url || p.image
                    const price = p.discount_percent > 0
                      ? (p.price * (1 - p.discount_percent / 100)).toFixed(0)
                      : p.price
                    return (
                      <button key={p.id} onClick={() => goToProduct(p.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.05]
                                         transition-colors cursor-pointer text-left">
                        {imgSrc
                          ? <img src={imgUrl(imgSrc)} alt={p.name}
                                 className="w-8 h-8 object-contain rounded-lg bg-white/5 shrink-0" />
                          : <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                              <Package size={14} className="text-muted/40" />
                            </div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-primary text-[12px] font-semibold truncate">{p.name}</p>
                          <p className="text-accent text-[11px] font-mono">{price} RON</p>
                        </div>
                      </button>
                    )
                  })}
                  <div className="border-t border-white/[0.06] px-3 py-2">
                    <button onClick={handleSearch}
                            className="text-accent text-[12px] hover:underline cursor-pointer w-full text-left">
                      Caută „{searchVal.trim()}" în tot catalogul →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-secondary hover:text-primary hover:bg-white/[0.04]
                         rounded-lg transition-all duration-150"
            >
              <MagnifyingGlass size={17} weight="regular" />
            </button>
          )}
        </div>

        {/* Favorites */}
        {isAuthenticated && (
          <div
            ref={favRef}
            className="relative flex items-center"
            onMouseEnter={() => setFavOpen(true)}
            onMouseLeave={() => setFavOpen(false)}
          >
            <Link
              to="/wishlist"
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                          font-medium no-underline transition-all duration-150
                          ${isActive('/wishlist')
                            ? 'text-danger bg-danger/10 border border-danger/30'
                            : 'text-secondary hover:text-danger hover:bg-danger/[0.06] border border-transparent'
                          }`}
            >
              <Heart size={17} weight={isActive('/wishlist') ? 'fill' : 'regular'} />
              {favTotal > 0 && (
                <span className="bg-danger text-white text-[10px] font-extrabold font-mono
                                 min-w-[18px] h-[18px] rounded-full px-1 flex items-center justify-center">
                  {favTotal > 99 ? '99+' : favTotal}
                </span>
              )}
            </Link>

            {/* Hover dropdown — ultimele 3 favorite */}
            {favOpen && favLoaded && (
              <div className="absolute top-[calc(100%+6px)] right-0 bg-base-1 border border-white/[0.09]
                              rounded-2xl min-w-[280px] shadow-elevated z-[200] animate-fade-in overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-primary font-semibold text-sm flex items-center gap-2">
                    <Heart size={14} weight="fill" className="text-danger" /> Favorite
                  </span>
                  <span className="text-muted text-[11px]">{favTotal} {favTotal === 1 ? 'produs' : 'produse'}</span>
                </div>

                {favItems.length === 0 ? (
                  <div className="px-4 py-5 text-center text-muted text-sm">
                    Niciun produs favorit încă
                  </div>
                ) : (
                  <>
                    <div className="py-1.5">
                      {[...favItems].slice(-3).reverse().map((item) => (
                        <button
                          key={item.wishlist_id || item.product_id}
                          onClick={() => navigate(`/product/${item.product_id}`)}
                          className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-white/[0.04]
                                     transition-colors bg-transparent border-none cursor-pointer text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[#f8f9fa] flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {item.image_url
                              ? <img src={imgUrl(item.image_url)} alt={item.name}
                                     className="w-full h-full object-contain" />
                              : <Desktop size={20} className="text-muted/40" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-primary text-[13px] font-medium leading-tight truncate">{item.name}</p>
                            <p className="text-price text-[12px] font-bold font-mono mt-0.5">
                              {parseFloat(item.price).toLocaleString('ro-RO', { minimumFractionDigits: 2 })} RON
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="px-3 pb-3">
                      <button
                        onClick={() => navigate('/wishlist')}
                        className="w-full py-2 text-center text-accent text-[12px] font-semibold
                                   bg-accent/[0.06] border border-accent/20 rounded-xl hover:bg-accent/10
                                   transition-colors cursor-pointer"
                      >
                        Vezi toate favoritele →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Cart */}
        <Link
          to="/cart"
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                      font-medium no-underline transition-all duration-150
                      ${isActive('/cart')
                        ? 'text-accent bg-accent-dim border border-accent'
                        : 'text-secondary hover:text-primary hover:bg-white/[0.04] border border-transparent'
                      }`}
        >
          <ShoppingCart size={17} weight={isActive('/cart') ? 'bold' : 'regular'} />
          <span>Coș</span>
          {totalItems > 0 && (
            <span className="bg-accent text-base text-[10px] font-extrabold font-mono
                             min-w-[18px] h-[18px] rounded-full px-1 flex items-center justify-center
                             shadow-glow-cyan">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.08]" />

        {/* Auth */}
        {isAuthenticated ? (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer
                         ${dropdownOpen
                           ? 'bg-accent-dim border-accent/30'
                           : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]'
                         }`}
            >
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center
                              text-[11px] font-extrabold text-base font-display shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-primary text-sm font-medium max-w-[90px] truncate">
                {user?.name}
              </span>
              <CaretDown
                size={11}
                weight="bold"
                className={`text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 bg-base-1 border border-white/[0.09]
                              rounded-2xl min-w-[210px] shadow-elevated overflow-hidden z-[200]
                              animate-fade-in">
                <div className="px-4 py-3.5 border-b border-white/[0.06] bg-accent/[0.04]">
                  <p className="text-primary font-display font-bold text-sm mb-0.5">{user?.name}</p>
                  <p className="text-muted text-[11px] font-medium uppercase tracking-widest">
                    {{ admin: 'Administrator', manager: 'Manager', achizitii: 'Achizitii', marketing: 'Marketing', suport: 'Suport Clienti' }[user?.role] || 'Client'}
                  </p>
                </div>
                <div className="py-1.5">
                  {dropItems.map(item => (
                    <DropItem key={item.to} {...item} navigate={navigate} isActive={isActive} />
                  ))}
                  {['admin','manager','achizitii','marketing','suport'].includes(user?.role) && (
                    <>
                      <div className="h-px bg-white/[0.06] my-1" />
                      <DropItem
                        to="/admin"
                        Icon={GearSix}
                        label={{ admin: 'Panou Admin', manager: 'Panou Manager', achizitii: 'Panou Achizitii', marketing: 'Panou Marketing', suport: 'Panou Suport' }[user?.role]}
                        navigate={navigate} isActive={isActive} accent
                      />
                    </>
                  )}
                  <div className="h-px bg-white/[0.06] my-1" />
                  <button
                    onClick={() => { logout(); navigate('/') }}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-danger
                               text-sm bg-transparent border-none cursor-pointer
                               hover:bg-danger/[0.08] transition-colors duration-150"
                  >
                    <SignOut size={14} weight="regular" /> Deconectare
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              to="/login"
              className="text-secondary text-sm font-medium px-3 py-1.5 rounded-lg
                         no-underline border border-transparent
                         hover:text-primary hover:bg-white/[0.04] transition-all duration-150"
            >
              Autentificare
            </Link>
            <Link
              to="/register"
              className="bg-accent text-base text-sm font-bold px-5 py-2 rounded-lg
                         no-underline shadow-glow-cyan tracking-[0.2px]
                         hover:shadow-[0_0_24px_rgba(14,246,255,0.55)] hover:-translate-y-px
                         transition-all duration-150"
            >
              Cont nou
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

// Element din dropdown-ul de utilizator; suporta stil accent pentru linkuri speciale (ex: Admin)
function DropItem({ to, Icon, label, navigate, isActive, accent }) {
  const active = isActive(to)
  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm
                  bg-transparent border-none cursor-pointer transition-all duration-150
                  ${accent
                    ? 'text-price hover:bg-price/[0.07]'
                    : active
                      ? 'text-accent bg-accent-dim hover:bg-accent-dim'
                      : 'text-secondary hover:text-primary hover:bg-white/[0.04]'
                  }`}
    >
      <Icon size={14} weight={active ? 'bold' : 'regular'} />
      {label}
    </button>
  )
}
