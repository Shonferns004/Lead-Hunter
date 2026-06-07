import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/constants';

export default function AllLeads({ showToast, refreshCounts }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLeadsRef = useRef();

  useEffect(() => { loadLeadsRef.current = loadLeads; });

  useEffect(() => { loadLeads(); }, []);

  useEffect(() => {
    const channel = supabase.channel('allleads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadLeadsRef.current?.();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadLeads() {
    setLoading(true);
    try {
      let query = supabase.from('leads').select('*').eq('status', 'New').order('created_at', { ascending: false });
      if (search) query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,address.ilike.%${search}%`);
      const { data } = await query;
      setLeads(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLeads(); }, [search]);

  async function markContacted(lead, index) {
    const { error } = await supabase.from('leads').update({ status: 'Contacted' }).eq('id', lead.id);
    if (!error) {
      setLeads(leads.filter((_, i) => i !== index));
      apiFetch('/api/activities', { method: 'POST', body: JSON.stringify({ type: 'lead_contacted', lead_name: lead.name, lead_phone: lead.phone, category: lead.category }) }).catch(() => {});
      showToast(`${lead.name} moved to History`);
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
    const rows = [['Name', 'Category', 'Address', 'Phone', 'Created']];
    leads.forEach(l => rows.push([l.name, l.category, l.address, l.phone, l.created_at]));
    const csv = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csv);
    a.download = 'leads.csv';
    a.click();
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">All Leads</div>
          <div className="page-sub">New leads ready for outreach</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
          <Link to="/search" className="btn btn-primary btn-sm">⌖ Find More</Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Search leads..."
          style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none', width: '200px' }}
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Category</th>
                <th>Phone</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="loading-spinner"></div></td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">◈</div><div className="empty-text">No new leads. Run a search to find businesses!</div></div></td></tr>
              ) : (
                leads.map((b, i) => (
                  <tr key={b.id}>
                    <td>
                      <div className="biz-name">{b.name}</div>
                      <div className="biz-category">{b.address}</div>
                    </td>
                    <td><span className="tag">{b.category}</span></td>
                    <td><a className="phone-link" href={`tel:${b.phone}`}>{b.phone}</a></td>
                    <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="action-btns">
                        <a className="wa-btn" href={`https://wa.me/${b.phone.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 10px', fontSize: '11px', textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', borderRadius: 'var(--radius-sm)' }}>WA</a>
                        <button className="btn btn-primary btn-sm" onClick={() => markContacted(b, i)}>✓ Contacted</button>
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
