'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  MessageCircle,
  Users,
  Clock,
  TrendingUp,
  ExternalLink,
CheckCircle, } from 'lucide-react';

export default function LiveChatPage() {
  const router = useRouter();

  useEffect(() => {
    // Check admin auth
    fetch('/api/auth/check-admin')
      .then((res) => res.json())
      .then((data) => {
        if (!data.isAdmin) {
          router.push('/login?redirect=/admin');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/heroes-hq/contact-hero.jpg"
          alt="Live Chat"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Live Chat' }]} />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-8 h-8 text-brand-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-black">Live Chat</h1>
                <p className="text-black mt-1">
                  Real-time support for students and visitors
                </p>
              </div>
            </div>

            <a
              href="https://dashboard.tawk.to"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <span>Open Chat Dashboard</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Chats"
            value="0"
            icon={MessageCircle}
            color="blue"
          />
          <StatCard
            title="Avg Response Time"
            value="N/A"
            icon={Clock}
            color="green"
          />
          <StatCard
            title="Satisfaction Rate"
            value="N/A"
            icon={CheckCircle}
            color="blue"
          />
          <StatCard
            title="Total Conversations"
            value="0"
            icon={TrendingUp}
            color="orange"
          />
        </div>

        {/* Setup Instructions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-black mb-2">
                1. Create Tawk.to Account (FREE)
              </h3>
              <p className="text-black mb-2">
                Sign up at{' '}
                <a
                  href="https://www.tawk.to"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue-600 hover:underline"
                >
                  tawk.to
                </a>{' '}
                - completely free, no credit card required.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black mb-2">
                2. Get Your Widget Code
              </h3>
              <ol className="list-decimal list-inside text-black space-y-1 ml-4">
                <li>Log in to Tawk.to dashboard</li>
                <li>Go to Administration → Channels → Chat Widget</li>
                <li>Copy your Property ID and Widget ID</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium text-black mb-2">
                3. Add to Environment Variables
              </h3>
              <div className="bg-slate-800 text-gray-100 p-4 rounded-lg font-mono text-sm">
                <div>NEXT_PUBLIC_TAWK_PROPERTY_ID=your_property_id</div>
                <div>NEXT_PUBLIC_TAWK_WIDGET_ID=your_widget_id</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-black mb-2">
                4. Deploy & Test
              </h3>
              <p className="text-black">
                Redeploy your site and the chat widget will appear on all pages
                automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Tawk.to Features (All FREE)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureItem
              title="Unlimited Agents"
              description="Add unlimited staff members to handle chats"
            />
            <FeatureItem
              title="Mobile Apps"
              description="iOS and Android apps for on-the-go support"
            />
            <FeatureItem
              title="Chat History"
              description="Full conversation history and transcripts"
            />
            <FeatureItem
              title="Visitor Monitoring"
              description="See who's on your site in real-time"
            />
            <FeatureItem
              title="Canned Responses"
              description="Quick replies for common questions"
            />
            <FeatureItem
              title="File Sharing"
              description="Share documents and images in chat"
            />
            <FeatureItem
              title="Customization"
              description="Match your brand colors and style"
            />
            <FeatureItem
              title="Analytics"
              description="Detailed reports and insights"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionButton
              title="View Conversations"
              description="See all chat history"
              href="https://dashboard.tawk.to/#/conversations"
            />
            <ActionButton
              title="Manage Agents"
              description="Add or remove staff"
              href="https://dashboard.tawk.to/#/agents"
            />
            <ActionButton
              title="Customize Widget"
              description="Change colors and text"
              href="https://dashboard.tawk.to/#/chat-widget"
            />
          </div>
        </div>

        {/* Alternative Options */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-semibold text-brand-blue-900 mb-2">
            Alternative Chat Solutions
          </h3>
          <div className="space-y-2 text-sm text-brand-blue-800">
            <div>
              • <strong>Intercom</strong>: $74/month - Advanced features, CRM
              integration
            </div>
            <div>
              • <strong>Crisp</strong>: $25/month - Modern UI, chatbots
            </div>
            <div>
              • <strong>Zendesk Chat</strong>: $55/month - Enterprise features
            </div>
            <div>
              • <strong>Tawk.to</strong>: FREE - Recommended for most use cases
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Live Chat Management
                          </h2>
              <p className="text-base md:text-lg mb-8 text-brand-blue-100">
              Monitor and respond to visitor and student conversations.
                          </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/admin/live-chat"
                  className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                >
                Open Chat
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                >
                View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'blue' | 'orange';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'text-brand-blue-600',
    green: 'text-brand-green-600',
    blue: 'text-brand-blue-600',
    orange: 'text-brand-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-8 h-8 ${colorClasses[color]}`} />
      </div>
      <div className="text-2xl font-bold text-black">{value}</div>
      <div className="text-sm text-black">{title}</div>
    </div>
  );
}

interface FeatureItemProps {
  title: string;
  description: string;
}

function FeatureItem({ title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start space-x-3">
      <span className="text-slate-400 flex-shrink-0">•</span>
      <div>
        <div className="font-medium text-black">{title}</div>
        <div className="text-sm text-black">{description}</div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  title: string;
  description: string;
  href: string;
}

function ActionButton({ title, description, href }: ActionButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-4 border-2 border-gray-200 rounded-lg hover:border-brand-blue-500 hover:bg-gray-50 transition-colors"
    >
      <div className="font-medium text-black mb-1">{title}</div>
      <div className="text-sm text-black mb-2">{description}</div>
      <div className="flex items-center text-sm text-brand-blue-600">
        <span>Open</span>
        <ExternalLink className="w-3 h-3 ml-1" />
      </div>
    </a>
  );
}
