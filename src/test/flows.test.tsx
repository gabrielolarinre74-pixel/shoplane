import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import { Routes } from '@/App'
import { useStore } from '@/store'
import { sampleOrders, sampleProducts, sampleShop } from '@/store/sample'

function renderAt(path: string) {
  const { hook } = memoryLocation({ path })
  return render(
    <Router hook={hook}>
      <Routes />
    </Router>,
  )
}

beforeEach(() =>
  useStore.setState({
    shop: sampleShop,
    products: sampleProducts,
    orders: sampleOrders(),
    cart: [],
    promo: '',
    fulfilment: 'pickup',
  }),
)

describe('storefront', () => {
  it('filters the menu by category and search', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByRole('tab', { name: 'Coffee' }))
    expect(screen.getByRole('heading', { name: 'Flat white' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Country sourdough' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'All' }))
    await user.type(screen.getByLabelText('Search the menu'), 'zzz')
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument()
  })

  it('takes a shopper from add-to-bag to a WhatsApp order', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByRole('button', { name: 'Add Butter croissant to cart' }))
    await user.click(screen.getByRole('button', { name: 'Increase Butter croissant' }))
    await user.click(screen.getByRole('button', { name: /Open bag, 2 items/ }))
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByRole('button', { name: 'Checkout · $7.50' })).toBeInTheDocument()

    await user.click(within(sheet).getByRole('button', { name: /Checkout/ }))
    await user.click(screen.getByRole('button', { name: 'Place order' }))
    expect(screen.getByText('Tell the shop who the order is for')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Your name'), 'Maya Chen')
    await user.type(screen.getByLabelText('Phone / WhatsApp'), '+1 555 0142')
    await user.click(screen.getByRole('button', { name: 'Place order' }))

    expect(await screen.findByText('Order #1009 is ready')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Send on WhatsApp/ })
    expect(link.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/15550100\?text=/)
    expect(decodeURIComponent(link.getAttribute('href')!)).toContain('2 × Butter croissant')
    expect(useStore.getState().products.find((p) => p.id === 'p-croissant')!.stock).toBe(28)
    expect(useStore.getState().cart).toEqual([])
  })

  it('rejects an unknown promo code', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByRole('button', { name: 'Add Flat white to cart' }))
    await user.click(screen.getByRole('button', { name: /Open bag/ }))
    await user.type(screen.getByLabelText('Promo code'), 'NOPE')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(useStore.getState().promo).toBe('')
  })
})

describe('manager', () => {
  it('moves an order along the status flow', async () => {
    const user = userEvent.setup()
    renderAt('/manage')
    const before = useStore.getState().orders.find((o) => o.status === 'new')!
    await user.click(screen.getAllByRole('button', { name: 'Mark confirmed' })[0])
    expect(useStore.getState().orders.find((o) => o.id === before.id)!.status).toBe('confirmed')
  })

  it('adds a product that then shows on the storefront', async () => {
    const user = userEvent.setup()
    renderAt('/manage/products')
    await user.click(screen.getByRole('button', { name: /New product/ }))
    await user.type(screen.getByLabelText('Name'), 'Lemon tart')
    await user.type(screen.getByLabelText('Category'), 'Sweet')
    await user.type(screen.getByLabelText('Price'), '6.25')
    await user.click(screen.getByRole('button', { name: 'Add product' }))
    expect(useStore.getState().products[0]).toMatchObject({
      name: 'Lemon tart',
      price: 6.25,
      stock: 10,
    })
  })

  it('validates shop settings before saving', async () => {
    const user = userEvent.setup()
    renderAt('/manage/settings')
    const wa = screen.getByLabelText('WhatsApp number')
    await user.clear(wa)
    await user.type(wa, '12')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText(/full number with country code/)).toBeInTheDocument()
    expect(useStore.getState().shop.whatsapp).toBe(sampleShop.whatsapp)
  })
})
