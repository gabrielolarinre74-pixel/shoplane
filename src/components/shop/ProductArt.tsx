import {
  Cake,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Donut,
  IceCreamCone,
  Package,
  Sandwich,
  Wheat,
} from 'lucide-react'
import type { ArtKey, Product } from '@/lib/types'
import { cn } from '@/lib/utils'

const ART: Record<ArtKey, { icon: React.ElementType; bg: string }> = {
  coffee: { icon: Coffee, bg: 'from-[#e9f9f7] to-[#cdeff3]' },
  croissant: { icon: Croissant, bg: 'from-[#fff7e6] to-[#fde7c2]' },
  cake: { icon: Cake, bg: 'from-[#fdf0ee] to-[#f9d9d3]' },
  cookie: { icon: Cookie, bg: 'from-[#f8f1e9] to-[#ecdcc8]' },
  sandwich: { icon: Sandwich, bg: 'from-[#eef8ec] to-[#d7eed2]' },
  drink: { icon: CupSoda, bg: 'from-[#eaf6fd] to-[#cbe7f8]' },
  donut: { icon: Donut, bg: 'from-[#fff4ec] to-[#fbdcc6]' },
  box: { icon: Package, bg: 'from-[#eef4f7] to-[#d6e3ea]' },
  wheat: { icon: Wheat, bg: 'from-[#fbf6e8] to-[#efe2bd]' },
  icecream: { icon: IceCreamCone, bg: 'from-[#eef9fb] to-[#d2eef4]' },
}

/** Product image: the uploaded photo, or a soft illustrated tile when there is none. */
export function ProductArt({
  product,
  className,
  iconClassName,
}: {
  product: Pick<Product, 'art' | 'image' | 'name'>
  className?: string
  iconClassName?: string
}) {
  if (product.image) {
    return (
      <img
        src={product.image}
        alt={product.name}
        className={cn('size-full object-cover', className)}
      />
    )
  }
  const { icon: Icon, bg } = ART[product.art] ?? ART.box
  return (
    <div
      role="img"
      aria-label={product.name}
      className={cn('flex size-full items-center justify-center bg-gradient-to-br', bg, className)}
    >
      <Icon
        strokeWidth={1.4}
        className={cn('size-1/3 text-neutral-800/75 drop-shadow-sm', iconClassName)}
      />
    </div>
  )
}
