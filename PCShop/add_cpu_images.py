"""
Script pentru adaugarea de imagini specifice pentru fiecare procesor.
Sterge imaginile existente si insereaza URL-uri noi, specifice fiecarui model.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.product import Product, Category, ProductImage
import uuid

# Mapare nume produs -> URL imagine specifica (Newegg / Amazon)
CPU_IMAGES = {
    # ── AMD Ryzen 3 ──────────────────────────────────────────────────────────
    "AMD Ryzen 3 4100": "https://c1.neweggimages.com/productimage/nb640/APRGS220504H6qmG.jpg",

    # ── AMD Ryzen 5 ──────────────────────────────────────────────────────────
    "AMD Ryzen 5 5600":  "https://c1.neweggimages.com/productimage/nb640/19-113-736-V03.jpg",
    "AMD Ryzen 5 5600X": "https://c1.neweggimages.com/productimage/nb640/19-113-666-V01.jpg",
    "AMD Ryzen 5 7600":  "https://c1.neweggimages.com/productimage/nb640/19-113-787-03.jpg",
    "AMD Ryzen 5 7600X": "https://c1.neweggimages.com/productimage/nb640/19-113-770-02.jpg",

    # ── AMD Ryzen 7 ──────────────────────────────────────────────────────────
    "AMD Ryzen 7 5700X":  "https://c1.neweggimages.com/productimage/nb640/19-113-735-V01.jpg",
    "AMD Ryzen 7 7700":   "https://c1.neweggimages.com/productimage/nb640/19-113-786-04.jpg",
    "AMD Ryzen 7 7700X":  "https://c1.neweggimages.com/productimage/nb640/19-113-768-01.jpg",
    "AMD Ryzen 7 7800X3D": "https://c1.neweggimages.com/ProductImage/19-113-793-03.png",

    # ── AMD Ryzen 9 ──────────────────────────────────────────────────────────
    "AMD Ryzen 9 7900X":   "https://c1.neweggimages.com/productimage/nb640/19-113-769-02.jpg",
    "AMD Ryzen 9 7950X":   "https://c1.neweggimages.com/productimage/nb640/19-113-771-09.jpg",
    "AMD Ryzen 9 7950X3D": "https://c1.neweggimages.com/productimage/nb640/19-113-791-03.png",

    # ── Intel Core i3 ────────────────────────────────────────────────────────
    "Intel Core i3-13100":  "https://c1.neweggimages.com/productimage/nb640/19-118-432-05.jpg",
    "Intel Core i3-13100F": "https://c1.neweggimages.com/productimage/nb640/V1DSD2210270Y6KQFA3.jpg",

    # ── Intel Core i5 ────────────────────────────────────────────────────────
    "Intel Core i5-12400F": "https://c1.neweggimages.com/productimage/nb640/19-118-360-08.jpg",
    "Intel Core i5-13400F": "https://c1.neweggimages.com/productimage/nb640/19-118-431-04.jpg",
    "Intel Core i5-13600K": "https://c1.neweggimages.com/productimage/nb640/19-118-416-V01.jpg",

    # ── Intel Core i7 ────────────────────────────────────────────────────────
    "Intel Core i7-12700K": "https://c1.neweggimages.com/productimage/nb640/19-118-343-05.jpg",
    "Intel Core i7-13700K": "https://c1.neweggimages.com/productimage/nb640/19-118-414-V01.jpg",

    # ── Intel Core i9 ────────────────────────────────────────────────────────
    "Intel Core i9-13900K":  "https://c1.neweggimages.com/productimage/nb640/19-118-412-V01.jpg",
    "Intel Core i9-13900KS": "https://c1.neweggimages.com/productimage/nb640/19-118-446-01.png",
    "Intel Core i9-14900K":  "https://c1.neweggimages.com/productimage/nb640/19-118-462-03.jpg",
}

def main():
    db = SessionLocal()
    try:
        # Gaseste categoria CPU
        cat = db.query(Category).filter(Category.id == 1).first()
        if not cat:
            print("Categoria CPU (id=1) nu a fost gasita.")
            return

        products = db.query(Product).filter(Product.category_id == 1).all()
        updated = 0
        skipped = 0

        for product in products:
            url = CPU_IMAGES.get(product.name)
            if not url:
                print(f"  [SKIP] Nicio imagine configurata pentru: {product.name}")
                skipped += 1
                continue

            # Sterge toate imaginile existente
            db.query(ProductImage).filter(ProductImage.product_id == product.id).delete()

            # Insereaza imaginea noua
            img = ProductImage(
                id=uuid.uuid4(),
                product_id=product.id,
                url=url,
                alt_text=product.name,
                sort_order=0,
            )
            db.add(img)
            print(f"  [OK] {product.name} -> {url}")
            updated += 1

        db.commit()
        print(f"\nGata! {updated} procesoare actualizate, {skipped} sarite.")

    except Exception as e:
        db.rollback()
        print(f"EROARE: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
