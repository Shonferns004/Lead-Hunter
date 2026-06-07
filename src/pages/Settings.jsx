import React, { useState } from 'react';

const freqOptions = ['Conservative', 'Balanced', 'Aggressive', 'Elite Velocity'];

export default function Settings({ showToast, onLogout, onInstallApp }) {
  const [agencyName, setAgencyName] = useState(localStorage.getItem('agency_name') || 'Obsidian Elite Acquisition');
  const [startingPrice, setStartingPrice] = useState(localStorage.getItem('starting_price') || '2500');
  const [frequency, setFrequency] = useState('Balanced');

  function saveSettings() {
    localStorage.setItem('agency_name', agencyName);
    localStorage.setItem('starting_price', startingPrice);
    showToast('Settings saved!');
  }

  function discard() {
    setAgencyName(localStorage.getItem('agency_name') || 'Obsidian Elite Acquisition');
    setStartingPrice(localStorage.getItem('starting_price') || '2500');
    showToast('Changes discarded');
  }

  return (
    <div className="space-y-stack-lg max-w-4xl">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Settings</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Manage your agency preferences, app install, and account security.</p>
        </div>
        <div className="flex gap-stack-md">
          <button onClick={discard}
            className="px-gutter py-stack-sm bg-surface-variant border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-highest transition-colors">
            Discard
          </button>
          <button onClick={saveSettings}
            className="px-gutter py-stack-sm bg-primary-container text-white rounded-lg font-label-md text-label-md glow-primary hover:opacity-90 transition-all active:scale-95">
            Save Settings
          </button>
        </div>
      </section>

      <div className="glass-card rounded-xl p-stack-lg flex flex-col md:flex-row items-center gap-stack-lg">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary-container p-1 bg-surface-container">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-2xl font-bold text-on-primary">
            AH
          </div>
        </div>
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-stack-sm">
            <h3 className="font-headline-md text-headline-md text-on-surface">LeadHunter Admin</h3>
            <span className="bg-secondary/15 text-secondary px-3 py-1 rounded-full font-label-sm text-label-sm w-fit mx-auto md:mx-0">Active Now</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">agency.admin@leadhunter.io</p>
          <div className="mt-stack-md flex flex-wrap justify-center md:justify-start gap-stack-sm">
            <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-lg font-label-sm text-label-sm">Elite Plan</span>
            <span className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-lg font-label-sm text-label-sm">Member since Jan 2024</span>
          </div>
        </div>
        <button className="bg-surface-variant hover:bg-surface-container-highest text-on-surface border border-outline-variant px-stack-md py-stack-sm rounded-lg font-label-md text-label-md transition-all">
          Change Photo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-stack-lg">
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-stack-lg py-stack-md border-b border-border-subtle bg-surface-container-high">
            <h4 className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant opacity-70">App Actions</h4>
          </div>
          <div className="p-stack-lg grid grid-cols-1 md:grid-cols-2 gap-stack-md">
            <button
              onClick={onInstallApp}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary px-4 py-3 text-sm font-medium glow-primary hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Install App
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-error/30 bg-error-container/10 px-4 py-3 text-sm font-medium text-error hover:bg-error-container/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Logout
            </button>
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-stack-lg py-stack-md border-b border-border-subtle bg-surface-container-high">
            <h4 className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant opacity-70">Outreach Settings</h4>
          </div>
          <div className="p-stack-lg space-y-stack-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
              <div className="space-y-stack-sm">
                <label className="font-label-md text-label-md text-on-surface">Agency Name</label>
                <input type="text" value={agencyName} onChange={e => setAgencyName(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-stack-md py-3 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
              </div>
              <div className="space-y-stack-sm">
                <label className="font-label-md text-label-md text-on-surface">Starting Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                  <input type="number" value={startingPrice} onChange={e => setStartingPrice(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-lg pl-8 pr-stack-md py-3 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                </div>
              </div>
            </div>
            <div className="space-y-stack-sm">
              <label className="font-label-md text-label-md text-on-surface">Outreach Frequency</label>
              <div className="flex flex-wrap gap-stack-sm">
                {freqOptions.map(f => (
                  <button key={f} onClick={() => setFrequency(f)}
                    className={`px-stack-md py-stack-sm rounded-lg font-label-md text-label-md transition-all ${
                      frequency === f
                        ? 'border-2 border-primary bg-primary/10 text-primary'
                        : 'border border-outline-variant bg-surface-variant text-on-surface hover:border-primary'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
              <p className="text-label-sm text-on-surface-variant mt-2 italic">Recommended: Balanced keeps your sender reputation healthy while maintaining volume.</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-stack-lg py-stack-md border-b border-border-subtle bg-surface-container-high">
            <h4 className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant opacity-70">Account Management</h4>
          </div>
          <div className="p-stack-lg space-y-stack-md">
            <div className="flex items-center justify-between p-stack-md rounded-lg bg-surface-container hover:bg-surface-variant transition-colors cursor-pointer group">
              <div className="flex items-center gap-stack-md">
                <div className="w-10 h-10 rounded bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined">shield</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface">Two-Factor Authentication</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Secure your agency account with 2FA.</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
            </div>
            <div className="flex items-center justify-between p-stack-md rounded-lg bg-surface-container hover:bg-surface-variant transition-colors cursor-pointer group">
              <div className="flex items-center gap-stack-md">
                <div className="w-10 h-10 rounded bg-secondary-container/20 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">credit_card</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface">Billing & Invoices</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Update your payment methods and view history.</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
            </div>
            <div className="flex items-center justify-between p-stack-md rounded-lg bg-error-container/10 hover:bg-error-container/20 border border-error-container/20 transition-colors cursor-pointer group">
              <div className="flex items-center gap-stack-md">
                <div className="w-10 h-10 rounded bg-error-container/30 flex items-center justify-center text-error">
                  <span className="material-symbols-outlined">delete</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-error">Deactivate Account</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Permanently remove your agency data.</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-error opacity-50">warning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
