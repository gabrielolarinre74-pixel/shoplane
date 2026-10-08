import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { maxQuantity, priceCart, resolveCart } from '@/lib/cart'
import { nextOrderNumber } from '@/lib/orders'
import type { CartLine, Customer, Fulfilment, Order, OrderStatus, Product, Shop } from '@/lib/types'
import { uid } from '@/lib/utils'
import { sampleOrders, sampleProducts, sampleShop } from './sample'

type State = {
  shop: Shop
  products: Product[]
  cart: CartLine[]
  orders: Order[]
  /** Shopper's chosen fulfilment and promo, kept with the cart */
  fulfilment: Fulfilment
  promo: string
  setQuantity: (productId: string, quantity: number) => void
  addToCart: (productId: string, quantity?: number) => void
  clearCart: () => void
  setFulfilment: (f: Fulfilment) => void
  setPromo: (code: string) => void
  placeOrder: (customer: Customer) => Order | null
  setOrderStatus: (id: string, status: OrderStatus) => void
  saveProduct: (product: Omit<Product, 'id' | 'createdAt'> & { id?: string }) => string
  deleteProduct: (id: string) => void
  updateShop: (patch: Partial<Shop>) => void
  resetDemo: () => void
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      shop: sampleShop,
      products: sampleProducts,
      cart: [],
      orders: sampleOrders(),
      fulfilment: 'pickup',
      promo: '',

      setQuantity: (productId, quantity) =>
        set((s) => {
          const product = s.products.find((p) => p.id === productId)
          const q = product ? Math.min(Math.max(0, Math.floor(quantity)), maxQuantity(product)) : 0
          const rest = s.cart.filter((l) => l.productId !== productId)
          if (q === 0) return { cart: rest }
          const exists = s.cart.some((l) => l.productId === productId)
          return {
            cart: exists
              ? s.cart.map((l) => (l.productId === productId ? { ...l, quantity: q } : l))
              : [...s.cart, { productId, quantity: q }],
          }
        }),

      addToCart: (productId, quantity = 1) => {
        const current = get().cart.find((l) => l.productId === productId)?.quantity ?? 0
        get().setQuantity(productId, current + quantity)
      },

      clearCart: () => set({ cart: [], promo: '' }),
      setFulfilment: (fulfilment) => set({ fulfilment }),
      setPromo: (promo) => set({ promo }),

      placeOrder: (customer) => {
        const { cart, products, shop, fulfilment, promo, orders } = get()
        const lines = resolveCart(cart, products)
        if (!lines.length) return null
        const price = priceCart(lines, shop, { fulfilment, promo })
        const order: Order = {
          id: uid('o-'),
          number: nextOrderNumber(orders),
          createdAt: new Date().toISOString(),
          customer: { ...customer, address: fulfilment === 'delivery' ? customer.address : '' },
          fulfilment,
          lines: lines.map((l) => ({
            productId: l.product.id,
            name: l.product.name,
            price: l.product.price,
            quantity: l.quantity,
          })),
          promo: price.promo,
          subtotal: price.subtotal,
          discount: price.discount,
          delivery: price.delivery,
          total: price.total,
          status: 'new',
        }
        // Reserve stock for the order
        const taken = new Map(order.lines.map((l) => [l.productId, l.quantity]))
        set({
          orders: [order, ...orders],
          cart: [],
          promo: '',
          products: products.map((p) =>
            p.stock !== null && taken.has(p.id)
              ? { ...p, stock: Math.max(0, p.stock - taken.get(p.id)!) }
              : p,
          ),
        })
        return order
      },

      setOrderStatus: (id, status) =>
        set((s) => {
          const order = s.orders.find((o) => o.id === id)
          if (!order || order.status === status) return {}
          // Cancelling gives reserved stock back; un-cancelling takes it again
          const delta = status === 'cancelled' ? 1 : order.status === 'cancelled' ? -1 : 0
          const products = delta
            ? s.products.map((p) => {
                const line = order.lines.find((l) => l.productId === p.id)
                return line && p.stock !== null
                  ? { ...p, stock: Math.max(0, p.stock + delta * line.quantity) }
                  : p
              })
            : s.products
          return { products, orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }
        }),

      saveProduct: ({ id, ...values }) => {
        if (id) {
          set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...values } : p)) }))
          return id
        }
        const product: Product = { ...values, id: uid('p-'), createdAt: new Date().toISOString() }
        set((s) => ({ products: [product, ...s.products] }))
        return product.id
      },

      deleteProduct: (id) =>
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
          cart: s.cart.filter((l) => l.productId !== id),
        })),
      updateShop: (patch) => set((s) => ({ shop: { ...s.shop, ...patch } })),
      resetDemo: () =>
        set({
          shop: sampleShop,
          products: sampleProducts,
          orders: sampleOrders(),
          cart: [],
          promo: '',
          fulfilment: 'pickup',
        }),
    }),
    { name: 'shoplane-data', version: 1 },
  ),
)
