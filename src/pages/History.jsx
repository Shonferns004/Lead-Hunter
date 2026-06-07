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
    <>
      <div className="topbar">
        <div>
          <div className="page-title">History</div>
          <div className="page-sub">Contacted leads archive</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Search by name, category, location..."
          style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none', width: '200px' }}
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select
          style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none' }}
          value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Category</th>
                <th>Phone</th>
                <th>Contacted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="loading-spinner"></div></td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">◷</div><div className="empty-text">No contacted leads yet. Send outreach from All Leads or WhatsApp Outreach.</div></div></td></tr>
              ) : (
                leads.map((b, i) => (
                  <tr key={b.id}>
                    <td>
                      <div className="biz-name">{b.name}</div>
                      <div className="biz-category">{b.address}</div>
                    </td>
                    <td><span className="tag">{b.category}</span></td>
                    <td><a className="phone-link" href={`tel:${b.phone}`}>{b.phone}</a></td>
                    <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{b.updated_at ? new Date(b.updated_at).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="wa-btn" onClick={() => window.open(`https://wa.me/${b.phone.replace(/\s+/g, '')}`, '_blank')} style={{ padding: '5px 10px', fontSize: '11px' }}>WA</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => moveToNew(b, i)}>← Move to Leads</button>
                        <button className="btn btn-red btn-sm" onClick={() => deleteLead(b, i)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
