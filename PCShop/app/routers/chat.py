from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
import re

from app.database import get_db
from app.models.product import Product, Category
import app.services.ollama_service as ollama_service

router = APIRouter(prefix="/chat", tags=["Chat buget"])

# ── CATEGORII OBLIGATORII ────────────────────────────────────
REQUIRED_SLUGS  = ["cpu", "motherboard", "ram", "gpu", "psu", "case", "storage", "cooler"]
OPTIONAL_SLUGS  = ["monitor"]

# ── SCHEME ───────────────────────────────────────────────────
class ChatRequest(BaseModel):
    user_id: Optional[UUID] = None
    budget: float
    use_case: str
    brand_preference: Optional[str] = None
    message: Optional[str] = None

# ── HELPERS ──────────────────────────────────────────────────
def get_products_by_slug(db: Session, slug: str):
    return (
        db.query(Product)
        .join(Category)
        .filter(
            Category.slug == slug,
            Product.is_active == True,
            Product.stock > 0
        )
        .order_by(Product.price)
        .all()
    )

def get_min_budget(db: Session) -> float:
    """Calculeaza bugetul minim real din DB."""
    total = 0
    for slug in REQUIRED_SLUGS:
        products = get_products_by_slug(db, slug)
        if products:
            total += float(products[0].price)
    return round(total, 2)

def get_max_budget(db: Session) -> float:
    """Calculeaza bugetul maxim posibil din DB."""
    total = 0
    for slug in REQUIRED_SLUGS:
        products = get_products_by_slug(db, slug)
        if products:
            total += float(products[-1].price)
    return round(total, 2)

def filter_brand(products, pref):
    if not pref:
        return products
    filtered = [p for p in products if pref.lower() in (p.brand or "").lower()]
    return filtered if filtered else products

def check_compatibility(selected: dict) -> list:
    """Verifica compatibilitatea intre componentele selectate."""
    warnings = []
    cpu         = selected.get("cpu")
    motherboard = selected.get("motherboard")
    ram         = selected.get("ram")
    gpu         = selected.get("gpu")
    psu         = selected.get("psu")
    case        = selected.get("case")
    cooler      = selected.get("cooler")

    # Regula 1: CPU socket == Motherboard socket
    if cpu and motherboard:
        cpu_socket = (cpu.specs or {}).get("socket")
        mb_socket  = (motherboard.specs or {}).get("socket")
        if cpu_socket and mb_socket and cpu_socket != mb_socket:
            warnings.append(f"Socket incompatibil: CPU {cpu_socket} vs MB {mb_socket}")

    # Regula 2: RAM type == Motherboard memory_type
    if ram and motherboard:
        ram_type  = (ram.specs or {}).get("type")
        mb_memory = (motherboard.specs or {}).get("memory_type")
        if ram_type and mb_memory and ram_type != mb_memory:
            warnings.append(f"RAM incompatibil: {ram_type} vs {mb_memory}")

    # Regula 3: Consum total vs PSU wattage
    total_power = 50  # overhead baza
    if cpu:
        total_power += (cpu.specs or {}).get("tdp", 0)
    if gpu:
        total_power += (gpu.specs or {}).get("power_w", 0)
    if psu:
        psu_wattage = (psu.specs or {}).get("wattage", 0)
        if psu_wattage < total_power:
            warnings.append(f"PSU insuficient: necesar {total_power}W, ales {psu_wattage}W")
        elif psu_wattage < total_power * 1.2:
            warnings.append(f"PSU la limita: recomandat minim {int(total_power * 1.2)}W")

    # Regula 4: GPU lungime vs Carcasa
    if gpu and case:
        gpu_length   = (gpu.specs or {}).get("length_mm", 0)
        case_max_gpu = (case.specs or {}).get("max_gpu_length_mm", 9999)
        if gpu_length > case_max_gpu:
            warnings.append(f"GPU prea lung: {gpu_length}mm > {case_max_gpu}mm carcasa")

    # Regula 5: Cooler inaltime vs Carcasa
    if cooler and case:
        cooler_h      = (cooler.specs or {}).get("height_mm", 0)
        case_max_cool = (case.specs or {}).get("max_cooler_height_mm", 9999)
        if cooler_h > case_max_cool:
            warnings.append(f"Cooler prea inalt: {cooler_h}mm > {case_max_cool}mm carcasa")

    # Regula 6: Form factor MB vs Carcasa (mATX incape in ATX, ITX incape in orice)
    if motherboard and case:
        mb_form   = (motherboard.specs or {}).get("form_factor")
        case_form = (case.specs or {}).get("form_factor")
        if mb_form and case_form:
            fits = (mb_form == case_form
                    or (mb_form == "mATX" and case_form == "ATX")
                    or mb_form == "ITX")
            if not fits:
                warnings.append(f"Form factor incompatibil: MB {mb_form} vs Carcasa {case_form}")

    # Regula 7: CPU TDP vs Cooler TDP rating
    if cpu and cooler:
        cpu_tdp     = (cpu.specs or {}).get("tdp", 0)
        cooler_tdp  = (cooler.specs or {}).get("tdp_w", 0)
        if cooler_tdp and cpu_tdp and cooler_tdp < cpu_tdp:
            warnings.append(f"Cooler insuficient: {cooler_tdp}W < CPU TDP {cpu_tdp}W")

    # Regula 8: CPU socket vs Cooler socket
    if cpu and cooler:
        cpu_socket = (cpu.specs or {}).get("socket", "").lower()
        if cpu_socket == "am5" and not (cooler.specs or {}).get("socket_am5"):
            warnings.append(f"Cooler incompatibil cu AM5")
        elif cpu_socket == "lga1700" and not (cooler.specs or {}).get("socket_lga1700"):
            warnings.append(f"Cooler incompatibil cu LGA1700")

    # Regula 9: AIO radiator vs Carcasa
    if cooler and case:
        radiator    = (cooler.specs or {}).get("radiator_mm", 0)
        max_rad     = (case.specs or {}).get("max_radiator_mm", 9999)
        if radiator and max_rad and radiator > max_rad:
            warnings.append(f"Radiator AIO {radiator}mm nu incape in carcasa (max {max_rad}mm)")

    # Regula 10: RAM capacity vs MB max memory
    if ram and motherboard:
        ram_cap = (ram.specs or {}).get("capacity_gb", 0)
        mb_max  = (motherboard.specs or {}).get("max_memory_gb", 9999)
        if ram_cap and mb_max and ram_cap > mb_max:
            warnings.append(f"RAM {ram_cap}GB depaseste max MB {mb_max}GB")

    # Regula 11: Storage M.2 vs MB sloturi
    if selected.get("storage") and motherboard:
        storage_iface = (selected["storage"].specs or {}).get("interface", "")
        m2_slots      = (motherboard.specs or {}).get("m2_slots", 0)
        if "M.2" in storage_iface and m2_slots == 0:
            warnings.append("Motherboard fara sloturi M.2 pentru SSD-ul ales")

    return warnings

def pick_best(products, preferred_max, hard_max):
    """Cel mai bun produs in preferred_max; fallback la cel mai ieftin in hard_max."""
    limit      = min(preferred_max, hard_max)
    candidates = [p for p in products if float(p.price) <= limit]
    if candidates:
        return candidates[-1]
    affordable = [p for p in products if float(p.price) <= hard_max]
    return affordable[0] if affordable else None

def pick_cheapest(products):
    return products[0] if products else None

def get_compatible_pool(slug: str, selected: dict, base_pools: dict) -> list:
    """Returneaza pool-ul filtrat dupa compatibilitate cu componentele deja selectate."""
    pool = base_pools.get(slug, [])

    if slug == "motherboard":
        cpu_socket = (selected.get("cpu") and (selected["cpu"].specs or {}).get("socket")) or None
        if cpu_socket:
            compat = [mb for mb in pool if (mb.specs or {}).get("socket") == cpu_socket]
            return compat if compat else pool

    elif slug == "ram":
        mb_mem = (selected.get("motherboard") and (selected["motherboard"].specs or {}).get("memory_type")) or None
        if mb_mem:
            compat = [r for r in pool if (r.specs or {}).get("type") == mb_mem]
            return compat if compat else pool

    elif slug == "cooler":
        cpu_socket = (selected.get("cpu") and (selected["cpu"].specs or {}).get("socket", "").lower()) or ""
        if cpu_socket:
            key = f"socket_{cpu_socket.replace('-', '')}"   # "socket_lga1700" / "socket_am5" / "socket_am4"
            compat = [c for c in pool if (c.specs or {}).get(key, False)]
            return compat if compat else pool

    elif slug == "psu":
        cpu_tdp   = (selected.get("cpu")  and (selected["cpu"].specs  or {}).get("tdp",     0)) or 0
        gpu_power = (selected.get("gpu")  and (selected["gpu"].specs  or {}).get("power_w", 0)) or 0
        needed_w  = int((cpu_tdp + gpu_power + 50) * 1.2)
        if needed_w > 0:
            compat = [p for p in pool if (p.specs or {}).get("wattage", 0) >= needed_w]
            return compat if compat else pool

    elif slug == "case":
        mb_form      = (selected.get("motherboard") and (selected["motherboard"].specs or {}).get("form_factor")) or None
        gpu_length   = (selected.get("gpu")         and (selected["gpu"].specs         or {}).get("length_mm",  0)) or 0
        cooler_h     = (selected.get("cooler")      and (selected["cooler"].specs      or {}).get("height_mm",  0)) or 0
        radiator_mm  = (selected.get("cooler")      and (selected["cooler"].specs      or {}).get("radiator_mm", 0)) or 0
        compat = []
        for c in pool:
            s = c.specs or {}
            cf = s.get("form_factor", "")
            if mb_form and cf:
                if mb_form == "ATX"  and cf not in ("ATX",):          continue
                if mb_form == "mATX" and cf not in ("ATX", "mATX"):   continue
            if gpu_length   and s.get("max_gpu_length_mm",    9999) < gpu_length:  continue
            if cooler_h     and s.get("max_cooler_height_mm", 9999) < cooler_h:    continue
            if radiator_mm  and s.get("max_radiator_mm",      9999) < radiator_mm: continue
            compat.append(c)
        return compat if compat else pool

    return pool

def suggest_config(budget: float, use_case: str, brand_pref: str, db: Session) -> dict:
    """
    Selectie COMPATIBILA de prima data:
      Gaming  : GPU → CPU → MB(socket) → RAM(tip) → Cooler(socket) → PSU(wattaj) → Carcasa(form+dim) → Stocare
      Altele  : CPU → MB(socket) → RAM(tip) → GPU → Cooler(socket) → PSU(wattaj) → Carcasa(form+dim) → Stocare
    Fiecare pas filtreaza produsele dupa compatibilitate cu cele deja alese.
    """
    is_gaming      = "gaming"      in use_case.lower()
    is_video       = any(w in use_case.lower() for w in ["video", "editare", "rendering"])
    is_streaming   = any(w in use_case.lower() for w in ["streaming", "stream", "obs"])
    is_productivity = any(w in use_case.lower() for w in ["productivity", "productivitate", "dev", "programming"])

    all_storage = get_products_by_slug(db, "storage")
    ssd_only = [
        p for p in all_storage
        if "ssd" in (p.name or "").lower()
        or "nvme" in (p.name or "").lower()
        or "m.2" in (p.name or "").lower()
        or "nvme" in str((p.specs or {}).get("interface", "")).lower()
        or "sata" in str((p.specs or {}).get("interface", "")).lower()
        and "hdd" not in (p.name or "").lower()
    ]

    base_pools = {
        "cpu":         filter_brand(get_products_by_slug(db, "cpu"),  brand_pref),
        "motherboard": get_products_by_slug(db, "motherboard"),
        "ram":         get_products_by_slug(db, "ram"),
        "gpu":         filter_brand(get_products_by_slug(db, "gpu"),  brand_pref),
        "psu":         get_products_by_slug(db, "psu"),
        "case":        get_products_by_slug(db, "case"),
        "storage":     ssd_only if ssd_only else all_storage,
        "cooler":      get_products_by_slug(db, "cooler"),
    }

    if is_gaming:
        alloc = {"gpu": 0.35, "cpu": 0.20, "motherboard": 0.12, "ram": 0.10,
                 "psu": 0.08, "cooler": 0.05, "case": 0.05, "storage": 0.05}
        # CPU primul → socket cunoscut → rezerva corecta pentru cooler/MB; GPU ia restul bugetului
        order = ["cpu", "motherboard", "ram", "gpu", "cooler", "psu", "case", "storage"]
    elif is_video:
        alloc = {"cpu": 0.30, "gpu": 0.20, "ram": 0.18, "motherboard": 0.12,
                 "psu": 0.08, "cooler": 0.05, "storage": 0.05, "case": 0.02}
        order = ["cpu", "motherboard", "ram", "gpu", "cooler", "psu", "case", "storage"]
    elif is_streaming:
        alloc = {"cpu": 0.30, "gpu": 0.20, "ram": 0.15, "motherboard": 0.12,
                 "psu": 0.08, "cooler": 0.05, "storage": 0.06, "case": 0.04}
        order = ["cpu", "motherboard", "ram", "gpu", "cooler", "psu", "case", "storage"]
    elif is_productivity:
        alloc = {"cpu": 0.32, "ram": 0.20, "motherboard": 0.15, "gpu": 0.10,
                 "psu": 0.08, "cooler": 0.05, "storage": 0.06, "case": 0.04}
        order = ["cpu", "motherboard", "ram", "gpu", "cooler", "psu", "case", "storage"]
    else:  # office / default
        alloc = {"cpu": 0.28, "ram": 0.15, "motherboard": 0.15, "storage": 0.12,
                 "gpu": 0.12, "psu": 0.08, "cooler": 0.05, "case": 0.05}
        order = ["cpu", "motherboard", "ram", "gpu", "cooler", "psu", "case", "storage"]

    selected  = {}
    remaining = budget

    # ── PASS 1: selectie initiala compatibila ─────────────────
    for i, slug in enumerate(order):
        pool = get_compatible_pool(slug, selected, base_pools)

        # Rezerva DINAMICA: pretul minim compatibil pentru fiecare slot ramas
        reserved = 0
        for future_slug in order[i + 1:]:
            fp = get_compatible_pool(future_slug, selected, base_pools)
            reserved += float(fp[0].price) if fp else 0

        available = max(remaining - reserved, 0)
        max_spend = min(budget * alloc[slug], available)

        # Regula speciala CPU: simuleaza selectia fiecarui CPU si calculeaza rezerva
        # socket-aware pentru toate componentele viitoare; pastreaza doar CPU-urile
        # unde cpu.price + min_viitoare(socket) <= remaining
        if slug == "cpu":
            valid = []
            for cpu in pool:
                sim_selected = {"cpu": cpu}
                sim_reserved = 0
                for future_slug in order[i + 1:]:
                    fp = get_compatible_pool(future_slug, sim_selected, base_pools)
                    sim_reserved += float(fp[0].price) if fp else 0
                if float(cpu.price) + sim_reserved <= remaining:
                    valid.append(cpu)
            pool = valid if valid else pool  # daca nimic nu se incadreaza, folosim pool normal

        product = pick_best(pool, max_spend, available)

        # Fallback: cel mai ieftin in `available` (nu `remaining`!) — nu fura rezerva
        if not product:
            affordable = [p for p in pool if float(p.price) <= available]
            product = affordable[0] if affordable else None

            # Pentru MB: NU lua incompatibil niciodata — mai bine lipseste
            if slug == "motherboard" and product:
                cpu_socket = (selected.get("cpu") and (selected["cpu"].specs or {}).get("socket"))
                if cpu_socket and (product.specs or {}).get("socket") != cpu_socket:
                    product = None  # refuza MB incompatibil

        if product:
            selected[slug] = product
            remaining -= float(product.price)

    # ── PASS 2: upgrade iterativ cu bugetul ramas ──────────────────────
    # Ruleaza DOAR daca toate 8 componente sunt selectate; continua pana bugetul e epuizat
    if remaining > 10 and len(selected) == len(REQUIRED_SLUGS):
        for _ in range(8):          # max 8 iteratii — evita bucla infinita
            any_upgrade = False
            for slug in order:
                if slug not in selected or remaining <= 10:
                    continue
                current_price = float(selected[slug].price)

                # Pool compatibil; pastreaza socket-ul CPU/MB pentru a nu rupe compatibilitatea
                pool = get_compatible_pool(slug, selected, base_pools)
                if slug == "cpu":
                    cs = (selected[slug].specs or {}).get("socket")
                    if cs:
                        same = [p for p in pool if (p.specs or {}).get("socket") == cs]
                        pool = same if same else pool
                elif slug == "motherboard":
                    ms = (selected[slug].specs or {}).get("socket")
                    if ms:
                        same = [p for p in pool if (p.specs or {}).get("socket") == ms]
                        pool = same if same else pool

                # Cel mai bun upgrade posibil in limita bugetului ramas
                max_upgrade = current_price + remaining
                better = [p for p in pool
                          if float(p.price) > current_price and float(p.price) <= max_upgrade]

                # Cooler: nu alege AIO cu radiator mai mare decat carcasa permite
                if slug == "cooler" and selected.get("case"):
                    case_max_rad = (selected["case"].specs or {}).get("max_radiator_mm", 9999)
                    better = [p for p in better
                              if not (p.specs or {}).get("radiator_mm")
                              or (p.specs or {}).get("radiator_mm", 0) <= case_max_rad]

                if better:
                    best = better[-1]
                    remaining -= float(best.price) - current_price
                    selected[slug] = best
                    any_upgrade = True

            if not any_upgrade:
                break   # niciun upgrade posibil in aceasta iteratie, opreste

    # ── CALCUL FINAL ──────────────────────────────────────────
    total    = sum(float(p.price) for p in selected.values())
    warnings = check_compatibility(selected)
    missing  = [s for s in REQUIRED_SLUGS if s not in selected]

    config = {
        role: {
            "id":    str(p.id),
            "name":  p.name,
            "brand": p.brand,
            "price": float(p.price),
            "specs": p.specs,
        }
        for role, p in selected.items()
    }

    if is_gaming:           label = "gaming"
    elif is_video:          label = "editare video"
    elif is_streaming:      label = "streaming"
    elif is_productivity:   label = "productivitate"
    else:                   label = "office"

    budget_remaining = round(budget - total, 2)
    notes = [f"Configuratie optimizata pentru {label}."]
    if budget_remaining > 100:
        notes.append(f"Buget ramas: {budget_remaining} RON.")
    if missing:
        notes.append(f"Componente lipsa (buget insuficient): {', '.join(missing)}.")

    return {
        "success":    True,
        "budget":     budget,
        "min_budget": None,
        "suggestion": {
            "configuration":      config,
            "total_price":        round(total, 2),
            "budget_remaining":   budget_remaining,
            "performance_notes":  " ".join(notes),
            "compatibility_notes": warnings,
            "is_compatible": not any(
                kw in w.lower()
                for w in warnings
                for kw in ["incompatibil", "insuficient", "prea lung", "prea inalt"]
            ),
        }
    }

# ── ENDPOINTS ────────────────────────────────────────────────

@router.get("/min-price")
def get_min_price(db: Session = Depends(get_db)):
    """Returneaza bugetul minim si maxim REAL din DB (maxim = ce poate cheltui efectiv algoritmul)."""
    min_b = get_min_budget(db)
    # Ruleaza algoritmul cu buget urias pentru a obtine totalul real maxim achievable
    result = suggest_config(999_999, "gaming", "", db)
    real_max = result["suggestion"]["total_price"] if result.get("suggestion") else get_max_budget(db)
    return {
        "min_budget": min_b,
        "max_budget": real_max,
        "currency": "RON"
    }

@router.post("/suggest")
def suggest_configuration(req: ChatRequest, db: Session = Depends(get_db)):
    min_budget = get_min_budget(db)

    if req.budget < min_budget:
        raise HTTPException(
            status_code=400,
            detail=f"Bugetul minim pentru un PC complet este {min_budget} RON. "
                   f"Acesta include: CPU, Placa de baza, RAM, GPU, Sursa, Carcasa, Stocare si Cooler "
                   f"la preturile cele mai mici disponibile in stoc."
        )

    result = suggest_config(
        req.budget,
        req.use_case,
        req.brand_preference or "",
        db
    )
    result["min_budget"] = min_budget
    return result

@router.post("/message")
def chat_message(req: ChatRequest, db: Session = Depends(get_db)):
    if not req.message:
        raise HTTPException(status_code=400, detail="Mesajul este obligatoriu")

    msg    = req.message.lower()
    budget = req.budget
    min_b  = get_min_budget(db)
    max_b  = get_max_budget(db)

    if any(w in msg for w in ["gaming", "jocuri", "fps", "games"]):
        response = (
            f"Pentru gaming cu {budget} RON iti recomand sa aloci ~35% pe GPU si ~20% pe CPU. "
            f"Buget minim pentru gaming: {min_b} RON, maxim posibil: {max_b} RON. "
            f"Apasa 'Genereaza configuratie' pentru o lista completa compatibila!"
        )
    elif any(w in msg for w in ["video", "editare", "rendering", "premiere", "davinci"]):
        response = (
            f"Pentru editare video cu {budget} RON prioritizeaza CPU multi-core si RAM 32GB+. "
            f"GPU conteaza mai putin decat la gaming. "
            f"Buget recomandat pentru editare 4K: minim {int(min_b * 1.5)} RON."
        )
    elif any(w in msg for w in ["office", "birou", "lucru", "word", "excel"]):
        response = (
            f"Pentru office cu {budget} RON nu ai nevoie de GPU dedicat performant. "
            f"Investeste in CPU bun si SSD NVMe rapid. "
            f"Buget minim pentru office: {min_b} RON."
        )
    elif any(w in msg for w in ["cooler", "racire", "temperatura"]):
        response = (
            "Cooler-ul e important pentru stabilitate si silentiu. "
            "Air cooling (Noctua, DeepCool) e suficient pentru 95% din utilizatori. "
            "AIO 240/360mm e recomandat pentru procesoare cu TDP peste 125W. "
            "Configuratorul verifica automat compatibilitatea cooler-ului cu CPU-ul si carcasa!"
        )
    elif any(w in msg for w in ["amd", "ryzen"]):
        response = (
            "AMD Ryzen ofera cel mai bun raport pret/performanta. "
            "Platforma AM5 cu DDR5 e viitorul — socket compatibil cu urmatoarea generatie. "
            f"Cel mai ieftin PC AMD din stocul nostru: aproximativ {min_b} RON."
        )
    elif any(w in msg for w in ["intel", "core"]):
        response = (
            "Intel Core i5/i7/i9 gen 13 sunt excelente pentru gaming single-core. "
            "Platforma LGA1700 cu DDR5 ofera performanta premium. "
            f"Cel mai ieftin PC Intel din stocul nostru: aproximativ {min_b} RON."
        )
    elif any(w in msg for w in ["nvidia", "rtx", "geforce"]):
        response = (
            "NVIDIA RTX 4060 e ideal pentru 1080p, RTX 4070 pentru 1440p, RTX 4080 pentru 4K. "
            "Ray tracing si DLSS 3 Frame Generation sunt exclusivitati NVIDIA. "
            f"Cu {budget} RON poti obtine o configuratie cu "
            f"{'RTX 4090' if budget > 10000 else 'RTX 4080' if budget > 7000 else 'RTX 4070' if budget > 4000 else 'RTX 4060'}."
        )
    elif any(w in msg for w in ["buget", "minim", "ieftin", "cat costa"]):
        response = (
            f"Bugetul minim pentru un PC complet din stocul nostru este {min_b} RON. "
            f"Acesta include toate componentele obligatorii: CPU, Placa de baza, RAM, GPU, "
            f"Sursa, Carcasa, Stocare si Cooler la preturile cele mai mici disponibile. "
            f"Bugetul maxim posibil (top of the line) este {max_b} RON."
        )
    elif any(w in msg for w in ["compatibil", "socket", "merge", "functioneaza"]):
        response = (
            "Configuratorul nostru verifica automat 11 reguli de compatibilitate: "
            "socket CPU-MB, tip RAM, consum PSU, dimensiune GPU in carcasa, "
            "inaltime cooler, form factor, TDP cooler, socket cooler, "
            "radiator AIO, capacitate RAM maxima si sloturi M.2. "
            "Apasa 'Genereaza configuratie' si primesti o configuratie 100% compatibila!"
        )
    else:
        response = (
            f"Cu {budget} RON poti construi un PC excelent! "
            f"Buget minim disponibil: {min_b} RON, maxim posibil: {max_b} RON. "
            f"Spune-mi pentru ce folosesti PC-ul: gaming, editare video, office sau altceva?"
        )

    return {"response": response}


# ── ENDPOINT-URI CHAT GHIDAT ─────────────────────────────────

@router.get("/ai-status")
async def chat_ai_status():
    """Verifică dacă Ollama este disponibil."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get("http://localhost:11434/api/tags")
            return {"available": r.status_code == 200}
    except Exception:
        return {"available": False}


@router.get("/categories")
def chat_get_categories(db: Session = Depends(get_db)):
    rows = (
        db.query(Category)
        .join(Product, Product.category_id == Category.id)
        .filter(Product.is_active == True, Product.stock > 0)
        .distinct()
        .order_by(Category.sort_order)
        .all()
    )
    return [{"slug": c.slug, "name": c.name} for c in rows]


SKIP_FILTER_KEYS = {
    "power_w", "length_mm", "height_mm", "tdp", "tdp_w",
    "slot", "radiator_mm", "max_gpu_length_mm",
    "max_cooler_height_mm", "max_radiator_mm",
    "socket_am4", "socket_am5", "socket_lga1700",
}


@router.get("/filters/{category_slug}")
def chat_get_filters(category_slug: str, db: Session = Depends(get_db)):
    products = get_products_by_slug(db, category_slug)
    result: dict = {}

    brands = sorted({p.brand for p in products if p.brand})
    if brands:
        result["brand"] = brands

    spec_values: dict = {}
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


def _extract_price(text: str) -> dict:
    """Extract max/min price from Romanian natural language."""
    t = text.lower()
    prices = {}
    max_pats = [
        r'(?:sub|p[âa]n[aă]\s+(?:la|[îi]n?)|max(?:im(?:um)?)?|cel\s+mult|mai\s+pu[țt]in\s+de)\s*(\d+(?:[.,]\d+)?)\s*(?:lei|ron)?',
        r'(\d+(?:[.,]\d+)?)\s*(?:lei|ron)\s*(?:max(?:im)?)',
        r'(?:buget|budget)[:\s]+(\d+)',
        r'(\d+)\s*(?:lei|ron)\s*(?:sau\s+mai\s+pu[țt]in)',
    ]
    for pat in max_pats:
        m = re.search(pat, t)
        if m:
            prices['max_price'] = float(m.group(1).replace(',', '.'))
            break
    min_pats = [
        r'(?:de\s+la|minim(?:um)?|cel\s+pu[țt]in|peste|[îi]ncep[âa]nd\s+de\s+la)\s*(\d+(?:[.,]\d+)?)\s*(?:lei|ron)?',
    ]
    for pat in min_pats:
        m = re.search(pat, t)
        if m:
            prices['min_price'] = float(m.group(1).replace(',', '.'))
            break
    return prices


class ChatSearchRequest(BaseModel):
    category_slug: str
    filters: dict = {}
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    sort: str = "price"
    limit: int = 8


@router.post("/search")
def chat_search(req: ChatSearchRequest, db: Session = Depends(get_db)):
    products = get_products_by_slug(db, req.category_slug)

    if req.max_price is not None:
        products = [p for p in products if float(p.price) <= req.max_price]
    if req.min_price is not None:
        products = [p for p in products if float(p.price) >= req.min_price]

    for key, value in req.filters.items():
        if not value:
            continue
        val_str = str(value).lower().strip()
        if key == "brand":
            products = [p for p in products
                        if val_str in (p.brand or "").lower()
                        or (p.brand or "").lower() in val_str]
        else:
            products = [
                p for p in products
                if val_str in str((p.specs or {}).get(key, "")).lower()
                or str((p.specs or {}).get(key, "")).lower() in val_str
            ]

    limit = max(1, min(req.limit, 100))
    result = []
    for p in products[:limit]:
        old = float(p.old_price) if p.old_price else None
        cur = float(p.price)
        discount_pct = round((1 - cur / old) * 100) if old and old > cur else 0
        result.append({
            "id": str(p.id),
            "name": p.name,
            "brand": p.brand,
            "price": cur,
            "old_price": old,
            "discount_percent": discount_pct,
            "specs": p.specs,
            "image": p.images[0].url if p.images else None,
        })
    return result


class ChatDescribeRequest(BaseModel):
    product_id: str


@router.post("/describe")
async def chat_describe(req: ChatDescribeRequest, db: Session = Depends(get_db)):
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


class ChatExtractRequest(BaseModel):
    message: str


@router.post("/extract-filters")
async def chat_extract_filters(req: ChatExtractRequest, db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    slugs = [c.slug for c in categories]

    # Construieste {slug: {key: [values]}} pentru toate categoriile
    # Limitat la categorii cu produse in stoc
    category_filters: dict = {}
    for cat in categories:
        products = get_products_by_slug(db, cat.slug)
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
            category_filters[cat.slug] = filters

    price_data = _extract_price(req.message)

    result = await ollama_service.extract_filters(req.message, slugs, category_filters)
    if result and result.get("category_slug"):
        return {**result, **price_data}

    # Fallback: keyword matching dacă Ollama nu a recunoscut categoria
    msg_lower = req.message.lower()
    KEYWORD_MAP = {
        "cpu":         ["procesor", "procesoare", "cpu", "ryzen", "intel core", "threadripper", "i5", "i7", "i9"],
        "gpu":         ["placa video", "placi video", "plăci video", "placă video", "gpu", "geforce", "rtx", "gtx", "radeon", "rx 6", "rx 7", "nvidia", "grafica", "grafică"],
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
    for slug, keywords in KEYWORD_MAP.items():
        if slug in slugs and any(kw in msg_lower for kw in keywords):
            return {"category_slug": slug, "filters": {}, **price_data}

    return {**price_data} if price_data else {}