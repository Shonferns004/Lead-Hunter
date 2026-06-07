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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-headline-md text-on-surface">Manual Outreach</h1>
            <p className="text-sm text-on-surface-variant">{leads.length} leads · {sent} sent</p>
          </div>
          <button onClick={() => setMode('compose')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors border border-border-subtle">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
        </div>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-container-low">
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Business</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Phone</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Personalized Message</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-on-surface-variant font-label-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border-subtle/50 hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-on-surface">{lead.name}</div>
                      <div className="text-xs text-on-surface-variant">{lead.category}</div>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`tel:${lead.phone}`} className="text-secondary hover:text-secondary/80 transition-colors text-sm font-medium">{lead.phone}</a>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant max-w-xs whitespace-pre-wrap">
                      {personalize(lead).substring(0, 120)}...
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <a href={getWhatsAppUrl(lead)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 transition-colors">
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          Open WA
                        </a>
                        <button onClick={() => markSent(lead)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors">
                          <span className="material-symbols-outlined text-[14px]">check</span>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-headline-md text-on-surface">WhatsApp Outreach</h1>
          <p className="text-sm text-on-surface-variant">Craft and send personalized cold messages</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="glass-card rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2 text-sm font-semibold font-headline-md text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg">description</span>
                Message Templates
              </div>
              <button onClick={newTemplate}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors border border-border-subtle">
                <span className="material-symbols-outlined text-[16px]">add</span>
                New
              </button>
            </div>
            <div className="p-2">
              {templates.map((t, i) => (
                <div key={i} onClick={() => selectTemplate(i)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    activeIndex === i ? 'bg-primary-container/20' : 'hover:bg-surface-container-high'
                  }`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-on-surface">{t.name}</div>
                    <div className="text-xs text-on-surface-variant truncate mt-0.5">{(t.body || '').substring(0, 60)}...</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteTemplate(i); }}
                    className="ml-2 text-on-surface-variant hover:text-red-400 transition-colors p-1">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="glass-card rounded-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2 text-sm font-semibold font-headline-md text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg">edit</span>
                Compose Message
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-surface-container-high rounded-lg p-3 border border-border-subtle">
                <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  Generate with AI
                </label>
                <div className="flex gap-2 mt-2">
                  <input type="text" value={aiNiche} onChange={e => setAiNiche(e.target.value)} placeholder="e.g. Restaurants, Salons, Clinics..."
                    className="flex-1 bg-surface-container border border-border-subtle rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary transition-colors" />
                  <button onClick={generateWithAI} disabled={generating}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary/90 transition-colors glow-primary disabled:opacity-50 whitespace-nowrap">
                    <span className="material-symbols-outlined text-[16px]">{generating ? 'progress_activity' : 'auto_awesome'}</span>
                    {generating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-sm block mb-1.5">Template Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Restaurant Outreach v1"
                  className="w-full bg-surface-container-high border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary transition-colors" />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-sm block mb-1.5">Message</label>
                <div className="bg-surface-container-high border border-border-subtle rounded-lg p-3">
                  <textarea rows={6} value={body} onChange={e => setBody(e.target.value)} placeholder="Hi {{name}}..."
                    className="w-full bg-transparent text-sm text-on-surface placeholder-on-surface-variant/50 outline-none resize-none leading-relaxed" />
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border-subtle">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['{{name}}', '{{business}}', '{{category}}', '{{location}}'].map(v => (
                        <button key={v} onClick={() => insertVar(v)}
                          className="text-[11px] px-2 py-1 rounded-full bg-surface-container border border-border-subtle text-primary hover:bg-primary/20 transition-colors">
                          {v}
                        </button>
                      ))}
                    </div>
                    <button onClick={saveTemplate}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors border border-border-subtle">
                      <span className="material-symbols-outlined text-[14px]">save</span>
                      Save
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-sm block mb-1.5">Preview</label>
                <div className="bg-surface-container-high border border-border-subtle rounded-lg p-4 text-sm text-on-surface-variant leading-relaxed min-h-[80px]">
                  {getPreview()}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-sm">Target Leads</label>
                <select value={targetStatus} onChange={e => setTargetStatus(e.target.value)}
                  className="bg-surface-container-high border border-border-subtle rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition-colors">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-sm text-on-surface-variant">{leadCount} leads</span>
              </div>

              <button onClick={startOutreach}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#25D366] text-white hover:bg-[#1db954] transition-colors">
                <span className="material-symbols-outlined text-[18px]">chat</span>
                Start Manual Outreach ({leadCount})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
