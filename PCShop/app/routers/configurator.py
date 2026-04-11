from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.product import Product
from app.models.order import CartItem

router = APIRouter(prefix="/configurator", tags=["Configurator PC"])

class ConfigurationRequest(BaseModel):
    user_id: Optional[UUID] = None
    name: str = "Configuratia mea"
    components: dict

def check_compatibility(components: dict, db: Session):
    warnings = []
    is_compatible = True
    total_power = 0
    products = {}

    for role, product_id in components.items():
        if product_id:
            product = db.query(Product).filter(Product.id == product_id).first()
            if product:
                products[role] = product

    cpu         = products.get("cpu")
    motherboard = products.get("motherboard")
    ram         = products.get("ram")
    gpu         = products.get("gpu")
    psu         = products.get("psu")
    case        = products.get("case")
    cooler      = products.get("cooler")
    storage     = products.get("storage")

    # R1 – Socket CPU ↔ Placa de baza
    if cpu and motherboard:
        cpu_socket = (cpu.specs.get("socket") or "").upper()
        mb_socket  = (motherboard.specs.get("socket") or "").upper()
        if cpu_socket and mb_socket and cpu_socket != mb_socket:
            warnings.append(f"[R1] Socket incompatibil: CPU={cpu_socket}, MB={mb_socket}")
            is_compatible = False

    # R2 – Tip RAM ↔ Placa de baza
    if ram and motherboard:
        ram_type  = (ram.specs.get("type") or "").upper()
        mb_memory = (motherboard.specs.get("memory_type") or "").upper()
        if ram_type and mb_memory and ram_type not in mb_memory and mb_memory not in ram_type:
            warnings.append(f"[R2] RAM incompatibil: {ram_type} vs MB suporta {mb_memory}")
            is_compatible = False

    # R3 – Cooler ↔ Socket CPU (campuri booleane: socket_am5, socket_am4, socket_lga1700)
    if cooler and cpu:
        cpu_socket = (cpu.specs.get("socket") or "").upper()
        if cpu_socket == "AM5" and not cooler.specs.get("socket_am5", False):
            warnings.append(f"[R3] Cooler incompatibil cu socket AM5")
            is_compatible = False
        elif cpu_socket == "AM4" and not cooler.specs.get("socket_am4", False):
            warnings.append(f"[R3] Cooler incompatibil cu socket AM4")
            is_compatible = False
        elif cpu_socket == "LGA1700" and not cooler.specs.get("socket_lga1700", False):
            warnings.append(f"[R3] Cooler incompatibil cu socket LGA1700")
            is_compatible = False

    # R4 – Sursa ↔ Consum total (cu marja 1.2x)
    if cpu:
        total_power += int(cpu.specs.get("tdp", 0))
    if gpu:
        total_power += int(gpu.specs.get("power_w", 0))
    total_power += 50  # sistem de baza (MB, RAM, SSD, ventilatoare)

    if psu and total_power > 0:
        psu_wattage  = int(psu.specs.get("wattage", 0))
        needed_safe  = int(total_power * 1.2)
        if psu_wattage < total_power:
            warnings.append(f"[R4] Sursa insuficienta: necesar minim {total_power}W, ales {psu_wattage}W")
            is_compatible = False
        elif psu_wattage < needed_safe:
            warnings.append(f"[R4] Sursa la limita: recomandat {needed_safe}W pentru siguranta (ales {psu_wattage}W)")

    # R5 – Form factor MB ↔ Carcasa (ierarhie: ATX>mATX>ITX)
    FORM_HIERARCHY = {"ITX": 1, "MINI-ITX": 1, "MATX": 2, "MICRO-ATX": 2, "ATX": 3, "E-ATX": 4}
    if motherboard and case:
        mb_form   = (motherboard.specs.get("form_factor") or "").upper().replace(" ", "-").replace("MICRO", "MICRO-")
        case_form = (case.specs.get("form_factor") or "").upper().replace(" ", "-").replace("MICRO", "MICRO-")
        mb_rank   = FORM_HIERARCHY.get(mb_form, 0)
        case_rank = FORM_HIERARCHY.get(case_form, 0)
        if mb_rank and case_rank and mb_rank > case_rank:
            warnings.append(f"[R5] Form factor incompatibil: MB {mb_form} nu incape in carcasa {case_form}")
            is_compatible = False

    # R6 – Lungime GPU ↔ Carcasa
    if gpu and case:
        gpu_length   = int(gpu.specs.get("length_mm", 0))
        case_max_gpu = int(case.specs.get("max_gpu_length_mm", 9999))
        if gpu_length and case_max_gpu < 9999 and gpu_length > case_max_gpu:
            warnings.append(f"[R6] GPU prea lung: {gpu_length}mm, carcasa permite max {case_max_gpu}mm")
            is_compatible = False

    # R7 – Inaltime Cooler ↔ Carcasa
    if cooler and case:
        cooler_h    = int(cooler.specs.get("height_mm", 0))
        case_max_h  = int(case.specs.get("max_cooler_height_mm", 9999))
        if cooler_h and case_max_h < 9999 and cooler_h > case_max_h:
            warnings.append(f"[R7] Cooler prea inalt: {cooler_h}mm, carcasa permite max {case_max_h}mm")
            is_compatible = False

    # R8 – TDP Cooler ≥ TDP CPU (campul corect e tdp_w)
    if cooler and cpu:
        cooler_tdp = int(cooler.specs.get("tdp_w", 0))
        cpu_tdp    = int(cpu.specs.get("tdp", 0))
        if cooler_tdp and cpu_tdp and cooler_tdp < cpu_tdp:
            warnings.append(f"[R8] Cooler subdimensionat: rating {cooler_tdp}W, CPU necesita {cpu_tdp}W")
            is_compatible = False

    # R9 – Radiator AIO ↔ Carcasa (max_radiator_mm in DB)
    if cooler and case:
        radiator_mm = int(cooler.specs.get("radiator_mm", 0))
        max_rad     = int(case.specs.get("max_radiator_mm", 9999))
        if radiator_mm and max_rad < 9999 and radiator_mm > max_rad:
            warnings.append(f"[R9] Radiatorul AIO {radiator_mm}mm depaseste max carcasei ({max_rad}mm)")
            is_compatible = False

    # R10 – Capacitate RAM ≤ Max MB
    if ram and motherboard:
        ram_cap  = int(ram.specs.get("capacity_gb", 0))
        mb_max   = int(motherboard.specs.get("max_memory_gb", 0))
        if ram_cap and mb_max and ram_cap > mb_max:
            warnings.append(f"[R10] RAM {ram_cap}GB depaseste maximul suportat de MB ({mb_max}GB)")
            is_compatible = False

    # R11 – SSD M.2 ↔ Sloturi M.2 MB
    if storage and motherboard:
        iface = (storage.specs.get("interface") or "").upper()
        if "M.2" in iface or "NVME" in iface or "M2" in iface:
            m2_slots = int(motherboard.specs.get("m2_slots", 0))
            if m2_slots == 0:
                warnings.append(f"[R11] SSD-ul ales este M.2/NVMe dar MB-ul nu are sloturi M.2")
                is_compatible = False

    # R12 – Verifica stoc pentru fiecare componenta selectata
    for role, product in products.items():
        if product.stock < 1:
            warnings.append(f"[R12] {product.name} ({role}) este epuizat (stoc 0)")
            is_compatible = False

    total_price = sum(float(p.price) for p in products.values())

    return {
        "is_compatible": is_compatible,
        "warnings": warnings,
        "total_power_needed": total_power,
        "recommended_psu_w": int(total_power * 1.2),
        "total_price": round(total_price, 2),
        "components_detail": {
            role: {
                "id": str(p.id),
                "name": p.name,
                "brand": p.brand,
                "price": float(p.price),
                "specs": p.specs
            }
            for role, p in products.items()
        }
    }

@router.post("/check")
def check_config(req: ConfigurationRequest, db: Session = Depends(get_db)):
    if not req.components:
        raise HTTPException(status_code=400, detail="Nu ai selectat nicio componenta")
    result = check_compatibility(req.components, db)
    return {"name": req.name, **result}

@router.post("/save", status_code=201)
def save_configuration(req: ConfigurationRequest, db: Session = Depends(get_db)):
    from app.models.configurations import Configuration
    result = check_compatibility(req.components, db)
    config = Configuration(
        user_id=req.user_id,
        name=req.name,
        components=req.components,
        is_compatible=result["is_compatible"],
        warnings=result["warnings"],
        total_price=result["total_price"]
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return {"message": "Configuratie salvata", "id": str(config.id), **result}

@router.post("/add-to-cart")
def add_config_to_cart(req: ConfigurationRequest, db: Session = Depends(get_db)):
    if not req.user_id:
        raise HTTPException(status_code=400, detail="User ID necesar")
    result = check_compatibility(req.components, db)
    if not result["is_compatible"]:
        raise HTTPException(status_code=400, detail=f"Configuratie incompatibila: {result['warnings']}")
    added = 0
    for role, product_data in result["components_detail"].items():
        product = db.query(Product).filter(Product.id == product_data["id"]).first()
        if not product or product.stock < 1:
            raise HTTPException(status_code=400, detail=f"Stoc insuficient: {product_data['name']}")
        existing = db.query(CartItem).filter(
            CartItem.user_id == req.user_id,
            CartItem.product_id == product_data["id"]
        ).first()
        if existing:
            existing.quantity += 1
        else:
            db.add(CartItem(user_id=req.user_id, product_id=product_data["id"], quantity=1))
        added += 1
    db.commit()
    return {"message": f"{added} componente adaugate in cos", "total_price": result["total_price"]}