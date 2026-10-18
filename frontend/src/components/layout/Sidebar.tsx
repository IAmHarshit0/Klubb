import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Rss,
  Search,
  MessageCircle,
  Users,
  Network,
  Building2,
  ShieldCheck,
  Bell,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar() {
  const { userId, isVerifiedAlumnus } = useAuth();
  const isVerifier = userId === 'usr-verifier-001';

  const navItems = [
    { to: '/feed', icon: Rss, label: 'Feed' },
    { to: '/communities', icon: Building2, label: 'Communities' },
    { to: '/discover', icon: Search, label: 'Discover', condition: isVerifiedAlumnus },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/connections', icon: Users, label: 'Connections' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/verifier', icon: ShieldCheck, label: 'Platform Verifier', highlight: isVerifier },
    { to: '/welcome', icon: Compass, label: 'Product Tour' },
  ];

  const visibleNavItems = navItems.filter((item) => item.condition === undefined || item.condition);

  return (
    <nav
      aria-label="Main navigation"
      className="w-60 flex-shrink-0 h-full flex flex-col py-6 px-3 border-r border-mercury-gray-100 bg-white"
    >
      {/* Logo */}
      <div className="px-3 mb-6">
        <NavLink to="/welcome" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-mercury-black flex items-center justify-center group-hover:scale-105 transition-transform">
            <Network size={16} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-black tracking-tight text-mercury-black">Campus</span>
            <span className="text-xs block spatial-label">Network v3.0</span>
          </div>
        </NavLink>
      </div>

      {/* Nav links */}
      <ul className="flex flex-col gap-1" role="list">
        {visibleNavItems.map(({ to, icon: Icon, label, highlight }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''} ${
                  highlight ? 'text-blue-700 font-bold' : ''
                }`
              }
            >
              <Icon size={18} className={highlight ? 'text-blue-600' : undefined} />
              <span>{label}</span>
              {highlight && (
                <span className="ml-auto w-2 h-2 rounded-full bg-blue-600" />
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Bottom: Profile link */}
      <div className="mt-auto pt-4 border-t border-mercury-gray-100">
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
