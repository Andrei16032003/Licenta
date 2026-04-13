import { Link } from 'react-router-dom'
import { Scales, X, Trash, Check, Desktop, ArrowLeft } from '@phosphor-icons/react'
import useCompareStore from '../store/compareStore'
import { imgUrl } from '../utils/imgUrl'

export default function Compare() {
  const { items, remove, clear } = useCompareStore()

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <Scales size={64} weight="duotone" className="ph-duotone text-muted mx-auto mb-4" />
        <h2 className="text-primary font-display font-bold text-2xl mb-2">Niciun produs selectat pentru comparare</h2>
        <p className="text-muted text-[15px] mb-7">Adaugă produse din catalog folosind butonul ⚖ de pe carduri.</p>
        <Link to="/catalog" className="btn-primary">Mergi la catalog</Link>
      </div>
    )
  }

  // Collect all unique spec keys from all products
  const allSpecKeys = [...new Set(items.flatMap(p => Object.keys(p.specs || {})))]

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-primary font-display font-extrabold text-2xl mb-1 flex items-center gap-2.5">
            <Scales size={28} weight="duotone" className="ph-duotone text-accent" />
            Comparare produse
          </h1>
          <p className="text-muted text-sm">{items.length} produse selectate</p>
        </div>
        <div className="flex gap-2.5">
          <Link to="/catalog" className="btn-outline flex items-center gap-1.5 text-sm no-underline">
            <ArrowLeft size={14} /> Catalog
          </Link>
          <button
            onClick={clear}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-danger border border-danger/30 hover:bg-danger/10 transition-colors bg-transparent cursor-pointer text-sm font-semibold"
          >
            <Trash size={14} /> Șterge tot
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        className="grid gap-3 items-start"
        style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}
      >
        {/* Product header cards */}
        <div />
        {items.map(p => (
          <div key={p.id} className="bg-surface border border-default rounded-xl p-5 text-center relative">
            <button
              onClick={() => remove(p.id)}
              className="absolute top-2 right-2 bg-danger/10 border border-danger/30 text-danger rounded-lg w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-danger/20 transition-colors"
            >
              <X size={14} />
            </button>
            <div className="product-img-bg h-[140px] rounded-xl mb-3.5 overflow-hidden flex items-center justify-center">
              {p.image_url
                ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-full h-full object-contain p-3" />
                : <Desktop size={48} className="text-muted/30" />
              }
            </div>
            <Link
              to={`/product/${p.id}`}
              className="text-primary font-bold text-sm mb-1.5 leading-snug no-underline hover:text-accent transition-colors"
            >
              {p.name}
            </Link>
            <p className="text-muted text-xs mb-2">{p.brand}</p>
            <p className="text-price font-mono font-extrabold text-xl">{p.price} RON</p>
            {p.old_price && (
              <p className="text-muted line-through text-xs">{p.old_price} RON</p>
            )}
            <div className="mt-2.5">
              {p.stock > 0 ? (
                <span className="text-xs px-3 py-1 rounded-full bg-success/10 text-success border border-success/30 font-semibold">
                  <Check size={10} className="inline mr-0.5" />{p.stock} buc
                </span>
              ) : (
                <span className="text-xs px-3 py-1 rounded-full bg-danger/10 text-danger border border-danger/30 font-semibold">
                  Epuizat
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Category row */}
        <RowLabel label="Categorie" />
        {items.map(p => <Cell key={p.id} value={p.category} />)}

        {/* Specs rows */}
        {allSpecKeys.length > 0 && (
          <>
            <div className="col-span-full my-2" style={{ gridColumn: '1 / -1' }}>
              <p className="text-muted text-xs font-bold uppercase tracking-widest">Specificații tehnice</p>
            </div>
            {allSpecKeys.map(key => {
              const vals = items.map(p => (p.specs || {})[key])
              const allSame = vals.every(v => String(v) === String(vals[0]))
              return (
                <>
                  <RowLabel key={`label-${key}`} label={key} />
                  {items.map((p) => (
                    <Cell
                      key={`${p.id}-${key}`}
                      value={(p.specs || {})[key] !== undefined ? String((p.specs || {})[key]) : '—'}
                      highlight={!allSame && (p.specs || {})[key] !== undefined}
                    />
                  ))}
                </>
              )
            })}
          </>
        )}

        {/* Warranty row */}
        <RowLabel label="Garanție" />
        {items.map(p => <Cell key={p.id} value={p.warranty_months ? `${p.warranty_months} luni` : '—'} />)}
      </div>
    </div>
  )
}

function RowLabel({ label }) {
  return (
    <div className="flex items-center py-3 border-b border-white/[0.05]">
      <span className="text-muted text-xs font-semibold capitalize leading-snug">{label}</span>
    </div>
  )
}

function Cell({ value, highlight }) {
  return (
    <div className={`px-4 py-3 rounded-lg text-sm text-center border ${
      highlight
        ? 'bg-accent-dim border-accent text-accent font-bold'
        : 'bg-base-2/50 border-default text-secondary font-normal'
    }`}>
      {value ?? '—'}
    </div>
  )
}
