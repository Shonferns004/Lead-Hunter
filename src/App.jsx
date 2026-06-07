import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { useToast } from './components/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeadSearch from './pages/LeadSearch';
import AllLeads from './pages/AllLeads';
import Outreach from './pages/Outreach';
import Activity from './pages/Activity';
import History from './pages/History';
import Settings from './pages/Settings';
import { supabase } from './lib/supabase';
import { apiFetch, setAuthToken } from './lib/constants';

export default function App() {
  const [auth, setAuth] = useState({ loading: true, authenticated: false });
  const [leadCount, setLeadCount] = useState(0);
  const { showToast, ToastContainer } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/api/me')
      .then(data => setAuth({ loading: false, authenticated: data.authenticated }))
      .catch(() => setAuth({ loading: false, authenticated: false }));
  }, []);

  const refreshCounts = useCallback(async () => {
    try {
      const { count: lCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'New');
      if (lCount !== null) setLeadCount(lCount);
    } catch {}
  }, []);

  useEffect(() => { if (auth.authenticated) refreshCounts(); }, [auth.authenticated, refreshCounts]);

  useEffect(() => {
    if (!auth.authenticated) return;
    const channel = supabase.channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        refreshCounts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [auth.authenticated, refreshCounts]);

  function handleLoginSuccess() {
    setAuth({ loading: false, authenticated: true });
    navigate('/');
  }

  async function handleLogout() {
    try {
      await apiFetch('/api/logout', { method: 'POST' });
    } catch {}
    setAuthToken(null);
    setAuth({ authenticated: false });
    navigate('/');
  }

  if (auth.loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0d0d0d', color: '#666', fontFamily: "'DM Sans', sans-serif", fontSize: '14px'
      }}>
        Loading...
      </div>
    );
  }

  if (!auth.authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="layout">
      <Sidebar leadCount={leadCount} onLogout={handleLogout} />
      <div className="main">
        <Routes>
          <Route path="/" element={<Dashboard showToast={showToast} />} />
          <Route path="/search" element={<LeadSearch showToast={showToast} refreshCounts={refreshCounts} />} />
          <Route path="/leads" element={<AllLeads showToast={showToast} refreshCounts={refreshCounts} />} />
          <Route path="/messages" element={<Outreach showToast={showToast} />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/history" element={<History showToast={showToast} refreshCounts={refreshCounts} />} />
          <Route path="/settings" element={<Settings showToast={showToast} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <ToastContainer />
    </div>
  );
}
