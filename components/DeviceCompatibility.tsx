"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Smartphone } from 'lucide-react';

interface CompatibilityCheck {
  name: string;
  supported: boolean;
  message: string;
}

export default function DeviceCompatibility() {
  const [checks, setChecks] = useState<CompatibilityCheck[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    runCompatibilityChecks();
    detectDevice();
  }, []);

  const runCompatibilityChecks = () => {
    const results: CompatibilityCheck[] = [];

    // Service Worker
    results.push({
      name: 'Service Worker',
      supported: 'serviceWorker' in navigator,
      message:
        'serviceWorker' in navigator
          ? 'Offline support available'
          : 'Offline features not supported',
    });

    // Push Notifications
    results.push({
      name: 'Push Notifications',
      supported: 'Notification' in window && 'PushManager' in window,
      message:
        'Notification' in window && 'PushManager' in window
          ? 'Push notifications available'
          : 'Push notifications not supported',
    });

    // IndexedDB
    results.push({
      name: 'IndexedDB',
      supported: 'indexedDB' in window,
      message:
        'indexedDB' in window
          ? 'Offline data storage available'
          : 'Offline storage not supported',
    });

    // Background Sync
    results.push({
      name: 'Background Sync',
      supported: 'sync' in ServiceWorkerRegistration.prototype,
      message:
        'sync' in ServiceWorkerRegistration.prototype
          ? 'Background sync available'
          : 'Background sync not supported',
    });

    // Web Share API
    results.push({
      name: 'Web Share',
      supported: 'share' in navigator,
      message:
        'share' in navigator
          ? 'Native sharing available'
          : 'Web share not supported',
    });

    // Geolocation
    results.push({
      name: 'Geolocation',
      supported: 'geolocation' in navigator,
      message:
        'geolocation' in navigator
          ? 'Location services available'
          : 'Geolocation not supported',
    });

    // Camera/Media
    results.push({
      name: 'Camera Access',
      supported:
        'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      message:
        'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
          ? 'Camera access available'
          : 'Camera access not supported',
    });

    // Touch Events
    results.push({
      name: 'Touch Events',
      supported: 'ontouchstart' in window,
      message:
        'ontouchstart' in window
          ? 'Touch interface detected'
          : 'Touch not detected (desktop)',
    });

    setChecks(results);
  };

  const detectDevice = () => {
    const ua = navigator.userAgent;
    const info: any = {
      platform: navigator.platform,
      userAgent: ua,
      vendor: navigator.vendor,
      language: navigator.language,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
    };

    // Detect OS
    if (/iPad|iPhone|iPod/.test(ua)) {
      info.os = 'iOS';
      info.device = /iPad/.test(ua) ? 'iPad' : 'iPhone';
    } else if (/Android/.test(ua)) {
      info.os = 'Android';
      info.device = /Mobile/.test(ua) ? 'Phone' : 'Tablet';
    } else if (/Windows/.test(ua)) {
      info.os = 'Windows';
      info.device = 'Desktop';
    } else if (/Mac/.test(ua)) {
      info.os = 'macOS';
      info.device = 'Desktop';
    } else if (/Linux/.test(ua)) {
      info.os = 'Linux';
      info.device = 'Desktop';
    } else {
      info.os = 'Unknown';
      info.device = 'Unknown';
    }

    // Detect browser
    if (/Chrome/.test(ua) && !/Edge/.test(ua)) {
      info.browser = 'Chrome';
    } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
      info.browser = 'Safari';
    } else if (/Firefox/.test(ua)) {
      info.browser = 'Firefox';
    } else if (/Edge/.test(ua)) {
      info.browser = 'Edge';
    } else {
      info.browser = 'Unknown';
    }

    // Screen info
    info.screen = {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      pixelRatio: window.devicePixelRatio,
    };

    // Network info
    const connection = (navigator as string).connection;
    if (connection) {
      info.network = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }

    setDeviceInfo(info);
  };

  const supportedCount = checks.filter((c) => c.supported).length;
  const totalCount = checks.length;
  const compatibilityPercent = (supportedCount / totalCount) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-brand-blue-100 rounded-full flex items-center justify-center">
          <Smartphone size={32} className="text-brand-orange-600" />
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">
          Device Compatibility
        </h1>
        <p className="text-black">
          {supportedCount} of {totalCount} features supported (
          {Math.round(compatibilityPercent)}%)
        </p>
      </div>
      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="   h-full transition-all duration-500"
          style={{ width: `${compatibilityPercent}%` }}
        />
      </div>
      {/* Device Info */}
      {deviceInfo && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-black mb-4">
            Device Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-black">Operating System</div>
              <div className="font-medium text-black">{deviceInfo.os}</div>
            </div>
            <div>
              <div className="text-black">Device Type</div>
              <div className="font-medium text-black">
                {deviceInfo.device}
              </div>
            </div>
            <div>
              <div className="text-black">Browser</div>
              <div className="font-medium text-black">
                {deviceInfo.browser}
              </div>
            </div>
            <div>
              <div className="text-black">Screen Size</div>
              <div className="font-medium text-black">
                {deviceInfo.screen.width} × {deviceInfo.screen.height}
              </div>
            </div>
            <div>
              <div className="text-black">Pixel Ratio</div>
              <div className="font-medium text-black">
                {deviceInfo.screen.pixelRatio}x
              </div>
            </div>
            <div>
              <div className="text-black">Online Status</div>
              <div className="font-medium text-black">
                {deviceInfo.online ? 'Online' : 'Offline'}
              </div>
            </div>
            {deviceInfo.network && (
              <>
                <div>
                  <div className="text-black">Connection Type</div>
                  <div className="font-medium text-black">
                    {deviceInfo.network.effectiveType?.toUpperCase() ||
                      'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-black">Download Speed</div>
                  <div className="font-medium text-black">
                    {deviceInfo.network.downlink
                      ? `${deviceInfo.network.downlink} Mbps`
                      : 'Unknown'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Feature Support */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-black">Feature Support</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {checks.map((check, index) => (
            <div key={index} className="px-6 py-4 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {check.supported ? (
                  <CheckCircle2 size={20} className="text-green-500" />
                ) : (
                  <XCircle size={20} className="text-red-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-black">{check.name}</div>
                <div className="text-sm text-black">{check.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Recommendations */}
      {compatibilityPercent < 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-yellow-600 flex-shrink-0 mt-0.5"
            />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Recommendations
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                {!checks.find((c) => c.name === 'Service Worker')
                  ?.supported && (
                  <li>
                    • Use a modern browser (Chrome, Firefox, Safari) for offline
                    support
                  </li>
                )}
                {!checks.find((c) => c.name === 'Push Notifications')
                  ?.supported && (
                  <li>
                    • Push notifications require HTTPS and a compatible browser
                  </li>
                )}
                {deviceInfo?.os === 'iOS' && (
                  <li>
                    • iOS has limited PWA support - some features may not work
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
