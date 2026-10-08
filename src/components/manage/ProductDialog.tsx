import { useMemo, useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ProductArt } from '@/components/shop/ProductArt'
import { ART_KEYS } from '@/lib/catalog'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/field'
import { fileToDataUrl } from '@/lib/image'
import { parseDraft, toDraft, type ProductDraft } from '@/lib/productForm'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

export function ProductDialog({
  open,
  product,
  onOpenChange,
}: {
  open: boolean
  product?: Product
  onOpenChange: (o: boolean) => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={product ? 'Edit product' : 'New product'}
      className="max-w-2xl"
    >
      {open && (
        <Form key={product?.id ?? 'new'} product={product} onDone={() => onOpenChange(false)} />
      )}
    </Dialog>
  )
}

function Form({ product, onDone }: { product?: Product; onDone: () => void }) {
  const saveProduct = useStore((s) => s.saveProduct)
  const products = useStore((s) => s.products)
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products])
  const [d, setD] = useState<ProductDraft>(() => toDraft(product))
  const [errors, setErrors] = useState<Partial<Record<keyof ProductDraft, string>>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => {
    setD((x) => ({ ...x, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const r = parseDraft(d)
        if (!r.ok) {
          setErrors(r.errors)
          return
        }
        saveProduct({ ...r.value, id: product?.id })
        toast.success(product ? 'Product updated' : 'Product added to the storefront')
        onDone()
      }}
      className="grid gap-5 sm:grid-cols-[200px_1fr]"
    >
      <div>
        <div className="aspect-square overflow-hidden rounded-2xl border">
          <ProductArt product={{ ...d, name: d.name || 'Preview' }} />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Upload photo"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              set('image', await fileToDataUrl(f))
            } catch (err) {
              toast.error((err as Error).message)
            }
          }}
        />
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            className="flex-1 justify-center"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus /> {d.image ? 'Replace' : 'Photo'}
          </Button>
          {d.image && (
            <Button
              size="sm"
              variant="ghost"
              aria-label="Remove photo"
              onClick={() => set('image', undefined)}
            >
              <Trash2 />
            </Button>
          )}
        </div>
        {!d.image && (
          <fieldset className="mt-3">
            <legend className="mb-1.5 text-xs font-semibold text-muted-foreground">
              Or pick an illustration
            </legend>
            <div className="grid grid-cols-5 gap-1.5">
              {ART_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-label={`Illustration ${k}`}
                  aria-pressed={d.art === k}
                  onClick={() => set('art', k)}
                  className={cn(
                    'aspect-square overflow-hidden rounded-lg border transition',
                    d.art === k ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100',
                  )}
                >
                  <ProductArt product={{ art: k, name: k }} iconClassName="size-1/2" />
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </div>
      <div className="space-y-4">
        <Field label="Name" htmlFor="p-name" error={errors.name}>
          <Input id="p-name" value={d.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field
          label="Description"
          htmlFor="p-desc"
          error={errors.description}
          hint="One or two lines shoppers see on the card."
        >
          <Textarea
            id="p-desc"
            rows={2}
            value={d.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="p-cat" error={errors.category}>
            <Input
              id="p-cat"
              list="p-cats"
              value={d.category}
              onChange={(e) => set('category', e.target.value)}
            />
            <datalist id="p-cats">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Price" htmlFor="p-price" error={errors.price}>
            <Input
              id="p-price"
              inputMode="decimal"
              value={d.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="0.00"
            />
          </Field>
        </div>
        <div className="rounded-2xl border p-4">
          <label className="flex items-center justify-between gap-3 text-sm font-semibold">
            Track stock
            <input
              type="checkbox"
              className="size-4 accent-[#06b6d4]"
              checked={d.trackStock}
              onChange={(e) => set('trackStock', e.target.checked)}
            />
          </label>
          {d.trackStock ? (
            <Field label="Units available" htmlFor="p-stock" error={errors.stock} className="mt-3">
              <Input
                id="p-stock"
                type="number"
                min={0}
                step={1}
                value={d.stock}
                onChange={(e) => set('stock', e.target.value)}
              />
            </Field>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Always available, like drinks made to order.
            </p>
          )}
        </div>
        <label className="flex items-center gap-2.5 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 accent-[#06b6d4]"
            checked={d.featured}
            onChange={(e) => set('featured', e.target.checked)}
          />
          Show as popular and feature it in the hero
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {product ? 'Save changes' : 'Add product'}
          </Button>
        </div>
      </div>
    </form>
  )
}
