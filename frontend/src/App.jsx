import React from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import RoutesPage from './pages/RoutesPage.jsx';
import PredictPage from './pages/PredictPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

function RequireAuth({ children, admin }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, isAdmin, logout } = useAuth();
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">🚌 SmartBus</Link>
        <nav>
          <NavLink to="/routes">Routes</NavLink>
          {user && <NavLink to="/predict">Crowd forecast</NavLink>}
          {user && <NavLink to="/report">Report crowd</NavLink>}
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          {user ? <button onClick={logout}>Log out ({user.fullName})</button> : <NavLink to="/login">Log in</NavLink>}
        </nav>
      </header>
      <main>
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
      <footer>Demo network: illustrative Mysuru routes, not official KSRTC data. Crowd forecasts are based on simulated data.</footer>
    </>
  );
}
