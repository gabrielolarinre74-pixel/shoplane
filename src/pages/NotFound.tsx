import { Link } from 'wouter'
import { LogoMark } from '@/components/Logo'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <LogoMark className="size-12" />
      <p className="text-brand mt-8 text-7xl font-semibold tracking-tight">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">This aisle doesn’t exist</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        The page may have moved. Head back to the shop or open the manager.
      </p>
      <div className="mt-8 flex gap-2">
        <Link
          href="/"
          className="bg-brand shadow-glow inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-white"
        >
          Back to the shop
        </Link>
        <Link
          href="/manage"
          className="inline-flex h-11 items-center rounded-full border bg-card px-5 text-sm font-semibold hover:bg-muted"
        >
          Manage orders
        </Link>
      </div>
    </div>
  )
}
