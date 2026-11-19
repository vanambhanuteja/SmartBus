import React from 'react';

/** Minimal CSS bar chart (no chart library needed). data = [{label, value, color?}] */
export default function BarChart({ data, max, unit = '' }) {
  const top = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="chart" role="img" aria-label="bar chart">
      {data.map((d) => (
        <div className="bar-col" key={d.label}>
          <span className="bar-val">{d.value}{unit}</span>
          <div className="bar" style={{ height: `${(d.value / top) * 100}%`, background: d.color || '#0b5cad' }} />
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
