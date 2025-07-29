import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudOff, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SyncItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  error?: string;
}

interface BackgroundSyncProps {
  className?: string;
  showDetails?: boolean;
  maxRetries?: number;
}

const BackgroundSync: React.FC<BackgroundSyncProps> = ({
  className = '',
  showDetails = false,
  maxRetries = 3
}) => {
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Load sync queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('backgroundSyncQueue');
    if (savedQueue) {
      try {
        setSyncQueue(JSON.parse(savedQueue));
      } catch (error) {
        console.error('Failed to load sync queue:', error);
      }
    }
  }, []);

  // Save sync queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('backgroundSyncQueue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically sync when coming back online
      if (syncQueue.length > 0) {
        syncPendingItems();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncQueue.length]);

  // Add item to sync queue
  const addToSyncQueue = useCallback((item: Omit<SyncItem, 'id' | 'timestamp' | 'status' | 'retryCount'>) => {
    const syncItem: SyncItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };

    setSyncQueue(prev => [...prev, syncItem]);

    // If online, try to sync immediately
    if (isOnline) {
      syncItem.status = 'syncing';
      syncSingleItem(syncItem);
    }

    return syncItem.id;
  }, [isOnline]);

  // Sync a single item
  const syncSingleItem = async (item: SyncItem) => {
    try {
      // Simulate API call based on item type and resource
      const response = await fetch(`/api/${item.resource}`, {
        method: item.type === 'create' ? 'POST' : item.type === 'update' ? 'PUT' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: item.type !== 'delete' ? JSON.stringify(item.data) : undefined,
      });

      if (response.ok) {
        // Mark as completed
        setSyncQueue(prev => 
          prev.map(queueItem => 
            queueItem.id === item.id 
              ? { ...queueItem, status: 'completed' }
              : queueItem
          )
        );

        // Remove completed items after a delay
        setTimeout(() => {
          setSyncQueue(prev => prev.filter(queueItem => queueItem.id !== item.id));
        }, 5000);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setSyncQueue(prev => 
        prev.map(queueItem => 
          queueItem.id === item.id 
            ? { 
                ...queueItem, 
                status: queueItem.retryCount >= maxRetries ? 'failed' : 'pending',
                retryCount: queueItem.retryCount + 1,
                error: errorMessage
              }
            : queueItem
        )
      );
    }
  };

  // Sync all pending items
  const syncPendingItems = async () => {
    if (!isOnline || isSyncing) return;

    const pendingItems = syncQueue.filter(item => 
      item.status === 'pending' && item.retryCount < maxRetries
    );

    if (pendingItems.length === 0) return;

    setIsSyncing(true);
    setSyncProgress(0);

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      
      // Update status to syncing
      setSyncQueue(prev => 
        prev.map(queueItem => 
          queueItem.id === item.id 
            ? { ...queueItem, status: 'syncing' }
            : queueItem
        )
      );

      await syncSingleItem(item);
      
      // Update progress
      setSyncProgress(((i + 1) / pendingItems.length) * 100);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsSyncing(false);
    setSyncProgress(0);
  };

  // Retry failed items
  const retryFailedItems = () => {
    setSyncQueue(prev => 
      prev.map(item => 
        item.status === 'failed' 
          ? { ...item, status: 'pending', retryCount: 0, error: undefined }
          : item
      )
    );

    if (isOnline) {
      syncPendingItems();
    }
  };

  // Clear completed and failed items
  const clearSyncQueue = () => {
    setSyncQueue(prev => prev.filter(item => 
      item.status !== 'completed' && item.status !== 'failed'
    ));
  };

  // Get sync status summary
  const getSyncSummary = () => {
    const pending = syncQueue.filter(item => item.status === 'pending').length;
    const syncing = syncQueue.filter(item => item.status === 'syncing').length;
    const completed = syncQueue.filter(item => item.status === 'completed').length;
    const failed = syncQueue.filter(item => item.status === 'failed').length;

    return { pending, syncing, completed, failed };
  };

  const summary = getSyncSummary();

  // Simple status indicator
  if (!showDetails) {
    const hasItems = syncQueue.length > 0;
    const hasFailedItems = summary.failed > 0;
    const hasPendingItems = summary.pending > 0 || summary.syncing > 0;

    if (!hasItems) return null;

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {!isOnline ? (
          <CloudOff size={16} className="text-orange-500" />
        ) : isSyncing ? (
          <Cloud size={16} className="text-blue-500 animate-pulse" />
        ) : (
          <Cloud size={16} className="text-green-500" />
        )}
        
        {hasFailedItems && (
          <Badge variant="destructive" className="text-xs">
            {summary.failed} failed
          </Badge>
        )}
        
        {hasPendingItems && (
          <Badge variant="secondary" className="text-xs">
            {summary.pending + summary.syncing} pending
          </Badge>
        )}
      </div>
    );
  }

  // Detailed sync status
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <CloudOff size={16} className="text-orange-500" />
            ) : isSyncing ? (
              <Cloud size={16} className="text-blue-500" />
            ) : (
              <Cloud size={16} className="text-green-500" />
            )}
            Background Sync
          </div>
          
          {syncQueue.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSyncQueue}
              className="text-xs h-6 px-2"
            >
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Sync Progress */}
        {isSyncing && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Syncing...</span>
              <span>{Math.round(syncProgress)}%</span>
            </div>
            <Progress value={syncProgress} className="h-1" />
          </div>
        )}

        {/* Sync Summary */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="flex items-center justify-between">
            <span>Pending:</span>
            <Badge variant="secondary">{summary.pending}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Syncing:</span>
            <Badge variant="default">{summary.syncing}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Completed:</span>
            <Badge variant="outline">{summary.completed}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Failed:</span>
            <Badge variant="destructive">{summary.failed}</Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isOnline && summary.pending > 0 && !isSyncing && (
            <Button
              size="sm"
              onClick={syncPendingItems}
              className="flex-1 text-xs"
            >
              Sync Now
            </Button>
          )}
          
          {summary.failed > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={retryFailedItems}
              className="flex-1 text-xs"
            >
              Retry Failed
            </Button>
          )}
        </div>

        {/* Sync Queue Items */}
        {syncQueue.length > 0 && (
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {syncQueue.slice(-5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
              >
                <div className="flex items-center gap-2">
                  {item.status === 'completed' ? (
                    <CheckCircle size={12} className="text-green-500" />
                  ) : item.status === 'failed' ? (
                    <AlertCircle size={12} className="text-red-500" />
                  ) : item.status === 'syncing' ? (
                    <Cloud size={12} className="text-blue-500 animate-pulse" />
                  ) : (
                    <Clock size={12} className="text-gray-500" />
                  )}
                  
                  <span className="font-medium">
                    {item.type} {item.resource}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-gray-500">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                  {item.error && (
                    <div className="text-red-500 text-xs truncate max-w-20">
                      {item.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {syncQueue.length === 0 && (
          <div className="text-center text-gray-500 text-xs py-4">
            No items to sync
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Export the hook for adding items to sync queue
export const useBackgroundSync = () => {
  const [syncComponent, setSyncComponent] = useState<any>(null);

  const addToSyncQueue = useCallback((item: Omit<SyncItem, 'id' | 'timestamp' | 'status' | 'retryCount'>) => {
    if (syncComponent?.addToSyncQueue) {
      return syncComponent.addToSyncQueue(item);
    }
    
    // Fallback: add to localStorage directly
    const syncItem: SyncItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };

    const existingQueue = JSON.parse(localStorage.getItem('backgroundSyncQueue') || '[]');
    existingQueue.push(syncItem);
    localStorage.setItem('backgroundSyncQueue', JSON.stringify(existingQueue));

    return syncItem.id;
  }, [syncComponent]);

  return { addToSyncQueue, setSyncComponent };
};

export default BackgroundSync;