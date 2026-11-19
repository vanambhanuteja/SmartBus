import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import RouteList from '../components/RouteList.jsx';
import RouteMap from '../components/RouteMap.jsx';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/routes').then(setRoutes).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const selected = routes.find((r) => r.id === selectedId) || null;
  const allStops = [...new Map(routes.flatMap((r) => r.stops).map((s) => [s.id, s])).values()];

  return (
    <section className="two-col">
      <div>
        <h1>Bus routes</h1>
        {loading && <p>Loading routes…</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <RouteList routes={routes} selectedId={selectedId} onSelect={setSelectedId} />
        {selected && (
          <div className="card">
            <h2>{selected.routeCode} stops</h2>
            <ol>{selected.stops.map((s) => <li key={s.id}>{s.name}</li>)}</ol>
          </div>
        )}
      </div>
      <RouteMap route={selected} allStops={allStops} />
    </section>
  );
}
