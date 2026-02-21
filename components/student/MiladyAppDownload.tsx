"use client";

import { Smartphone, Download, ExternalLink } from 'lucide-react';
import Image from 'next/image';

export default function MiladyAppDownload() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 text-white">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 p-1.5">
          <Image alt="Milady app download" loading="lazy"
            src="/images/milady-logo.jpg"
            alt="Milady"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
        <h3 className="text-lg font-bold mb-2">📱 Learn on the Go</h3>
        <p className="text-brand-blue-100 text-sm">
          Download the Milady mobile app for iOS or Android
        </p>
      </div>

      <div className="space-y-3 mb-4">
        <a
          href="https://apps.apple.com/us/app/thinkific/id1471012001"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 py-3 bg-white text-brand-blue-600 rounded-lg hover:bg-gray-50 font-semibold transition-all text-center shadow-md group"
        >
          <Download className="w-4 h-4 inline mr-2 group-hover:animate-bounce" />
          Download for iPhone/iPad
        </a>
        <a
          href="https://play.google.com/store/apps/details?id=com.thinkific.mobile"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 py-3 bg-white text-brand-blue-600 rounded-lg hover:bg-gray-50 font-semibold transition-all text-center shadow-md group"
        >
          <Download className="w-4 h-4 inline mr-2 group-hover:animate-bounce" />
          Download for Android
        </a>
      </div>

      <div className="bg-white/10 rounded-lg p-4 mb-4">
        <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          How to Access:
        </h4>
        <ol className="text-brand-blue-100 text-xs space-y-1 list-decimal list-inside">
          <li>Download the Thinkific app</li>
          <li>Open the app and tap "Login"</li>
          <li>
            Enter:{' '}
            <span className="font-semibold text-white">miladytraining.com</span>
          </li>
          <li>Login with your Milady credentials</li>
          <li>Start learning anywhere, anytime!</li>
        </ol>
      </div>

      <div className="pt-4 border-t border-white/20">
        <p className="text-brand-blue-100 text-xs text-center mb-3">
          Access your courses anywhere, anytime
        </p>
        <a
          href="https://www.miladytraining.com/users/sign_in"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-center text-sm font-medium transition-all"
        >
          <ExternalLink className="w-3 h-3 inline mr-1" />
          Or login on web browser
        </a>
      </div>
    </div>
  );
}
