import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Copy, MessageCircle, ShoppingBag, Store, Tag, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Sheet } from '@/components/ui/sheet'
import { findPromo, maxQuantity, priceCart, resolveCart } from '@/lib/cart'
import { formatMoney } from '@/lib/money'
import { orderMessage, whatsappLink } from '@/lib/orders'
import type { Customer, Order } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import { ProductArt } from './ProductArt'
import { QuantityStepper } from './QuantityStepper'

type Step = 'cart' | 'details' | 'done'

const customerSchema = (delivery: boolean) =>
  z.object({
    name: z.string().trim().min(2, 'Tell the shop who the order is for').max(80),
    phone: z
      .string()
      .trim()
      .refine((v) => v.replace(/\D/g, '').length >= 7, 'Add a phone number the shop can reach'),
    address: delivery ? z.string().trim().min(5, 'Add a delivery address').max(200) : z.string(),
    note: z.string().max(300),
  })

export function CartSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState<Step>('cart')
  const [placed, setPlaced] = useState<Order | null>(null)
  const title = step === 'cart' ? 'Your order' : step === 'details' ? 'Checkout' : 'Order ready to send'
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) {
          setStep('cart')
          setPlaced(null)
        }
      }}
      title={title}
    >
      {step === 'cart' && <CartStep onNext={() => setStep('details')} />}
      {step === 'details' && (
        <DetailsStep
          onBack={() => setStep('cart')}
          onPlaced={(o) => {
            setPlaced(o)
            setStep('done')
          }}
        />
      )}
      {step === 'done' && placed && <DoneStep order={placed} onClose={() => onOpenChange(false)} />}
    </Sheet>
  )
}

function useCartPrice() {
  const cart = useStore((s) => s.cart)
  const products = useStore((s) => s.products)
  const shop = useStore((s) => s.shop)
  const fulfilment = useStore((s) => s.fulfilment)
  const promo = useStore((s) => s.promo)
  const lines = useMemo(() => resolveCart(cart, products), [cart, products])
  const price = useMemo(() => priceCart(lines, shop, { fulfilment, promo }), [lines, shop, fulfilment, promo])
  return { lines, price, shop, fulfilment, promo }
}

function Totals({ price, currency, fulfilment }: { price: ReturnType<typeof priceCart>; currency: string; fulfilment: string }) {
  const m = (n: number) => formatMoney(n, currency)
  return (
    <dl className='space-y-1.5 text-sm'>
      <div className='flex justify-between text-muted-foreground'>
        <dt>Subtotal</dt>
        <dd className='tabular'>{m(price.subtotal)}</dd>
      </div>
      {price.discount > 0 && (
        <div className='flex justify-between text-primary'>
          <dt>Promo {price.promo}</dt>
          <dd className='tabular'>−{m(price.discount)}</dd>
        </div>
      )}
      {fulfilment === 'delivery' && (
        <div className='flex justify-between text-muted-foreground'>
          <dt>Delivery</dt>
          <dd className='tabular'>{price.delivery > 0 ? m(price.delivery) : 'Free'}</dd>
        </div>
      )}
      <div className='flex justify-between border-t pt-2 text-base font-semibold'>
        <dt>Total</dt>
        <dd className='tabular'>{m(price.total)}</dd>
      </div>
    </dl>
  )
}

function CartStep({ onNext }: { onNext: () => void }) {
  const { lines, price, shop, fulfilment, promo } = useCartPrice()
  const setQuantity = useStore((s) => s.setQuantity)
  const setFulfilment = useStore((s) => s.setFulfilment)
  const setPromo = useStore((s) => s.setPromo)
  const [code, setCode] = useState(promo)
  const m = (n: number) => formatMoney(n, shop.currency)

  if (!lines.length) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center p-8 text-center'>
        <span className='bg-brand flex size-14 items-center justify-center rounded-2xl text-white'>
          <ShoppingBag className='size-6' />
        </span>
        <p className='mt-4 font-semibold'>Your bag is empty</p>
        <p className='mt-1 text-sm text-muted-foreground'>Add something tasty to get started.</p>
      </div>
    )
  }

  const options = [
    shop.acceptPickup && { value: 'pickup' as const, label: 'Pickup', icon: Store, hint: 'Free' },
    shop.acceptDelivery && { value: 'delivery' as const, label: 'Delivery', icon: Truck, hint: shop.freeDeliveryOver > 0 ? `Free over ${m(shop.freeDeliveryOver)}` : m(shop.deliveryFee) },
  ].filter(Boolean) as { value: 'pickup' | 'delivery'; label: string; icon: React.ElementType; hint: string }[]
  const effective = options.some((o) => o.value === fulfilment) ? fulfilment : (options[0]?.value ?? 'pickup')

  return (
    <>
      <ul className='flex-1 divide-y overflow-y-auto px-5'>
        {lines.map(({ product, quantity, lineTotal }) => (
          <li key={product.id} className='flex items-center gap-3 py-4'>
            <div className='size-16 shrink-0 overflow-hidden rounded-2xl'>
              <ProductArt product={product} />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium'>{product.name}</p>
              <p className='text-sm text-muted-foreground'>{m(product.price)} each</p>
            </div>
            <div className='flex flex-col items-end gap-1.5'>
              <span className='tabular text-sm font-semibold'>{m(lineTotal)}</span>
              <QuantityStepper size='sm' label={product.name} value={quantity} max={maxQuantity(product)} onChange={(n) => setQuantity(product.id, n)} />
            </div>
          </li>
        ))}
      </ul>
      <div className='space-y-4 border-t bg-surface p-5'>
        {options.length > 1 && (
          <div className='grid grid-cols-2 gap-2' role='radiogroup' aria-label='Pickup or delivery'>
            {options.map((o) => (
              <button
                key={o.value}
                type='button'
                role='radio'
                aria-checked={effective === o.value}
                onClick={() => setFulfilment(o.value)}
                className={cn('flex items-center gap-2.5 rounded-2xl border bg-card px-3 py-2.5 text-left transition', effective === o.value && 'border-primary ring-2 ring-primary/25')}
              >
                <o.icon className='size-4 text-primary' />
                <span>
                  <span className='block text-sm font-semibold'>{o.label}</span>
                  <span className='block text-xs text-muted-foreground'>{o.hint}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        {effective === 'delivery' && price.freeDeliveryRemaining !== null && (
          <div>
            <p className='text-xs font-medium text-muted-foreground'>
              {price.freeDeliveryRemaining > 0 ? `Add ${m(price.freeDeliveryRemaining)} more for free delivery` : 'You’ve unlocked free delivery'}
            </p>
            <div className='mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted'>
              <div className='bg-brand h-full rounded-full transition-all' style={{ width: `${Math.min(100, ((shop.freeDeliveryOver - price.freeDeliveryRemaining) / shop.freeDeliveryOver) * 100)}%` }} />
            </div>
          </div>
        )}
        <form
          className='flex gap-2'
          onSubmit={(e) => {
            e.preventDefault()
            if (!code.trim()) {
              setPromo('')
              return
            }
            if (findPromo(shop, code)) {
              setPromo(code.trim().toUpperCase())
              toast.success('Promo applied')
            } else {
              setPromo('')
              toast.error('That code isn’t valid')
            }
          }}
        >
          <div className='relative flex-1'>
            <Tag className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input aria-label='Promo code' placeholder='Promo code' className='rounded-full pl-9 uppercase placeholder:normal-case' value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <Button type='submit'>Apply</Button>
        </form>
        <Totals price={price} currency={shop.currency} fulfilment={effective} />
        <Button
          variant='primary'
          className='h-12 w-full justify-center text-base'
          onClick={() => {
            if (effective !== fulfilment) setFulfilment(effective)
            onNext()
          }}
        >
          Checkout · {m(price.total)}
        </Button>
      </div>
    </>
  )
}

function DetailsStep({ onBack, onPlaced }: { onBack: () => void; onPlaced: (o: Order) => void }) {
  const { price, shop, fulfilment } = useCartPrice()
  const placeOrder = useStore((s) => s.placeOrder)
  const [values, setValues] = useState<Customer>({ name: '', phone: '', address: '', note: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({})
  const delivery = fulfilment === 'delivery'
  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = customerSchema(delivery).safeParse(values)
    if (!parsed.success) {
      const next: typeof errors = {}
      for (const i of parsed.error.issues) next[i.path[0] as keyof Customer] ??= i.message
      setErrors(next)
      return
    }
    const order = placeOrder(parsed.data)
    if (!order) {
      toast.error('Your bag is empty')
      onBack()
      return
    }
    onPlaced(order)
  }
  return (
    <form onSubmit={submit} noValidate className='flex flex-1 flex-col'>
      <div className='flex-1 space-y-4 overflow-y-auto p-5'>
        <button type='button' onClick={onBack} className='inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground'>
          <ArrowLeft className='size-4' /> Back to bag
        </button>
        <Field label='Your name' htmlFor='o-name' error={errors.name}>
          <Input id='o-name' autoComplete='name' value={values.name} onChange={set('name')} />
        </Field>
        <Field label='Phone / WhatsApp' htmlFor='o-phone' error={errors.phone}>
          <Input id='o-phone' type='tel' autoComplete='tel' value={values.phone} onChange={set('phone')} placeholder='+1 555 0199' />
        </Field>
        {delivery ? (
          <Field label='Delivery address' htmlFor='o-address' error={errors.address}>
            <Textarea id='o-address' rows={2} autoComplete='street-address' value={values.address} onChange={set('address')} />
          </Field>
        ) : (
          <div className='rounded-2xl bg-primary-soft p-4 text-sm'>
            <p className='font-semibold'>Pickup at {shop.name}</p>
            <p className='whitespace-pre-line text-muted-foreground'>{shop.pickupAddress}</p>
            {shop.openingHours && <p className='mt-1 text-muted-foreground'>{shop.openingHours}</p>}
          </div>
        )}
        <Field label='Note for the shop (optional)' htmlFor='o-note' error={errors.note}>
          <Textarea id='o-note' rows={2} value={values.note} onChange={set('note')} placeholder='Allergies, pickup time, gate code…' />
        </Field>
      </div>
      <div className='space-y-4 border-t bg-surface p-5'>
        <Totals price={price} currency={shop.currency} fulfilment={fulfilment} />
        <Button type='submit' variant='primary' className='h-12 w-full justify-center text-base'>
          Place order
        </Button>
        <p className='text-center text-xs text-muted-foreground'>Next, you’ll send the order to the shop on WhatsApp. Pay as the shop instructs.</p>
      </div>
    </form>
  )
}

function DoneStep({ order, onClose }: { order: Order; onClose: () => void }) {
  const shop = useStore((s) => s.shop)
  const message = orderMessage(order, shop)
  return (
    <div className='flex flex-1 flex-col overflow-y-auto p-5'>
      <div className='text-center'>
        <span className='bg-brand shadow-glow mx-auto flex size-14 items-center justify-center rounded-full text-white'>
          <Check className='size-7' />
        </span>
        <p className='mt-4 text-xl font-semibold tracking-tight'>Order {order.number} is ready</p>
        <p className='mt-1 text-sm text-muted-foreground'>Send it to {shop.name} on WhatsApp so they can confirm it.</p>
      </div>
      <pre className='mt-5 flex-1 overflow-auto rounded-2xl border bg-surface p-4 font-sans text-sm whitespace-pre-wrap'>{message}</pre>
      <div className='mt-5 grid gap-2'>
        <a href={whatsappLink(shop.whatsapp, message)} target='_blank' rel='noreferrer' className='inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0a0a0a] text-base font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black'>
          <MessageCircle className='size-5' /> Send on WhatsApp
        </a>
        <Button
          className='justify-center'
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(message)
              toast.success('Order copied')
            } catch {
              toast.error('Copy failed. Select the text and copy it.')
            }
          }}
        >
          <Copy /> Copy order text
        </Button>
        <Button variant='ghost' className='justify-center' onClick={onClose}>
          Keep browsing
        </Button>
      </div>
    </div>
  )
}
