import React from 'react';

export default function RouteList({ routes, selectedId, onSelect }) {
  if (!routes.length) return <p>No routes available.</p>;
  const visible = routes.slice(0, 120);
  return (
    <>
    {routes.length > visible.length && <p>Showing the first {visible.length} matches. Use search to narrow the list.</p>}
    <ul className="route-list" aria-label="Bus routes">
      {visible.map((r) => (
        <li key={r.id}>
          <button className={r.id === selectedId ? 'route-btn selected' : 'route-btn'} onClick={() => onSelect(r.id)}>
            <strong>{r.routeCode}</strong> {r.name}
            {r.stops && <small> · {r.stops.length} stops</small>}
          </button>
        </li>
      ))}
    </ul>
    </>
  );
}
