"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState, useEffect } from 'react';
import { Cookie, X, Settings, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Show banner after 1 second delay
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
        applyCookiePreferences(saved);
      } catch (e) {
        // Error logged
      }
    }
  }, []);

  const applyCookiePreferences = async (prefs: CookiePreferences) => {
    // Apply Google Analytics
    if (prefs.analytics && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }

    // Apply marketing cookies
    if (prefs.marketing && typeof window !== 'undefined') {
      // Enable Facebook Pixel, etc.
      if ((window as any).fbq) {
        (window as any).fbq('consent', 'grant');
      }
    }

    // Store preferences locally
    localStorage.setItem('cookie_consent', JSON.stringify(prefs));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());

    // Log consent to database for compliance audit trail
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from('cookie_consent_log')
      .insert({
        user_id: user?.id || null,
        session_id: localStorage.getItem('session_id') || crypto.randomUUID(),
        preferences: prefs,
        ip_address: null, // Set server-side
        user_agent: navigator.userAgent,
        consented_at: new Date().toISOString()
      });
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    applyCookiePreferences(allAccepted);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(necessaryOnly);
    applyCookiePreferences(necessaryOnly);
    setShowBanner(false);
    setShowSettings(false);
  };

  const savePreferences = () => {
    applyCookiePreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Can't disable necessary cookies
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t-4 border-blue-600 z-[9999] animate-slide-up">
        <div className="max-w-7xl mx-auto p-6">
          {!showSettings ? (
            // Simple Banner
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                  <Cookie className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black mb-2">
                    We Value Your Privacy
                  </h3>
                  <p className="text-sm text-black mb-2">
                    We use cookies to enhance your experience, analyze site traffic, and personalize content.
                    By clicking "Accept All", you consent to our use of cookies.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link href="/privacy-policy" aria-label="Link" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                    <span className="text-gray-400">•</span>
                    <Link href="/cookies" aria-label="Link" className="text-blue-600 hover:underline">
                      Cookie Policy
                    </Link>
                    <span className="text-gray-400">•</span>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Manage Preferences
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={acceptNecessary}
                  className="px-6 py-3 border-2 border-gray-300 text-black rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Necessary Only
                </button>
                <button
                  onClick={acceptAll}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg"
                >
                  Accept All Cookies
                </button>
              </div>
            </div>
          ) : (
            // Detailed Settings
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-black">
                    Cookie Preferences
                  </h3>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Necessary Cookies */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        <h4 className="font-bold text-black">Necessary Cookies</h4>
                        <span className="px-2 py-2 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          Always Active
                        </span>
                      </div>
                      <p className="text-sm text-black">
                        Essential for the website to function properly. These cookies enable basic functions like page navigation,
                        secure areas access, and authentication. The website cannot function properly without these cookies.
                      </p>
                    </div>
                    <div className="ml-4">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-black mb-2">Functional Cookies</h4>
                      <p className="text-sm text-black">
                        Enable enhanced functionality and personalization, such as videos, live chat, and remembering your preferences.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={() => togglePreference('functional')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-black mb-2">Analytics Cookies</h4>
                      <p className="text-sm text-black">
                        Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                        This helps us improve our services.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={() => togglePreference('analytics')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-black mb-2">Marketing Cookies</h4>
                      <p className="text-sm text-black">
                        Used to track visitors across websites to display relevant advertisements. These cookies help us show you
                        content that may be of interest to you.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={() => togglePreference('marketing')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={acceptNecessary}
                  className="px-6 py-3 border-2 border-gray-300 text-black rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Reject All
                </button>
                <button
                  onClick={savePreferences}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
