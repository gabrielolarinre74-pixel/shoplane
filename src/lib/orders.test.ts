import { describe, expect, it } from 'vitest'
import { nextOrderNumber, nextStatus, orderMessage, salesStats, whatsappLink } from './orders'
import type { Order } from './types'

const order = (over: Partial<Order> = {}): Order => ({
  id: 'o1', number: '#1001', createdAt: '2026-10-08T09:00:00.000Z',
  customer: { name: 'Ada', phone: '+1 555 0199', address: '12 Elm St', note: 'Ring the bell' },
  fulfilment: 'delivery',
  lines: [{ productId: 'a', name: 'Flat white', price: 4.5, quantity: 2 }, { productId: 'b', name: 'Croissant', price: 3, quantity: 1 }],
  promo: 'WELCOME10', subtotal: 12, discount: 1.2, delivery: 5, total: 15.8, status: 'new', ...over,
})

describe('orderMessage', () => {
  it('lists items, totals, delivery details and the note', () => {
    const msg = orderMessage(order(), { name: 'Ember & Oak', currency: 'USD', pickupAddress: '' })
    expect(msg).toBe(
      [
        "Hi Ember & Oak! I'd like to place order #1001:",
        '',
        '• 2 × Flat white — $9.00',
        '• 1 × Croissant — $3.00',
        '',
        'Subtotal: $12.00',
        'Discount (WELCOME10): -$1.20',
        'Delivery: $5.00',
        'Total: $15.80',
        '',
        'Delivery to: 12 Elm St',
        'Name: Ada',
        'Phone: +1 555 0199',
        'Note: Ring the bell',
      ].join('\n')
    )
  })

  it('uses the first line of the pickup address for pickup orders', () => {
    const msg = orderMessage(order({ fulfilment: 'pickup', delivery: 0, discount: 0, customer: { name: 'Ada', phone: '1', address: '', note: '' } }), {
      name: 'Shop', currency: 'USD', pickupAddress: '4 Mill Lane\nBack door',
    })
    expect(msg).toContain('Pickup at 4 Mill Lane')
    expect(msg).not.toContain('Delivery')
    expect(msg).not.toContain('Note:')
  })
})

describe('orders helpers', () => {
  it('numbers orders and walks the status flow', () => {
    expect(nextOrderNumber([])).toBe('#1001')
    expect(nextOrderNumber([{ number: '#1041' }, { number: '#1009' }])).toBe('#1042')
    expect(nextStatus('new')).toBe('confirmed')
    expect(nextStatus('ready')).toBe('completed')
    expect(nextStatus('completed')).toBeNull()
    expect(nextStatus('cancelled')).toBeNull()
  })

  it('builds wa.me links with digits only', () => {
    expect(whatsappLink('+1 (555) 0100', 'a b')).toBe('https://wa.me/15550100?text=a%20b')
  })

  it('summarises sales and ignores cancelled orders', () => {
    const s = salesStats(
      [order(), order({ id: 'o2', total: 10, createdAt: '2026-10-01T09:00:00Z', status: 'completed' }), order({ id: 'o3', total: 99, status: 'cancelled' })],
      '2026-10-08'
    )
    expect(s).toMatchObject({ revenue: 25.8, orders: 2, averageOrder: 12.9, todayCount: 1, todayRevenue: 15.8, open: 1 })
    expect(s.topProducts[0]).toEqual({ name: 'Flat white', quantity: 4, revenue: 18 })
  })
})
