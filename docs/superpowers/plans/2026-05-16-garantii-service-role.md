# Rol `garantii_service` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adaugă rolul `garantii_service` care poate gestiona service, retururi și comenzi (context), fără acces la contact sau reviews.

**Architecture:** Rolul este un string nou în coloana existentă `users.role`. Backend-ul adaugă `"garantii_service"` în fiecare `require_role(...)` relevant. Frontend-ul primește secțiunile proprii și un dashboard dedicat.

**Tech Stack:** FastAPI (Python), React (JSX), PostgreSQL (rol deja string — fără migrare DB necesară)

---

## Task 1: Backend — permisiuni

**Files:**
- Modify: `PCShop/app/dependencies.py:13`
- Modify: `PCShop/app/routers/service.py:12`
- Modify: `PCShop/app/routers/retururi.py:11`
- Modify: `PCShop/app/routers/support.py:12`
- Modify: `PCShop/app/routers/orders.py:16`
- Modify: `PCShop/app/routers/auth.py:23`

- [ ] **Step 1: Adaugă rolul în `STAFF_ROLES` din `dependencies.py`**

În `PCShop/app/dependencies.py` linia 13, înlocuiește:
```python
STAFF_ROLES = {"admin", "manager", "achizitii", "marketing", "suport"}
```
cu:
```python
STAFF_ROLES = {"admin", "manager", "achizitii", "marketing", "suport", "garantii_service"}
```

- [ ] **Step 2: Adaugă rolul în `service.py`**

În `PCShop/app/routers/service.py` linia 12, înlocuiește:
```python
_require_service = require_role("admin", "suport", "manager")
```
cu:
```python
_require_service = require_role("admin", "suport", "manager", "garantii_service")
```

- [ ] **Step 3: Adaugă rolul în `retururi.py`**

În `PCShop/app/routers/retururi.py` linia 11, înlocuiește:
```python
_require_retururi = require_role("admin", "suport", "manager")
```
cu:
```python
_require_retururi = require_role("admin", "suport", "manager", "garantii_service")
```

- [ ] **Step 4: Adaugă rolul în `support.py` (note interne)**

În `PCShop/app/routers/support.py` linia 12, înlocuiește:
```python
_require_staff = require_role("admin", "manager", "achizitii", "marketing", "suport")
```
cu:
```python
_require_staff = require_role("admin", "manager", "achizitii", "marketing", "suport", "garantii_service")
```

- [ ] **Step 5: Adaugă rolul în `orders.py`**

În `PCShop/app/routers/orders.py` linia 16, înlocuiește:
```python
_require_orders = require_role("admin", "suport", "manager")
```
cu:
```python
_require_orders = require_role("admin", "suport", "manager", "garantii_service")
```

- [ ] **Step 6: Adaugă rolul în `auth.py` (acces panou admin)**

În `PCShop/app/routers/auth.py` linia 23, înlocuiește:
```python
_require_clients = require_role("admin", "suport", "marketing", "manager")
```
cu:
```python
_require_clients = require_role("admin", "suport", "marketing", "manager", "garantii_service")
```

- [ ] **Step 7: Verifică că serverul pornește fără erori**

```bash
cd PCShop
.\venv\Scripts\python.exe -m py_compile app/dependencies.py app/routers/service.py app/routers/retururi.py app/routers/support.py app/routers/orders.py app/routers/auth.py
```
Expected: niciun output (fără erori de sintaxă).

---

## Task 2: Frontend — constante și configurare rol

**Files:**
- Modify: `pcshop-frontend/src/pages/Admin.jsx:80-95` (ROLE_SECTIONS, ROLE_LABELS)
- Modify: `pcshop-frontend/src/pages/Admin.jsx:186` (STAFF_ROLES)
- Modify: `pcshop-frontend/src/pages/Admin.jsx:200` (defaults section la login)
- Modify: `pcshop-frontend/src/pages/Admin.jsx:81` (admin sees garantii_dashboard too)

- [ ] **Step 1: Adaugă `garantii_service` în `ROLE_SECTIONS` și `ROLE_LABELS`**

În `Admin.jsx` linia 80-95, înlocuiește blocul:
```js
const ROLE_SECTIONS = {
  admin:     new Set(['dashboard','team','manager_dashboard','suport_dashboard','marketing_dashboard','achizitii_dashboard']),
  manager:   new Set(['manager_dashboard','manager_financiar','manager_produse','manager_comenzi']),
  achizitii: new Set(['achizitii_dashboard','stoc_achizitii','products','add']),
  marketing: new Set(['marketing_dashboard','produse_mkt','vouchers','grafice_mkt','campanii_mkt','segmentare_mkt']),
  suport:    new Set(['suport_dashboard','contact','orders','service','retururi','clients','reviews']),
}

// Etichete afisate in sidebar per rol
const ROLE_LABELS = {
  admin:     'ADMINISTRATOR',
  manager:   'MANAGER',
  achizitii: 'ACHIZITII',
  marketing: 'MARKETING',
  suport:    'SUPORT CLIENTI',
}
```
cu:
```js
const ROLE_SECTIONS = {
  admin:             new Set(['dashboard','team','manager_dashboard','suport_dashboard','marketing_dashboard','achizitii_dashboard','garantii_dashboard']),
  manager:           new Set(['manager_dashboard','manager_financiar','manager_produse','manager_comenzi']),
  achizitii:         new Set(['achizitii_dashboard','stoc_achizitii','products','add']),
  marketing:         new Set(['marketing_dashboard','produse_mkt','vouchers','grafice_mkt','campanii_mkt','segmentare_mkt']),
  suport:            new Set(['suport_dashboard','contact','orders','service','retururi','clients','reviews']),
  garantii_service:  new Set(['garantii_dashboard','service','retururi','orders']),
}

// Etichete afisate in sidebar per rol
const ROLE_LABELS = {
  admin:            'ADMINISTRATOR',
  manager:          'MANAGER',
  achizitii:        'ACHIZITII',
  marketing:        'MARKETING',
  suport:           'SUPORT CLIENTI',
  garantii_service: 'GARANTII & SERVICE',
}
```

- [ ] **Step 2: Adaugă `garantii_service` în `STAFF_ROLES`**

În `Admin.jsx` linia 186, înlocuiește:
```js
const STAFF_ROLES = new Set(['admin', 'manager', 'achizitii', 'marketing', 'suport'])
```
cu:
```js
const STAFF_ROLES = new Set(['admin', 'manager', 'achizitii', 'marketing', 'suport', 'garantii_service'])
```

- [ ] **Step 3: Adaugă secțiunea default la login**

În `Admin.jsx` linia 200, înlocuiește:
```js
    const defaults = { manager: 'manager_dashboard', achizitii: 'achizitii_dashboard', marketing: 'marketing_dashboard', suport: 'suport_dashboard' }
```
cu:
```js
    const defaults = { manager: 'manager_dashboard', achizitii: 'achizitii_dashboard', marketing: 'marketing_dashboard', suport: 'suport_dashboard', garantii_service: 'garantii_dashboard' }
```

---

## Task 3: Frontend — date necesare la încărcare

**Files:**
- Modify: `pcshop-frontend/src/pages/Admin.jsx:355-363`

- [ ] **Step 1: Adaugă `garantii_dashboard` în flags-urile `needsData`**

În `Admin.jsx` liniile 355-363, înlocuiește blocul:
```js
      const needsProducts  = allowed.has('products') || allowed.has('dashboard') || allowed.has('rapoarte') || allowed.has('achizitii_dashboard') || allowed.has('stoc_achizitii') || allowed.has('manager_dashboard')
      const needsOrders    = allowed.has('orders')   || allowed.has('dashboard') || allowed.has('rapoarte') || allowed.has('clients') || allowed.has('manager_dashboard')
      const needsRetururi  = allowed.has('retururi') || allowed.has('dashboard') || allowed.has('manager_dashboard')
      const needsService   = allowed.has('service')  || allowed.has('dashboard') || allowed.has('manager_dashboard')
      const needsReviews   = allowed.has('reviews')  || allowed.has('manager_dashboard')
      const needsVouchers  = allowed.has('vouchers')  || allowed.has('marketing_dashboard')
      const needsClients   = allowed.has('clients')  || allowed.has('vouchers') || allowed.has('suport_dashboard') || allowed.has('marketing_dashboard')
      const needsTeam      = role === 'admin'
      const needsContact   = allowed.has('contact')  || allowed.has('manager_dashboard')
```
cu:
```js
      const needsProducts  = allowed.has('products') || allowed.has('dashboard') || allowed.has('rapoarte') || allowed.has('achizitii_dashboard') || allowed.has('stoc_achizitii') || allowed.has('manager_dashboard')
      const needsOrders    = allowed.has('orders')   || allowed.has('dashboard') || allowed.has('rapoarte') || allowed.has('clients') || allowed.has('manager_dashboard') || allowed.has('garantii_dashboard')
      const needsRetururi  = allowed.has('retururi') || allowed.has('dashboard') || allowed.has('manager_dashboard') || allowed.has('garantii_dashboard')
      const needsService   = allowed.has('service')  || allowed.has('dashboard') || allowed.has('manager_dashboard') || allowed.has('garantii_dashboard')
      const needsReviews   = allowed.has('reviews')  || allowed.has('manager_dashboard')
      const needsVouchers  = allowed.has('vouchers')  || allowed.has('marketing_dashboard')
      const needsClients   = allowed.has('clients')  || allowed.has('vouchers') || allowed.has('suport_dashboard') || allowed.has('marketing_dashboard')
      const needsTeam      = role === 'admin'
      const needsContact   = allowed.has('contact')  || allowed.has('manager_dashboard')
```

---

## Task 4: Frontend — culoare badge și etichete UI

**Files:**
- Modify: `pcshop-frontend/src/pages/Admin.jsx:5772-5778` (roleColors în Team)
- Modify: `pcshop-frontend/src/pages/Admin.jsx:876` (titlu sidebar)
- Modify: `pcshop-frontend/src/pages/Admin.jsx:965` (banner "Vizualizezi ca")

- [ ] **Step 1: Adaugă culoarea badge pentru rolul nou în tabelul Team**

În `Admin.jsx` liniile 5772-5778, înlocuiește blocul `roleColors`:
```js
                    const roleColors = {
                      admin:     { bg: 'rgba(0,212,255,0.12)',   color: 'var(--cyan)', border: 'rgba(0,212,255,0.3)'   },
                      manager:   { bg: 'rgba(0,230,118,0.12)',   color: '#00E676',     border: 'rgba(0,230,118,0.3)'   },
                      achizitii: { bg: 'rgba(255,152,0,0.12)',   color: '#FF9800',     border: 'rgba(255,152,0,0.3)'   },
                      marketing: { bg: 'rgba(206,147,216,0.12)', color: '#CE93D8',     border: 'rgba(206,147,216,0.3)' },
                      suport:    { bg: 'rgba(79,195,247,0.12)',  color: '#4FC3F7',     border: 'rgba(79,195,247,0.3)'  },
                    }
```
cu:
```js
                    const roleColors = {
                      admin:            { bg: 'rgba(0,212,255,0.12)',   color: 'var(--cyan)', border: 'rgba(0,212,255,0.3)'   },
                      manager:          { bg: 'rgba(0,230,118,0.12)',   color: '#00E676',     border: 'rgba(0,230,118,0.3)'   },
                      achizitii:        { bg: 'rgba(255,152,0,0.12)',   color: '#FF9800',     border: 'rgba(255,152,0,0.3)'   },
                      marketing:        { bg: 'rgba(206,147,216,0.12)', color: '#CE93D8',     border: 'rgba(206,147,216,0.3)' },
                      suport:           { bg: 'rgba(79,195,247,0.12)',  color: '#4FC3F7',     border: 'rgba(79,195,247,0.3)'  },
                      garantii_service: { bg: 'rgba(255,112,67,0.12)',  color: '#FF7043',     border: 'rgba(255,112,67,0.3)'  },
                    }
```

- [ ] **Step 2: Adaugă eticheta în titlul sidebar (vizualizare admin)**

În `Admin.jsx` linia 876, înlocuiește:
```js
                {viewAsRole ? ({ manager: 'MANAGER', suport: 'SUPORT', marketing: 'MARKETING', achizitii: 'ACHIZITII' }[viewAsRole]) : 'ADMIN PANEL'}
```
cu:
```js
                {viewAsRole ? ({ manager: 'MANAGER', suport: 'SUPORT', marketing: 'MARKETING', achizitii: 'ACHIZITII', garantii_service: 'GARANTII & SERVICE' }[viewAsRole]) : 'ADMIN PANEL'}
```

- [ ] **Step 3: Adaugă eticheta în bannerul "Vizualizezi ca"**

În `Admin.jsx` linia 965, înlocuiește:
```js
                Vizualizezi ca: <strong>{{ manager: 'Manager', suport: 'Suport Clienți', marketing: 'Marketing', achizitii: 'Achiziții' }[viewAsRole]}</strong>
```
cu:
```js
                Vizualizezi ca: <strong>{{ manager: 'Manager', suport: 'Suport Clienți', marketing: 'Marketing', achizitii: 'Achiziții', garantii_service: 'Garanții & Service' }[viewAsRole]}</strong>
```

---

## Task 5: Frontend — dropdown-uri creare/editare cont

**Files:**
- Modify: `pcshop-frontend/src/pages/Admin.jsx:5705` (creare cont nou)
- Modify: `pcshop-frontend/src/pages/Admin.jsx:5746` (atribuire rol cont existent)
- Modify: `pcshop-frontend/src/pages/Admin.jsx:6027` (editare membru)

- [ ] **Step 1: Adaugă rolul în formularul de creare cont (linia 5705)**

Înlocuiește:
```js
                      {['admin','manager','achizitii','marketing','suport'].map(r => (
                        <option key={r} value={r} style={{ background: '#0A0E1A' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
```
(cel de la `teamForm.role`) cu:
```js
                      {['admin','manager','achizitii','marketing','suport','garantii_service'].map(r => (
                        <option key={r} value={r} style={{ background: '#0A0E1A' }}>{r === 'garantii_service' ? 'Garantii & Service' : r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
```

- [ ] **Step 2: Adaugă rolul în formularul de atribuire rol (linia 5746)**

Înlocuiește:
```js
                      {['admin','manager','achizitii','marketing','suport'].map(r => (
                        <option key={r} value={r} style={{ background: '#0A0E1A' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
```
(cel de la `assignForm.role`) cu:
```js
                      {['admin','manager','achizitii','marketing','suport','garantii_service'].map(r => (
                        <option key={r} value={r} style={{ background: '#0A0E1A' }}>{r === 'garantii_service' ? 'Garantii & Service' : r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
```

- [ ] **Step 3: Adaugă rolul în formularul de editare membru (linia 6027)**

Înlocuiește:
```js
                  {['admin','manager','achizitii','marketing','suport'].map(r => (
                    <option key={r} value={r} style={{ background: '#0A0E1A' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
```
cu:
```js
                  {['admin','manager','achizitii','marketing','suport','garantii_service'].map(r => (
                    <option key={r} value={r} style={{ background: '#0A0E1A' }}>{r === 'garantii_service' ? 'Garantii & Service' : r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
```

---

## Task 6: Frontend — card "Vizualizează ca" în dashboard-ul admin

**Files:**
- Modify: `pcshop-frontend/src/pages/Admin.jsx:3876-3881`

- [ ] **Step 1: Adaugă cardul `garantii_service` în grila de preview roluri**

În `Admin.jsx` linia 3876, grila are `gridTemplateColumns: 'repeat(2, 1fr)'` cu 4 carduri. Adaugă `garantii_service` ca al 5-lea card. Înlocuiește întregul bloc array (liniile 3877-3881):
```js
              {[
                { section: 'manager_dashboard',   role: 'manager',   label: 'Manager',        Icon: ChartLine, color: '#0EF6FF', desc: 'Analize financiare, top produse, stoc blocat și performanța echipei' },
                { section: 'suport_dashboard',    role: 'suport',    label: 'Suport Clienți', Icon: Headset,   color: '#CE93D8', desc: 'Tichete service, retururi, recenzii și mesaje de contact' },
                { section: 'marketing_dashboard', role: 'marketing', label: 'Marketing',      Icon: Broadcast, color: '#00E676', desc: 'Campanii, vouchere, grafice de vânzări și segmentare clienți' },
                { section: 'achizitii_dashboard', role: 'achizitii', label: 'Achiziții',      Icon: Stack,     color: '#FFD700', desc: 'Gestiune stoc, produse cu stoc critic și aprovizionare' },
              ].map(r => (
```
cu:
```js
              {[
                { section: 'manager_dashboard',   role: 'manager',          label: 'Manager',           Icon: ChartLine, color: '#0EF6FF', desc: 'Analize financiare, top produse, stoc blocat și performanța echipei' },
                { section: 'suport_dashboard',    role: 'suport',           label: 'Suport Clienți',    Icon: Headset,   color: '#CE93D8', desc: 'Tichete service, retururi, recenzii și mesaje de contact' },
                { section: 'marketing_dashboard', role: 'marketing',        label: 'Marketing',         Icon: Broadcast, color: '#00E676', desc: 'Campanii, vouchere, grafice de vânzări și segmentare clienți' },
                { section: 'achizitii_dashboard', role: 'achizitii',        label: 'Achiziții',         Icon: Stack,     color: '#FFD700', desc: 'Gestiune stoc, produse cu stoc critic și aprovizionare' },
                { section: 'garantii_dashboard',  role: 'garantii_service', label: 'Garanții & Service',Icon: Wrench,    color: '#FF7043', desc: 'Tichete service, cereri de retur produse defecte și garanții' },
              ].map(r => (
```

> **Notă:** `Wrench` trebuie importat din `@phosphor-icons/react`. Verifică că este deja importat în fișier; dacă nu, adaugă-l în importul existent.

- [ ] **Step 2: Verifică importul iconului `Wrench`**

Caută în `Admin.jsx` dacă `Wrench` este deja importat:
```bash
grep -n "Wrench" pcshop-frontend/src/pages/Admin.jsx
```
Dacă nu apare, găsește linia cu importurile din `@phosphor-icons/react` și adaugă `Wrench` în acea listă.

---

## Task 7: Frontend — `garantii_dashboard` section rendering

**Files:**
- Modify: `pcshop-frontend/src/pages/Admin.jsx` (după blocul `suport_dashboard`, ~linia 2320)

- [ ] **Step 1: Adaugă blocul de render pentru `garantii_dashboard`**

Găsește în `Admin.jsx` linia care începe cu:
```js
        {section === 'suport_dashboard' && (() => {
```
Imediat **după** blocul `suport_dashboard` (după `})()} ` al acestuia), adaugă:

```jsx
        {section === 'garantii_dashboard' && (() => {
          const pendingRetururi = retururi.filter(r => r.status === 'in_asteptare')
          const pendingService  = serviceReqs.filter(s => !['rezolvat','respins'].includes(s.status))
          const pendingOrders   = orders.filter(o => ['pending','confirmed','processing'].includes(o.status))

          const urgentItems = [
            ...serviceReqs.filter(s => (s.priority === 'urgent' || s.priority === 'ridicat') && !['rezolvat','respins'].includes(s.status))
              .map(s => ({ type: 'service', label: `Service ${s.nr_ticket} — ${s.product_name}`, priority: s.priority, section: 'service' })),
            ...retururi.filter(r => (r.priority === 'urgent' || r.priority === 'ridicat') && r.status === 'in_asteptare')
              .map(r => ({ type: 'retur', label: `Retur — ${r.product_name}`, priority: r.priority, section: 'retururi' })),
          ].sort((a,b) => (a.priority==='urgent'?0:1) - (b.priority==='urgent'?0:1)).slice(0,8)

          return (
            <div>
              <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Dashboard Garanții & Service</h1>
              <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '20px' }}>Produse defecte, garanții și cereri de retur în așteptare</p>

              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
                {[
                  { label: 'Service deschis',    value: pendingService.length,  color: '#FF7043', onClick: () => goTo('service'),  sub: pendingService.length === 0  ? 'Totul în regulă ✓' : 'Necesită atenție →' },
                  { label: 'Retururi așteptare', value: pendingRetururi.length, color: '#FFD700', onClick: () => goTo('retururi'), sub: pendingRetururi.length === 0 ? 'Totul în regulă ✓' : 'Necesită atenție →' },
                  { label: 'Comenzi active',     value: pendingOrders.length,   color: '#4FC3F7', onClick: () => goTo('orders'),   sub: pendingOrders.length === 0   ? 'Totul în regulă ✓' : 'Necesită atenție →' },
                ].map(k => (
                  <div key={k.label} onClick={k.onClick}
                    style={{ background: '#0F1923', border: `1px solid ${k.color}33`, borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = k.color+'77'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = k.color+'33'}
                  >
                    <div style={{ color: k.color, fontSize: '10px', fontWeight: '700', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>{k.label}</div>
                    <div style={{ color: '#F1F5F9', fontSize: '32px', fontWeight: '800', lineHeight: 1 }}>{k.value}</div>
                    <div style={{ color: '#4B5563', fontSize: '11px', marginTop: '5px' }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Row 2: Urgent items + Status breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* Urgent */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <Warning size={16} color="#FF5252" />
                    <span style={{ color: '#FF5252', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Necesită atenție acum</span>
                    <span style={{ background: 'rgba(255,82,82,0.12)', color: '#FF5252', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', marginLeft: 'auto' }}>{urgentItems.length}</span>
                  </div>
                  {urgentItems.length === 0 ? (
                    <div style={{ color: '#4B5563', fontSize: '13px', padding: '12px 0' }}>Niciun item urgent. Bună treabă! ✓</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {urgentItems.map((item, i) => (
                        <div key={i} onClick={() => goTo(item.section)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: item.priority==='urgent' ? 'rgba(255,82,82,0.06)' : 'rgba(255,152,0,0.06)', borderRadius: '8px', borderLeft: `3px solid ${item.priority==='urgent'?'#FF5252':'#FF9800'}`, cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = item.priority==='urgent'?'rgba(255,82,82,0.1)':'rgba(255,152,0,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = item.priority==='urgent'?'rgba(255,82,82,0.06)':'rgba(255,152,0,0.06)'}
                        >
                          <span style={{ background: item.priority==='urgent'?'rgba(255,82,82,0.15)':'rgba(255,152,0,0.15)', color: item.priority==='urgent'?'#FF5252':'#FF9800', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>{item.priority}</span>
                          <span style={{ color: '#D1D5DB', fontSize: '12px', flex: 1 }}>{item.label}</span>
                          <CaretRight size={12} color="#4B5563" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status breakdown service */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px 20px' }}>
                  <div style={{ color: '#FF7043', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>Stare tichete service</div>
                  {[
                    { label: 'În așteptare',   count: serviceReqs.filter(s => s.status === 'in_asteptare').length,   color: '#FFD700' },
                    { label: 'În lucru',        count: serviceReqs.filter(s => s.status === 'in_lucru').length,        color: '#4FC3F7' },
                    { label: 'Rezolvat',        count: serviceReqs.filter(s => s.status === 'rezolvat').length,        color: '#00E676' },
                    { label: 'Respins',         count: serviceReqs.filter(s => s.status === 'respins').length,         color: '#FF5252' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{row.label}</span>
                      <span style={{ color: row.color, fontWeight: '700', fontSize: '14px' }}>{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })()}
```

---

## Task 8: Verificare finală

- [ ] **Step 1: Verifică sintaxa Python**

```bash
cd PCShop && .\venv\Scripts\python.exe -m py_compile app/dependencies.py app/routers/service.py app/routers/retururi.py app/routers/support.py app/routers/orders.py app/routers/auth.py && echo OK
```
Expected: `OK`

- [ ] **Step 2: Verifică build-ul frontend**

```bash
cd pcshop-frontend && npm run build 2>&1 | tail -20
```
Expected: `built in X.XXs` fără erori.

- [ ] **Step 3: Testează manual — creare cont cu rol nou**

1. Pornește backend + frontend
2. Loghează-te ca admin
3. Du-te la Team → Creeaza cont nou
4. Verifică că `Garantii & Service` apare în dropdown-ul de rol
5. Creează un cont cu rolul `garantii_service`
6. Loghează-te cu noul cont
7. Verifică că apare `garantii_dashboard` ca pagină de start
8. Verifică că **nu** apare în meniu: Contact, Reviews
9. Verifică că **apare** în meniu: Service, Retururi, Comenzi
