import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/constants';
import { SkeletonBlock, SkeletonTableRow } from '../components/Skeleton';

const statusStyles = {
  Contacted: 'bg-secondary-container/20 text-secondary border-secondary/30',
  'No Response': 'bg-error-container/20 text-error border-error/30',
  Negotiating: 'bg-tertiary-container/20 text-tertiary border-tertiary/30',
};

const categoryIcons = {
  Sports: 'fitness_center',
  'Real Estate': 'apartment',
  SaaS: 'monitoring',
};

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

  function exportCSV() {
    const rows = [['Name', 'Category', 'Address', 'Phone', 'Contacted']];
    leads.forEach(l => rows.push([l.name, l.category, l.address, l.phone, l.updated_at]));
    const csv = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csv);
    a.download = 'history.csv';
    a.click();
  }

  const respondedCount = leads.filter(l => l.status === 'Contacted').length;
  const conversionRate = leads.length ? ((respondedCount / leads.length) * 100).toFixed(1) : '0.0';
  const efficiency = leads.length ? Math.min(100, Math.round((respondedCount / leads.length) * 100)) : 0;

  return (
    <div className="space-y-4 max-w-7xl">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-on-surface">History Archive</h2>
          <p className="text-xs text-on-surface-variant max-w-2xl">Contacted leads archive</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="bg-surface-container-high text-on-surface px-3 py-1.5 rounded-lg border border-border-subtle flex items-center gap-1.5 hover:bg-surface-variant transition-colors text-xs">
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
          <button className="bg-primary-container text-white px-3 py-1.5 rounded-lg text-xs hover:opacity-90 transition-opacity glow-primary">
            Generate Report
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative flex-1 w-full md:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
          <input
            type="text" placeholder="Search businesses, owners, or keywords..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded-lg pl-8 pr-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
        </div>
        <div className="flex gap-1.5 items-center flex-wrap">
          <button onClick={() => setCategoryFilter('')}
            className={`px-3 py-1 rounded-full border text-xs transition-colors ${
              !categoryFilter
                ? 'border-primary text-primary bg-primary/10'
                : 'border-outline-variant text-on-surface-variant hover:border-on-surface hover:text-on-surface'
            }`}>
            All Categories
          </button>
          {categories.slice(0, 5).map(c => (
            <button key={c} onClick={() => setCategoryFilter(c === categoryFilter ? '' : c)}
              className={`px-3 py-1 rounded-full border text-xs transition-colors ${
                categoryFilter === c
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-outline-variant text-on-surface-variant hover:border-on-surface hover:text-on-surface'
              }`}>
              {c}
            </button>
          ))}
          {categories.length > 5 && (
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-border-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container border-b border-border-subtle">
              <tr>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">Business Name</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">Category</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">Phone</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">Contact Date</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={6} />)
              ) : leads.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="text-center py-12 text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl block mb-1">history</span>
                    <p className="text-sm">No contacted leads found.</p>
                  </div>
                </td></tr>
              ) : (
                leads.map((b, i) => {
                  const icon = categoryIcons[b.category] || 'business';
                  return (
                    <tr key={b.id} className="hover:bg-surface-variant/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary">
                            <span className="material-symbols-outlined text-[16px]">{icon}</span>
                          </div>
                          <div>
                            <p className="text-sm text-on-surface group-hover:text-primary transition-colors">{b.name}</p>
                            <p className="text-[11px] text-on-surface-variant">{b.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-variant text-on-surface text-[11px] font-medium border border-outline-variant">{b.category}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant font-mono">{b.phone}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{b.updated_at ? new Date(b.updated_at).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyles['Contacted'] || ''}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {b.status || 'Contacted'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => window.open(`https://wa.me/${b.phone.replace(/\s+/g, '')}`, '_blank')}
                            className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 transition-colors" title="WhatsApp Outreach">
                            <span className="material-symbols-outlined text-[16px]">chat</span>
                          </button>
                          <button onClick={() => moveToNew(b, i)}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors" title="Restore to Leads">
                            <span className="material-symbols-outlined text-[16px]">unarchive</span>
                          </button>
                          <button onClick={() => deleteLead(b, i)}
                            className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors" title="Delete">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-surface-container border-t border-border-subtle px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">Showing {leads.length} archived {leads.length === 1 ? 'lead' : 'leads'}</span>
        </div>
      </div>

      {/* Analytical Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading ? (
          <>
            <div className="glass-card p-4 rounded-xl space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-6 w-10" />
            </div>
            <div className="glass-card p-4 rounded-xl space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-6 w-10" />
            </div>
            <div className="glass-card p-4 rounded-xl col-span-2 space-y-2">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-6 w-14" />
              <SkeletonBlock className="h-2 w-full rounded-full" />
            </div>
          </>
        ) : (
          <>
            <div className="glass-card p-4 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="material-symbols-outlined text-primary p-1.5 bg-primary/10 rounded-lg text-[16px]">forum</span>
                <span className="text-secondary text-[10px] font-medium">+12%</span>
              </div>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-medium">Total Responses</p>
              <p className="text-lg font-bold text-on-surface">{respondedCount}</p>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="material-symbols-outlined text-secondary p-1.5 bg-secondary/10 rounded-lg text-[16px]">check_circle</span>
                <span className="text-secondary text-[10px] font-medium">+5%</span>
              </div>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-medium">Conversion Rate</p>
              <p className="text-lg font-bold text-on-surface">{conversionRate}%</p>
            </div>
            <div className="glass-card p-4 rounded-xl col-span-2 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-medium">Outreach Efficiency</p>
                  <p className="text-lg font-bold text-on-surface">{efficiency}/100</p>
                </div>
                <div className="w-full bg-surface-variant h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-primary h-full group-hover:shadow-[0_0_10px_rgba(124,58,237,0.5)] transition-all duration-700" style={{ width: `${efficiency}%` }}></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
