import { z } from 'zod'
import { parseAmount } from './money'
import type { ArtKey, Product } from './types'

export type ProductDraft = {
  name: string
  description: string
  category: string
  price: string
  trackStock: boolean
  stock: string
  art: ArtKey
  image?: string
  featured: boolean
}

export function toDraft(p?: Product): ProductDraft {
  return {
    name: p?.name ?? '',
    description: p?.description ?? '',
    category: p?.category ?? '',
    price: p ? String(p.price) : '',
    trackStock: p ? p.stock !== null : true,
    stock: p?.stock != null ? String(p.stock) : '10',
    art: p?.art ?? 'box',
    image: p?.image,
    featured: p?.featured ?? false,
  }
}

const schema = z.object({
  name: z.string().trim().min(2, 'Give the product a name').max(80),
  description: z.string().trim().max(240, 'Keep it under 240 characters'),
  category: z.string().trim().min(1, 'Pick or type a category').max(30),
  price: z
    .string()
    .refine((v) => v.trim() !== '' && parseAmount(v) > 0, 'Price must be more than zero')
    .refine((v) => parseAmount(v) < 100000, 'That price looks too high'),
  stock: z.string(),
})

/** Validates the form and returns product values ready for the store, or field errors. */
export function parseDraft(
  d: ProductDraft,
):
  | { ok: true; value: Omit<Product, 'id' | 'createdAt'> }
  | { ok: false; errors: Partial<Record<keyof ProductDraft, string>> } {
  const r = schema.safeParse(d)
  const errors: Partial<Record<keyof ProductDraft, string>> = {}
  if (!r.success)
    for (const i of r.error.issues) errors[i.path[0] as keyof ProductDraft] ??= i.message
  let stock: number | null = null
  if (d.trackStock) {
    const n = Number(d.stock)
    if (!Number.isInteger(n) || n < 0) errors.stock = 'Stock must be a whole number, 0 or more'
    else stock = n
  }
  if (Object.keys(errors).length) return { ok: false, errors }
  return {
    ok: true,
    value: {
      name: d.name.trim(),
      description: d.description.trim(),
      category: d.category.trim(),
      price: Math.round(parseAmount(d.price) * 100) / 100,
      stock,
      art: d.art,
      image: d.image,
      featured: d.featured,
    },
  }
}
