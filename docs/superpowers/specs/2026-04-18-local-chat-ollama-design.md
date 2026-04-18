# Design: Local Chat Widget cu Ollama

**Data:** 2026-04-18  
**Scope:** Înlocuiește `ChatWidget.jsx` (configurator PC pe buget) cu un chat de căutare produse ghidat, alimentat de Ollama local.

---

## Obiectiv

Un chat widget floating (bottom-right) care ajută utilizatorul să găsească un produs din shop prin:
1. Selectare categorie (click chips sau text liber)
2. Filtre opționale pe atribute (Brand, Socket, VRAM, etc.)
3. Listă produse din DB
4. Descriere produs generată de Ollama (`llama3.1:8b`) + preț + buton coș

---

## Flow utilizator

```
Deschide widget
    → Pas 1: Alege categoria (chips butoane SAU scrie liber)
        → [Ollama extrage categoria + filtre din text, dacă e text]
    → Pas 2: Filtre opționale specifice categoriei (chips multi-select) + "Sari peste"
    → Pas 3: Listă produse din DB (max 8 rezultate, sortate după preț)
    → Pas 4: Click produs → detalii + descriere generată de Ollama + "Adaugă în coș"
        → Buton "Înapoi la listă"
```

**Fallback:** Dacă Ollama nu răspunde (timeout 8s) → afișează produsul fără descriere AI, fără eroare vizibilă.

---

## Arhitectură

### Frontend: `ChatWidget.jsx` (înlocuit complet)

State machine simplă cu 4 stări: `category` → `filters` → `results` → `product`

Componente logice:
- `StepCategory` — chips cu toate categoriile din DB + input text liber
- `StepFilters` — chips atribute dinamice pentru categoria aleasă + buton skip
- `StepResults` — lista produse (card: nume, preț, specs cheie)
- `StepProduct` — detalii produs + descriere Ollama + buton coș

### Backend: 2 endpoint-uri noi în `routers/chat.py`

**`GET /chat/categories`**  
Returnează toate categoriile active cu slug și numărul de produse în stoc.

**`GET /chat/filters/{category_slug}`**  
Returnează atributele filtrabile pentru categoria respectivă (extrase din `specs` JSONB al produselor existente). Ex: pentru `gpu` → `{ brand: [NVIDIA, AMD], memory_type: [GDDR6, GDDR6X], vram_gb: [4,6,8,12] }`

**`POST /chat/search`**  
Body: `{ category_slug, filters: {}, sort: "price" }`  
Returnează max 8 produse care match filtrele. Căutare directă în DB, fără AI.

**`POST /chat/describe`**  
Body: `{ product_id }`  
Apelează Ollama local (`localhost:11434`) cu specs produsului și returnează o descriere de 2-3 fraze în română. Timeout 8s. Dacă Ollama nu răspunde → `{ description: null }`.

**`POST /chat/extract-filters`**  
Body: `{ message: "vreau GPU nvidia sub 2000 RON" }`  
Ollama extrage `{ category_slug, filters }` ca JSON. Folosit doar când userul scrie text liber. Timeout 8s. Dacă eșuează → frontend arată chips-urile normal.

---

## Ollama

- **Model:** `llama3.2:3b` (1.9GB, rulează local pe Windows, rapid pe CPU fără GPU dedicat)
- **Port:** `localhost:11434` (default Ollama)
- **Instalare:** `ollama pull llama3.2` (sau prin Ollama desktop app)
- **Integrare backend:** apeluri HTTP simple la `/api/generate` (REST API Ollama)

### Prompt extragere filtre
```
Ești un asistent pentru un shop de componente PC.
Utilizatorul caută: "{message}"
Categorii disponibile: cpu, gpu, ram, motherboard, psu, case, storage, cooler
Returnează DOAR un JSON valid fără explicații:
{"category_slug": "...", "filters": {"brand": "...", "memory_type": "..."}}
Dacă nu ești sigur de un filtru, omite-l.
```

### Prompt descriere produs
```
Descrie în 2-3 fraze scurte în română acest produs pentru un client:
Nume: {name}, Specs: {specs}, Preț: {price} RON
Fii concis și util. Nu repeta numele produsului.
```

---

## Filtre per categorie (extrase din specs JSONB)

| Categorie | Atribute filtrabile |
|-----------|-------------------|
| cpu | brand, socket, cores (din name) |
| gpu | brand, memory_type, vram_gb |
| ram | brand, type (DDR4/DDR5), capacity_gb |
| motherboard | brand, socket, form_factor, memory_type |
| psu | brand, wattage |
| case | brand, form_factor |
| storage | brand, interface |
| cooler | brand |

---

## Ce se schimbă

### Fișiere modificate
- `pcshop-frontend/src/components/ChatWidget.jsx` — rescris complet
- `PCShop/app/routers/chat.py` — adăugate 4 endpoint-uri noi (cele vechi rămân)

### Fișiere noi
- `PCShop/app/services/ollama_service.py` — wrapper Ollama (describe + extract)

### Neschimbate
- `pcshop-frontend/src/services/api.js` — adăugate doar 4 metode noi în `chatAPI`
- `PCShop/app/main.py` — routerul `/chat` deja inclus

---

## Tratarea erorilor

| Situație | Comportament |
|----------|-------------|
| Ollama oprit | Afișează produs fără descriere, fără mesaj de eroare |
| Extragere filtre eșuată | Afișează chips-urile normale, ignoră textul |
| 0 produse găsite | "Nu am găsit produse. Încearcă alte filtre." + buton reset |
| Timeout Ollama (>8s) | Returnează `null`, frontend afișează produs normal |
