import httpx
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_DESCRIBE = "qwen2.5:7b"
MODEL_SEARCH   = "pcshop-assistant"
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
                "model": MODEL_DESCRIBE,
                "prompt": prompt,
                "stream": False,
            })
            return resp.json().get("response", "").strip() or None
    except Exception:
        return None


async def extract_filters(
    message: str,
    category_slugs: list[str],
    category_filters: dict | None = None,  # {slug: {key: [val1, val2, ...]}}
) -> dict | None:
    # Construieste sectiunea de categorii cu filtrele lor disponibile
    if category_filters:
        cat_lines = []
        for slug, filters in category_filters.items():
            if not filters:
                cat_lines.append(f"- {slug}")
                continue
            parts = []
            for k, vals in list(filters.items())[:10]:
                sample = vals[:8] if isinstance(vals, list) else [vals]
                parts.append(f'{k}: {json.dumps(sample, ensure_ascii=False)}')
            cat_lines.append(f"- {slug}: {{{', '.join(parts)}}}")
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
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
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
