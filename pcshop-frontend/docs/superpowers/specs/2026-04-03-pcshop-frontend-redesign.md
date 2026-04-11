# PCShop Frontend Redesign Spec
**Date:** 2026-04-03  
**Status:** Approved

## Overview
Refine the existing Dark Navy + Electric Cyan aesthetic into a premium, professional e-commerce experience. Fix design inconsistencies, systematize styles via Tailwind, replace emojis with Phosphor Icons, and migrate all 16 pages away from dense inline styles.

---

## Design Decisions

### Aesthetic Direction
- Dark Navy + Electric Cyan — refined and premium, not generic
- Cyan used strategically: high-intent actions and active/interactive states only
- Typography: Syne (headings) + Outfit (body) + Space Mono (prices) — unchanged

### Color Tokens (CSS Variables remain source of truth)
- `--cyan: #0EF6FF` — primary accent, interactive states, CTAs
- `--amber: #FF8C00` — prices, primary purchase CTAs
- Old blue `#42A5F5` — fully purged everywhere
- Magic number colors replaced with nearest token

### Tailwind Semantic Naming
```
bg-surface       → var(--bg-card)
bg-surface-raised → var(--bg-raised)
bg-base          → var(--bg-0)
bg-base-1        → var(--bg-1)
bg-base-2        → var(--bg-2)
text-primary     → var(--text-1)
text-secondary   → var(--text-2)
text-muted       → var(--text-3)
text-accent      → var(--cyan)
text-price       → var(--amber)
border-subtle    → var(--border-subtle)
border-default   → var(--border-default)
border-strong    → var(--border-strong)
border-accent    → var(--cyan-border)
shadow-card      → var(--shadow-card)
shadow-elevated  → var(--shadow-elevated)
shadow-glow-cyan → var(--shadow-cyan)
shadow-glow-amber → var(--shadow-amber)
```

### Icon Library
- **Phosphor Icons** (`@phosphor-icons/react`)
- Navbar links: `Regular` weight
- Active states / primary CTAs: `Bold` or `Fill`
- Benefit/feature sections: `Duotone` with `--ph-fill-opacity: 0.2` globally
- Category icons: Phosphor equivalents for `Cpu`, `HardDrive`, `Monitor`, `Desktop`, `Memory`, `Fan`, `Mouse`, `Lightning` etc.

---

## Implementation Approach: Foundation-first, then pages

### Phase 0 — Foundation
1. Install `@phosphor-icons/react`
2. Update `tailwind.config.js` with semantic token mapping
3. Add `.ph-duotone { --ph-fill-opacity: 0.2; }` to `index.css`
4. Add `animate-glow-pulse` and `animate-shimmer` utilities to `index.css`

### Phase 1 — Shared Components
Refactor in this order (each is independently testable):
1. **Navbar** — Phosphor icons, semantic Tailwind classes, active state underline, collapsing search, tighter badge
2. **Footer** — Expand to 3-column layout: logo+contact / quick links / legal+copyright
3. **ChatWidget** — Phosphor `ChatCircleDots` Duotone trigger, surface tokens
4. **CompareBar** — Purge hardcoded colors, Phosphor `Scales` icon, Tailwind spacing

### Phase 2 — Pages (in priority order)
1. **HomePage** — Hero (remove emoji, SVG icon, better composition), categories (Phosphor icons), featured products, benefits section
2. **Home (Catalog)** — Sidebar filters + product grid, filter chips, sort controls
3. **ProductDetail** — Full layout redesign: image gallery, specs table, add-to-cart, reviews
4. **Cart** — Line items, quantity controls, order summary
5. **Checkout** — Form layout, order summary panel
6. **Login / Register** — Auth forms, consistent card layout
7. **Orders** — Order list + detail expansion
8. **Wishlist** — Product grid, remove/add-to-cart actions
9. **Profile** — Tab navigation, sub-pages (vouchers, warranties, returns, service)
10. **Configurator** — Compatibility checker UI
11. **PCBuilder** — Component slot builder, sidebar
12. **Compare** — Side-by-side product table
13. **Chat** — AI chat interface
14. **FAQ** — Accordion layout
15. **DespreNoi** — About page layout
16. **Contact** — Contact form + info

### Cleanup Pass
- Remove all remaining inline `style={{}}` props
- Snap remaining magic number spacing to Tailwind scale
- Verify no `#42A5F5` references remain (grep check)

---

## Technical Constraints
- React + Vite, no framework change
- Zustand stores untouched (logic preserved)
- `services/api.js` untouched
- All Romanian text preserved as-is
- Routing in `App.jsx` untouched
