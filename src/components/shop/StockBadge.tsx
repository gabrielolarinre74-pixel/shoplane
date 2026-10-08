import type { Product } from '@/lib/types'

export function stockState(p: Pick<Product, 'stock'>) {
  if (p.stock === null) return 'available' as const
  if (p.stock <= 0) return 'sold-out' as const
  if (p.stock <= 3) return 'low' as const
  return 'available' as const
}

export function StockBadge({ product }: { product: Pick<Product, 'stock'> }) {
  const s = stockState(product)
  if (s === 'sold-out') return <span className='rounded-full bg-neutral-900/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur'>Sold out</span>
  if (s === 'low') return <span className='rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-red-600 shadow-sm backdrop-blur'>Only {product.stock} left</span>
  return null
}
