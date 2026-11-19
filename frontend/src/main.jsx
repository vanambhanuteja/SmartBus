import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import App from './App.jsx';
import { AuthProvider } from './auth.jsx';
import { LanguageProvider } from './i18n.jsx';

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}));

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <LanguageProvider><AuthProvider><App /></AuthProvider></LanguageProvider>
  </BrowserRouter>
);
