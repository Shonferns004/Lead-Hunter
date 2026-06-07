import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/constants';

const STATUSES = ['New', 'Contacted'];

export default function Outreach({ showToast }) {
  const [templates, setTemplates] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [targetStatus, setTargetStatus] = useState('New');
  const [leadCount, setLeadCount] = useState(0);
  const [aiNiche, setAiNiche] = useState('');
  const [generating, setGenerating] = useState(false);
  const [leads, setLeads] = useState([]);
  const [mode, setMode] = useState('compose');

  useEffect(() => { loadTemplates(); countLeads(); }, []);

  async function countLeads() {
    try {
      const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', targetStatus);
      if (count !== null) setLeadCount(count);
    } catch {}
  }

  useEffect(() => { countLeads(); }, [targetStatus]);

  async function loadTemplates() {
    try {
      const data = await apiFetch('/api/templates');
      if (data && data.length > 0) {
        setTemplates(data);
        setActiveIndex(0);
        setName(data[0].name);
        setBody(data[0].body);
      } else {
        const fallback = [
          { id: null, name: 'Restaurant Outreach', body: `Hi {{name}}, I noticed {{business}} doesn't have a website yet. I build professional restaurant websites starting from AED 1,500 — with your menu, photos, and online booking. Would you be interested? I can show you examples.` },
          { id: null, name: 'Salon / Shop Outreach', body: `Hi {{name}}, I help local businesses like {{business}} get online with a professional website. Starting from AED 1,200. Customers can find you on Google and WhatsApp directly from your site. Interested to see what it looks like for {{category}} businesses?` },
        ];
        setTemplates(fallback);
        setActiveIndex(0);
        setName(fallback[0].name);
        setBody(fallback[0].body);
      }
    } catch {
      showToast('Could not load templates from server');
    }
  }

  function selectTemplate(i) {
    setActiveIndex(i);
    setName(templates[i].name);
    setBody(templates[i].body);
  }

  function insertVar(v) {
    setBody(prev => prev + v);
  }

  function personalize(lead) {
    return body
      .replaceAll('{{name}}', (lead.name || '').split(' ')[0])
      .replaceAll('{{business}}', lead.name || '')
      .replaceAll('{{category}}', lead.category || '')
      .replaceAll('{{location}}', lead.address || '');
  }

  function getWhatsAppUrl(lead) {
    const msg = personalize(lead);
    const phone = lead.phone.replace(/\s+/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  async function markSent(lead) {
    const { error } = await supabase.from('leads').update({ status: 'Contacted' }).eq('id', lead.id);
    if (!error) {
      setLeads(leads.filter(l => l.id !== lead.id));
      setLeadCount(c => c - 1);
      apiFetch('/api/activities', { method: 'POST', body: JSON.stringify({ type: 'lead_contacted', lead_name: lead.name, lead_phone: lead.phone, category: lead.category }) }).catch(() => {});
      showToast(`${lead.name} marked as Contacted`);
    }
  }

  async function startOutreach() {
    const { data } = await supabase.from('leads').select('*').eq('status', targetStatus);
    if (!data || data.length === 0) { showToast(`No leads with status "${targetStatus}"`); return; }
    setLeads(data);
    setMode('sending');
  }

  async function generateWithAI() {
    const niche = aiNiche.trim();
    if (!niche) { showToast('Enter a business niche first'); return; }
    setGenerating(true);
    try {
      const data = await apiFetch('/api/groq/generate-template', {
        method: 'POST',
        body: JSON.stringify({ niche }),
      });
      const tplName = niche.charAt(0).toUpperCase() + niche.slice(1) + ' Outreach';
      setBody(data.template);
      setName(tplName);
      showToast('AI template generated!');
    } catch (err) {
      showToast(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function saveTemplate() {
    const tpl = templates[activeIndex];
    try {
      if (tpl.id) {
        const data = await apiFetch(`/api/templates/${tpl.id}`, { method: 'PUT', body: JSON.stringify({ name, body }) });
        const updated = [...templates];
        updated[activeIndex] = { ...updated[activeIndex], ...data };
        setTemplates(updated);
      } else {
        const data = await apiFetch('/api/templates', { method: 'POST', body: JSON.stringify({ name, body }) });
        const updated = [...templates];
        updated[activeIndex] = { ...updated[activeIndex], id: data.id };
        setTemplates(updated);
      }
      showToast('Template saved!');
    } catch (err) {
      showToast(err.message || 'Failed to save');
    }
  }

  async function deleteTemplate(i) {
    const tpl = templates[i];
    if (!tpl.id) { setTemplates(templates.filter((_, idx) => idx !== i)); return; }
    if (!confirm(`Delete "${tpl.name}"?`)) return;
    try {
      await apiFetch(`/api/templates/${tpl.id}`, { method: 'DELETE' });
    } catch (err) { showToast(err.message); return; }
    const updated = templates.filter((_, idx) => idx !== i);
    setTemplates(updated);
    if (i === activeIndex && updated.length > 0) {
      setActiveIndex(0);
      setName(updated[0].name);
      setBody(updated[0].body);
    } else if (updated.length === 0) {
      setActiveIndex(0);
      setName('');
      setBody('');
    }
    showToast('Template deleted');
  }

  async function newTemplate() {
    try {
      const data = await apiFetch('/api/templates', { method: 'POST', body: JSON.stringify({ name: 'New Template', body: 'Hi {{name}}...' }) });
      setTemplates([...templates, data]);
      setActiveIndex(templates.length);
      setName(data.name);
      setBody(data.body);
    } catch (err) {
      showToast(err.message);
    }
  }

  function getPreview() {
    return body
      .replaceAll('{{name}}', 'Mohammed')
      .replaceAll('{{business}}', 'Al Karama Grocery')
      .replaceAll('{{category}}', 'Grocery Store')
      .replaceAll('{{location}}', 'Karama, Dubai');
  }

  if (mode === 'sending') {
    const sent = leads.filter(l => l.status === 'Contacted').length;
    return (
      <>
        <div className="topbar">
          <div>
            <div className="page-title">Manual Outreach</div>
            <div className="page-sub">{leads.length} leads · {sent} sent</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setMode('compose')}>Back</button>
        </div>
        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Phone</th>
                  <th>Personalized Message</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="biz-name">{lead.name}</div>
                      <div className="biz-category">{lead.category}</div>
                    </td>
                    <td><a className="phone-link" href={`tel:${lead.phone}`}>{lead.phone}</a></td>
                    <td style={{ fontSize: '12px', maxWidth: '300px', whiteSpace: 'pre-wrap', color: 'var(--muted)' }}>
                      {personalize(lead).substring(0, 120)}...
                    </td>
                    <td>
                      <div className="action-btns" style={{ gap: '4px' }}>
                        <a className="wa-btn" href={getWhatsAppUrl(lead)} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 10px', fontSize: '11px', textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', borderRadius: 'var(--radius-sm)' }}>
                          Open WA
                        </a>
                        <button className="btn btn-green btn-sm" onClick={() => markSent(lead)}>
                          Sent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="page-title">WhatsApp Outreach</div>
          <div className="page-sub">Craft and send personalized cold messages</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">◱ Message Templates</div>
              <button className="btn btn-ghost btn-sm" onClick={newTemplate}>+ New</button>
            </div>
            <div className="panel-body" style={{ padding: '8px' }}>
              {templates.map((t, i) => (
                <div
                  key={i}
                  onClick={() => selectTemplate(i)}
                  style={{
                    padding: '12px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    background: activeIndex === i ? 'rgba(108,99,255,0.1)' : 'transparent',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 500 }}>{t.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {(t.body || '').substring(0, 60)}...
                    </div>
                  </div>
                  <button className="btn btn-red btn-sm" style={{ marginLeft: '8px', flexShrink: 0, padding: '3px 8px', fontSize: '11px' }} onClick={e => { e.stopPropagation(); deleteTemplate(i); }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">✎ Compose Message</div>
            </div>
            <div className="panel-body">
              <div className="field" style={{ marginBottom: '14px', padding: '12px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <label style={{ fontWeight: 600 }}>Generate with AI</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <input type="text" value={aiNiche} onChange={e => setAiNiche(e.target.value)} placeholder="e.g. Restaurants, Salons, Clinics..." style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none' }} />
                  <button className="btn btn-primary btn-sm" onClick={generateWithAI} disabled={generating} style={{ whiteSpace: 'nowrap' }}>
                    {generating ? '⏳ Generating...' : ' Generate'}
                  </button>
                </div>
              </div>
              <div className="field" style={{ marginBottom: '12px' }}>
                <label>Template Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Restaurant Outreach v1" />
              </div>
              <div className="field" style={{ marginBottom: '12px' }}>
                <label>Message</label>
                <div className="msg-composer">
                  <textarea className="msg-text" rows={6} value={body} onChange={e => setBody(e.target.value)} placeholder="Hi {{name}}..." />
                  <div className="msg-actions">
                    <div className="msg-vars">
                      {['{{name}}', '{{business}}', '{{category}}', '{{location}}'].map(v => (
                        <div key={v} className="var-pill" onClick={() => insertVar(v)}>{v}</div>
                      ))}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={saveTemplate}>Save</button>
                  </div>
                </div>
              </div>
              <div className="field" style={{ marginBottom: '14px' }}>
                <label>Preview</label>
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '14px', fontSize: '13px', lineHeight: 1.7, border: '1px solid var(--border)', color: 'var(--muted)', minHeight: '80px' }}>
                  {getPreview()}
                </div>
              </div>

              <div className="field" style={{ marginBottom: '12px' }}>
                <label>Target Leads</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', outline: 'none' }}
                    value={targetStatus} onChange={e => setTargetStatus(e.target.value)}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{leadCount} leads</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="wa-btn" onClick={startOutreach}>
                  Start Manual Outreach ({leadCount})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
