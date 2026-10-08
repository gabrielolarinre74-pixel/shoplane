import { STATUS_LABEL } from '@/lib/orders'
import type { OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STYLE: Record<OrderStatus, string> = {
  new: 'bg-brand text-white',
  confirmed: 'bg-primary-soft text-primary-strong',
  ready: 'bg-[#0a0a0a] text-white dark:bg-white dark:text-black',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-danger/10 text-danger line-through decoration-1',
}

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', STYLE[status])}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
