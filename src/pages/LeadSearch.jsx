import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/constants';

export default function LeadSearch({ showToast, refreshCounts }) {
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxResults, setMaxResults] = useState('50');
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [results, setResults] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [selected, setSelected] = useState(new Set());

  async function runSearch() {
    const q = niche || 'Restaurants';
    const loc = location || 'Dubai';
    setSearching(true);
    setProgress(0);
    setResults([]);
    setAllResults([]);
    setSelected(new Set());

    simulateProgress();

    try {
      const data = await apiFetch('/api/search/google-places', {
        method: 'POST',
        body: JSON.stringify({ query: q, location: loc, minRating: minRating || undefined }),
      });
      setAllResults(data.all || []);
      setResults(data.noWebsite || []);
      setStatusText(`Found ${data.total} businesses · ${data.noWebsiteCount} without websites`);
      showToast(`Found ${data.noWebsiteCount} leads without websites`);
    } catch (err) {
      showToast(err.message || 'Search failed');
      setStatusText(err.message || 'Search failed');
      setResults([]);
    } finally {
      setSearching(false);
      setProgress(100);
    }
  }

  function simulateProgress() {
    const steps = [
      [10, 'Connecting to Google Maps...'],
      [30, 'Fetching business listings...'],
      [55, 'Checking for websites...'],
      [75, 'Filtering: no-website only...'],
      [90, 'Extracting phone numbers...'],
    ];
    let i = 0;
    const iv = setInterval(() => {
      if (i >= steps.length || !searching) { clearInterval(iv); return; }
      setProgress(steps[i][0]);
      setStatusText(steps[i][1]);
      i++;
    }, 800);
  }

  function toggleSelect(index) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((_, i) => i)));
    }
  }

  async function saveSelected() {
    const toSave = [...selected].map(i => ({
      name: results[i].name,
      category: results[i].category,
      address: results[i].address,
      phone: results[i].phone,
      rating: results[i].rating,
      website: results[i].website || '',
      status: 'New',
    }));
    if (toSave.length === 0) { showToast('Select leads first'); return; }
    try {
      const { error } = await supabase.from('leads').insert(toSave);
      if (error) throw error;
      toSave.forEach(l => {
        apiFetch('/api/activities', { method: 'POST', body: JSON.stringify({ type: 'lead_added', lead_name: l.name, lead_phone: l.phone, category: l.category }) }).catch(() => {});
      });
      showToast(`${toSave.length} leads saved`);
      refreshCounts();
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-headline-md text-on-surface">Lead Search</h1>
          <p className="text-sm text-on-surface-variant">Find businesses with no website via Google Maps</p>
        </div>
      </div>

      <div className="glass-card rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-sm font-semibold font-headline-md text-on-surface">
            <span className="material-symbols-outlined text-primary text-lg">travel_explore</span>
            Google Maps Search
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-1 rounded bg-surface-container-high text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">language</span>
              No-website filter ON
            </span>
            <span className="text-[11px] px-2 py-1 rounded bg-surface-container-high text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">phone</span>
              Phone required
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-sm block mb-1.5">Business Niche / Category</label>
              <input type="text" placeholder="e.g. Restaurants, Salons, Clinics..." value={niche} onChange={e => setNiche(e.target.value)}
                className="w-full bg-surface-container-high border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-sm block mb-1.5">Location</label>
              <input type="text" placeholder="e.g. Bur Dubai, Deira..." value={location} onChange={e => setLocation(e.target.value)}
                className="w-full bg-surface-container-high border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-sm block mb-1.5">Min Rating</label>
              <select value={minRating} onChange={e => setMinRating(e.target.value)}
                className="w-full bg-surface-container-high border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                <option value="">Any</option>
                <option value="3">3★ and above</option>
                <option value="4">4★ and above</option>
                <option value="4.5">4.5★ and above</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-sm block mb-1.5">Max Results</label>
              <select value={maxResults} onChange={e => setMaxResults(e.target.value)}
                className="w-full bg-surface-container-high border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                <option value="20">20 leads</option>
                <option value="50">50 leads</option>
                <option value="100">100 leads</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={runSearch} disabled={searching}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary/90 transition-colors glow-primary disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">{searching ? 'progress_activity' : 'search'}</span>
              {searching ? 'Searching...' : 'Search'}
            </button>
            {searching && (
              <div className="flex-1">
                <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{statusText}</p>
              </div>
            )}
          </div>
          {!searching && statusText && (
            <p className="text-xs text-on-surface-variant mt-2">{statusText}</p>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="glass-card rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-2 text-sm font-semibold font-headline-md text-on-surface">
              <span className="material-symbols-outlined text-primary text-lg">database</span>
              Results
              <span className="text-primary font-normal text-xs">· {results.length} no-website businesses</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleAll} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors border border-border-subtle">
                {selected.size === results.length ? 'Deselect All' : 'Select All'}
              </button>
              <button onClick={saveSelected} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors">
                <span className="material-symbols-outlined text-[16px]">download</span>
                Save Selected ({selected.size})
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm w-10">
                    <input type="checkbox" checked={selected.size === results.length && results.length > 0} onChange={toggleAll} className="accent-primary" />
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Business</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Category</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Phone</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Rating</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Image</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((b, i) => (
                  <tr key={i} className="border-b border-border-subtle/50 hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} className="accent-primary" />
                    </td>
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
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-amber-400 text-sm">★ {b.rating}</span>
                    </td>
                    <td className="px-4 py-3">
                      {b.photoUrl ? (
                        <img src={b.photoUrl} alt={b.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant text-lg">image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://wa.me/${b.phone.replace(/\s+/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">chat</span>
                        WA
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
