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

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={page(<Overview />)} />
            <Route path="financials" element={page(<Financials />)} />
            <Route path="businesses" element={page(<Businesses />)} />
            <Route path="businesses/:id" element={page(<Company />)} />
            <Route path="assets" element={page(<Assets />)} />
            <Route path="liabilities" element={page(<Liabilities />)} />
            <Route path="cash-flow" element={page(<CashFlow />)} />
            <Route path="investments" element={page(<Investments />)} />
            <Route path="resource-allocation" element={page(<Allocation />)} />
            <Route path="forecast" element={page(<Forecast />)} />
            <Route path="insights" element={page(<Insights />)} />
            <Route path="data-import" element={page(<DataImport />)} />
            <Route path="reports" element={page(<Reports />)} />
            <Route path="settings" element={page(<Settings />)} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
