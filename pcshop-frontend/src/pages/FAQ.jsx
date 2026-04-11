import { useState } from 'react'
import {
  Question, Lightning, Package, ArrowCounterClockwise,
  Cpu, ChatCircleDots, EnvelopeSimple, CaretDown,
} from '@phosphor-icons/react'

/* Intrebarile sunt grupate pe categorii cu culori distincte per categorie */
const faqs = [
  /* --- Comenzi & Plati --- */
  {
    cat: 'Comenzi',
    color: '#00E676',
    q: 'Cum plasez o comandă?',
    a: 'Adaugă produsele dorite în coș, accesează pagina de Coș și apasă "Finalizează comanda". Completează adresa de livrare, alege metoda de plată și confirmă comanda. Vei primi un email de confirmare imediat după plasare.',
  },
  {
    cat: 'Plăți',
    color: '#00E676',
    q: 'Care sunt metodele de plată acceptate?',
    a: 'Acceptăm plata cu card bancar (Visa, Mastercard, Maestro), transfer bancar și plata la livrare (ramburs). Tranzacțiile cu cardul sunt securizate prin SSL/TLS 256-bit. Nu stocăm datele cardului tău.',
  },
  {
    cat: 'Plăți',
    color: '#00E676',
    q: 'Pot plăti în rate?',
    a: 'Momentan nu oferim plata în rate direct prin platformă. Poți folosi serviciile de rate ale băncii tale prin plata cu cardul de credit. Explorăm integrarea unor soluții de tip Buy Now Pay Later în viitor.',
  },
  {
    cat: 'Comenzi',
    color: '#00E676',
    q: 'Pot modifica sau anula o comandă după plasare?',
    a: 'Poți solicita modificarea sau anularea comenzii în primele 2 ore de la plasare, contactând echipa noastră la pagina Contact. Dacă comanda a intrat deja în procesare sau a fost expediată, nu mai poate fi modificată — vei putea iniția un retur după primire.',
  },

  /* --- Livrare --- */
  {
    cat: 'Livrare',
    color: '#FF9800',
    q: 'Cât durează livrarea?',
    a: 'Produsele în stoc sunt livrate în 1–3 zile lucrătoare în toată România. Comenzile plasate înainte de ora 14:00 (luni–vineri) sunt procesate în aceeași zi. În perioadele de vârf (Black Friday, sărbători) termenul poate fi de 3–5 zile.',
  },
  {
    cat: 'Livrare',
    color: '#FF9800',
    q: 'Cât costă livrarea?',
    a: 'Livrarea este gratuită pentru comenzile peste 500 RON. Sub această valoare, costul de livrare este de 19,99 RON prin curier rapid. Livrăm exclusiv în România.',
  },
  {
    cat: 'Livrare',
    color: '#FF9800',
    q: 'Cum urmăresc coletul meu?',
    a: 'După expediere, primești un email cu numărul de tracking și link-ul de urmărire al curierului. Poți vedea statusul comenzii și în contul tău, la secțiunea "Comenzile mele".',
  },

  /* --- Retururi & Garantie --- */
  {
    cat: 'Retururi',
    color: '#FF5252',
    q: 'Pot returna un produs?',
    a: 'Da, beneficiezi de dreptul legal de returnare în 14 zile calendaristice de la primirea produsului, fără a fi necesară o justificare (Legea nr. 449/2003). Produsul trebuie să fie în starea originală, cu ambalajul intact și fără urme de utilizare.',
  },
  {
    cat: 'Retururi',
    color: '#FF5252',
    q: 'Cum inițiez un retur?',
    a: 'Accesează contul tău → secțiunea "Retururile mele" → apasă "Initializeaza retur" pe comanda dorită. Completează motivul și alege dacă dorești ridicare prin curier sau predare la sediu. Rambursarea se face în 5–7 zile lucrătoare după recepționarea produsului.',
  },
  {
    cat: 'Garanție',
    color: '#FFD700',
    q: 'Oferiți garanție pentru produsele vândute?',
    a: 'Toate produsele beneficiază de garanție comercială conform specificațiilor producătorului — de regulă 2–3 ani pentru componente PC. Garanția acoperă defectele de fabricație și nu se aplică în cazul deteriorărilor fizice, supratensiunilor sau modificărilor neautorizate.',
  },
  {
    cat: 'Garanție',
    color: '#FFD700',
    q: 'Ce fac dacă produsul primit este defect?',
    a: 'Contactează-ne în maxim 48h de la primire prin pagina Contact sau direct din secțiunea "Service" din contul tău. Vom aranja ridicarea produsului prin curier pe cheltuiala noastră și îl vom înlocui sau rambursa în funcție de disponibilitate.',
  },

  /* --- Cont & Platforma --- */
  {
    cat: 'Cont',
    color: '#CE93D8',
    q: 'Trebuie să am cont pentru a cumpăra?',
    a: 'Nu este obligatoriu — poți cumpăra și ca vizitator (guest). Totuși, crearea unui cont gratuit îți permite să urmărești comenzile, să salvezi wishlist-ul, să folosești vouchere și să gestionezi retururile mai ușor.',
  },
  {
    cat: 'Cont',
    color: '#CE93D8',
    q: 'Mi-am uitat parola. Ce fac?',
    a: 'Pe pagina de autentificare apasă "Am uitat parola". Vei primi un email cu un link de resetare valabil 30 de minute. Dacă nu găsești emailul, verifică și folderul Spam.',
  },

  /* --- PC Builder & Tehnic --- */
  {
    cat: 'PC Builder',
    color: 'var(--cyan)',
    q: 'Cum verifică sistemul compatibilitatea componentelor?',
    a: 'Motorul nostru compară socket-urile CPU cu plăcile de bază, verifică tipul de RAM (DDR4/DDR5), calculează consumul total față de puterea sursei și validează form-factor-ul față de carcasă. Toate verificările sunt în timp real.',
  },
  {
    cat: 'PC Builder',
    color: 'var(--cyan)',
    q: 'Pot adăuga o configurație din PC Builder direct în coș?',
    a: 'Da! După ce ai completat toate componentele și verificarea de compatibilitate a trecut, apasă "Adaugă tot în coș" din panoul de sumar. Toate componentele vor fi adăugate simultan în coșul tău.',
  },
]

const stats = [
  { Icon: Question,              value: faqs.length, label: 'Intrebari', color: 'var(--cyan)'  },
  { Icon: Lightning,             value: '24/7', label: 'Suport online', color: '#00E676'       },
  { Icon: Package,               value: '1–3',  label: 'Zile livrare',  color: '#FF9800'       },
  { Icon: ArrowCounterClockwise, value: '14',   label: 'Zile retur',    color: '#CE93D8'       },
]

export default function FAQ() {
  const [open, setOpen] = useState(null)

  // Imparte intrebarile in doua coloane egale
  const half = Math.ceil(faqs.length / 2)
  const left = faqs.slice(0, half)
  const right = faqs.slice(half)

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 0 80px' }}>

      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0D1B3E 0%, #0A1628 50%, #0D1B3E 100%)',
        borderRadius: '20px', padding: '56px 48px',
        marginBottom: '36px', textAlign: 'center',
        border: '1px solid rgba(66,165,245,0.2)',
        boxShadow: '0 0 80px rgba(41,121,255,0.12)',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(66,165,245,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '240px', height: '240px', background: 'radial-gradient(circle, rgba(206,147,216,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5 shadow-glow-cyan">
          <Question size={30} weight="bold" className="text-dark" />
        </div>
        <h1 style={{ color: '#F1F5F9', fontSize: '44px', fontWeight: '800', margin: '0 0 14px', letterSpacing: '-0.5px' }}>
          Întrebări{' '}
          <span style={{ background: 'linear-gradient(135deg, var(--cyan), var(--violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Frecvente</span>
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '18px', margin: '0 auto', maxWidth: '540px' }}>
          Răspunsuri la cele mai comune întrebări despre platforma și serviciile noastre.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '36px' }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${s.color}25`,
            borderRadius: '16px', padding: '24px 20px', textAlign: 'center',
            transition: 'border-color 0.2s, transform 0.2s',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '48px', height: '48px', borderRadius: '14px',
              background: `${s.color}18`, border: `1px solid ${s.color}35`,
              marginBottom: '12px',
            }}>
              <s.Icon size={22} style={{ color: s.color }} />
            </div>
            <div style={{ color: s.color, fontWeight: '800', fontSize: '28px', lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: '#6B7280', fontSize: '13px', marginTop: '6px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two-column accordion */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '36px' }}>
        {[left, right].map((col, ci) => (
          <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {col.map((item, idx) => {
              const i = ci * 4 + idx
              const isOpen = open === i
              return (
                <div key={i} style={{
                  background: isOpen ? `${item.color}08` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isOpen ? item.color + '45' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '14px', overflow: 'hidden',
                  transition: 'border-color 0.2s, background 0.2s',
                }}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '20px 22px', background: 'transparent', border: 'none',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '14px',
                    }}>
                    <span style={{
                      flexShrink: 0,
                      background: `${item.color}18`,
                      border: `1px solid ${item.color}40`,
                      color: item.color,
                      fontSize: '10px', fontWeight: '700',
                      padding: '3px 9px', borderRadius: '20px',
                      whiteSpace: 'nowrap',
                    }}>{item.cat}</span>
                    <span style={{
                      flex: 1,
                      color: isOpen ? item.color : '#F1F5F9',
                      fontSize: '15px', fontWeight: '600', lineHeight: '1.4',
                      transition: 'color 0.2s',
                    }}>
                      {item.q}
                    </span>
                    <CaretDown
                      size={17}
                      style={{ color: isOpen ? item.color : undefined, transition: 'transform 0.25s' }}
                      className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} ${isOpen ? '' : 'text-muted'}`}
                    />
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 22px 20px',
                      color: '#9CA3AF', fontSize: '14px', lineHeight: '1.75',
                      borderTop: `1px solid ${item.color}20`,
                      paddingTop: '16px',
                    }}>
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Bottom info cards + CTA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {/* Card 1 */}
        <div className="bg-accent-dim border border-accent/20 rounded-2xl p-7 flex flex-col gap-2.5">
          <Cpu size={28} weight="duotone" className="ph-duotone text-accent" />
          <h3 style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: '700', margin: 0 }}>PC Builder inteligent</h3>
          <p style={{ color: '#6B7280', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
            Verificare automată a compatibilității pentru toate cele 8 componente — socket, RAM, alimentare, formfactor.
          </p>
        </div>
        {/* Card 2 */}
        <div className="bg-violet/[0.05] border border-violet/20 rounded-2xl p-7 flex flex-col gap-2.5">
          <ChatCircleDots size={28} weight="duotone" className="ph-duotone text-violet" />
          <h3 style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: '700', margin: 0 }}>Asistent AI</h3>
          <p style={{ color: '#6B7280', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
            Introdu bugetul și tipul de utilizare — sistemul îți recomandă instant configurația optimă.
          </p>
        </div>
        {/* CTA */}
        <div className="bg-gradient-to-br from-accent/[0.1] to-transparent border border-accent/30 rounded-2xl p-7 flex flex-col items-center justify-center text-center gap-3">
          <EnvelopeSimple size={28} weight="duotone" className="ph-duotone text-accent" />
          <h3 style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: '700', margin: 0 }}>
            Nu ai găsit răspunsul?
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>
            Echipa noastră îți răspunde în cel mult 24h.
          </p>
          <a href="/contact" className="btn-primary">
            Contactează-ne →
          </a>
        </div>
      </div>
    </div>
  )
}
