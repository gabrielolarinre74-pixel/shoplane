import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark' || (theme === 'system' && document.documentElement.classList.contains('dark'))
  return (
    <button
      type='button'
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn('flex size-10 items-center justify-center rounded-full border bg-card text-foreground transition hover:bg-muted', className)}
    >
      {dark ? <Sun className='size-4' /> : <Moon className='size-4' />}
    </button>
  )
}
