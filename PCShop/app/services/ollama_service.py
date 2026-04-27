import httpx
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_DESCRIBE = "qwen2.5:7b"
MODEL_SEARCH   = "pcshop-assistant"
TIMEOUT = 8.0
TIMEOUT_SEARCH = 6.0


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
        async with httpx.AsyncClient(timeout=TIMEOUT_SEARCH) as client:
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
