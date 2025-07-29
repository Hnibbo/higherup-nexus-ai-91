import { useState, useEffect, useCallback } from 'react';
import MobileOptimizationService, { 
  MobileDevice, 
  TouchGesture, 
  MobilePerformanceMetrics,
  PushNotification 
} from '@/services/mobile/MobileOptimizationService';

/**
 * Mobile Optimization Hook
 * 
 * Provides React hook interface for mobile optimization features including
 * device detection, touch gestures, offline capabilities, and performance monitoring.
 */

interface UseMobileOptimizationReturn {
  // Device state
  device: MobileDevice | null;
  isOnline: boolean;
  isInstallable: boolean;
  
  // Performance state
  performanceMetrics: MobilePerformanceMetrics | null;
  
  // Methods
  optimizeForDevice: (deviceId: string, content: any) => Promise<any>;
  enableTouchGesture: (gesture: Omit<TouchGesture, 'enabled'>) => Promise<TouchGesture>;
  handleTouchGesture: (gestureType: string, gestureData: any) => Promise<void>;
  trackPerformance: (deviceId: string, metrics: Omit<MobilePerformanceMetrics, 'device_id'>) => Promise<void>;
  sendPushNotification: (notification: Omit<PushNotification, 'id'>) => Promise<PushNotification>;
  enablePushNotifications: () => Promise<boolean>;
  installPWA: () => Promise<boolean>;
  syncOfflineData: () => Promise<void>;
  
  // Loading states
  isOptimizing: boolean;
  isTracking: boolean;
  isSyncing: boolean;
}

export const useMobileOptimization = (): UseMobileOptimizationReturn => {
  const [device, setDevice] = useState<MobileDevice | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<MobilePerformanceMetrics | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const mobileService = MobileOptimizationService.getInstance();

  // Initialize device detection
  useEffect(() => {
    const initializeDevice = async () => {
      try {
        const userAgent = navigator.userAgent;
        const screenInfo = {
          width: window.screen.width,
          height: window.screen.height,
          pixelRatio: window.devicePixelRatio || 1
        };
        
        const capabilities = {
          touch: 'ontouchstart' in window,
          camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
          gps: 'geolocation' in navigator,
          pushNotifications: 'Notification' in window && 'serviceWorker' in navigator,
          offlineStorage: 'localStorage' in window && 'sessionStorage' in window,
          serviceWorker: 'serviceWorker' in navigator,
          cpuCores: navigator.hardwareConcurrency || 1,
          memoryGB: (navigator as any).deviceMemory || 1,
          networkType: (navigator as any).connection?.effectiveType || 'unknown',
          connectionSpeed: (navigator as any).connection?.downlink || 0
        };

        const detectedDevice = await mobileService.detectDevice(userAgent, screenInfo, capabilities);
        setDevice(detectedDevice);
      } catch (error) {
        console.error('Failed to initialize device:', error);
      }
    };

    initializeDevice();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor PWA installability
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      (window as any).deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && !isSyncing) {
      syncOfflineData();
    }
  }, [isOnline]);

  const optimizeForDevice = useCallback(async (deviceId: string, content: any) => {
    setIsOptimizing(true);
    try {
      const optimizedContent = await mobileService.optimizeForDevice(deviceId, content);
      return optimizedContent;
    } catch (error) {
      console.error('Failed to optimize for device:', error);
      throw error;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const enableTouchGesture = useCallback(async (gesture: Omit<TouchGesture, 'enabled'>) => {
    try {
      const touchGesture = await mobileService.registerTouchGesture(gesture);
      return touchGesture;
    } catch (error) {
      console.error('Failed to enable touch gesture:', error);
      throw error;
    }
  }, []);

  const handleTouchGesture = useCallback(async (gestureType: string, gestureData: any) => {
    try {
      await mobileService.handleTouchGesture(gestureType, gestureData);
    } catch (error) {
      console.error('Failed to handle touch gesture:', error);
      throw error;
    }
  }, []);

  const trackPerformance = useCallback(async (deviceId: string, metrics: Omit<MobilePerformanceMetrics, 'device_id'>) => {
    setIsTracking(true);
    try {
      await mobileService.trackMobilePerformance(deviceId, metrics);
      setPerformanceMetrics({ device_id: deviceId, ...metrics });
    } catch (error) {
      console.error('Failed to track performance:', error);
      throw error;
    } finally {
      setIsTracking(false);
    }
  }, []);

  const sendPushNotification = useCallback(async (notification: Omit<PushNotification, 'id'>) => {
    try {
      const pushNotification = await mobileService.sendPushNotification(notification);
      return pushNotification;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  }, []);

  const enablePushNotifications = useCallback(async () => {
    try {
      const enabled = await mobileService.enablePushNotifications();
      return enabled;
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      return false;
    }
  }, []);

  const installPWA = useCallback(async () => {
    try {
      const installed = await mobileService.installPWA();
      if (installed) {
        setIsInstallable(false);
      }
      return installed;
    } catch (error) {
      console.error('Failed to install PWA:', error);
      return false;
    }
  }, []);

  const syncOfflineData = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await mobileService.syncOfflineData();
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  return {
    // State
    device,
    isOnline,
    isInstallable,
    performanceMetrics,
    
    // Methods
    optimizeForDevice,
    enableTouchGesture,
    handleTouchGesture,
    trackPerformance,
    sendPushNotification,
    enablePushNotifications,
    installPWA,
    syncOfflineData,
    
    // Loading states
    isOptimizing,
    isTracking,
    isSyncing
  };
};

export default useMobileOptimization;