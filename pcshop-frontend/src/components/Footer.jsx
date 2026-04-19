import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Lightning, EnvelopeSimple, Phone, ArrowRight } from '@phosphor-icons/react'
import LegalModal from './LegalModal'

const quickLinks = [
  { to: '/catalog', label: 'Catalog Produse' },
  { to: '/builder', label: 'PC Builder'      },
  { to: '/chat',    label: 'Prebuilt PC'     },
  { to: '/faq',     label: 'FAQ'             },
]

const navLinks = [
  { to: '/despre-noi', label: 'Despre Noi' },
  { to: '/contact',    label: 'Contact'    },
]

const legalButtons = [
  { modal: 'termeni',           label: 'Termeni și Condiții'        },
  { modal: 'confidentialitate', label: 'Politică Confidențialitate' },
]

export default function Footer() {
  const [modal, setModal] = useState(null)

  return (
    <>
      {modal && <LegalModal type={modal} onClose={() => setModal(null)} />}

      <footer className="border-t border-white/[0.06] bg-base/95 mt-12">
        <div className="max-w-[1500px] mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Col 1 — Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 no-underline mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center
                              shadow-glow-cyan group-hover:shadow-[0_0_28px_rgba(14,246,255,0.5)]
                              transition-shadow duration-200">
                <Lightning size={18} weight="bold" color="#050910" />
              </div>
              <span className="font-display font-extrabold text-base text-primary">
                ALEX <span className="text-accent">COMPUTERS</span>
              </span>
            </Link>
            <p className="text-secondary text-sm leading-relaxed mb-5 max-w-[240px]">
              Componentele tale, configurate perfect. Livrare rapidă, garanție 24 luni.
            </p>
            <div className="flex flex-col gap-2.5">
              <a href="mailto:aa387@student.ugal.ro"
                 className="flex items-center gap-2 text-muted text-sm no-underline
                            hover:text-accent transition-colors duration-150">
                <EnvelopeSimple size={14} weight="duotone" className="text-accent shrink-0" />
                aa387@student.ugal.ro
              </a>
              <a href="tel:0770648476"
                 className="flex items-center gap-2 text-muted text-sm no-underline
                            hover:text-accent transition-colors duration-150">
                <Phone size={14} weight="duotone" className="text-accent shrink-0" />
                0770 648 476
              </a>
            </div>
          </div>

          {/* Col 2 — Quick Links */}
          <div>
            <h4 className="font-display font-bold text-primary text-sm uppercase tracking-widest mb-4">
              Navigare
            </h4>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              {quickLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}
                        className="flex items-center gap-1.5 text-sm text-secondary no-underline
                                   hover:text-accent transition-colors duration-150 group">
                    <ArrowRight size={12} weight="bold"
                                className="text-accent opacity-0 group-hover:opacity-100 -translate-x-1
                                           group-hover:translate-x-0 transition-all duration-150" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Legal */}
          <div>
            <h4 className="font-display font-bold text-primary text-sm uppercase tracking-widest mb-4">
              Informații
            </h4>
            <ul className="flex flex-col gap-2 list-none p-0 m-0 mb-6">
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}
                        className="flex items-center gap-1.5 text-sm text-secondary no-underline
                                   hover:text-accent transition-colors duration-150 group">
                    <ArrowRight size={12} weight="bold"
                                className="text-accent opacity-0 group-hover:opacity-100 -translate-x-1
                                           group-hover:translate-x-0 transition-all duration-150" />
                    {label}
                  </Link>
                </li>
              ))}
              {legalButtons.map(({ modal: m, label }) => (
                <li key={m}>
                  <button onClick={() => setModal(m)}
                          className="flex items-center gap-1.5 text-sm text-secondary
                                     hover:text-accent transition-colors duration-150 group
                                     bg-transparent border-none p-0 cursor-pointer">
                    <ArrowRight size={12} weight="bold"
                                className="text-accent opacity-0 group-hover:opacity-100 -translate-x-1
                                           group-hover:translate-x-0 transition-all duration-150" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-muted text-xs">
              © {new Date().getFullYear()} Alex Computers.<br />Toate drepturile rezervate.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.04] py-3 px-8">
          <p className="text-muted text-xs text-center">
            Prețurile afișate includ TVA. Ofertele sunt valabile în limita stocului disponibil.
          </p>
        </div>
      </footer>
    </>
  )
}
