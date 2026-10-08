import type { Order, Product, Shop } from '@/lib/types'

/** Fictional demo bakery. Nothing here refers to a real business. */
export const sampleShop: Shop = {
  name: 'Ember & Oak Bakehouse',
  tagline: 'Small-batch bread, pastries and coffee, baked every morning.',
  whatsapp: '+1 555 0100',
  currency: 'USD',
  acceptPickup: true,
  acceptDelivery: true,
  deliveryFee: 4.5,
  freeDeliveryOver: 40,
  pickupAddress: '14 Mill Lane\nSide entrance',
  openingHours: 'Tue–Sun · 7am–3pm',
  promoCodes: [
    { code: 'WELCOME10', percent: 10, active: true },
    { code: 'BAKERSDOZEN', percent: 15, active: false },
  ],
}

const p = (
  id: string,
  name: string,
  category: string,
  price: number,
  art: Product['art'],
  description: string,
  stock: number | null = null,
  featured = false,
): Product => ({
  id,
  name,
  category,
  price,
  art,
  description,
  stock,
  featured,
  createdAt: '2026-09-01T08:00:00.000Z',
})

export const sampleProducts: Product[] = [
  p(
    'p-sourdough',
    'Country sourdough',
    'Bread',
    8,
    'wheat',
    '36-hour ferment, crackly crust, open crumb. 900 g loaf.',
    12,
    true,
  ),
  p(
    'p-croissant',
    'Butter croissant',
    'Pastries',
    3.75,
    'croissant',
    'Laminated over three days with cultured butter.',
    30,
    true,
  ),
  p(
    'p-pain-choc',
    'Pain au chocolat',
    'Pastries',
    4.25,
    'croissant',
    'Two batons of dark chocolate in flaky pastry.',
    18,
  ),
  p(
    'p-cardamom',
    'Cardamom bun',
    'Pastries',
    4.5,
    'donut',
    'Knotted, glazed and dusted with crushed cardamom.',
    3,
    true,
  ),
  p(
    'p-cookie',
    'Brown butter cookie',
    'Sweet',
    3,
    'cookie',
    'Chewy middle, crisp edge, flaky salt on top.',
    null,
  ),
  p(
    'p-carrot',
    'Carrot cake slice',
    'Sweet',
    5.5,
    'cake',
    'Spiced sponge, walnuts and a cream cheese frosting.',
    8,
  ),
  p(
    'p-whole-cake',
    'Celebration cake (8 inch)',
    'Sweet',
    42,
    'cake',
    'Vanilla or chocolate. Order a day ahead for pickup.',
    4,
    true,
  ),
  p(
    'p-focaccia',
    'Rosemary focaccia sandwich',
    'Lunch',
    9.5,
    'sandwich',
    'Roast vegetables, pesto and mozzarella.',
    10,
  ),
  p('p-flat-white', 'Flat white', 'Coffee', 4, 'coffee', 'Double ristretto with silky milk.', null),
  p(
    'p-cold-brew',
    'Cold brew',
    'Coffee',
    4.75,
    'drink',
    'Steeped for 18 hours. Smooth and chocolatey.',
    null,
  ),
  p(
    'p-box',
    'Morning pastry box (6)',
    'Boxes',
    21,
    'box',
    'A mix of today’s pastries, packed to share.',
    6,
    true,
  ),
  p('p-gelato', 'Brown sugar gelato tub', 'Sweet', 7, 'icecream', 'Small-batch, 500 ml.', 0),
]

const iso = (daysAgo: number, hour: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 15, 0, 0)
  return d.toISOString()
}

const o = (
  n: number,
  daysAgo: number,
  hour: number,
  name: string,
  fulfilment: Order['fulfilment'],
  status: Order['status'],
  lines: [string, number][],
  delivery = 0,
): Order => {
  const resolved = lines.map(([id, quantity]) => {
    const prod = sampleProducts.find((x) => x.id === id)!
    return { productId: id, name: prod.name, price: prod.price, quantity }
  })
  const subtotal = Math.round(resolved.reduce((s, l) => s + l.price * l.quantity, 0) * 100) / 100
  return {
    id: `o-${n}`,
    number: `#${n}`,
    createdAt: iso(daysAgo, hour),
    customer: {
      name,
      phone: '+1 555 01' + String(n).slice(-2),
      address: fulfilment === 'delivery' ? '22 Orchard Road' : '',
      note: '',
    },
    fulfilment,
    lines: resolved,
    subtotal,
    discount: 0,
    delivery,
    total: Math.round((subtotal + delivery) * 100) / 100,
    status,
  }
}

export function sampleOrders(): Order[] {
  return [
    o(1001, 6, 8, 'Jordan Lee', 'pickup', 'completed', [
      ['p-sourdough', 1],
      ['p-croissant', 2],
    ]),
    o(
      1002,
      5,
      9,
      'Amira Haddad',
      'delivery',
      'completed',
      [
        ['p-box', 1],
        ['p-flat-white', 2],
      ],
      4.5,
    ),
    o(1003, 4, 10, 'Tom Becker', 'pickup', 'completed', [['p-whole-cake', 1]]),
    o(1004, 3, 8, 'Sofia Russo', 'pickup', 'cancelled', [['p-cardamom', 4]]),
    o(
      1005,
      2,
      11,
      'Kenji Mori',
      'delivery',
      'completed',
      [
        ['p-focaccia', 2],
        ['p-cold-brew', 2],
      ],
      4.5,
    ),
    o(1006, 1, 9, 'Grace Okafor', 'pickup', 'ready', [
      ['p-croissant', 4],
      ['p-pain-choc', 2],
    ]),
    o(1007, 0, 8, 'Luis Ortega', 'delivery', 'confirmed', [
      ['p-box', 2],
      ['p-cookie', 6],
    ]),
    o(1008, 0, 9, 'Hannah Weiss', 'pickup', 'new', [
      ['p-sourdough', 2],
      ['p-carrot', 2],
      ['p-flat-white', 2],
    ]),
  ]
}
