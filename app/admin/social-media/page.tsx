'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import {
  Plus,
  Calendar,
  TrendingUp,
  Users,
  Share2,
  Facebook,
  Linkedin,
  Instagram,
  Clock,
  Play,
  Pause,
  Edit,
  Trash2,
  BarChart3,
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  frequency: '3x-daily' | 'daily' | 'weekly';
  platforms: string[];
  postsScheduled: number;
  lastPost: string | null;
  nextPost: string | null;
}

export default function SocialMediaPage() {
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

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Barber Program Promotion',
      status: 'active',
      frequency: '3x-daily',
      platforms: ['facebook', 'instagram', 'linkedin'],
      postsScheduled: 90,
      lastPost: '2025-12-07T10:00:00Z',
      nextPost: '2025-12-07T14:00:00Z',
    },
    {
      id: '2',
      name: 'Student Success Stories',
      status: 'active',
      frequency: '3x-daily',
      platforms: ['facebook', 'instagram', 'linkedin'],
      postsScheduled: 60,
      lastPost: '2025-12-07T09:30:00Z',
      nextPost: '2025-12-07T13:30:00Z',
    },
    {
      id: '3',
      name: 'WIOA Eligibility Info',
      status: 'paused',
      frequency: 'daily',
      platforms: ['facebook', 'linkedin'],
      postsScheduled: 30,
      lastPost: '2025-12-06T12:00:00Z',
      nextPost: null,
    },
  ]);

  const toggleStatus = (id: string) => {
    setCampaigns(
      campaigns.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'active' ? 'paused' : 'active' }
          : c
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-[300px] md:h-[380px] lg:h-[420px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes-hq/success-stories-hero.jpg"
          alt="Social Media"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-2xl">
            Social Media
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100 drop-shadow-lg">
            Transform your career with free training and industry certifications
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/programs"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Social Media' }]} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Social Media Automation
              </h1>
              <p className="text-black mt-1" />
            </div>

            <button
              onClick={() => router.push('/admin/social-media/campaigns/new')}
              className="flex items-center space-x-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Share2 className="w-8 h-8 text-brand-blue-600" />
            </div>
            <div className="text-2xl font-bold text-black">
              {campaigns.filter((c) => c.status === 'active').length}
            </div>
            <div className="text-sm text-black">Active Campaigns</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-brand-green-600" />
            </div>
            <div className="text-2xl font-bold text-black">
              {campaigns.reduce((sum, c) => sum + c.postsScheduled, 0)}
            </div>
            <div className="text-sm text-black">Posts Scheduled</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-brand-blue-600" />
            </div>
            <div className="text-2xl font-bold text-black">3x Daily</div>
            <div className="text-sm text-black">Post Frequency</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-brand-orange-600" />
            </div>
            <div className="text-2xl font-bold text-black">4</div>
            <div className="text-sm text-black">Connected Platforms</div>
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">
            Connected Platforms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <PlatformCard
              name="Facebook"
              icon={Facebook}
              color="blue"
              connected
              followers="2,847"
            />
            <PlatformCard
              name="Twitter"
              icon={Share2}
              color="sky"
              connected
              followers="1,234"
            />
            <PlatformCard
              name="LinkedIn"
              icon={Linkedin}
              color="blue"
              connected
              followers="856"
            />
            <PlatformCard
              name="Instagram"
              icon={Instagram}
              color="pink"
              connected
              followers="3,421"
            />
          </div>
        </div>

        {/* Posting Schedule */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">
            Daily Posting Schedule (3x Daily)
          </h2>
          <div className="space-y-4">
            <ScheduleSlot
              time="9:00 AM EST"
              status="completed"
              campaign="Barber Program Promotion"
            />
            <ScheduleSlot
              time="1:00 PM EST"
              status="upcoming"
              campaign="Student Success Stories"
            />
            <ScheduleSlot
              time="5:00 PM EST"
              status="scheduled"
              campaign="WIOA Eligibility Info"
            />
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black">
              Your Campaigns
            </h2>
            <button
              onClick={() => router.push('/admin/social-media/analytics')}
              className="flex items-center space-x-2 text-brand-blue-600 hover:text-brand-blue-700"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Analytics</span>
            </button>
          </div>

          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-black">
                        {campaign.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'active'
                            ? 'bg-brand-green-100 text-green-800'
                            : campaign.status === 'paused'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-black'
                        }`}
                      >
                        {campaign.status === 'active'
                          ? '● Active'
                          : campaign.status === 'paused'
                            ? '⏸ Paused'
                            : '○ Draft'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-black mb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {campaign.frequency === '3x-daily'
                            ? '3x Daily'
                            : campaign.frequency}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{campaign.postsScheduled} posts scheduled</span>
                      </div>
                      {campaign.nextPost && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            Next:{' '}
                            {new Date(campaign.nextPost).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {campaign.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="inline-flex items-center px-2 py-2 rounded-md text-xs font-medium bg-brand-blue-100 text-brand-blue-800"
                        >
                          {platform === 'facebook' && (
                            <Facebook className="w-3 h-3 mr-1" />
                          )}
                          {platform === 'linkedin' && (
                            <Linkedin className="w-3 h-3 mr-1" />
                          )}
                          {platform === 'instagram' && (
                            <Instagram className="w-3 h-3 mr-1" />
                          )}
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleStatus(campaign.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        campaign.status === 'active'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-brand-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={
                        campaign.status === 'active' ? 'Pause' : 'Activate'
                      }
                    >
                      {campaign.status === 'active' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() =>
                        router.push(
                          `/admin/social-media/campaigns/${campaign.id}/edit`
                        )
                      }
                      className="p-2 bg-brand-blue-100 text-brand-blue-700 rounded-lg hover:bg-brand-blue-200 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Delete this campaign?')) {
                          setCampaigns(
                            campaigns.filter((c) => c.id !== campaign.id)
                          );
                        }
                      }}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Storytelling Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                    Your Journey Starts Here
                  </h2>
                  <p className="text-lg text-black mb-6 leading-relaxed">
                    Every great career begins with a single step. Whether you're
                    looking to change careers, upgrade your skills, or enter the
                    workforce for the first time, we're here to help you
                    succeed. Our programs are Funded, government-funded, and
                    designed to get you hired fast.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Funded training - no tuition, no hidden costs
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Industry-recognized certifications that employers value
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Job placement assistance and career support
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Flexible scheduling for working adults
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/heroes/training-provider-1.jpg"
                    alt="Students learning"
                    fill
                    className="object-cover"
                    quality={100}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16    text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Ready to Improve Your Career?
              </h2>
              <p className="text-base md:text-lg mb-8 text-brand-blue-100">
                Explore training programs and earn industry certifications through Elevate for
                free training programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                >
                  Apply Now - It's Free
                </Link>
                <Link
                  href="/programs"
                  className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                >
                  Browse All Programs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

interface PlatformCardProps {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  connected: boolean;
  followers: string;
}

function PlatformCard({
  name,
  icon: Icon,
  color,
  connected,
  followers,
}: PlatformCardProps) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-8 h-8 text-${color}-600`} />
        {connected && (
          <span className="inline-flex items-center px-2 py-2 rounded-full text-xs font-medium bg-brand-green-100 text-green-800">
            ● Connected
          </span>
        )}
      </div>
      <h3 className="font-semibold text-black mb-1">{name}</h3>
      <p className="text-sm text-black">{followers} followers</p>
    </div>
  );
}

interface ScheduleSlotProps {
  time: string;
  status: 'completed' | 'upcoming' | 'scheduled';
  campaign: string;
}

function ScheduleSlot({ time, status, campaign }: ScheduleSlotProps) {
  const statusColors = {
    completed: 'bg-brand-green-100 text-green-800',
    upcoming: 'bg-brand-blue-100 text-brand-blue-800',
    scheduled: 'bg-gray-100 text-black',
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-4">
        <Clock className="w-5 h-5 text-black" />
        <div>
          <div className="font-medium text-black">{time}</div>
          <div className="text-sm text-black">{campaign}</div>
        </div>
      </div>
      <span
        className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium ${statusColors[status]}`}
      >
        {status === 'completed'
          ? '• Posted'
          : status === 'upcoming'
            ? '→ Next'
            : '○ Scheduled'}
      </span>
    </div>
  );
}
