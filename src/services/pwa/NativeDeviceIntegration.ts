/**
 * Native Device Integration Service
 * Comprehensive device integration for camera, GPS, sensors,
 * and other native mobile capabilities
 */
import { advancedPWAService } from './AdvancedPWAService';

export interface CameraCapture {
  id: string;
  type: 'photo' | 'video';
  blob: Blob;
  dataUrl: string;
  metadata: {
    width: number;
    height: number;
    size: number;
    timestamp: Date;
    location?: GeolocationPosition;
    deviceInfo: string;
  };
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface DeviceMotionData {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  accelerationIncludingGravity: {
    x: number;
    y: number;
    z: number;
  };
  rotationRate: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  interval: number;
  timestamp: Date;
}

export interface DeviceOrientationData {
  alpha: number; // Z axis rotation (0-360)
  beta: number;  // X axis rotation (-180 to 180)
  gamma: number; // Y axis rotation (-90 to 90)
  absolute: boolean;
  timestamp: Date;
}

export interface ContactInfo {
  name: string;
  phone?: string;
  email?: string;
  organization?: string;
}

export interface FilePickerOptions {
  accept: string[];
  multiple: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
}

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

/**
 * Native Device Integration Service
 */
export class NativeDeviceIntegration {
  private static instance: NativeDeviceIntegration;
  private mediaStream: MediaStream | null = null;
  private locationWatcher: number | null = null;
  private motionListeners: Set<(data: DeviceMotionData) => void> = new Set();
  private orientationListeners: Set<(data: DeviceOrientationData) => void> = new Set();
  private isListeningToMotion = false;
  private isListeningToOrientation = false;

  private constructor() {
    this.initializeDeviceIntegration();
  }

  public static getInstance(): NativeDeviceIntegration {
    if (!NativeDeviceIntegration.instance) {
      NativeDeviceIntegration.instance = new NativeDeviceIntegration();
    }
    return NativeDeviceIntegration.instance;
  }

  private async initializeDeviceIntegration(): Promise<void> {
    console.log('📱 Initializing Native Device Integration');
    
    // Check device capabilities
    await this.checkDeviceCapabilities();
    
    console.log('✅ Native Device Integration initialized');
  }

  /**
   * Camera Integration
   */
  async capturePhoto(options?: {
    facingMode?: 'user' | 'environment';
    width?: number;
    height?: number;
    quality?: number;
  }): Promise<CameraCapture> {
    try {
      console.log('📸 Capturing photo');
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: options?.facingMode || 'environment',
          width: options?.width || 1920,
          height: options?.height || 1080
        }
      });

      // Create video element for capture
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas for capture
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0);
      
      // Stop camera stream
      stream.getTracks().forEach(track => track.stop());

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', options?.quality || 0.9);
      });

      // Get data URL
      const dataUrl = canvas.toDataURL('image/jpeg', options?.quality || 0.9);

      // Get location if available
      let location: GeolocationPosition | undefined;
      try {
        location = await this.getCurrentLocation();
      } catch {
        // Location not available
      }

      const capture: CameraCapture = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'photo',
        blob,
        dataUrl,
        metadata: {
          width: canvas.width,
          height: canvas.height,
          size: blob.size,
          timestamp: new Date(),
          location,
          deviceInfo: navigator.userAgent
        }
      };

      console.log('✅ Photo captured successfully');
      return capture;
    } catch (error) {
      console.error('❌ Failed to capture photo:', error);
      throw error;
    }
  }

  async captureVideo(options?: {
    facingMode?: 'user' | 'environment';
    maxDuration?: number; // in seconds
    width?: number;
    height?: number;
  }): Promise<CameraCapture> {
    try {
      console.log('🎥 Starting video capture');
      
      // Request camera and microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: options?.facingMode || 'environment',
          width: options?.width || 1920,
          height: options?.height || 1080
        },
        audio: true
      });

      this.mediaStream = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start();

      // Stop recording after max duration
      if (options?.maxDuration) {
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, options.maxDuration * 1000);
      }

      // Return promise that resolves when recording stops
      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = async () => {
          try {
            // Stop camera stream
            stream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;

            // Create blob from chunks
            const blob = new Blob(chunks, { type: 'video/webm' });
            
            // Create data URL
            const dataUrl = URL.createObjectURL(blob);

            // Get location if available
            let location: GeolocationPosition | undefined;
            try {
              location = await this.getCurrentLocation();
            } catch {
              // Location not available
            }

            const capture: CameraCapture = {
              id: `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              type: 'video',
              blob,
              dataUrl,
              metadata: {
                width: options?.width || 1920,
                height: options?.height || 1080,
                size: blob.size,
                timestamp: new Date(),
                location,
                deviceInfo: navigator.userAgent
              }
            };

            console.log('✅ Video captured successfully');
            resolve(capture);
          } catch (error) {
            reject(error);
          }
        };

        mediaRecorder.onerror = reject;
      });
    } catch (error) {
      console.error('❌ Failed to capture video:', error);
      throw error;
    }
  }

  stopVideoCapture(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
      console.log('🛑 Video capture stopped');
    }
  }

  /**
   * Geolocation Integration
   */
  async getCurrentLocation(options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 10000,
          maximumAge: options?.maximumAge ?? 300000
        }
      );
    });
  }

  async watchLocation(
    callback: (location: LocationData) => void,
    options?: {
      enableHighAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
    }
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: new Date(position.timestamp)
          };
          callback(locationData);
        },
        reject,
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 10000,
          maximumAge: options?.maximumAge ?? 300000
        }
      );

      this.locationWatcher = watchId;
      resolve(watchId);
    });
  }

  stopWatchingLocation(): void {
    if (this.locationWatcher !== null) {
      navigator.geolocation.clearWatch(this.locationWatcher);
      this.locationWatcher = null;
      console.log('🛑 Location watching stopped');
    }
  }

  /**
   * Device Motion and Orientation
   */
  async startMotionDetection(callback: (data: DeviceMotionData) => void): Promise<void> {
    try {
      // Request permission for iOS 13+
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          throw new Error('Motion permission denied');
        }
      }

      const motionHandler = (event: DeviceMotionEvent) => {
        const motionData: DeviceMotionData = {
          acceleration: {
            x: event.acceleration?.x || 0,
            y: event.acceleration?.y || 0,
            z: event.acceleration?.z || 0
          },
          accelerationIncludingGravity: {
            x: event.accelerationIncludingGravity?.x || 0,
            y: event.accelerationIncludingGravity?.y || 0,
            z: event.accelerationIncludingGravity?.z || 0
          },
          rotationRate: {
            alpha: event.rotationRate?.alpha || 0,
            beta: event.rotationRate?.beta || 0,
            gamma: event.rotationRate?.gamma || 0
          },
          interval: event.interval || 0,
          timestamp: new Date()
        };
        callback(motionData);
      };

      window.addEventListener('devicemotion', motionHandler);
      this.motionListeners.add(callback);
      this.isListeningToMotion = true;

      console.log('✅ Motion detection started');
    } catch (error) {
      console.error('❌ Failed to start motion detection:', error);
      throw error;
    }
  }

  async startOrientationDetection(callback: (data: DeviceOrientationData) => void): Promise<void> {
    try {
      // Request permission for iOS 13+
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission !== 'granted') {
          throw new Error('Orientation permission denied');
        }
      }

      const orientationHandler = (event: DeviceOrientationEvent) => {
        const orientationData: DeviceOrientationData = {
          alpha: event.alpha || 0,
          beta: event.beta || 0,
          gamma: event.gamma || 0,
          absolute: event.absolute || false,
          timestamp: new Date()
        };
        callback(orientationData);
      };

      window.addEventListener('deviceorientation', orientationHandler);
      this.orientationListeners.add(callback);
      this.isListeningToOrientation = true;

      console.log('✅ Orientation detection started');
    } catch (error) {
      console.error('❌ Failed to start orientation detection:', error);
      throw error;
    }
  }

  stopMotionDetection(): void {
    if (this.isListeningToMotion) {
      window.removeEventListener('devicemotion', this.handleDeviceMotion);
      this.motionListeners.clear();
      this.isListeningToMotion = false;
      console.log('🛑 Motion detection stopped');
    }
  }

  stopOrientationDetection(): void {
    if (this.isListeningToOrientation) {
      window.removeEventListener('deviceorientation', this.handleDeviceOrientation);
      this.orientationListeners.clear();
      this.isListeningToOrientation = false;
      console.log('🛑 Orientation detection stopped');
    }
  }

  /**
   * File System Integration
   */
  async pickFiles(options: FilePickerOptions): Promise<File[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options.multiple;
      input.accept = options.accept.join(',');

      input.onchange = (event) => {
        const files = Array.from((event.target as HTMLInputElement).files || []);
        
        // Validate file size
        if (options.maxSize) {
          const oversizedFiles = files.filter(file => file.size > options.maxSize!);
          if (oversizedFiles.length > 0) {
            reject(new Error(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}`));
            return;
          }
        }

        // Validate file count
        if (options.maxFiles && files.length > options.maxFiles) {
          reject(new Error(`Too many files selected. Maximum: ${options.maxFiles}`));
          return;
        }

        resolve(files);
      };

      input.oncancel = () => resolve([]);
      input.click();
    });
  }

  async saveFile(blob: Blob, filename: string): Promise<void> {
    try {
      if ('showSaveFilePicker' in window) {
        // Use File System Access API if available
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Files',
            accept: { '*/*': [] }
          }]
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback to download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      console.log('✅ File saved successfully');
    } catch (error) {
      console.error('❌ Failed to save file:', error);
      throw error;
    }
  }

  /**
   * Native Sharing
   */
  async share(data: ShareData): Promise<boolean> {
    try {
      if (!navigator.share) {
        throw new Error('Web Share API not supported');
      }

      await navigator.share(data);
      console.log('✅ Content shared successfully');
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Share cancelled by user');
        return false;
      }
      console.error('❌ Failed to share:', error);
      throw error;
    }
  }

  /**
   * Haptic Feedback
   */
  vibrate(pattern: number | number[]): boolean {
    try {
      if (!navigator.vibrate) {
        console.warn('Vibration API not supported');
        return false;
      }

      navigator.vibrate(pattern);
      return true;
    } catch (error) {
      console.error('❌ Failed to vibrate:', error);
      return false;
    }
  }

  /**
   * Screen Wake Lock
   */
  async requestWakeLock(): Promise<WakeLockSentinel | null> {
    try {
      if (!('wakeLock' in navigator)) {
        console.warn('Wake Lock API not supported');
        return null;
      }

      const wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('✅ Wake lock acquired');
      return wakeLock;
    } catch (error) {
      console.error('❌ Failed to acquire wake lock:', error);
      return null;
    }
  }

  /**
   * Fullscreen API
   */
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

      console.log('✅ Fullscreen mode activated');
    } catch (error) {
      console.error('❌ Failed to enter fullscreen:', error);
      throw error;
    }
  }

  async exitFullscreen(): Promise<void> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }

      console.log('✅ Fullscreen mode exited');
    } catch (error) {
      console.error('❌ Failed to exit fullscreen:', error);
      throw error;
    }
  }

  /**
   * Device Information
   */
  getDeviceInfo(): {
    userAgent: string;
    platform: string;
    language: string;
    cookieEnabled: boolean;
    onLine: boolean;
    hardwareConcurrency: number;
    maxTouchPoints: number;
    deviceMemory?: number;
    connection?: any;
  } {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      deviceMemory: (navigator as any).deviceMemory,
      connection: (navigator as any).connection
    };
  }

  /**
   * Private helper methods
   */
  private async checkDeviceCapabilities(): Promise<void> {
    const capabilities = {
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      geolocation: 'geolocation' in navigator,
      deviceMotion: 'DeviceMotionEvent' in window,
      deviceOrientation: 'DeviceOrientationEvent' in window,
      vibration: 'vibrate' in navigator,
      wakeLock: 'wakeLock' in navigator,
      fullscreen: 'requestFullscreen' in document.documentElement,
      share: 'share' in navigator,
      fileSystemAccess: 'showOpenFilePicker' in window
    };

    console.log('📱 Device capabilities:', capabilities);
  }

  private handleDeviceMotion = (event: DeviceMotionEvent) => {
    // Handle device motion events
  };

  private handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    // Handle device orientation events
  };
}

// Export singleton instance
export const nativeDeviceIntegration = NativeDeviceIntegration.getInstance();