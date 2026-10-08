import { describe, expect, it } from 'vitest'
import { sampleProducts } from '@/store/sample'
import { filterProducts, stockState } from './catalog'

describe('filterProducts', () => {
  it('filters by category', () => {
    const r = filterProducts(sampleProducts, { category: 'Coffee' })
    expect(r.map((p) => p.category)).toEqual(['Coffee', 'Coffee'])
  })
  it('searches name, description and category, case-insensitive', () => {
    expect(filterProducts(sampleProducts, { query: 'CHOCOLATE' }).map((p) => p.id)).toContain(
      'p-pain-choc',
    )
    expect(filterProducts(sampleProducts, { query: 'lunch' }).map((p) => p.id)).toEqual([
      'p-focaccia',
    ])
  })
  it('sorts by price and always puts sold-out items last', () => {
    const r = filterProducts(sampleProducts, { sort: 'price-asc' })
    expect(r.at(-1)!.id).toBe('p-gelato')
    const prices = r.slice(0, -1).map((p) => p.price)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })
  it('puts featured products first by default', () => {
    const r = filterProducts(sampleProducts, {})
    const firstPlain = r.findIndex((p) => !p.featured)
    expect(r.slice(firstPlain).some((p) => p.featured)).toBe(false)
  })
})

describe('stockState', () => {
  it('labels unlimited, plenty, low and sold-out stock', () => {
    expect(stockState({ stock: null })).toBe('available')
    expect(stockState({ stock: 10 })).toBe('available')
    expect(stockState({ stock: 3 })).toBe('low')
    expect(stockState({ stock: 0 })).toBe('sold-out')
  })
})
