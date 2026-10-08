import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { ArrowRight, Clock, MapPin, Search, ShoppingBag, Truck } from 'lucide-react'
import { CartSheet } from '@/components/shop/CartSheet'
import { ProductArt } from '@/components/shop/ProductArt'
import { ProductCard } from '@/components/shop/ProductCard'
import { QuickView } from '@/components/shop/QuickView'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Select } from '@/components/ui/field'
import { LogoMark } from '@/components/Logo'
import { priceCart, resolveCart } from '@/lib/cart'
import { formatMoney } from '@/lib/money'
import { filterProducts, type SortKey } from '@/lib/catalog'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

export default function Storefront() {
  const shop = useStore((s) => s.shop)
  const products = useStore((s) => s.products)
  const cart = useStore((s) => s.cart)
  const fulfilment = useStore((s) => s.fulfilment)
  const promo = useStore((s) => s.promo)
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('featured')
  const [viewing, setViewing] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  )
  const visible = useMemo(
    () => filterProducts(products, { category, query, sort }),
    [products, category, query, sort],
  )
  const featured = useMemo(() => products.filter((p) => p.featured).slice(0, 3), [products])
  const price = useMemo(
    () => priceCart(resolveCart(cart, products), shop, { fulfilment, promo }),
    [cart, products, shop, fulfilment, promo],
  )
  const m = (n: number) => formatMoney(n, shop.currency)

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <LogoMark className="size-9" />
          <div className="min-w-0">
            <p className="truncate font-semibold tracking-tight">{shop.name}</p>
            {shop.openingHours && (
              <p className="truncate text-xs text-muted-foreground">{shop.openingHours}</p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-ink-foreground transition hover:opacity-90"
              aria-label={`Open bag, ${price.items} items`}
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline">{price.items ? m(price.total) : 'Bag'}</span>
              {price.items > 0 && (
                <span className="bg-brand flex size-5 items-center justify-center rounded-full text-[11px] text-white">
                  {price.items}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#06121a] text-white">
          <div
            className="bg-brand absolute -top-40 -right-24 size-[28rem] rounded-full opacity-40 blur-3xl"
            aria-hidden
          />
          <div
            className="bg-brand absolute -bottom-48 -left-32 size-96 rounded-full opacity-20 blur-3xl"
            aria-hidden
          />
          <div className="relative grid items-center gap-8 p-7 sm:p-10 md:grid-cols-[1.15fr_1fr] md:p-12">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15">
                <span className="size-1.5 rounded-full bg-[#2dd4bf]" /> Ordering open
              </span>
              <h1 className="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
                {shop.name}
              </h1>
              <p className="mt-4 max-w-md text-base text-white/70 sm:text-lg">{shop.tagline}</p>
              <div className="mt-6 flex flex-wrap gap-2 text-sm text-white/80">
                {shop.acceptPickup && shop.pickupAddress && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 ring-1 ring-white/10">
                    <MapPin className="size-3.5" /> Pickup · {shop.pickupAddress.split('\n')[0]}
                  </span>
                )}
                {shop.acceptDelivery && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 ring-1 ring-white/10">
                    <Truck className="size-3.5" />{' '}
                    {shop.freeDeliveryOver > 0
                      ? `Free delivery over ${m(shop.freeDeliveryOver)}`
                      : `Delivery ${m(shop.deliveryFee)}`}
                  </span>
                )}
                {shop.openingHours && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 ring-1 ring-white/10">
                    <Clock className="size-3.5" /> {shop.openingHours}
                  </span>
                )}
              </div>
              <a
                href="#menu"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#06121a] transition hover:bg-white/90"
              >
                Browse the menu <ArrowRight className="size-4" />
              </a>
            </div>
            {featured.length > 0 && (
              <div className="hidden grid-cols-2 gap-3 md:grid">
                {featured.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setViewing(p)}
                    className={cn(
                      'group relative overflow-hidden rounded-3xl text-left ring-1 ring-white/10',
                      i === 0 ? 'row-span-2 aspect-[3/4]' : 'aspect-square',
                    )}
                  >
                    <ProductArt
                      product={p}
                      className="transition duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-x-2 bottom-2 rounded-2xl bg-white/90 px-3 py-2 text-neutral-900 backdrop-blur">
                      <span className="block truncate text-sm font-semibold">{p.name}</span>
                      <span className="tabular text-xs text-neutral-600">{m(p.price)}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <main id="menu" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Categories">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  'h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition',
                  category === c
                    ? 'border-transparent bg-ink text-ink-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                aria-label="Search the menu"
                placeholder="Search the menu"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-full border border-input bg-card pr-4 pl-10 text-sm transition focus:border-primary-strong focus:ring-4 focus:ring-primary/25 focus:outline-none"
              />
            </div>
            <Select
              aria-label="Sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-auto rounded-full"
            >
              <option value="featured">Popular first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name</option>
            </Select>
          </div>
        </div>

        {visible.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={() => setViewing(p)} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed p-12 text-center">
            <p className="font-semibold">Nothing matches “{query}”</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another word or pick a different category.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>
            Orders are sent to {shop.name} on WhatsApp. Storefront by{' '}
            <span className="text-brand font-semibold">Shoplane</span>.
          </p>
          <Link href="/manage" className="font-medium text-foreground hover:underline">
            Shop owner? Manage orders →
          </Link>
        </div>
      </footer>

      {price.items > 0 && !cartOpen && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="bg-brand shadow-glow fixed inset-x-4 bottom-4 z-30 flex h-14 items-center justify-between rounded-full px-6 font-semibold text-white sm:hidden"
        >
          <span>View bag · {price.items}</span>
          <span className="tabular">{m(price.total)}</span>
        </button>
      )}

      <QuickView product={viewing} onClose={() => setViewing(null)} />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  )
}
