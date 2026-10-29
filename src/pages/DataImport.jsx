import { useRef, useState } from 'react';
import { useApp } from '../AppContext.jsx';
import { Icon } from '../components/Icon.jsx';
import { Card, CoDot, PageHead } from '../components/ui.jsx';
import { CO, COMPANIES, DOCS } from '../lib/data.js';
import { fmtDate, daysOld, DATA_AS_OF } from '../lib/format.js';
import { classify, DOC_TYPES, parseCSV } from '../lib/engine.js';

const MAX_BYTES = 20 * 1024 * 1024;

// Files are read in the browser only. Nothing is uploaded to a server.
async function readFile(f) {
  const ext = f.name.split('.').pop().toLowerCase();
  let rows = [], note = '';
  try {
    if (f.size > MAX_BYTES) note = 'File is larger than 20 MB, so only its name was used.';
    else if (ext === 'csv' || ext === 'txt') rows = parseCSV(await f.text());
    else if (ext === 'xlsx') {
      const { default: readXlsxFile, readSheetNames } = await import('read-excel-file');
      const names = await readSheetNames(f);
      rows = await readXlsxFile(f);
      note = `${names.length} sheet${names.length > 1 ? 's' : ''}: ${names.slice(0, 3).join(', ')}`;
    } else if (ext === 'xls') note = 'Old .xls format. Save it as .xlsx or .csv in Excel to read the rows.';
    else if (ext === 'pdf') note = 'PDF read as a statement. Check the type below.';
    else note = 'File type not recognised. Choose the type below.';
  } catch {
    note = 'Could not read this file. Check it opens in Excel, then try again.';
  }
  const text = rows.slice(0, 12).flat().map(v => (v == null ? '' : String(v))).join(' ');
  return { file: f.name, rows: Math.max(0, rows.length - 1), preview: rows.slice(0, 6), note, ...classify(f.name, text) };
}

const DEMO = [
  ['HHL_Guwahati_CashBook_Oct2026.csv', 'Date,Voucher,Receipt,Payment,Narration', 212],
  ['EEO_Haldia_Stock_Oct_wk1.xlsx', 'Item,Opening stock,Received,Issued,Closing stock (kg)', 96],
  ['Titagarh_Ledger_Q2.xlsx', 'Date,Account,Debit,Credit,Narration', 1840],
  ['ParkSt_Gold_Stock_Oct2026.xlsx', 'Item code,Description,Gross weight (grams),Karat,Value', 2104],
];

export default function DataImport() {
  const { toast, openDrawer, bump } = useApp();
  const [imports, setImports] = useState([]);
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const take = async files => {
    if (!files.length) return;
    toast(`Reading ${files.length} file${files.length > 1 ? 's' : ''}`);
    const out = [];
    for (const f of files) out.push(await readFile(f));
    setImports(prev => [...prev, ...out]);
  };
  const demo = () => setImports(prev => [...prev, ...DEMO.map(([n, h, r]) => ({ file: n, rows: r, preview: [h.split(',')], note: 'Sample file', ...classify(n, h) }))]);
  const upd = (i, k, v) => setImports(prev => prev.map((f, j) => { if (j !== i) return f; const n = { ...f, [k]: v, conf: 1 }; if (k === 'co') n.unit = v === 'fam' ? 'Family office' : 'All units'; return n; }));
  const confirm = () => {
    imports.forEach((f, i) => DOCS.push({ id: 'n' + Date.now() + i, file: f.file, co: f.co, unit: f.unit, type: f.type, date: DATA_AS_OF, rows: f.rows }));
    const n = imports.length; setImports([]); bump(); toast(`${n} file${n > 1 ? 's' : ''} imported and sorted`);
  };
  const preview = f => openDrawer('Preview', f.file, f.preview.length ? (
    <><div className="tbl-wrap"><table className="tbl"><tbody>{f.preview.map((r, i) => <tr key={i}>{r.slice(0, 8).map((c, j) => <td key={j} style={i === 0 ? { fontWeight: 600 } : undefined}>{c == null ? '' : String(c)}</td>)}</tr>)}</tbody></table></div>
      <p className="note">First rows of the first sheet. The original file is not changed.</p></>
  ) : <p className="note">No table preview for this file type.</p>);
  const sorted = [...DOCS].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHead title="Data import" sub="Add balance sheets, profit and loss statements, ledgers, stock registers and cash books. Meridian reads each file, sorts it to the right company and unit, and lets you correct anything before it is used." />
      <label className={`drop${over ? ' over' : ''}`} htmlFor="fileIn" tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current.click(); } }}
        onDragEnter={e => { e.preventDefault(); setOver(true); }} onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={e => { e.preventDefault(); setOver(false); }} onDrop={e => { e.preventDefault(); setOver(false); take([...e.dataTransfer.files]); }}>
        <Icon name="upload" /><h3>Drop Excel, CSV or PDF files here</h3>
        <p className="note">or select files from your computer. Files are read in this browser only and are never uploaded. Originals are kept untouched.</p>
        <span className="btn sm" style={{ pointerEvents: 'none' }}>Choose files</span>
        <input id="fileIn" ref={input} type="file" multiple accept=".xlsx,.xls,.csv,.pdf,.txt" hidden onChange={e => { take([...e.target.files]); e.target.value = ''; }} />
      </label>
      <div className="row" style={{ justifyContent: 'center' }}><button className="btn ghost sm" onClick={demo}><Icon name="file" /> Try with four sample files</button></div>
      {imports.length > 0 && (
        <Card title="Check the mapping" hint="Meridian's guess is filled in. Change any company, unit or type that is wrong, then confirm." bodyClass="card-b tbl-wrap"
          actions={<div className="row"><button className="btn ghost sm" onClick={() => setImports([])}>Discard</button><button className="btn sm" onClick={confirm}><Icon name="check" /> Confirm {imports.length} file{imports.length > 1 ? 's' : ''}</button></div>}>
          <table className="tbl">
            <thead><tr><th>File</th><th>Company</th><th>Unit</th><th>Document type</th><th className="r">Rows</th><th>Confidence</th><th /></tr></thead>
            <tbody>{imports.map((f, i) => { const units = f.co === 'fam' ? ['Family office'] : ['All units', ...CO[f.co].factories.map(x => x.n)]; return (
              <tr key={i}>
                <td><div style={{ fontWeight: 500, wordBreak: 'break-all', minWidth: 180 }}>{f.file}</div>{f.note && <div className="small t-muted">{f.note}</div>}</td>
                <td><select className="input" style={{ minWidth: 150 }} value={f.co} onChange={e => upd(i, 'co', e.target.value)}>{COMPANIES.map(c => <option key={c.id} value={c.id}>{c.short}</option>)}<option value="fam">Family office</option></select></td>
                <td><select className="input" style={{ minWidth: 150 }} value={units.includes(f.unit) ? f.unit : units[0]} onChange={e => upd(i, 'unit', e.target.value)}>{units.map(u => <option key={u}>{u}</option>)}</select></td>
                <td><select className="input" style={{ minWidth: 140 }} value={f.type} onChange={e => upd(i, 'type', e.target.value)}>{DOC_TYPES.map(t => <option key={t}>{t}</option>)}</select></td>
                <td className="r">{f.rows.toLocaleString('en-IN')}</td>
                <td><span className={`delta ${f.conf > 0.7 ? 'up' : f.conf > 0.5 ? 'warn' : 'down'}`}>{Math.round(f.conf * 100)}%</span></td>
                <td><button className="btn ghost sm" onClick={() => preview(f)}>Preview</button></td>
              </tr>); })}
            </tbody>
          </table>
        </Card>
      )}
      <Card title="Imported files" hint={`${DOCS.length} files feeding the platform. Files older than 45 days are flagged because they can make advice less reliable.`} bodyClass="card-b tbl-wrap">
        <table className="tbl">
          <thead><tr><th>File</th><th>Company</th><th>Unit</th><th>Type</th><th className="r">Rows</th><th>Imported</th></tr></thead>
          <tbody>{sorted.map(d => { const a = daysOld(d.date); const id = d.co === 'all' ? 'fam' : d.co; return (
            <tr key={d.id}><td style={{ wordBreak: 'break-all' }}>{d.file}</td>
              <td><span className="row" style={{ gap: 7, flexWrap: 'nowrap' }}><CoDot id={id} />{d.co === 'all' ? 'All companies' : d.co === 'fam' ? 'Family office' : CO[d.co] ? CO[d.co].short : 'Removed'}</span></td>
              <td className="t-muted">{d.unit}</td><td>{d.type}</td><td className="r">{d.rows.toLocaleString('en-IN')}</td>
              <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(d.date)} {a > 45 && <span className="delta warn">{a} days</span>}</td></tr>); })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
