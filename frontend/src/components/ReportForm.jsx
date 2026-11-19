import React, { useState } from 'react';
import { LEVELS } from '../crowd.js';
import { useLanguage } from '../i18n.jsx';

/** Passenger crowd report: choose a route and how full the bus is. */
export default function ReportForm({ routes, onSubmit }) {
  const {t}=useLanguage();
  const [routeId, setRouteId] = useState('');
  const [level, setLevel] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setDone(false);
    if (!routeId) return setError(t('Please choose a route'));
    if (!level) return setError(t('Please choose how crowded the bus is'));
    setError('');
    try {
      await onSubmit({ routeId: Number(routeId), crowdLevel: level, note: note.trim() || null });
      setDone(true); setNote(''); setLevel('');
    } catch (err) { setError(err.message); }
  }

  return (
    <form onSubmit={submit} className="card form" noValidate>
      <h2>{t('Report current crowd')}</h2>
      <div className="field">
        <label htmlFor="report-route">{t('Route')}</label>
        <select id="report-route" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
          <option value="">{t('Select a route…')}</option>
          {routes.map((r) => <option key={r.id} value={r.id}>{r.routeCode} – {r.name}</option>)}
        </select>
      </div>
      <fieldset className="levels">
        <legend>{t('How crowded is the bus?')}</legend>
        {Object.entries(LEVELS).map(([key, info]) => (
          <label key={key} className={level === key ? 'level selected' : 'level'}>
            <input type="radio" name="level" value={key} checked={level === key} onChange={() => setLevel(key)} />
            {info.symbol} {t(info.label)}
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="report-note">{t('Note (optional)')}</label>
        <input id="report-note" maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {done && <p className="success" role="status">{t('Thank you! Your report was submitted.')}</p>}
      <button className="primary">{t('Submit report')}</button>
    </form>
  );
}
