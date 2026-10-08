import { describe, expect, it } from 'vitest'
import { sampleShop } from '@/store/sample'
import { validateShop } from './shop'

describe('validateShop', () => {
  it('accepts the sample shop', () => {
    expect(validateShop(sampleShop)).toEqual({})
  })
  it('needs a name, a reachable WhatsApp number and at least one fulfilment option', () => {
    const e = validateShop({
      ...sampleShop,
      name: ' ',
      whatsapp: '123',
      acceptPickup: false,
      acceptDelivery: false,
    })
    expect(Object.keys(e).sort()).toEqual(['fulfilment', 'name', 'whatsapp'])
  })
})
