import type { Product } from './types'

export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name'

/** Category + search + sort for the storefront. Sold-out items always sink to the end. */
export function filterProducts(products: Product[], { category = 'All', query = '', sort = 'featured' }: { category?: string; query?: string; sort?: SortKey }) {
  const q = query.trim().toLowerCase()
  const list = products.filter(
    (p) => (category === 'All' || p.category === category) && (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  )
  const soldOut = (p: Product) => (p.stock !== null && p.stock <= 0 ? 1 : 0)
  const by: Record<SortKey, (a: Product, b: Product) => number> = {
    featured: (a, b) => Number(b.featured) - Number(a.featured),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
  }
  return [...list].sort((a, b) => soldOut(a) - soldOut(b) || by[sort](a, b))
}
