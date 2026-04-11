import {
  MagnifyingGlass, Lightning, ShieldCheck, Users, Package, Check, ChatCircleDots, Rocket,
} from '@phosphor-icons/react'

export default function DespreNoi() {
  const values = [
    { Icon: MagnifyingGlass, title: 'Compatibilitate garantată', desc: 'Motorul nostru verifică automat fiecare combinație de componente înainte de finalizarea comenzii, eliminând erorile umane.', color: '#42A5F5' },
    { Icon: Lightning,       title: 'Performanță maximă',       desc: 'Recomandăm configurații optimizate pentru bugetul tău, asigurând cel mai bun raport performanță/preț de pe piață.', color: '#FFD700' },
    { Icon: ShieldCheck,     title: 'Garanție și suport',       desc: 'Oferim garanție pentru toate produsele și suport tehnic specializat prin e-mail sau telefon.', color: '#00E676' },
    { Icon: Rocket,          title: 'Livrare rapidă',           desc: 'Produsele în stoc sunt livrate în 1–3 zile lucrătoare în toată România, cu urmărire în timp real a coletului.', color: '#CE93D8' },
  ]

  const stats = [
    { value: '500+', label: 'Clienți mulțumiți',     Icon: Users,          color: '#42A5F5' },
    { value: '300+', label: 'Produse în catalog',     Icon: Package,        color: '#00E676' },
    { value: '11',   label: 'Reguli compatibilitate', Icon: Check,          color: '#FF9800' },
    { value: '24/7', label: 'Suport online',          Icon: ChatCircleDots, color: '#CE93D8' },
  ]

  const team = [
    { name: 'Alex Andrei', role: 'Fondator & Developer',  avatar: 'A', color: '#42A5F5' },
    { name: 'Alex Andrei', role: 'Specialist Hardware',   avatar: 'A', color: '#00E676' },
    { name: 'Alex Andrei', role: 'Suport Tehnic',         avatar: 'A', color: '#CE93D8' },
  ]

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 0 80px' }}>

      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #0D1B3E 0%, #0A1628 50%, #0D1B3E 100%)',
        borderRadius: '20px', padding: '64px 48px',
        marginBottom: '32px', textAlign: 'center',
        border: '1px solid rgba(66,165,245,0.2)',
        boxShadow: '0 0 80px rgba(41,121,255,0.12)',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '340px', height: '340px', background: 'radial-gradient(circle, rgba(66,165,245,0.13) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(206,147,216,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '8%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(0,230,118,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="w-[72px] h-[72px] rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6 shadow-glow-cyan">
          <Lightning size={34} weight="bold" className="text-dark" />
        </div>

        <h1 style={{ color: '#F1F5F9', fontSize: '48px', fontWeight: '800', margin: '0 0 16px', letterSpacing: '-1px' }}>
          Despre Alex{' '}
          <span style={{ background: 'linear-gradient(135deg, var(--cyan), var(--violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Computers</span>
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '18px', lineHeight: '1.7', maxWidth: '600px', margin: '0 auto' }}>
          Platforma creată pentru a elimina erorile umane în asamblarea sistemelor de calcul și pentru a oferi fiecărui utilizator configurația perfectă.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
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
            <div style={{ color: s.color, fontWeight: '800', fontSize: '30px', lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: '#6B7280', fontSize: '13px', marginTop: '6px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mission + Values */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        {/* Mission */}
        <div className="bg-surface border border-accent/15 rounded-2xl p-8 relative overflow-hidden">
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(66,165,245,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div className="w-10 h-10 rounded-xl bg-accent-dim border border-accent flex items-center justify-center shrink-0">
              <MagnifyingGlass size={20} weight="bold" className="text-accent" />
            </div>
            <h2 style={{ color: '#F1F5F9', fontSize: '20px', fontWeight: '700', margin: 0 }}>
              Misiunea noastră
            </h2>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '15px', lineHeight: '1.8', margin: 0 }}>
            Alex Computers a luat naștere din dorința de a simplifica procesul de achiziție și configurare a unui calculator. Spre deosebire de magazinele clasice, ne concentrăm pe{' '}
            <strong className="text-accent">compatibilitatea hardware absolută</strong>{' '}
            — sistemul nostru inteligent verifică fiecare componentă în parte și te avertizează în timp real dacă există incompatibilități de socket, memorie sau alimentare. Rezultatul: un PC asamblat corect, din prima încercare.
          </p>
        </div>

        {/* Values grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {values.map((v, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${v.color}20`,
              borderRadius: '16px', padding: '20px',
              transition: 'border-color 0.2s, transform 0.2s',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '40px', height: '40px', borderRadius: '12px',
                background: `${v.color}15`, border: `1px solid ${v.color}30`,
                marginBottom: '12px',
              }}>
                <v.Icon size={20} style={{ color: v.color }} />
              </div>
              <h3 style={{ color: '#F1F5F9', fontSize: '14px', fontWeight: '700', margin: '0 0 6px' }}>{v.title}</h3>
              <p style={{ color: '#6B7280', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px', padding: '32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div className="w-10 h-10 rounded-xl bg-violet/15 border border-violet/30 flex items-center justify-center shrink-0">
            <Users size={20} weight="bold" className="text-violet" />
          </div>
          <h2 style={{ color: '#F1F5F9', fontSize: '20px', fontWeight: '700', margin: 0 }}>
            Echipa noastră
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {team.map((m, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${m.color}20`,
              borderRadius: '14px', padding: '20px 22px',
              transition: 'border-color 0.2s, transform 0.2s',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${m.color}80, ${m.color})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '800', fontSize: '22px',
                boxShadow: `0 6px 18px ${m.color}40`,
              }}>{m.avatar}</div>
              <div>
                <p style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px', margin: '0 0 3px' }}>{m.name}</p>
                <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
