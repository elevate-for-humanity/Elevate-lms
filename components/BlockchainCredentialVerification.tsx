"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Credential {
  id: string;
  type: 'certificate' | 'badge' | 'degree';
  title: string;
  issuer: string;
  issueDate: string;
  blockchainHash: string;
  verificationUrl: string;
  status: 'verified' | 'pending' | 'revoked';
  metadata: {
    skills: string[];
    grade?: string;
    credits?: number;
  };
}

export function BlockchainCredentialVerification() {
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<Credential | null>(null);
  const [activeTab, setActiveTab] = useState<'verify' | 'my-credentials'>('verify');

  const myCredentials: Credential[] = [
    {
      id: '1',
      type: 'certificate',
      title: 'Full-Stack Web Development',
      issuer: 'Elevate for Humanity',
      issueDate: '2024-01-15',
      blockchainHash: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      verificationUrl: 'https://verify.elevateforhumanity.com/cert/abc123',
      status: 'verified',
      metadata: {
        skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
        grade: 'A',
      },
    },
    {
      id: '2',
      type: 'badge',
      title: 'JavaScript Expert',
      issuer: 'Elevate for Humanity',
      issueDate: '2024-01-10',
      blockchainHash: '0x3c2c2eb7b11a91385f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ea',
      verificationUrl: 'https://verify.elevateforhumanity.com/badge/xyz789',
      status: 'verified',
      metadata: {
        skills: ['ES6+', 'Async Programming', 'Design Patterns'],
      },
    },
    {
      id: '3',
      type: 'certificate',
      title: 'AWS Cloud Practitioner',
      issuer: 'Amazon Web Services',
      issueDate: '2023-12-20',
      blockchainHash: '0x91385f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ea3c2c2eb7b11a',
      verificationUrl: 'https://verify.aws.com/cert/def456',
      status: 'verified',
      metadata: {
        skills: ['Cloud Computing', 'AWS Services', 'Security'],
      },
    },
  ];

  const handleVerify = () => {
    // Simulate verification
    const mockCredential: Credential = {
      id: 'verified-1',
      type: 'certificate',
      title: 'Full-Stack Web Development',
      issuer: 'Elevate for Humanity',
      issueDate: '2024-01-15',
      blockchainHash: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      verificationUrl: 'https://verify.elevateforhumanity.com/cert/abc123',
      status: 'verified',
      metadata: {
        skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
        grade: 'A',
      },
    };
    setVerificationResult(mockCredential);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Blockchain Credential Verification</h1>
          <p className="text-red-100">Secure, tamper-proof credential verification</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6 mb-8   ">
          <div className="flex items-start gap-4">
            <div className="text-5xl text-3xl md:text-4xl lg:text-5xl">🔐</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Blockchain-Secured Credentials</h3>
              <p className="text-black mb-3">
                All credentials issued through Elevate for Humanity are recorded on the blockchain, ensuring they cannot be
                forged, altered, or falsified. Employers and institutions can instantly verify authenticity.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">•</span>
                  <span>Immutable records</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">•</span>
                  <span>Instant verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">•</span>
                  <span>Globally accessible</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="bg-white border-b mb-8 rounded-lg">
          <div className="flex gap-8 px-6">
            {(['verify', 'my-credentials'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium ${
                  activeTab === tab ? 'border-red-600 text-brand-orange-600' : 'border-transparent text-gray-500'
                }`}
              >
                {tab === 'verify' ? 'Verify Credential' : 'My Credentials'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'verify' && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Verify a Credential</h2>
              <p className="text-black text-center mb-6">
                Enter the verification code or blockchain hash to verify authenticity
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Verification Code or Hash</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="e.g., ABC123 or 0x7f9fade1c0d57a7af66ab4ead79fade..."
                    value={verificationCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setVerificationCode(e.target.value)}
                  />
                </div>

                <Button onClick={handleVerify} className="w-full">
                  Verify Credential
                </Button>
              </div>

              {verificationResult && (
                <div className="mt-8 p-6 bg-green-50 border-2 border-green-500 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-4xl text-2xl md:text-3xl lg:text-4xl">•</div>
                    <div>
                      <h3 className="text-xl font-bold text-green-900">Credential Verified</h3>
                      <p className="text-sm text-green-700">This credential is authentic and valid</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-green-200">
                      <span className="text-green-700 font-medium">Type:</span>
                      <span className="text-green-900 capitalize">{verificationResult.type}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-green-200">
                      <span className="text-green-700 font-medium">Title:</span>
                      <span className="text-green-900">{verificationResult.title}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-green-200">
                      <span className="text-green-700 font-medium">Issuer:</span>
                      <span className="text-green-900">{verificationResult.issuer}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-green-200">
                      <span className="text-green-700 font-medium">Issue Date:</span>
                      <span className="text-green-900">{verificationResult.issueDate}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-green-200">
                      <span className="text-green-700 font-medium">Status:</span>
                      <span className="text-green-900 capitalize">{verificationResult.status}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white rounded">
                    <p className="text-xs font-semibold text-black mb-1">Blockchain Hash:</p>
                    <p className="text-xs text-black font-mono break-all">
                      {verificationResult.blockchainHash}
                    </p>
                  </div>

                  {verificationResult.metadata.skills && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-green-900 mb-2">Skills Verified:</p>
                      <div className="flex flex-wrap gap-2">
                        {verificationResult.metadata.skills.map((skill) => (
                          <span key={skill} className="px-3 py-2 bg-green-200 text-green-800 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-6 mt-6">
              <h3 className="font-bold mb-3">How It Works</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Credential Issued</h4>
                    <p className="text-xs text-black">
                      When you earn a credential, it's recorded on the blockchain with a unique hash
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Verification Code Generated</h4>
                    <p className="text-xs text-black">
                      A unique verification code is created and linked to the blockchain record
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Instant Verification</h4>
                    <p className="text-xs text-black">
                      Anyone can verify the credential by entering the code or blockchain hash
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'my-credentials' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">My Verified Credentials</h2>
              <Button variant="secondary">Export All</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCredentials.map((credential) => (
                <Card key={credential.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-4xl text-2xl md:text-3xl lg:text-4xl">
                      {credential.type === 'certificate' ? '📜' :
                       credential.type === 'badge' ? '🏆' : '🎓'}
                    </div>
                    <span className={`px-3 py-2 rounded text-xs font-medium ${
                      credential.status === 'verified' ? 'bg-green-100 text-green-700' :
                      credential.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {credential.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-2">{credential.title}</h3>
                  <p className="text-sm text-black mb-1">{credential.issuer}</p>
                  <p className="text-xs text-gray-500 mb-4">Issued: {credential.issueDate}</p>

                  {credential.metadata.skills && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-black mb-2">Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {credential.metadata.skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4 p-2 bg-gray-50 rounded">
                    <p className="text-xs font-semibold text-black mb-1">Blockchain Hash:</p>
                    <p className="text-xs text-black font-mono truncate">
                      {credential.blockchainHash}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button size="sm" className="w-full">Share on LinkedIn</Button>
                    <Button size="sm" variant="secondary" className="w-full">
                      Copy Verification Link
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
