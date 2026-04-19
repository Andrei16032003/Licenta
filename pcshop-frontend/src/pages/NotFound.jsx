import { useNavigate } from 'react-router-dom'
import { HouseSimple, MagnifyingGlass } from '@phosphor-icons/react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center px-4">
      <div className="text-[80px] font-display font-extrabold text-white/[0.05] select-none leading-none">
        404
      </div>
      <div className="-mt-4">
        <h1 className="text-2xl font-bold text-primary mb-2">Pagina nu a fost găsită</h1>
        <p className="text-secondary text-[14px] max-w-sm">
          Pagina pe care o cauți nu există sau a fost mutată.
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => navigate('/')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-base
                           font-semibold text-[13px] cursor-pointer hover:shadow-glow-cyan transition-all">
          <HouseSimple size={15} weight="bold" /> Acasă
        </button>
        <button onClick={() => navigate('/catalog')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06]
                           border border-white/10 text-secondary text-[13px] cursor-pointer
                           hover:text-primary hover:border-white/20 transition-all">
          <MagnifyingGlass size={15} weight="bold" /> Catalog
        </button>
      </div>
    </div>
  )
}
