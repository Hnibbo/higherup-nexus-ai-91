import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface OfflineIndicatorProps {
  className?: string;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showRetryButton = true,
  onRetry
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => {
          setShowReconnected(false);
          setWasOffline(false);
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  const handleRetry = async () => {
    setRetrying(true);
    
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/manifest.json', { 
        cache: 'no-cache',
        mode: 'no-cors'
      });
      
      if (response.ok || response.type === 'opaque') {
        // Connection seems to be working
        setIsOnline(true);
        onRetry?.();
      }
    } catch (error) {
      console.log('Still offline');
    } finally {
      setRetrying(false);
    }
  };

  // Show reconnected message
  if (showReconnected) {
    return (
      <div className={`fixed top-4 left-4 right-4 z-50 ${className}`}>
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <Wifi className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You're back online!</span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Don't show if online
  if (isOnline) {
    return null;
  }

  // Show offline indicator
  return (
    <div className={`fixed top-4 left-4 right-4 z-50 ${className}`}>
      <Alert className="bg-orange-50 border-orange-200 text-orange-800">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <div className="font-medium">You're offline</div>
            <div className="text-sm opacity-90">
              Some features may be limited. Check your connection.
            </div>
          </div>
          {showRetryButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={retrying}
              className="ml-4 border-orange-300 text-orange-800 hover:bg-orange-100"
            >
              {retrying ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                'Retry'
              )}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default OfflineIndicator;