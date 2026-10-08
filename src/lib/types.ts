export type ArtKey = 'coffee' | 'croissant' | 'cake' | 'cookie' | 'sandwich' | 'drink' | 'donut' | 'box' | 'wheat' | 'icecream'

export type Product = {
  id: string
  name: string
  description: string
  price: number
  category: string
  art: ArtKey
  /** Optional uploaded photo (data URL); falls back to the illustrated tile. */
  image?: string
  /** null = always available */
  stock: number | null
  featured: boolean
  createdAt: string
}

export type CartLine = { productId: string; quantity: number }

export type Fulfilment = 'pickup' | 'delivery'

export type PromoCode = { code: string; percent: number; active: boolean }

export type Shop = {
  name: string
  tagline: string
  whatsapp: string
  currency: string
  acceptPickup: boolean
  acceptDelivery: boolean
  deliveryFee: number
  /** Order subtotal above which delivery is free; 0 turns it off. */
  freeDeliveryOver: number
  pickupAddress: string
  openingHours: string
  promoCodes: PromoCode[]
}

export type OrderStatus = 'new' | 'confirmed' | 'ready' | 'completed' | 'cancelled'

export type OrderLine = { productId: string; name: string; price: number; quantity: number }

export type Customer = { name: string; phone: string; address: string; note: string }

export type Order = {
  id: string
  number: string
  createdAt: string
  customer: Customer
  fulfilment: Fulfilment
  lines: OrderLine[]
  promo?: string
  subtotal: number
  discount: number
  delivery: number
  total: number
  status: OrderStatus
}
