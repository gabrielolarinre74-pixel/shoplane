import { useMemo, useState } from 'react'
import { ChevronRight, MapPin, MessageCircle, Store, Truck, X } from 'lucide-react'
import { toast } from 'sonner'
import { ManageShell } from '@/components/manage/ManageShell'
import { StatusPill } from '@/components/manage/StatusPill'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { formatMoney } from '@/lib/money'
import {
  customerUpdateMessage,
  nextStatus,
  salesStats,
  STATUS_LABEL,
  timeAgo,
  whatsappLink,
} from '@/lib/orders'
import type { Order, OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

type Filter = 'open' | 'all' | 'completed' | 'cancelled'
const FILTERS: { value: Filter; label: string; match: (s: OrderStatus) => boolean }[] = [
  { value: 'open', label: 'Open', match: (s) => s === 'new' || s === 'confirmed' || s === 'ready' },
  { value: 'completed', label: 'Completed', match: (s) => s === 'completed' },
  { value: 'cancelled', label: 'Cancelled', match: (s) => s === 'cancelled' },
  { value: 'all', label: 'All', match: () => true },
]

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Orders() {
  const orders = useStore((s) => s.orders)
  const currency = useStore((s) => s.shop.currency)
  const [filter, setFilter] = useState<Filter>('open')
  const m = (n: number) => formatMoney(n, currency)
  // createdAt is UTC; compare on the local calendar day
  const local = useMemo(
    () => orders.map((o) => ({ ...o, createdAt: localDay(o.createdAt) + o.createdAt.slice(10) })),
    [orders],
  )
  const stats = useMemo(() => salesStats(local, todayISO()), [local])
  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f.value, orders.filter((o) => f.match(o.status)).length]),
      ),
    [orders],
  )
  const list = orders.filter((o) => FILTERS.find((f) => f.value === filter)!.match(o.status))

  return (
    <ManageShell
      title="Orders"
      description="Confirm, prepare and hand over orders as they come in from WhatsApp."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-brand shadow-glow relative overflow-hidden rounded-2xl p-5 text-white">
          <p className="text-sm font-medium text-white/80">Today</p>
          <p className="tabular mt-2 text-3xl font-semibold tracking-tight">
            {m(stats.todayRevenue)}
          </p>
          <p className="mt-1 text-sm text-white/80">
            {stats.todayCount} {stats.todayCount === 1 ? 'order' : 'orders'}
          </p>
        </div>
        <Kpi label="Open orders" value={String(stats.open)} hint="New, confirmed or ready" />
        <Kpi label="Average order" value={m(stats.averageOrder)} hint="Excludes cancelled" />
        <Kpi label="Sales to date" value={m(stats.revenue)} hint={`${stats.orders} orders`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section>
          <div
            className="flex gap-1 overflow-x-auto rounded-full border bg-card p-1"
            role="tablist"
            aria-label="Filter orders"
          >
            {FILTERS.map((f) => (
              <button
                key={f.value}
                role="tab"
                aria-selected={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap transition',
                  filter === f.value
                    ? 'bg-ink text-ink-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label} <span className="tabular text-xs opacity-70">{counts[f.value]}</span>
              </button>
            ))}
          </div>
          <ul className="mt-4 space-y-3">
            {list.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
            {!list.length && (
              <li className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                No {filter === 'all' ? '' : filter} orders yet.
              </li>
            )}
          </ul>
        </section>
        <aside>
          <Card>
            <CardHeader title="Best sellers" description="By units, excluding cancelled orders" />
            <ol className="space-y-3 p-5">
              {stats.topProducts.map((p, i) => {
                const max = stats.topProducts[0]?.quantity || 1
                return (
                  <li key={p.name}>
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate font-medium">
                        <span className="mr-2 text-muted-foreground tabular">{i + 1}</span>
                        {p.name}
                      </span>
                      <span className="tabular text-muted-foreground">{p.quantity}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                      <div
                        className="bg-brand h-full rounded-full"
                        style={{ width: `${(p.quantity / max) * 100}%` }}
                      />
                    </div>
                  </li>
                )
              })}
              {!stats.topProducts.length && (
                <li className="text-sm text-muted-foreground">Sales will show here.</li>
              )}
            </ol>
          </Card>
        </aside>
      </div>
    </ManageShell>
  )
}

function localDay(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="tabular mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const shop = useStore((s) => s.shop)
  const setOrderStatus = useStore((s) => s.setOrderStatus)
  const next = nextStatus(order.status)
  const m = (n: number) => formatMoney(n, shop.currency)
  const items = order.lines.reduce((n, l) => n + l.quantity, 0)
  const advance = (status: OrderStatus) => {
    setOrderStatus(order.id, status)
    toast.success(`${order.number} marked ${STATUS_LABEL[status].toLowerCase()}`, {
      action: { label: 'Undo', onClick: () => setOrderStatus(order.id, order.status) },
    })
  }
  const update = customerUpdateMessage(next ? { ...order, status: next } : order, shop)
  return (
    <li className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold tabular">{order.number}</span>
            <StatusPill status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.customer.name} · {timeAgo(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular text-lg font-semibold">{m(order.total)}</p>
          <p className="text-xs text-muted-foreground">
            {items} {items === 1 ? 'item' : 'items'}
            {order.promo ? ` · ${order.promo}` : ''}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm">
        {order.lines.map((l) => `${l.quantity}× ${l.name}`).join(', ')}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {order.fulfilment === 'delivery' ? (
            <Truck className="size-3.5" />
          ) : (
            <Store className="size-3.5" />
          )}
          {order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}
        </span>
        {order.fulfilment === 'delivery' && order.customer.address && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {order.customer.address}
          </span>
        )}
        {order.customer.note && <span className="italic">“{order.customer.note}”</span>}
      </div>
      {(next || order.status !== 'cancelled') && (
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          {next && (
            <Button size="sm" variant="ink" onClick={() => advance(next)}>
              Mark {STATUS_LABEL[next].toLowerCase()} <ChevronRight />
            </Button>
          )}
          <a
            href={whatsappLink(order.customer.phone, update)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border bg-card px-3 text-[13px] font-semibold hover:bg-muted"
          >
            <MessageCircle className="size-4" /> Message customer
          </a>
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-danger"
              onClick={() => advance('cancelled')}
            >
              <X /> Cancel
            </Button>
          )}
        </div>
      )}
    </li>
  )
}
