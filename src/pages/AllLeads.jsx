import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/constants';
import { SkeletonCard, SkeletonTableRow } from '../components/Skeleton';

const PAGE_SIZE = 10;

function LeadCard({ lead, onContacted, onDelete }) {
  return (
    <div className="bg-[#1d2026] border border-[#374151] rounded-xl px-3 py-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-[#e1e2eb] text-sm truncate">{lead.name}</div>
          <div className="text-xs text-[#ccc3d8] truncate mt-0.5">{lead.address}</div>
        </div>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-variant text-on-surface border border-outline-variant whitespace-nowrap shrink-0">{lead.category}</span>
      </div>
      <div className="flex items-center justify-between">
        <a href={`tel:${lead.phone}`} className="text-xs text-[#4edea3] font-medium truncate min-w-0">{lead.phone}</a>
        <span className="text-[10px] text-[#ccc3d8] shrink-0 ml-2">{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}</span>
      </div>
      <div className="flex items-center gap-1.5 pt-0.5">
        <a href={`https://wa.me/${lead.phone.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-[#25D366]/20 text-[#25D366]">
          <span className="material-symbols-outlined text-[14px]">chat</span>
          WA
        </a>
        <button onClick={onContacted}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-[#7c3aed]/20 text-[#d2bbff]">
          <span className="material-symbols-outlined text-[14px]">check</span>
          Done
        </button>
        <button onClick={onDelete}
          className="flex items-center justify-center px-2 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/20 text-red-400">
          <span className="material-symbols-outlined text-[14px]">delete</span>
        </button>
      </div>
    </div>
  );
}

export default function AllLeads({ showToast, refreshCounts }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

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

  const totalPages = Math.max(1, Math.ceil(leads.length / PAGE_SIZE));
  const displayLeads = useMemo(() => leads.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [leads, page]);

  useEffect(() => {
    if (page >= totalPages) setPage(0);
  }, [leads.length, page, totalPages]);

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

  function leadIndex(lead) {
    return leads.findIndex(l => l.id === lead.id);
  }

  return (
    <div className="space-y-3 w-full">
      <div>
        <h1 className="text-lg font-bold text-[#e1e2eb]">All Leads</h1>
        <p className="text-xs text-[#ccc3d8] mt-0.5">New leads ready for outreach</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#ccc3d8] text-[16px]">search</span>
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#272a31] border border-[#374151] rounded-lg pl-8 pr-2.5 py-2 text-sm text-[#e1e2eb] placeholder-[#ccc3d8]/50 outline-none" />
        </div>
        <button onClick={exportCSV} className="px-2.5 py-2 rounded-lg text-xs font-medium bg-[#272a31] text-[#ccc3d8] border border-[#374151] whitespace-nowrap">
          CSV
        </button>
        <Link to="/search" className="px-2.5 py-2 rounded-lg text-xs font-medium bg-[#7c3aed] text-white whitespace-nowrap">
          +Add
        </Link>
      </div>

      {loading ? (
        <>
          <div className="md:hidden space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#374151]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#272a31] border-b border-[#374151]">
                  {['Business', 'Category', 'Phone', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[#ccc3d8] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} cols={5} />)}
              </tbody>
            </table>
          </div>
        </>
      ) : leads.length === 0 ? (
        <div className="text-center py-10 text-[#ccc3d8]">
          <span className="material-symbols-outlined text-2xl block mb-1">database</span>
          <p className="text-sm">No new leads found</p>
        </div>
      ) : (
        <>
          {/* Mobile: paginated single column */}
          <div className="md:hidden space-y-2.5">
            {displayLeads.map(b => (
              <LeadCard key={b.id} lead={b} onContacted={() => markContacted(b, leadIndex(b))} onDelete={() => deleteLead(b, leadIndex(b))} />
            ))}
          </div>

          {leads.length > PAGE_SIZE && (
            <div className="md:hidden flex items-center justify-center gap-3 pt-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="flex items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#272a31] text-[#ccc3d8] border border-[#374151] disabled:opacity-40">
                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                Prev
              </button>
              <span className="text-xs text-[#ccc3d8]">{page + 1}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="flex items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#272a31] text-[#ccc3d8] border border-[#374151] disabled:opacity-40">
                Next
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          )}

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#374151]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#272a31] border-b border-[#374151]">
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[#ccc3d8] font-medium">Business</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[#ccc3d8] font-medium">Category</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[#ccc3d8] font-medium">Phone</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[#ccc3d8] font-medium">Created</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[#ccc3d8] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(b => {
                  const idx = leadIndex(b);
                  return (
                    <tr key={b.id} className="border-b border-[#374151]/50 hover:bg-[#272a31]/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#e1e2eb]">{b.name}</div>
                        <div className="text-xs text-[#ccc3d8]">{b.address}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-3 py-1 rounded-full bg-surface-variant text-on-surface border border-outline-variant">{b.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <a href={`tel:${b.phone}`} className="text-[#4edea3] font-medium">{b.phone}</a>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#ccc3d8]">{b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <a href={`https://wa.me/${b.phone.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#25D366]/20 text-[#25D366]">
                            <span className="material-symbols-outlined text-[14px]">chat</span>
                            WA
                          </a>
                          <button onClick={() => markContacted(b, idx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#7c3aed]/20 text-[#d2bbff]">
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Done
                          </button>
                          <button onClick={() => deleteLead(b, idx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400">
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
