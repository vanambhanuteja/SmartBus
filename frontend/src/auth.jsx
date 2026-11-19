import React, { createContext, useContext, useState } from 'react';
import { api, getSession, saveSession } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSession());

  async function authenticate(path, payload) {
    const s = await api(path, { method: 'POST', body: payload });
    saveSession(s);
    setUser(s);
    return s;
  }
  const value = {
    user,
    isAdmin: user?.role === 'ADMIN',
    login: (email, password) => authenticate('/auth/login', { email, password }),
    register: (fullName, email, password) => authenticate('/auth/register', { fullName, email, password }),
    logout: () => { saveSession(null); setUser(null); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
