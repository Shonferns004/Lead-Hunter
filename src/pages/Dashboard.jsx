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

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Your lead generation overview</div>
        </div>
        <div className="topbar-actions">
          <Link to="/search" className="btn btn-ghost btn-sm">⌖ New Search</Link>
          <Link to="/messages" className="btn btn-primary btn-sm">Send Outreach</Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><span className="stat-icon">◈</span>Leads Found</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-change up">{stats.total > 0 ? '↑ Active leads' : 'Run a search to find leads'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><span className="stat-icon">◱</span>Messages Sent</div>
          <div className="stat-value">{stats.contacted}</div>
          <div className="stat-change">WhatsApp outreach</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">⬡ Recent Activity</div>
          <Link to="/activity" className="btn btn-ghost btn-sm">View all</Link>
        </div>
        <div className="panel-body" style={{ padding: '12px 16px' }}>
          {recentActivity.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <div className="empty-text">No activity yet — start by running a lead search</div>
            </div>
          ) : (
            <div className="timeline">
              {recentActivity.map(a => {
                const icons = { lead_added: '⌖', lead_contacted: '◱', lead_deleted: '✕', lead_restored: '↩' };
                const colors = { lead_added: '#1a6b3c', lead_contacted: '#1a5a7a', lead_deleted: '#6b2020', lead_restored: '#5a4a1a' };
                const icon = icons[a.type] || '⬡';
                const color = colors[a.type] || '#333';
                return (
                  <div key={a.id} className="tl-item">
                    <div className="tl-dot" style={{ background: color, color: '#fff' }}>{icon}</div>
                    <div className="tl-content">
                      <div className="tl-text">
                        <strong>{a.lead_name}</strong>
                        {a.type === 'lead_added' && ' added'}
                        {a.type === 'lead_contacted' && ' contacted'}
                        {a.type === 'lead_deleted' && ' deleted'}
                        {a.type === 'lead_restored' && ' restored'}
                      </div>
                      <div className="tl-time">{new Date(a.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
