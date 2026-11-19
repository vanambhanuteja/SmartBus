import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="hero">
      <h1>Know how crowded your bus is before you board</h1>
      <p>Browse BMTC Bengaluru routes or the illustrative Mysuru demo network. Passengers can report crowd conditions, and BMTC forecasts use real passenger reports when enough data is available.</p>
      <div className="cta">
        <Link className="primary btn" to="/routes">Browse routes</Link>
        <Link className="btn" to="/predict">Check crowd forecast</Link>
      </div>
      <ul className="legend">
        <li>● Low</li><li>●● Moderate</li><li>●●● High</li><li>●●●● Overcrowded</li>
      </ul>
    </section>
  );
}
