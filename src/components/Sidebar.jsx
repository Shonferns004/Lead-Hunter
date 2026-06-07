import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { section: 'Main' },
  { path: '/', label: 'Dashboard', icon: '⬡', end: true },
  { path: '/search', label: 'Lead Search', icon: '⌖' },
  { path: '/leads', label: 'All Leads', icon: '◈', badge: true },
  { path: '/activity', label: 'Activity', icon: '⬡' },
  { section: 'Outreach' },
  { path: '/messages', label: 'WhatsApp Outreach', icon: '◱', notif: true },
  { path: '/history', label: 'History', icon: '◷' },

  { path: '/settings', label: 'Settings', icon: '◎' },
];

export default function Sidebar({ leadCount, onLogout }) {
  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-mark">Lead<span>Hunter</span></div>
        <div className="logo-sub">Web Agency CRM</div>
      </div>
      <div className="nav">
        {navItems.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}${item.notif ? ' notif' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
              {item.badge && (
                <span className="nav-badge">{leadCount}</span>
              )}
            </NavLink>
          )
        )}
      </div>
      <div className="sidebar-footer">
        <div className="user-row">
          <div className="avatar">AK</div>
          <div>
            <div className="user-name">Ahmed Khan</div>
            <div className="user-role">Web Agency</div>
          </div>
          <button onClick={onLogout} style={{
            background: 'none', border: '1px solid #333', color: '#888', borderRadius: '6px',
            padding: '4px 10px', fontSize: '11px', cursor: 'pointer', marginLeft: 'auto'
          }}>Logout</button>
        </div>
      </div>
    </div>
  );
}
