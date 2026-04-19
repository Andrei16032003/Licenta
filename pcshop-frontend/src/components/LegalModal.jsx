import { useEffect } from 'react'
import { X } from '@phosphor-icons/react'
import Termeni from '../pages/Termeni'
import Confidentialitate from '../pages/Confidentialitate'

export default function LegalModal({ type, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
         onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-3xl max-h-[88vh] flex flex-col
                      bg-[#0d1117] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden"
           onClick={e => e.stopPropagation()}>

        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]
                        bg-white/[0.02] shrink-0">
          <span className="text-primary font-bold text-[15px]">
            {type === 'termeni' ? 'Termeni și Condiții' : 'Politică de Confidențialitate'}
          </span>
          <button onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.1]
                             flex items-center justify-center text-muted hover:text-primary
                             hover:bg-white/[0.1] transition-all cursor-pointer">
            <X size={15} weight="bold" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-2">
          {type === 'termeni' ? <Termeni /> : <Confidentialitate />}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-white/[0.07] bg-white/[0.02]
                        flex justify-end">
          <button onClick={onClose}
                  className="btn-primary px-6 py-2 text-[13px]">
            Am înțeles
          </button>
        </div>
      </div>
    </div>
  )
}
