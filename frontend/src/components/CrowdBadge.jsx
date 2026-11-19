import React from 'react';
import { LEVELS, levelKey } from '../crowd.js';

export default function CrowdBadge({ level, percent }) {
  const info = LEVELS[levelKey(level)];
  if (!info) return null;
  return (
    <span className="badge" style={{ background: info.color }} aria-label={`Crowd level ${info.label}`}>
      <span aria-hidden="true">{info.symbol}</span> {info.label}
      {percent != null && ` · ${Math.round(percent)}%`}
    </span>
  );
}
