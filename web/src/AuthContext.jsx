import { createContext, useContext, useEffect, useState } from 'react';
import { api, leggiToken, salvaToken, rimuoviToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utente, setUtente] = useState(null);
  const [caricamento, setCaricamento] = useState(Boolean(leggiToken()));

  // All'apertura: se c'è un token salvato, chiedi al server chi sei
  useEffect(() => {
    if (!leggiToken()) return;
    api('/auth/me')
      .then(setUtente)
      .catch(() => rimuoviToken())
      .finally(() => setCaricamento(false));
  }, []);

  async function login(username, password) {
    const { token, utente } = await api('/auth/login', {
      metodo: 'POST',
      corpo: { username, password },
    });
    salvaToken(token);
    setUtente(utente);
  }

  function logout() {
    rimuoviToken();
    setUtente(null);
  }

  return (
    <AuthContext.Provider value={{ utente, caricamento, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}