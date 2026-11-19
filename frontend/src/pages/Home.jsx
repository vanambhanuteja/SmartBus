import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="hero">
      <h1>Know how crowded your bus is before you board</h1>
      <p>SmartBus shows Mysuru bus routes, forecasts crowd levels for the time you travel, and lets passengers report what they see.</p>
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
