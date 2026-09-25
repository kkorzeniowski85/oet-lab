import { Redirect, Route, Router, Switch } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import TransferPage from '../features/transfer/Transfer.tsx'
import Layout from './Layout.tsx'
import { Home, More, NotFound, SectionPage, Settings } from './pages.tsx'

export default function App({ ssrPath }: { ssrPath?: string }) {
  return (
    <Router hook={useHashLocation} ssrPath={ssrPath}>
      <Layout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/settings" component={Settings} />
          <Route path="/more" component={More} />
          <Route path="/transfer/:from?">{(p) => <TransferPage from={p.from} />}</Route>
          <Route path="/:section/:tab/:view?/:item?">
            {(params) => {
              // wouter cannot infer the names of more than one optional parameter.
              const p = params as Record<string, string | undefined>
              return <SectionPage sectionId={p.section!} tabId={p.tab!} viewId={p.view} itemId={p.item} />
            }}
          </Route>
          <Route path="/:section">{(p) => <Redirect to={`/${p.section}/material`} replace />}</Route>
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </Router>
  )
}
