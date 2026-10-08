import { Route, Router, Switch } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import { Toaster } from 'sonner'
import Storefront from '@/pages/Storefront'
import Orders from '@/pages/manage/Orders'
import Products from '@/pages/manage/Products'
import Settings from '@/pages/manage/Settings'
import NotFound from '@/pages/NotFound'
import { useTheme } from '@/lib/theme'

export function Routes() {
  return (
    <Switch>
      <Route path="/" component={Storefront} />
      <Route path="/manage" component={Orders} />
      <Route path="/manage/products" component={Products} />
      <Route path="/manage/settings" component={Settings} />
      <Route>
        <NotFound />
      </Route>
    </Switch>
  )
}

export default function App() {
  const { theme } = useTheme()
  return (
    <Router hook={useHashLocation}>
      <Routes />
      <Toaster
        position="bottom-center"
        richColors
        closeButton
        theme={theme}
        toastOptions={{ style: { fontFamily: 'inherit', borderRadius: 16 } }}
      />
    </Router>
  )
}
