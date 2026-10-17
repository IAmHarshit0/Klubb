import React from 'react';
import { NavLink } from 'react-router-dom';
import { Rss, Search, MessageCircle, Users, Network, Building2 } from 'lucide-react';

const navItems = [
  { to: '/feed', icon: Rss, label: 'Feed' },
  { to: '/communities', icon: Building2, label: 'Communities' },
  { to: '/discover', icon: Search, label: 'Discover' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/connections', icon: Users, label: 'Connections' },
];

export function Sidebar() {
  return (
    <nav
      aria-label="Main navigation"
      className="w-60 flex-shrink-0 h-full flex flex-col py-6 px-3 border-r border-mercury-gray-100"
    >
      {/* Logo */}
      <div className="px-3 mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-mercury-black flex items-center justify-center">
            <Network size={16} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-black tracking-tight text-mercury-black">Campus</span>
            <span className="text-xs block spatial-label">Network v3.0</span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <ul className="flex flex-col gap-1" role="list">
        {navItems.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              aria-current={undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Bottom: Profile link */}
      <div className="mt-auto">
        <NavLink
          to="/profile/me"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <div className="w-5 h-5 rounded-full bg-mercury-gray-200 flex items-center justify-center">
            <Users size={11} />
          </div>
          <span>My Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
