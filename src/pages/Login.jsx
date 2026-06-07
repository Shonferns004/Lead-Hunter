import React, { useState } from 'react';
import { apiFetch, setAuthToken } from '../lib/constants';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setAuthToken(data.token);
      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-3xl">hexagon</span>
          </div>
          <h1 className="text-2xl font-bold font-headline-md text-on-surface">
            Lead<span className="text-primary">Hunter</span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Web Agency CRM</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-400 px-4 py-2.5 rounded-lg text-sm mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-on-surface-variant block mb-1.5 font-label-sm">Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-surface-container-high border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant block mb-1.5 font-label-sm">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface-container-high border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary/90 transition-colors glow-primary disabled:opacity-50">
          {loading ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">login</span>
          )}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
