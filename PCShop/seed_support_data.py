from app.database import SessionLocal
from app.models.user_profile import Review
from app.models.user import User
from app.models.product import Product
from app.models.contact import ContactMessage
from datetime import datetime, timezone, timedelta
import random

db = SessionLocal()
random.seed(42)

clients = db.query(User).filter(User.role=='client').all()
good_clients = [c for c in clients if len(c.name) > 2 and c.name not in ('Admin Test', 'TestUser', 'a')]
prods = db.query(Product).all()
prod_sample = random.sample(prods, min(50, len(prods)))

# ─── REVIEWS ─────────────────────────────────────────────────────
review_data = [
    # PENDING - 10
    (5, "Produs excelent!", "Am ramas impresionat de calitatea acestui produs. Totul a functionat perfect din prima zi. Recomand cu caldura oricui.", False, None, True),
    (4, "Foarte bun, livrare rapida", "Produsul a ajuns in 2 zile, bine ambalat. Performantele sunt peste asteptari pentru pretul dat. Multumit.", False, None, False),
    (3, "Ok pentru pret", "Este ceea ce am comandat, fara surprize. Calitate medie dar pret corect. As fi vrut mai multe accesorii incluse.", False, None, False),
    (5, "Recomandat 100%", "Al doilea produs cumparat de pe acest site si la fel de multumit. Serviciu clienti excelent, raspuns rapid.", False, None, True),
    (2, "Sub asteptari", "M-am asteptat la ceva mai bun. Ambalajul era deteriorat la primire, produsul functioneaza dar am rezerve.", False, None, False),
    (4, "Calitate buna", "Folosesc de o luna si functioneaza fara probleme. Temperatura in limite normale, performante constante.", False, None, True),
    (5, "Fantastic!", "Cel mai bun produs din categoria sa la acest pret. Instalare usoara, documentatie clara. Bravo!", False, None, False),
    (1, "Dezamagitor", "Nu m-am asteptat la asa ceva. Produsul nu corespunde descrierii. Astept raspuns de la suport.", False, None, False),
    (4, "Bun dar zgomotos", "Performantele sunt bune dar face ceva mai mult zgomot decat ma asteptam. Altfel e ok.", False, None, True),
    (3, "Decent", "Face ce trebuie, nimic spectaculos. Pret corect pentru ce ofera.", False, None, False),
    # APPROVED - 9
    (5, "Achizitie perfecta", "Exact ce cautam! Compatibil cu sistemul meu, instalare rapida. Recomand acest magazin.", True, None, True),
    (4, "Foarte satisfacut", "Produs de calitate, vine bine ambalat. Livrarea a durat 3 zile, ceea ce e ok.", True, None, False),
    (5, "Top produs", "Folosesc de 3 luni fara nicio problema. Temperatura optima, silentios. Perfect!", True, None, True),
    (3, "Mediu spre bun", "Functioneaza conform specificatiilor. Nimic iesit din comun dar nici nu am de ce sa ma plang.", True, None, False),
    (5, "Super calitate", "Am cumparat pentru un build nou si sunt complet satisfacut. Raport calitate-pret excelent.", True, None, True),
    (4, "Buna alegere", "Dupa 2 saptamani de utilizare pot spune ca e o achizitie buna. Stabil si silentios.", True, None, False),
    (2, "Slab la capitolul racire", "Functioneaza dar se incalzeste destul de mult sub sarcina. Poate necesita pasta termala mai buna.", True, None, False),
    (5, "Excelent raport calitate-pret", "Am ezitat dar nu regret. Cel mai bun produs pe care l-am cumparat de pe acest site.", True, None, True),
    (4, "Recomandat", "Produs solid, instructiuni clare, instalare facila. Multumit de aceasta achizitie.", True, None, False),
    # REJECTED - 6
    (1, "INSELATORIE!", "Acest site e o frauda totala!!! Nu cumparati nimic de aici, va veti regreta!!!!", False, "Continut neadecvat si acuzatii false fara dovezi", False),
    (1, "Junk total", "Aruncat la cos dupa o saptamana. Producator incompetent. Evitati cu orice pret!!!", False, "Limbaj inadecvat, review neconstructiv", False),
    (2, "Produs defect returnat", "Nu functioneaza deloc. Cerere retur in curs. Astept banii inapoi de 2 saptamani.", False, "Situatia este tratata prin canalul de retur", False),
    (5, "SUPER MEGA TARE cel mai bun!!!", "Cumparati toti acest produs nu veti regreta GARANTAT 100% CEL MAI BUN!!!!", False, "Spam - review fara continut relevant", False),
    (1, "Pret umflat nejustificat", "Am gasit acelasi produs cu 50 RON mai ieftin pe alt site. Escrocherie de pret.", False, "Comparatia de preturi nu constituie un review valid al produsului", False),
    (3, "Review platit?", "Va intrebati de ce are atatea review-uri de 5 stele? Eu am primit o oferta sa scriu si eu...", False, "Acuzatii nefondate, incalca politica site-ului", False),
]

inserted_reviews = 0
for i, (rating, title, comment, is_approved, rejection_reason, is_verified) in enumerate(review_data):
    client = good_clients[i % len(good_clients)]
    prod = prod_sample[i % len(prod_sample)]

    # find a product this client hasn't reviewed yet
    for alt_prod in prod_sample + prods:
        exists = db.query(Review).filter(Review.user_id==client.id, Review.product_id==alt_prod.id).first()
        if not exists:
            prod = alt_prod
            break

    days_ago = random.randint(1, 60)
    created = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 23))

    rev = Review(
        user_id          = client.id,
        product_id       = prod.id,
        rating           = rating,
        title            = title,
        comment          = comment,
        author_name      = client.name,
        is_anonymous     = False,
        is_verified      = is_verified,
        is_approved      = is_approved,
        rejection_reason = rejection_reason,
        helpful_count    = random.randint(0, 15) if is_approved else 0,
    )
    rev.created_at = created
    db.add(rev)
    inserted_reviews += 1

db.flush()
print(f"Reviews inserted: {inserted_reviews}")

# ─── CONTACT MESSAGES ────────────────────────────────────────────
contacts_data = [
    # DESCHISE - 20
    ("Ion Popescu",      "ion.popescu@gmail.com",    "Problema cu comanda #PCB-0042",       "Buna ziua, am plasat o comanda acum 5 zile si nu am primit nicio actualizare legata de livrare. Numarul de tracking nu functioneaza. Va rog sa verificati situatia.", False),
    ("Maria Constantin", "maria.c@yahoo.com",        "Retur produs defect",                 "Am primit produsul cu ambalajul deteriorat si display-ul crasat. Doresc sa initiez un retur si sa primesc un produs nou. Ce procedura trebuie sa urmez?", False),
    ("Andrei Mihai",     "andrei.m@outlook.com",     "Intrebare despre compatibilitate",    "Buna ziua. Doresc sa cumpar un procesor AMD Ryzen 5 7600 si ma intreb daca este compatibil cu placa de baza MSI B450 pe care o am deja. Multumesc.", False),
    ("Elena Stoica",     "elena.stoica@gmail.com",   "Factura proforma pentru firma",       "Buna ziua, suntem o firma si am dori sa primim o factura proforma pentru o comanda de 10 statii de lucru. Puteti sa ne contactati la numarul de mai jos?", False),
    ("Bogdan Petre",     "bogdan.p@gmail.com",       "Discount pentru comanda mare",        "Salut, intentionez sa cumpar echipamente in valoare de aproximativ 15.000 RON. Aveti oferte speciale sau discount pentru comenzi mari? Multumesc.", False),
    ("Cristina Vasile",  "cristina.v@hotmail.com",   "Produsul nu apare in stoc",           "Buna ziua. Am observat ca placa video RTX 4070 Ti nu mai apare pe site. Stiti cand va intra in stoc? Doresc sa o comand urgent.", False),
    ("Radu Ionescu",     "radu.ionescu@gmail.com",   "Problema la plata online",            "Am incercat de 3 ori sa platesc cu cardul si imi da eroare. Am verificat si cardul functioneaza pe alte site-uri. Va rog sa ma ajutati.", False),
    ("Mihaela Dan",      "mihaela.dan@yahoo.com",    "Garantie extinsa disponibila?",       "Buna, as dori sa stiu daca oferiti garantie extinsa la produsele achizitionate si care este costul acesteia. In special pentru procesoare si placi video.", False),
    ("Florin Marin",     "florin.marin@gmail.com",   "Colet deteriorat la livrare",         "Coletul a ajuns la mine cu semne clare de deteriorare. Am facut poze inainte de a-l deschide. Produsul din interior pare ok. Ce fac in aceasta situatie?", False),
    ("Oana Gheorghe",    "oana.gh@gmail.com",        "Schimbare adresa de livrare",         "Am comandat ieri si am gresit adresa de livrare. Comanda nu a fost inca expediata. Este posibil sa modificati adresa? Va rog urgent.", False),
    ("Alexandru Pop",    "alex.pop@gmail.com",       "Cerere parteneriat B2B",              "Buna ziua, reprezentez o firma de IT si suntem interesati de un parteneriat pentru achizitii regulate de componente. Doresc sa discut cu cineva din echipa de vanzari.", False),
    ("Irina Nastase",    "irina.n@gmail.com",        "Produsul primit difera de site",      "Procesorul primit este o versiune OEM, pe site nu era specificat acest lucru. Doresc clarificari sau schimbarea cu versiunea BOX.", False),
    ("Daniel Costea",    "daniel.c@yahoo.com",       "Ajutor configurare primul PC",        "Buna ziua. Sunt incepator si doresc sa imi construiesc primul PC. Aveti un ghid sau puteti sa ma ajutati sa aleg componentele potrivite pentru un buget de 3000 RON?", False),
    ("Sorin Tudor",      "sorin.tudor@gmail.com",    "Nu ma pot autentifica in cont",       "Nu ma pot autentifica in cont de 2 zile. Am resetat parola de mai multe ori dar tot nu merge. Va rog sa verificati contul meu sorin.tudor@gmail.com.", False),
    ("Georgiana Filip",  "georgiana.f@gmail.com",    "Livrare internationala Germania",     "Buna ziua, locuiesc in Germania si as dori sa comand cateva componente. Faceti livrari internationale? Daca da, care sunt costurile de transport?", False),
    ("Marius Enache",    "marius.e@outlook.com",     "Cerere oferta bulk 50 SSD-uri",       "Buna ziua, suntem un service IT si avem nevoie de 50 de SSD-uri de 1TB. Puteti face o oferta speciala pentru aceasta cantitate?", False),
    ("Catalina Rusu",    "catalina.r@gmail.com",     "Voucher PCSHOP20 nu functioneaza",    "Am primit un voucher prin email dar cand il introduc la checkout imi spune ca este invalid. Codul este PCSHOP20. Va rog sa verificati.", False),
    ("Victor Stanescu",  "victor.s@yahoo.com",       "Plata in rate posibila?",             "Buna ziua. Este posibil sa platesc in rate pentru o comanda mai mare? Daca da, cu ce banca lucrati si care sunt conditiile?", False),
    ("Adriana Ilie",     "adriana.i@gmail.com",      "Review sters fara explicatie",        "Buna ziua. Am scris un review sincer pentru un produs si a fost sters. Nu am incalcat nicio regula. Doresc o explicatie.", False),
    ("Petru Lazar",      "petru.l@gmail.com",        "Bug in PC Builder - componente",      "Buna, am folosit PC Builder-ul si mi-a recomandat componente incompatibile. Procesorul si placa de baza nu se potrivesc. Va rog sa verificati.", False),
    # REZOLVATE - 25
    ("Andreea Mitu",     "andreea.m@gmail.com",      "Confirmare primire colet",            "Buna ziua, am primit coletul azi si totul este in ordine. Multumesc pentru livrarea rapida! Voi reveni cu siguranta.", True),
    ("Lucian Barbu",     "lucian.b@yahoo.com",       "Multumire pentru suport rapid",       "Voiam sa va multumesc pentru ajutorul oferit. Problema cu plata a fost rezolvata rapid. Bravo!", True),
    ("Nicoleta Dima",    "nicoleta.d@gmail.com",     "Produsul a fost inlocuit",            "Am primit produsul de inlocuire azi. Totul este perfect. Apreciez modul profesionist in care ati tratat reclamatia.", True),
    ("Horia Pascu",      "horia.p@gmail.com",        "Intrebare stoc - rezolvata",          "Am primit raspuns la intrebarea despre stoc. Multumesc pentru promptitudine. Am plasat si comanda.", True),
    ("Delia Oros",       "delia.o@yahoo.com",        "Problema factura rezolvata",          "Factura corectata a ajuns pe email. Multumesc pentru interventia rapida. Totul este in regula.", True),
    ("Cosmin Vlad",      "cosmin.v@gmail.com",       "Retur aprobat - confirmare",          "Voiam sa confirm ca am primit rambursarea pentru returul efectuat. Multumesc pentru procesare rapida.", True),
    ("Teodora Manea",    "teodora.m@gmail.com",      "Intrebare compatibilitate DDR5",      "Multumesc pentru raspunsul detaliat despre compatibilitatea DDR5. Mi-a fost de mare ajutor. Am cumparat placa recomandata.", True),
    ("Silviu Boca",      "silviu.b@outlook.com",     "Reducere aplicata corect",            "Am verificat factura si reducerea a fost aplicata corect. Multumesc pentru clarificare.", True),
    ("Carmen Negru",     "carmen.n@gmail.com",       "Cont deblocat",                       "Contul a fost deblocat si pot sa ma autentific din nou. Multumesc echipei de suport pentru rezolvare rapida.", True),
    ("Emil Cretu",       "emil.c@gmail.com",         "Tracking actualizat",                 "Numarul de tracking functioneaza acum si pot sa urmaresc coletul. Multumesc pentru actualizare.", True),
    ("Natalia Popa",     "natalia.p@yahoo.com",      "Comanda anulata, bani returnati",     "Am primit confirmarea anularii comenzii si banii au ajuns in cont. Multumesc pentru procesare rapida.", True),
    ("Robert Ionita",    "robert.i@gmail.com",       "Clarificare specificatii tehnice",    "Am primit raspunsul tehnic detaliat. Acum stiu exact ce produs sa aleg. Multumesc pentru profesionalism.", True),
    ("Larisa Balan",     "larisa.b@gmail.com",       "Adresa modificata cu succes",         "Confirmati ca adresa de livrare a fost modificata. Multumesc pentru interventia rapida.", True),
    ("Nicu Filimon",     "nicu.f@yahoo.com",         "Reclamatie tratata corespunzator",    "Problema semnalata a fost rezolvata in timp util. Apreciez seriozitatea cu care ati tratat reclamatia.", True),
    ("Alina Ciobanu",    "alina.c@gmail.com",        "Voucher activat cu succes",           "Voucherul a fost activat si functioneaza. Multumesc pentru suport. Il folosesc la urmatoarea comanda.", True),
    ("Dan Stoian",       "dan.stoian@gmail.com",     "Intrebare despre garantie rezolvata", "Am primit toate informatiile despre garantie. Procedura este clara. Multumesc pentru raspuns prompt.", True),
    ("Ileana Miron",     "ileana.m@yahoo.com",       "Produsul a ajuns in stoc",            "M-ati anuntat ca produsul dorit a intrat in stoc. Multumesc pentru notificare, l-am comandat imediat.", True),
    ("George Bucur",     "george.b@gmail.com",       "Problema plata rezolvata",            "Plata a functionat dupa ce mi-ati spus sa sterg cache-ul browserului. Multumesc pentru sfat.", True),
    ("Patricia Dumitrescu", "patricia.d@gmail.com",  "Cerere oferta acceptata",             "Am primit oferta pentru comanda bulk si preturile sunt acceptabile. Vom plasa comanda saptamana viitoare.", True),
    ("Mircea Florea",    "mircea.f@gmail.com",       "Schimb produs efectuat",              "Am primit produsul de schimb. Este exact ce am comandat. Multumesc pentru rezolvarea rapida a situatiei.", True),
    ("Roxana Ionescu",   "roxana.i@gmail.com",       "Factura trimisa pe email",            "Am primit factura pe email. Multumesc pentru promptitudine.", True),
    ("Bogdan Serban",    "bogdan.s@yahoo.com",       "Livrare expres confirmata",           "Am primit confirmarea pentru livrarea expres. Multumesc pentru urgentarea comenzii.", True),
    ("Camelia Tudor",    "camelia.t@gmail.com",      "Problema SSO rezolvata",              "Problema de autentificare cu Google a fost rezolvata. Contul functioneaza normal acum.", True),
    ("Ionut Marinescu",  "ionut.m@gmail.com",        "Discount aplicat la comanda",         "Am vazut ca discount-ul de 10% a fost aplicat corect la comanda mea. Multumesc.", True),
    ("Simona Radu",      "simona.r@yahoo.com",       "Informatii livrare primite",          "Multumesc pentru informatiile despre livrare. Acum stiu exact ce sa astept si cand.", True),
]

inserted_contact = 0
for i, (name, email, subject, message, is_resolved) in enumerate(contacts_data):
    days_ago = random.randint(0, 45)
    hours_ago = random.randint(0, 23)
    created = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)

    msg = ContactMessage(
        name             = name,
        email            = email,
        subject          = subject,
        message          = message,
        is_resolved      = is_resolved,
        resolved_by_name = "Suport PCShop" if is_resolved else None,
    )
    if is_resolved:
        msg.resolved_at = created + timedelta(hours=random.randint(1, 48))
    db.add(msg)
    inserted_contact += 1

db.commit()
print(f"Contact messages inserted: {inserted_contact}")

# ─── VERIFICARE ──────────────────────────────────────────────────
pending_r  = db.query(Review).filter(Review.is_approved==False, Review.rejection_reason==None).count()
approved_r = db.query(Review).filter(Review.is_approved==True).count()
rejected_r = db.query(Review).filter(Review.rejection_reason!=None).count()
total_c    = db.query(ContactMessage).count()
open_c     = db.query(ContactMessage).filter(ContactMessage.is_resolved==False).count()
resolved_c = db.query(ContactMessage).filter(ContactMessage.is_resolved==True).count()

print(f"\n=== VERIFICARE FINALA ===")
print(f"Reviews: {pending_r} in asteptare | {approved_r} aprobate | {rejected_r} respinse")
print(f"Contact: {total_c} total | {open_c} deschise | {resolved_c} rezolvate")
db.close()
