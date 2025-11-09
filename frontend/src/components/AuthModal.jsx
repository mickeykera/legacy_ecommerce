import React from 'react';
import useAuth from '../hooks/useAuth.js';

export default function AuthModal({ onClose, onLogin, onRegister }) {
  const [mode, setMode] = React.useState('login');
  const [form, setForm] = React.useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = React.useState(false);

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await onLogin(form.username, form.password);
      } else {
        await onRegister(form.username, form.email, form.password);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal small" onSubmit={submit}>
        <div className="modal-header">
          <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
          <button type="button" className="icon-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body form-grid">
          <label>Username<input className="input" value={form.username} onChange={e => update('username', e.target.value)} required /></label>
          {mode === 'register' && (
            <label>Email<input className="input" type="email" value={form.email} onChange={e => update('email', e.target.value)} required /></label>
          )}
          <label>Password<input className="input" type="password" minLength={8} value={form.password} onChange={e => update('password', e.target.value)} required /></label>
        </div>
        <div className="modal-footer between">
          <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Create account' : 'Have an account? Sign in'}
          </button>
          <button className="btn primary" disabled={loading} type="submit">{loading ? 'Please wait…' : (mode === 'login' ? 'Sign in' : 'Register')}</button>
        </div>
      </form>
    </div>
  );
}
