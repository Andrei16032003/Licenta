# Local Chat Ollama Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Înlocuiește `ChatWidget.jsx` (configurator PC) cu un chat ghidat care caută produse din DB în 4 pași, cu descrieri generate de Ollama local (`llama3.2:3b`).

**Architecture:** State machine cu 4 stări (category → filters → results → product). Backend adaugă 5 endpoint-uri noi în `chat.py` plus un service `ollama_service.py` care apelează Ollama pe `localhost:11434`. Dacă Ollama nu răspunde (timeout 8s), produsul se afișează fără descriere AI — nicio eroare vizibilă.

**Tech Stack:** FastAPI + SQLAlchemy (backend), React + Tailwind (frontend), httpx (apeluri Ollama async), Ollama `llama3.2:3b` local

---

## File Map

| Fișier | Acțiune | Responsabilitate |
|--------|---------|-----------------|
| `PCShop/app/services/ollama_service.py` | CREATE | Wrapper async pentru Ollama: `describe_product()` și `extract_filters()` |
| `PCShop/app/routers/chat.py` | MODIFY | Adaugă 5 endpoint-uri noi; endpoint-urile vechi rămân intacte |
| `pcshop-frontend/src/services/api.js` | MODIFY | Adaugă 5 metode noi în `chatAPI` |
| `pcshop-frontend/src/components/ChatWidget.jsx` | REWRITE | Chat widget cu 4 pași; înlocuiește complet configuratorul vechi |

---

## Task 1: Ollama Service

**Files:**
- Create: `PCShop/app/services/__init__.py`
- Create: `PCShop/app/services/ollama_service.py`

- [ ] **Step 1: Creează directorul services și fișierul `__init__.py`**

```bash
# În terminal, din directorul PCShop/app/
# Creează fișierul gol
```

Creează fișierul `PCShop/app/services/__init__.py` cu conținut gol.

- [ ] **Step 2: Creează `ollama_service.py`**

Creează `PCShop/app/services/ollama_service.py`:

```python
import httpx
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"
TIMEOUT = 8.0


async def describe_product(name: str, specs: dict, price: float) -> str | None:
    prompt = (
        f"Descrie în 2-3 fraze scurte în română acest produs pentru un client:\n"
        f"Nume: {name}, Specs: {json.dumps(specs, ensure_ascii=False)}, Preț: {price} RON\n"
        f"Fii concis și util. Nu repeta numele produsului în descriere."
    )
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(OLLAMA_URL, json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
            })
            return resp.json().get("response", "").strip() or None
    except Exception:
        return None


async def extract_filters(message: str, category_slugs: list[str]) -> dict | None:
    prompt = (
        f"Ești un asistent pentru un shop de componente PC.\n"
        f"Utilizatorul caută: \"{message}\"\n"
        f"Categorii disponibile: {', '.join(category_slugs)}\n"
        f"Returnează DOAR un JSON valid, fără explicații, fără markdown:\n"
        f"{{\"category_slug\": \"...\", \"filters\": {{\"brand\": \"...\"}}}}\n"
        f"Omite filtrele de care nu ești sigur. Dacă nu identifici categoria, returnează {{}}."
    )
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(OLLAMA_URL, json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
            })
            text = resp.json().get("response", "").strip()
            start = text.find("{")
            end = text.rfind("}") + 1
            if start == -1 or end == 0:
                return None
            return json.loads(text[start:end])
    except Exception:
        return None
```

- [ ] **Step 3: Verifică că Ollama răspunde**

```bash
# Din terminalul unde rulezi backend-ul:
ollama run llama3.2 "spune doar: ok"
```

Așteptat: răspuns rapid cu cuvântul "ok". Dacă merge, serviciul va funcționa.

- [ ] **Step 4: Commit**

```bash
git add PCShop/app/services/__init__.py PCShop/app/services/ollama_service.py
git commit -m "feat: add ollama service for product descriptions and filter extraction"
```

---

## Task 2: Backend Endpoints

**Files:**
- Modify: `PCShop/app/routers/chat.py`

Adaugă la **sfârșitul** fișierului `chat.py` (după endpoint-urile existente), după `import`-uri:

- [ ] **Step 1: Adaugă importul pentru `ollama_service` în `chat.py`**

La începutul fișierului `PCShop/app/routers/chat.py`, după linia `from app.models.product import Product, Category`, adaugă **o singură linie**:

```python
import app.services.ollama_service as ollama_service
```

Nu modifica nicio altă linie de import existentă.

- [ ] **Step 2: Adaugă endpoint `GET /chat/categories`**

La **sfârșitul** fișierului `chat.py`, adaugă:

```python
# ── ENDPOINT-URI CHAT GHIDAT ─────────────────────────────────

@router.get("/categories")
def chat_get_categories(db: Session = Depends(get_db)):
    """Returnează categoriile care au produse active în stoc."""
    from sqlalchemy import distinct
    rows = (
        db.query(Category)
        .join(Product, Product.category_id == Category.id)
        .filter(Product.is_active == True, Product.stock > 0)
        .distinct()
        .order_by(Category.sort_order)
        .all()
    )
    return [{"slug": c.slug, "name": c.name} for c in rows]
```

- [ ] **Step 3: Testează `GET /chat/categories`**

Pornește backend-ul dacă nu rulează:
```bash
cd PCShop && venv/Scripts/uvicorn.exe app.main:app --reload
```

Deschide în browser sau rulează:
```bash
curl http://127.0.0.1:8000/chat/categories
```

Așteptat: listă JSON cu `[{"slug": "cpu", "name": "..."}, ...]`

- [ ] **Step 4: Adaugă endpoint `GET /chat/filters/{category_slug}`**

```python
SKIP_FILTER_KEYS = {"power_w", "length_mm", "height_mm", "tdp", "tdp_w",
                    "slot", "radiator_mm", "max_gpu_length_mm",
                    "max_cooler_height_mm", "max_radiator_mm",
                    "socket_am4", "socket_am5", "socket_lga1700"}

@router.get("/filters/{category_slug}")
def chat_get_filters(category_slug: str, db: Session = Depends(get_db)):
    """Returnează valorile unice filtrabile pentru o categorie."""
    products = get_products_by_slug(db, category_slug)
    result: dict[str, list] = {}

    brands = sorted({p.brand for p in products if p.brand})
    if brands:
        result["brand"] = brands

    spec_values: dict[str, set] = {}
    for p in products:
        for k, v in (p.specs or {}).items():
            if k in SKIP_FILTER_KEYS:
                continue
            if isinstance(v, (str, int, float)):
                spec_values.setdefault(k, set()).add(v)

    for k, vals in spec_values.items():
        sorted_vals = sorted(str(v) for v in vals)
        if len(sorted_vals) > 1:
            result[k] = sorted_vals

    return result
```

- [ ] **Step 5: Testează `GET /chat/filters/gpu`**

```bash
curl http://127.0.0.1:8000/chat/filters/gpu
```

Așteptat: `{"brand": ["AMD", "NVIDIA"], "memory_type": ["GDDR6", "GDDR6X"], "vram_gb": ["4", "6", "8", "12"]}`

- [ ] **Step 6: Adaugă endpoint `POST /chat/search`**

```python
class ChatSearchRequest(BaseModel):
    category_slug: str
    filters: dict = {}
    sort: str = "price"


@router.post("/search")
def chat_search(req: ChatSearchRequest, db: Session = Depends(get_db)):
    """Caută produse după categorie + filtre opționale."""
    products = get_products_by_slug(db, req.category_slug)

    for key, value in req.filters.items():
        if not value:
            continue
        val_str = str(value).lower()
        if key == "brand":
            products = [p for p in products
                        if (p.brand or "").lower() == val_str]
        else:
            products = [p for p in products
                        if str((p.specs or {}).get(key, "")).lower() == val_str]

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "brand": p.brand,
            "price": float(p.price),
            "specs": p.specs,
            "image": p.images[0].url if p.images else None,
        }
        for p in products[:8]
    ]
```

- [ ] **Step 7: Testează `POST /chat/search`**

```bash
curl -X POST http://127.0.0.1:8000/chat/search \
  -H "Content-Type: application/json" \
  -d "{\"category_slug\": \"gpu\", \"filters\": {\"brand\": \"NVIDIA\"}}"
```

Așteptat: listă cu max 8 plăci video NVIDIA, fiecare cu `id`, `name`, `price`, `specs`, `image`.

- [ ] **Step 8: Adaugă endpoint `POST /chat/describe`**

```python
class ChatDescribeRequest(BaseModel):
    product_id: str


@router.post("/describe")
async def chat_describe(req: ChatDescribeRequest, db: Session = Depends(get_db)):
    """Generează descriere Ollama pentru un produs. Returnează null dacă Ollama nu răspunde."""
    from uuid import UUID
    try:
        pid = UUID(req.product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="product_id invalid")

    product = db.query(Product).filter(Product.id == pid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produs negasit")

    description = await ollama_service.describe_product(
        name=product.name,
        specs=product.specs or {},
        price=float(product.price),
    )
    return {"description": description}
```

- [ ] **Step 9: Adaugă endpoint `POST /chat/extract-filters`**

```python
class ChatExtractRequest(BaseModel):
    message: str


@router.post("/extract-filters")
async def chat_extract_filters(req: ChatExtractRequest, db: Session = Depends(get_db)):
    """Folosește Ollama să extragă categoria și filtrele din text liber. Returnează {} la eșec."""
    slugs = [c.slug for c in db.query(Category).all()]
    result = await ollama_service.extract_filters(req.message, slugs)
    return result or {}
```

- [ ] **Step 10: Testează `POST /chat/describe` cu un produs real**

Ia un ID de produs din pasul de search anterior și testează:
```bash
curl -X POST http://127.0.0.1:8000/chat/describe \
  -H "Content-Type: application/json" \
  -d "{\"product_id\": \"<id-din-search>\"}"
```

Așteptat: `{"description": "Placă video excelentă pentru..."}` sau `{"description": null}` dacă Ollama e oprit.

- [ ] **Step 11: Commit**

```bash
git add PCShop/app/routers/chat.py
git commit -m "feat: add guided chat endpoints (categories, filters, search, describe, extract-filters)"
```

---

## Task 3: Frontend API Methods

**Files:**
- Modify: `pcshop-frontend/src/services/api.js`

- [ ] **Step 1: Adaugă metodele noi în `chatAPI`**

În `pcshop-frontend/src/services/api.js`, înlocuiește blocul `chatAPI` existent:

```js
export const chatAPI = {
  suggest: (data) => API.post('/chat/suggest', data),
  message: (data) => API.post('/chat/message', data),
  minPrice: () => API.get('/chat/min-price'),
}
```

cu:

```js
export const chatAPI = {
  // endpoint-uri vechi (folosite de Chat.jsx)
  suggest: (data) => API.post('/chat/suggest', data),
  message: (data) => API.post('/chat/message', data),
  minPrice: () => API.get('/chat/min-price'),
  // endpoint-uri noi (folosite de ChatWidget.jsx)
  categories: () => API.get('/chat/categories'),
  filters: (slug) => API.get(`/chat/filters/${slug}`),
  search: (data) => API.post('/chat/search', data),
  describe: (productId) => API.post('/chat/describe', { product_id: productId }),
  extractFilters: (message) => API.post('/chat/extract-filters', { message }),
}
```

- [ ] **Step 2: Commit**

```bash
git add pcshop-frontend/src/services/api.js
git commit -m "feat: add chat guided search API methods"
```

---

## Task 4: ChatWidget Rewrite

**Files:**
- Rewrite: `pcshop-frontend/src/components/ChatWidget.jsx`

- [ ] **Step 1: Înlocuiește complet `ChatWidget.jsx`**

Suprascrie `pcshop-frontend/src/components/ChatWidget.jsx` cu:

```jsx
import { useState, useEffect, useRef } from 'react'
import {
  ChatCircleDots, X, Robot, ArrowLeft, ShoppingCart,
  CircleNotch, MagnifyingGlass, Funnel, ArrowRight,
  Warning, Check,
} from '@phosphor-icons/react'
import { chatAPI, cartAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'

const FILTER_LABELS = {
  brand: 'Brand',
  socket: 'Socket',
  memory_type: 'Tip memorie',
  vram_gb: 'VRAM (GB)',
  capacity_gb: 'Capacitate (GB)',
  form_factor: 'Form factor',
  wattage: 'Wattaj (W)',
  interface: 'Interfață',
  type: 'Tip',
  cores: 'Nuclee',
  m2_slots: 'Sloturi M.2',
  max_memory_gb: 'RAM max (GB)',
}

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuthStore()
  const { setCart } = useCartStore()

  const [open, setOpen]         = useState(false)
  const [step, setStep]         = useState('category')
  const [categories, setCategories]   = useState([])
  const [selCategory, setSelCategory] = useState(null)
  const [availFilters, setAvailFilters] = useState({})
  const [selFilters, setSelFilters]   = useState({})
  const [products, setProducts]       = useState([])
  const [selProduct, setSelProduct]   = useState(null)
  const [description, setDescription] = useState(null)
  const [inputText, setInputText]     = useState('')
  const [loading, setLoading]         = useState(false)
  const [loadingDesc, setLoadingDesc] = useState(false)
  const [cartAdded, setCartAdded]     = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [error, setError]             = useState('')
  const bodyRef = useRef(null)

  // Incarca categoriile la prima deschidere
  useEffect(() => {
    if (open && categories.length === 0) {
      chatAPI.categories()
        .then(res => setCategories(res.data))
        .catch(() => setError('Eroare la încărcare categorii'))
    }
  }, [open])

  // Scroll la baza la fiecare schimbare de pas
  useEffect(() => {
    if (bodyRef.current) {
      setTimeout(() => {
        bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
      }, 50)
    }
  }, [step, products, selProduct])

  // ── Handlers ───────────────────────────────────────────────

  const handleSelectCategory = async (cat) => {
    setSelCategory(cat)
    setSelFilters({})
    setError('')
    setLoading(true)
    try {
      const res = await chatAPI.filters(cat.slug)
      setAvailFilters(res.data)
    } catch {
      setAvailFilters({})
    } finally {
      setLoading(false)
      setStep('filters')
    }
  }

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await chatAPI.extractFilters(inputText.trim())
      const { category_slug, filters = {} } = res.data || {}
      const cat = categories.find(c => c.slug === category_slug)
      if (cat) {
        setSelCategory(cat)
        setSelFilters(filters)
        const fRes = await chatAPI.filters(cat.slug)
        setAvailFilters(fRes.data)
        setStep('filters')
      } else {
        setError('Nu am înțeles ce cauți. Alege o categorie din butoanele de mai jos.')
      }
    } catch {
      setError('Eroare. Alege o categorie din butoanele de mai jos.')
    } finally {
      setLoading(false)
      setInputText('')
    }
  }

  const handleToggleFilter = (key, value) => {
    setSelFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value,
    }))
  }

  const handleSearch = async (filters = selFilters) => {
    setLoading(true)
    setError('')
    setStep('results')
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v != null)
      )
      const res = await chatAPI.search({ category_slug: selCategory.slug, filters: activeFilters })
      setProducts(res.data)
      if (res.data.length === 0) setError('Nu am găsit produse. Încearcă alte filtre.')
    } catch {
      setError('Eroare la căutare.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProduct = async (product) => {
    setSelProduct(product)
    setDescription(null)
    setCartAdded(false)
    setStep('product')
    setLoadingDesc(true)
    try {
      const res = await chatAPI.describe(product.id)
      setDescription(res.data.description || null)
    } catch {
      setDescription(null)
    } finally {
      setLoadingDesc(false)
    }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) { setError('Trebuie să fii autentificat!'); return }
    setCartLoading(true)
    try {
      await cartAPI.add({ user_id: user.id, product_id: selProduct.id, quantity: 1 })
      const cartRes = await cartAPI.get(user.id)
      setCart(cartRes.data)
      setCartAdded(true)
    } catch {
      setError('Eroare la adăugare în coș.')
    } finally {
      setCartLoading(false)
    }
  }

  const handleReset = () => {
    setStep('category')
    setSelCategory(null)
    setAvailFilters({})
    setSelFilters({})
    setProducts([])
    setSelProduct(null)
    setDescription(null)
    setCartAdded(false)
    setError('')
    setInputText('')
  }

  // ── Render helpers ─────────────────────────────────────────

  const Chip = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition-all duration-150
        ${active
          ? 'bg-accent text-base border-accent font-bold'
          : 'bg-white/5 border-white/10 text-secondary hover:border-accent/30 hover:text-primary'
        }`}
    >
      {label}
    </button>
  )

  // ── Steps ──────────────────────────────────────────────────

  const StepCategory = () => (
    <>
      <div className="bg-accent-dim border border-accent-border rounded-xl p-3">
        <p className="text-primary text-[13px] leading-relaxed m-0">
          <strong>Salut!</strong> Ce produs cauți azi? Alege o categorie sau descrie ce vrei.
        </p>
      </div>

      {/* Input text liber */}
      <div className="flex gap-2">
        <input
          value={inputText}
          onChange={e => { setInputText(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
          placeholder='Ex: "vreau GPU nvidia sub 2000 RON"'
          className="flex-1 bg-white/5 border border-white/10 text-primary px-3 py-2
                     rounded-xl text-[13px] outline-none placeholder:text-muted
                     focus:border-accent/40 transition-all duration-150"
        />
        <button
          onClick={handleTextSubmit}
          disabled={loading || !inputText.trim()}
          className="px-3 py-2 rounded-xl bg-accent text-base font-bold text-[13px]
                     disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
                     hover:shadow-glow-cyan transition-all duration-150"
        >
          {loading ? <CircleNotch size={14} className="animate-spin" /> : <ArrowRight size={14} weight="bold" />}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-danger text-xs bg-danger/[0.08]
                        border border-danger/20 rounded-xl px-3 py-2">
          <Warning size={13} weight="bold" className="shrink-0" />
          {error}
        </div>
      )}

      <div>
        <div className="text-muted text-[11px] font-semibold uppercase tracking-wide mb-2">
          sau alege categoria:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <Chip key={cat.slug} label={cat.name} active={false} onClick={() => handleSelectCategory(cat)} />
          ))}
        </div>
      </div>
    </>
  )

  const StepFilters = () => {
    const filterKeys = Object.keys(availFilters)
    return (
      <>
        <div className="flex items-center gap-2 text-secondary text-[13px]">
          <div className="w-6 h-6 rounded-full bg-accent-dim border border-accent flex items-center justify-center shrink-0">
            <Robot size={13} weight="duotone" className="text-accent" />
          </div>
          <span>Ai ales <strong className="text-primary">{selCategory?.name}</strong>. Vrei să filtrezi după ceva? (opțional)</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4 text-muted">
            <CircleNotch size={18} className="animate-spin" />
          </div>
        ) : (
          <>
            {filterKeys.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {filterKeys.map(key => (
                  <div key={key}>
                    <div className="text-muted text-[10px] font-bold uppercase tracking-wide mb-1.5">
                      {FILTER_LABELS[key] || key}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availFilters[key].map(val => (
                        <Chip
                          key={val}
                          label={String(val)}
                          active={selFilters[key] === val}
                          onClick={() => handleToggleFilter(key, val)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-1">
              <button
                onClick={() => handleSearch({})}
                className="flex-1 py-2 rounded-xl text-[13px] font-medium cursor-pointer
                           bg-white/5 border border-white/10 text-secondary
                           hover:text-primary hover:border-white/20 transition-all duration-150"
              >
                Sari, arată-mi toate
              </button>
              <button
                onClick={() => handleSearch(selFilters)}
                className="flex-1 py-2 rounded-xl text-[13px] font-bold cursor-pointer
                           bg-accent text-base hover:shadow-glow-cyan
                           transition-all duration-150"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <MagnifyingGlass size={13} weight="bold" /> Caută
                </span>
              </button>
            </div>
          </>
        )}
      </>
    )
  }

  const StepResults = () => (
    <>
      <div className="flex items-center justify-between">
        <div className="text-secondary text-[13px] flex items-center gap-1.5">
          <Robot size={14} weight="duotone" className="text-accent" />
          {loading
            ? 'Caut produse...'
            : products.length > 0
              ? <span>Am găsit <strong className="text-primary">{products.length}</strong> {selCategory?.name?.toLowerCase()}. Alege unul:</span>
              : <span className="text-danger">{error || 'Niciun produs găsit.'}</span>
          }
        </div>
        <button
          onClick={handleReset}
          className="text-[11px] text-muted hover:text-primary cursor-pointer flex items-center gap-1"
        >
          <ArrowLeft size={10} weight="bold" /> Reset
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <CircleNotch size={22} className="animate-spin text-accent" />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectProduct(p)}
              className="w-full text-left bg-white/[0.04] border border-white/10
                         rounded-xl p-2.5 hover:border-accent/30 hover:bg-white/[0.07]
                         transition-all duration-150 cursor-pointer"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="text-primary text-[13px] font-semibold truncate">{p.name}</div>
                  {p.brand && <div className="text-muted text-[11px]">{p.brand}</div>}
                </div>
                <span className="text-accent font-bold text-[13px] font-mono shrink-0">{p.price} RON</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <button
          onClick={() => setStep('filters')}
          className="w-full py-2 rounded-xl bg-white/5 border border-white/10
                     text-secondary text-[13px] cursor-pointer hover:text-primary
                     transition-all duration-150"
        >
          ← Modifică filtrele
        </button>
      )}
    </>
  )

  const StepProduct = () => (
    <>
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={() => setStep('results')}
          className="flex items-center gap-1.5 text-muted text-[11px] cursor-pointer
                     hover:text-primary transition-colors duration-150"
        >
          <ArrowLeft size={11} weight="bold" /> Înapoi la listă
        </button>
      </div>

      <div className="bg-white/[0.04] border border-accent/15 rounded-xl p-3 flex flex-col gap-2.5">
        <div>
          <div className="text-primary font-bold text-[14px]">{selProduct?.name}</div>
          {selProduct?.brand && <div className="text-muted text-[11px]">{selProduct.brand}</div>}
          <div className="text-accent font-bold text-[16px] font-mono mt-1">{selProduct?.price} RON</div>
        </div>

        {/* Specs cheie */}
        {selProduct?.specs && Object.keys(selProduct.specs).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(selProduct.specs)
              .filter(([k]) => !['power_w','length_mm','height_mm','radiator_mm',
                                 'max_gpu_length_mm','max_cooler_height_mm','max_radiator_mm',
                                 'socket_am4','socket_am5','socket_lga1700'].includes(k))
              .slice(0, 5)
              .map(([k, v]) => (
                <span key={k} className="text-[10px] bg-white/[0.06] border border-white/10
                                         text-secondary px-2 py-0.5 rounded-full">
                  {FILTER_LABELS[k] || k}: <strong className="text-primary">{String(v)}</strong>
                </span>
              ))}
          </div>
        )}

        {/* Descriere Ollama */}
        {loadingDesc ? (
          <div className="flex items-center gap-2 text-muted text-[12px] py-1">
            <CircleNotch size={12} className="animate-spin" />
            <span>Generez descriere...</span>
          </div>
        ) : description ? (
          <div className="bg-accent-dim border border-accent-border rounded-lg px-3 py-2.5">
            <div className="text-[10px] text-accent font-bold uppercase tracking-wide mb-1">✨ AI</div>
            <p className="text-secondary text-[12px] leading-relaxed m-0">{description}</p>
          </div>
        ) : null}

        {error && (
          <div className="flex items-center gap-1.5 text-danger text-[12px]">
            <Warning size={12} weight="bold" /> {error}
          </div>
        )}

        {cartAdded ? (
          <div className="flex items-center justify-center gap-2 py-2 bg-success/[0.08]
                          border border-success/20 rounded-xl text-success text-[13px] font-bold">
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
            {cartLoading
              ? <span className="flex items-center justify-center gap-2">
                  <CircleNotch size={14} className="animate-spin" /> Se adaugă...
                </span>
              : <span className="flex items-center justify-center gap-2">
                  <ShoppingCart size={14} weight="bold" /> Adaugă în coș
                </span>
            }
          </button>
        )}
      </div>
    </>
  )

  // ── Main render ────────────────────────────────────────────

  const STEP_ICONS = {
    category: <MagnifyingGlass size={14} weight="bold" className="text-accent" />,
    filters:  <Funnel size={14} weight="bold" className="text-accent" />,
    results:  <Robot size={14} weight="duotone" className="text-accent" />,
    product:  <Robot size={14} weight="duotone" className="text-accent" />,
  }
  const STEP_TITLES = {
    category: 'Caută un produs',
    filters:  `Filtrează ${selCategory?.name || ''}`,
    results:  `Rezultate ${selCategory?.name || ''}`,
    product:  selProduct?.name?.split(' ').slice(0, 3).join(' ') || 'Detalii produs',
  }

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
                <div className="text-primary font-semibold text-sm">{STEP_TITLES[step]}</div>
                <div className="text-accent text-[11px] flex items-center gap-1">
                  {STEP_ICONS[step]}
                  {step === 'category' ? 'Asistent căutare produse' : selCategory?.name}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {step !== 'category' && (
                <button
                  onClick={handleReset}
                  className="w-7 h-7 rounded-full bg-white/10 border-none text-secondary
                             flex items-center justify-center cursor-pointer
                             hover:bg-white/20 hover:text-primary transition-all duration-150"
                  title="Caută alt produs"
                >
                  <ArrowLeft size={11} weight="bold" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 border-none text-secondary
                           flex items-center justify-center cursor-pointer
                           hover:bg-white/20 hover:text-primary transition-all duration-150"
              >
                <X size={13} weight="bold" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
            {step === 'category' && <StepCategory />}
            {step === 'filters'  && <StepFilters />}
            {step === 'results'  && <StepResults />}
            {step === 'product'  && <StepProduct />}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full cursor-pointer flex items-center justify-center
                   transition-all duration-300 hover:scale-110
                   ${open
                     ? 'bg-white/10 border border-white/10 text-secondary'
                     : 'bg-accent text-base border-none shadow-glow-cyan animate-glow-pulse'
                   }`}
      >
        {open
          ? <X size={20} weight="bold" />
          : <ChatCircleDots size={26} weight="duotone" />
        }
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Pornește frontend-ul și deschide browser-ul**

```bash
cd pcshop-frontend && npm run dev
```

Deschide `http://localhost:5173` (sau portul afișat).

- [ ] **Step 3: Testează Pasul 1 — Categorii**

Click pe butonul chat (bottom-right). Verifică:
- Apare widgetul cu mesajul de salut
- Se încarcă categoriile ca chips (Procesor, GPU, RAM, etc.)
- Input text e vizibil

- [ ] **Step 4: Testează Pasul 2 — Filtre**

Click pe o categorie (ex: GPU). Verifică:
- Titlul header-ului se schimbă
- Apar chips cu Brand (AMD, NVIDIA), Tip memorie (GDDR6, GDDR6X), VRAM
- Butonele "Sari" și "Caută" sunt vizibile

- [ ] **Step 5: Testează Pasul 3 — Rezultate**

Selectează Brand: NVIDIA → click "Caută". Verifică:
- Apare lista cu GPU-uri NVIDIA (max 8)
- Fiecare card arată nume, brand, preț

- [ ] **Step 6: Testează Pasul 4 — Produs + Ollama**

Click pe un produs. Verifică:
- Apare "Generez descriere..." cu spinner
- După 2-5 secunde apare descrierea AI în dreptunghiul albastru
- Apar specs ca chips (memory_type, vram_gb, etc.)
- Butonul "Adaugă în coș" funcționează

- [ ] **Step 7: Testează input text liber**

Reset widget → scrie "vreau procesor AMD" în input → Enter. Verifică:
- Ollama extrage categoria `cpu` și filtrul `brand: AMD`
- Trece automat la pasul Filtre cu AMD pre-selectat

- [ ] **Step 8: Testează fallback Ollama oprit**

Oprește Ollama (închide app-ul). Alege un produs. Verifică:
- Widgetul nu aruncă eroare
- Produsul se afișează normal, fără descriere AI
- Butonul coș funcționează în continuare

- [ ] **Step 9: Commit final**

```bash
git add pcshop-frontend/src/components/ChatWidget.jsx
git commit -m "feat: replace ChatWidget with guided product search + Ollama descriptions"
```
