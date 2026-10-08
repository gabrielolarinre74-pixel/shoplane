import { Plus } from 'lucide-react'
import { formatMoney } from '@/lib/money'
import type { Product } from '@/lib/types'
import { useStore } from '@/store'
import { ProductArt } from './ProductArt'
import { StockBadge, stockState } from './StockBadge'
import { QuantityStepper } from './QuantityStepper'
import { maxQuantity } from '@/lib/cart'

export function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const currency = useStore((s) => s.shop.currency)
  const qty = useStore((s) => s.cart.find((l) => l.productId === product.id)?.quantity ?? 0)
  const setQuantity = useStore((s) => s.setQuantity)
  const soldOut = stockState(product) === 'sold-out'

  return (
    <article className='group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-pop'>
      <button type='button' onClick={onOpen} className='relative aspect-[4/3] overflow-hidden' aria-label={`View ${product.name}`}>
        <ProductArt product={product} className='transition duration-500 group-hover:scale-[1.04]' />
        <span className='absolute top-3 left-3 flex gap-1.5'>
          {product.featured && !soldOut && <span className='rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-900 shadow-sm backdrop-blur'>Popular</span>}
          <StockBadge product={product} />
        </span>
      </button>
      <div className='flex flex-1 flex-col p-4'>
        <div className='flex items-start justify-between gap-3'>
          <h3 className='font-semibold tracking-tight'>
            <button type='button' onClick={onOpen} className='text-left hover:underline'>
              {product.name}
            </button>
          </h3>
          <span className='tabular font-semibold'>{formatMoney(product.price, currency)}</span>
        </div>
        <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>{product.description}</p>
        <div className='mt-auto flex items-center justify-between pt-4'>
          <span className='text-xs font-medium text-muted-foreground'>{product.category}</span>
          {qty > 0 ? (
            <QuantityStepper size='sm' label={product.name} value={qty} max={maxQuantity(product)} onChange={(n) => setQuantity(product.id, n)} />
          ) : (
            <button
              type='button'
              disabled={soldOut}
              onClick={() => setQuantity(product.id, 1)}
              className='inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-ink-foreground transition hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground'
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus className='size-4' /> {soldOut ? 'Sold out' : 'Add'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
