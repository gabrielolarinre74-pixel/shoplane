import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ManageShell } from '@/components/manage/ManageShell'
import { ProductDialog } from '@/components/manage/ProductDialog'
import { ProductArt } from '@/components/shop/ProductArt'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { filterProducts } from '@/lib/catalog'
import { formatMoney } from '@/lib/money'
import type { Product } from '@/lib/types'
import { useStore } from '@/store'

export default function Products() {
  const products = useStore((s) => s.products)
  const currency = useStore((s) => s.shop.currency)
  const saveProduct = useStore((s) => s.saveProduct)
  const deleteProduct = useStore((s) => s.deleteProduct)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Product | undefined>()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<Product | null>(null)
  const list = useMemo(() => filterProducts(products, { query, sort: 'name' }), [products, query])
  const low = products.filter((p) => p.stock !== null && p.stock <= 3)

  const setStock = (p: Product, n: number) => saveProduct({ ...p, stock: Math.max(0, n) })

  return (
    <ManageShell
      title="Products"
      description="What shoppers see on the storefront. Stock goes down as orders come in."
      action={
        <Button
          variant="primary"
          onClick={() => {
            setEditing(undefined)
            setOpen(true)
          }}
        >
          <Plus /> New product
        </Button>
      }
    >
      {low.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm">
          <span className="font-semibold text-danger">Running low:</span>
          {low.map((p) => (
            <span
              key={p.id}
              className="rounded-full bg-card px-2.5 py-0.5 text-xs font-medium ring-1 ring-border"
            >
              {p.name} · {p.stock}
            </span>
          ))}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="flex items-center gap-3 border-b p-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-full border border-input bg-background pr-4 pl-10 text-sm focus:border-primary-strong focus:ring-4 focus:ring-primary/25 focus:outline-none"
            />
          </div>
          <span className="ml-auto text-sm text-muted-foreground">{products.length} products</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs font-semibold text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-11 shrink-0 overflow-hidden rounded-xl">
                        <ProductArt product={p} />
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium">
                          {p.name}
                          {p.featured && (
                            <Star
                              className="size-3.5 fill-current text-primary"
                              aria-label="Popular"
                            />
                          )}
                        </p>
                        <p className="max-w-xs truncate text-xs text-muted-foreground">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="tabular px-4 py-3 text-right font-medium">
                    {formatMoney(p.price, currency)}
                  </td>
                  <td className="px-4 py-3">
                    {p.stock === null ? (
                      <span className="text-xs font-medium text-muted-foreground">
                        Always available
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <QuantityStepper
                          size="sm"
                          label={`${p.name} stock`}
                          value={p.stock}
                          max={9999}
                          onChange={(n) => setStock(p, n)}
                        />
                        {p.stock === 0 && (
                          <span className="text-xs font-semibold text-danger">Sold out</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${p.name}`}
                        onClick={() => {
                          setEditing(p)
                          setOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${p.name}`}
                        className="text-danger"
                        onClick={() => setConfirm(p)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!list.length && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-muted-foreground">
                    No products match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductDialog open={open} product={editing} onOpenChange={setOpen} />
      <Dialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Delete product?"
        description={
          confirm
            ? `${confirm.name} will disappear from the storefront and from any open bags. Past orders keep their copy.`
            : ''
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm) {
                deleteProduct(confirm.id)
                toast.success(`${confirm.name} deleted`)
              }
              setConfirm(null)
            }}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </ManageShell>
  )
}
