import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/constants';

const PAGE_SIZE = 10;

function LeadCard({ lead, onContacted, onDelete }) {
  return (
    <div className="glass-card rounded-xl px-3 py-3 md:px-4 md:py-4 flex flex-col gap-2 md:gap-3 w-full">
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-on-surface text-sm truncate">{lead.name}</div>
          <div className="text-xs text-on-surface-variant truncate mt-0.5">{lead.address}</div>
        </div>
        <span className="text-[10px] md:text-[11px] px-1.5 py-0.5 md:px-2 md:py-1 rounded bg-surface-container-high text-on-surface-variant whitespace-nowrap shrink-0">{lead.category}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <a href={`tel:${lead.phone}`} className="text-xs md:text-sm text-secondary hover:text-secondary/80 transition-colors font-medium truncate min-w-0">{lead.phone}</a>
        <span className="text-[10px] md:text-xs text-on-surface-variant shrink-0 ml-2">{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}</span>
      </div>
      <div className="flex items-center gap-1.5 md:gap-2 pt-0.5">
        <a
          href={`https://wa.me/${lead.phone.replace(/\s+/g, '')}`}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-[11px] md:text-xs font-medium bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px] md:text-[16px]">chat</span>
          <span className="hidden sm:inline">WA</span>
        </a>
        <button onClick={onContacted}
          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-[11px] md:text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
          <span className="material-symbols-outlined text-[14px] md:text-[16px]">check</span>
          <span className="hidden sm:inline">Done</span>
        </button>
        <button onClick={onDelete}
          className="inline-flex items-center justify-center px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-[11px] md:text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
          <span className="material-symbols-outlined text-[14px] md:text-[16px]">delete</span>
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
    <div className="space-y-4 md:space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-headline-md text-on-surface">All Leads</h1>
          <p className="text-sm text-on-surface-variant">New leads ready for outreach</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors border border-border-subtle">
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            Export CSV
          </button>
          <Link to="/search" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary/90 transition-colors glow-primary">
            <span className="material-symbols-outlined text-[18px]">travel_explore</span>
            Find More
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text" placeholder="Search leads..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-container-high border border-border-subtle rounded-lg pl-9 pr-3 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary transition-colors"
          />
        </div>
        <span className="text-xs text-on-surface-variant hidden sm:inline shrink-0">{leads.length} leads</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-on-surface-variant text-2xl">progress_activity</span>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined text-3xl block mb-2">database</span>
          <p className="text-sm">No new leads. Run a search to find businesses!</p>
        </div>
      ) : (
        <>
          {/* Mobile: paginated cards */}
          <div className="sm:hidden space-y-3">
            {displayLeads.map(b => (
              <LeadCard key={b.id} lead={b} onContacted={() => markContacted(b, leadIndex(b))} onDelete={() => deleteLead(b, leadIndex(b))} />
            ))}
          </div>

          {/* Mobile pagination */}
          {leads.length > PAGE_SIZE && (
            <div className="sm:hidden flex items-center justify-center gap-4 pt-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors border border-border-subtle disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                Prev
              </button>
              <span className="text-sm text-on-surface-variant">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors border border-border-subtle disabled:opacity-40"
              >
                Next
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          )}

          {/* Desktop: all cards in single column */}
          <div className="hidden sm:flex sm:flex-col gap-3">
            {leads.map(b => (
              <LeadCard key={b.id} lead={b} onContacted={() => markContacted(b, leadIndex(b))} onDelete={() => deleteLead(b, leadIndex(b))} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
