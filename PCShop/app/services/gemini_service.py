import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GOOGLE_API_KEY"),
    http_options={"api_version": "v1beta"},
)

EMBED_MODEL = "models/gemini-embedding-001"
CHAT_MODEL  = "models/gemini-2.5-flash"


async def embed_text(text: str) -> list[float] | None:
    try:
        result = client.models.embed_content(model=EMBED_MODEL, contents=text)
        return result.embeddings[0].values
    except Exception as e:
        print(f"    embed error: {e}")
        return None


async def embed_query(text: str) -> list[float] | None:
    return await embed_text(text)


async def generate_search_message(query: str, category_name: str | None, product_names: list[str]) -> str:
    n = len(product_names)
    sample = ", ".join(product_names[:3])
    prompt = (
        f"Ești asistentul unui shop de componente PC. Utilizatorul a căutat: \"{query}\".\n"
        f"{'Categoria detectată: ' + category_name + '.' if category_name else 'Nu s-a detectat o categorie specifică.'}\n"
        f"{'Au fost găsite ' + str(n) + ' produse. Primele: ' + sample + '.' if n > 0 else 'Nu s-a găsit niciun produs.'}\n\n"
        f"Scrie un mesaj scurt (1-2 propoziții) în română care:\n"
        f"- Dacă căutarea conținea ceva inexistent sau greșit (ex: 'ddr7', 'rtx 9090'), menționează că nu există și ce ai găsit în schimb\n"
        f"- Dacă nu s-a găsit nimic, sugerează să încerce altceva sau să schimbe filtrele\n"
        f"- Dacă s-au găsit produse normale, fii scurt și util (ex: 'Iată cele mai relevante procesoare AMD:')\n"
        f"Răspunde DOAR cu mesajul, fără ghilimele."
    )
    try:
        response = client.models.generate_content(model=CHAT_MODEL, contents=prompt)
        return response.text.strip()
    except Exception as e:
        print(f"    generate_search_message error: {e}")
        if n > 0:
            return f"Am găsit {n} produse relevante pentru căutarea ta."
        return "Nu am găsit produse pentru această căutare. Încearcă să modifici filtrele."


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

    try:
        response = client.models.generate_content(model=CHAT_MODEL, contents=prompt)
        text_out = response.text.strip()
        start = text_out.find("{")
        end   = text_out.rfind("}") + 1
        if start == -1 or end == 0:
            return None
        result = json.loads(text_out[start:end])
        if slug_hint and "category_slug" not in result:
            result["category_slug"] = slug_hint
        return result
    except Exception as e:
        print(f"    extract error: {e}")
        return None
