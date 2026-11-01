import { useApp } from '../AppContext.jsx';
import { Icon } from './Icon.jsx';
import { AddBusinessForm } from './finance.jsx';
import { Card, PageHead } from './ui.jsx';
import { useNavigate } from 'react-router-dom';
import { COMPANIES } from '../lib/data.js';
import { MAX_COS } from '../lib/engine.js';

/** Shown in place of a page that has nothing to calculate from yet. */
export default function NoData({ title }) {
  const { openDrawer } = useApp();
  const navigate = useNavigate();
  const add = () => openDrawer('Add a business', `${COMPANIES.length} of ${MAX_COS} businesses in use`, <AddBusinessForm />);
  return (
    <>
      <PageHead title={title} sub="Nothing to show yet. Add your first business and this page fills in from its figures." />
      <Card title="Get started" hint="Meridian starts empty. Everything on every page is calculated from what you enter.">
        <div style={{ display: 'grid', gap: 14, justifyItems: 'start' }}>
          <p className="note">Enter a business's main figures (capital, sales, margin, cash and loans) and Meridian estimates the rest. You can import its balance sheet and ledgers later to replace the estimates.</p>
          <div className="row">
            <button className="btn" onClick={add}><Icon name="plus" /> Add a business</button>
            <button className="btn ghost" onClick={() => navigate('/data-import')}><Icon name="upload" /> Import files</button>
          </div>
        </div>
      </Card>
    </>
  );
}
