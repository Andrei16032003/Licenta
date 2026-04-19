import { Lock, Database, Eye, UserCircle, EnvelopeSimple, ShieldCheck, Cookie, ArrowsClockwise } from '@phosphor-icons/react'

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

export default function Confidentialitate() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl
                        flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2">Politica de Confidențialitate</h1>
        <p className="text-muted text-[13px]">
          Ultima actualizare: <strong className="text-secondary">1 ianuarie 2025</strong>
          {' · '}SC Alex Computers SRL · DPO: dpo@alexcomputers.ro
        </p>
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-2xl px-6 py-4 mb-6 text-[13px] text-secondary leading-relaxed">
        SC Alex Computers SRL respectă pe deplin{' '}
        <strong className="text-primary">Regulamentul (UE) 2016/679 (GDPR)</strong> și Legea nr. 190/2018
        privind măsurile de punere în aplicare a GDPR în România. Această politică descrie transparent
        ce date cu caracter personal colectăm, în ce scopuri le prelucrăm, cui le transmitem și cum
        vă puteți exercita drepturile garantate de lege. Dacă aveți întrebări, ne puteți contacta
        oricând la <strong className="text-accent">dpo@alexcomputers.ro</strong>.
      </div>

      <Section icon={Database} title="1. Ce date colectăm și de unde" color="#38bdf8">
        <p>
          Colectăm numai datele strict necesare furnizării serviciilor noastre, respectând principiul
          minimizării datelor prevăzut de GDPR.
        </p>
        <p className="font-semibold text-primary mt-1">Date furnizate direct de dvs.:</p>
        <ul className="space-y-2">
          <Li><strong>Date de cont:</strong> nume și prenume, adresă de email, parolă (stocată exclusiv ca hash bcrypt — nu o putem recupera sau citi).</Li>
          <Li><strong>Date de livrare:</strong> adresă completă, județ, cod poștal, număr de telefon de contact.</Li>
          <Li><strong>Date de facturare:</strong> pentru persoane juridice — denumire firmă, CUI, sediu social, număr de înregistrare.</Li>
          <Li><strong>Comunicări:</strong> mesajele trimise echipei de suport prin formularul de contact sau email.</Li>
        </ul>
        <p className="font-semibold text-primary mt-2">Date colectate automat:</p>
        <ul className="space-y-2">
          <Li><strong>Date tehnice:</strong> adresa IP, tipul și versiunea browserului, sistemul de operare, rezoluția ecranului, paginile vizitate și durata sesiunii — colectate prin log-uri de server și cookies.</Li>
          <Li><strong>Date de tranzacție:</strong> istoricul comenzilor, produsele vizualizate, metodele de plată utilizate (fără datele cardului, care nu ne parvin niciodată).</Li>
        </ul>
        <p className="mt-2 text-muted">
          Nu colectăm date sensibile în sensul art. 9 GDPR (date privind sănătatea, originea etnică,
          convingerile religioase, datele biometrice etc.).
        </p>
      </Section>

      <Section icon={Eye} title="2. De ce prelucrăm datele (scopuri și temeiuri legale)" color="#a78bfa">
        <ul className="space-y-3">
          <Li>
            <strong>Executarea contractului (art. 6 alin. 1 lit. b GDPR):</strong> procesarea și
            livrarea comenzilor, emiterea facturilor, gestionarea retururilor și a solicitărilor
            de garanție, comunicarea cu dvs. pe parcursul relației comerciale.
          </Li>
          <Li>
            <strong>Obligații legale (art. 6 alin. 1 lit. c GDPR):</strong> arhivarea documentelor
            contabile și fiscale conform Codului Fiscal (10 ani), raportări către ANAF și alte autorități
            competente, respectarea obligațiilor GDPR față de ANSPDCP.
          </Li>
          <Li>
            <strong>Interese legitime (art. 6 alin. 1 lit. f GDPR):</strong> prevenirea și detectarea
            fraudelor, securitatea platformei și a datelor utilizatorilor, statistici anonimizate
            pentru îmbunătățirea serviciilor, recuperarea creanțelor.
          </Li>
          <Li>
            <strong>Consimțământ (art. 6 alin. 1 lit. a GDPR):</strong> trimiterea de newsletter-uri
            cu oferte și noutăți (opțional — bifați dacă doriți la înregistrare sau din secțiunea
            „Notificări" a contului). Puteți retrage consimțământul oricând, fără nicio consecință
            asupra comenzilor dvs.
          </Li>
        </ul>
      </Section>

      <Section icon={ArrowsClockwise} title="3. Cui transmitem datele" color="#00e5a0">
        <p>
          <strong>Nu vindem, nu închiriem și nu schimbăm datele dvs. cu terți în scop comercial.</strong>
          Transmitem date exclusive partenerilor necesari furnizării serviciilor, în baza unor contracte
          conforme GDPR:
        </p>
        <ul className="space-y-2 mt-2">
          <Li>
            <strong>Firme de curierat</strong> (ex. FAN Courier, DPD, Cargus) — nume, adresă de livrare
            și telefon, strict necesare livrării coletului.
          </Li>
          <Li>
            <strong>Procesator de plăți</strong> (ex. Stripe, Netopia) — date minime pentru autorizarea
            tranzacției. Procesatorul operează independent și are propria politică PCI-DSS.
          </Li>
          <Li>
            <strong>Furnizor de email tranzacțional</strong> — pentru trimiterea confirmărilor de comandă,
            facturilor și notificărilor de livrare.
          </Li>
          <Li>
            <strong>Furnizor de hosting/cloud</strong> — serverele se află în UE, iar furnizorul este
            legat contractual prin clauze GDPR.
          </Li>
          <Li>
            <strong>Autorități publice</strong> (ANAF, poliție, instanțe judecătorești) — exclusiv
            la solicitare legală expresă și în limitele impuse de lege.
          </Li>
        </ul>
        <p className="mt-2">
          Toți partenerii noștri operează în spațiul UE/SEE sau sub mecanisme adecvate de transfer
          (Clauzele Contractuale Standard aprobate de Comisia Europeană).
        </p>
      </Section>

      <Section icon={Database} title="4. Cât timp păstrăm datele" color="#fb923c">
        <ul className="space-y-2">
          <Li><strong>Date de cont activ:</strong> pe toată durata existenței contului, plus 30 de zile după solicitarea de ștergere (perioadă de grație pentru recuperarea accidentală).</Li>
          <Li><strong>Documente fiscale (facturi, comenzi):</strong> 10 ani, conform art. 25 din Legea contabilității nr. 82/1991 — obligație legală care prevalează față de dreptul de ștergere.</Li>
          <Li><strong>Log-uri de server și date tehnice:</strong> maximum 90 de zile.</Li>
          <Li><strong>Cookies analitice:</strong> maximum 13 luni de la ultima interacțiune.</Li>
          <Li><strong>Comunicări cu suportul:</strong> 3 ani de la ultima interacțiune, pentru a putea gestiona eventuale litigii ulterioare.</Li>
          <Li><strong>Date de marketing (newsletter):</strong> până la retragerea consimțământului sau 2 ani de inactivitate, oricare survine primul.</Li>
        </ul>
      </Section>

      <Section icon={Cookie} title="5. Cookies și tehnologii similare" color="#f59e0b">
        <p>
          Folosim cookies și tehnologii similare (localStorage, sessionStorage) pentru funcționarea
          corectă a platformei și îmbunătățirea experienței de utilizare.
        </p>
        <ul className="space-y-2 mt-1">
          <Li><strong>Cookies esențiale:</strong> necesare funcționării coșului de cumpărături, autentificării și securității sesiunii. Nu pot fi dezactivate.</Li>
          <Li><strong>Cookies funcționale:</strong> rețin preferințele dvs. (limbă, monedă, produse comparate). Pot fi dezactivate din setările browserului.</Li>
          <Li><strong>Cookies analitice:</strong> colectează date anonimizate despre modul de utilizare a site-ului (pagini vizitate, timp petrecut) pentru a îmbunătăți platforma. Necesită consimțământ.</Li>
        </ul>
        <p className="mt-2">
          Puteți gestiona sau șterge cookies-urile din setările browserului dvs. Dezactivarea
          cookies-urilor esențiale poate afecta funcționalitatea platformei.
        </p>
      </Section>

      <Section icon={UserCircle} title="6. Drepturile dvs. conform GDPR" color="#f59e0b">
        <p>
          Conform Regulamentului (UE) 2016/679, beneficiați de următoarele drepturi, pe care
          le puteți exercita gratuit contactând DPO-ul nostru la <strong className="text-accent">dpo@alexcomputers.ro</strong>:
        </p>
        <ul className="space-y-2 mt-2">
          <Li>
            <strong>Dreptul de acces (art. 15):</strong> puteți solicita o copie a tuturor datelor
            personale pe care le prelucrăm despre dvs., inclusiv scopurile și destinatarii.
          </Li>
          <Li>
            <strong>Dreptul la rectificare (art. 16):</strong> puteți corecta datele incorecte
            sau incomplete direct din contul dvs. sau prin solicitare scrisă.
          </Li>
          <Li>
            <strong>Dreptul la ștergere / „dreptul de a fi uitat" (art. 17):</strong> puteți solicita
            ștergerea datelor atunci când nu mai sunt necesare scopului colectării, sub rezerva
            obligațiilor legale de păstrare (ex. documentele fiscale nu pot fi șterse anticipat).
          </Li>
          <Li>
            <strong>Dreptul la restricționarea prelucrării (art. 18):</strong> puteți solicita
            suspendarea prelucrării datelor dvs. în situații precum contestarea exactității lor
            sau formularea unei obiecții.
          </Li>
          <Li>
            <strong>Dreptul la portabilitate (art. 20):</strong> puteți primi datele dvs. furnizate
            direct (profil, adrese, istoricul comenzilor) într-un format structurat, de uz curent,
            lizibil automat (JSON sau CSV).
          </Li>
          <Li>
            <strong>Dreptul de opoziție (art. 21):</strong> vă puteți opune prelucrării datelor
            în scop de marketing direct în orice moment, fără nicio justificare.
          </Li>
          <Li>
            <strong>Dreptul de a nu face obiectul unei decizii automate (art. 22):</strong> nu
            utilizăm profilare automatizată sau decizii exclusiv automate cu efecte juridice
            semnificative asupra dvs.
          </Li>
        </ul>
        <p className="mt-3">
          Răspundem solicitărilor în maximum <strong>30 de zile calendaristice</strong> (cu posibilitate
          de prelungire cu 60 de zile pentru cereri complexe, cu notificarea dvs.). Dacă considerați
          că drepturile vă sunt încălcate, puteți depune o plângere la:
        </p>
        <ul className="space-y-2 mt-1">
          <Li><strong>ANSPDCP</strong> — Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal, anspdcp.eu, B-dul Magheru nr. 28-30, București.</Li>
        </ul>
      </Section>

      <Section icon={ShieldCheck} title="7. Securitatea datelor" color="#f87171">
        <p>
          Implementăm măsuri tehnice și organizatorice adecvate pentru protejarea datelor dvs.
          împotriva accesului neautorizat, modificării, divulgării sau distrugerii accidentale:
        </p>
        <ul className="space-y-2 mt-1">
          <Li>Toate conexiunile sunt criptate prin <strong>TLS 1.3 (HTTPS)</strong>; conexiunile HTTP sunt redirecționate automat.</Li>
          <Li>Parolele sunt stocate exclusiv ca <strong>hash bcrypt</strong> cu salt individual — nu le putem recupera sau transmite.</Li>
          <Li>Accesul angajaților la date cu caracter personal este restricționat pe baza rolului (<strong>RBAC</strong>) și se bazează pe principiul „need to know".</Li>
          <Li>Efectuăm <strong>audituri de securitate</strong> periodice și teste de penetrare cel puțin o dată pe an.</Li>
          <Li>Backup-urile bazei de date sunt criptate și stocate în locații geografice separate.</Li>
          <Li>
            În cazul unui incident de securitate care vă poate afecta drepturile și libertățile,
            vom notifica <strong>ANSPDCP în 72 de ore</strong> și vă vom informa direct dacă riscul
            este ridicat, conform art. 33–34 GDPR.
          </Li>
        </ul>
      </Section>

      <Section icon={EnvelopeSimple} title="8. Contact DPO și modificări ale politicii" color="#00e5a0">
        <p>
          Responsabilul cu protecția datelor (DPO) poate fi contactat pentru orice solicitare
          legată de prelucrarea datelor dvs. cu caracter personal:
        </p>
        <ul className="space-y-2 mt-1">
          <Li>Email: <strong className="text-accent">dpo@alexcomputers.ro</strong></Li>
          <Li>Adresă poștală: SC Alex Computers SRL, Str. Electronicii nr. 12, sector 2, București 021234, cu mențiunea <strong>„GDPR – Date personale"</strong></Li>
        </ul>
        <p className="mt-3">
          Această politică poate fi actualizată periodic pentru a reflecta modificări legislative,
          tehnologice sau ale serviciilor noastre. Vă vom notifica prin email cu cel puțin{' '}
          <strong>15 zile înainte</strong> de intrarea în vigoare a oricărei modificări semnificative.
          Versiunea curentă este întotdeauna disponibilă la <strong>alexcomputers.ro/confidentialitate</strong>.
        </p>
      </Section>
    </div>
  )
}
