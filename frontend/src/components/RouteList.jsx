import React from 'react';

export default function RouteList({ routes, selectedId, onSelect }) {
  if (!routes.length) return <p>No routes available.</p>;
  return (
    <ul className="route-list" aria-label="Bus routes">
      {routes.map((r) => (
        <li key={r.id}>
          <button className={r.id === selectedId ? 'route-btn selected' : 'route-btn'} onClick={() => onSelect(r.id)}>
            <strong>{r.routeCode}</strong> {r.name}
            <small> · {r.stops.length} stops</small>
          </button>
        </li>
      ))}
    </ul>
  );
}
