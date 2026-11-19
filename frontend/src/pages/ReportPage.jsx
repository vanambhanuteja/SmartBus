import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import ReportForm from '../components/ReportForm.jsx';

export default function ReportPage() {
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { api('/routes').then(setRoutes).catch((e) => setError(e.message)); }, []);
  return (
    <section className="narrow">
      <h1>Report crowd</h1>
      {error && <p className="error" role="alert">{error}</p>}
      <ReportForm routes={routes} onSubmit={(b) => api('/crowd-reports', { method: 'POST', body: b })} />
    </section>
  );
}
