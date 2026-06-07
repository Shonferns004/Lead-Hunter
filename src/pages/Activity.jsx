import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/constants';

const TYPE_ICONS = {
  lead_added: { icon: '⌖', bg: '#1a6b3c' },
  lead_contacted: { icon: '◱', bg: '#1a5a7a' },
  lead_deleted: { icon: '✕', bg: '#6b2020' },
  lead_restored: { icon: '↩', bg: '#5a4a1a' },
};

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadRef = useRef();

  useEffect(() => { loadRef.current = loadActivities; });
  useEffect(() => { loadActivities(); }, []);
  useEffect(() => { loadActivities(); }, [search, typeFilter]);

  async function loadActivities() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (search) params.set('search', search);
      const data = await apiFetch(`/api/activities?${params.toString()}`);
      setActivities(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  }

  function typeLabel(type) {
    switch (type) {
      case 'lead_added': return 'Lead Added';
      case 'lead_contacted': return 'Contacted';
      case 'lead_deleted': return 'Deleted';
      case 'lead_restored': return 'Restored';
      default: return type;
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Activity Log</div>
          <div className="page-sub">All actions across the CRM</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Search by name, category..."
          style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none', width: '200px' }}
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select
          style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none' }}
          value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">All Actions</option>
          <option value="lead_added">Lead Added</option>
          <option value="lead_contacted">Contacted</option>
          <option value="lead_restored">Restored</option>
          <option value="lead_deleted">Deleted</option>
        </select>
      </div>

      <div className="panel">
        <div className="panel-body" style={{ padding: '12px 16px' }}>
          {loading ? (
            <div className="loading-spinner"></div>
          ) : activities.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <div className="empty-icon">⬡</div>
              <div className="empty-text">No activity yet</div>
            </div>
          ) : (
            <div className="timeline">
              {activities.map(a => {
                const t = TYPE_ICONS[a.type] || { icon: '⬡', bg: '#333' };
                return (
                  <div key={a.id} className="tl-item">
                    <div className="tl-dot" style={{ background: t.bg, color: '#fff' }}>{t.icon}</div>
                    <div className="tl-content">
                      <div className="tl-text">
                        <strong>{a.lead_name}</strong>
                        {a.type === 'lead_added' && ' added to leads'}
                        {a.type === 'lead_contacted' && ' marked as Contacted'}
                        {a.type === 'lead_deleted' && ' deleted'}
                        {a.type === 'lead_restored' && ' moved back to Leads'}
                        {a.category && <span className="tag" style={{ marginLeft: '8px' }}>{a.category}</span>}
                      </div>
                      <div className="tl-time">{formatTime(a.created_at)}</div>
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
