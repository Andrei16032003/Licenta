"""
Populare realistă bază de date PCShop
Creează: clienți, adrese, comenzi cu items, retururi, service requests
"""
import random
import uuid
import bcrypt
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy import text

from app.database import SessionLocal
from app.models.user import User
from app.models.user_profile import UserAddress, Review
from app.models.product import Product, Category
from app.models.order import Order, OrderItem
from app.models.retur import Retur
from app.models.service import ServiceRequest
from app.models.contact import ContactMessage

random.seed(2024)
db = SessionLocal()

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def rand_date(days_ago_max: int, days_ago_min: int = 0) -> datetime:
    delta = random.randint(days_ago_min, days_ago_max)
    hours = random.randint(7, 22)
    mins  = random.randint(0, 59)
    d = datetime.now(timezone.utc) - timedelta(days=delta, hours=hours, minutes=mins)
    return d

# ─── 1. CLIENȚI NOI ──────────────────────────────────────────────
CLIENT_DATA = [
    ("Alexandru Popescu",   "alex.popescu@gmail.com",    "0721 345 678", "Cluj-Napoca",   "Cluj"),
    ("Maria Ionescu",       "maria.ionescu@yahoo.com",   "0741 234 567", "București",     "Ilfov"),
    ("Andrei Constantin",   "andrei.const@gmail.com",    "0761 987 654", "Timișoara",     "Timiș"),
    ("Elena Gheorghe",      "elena.gh@outlook.com",      "0731 456 789", "Iași",          "Iași"),
    ("Mihai Dumitrescu",    "mihai.dum@gmail.com",       "0751 123 456", "Brașov",        "Brașov"),
    ("Ioana Stanescu",      "ioana.st@gmail.com",        "0722 654 321", "Constanța",     "Constanța"),
    ("Bogdan Munteanu",     "bogdan.mnt@yahoo.com",      "0742 111 222", "Craiova",       "Dolj"),
    ("Cristina Popa",       "cristina.popa@gmail.com",   "0762 333 444", "Galați",        "Galați"),
    ("Radu Georgescu",      "radu.geo@gmail.com",        "0732 555 666", "Ploiești",      "Prahova"),
    ("Ana Stoica",          "ana.stoica@outlook.com",    "0752 777 888", "Oradea",        "Bihor"),
    ("Vlad Niculescu",      "vlad.nic@gmail.com",        "0723 999 000", "Sibiu",         "Sibiu"),
    ("Laura Badea",         "laura.badea@yahoo.com",     "0743 211 311", "Pitești",       "Argeș"),
    ("Costin Andreescu",    "costin.and@gmail.com",      "0763 422 533", "Bacău",         "Bacău"),
    ("Roxana Florescu",     "roxana.fl@gmail.com",       "0733 644 755", "Arad",          "Arad"),
    ("Daniel Petrescu",     "daniel.pet@outlook.com",    "0753 866 977", "Târgu Mureș",   "Mureș"),
]

STREETS = [
    "Str. Mihai Eminescu nr. 14, ap. 3",
    "Bd. Unirii nr. 52, bl. A2, sc. 1, ap. 18",
    "Str. Avram Iancu nr. 7",
    "Calea Victoriei nr. 120, ap. 5",
    "Aleea Rozelor nr. 3, bl. B1, ap. 22",
    "Str. Libertății nr. 88",
    "Bd. Decebal nr. 41, ap. 10",
    "Str. Florilor nr. 5, bl. C3, ap. 7",
    "Calea Dorobanților nr. 33",
    "Str. Republicii nr. 17, ap. 2",
    "Bd. Ștefan cel Mare nr. 64",
    "Str. Gării nr. 9, bl. D4, ap. 15",
    "Aleea Trandafirilor nr. 2",
    "Str. Independenței nr. 44",
    "Bd. Carol I nr. 28, ap. 8",
]

print(">> Creare clienți...")
new_clients = []
for i, (name, email, phone, city, county) in enumerate(CLIENT_DATA):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        new_clients.append(existing)
        continue
    u = User(
        id=uuid.uuid4(),
        name=name,
        email=email,
        password_hash=hash_pw("Parola123!"),
        role="client",
        phone=phone,
        is_active=True,
        is_verified=True,
        created_at=rand_date(180, 90),
    )
    db.add(u)
    db.flush()

    addr = UserAddress(
        id=uuid.uuid4(),
        user_id=u.id,
        label="Acasă",
        full_name=name,
        phone=phone,
        country="România",
        county=county,
        city=city,
        street=STREETS[i],
        postal_code=str(random.randint(100000, 999999)),
        is_default=True,
    )
    db.add(addr)
    new_clients.append(u)

db.flush()
print(f"  OK {len(new_clients)} clienți pregătiți")

# ─── 2. PRODUSE ───────────────────────────────────────────────────
all_products = db.query(Product).all()
cats = db.query(Category).all()
cat_map = {c.id: c.name for c in cats}

# Grupăm produsele pe categorie
by_cat = {}
for p in all_products:
    cname = cat_map.get(p.category_id, "Altele")
    by_cat.setdefault(cname, []).append(p)

# Produse populare (mai scumpe = mai puțin cumpărate, entry-level = mai mult)
def pick_products_for_order():
    """Returnează 1-3 produse realiste pentru o comandă"""
    items = []
    # Mereu un produs principal din categoriile cheie
    core_cats = ["Procesoare", "Placi video", "Memorii RAM", "Stocare SSD/HDD", "Monitoare"]
    main_cat = random.choice([c for c in core_cats if by_cat.get(c)])
    main_pool = by_cat[main_cat]
    main_prod = random.choice(main_pool)
    items.append((main_prod, random.randint(1, 2)))

    # 40% șansă de produs extra (accesoriu)
    if random.random() < 0.4:
        extra_cats = ["Mouse", "Tastaturi", "Casti", "Coolere", "Surse de alimentare", "Carcase"]
        extra_cat = random.choice([c for c in extra_cats if by_cat.get(c)])
        extra_prod = random.choice(by_cat[extra_cat])
        if extra_prod.id != main_prod.id:
            items.append((extra_prod, 1))

    # 15% șansă de al 3-lea produs
    if random.random() < 0.15:
        bonus_cat = random.choice([c for c in by_cat if by_cat[c]])
        bonus_prod = random.choice(by_cat[bonus_cat])
        existing_ids = {p.id for p, _ in items}
        if bonus_prod.id not in existing_ids:
            items.append((bonus_prod, 1))

    return items

# ─── 3. COMENZI ───────────────────────────────────────────────────
# Distribuție realistă status: bazat pe vechime
# Comenzi mai vechi = mai probabil delivered
# Comenzi recente = pending/processing/shipped

all_clients = new_clients + db.query(User).filter(User.role == 'client').all()
all_clients = list({str(c.id): c for c in all_clients}.values())  # dedup

STATUS_WEIGHTS_OLD  = ['delivered'] * 7 + ['cancelled'] * 2 + ['shipped'] * 1  # >30 zile
STATUS_WEIGHTS_MID  = ['delivered'] * 4 + ['shipped'] * 3 + ['processing'] * 2 + ['cancelled'] * 1
STATUS_WEIGHTS_NEW  = ['pending'] * 3 + ['confirmed'] * 2 + ['processing'] * 3 + ['shipped'] * 2
PAYMENT_METHODS     = ['cod'] * 5 + ['card'] * 3 + ['transfer'] * 2

print(">> Creare comenzi...")
created_orders = []
ORDER_COUNT = 150

addr_cache = {}

def get_addr(user_id):
    if user_id not in addr_cache:
        a = db.query(UserAddress).filter(UserAddress.user_id == user_id).first()
        addr_cache[user_id] = a
    return addr_cache[user_id]

invoice_counter = db.execute(text("SELECT COUNT(*) FROM orders")).scalar() + 1

for i in range(ORDER_COUNT):
    client = random.choice(all_clients)
    order_date_days_ago = random.randint(0, 90)

    # Status în funcție de vechime
    if order_date_days_ago > 30:
        status = random.choice(STATUS_WEIGHTS_OLD)
    elif order_date_days_ago > 7:
        status = random.choice(STATUS_WEIGHTS_MID)
    else:
        status = random.choice(STATUS_WEIGHTS_NEW)

    payment = random.choice(PAYMENT_METHODS)
    order_date = rand_date(order_date_days_ago + 1, order_date_days_ago)

    # Adresă client
    addr = get_addr(client.id)
    if not addr:
        # Creăm adresă on the fly
        addr = UserAddress(
            id=uuid.uuid4(),
            user_id=client.id,
            label="Acasă",
            full_name=client.name,
            phone=client.phone or "0700000000",
            country="România",
            county="București",
            city="București",
            street="Str. Exemplu nr. 1",
            postal_code="010000",
            is_default=True,
        )
        db.add(addr)
        db.flush()
        addr_cache[client.id] = addr

    # Produse pentru comandă
    order_items_data = pick_products_for_order()

    subtotal = Decimal("0")
    for prod, qty in order_items_data:
        subtotal += Decimal(str(prod.price)) * qty

    shipping_cost = Decimal("0") if subtotal >= 500 else Decimal("25.00")
    cod_fee       = Decimal("9.90") if payment == "cod" else Decimal("0")
    discount      = Decimal("0")

    # Ocazional voucher discount
    if random.random() < 0.15:
        discount = round(subtotal * Decimal(str(random.choice([0.05, 0.10, 0.15]))), 2)

    total = subtotal + shipping_cost + cod_fee - discount

    invoice_num = f"AC{str(invoice_counter).zfill(6)}"
    invoice_counter += 1

    tracking = None
    if status in ('shipped', 'delivered'):
        tracking = f"1Z{random.randint(100000000, 999999999)}"

    payment_status = "paid" if status == "delivered" or payment == "card" else "unpaid"

    order = Order(
        id=uuid.uuid4(),
        user_id=client.id,
        subtotal=subtotal,
        discount_amount=discount,
        shipping_cost=shipping_cost,
        total_price=total,
        cod_fee=cod_fee,
        payment_method_type=payment,
        payment_status=payment_status,
        status=status,
        invoice_number=invoice_num,
        tracking_number=tracking,
        created_at=order_date,
        updated_at=order_date,
        shipping_snapshot={
            "full_name":   addr.full_name,
            "phone":       addr.phone or "0700000000",
            "county":      addr.county,
            "city":        addr.city,
            "street":      addr.street,
            "postal_code": addr.postal_code or "",
            "country":     "România",
        }
    )
    db.add(order)
    db.flush()

    for prod, qty in order_items_data:
        item = OrderItem(
            id=uuid.uuid4(),
            order_id=order.id,
            product_id=prod.id,
            quantity=qty,
            unit_price=prod.price,
            product_snapshot={
                "name":     prod.name,
                "brand":    prod.brand or "",
                "sku":      prod.sku or "",
                "category": cat_map.get(prod.category_id, "Altele"),
                "price":    str(prod.price),
            }
        )
        db.add(item)

    created_orders.append(order)

db.flush()
print(f"  OK {len(created_orders)} comenzi create")

# ─── 4. RETURURI ─────────────────────────────────────────────────
delivered_orders = [o for o in created_orders if o.status == 'delivered']
retur_orders = random.sample(delivered_orders, min(20, len(delivered_orders)))

MOTIVE = [
    "Produs defect",
    "Nu corespunde descrierii",
    "Comandat din greșeală",
    "Produs incompatibil",
    "Calitate sub așteptări",
    "Primit altceva decât am comandat",
]
STARI = ["functional", "functional", "functional", "nefunctional", "sigilat"]
RETUR_STATUS = ["in_asteptare"] * 6 + ["aprobat"] * 3 + ["respins"] * 2 + ["finalizat"] * 3
PRIORITIES   = ["normal"] * 7 + ["ridicat"] * 2 + ["urgent"] * 1

print(">> Creare retururi...")
for o in retur_orders:
    # Luăm primul item din comandă ca produs returnat
    item = db.query(OrderItem).filter(OrderItem.order_id == o.id).first()
    if not item:
        continue
    prod_name = item.product_snapshot.get("name", "Produs") if item.product_snapshot else "Produs"
    retur_date = o.created_at + timedelta(days=random.randint(1, 14))

    r = Retur(
        id=uuid.uuid4(),
        user_id=o.user_id,
        order_id=o.id,
        product_id=item.product_id,
        product_name=prod_name,
        motiv=random.choice(MOTIVE),
        motiv_detalii=random.choice([
            "Produsul nu funcționează conform specificațiilor.",
            "Ambalajul a fost deteriorat la livrare.",
            "Nu este compatibil cu sistemul meu.",
            "Am primit modelul greșit.",
            "Produsul prezintă defect fizic vizibil.",
            None,
        ]),
        stare_produs=random.choice(STARI),
        pickup_address={
            "full_name":   o.shipping_snapshot.get("full_name", ""),
            "phone":       o.shipping_snapshot.get("phone", ""),
            "county":      o.shipping_snapshot.get("county", ""),
            "city":        o.shipping_snapshot.get("city", ""),
            "street":      o.shipping_snapshot.get("street", ""),
            "postal_code": o.shipping_snapshot.get("postal_code", ""),
        },
        refund_method=random.choice(["card", "card", "iban"]),
        iban=None,
        status=random.choice(RETUR_STATUS),
        priority=random.choice(PRIORITIES),
        created_at=retur_date,
        updated_at=retur_date,
    )
    db.add(r)

db.flush()
print(f"  OK {len(retur_orders)} retururi create")

# ─── 5. SERVICE REQUESTS ─────────────────────────────────────────
SVC_STATUS    = ["in_asteptare"] * 4 + ["in_diagnosticare"] * 2 + ["in_service"] * 2 + ["rezolvat"] * 4 + ["va_veni_curierul"] * 1 + ["respins"] * 1
SVC_DEFECTS   = [
    "Produsul nu pornește deloc",
    "Zgomot anormal în funcționare",
    "Temperaturi foarte ridicate sub sarcină",
    "Ecran cu artefacte grafice",
    "Nu este recunoscut de sistem",
    "Reporniri spontane frecvente",
    "Conectori deteriorați fizic",
    "Nu ține viteza specificată",
    "LED-urile nu funcționează",
    "Ventilator defect — nu se rotește",
    "Produsul funcționează intermitent",
    "Jacks audio nu funcționează",
]

svc_source_orders = random.sample(delivered_orders, min(18, len(delivered_orders)))
print(">> Creare cereri service...")

for o in svc_source_orders:
    item = db.query(OrderItem).filter(OrderItem.order_id == o.id).first()
    if not item:
        continue
    prod_name = item.product_snapshot.get("name", "Produs") if item.product_snapshot else "Produs"
    svc_date  = o.created_at + timedelta(days=random.randint(5, 45))
    svc_status = random.choice(SVC_STATUS)
    nr_ticket  = f"SVC-{random.randint(1000, 9999)}"

    # Verificăm să nu existe deja un ticket cu același nr
    from app.models.service import ServiceRequest
    svc = ServiceRequest(
        id=uuid.uuid4(),
        user_id=o.user_id,
        order_id=o.id,
        product_id=item.product_id,
        product_name=prod_name,
        nr_ticket=nr_ticket,
        descriere=random.choice(SVC_DEFECTS),
        contact_telefon=o.shipping_snapshot.get("phone", "0700000000"),
        contact_email=None,
        status=svc_status,
        priority=random.choice(PRIORITIES),
        pickup_address={
            "full_name":   o.shipping_snapshot.get("full_name", ""),
            "phone":       o.shipping_snapshot.get("phone", ""),
            "county":      o.shipping_snapshot.get("county", ""),
            "city":        o.shipping_snapshot.get("city", ""),
            "street":      o.shipping_snapshot.get("street", ""),
        },
        created_at=svc_date,
        updated_at=svc_date,
    )
    db.add(svc)

db.flush()
print(f"  OK {len(svc_source_orders)} cereri service create")

# ─── 6. CONTACT MESSAGES ─────────────────────────────────────────
SUBJECTS  = ["Întrebare despre comandă", "Problemă la livrare", "Garanție produs", "Informații produs", "Altele"]
MSG_TEXTS = [
    "Bună ziua, aș dori să aflu statusul comenzii mele. Nu am primit nicio actualizare în ultimele 3 zile.",
    "Salut, am primit un produs deteriorat. Vă rog să mă contactați urgent pentru a rezolva situația.",
    "Bună ziua! Pot să returnez un produs cumpărat acum 10 zile dacă nu mă mai mulțumește?",
    "Aveți în stoc o anumită sursă de alimentare? Cea din site apare cu stoc 0.",
    "Vreau să știu dacă procesorul pe care l-am comandat este compatibil cu placa mea de bază.",
    "Nu am primit factura pentru comanda mea. Vă rog să mi-o trimiteți pe email.",
    "Când va fi disponibil din nou produsul X? Am nevoie urgentă pentru un proiect.",
    "Bună ziua, am văzut că există o reducere pentru comenzile peste 500 RON. Se aplică și pentru comenzile vechi?",
    "Salut! Transportatorul a lăsat coletul la vecini fără să mă anunțe. Este normal?",
    "Am o întrebare despre garanția produsului. Cât durează și ce acoperă exact?",
    "Vreau să plasez o comandă cu livrare urgentă. Este posibil?",
    "Sunt nemulțumit de serviciul de curierat ales. Puteți schimba la o comandă viitoare?",
]

print(">> Creare mesaje contact...")
contact_clients = random.sample(all_clients, min(12, len(all_clients)))
for i, client in enumerate(contact_clients):
    msg_date = rand_date(60, 0)
    is_resolved = random.random() < 0.6
    cm = ContactMessage(
        id=uuid.uuid4(),
        name=client.name,
        email=client.email,
        subject=random.choice(SUBJECTS),
        message=random.choice(MSG_TEXTS),
        is_resolved=is_resolved,
        created_at=msg_date,
    )
    db.add(cm)

db.flush()
print(f"  OK {len(contact_clients)} mesaje contact create")

# ─── COMMIT ───────────────────────────────────────────────────────
db.commit()
print("\n[OK] Seed complet!")
print(f"   Clienți: {len(new_clients)}")
print(f"   Comenzi noi: {len(created_orders)}")
print(f"   Retururi noi: {len(retur_orders)}")
print(f"   Service requests: {len(svc_source_orders)}")
print(f"   Mesaje contact: {len(contact_clients)}")
db.close()
