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
    <>
      <div className="topbar">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Outreach preferences</div>
        </div>
      </div>

      <div style={{ maxWidth: '580px' }}>
        <div className="panel">
          <div className="panel-header"><div className="panel-title">◱ Outreach Settings</div></div>
          <div className="panel-body">
            <div className="form-field" style={{ marginBottom: '14px' }}>
              <div className="form-label">Your Name / Agency Name</div>
              <input className="form-input" type="text" placeholder="Ahmed – WebCraft Agency" value={agencyName} onChange={e => setAgencyName(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div className="form-field" style={{ marginBottom: '14px' }}>
              <div className="form-label">Starting Price (AED)</div>
              <input className="form-input" type="text" placeholder="1500" value={startingPrice} onChange={e => setStartingPrice(e.target.value)} style={{ width: '100%' }} />
            </div>
            <button className="btn btn-primary" onClick={saveSettings}>Save Settings</button>
          </div>
        </div>
      </div>
    </>
  );
}
