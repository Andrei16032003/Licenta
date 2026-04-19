"""
Generează un model Ollama custom 'pcshop-assistant' antrenat pe catalogul din DB.

Rulează:
    python train_ollama.py

Ce face:
  1. Citește toate categoriile + filtrele + valorile EXACTE din DB
  2. Generează exemple few-shot automat din date reale
  3. Scrie un Modelfile cu system prompt complet
  4. Creează modelul în Ollama (ollama create pcshop-assistant)

Rerulează oricând adaugi produse noi sau specs noi.
"""

import subprocess, json, sys, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.product import Product, Category
from app.routers.chat import get_products_by_slug, SKIP_FILTER_KEYS

MODELFILE_PATH = "pcshop_modelfile.txt"
MODEL_NAME     = "pcshop-assistant"
BASE_MODEL     = "qwen2.5:7b"


# ── 1. Citire catalog din DB ─────────────────────────────────

def build_catalog(db) -> dict:
    """
    Returnează {slug: {name, filters: {key: [val1, val2, ...]}}}
    pentru toate categoriile cu produse în stoc.
    """
    catalog = {}
    for cat in db.query(Category).order_by(Category.sort_order).all():
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
                if isinstance(v, (str, int, float, bool)):
                    spec_vals.setdefault(k, set()).add(str(v))

        for k, vals in spec_vals.items():
            sv = sorted(vals)
            if len(sv) >= 2:
                filters[k] = sv

        if filters:
            catalog[cat.slug] = {"name": cat.name, "filters": filters}

    return catalog


# ── 2. Generare exemple few-shot din date reale ──────────────

# Alias-uri fără diacritice și forme singulare comune
SLUG_ALIASES = {
    "cpu":         ["procesor", "procesoare", "cpu", "i5", "i7", "i9", "ryzen 5", "ryzen 7", "ryzen 9"],
    "gpu":         ["placa video", "placi video", "gpu", "rtx", "gtx", "radeon", "geforce", "grafica"],
    "ram":         ["ram", "memorie ram", "memorii ram", "ddr4", "ddr5", "memorie"],
    "motherboard": ["placa de baza", "placi de baza", "motherboard", "mainboard"],
    "storage":     ["ssd", "hdd", "stocare", "nvme", "hard disk", "m.2"],
    "psu":         ["sursa", "surse", "psu", "alimentare"],
    "case":        ["carcasa", "carcase", "tower", "cabinet pc"],
    "cooler":      ["cooler", "coolere", "racire", "ventilator", "aio"],
    "monitor":     ["monitor", "monitoare", "ecran", "display", "144hz", "4k"],
    "keyboard":    ["tastatura", "tastaturi", "keyboard", "mecanica", "membrana"],
    "mouse":       ["mouse", "gaming mouse"],
    "headset":     ["casti", "headset", "headphones", "casca"],
}


QUERY_TEMPLATES_BRAND = [
    "vreau {cat} de la {brand}",
    "caut {cat} {brand}",
    "{brand} {cat}",
    "recomanda-mi {cat} {brand}",
    "cel mai bun {cat} {brand}",
    "{cat} {brand} bun",
    "vreau sa cumpar {cat} {brand}",
    "arata-mi {cat} {brand}",
]

QUERY_TEMPLATES_SPEC = [
    "caut {cat} cu {key} {val}",
    "vreau {cat} {key} {val}",
    "{cat} {val}",
    "recomanda {cat} cu {key} {val}",
    "cel mai bun {cat} cu {key} {val}",
    "{cat} de {key} {val}",
]

QUERY_TEMPLATES_MULTI = [
    "vreau {cat} {brand} cu {key} {val}",
    "caut {cat} {brand} {key} {val}",
    "recomanda {cat} {brand} {val}",
    "{brand} {cat} {val}",
]

QUERY_TEMPLATES_EMPTY = [
    "ce {cat} aveti in stoc?",
    "arata-mi {cat}",
    "vreau {cat}",
    "caut {cat}",
    "recomanda-mi un {cat}",
    "cele mai bune {cat}",
    "ce {cat} recomandati?",
]


def build_few_shots(catalog: dict) -> list[dict]:
    examples = []

    for slug, data in catalog.items():
        name    = data["name"].lower()
        filters = data["filters"]
        brands  = filters.get("brand", [])
        specs   = [(k, v) for k, v in filters.items() if k != "brand"]

        # Exemple cu brand
        for brand in brands[:3]:
            for tpl in QUERY_TEMPLATES_BRAND:
                examples.append({
                    "q": tpl.format(cat=name, brand=brand),
                    "a": {"category_slug": slug, "filters": {"brand": brand}},
                })

        # Exemple cu spec
        for key, vals in specs[:4]:
            key_r = key.replace("_", " ")
            for val in vals[:3]:
                for tpl in QUERY_TEMPLATES_SPEC:
                    examples.append({
                        "q": tpl.format(cat=name, key=key_r, val=val),
                        "a": {"category_slug": slug, "filters": {key: val}},
                    })

        # Exemple cu brand + spec combinate
        if brands and specs:
            brand = brands[0]
            key, vals = specs[0]
            key_r = key.replace("_", " ")
            for val in vals[:2]:
                for tpl in QUERY_TEMPLATES_MULTI:
                    examples.append({
                        "q": tpl.format(cat=name, brand=brand, key=key_r, val=val),
                        "a": {"category_slug": slug, "filters": {"brand": brand, key: val}},
                    })

        # Exemple fără filtru
        for tpl in QUERY_TEMPLATES_EMPTY:
            examples.append({
                "q": tpl.format(cat=name),
                "a": {"category_slug": slug, "filters": {}},
            })

        # Alias-uri
        for alias in SLUG_ALIASES.get(slug, []):
            examples.append({"q": f"vreau {alias}", "a": {"category_slug": slug, "filters": {}}})
            examples.append({"q": f"arata-mi {alias}", "a": {"category_slug": slug, "filters": {}}})
            examples.append({"q": f"recomanda {alias}", "a": {"category_slug": slug, "filters": {}}})
            examples.append({"q": alias, "a": {"category_slug": slug, "filters": {}}})
            # Alias cu brand dacă există
            for brand in brands[:2]:
                examples.append({"q": f"{alias} {brand}", "a": {"category_slug": slug, "filters": {"brand": brand}}})

    # Exemple negative
    for q in ["buna ziua", "cat costa livrarea?", "multumesc", "ajutor",
              "care e cel mai bun produs?", "vreau sa comand", "alo"]:
        examples.append({"q": q, "a": {}})

    return examples


# ── 3. Generare Modelfile ────────────────────────────────────

def build_modelfile(catalog: dict, examples: list[dict]) -> str:
    # Bloc catalog
    catalog_lines = []
    for slug, data in catalog.items():
        filters_json = json.dumps(data["filters"], ensure_ascii=False)
        catalog_lines.append(f"  {slug} | {data['name']} | {filters_json}")
    catalog_block = "\n".join(catalog_lines)

    # Bloc few-shot (max 40 exemple pentru a nu depăși contextul)
    import random
    random.shuffle(examples)
    shot_lines = []
    for ex in examples[:40]:
        shot_lines.append(
            f'Query: "{ex["q"]}" → {json.dumps(ex["a"], ensure_ascii=False)}'
        )
    shots_block = "\n".join(shot_lines)

    system_prompt = f"""Ești un asistent JSON pentru PCShop România, un magazin de componente PC și periferice.
Primești o cerere în română și returnezi EXCLUSIV un obiect JSON — niciun alt text.

━━ CATALOG COMPLET ━━
Format: slug | Nume categorie | {{cheie: [valori_exacte]}}
{catalog_block}

━━ EXEMPLE (query → JSON) ━━
{shots_block}

━━ REGULI STRICTE ━━
1. Răspunde DOAR cu JSON. Niciun cuvânt în plus.
2. category_slug trebuie să fie exact din CATALOG.
3. Cheile și valorile din filters trebuie să fie EXACT ca în CATALOG.
4. Dacă nu ești sigur de un filtru, NU îl include.
5. Dacă nu identifici categoria, returnează {{}}.
Format obligatoriu: {{"category_slug": "...", "filters": {{"cheie": "valoare"}}}}"""

    return f"""FROM {BASE_MODEL}

PARAMETER temperature 0
PARAMETER top_p 0.05
PARAMETER repeat_penalty 1.2
PARAMETER num_predict 150

SYSTEM \"\"\"{system_prompt}\"\"\"
"""


# ── 4. Main ──────────────────────────────────────────────────

def main():
    print(f"{'='*55}")
    print(f"  PCShop Ollama Trainer -> {MODEL_NAME}")
    print(f"{'='*55}\n")

    print("▶ Conectare la baza de date...")
    db = SessionLocal()
    try:
        print("▶ Citire catalog din DB...")
        catalog = build_catalog(db)
        if not catalog:
            print("✗ Nicio categorie găsită în DB. Verifică conexiunea.")
            return

        total_filters = sum(len(d["filters"]) for d in catalog.values())
        total_values  = sum(
            sum(len(v) for v in d["filters"].values())
            for d in catalog.values()
        )
        print(f"  {len(catalog)} categorii  |  {total_filters} chei de filtre  |  {total_values} valori unice\n")

        print("▶ Generare exemple few-shot din date reale...")
        examples = build_few_shots(catalog)
        print(f"  {len(examples)} exemple generate\n")

        print("▶ Generare Modelfile...")
        content = build_modelfile(catalog, examples)
        with open(MODELFILE_PATH, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  Salvat → {MODELFILE_PATH}\n")

        print(f"▶ Creare model Ollama '{MODEL_NAME}'...")
        print("  (poate dura 30-60 sec)\n")
        import shutil
        ollama_bin = shutil.which("ollama") or r"C:\Users\ULTRAPCBUILDS.RO\AppData\Local\Programs\Ollama\ollama.exe"
        result = subprocess.run(
            [ollama_bin, "create", MODEL_NAME, "-f", MODELFILE_PATH],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            print(f"✓ Model '{MODEL_NAME}' creat cu succes!\n")
            print("  Acum backend-ul va folosi automat acest model pentru căutare.\n")
            # Afișează câteva categorii ca preview
            print("  Preview catalog:\n")
            for slug, data in list(catalog.items())[:5]:
                keys = list(data["filters"].keys())
                print(f"    {slug}: {', '.join(keys)}")
            if len(catalog) > 5:
                print(f"    ... și încă {len(catalog)-5} categorii")
        else:
            print(f"✗ Eroare la crearea modelului:\n{result.stderr}")
            print("\n  Asigură-te că Ollama rulează: ollama serve")

    finally:
        db.close()

    print(f"\n{'='*55}")
    print("  Rerulează oricând adaugi produse/specs noi în DB.")
    print(f"{'='*55}")


if __name__ == "__main__":
    main()
