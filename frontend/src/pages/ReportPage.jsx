import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import ReportForm from '../components/ReportForm.jsx';
import { LEVELS } from '../crowd.js';

function localNow() { const d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16); }
function BmtcReportForm() {
  const [routes,setRoutes]=useState([]),[stops,setStops]=useState([]),[route,setRoute]=useState(''),[stop,setStop]=useState('');
  const [time,setTime]=useState(localNow()),[percent,setPercent]=useState(40),[vehicle,setVehicle]=useState(''),[type,setType]=useState(''),[note,setNote]=useState(''),[error,setError]=useState(''),[done,setDone]=useState(false);
  useEffect(()=>{api('/transit/routes').then(setRoutes).catch(e=>setError(e.message));},[]);
  useEffect(()=>{setStop(''); if(route) api(`/transit/stops?routeId=${encodeURIComponent(route)}`).then(setStops).catch(e=>setError(e.message)); else setStops([]);},[route]);
  const level=Number(percent)<=30?'LOW':Number(percent)<=60?'MODERATE':Number(percent)<=85?'HIGH':'OVERCROWDED';
  async function submit(e){e.preventDefault();setError('');setDone(false);try{await api('/transit/crowd-reports',{method:'POST',body:{routeId:route,stopId:stop,occupancyPercent:Number(percent),crowdLevel:level,vehicleLabel:vehicle||null,vehicleType:type||null,observedAt:new Date(time).toISOString(),note:note||null}});setDone(true);setVehicle('');setNote('');}catch(err){setError(err.message);}}
  return <form onSubmit={submit} className="card form bmtc-form"><h2>BMTC passenger observation</h2><p>Report what you saw. The time is when the bus was actually at the stop; it is separate from the published timetable. Vehicle details are passenger supplied and are not verified.</p>
    <div className="field"><label>BMTC route</label><select value={route} onChange={e=>setRoute(e.target.value)} required><option value="">Select a BMTC route…</option>{routes.map(r=><option key={r.id} value={r.id}>{r.routeCode||r.id} – {r.name}</option>)}</select></div>
    <div className="field"><label>Stop where you observed the bus</label><select value={stop} onChange={e=>setStop(e.target.value)} required disabled={!route}><option value="">Select a stop…</option>{stops.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
    <div className="field"><label>Time the bus was actually at this stop</label><input type="datetime-local" value={time} max={localNow()} onChange={e=>setTime(e.target.value)} required /></div>
    <div className="row"><div className="field"><label>Vehicle number or label (optional)</label><input maxLength={80} value={vehicle} onChange={e=>setVehicle(e.target.value)} placeholder="As displayed on the bus" /></div><div className="field"><label>Vehicle type (optional)</label><input maxLength={40} value={type} onChange={e=>setType(e.target.value)} placeholder="e.g. ordinary, Volvo" /></div></div>
    <div className="field"><label>Estimated occupancy: {percent}%</label><input type="range" min="0" max="100" value={percent} onChange={e=>setPercent(e.target.value)} /><small>{LEVELS[level].label}</small></div>
    <div className="field"><label>Note (optional)</label><input maxLength={255} value={note} onChange={e=>setNote(e.target.value)} /></div>
    {error&&<p className="error" role="alert">{error}</p>}{done&&<p className="success" role="status">BMTC passenger observation recorded.</p>}<button className="primary">Submit BMTC report</button>
  </form>;
}

export default function ReportPage() {
  const [source,setSource]=useState('bmtc');
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { if(source==='demo'&&!routes.length) api('/routes').then(setRoutes).catch((e) => setError(e.message)); }, [source]);
  return (
    <section className="report-page">
      <h1>Report crowd</h1>
      <p>Choose the network, then report what you observed. BMTC reports ask for the stop and actual observation time.</p>
      <div className="tabs" role="group" aria-label="Report network">
        <button className={source==='bmtc'?'tab active':'tab'} onClick={()=>{setSource('bmtc');setError('');}}>BMTC Bengaluru</button>
        <button className={source==='demo'?'tab active':'tab'} onClick={()=>{setSource('demo');setError('');}}>Mysuru demo</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {source==='demo'
        ? <ReportForm routes={routes} onSubmit={(b) => api('/crowd-reports', { method: 'POST', body: b })} />
        : <BmtcReportForm />}
    </section>
  );
}
