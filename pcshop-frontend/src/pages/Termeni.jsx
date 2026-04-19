import { FileText, ShieldCheck, Package, CreditCard, ArrowCounterClockwise, Warning, EnvelopeSimple, Truck, Gavel } from '@phosphor-icons/react'

const Section = ({ icon: Icon, title, color, children }) => (
  <div className="bg-surface border border-default rounded-2xl overflow-hidden mb-4">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-default"
         style={{ background: `${color}08` }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
           style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <h2 className="text-primary font-bold text-[15px]">{title}</h2>
    </div>
    <div className="px-6 py-5 text-secondary text-[13px] leading-relaxed space-y-3">
      {children}
    </div>
  </div>
)

const Li = ({ children }) => (
  <li className="flex items-start gap-2">
    <span className="text-accent mt-0.5 shrink-0">›</span>
    <span>{children}</span>
  </li>
)

export default function Termeni() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl
                        flex items-center justify-center mx-auto mb-4">
          <FileText size={28} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2">Termeni și Condiții</h1>
        <p className="text-muted text-[13px]">
          Ultima actualizare: <strong className="text-secondary">1 ianuarie 2025</strong>
          {' · '}SC Alex Computers SRL · CUI 12345678
        </p>
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-2xl px-6 py-4 mb-6 text-[13px] text-secondary leading-relaxed">
        Vă rugăm să citiți cu atenție acești Termeni și Condiții înainte de a utiliza platforma{' '}
        <strong className="text-primary">alexcomputers.ro</strong>. Prin accesarea site-ului, crearea unui cont
        sau plasarea unei comenzi, confirmați că ați luat la cunoștință și acceptați în totalitate prezentele condiții.
        Dacă nu sunteți de acord cu oricare dintre prevederile de mai jos, vă rugăm să nu utilizați serviciile noastre.
      </div>

      <Section icon={ShieldCheck} title="1. Despre noi" color="#00e5a0">
        <p>
          SC Alex Computers SRL, cu sediul social în București, Str. Electronicii nr. 12, sector 2,
          înregistrată la Registrul Comerțului sub nr. J40/1234/2020, CUI RO12345678, capital social 10.000 RON
          (denumită în continuare <strong>"Alex Computers"</strong>, <strong>"noi"</strong> sau{' '}
          <strong>"societatea"</strong>), este operatorul platformei de comerț electronic{' '}
          <strong>alexcomputers.ro</strong>.
        </p>
        <p>
          Platforma oferă servicii de vânzare online de componente hardware, periferice și accesorii pentru
          calculatoare, adresate atât persoanelor fizice, cât și persoanelor juridice cu sediul în România.
        </p>
        <p>
          Ne rezervăm dreptul de a modifica acești Termeni și Condiții în orice moment.
          Modificările intră în vigoare la 15 zile de la publicarea pe site, perioadă în care utilizatorii
          înregistrați vor fi notificați prin email. Continuarea utilizării platformei după această dată
          constituie acceptul modificărilor.
        </p>
      </Section>

      <Section icon={Package} title="2. Produse, disponibilitate și prețuri" color="#38bdf8">
        <p>
          Toate produsele prezentate pe alexcomputers.ro sunt oferte de vânzare în limita stocului disponibil.
          Disponibilitatea stocului este actualizată în timp real; cu toate acestea, în situații excepționale
          (comenzi simultane, erori de sincronizare cu furnizorii), un produs poate deveni indisponibil
          după plasarea comenzii. Vă vom notifica imediat și vă vom oferi alternativa unui produs echivalent
          sau rambursarea integrală.
        </p>
        <ul className="space-y-2">
          <Li>
            Prețurile sunt exprimate în lei (RON) și includ TVA 19%, conform Codului Fiscal în vigoare.
            Costul livrării nu este inclus în prețul produsului și se afișează separat la finalizarea comenzii.
          </Li>
          <Li>
            Imaginile produselor sunt cu titlu orientativ și pot diferi ușor față de produsul fizic
            (variații de culoare, design cutie, accesorii incluse). Specificațiile tehnice sunt preluate
            de la producători și pot fi modificate de aceștia fără notificare prealabilă.
          </Li>
          <Li>
            Promoțiile și reducerile sunt valabile exclusiv în perioada afișată și în limita stocului alocat.
            Reducerile nu se cumulează între ele, cu excepția cazurilor în care se specifică explicit.
          </Li>
          <Li>
            Alex Computers poate modifica prețurile oricând, fără notificare prealabilă. Prețul valabil
            este cel afișat în momentul plasării și confirmării comenzii de către sistem.
          </Li>
          <Li>
            În cazul unui preț vădit eronat (eroare de sistem, greșeală de introducere), ne rezervăm
            dreptul de a anula comanda și de a vă notifica în 24h, cu posibilitatea de a replica
            comanda la prețul corect.
          </Li>
        </ul>
      </Section>

      <Section icon={CreditCard} title="3. Comenzi și plăți" color="#a78bfa">
        <p>
          Plasarea unei comenzi pe alexcomputers.ro reprezintă o ofertă de cumpărare din partea dvs.
          Contractul de vânzare se consideră încheiat în momentul în care primiți emailul de confirmare
          din partea noastră, care include numărul comenzii, detaliile produselor și suma totală.
        </p>
        <ul className="space-y-2">
          <Li>
            <strong>Card bancar</strong> — Visa, Mastercard, Maestro. Tranzacțiile sunt procesate securizat
            prin platforme certificate PCI-DSS nivel 1. Nu stocăm datele cardului dvs.; informațiile
            sunt transmise direct procesatorului de plăți printr-o conexiune criptată TLS.
          </Li>
          <Li>
            <strong>Transfer bancar</strong> — Datele contului bancar se afișează la confirmarea comenzii.
            Comanda se procesează după înregistrarea plății (1–3 zile lucrătoare). Vă rugăm să
            menționați numărul comenzii la rubrica detalii transfer.
          </Li>
          <Li>
            <strong>Plată la livrare (ramburs)</strong> — Disponibilă pentru comenzi sub 3.000 RON,
            cu adresă de livrare pe teritoriul României. Taxa de ramburs, dacă există, este afișată
            înainte de finalizarea comenzii.
          </Li>
          <Li>
            Factura fiscală se emite electronic (PDF) și se transmite pe adresa de email asociată contului
            în maximum 24 de ore de la livrarea coletului.
          </Li>
          <Li>
            Orice suspiciune de fraudă, utilizare neautorizată a unui card sau tentativă de plată falsă
            va fi sesizată imediat autorităților competente, iar comanda va fi anulată.
          </Li>
        </ul>
      </Section>

      <Section icon={Truck} title="4. Livrare și transport" color="#fb923c">
        <p>
          Livrarea produselor se realizează exclusiv pe teritoriul României, prin servicii de curierat rapid.
          Ne străduim să procesăm și să expediem comenzile în maximum 1 zi lucrătoare de la confirmarea plății.
        </p>
        <ul className="space-y-2">
          <Li>
            <strong>Termen estimat de livrare:</strong> 1–3 zile lucrătoare de la expediere, în funcție
            de localitate. Localitățile din mediul rural pot necesita 1 zi suplimentară.
          </Li>
          <Li>
            <strong>Livrare gratuită</strong> pentru comenzi cu valoarea produselor peste 500 RON.
            Sub această valoare, costul livrării se calculează automat în funcție de greutatea coletului
            și se afișează la pasul de finalizare a comenzii.
          </Li>
          <Li>
            Veți primi un SMS și un email cu numărul AWB imediat după expediere, permițându-vă
            să urmăriți coletul în timp real pe site-ul curierului.
          </Li>
          <Li>
            La primirea coletului, <strong>verificați obligatoriu integritatea ambalajului</strong> în
            prezența curierului. Dacă ambalajul prezintă deteriorări vizibile, refuzați coletul și
            solicitați curierului întocmirea unui proces verbal de constatare, apoi contactați-ne imediat.
            Reclamațiile privind deteriorări nedeclarate la livrare nu pot fi procesate ulterior.
          </Li>
          <Li>
            Alex Computers nu este responsabilă pentru întârzierile cauzate de furnizorul de curierat,
            condițiile meteorologice nefavorabile, greve sau orice alte situații de forță majoră.
          </Li>
        </ul>
      </Section>

      <Section icon={ArrowCounterClockwise} title="5. Dreptul de returnare și garanție" color="#f59e0b">
        <p>
          În conformitate cu prevederile <strong>OUG nr. 34/2014</strong> privind drepturile consumatorilor
          în cadrul contractelor încheiate cu profesioniștii, beneficiați de dreptul de a vă retrage
          din contract fără a invoca niciun motiv, în termen de <strong>14 zile calendaristice</strong> de
          la data primirii produsului.
        </p>
        <ul className="space-y-2">
          <Li>
            <strong>Procedura de returnare:</strong> Accesați secțiunea „Retururi" din contul dvs.,
            selectați comanda și completați formularul de retur. Veți primi instrucțiunile de expediere
            în maximum 24 de ore.
          </Li>
          <Li>
            Produsul trebuie returnat în starea originală: nefolosit, cu ambalajul intact, toate
            accesoriile, documentele și sigiliile incluse. Produsele care prezintă urme de utilizare
            pot fi returnate cu o reducere valorică proporțională cu deprecierea constatată.
          </Li>
          <Li>
            Costul returnării este suportat de cumpărător, cu excepția cazului în care produsul a
            fost livrat eronat sau este defect.
          </Li>
          <Li>
            Rambursarea sumei achitate (exclusiv costul livrării inițiale) se efectuează în maximum
            14 zile calendaristice de la data primirii produsului returnat și confirmării stării acestuia,
            prin aceeași metodă de plată folosită la comandă.
          </Li>
          <Li>
            <strong>Garanție comercială:</strong> Toate produsele beneficiază de garanție comercială
            conform termenului acordat de producător (în general 24 de luni). Certificatul de garanție
            se găsește în colet sau în contul dvs. Garanția nu acoperă: deteriorările mecanice,
            daunele cauzate de supratensiuni electrice, utilizarea necorespunzătoare, intervenții
            neautorizate sau uzura normală.
          </Li>
          <Li>
            Defecțiunile în garanție se soluționează prin reparare sau înlocuire, la latitudinea
            service-ului autorizat, în maximum 15 zile lucrătoare.
          </Li>
        </ul>
      </Section>

      <Section icon={Warning} title="6. Limitarea răspunderii" color="#f87171">
        <ul className="space-y-2">
          <Li>
            Alex Computers nu își asumă răspunderea pentru prejudicii indirecte, incidentale sau
            consecutive decurgând din utilizarea produselor achiziționate, inclusiv pierderi de date,
            pierderi de profit sau întreruperea activității.
          </Li>
          <Li>
            Răspunderea maximă totală a Alex Computers față de un client, indiferent de natura pretențiilor,
            este limitată la valoarea comenzii în litigiu.
          </Li>
          <Li>
            Alex Computers depune eforturi rezonabile pentru a menține platforma funcțională în permanență,
            dar nu garantează disponibilitatea neîntreruptă. Nu ne asumăm răspunderea pentru pierderi
            cauzate de întreruperi tehnice, atacuri informatice sau intervenții externe.
          </Li>
          <Li>
            Linkurile externe prezente pe site sunt oferite cu titlu informativ. Alex Computers nu
            controlează și nu răspunde pentru conținutul site-urilor terțe.
          </Li>
        </ul>
      </Section>

      <Section icon={Gavel} title="7. Proprietate intelectuală" color="#94a3b8">
        <p>
          Întregul conținut al platformei alexcomputers.ro — incluzând, dar fără a se limita la:
          texte, logo-uri, imagini, grafice, interfața vizuală, cod sursă și baze de date — este
          proprietatea exclusivă a SC Alex Computers SRL sau este utilizat cu acordul titularilor
          de drepturi, și este protejat de legislația română și europeană privind drepturile de autor
          și proprietatea intelectuală.
        </p>
        <ul className="space-y-2">
          <Li>
            Este interzisă reproducerea, distribuirea, modificarea sau utilizarea comercială a oricărui
            element al platformei fără acordul scris prealabil al Alex Computers.
          </Li>
          <Li>
            Mărcile comerciale și logo-urile producătorilor prezentate pe site aparțin respectivilor
            titulari și sunt utilizate exclusiv în scop informativ.
          </Li>
        </ul>
      </Section>

      <Section icon={EnvelopeSimple} title="8. Contact și soluționarea litigiilor" color="#00e5a0">
        <p>
          Pentru orice nelămurire, reclamație sau solicitare legată de acești Termeni și Condiții,
          ne puteți contacta prin oricare dintre modalitățile de mai jos. Ne angajăm să răspundem
          în maximum 2 zile lucrătoare.
        </p>
        <ul className="space-y-2 mt-1">
          <Li>Email: <strong className="text-accent">legal@alexcomputers.ro</strong></Li>
          <Li>Telefon: <strong>0800 123 456</strong> — gratuit, Luni–Vineri, 09:00–18:00</Li>
          <Li>Adresă: Str. Electronicii nr. 12, sector 2, București, cod poștal 021234</Li>
        </ul>
        <p className="mt-3">
          Litigiile nesoluționate pe cale amiabilă vor fi supuse instanțelor judecătorești competente
          din România, conform legislației în vigoare. Aveți de asemenea posibilitatea de a apela la
          soluționarea alternativă a litigiilor prin:
        </p>
        <ul className="space-y-2 mt-1">
          <Li><strong>ANPC</strong> (Autoritatea Națională pentru Protecția Consumatorilor) — anpc.ro</Li>
          <Li><strong>Platforma SOL</strong> (Online Dispute Resolution) a Comisiei Europene — ec.europa.eu/consumers/odr</Li>
        </ul>
        <p className="mt-3">
          Prezentul contract este guvernat de legislația română. Orice clauză declarată nulă de o
          instanță competentă nu afectează valabilitatea celorlalte prevederi.
        </p>
      </Section>
    </div>
  )
}
