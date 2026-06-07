import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/constants';

export default function History({ showToast, refreshCounts }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  const loadLeadsRef = useRef();

  useEffect(() => { loadLeadsRef.current = loadLeads; });

  useEffect(() => { loadLeads(); }, []);

  useEffect(() => {
    const channel = supabase.channel('history-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadLeadsRef.current?.();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadLeads() {
    setLoading(true);
    try {
      let query = supabase.from('leads').select('*').eq('status', 'Contacted').order('updated_at', { ascending: false });
      if (categoryFilter) query = query.eq('category', categoryFilter);
      if (search) query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,address.ilike.%${search}%`);
      const { data } = await query;
      setLeads(data || []);

      const { data: all } = await supabase.from('leads').select('category').eq('status', 'Contacted').not('category', 'is', null).neq('category', '');
      if (all) {
        const cats = [...new Set(all.map(l => l.category).filter(Boolean))].sort();
        setCategories(cats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLeads(); }, [search, categoryFilter]);

  async function moveToNew(lead, index) {
    const { error } = await supabase.from('leads').update({ status: 'New' }).eq('id', lead.id);
    if (!error) {
      setLeads(leads.filter((_, i) => i !== index));
      apiFetch('/api/activities', { method: 'POST', body: JSON.stringify({ type: 'lead_restored', lead_name: lead.name, lead_phone: lead.phone, category: lead.category }) }).catch(() => {});
      showToast(`${lead.name} moved back to Leads`);
      refreshCounts();
    }
  }

  async function deleteLead(lead, index) {
    const { error } = await supabase.from('leads').delete().eq('id', lead.id);
    if (!error) {
      setLeads(leads.filter((_, i) => i !== index));
      apiFetch('/api/activities', { method: 'POST', body: JSON.stringify({ type: 'lead_deleted', lead_name: lead.name, lead_phone: lead.phone, category: lead.category }) }).catch(() => {});
      showToast(`${lead.name} deleted`);
      refreshCounts();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-headline-md text-on-surface">History</h1>
          <p className="text-sm text-on-surface-variant">Contacted leads archive</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text" placeholder="Search by name, category, location..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-container-high border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary transition-colors"
          />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="bg-surface-container-high border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-container-low">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Business</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Category</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Phone</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Contacted</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12"><span className="material-symbols-outlined animate-spin text-on-surface-variant text-2xl">progress_activity</span></td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className="text-center py-12 text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl block mb-2">history</span>
                    <p className="text-sm">No contacted leads yet. Send outreach from All Leads or WhatsApp Outreach.</p>
                  </div>
                </td></tr>
              ) : (
                leads.map((b, i) => (
                  <tr key={b.id} className="border-b border-border-subtle/50 hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-on-surface">{b.name}</div>
                      <div className="text-xs text-on-surface-variant">{b.address}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-1 rounded bg-surface-container-high text-on-surface-variant">{b.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`tel:${b.phone}`} className="text-secondary hover:text-secondary/80 transition-colors text-sm font-medium">{b.phone}</a>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{b.updated_at ? new Date(b.updated_at).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => window.open(`https://wa.me/${b.phone.replace(/\s+/g, '')}`, '_blank')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 transition-colors">
                          <span className="material-symbols-outlined text-[14px]">chat</span>
                          WA
                        </button>
                        <button onClick={() => moveToNew(b, i)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors border border-border-subtle">
                          <span className="material-symbols-outlined text-[14px]">undo</span>
                          Move to Leads
                        </button>
                        <button onClick={() => deleteLead(b, i)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
