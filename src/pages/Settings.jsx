import React, { useState } from 'react';

export default function Settings({ showToast }) {
  const [agencyName, setAgencyName] = useState(localStorage.getItem('agency_name') || 'Ahmed – WebCraft Agency');
  const [startingPrice, setStartingPrice] = useState(localStorage.getItem('starting_price') || '1500');

  function saveSettings() {
    localStorage.setItem('agency_name', agencyName);
    localStorage.setItem('starting_price', startingPrice);
    showToast('Settings saved!');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-headline-md text-on-surface">Settings</h1>
          <p className="text-sm text-on-surface-variant">Outreach preferences</p>
        </div>
      </div>

      <div className="max-w-lg">
        <div className="glass-card rounded-xl">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border-subtle text-sm font-semibold font-headline-md text-on-surface">
            <span className="material-symbols-outlined text-primary text-lg">settings</span>
            Outreach Settings
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-sm block mb-1.5">Your Name / Agency Name</label>
              <input type="text" placeholder="Ahmed – WebCraft Agency" value={agencyName} onChange={e => setAgencyName(e.target.value)}
                className="w-full bg-surface-container-high border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-on-surface-variant font-label-sm block mb-1.5">Starting Price (AED)</label>
              <input type="text" placeholder="1500" value={startingPrice} onChange={e => setStartingPrice(e.target.value)}
                className="w-full bg-surface-container-high border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary transition-colors" />
            </div>
            <button onClick={saveSettings}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary/90 transition-colors glow-primary">
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
