import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { LEVELS } from '../crowd.js';
import BarChart from '../components/BarChart.jsx';
import CrowdBadge from '../components/CrowdBadge.jsx';
import { getSession } from '../api.js';

async function downloadPassengerCsv(){
  const res=await fetch('/api/admin/passenger-reports.csv',{headers:{Authorization:`Bearer ${getSession()?.token||''}`}});
  if(!res.ok) throw new Error('Could not export passenger reports.');
  const url=URL.createObjectURL(await res.blob()),a=document.createElement('a');a.href=url;a.download='smartbus-passenger-reports.csv';a.click();URL.revokeObjectURL(url);
}

function Dashboard() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [exportError,setExportError]=useState('');
  useEffect(() => { api('/admin/dashboard').then(setD).catch((e) => setError(e.message)); }, []);
  if (error) return <p className="error" role="alert">{error}</p>;
  if (!d) return <p>Loading…</p>;
  return (
    <>
      <div className="card"><h2>Passenger data export</h2><p>Download real passenger observations from the demo network and imported BMTC feed as CSV. Synthetic training examples are excluded.</p><button onClick={()=>downloadPassengerCsv().catch(e=>setExportError(e.message))}>Download passenger reports CSV</button>{exportError&&<p className="error" role="alert">{exportError}</p>}</div>
      <div className="stats">
        {[['Routes', d.totalRoutes], ['Buses', d.totalBuses], ['Stops', d.totalStops], ['Reports', d.totalReports]].map(([l, v]) => (
          <div className="card stat" key={l}><strong>{v}</strong><span>{l}</span></div>
        ))}
      </div>
      <div className="card"><h2>Crowd distribution (all reports)</h2>
        <BarChart data={Object.entries(LEVELS).map(([k, i]) => ({ label: i.label, value: d.crowdDistribution[k] ?? 0, color: i.color }))} /></div>
      <div className="card"><h2>Historical average occupancy by hour</h2>
        <BarChart unit="%" max={100} data={Object.entries(d.averageOccupancyByHour).map(([h, v]) => ({ label: `${h}h`, value: v }))} />
        <small>Report sources: {Object.entries(d.reportsBySource).map(([k, v]) => `${k.toLowerCase()} ${v}`).join(', ')}. Synthetic reports are simulated.</small></div>
    </>
  );
}

function Analytics(){
  const [rows,setRows]=useState([]),[metrics,setMetrics]=useState(null),[error,setError]=useState('');
  useEffect(()=>{Promise.all([api('/admin/route-heatmap'),api('/admin/model-info')]).then(([h,m])=>{setRows(h);setMetrics(m);}).catch(e=>setError(e.message));},[]);
  const max=Math.max(1,...rows.map(x=>Number(x.occupancy)));
  const leaderboard=Object.values(rows.reduce((acc,r)=>{const key=r.route_id;acc[key]??={route:key,total:0,count:0};acc[key].total+=Number(r.occupancy);acc[key].count++;return acc;},{})).map(x=>({...x,average:x.total/x.count})).sort((a,b)=>b.average-a.average).slice(0,10);
  return <div className="card"><h2>Passenger crowd by route, weekday, and hour</h2>{error&&<p className="error" role="alert">{error}</p>}<div className="heatmap-grid">{rows.map(r=><div title={`${r.route_id} · day ${r.weekday} · ${r.hour}:00 · ${r.occupancy}% (${r.reports} reports)`} key={`${r.route_id}-${r.weekday}-${r.hour}`} style={{background:`rgba(190,54,45,${.12+.75*Number(r.occupancy)/max})`}}>{r.route_id}/{r.weekday}/{r.hour}h<br/>{Math.round(r.occupancy)}%</div>)}</div>
    {leaderboard.length>0&&<><h3>Most crowded demo routes (reported average)</h3><ol>{leaderboard.map(r=><li key={r.route}>{r.route}: {r.average.toFixed(1)}%</li>)}</ol></>}
    {metrics&&<><h2>Model comparison (simulated holdout)</h2><table><thead><tr><th>Model</th><th>MAE</th><th>R²</th></tr></thead><tbody>{(metrics.model_comparison||[]).map(m=><tr key={m.model}><td>{m.model}</td><td>{m.mae_percentage_points} percentage points</td><td>{m.r2}</td></tr>)}</tbody></table><h3>Random Forest feature importance</h3><ul>{(metrics.feature_importance||[]).map(f=><li key={f.feature}>{f.feature}: {f.importance}</li>)}</ul><small>Metrics use generated demo data only; they do not establish real-bus accuracy.</small></>}
  </div>;
}

function Moderation(){
  const [rows,setRows]=useState([]),[selected,setSelected]=useState({}),[message,setMessage]=useState('');
  const load=useCallback(()=>api('/admin/reports/flagged').then(setRows).catch(e=>setMessage(e.message)),[]);
  useEffect(()=>{load();},[load]);
  async function action(network,endpoint){const ids=rows.filter(r=>r.network===network&&selected[`${network}:${r.id}`]).map(r=>r.id);if(!ids.length)return;try{await api(`/admin/reports/${endpoint}`,{method:'POST',body:{network,ids}});setSelected({});setMessage('Moderation changes saved.');load();}catch(e){setMessage(e.message);}}
  return <div className="card"><h2>Flagged reports</h2><p>Reports are auto-flagged when crowd levels differ sharply from recent route reports, or when passengers flag them. Review before deleting.</p>{message&&<p role="status">{message}</p>}{rows.length===0?<p>No reports are flagged.</p>:<><table><thead><tr><th>Select</th><th>Network</th><th>Route</th><th>Level</th><th>Auto flag</th><th>User flags</th><th>Reason/note</th></tr></thead><tbody>{rows.map(r=><tr key={`${r.network}:${r.id}`}><td><input type="checkbox" aria-label={`Select report ${r.id}`} checked={Boolean(selected[`${r.network}:${r.id}`])} onChange={e=>setSelected(v=>({...v,[`${r.network}:${r.id}`]:e.target.checked}))}/></td><td>{r.network}</td><td>{r.route}</td><td>{r.level} ({r.occupancy}%)</td><td>{r.auto_flagged?'Yes':'No'}</td><td>{r.user_flags}</td><td>{r.note||'—'}</td></tr>)}</tbody></table>{['demo','BMTC'].map(n=><div className="row" key={n}><button onClick={()=>action(n,'bulk-delete')}>Delete selected {n} reports</button><button onClick={()=>action(n,'moderation/resolve')}>Dismiss selected {n} flags</button></div>)}</>}</div>;
}

function ForecastAccuracy(){
  const [rows,setRows]=useState([]),[error,setError]=useState('');
  useEffect(()=>{api('/admin/forecast-accuracy').then(setRows).catch(e=>setError(e.message));},[]);
  const mae=rows.length?rows.reduce((sum,r)=>sum+Math.abs(Number(r.error)),0)/rows.length:null;
  return <div className="card"><h2>Forecast versus passenger reports</h2><p>Matches a forecast with the first later passenger report for the same route, weekday, and nearby hour. It is a rough retrospective check, not a controlled model evaluation.</p>{error&&<p className="error" role="alert">{error}</p>}{mae!==null&&<p>Matched observations: {rows.length} · mean absolute error: {mae.toFixed(1)} percentage points</p>}{rows.length===0?<p>No later passenger reports match stored forecasts yet.</p>:<><div className="chart" role="img" aria-label="Absolute forecast error for recent comparisons">{rows.slice(0,24).reverse().map(r=><div className="bar-col" key={r.id}><span className="bar-val">{Math.round(Math.abs(r.error))}</span><div className="bar" style={{height:`${Math.max(2,Math.abs(r.error))}%`,background:Number(r.error)>0?'#c53b32':'#18864b'}}/><span className="bar-label">{r.route}</span></div>)}</div><table><thead><tr><th>Route</th><th>Time</th><th>Forecast</th><th>Report</th><th>Error</th></tr></thead><tbody>{rows.slice(0,100).map(r=><tr key={r.id}><td>{r.route}</td><td>{r.travel_time}</td><td>{Math.round(r.predicted)}%</td><td>{r.actual}%</td><td>{Number(r.error)>0?'+':''}{Number(r.error).toFixed(1)} points</td></tr>)}</tbody></table></>}</div>;
}

function AuditLog(){
  const [rows,setRows]=useState([]),[error,setError]=useState('');
  useEffect(()=>{api('/admin/audit-log').then(setRows).catch(e=>setError(e.message));},[]);
  return <div className="card"><h2>Admin audit log</h2>{error&&<p className="error" role="alert">{error}</p>}<table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Item</th><th>Details</th></tr></thead><tbody>{rows.map((r,i)=><tr key={`${r.created_at}-${i}`}><td>{new Date(r.created_at).toLocaleString()}</td><td>{r.actor_email}</td><td>{r.action}</td><td>{r.entity_type} {r.entity_id}</td><td>{r.details}</td></tr>)}</tbody></table></div>;
}

function Routes() {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [form, setForm] = useState({ routeCode: '', name: '', stopIds: '' });
  const [msg, setMsg] = useState('');
  const load = useCallback(() => Promise.all([api('/routes'), api('/stops')]).then(([r, s]) => { setRoutes(r); setStops(s); }), []);
  useEffect(() => { load().catch((e) => setMsg(e.message)); }, [load]);

  async function add(e) {
    e.preventDefault(); setMsg('');
    const stopIds = form.stopIds.split(',').map((x) => Number(x.trim())).filter(Boolean);
    try { await api('/routes', { method: 'POST', body: { routeCode: form.routeCode, name: form.name, active: true, stopIds } }); setForm({ routeCode: '', name: '', stopIds: '' }); await load(); }
    catch (err) { setMsg(err.message); }
  }
  async function remove(id) {
    setMsg('');
    try { await api(`/routes/${id}`, { method: 'DELETE' }); await load(); } catch (err) { setMsg(err.message); }
  }
  return (
    <>
      {msg && <p className="error" role="alert">{msg}</p>}
      <form onSubmit={add} className="card form">
        <h2>Add route</h2>
        <div className="row">
          <div className="field"><label htmlFor="rc">Code</label><input id="rc" value={form.routeCode} onChange={(e) => setForm({ ...form, routeCode: e.target.value })} /></div>
          <div className="field"><label htmlFor="rn">Name</label><input id="rn" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        </div>
        <div className="field"><label htmlFor="rs">Stop IDs in order (comma-separated)</label><input id="rs" value={form.stopIds} onChange={(e) => setForm({ ...form, stopIds: e.target.value })} placeholder="e.g. 2,1,28" /></div>
        <small>Available stop IDs: {stops.map((s) => `${s.id}=${s.name}`).join('; ')}</small>
        <button className="primary">Add route</button>
      </form>
      <div className="card"><h2>Routes</h2>
        <table><thead><tr><th>Code</th><th>Name</th><th>Stops</th><th /></tr></thead>
          <tbody>{routes.map((r) => (<tr key={r.id}><td>{r.routeCode}</td><td>{r.name}</td><td>{r.stops.length}</td>
            <td><button onClick={() => remove(r.id)}>Delete</button></td></tr>))}</tbody></table></div>
    </>
  );
}

function Stops() {
  const [stops, setStops] = useState([]);
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '' });
  const [msg, setMsg] = useState('');
  const load = useCallback(() => api('/stops').then(setStops), []);
  useEffect(() => { load().catch((e) => setMsg(e.message)); }, [load]);
  async function add(e) {
    e.preventDefault(); setMsg('');
    try { await api('/stops', { method: 'POST', body: { name: form.name, latitude: Number(form.latitude), longitude: Number(form.longitude) } }); setForm({ name: '', latitude: '', longitude: '' }); await load(); }
    catch (err) { setMsg(err.message); }
  }
  async function remove(id) { setMsg(''); try { await api(`/stops/${id}`, { method: 'DELETE' }); await load(); } catch (err) { setMsg(err.message); } }
  return (
    <>
      {msg && <p className="error" role="alert">{msg}</p>}
      <form onSubmit={add} className="card form"><h2>Add stop</h2>
        <div className="row">
          <div className="field"><label htmlFor="sn">Name</label><input id="sn" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label htmlFor="sla">Latitude</label><input id="sla" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></div>
          <div className="field"><label htmlFor="slo">Longitude</label><input id="slo" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></div>
        </div>
        <button className="primary">Add stop</button></form>
      <div className="card"><h2>Stops</h2>
        <table><thead><tr><th>ID</th><th>Name</th><th>Lat, Lon</th><th /></tr></thead>
          <tbody>{stops.map((s) => (<tr key={s.id}><td>{s.id}</td><td>{s.name}</td><td>{s.latitude}, {s.longitude}</td><td><button onClick={() => remove(s.id)}>Delete</button></td></tr>))}</tbody></table></div>
    </>
  );
}

function Reports() {
  const [reports, setReports] = useState([]);
  const [msg, setMsg] = useState('');
  const load = useCallback(() => api('/crowd-reports').then(setReports), []);
  useEffect(() => { load().catch((e) => setMsg(e.message)); }, [load]);
  async function remove(id) { try { await api(`/crowd-reports/${id}`, { method: 'DELETE' }); await load(); } catch (err) { setMsg(err.message); } }
  return (
    <div className="card"><h2>Latest 50 crowd reports</h2>{msg && <p className="error" role="alert">{msg}</p>}
      <table><thead><tr><th>Time</th><th>Route</th><th>Level</th><th>Source</th><th>Note</th><th /></tr></thead>
        <tbody>{reports.map((r) => (<tr key={r.id}><td>{new Date(r.reportedAt).toLocaleString()}</td><td>{r.routeId}</td>
          <td><CrowdBadge level={r.crowdLevel} /></td><td>{r.source.toLowerCase()}</td><td>{r.note}</td>
          <td><button onClick={() => remove(r.id)}>Delete</button></td></tr>))}</tbody></table></div>
  );
}

function Predictions() {
  const [routes, setRoutes] = useState([]);
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api('/routes').then(async (rs) => {
      setRoutes(rs);
      const all = await Promise.all(rs.map((r) => api(`/predictions/${r.id}`).then((p) => p.slice(0, 1).map((x) => ({ ...x, code: r.routeCode }))).catch(() => [])));
      setRows(all.flat());
    });
  }, []);
  return (
    <div className="card"><h2>Latest predicted crowd per route</h2>
      <p><small>Predictions appear here after passengers request forecasts. {routes.length} routes.</small></p>
      <table><thead><tr><th>Route</th><th>Travel time</th><th>Predicted</th><th>Level</th></tr></thead>
        <tbody>{rows.map((p) => (<tr key={p.id}><td>{p.code}</td><td>{p.travelTime}</td><td>{Math.round(p.predictedPercent)}%</td><td><CrowdBadge level={p.crowdLevel} /></td></tr>))}</tbody></table></div>
  );
}

const TABS = { Dashboard, Routes, Stops, Reports, Predictions, Analytics, Moderation, 'Forecast accuracy': ForecastAccuracy, 'Audit log': AuditLog };

export default function AdminPage() {
  const [tab, setTab] = useState('Dashboard');
  const Active = TABS[tab];
  return (
    <section>
      <h1>Administrator</h1>
      <div className="tabs" role="tablist">
        {Object.keys(TABS).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      <Active />
    </section>
  );
}
