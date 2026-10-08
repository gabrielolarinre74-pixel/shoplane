import { beforeEach, describe, expect, it } from 'vitest'
import { sampleProducts, sampleShop } from './sample'
import { useStore } from './index'

const get = () => useStore.getState()
const stock = (id: string) => get().products.find((p) => p.id === id)!.stock

describe('store', () => {
  beforeEach(() => useStore.setState({ shop: sampleShop, products: sampleProducts, orders: [], cart: [], promo: '', fulfilment: 'pickup' }))

  it('adds to cart within stock and removes at zero', () => {
    get().addToCart('p-cardamom', 2)
    get().addToCart('p-cardamom', 5) // only 3 in stock
    expect(get().cart).toEqual([{ productId: 'p-cardamom', quantity: 3 }])
    get().setQuantity('p-cardamom', 0)
    expect(get().cart).toEqual([])
    get().addToCart('p-gelato') // sold out
    expect(get().cart).toEqual([])
  })

  it('places an order, reserves stock and clears the cart', () => {
    get().addToCart('p-croissant', 2)
    get().addToCart('p-flat-white', 1)
    get().setFulfilment('delivery')
    get().setPromo('WELCOME10')
    const order = get().placeOrder({ name: 'Ada', phone: '+1 555 0199', address: '12 Elm St', note: '' })!
    expect(order).toMatchObject({ number: '#1001', subtotal: 11.5, discount: 1.15, delivery: 4.5, total: 14.85, promo: 'WELCOME10', status: 'new' })
    expect(get().cart).toEqual([])
    expect(stock('p-croissant')).toBe(28)
    expect(stock('p-flat-white')).toBeNull()
  })

  it('returns stock when an order is cancelled and takes it again if restored', () => {
    get().addToCart('p-box', 2)
    const order = get().placeOrder({ name: 'A', phone: '1', address: '', note: '' })!
    expect(stock('p-box')).toBe(4)
    get().setOrderStatus(order.id, 'cancelled')
    expect(stock('p-box')).toBe(6)
    get().setOrderStatus(order.id, 'confirmed')
    expect(stock('p-box')).toBe(4)
  })

  it('refuses to place an empty order and drops deleted products from the cart', () => {
    expect(get().placeOrder({ name: 'A', phone: '1', address: '', note: '' })).toBeNull()
    get().addToCart('p-cookie')
    get().deleteProduct('p-cookie')
    expect(get().cart).toEqual([])
  })
})
