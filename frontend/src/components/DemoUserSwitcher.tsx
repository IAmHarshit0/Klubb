import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS } from '../types/api';

export function DemoUserSwitcher() {
  const { userId, currentUser, switchUser } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeDemo = DEMO_USERS.find((u) => u.id === userId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-mercury-gray-200 bg-white hover:bg-mercury-gray-50 transition-colors text-sm font-medium text-mercury-black max-w-xs"
      >
        <div className="w-7 h-7 rounded-full bg-mercury-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          {currentUser?.name?.charAt(0) || <User size={14} />}
        </div>
        <div className="flex flex-col items-start min-w-0">
          <span className="font-semibold text-xs truncate max-w-[120px]">
            {currentUser?.name || activeDemo?.name || 'Demo User'}
          </span>
          <span className="text-mercury-gray-400 text-xs truncate max-w-[120px]">
            {activeDemo?.role || 'Switch user'}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-mercury-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select demo user"
          className="absolute right-0 top-full mt-2 w-72 bg-white border border-mercury-gray-100 rounded-2xl shadow-mercury-lg z-50 overflow-hidden animate-slide-up"
        >
          <div className="px-4 py-3 border-b border-mercury-gray-50">
            <p className="spatial-label">Demo Users</p>
            <p className="text-xs text-mercury-gray-400 mt-0.5">All auth is server-side. This switches identity only.</p>
          </div>
          <ul className="py-1 max-h-80 overflow-y-auto">
            {DEMO_USERS.map((demo) => (
              <li key={demo.id}>
                <button
                  role="option"
                  aria-selected={userId === demo.id}
                  onClick={() => { switchUser(demo.id); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-mercury-gray-50 transition-colors text-left ${
                    userId === demo.id ? 'bg-mercury-gray-50' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      userId === demo.id
                        ? 'bg-mercury-black text-white'
                        : 'bg-mercury-gray-100 text-mercury-gray-700'
                    }`}
                  >
                    {demo.name.charAt(0)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-mercury-black">{demo.name}</span>
                    <span className="text-xs text-mercury-gray-400">{demo.role}</span>
                  </div>
                  {userId === demo.id && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-mercury-black flex-shrink-0" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
