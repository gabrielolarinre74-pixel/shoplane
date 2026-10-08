import { useState } from 'react'
import * as D from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { maxQuantity } from '@/lib/cart'
import { formatMoney } from '@/lib/money'
import type { Product } from '@/lib/types'
import { useStore } from '@/store'
import { ProductArt } from './ProductArt'
import { QuantityStepper } from './QuantityStepper'
import { stockState } from './StockBadge'

export function QuickView({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return (
    <D.Root open={!!product} onOpenChange={(o) => !o && onClose()}>
      <D.Portal>
        <D.Overlay className='fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]' />
        <D.Content className='fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-card shadow-pop focus:outline-none sm:grid-cols-2'>
          {product && <Body key={product.id} product={product} onClose={onClose} />}
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

function Body({ product, onClose }: { product: Product; onClose: () => void }) {
  const currency = useStore((s) => s.shop.currency)
  const inCart = useStore((s) => s.cart.find((l) => l.productId === product.id)?.quantity ?? 0)
  const addToCart = useStore((s) => s.addToCart)
  const max = Math.max(0, maxQuantity(product) - inCart)
  const [qty, setQty] = useState(max > 0 ? 1 : 0)
  const s = stockState(product)
  return (
    <>
      <div className='aspect-square sm:aspect-auto'>
        <ProductArt product={product} />
      </div>
      <div className='flex flex-col p-7'>
        <D.Close className='absolute top-4 right-4 rounded-full bg-white/80 p-2 text-neutral-700 backdrop-blur hover:bg-white' aria-label='Close'>
          <X className='size-4' />
        </D.Close>
        <p className='text-xs font-semibold tracking-wide text-primary uppercase'>{product.category}</p>
        <D.Title className='mt-1 text-2xl font-semibold tracking-tight'>{product.name}</D.Title>
        <p className='tabular mt-2 text-xl font-semibold'>{formatMoney(product.price, currency)}</p>
        <D.Description className='mt-4 text-muted-foreground'>{product.description}</D.Description>
        <p className='mt-4 text-sm font-medium'>
          {s === 'sold-out' ? (
            <span className='text-danger'>Sold out for today</span>
          ) : s === 'low' ? (
            <span className='text-danger'>Only {product.stock} left</span>
          ) : (
            <span className='text-muted-foreground'>In stock</span>
          )}
          {inCart > 0 && <span className='text-muted-foreground'> · {inCart} in your cart</span>}
        </p>
        <div className='mt-auto flex items-center gap-3 pt-8'>
          <QuantityStepper label='quantity' value={qty} max={max} onChange={(n) => setQty(Math.max(0, Math.min(max, n)))} />
          <button
            type='button'
            disabled={qty === 0}
            onClick={() => {
              addToCart(product.id, qty)
              toast.success(`${qty} × ${product.name} added`)
              onClose()
            }}
            className='bg-brand shadow-glow inline-flex h-11 flex-1 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50'
          >
            Add {qty > 0 ? formatMoney(product.price * qty, currency) : ''}
          </button>
        </div>
      </div>
    </>
  )
}
