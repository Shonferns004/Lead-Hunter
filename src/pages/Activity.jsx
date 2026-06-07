import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/constants';

const TYPE_CONFIG = {
  lead_added: { icon: 'add_circle', bg: 'bg-emerald-600/20 text-emerald-400', label: 'Lead Added' },
  lead_contacted: { icon: 'send', bg: 'bg-blue-600/20 text-blue-400', label: 'Contacted' },
  lead_deleted: { icon: 'delete', bg: 'bg-red-600/20 text-red-400', label: 'Deleted' },
  lead_restored: { icon: 'undo', bg: 'bg-yellow-600/20 text-yellow-400', label: 'Restored' },
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
    return TYPE_CONFIG[type]?.label || type;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-headline-md text-on-surface">Activity Log</h1>
          <p className="text-sm text-on-surface-variant">All actions across the CRM</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text" placeholder="Search by name, category..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-container-high border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary transition-colors"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-surface-container-high border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors">
          <option value="">All Actions</option>
          <option value="lead_added">Lead Added</option>
          <option value="lead_contacted">Contacted</option>
          <option value="lead_restored">Restored</option>
          <option value="lead_deleted">Deleted</option>
        </select>
      </div>

      <div className="glass-card rounded-xl">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-on-surface-variant text-2xl">progress_activity</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl block mb-2">timeline</span>
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-0">
              {activities.map(a => {
                const cfg = TYPE_CONFIG[a.type] || { icon: 'circle', bg: 'bg-surface-container-high text-on-surface-variant' };
                return (
                  <div key={a.id} className="flex gap-3 py-3 border-b border-border-subtle/50 last:border-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                      <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface">
                        <span className="font-medium">{a.lead_name}</span>
                        {a.type === 'lead_added' && ' added to leads'}
                        {a.type === 'lead_contacted' && ' marked as Contacted'}
                        {a.type === 'lead_deleted' && ' deleted'}
                        {a.type === 'lead_restored' && ' moved back to Leads'}
                        {a.category && <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant ml-2">{a.category}</span>}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{formatTime(a.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
