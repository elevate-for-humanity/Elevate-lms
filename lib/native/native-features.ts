
/**
 * Native Features - Camera, Biometrics, Geolocation, etc.
 */

// Camera API
export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

export async function capturePhoto(
  options: CameraOptions = {}
): Promise<Blob | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: options.facingMode || 'environment',
        width: options.width || 1280,
        height: options.height || 720,
      },
    });

    // Create video element
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play().catch(() => {});

    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    // Create canvas and capture frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    // Stop stream
    stream.getTracks().forEach((track) => track.stop());

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return null;
  }
}

export async function scanQRCode(): Promise<string | null> {
  try {
    // Check if BarcodeDetector is available
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as string).BarcodeDetector({
        formats: ['qr_code'],
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play().catch(() => {});

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      // Capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Detect barcodes
      const barcodes = await barcodeDetector.detect(canvas);

      // Stop stream
      stream.getTracks().forEach((track) => track.stop());

      if (barcodes.length > 0) {
        return barcodes[0].rawValue;
      }
    }

    return null;
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return null;
  }
}

// Biometric Authentication
export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    // Check if Web Authentication API is available
    if (!window.PublicKeyCredential) {
      return false;
    }

    // Check if biometric authentication is available
    const available =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) {
      return false;
    }

    // Create credential options
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Elevate For Humanity',
        id: window.location.hostname,
      },
      user: {
        id: new Uint8Array(16),
        name: 'user@elevateforhumanity.org',
        displayName: 'User',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 60000,
    };

    // Request authentication
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions,
    });

    return credential !== null;
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return false;
  }
}

export async function verifyBiometrics(credentialId: string): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) {
      return false;
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'required',
      allowCredentials: [
        {
          type: 'public-key',
          id: Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0)),
        },
      ],
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions,
    });

    return assertion !== null;
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return false;
  }
}

// Geolocation
export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export async function getCurrentLocation(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
        });
      },
      (error) => {
        // Error: $1
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

export function watchLocation(
  callback: (position: GeolocationPosition) => void,
  errorCallback?: (error: GeolocationPositionError) => void
): number | null {
  if (!navigator.geolocation) {
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
      });
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

export function clearLocationWatch(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

// Device Vibration
export function vibrate(pattern: number | number[]): boolean {
  if (!navigator.vibrate) {
    return false;
  }
  return navigator.vibrate(pattern);
}

// Share API
export async function shareContent(data: {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}): Promise<boolean> {
  try {
    if (!navigator.share) {
      return false;
    }

    await navigator.share(data);
    return true;
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return false;
  }
}

// Device Orientation
export interface DeviceOrientation {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean;
}

export function watchOrientation(
  callback: (orientation: DeviceOrientation) => void
): () => void {
  const handler = (event: DeviceOrientationEvent) => {
    callback({
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
      absolute: event.absolute,
    });
  };

  window.addEventListener('deviceorientation', handler);

  return () => {
    window.removeEventListener('deviceorientation', handler);
  };
}

// Battery Status
export async function getBatteryStatus(): Promise<{
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
} | null> {
  try {
    if ('getBattery' in navigator) {
      const battery = await (navigator as string).getBattery();
      return {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
      };
    }
    return null;
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return null;
  }
}

// Network Information
export function getNetworkInfo(): {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
} {
  const connection =
    (navigator as string).connection ||
    (navigator as string).mozConnection ||
    (navigator as string).webkitConnection;

  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
    saveData: connection?.saveData,
  };
}

export function watchNetworkStatus(
  callback: (online: boolean) => void
): () => void {
  const onlineHandler = () => callback(true);
  const offlineHandler = () => callback(false);

  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);

  return () => {
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  };
}

// Screen Wake Lock
export async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  try {
    if ('wakeLock' in navigator) {
      return await navigator.wakeLock.request('screen');
    }
    return null;
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return null;
  }
}

// Clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return false;
  }
}

export async function readFromClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return null;
  }
}
