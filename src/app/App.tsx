import { Redirect, Route, Router, Switch } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import Layout from './Layout.tsx'
import { Home, NotFound, SectionPage, Settings } from './pages.tsx'

export default function App({ ssrPath }: { ssrPath?: string }) {
  return (
    <Router hook={useHashLocation} ssrPath={ssrPath}>
      <Layout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/settings" component={Settings} />
          <Route path="/:section/:tab/:view?">
            {(p) => <SectionPage sectionId={p.section} tabId={p.tab} viewId={p.view} />}
          </Route>
          <Route path="/:section">{(p) => <Redirect to={`/${p.section}/material`} replace />}</Route>
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </Router>
  )
}
