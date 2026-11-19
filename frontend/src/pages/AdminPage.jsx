import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { LEVELS } from '../crowd.js';
import BarChart from '../components/BarChart.jsx';
import CrowdBadge from '../components/CrowdBadge.jsx';

function Dashboard() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/admin/dashboard').then(setD).catch((e) => setError(e.message)); }, []);
  if (error) return <p className="error" role="alert">{error}</p>;
  if (!d) return <p>Loading…</p>;
  return (
    <>
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

const TABS = { Dashboard, Routes, Stops, Reports, Predictions };

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
