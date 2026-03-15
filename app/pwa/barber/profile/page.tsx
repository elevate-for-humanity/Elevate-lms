'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar,
  Award, Clock, TrendingUp, Edit2, Loader2, AlertCircle,
  Scissors, BookOpen
} from 'lucide-react';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  shopName: string;
  shopCity?: string;
  shopState?: string;
  startDate: string;
  totalHours: number;
  targetHours: number;
  milestonesAchieved: number;
  totalMilestones: number;
}

export default function BarberProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/pwa/barber/profile');
      
      if (response.status === 401) {
        setError('Please sign in to view your profile');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-900">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-brand-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Unable to Load</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link
            href="/login?redirect=/pwa/barber/profile"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const progressPercent = (profile.totalHours / profile.targetHours) * 100;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-brand-blue-600 px-4 pt-12 pb-8 safe-area-inset-top">
        <div className="flex items-center justify-between mb-6">
          <Link href="/pwa/barber" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Edit2 className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl font-bold text-white">
              {profile.name.charAt(0)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{profile.name}</h1>
          <p className="text-brand-blue-200">Barber Apprentice</p>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Progress Card */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500">Overall Progress</span>
            <span className="text-white font-bold">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-white rounded-full"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{profile.totalHours.toLocaleString()} hours</span>
            <span className="text-slate-500">{profile.targetHours.toLocaleString()} goal</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4">
            <Clock className="w-6 h-6 text-brand-blue-400 mb-2" />
            <p className="text-2xl font-bold text-slate-900">{profile.totalHours.toLocaleString()}</p>
            <p className="text-slate-500 text-sm">Total Hours</p>
          </div>
          <div className="bg-white rounded-xl p-4">
            <Award className="w-6 h-6 text-amber-400 mb-2" />
            <p className="text-2xl font-bold text-slate-900">{profile.milestonesAchieved}/{profile.totalMilestones}</p>
            <p className="text-slate-500 text-sm">Milestones</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl p-4 space-y-4">
          <h2 className="text-slate-900 font-bold">Contact Information</h2>
          
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-slate-500" />
            <span className="text-slate-600">{profile.email}</span>
          </div>
          
          {profile.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-500" />
              <span className="text-slate-600">{profile.phone}</span>
            </div>
          )}
        </div>

        {/* Training Location */}
        <div className="bg-white rounded-xl p-4 space-y-4">
          <h2 className="text-slate-900 font-bold">Training Location</h2>
          
          <div className="flex items-center gap-3">
            <Scissors className="w-5 h-5 text-brand-blue-400" />
            <span className="text-white">{profile.shopName}</span>
          </div>
          
          {(profile.shopCity || profile.shopState) && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-500" />
              <span className="text-slate-600">
                {[profile.shopCity, profile.shopState].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-500" />
            <span className="text-slate-600">
              Started {new Date(profile.startDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/barber" className="flex flex-col items-center gap-1 text-slate-400">
            <Scissors className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/barber/log-hours" className="flex flex-col items-center gap-1 text-slate-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/barber/training" className="flex flex-col items-center gap-1 text-slate-400">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs">Learn</span>
          </Link>
          <Link href="/pwa/barber/progress" className="flex flex-col items-center gap-1 text-slate-400">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Progress</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
