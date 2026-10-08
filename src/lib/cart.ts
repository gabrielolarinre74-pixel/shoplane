import { round2 } from './money'
import type { CartLine, Fulfilment, Product, PromoCode, Shop } from './types'

export type ResolvedLine = { product: Product; quantity: number; lineTotal: number }

/** Max units a shopper can add; null stock means unlimited (capped at 99 per line). */
export function maxQuantity(product: Pick<Product, 'stock'>) {
  return product.stock === null ? 99 : Math.max(0, Math.min(99, product.stock))
}

/** Joins cart lines to products, drops deleted or sold-out products and clamps to stock. */
export function resolveCart(cart: CartLine[], products: Product[]): ResolvedLine[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  const out: ResolvedLine[] = []
  for (const line of cart) {
    const product = byId.get(line.productId)
    if (!product) continue
    const quantity = Math.min(Math.floor(line.quantity), maxQuantity(product))
    if (quantity <= 0) continue
    out.push({ product, quantity, lineTotal: round2(product.price * quantity) })
  }
  return out
}

export function findPromo(shop: Pick<Shop, 'promoCodes'>, code: string): PromoCode | undefined {
  const c = code.trim().toUpperCase()
  if (!c) return undefined
  return shop.promoCodes.find((p) => p.active && p.code.toUpperCase() === c && p.percent > 0)
}

/**
 * Prices a cart: subtotal, promo discount, delivery fee (free above the threshold,
 * measured after the discount) and total. Also reports how far the shopper is from free delivery.
 */
export function priceCart(
  lines: ResolvedLine[],
  shop: Shop,
  opts: { fulfilment: Fulfilment; promo?: string },
) {
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0))
  const promo = opts.promo ? findPromo(shop, opts.promo) : undefined
  const discount = promo ? round2((subtotal * Math.min(promo.percent, 100)) / 100) : 0
  const afterDiscount = round2(subtotal - discount)
  const threshold = shop.freeDeliveryOver > 0 ? shop.freeDeliveryOver : Infinity
  const qualifiesFree = afterDiscount >= threshold
  const delivery =
    opts.fulfilment === 'delivery' && subtotal > 0 && !qualifiesFree
      ? round2(Math.max(0, shop.deliveryFee))
      : 0
  const freeDeliveryRemaining = Number.isFinite(threshold)
    ? round2(Math.max(0, threshold - afterDiscount))
    : null
  return {
    subtotal,
    discount,
    delivery,
    total: round2(afterDiscount + delivery),
    promo: promo?.code,
    freeDeliveryRemaining,
    items: lines.reduce((n, l) => n + l.quantity, 0),
  }
}
