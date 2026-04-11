"""
Seed review-uri pe baza clientilor si produselor REALE din DB.
- Sterge review-urile existente
- Minim 10 produse per categorie
- Minim 20 review-uri per produs
- Note variate (1-5), nu doar pozitive
- Foloseste numele reale ale clientilor

Rulare: python seed_reviews.py
"""
import random
import uuid as uuid_module
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.orm import Session
from app.database import engine
from app.models.product import Product, Category
from app.models.user_profile import Review
from app.models.user import User

# ── Templates per categorie ───────────────────────────────────────────────────
# Format: (titlu, comentariu, rating)

REVIEWS = {
    "procesoare": [
        ("Excelent pentru gaming", "L-am testat in toate jocurile AAA. Temperaturi optime, niciun bottleneck. Foarte multumit de achizitie.", 5),
        ("Performante ridicate la productivitate", "Editare video si randari 3D mult mai rapide fata de procesorul anterior. Diferenta e clara.", 5),
        ("Overclock stabil si simplu", "Am reusit sa duc frecventa cu 400MHz in plus. Stabil 24h in Prime95. Foarte bun.", 5),
        ("Raport pret-performanta excelent", "Nu e cel mai scump dar pentru banii astia e extraordinar. Recomand fara rezerve.", 4),
        ("Temperatura buna sub sarcina", "Cu un cooler decent nu depaseste 72 grade nici in scenarii extreme. Solid.", 4),
        ("Gaming la 144fps fara probleme", "In jocurile mele preferate am constant framerate ridicat. Niciun drop semnificativ.", 5),
        ("Multitasking imbunatatit substantial", "Browser cu 40 taburi, editare si antivirus activ in paralel fara incetiniri. Perfect.", 5),
        ("Upgrade justificat", "Procesorul a dat viata noua intregului sistem. Se simte diferenta in orice aplicatie.", 4),
        ("Cooler-ul din cutie e surprinzator de bun", "Nu am mai cumparat cooler separat. Temperaturile sunt mai mult decat acceptabile.", 4),
        ("Ma asteptam la mai mult la single-core", "Multi-thread e bun, dar in jocuri diferenta fata de generatia anterioara e modesta.", 3),
        ("Dezamagit de consumul de energie", "Consuma mai mult decat speram. Factura la curent a crescut vizibil.", 3),
        ("OK pentru pret, nu revolutionar", "Face treaba dar nu e o schimbare dramatica. Ma asteptam la ceva mai spectaculos.", 3),
        ("Compatibilitate problematica initial", "Am avut nevoie de update BIOS inainte de montaj. Procesul a durat, putea fi mai simplu.", 2),
        ("Temperatura ridicata sub OC agresiv", "La overclock maxim ajunge la 90 grade. Am nevoie de racire AIO, cooler stock nu ajunge.", 2),
        ("Nu merita pretul actual", "La pretul curent exista alternative mai bune pe piata. L-am luat in promotie, altfel nu.", 2),
    ],
    "placi-video": [
        ("FPS excelente la 1440p ultra", "Joc la 1440p cu setari ultra si am constant peste 100fps. Depaseste asteptarile.", 5),
        ("Ray tracing impresionant", "RT activat in mai multe titluri, fps stabil la setari medii-ridicate. Surprinzator de bun.", 5),
        ("Upgrade dramatic fata de generatia veche", "Am venit de pe o placa de acum 4 ani. Diferenta e uriasa, merita total.", 5),
        ("VRAM suficient pentru editare profesionala", "Folosesc Blender si DaVinci Resolve zilnic. Nicio problema, proiectele merg fluid.", 5),
        ("Gaming si streaming simultan", "Pot face stream la 1080p60 in timp ce joc la setari ridicate. Performanta dubla.", 5),
        ("Temperatura controlata excelent", "Sub load intens nu depaseste 72 grade. Cooler-ul triplu isi face treaba.", 4),
        ("Silentioasa la utilizare normala", "La browsing si activitati usoare ventilatoarele se opresc complet. Perfect.", 4),
        ("4K gaming accesibil", "Nu am crezut ca o sa pot juca la 4K la pretul asta. Performantele surprind.", 4),
        ("Buna, dar driverele aveau probleme initial", "La inceput crash-uri dese. Dupa 2 update-uri de driver totul s-a stabilizat.", 3),
        ("Consum de curent dezamagitor", "Consuma enorm. Sursa mea de 650W e la limita. Trebuie upgrade la sursa.", 3),
        ("Incalzire carcasa la utilizare intensa", "GPU-ul incalzeste toata carcasa. Am nevoie de mai multi ventilatoare.", 3),
        ("Nu atinge vitezele din specificatii", "In benchmark-uri sunt sub valorile promise de producator. Dezamagitor.", 2),
        ("Prea zgomotoasa la load", "Ventilatoarele devin deranjante la jocuri intense. Ma asteptam la mai multa discretie.", 2),
        ("Probleme de stabilitate in unele jocuri", "In doua titluri am driver crash constant. Problema nerezolvata inca.", 2),
        ("Pret prea mare pentru performante oferite", "La banii astia ma asteptam la mai mult. Concurenta ofera mai bine.", 2),
    ],
    "memorii-ram": [
        ("XMP stabil din prima incercare", "Am activat XMP din BIOS si a mers imediat la frecventa nominala. Fara probleme.", 5),
        ("Diferenta enorma la multitasking", "De la 8GB la 32GB. Browser, editare, gaming simultan fara nicio incetinire.", 5),
        ("Compatibil perfect cu platforma AMD", "Am verificat QVL-ul inainte de cumparare. Merge la viteza maxima din prima.", 5),
        ("Dual channel setup reusit", "2x16GB in sloturile corecte, recunoscut in dual channel imediat. Configurare simpla.", 5),
        ("Stabil la overclock manual", "Am dus-o la 3600MHz cu sub-timings ajustate. Stabil de 2 luni. Calitate buna.", 5),
        ("RGB frumos, sincronizare perfecta", "Se sincronizeaza cu placa de baza si restul componentelor RGB. Arata spectaculos.", 4),
        ("Latente bune pentru pret", "CL16 la 3200MHz e solid pentru gaming si productivitate. Satisfacut.", 4),
        ("Imbunatatire vizibila in jocuri", "FPS-urile au crescut dupa upgrade, mai ales in jocuri care folosesc mult RAM.", 4),
        ("Calitate constructie buna", "Heatspreader solid, finisaje bune. Se vede ca e produs de calitate.", 4),
        ("Frecventa maxima greu de atins", "La XMP merge la 3200 dar nu am reusit sa o stabilizez la 3600 manual.", 3),
        ("RGB software complicat", "Sincronizarea RGB necesita un software suplimentar care consuma resurse. Minor.", 3),
        ("Incalzire mai mare decat speram", "La utilizare intensa heatspreader-ul se incalzeste destul de mult.", 3),
        ("Nu atinge frecventa nominala pe toate placile", "Pe placa mea a trebuit sa cobor frecventa cu 200MHz pentru stabilitate.", 2),
        ("XMP instabil pe sistemul meu", "Am incercat pe 3 placi diferite, XMP da erori de memorie. Returnat.", 2),
        ("Calitate slaba a heatspreader-ului", "Dupa cateva luni heatspreader-ul s-a desprins partial. Dezamagitor.", 2),
    ],
    "stocare-ssd-hdd": [
        ("Boot time sub 10 secunde", "De la apasarea butonului la desktop gata de lucru: 8 secunde. Fantastic.", 5),
        ("Jocurile se incarca instant", "Loading screen-urile au disparut practic. Experienta complet transformata.", 5),
        ("NVMe schimba totul", "Am trecut de la HDD si nu ma mai intorc niciodata. Diferenta e dramatica.", 5),
        ("Transferuri rapide pentru editare video", "Lucrez cu fisiere 4K si transferurile nu mai sunt un bottleneck. Excelent.", 5),
        ("Silentios si rapid", "Niciun zgomot spre deosebire de HDD. Vitezele sunt conform specificatii.", 5),
        ("Capacitate mare la pret accesibil", "2TB e suficient pentru orice. Nu ma mai gandesc la spatiu de stocare.", 4),
        ("Temperatura sub control", "Fara heatsink temperatura ramane in limite normale. Nu am nevoie de heatsink extra.", 4),
        ("Durabil la utilizare intensiva", "Il am de un an, scris intens zilnic. Zero probleme. Calitate dovedita.", 4),
        ("Compatibil cu toate sistemele", "L-am mutat intre 3 calculatoare diferite, functioneaza perfect pe toate.", 4),
        ("Viteza scade dupa umplere partiala", "Dupa ce am umplut 80% vitezele de scriere au scazut vizibil. Normal dar dezamagitor.", 3),
        ("Garantia e scurta pentru pret", "La pretul asta ma asteptam la garantie de 5 ani, nu 3.", 3),
        ("Software de monitorizare lipseste", "Nu vine cu software de monitorizare a sanatatii. Trebuie aplicatie terta.", 3),
        ("Incalzire excesiva fara heatsink", "Fara heatsink ajunge la temperaturi ingrijoratoare in utilizare intensa.", 2),
        ("Viteze sub specificatii in benchmark", "In CrystalDiskMark obtin viteze cu 15% sub ce scrie pe cutie.", 2),
        ("Defect dupa 4 luni", "A inceput sa dea erori de scriere dupa 4 luni. A trebuit inlocuit in garantie.", 1),
    ],
    "placi-de-baza": [
        ("BIOS complet si intuitiv", "Am setat XMP, ventilatoarele, overclock CPU. Totul accesibil din BIOS.", 5),
        ("VRM excelent pentru overclocking", "Overclocking agresiv fara probleme de temperatura pe VRM. Placa solida.", 5),
        ("Conectivitate completa", "USB-C, WiFi 6, 2.5G LAN, Bluetooth 5.2. Tot ce aveam nevoie inclus.", 5),
        ("3 sloturi M.2 suficiente", "Pot instala 3 SSD-uri NVMe fara adaptoare. Configuratie ideala.", 5),
        ("Stabila dupa luni de utilizare", "6 luni de utilizare intensa fara niciun crash sau problema. Calitate top.", 5),
        ("PCIe 5.0 pregatit pentru viitor", "Am testat cu SSD PCIe 4.0 si obtin viteze maxime. Pregatita pentru urmatoarea generatie.", 4),
        ("Layout bine gandit", "Conectorii de alimentare, slotul GPU, butoanele de power - toate bine pozitionate.", 4),
        ("Update BIOS simplu", "Am actualizat BIOS-ul cu un stick USB inainte de a monta procesorul. Simplu.", 4),
        ("Audio onboard surprinzator de bun", "Nu am mai luat placa de sunet separata. Codec-ul onboard e decent.", 4),
        ("BIOS complex pentru incepatori", "Sunt prea multe optiuni pentru cineva la primul build. Dupa ce inveti e ok.", 3),
        ("WiFi mai slab decat speram", "WiFi 6 e prezent dar viteza wireless e sub asteptari in cladiri cu multi router.", 3),
        ("Pret ridicat fata de functionalitati", "Platesti mult pentru brand. Alternative mai ieftine ofera similar.", 3),
        ("Probleme cu RAM la XMP 3600+", "La frecvente mari de RAM am instabilitate. La 3200 merge ok.", 2),
        ("Un slot M.2 nu functioneaza", "Al treilea slot M.2 nu este recunoscut. Probleme hardware pe unitatea mea.", 2),
        ("VRM se incalzeste excesiv", "La overclocking prelungit VRM-ul atinge temperaturi ingrijoratoare.", 2),
    ],
    "surse-de-alimentare": [
        ("Complet silentioasa in utilizare normala", "Ventilatorul nu porneste la sarcini mici. PC-ul e silentios la browsing.", 5),
        ("Eficienta 80+ Gold confirmata", "Consum din priza exact conform calculelor pentru eficienta Gold. Economii reale.", 5),
        ("Cabluri modulare de calitate", "Cablurile sunt flexibile si suficient de lungi pentru orice carcasa.", 5),
        ("Tensiuni stabile sub load maxim", "Am testat cu toate componentele la maxim. Tensiunile nu au deviat deloc.", 5),
        ("Protectii hardware complete", "OVP, UVP, OCP, OPP, SCP prezente. Componentele sunt protejate complet.", 5),
        ("Semi-passive functional", "La sarcini mici ventilatorul e oprit. Silentios cand am nevoie.", 4),
        ("Face fata unui GPU de 300W", "GPU de 300W plus CPU overclocked, sursa nu are nicio problema. Stabila.", 4),
        ("Cabluri lungi, ajung in orice carcasa", "Nici in carcase full-tower nu am probleme cu lungimea cablurilor.", 4),
        ("Certificare de incredere", "Certificata 80+ Gold, marca cunoscuta. Stiu ca componentele sunt in siguranta.", 4),
        ("Zgomot la incepere si oprire", "La pornirea/oprirea PC-ului face un sunet usor. Nu e deranjant dar exista.", 3),
        ("Cablurile nu sunt sleeved", "La pretul asta ma asteptam la cabluri sleeved incluse. Minor estetic.", 3),
        ("Garantia de 5 ani e doar pe hartie", "Service-ul in garantie e lent si anevoios. Sper sa nu am nevoie.", 3),
        ("Fan zgomotos sub load mare", "La utilizare intensa ventilatorul devine audibil si usor deranjant.", 2),
        ("Tensiuni usor instabile la 100% load", "La sarcina maxima am observat mici deviatii de tensiune pe 12V.", 2),
        ("Defect in 6 luni", "A cedat dupa 6 luni de utilizare normala. Returnat in garantie.", 1),
    ],
    "carcase": [
        ("Airflow exceptional", "Temperaturile componentelor au scazut cu 8 grade fata de carcasa veche. Impresionant.", 5),
        ("Build simplu si placut", "Spatiu generos, management de cabluri bine gandit, suport pentru radiatoare mari.", 5),
        ("Geam de sticla calita superb", "Arata premium si poti admira componentele. Finisaje de calitate.", 5),
        ("Filtre magnetice pentru praf", "Toate deschiderile au filtre magnetice usor de scos si curatat. Practic.", 5),
        ("Capacitate excelenta", "Incap cooler 165mm, GPU 340mm, radiatoare in fata si sus. Totul fara probleme.", 5),
        ("RGB front panel spectaculos", "Ventilatoarele incluse cu RGB arata fantastic. Nu am mai cumparat altele.", 4),
        ("Insonorizare eficienta", "Panourile insonorizate reduc zgomotul semnificativ. PC-ul se aude mult mai putin.", 4),
        ("Montare logica a componentelor", "Ghidajele si sustinatorii de cablu sunt bine pozitionati. Build fara frustrari.", 4),
        ("Ventilatie buna fara ventilatoare extra", "Ventilatoarele incluse sunt suficiente pentru o configuratie normala.", 4),
        ("Vopseaua se zgarie la montaj", "La fixarea placii de baza am zgariat interior. Vopseaua e fragila.", 3),
        ("Greutate mare, transport dificil", "Dupa ce am montat tot, carcasa e extrem de grea. Greu de mutat.", 3),
        ("Prea mare pentru biroul meu", "Nu am estimat dimensiunile corect. E mult mai mare decat speram.", 3),
        ("Ventilatoarele incluse sunt zgomotoase", "Am inlocuit toate ventilatoarele incluse. Nu sunt la nivelul pretului.", 2),
        ("Plastic de calitate slaba la butoane", "Butoanele de power si reset au un feeling ieftin pentru pretul carcasei.", 2),
        ("Probleme de compatibilitate cu GPU lung", "GPU-ul meu de 330mm nu incape fara sa demontez cosuletul de HDD-uri.", 2),
    ],
    "tastaturi": [
        ("Switch-uri mecanice superioare", "Am trecut de la membrana si nu ma mai intorc. Senzatia e complet diferita.", 5),
        ("Build quality premium din aluminiu", "Cadru metalic solid, nu fleaca de plastic. Se simte calitatea la fiecare apasare.", 5),
        ("Wireless stabil si baterie excelenta", "Bateria tine 10 zile la utilizare normala. Wireless fara nicio intrerupere.", 5),
        ("Silentioasa pentru birou deschis", "Cu switch-uri liniare silentioase, colegii nu mai sunt deranjati. Perfect.", 5),
        ("RGB complet personalizabil", "Software intuitiv, am creat efecte custom in 15 minute. Arata spectaculos.", 5),
        ("Taste PBT de lunga durata", "Tastele PBT nu devin lucioase ca ABS. Investitie care dureaza ani.", 4),
        ("Conectivitate tripla practica", "Bluetooth, wireless 2.4GHz si USB. Trec intre PC si laptop instant.", 4),
        ("Latenta mica pentru gaming competitiv", "In jocuri competitive fiecare ms conteaza. Input lag practic inexistent.", 4),
        ("Compact TKL, mai mult spatiu pe birou", "Fara numpad am mai mult spatiu pentru mouse. Ergonomie imbunatatita.", 4),
        ("Software doar in engleza", "Tastatura e buna dar software-ul de personalizare nu are interface in romana.", 3),
        ("RGB se desincronizeaza uneori", "Dupa repornire RGB-ul trebuie resetat manual. Bug in firmware.", 3),
        ("Pretul e un pic ridicat", "Calitatea justifica pretul dar exista alternative mai ieftine cu functionalitati similare.", 3),
        ("Switch-urile se simt inconsistent", "Unele taste au un feeling usor diferit fata de altele. Poate fi lot defect.", 2),
        ("Bluetooth cu latenta mare", "In mod Bluetooth latenta e observabila la gaming. Folosesc doar USB.", 2),
        ("Bateria se descarca rapid", "Producatorul zice 10 zile, in realitate 4-5 zile la utilizare normala.", 2),
    ],
    "default": [
        ("Produs excelent, depaseste asteptarile", "Calitate superioara fata de ce speram. Livrare rapida, ambalaj solid.", 5),
        ("Foarte multumit de achizitie", "Functioneaza perfect dupa mai multe luni de utilizare. Nimic de reprosat.", 5),
        ("Raport calitate-pret exceptional", "Am ezitat mult dar merita fiecare leu. Nu regret deloc achizitia.", 5),
        ("Recomandat cu caldura", "Deja am recomandat produsul la 4 prieteni. Toti sunt multumiti.", 5),
        ("Calitate surprinzator de buna", "Ma asteptam la mai putin la pretul asta. M-am inselat placut.", 4),
        ("Solid si fiabil", "Il folosesc zilnic si functioneaza fara nicio problema. Calitate dovedita.", 4),
        ("Buna achizitie generala", "Face ce trebuie sa faca. Calitate buna, nimic spectaculos dar nicio problema.", 4),
        ("Satisfacut, il recomand", "Produsul arata exact ca in poze si performeaza conform specificatii.", 4),
        ("OK, putea fi mai bun", "Produsul e decent dar la pretul asta ma asteptam la ceva mai calitativ.", 3),
        ("Mediu, nimic special", "Nici bun nici rau. Face minimul necesar. Pretul e un pic prea mare.", 3),
        ("Dezamagitor fata de descriere", "Descrierea produsului e mai optimista decat realitatea. Calitate medie.", 3),
        ("Probleme dupa scurt timp", "Initial a functionat bine dar dupa 2 luni au aparut primele probleme.", 2),
        ("Nu corespunde descrierii", "Produsul primit nu corespunde pe deplin cu ce era scris. Dezamagit.", 2),
        ("Calitate slaba pentru pret", "La pretul cerut exista optiuni mult mai bune pe piata. Nu recomand.", 2),
        ("Defect, returnat", "A cedat dupa scurt timp de utilizare normala. Returnat in garantie.", 1),
    ],
}

def get_templates(cat_slug):
    slug = (cat_slug or "").lower()
    for key in REVIEWS:
        if key != "default" and key in slug:
            return REVIEWS[key]
    return REVIEWS["default"]

def random_date(days_back=270):
    return datetime.utcnow() - timedelta(
        days=random.randint(1, days_back),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )

def main():
    with Session(engine) as db:

        # ── 1. Sterge toate review-urile ──────────────────────────────
        deleted = db.query(Review).delete()
        db.commit()
        print(f"✓ Sterse {deleted} review-uri existente.\n")

        # ── 2. Ia toti clientii din DB ────────────────────────────────
        clients = db.query(User).filter(
            User.is_active == True,
            User.role == "client",
        ).all()

        if not clients:
            print("EROARE: Nu exista clienti in baza de date! Ruleaza mai intai seed_reviews.py pentru clienti.")
            return

        print(f"✓ {len(clients)} clienti gasiti in DB:")
        for c in clients:
            print(f"   {c.name:<25} {c.email}")

        # ── 3. Genereaza review-uri ───────────────────────────────────
        categories = db.query(Category).all()
        total_reviews = 0
        total_products = 0

        print()
        for cat in categories:
            products = db.query(Product).filter(
                Product.category_id == cat.id,
                Product.is_active == True,
            ).limit(10).all()

            if not products:
                print(f"[{cat.name}] — skip (niciun produs activ)")
                continue

            templates = get_templates(cat.slug)
            print(f"[{cat.name}] — {len(products)} produse")

            for prod in products:
                n = random.randint(20, 28)

                # Construieste pool cu distributie realista de note:
                # ~50% de 5 stele, ~25% de 4 stele, ~15% de 3, ~7% de 2, ~3% de 1
                pool_5 = [t for t in templates if t[2] == 5]
                pool_4 = [t for t in templates if t[2] == 4]
                pool_3 = [t for t in templates if t[2] == 3]
                pool_low = [t for t in templates if t[2] <= 2]

                chosen = []
                def pick(pool, k):
                    if not pool: return []
                    return random.choices(pool, k=k)

                chosen += pick(pool_5,   round(n * 0.50))
                chosen += pick(pool_4,   round(n * 0.25))
                chosen += pick(pool_3,   round(n * 0.15))
                chosen += pick(pool_low, n - len(chosen))
                random.shuffle(chosen)

                # Roteaza clientii + variatii de anonimat
                for i, (title, comment, rating) in enumerate(chosen):
                    client = clients[i % len(clients)]
                    is_anon = random.random() < 0.30  # 30% anonim

                    review = Review(
                        id=uuid_module.uuid4(),
                        user_id=client.id,
                        product_id=prod.id,
                        rating=rating,
                        title=title,
                        comment=comment,
                        is_anonymous=is_anon,
                        author_name=None if is_anon else client.name,
                        is_verified=random.random() < 0.40,
                        is_approved=True,
                        rejection_reason=None,
                        helpful_count=random.randint(0, 18),
                        created_at=random_date(270),
                    )
                    db.add(review)

                db.flush()
                total_reviews += len(chosen)
                total_products += 1
                avg = round(sum(c[2] for c in chosen) / len(chosen), 1)
                print(f"  ✓ {prod.name[:52]:<52} {len(chosen):>2} rec  avg={avg}")

        db.commit()
        print(f"\n{'='*65}")
        print(f"✓ {total_reviews} review-uri generate pe {total_products} produse")
        print(f"  din {len(categories)} categorii, folosind {len(clients)} clienti reali.")

if __name__ == "__main__":
    main()
