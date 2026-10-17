import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { DemoUserSwitcher } from '../DemoUserSwitcher';
import { Wifi, WifiOff } from 'lucide-react';

export function Navbar() {
  const { isConnected } = useSocket();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-mercury-gray-100">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Left: page context (slot for route-level titles) */}
        <div className="flex items-center gap-3">
          <span className="spatial-label hidden sm:block">Campus Network</span>
        </div>

        {/* Right: connection indicator + user switcher */}
        <div className="flex items-center gap-4">
          {/* Realtime socket indicator */}
          <div
            title={isConnected ? 'Realtime connected' : 'Realtime disconnected'}
            className="flex items-center gap-1.5"
            aria-label={isConnected ? 'Real-time connected' : 'Real-time disconnected'}
          >
            {isConnected ? (
              <Wifi size={14} className="text-green-500" />
            ) : (
              <WifiOff size={14} className="text-mercury-gray-400" />
            )}
            <span className="text-xs text-mercury-gray-400 hidden sm:inline">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          <DemoUserSwitcher />
        </div>
      </div>
    </header>
  );
}
