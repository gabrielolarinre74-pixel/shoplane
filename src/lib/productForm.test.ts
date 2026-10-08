import { describe, expect, it } from 'vitest'
import { sampleProducts } from '@/store/sample'
import { parseDraft, toDraft } from './productForm'

describe('product form', () => {
  it('round-trips an existing product', () => {
    const p = sampleProducts[0]
    const r = parseDraft(toDraft(p))
    expect(r.ok && r.value).toMatchObject({
      name: p.name,
      price: p.price,
      stock: p.stock,
      category: p.category,
    })
  })
  it('treats untracked stock as always available', () => {
    const r = parseDraft({
      ...toDraft(),
      name: 'Tea',
      category: 'Drinks',
      price: '$2.50',
      trackStock: false,
      stock: 'abc',
    })
    expect(r.ok && r.value.stock).toBeNull()
    expect(r.ok && r.value.price).toBe(2.5)
  })
  it('reports field errors', () => {
    const r = parseDraft({ ...toDraft(), name: 'A', price: '0', stock: '-1' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['category', 'name', 'price', 'stock'])
  })
  it('rejects fractional stock', () => {
    const r = parseDraft({ ...toDraft(), name: 'Bun', category: 'Bread', price: '3', stock: '2.5' })
    expect(!r.ok && r.errors.stock).toBeTruthy()
  })
})
