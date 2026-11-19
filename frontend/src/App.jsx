import React from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import RoutesPage from './pages/RoutesPage.jsx';
import PredictPage from './pages/PredictPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import { useLanguage } from './i18n.jsx';

function RequireAuth({ children, admin }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, isAdmin, logout } = useAuth();
  const {language,toggleLanguage,t}=useLanguage();
  const [dark,setDark]=React.useState(localStorage.getItem('smartbus-theme')==='dark');
  React.useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';localStorage.setItem('smartbus-theme',dark?'dark':'light');},[dark]);
  return (
    <>
      <a className="skip-link" href="#main-content">{t('Skip to main content')}</a>
      <header className="topbar">
        <Link to="/" className="brand">🚌 SmartBus</Link>
        <nav>
          <NavLink to="/routes">{t('Routes')}</NavLink>
          {user && <NavLink to="/predict">{t('Crowd forecast')}</NavLink>}
          {user && <NavLink to="/report">{t('Report crowd')}</NavLink>}
          {isAdmin && <NavLink to="/admin">{t('Admin')}</NavLink>}
          {user ? <button onClick={logout}>{t('Log out')} ({user.fullName})</button> : <NavLink to="/login">{t('Log in')}</NavLink>}
          <button type="button" onClick={()=>setDark(v=>!v)}>{t(dark?'Switch to light mode':'Switch to dark mode')}</button>
          <button type="button" aria-pressed={language==='kn'} onClick={toggleLanguage}>{language==='kn'?'English':'ಕನ್ನಡ'}</button>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/predict" element={<RequireAuth><PredictPage /></RequireAuth>} />
          <Route path="/report" element={<RequireAuth><ReportPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth admin><AdminPage /></RequireAuth>} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
      <footer>{t('Legacy demo routes use simulated training data. BMTC forecasts require passenger reports; published schedules are not live arrivals or crowd readings. BMTC schedule data is unofficial.')}</footer>
    </>
  );
}
