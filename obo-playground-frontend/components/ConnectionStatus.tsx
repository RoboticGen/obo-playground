'use client';

import { useEffect, useState } from 'react';
import { connectionMonitor, ConnectionStatus as Status } from '@/lib/connectionMonitor';

export default function ConnectionStatus() {
  const [status, setStatus] = useState<Status>('checking');
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    // Initialize connection monitor
    connectionMonitor.init();

    // Subscribe to status changes
    const unsubscribe = connectionMonitor.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'checking':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return (
          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'offline':
        return (
          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'checking':
        return (
          <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="flex items-center gap-2 rounded-sm border border-neutral-800 bg-black px-3 py-1.5 text-sm transition-all hover:border-neutral-700 hover:bg-neutral-900"
        title={`Connection status: ${getStatusText()}`}
      >
        <div className={`flex h-5 w-5 items-center justify-center rounded-full ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        <span className="text-neutral-300">{getStatusText()}</span>
      </button>

      {/* Detail tooltip */}
      {showDetail && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDetail(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-sm border border-neutral-800 bg-neutral-950 p-4 shadow-2xl">
            <div className="mb-3 flex items-center gap-2 border-b border-neutral-800 pb-3">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full ${getStatusColor()}`}>
                {getStatusIcon()}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{getStatusText()}</div>
                <div className="text-xs text-neutral-500">Backend Connection</div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-neutral-400">
              {status === 'online' && (
                <>
                  <div className="flex items-start gap-2">
                    <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Connected to backend server</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Auto-save is active</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Changes syncing to server</span>
                  </div>
                </>
              )}

              {status === 'offline' && (
                <>
                  <div className="flex items-start gap-2">
                    <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Cannot reach backend server</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Working in offline mode</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Changes saved locally</span>
                  </div>
                  <div className="mt-3 rounded bg-yellow-500/10 p-2 text-yellow-500">
                    <div className="font-medium">Auto-sync enabled</div>
                    <div className="mt-1 text-xs">
                      Changes will sync automatically when connection is restored
                    </div>
                  </div>
                </>
              )}

              {status === 'checking' && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Checking connection status...</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
