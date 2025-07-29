import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, Smartphone, Monitor, Tablet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface PWAStatusProps {
  showDetails?: boolean;
  className?: string;
}

const PWAStatus: React.FC<PWAStatusProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  const { device, isInstallable } = useMobileOptimization();

  useEffect(() => {
    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection type detection
    const updateConnectionType = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setConnectionType(connection.effectiveType || 'unknown');
      }
    };

    updateConnectionType();

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateConnectionType);
    }

    // Check installation status
    const checkInstallStatus = () => {
      // Check if running in standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }

      // Check if running as PWA on iOS
      if ((navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkInstallStatus();

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          setUpdateAvailable(true);
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);

  const getDeviceIcon = () => {
    switch (device?.device_type) {
      case 'phone':
        return <Smartphone size={16} />;
      case 'tablet':
        return <Tablet size={16} />;
      default:
        return <Monitor size={16} />;
    }
  };

  const getConnectionBadgeVariant = () => {
    if (!isOnline) return 'destructive';
    
    switch (connectionType) {
      case '4g':
      case '5g':
        return 'default';
      case '3g':
        return 'secondary';
      case '2g':
      case 'slow-2g':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getConnectionText = () => {
    if (!isOnline) return 'Offline';
    return connectionType.toUpperCase();
  };

  if (!showDetails) {
    // Simple status indicator
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isOnline ? (
          <Wifi size={16} className="text-green-600" />
        ) : (
          <WifiOff size={16} className="text-red-600" />
        )}
        
        {updateAvailable && (
          <Badge variant="secondary" className="text-xs">
            Update Available
          </Badge>
        )}
        
        {isInstallable && !isInstalled && (
          <Badge variant="outline" className="text-xs">
            <Download size={12} className="mr-1" />
            Installable
          </Badge>
        )}
      </div>
    );
  }

  // Detailed status card
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi size={16} className="text-green-600" />
              ) : (
                <WifiOff size={16} className="text-red-600" />
              )}
              <span className="text-sm font-medium">Connection</span>
            </div>
            <Badge variant={getConnectionBadgeVariant()}>
              {getConnectionText()}
            </Badge>
          </div>

          {/* Device Type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getDeviceIcon()}
              <span className="text-sm font-medium">Device</span>
            </div>
            <Badge variant="outline">
              {device?.device_type || 'Unknown'}
            </Badge>
          </div>

          {/* Installation Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download size={16} />
              <span className="text-sm font-medium">App Status</span>
            </div>
            <Badge variant={isInstalled ? 'default' : 'outline'}>
              {isInstalled ? 'Installed' : isInstallable ? 'Installable' : 'Web'}
            </Badge>
          </div>

          {/* Screen Size */}
          {device && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Screen</span>
              <span className="text-xs text-gray-600">
                {device.screen_size.width}×{device.screen_size.height}
                {device.screen_size.pixel_ratio > 1 && (
                  <span className="ml-1">@{device.screen_size.pixel_ratio}x</span>
                )}
              </span>
            </div>
          )}

          {/* Capabilities */}
          {device && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Capabilities</span>
              <div className="flex flex-wrap gap-1">
                {device.capabilities.touch && (
                  <Badge variant="outline" className="text-xs">Touch</Badge>
                )}
                {device.capabilities.camera && (
                  <Badge variant="outline" className="text-xs">Camera</Badge>
                )}
                {device.capabilities.gps && (
                  <Badge variant="outline" className="text-xs">GPS</Badge>
                )}
                {device.capabilities.push_notifications && (
                  <Badge variant="outline" className="text-xs">Push</Badge>
                )}
                {device.capabilities.offline_storage && (
                  <Badge variant="outline" className="text-xs">Offline</Badge>
                )}
                {device.capabilities.service_worker && (
                  <Badge variant="outline" className="text-xs">SW</Badge>
                )}
              </div>
            </div>
          )}

          {/* Update Available */}
          {updateAvailable && (
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">Update available</span>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAStatus;