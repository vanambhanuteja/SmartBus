import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import { useAuth } from '../auth.jsx';
import { useLanguage } from '../i18n.jsx';

export default function Login() {
  const [mode, setMode] = useState('login');
  const { login, register } = useAuth();
  const {t}=useLanguage();
  const navigate = useNavigate();

  async function submit(v) {
    const s = mode === 'login' ? await login(v.email, v.password) : await register(v.fullName, v.email, v.password);
    navigate(s.role === 'ADMIN' ? '/admin' : '/predict');
  }
  return (
    <section className="narrow">
      <AuthForm key={mode} mode={mode} onSubmit={submit} />
      <p className="center">
        {mode === 'login' ? t('New passenger?') : t('Already registered?')}{' '}
        <button className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? t('Create an account') : t('Log in')}
        </button>
      </p>
    </section>
  );
}
