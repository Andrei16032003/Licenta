# AI Natural Language Search — Design

**Goal:** Make "procesor amd 500 lei" sau "placa video nvidia" să returneze produse filtrate corect după categorie, brand, preț și specs simple — indiferent dacă Ollama este disponibil.

**Architecture:** Pipeline în 3 straturi în `/chat/extract-filters`: Python extrage întotdeauna (categorie, preț, brand din DB, specs regex), Ollama îmbunătățește opțional (specs complexe, prompt mic pe o singură categorie), rezultatele se unesc cu Python câștigând pe categorie/preț/brand.

**Tech Stack:** FastAPI (Python), SQLAlchemy, httpx + Ollama local, React + chatAPI frontend

---

## Strat 1 — Python (întotdeauna activ)

### `_extract_price(message)` — existent, păstrat neschimbat
Extrage `max_price` și `min_price` din regex în română.

### `_detect_category_slug(message, available_slugs)` — refactor din keyword map existent
Același KEYWORD_MAP din fallback, mutat ca funcție separată apelată **înainte** de Ollama.
Returnează `slug | None`.

### `_extract_brand(message, products)` — NOU
```python
def _extract_brand(message: str, products: list) -> str | None:
    msg_lower = message.lower()
    brands = sorted({p.brand for p in products if p.brand}, key=len, reverse=True)
    for brand in brands:
        if brand.lower() in msg_lower:
            return brand
    return None
```
Ia brandurile din DB pentru categoria detectată, caută case-insensitive în mesaj.
Sort descendent după lungime → "AMD Ryzen" are prioritate față de "AMD".

### `_extract_spec_keywords(message, slug)` — NOU
Dict static de regex patterns per categorie slug:
```
cpu:     socket (am4/am5/lga1700/lga1200), cores (8 core / 6-core)
ram:     type (ddr4/ddr5), capacity_gb (8gb/16gb/32gb/64gb)
gpu:     memory_gb (\d+gb)
storage: interface (nvme/m.2/sata), capacity (\d+(gb|tb))
monitor: refresh_hz (144/165/240/360 hz), resolution (1080p/1440p/4k/2k)
```
Returnează `dict[str, str]` cu key-uri care există în DB specs.

---

## Strat 2 — Ollama (opțional, prompt mic)

### `ollama_service.extract_filters()` — prompt îmbunătățit
**Schimbare cheie:** nu mai primește toate categoriile — primește o singură categorie (deja detectată de Python).
```
Utilizatorul caută: "procesor amd 500 lei"
Categoria: cpu
Filtre disponibile: {brand: [AMD, Intel], socket: [AM4, AM5, LGA1700], ...}
Returnează JSON cu specs SUPLIMENTARE față de ce știe deja sistemul.
```
Timeout redus: 6s (era 8s).
Dacă răspunsul nu e JSON valid → returnează `{}` fără excepție.

---

## Strat 3 — Merge în `/chat/extract-filters`

```python
# 1. Python
price_data   = _extract_price(message)
slug         = _detect_category_slug(message, slugs)
products     = get_products_by_slug(db, slug) if slug else []
brand        = _extract_brand(message, products)
spec_kw      = _extract_spec_keywords(message, slug or "")

python_filters = {}
if brand:     python_filters["brand"] = brand
python_filters.update(spec_kw)

# 2. Ollama (dacă slug detectat)
ollama_result = {}
if slug:
    cat_filters = {slug: category_filters.get(slug, {})}
    ollama_result = await ollama_service.extract_filters(message, [slug], cat_filters) or {}

# 3. Merge: Python câștigă pe slug/brand/preț; Ollama adaugă specs
ollama_filters = ollama_result.get("filters", {})
for k, v in ollama_filters.items():
    if k not in python_filters:   # nu suprascrie brand dacă Python l-a detectat
        python_filters[k] = v

final_slug = slug or ollama_result.get("category_slug")
return {"category_slug": final_slug, "filters": python_filters, **price_data}
```

---

## Frontend — modificări minime

### `ChatWidget.jsx` — `runQuickSearch` și `runFollowup`
1. **Afișare preț în header rezultate** — msg de tip `results` include `max_price`/`min_price` în `extracted`, le afișăm lângă filtre: `"AMD · max 500 RON"`
2. **`runFollowup`** — pasează `max_price`/`min_price` în `extracted` la mesajul de rezultate (acum nu se pasează)
3. **Mesaj `no_cat` îmbunătățit** — dacă avem totuși `max_price` dar nu categorie, sugerăm "Specifică tipul produsului: procesor, placă video, RAM..."

---

## Fișiere modificate

| Fișier | Tip | Schimbare |
|--------|-----|-----------|
| `PCShop/app/routers/chat.py` | Modify | Funcții noi + endpoint refactored |
| `PCShop/app/services/ollama_service.py` | Modify | Prompt mai mic, un singur slug |
| `pcshop-frontend/src/components/ChatWidget.jsx` | Modify | Afișare preț în rezultate, mesaj no_cat |

---

## Ce NU se schimbă

- Modelul Ollama (`pcshop-assistant`) rămâne același
- Flow-ul UI (quick search → followup → results) rămâne
- Căutarea manuală cu filtre rămâne neschimbată
- Endpoint-urile `/search`, `/filters`, `/categories` rămân neschimbate
