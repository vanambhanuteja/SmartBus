import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n.jsx';

export default function Home() {
  const {t}=useLanguage();
  return (
    <section className="home-page">
      <div className="hero-photo">
        <div className="hero-copy">
          <span className="eyebrow">SMARTBUS · BENGALURU</span>
          <h1>{t('Know how crowded your bus is before you board')}</h1>
          <p>{t('Browse BMTC Bengaluru routes or the illustrative Mysuru demo network. Passengers can report crowd conditions, and BMTC forecasts use real passenger reports when enough data is available.')}</p>
          <div className="cta">
            <Link className="primary btn" to="/routes">{t('Browse routes')}</Link>
            <Link className="glass-btn btn" to="/predict">{t('Check crowd forecast')}</Link>
          </div>
        </div>
        <a className="hero-caption" href="https://unsplash.com/photos/a-blue-bus-driving-down-a-street-next-to-a-bridge-F7zoVod4kCQ" target="_blank" rel="noreferrer">{t('Photo by Ajith P Das on Unsplash')}</a>
      </div>
      <div className="home-highlights">
        <article className="highlight-card"><span className="feature-icon">◉</span><h2>{t('Route & stop information')}</h2><p>{t('Explore stops and published BMTC timetables on an interactive map.')}</p></article>
        <article className="highlight-card"><span className="feature-icon">▥</span><h2>{t('Crowd insights')}</h2><p>{t('Check forecasts and see recent passenger observations.')}</p></article>
        <article className="highlight-card"><span className="feature-icon">⌖</span><h2>{t('Nearby stops')}</h2><p>{t('Find published bus stops around your current location.')}</p></article>
      </div>
      <div className="home-lower">
        <div className="crowd-legend-card"><h2>{t('Know before you go')}</h2><p>{t('A quick guide to the crowd levels shown in SmartBus.')}</p><ul className="legend">
          <li><span className="legend-dot low">●</span>{t('Low')}</li><li><span className="legend-dot moderate">●●</span>{t('Moderate')}</li><li><span className="legend-dot high">●●●</span>{t('High')}</li><li><span className="legend-dot full">●●●●</span>{t('Overcrowded')}</li>
        </ul></div>
        <div className="home-photo-card" role="img" aria-label={t('People waiting for a city bus')}><a href="https://unsplash.com/photos/people-wait-at-a-bus-stop-with-a-bus-arriving-eL28tbPgioI" target="_blank" rel="noreferrer">{t('Photo by Artem Korolev on Unsplash')}</a></div>
      </div>
    </section>
  );
}
