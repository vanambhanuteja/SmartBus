import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { DAYS } from '../crowd.js';
import CrowdBadge from '../components/CrowdBadge.jsx';

export default function PredictPage() {
  const [routes, setRoutes] = useState([]);
  const [routeId, setRouteId] = useState('');
  const [time, setTime] = useState('08:30');
  const [day, setDay] = useState(String((new Date().getDay() + 6) % 7)); // JS Sunday=0 -> our Monday=0
  const [result, setResult] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/routes').then(setRoutes).catch((e) => setError(e.message)); }, []);

  async function check(e) {
    e.preventDefault();
    if (!routeId) return setError('Please select a route');
    setError(''); setBusy(true); setResult(null);
    try {
      setResult(await api('/predictions', { method: 'POST', body: { routeId: Number(routeId), travelTime: time, dayOfWeek: Number(day) } }));
      setReports((await api(`/crowd-reports?routeId=${routeId}`)).slice(0, 5));
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <section className="narrow">
      <h1>Crowd forecast</h1>
      <form onSubmit={check} className="card form" noValidate>
        <div className="field">
          <label htmlFor="route">Route</label>
          <select id="route" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
            <option value="">Select a route…</option>
            {routes.map((r) => <option key={r.id} value={r.id}>{r.routeCode} – {r.name}</option>)}
          </select>
        </div>
        <div className="row">
          <div className="field"><label htmlFor="time">Travel time</label>
            <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></div>
          <div className="field"><label htmlFor="day">Day</label>
            <select id="day" value={day} onChange={(e) => setDay(e.target.value)}>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select></div>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Predicting…' : 'Check crowd level'}</button>
      </form>

      {result && (
        <div className="card result" aria-live="polite">
          <h2>{result.routeName}</h2>
          <p className="big"><CrowdBadge level={result.crowdLevel} percent={result.predictedOccupancyPercent} /></p>
          <p>Estimated for {result.travelTime} on {DAYS[result.dayOfWeek]}. Predicted at {new Date(result.predictionTimestamp).toLocaleTimeString()}.</p>
          {result.recentReportsAvg != null && <p>Includes recent passenger reports (average {Math.round(result.recentReportsAvg)}%).</p>}
          <small>Forecast is based on {result.dataSource || 'simulated data'}; it is an estimate, not a guarantee.</small>
        </div>
      )}
      {result && (
        <div className="card">
          <h2>Previous reports on this route</h2>
          {reports.length === 0 ? <p>No reports yet.</p> : (
            <ul className="plain">{reports.map((r) => (
              <li key={r.id}><CrowdBadge level={r.crowdLevel} /> <small>{new Date(r.reportedAt).toLocaleString()} · {r.source === 'SYNTHETIC' ? 'simulated' : 'passenger'}</small></li>
            ))}</ul>
          )}
        </div>
      )}
    </section>
  );
}
