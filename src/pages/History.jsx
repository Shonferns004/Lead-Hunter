import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/constants';

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
    <div className="space-y-stack-lg max-w-7xl">
      {/* floating background blobs */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none -z-10"></div>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">History Archive</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">A comprehensive log of all contacted leads, outreach outcomes, and historical engagement data.</p>
        </div>
        <div className="flex gap-stack-md">
          <button onClick={exportCSV}
            className="bg-surface-container-high text-on-surface px-stack-md py-2 rounded-lg border border-border-subtle flex items-center gap-2 hover:bg-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span className="font-label-md text-label-md">Export CSV</span>
          </button>
          <button className="bg-primary-container text-white px-stack-md py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity glow-primary">
            Generate Report
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-stack-md items-start md:items-center">
        <div className="relative flex-1 w-full md:max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text" placeholder="Search businesses, owners, or keywords..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded-xl pl-12 pr-4 py-3 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
        </div>
        <div className="flex gap-stack-sm items-center flex-wrap">
          <button onClick={() => setCategoryFilter('')}
            className={`px-stack-md py-2 rounded-full border font-label-md text-label-md transition-colors ${
              !categoryFilter
                ? 'border-primary text-primary bg-primary/10'
                : 'border-outline-variant text-on-surface-variant hover:border-on-surface hover:text-on-surface'
            }`}>
            All Categories
          </button>
          {categories.slice(0, 5).map(c => (
            <button key={c} onClick={() => setCategoryFilter(c === categoryFilter ? '' : c)}
              className={`px-stack-md py-2 rounded-full border font-label-md text-label-md transition-colors ${
                categoryFilter === c
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-outline-variant text-on-surface-variant hover:border-on-surface hover:text-on-surface'
              }`}>
              {c}
            </button>
          ))}
          {categories.length > 5 && (
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
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
                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase opacity-70 tracking-wider">Business Name</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase opacity-70 tracking-wider">Category</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase opacity-70 tracking-wider">Phone</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase opacity-70 tracking-wider">Contact Date</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase opacity-70 tracking-wider">Status</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase opacity-70 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16"><span className="material-symbols-outlined animate-spin text-on-surface-variant text-2xl">progress_activity</span></td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="text-center py-16 text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-2">history</span>
                    <p className="font-body-md text-body-md">No contacted leads found.</p>
                  </div>
                </td></tr>
              ) : (
                leads.map((b, i) => {
                  const icon = categoryIcons[b.category] || 'business';
                  return (
                    <tr key={b.id} className="hover:bg-surface-variant/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary">
                            <span className="material-symbols-outlined">{icon}</span>
                          </div>
                          <div>
                            <p className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">{b.name}</p>
                            <p className="text-[12px] text-on-surface-variant">{b.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-surface-variant text-on-surface text-[12px] font-medium border border-outline-variant">{b.category}</span>
                      </td>
                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant font-mono">{b.phone}</td>
                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">{b.updated_at ? new Date(b.updated_at).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold border ${statusStyles['Contacted'] || ''}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {b.status || 'Contacted'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => window.open(`https://wa.me/${b.phone.replace(/\s+/g, '')}`, '_blank')}
                            className="p-2 rounded-lg text-secondary hover:bg-secondary/10 transition-colors" title="WhatsApp Outreach">
                            <span className="material-symbols-outlined">chat</span>
                          </button>
                          <button onClick={() => moveToNew(b, i)}
                            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors" title="Restore to Leads">
                            <span className="material-symbols-outlined">unarchive</span>
                          </button>
                          <button onClick={() => deleteLead(b, i)}
                            className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors" title="Delete">
                            <span className="material-symbols-outlined">delete</span>
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
        <div className="bg-surface-container border-t border-border-subtle px-6 py-4 flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Showing {leads.length} archived {leads.length === 1 ? 'lead' : 'leads'}</span>
        </div>
      </div>

      {/* Analytical Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        <div className="glass-card p-stack-md rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-lg">forum</span>
            <span className="text-secondary text-label-sm font-label-sm">+12%</span>
          </div>
          <p className="text-on-surface-variant text-label-sm font-label-sm uppercase opacity-70">Total Responses</p>
          <h3 className="text-headline-md font-headline-md text-on-surface">{respondedCount}</h3>
        </div>
        <div className="glass-card p-stack-md rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-secondary p-2 bg-secondary/10 rounded-lg">check_circle</span>
            <span className="text-secondary text-label-sm font-label-sm">+5%</span>
          </div>
          <p className="text-on-surface-variant text-label-sm font-label-sm uppercase opacity-70">Conversion Rate</p>
          <h3 className="text-headline-md font-headline-md text-on-surface">{conversionRate}%</h3>
        </div>
        <div className="glass-card p-stack-md rounded-xl col-span-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <p className="text-on-surface-variant text-label-sm font-label-sm uppercase opacity-70">Outreach Efficiency</p>
              <h3 className="text-headline-md font-headline-md text-on-surface">{efficiency}/100</h3>
            </div>
            <div className="w-full bg-surface-variant h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-primary h-full group-hover:shadow-[0_0_10px_rgba(124,58,237,0.5)] transition-all duration-700" style={{ width: `${efficiency}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
