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

  function sendWA(index) {
    const lead = results[index];
    const phone = lead.phone.replace(/\s+/g, '');
    if (phone) window.open(`https://wa.me/${phone}`, '_blank');
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Lead Search</div>
          <div className="page-sub">Find businesses with no website via Google Maps</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">⌖ Google Maps Search</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="tag">🗾 No-website filter ON</span>
            <span className="tag">📞 Phone required</span>
          </div>
        </div>
        <div className="panel-body">
          <div className="search-grid">
            <div className="field">
              <label>Business Niche / Category</label>
              <input type="text" placeholder="e.g. Restaurants, Salons, Clinics..." value={niche} onChange={e => setNiche(e.target.value)} />
            </div>
            <div className="field">
              <label>Location</label>
              <input type="text" placeholder="e.g. Bur Dubai, Deira, Sharjah..." value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="field">
              <label>Min Rating</label>
              <select value={minRating} onChange={e => setMinRating(e.target.value)}>
                <option value="">Any</option>
                <option value="3">3★ and above</option>
                <option value="4">4★ and above</option>
                <option value="4.5">4.5★ and above</option>
              </select>
            </div>
            <div className="field">
              <label>Max Results</label>
              <select value={maxResults} onChange={e => setMaxResults(e.target.value)}>
                <option value="20">20 leads</option>
                <option value="50">50 leads</option>
                <option value="100">100 leads</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={runSearch} disabled={searching} style={{ height: '39px', alignSelf: 'end' }}>
              {searching ? '⏳ Searching...' : '⌖ Search'}
            </button>
          </div>
          {searching && (
            <>
              <div className="progress-bar" style={{ display: 'block' }}><div className="progress-fill" style={{ width: progress + '%' }}></div></div>
              <div className="search-status" style={{ display: 'block' }}>{statusText}</div>
            </>
          )}
          {!searching && statusText && (
            <div className="search-status" style={{ display: 'block' }}>{statusText}</div>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">◈ Results <span style={{ color: 'var(--accent2)', fontWeight: 400, fontSize: '13px' }}>· {results.length} no-website businesses</span></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost btn-sm" onClick={toggleAll}>
                {selected.size === results.length ? 'Deselect All' : 'Select All'}
              </button>
              <button className="btn btn-green btn-sm" onClick={saveSelected}>⬇ Save Selected ({selected.size})</button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selected.size === results.length && results.length > 0} onChange={toggleAll} /></th>
                  <th>Business</th>
                  <th>Category</th>
                  <th>Phone</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((b, i) => (
                  <tr key={i}>
                    <td><input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} /></td>
                    <td>
                      <div className="biz-name">{b.name}</div>
                      <div className="biz-category">{b.address}</div>
                    </td>
                    <td><span className="tag">{b.category}</span></td>
                    <td><a className="phone-link" href={`tel:${b.phone}`}>{b.phone}</a></td>
                    <td><span className="rating">★</span> {b.rating}</td>
                    <td>
                      <div className="action-btns">
                        <a className="wa-btn" href={`https://wa.me/${results[i].phone.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 10px', fontSize: '11px', textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', borderRadius: 'var(--radius-sm)' }}>WA</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
