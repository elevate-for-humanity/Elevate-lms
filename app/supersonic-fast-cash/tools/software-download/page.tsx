'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState } from 'react';
import {
  Download,
  FileText,
  Circle,
  AlertCircle,
  ExternalLink,
  Key,
} from 'lucide-react';
import Link from 'next/link';



export default function SupersonicFastCashDownloadPage() {
  const [showCredentials, setShowCredentials] = useState(false);

  // SupersonicFastCash credentials are provided to authorized staff only
  // Contact your supervisor for account access
  const sfcCredentials = {
    accountNumber: 'Contact supervisor',
    serialNumber: 'Contact supervisor',
    efilePassword: 'Contact supervisor',
  };

  const sfcProducts = [
    {
      name: 'SupersonicFastCash Tax',
      version: '2024',
      description: 'Professional tax preparation software',
      size: '2.5 GB',
      downloadUrl:
        'https://www.supersonicfastcash.com/downloads/tax/2024/SupersonicFastCashSetup.exe',
      requirements: 'Windows 10/11, 8GB RAM, 10GB disk space',
      features: [
        'All IRS forms and schedules',
        'E-file federal and state returns',
        'Automatic calculations',
        'Error checking and diagnostics',
        'Client portal integration',
        'Bank products integration',
      ],
    },
    {
      name: 'SupersonicFastCash Cloud',
      version: '2024',
      description: 'Cloud-based document management',
      size: 'Web-based',
      downloadUrl: 'https://cloud.supersonicfastcash.com',
      requirements: 'Any modern web browser',
      features: [
        'Secure document storage',
        'Client file sharing',
        'E-signature collection',
        'Mobile access',
        'Automatic backups',
      ],
    },
    {
      name: 'SupersonicFastCash Tools',
      version: '2024',
      description: 'Document scanning and OCR',
      size: '150 MB',
      downloadUrl:
        'https://www.supersonicfastcash.com/downloads/gruntworks/SupersonicToolsSetup.exe',
      requirements: 'Windows 10/11, Scanner compatible',
      features: [
        'W-2 scanning and OCR',
        '1099 form recognition',
        'Receipt scanning',
        'Automatic data extraction',
        'Integration with SupersonicFastCash Tax',
      ],
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "SupersonicFastCash Download" }]} />
      </div>
<div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-blue-100 text-brand-blue-700 px-4 py-2 rounded-full mb-4">
            <Download className="w-4 h-4" />
            <span className="text-sm font-semibold">
              SupersonicFastCash Downloads
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            SupersonicFastCash Tax Software
          </h1>
          <p className="text-xl text-black max-w-2xl mx-auto">
            Download professional tax preparation software. Your account is
            already configured.
          </p>
        </div>

        {/* Credentials Section - For Authorized Staff Only */}
        <div className="bg-slate-700 rounded-2xl shadow-xl p-8 text-white mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">SupersonicFastCash Account Access</h2>
              <p className="text-brand-blue-100">
                For authorized Supersonic Fast Cash staff only
              </p>
            </div>
            <Key className="w-8 h-8 text-brand-blue-200" />
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 mb-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-100 font-semibold mb-1">
                    Restricted Access
                  </p>
                  <p className="text-sm text-yellow-100">
                    SupersonicFastCash software credentials are provided to authorized staff only. 
                    Contact your supervisor or manager to obtain account access.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-brand-green-300" />
                <span>Account credentials managed by IT department</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-brand-green-300" />
                <span>Secure access for certified tax preparers</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-brand-green-300" />
                <span>Training required before software access</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-sm text-brand-blue-100 mb-3">
                <strong>Need Access?</strong> Contact:
              </p>
              <div className="space-y-2 text-sm">
                <div>📧 Email: <a href="mailto:supersonicfastcashllc@gmail.com" className="text-white hover:underline">supersonicfastcashllc@gmail.com</a></div>
                <div>📞 Phone: <a href="/support" className="text-white hover:underline">Visit Support Center</a></div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Products */}
        <div className="space-y-6 mb-12">
          {sfcProducts.map((product, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100 hover:border-brand-green-500 transition"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                  <p className="text-black">{product.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-black">
                    <span>Version: {product.version}</span>
                    <span>•</span>
                    <span>Size: {product.size}</span>
                  </div>
                </div>
                <a
                  href={product.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white rounded-xl font-semibold hover:bg-brand-green-700 transition"
                >
                  <Download className="w-5 h-5" />
                  Download
                </a>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Features:</h4>
                  <ul className="space-y-2">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Circle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">System Requirements:</h4>
                  <p className="text-sm text-black">
                    {product.requirements}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Installation Instructions */}
        <div className="bg-brand-blue-50 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Installation Instructions</h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Download SupersonicFastCash Tax</h3>
                <p className="text-sm text-black">
                  Click the download button above to get the latest version of
                  SupersonicFastCash Tax software.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Run the Installer</h3>
                <p className="text-sm text-black">
                  Double-click SupersonicFastCashSetup.exe and follow the installation
                  wizard.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Enter Your Credentials</h3>
                <p className="text-sm text-black">
                  When prompted, enter your Account Number and Serial Number
                  from above.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Configure E-File</h3>
                <p className="text-sm text-black">
                  Go to Setup → E-File Setup and enter your E-File Password.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                5
              </div>
              <div>
                <h3 className="font-semibold mb-1">Start Preparing Returns</h3>
                <p className="text-sm text-black">
                  You're ready to prepare and e-file tax returns!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Resources */}
        <div className="grid md:grid-cols-3 gap-6">
          <a
            href="https://www.supersonicfastcash.com/support"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
          >
            <FileText className="w-10 h-10 text-brand-blue-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Documentation</h3>
            <p className="text-sm text-black mb-4">
              User guides, tutorials, and help articles
            </p>
            <span className="text-brand-blue-600 font-semibold flex items-center gap-1">
              View Docs <ExternalLink className="w-4 h-4" />
            </span>
          </a>

          <a
            href="https://www.supersonicfastcash.com/training"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
          >
            <Key className="w-10 h-10 text-brand-green-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Training Videos</h3>
            <p className="text-sm text-black mb-4">
              Learn how to use SupersonicFastCash Tax effectively
            </p>
            <span className="text-brand-green-600 font-semibold flex items-center gap-1">
              Watch Videos <ExternalLink className="w-4 h-4" />
            </span>
          </a>

          <Link
            href="/supersonic-fast-cash/training"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
          >
            <Circle className="w-10 h-10 text-brand-blue-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Our Training</h3>
            <p className="text-sm text-black mb-4">
              SupersonicFastCash tax preparation courses
            </p>
            <span className="text-brand-blue-600 font-semibold flex items-center gap-1">
              Start Learning →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
