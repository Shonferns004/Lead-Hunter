import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useToast } from './components/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeadSearch from './pages/LeadSearch';
import AllLeads from './pages/AllLeads';
import Outreach from './pages/Outreach';
import History from './pages/History';
import Settings from './pages/Settings';
import { supabase } from './lib/supabase';
import { apiFetch, setAuthToken } from './lib/constants';

export default function App() {
  const [auth, setAuth] = useState({ loading: true, authenticated: false });
  const [leadCount, setLeadCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState(null);
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
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      showToast('App installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [showToast]);

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

  async function handleInstallApp() {
    if (!installPrompt) {
      showToast('Install is not available right now. Use the browser menu to install this app.');
      return;
    }

    const prompt = installPrompt;
    setInstallPrompt(null);
    prompt.prompt();
    const choice = await prompt.userChoice.catch(() => null);
    if (choice?.outcome === 'accepted') {
      showToast('Install started');
    }
  }

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-on-surface-variant animate-spin text-2xl">progress_activity</span>
      </div>
    );
  }

  if (!auth.authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <Routes>
        <Route element={
          <Layout
            leadCount={leadCount}
            onLogout={handleLogout}
          />
        }>
          <Route path="/" element={<Dashboard showToast={showToast} />} />
          <Route path="/search" element={<LeadSearch showToast={showToast} refreshCounts={refreshCounts} />} />
          <Route path="/leads" element={<AllLeads showToast={showToast} refreshCounts={refreshCounts} />} />
          <Route path="/messages" element={<Outreach showToast={showToast} />} />
          <Route path="/history" element={<History showToast={showToast} refreshCounts={refreshCounts} />} />
          <Route
            path="/settings"
            element={
              <Settings
                showToast={showToast}
                onLogout={handleLogout}
                onInstallApp={handleInstallApp}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ToastContainer />
    </>
  );
}
