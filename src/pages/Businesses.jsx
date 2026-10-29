import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext.jsx';
import { Icon } from '../components/Icon.jsx';
import { AddBusinessForm } from '../components/finance.jsx';
import { Callout, PageHead, Spark, Tag } from '../components/ui.jsx';
import { COMPANIES } from '../lib/data.js';
import { CR, inr, pct, coC } from '../lib/format.js';
import { metrics, outlook, ranking, MAX_COS } from '../lib/engine.js';

export default function Businesses() {
  const { openDrawer } = useApp();
  const navigate = useNavigate();
  const rk = ranking();
  const full = COMPANIES.length >= MAX_COS;
  const add = () => openDrawer('Add a business', `${COMPANIES.length} of ${MAX_COS} businesses in use`, <AddBusinessForm />);
  return (
    <>
      <PageHead title="Businesses" sub="Every business the family owns. Open one to see its factories, documents and reserves in its own colour.">
        <div className="row">
          <span className="co-count">{COMPANIES.length} of {MAX_COS} businesses</span>
          <button className="btn sm" onClick={add} disabled={full} title={full ? `Meridian holds up to ${MAX_COS} businesses` : undefined}><Icon name="plus" /> Add a business</button>
        </div>
      </PageHead>
      {full && <Callout>Meridian holds up to {MAX_COS} businesses. Remove one you added to make room for another.</Callout>}
      <div className="grid g2">
        {COMPANIES.map(c => {
          const m = metrics(c), o = outlook(c, m);
          return (
            <button key={c.id} className="card biz" style={{ '--bc': `var(--c-${c.id})` }} onClick={() => navigate(`/businesses/${c.id}`)} aria-label={`Open ${c.name}`}>
              <div className="biz-top" />
              <div className="biz-in">
                <div className="biz-h">
                  <div><h3>{c.name}</h3><div className="ind">{c.industry} · {c.factories.length} unit{c.factories.length === 1 ? '' : 's'}</div></div>
                  <Tag tone={o.tag}>{o.label}</Tag>
                </div>
                <div className="biz-grid">
                  <div><div className="l">Capital invested</div><div className="v">{inr(c.capital * CR)}</div></div>
                  <div><div className="l">Sales, 12 months</div><div className="v">{inr(m.ttmRev * CR)}</div></div>
                  <div><div className="l">True net profit</div><div className="v">{inr(m.trueProfit * CR)}</div></div>
                  <div><div className="l">Value (net assets)</div><div className="v">{inr(m.equity * CR)}</div></div>
                  <div><div className="l">Return on capital</div><div className={`v ${m.trueRoce < 0.05 ? 't-loss' : ''}`}>{pct(m.trueRoce)}</div></div>
                  <div><div className="l">Cash returned, 12 months</div><div className="v">{inr(m.trueProfit * 0.45 * CR)}</div></div>
                </div>
                <div style={{ height: 34 }}><Spark vals={c.rev} color={coC(c.id) || c.theme.main} w={300} h={34} /></div>
                <div className="biz-open">Rank {rk.findIndex(r => r.c.id === c.id) + 1} of {COMPANIES.length} · Open workspace <Icon name="arrowR" /></div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
