"""
Script to generate realistic SKUs for products missing them.
"""
import re
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Product

# Manual SKU map for specific products — brand abbreviation + model keywords
SKU_MAP = {
    # CPUs
    'AMD Ryzen 7 7700X':        'AMD-R7-7700X',
    'AMD Ryzen 5 7600X':        'AMD-R5-7600X',
    'AMD Ryzen 9 7950X':        'AMD-R9-7950X',
    'Intel Core i9-13900K':     'INT-I9-13900K',
    'Intel Core i7-13700K':     'INT-I7-13700K',
    'Intel Core i5-13600K':     'INT-I5-13600K',
    # GPUs
    'AMD Radeon RX 7600':       'AMD-RX7600',
    'AMD Radeon RX 7900 XTX':   'AMD-RX7900XTX',
    'NVIDIA GeForce RTX 4060':  'NVD-RTX4060',
    'NVIDIA GeForce RTX 4070':  'NVD-RTX4070',
    'NVIDIA GeForce RTX 4070 Ti': 'NVD-RTX4070TI',
    'NVIDIA GeForce RTX 4080':  'NVD-RTX4080',
    # Motherboards
    'ASUS ROG Maximus Z790 Hero':  'ASU-ROG-Z790HERO',
    'ASUS ROG Strix B650-A Gaming': 'ASU-ROG-B650A',
    'MSI MAG B650 Tomahawk':       'MSI-B650-TOMAHAWK',
    'MSI PRO Z790-A WiFi':         'MSI-Z790A-WIFI',
    'Gigabyte X670E Aorus Master':  'GIB-X670E-MASTER',
    # RAM
    'Corsair Dominator 64GB DDR5':  'COR-DOM64-DDR5',
    'Corsair Vengeance 16GB DDR5':  'COR-VEN16-DDR5',
    'Corsair Vengeance 32GB DDR5':  'COR-VEN32-DDR5',
    'G.Skill Trident Z5 32GB DDR5': 'GSK-TRZ5-32DDR5',
    'Kingston Fury Beast 16GB DDR4': 'KIN-FURY16-DDR4',
    # Storage
    'Kingston NV2 500GB':           'KIN-NV2-500',
    'Seagate Barracuda 2TB HDD':    'SEA-BARRA-2TB',
    'WD Black SN850X 1TB':          'WD-SN850X-1TB',
    'Samsung 990 Pro 2TB':          'SAM-990PRO-2TB',
    'Samsung 970 EVO Plus 1TB':     'SAM-970EVO-1TB',
    # PSUs
    'Seasonic Focus GX 750W':       'SEA-FGXK-750W',
    'EVGA SuperNOVA 650W':          'EVG-SUPNOVA-650W',
    'Corsair RM1000x 1000W':        'COR-RM1000X',
    'be quiet! Straight Power 850W': 'BEQ-SP850W',
    'Corsair RM750x 750W':          'COR-RM750X',
    # Coolers
    'be quiet! Dark Rock Pro 4':    'BEQ-DRP4',
    'Corsair iCUE H150i Elite 360mm': 'COR-H150I-360',
    'DeepCool AK620':               'DPC-AK620',
    'NZXT Kraken X63 280mm':        'NZX-X63-280',
    'Arctic Freezer 34 eSports':    'ARC-FRZ34-ESP',
    'Noctua NH-D15':                'NOC-NHD15',
    # Cases
    'be quiet! Pure Base 500DX':    'BEQ-PB500DX',
    'Corsair 4000D Airflow':        'COR-4000D-AF',
    'Lian Li PC-O11 Dynamic':       'LLI-O11DYN',
    'Fractal Design Meshify C':     'FRC-MESHC',
    'NZXT H510 Flow':               'NZX-H510F',
    'Corsair 2000D mATX':           'COR-2000D-MATX',
    # Monitors
    'ASUS ROG Swift PG279QM 27"':   'ASU-PG279QM',
    'BenQ MOBIUZ EX2710Q 27"':      'BNQ-EX2710Q',
    'LG 27GP850-B 27" 165Hz':       'LG-27GP850B',
    'Samsung Odyssey G7 32"':       'SAM-ODYG7-32',
    # Peripherals
    'Logitech G Pro X Superlight 2': 'LOG-GPROX-SL2',
    'Razer DeathAdder V3 HyperSpeed': 'RAZ-DAV3-HS',
    'SteelSeries Apex Pro TKL':     'STL-APXPRO-TKL',
    'HyperX Cloud III Wireless':    'HPX-CLD3-WL',
    'Keychron Q1 Pro Wireless':     'KEY-Q1PRO-WL',
}


def generate_sku_fallback(name: str, brand: str) -> str:
    """Fallback SKU generator for any products not in the manual map."""
    # Brand prefix: first 3 uppercase letters
    brand_clean = re.sub(r'[^A-Za-z0-9]', '', brand or 'UNK')
    brand_prefix = brand_clean[:3].upper()

    # Extract key parts from name (digits, model codes)
    # Remove brand from name first
    name_clean = name
    if brand and name.startswith(brand):
        name_clean = name[len(brand):].strip()

    # Extract alphanumeric tokens
    tokens = re.findall(r'[A-Za-z0-9]+', name_clean)
    # Take meaningful tokens (skip very short ones like 'a', 'of')
    key_tokens = [t for t in tokens if len(t) > 1][:3]
    model_part = '-'.join(t.upper() for t in key_tokens)

    return f'{brand_prefix}-{model_part}'[:32]  # max 32 chars


def main():
    db = SessionLocal()
    try:
        products = db.query(Product).filter(
            (Product.sku == None) | (Product.sku == '')
        ).all()

        print(f'Products missing SKU: {len(products)}\n')

        updated = 0
        for p in products:
            if p.name in SKU_MAP:
                sku = SKU_MAP[p.name]
            else:
                sku = generate_sku_fallback(p.name, p.brand)
                print(f'  [FALLBACK] {p.name} -> {sku}')

            p.sku = sku
            updated += 1
            print(f'  OK {p.name} -> {sku}')

        db.commit()
        print(f'\n{updated} products updated with SKUs.')

    except Exception as e:
        db.rollback()
        print(f'ERROR: {e}')
        raise
    finally:
        db.close()


if __name__ == '__main__':
    main()
