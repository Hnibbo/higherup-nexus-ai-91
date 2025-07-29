import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NotificationSettings {
  enabled: boolean;
  marketing: boolean;
  updates: boolean;
  reminders: boolean;
  alerts: boolean;
}

interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  timestamp: number;
  read: boolean;
  action?: {
    url: string;
    label: string;
  };
}

interface PushNotificationsProps {
  className?: string;
  showSettings?: boolean;
}

const PushNotifications: React.FC<PushNotificationsProps> = ({
  className = '',
  showSettings = false
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    marketing: true,
    updates: true,
    reminders: true,
    alerts: true
  });
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [showNotificationsList, setShowNotificationsList] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'Notification' in window && 
                       'serviceWorker' in navigator && 
                       'PushManager' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }

    const savedNotifications = localStorage.getItem('pushNotifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('pushNotifications', JSON.stringify(notifications));
  }, [notifications]);

  // Get current push subscription
  useEffect(() => {
    const getSubscription = async () => {
      if (!isSupported || permission !== 'granted') return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const currentSubscription = await registration.pushManager.getSubscription();
        setSubscription(currentSubscription);
      } catch (error) {
        console.error('Failed to get push subscription:', error);
      }
    };

    getSubscription();
  }, [isSupported, permission]);

  // Request notification permission
  const requestPermission = async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await subscribeToPush();
        setSettings(prev => ({ ...prev, enabled: true }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  };

  // Subscribe to push notifications
  const subscribeToPush = async () => {
    if (!isSupported || permission !== 'granted') return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // You would need to replace this with your actual VAPID public key
      const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || 'your-vapid-public-key';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      setSubscription(subscription);

      // Send subscription to your server
      await sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribeFromPush = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      setSettings(prev => ({ ...prev, enabled: false }));
      
      // Notify server about unsubscription
      await removeSubscriptionFromServer(subscription);
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  };

  // Convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Send subscription to server
  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          settings: settings
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  };

  // Remove subscription from server
  const removeSubscriptionFromServer = async (subscription: PushSubscription) => {
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        }),
      });
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    if (permission !== 'granted') return;

    try {
      const notification = new Notification('Test Notification', {
        body: 'This is a test notification from HigherUp.ai',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'test-notification',
        requireInteraction: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Add to notifications list
      const newNotification: PushNotification = {
        id: `test_${Date.now()}`,
        title: 'Test Notification',
        body: 'This is a test notification from HigherUp.ai',
        icon: '/icons/icon-192x192.png',
        timestamp: Date.now(),
        read: false
      };

      setNotifications(prev => [newNotification, ...prev]);
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle settings change
  const handleSettingChange = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (key === 'enabled') {
      if (value && permission !== 'granted') {
        await requestPermission();
      } else if (!value && subscription) {
        await unsubscribeFromPush();
      }
    } else if (subscription) {
      // Update server with new settings
      await sendSubscriptionToServer(subscription);
    }
  };

  if (!isSupported) {
    return (
      <Alert className={className}>
        <BellOff className="h-4 w-4" />
        <AlertDescription>
          Push notifications are not supported in this browser.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      {/* Notification Bell with Badge */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNotificationsList(!showNotificationsList)}
          className="relative"
        >
          {permission === 'granted' && settings.enabled ? (
            <Bell size={20} />
          ) : (
            <BellOff size={20} />
          )}
          
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* Notifications Dropdown */}
        {showNotificationsList && (
          <Card className="absolute right-0 top-full mt-2 w-80 z-50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Notifications</span>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllNotifications}
                      className="text-xs h-6 px-2"
                    >
                      Clear all
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotificationsList(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Permission Request */}
              {permission !== 'granted' && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800 mb-2">
                    Enable notifications to stay updated
                  </div>
                  <Button
                    size="sm"
                    onClick={requestPermission}
                    className="w-full"
                  >
                    Enable Notifications
                  </Button>
                </div>
              )}

              {/* Notifications List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-4">
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                        notification.read 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2">
                        {notification.icon && (
                          <img 
                            src={notification.icon} 
                            alt="" 
                            className="w-6 h-6 rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {notification.title}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {notification.body}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Test Notification Button */}
              {permission === 'granted' && (
                <div className="mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendTestNotification}
                    className="w-full text-xs"
                  >
                    Send Test Notification
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && permission === 'granted' && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings size={16} />
              Notification Settings
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable notifications</span>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
              />
            </div>
            
            {settings.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Marketing updates</span>
                  <Switch
                    checked={settings.marketing}
                    onCheckedChange={(checked) => handleSettingChange('marketing', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Product updates</span>
                  <Switch
                    checked={settings.updates}
                    onCheckedChange={(checked) => handleSettingChange('updates', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reminders</span>
                  <Switch
                    checked={settings.reminders}
                    onCheckedChange={(checked) => handleSettingChange('reminders', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Important alerts</span>
                  <Switch
                    checked={settings.alerts}
                    onCheckedChange={(checked) => handleSettingChange('alerts', checked)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PushNotifications;