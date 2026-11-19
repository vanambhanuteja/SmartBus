import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { DAYS } from '../crowd.js';
import CrowdBadge from '../components/CrowdBadge.jsx';
import { useLanguage } from '../i18n.jsx';

export default function PredictPage() {
  const {t,language}=useLanguage();
  const [routes, setRoutes] = useState([]);
  const [routeId, setRouteId] = useState('');
  const [time, setTime] = useState('08:30');
  const [day, setDay] = useState(String((new Date().getDay() + 6) % 7)); // JS Sunday=0 -> our Monday=0
  const [result, setResult] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [bmtcRoutes,setBmtcRoutes]=useState([]),[bmtcRoute,setBmtcRoute]=useState(''),[bmtcResult,setBmtcResult]=useState(null),[bmtcError,setBmtcError]=useState(''),[bmtcBusy,setBmtcBusy]=useState(false);
  const [dayCurve,setDayCurve]=useState([]),[curveBusy,setCurveBusy]=useState(false),[curveError,setCurveError]=useState('');
  const [trust,setTrust]=useState({});
  const [flagged,setFlagged]=useState({});
  const [favoriteRoutes,setFavoriteRoutes]=useState([]),[favoriteBmtc,setFavoriteBmtc]=useState([]);
  const [bmtcReports,setBmtcReports]=useState([]);
  const days=DAYS.map(d=>t(d));

  useEffect(() => { api('/routes').then(setRoutes).catch((e) => setError(e.message)); }, []);
  useEffect(() => { api('/me/favorites').then(f=>{setFavoriteRoutes(f.routes||[]);setFavoriteBmtc(f.bmtcRoutes||[]);}).catch(()=>{}); }, []);
  useEffect(() => { api('/transit/routes').then(setBmtcRoutes).catch((e) => setBmtcError(e.message)); }, []);

  async function check(e) {
    e.preventDefault();
    if (!routeId) return setError(t('Please select a route'));
    setError(''); setBusy(true); setResult(null);
    try {
      setResult(await api('/predictions', { method: 'POST', body: { routeId: Number(routeId), travelTime: time, dayOfWeek: Number(day) } }));
      setReports((await api(`/crowd-reports?routeId=${routeId}`)).slice(0, 5));
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function checkBmtc(e){e.preventDefault();setBmtcResult(null);setBmtcError('');setBmtcBusy(true);try{const result=await api('/transit/predictions',{method:'POST',body:{routeId:bmtcRoute,travelTime:time,dayOfWeek:Number(day)}});setBmtcResult(result);setBmtcReports(await api(`/transit/crowd-reports?routeId=${encodeURIComponent(bmtcRoute)}`));}catch(err){setBmtcError(err.message);}finally{setBmtcBusy(false);}}
  async function findBestTime(){
    if(!routeId) return setCurveError(t('Choose a Mysuru demo route first.'));
    setCurveBusy(true);setCurveError('');setDayCurve([]);
    try {
      const values=await Promise.all(Array.from({length:24},(_,hour)=>api('/predictions',{method:'POST',body:{routeId:Number(routeId),travelTime:`${String(hour).padStart(2,'0')}:00`,dayOfWeek:Number(day)}})));
      setDayCurve(values.map((p,h)=>({label:String(h).padStart(2,'0'),value:p.predictedOccupancyPercent})));
    } catch(e) { setCurveError(e.message); } finally { setCurveBusy(false); }
  }
  async function favoriteForecast(id){setRouteId(String(id));setError('');setBusy(true);setResult(null);try{setResult(await api('/predictions',{method:'POST',body:{routeId:Number(id),travelTime:time,dayOfWeek:Number(day)}}));}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function favoriteBmtcForecast(id){setBmtcRoute(String(id));setBmtcError('');setBmtcBusy(true);setBmtcResult(null);try{const result=await api('/transit/predictions',{method:'POST',body:{routeId:String(id),travelTime:time,dayOfWeek:Number(day)}});setBmtcResult(result);setBmtcReports(await api(`/transit/crowd-reports?routeId=${encodeURIComponent(id)}`));}catch(e){setBmtcError(e.message);}finally{setBmtcBusy(false);}}
  async function voteBmtc(id,helpful){const counts=await api(`/transit/crowd-reports/${id}/feedback`,{method:'POST',body:{helpful}});setTrust(v=>({...v,[`b-${id}`]:counts}));}
  async function flagBmtc(id){const result=await api(`/transit/crowd-reports/${id}/flag`,{method:'POST',body:{reason:'Passenger review requested'}});setFlagged(v=>({...v,[`b-${id}`]:result.flags}));}
  const leastCrowded=dayCurve.length?dayCurve.reduce((a,b)=>b.value<a.value?b:a):null;
  async function confirmReport(id,helpful){try{const counts=await api(`/crowd-reports/${id}/feedback`,{method:'POST',body:{helpful}});setTrust(v=>({...v,[id]:counts}));}catch(e){setError(e.message);}}
  async function flagReport(id){try{const result=await api(`/crowd-reports/${id}/flag`,{method:'POST',body:{reason:'Passenger review requested'}});setFlagged(v=>({...v,[id]:result.flags}));}catch(e){setError(e.message);}}

  return (
    <section className="predict-page">
      <h1>{t('Crowd forecast')}</h1>
      {favoriteRoutes.length>0&&<div className="card favorite-route-card"><h2>{t('Favourite routes')}</h2><div className="row">{favoriteRoutes.map(r=><button key={r.id} type="button" disabled={busy} onClick={()=>favoriteForecast(r.id)}>{r.routeCode} · {t('Forecast now')}</button>)}</div><small>{t('Uses the selected time and day below.')}</small></div>}
      <div className="forecast-tools">
      <form onSubmit={check} className="card form" noValidate>
        <h2>{t('Choose your trip')}</h2>
        <div className="field">
          <label htmlFor="route">{t('Route')}</label>
          <select id="route" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
            <option value="">{t('Select a route…')}</option>
            {routes.map((r) => <option key={r.id} value={r.id}>{r.routeCode} – {r.name}</option>)}
          </select>
        </div>
        <div className="row">
          <div className="field"><label htmlFor="time">{t('Travel time')}</label>
            <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></div>
          <div className="field"><label htmlFor="day">{t('Day')}</label>
            <select id="day" value={day} onChange={(e) => setDay(e.target.value)}>
              {DAYS.map((d, i) => <option key={d} value={i}>{days[i]}</option>)}
            </select></div>
        </div>
        {error && <p className="error" role="alert">{t(error)}</p>}
        <button className="primary" disabled={busy}>{busy ? t('Predicting…') : t('Check crowd level')}</button>
      </form>
      <div className="card best-time-card">
        <span className="section-kicker">{t('PLAN AHEAD')}</span>
        <h2>{t('Best time to travel')}</h2><p>{t('Compare the demo route’s hourly estimates for the selected day. Each hour is a separate model forecast.')}</p>
        <button type="button" onClick={findBestTime} disabled={curveBusy||!routeId}>{curveBusy?t('Calculating hourly forecasts…'):t('Show 24-hour forecast')}</button>
        {curveError&&<p className="error" role="alert">{t(curveError)}</p>}
        {leastCrowded&&<p>{t('Least crowded hour:')} <strong>{leastCrowded.label}:00</strong> {t('at about')} {Math.round(leastCrowded.value)}%.</p>}
        {dayCurve.length>0&&<div className="chart" role="img" aria-label={t('Hourly predicted crowd levels')}><div className="curve-bars">{dayCurve.map(d=><div className="bar-col" key={d.label}><span className="bar-val">{Math.round(d.value)}%</span><div className="bar" style={{height:`${Math.max(2,d.value)}%`,background:d===leastCrowded?'#18864b':'#0b5cad'}}/><span className="bar-label">{d.label}</span></div>)}</div></div>}
      </div>
      </div>
      {result && (
        <div className="card result" aria-live="polite">
          <h2>{result.routeName}</h2>
          <p className="big"><CrowdBadge level={result.crowdLevel} percent={result.predictedOccupancyPercent} /></p>
          <p>{t('Estimated for')} {result.travelTime} {t('on')} {days[result.dayOfWeek]}. {t('Predicted at')} {new Date(result.predictionTimestamp).toLocaleTimeString(language==='kn'?'kn-IN':'en-IN')}.</p>
          {result.recentReportsAvg != null && <p>{t('Includes recent passenger reports (average {percent}%).',{percent:Math.round(result.recentReportsAvg)})}</p>}
          <small>{t('Forecast is based on {source}; it is an estimate, not a guarantee.',{source:t(result.dataSource || 'simulated data')})}</small>
          {result.confidenceRange && <p>{t('Model tree range: {low}–{high}% (model spread, not a calibrated statistical interval).',{low:result.confidenceRange[0],high:result.confidenceRange[1]})}</p>}
        </div>
      )}
      <form onSubmit={checkBmtc} className="card form">
        <h2>{t('BMTC crowd forecast')}</h2>
        {favoriteBmtc.length>0&&<div><h3>{t('Favourite BMTC routes')}</h3>{favoriteBmtc.map(r=><button key={r.id} type="button" disabled={bmtcBusy} onClick={()=>favoriteBmtcForecast(r.id)}>{r.routeCode||r.id} · {t('Forecast')}</button>)}</div>}
        <p>{t('Crowd forecasts use passenger reports for that BMTC route. Published schedules are not treated as live arrivals or crowd measurements.')}</p>
        <div className="field"><label htmlFor="bmtc-route">{t('BMTC route')}</label><select id="bmtc-route" value={bmtcRoute} onChange={e=>setBmtcRoute(e.target.value)} required><option value="">{t('Select a BMTC route…')}</option>{bmtcRoutes.map(r=><option key={r.id} value={r.id}>{r.routeCode||r.id} – {r.name}</option>)}</select></div>
        <button className="primary" disabled={bmtcBusy||!bmtcRoute}>{bmtcBusy?t('Checking reports…'):t('Check BMTC crowd')}</button>
        {bmtcError&&<p className="error" role="alert">{t(bmtcError)}</p>}
        {bmtcResult&&<div aria-live="polite">{bmtcResult.available?<><h3>{t('Early passenger-report estimate')}</h3><p className="big"><CrowdBadge level={bmtcResult.crowdLevel} percent={bmtcResult.predictedOccupancyPercent}/></p><p>{t('Based on {count} real passenger reports. It is not a live bus reading; estimates may be uncertain with few reports.',{count:bmtcResult.reportsUsed})}</p></>:<p role="status">{t(bmtcResult.message)}. {t('This route has {received} real crowd reports; {required} are needed.',{received:bmtcResult.reportsReceived,required:bmtcResult.reportsRequired})}</p>}</div>}
      </form>
      {bmtcReports.length>0&&<div className="card"><h2>{t('Recent BMTC passenger reports')}</h2><ul className="plain">{bmtcReports.map(r=><li key={r.id}><CrowdBadge level={r.crowdLevel} percent={r.occupancyPercent}/><small> {new Date(r.observedAt).toLocaleString(language==='kn'?'kn-IN':'en-IN')} · {r.note||t('No note')}</small><div><span>{t('Is this still accurate?')}</span> <button type="button" onClick={()=>voteBmtc(r.id,true)} aria-label={t('Confirm BMTC report')}>👍</button><button type="button" onClick={()=>voteBmtc(r.id,false)} aria-label={t('Mark BMTC report outdated')}>👎</button><button type="button" onClick={()=>flagBmtc(r.id)}>{t('Flag')}</button>{trust[`b-${r.id}`]&&<small> {t('Trust')} {trust[`b-${r.id}`].trust_percent}%</small>}{flagged[`b-${r.id}`]!=null&&<small> · {flagged[`b-${r.id}`]} {t('flags')}</small>}</div></li>)}</ul></div>}
      {result && (
        <div className="card">
          <h2>{t('Previous reports on this route')}</h2>
          {reports.length === 0 ? <p>{t('No reports yet.')}</p> : (
            <ul className="plain">{reports.map((r) => (
              <li key={r.id}><CrowdBadge level={r.crowdLevel} /> <small>{new Date(r.reportedAt).toLocaleString(language==='kn'?'kn-IN':'en-IN')} · {t(r.source === 'SYNTHETIC' ? 'simulated' : 'passenger')}</small>{r.source==='PASSENGER'&&<div><span>{t('Is this still true?')}</span> <button type="button" onClick={()=>confirmReport(r.id,true)} aria-label={t('Confirm report')}>👍</button><button type="button" onClick={()=>confirmReport(r.id,false)} aria-label={t('Mark report outdated')}>👎</button><button type="button" onClick={()=>flagReport(r.id)}>{t('Flag')}</button> {trust[r.id]&&<small> {t('Trust score')} {trust[r.id].trust_percent}% · {trust[r.id].helpful} {t('helpful')}, {trust[r.id].not_helpful} {t('not helpful')}</small>}{flagged[r.id]!=null&&<small> · {flagged[r.id]} {t('flags recorded')}</small>}</div>}</li>
            ))}</ul>
          )}
        </div>
      )}
    </section>
  );
}
