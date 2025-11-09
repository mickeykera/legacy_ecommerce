import React from 'react';

const AuthContext = React.createContext(null);

export default function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [token, setToken] = React.useState(null);

  React.useEffect(() => {
    const saved = localStorage.getItem('auth');
    if (saved) {
      const { user, token } = JSON.parse(saved);
      setUser(user);
      setToken(token);
    }
  }, []);

  function persist(next) {
    localStorage.setItem('auth', JSON.stringify(next));
  }

  async function login(username, password) {
    const resp = await fetch('/api/auth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!resp.ok) throw new Error('Login failed');
    const data = await resp.json();
    const user = { username };
    setUser(user);
    setToken(data.access);
    persist({ user, token: data.access });
  }

  async function register(username, email, password) {
    const resp = await fetch('/api/accounts/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    if (!resp.ok) throw new Error('Register failed');
    const data = await resp.json();
    const user = data.user;
    setUser(user);
    setToken(data.access);
    persist({ user, token: data.access });
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth');
  }

  const value = { user, token, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
