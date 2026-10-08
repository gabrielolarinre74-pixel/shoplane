import { Link, useRoute } from 'wouter'
import { ExternalLink, Package, ReceiptText, Settings } from 'lucide-react'
import { LogoMark } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

const tabs = [
  { href: '/manage', label: 'Orders', icon: ReceiptText },
  { href: '/manage/products', label: 'Products', icon: Package },
  { href: '/manage/settings', label: 'Settings', icon: Settings },
]

function Tab({ href, label, icon: Icon }: (typeof tabs)[number]) {
  const [active] = useRoute(href)
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition',
        active
          ? 'bg-ink text-ink-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="size-4" /> {label}
    </Link>
  )
}

export function ManageShell({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  const shopName = useStore((s) => s.shop.name)
  const openOrders = useStore((s) => s.orders.filter((o) => o.status === 'new').length)
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/manage" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight">Shoplane</span>
              <span className="block max-w-40 truncate text-xs text-muted-foreground">
                {shopName}
              </span>
            </span>
          </Link>
          <nav className="mx-auto hidden items-center gap-1 md:flex" aria-label="Manager">
            {tabs.map((t) => (
              <Tab key={t.href} {...t} />
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {openOrders > 0 && (
              <span className="hidden rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-strong lg:inline">
                {openOrders} new {openOrders === 1 ? 'order' : 'orders'}
              </span>
            )}
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-full border bg-card px-4 text-sm font-semibold hover:bg-muted"
            >
              <ExternalLink className="size-4" />{' '}
              <span className="hidden sm:inline">Storefront</span>
            </Link>
          </div>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden"
          aria-label="Manager"
        >
          {tabs.map((t) => (
            <Tab key={t.href} {...t} />
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            {description && <p className="mt-1 text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
        {children}
      </main>
    </div>
  )
}
