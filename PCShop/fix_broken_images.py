"""
Fix broken/wrong product images by replacing them with correct Newegg CDN URLs.
"""
import sys
import uuid
sys.path.insert(0, 'c:/Licenta/PCShop')

from app.database import SessionLocal
from app.models import Product, ProductImage

BASE = "https://c1.neweggimages.com/productimage/nb640/"

UPDATES = {
    # ── Cases ──────────────────────────────────────────────────────────────
    "be quiet! Pure Base 500":
        BASE + "11-734-018-01.jpg",
    "be quiet! Pure Base 500DX":
        BASE + "11-734-018-01.jpg",
    "ASUS TUF Gaming GT501":
        BASE + "11-173-034-V07.jpg",
    "Corsair 5000D Airflow":
        BASE + "11-139-165-V21.jpg",

    # ── Coolers ────────────────────────────────────────────────────────────
    "be quiet! Dark Rock 4":
        BASE + "A68V_1320238654559649376UErre9d0J.jpg",
    "be quiet! Dark Rock Pro 4":
        BASE + "BDXBD2207130BME8423.jpg",
    "be quiet! Pure Rock 2":
        BASE + "A68V_131165062033581483yu7URPF3jo.jpg",
    "be quiet! Shadow Rock 3":
        BASE + "A68VS200218uY1u1.jpg",

    # ── Monitor ────────────────────────────────────────────────────────────
    'ASUS ROG Swift OLED PG27AQDM 27" 240Hz':
        BASE + "24-281-347-09.png",

    # ── Keyboards — Logitech ───────────────────────────────────────────────
    "Logitech G915 Full Size Wireless":
        BASE + "23-126-752-01.jpg",
    "Logitech G915 TKL Wireless":
        BASE + "23-126-613-V01.jpg",
    "Logitech G Pro Mechanical TKL":
        "https://c1.neweggimages.com/ProductImageCompressAll60/AKVHD22060314SL1KA6.jpg",
    "Logitech G Pro X Keyboard TKL":
        BASE + "23-126-720-09.jpg",
    "Logitech MX Keys Advanced":
        BASE + "AH0E_132164463929609056suqOOzTHGF.jpg",
    "Logitech K120 Keyboard":
        BASE + "23-126-096-17.jpg",
    "Logitech MK270 Wireless Combo":
        BASE + "23-126-332-23.jpg",

    # ── Keyboards — Razer ──────────────────────────────────────────────────
    "Razer BlackWidow V4 Pro":
        BASE + "26J-05FW-00002-01.jpg",
    "Razer BlackWidow V4 75%":
        BASE + "A17PD2403260DVQIL54.jpg",
    "Razer Huntsman V2 TKL":
        BASE + "A4RES2305100K4KJI18.jpg",
    "Razer Huntsman Mini":
        BASE + "A8X5S210608oRjTq.jpg",

    # ── Keyboards — SteelSeries ────────────────────────────────────────────
    "SteelSeries Apex Pro Full Size":
        BASE + "23-239-048-V09.jpg",
    "SteelSeries Apex Pro TKL":
        BASE + "23-239-051-V09.jpg",
    "SteelSeries Apex Pro TKL Wireless":
        "https://c1.neweggimages.com/ProductImage/32N-001D-000E2-04.jpg",
    "SteelSeries Apex 3 TKL":
        "https://c1.neweggimages.com/ProductImageCompressAll60/V18MD2202210PYOXW6B.jpg",

    # ── Headsets — HyperX ─────────────────────────────────────────────────
    "HyperX Cloud Alpha Wireless":
        BASE + "AR0TD250627169K4HF1.jpg",
    "HyperX Cloud Core":
        BASE + "26-738-007-V01.jpg",
    "HyperX Cloud III Wireless":
        BASE + "A0ZXD23111603G5KW9C.jpg",
    "HyperX Cloud Stinger 2":
        BASE + "26-700-401-08.png",

    # ── Headsets — Razer ──────────────────────────────────────────────────
    "Razer BlackShark V2":
        BASE + "A4RES2304210FIYHVD5.jpg",
    "Razer Kraken V3 Pro Wireless":
        BASE + "0G6-00XZ-00151-09.jpg",
    "Razer Kraken X":
        BASE + "A4RES220425yyr4K.jpg",
    "Razer Nari Ultimate Wireless":
        BASE + "26-153-280-V01.jpg",
    "Razer Barracuda Pro Wireless":
        BASE + "26-153-328-09.jpg",

    # ── Headsets — Logitech ───────────────────────────────────────────────
    "Logitech G Pro X 2 Lightspeed":
        BASE + "26-197-624-37.png",
    "Logitech G231 Prodigy":
        BASE + "74-102-036-05.jpg",
    "Logitech G432 7.1":
        BASE + "26-197-332-Z03.jpg",
    "Logitech G733 Wireless":
        BASE + "26-197-401-10.jpg",
}

def main():
    db = SessionLocal()
    updated = 0
    skipped = 0
    try:
        for name, url in UPDATES.items():
            product = db.query(Product).filter(Product.name == name).first()
            if not product:
                print(f"  NOT FOUND: {name}")
                skipped += 1
                continue
            db.query(ProductImage).filter(ProductImage.product_id == product.id).delete()
            img = ProductImage(
                id=uuid.uuid4(),
                product_id=product.id,
                url=url,
                alt_text=name,
                sort_order=0,
            )
            db.add(img)
            db.commit()
            print(f"  OK: {name}")
            updated += 1
    finally:
        db.close()
    print(f"\n{updated} produse actualizate, {skipped} sarite")

if __name__ == "__main__":
    main()
