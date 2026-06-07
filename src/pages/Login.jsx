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
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#0d0d0d', fontFamily: "'DM Sans', sans-serif"
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#1a1a1a', padding: '40px', borderRadius: '12px',
        width: '340px', border: '1px solid #2a2a2a'
      }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
          Lead<span style={{ color: '#22c55e' }}>Hunter</span>
        </div>
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '28px' }}>Web Agency CRM</div>

        {error && (
          <div style={{
            background: '#2d1a1a', border: '1px solid #5c2a2a', color: '#ff6b6b',
            padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px'
          }}>{error}</div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>Username</label>
          <input
            type="text" value={username} onChange={e => setUsername(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #333',
              background: '#111', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
            }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #333',
              background: '#111', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
          background: loading ? '#166534' : '#22c55e', color: '#fff', fontSize: '15px',
          fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'
        }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
