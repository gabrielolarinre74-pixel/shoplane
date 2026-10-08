import { useState } from 'react'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ManageShell } from '@/components/manage/ManageShell'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { CURRENCIES, parseAmount } from '@/lib/money'
import { validateShop, type ShopErrors as Errors } from '@/lib/shop'
import type { Shop } from '@/lib/types'
import { useStore } from '@/store'

export default function Settings() {
  const shop = useStore((s) => s.shop)
  const updateShop = useStore((s) => s.updateShop)
  const resetDemo = useStore((s) => s.resetDemo)
  const [d, setD] = useState<Shop>(shop)
  const [errors, setErrors] = useState<Errors>({})
  const [code, setCode] = useState('')
  const [percent, setPercent] = useState('10')
  const [confirmReset, setConfirmReset] = useState(false)
  const set = <K extends keyof Shop>(k: K, v: Shop[K]) => setD((x) => ({ ...x, [k]: v }))
  const dirty = JSON.stringify(d) !== JSON.stringify(shop)

  const save = () => {
    const e = validateShop(d)
    setErrors(e)
    if (Object.keys(e).length) {
      toast.error('Check the highlighted fields')
      return
    }
    updateShop({ ...d, name: d.name.trim(), tagline: d.tagline.trim() })
    toast.success('Settings saved')
  }

  const addPromo = () => {
    const c = code.trim().toUpperCase().replace(/\s+/g, '')
    const p = Math.round(parseAmount(percent))
    if (!/^[A-Z0-9_-]{3,20}$/.test(c)) return setErrors({ promo: 'Use 3–20 letters or numbers' })
    if (p < 1 || p > 90) return setErrors({ promo: 'Discount must be between 1% and 90%' })
    if (d.promoCodes.some((x) => x.code === c))
      return setErrors({ promo: 'That code already exists' })
    set('promoCodes', [...d.promoCodes, { code: c, percent: p, active: true }])
    setCode('')
    setErrors({})
  }

  return (
    <ManageShell
      title="Settings"
      description="Your shop details, how orders are fulfilled, and promo codes."
      action={
        <Button variant="primary" onClick={save} disabled={!dirty}>
          Save changes
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Shop profile" description="Shown in the storefront header and hero." />
          <div className="space-y-4 p-5">
            <Field label="Shop name" htmlFor="s-name" error={errors.name}>
              <Input id="s-name" value={d.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Tagline" htmlFor="s-tag">
              <Input
                id="s-tag"
                value={d.tagline}
                onChange={(e) => set('tagline', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <Field
                label="WhatsApp number"
                htmlFor="s-wa"
                error={errors.whatsapp}
                hint="Orders are sent here."
              >
                <Input
                  id="s-wa"
                  type="tel"
                  value={d.whatsapp}
                  onChange={(e) => set('whatsapp', e.target.value)}
                />
              </Field>
              <Field label="Currency" htmlFor="s-cur">
                <Select
                  id="s-cur"
                  value={d.currency}
                  onChange={(e) => set('currency', e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Opening hours" htmlFor="s-hours">
              <Input
                id="s-hours"
                value={d.openingHours}
                onChange={(e) => set('openingHours', e.target.value)}
                placeholder="Mon–Sat · 8am–6pm"
              />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Pickup and delivery"
            description="Choose how shoppers get their order."
          />
          <div className="space-y-4 p-5">
            <Toggle
              label="Pickup"
              hint="Shoppers collect from your address."
              checked={d.acceptPickup}
              onChange={(v) => set('acceptPickup', v)}
            />
            {d.acceptPickup && (
              <Field label="Pickup address" htmlFor="s-addr">
                <Textarea
                  id="s-addr"
                  rows={2}
                  value={d.pickupAddress}
                  onChange={(e) => set('pickupAddress', e.target.value)}
                />
              </Field>
            )}
            <Toggle
              label="Delivery"
              hint="Shoppers add an address at checkout."
              checked={d.acceptDelivery}
              onChange={(v) => set('acceptDelivery', v)}
            />
            {d.acceptDelivery && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Delivery fee" htmlFor="s-fee">
                  <Input
                    id="s-fee"
                    inputMode="decimal"
                    value={String(d.deliveryFee)}
                    onChange={(e) => set('deliveryFee', Math.max(0, parseAmount(e.target.value)))}
                  />
                </Field>
                <Field label="Free delivery over" htmlFor="s-free" hint="0 turns it off">
                  <Input
                    id="s-free"
                    inputMode="decimal"
                    value={String(d.freeDeliveryOver)}
                    onChange={(e) =>
                      set('freeDeliveryOver', Math.max(0, parseAmount(e.target.value)))
                    }
                  />
                </Field>
              </div>
            )}
            {errors.fulfilment && (
              <p className="text-xs font-medium text-danger">{errors.fulfilment}</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Promo codes" description="Percentage off the bag subtotal." />
          <div className="p-5">
            <ul className="divide-y rounded-2xl border">
              {d.promoCodes.map((p) => (
                <li key={p.code} className="flex items-center gap-3 px-4 py-3">
                  <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs font-semibold">
                    {p.code}
                  </span>
                  <span className="text-sm text-muted-foreground">{p.percent}% off</span>
                  <label className="ml-auto flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      className="size-4 accent-[#06b6d4]"
                      checked={p.active}
                      onChange={(e) =>
                        set(
                          'promoCodes',
                          d.promoCodes.map((x) =>
                            x.code === p.code ? { ...x, active: e.target.checked } : x,
                          ),
                        )
                      }
                    />
                    Active
                  </label>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${p.code}`}
                    onClick={() =>
                      set(
                        'promoCodes',
                        d.promoCodes.filter((x) => x.code !== p.code),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
              {!d.promoCodes.length && (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No promo codes yet.
                </li>
              )}
            </ul>
            <div className="mt-4 flex gap-2">
              <Input
                aria-label="New code"
                placeholder="CODE"
                className="uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Input
                aria-label="Percent off"
                inputMode="numeric"
                className="w-20"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
              />
              <Button onClick={addPromo}>
                <Plus /> Add
              </Button>
            </div>
            {errors.promo && (
              <p className="mt-1.5 text-xs font-medium text-danger">{errors.promo}</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Demo data" description="Everything is stored in this browser only." />
          <div className="p-5">
            <p className="text-sm text-muted-foreground">
              Reset the sample bakery, its products and orders. Your changes in this browser will be
              replaced.
            </p>
            <Button className="mt-4" onClick={() => setConfirmReset(true)}>
              <RotateCcw /> Reset demo data
            </Button>
          </div>
        </Card>
      </div>

      <Dialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset demo data?"
        description="Products, orders and settings go back to the sample bakery."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              resetDemo()
              setD(useStore.getState().shop)
              setConfirmReset(false)
              toast.success('Demo data restored')
            }}
          >
            Reset
          </Button>
        </div>
      </Dialog>
    </ManageShell>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-muted ring-1 ring-border transition peer-checked:bg-[#06b6d4] peer-focus-visible:ring-2 peer-focus-visible:ring-ring after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
    </label>
  )
}
