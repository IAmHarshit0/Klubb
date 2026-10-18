import React from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { DemoUserSwitcher } from '../DemoUserSwitcher';
import { NotificationsPopover } from '../notifications/NotificationsPopover';
import { Wifi, WifiOff, Compass } from 'lucide-react';

export function Navbar() {
  const { isConnected } = useSocket();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-mercury-gray-100">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Left: page context (slot for route-level titles) */}
        <div className="flex items-center gap-3">
          <Link to="/welcome" className="spatial-label hidden sm:flex items-center gap-1.5 hover:text-mercury-black transition-colors">
            <span>Campus Network v3.0</span>
          </Link>
        </div>

        {/* Right: notifications, realtime indicator + user switcher */}
        <div className="flex items-center gap-3">
          {/* Product Overview / Landing Link */}
          <Link
            to="/welcome"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-mercury-gray-600 hover:text-mercury-black hover:bg-mercury-gray-100 transition-colors hidden sm:flex"
            title="Master Product Architecture & Problem/Solution Overview"
          >
            <Compass size={14} className="text-blue-600" />
            <span>Overview</span>
          </Link>

          {/* Realtime socket indicator */}
          <div
            title={isConnected ? 'Realtime connected' : 'Realtime disconnected'}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-mercury-gray-50 border border-mercury-gray-100"
            aria-label={isConnected ? 'Real-time connected' : 'Real-time disconnected'}
          >
            {isConnected ? (
              <Wifi size={13} className="text-green-500" />
            ) : (
              <WifiOff size={13} className="text-mercury-gray-400" />
            )}
            <span className="text-[11px] text-mercury-gray-500 font-medium hidden md:inline">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Notification Bell Popover */}
          <NotificationsPopover />

          {/* Persona Switcher */}
          <DemoUserSwitcher />
        </div>
      </div>
    </header>
  );
}
