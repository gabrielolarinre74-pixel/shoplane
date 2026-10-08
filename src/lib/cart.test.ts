import { describe, expect, it } from 'vitest'
import { findPromo, maxQuantity, priceCart, resolveCart } from './cart'
import type { Product, Shop } from './types'

const p = (id: string, price: number, stock: number | null = null): Product => ({
  id, name: id, description: '', price, category: 'x', art: 'box', stock, featured: false, createdAt: '',
})
const shop: Shop = {
  name: 'Shop', tagline: '', whatsapp: '15550100', currency: 'USD', acceptPickup: true, acceptDelivery: true,
  deliveryFee: 5, freeDeliveryOver: 40, pickupAddress: '', openingHours: '',
  promoCodes: [{ code: 'WELCOME10', percent: 10, active: true }, { code: 'OLD', percent: 50, active: false }],
}

describe('resolveCart', () => {
  it('drops missing and sold-out products and clamps to stock', () => {
    const lines = resolveCart(
      [{ productId: 'a', quantity: 3 }, { productId: 'gone', quantity: 1 }, { productId: 'b', quantity: 5 }, { productId: 'c', quantity: 2 }],
      [p('a', 2.5), p('b', 4, 2), p('c', 1, 0)]
    )
    expect(lines.map((l) => [l.product.id, l.quantity, l.lineTotal])).toEqual([
      ['a', 3, 7.5],
      ['b', 2, 8],
    ])
  })
  it('caps unlimited stock at 99 per line', () => {
    expect(maxQuantity({ stock: null })).toBe(99)
    expect(maxQuantity({ stock: -4 })).toBe(0)
  })
})

describe('priceCart', () => {
  const lines = resolveCart([{ productId: 'a', quantity: 4 }], [p('a', 9)]) // 36

  it('charges delivery below the free threshold and nothing for pickup', () => {
    expect(priceCart(lines, shop, { fulfilment: 'delivery' })).toMatchObject({ subtotal: 36, delivery: 5, total: 41, freeDeliveryRemaining: 4 })
    expect(priceCart(lines, shop, { fulfilment: 'pickup' })).toMatchObject({ delivery: 0, total: 36 })
  })

  it('applies active promo codes case-insensitively, before the free-delivery check', () => {
    const five = resolveCart([{ productId: 'a', quantity: 5 }], [p('a', 9)]) // 45 -> 40.5 after 10%
    expect(priceCart(five, shop, { fulfilment: 'delivery', promo: 'welcome10' })).toMatchObject({
      discount: 4.5, delivery: 0, total: 40.5, promo: 'WELCOME10', freeDeliveryRemaining: 0,
    })
    expect(priceCart(five, shop, { fulfilment: 'delivery', promo: 'old' }).discount).toBe(0)
  })

  it('never charges delivery on an empty cart and supports turning free delivery off', () => {
    expect(priceCart([], shop, { fulfilment: 'delivery' }).total).toBe(0)
    expect(priceCart(lines, { ...shop, freeDeliveryOver: 0 }, { fulfilment: 'delivery' }).freeDeliveryRemaining).toBeNull()
  })

  it('finds promos only when active', () => {
    expect(findPromo(shop, ' welcome10 ')?.percent).toBe(10)
    expect(findPromo(shop, 'OLD')).toBeUndefined()
    expect(findPromo(shop, '')).toBeUndefined()
  })
})
