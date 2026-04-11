# PCShop Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the PCShop frontend into a premium Dark Navy + Electric Cyan e-commerce experience by systematizing styles via Tailwind semantic tokens, replacing all emojis with Phosphor Icons, purging the old `#42A5F5` blue, and migrating all 16 pages away from inline styles.

**Architecture:** Foundation-first approach — set up design system (Tailwind config + Phosphor), refactor shared components (Navbar, Footer, ChatWidget, CompareBar), then migrate pages one by one. Each task leaves the site in a working state. CSS variables in `index.css` remain the single source of truth; Tailwind reads them via `tailwind.config.js`.

**Tech Stack:** React 19, Vite 8, Tailwind CSS v3.4, Zustand, React Router v7, `@phosphor-icons/react`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add `@phosphor-icons/react` |
| `tailwind.config.js` | Modify | Semantic token mapping to CSS vars |
| `src/index.css` | Modify | Add `.ph-duotone` rule, `animate-glow-pulse`, `animate-shimmer` |
| `src/components/Navbar.jsx` | Modify | Phosphor icons, Tailwind classes, active underline, search |
| `src/components/Footer.jsx` | Modify | 3-column layout with Tailwind |
| `src/components/ChatWidget.jsx` | Modify | Phosphor icons, token colors, Tailwind classes |
| `src/App.jsx` | Modify | CompareBar: Phosphor `Scales`, token colors, Tailwind |
| `src/pages/HomePage.jsx` | Modify | Full Tailwind + Phosphor refactor |
| `src/pages/Home.jsx` | Modify | Catalog: Tailwind + Phosphor |
| `src/pages/ProductDetail.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/Cart.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/Checkout.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/Login.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/Register.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/Orders.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/Wishlist.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/Profile.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/Configurator.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/PCBuilder.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/Compare.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/Chat.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/FAQ.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/DespreNoi.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/Contact.jsx` | Modify | Tailwind + Phosphor |
| `src/pages/Admin.jsx` | Modify | Tailwind + Phosphor |
| `src/components/PCBuilderSidebar.jsx` | Modify | Tailwind + Phosphor |

---

## Phase 0 — Foundation

### Task 1: Install Phosphor Icons

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
cd c:/pcshop-frontend && npm install @phosphor-icons/react
```

Expected output: `added X packages` with no errors.

- [ ] **Step 2: Verify dev server still starts**

```bash
npm run dev
```

Expected: Vite server starts on `http://localhost:5173` with no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install @phosphor-icons/react"
```

---

### Task 2: Extend Tailwind config with semantic tokens

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Replace tailwind.config.js**

Replace the entire contents of `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'base':           'var(--bg-0)',
        'base-1':         'var(--bg-1)',
        'base-2':         'var(--bg-2)',
        'surface':        'var(--bg-card)',
        'surface-hover':  'var(--bg-card-hover)',
        'surface-raised': 'var(--bg-raised)',
        // Accent — electric cyan
        'accent':         'var(--cyan)',
        'accent-mid':     'var(--cyan-mid)',
        'accent-dim':     'var(--cyan-dim)',
        'accent-glow':    'var(--cyan-glow)',
        'accent-border':  'var(--cyan-border)',
        // Accent — amber (prices, CTAs)
        'price':          'var(--amber)',
        'price-dim':      'var(--amber-dim)',
        'price-glow':     'var(--amber-glow)',
        'price-border':   'var(--amber-border)',
        // Semantic
        'success':        'var(--green)',
        'danger':         'var(--red)',
        'violet':         'var(--violet)',
        // Text
        'primary':        'var(--text-1)',
        'secondary':      'var(--text-2)',
        'muted':          'var(--text-3)',
        // Borders (used as background colors for dividers)
        'border-subtle':  'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'border-strong':  'var(--border-strong)',
        'border-accent':  'var(--cyan-border)',
      },
      borderColor: {
        'subtle':  'var(--border-subtle)',
        'default': 'var(--border-default)',
        'strong':  'var(--border-strong)',
        'accent':  'var(--cyan-border)',
        'price':   'var(--amber-border)',
      },
      boxShadow: {
        'card':       'var(--shadow-card)',
        'elevated':   'var(--shadow-elevated)',
        'glow-cyan':  'var(--shadow-cyan)',
        'glow-amber': 'var(--shadow-amber)',
      },
      borderRadius: {
        'sm': 'var(--r-sm)',
        'md': 'var(--r-md)',
        'lg': 'var(--r-lg)',
        'xl': 'var(--r-xl)',
      },
      fontFamily: {
        'display': ['Syne', 'sans-serif'],
        'body':    ['Outfit', 'sans-serif'],
        'mono':    ['"Space Mono"', 'monospace'],
      },
      animation: {
        'glow-pulse':   'glow-pulse 2s ease-in-out infinite',
        'fade-up':      'fadeUpIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':      'fadeIn 0.15s ease both',
        'slide-right':  'slideInRight 0.3s ease both',
        'pulse-border': 'pulse-border 2s ease-in-out infinite',
        'shimmer':      'shimmer-text 3s linear infinite',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Verify Tailwind classes work**

Run `npm run dev`, open browser, open DevTools. In the console run:
```js
document.body.classList.add('bg-base')
```
Body background should visibly change to `#050910`. Remove it after.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: extend tailwind config with semantic design tokens"
```

---

### Task 3: Update index.css — Phosphor duotone + new animations

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add Phosphor duotone global rule and new keyframes**

After the `@keyframes shimmer-text` block (around line 142), add:

```css
@keyframes glow-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

At the very end of the file, add:

```css
/* ─────────────────────────────────────────────────────────────
   PHOSPHOR ICONS — DUOTONE OPACITY
───────────────────────────────────────────────────────────── */
.ph-duotone {
  --ph-fill-opacity: 0.2;
}

/* ─────────────────────────────────────────────────────────────
   SEARCH INPUT EXPAND ANIMATION
───────────────────────────────────────────────────────────── */
.search-expand {
  transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

/* ─────────────────────────────────────────────────────────────
   PRODUCT IMAGE — white bg for transparent product photos
───────────────────────────────────────────────────────────── */
.product-img-bg {
  background: #f8f9fa;
}
```

- [ ] **Step 2: Verify no CSS errors**

Run `npm run dev`. Check browser console — no CSS parse errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add phosphor duotone rule and search animation to index.css"
```

---

## Phase 1 — Shared Components

### Task 4: Refactor Navbar

**Files:**
- Modify: `src/components/Navbar.jsx`

- [ ] **Step 1: Replace Navbar.jsx entirely**

```jsx
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  Lightning, ShoppingCart, User, CaretDown, SignOut,
  Package, Heart, ShieldCheck, ArrowCounterClockwise,
  Wrench, GearSix, MagnifyingGlass, House, Storefront,
  Desktop, Cpu, Robot, Info, Phone,
} from '@phosphor-icons/react'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import { cartAPI } from '../services/api'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { totalItems, setCart } = useCartStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const isActive = (path) => location.pathname === path

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      cartAPI.get(user.id).then(res => setCart(res.data)).catch(() => {})
    }
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setDropdownOpen(false); setSearchOpen(false) }, [location.pathname])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal('')
      setSearchOpen(false)
    }
  }

  const navLinks = [
    { to: '/',             label: 'Acasă',       Icon: House       },
    { to: '/catalog',      label: 'Catalog',     Icon: Storefront  },
    { to: '/builder',      label: 'PC Builder',  Icon: Desktop     },
    { to: '/configurator', label: 'Configurator',Icon: Cpu         },
    { to: '/chat',         label: 'AI Asistent', Icon: Robot       },
    { to: '/despre-noi',   label: 'Despre noi',  Icon: Info        },
    { to: '/contact',      label: 'Contact',     Icon: Phone       },
  ]

  const dropItems = [
    { to: '/profile',                Icon: User,                    label: 'Profilul meu'    },
    { to: '/orders',                 Icon: Package,                 label: 'Comenzile mele'  },
    { to: '/profile?tab=vouchers',   Icon: GearSix,                 label: 'Voucherele mele' },
    { to: '/wishlist',               Icon: Heart,                   label: 'Wishlist'        },
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
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                autoFocus
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Caută produse..."
                className="search-expand w-48 bg-base-2 border border-accent/20 text-primary
                           text-sm rounded-lg px-3 py-1.5 outline-none placeholder:text-muted
                           focus:border-accent/40 focus:shadow-[0_0_0_3px_rgba(14,246,255,0.08)]"
              />
              <button type="submit" className="ml-1 p-1.5 text-secondary hover:text-accent transition-colors">
                <MagnifyingGlass size={16} weight="regular" />
              </button>
            </form>
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

        {/* Cart */}
        <Link
          to="/cart"
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                      font-medium no-underline transition-all duration-150
                      ${isActive('/cart')
                        ? 'text-accent bg-accent-dim border border-accent-border'
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
                           : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/15'
                         }`}
            >
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center
                              text-[11px] font-extrabold text-base font-display shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-primary text-sm font-medium max-w-[90px] truncate">
                {user?.name}
              </span>
              <span className="text-muted">
                <CaretDown
                  size={11}
                  weight="bold"
                  style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}
                />
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 bg-base-1 border border-white/[0.09]
                              rounded-2xl min-w-[210px] shadow-elevated overflow-hidden z-[200]
                              animate-fade-in">
                <div className="px-4 py-3.5 border-b border-white/[0.06] bg-accent/[0.04]">
                  <p className="text-primary font-display font-bold text-sm mb-0.5">{user?.name}</p>
                  <p className="text-muted text-[11px] font-medium uppercase tracking-widest">
                    {user?.role === 'admin' ? 'Administrator' : 'Client'}
                  </p>
                </div>
                <div className="py-1.5">
                  {dropItems.map(item => (
                    <DropItem key={item.to} {...item} navigate={navigate} isActive={isActive} />
                  ))}
                  {user?.role === 'admin' && (
                    <>
                      <div className="h-px bg-white/[0.06] my-1" />
                      <DropItem to="/admin" Icon={GearSix} label="Panou Admin"
                        navigate={navigate} isActive={isActive} accent />
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
```

- [ ] **Step 2: Verify in browser**

Run `npm run dev`. Navigate to `/`. Check:
- Logo shows lightning bolt icon (no emoji)
- Nav links have small Phosphor icons
- Active link has cyan underline, not background pill
- Search icon expands to input on click
- Cart badge renders correctly
- User dropdown has Phosphor icons

- [ ] **Step 3: Commit**

```bash
git add src/components/Navbar.jsx
git commit -m "feat: refactor Navbar with Phosphor icons and Tailwind semantic tokens"
```

---

### Task 5: Refactor Footer

**Files:**
- Modify: `src/components/Footer.jsx`

- [ ] **Step 1: Replace Footer.jsx**

```jsx
import { Link } from 'react-router-dom'
import { Lightning, EnvelopeSimple, Phone, ArrowRight } from '@phosphor-icons/react'

const quickLinks = [
  { to: '/catalog',      label: 'Catalog Produse' },
  { to: '/configurator', label: 'Configurator PC'  },
  { to: '/builder',      label: 'PC Builder'       },
  { to: '/chat',         label: 'AI Asistent'      },
  { to: '/faq',          label: 'FAQ'              },
]

const legalLinks = [
  { to: '/despre-noi', label: 'Despre Noi'              },
  { to: '/contact',    label: 'Contact'                  },
  { to: '/faq',        label: 'Politică Confidențialitate'},
]

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-base/95 mt-12">
      <div className="max-w-[1500px] mx-auto px-8 py-12 grid grid-cols-3 gap-10">

        {/* Col 1 — Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2.5 no-underline mb-4 group">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center
                            shadow-glow-cyan group-hover:shadow-[0_0_28px_rgba(14,246,255,0.5)]
                            transition-shadow duration-200">
              <Lightning size={18} weight="bold" color="#050910" />
            </div>
            <span className="font-display font-extrabold text-base text-primary">
              ALEX <span className="text-accent">COMPUTERS</span>
            </span>
          </Link>
          <p className="text-secondary text-sm leading-relaxed mb-5 max-w-[240px]">
            Componentele tale, configurate perfect. Livrare rapidă, garanție 24 luni.
          </p>
          <div className="flex flex-col gap-2.5">
            <a
              href="mailto:aa387@student.ugal.ro"
              className="flex items-center gap-2 text-muted text-sm no-underline
                         hover:text-accent transition-colors duration-150 group"
            >
              <EnvelopeSimple size={14} weight="duotone" className="text-accent shrink-0" />
              aa387@student.ugal.ro
            </a>
            <a
              href="tel:0770648476"
              className="flex items-center gap-2 text-muted text-sm no-underline
                         hover:text-accent transition-colors duration-150 group"
            >
              <Phone size={14} weight="duotone" className="text-accent shrink-0" />
              0770 648 476
            </a>
          </div>
        </div>

        {/* Col 2 — Quick Links */}
        <div>
          <h4 className="font-display font-bold text-primary text-sm uppercase tracking-widest mb-4">
            Navigare
          </h4>
          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {quickLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center gap-1.5 text-sm text-secondary no-underline
                             hover:text-accent transition-colors duration-150 group"
                >
                  <ArrowRight
                    size={12}
                    weight="bold"
                    className="text-accent opacity-0 group-hover:opacity-100 -translate-x-1
                               group-hover:translate-x-0 transition-all duration-150"
                  />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 — Legal */}
        <div>
          <h4 className="font-display font-bold text-primary text-sm uppercase tracking-widest mb-4">
            Informații
          </h4>
          <ul className="flex flex-col gap-2 list-none p-0 m-0 mb-6">
            {legalLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center gap-1.5 text-sm text-secondary no-underline
                             hover:text-accent transition-colors duration-150 group"
                >
                  <ArrowRight
                    size={12}
                    weight="bold"
                    className="text-accent opacity-0 group-hover:opacity-100 -translate-x-1
                               group-hover:translate-x-0 transition-all duration-150"
                  />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-muted text-xs">
            © {new Date().getFullYear()} Alex Computers.<br />Toate drepturile rezervate.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.04] py-3 px-8">
        <p className="text-muted text-xs text-center">
          Prețurile afișate includ TVA. Ofertele sunt valabile în limita stocului disponibil.
        </p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Verify in browser**

Check footer renders 3 columns with links, hover arrows animate, contact links work.

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.jsx
git commit -m "feat: refactor Footer to 3-column layout with Phosphor icons and Tailwind"
```

---

### Task 6: Refactor ChatWidget

**Files:**
- Modify: `src/components/ChatWidget.jsx`

- [ ] **Step 1: Replace the imports and constants at the top**

Replace lines 1–23 with:

```jsx
import { useState, useEffect, useRef } from 'react'
import {
  ChatCircleDots, X, Robot, CurrencyDollar, Target,
  ArrowLeft, ShoppingCart, Check, Warning, Cpu,
  Monitor, CircuitBoard, Memory, Lightning as LightningIcon,
  Package, HardDrive, Thermometer,
} from '@phosphor-icons/react'
import { chatAPI, cartAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'

const USE_CASES = [
  { value: 'gaming',       label: 'Gaming'         },
  { value: 'video',        label: 'Editare video'   },
  { value: 'office',       label: 'Office'          },
  { value: 'productivity', label: 'Productivitate'  },
  { value: 'streaming',    label: 'Streaming'       },
]

const COMP_META = {
  cpu:         { label: 'Procesor',      Icon: Cpu,          color: 'var(--cyan)'   },
  gpu:         { label: 'Placa video',   Icon: Monitor,      color: 'var(--violet)' },
  motherboard: { label: 'Placa de baza', Icon: CircuitBoard, color: 'var(--amber)'  },
  ram:         { label: 'Memorie RAM',   Icon: Memory,       color: 'var(--green)'  },
  psu:         { label: 'Sursa',         Icon: LightningIcon,color: 'var(--red)'    },
  case:        { label: 'Carcasa',       Icon: Package,      color: '#80CBC4'       },
  storage:     { label: 'Stocare',       Icon: HardDrive,    color: 'var(--amber)'  },
  cooler:      { label: 'Cooler',        Icon: Thermometer,  color: '#81D4FA'       },
}
```

- [ ] **Step 2: Replace the JSX return block**

Replace from `return (` to end of component with:

```jsx
  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {open && (
        <div className="absolute bottom-[76px] right-0 w-[360px] max-h-[560px]
                        bg-base/98 rounded-2xl border border-accent/15 flex flex-col overflow-hidden
                        backdrop-blur-xl shadow-elevated animate-fade-in">

          {/* Header */}
          <div className="bg-gradient-to-r from-base-1 to-base-2 px-4 py-3.5
                          border-b border-accent/20 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-accent-dim border border-accent-border
                              flex items-center justify-center">
                <Robot size={18} weight="duotone" className="text-accent" />
              </div>
              <div>
                <div className="text-primary font-semibold text-sm">Configurator PC</div>
                <div className="text-accent text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                  Îți fac o configurație pe buget
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 border-none text-secondary
                         flex items-center justify-center cursor-pointer
                         hover:bg-white/20 hover:text-primary transition-all duration-150"
            >
              <X size={13} weight="bold" />
            </button>
          </div>

          {/* Body */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
            {!result ? (
              <>
                <div className="bg-accent-dim border border-accent-border rounded-xl p-3 pr-4">
                  <p className="text-primary text-[13px] leading-relaxed m-0">
                    <strong>Salut!</strong> Spune-mi bugetul și pentru ce vrei PC-ul, și îți generez o configurație completă, 100% compatibilă!
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-secondary text-xs font-semibold mb-1.5">
                    <CurrencyDollar size={13} weight="bold" className="text-accent" />
                    Buget (RON)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={e => { setBudget(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && !result && handleGenerate()}
                    placeholder={minBudget ? `Minim ${Math.ceil(minBudget)} RON` : 'Ex: 5000'}
                    className="w-full bg-white/5 border border-white/10 text-primary px-3.5 py-2.5
                               rounded-xl text-[15px] font-semibold outline-none placeholder:text-muted
                               focus:border-accent/40 focus:shadow-[0_0_0_3px_rgba(14,246,255,0.08)]
                               transition-all duration-150"
                    style={{ borderColor: error && budgetNum > 0 && budgetNum < minBudget ? 'var(--red)' : undefined }}
                  />
                  {minBudget && (
                    <div className="flex justify-between mt-1.5">
                      <span className="text-muted text-[11px]">Min: {Math.ceil(minBudget)} RON</span>
                      <span className="text-muted text-[11px]">Max: {Math.ceil(maxBudget)} RON</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-secondary text-xs font-semibold mb-2">
                    <Target size={13} weight="bold" className="text-accent" />
                    Pentru ce folosești PC-ul?
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {USE_CASES.map(uc => (
                      <button
                        key={uc.value}
                        onClick={() => setUseCase(uc.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer
                                   border transition-all duration-150
                                   ${useCase === uc.value
                                     ? 'bg-accent text-base border-accent font-bold'
                                     : 'bg-white/5 border-white/10 text-secondary hover:border-accent/30 hover:text-primary'
                                   }`}
                      >
                        {uc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-danger text-xs bg-danger/[0.08]
                                  border border-danger/20 rounded-xl px-3 py-2">
                    <Warning size={13} weight="bold" className="shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading || !budget}
                  className={`w-full py-3 rounded-xl text-sm font-bold border-none transition-all duration-150
                             ${loading || !budget
                               ? 'bg-white/5 text-muted cursor-not-allowed'
                               : 'bg-accent text-base cursor-pointer hover:shadow-glow-cyan hover:-translate-y-px'
                             }`}
                >
                  {loading ? 'Se generează...' : 'Generează configurația'}
                </button>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-success text-[13px] font-bold flex items-center gap-1.5">
                    <Check size={14} weight="bold" />
                    Configurație {USE_CASES.find(u => u.value === useCase)?.label}
                  </span>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 bg-white/[0.06] border border-white/10
                               text-secondary px-2.5 py-1 rounded-lg text-[11px] cursor-pointer
                               hover:text-primary transition-colors duration-150"
                  >
                    <ArrowLeft size={11} weight="bold" /> Înapoi
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  {Object.entries(result.configuration || {}).map(([role, comp]) => {
                    const meta = COMP_META[role] || { label: role, Icon: Package, color: 'var(--text-2)' }
                    const { Icon: CompIcon } = meta
                    return (
                      <div
                        key={role}
                        className="bg-white/[0.04] rounded-xl p-2.5 flex justify-between items-center"
                        style={{ borderLeft: `2px solid ${meta.color}` }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <CompIcon size={14} weight="duotone" style={{ color: meta.color, flexShrink: 0 }} />
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>
                              {meta.label}
                            </div>
                            <div className="text-primary text-[12px] truncate">{comp.name}</div>
                          </div>
                        </div>
                        <span className="text-accent font-bold text-xs font-mono shrink-0 ml-2">
                          {comp.price} RON
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="bg-success/[0.06] border border-success/20 rounded-xl p-2.5
                                flex justify-between items-center">
                  <div>
                    <div className="text-success text-[13px] font-bold">Total: {result.total_price} RON</div>
                    {result.budget_remaining > 0 && (
                      <div className="text-muted text-[11px]">Rămas: {result.budget_remaining} RON</div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[11px] font-bold
                    ${result.is_compatible ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                    {result.is_compatible ? '✓ Compatibil' : '⚠ Verificați'}
                  </span>
                </div>

                {result.compatibility_notes?.length > 0 && (
                  <div className="bg-price/[0.08] border border-price/20 rounded-xl p-2.5 flex flex-col gap-1">
                    {result.compatibility_notes.map((w, i) => (
                      <div key={i} className="text-price text-[11px] flex items-center gap-1.5">
                        <Warning size={11} weight="bold" /> {w}
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="text-danger text-xs flex items-center gap-1.5">
                    <Warning size={12} weight="bold" /> {error}
                  </div>
                )}

                {cartAdded ? (
                  <div className="text-center py-2.5 bg-success/[0.08] rounded-xl
                                  border border-success/20 text-success text-[13px] font-bold
                                  flex items-center justify-center gap-2">
                    <Check size={14} weight="bold" /> Adăugat în coș!
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={cartLoading}
                    className={`w-full py-2.5 rounded-xl text-[13px] font-bold border-none
                               transition-all duration-150
                               ${cartLoading
                                 ? 'bg-white/5 text-muted cursor-not-allowed'
                                 : 'bg-success text-base cursor-pointer hover:shadow-[0_4px_16px_rgba(0,229,160,0.4)] hover:-translate-y-px'
                               }`}
                  >
                    {cartLoading ? 'Se adaugă...' : 'Adaugă toate în coș'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full border-none cursor-pointer flex items-center justify-center
                   transition-all duration-300 hover:scale-110
                   ${open
                     ? 'bg-white/10 border border-white/10 text-secondary shadow-none'
                     : 'bg-accent text-base shadow-glow-cyan animate-glow-pulse'
                   }`}
      >
        {open
          ? <X size={20} weight="bold" />
          : <ChatCircleDots size={26} weight="duotone" />
        }
      </button>
    </div>
  )
```

- [ ] **Step 3: Remove the inline `<style>` tag at the bottom**

Delete the `<style>{` ... `}</style>` block at the bottom of the component (lines ~350–356 in original). The glow-pulse animation now comes from Tailwind's `animate-glow-pulse`.

- [ ] **Step 4: Verify in browser**

The floating button should show Phosphor `ChatCircleDots` duotone icon. Clicking opens the panel. All emojis should be gone.

- [ ] **Step 5: Commit**

```bash
git add src/components/ChatWidget.jsx
git commit -m "feat: refactor ChatWidget with Phosphor icons and Tailwind tokens"
```

---

### Task 7: Refactor CompareBar in App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add Phosphor import to App.jsx**

At the top of `src/App.jsx`, add to imports:
```jsx
import { Scales, X as XIcon, Trash } from '@phosphor-icons/react'
```

- [ ] **Step 2: Replace the CompareBar component**

Replace the entire `CompareBar` function with:

```jsx
function CompareBar() {
  const { items, remove, clear } = useCompareStore()
  const navigate = useNavigate()
  if (items.length === 0) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] bg-base/97 backdrop-blur-xl
                    border-t border-accent/30 px-8 py-3 flex items-center gap-4
                    shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
      <span className="text-accent text-xs font-bold whitespace-nowrap flex items-center gap-1.5">
        <Scales size={14} weight="bold" />
        Comparare ({items.length}/3):
      </span>
      <div className="flex gap-2.5 flex-1 flex-wrap">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-2 bg-accent-dim border border-accent-border
                       rounded-lg px-2.5 py-1.5"
          >
            {item.image_url && (
              <img
                src={imgUrl(item.image_url)}
                alt={item.name}
                className="w-7 h-7 object-cover rounded"
              />
            )}
            <span className="text-primary text-xs font-semibold max-w-[130px] truncate">
              {item.name}
            </span>
            <button
              onClick={() => remove(item.id)}
              className="bg-transparent border-none text-muted cursor-pointer
                         hover:text-danger transition-colors duration-150 flex items-center"
            >
              <XIcon size={14} weight="bold" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => navigate('/compare')}
          className="bg-accent text-base border-none px-5 py-2 rounded-lg cursor-pointer
                     font-bold text-sm shadow-glow-cyan whitespace-nowrap
                     hover:shadow-[0_4px_16px_rgba(14,246,255,0.55)] hover:-translate-y-px
                     transition-all duration-150"
        >
          Compară acum
        </button>
        <button
          onClick={clear}
          className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-secondary
                     px-3 py-2 rounded-lg cursor-pointer text-xs
                     hover:text-danger hover:border-danger/30 transition-all duration-150"
        >
          <Trash size={13} weight="regular" /> Șterge
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify compare bar**

Add a product to compare from the catalog, check the compare bar appears without old blue or emojis.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: refactor CompareBar with Phosphor icons and Tailwind tokens"
```

---

## Phase 2 — Pages

> **Pattern note for all page tasks:** The refactor pattern is consistent across all pages:
> 1. Replace all `style={{ ... }}` inline props with Tailwind class strings
> 2. Replace all `#42A5F5` / `#1565C0` with `text-accent` / `bg-accent` / `border-accent` tokens
> 3. Replace emoji icons with appropriate Phosphor icons (see icon mapping below)
> 4. Replace `onMouseEnter`/`onMouseLeave` JS hover logic with Tailwind `hover:` classes
> 5. Snap magic number spacing to Tailwind scale (e.g. `padding: 13px` → `py-3`)
>
> **Phosphor icon mapping for pages:**
> - ⚙️ CPU → `<Cpu />`
> - 🎮 GPU → `<Monitor />`
> - 💾 RAM → `<Memory />`
> - 🖥️ Motherboard → `<CircuitBoard />`
> - 💿 Storage → `<HardDrive />`
> - ⚡ PSU → `<Lightning />`
> - 📦 Case → `<Package />`
> - ❄️ Cooler → `<Thermometer />`
> - 🖱️ Peripherals → `<Mouse />`
> - 🖥️ Monitor → `<Desktop />`
> - 🛒 Cart → `<ShoppingCart />`
> - ❤️ Wishlist → `<Heart />`
> - ⭐ Featured → `<Star />`
> - 🛡️ Shield → `<ShieldCheck />`
> - 🚚 Shipping → `<Truck />`
> - 🔒 Security → `<Lock />`
> - 🔧 Tool → `<Wrench />`
> - 💬 Chat → `<ChatCircle />`
> - 📧 Email → `<EnvelopeSimple />`
> - 📞 Phone → `<Phone />`
> - ✅ Success → `<Check />`
> - ❌ Error → `<XCircle />`
> - ⚠️ Warning → `<Warning />`
> - ⏳ Loading → spinner via CSS `animate-spin` on a `<CircleNotch />` icon

---

### Task 8: Refactor HomePage

**Files:**
- Modify: `src/pages/HomePage.jsx`

- [ ] **Step 1: Replace imports and categoryIcons map**

```jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Lightning, Storefront, Wrench, Robot, ShoppingCart, Check,
  CircleNotch, Star, Truck, ShieldCheck, Lock, Cpu,
  Monitor, Memory, CircuitBoard, HardDrive, Package,
  Thermometer, Mouse, Desktop,
} from '@phosphor-icons/react'
import { productsAPI, cartAPI, wishlistAPI } from '../services/api'
import { imgUrl } from '../utils/imgUrl'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'

const categoryIconMap = {
  cpu:         Cpu,
  gpu:         Monitor,
  ram:         Memory,
  motherboard: CircuitBoard,
  storage:     HardDrive,
  psu:         Lightning,
  case:        Package,
  cooler:      Thermometer,
  monitor:     Desktop,
  peripherals: Mouse,
}

const categoryColors = {
  cpu: '#0EF6FF', gpu: '#A78BFA', ram: '#00E5A0', motherboard: '#FF8C00',
  storage: '#FFD700', psu: '#FF4757', case: '#80CBC4', cooler: '#81D4FA',
  monitor: '#F48FB1', peripherals: '#A5D6A7',
}
```

- [ ] **Step 2: Replace the return JSX**

```jsx
  return (
    <div className="flex flex-col gap-8">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-xl px-12 py-20 text-center
                      bg-gradient-to-br from-base via-base-1 to-base
                      border border-accent/20 shadow-[0_0_100px_rgba(14,246,255,0.08)]">
        {/* Radial glows */}
        <div className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full
                        bg-radial-[circle] pointer-events-none opacity-30"
             style={{ background: 'radial-gradient(circle, rgba(14,246,255,0.15) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full pointer-events-none opacity-20"
             style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          {/* Icon mark */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl
                          bg-accent shadow-glow-cyan mb-7">
            <Lightning size={38} weight="bold" color="#050910" />
          </div>

          <h1 className="font-display font-black text-[56px] leading-[1.05] tracking-[-1.5px] mb-5 m-0">
            <span className="text-primary">Componentele tale,{' '}</span>
            <span style={{ background: 'linear-gradient(135deg, var(--cyan), var(--violet))',
                           WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              configurate perfect
            </span>
          </h1>

          <p className="text-secondary text-xl max-w-[560px] mx-auto mb-11 leading-relaxed">
            Cele mai bune componente PC la prețuri imbatabile. Livrare rapidă, garanție 24 luni.
          </p>

          <div className="flex gap-4 justify-center flex-wrap mb-12">
            <Link
              to="/catalog"
              className="flex items-center gap-2 bg-accent text-base px-10 py-4 rounded-xl
                         font-bold text-[17px] no-underline shadow-glow-cyan
                         hover:shadow-[0_8px_36px_rgba(14,246,255,0.55)] hover:-translate-y-1
                         transition-all duration-200"
            >
              <Storefront size={20} weight="bold" />
              Explorează Catalogul
            </Link>
            <Link
              to="/configurator"
              className="flex items-center gap-2 bg-white/[0.07] text-primary px-10 py-4 rounded-xl
                         font-bold text-[17px] no-underline border border-white/18
                         hover:bg-white/12 hover:-translate-y-1 transition-all duration-200"
            >
              <Wrench size={20} weight="regular" />
              Configurator PC
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 justify-center">
            {[
              { val: '500+',   lbl: 'Produse',           Icon: Package,    color: 'var(--cyan)'   },
              { val: '24 luni',lbl: 'Garanție',           Icon: ShieldCheck,color: 'var(--green)'  },
              { val: 'Gratuit',lbl: 'Transport 500+ RON', Icon: Truck,      color: 'var(--amber)'  },
              { val: '24/7',   lbl: 'Suport',             Icon: Robot,      color: 'var(--violet)' },
            ].map(s => (
              <div
                key={s.lbl}
                className="bg-white/5 rounded-xl px-6 py-[18px] text-center min-w-[110px]"
                style={{ border: `1px solid ${s.color}25` }}
              >
                <s.Icon size={22} weight="duotone" style={{ color: s.color }} className="mb-2 mx-auto block" />
                <div className="text-2xl font-extrabold leading-none mb-1" style={{ color: s.color }}>{s.val}</div>
                <div className="text-muted text-xs">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CATEGORII ── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-accent-dim border border-accent-border
                          flex items-center justify-center">
            <Package size={20} weight="duotone" className="text-accent" />
          </div>
          <div>
            <h2 className="text-primary text-xl font-extrabold m-0 font-display">Categorii</h2>
            <p className="text-muted text-sm m-0">Alege categoria și găsește exact ce cauți</p>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3.5">
          {categories.map(c => {
            const color = categoryColors[c.slug] || 'var(--cyan)'
            const CatIcon = categoryIconMap[c.slug] || Package
            return (
              <Link key={c.id} to={`/catalog?category=${c.slug}`} className="no-underline">
                <div
                  className="rounded-2xl py-[22px] px-3.5 text-center cursor-pointer
                             transition-all duration-200 hover:-translate-y-1.5"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${color}22`,
                    boxShadow: `inset 0 0 30px ${color}08`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${color}12`
                    e.currentTarget.style.borderColor = `${color}55`
                    e.currentTarget.style.boxShadow = `0 8px 24px ${color}20`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.borderColor = `${color}22`
                    e.currentTarget.style.boxShadow = `inset 0 0 30px ${color}08`
                  }}
                >
                  <CatIcon size={32} weight="duotone" style={{ color }} className="mb-2.5 mx-auto block" />
                  <div className="text-secondary text-[13px] font-semibold leading-snug">{c.name}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── PRODUSE FEATURED ── */}
      {featured.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.35)' }}>
                <Star size={20} weight="duotone" style={{ color: '#FFD700' }} />
              </div>
              <div>
                <h2 className="text-primary text-xl font-extrabold m-0 font-display">Produse recomandate</h2>
                <p className="text-muted text-sm m-0">Selecția noastră de top</p>
              </div>
            </div>
            <Link
              to="/catalog"
              className="text-accent no-underline text-sm font-bold flex items-center gap-1.5
                         bg-accent-dim border border-accent-border px-[18px] py-2 rounded-lg
                         hover:bg-accent/15 transition-colors duration-150"
            >
              Vezi toate →
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
            {featured.map(p => {
              const catSlug = categories.find(c => c.name === p.category)?.slug
              const catColor = categoryColors[catSlug] || 'var(--cyan)'
              return (
                <Link key={p.id} to={`/product/${p.id}`} className="no-underline">
                  <div
                    className="product-card transition-all duration-250 cursor-pointer flex flex-col h-full"
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-6px)'
                      e.currentTarget.style.boxShadow = `0 12px 36px ${catColor}25`
                      e.currentTarget.style.borderColor = `${catColor}45`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = ''
                      e.currentTarget.style.borderColor = ''
                    }}
                  >
                    <div
                      className="product-img-bg rounded-xl h-[170px] flex items-center justify-center
                                 mb-4 overflow-hidden"
                      style={{ border: `1px solid ${catColor}22` }}
                    >
                      {p.image_url
                        ? <img src={imgUrl(p.image_url)} alt={p.name}
                               className="w-full h-full object-contain p-2.5 mix-blend-multiply" />
                        : (() => {
                            const CatIcon = categoryIconMap[catSlug] || Package
                            return <CatIcon size={46} weight="duotone" style={{ color: catColor }} />
                          })()
                      }
                    </div>
                    <div className="flex flex-col flex-1 px-1">
                      <div className="text-[11px] font-bold mb-1.5 uppercase tracking-wide" style={{ color: catColor }}>
                        {p.category}
                      </div>
                      <h3 className="text-primary text-[15px] font-semibold mb-1 leading-snug flex-1
                                     line-clamp-2 m-0">
                        {p.name}
                      </h3>
                      <p className="text-muted text-[13px] mb-3">{p.brand}</p>
                      <div className="flex justify-between items-center mb-3 border-t border-default pt-3">
                        <span className="font-mono font-extrabold text-xl text-price">{p.price} RON</span>
                        {p.old_price && (
                          <span className="font-mono text-muted line-through text-[13px]">{p.old_price}</span>
                        )}
                      </div>
                      <button
                        onClick={e => handleAddToCart(e, p)}
                        disabled={p.stock === 0 || cartLoading.has(p.id)}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                                   font-bold text-[14px] border-none transition-all duration-200
                                   ${cartAdded.has(p.id)
                                     ? 'bg-success text-base cursor-pointer'
                                     : p.stock === 0
                                       ? 'bg-white/5 text-muted cursor-not-allowed'
                                       : 'bg-accent text-base cursor-pointer shadow-glow-cyan hover:shadow-[0_6px_24px_rgba(14,246,255,0.55)] hover:-translate-y-0.5'
                                   }`}
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
        </div>
      )}

      {/* ── AVANTAJE ── */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {[
          { Icon: Truck,      title: 'Transport gratuit', desc: 'La comenzi peste 500 RON, livrare gratuită în toată țara', color: 'var(--green)'  },
          { Icon: ShieldCheck,title: 'Garanție 24 luni',  desc: 'Toate produsele vin cu garanție minimă de 2 ani',          color: 'var(--cyan)'   },
          { Icon: Lock,       title: 'Plată securizată',  desc: 'Tranzacții protejate prin criptare SSL 256-bit',            color: 'var(--violet)' },
          { Icon: Wrench,     title: 'Configurator gratuit',desc:'Verifică compatibilitatea componentelor fără costuri',      color: '#FFD700'       },
        ].map(b => (
          <div
            key={b.title}
            className="rounded-2xl p-6 flex gap-4 items-start transition-all duration-200 hover:-translate-y-1"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${b.color}22` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${b.color}50` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${b.color}22` }}
          >
            <div className="w-[50px] h-[50px] shrink-0 rounded-2xl flex items-center justify-center"
                 style={{ background: `${b.color}15`, border: `1px solid ${b.color}33` }}>
              <b.Icon size={24} weight="duotone" style={{ color: b.color }} />
            </div>
            <div>
              <div className="text-primary font-bold text-[15px] mb-1.5">{b.title}</div>
              <div className="text-muted text-[13px] leading-relaxed">{b.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── PROMO BANNERS ── */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/configurator" className="no-underline">
          <div
            className="rounded-[18px] p-8 h-full transition-all duration-200 hover:-translate-y-1 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #1A2A5E 100%)',
                     border: '1px solid rgba(14,246,255,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(14,246,255,0.2)'; e.currentTarget.style.borderColor = 'rgba(14,246,255,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'rgba(14,246,255,0.25)' }}
          >
            <div className="w-[54px] h-[54px] rounded-xl bg-accent-dim border border-accent-border
                            flex items-center justify-center mb-4">
              <Wrench size={26} weight="duotone" className="text-accent" />
            </div>
            <div className="text-accent font-extrabold text-[19px] mb-2">Configurator PC</div>
            <div className="text-secondary text-sm leading-relaxed mb-[18px]">
              Verifică compatibilitatea componentelor tale în timp real. Socket, RAM, PSU și mai mult.
            </div>
            <span className="inline-flex items-center gap-1.5 text-primary text-sm font-bold
                             bg-accent-dim border border-accent-border px-[18px] py-2 rounded-lg">
              Încearcă acum →
            </span>
          </div>
        </Link>
        <Link to="/chat" className="no-underline">
          <div
            className="rounded-[18px] p-8 h-full transition-all duration-200 hover:-translate-y-1 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #1A0D3E 0%, #2A1A5E 100%)',
                     border: '1px solid rgba(167,139,250,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(167,139,250,0.2)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.25)' }}
          >
            <div className="w-[54px] h-[54px] rounded-xl flex items-center justify-center mb-4"
                 style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)' }}>
              <Robot size={26} weight="duotone" className="text-violet" />
            </div>
            <div className="text-violet font-extrabold text-[19px] mb-2">Asistent AI</div>
            <div className="text-secondary text-sm leading-relaxed mb-[18px]">
              Spune-ne bugetul și scopul și îți recomandăm configurația perfectă pentru tine.
            </div>
            <span className="inline-flex items-center gap-1.5 text-primary text-sm font-bold px-[18px] py-2 rounded-lg"
                  style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)' }}>
              Încearcă acum →
            </span>
          </div>
        </Link>
      </div>
    </div>
  )
```

- [ ] **Step 3: Verify in browser**

Navigate to `/`. Check:
- Hero has lightning icon, no emoji
- Category grid shows Phosphor icons
- Featured products load and "Adaugă în coș" button uses Phosphor icons
- Benefits row uses Phosphor duotone icons
- Promo banners have no emoji

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage.jsx
git commit -m "feat: refactor HomePage with Phosphor icons and Tailwind tokens"
```

---

### Task 9: Refactor Login and Register pages

**Files:**
- Modify: `src/pages/Login.jsx`
- Modify: `src/pages/Register.jsx`

- [ ] **Step 1: Replace Login.jsx**

```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SignIn, EnvelopeSimple, Lock, Warning, CircleNotch } from '@phosphor-icons/react'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.login({ email, password })
      const token = res.data.access_token
      const payload = JSON.parse(atob(token.split('.')[1]))
      login({ id: payload.sub, name: res.data.name, role: res.data.role }, token)
      navigate('/')
    } catch {
      setError('Email sau parolă incorectă!')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-[420px] mx-auto mt-16">
      <div className="bg-surface rounded-2xl p-10 border border-default
                      shadow-elevated backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center
                          mx-auto mb-4 shadow-glow-cyan">
            <SignIn size={28} weight="bold" color="#050910" />
          </div>
          <h2 className="font-display font-bold text-primary text-2xl mb-1.5">Bine ai revenit!</h2>
          <p className="text-muted text-sm">Loghează-te în contul tău</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger
                          px-4 py-3 rounded-xl mb-5 text-sm">
            <Warning size={16} weight="bold" className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-secondary text-[13px] mb-2 font-medium">
              <EnvelopeSimple size={13} weight="regular" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplu.com"
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-secondary text-[13px] mb-2 font-medium">
              <Lock size={13} weight="regular" /> Parolă
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input-field"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full mt-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {loading
              ? <><CircleNotch size={16} weight="bold" className="animate-spin" /> Se încarcă...</>
              : <>Autentificare →</>
            }
          </button>
        </form>

        <div className="border-t border-default mt-6 pt-5 text-center">
          <p className="text-muted text-sm">
            Nu ai cont?{' '}
            <Link to="/register" className="text-accent no-underline font-semibold hover:underline">
              Crează cont gratuit →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update Register.jsx**

Read the current `src/pages/Register.jsx`, then apply the same pattern as Login:
- Replace `style={{}}` inline props with Tailwind classes matching the Login pattern
- Replace gradient blue `#1565C0 / #42A5F5` icon with `<UserPlus />` from Phosphor on `bg-accent`
- Replace `onFocus`/`onBlur` border JS with `focus:border-accent/40 focus:shadow-[0_0_0_3px_rgba(14,246,255,0.08)]` on the `input-field` class (add those focus styles to `.input-field` in `index.css` if not already present)
- Use `<CircleNotch className="animate-spin" />` for loading state
- Use `<Warning />` for error state

- [ ] **Step 3: Verify in browser**

Navigate to `/login` and `/register`. Check no emojis, no old blue gradient, Phosphor icons visible.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login.jsx src/pages/Register.jsx
git commit -m "feat: refactor Login and Register with Phosphor icons and Tailwind"
```

---

### Task 10: Refactor Home (Catalog page)

**Files:**
- Modify: `src/pages/Home.jsx`

- [ ] **Step 1: Replace all inline styles**

Read the full `src/pages/Home.jsx`. Apply the refactor pattern:

Key transformations:
- Filter sidebar: replace inline `style` padding/margin/background/border with Tailwind. Use `bg-surface`, `border-default`, `rounded-xl`, `p-4`, etc.
- Category filter chips: replace old-blue active state with `bg-accent-dim border-accent-border text-accent` active, `bg-surface border-default text-secondary` inactive
- Product grid: `grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5`
- Product cards: use `.product-card` class + Tailwind for inner padding
- Phosphor icons: replace category emoji in filters and cards using `categoryIconMap` (same as HomePage)
- Search bar: `input-field` class
- Sort/filter dropdowns: `bg-base-2 border border-default text-primary rounded-xl`
- Pagination: `bg-surface border-default rounded-lg` buttons, active = `bg-accent text-base`
- Loading state: `<CircleNotch className="animate-spin" />` replacing spinner emoji
- "Adaugă în coș" button: `.btn-primary` or inline Tailwind matching HomePage pattern
- Compare/wishlist action buttons: Phosphor icons `<Scales />`, `<Heart />`

- [ ] **Step 2: Verify in browser**

Navigate to `/catalog`. Filter by category, check filter chips, product cards, pagination all look correct with no old blue.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "feat: refactor Catalog page with Phosphor icons and Tailwind"
```

---

### Task 11: Refactor ProductDetail

**Files:**
- Modify: `src/pages/ProductDetail.jsx`

- [ ] **Step 1: Apply refactor pattern to ProductDetail**

Read the full `src/pages/ProductDetail.jsx`. Key transformations:
- Page layout wrapper: `max-w-[1200px] mx-auto`
- Image container: `product-img-bg rounded-2xl` with proper sizing
- Price display: `font-mono font-extrabold text-price text-3xl`
- Old price: `font-mono text-muted line-through text-lg`
- Stock badge: green `bg-success/15 text-success border border-success/30` when in stock, red when out
- "Adaugă în coș" CTA: `.btn-primary` large variant
- "Adaugă la Wishlist": `.btn-outline` with Phosphor `<Heart />`  
- Specs table: `bg-surface border border-default rounded-xl` table, alternating rows with `bg-white/[0.02]`
- Reviews section: star icons using Phosphor `<Star weight="fill" />` for filled, `<Star weight="regular" />` for empty
- Back navigation: `<ArrowLeft />` Phosphor icon
- Breadcrumbs: `text-muted text-sm` with `<CaretRight />` separators

- [ ] **Step 2: Verify in browser**

Navigate to a product. Check price display, stock badge, CTA buttons, specs table.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProductDetail.jsx
git commit -m "feat: refactor ProductDetail with Phosphor icons and Tailwind"
```

---

### Task 12: Refactor Cart and Checkout

**Files:**
- Modify: `src/pages/Cart.jsx`
- Modify: `src/pages/Checkout.jsx`

- [ ] **Step 1: Refactor Cart.jsx**

Read the full file. Key transformations:
- Empty cart state: Phosphor `<ShoppingCart size={64} weight="duotone" className="text-muted" />`
- Line item rows: `bg-surface rounded-xl p-4 flex items-center gap-4`
- Quantity controls: `bg-base-2 border border-default rounded-lg` buttons with `<Minus />` / `<Plus />` Phosphor icons
- Remove button: `<Trash />` Phosphor icon, `text-muted hover:text-danger`
- Order summary panel: `bg-surface border border-default rounded-2xl p-6`
- Total row: `font-mono font-extrabold text-price text-2xl`
- Checkout CTA: `.btn-primary` full width
- Voucher input: `.input-field` + `<Tag />` icon

- [ ] **Step 2: Refactor Checkout.jsx**

Read the full file. Key transformations:
- Form sections: `bg-surface border border-default rounded-2xl p-6 mb-4`
- Section headers: Phosphor icons (e.g. `<MapPin />` for address, `<CreditCard />` for payment)
- All inputs: `.input-field` class
- Order summary sidebar: same pattern as Cart summary
- Submit button: `.btn-primary` with `<Check />` icon
- Loading: `<CircleNotch className="animate-spin" />`

- [ ] **Step 3: Verify both pages in browser**

Navigate to `/cart` and `/checkout`. Check all states work.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Cart.jsx src/pages/Checkout.jsx
git commit -m "feat: refactor Cart and Checkout with Phosphor icons and Tailwind"
```

---

### Task 13: Refactor Orders and Wishlist

**Files:**
- Modify: `src/pages/Orders.jsx`
- Modify: `src/pages/Wishlist.jsx`

- [ ] **Step 1: Refactor Orders.jsx**

Key transformations:
- Order list items: `bg-surface border border-default rounded-xl p-5`
- Status badges: color-coded — pending `bg-price-dim text-price border-price-border`, processing `bg-accent-dim text-accent border-accent-border`, delivered `bg-success/15 text-success`, cancelled `bg-danger/15 text-danger`
- Order expand/collapse: Phosphor `<CaretDown />` with rotation transition
- Product rows within order: small `bg-base-2 rounded-lg` cards
- Empty state: `<Package size={64} weight="duotone" className="text-muted" />`

- [ ] **Step 2: Refactor Wishlist.jsx**

Key transformations:
- Product grid: same pattern as HomePage featured products
- Empty state: `<Heart size={64} weight="duotone" className="text-muted" />`
- Remove from wishlist: `<HeartBreak />` or `<Trash />` Phosphor icon
- Add to cart from wishlist: `.btn-primary` with `<ShoppingCart />`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Orders.jsx src/pages/Wishlist.jsx
git commit -m "feat: refactor Orders and Wishlist with Phosphor icons and Tailwind"
```

---

### Task 14: Refactor Profile

**Files:**
- Modify: `src/pages/Profile.jsx`

- [ ] **Step 1: Refactor Profile.jsx**

Read the full file (it has tabs: vouchers, warranties, returns, service). Key transformations:
- Tab navigation: horizontal tabs with `border-b border-default`. Active tab: `text-accent border-b-2 border-accent -mb-px font-semibold`. Inactive: `text-secondary hover:text-primary`
- Profile info card: `bg-surface border border-default rounded-2xl p-6`
- Avatar: large circle with user initial, `bg-accent text-base font-display font-bold`
- Voucher cards: `bg-surface border border-price-border rounded-xl p-4` with `<Tag />` icon
- Warranty cards: `<ShieldCheck />` icon
- Return cards: `<ArrowCounterClockwise />` icon
- Service cards: `<Wrench />` icon
- All form inputs: `.input-field`
- Save buttons: `.btn-primary`

- [ ] **Step 2: Commit**

```bash
git add src/pages/Profile.jsx
git commit -m "feat: refactor Profile with Phosphor icons and Tailwind"
```

---

### Task 15: Refactor Configurator and PCBuilder

**Files:**
- Modify: `src/pages/Configurator.jsx`
- Modify: `src/pages/PCBuilder.jsx`
- Modify: `src/components/PCBuilderSidebar.jsx`

- [ ] **Step 1: Refactor Configurator.jsx**

Key transformations:
- Component slot rows: `bg-surface border border-default rounded-xl p-4 flex items-center gap-3`
- Slot icons: Phosphor icons from `categoryIconMap`
- Compatibility status: green `<Check />` / red `<X />` / amber `<Warning />`
- Power budget bar: styled progress with accent color
- "Build" summary panel: `bg-surface border border-accent-border rounded-2xl p-6`
- Total price: `font-mono font-extrabold text-price text-2xl`

- [ ] **Step 2: Refactor PCBuilder.jsx and PCBuilderSidebar.jsx**

Same pattern as Configurator. The sidebar gets:
- `bg-base-1 border-r border-default h-full` layout
- Category sections with Phosphor icons
- Selected component highlight: `bg-accent-dim border-l-2 border-accent`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Configurator.jsx src/pages/PCBuilder.jsx src/components/PCBuilderSidebar.jsx
git commit -m "feat: refactor Configurator and PCBuilder with Phosphor icons and Tailwind"
```

---

### Task 16: Refactor Compare

**Files:**
- Modify: `src/pages/Compare.jsx`

- [ ] **Step 1: Refactor Compare.jsx**

Key transformations:
- Page header: `<Scales size={32} weight="duotone" className="text-accent" />`
- Comparison table: `bg-surface border border-default rounded-2xl overflow-hidden`
- Table header cells: `bg-base-2 border-b border-default p-4 font-display font-bold`
- Row labels: `text-secondary text-sm font-medium`
- "Winner" highlight: `bg-accent-dim text-accent font-bold`
- Remove product: `<X />` Phosphor icon, `text-muted hover:text-danger`
- Empty slots: dashed `border-2 border-dashed border-default` with `<Plus />` icon

- [ ] **Step 2: Commit**

```bash
git add src/pages/Compare.jsx
git commit -m "feat: refactor Compare page with Phosphor icons and Tailwind"
```

---

### Task 17: Refactor Chat, FAQ, DespreNoi, Contact

**Files:**
- Modify: `src/pages/Chat.jsx`
- Modify: `src/pages/FAQ.jsx`
- Modify: `src/pages/DespreNoi.jsx`
- Modify: `src/pages/Contact.jsx`

- [ ] **Step 1: Refactor Chat.jsx**

Key transformations:
- Chat container: `bg-surface border border-default rounded-2xl flex flex-col h-[600px]`
- Chat header: `bg-base-2 border-b border-default px-5 py-4 flex items-center gap-3` with `<Robot weight="duotone" />` icon
- User messages: `bg-accent text-base rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] ml-auto`
- AI messages: `bg-surface-raised rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[80%]`
- Input bar: `border-t border-default p-4 flex gap-2` with `.input-field` and `<PaperPlaneRight />` send button

- [ ] **Step 2: Refactor FAQ.jsx**

Key transformations:
- Accordion items: `bg-surface border border-default rounded-xl mb-2 overflow-hidden`
- Toggle: `<CaretDown />` Phosphor icon with 180° rotation on open
- Answer: smooth height transition using `max-h-0 overflow-hidden` → `max-h-[500px]` toggle via state

- [ ] **Step 3: Refactor DespreNoi.jsx and Contact.jsx**

Both are content pages. Apply the standard pattern:
- Section headers with `section-chip` class + Phosphor icons
- Cards: `bg-surface border border-default rounded-2xl`
- Contact form: `.input-field` + `.btn-primary`
- Contact info: Phosphor `<EnvelopeSimple />`, `<Phone />`, `<MapPin />`

- [ ] **Step 4: Commit**

```bash
git add src/pages/Chat.jsx src/pages/FAQ.jsx src/pages/DespreNoi.jsx src/pages/Contact.jsx
git commit -m "feat: refactor Chat, FAQ, DespreNoi, Contact pages"
```

---

### Task 18: Refactor Admin

**Files:**
- Modify: `src/pages/Admin.jsx`

- [ ] **Step 1: Refactor Admin.jsx**

Read the full file. Key transformations:
- Admin nav tabs: same tab pattern as Profile
- Data tables: `bg-surface border border-default rounded-2xl overflow-hidden`; header row `bg-base-2 border-b border-default`; rows alternating `hover:bg-surface-hover`
- Stats cards: Phosphor icons, `bg-surface border border-default rounded-xl p-5`
- Forms: `.input-field` + `.btn-primary`
- Action buttons (edit/delete): `<PencilSimple />` / `<Trash />` Phosphor icons
- Charts (recharts): update chart colors to `var(--cyan)` / `var(--amber)` / `var(--violet)` for consistency

- [ ] **Step 2: Commit**

```bash
git add src/pages/Admin.jsx
git commit -m "feat: refactor Admin page with Phosphor icons and Tailwind"
```

---

### Task 19: Final cleanup — purge old blue and verify

**Files:**
- All modified files (verification only)

- [ ] **Step 1: Grep for remaining `#42A5F5` and `#1565C0`**

```bash
cd c:/pcshop-frontend && grep -r "#42A5F5\|#1565C0\|42A5F5\|1565C0" src/ --include="*.jsx" --include="*.js"
```

Expected: **zero matches**. If any found, fix them by replacing with the appropriate token class.

- [ ] **Step 2: Grep for remaining emoji in JSX**

```bash
grep -rP "[\x{1F300}-\x{1F9FF}]" src/ --include="*.jsx"
```

Expected: zero matches (or only legitimate user-facing text content, not UI icons).

- [ ] **Step 3: Run dev server and do a full site walkthrough**

```bash
npm run dev
```

Visit each route:
- [ ] `/` — HomePage
- [ ] `/catalog` — Catalog
- [ ] `/catalog?category=cpu` — Filtered catalog
- [ ] `/product/1` — ProductDetail (or any valid product id)
- [ ] `/cart` — Cart
- [ ] `/checkout` — Checkout
- [ ] `/login` — Login
- [ ] `/register` — Register
- [ ] `/orders` — Orders
- [ ] `/wishlist` — Wishlist
- [ ] `/profile` — Profile
- [ ] `/configurator` — Configurator
- [ ] `/builder` — PCBuilder
- [ ] `/compare` — Compare
- [ ] `/chat` — Chat
- [ ] `/faq` — FAQ
- [ ] `/despre-noi` — DespreNoi
- [ ] `/contact` — Contact
- [ ] `/admin` — Admin

Check each page: no emojis as icons, no old blue `#42A5F5`, consistent surface colors.

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup — verified no legacy blue or emoji icons remain"
```
