import { Component } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AppProvider } from './AppContext.jsx';
import Layout from './components/Layout.jsx';
import Overview from './pages/Overview.jsx';
import Financials from './pages/Financials.jsx';
import Businesses from './pages/Businesses.jsx';
import Company from './pages/Company.jsx';
import { Assets, CashFlow, Investments, Liabilities } from './pages/Resources.jsx';
import Allocation from './pages/Allocation.jsx';
import Forecast from './pages/Forecast.jsx';
import Insights from './pages/Insights.jsx';
import DataImport from './pages/DataImport.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import NoData from './components/NoData.jsx';
import { useApp } from './AppContext.jsx';
import { COMPANIES } from './lib/data.js';

function NotFound() {
  return (
    <div className="notfound">
      <h1>Page not found</h1>
      <p className="note">This address does not match any page in Meridian.</p>
      <Link className="btn" to="/">Back to the overview</Link>
    </div>
  );
}

/** Keeps one broken page from blanking the whole app. */
class PageBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error('Meridian page error', error); }
  render() {
    if (this.state.error) {
      return (
        <div className="notfound">
          <h1>Something went wrong on this page</h1>
          <p className="note">The rest of Meridian still works. Reloading usually fixes it.</p>
          <button className="btn" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const page = el => <PageBoundary>{el}</PageBoundary>;

/** Pages that calculate from the businesses show a "get started" screen until one has been added. */
function Gate({ title, children }) {
  useApp(); // re-render when a business is added or removed
  return COMPANIES.length ? children : <NoData title={title} />;
}
const gated = (title, el) => page(<Gate title={title}>{el}</Gate>);

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={gated('Overview', <Overview />)} />
            <Route path="financials" element={gated('Financials', <Financials />)} />
            <Route path="businesses" element={page(<Businesses />)} />
            <Route path="businesses/:id" element={gated('Business', <Company />)} />
            <Route path="assets" element={gated('Assets', <Assets />)} />
            <Route path="liabilities" element={gated('Liabilities', <Liabilities />)} />
            <Route path="cash-flow" element={gated('Cash flow', <CashFlow />)} />
            <Route path="investments" element={gated('Investments', <Investments />)} />
            <Route path="resource-allocation" element={gated('Resource allocation', <Allocation />)} />
            <Route path="forecast" element={gated('Forecast', <Forecast />)} />
            <Route path="insights" element={gated('Insights', <Insights />)} />
            <Route path="data-import" element={page(<DataImport />)} />
            <Route path="reports" element={gated('Reports', <Reports />)} />
            <Route path="settings" element={page(<Settings />)} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
