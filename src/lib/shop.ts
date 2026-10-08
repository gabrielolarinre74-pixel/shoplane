import type { Shop } from './types'

export type ShopErrors = Partial<Record<'name' | 'whatsapp' | 'fulfilment' | 'promo', string>>

export function validateShop(s: Shop): ShopErrors {
  const e: ShopErrors = {}
  if (s.name.trim().length < 2) e.name = 'Add your shop name'
  if (s.whatsapp.replace(/\D/g, '').length < 7)
    e.whatsapp = 'Use the full number with country code, e.g. +1 555 0100'
  if (!s.acceptPickup && !s.acceptDelivery) e.fulfilment = 'Turn on pickup, delivery or both'
  return e
}
