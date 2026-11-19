import React from 'react';
import { LEVELS, levelKey } from '../crowd.js';
import { useLanguage } from '../i18n.jsx';

export default function CrowdBadge({ level, percent }) {
  const {t}=useLanguage();
  const info = LEVELS[levelKey(level)];
  if (!info) return null;
  return (
    <span className="badge" style={{ background: info.color }} aria-label={`${t('Crowd level')} ${t(info.label)}`}>
      <span aria-hidden="true">{info.symbol}</span> {t(info.label)}
      {percent != null && ` · ${Math.round(percent)}%`}
    </span>
  );
}
