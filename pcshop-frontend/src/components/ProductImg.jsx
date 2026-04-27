import { useState } from 'react'
import { Package } from '@phosphor-icons/react'
import { imgUrl } from '../utils/imgUrl'

export default function ProductImg({ src, alt, className = '', iconSize = 28 }) {
  const [broken, setBroken] = useState(false)

  if (!src || broken) return (
    <div className={`flex items-center justify-center bg-white/[0.04] ${className}`}>
      <Package size={iconSize} className="text-muted/20" />
    </div>
  )
  return (
    <img
      src={imgUrl(src)}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  )
}
