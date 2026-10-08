import { formatMoney, round2 } from './money'
import type { Order, OrderStatus, Shop } from './types'

export const STATUS_FLOW: OrderStatus[] = ['new', 'confirmed', 'ready', 'completed']

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'New',
  confirmed: 'Confirmed',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/** Next status in the flow, or null once completed or cancelled. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(status)
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null
}

export function nextOrderNumber(orders: Pick<Order, 'number'>[]) {
  const max = orders.reduce((m, o) => Math.max(m, Number(o.number.replace(/\D/g, '')) || 0), 1000)
  return `#${max + 1}`
}

/** The message a shopper sends to the shop on WhatsApp. */
export function orderMessage(order: Order, shop: Pick<Shop, 'name' | 'currency' | 'pickupAddress'>) {
  const m = (n: number) => formatMoney(n, shop.currency)
  const lines = order.lines.map((l) => `• ${l.quantity} × ${l.name} — ${m(round2(l.price * l.quantity))}`)
  const totals = [
    `Subtotal: ${m(order.subtotal)}`,
    order.discount > 0 ? `Discount${order.promo ? ` (${order.promo})` : ''}: -${m(order.discount)}` : '',
    order.fulfilment === 'delivery' ? `Delivery: ${order.delivery > 0 ? m(order.delivery) : 'Free'}` : '',
    `Total: ${m(order.total)}`,
  ].filter(Boolean)
  const how =
    order.fulfilment === 'delivery'
      ? `Delivery to: ${order.customer.address}`
      : `Pickup${shop.pickupAddress ? ` at ${shop.pickupAddress.split('\n')[0]}` : ''}`
  return [
    `Hi ${shop.name}! I'd like to place order ${order.number}:`,
    '',
    ...lines,
    '',
    ...totals,
    '',
    how,
    `Name: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
    order.customer.note ? `Note: ${order.customer.note}` : '',
  ]
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n')
    .trim()
}

export function whatsappLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

/** Sales summary. Cancelled orders never count. */
export function salesStats(orders: Order[], todayISO: string) {
  const live = orders.filter((o) => o.status !== 'cancelled')
  const revenue = round2(live.reduce((s, o) => s + o.total, 0))
  const today = live.filter((o) => o.createdAt.slice(0, 10) === todayISO)
  const units = new Map<string, { name: string; quantity: number; revenue: number }>()
  for (const o of live) {
    for (const l of o.lines) {
      const u = units.get(l.productId) ?? { name: l.name, quantity: 0, revenue: 0 }
      u.quantity += l.quantity
      u.revenue = round2(u.revenue + l.price * l.quantity)
      units.set(l.productId, u)
    }
  }
  return {
    revenue,
    orders: live.length,
    averageOrder: live.length ? round2(revenue / live.length) : 0,
    todayCount: today.length,
    todayRevenue: round2(today.reduce((s, o) => s + o.total, 0)),
    open: orders.filter((o) => o.status === 'new' || o.status === 'confirmed' || o.status === 'ready').length,
    topProducts: [...units.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).slice(0, 5),
  }
}
