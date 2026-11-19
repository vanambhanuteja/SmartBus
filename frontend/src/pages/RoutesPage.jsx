import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import RouteMap from '../components/RouteMap.jsx';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const formatTime = (seconds) => {
  if (seconds == null) return 'Time unavailable';
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export default function RoutesPage() {
  const [source, setSource] = useState('bmtc');
  const [demoRoutes, setDemoRoutes] = useState([]);
  const [bmtcRoutes, setBmtcRoutes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedStops, setSelectedStops] = useState([]);
  const [geometry, setGeometry] = useState([]);
  const [selectedStopId, setSelectedStopId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [serviceDate, setServiceDate] = useState(today());
  const [search, setSearch] = useState('');
  const [attribution, setAttribution] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  useEffect(() => {
    Promise.allSettled([api('/routes'), api('/transit/routes'), api('/transit/attribution')])
      .then(([demo, bmtc, credit]) => {
        if (demo.status === 'fulfilled') setDemoRoutes(demo.value);
        else setErrors((v) => ({ ...v, demo: demo.reason.message }));
        if (bmtc.status === 'fulfilled') setBmtcRoutes(bmtc.value);
        else setErrors((v) => ({ ...v, bmtc: bmtc.reason.message }));
        if (credit.status === 'fulfilled') setAttribution(credit.value);
      })
      .finally(() => setLoading(false));
  }, []);

  const routes = source === 'bmtc' ? bmtcRoutes : demoRoutes;
  const visibleRoutes = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return q ? routes.filter((r) => `${r.routeCode || ''} ${r.name || ''}`.toLocaleLowerCase().includes(q)) : routes;
  }, [routes, search]);
  const selected = routes.find((r) => String(r.id) === String(selectedId)) || null;
  const mapRoute = selected ? { ...selected, stops: source === 'bmtc' ? selectedStops : (selected.stops || []), geometry } : null;
  const selectedStop = selectedStops.find((s) => String(s.id) === String(selectedStopId));

  function changeSource(next) {
    setSource(next);
    setSelectedId('');
    setSelectedStops([]);
    setSelectedStopId('');
    setSchedules([]);
    setGeometry([]);
    setSearch('');
  }

  async function selectRoute(id) {
    setSelectedId(id);
    setSelectedStops([]);
    setSelectedStopId('');
    setSchedules([]);
    setGeometry([]);
    if (source !== 'bmtc' || !id) return;
    setDetailLoading(true);
    setErrors((v) => ({ ...v, detail: '' }));
    try {
      const [stops, points] = await Promise.all([
        api(`/transit/stops?routeId=${encodeURIComponent(id)}`),
        api(`/transit/shapes?routeId=${encodeURIComponent(id)}`),
      ]);
      setSelectedStops(stops);
      const lines = new Map();
      points.forEach((p) => {
        if (p.latitude == null || p.longitude == null) return;
        if (!lines.has(p.shapeId)) lines.set(p.shapeId, []);
        lines.get(p.shapeId).push([p.latitude, p.longitude]);
      });
      setGeometry([...lines.values()].filter((line) => line.length > 1));
    } catch (e) { setErrors((v) => ({ ...v, detail: e.message })); }
    finally { setDetailLoading(false); }
  }

  useEffect(() => {
    if (source !== 'bmtc' || !selectedId || !selectedStopId || !serviceDate) return;
    let cancelled = false;
    setScheduleLoading(true);
    setSchedules([]);
    setErrors((v) => ({ ...v, schedule: '' }));
    api(`/transit/schedules?routeId=${encodeURIComponent(selectedId)}&serviceDate=${serviceDate}&stopId=${encodeURIComponent(selectedStopId)}`)
      .then((data) => { if (!cancelled) setSchedules(data); })
      .catch((e) => { if (!cancelled) setErrors((v) => ({ ...v, schedule: e.message })); })
      .finally(() => { if (!cancelled) setScheduleLoading(false); });
    return () => { cancelled = true; };
  }, [source, selectedId, selectedStopId, serviceDate]);

  return (
    <section className="routes-page">
      <h1>Bus routes</h1>
      <div className="card route-picker">
        <div className="tabs" role="group" aria-label="Route source">
          <button className={source === 'bmtc' ? 'tab active' : 'tab'} onClick={() => changeSource('bmtc')}>BMTC Bengaluru</button>
          <button className={source === 'demo' ? 'tab active' : 'tab'} onClick={() => changeSource('demo')}>Mysuru demo</button>
        </div>
        <p>{source === 'bmtc' ? 'Choose one BMTC route to view its stops, map, and published times. Schedules are not live arrivals.' : 'Illustrative Mysuru routes for the SmartBus demo.'}</p>
        <div className="route-choice">
          <div className="field">
            <label htmlFor="route-search">Find a route</label>
            <input id="route-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={source === 'bmtc' ? 'Search route code or name' : 'Search demo route'} />
          </div>
          <div className="field">
            <label htmlFor="route-select">Select route</label>
            <select id="route-select" value={selectedId} onChange={(e) => selectRoute(e.target.value)}>
              <option value="">Choose a route…</option>
              {visibleRoutes.map((r) => <option key={r.id} value={r.id}>{r.routeCode || r.id} — {r.name}</option>)}
            </select>
          </div>
        </div>
        {loading && <p>Loading routes…</p>}
        {!loading && source === 'bmtc' && errors.bmtc && <p className="error" role="alert">Could not load BMTC routes: {errors.bmtc}</p>}
        {!loading && source === 'demo' && errors.demo && <p className="error" role="alert">Could not load demo routes: {errors.demo}</p>}
        {!loading && !visibleRoutes.length && <p>No matching routes. Try another search.</p>}
        {source === 'bmtc' && attribution && <small>Source: {attribution.feed_publisher_name || 'BMTC GTFS'} · <a href="https://github.com/Vonter/bmtc-gtfs" target="_blank" rel="noreferrer">Vonter BMTC GTFS</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer">ODbL-1.0</a></small>}
      </div>

      {selected ? <div className="two-col route-details">
        <div>
          <div className="card">
            <h2>{selected.routeCode || selected.id} · {selected.name}</h2>
            {source === 'bmtc' ? detailLoading ? <p>Loading stops and route map…</p> : errors.detail ? <p className="error" role="alert">Could not load route details: {errors.detail}</p> : <>
              <label className="field-label" htmlFor="route-stop">Choose a stop to see timetable</label>
              <select id="route-stop" value={selectedStopId} onChange={(e) => setSelectedStopId(e.target.value)}>
                <option value="">Choose a stop…</option>
                {selectedStops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {selectedStops.length > 0 && <details className="stop-details"><summary>View all {selectedStops.length} stops on this route</summary><ol>{selectedStops.map((s) => <li key={s.id}>{s.name}</li>)}</ol></details>}
              {selectedStopId && <div className="timetable">
                <h3>Published timetable{selectedStop ? ` · ${selectedStop.name}` : ''}</h3>
                <div className="field"><label htmlFor="service-date">Service date</label><input id="service-date" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} /></div>
                <p className="muted">Scheduled times only; these are not live arrival predictions.</p>
                {scheduleLoading && <p>Loading scheduled times…</p>}
                {errors.schedule && <p className="error" role="alert">Could not load timetable: {errors.schedule}</p>}
                {!scheduleLoading && !errors.schedule && !schedules.length && <p>No scheduled trips for this stop and date.</p>}
                {schedules.length > 0 && <ul className="time-list">{schedules.slice(0, 60).map((row, i) => <li key={`${row.tripId}-${row.stopId}-${i}`}><strong>{formatTime(row.arrivalSeconds ?? row.departureSeconds)}</strong>{row.timepoint === 0 && <span> · approximate</span>}{row.headsign && <small> · {row.headsign}</small>}</li>)}</ul>}
                {schedules.length > 60 && <small>Showing 60 of {schedules.length} scheduled trips.</small>}
              </div>}
            </> : <>
              <h3>Stops</h3><ol>{(selected.stops || []).map((s) => <li key={s.id}>{s.name}</li>)}</ol>
              <p className="muted">This illustrative demo route has no published timetable.</p>
            </>}
          </div>
        </div>
        <RouteMap key={`${source}-${selectedId}`} route={mapRoute} center={source === 'bmtc' ? [12.9716, 77.5946] : undefined} />
      </div> : <p className="card">Select one route above to see its stop list, map, and available timetable.</p>}
    </section>
  );
}
