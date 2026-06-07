import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/constants';

export default function Dashboard({ showToast }) {
  const [stats, setStats] = useState({ total: 0, contacted: 0 });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const channel = supabase.channel('dash-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadStats();
        loadActivity();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadData() {
    await loadStats();
    await loadActivity();
  }

  async function loadStats() {
    try {
      const { data: leads } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (leads) {
        setStats({
          total: leads.length,
          contacted: leads.filter(l => l.status === 'Contacted').length,
        });
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
  }

  async function loadActivity() {
    try {
      const data = await apiFetch('/api/activities?limit=10');
      setRecentActivity(data || []);
    } catch {}
  }

  const activityIcons = { lead_added: 'add_circle', lead_contacted: 'send', lead_deleted: 'delete', lead_restored: 'undo' };
  const activityBg = { lead_added: 'bg-emerald-600/20 text-emerald-400', lead_contacted: 'bg-blue-600/20 text-blue-400', lead_deleted: 'bg-red-600/20 text-red-400', lead_restored: 'bg-yellow-600/20 text-yellow-400' };
  const activityLabels = { lead_added: 'added', lead_contacted: 'contacted', lead_deleted: 'deleted', lead_restored: 'restored' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-headline-md text-on-surface">Dashboard</h1>
          <p className="text-sm text-on-surface-variant">Your lead generation overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/search" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors border border-border-subtle">
            <span className="material-symbols-outlined text-[18px]">travel_explore</span>
            New Search
          </Link>
          <Link to="/messages" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary/90 transition-colors glow-primary">
            <span className="material-symbols-outlined text-[18px]">send</span>
            Send Outreach
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-sm">Leads Found</span>
            <span className="material-symbols-outlined text-on-surface-variant/40 text-2xl">database</span>
          </div>
          <div className="text-3xl font-bold font-headline-md text-on-surface">{stats.total}</div>
          <div className="text-xs text-on-surface-variant mt-1">Total leads in the system</div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-sm">Messages Sent</span>
            <span className="material-symbols-outlined text-on-surface-variant/40 text-2xl">send</span>
          </div>
          <div className="text-3xl font-bold font-headline-md text-on-surface">{stats.contacted}</div>
          <div className="text-xs text-on-surface-variant mt-1">WhatsApp outreach sent</div>
        </div>
      </div>

      <div className="glass-card rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-sm font-semibold font-headline-md text-on-surface">
            <span className="material-symbols-outlined text-primary text-lg">history</span>
            Recent Activity
          </div>
          <Link to="/activity" className="text-xs text-primary hover:text-primary/80 transition-colors">View all</Link>
        </div>
        <div className="p-4">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl block mb-2">playlist_add</span>
              <p className="text-sm">No activity yet — start by running a lead search</p>
            </div>
          ) : (
            <div className="space-y-0">
              {recentActivity.map(a => (
                <div key={a.id} className="flex gap-3 py-2.5 border-b border-border-subtle/50 last:border-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${activityBg[a.type] || 'bg-surface-container-high text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-sm">{activityIcons[a.type] || 'circle'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface">
                      <span className="font-medium">{a.lead_name}</span>
                      {' '}{activityLabels[a.type] || a.type}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
