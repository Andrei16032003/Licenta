import os
import json
import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GOOGLE_API_KEY"),
    http_options={"api_version": "v1beta"},
)

EMBED_MODEL = "models/gemini-embedding-001"
CHAT_MODEL  = "models/gemini-1.5-flash"


async def embed_text(text: str) -> list[float] | None:
    # Genereaza un vector de 3072 dimensiuni pentru un document (produs)
    # task_type RETRIEVAL_DOCUMENT optimizeaza embedding-ul pentru indexare
    try:
        result = client.models.embed_content(
            model=EMBED_MODEL,
            contents=text,
            config={"task_type": "RETRIEVAL_DOCUMENT"},
        )
        return result.embeddings[0].values
    except Exception as e:
        print(f"    embed error: {e}")
        return None


async def embed_query(text: str) -> list[float] | None:
    # Genereaza un vector de 3072 dimensiuni pentru o interogare de cautare
    # task_type RETRIEVAL_QUERY optimizeaza embedding-ul pentru cautare semantica
    try:
        result = client.models.embed_content(
            model=EMBED_MODEL,
            contents=text,
            config={"task_type": "RETRIEVAL_QUERY"},
        )
        return result.embeddings[0].values
    except Exception as e:
        print(f"    embed_query error: {e}")
        return None


async def _generate_with_retry(prompt: str, retries: int = 2) -> str | None:
    for attempt in range(retries + 1):
        try:
            response = client.models.generate_content(model=CHAT_MODEL, contents=prompt)
            return response.text.strip()
        except Exception as e:
            msg = str(e)
            if attempt < retries and ("503" in msg or "UNAVAILABLE" in msg or "429" in msg):
                await asyncio.sleep(2 ** attempt)
                continue
            print(f"    gemini error: {e}")
            return None
    return None


async def generate_search_message(query: str, category_name: str | None, product_names: list[str]) -> str:
    n = len(product_names)
    cat = category_name or "produse"
    if n == 0:
        return f"Nu am găsit {cat} pentru \"{query}\". Încearcă alte cuvinte cheie sau fără filtre de preț."
    if n == 1:
        return f"Am găsit 1 produs relevant pentru \"{query}\":"
    return f"Iată cele mai relevante {cat} pentru \"{query}\":"


async def extract_filters(message: str, slugs: list[str], cat_filters: dict) -> dict | None:
    slug_hint = None
    for slug, kws in {
        "cpu":         ["procesor", "cpu", "ryzen", "intel core", "i5", "i7", "i9"],
        "gpu":         ["placa video", "gpu", "rtx", "gtx", "radeon", "nvidia", "geforce"],
        "ram":         ["ram", "memorie", "ddr4", "ddr5"],
        "motherboard": ["placa de baza", "motherboard", "mainboard"],
        "storage":     ["ssd", "hdd", "nvme", "stocare", "m.2"],
        "psu":         ["sursa", "psu", "watt", "alimentare"],
        "case":        ["carcasa", "tower", "cabinet"],
        "cooler":      ["cooler", "racire", "ventilator", "aio"],
        "monitor":     ["monitor", "ecran", "display", "144hz", "4k"],
    }.items():
        if slug in slugs and any(kw in message.lower() for kw in kws):
            slug_hint = slug
            break

    if slug_hint and slug_hint in cat_filters:
        filters = cat_filters[slug_hint]
        parts = []
        for k, vals in list(filters.items())[:12]:
            sample = vals[:8] if isinstance(vals, list) else [vals]
            parts.append(f'{k}: {json.dumps(sample, ensure_ascii=False)}')
        cats_block = f"- {slug_hint}: {{{', '.join(parts)}}}"
    else:
        cat_lines = []
        for s, filters in cat_filters.items():
            if not filters:
                cat_lines.append(f"- {s}")
                continue
            parts = []
            for k, vals in list(filters.items())[:6]:
                sample = vals[:5] if isinstance(vals, list) else [vals]
                parts.append(f'{k}: {json.dumps(sample, ensure_ascii=False)}')
            cat_lines.append(f"- {s}: {{{', '.join(parts)}}}")
        cats_block = "\n".join(cat_lines)

    if slug_hint:
        prompt = (
            f"Ești asistent pentru un shop PC. Utilizatorul caută: \"{message}\"\n"
            f"Categoria detectată: {slug_hint}\n"
            f"Filtre disponibile:\n{cats_block}\n\n"
            f"Returnează DOAR JSON cu filtre suplimentare:\n"
            f'{{\"filters\": {{\"cheie\": \"valoare_exacta_din_lista\"}}}}\n'
            f"Dacă nu identifici niciun filtru, returnează {{\"filters\": {{}}}}."
        )
    else:
        prompt = (
            f"Ești asistent pentru un shop de componente PC.\n"
            f"Utilizatorul caută: \"{message}\"\n\n"
            f"Categorii și filtre disponibile:\n{cats_block}\n\n"
            f"Returnează DOAR JSON fără markdown:\n"
            f'{{\"category_slug\": \"...\", \"filters\": {{\"cheie\": \"valoare\"}}}}\n'
            f"Dacă nu ești sigur de categorie, returnează {{}}."
        )

    text_out = await _generate_with_retry(prompt)
    if not text_out:
        return None
    try:
        start = text_out.find("{")
        end   = text_out.rfind("}") + 1
        if start == -1 or end == 0:
            return None
        result = json.loads(text_out[start:end])
        if slug_hint and "category_slug" not in result:
            result["category_slug"] = slug_hint
        return result
    except Exception as e:
        print(f"    extract parse error: {e}")
        return None
