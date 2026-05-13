import asyncio
from dotenv import load_dotenv

load_dotenv()

from app.database import SessionLocal
from app.models.product import Product, Category
from app.services.gemini_service import embed_text

SLEEP_BETWEEN = 0.7   # secunde intre request-uri (max ~85/min, sub limita de 100)
MAX_RETRIES   = 5
RETRY_SLEEP   = 65    # secunde de asteptat dupa 429 (resetul ferestrei de 1 minut)


def product_to_text(product, category_name: str) -> str:
    parts = [product.name]
    if product.brand:
        parts.append(product.brand)
    parts.append(category_name)
    if product.specs:
        for k, v in product.specs.items():
            if isinstance(v, (str, int, float)):
                parts.append(f"{k} {v}")
    return " ".join(str(p) for p in parts)


async def embed_with_retry(text: str) -> list[float] | None:
    for attempt in range(MAX_RETRIES):
        result = await embed_text(text)
        if result is not None:
            return result
        print(f"    retry {attempt + 1}/{MAX_RETRIES} — astept {RETRY_SLEEP}s...", flush=True)
        await asyncio.sleep(RETRY_SLEEP)
    return None


async def index_all():
    db = SessionLocal()
    try:
        products = (
            db.query(Product)
            .join(Category)
            .filter(Product.is_active == True)
            .all()
        )

        to_index = [p for p in products if p.embedding is None]
        already  = len(products) - len(to_index)
        print(f"Total: {len(products)} | Deja indexate: {already} | De indexat: {len(to_index)}", flush=True)

        for i, product in enumerate(to_index):
            category_name = product.category.name if product.category else ""
            text = product_to_text(product, category_name)
            embedding = await embed_with_retry(text)

            if embedding:
                product.embedding = embedding
                db.commit()
                print(f"  [{i+1}/{len(to_index)}] OK  {product.name[:55]}", flush=True)
            else:
                print(f"  [{i+1}/{len(to_index)}] FAIL {product.name[:55]}", flush=True)

            await asyncio.sleep(SLEEP_BETWEEN)

        print("Indexare completa!", flush=True)
    except Exception as e:
        print(f"Eroare: {e}", flush=True)
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(index_all())
