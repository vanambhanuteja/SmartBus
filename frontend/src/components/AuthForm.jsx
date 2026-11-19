import React, { useState } from 'react';
import { validateLogin, validateRegister } from '../validation.js';

/** Login / register form with inline validation errors. */
export default function AuthForm({ mode, onSubmit }) {
  const isRegister = mode === 'register';
  const [values, setValues] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setValues({ ...values, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const found = isRegister ? validateRegister(values) : validateLogin(values);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;
    setBusy(true);
    try { await onSubmit(values); } catch (err) { setServerError(err.message); } finally { setBusy(false); }
  }

  const field = (id, label, type, extra = {}) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={values[id]} onChange={set(id)} aria-invalid={!!errors[id]} {...extra} />
      {errors[id] && <span className="error" role="alert">{errors[id]}</span>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="card form">
      <h2>{isRegister ? 'Create passenger account' : 'Log in'}</h2>
      {isRegister && field('fullName', 'Full name', 'text', { autoComplete: 'name' })}
      {field('email', 'Email', 'email', { autoComplete: 'email' })}
      {field('password', 'Password', 'password', { autoComplete: isRegister ? 'new-password' : 'current-password' })}
      {serverError && <p className="error" role="alert">{serverError}</p>}
      <button className="primary" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Register' : 'Log in'}</button>
    </form>
  );
}
