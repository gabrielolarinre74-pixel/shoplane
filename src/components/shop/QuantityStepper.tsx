import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuantityStepper({ value, max, onChange, label, size = 'md' }: { value: number; max: number; onChange: (n: number) => void; label: string; size?: 'sm' | 'md' }) {
  const btn = cn('flex items-center justify-center rounded-full transition hover:bg-muted disabled:opacity-40', size === 'sm' ? 'size-7' : 'size-9')
  return (
    <div className='inline-flex items-center gap-1 rounded-full border bg-card p-0.5' role='group' aria-label={label}>
      <button type='button' className={btn} aria-label={`Decrease ${label}`} onClick={() => onChange(value - 1)} disabled={value <= 0}>
        <Minus className='size-3.5' />
      </button>
      <span className={cn('tabular text-center font-semibold', size === 'sm' ? 'w-5 text-sm' : 'w-7')} aria-live='polite'>
        {value}
      </span>
      <button type='button' className={btn} aria-label={`Increase ${label}`} onClick={() => onChange(value + 1)} disabled={value >= max}>
        <Plus className='size-3.5' />
      </button>
    </div>
  )
}
