/**
 * Device Integration Service
 * 
 * Provides access to device capabilities like camera, GPS, contacts,
 * file system, and other native device features for PWA functionality.
 */

export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface ContactInfo {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  photo?: string;
}

export interface FilePickerOptions {
  accept?: string;
  multiple?: boolean;
  directory?: boolean;
}

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export interface DeviceInfo {
  platform: string;
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution: string;
  colorScheme: 'light' | 'dark';
  connectionType: string;
  batteryLevel?: number;
  isCharging?: boolean;
  memory?: number;
  cores?: number;
}

export class DeviceIntegrationService {
  private static instance: DeviceIntegrationService;
  private mediaStream: MediaStream | null = null;
  private watchId: number | null = null;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): DeviceIntegrationService {
    if (!DeviceIntegrationService.instance) {
      DeviceIntegrationService.instance = new DeviceIntegrationService();
    }
    return DeviceIntegrationService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      console.log('📱 Initializing Device Integration Service');
      
      // Check for available APIs
      await this.checkAPISupport();
      
      // Request permissions if needed
      await this.requestBasicPermissions();
      
      console.log('✅ Device Integration Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Device Integration Service:', error);
    }
  }

  private async checkAPISupport(): Promise<void> {
    const support = {
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      geolocation: 'geolocation' in navigator,
      contacts: 'contacts' in navigator,
      fileSystem: 'showOpenFilePicker' in window,
      share: 'share' in navigator,
      clipboard: 'clipboard' in navigator,
      vibration: 'vibrate' in navigator,
      battery: 'getBattery' in navigator,
      deviceMemory: 'deviceMemory' in navigator,
      hardwareConcurrency: 'hardwareConcurrency' in navigator,
      connection: 'connection' in navigator,
      wakeLock: 'wakeLock' in navigator,
      permissions: 'permissions' in navigator
    };

    console.log('📱 Device API Support:', support);
  }

  private async requestBasicPermissions(): Promise<void> {
    if ('permissions' in navigator) {
      try {
        // Request basic permissions that don't require user gesture
        const permissions = ['notifications'];
        
        for (const permission of permissions) {
          try {
            const result = await navigator.permissions.query({ name: permission as PermissionName });
            console.log(`📱 Permission ${permission}:`, result.state);
          } catch (error) {
            console.warn(`❌ Could not query permission ${permission}:`, error);
          }
        }
      } catch (error) {
        console.warn('❌ Error requesting basic permissions:', error);
      }
    }
  }

  // Camera Integration
  async capturePhoto(options: CameraOptions = {}): Promise<string> {
    try {
      console.log('📷 Capturing photo with options:', options);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: options.facingMode || 'environment',
          width: options.width || 1920,
          height: options.height || 1080
        }
      };

      // Get camera stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = this.mediaStream;
      video.autoplay = true;
      video.muted = true;

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.drawImage(video, 0, 0);

      // Convert to data URL
      const format = options.format || 'jpeg';
      const quality = options.quality || 0.8;
      const dataUrl = canvas.toDataURL(`image/${format}`, quality);

      // Clean up
      this.stopCamera();

      console.log('✅ Photo captured successfully');
      return dataUrl;

    } catch (error) {
      console.error('❌ Failed to capture photo:', error);
      this.stopCamera();
      throw error;
    }
  }

  async startVideoRecording(options: CameraOptions = {}): Promise<MediaRecorder> {
    try {
      console.log('🎥 Starting video recording');

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: options.facingMode || 'environment',
          width: options.width || 1920,
          height: options.height || 1080
        },
        audio: true
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const mediaRecorder = new MediaRecorder(this.mediaStream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        console.log('✅ Video recording completed:', url);
      };

      mediaRecorder.start();
      return mediaRecorder;

    } catch (error) {
      console.error('❌ Failed to start video recording:', error);
      throw error;
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
      console.log('📷 Camera stopped');
    }
  }

  async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('❌ Failed to get camera devices:', error);
      return [];
    }
  }

  // Geolocation Integration
  async getCurrentLocation(options: LocationOptions = {}): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      console.log('📍 Getting current location');

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: options.enableHighAccuracy || true,
        timeout: options.timeout || 10000,
        maximumAge: options.maximumAge || 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Location obtained:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          resolve(position);
        },
        (error) => {
          console.error('❌ Failed to get location:', error);
          reject(error);
        },
        defaultOptions
      );
    });
  }

  async watchLocation(
    callback: (position: GeolocationPosition) => void,
    errorCallback?: (error: GeolocationPositionError) => void,
    options: LocationOptions = {}
  ): Promise<number> {
    if (!('geolocation' in navigator)) {
      throw new Error('Geolocation is not supported');
    }

    console.log('📍 Starting location watch');

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy || true,
      timeout: options.timeout || 10000,
      maximumAge: options.maximumAge || 60000 // 1 minute
    };

    this.watchId = navigator.geolocation.watchPosition(
      callback,
      errorCallback,
      defaultOptions
    );

    return this.watchId;
  }

  stopLocationWatch(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('📍 Location watch stopped');
    }
  }

  // Contacts Integration (experimental)
  async selectContacts(): Promise<ContactInfo[]> {
    try {
      if (!('contacts' in navigator)) {
        throw new Error('Contacts API is not supported');
      }

      console.log('👥 Selecting contacts');

      const contacts = await (navigator as any).contacts.select(['name', 'email', 'tel'], {
        multiple: true
      });

      const contactList: ContactInfo[] = contacts.map((contact: any) => ({
        name: contact.name?.[0] || 'Unknown',
        email: contact.email?.[0] || undefined,
        phone: contact.tel?.[0] || undefined
      }));

      console.log(`✅ Selected ${contactList.length} contacts`);
      return contactList;

    } catch (error) {
      console.error('❌ Failed to select contacts:', error);
      throw error;
    }
  }

  // File System Integration
  async pickFiles(options: FilePickerOptions = {}): Promise<File[]> {
    try {
      if ('showOpenFilePicker' in window) {
        console.log('📁 Opening file picker');

        const pickerOptions: any = {
          multiple: options.multiple || false,
          excludeAcceptAllOption: false
        };

        if (options.accept) {
          pickerOptions.types = [{
            description: 'Files',
            accept: { [options.accept]: [] }
          }];
        }

        const fileHandles = await (window as any).showOpenFilePicker(pickerOptions);
        const files = await Promise.all(
          fileHandles.map((handle: any) => handle.getFile())
        );

        console.log(`✅ Selected ${files.length} files`);
        return files;

      } else {
        // Fallback to input element
        return this.pickFilesWithInput(options);
      }
    } catch (error) {
      console.error('❌ Failed to pick files:', error);
      throw error;
    }
  }

  private async pickFilesWithInput(options: FilePickerOptions): Promise<File[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options.multiple || false;
      
      if (options.accept) {
        input.accept = options.accept;
      }

      input.onchange = () => {
        const files = Array.from(input.files || []);
        resolve(files);
      };

      input.oncancel = () => {
        resolve([]);
      };

      input.click();
    });
  }

  async saveFile(filename: string, data: Blob): Promise<void> {
    try {
      if ('showSaveFilePicker' in window) {
        console.log('💾 Saving file:', filename);

        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Files',
            accept: { '*/*': [] }
          }]
        });

        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();

        console.log('✅ File saved successfully');
      } else {
        // Fallback to download
        this.downloadFile(filename, data);
      }
    } catch (error) {
      console.error('❌ Failed to save file:', error);
      throw error;
    }
  }

  private downloadFile(filename: string, data: Blob): void {
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Share Integration
  async share(data: ShareData): Promise<void> {
    try {
      if ('share' in navigator) {
        console.log('📤 Sharing content:', data);
        await navigator.share(data);
        console.log('✅ Content shared successfully');
      } else {
        // Fallback to clipboard
        if (data.text || data.url) {
          await this.copyToClipboard(data.text || data.url || '');
          console.log('✅ Content copied to clipboard');
        } else {
          throw new Error('Share API not supported and no fallback available');
        }
      }
    } catch (error) {
      console.error('❌ Failed to share content:', error);
      throw error;
    }
  }

  async canShare(data: ShareData): Promise<boolean> {
    if ('canShare' in navigator) {
      return navigator.canShare(data);
    }
    return false;
  }

  // Clipboard Integration
  async copyToClipboard(text: string): Promise<void> {
    try {
      if ('clipboard' in navigator) {
        await navigator.clipboard.writeText(text);
        console.log('✅ Text copied to clipboard');
      } else {
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('✅ Text copied to clipboard (fallback)');
      }
    } catch (error) {
      console.error('❌ Failed to copy to clipboard:', error);
      throw error;
    }
  }

  async readFromClipboard(): Promise<string> {
    try {
      if ('clipboard' in navigator) {
        const text = await navigator.clipboard.readText();
        console.log('✅ Text read from clipboard');
        return text;
      } else {
        throw new Error('Clipboard read not supported');
      }
    } catch (error) {
      console.error('❌ Failed to read from clipboard:', error);
      throw error;
    }
  }

  // Device Information
  async getDeviceInfo(): Promise<DeviceInfo> {
    const info: DeviceInfo = {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      connectionType: this.getConnectionType()
    };

    // Optional device information
    if ('deviceMemory' in navigator) {
      info.memory = (navigator as any).deviceMemory;
    }

    if ('hardwareConcurrency' in navigator) {
      info.cores = navigator.hardwareConcurrency;
    }

    // Battery information
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        info.batteryLevel = Math.round(battery.level * 100);
        info.isCharging = battery.charging;
      } catch (error) {
        console.warn('❌ Could not get battery info:', error);
      }
    }

    return info;
  }

  private getConnectionType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || connection.type || 'unknown';
    }
    return 'unknown';
  }

  // Vibration
  vibrate(pattern: number | number[]): boolean {
    if ('vibrate' in navigator) {
      return navigator.vibrate(pattern);
    }
    return false;
  }

  // Wake Lock
  async requestWakeLock(): Promise<any> {
    try {
      if ('wakeLock' in navigator) {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('✅ Wake lock acquired');
        return wakeLock;
      } else {
        throw new Error('Wake Lock API not supported');
      }
    } catch (error) {
      console.error('❌ Failed to acquire wake lock:', error);
      throw error;
    }
  }

  // Notifications
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);
      return permission;
    }
    throw new Error('Notifications not supported');
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-192x192.svg',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      console.log('🔔 Notification shown:', title);
    } else {
      console.warn('❌ Cannot show notification - permission not granted');
    }
  }

  // Orientation
  async lockOrientation(orientation: OrientationLockType): Promise<void> {
    try {
      if ('orientation' in screen && 'lock' in screen.orientation) {
        await screen.orientation.lock(orientation);
        console.log('📱 Orientation locked:', orientation);
      } else {
        throw new Error('Screen Orientation API not supported');
      }
    } catch (error) {
      console.error('❌ Failed to lock orientation:', error);
      throw error;
    }
  }

  unlockOrientation(): void {
    try {
      if ('orientation' in screen && 'unlock' in screen.orientation) {
        screen.orientation.unlock();
        console.log('📱 Orientation unlocked');
      }
    } catch (error) {
      console.error('❌ Failed to unlock orientation:', error);
    }
  }

  // Fullscreen
  async requestFullscreen(element?: Element): Promise<void> {
    try {
      const targetElement = element || document.documentElement;
      
      if (targetElement.requestFullscreen) {
        await targetElement.requestFullscreen();
      } else if ((targetElement as any).webkitRequestFullscreen) {
        await (targetElement as any).webkitRequestFullscreen();
      } else if ((targetElement as any).msRequestFullscreen) {
        await (targetElement as any).msRequestFullscreen();
      } else {
        throw new Error('Fullscreen API not supported');
      }
      
      console.log('📱 Fullscreen mode activated');
    } catch (error) {
      console.error('❌ Failed to enter fullscreen:', error);
      throw error;
    }
  }

  exitFullscreen(): void {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      
      console.log('📱 Fullscreen mode deactivated');
    } catch (error) {
      console.error('❌ Failed to exit fullscreen:', error);
    }
  }

  // Cleanup
  cleanup(): void {
    this.stopCamera();
    this.stopLocationWatch();
    console.log('🧹 Device Integration Service cleaned up');
  }
}

export default DeviceIntegrationService;