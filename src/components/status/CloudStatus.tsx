import React, { useState, useEffect } from 'react';
import { checkSupabaseConnection, isSupabaseConfigured } from '../../services/supabase';

interface CloudStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const CloudStatus: React.FC<CloudStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    latency: number;
    error?: string;
    lastChecked?: Date;
  }>({ connected: false, latency: 0 });
  
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const checkConnection = async () => {
    if (!isSupabaseConfigured()) {
      setConnectionStatus({
        connected: false,
        latency: 0,
        error: 'Supabase not configured',
        lastChecked: new Date()
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await checkSupabaseConnection();
      setConnectionStatus({
        ...result,
        lastChecked: new Date()
      });
    } catch (error) {
      setConnectionStatus({
        connected: false,
        latency: 0,
        error: 'Connection check failed',
        lastChecked: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkConnection();

    // Set up periodic checks every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (isLoading) return 'bg-gray-400';
    if (!connectionStatus.connected) return 'bg-red-500';
    if (connectionStatus.latency < 200) return 'bg-green-500';
    if (connectionStatus.latency < 500) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking...';
    if (!connectionStatus.connected) return 'Offline';
    if (connectionStatus.latency < 200) return 'Excellent';
    if (connectionStatus.latency < 500) return 'Good';
    return 'Slow';
  };

  const getLatencyText = () => {
    if (!connectionStatus.connected || connectionStatus.latency === 0) return 'N/A';
    return `${Math.round(connectionStatus.latency)}ms`;
  };

  if (!showDetails) {
    // Compact version for header
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} transition-colors duration-300`}></div>
          {connectionStatus.connected && (
            <div className={`absolute inset-0 w-3 h-3 rounded-full ${getStatusColor()} animate-ping opacity-75`}></div>
          )}
        </div>
        <span className="text-sm text-gray-600 hidden sm:inline">
          Cloud {getStatusText()}
        </span>
      </div>
    );
  }

  // Detailed version for settings/admin
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className={`w-4 h-4 rounded-full ${getStatusColor()} transition-colors duration-300`}></div>
            {connectionStatus.connected && (
              <div className={`absolute inset-0 w-4 h-4 rounded-full ${getStatusColor()} animate-ping opacity-75`}></div>
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Cloud Connection</h3>
            <p className="text-sm text-gray-600">
              Status: {getStatusText()} • Latency: {getLatencyText()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLoading(true);
              checkConnection();
            }}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Refresh'}
          </button>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Connection:</span>
              <div className="font-medium">
                {connectionStatus.connected ? (
                  <span className="text-green-600">✓ Connected</span>
                ) : (
                  <span className="text-red-600">✗ Disconnected</span>
                )}
              </div>
            </div>
            
            <div>
              <span className="text-gray-500">Response Time:</span>
              <div className="font-medium">{getLatencyText()}</div>
            </div>
            
            <div>
              <span className="text-gray-500">Last Checked:</span>
              <div className="font-medium">
                {connectionStatus.lastChecked ? 
                  connectionStatus.lastChecked.toLocaleTimeString() : 'Never'
                }
              </div>
            </div>
            
            <div>
              <span className="text-gray-500">Sync Status:</span>
              <div className="font-medium">
                {connectionStatus.connected ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-orange-600">Offline Mode</span>
                )}
              </div>
            </div>
          </div>
          
          {connectionStatus.error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <svg className="w-4 h-4 text-red-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800">Connection Error</h4>
                  <p className="text-sm text-red-700 mt-1">{connectionStatus.error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
            <span>Auto-refresh every 30 seconds</span>
            <span>Supabase Cloud Database</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudStatus;