# AI Natural Language Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Căutarea AI să respecte corect prețul, brandul și specs simple extrase din mesaje naturale ("procesor amd 500 lei", "placa video nvidia"), independent de Ollama.

**Architecture:** Pipeline în 3 straturi în `/chat/extract-filters`: (1) Python extrage categorie + preț + brand din DB + specs regex, (2) Ollama îmbunătățește opțional cu un prompt mic focusat pe o singură categorie, (3) merge cu Python câștigând pe brand/preț.

**Tech Stack:** FastAPI, SQLAlchemy, httpx + Ollama local (qwen2.5:7b / pcshop-assistant), React + chatAPI

---

## Fișiere modificate

| Fișier | Schimbare |
|--------|-----------|
| `PCShop/app/routers/chat.py` | 4 funcții helper noi + refactor endpoint `extract-filters` |
| `PCShop/app/services/ollama_service.py` | Prompt îmbunătățit pentru categorie singulară, timeout 6s |
| `pcshop-frontend/src/components/ChatWidget.jsx` | Afișare preț în header rezultate, mesaj no_cat îmbunătățit |

---

## Task 1: Helper functions în chat.py

**Files:**
- Modify: `PCShop/app/routers/chat.py` (după linia 621, înaintea `class ChatSearchRequest`)

- [ ] **Step 1: Scrie testul pentru `_detect_category_slug`**

Creează fișierul `PCShop/tests/test_chat_helpers.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.routers.chat import (
    _detect_category_slug,
    _extract_brand,
    _extract_spec_keywords,
    _build_category_filters,
)

SLUGS = ["cpu", "gpu", "ram", "storage", "monitor", "motherboard", "psu", "case", "cooler"]

# ── _detect_category_slug ──────────────────────────────────────

def test_detect_slug_procesor():
    assert _detect_category_slug("procesor amd 500 lei", SLUGS) == "cpu"

def test_detect_slug_placa_video():
    assert _detect_category_slug("placa video nvidia rtx", SLUGS) == "gpu"

def test_detect_slug_ram_ddr5():
    assert _detect_category_slug("memorie ram ddr5 32gb", SLUGS) == "ram"

def test_detect_slug_ssd():
    assert _detect_category_slug("ssd nvme 1tb", SLUGS) == "storage"

def test_detect_slug_none():
    assert _detect_category_slug("ceva complet necunoscut xyz", SLUGS) is None

# ── _extract_brand ─────────────────────────────────────────────

class FakeProduct:
    def __init__(self, brand): self.brand = brand

def test_extract_brand_amd():
    products = [FakeProduct("AMD"), FakeProduct("Intel")]
    assert _extract_brand("procesor amd ryzen 5", products) == "AMD"

def test_extract_brand_intel():
    products = [FakeProduct("AMD"), FakeProduct("Intel")]
    assert _extract_brand("procesor intel i7", products) == "Intel"

def test_extract_brand_none():
    products = [FakeProduct("AMD"), FakeProduct("Intel")]
    assert _extract_brand("orice procesor sub 500 lei", products) is None

def test_extract_brand_case_insensitive():
    products = [FakeProduct("NVIDIA")]
    assert _extract_brand("placa video Nvidia RTX 4060", products) == "NVIDIA"

# ── _extract_spec_keywords ─────────────────────────────────────

def test_specs_ram_ddr5():
    assert _extract_spec_keywords("ram ddr5 32gb", "ram") == {"type": "DDR5", "capacity_gb": "32"}

def test_specs_ram_ddr4():
    assert _extract_spec_keywords("memorie ddr4 16gb", "ram") == {"type": "DDR4", "capacity_gb": "16"}

def test_specs_cpu_am5():
    result = _extract_spec_keywords("procesor socket am5", "cpu")
    assert result.get("socket") == "AM5"

def test_specs_monitor_144hz():
    result = _extract_spec_keywords("monitor 144hz 1080p", "monitor")
    assert result.get("refresh_hz") == "144"
    assert result.get("resolution") == "1080P"

def test_specs_storage_nvme():
    result = _extract_spec_keywords("ssd nvme 1tb", "storage")
    assert result.get("interface") == "NVME"

def test_specs_no_match():
    assert _extract_spec_keywords("orice procesor", "cpu") == {}
```

- [ ] **Step 2: Rulează testele — trebuie să eșueze cu ImportError**

```bash
cd c:/Licenta/PCShop
python -m pytest tests/test_chat_helpers.py -v 2>&1 | head -30
```

Expected: `ImportError: cannot import name '_detect_category_slug'`

- [ ] **Step 3: Adaugă funcțiile helper în `chat.py` după linia 621**

În `PCShop/app/routers/chat.py`, după blocul `_extract_price` (după linia 621, înaintea `class ChatSearchRequest`), adaugă:

```python
# ── KEYWORD MAP pentru detectare categorie ───────────────────
_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "cpu":         ["procesor", "procesoare", "cpu", "ryzen", "intel core", "threadripper", "i5", "i7", "i9"],
    "gpu":         ["placa video", "placi video", "plăci video", "placă video", "gpu", "geforce",
                    "rtx", "gtx", "radeon", "rx 6", "rx 7", "nvidia", "grafica", "grafică"],
    "ram":         ["ram", "memorie ram", "memorii", "ddr4", "ddr5", "memorie"],
    "motherboard": ["placa de baza", "placi de baza", "placă de bază", "motherboard", "mainboard"],
    "storage":     ["ssd", "hdd", "nvme", "stocare", "hard disk", "hard drive", "m.2"],
    "psu":         ["sursa", "surse", "sursă", "psu", "alimentare", "watt"],
    "case":        ["carcasa", "carcase", "carcasă", "tower", "cabinet", "pc case"],
    "cooler":      ["cooler", "coolere", "racire", "răcire", "ventilator", "aio", "radiator"],
    "monitor":     ["monitor", "monitoare", "ecran", "display", "144hz", "165hz", "4k", "ips"],
    "keyboard":    ["tastatura", "tastaturi", "tastatură", "keyboard", "mecanica", "mecanică", "membrana"],
    "mouse":       ["mouse", "gaming mouse", "soricel", "optical mouse"],
    "headset":     ["casti", "căști", "headset", "headphones", "casca", "audio gaming"],
}

# Regex specs per categorie slug
_SPEC_PATTERNS: dict[str, list[tuple]] = {
    "cpu":     [("socket",      r'\b(am4|am5|lga1700|lga1200)\b', str.upper)],
    "ram":     [("type",        r'\b(ddr4|ddr5)\b',               str.upper),
                ("capacity_gb", r'\b(8|16|32|64)\s*gb\b',         str.strip)],
    "gpu":     [("memory_gb",   r'\b(\d+)\s*gb\b',                str.strip)],
    "storage": [("interface",   r'\b(nvme|m\.2|sata)\b',          str.upper)],
    "monitor": [("refresh_hz",  r'\b(144|165|240|360)\s*hz\b',    str.strip),
                ("resolution",  r'\b(1080p|1440p|4k|2k)\b',       str.upper)],
}


def _detect_category_slug(message: str, available_slugs: list) -> str | None:
    msg_lower = message.lower()
    for slug, keywords in _CATEGORY_KEYWORDS.items():
        if slug in available_slugs and any(kw in msg_lower for kw in keywords):
            return slug
    return None


def _extract_brand(message: str, products: list) -> str | None:
    if not products:
        return None
    msg_lower = message.lower()
    brands = sorted({p.brand for p in products if p.brand}, key=len, reverse=True)
    for brand in brands:
        if brand.lower() in msg_lower:
            return brand
    return None


def _extract_spec_keywords(message: str, slug: str) -> dict:
    patterns = _SPEC_PATTERNS.get(slug, [])
    result = {}
    msg_lower = message.lower()
    for key, pattern, transform in patterns:
        m = re.search(pattern, msg_lower)
        if m:
            result[key] = transform(m.group(1))
    return result


def _build_category_filters(db: Session, slugs: list) -> dict:
    result = {}
    for slug in slugs:
        products = get_products_by_slug(db, slug)
        if not products:
            continue
        filters: dict = {}
        brands = sorted({p.brand for p in products if p.brand})
        if brands:
            filters["brand"] = brands
        spec_vals: dict = {}
        for p in products:
            for k, v in (p.specs or {}).items():
                if k in SKIP_FILTER_KEYS:
                    continue
                if isinstance(v, (str, int, float)):
                    spec_vals.setdefault(k, set()).add(v)
        for k, vals in spec_vals.items():
            sorted_vals = sorted(str(v) for v in vals)
            if len(sorted_vals) > 1:
                filters[k] = sorted_vals
        if filters:
            result[slug] = filters
    return result
```

- [ ] **Step 4: Rulează testele — trebuie să treacă**

```bash
cd c:/Licenta/PCShop
python -m pytest tests/test_chat_helpers.py -v
```

Expected: toate 15 teste `PASSED`

---

## Task 2: Refactor endpoint `/chat/extract-filters`

**Files:**
- Modify: `PCShop/app/routers/chat.py` (liniile 704-760 — înlocuiește tot corpul funcției `chat_extract_filters`)

- [ ] **Step 1: Scrie testul de integrare**

Adaugă în `PCShop/tests/test_chat_helpers.py`:

```python
# ── _build_category_filters (verifică structura) ──────────────

def test_build_category_filters_empty():
    result = _build_category_filters(None, [])
    assert result == {}
```

- [ ] **Step 2: Rulează — PASS (funcția există din Task 1)**

```bash
cd c:/Licenta/PCShop
python -m pytest tests/test_chat_helpers.py::test_build_category_filters_empty -v
```

Expected: `PASSED`

- [ ] **Step 3: Înlocuiește corpul funcției `chat_extract_filters` în `chat.py`**

Înlocuiește tot ce e între `@router.post("/extract-filters")` și sfârșitul funcției (liniile 704-760) cu:

```python
@router.post("/extract-filters")
async def chat_extract_filters(req: ChatExtractRequest, db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    slugs = [c.slug for c in categories]

    # ── Strat 1: Python (întotdeauna) ────────────────────────────
    price_data = _extract_price(req.message)
    slug = _detect_category_slug(req.message, slugs)

    python_filters: dict = {}
    if slug:
        products = get_products_by_slug(db, slug)
        brand = _extract_brand(req.message, products)
        if brand:
            python_filters["brand"] = brand
        python_filters.update(_extract_spec_keywords(req.message, slug))

    # ── Strat 2: Ollama (opțional) ───────────────────────────────
    if slug:
        cat_filters = _build_category_filters(db, [slug])
        ollama_result = await ollama_service.extract_filters(req.message, [slug], cat_filters) or {}
    else:
        cat_filters = _build_category_filters(db, slugs)
        ollama_result = await ollama_service.extract_filters(req.message, slugs, cat_filters) or {}
        slug = slug or ollama_result.get("category_slug")

    # ── Strat 3: Merge (Python câștigă pe brand/preț/specs) ──────
    merged: dict = dict(ollama_result.get("filters", {}))
    merged.update(python_filters)

    if not slug:
        return {**price_data} if price_data else {}

    return {"category_slug": slug, "filters": merged, **price_data}
```

- [ ] **Step 4: Verifică manual că serverul pornește fără erori**

```bash
cd c:/Licenta/PCShop
uvicorn app.main:app --reload --port 8000
```

Expected: `Application startup complete.` fără erori de import.
Oprește cu Ctrl+C.

- [ ] **Step 5: Testează cu curl**

```bash
curl -s -X POST http://localhost:8000/chat/extract-filters \
  -H "Content-Type: application/json" \
  -d '{"message": "procesor amd 500 lei"}' | python -m json.tool
```

Expected — cel puțin câmpurile de bază (Ollama poate adăuga mai mult):
```json
{
  "category_slug": "cpu",
  "filters": {"brand": "AMD"},
  "max_price": 500.0
}
```

- [ ] **Step 6: Testează placa video**

```bash
curl -s -X POST http://localhost:8000/chat/extract-filters \
  -H "Content-Type: application/json" \
  -d '{"message": "placa video nvidia sub 1500 ron"}' | python -m json.tool
```

Expected:
```json
{
  "category_slug": "gpu",
  "filters": {"brand": "NVIDIA"},
  "max_price": 1500.0
}
```

---

## Task 3: Îmbunătățește prompt-ul Ollama pentru categorie singulară

**Files:**
- Modify: `PCShop/app/services/ollama_service.py` (funcția `extract_filters`, liniile 28-76)

- [ ] **Step 1: Înlocuiește funcția `extract_filters` în `ollama_service.py`**

```python
async def extract_filters(
    message: str,
    category_slugs: list[str],
    category_filters: dict | None = None,
) -> dict | None:
    focused = len(category_slugs) == 1
    slug = category_slugs[0] if focused else None

    if focused and slug and category_filters and slug in category_filters:
        # Prompt mic — categoria deja știută de Python
        filters = category_filters[slug]
        parts = []
        for k, vals in list(filters.items())[:15]:
            sample = vals[:10] if isinstance(vals, list) else [vals]
            parts.append(f'{k}: {json.dumps(sample, ensure_ascii=False)}')
        cats_block = f"- {slug}: {{{', '.join(parts)}}}"
        prompt = (
            f"Ești un asistent pentru un shop de componente PC.\n"
            f"Utilizatorul caută: \"{message}\"\n\n"
            f"Categoria detectată: {slug}\n"
            f"Filtre disponibile:\n{cats_block}\n\n"
            f"Returnează DOAR specs suplimentare ca JSON (nu repeta brandul sau prețul):\n"
            f"{{\"filters\": {{\"cheie\": \"valoare_exacta_din_lista\"}}}}\n"
            f"Dacă nu identifici niciun filtru util, returnează {{\"filters\": {{}}}}."
        )
    else:
        # Prompt complet — categorie nedetectată de Python
        if category_filters:
            cat_lines = []
            for s, filters in category_filters.items():
                if not filters:
                    cat_lines.append(f"- {s}")
                    continue
                parts = []
                for k, vals in list(filters.items())[:8]:
                    sample = vals[:6] if isinstance(vals, list) else [vals]
                    parts.append(f'{k}: {json.dumps(sample, ensure_ascii=False)}')
                cat_lines.append(f"- {s}: {{{', '.join(parts)}}}")
            cats_block = "\n".join(cat_lines)
        else:
            cats_block = "\n".join(f"- {s}" for s in category_slugs)

        prompt = (
            f"Ești un asistent pentru un shop de periferice și componente PC.\n"
            f"Utilizatorul caută: \"{message}\"\n\n"
            f"Categorii și filtrele EXACTE disponibile:\n{cats_block}\n\n"
            f"Reguli:\n"
            f"1. Alege category_slug EXACT din lista de mai sus.\n"
            f"2. Cheile din filters trebuie să fie EXACT ca în lista categoriei alese.\n"
            f"3. Valorile din filters trebuie să fie EXACT una din valorile listate.\n"
            f"4. Omite orice filtru dacă nu ești 100% sigur de valoare.\n"
            f"5. Returnează DOAR JSON, fără text, fără markdown:\n"
            f"{{\"category_slug\": \"...\", \"filters\": {{\"cheie\": \"valoare\"}}}}\n"
            f"Dacă nu identifici categoria cu certitudine, returnează {{}}."
        )

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.post(OLLAMA_URL, json={
                "model": MODEL_SEARCH,
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

- [ ] **Step 2: Verifică că serverul pornește**

```bash
cd c:/Licenta/PCShop
uvicorn app.main:app --reload --port 8000
```

Expected: `Application startup complete.` Oprește cu Ctrl+C.

---

## Task 4: Frontend — afișare preț extras în rezultate

**Files:**
- Modify: `pcshop-frontend/src/components/ChatWidget.jsx`

- [ ] **Step 1: Pasează `max_price`/`min_price` în `extracted` din `runQuickSearch` (linia ~363)**

Găsește în `runQuickSearch` blocul unde se setează mesajul de tip `results` (în jurul liniei 362):

```js
// ÎNAINTE:
setAiMessages(prev => [...prev.slice(0, -1),
  { id: ts + 2, role: 'bot', type: 'results', results,
    extracted: { category_slug: slug, filters } },
])

// DUPĂ:
setAiMessages(prev => [...prev.slice(0, -1),
  { id: ts + 2, role: 'bot', type: 'results', results,
    extracted: { category_slug: slug, filters, max_price, min_price } },
])
```

- [ ] **Step 2: Pasează `max_price`/`min_price` în `extracted` din `runFollowup` (linia ~288)**

Găsește în `runFollowup` blocul unde se setează mesajul de tip `results` (în jurul liniei 287):

```js
// ÎNAINTE:
setAiMessages(prev => [...prev.slice(0, -1),
  { id: ts + 2, role: 'bot', type: 'results', results,
    extracted: { category_slug: slug, filters } },
])

// DUPĂ:
setAiMessages(prev => [...prev.slice(0, -1),
  { id: ts + 2, role: 'bot', type: 'results', results,
    extracted: { category_slug: slug, filters, max_price, min_price } },
])
```

- [ ] **Step 3: Pasează `price_hint` în mesajul `no_cat` din `runQuickSearch` (linia ~347)**

Găsește în `runQuickSearch` blocul `no_cat` (în jurul liniei 347):

```js
// ÎNAINTE:
setAiMessages(prev => [...prev.slice(0, -1),
  { id: ts + 2, role: 'bot', type: 'no_cat' },
])

// DUPĂ:
setAiMessages(prev => [...prev.slice(0, -1),
  { id: ts + 2, role: 'bot', type: 'no_cat',
    price_hint: max_price || min_price || null },
])
```

- [ ] **Step 4: Actualizează `renderMsg` pentru `results` — adaugă afișare preț**

Găsește blocul `if (msg.type === 'results')` (în jurul liniei 597). Înlocuiește conținutul `<BotMsg>`:

```jsx
// ÎNAINTE:
if (msg.type === 'results') return (
  <div key={msg.id} className="flex flex-col gap-1.5">
    <BotMsg>
      {msg.results.length} produs{msg.results.length !== 1 ? 'e' : ''} găsite
      {Object.keys(msg.extracted?.filters || {}).length > 0 && (
        <span className="text-muted text-[12px]"> · {
          Object.entries(msg.extracted.filters)
            .map(([k, v]) => `${k.replace(/_/g, ' ')} ${v}`)
            .join(', ')
        }</span>
      )}:
    </BotMsg>
    <div className="flex flex-col gap-1.5">{msg.results.map(p => renderProductCard(p))}</div>
  </div>
)

// DUPĂ:
if (msg.type === 'results') return (
  <div key={msg.id} className="flex flex-col gap-1.5">
    <BotMsg>
      {msg.results.length} produs{msg.results.length !== 1 ? 'e' : ''} găsite
      {(() => {
        const chips = [
          ...Object.entries(msg.extracted?.filters || {})
            .map(([k, v]) => `${k.replace(/_/g, ' ')} ${v}`),
          msg.extracted?.max_price && `max ${msg.extracted.max_price} RON`,
          msg.extracted?.min_price && `min ${msg.extracted.min_price} RON`,
        ].filter(Boolean)
        return chips.length > 0
          ? <span className="text-muted text-[12px]"> · {chips.join(' · ')}</span>
          : null
      })()}:
    </BotMsg>
    <div className="flex flex-col gap-1.5">{msg.results.map(p => renderProductCard(p))}</div>
  </div>
)
```

- [ ] **Step 5: Actualizează `renderMsg` pentru `no_cat` — mesaj mai util**

Găsește blocul `if (msg.type === 'no_cat')` (în jurul liniei 640):

```jsx
// ÎNAINTE:
if (msg.type === 'no_cat') return (
  <BotMsg key={msg.id}>
    Nu am înțeles categoria produsului. Încearcă să fii mai specific, de ex:{' '}
    <em>"procesor Intel sub 500 lei"</em> sau <em>"placa video RTX 4060"</em>.
  </BotMsg>
)

// DUPĂ:
if (msg.type === 'no_cat') return (
  <BotMsg key={msg.id}>
    Nu am înțeles tipul produsului
    {msg.price_hint ? <span className="text-accent"> (preț detectat: {msg.price_hint} RON)</span> : ''}.
    {' '}Încearcă: <em>"procesor Intel sub 500 lei"</em>, <em>"placa video nvidia"</em>, <em>"RAM DDR5 32GB"</em>.
  </BotMsg>
)
```

- [ ] **Step 6: Testează în browser**

Pornește frontend-ul:
```bash
cd c:/Licenta/pcshop-frontend
npm run dev
```

Deschide widget-ul chat → Caută produs → Căutare AI și testează:

| Input | Așteptat |
|-------|----------|
| `procesor amd 500 lei` | CPU-uri AMD, max 500 RON |
| `placa video nvidia` | GPU-uri NVIDIA |
| `ram ddr5 32gb` | RAM DDR5 32GB |
| `monitor 144hz` | Monitoare 144Hz |
| `orice 500 lei` | `"Nu am înțeles tipul produsului (preț detectat: 500 RON)"` |

Verifică că header-ul rezultatelor arată filtrele aplicate (ex: `· brand AMD · max 500 RON`).

---

## Spec Coverage Check

| Cerință spec | Task |
|-------------|------|
| `_detect_category_slug` Python | Task 1 |
| `_extract_brand` din DB | Task 1 |
| `_extract_spec_keywords` regex | Task 1 |
| `_build_category_filters` helper | Task 1 |
| Endpoint refactored cu cele 3 straturi | Task 2 |
| Ollama prompt mic pentru categorie singulară | Task 3 |
| Ollama timeout 6s | Task 3 |
| Frontend afișare preț în rezultate | Task 4 |
| Frontend mesaj `no_cat` îmbunătățit | Task 4 |
