import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import RouteMap from '../components/RouteMap.jsx';
import { useAuth } from '../auth.jsx';
import { useLanguage } from '../i18n.jsx';

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
  const {user}=useAuth();
  const {t}=useLanguage();
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
  const [nearby,setNearby]=useState([]),[nearbyError,setNearbyError]=useState(''),[nearbyBusy,setNearbyBusy]=useState(false);
  const [planFrom,setPlanFrom]=useState(''),[planTo,setPlanTo]=useState(''),[planResults,setPlanResults]=useState([]),[planError,setPlanError]=useState('');
  const [favoriteError,setFavoriteError]=useState(''),[favoriteDone,setFavoriteDone]=useState(false);
  const [savedFavorites,setSavedFavorites]=useState(null);
  useEffect(()=>{if(user)api('/me/favorites').then(setSavedFavorites).catch(()=>{});},[user]);
  async function favorite(type,id){try{await api('/me/favorites',{method:'POST',body:{type,id:String(id)}});setFavoriteDone(true);setFavoriteError('');api('/me/favorites').then(setSavedFavorites);}catch(e){setFavoriteError(e.message);}}

  async function findNearby(){
    if(!navigator.geolocation){setNearbyError('Location is not available in this browser.');return;}
    setNearbyBusy(true);setNearbyError('');
    navigator.geolocation.getCurrentPosition(async ({coords})=>{try{setNearby(await api(`/transit/stops/nearby?latitude=${coords.latitude}&longitude=${coords.longitude}&limit=10`));}catch(e){setNearbyError(e.message);}finally{setNearbyBusy(false);}},e=>{setNearbyError(e.message||'Could not read your location.');setNearbyBusy(false);},{enableHighAccuracy:true,timeout:10000});
  }
  async function planTrip(e){e.preventDefault();setPlanError('');setPlanResults([]);try{setPlanResults(await api(`/transit/plan?fromStop=${encodeURIComponent(planFrom)}&toStop=${encodeURIComponent(planTo)}`));}catch(e){setPlanError(e.message);}}

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
      <h1>{t('Bus routes')}</h1>
      {user&&savedFavorites&&<details className="card"><summary>{t('Saved favourites')}</summary><p><strong>{t('Demo routes:')}</strong> {savedFavorites.routes.map(r=>r.routeCode).join(', ')||t('none')}</p><p><strong>{t('Demo stops:')}</strong> {savedFavorites.stops.map(s=>s.name).join(', ')||t('none')}</p><p><strong>{t('BMTC routes:')}</strong> {savedFavorites.bmtcRoutes.map(r=>r.routeCode||r.id).join(', ')||t('none')}</p><p><strong>{t('BMTC stops:')}</strong> {savedFavorites.bmtcStops.map(s=>s.name).join(', ')||t('none')}</p></details>}
      {source==='bmtc'&&<div className="card nearby-card"><div><span className="section-kicker">{t('AROUND YOU')}</span><h2>{t('Find stops near me')}</h2><p>{t('Your browser asks permission to use your location. Coordinates are used only to find nearby published BMTC stops.')}</p></div><button type="button" onClick={findNearby} disabled={nearbyBusy}>{nearbyBusy?t('Finding nearby stops…'):t('Use my location')}</button>{nearbyError&&<p className="error" role="alert">{t(nearbyError)}</p>}{nearby.length>0&&<ol>{nearby.map(s=><li key={s.id}>{s.name} · {s.distance_km} {t('km')}</li>)}</ol>}</div>}
      <div className="card route-picker">
        <div className="tabs" role="group" aria-label={t('Route source')}>
          <button className={source === 'bmtc' ? 'tab active' : 'tab'} onClick={() => changeSource('bmtc')}>{t('BMTC Bengaluru')}</button>
          <button className={source === 'demo' ? 'tab active' : 'tab'} onClick={() => changeSource('demo')}>{t('Mysuru demo')}</button>
        </div>
        <p>{t(source === 'bmtc' ? 'Choose one BMTC route to view its stops, map, and published times. Schedules are not live arrivals.' : 'Illustrative Mysuru routes for the SmartBus demo.')}</p>
        <div className="route-choice">
          <div className="field">
            <label htmlFor="route-search">{t('Find a route')}</label>
            <input id="route-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t(source === 'bmtc' ? 'Search route code or name' : 'Search demo route')} />
          </div>
          <div className="field">
            <label htmlFor="route-select">{t('Select route')}</label>
            <select id="route-select" value={selectedId} onChange={(e) => selectRoute(e.target.value)}>
              <option value="">{t('Choose a route…')}</option>
              {visibleRoutes.map((r) => <option key={r.id} value={r.id}>{r.routeCode || r.id} — {r.name}</option>)}
            </select>
          </div>
        </div>
        {loading && <p>{t('Loading routes…')}</p>}
        {!loading && source === 'bmtc' && errors.bmtc && <p className="error" role="alert">{t('Could not load BMTC routes:')} {t(errors.bmtc)}</p>}
        {!loading && source === 'demo' && errors.demo && <p className="error" role="alert">{t('Could not load demo routes:')} {t(errors.demo)}</p>}
        {!loading && !visibleRoutes.length && <p>{t('No matching routes. Try another search.')}</p>}
        {source === 'bmtc' && attribution && <small>{t('Source:')} {attribution.feed_publisher_name || 'BMTC GTFS'} · <a href="https://github.com/Vonter/bmtc-gtfs" target="_blank" rel="noreferrer">Vonter BMTC GTFS</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer">ODbL-1.0</a></small>}
      </div>

      {selected ? <div className="two-col route-details">
        <div>
          <div className="card">
            <h2>{selected.routeCode || selected.id} · {selected.name}</h2>
            {user&&<button type="button" onClick={()=>favorite(source==='bmtc'?'bmtcRoute':'route',selected.id)}>{t('Save this route to favourites')}</button>}
            {favoriteDone&&<p role="status">{t('Saved to your favourites.')}</p>}{favoriteError&&<p className="error" role="alert">{t(favoriteError)}</p>}
            {source === 'bmtc' ? detailLoading ? <p>{t('Loading stops and route map…')}</p> : errors.detail ? <p className="error" role="alert">{t('Could not load route details:')} {t(errors.detail)}</p> : <>
              <label className="field-label" htmlFor="route-stop">{t('Choose a stop to see timetable')}</label>
              <select id="route-stop" value={selectedStopId} onChange={(e) => setSelectedStopId(e.target.value)}>
                <option value="">{t('Choose a stop…')}</option>
                {selectedStops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {selectedStops.length > 0 && <details className="stop-details"><summary>{t('View all {count} stops on this route',{count:selectedStops.length})}</summary><ol>{selectedStops.map((s) => <li key={s.id}>{s.name} {user&&<button type="button" onClick={()=>favorite('bmtcStop',s.id)}>{t('Save stop')}</button>}</li>)}</ol></details>}
              {selectedStopId && <div className="timetable">
                <h3>{t('Published timetable')}{selectedStop ? ` · ${selectedStop.name}` : ''}</h3>
                <div className="field"><label htmlFor="service-date">{t('Service date')}</label><input id="service-date" type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} /></div>
                <p className="muted">{t('Scheduled times only; these are not live arrival predictions.')}</p>
                {scheduleLoading && <p>{t('Loading scheduled times…')}</p>}
                {errors.schedule && <p className="error" role="alert">{t('Could not load timetable:')} {t(errors.schedule)}</p>}
                {!scheduleLoading && !errors.schedule && !schedules.length && <p>{t('No scheduled trips for this stop and date.')}</p>}
                {schedules.length > 0 && <ul className="time-list">{schedules.slice(0, 60).map((row, i) => <li key={`${row.tripId}-${row.stopId}-${i}`}><strong>{formatTime(row.arrivalSeconds ?? row.departureSeconds)}</strong>{row.timepoint === 0 && <span> · {t('approximate')}</span>}{row.headsign && <small> · {row.headsign}</small>}</li>)}</ul>}
                {schedules.length > 60 && <small>{t('Showing 60 of {count} scheduled trips.',{count:schedules.length})}</small>}
              </div>}
            </> : <>
              <h3>{t('Stops')}</h3><ol>{(selected.stops || []).map((s) => <li key={s.id}>{s.name} {user&&<button type="button" onClick={()=>favorite('stop',s.id)}>{t('Save stop')}</button>}</li>)}</ol>
              <p className="muted">{t('This illustrative demo route has no published timetable.')}</p>
            </>}
          </div>
        </div>
        <RouteMap key={`${source}-${selectedId}`} route={mapRoute} center={source === 'bmtc' ? [12.9716, 77.5946] : undefined} />
      </div> : <p className="card">{t('Select one route above to see its stop list, map, and available timetable.')}</p>}
      {source==='bmtc'&&selectedStops.length>1&&<form className="card form" onSubmit={planTrip}><h2>{t('Trip planner')}</h2><p>{t('Find a direct BMTC route first. If none is available, SmartBus lists options with one bus switch. This uses the published stop order; it cannot guarantee timed connections or live arrivals.')}</p><div className="row"><div className="field"><label htmlFor="plan-from">{t('From stop')}</label><select id="plan-from" value={planFrom} onChange={e=>setPlanFrom(e.target.value)} required><option value="">{t('Select origin')}</option>{selectedStops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div className="field"><label htmlFor="plan-to">{t('To stop')}</label><select id="plan-to" value={planTo} onChange={e=>setPlanTo(e.target.value)} required><option value="">{t('Select destination')}</option>{selectedStops.filter(s=>String(s.id)!==String(planFrom)).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div></div><button className="primary">{t('Plan trip')}</button>{planError&&<p className="error" role="alert">{t(planError)}</p>}
        {planResults?.directRoutes?.length>0&&<><h3>{t('Direct routes')}</h3><ul>{planResults.directRoutes.map(r=><li key={r.id}>{r.routeCode} · {r.name} ({r.trips} {t('scheduled trip patterns')})</li>)}</ul></>}
        {planResults?.directRoutes?.length===0&&planResults?.transferOptions?.length>0&&<><h3>{t('No direct route found. Try one bus switch:')}</h3><ol>{planResults.transferOptions.map((r,i)=><li key={`${r.transferStopId}-${r.firstRouteCode}-${r.secondRouteCode}-${i}`}><strong>{r.firstRouteCode} · {r.firstRouteName}</strong> {t('to')} {r.transferStopName}, {t('then switch to')} <strong>{r.secondRouteCode} · {r.secondRouteName}</strong> {t('for the destination')}.</li>)}</ol></>}
        {planResults?.directRoutes?.length===0&&planResults?.transferOptions?.length===0&&planFrom&&planTo&&!planError&&<p>{t('No direct or one-switch option was found for these stops.')}</p>}</form>}
    </section>
  );
}
