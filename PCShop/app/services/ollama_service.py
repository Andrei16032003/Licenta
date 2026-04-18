import httpx
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"
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
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
            })
            return resp.json().get("response", "").strip() or None
    except Exception:
        return None


async def extract_filters(message: str, category_slugs: list[str]) -> dict | None:
    prompt = (
        f"Ești un asistent pentru un shop de componente PC.\n"
        f"Utilizatorul caută: \"{message}\"\n"
        f"Categorii disponibile: {', '.join(category_slugs)}\n"
        f"Returnează DOAR un JSON valid, fără explicații, fără markdown:\n"
        f"{{\"category_slug\": \"...\", \"filters\": {{\"brand\": \"...\"}}}}\n"
        f"Omite filtrele de care nu ești sigur. Dacă nu identifici categoria, returnează {{}}."
    )
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(OLLAMA_URL, json={
                "model": MODEL,
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
