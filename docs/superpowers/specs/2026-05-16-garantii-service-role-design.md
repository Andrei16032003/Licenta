# Design: Rol `garantii_service`

**Data:** 2026-05-16

## Scop

Adăugarea unui rol nou `garantii_service` în sistemul PCShop, destinat angajaților care gestionează produse defecte, garanții și tichete de service. Rolul oferă acces la service, retururi și comenzi (context), dar NU la mesaje contact și NU la review-uri.

---

## Permisiuni

| Secțiune | Acces |
|---|---|
| Service (toate tichetele, status, prioritate) | ✅ |
| Retururi (toate cererile, status, prioritate) | ✅ |
| Comenzi (listare, detalii — read-only în context) | ✅ |
| Note interne (adăugare/vizualizare pe service și retur) | ✅ |
| Mesaje contact | ❌ |
| Review-uri | ❌ |
| Dashboard (sumar propriu) | ✅ |

---

## Backend — Modificări

### `app/dependencies.py`
- Adaugă `"garantii_service"` în `STAFF_ROLES`

### `app/routers/service.py`
- `_require_service = require_role("admin", "suport", "manager", "garantii_service")`

### `app/routers/retururi.py`
- `_require_retururi = require_role("admin", "suport", "manager", "garantii_service")`

### `app/routers/support.py`
- `_require_staff = require_role("admin", "manager", "achizitii", "marketing", "suport", "garantii_service")`

### `app/routers/orders.py`
- `_require_orders = require_role("admin", "suport", "manager", "garantii_service")`

### `app/routers/auth.py`
- `_require_clients = require_role("admin", "suport", "marketing", "manager", "garantii_service")`
  (necesar pentru accesul la panoul admin)

### `app/routers/contact.py`
- **Neschimbat** — rămâne `require_role("admin", "manager", "suport")`

### `app/routers/reviews.py`
- **Neschimbat** — rămâne `require_role("admin", "suport", "marketing", "manager")`

---

## Frontend — Modificări (`Admin.jsx`)

### `STAFF_ROLES`
```js
const STAFF_ROLES = new Set(['admin', 'manager', 'achizitii', 'marketing', 'suport', 'garantii_service'])
```

### `ROLE_SECTIONS`
```js
garantii_service: new Set(['garantii_dashboard', 'service', 'retururi', 'orders']),
```

### Label rol
```js
garantii_service: 'GARANTII & SERVICE',
```

### Culoare badge în Team
- Portocaliu: `#FF9800` (distinct față de celelalte roluri)

### `garantii_dashboard` — Dashboard propriu
Sumar cu:
- Nr. tichete service în așteptare
- Nr. retururi în așteptare
- Tichete/retururi cu prioritate `urgent` sau `ridicat`
- (Similar structural cu `suport_dashboard`, fără blocul de reviews și contact)

### Dropdown creare/editare membru (secțiunea Team)
- Adaugă `'garantii_service'` în array-urile de opțiuni rol din formularele de creare și editare membre echipă

### Default section la login
```js
const defaults = { ..., garantii_service: 'garantii_dashboard' }
```

### needsData flags la încărcare
- `needsService` și `needsRetururi` și `needsOrders` → active când `allowed.has('garantii_dashboard')`

---

## Logica între roluri (claritate)

| Rol | Ce gestionează |
|---|---|
| `suport` | Clienți, comenzi, service, retururi, contact, reviews |
| `garantii_service` | Service, retururi, comenzi (context) — fără contact, fără reviews |
| `manager` | Rapoarte, financiar, analiză produse, comenzi |
| `marketing` | Vouchere, campanii, reviews |
| `achizitii` | Stoc, produse, aprovizionare |

---

## Out of scope
- Migrare DB — rolul e un string, nu necesită modificări de schemă
- Notificări email noi
- Permisiuni granulare pe câmpuri individuale
