import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext.jsx';
import { Icon } from '../components/Icon.jsx';
import { Card, Empty, PageHead, SampleBanner, Tag } from '../components/ui.jsx';
import { REPORTS, reportText, scenarioReport } from '../lib/engine.js';

/** A plain-text report with copy and download buttons. */
export function ReportView({ text, file = 'meridian-report.txt' }) {
  const { toast } = useApp();
  const ref = useRef(null);
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => toast('Report copied'), () => {
      const r = document.createRange(); r.selectNodeContents(ref.current); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      toast('Text selected. Press Ctrl+C to copy.');
    });
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = file; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <pre className="report-text" ref={ref}>{text}</pre>
      <div className="row"><button className="btn" onClick={copy}><Icon name="copy" /> Copy report</button><button className="btn ghost" onClick={download}><Icon name="import" /> Download .txt</button>
        <span className="note">Paste into an email or a document for the family or the accountants.</span></div>
    </>
  );
}

export default function Reports() {
  const { openModal, saved, chosen } = useApp();
  const navigate = useNavigate();
  return (
    <>
      <PageHead title="Reports" sub="Short reports to share with the family or the accountants. Each one opens ready to copy or download." />
      <SampleBanner>Reports are generated from the sample data in this build and say so at the top.</SampleBanner>
      <div className="grid g4">{REPORTS.map(([k, n, d]) => (
        <section className="card card-pad" key={k} style={{ display: 'grid', gap: 10, alignContent: 'space-between' }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 8, background: 'var(--line-2)' }}><Icon name="reports" style={{ width: 16, height: 16, stroke: 'var(--accent)' }} /></span>
            <h3 style={{ fontSize: 14.5, marginTop: 6 }}>{n}</h3><p className="note">{d}</p>
          </div>
          <button className="btn ghost sm" onClick={() => openModal(n, <ReportView text={reportText(k)} file={`meridian-${k}.txt`} />)}>Generate</button>
        </section>))}
      </div>
      <Card title="Saved scenarios" hint="Plans saved in the What If simulator"
        actions={<button className="btn ghost sm" onClick={() => navigate('/resource-allocation?tab=whatif')}><Icon name="move" /> Open simulator</button>}>
        {saved.length ? (
          <div className="list">{saved.map(s => (
            <div className="list-row" key={s.name}><span className={`sev ${chosen === s.name ? 'gain' : 'info'}`} />
              <div><div className="t">{s.name} {chosen === s.name && <Tag tone="growing" style={{ marginLeft: 6 }}>Chosen plan</Tag>}</div><div className="d">Saved {s.date}</div></div>
              <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => openModal('Scenario report', <ReportView text={scenarioReport(s.name, s.sc)} file="meridian-scenario.txt" />)}>Export</button>
            </div>))}
          </div>
        ) : <Empty>No saved scenarios yet. Save one from the What If simulator to export it here.</Empty>}
      </Card>
    </>
  );
}
