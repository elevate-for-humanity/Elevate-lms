'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Clock, TrendingUp, Award, Calendar,
  Mail, Phone, AlertTriangle, Loader2, AlertCircle,
  Building2, Users, FileText,
CheckCircle, } from 'lucide-react';

interface WeeklyData {
  weekEnding: string;
  hours: number;
  status: string;
  notes?: string;
}

interface Milestone {
  hours: number;
  title: string;
  achieved: boolean;
}

interface ApprenticeDetails {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  startDate: string;
  totalHours: number;
  weeklyHours: number;
  weeklyAvg: number;
  targetHours: number;
  progress: number;
  nextMilestone: number;
  estimatedCompletion: string | null;
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
}

interface ApprenticeData {
  apprentice: ApprenticeDetails;
  weeklyData: WeeklyData[];
  milestones: Milestone[];
}

function ComplianceStatusBadge({ status }: { status: ApprenticeDetails['complianceStatus'] }) {
  const config = {
    compliant: { bg: 'bg-brand-green-500/20', text: 'text-brand-green-400', label: 'Compliant', icon: CheckCircle },
    warning: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Warning', icon: AlertTriangle },
    'non-compliant': { bg: 'bg-brand-red-500/20', text: 'text-brand-red-400', label: 'Non-Compliant', icon: AlertTriangle },
  };
  const { bg, text, label, icon: Icon } = config[status];
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bg}`}>
      <Icon className={`w-4 h-4 ${text}`} />
      <span className={`text-sm font-medium ${text}`}>{label}</span>
    </div>
  );
}

export default function ApprenticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ApprenticeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApprenticeDetails();
  }, [id]);

  const fetchApprenticeDetails = async () => {
    try {
      const response = await fetch(`/api/pwa/shop-owner/apprentices/${id}`);
      
      if (response.status === 401) {
        setError('Please sign in to view apprentice details');
        setLoading(false);
        return;
      }
      
      if (response.status === 404) {
        setError('Apprentice not found');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch apprentice details');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching apprentice:', err);
      setError('Failed to load apprentice details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-900">Loading apprentice details...</p>
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
            href="/pwa/shop-owner/apprentices"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-medium"
          >
            Back to Apprentices
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { apprentice, weeklyData, milestones } = data;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-slate-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/pwa/shop-owner/apprentices" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{apprentice.name}</h1>
            <p className="text-white text-sm">Apprentice Details</p>
          </div>
          <ComplianceStatusBadge status={apprentice.complianceStatus} />
        </div>

        {/* Progress Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="text-center mb-3">
            <p className="text-4xl font-black text-slate-900">{apprentice.totalHours.toLocaleString()}</p>
            <p className="text-white">of {apprentice.targetHours.toLocaleString()} hours</p>
          </div>
          
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-white rounded-full"
              style={{ width: `${Math.min(apprentice.progress, 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-slate-900 font-bold">{apprentice.progress.toFixed(1)}%</p>
              <p className="text-white text-xs">Complete</p>
            </div>
            <div>
              <p className="text-slate-900 font-bold">{apprentice.weeklyAvg}</p>
              <p className="text-white text-xs">Hrs/Week Avg</p>
            </div>
            <div>
              <p className="text-slate-900 font-bold">{apprentice.weeklyHours}</p>
              <p className="text-white text-xs">This Week</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Contact Info */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h2 className="text-slate-900 font-bold">Contact Information</h2>
          
          {apprentice.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-500" />
              <a href={`mailto:${apprentice.email}`} className="text-brand-blue-400">
                {apprentice.email}
              </a>
            </div>
          )}
          
          {apprentice.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-500" />
              <a href={`tel:${apprentice.phone}`} className="text-brand-blue-400">
                {apprentice.phone}
              </a>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-500" />
            <span className="text-slate-600">
              Started {new Date(apprentice.startDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}
            </span>
          </div>

          {apprentice.estimatedCompletion && (
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-slate-500" />
              <span className="text-slate-600">
                Est. completion: {new Date(apprentice.estimatedCompletion).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        {/* Milestones */}
        <div>
          <h2 className="text-slate-900 font-bold mb-4">Milestones</h2>
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <div 
                key={milestone.hours}
                className={`rounded-xl p-4 ${
                  milestone.achieved 
                    ? 'bg-brand-green-500/20 border border-brand-green-500/30' 
                    : 'bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    milestone.achieved ? 'bg-brand-green-500' : 'bg-slate-700'
                  }`}>
                    <Award className={`w-5 h-5 ${milestone.achieved ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${milestone.achieved ? 'text-white' : 'text-white'}`}>
                      {milestone.title}
                    </p>
                    <p className={`text-sm ${milestone.achieved ? 'text-brand-green-300' : 'text-slate-400'}`}>
                      {milestone.hours.toLocaleString()} hours
                    </p>
                  </div>
                  {milestone.achieved && (
                    <span className="text-slate-500 flex-shrink-0">•</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly History */}
        <div>
          <h2 className="text-slate-900 font-bold mb-4">Recent Weeks</h2>
          {weeklyData.length > 0 ? (
            <div className="space-y-3">
              {weeklyData.map((week, index) => {
                const weekDate = new Date(week.weekEnding);
                return (
                  <div key={index} className="bg-white rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-slate-900 font-medium">
                          Week of {weekDate.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-slate-500 text-sm capitalize">{week.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">{week.hours}</p>
                        <p className="text-slate-500 text-sm">hours</p>
                      </div>
                    </div>
                    {week.notes && (
                      <p className="text-slate-500 text-sm mt-2 pt-2 border-t border-slate-700">
                        {week.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 text-center">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No hours logged yet</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Link 
            href={`/pwa/shop-owner/log-hours?apprentice=${id}`}
            className="flex items-center justify-center gap-2 w-full bg-brand-blue-600 text-white py-4 rounded-xl font-medium"
          >
            <Clock className="w-5 h-5" />
            Log Hours for {apprentice.name.split(' ')[0]}
          </Link>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/shop-owner" className="flex flex-col items-center gap-1 text-slate-400">
            <Building2 className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/shop-owner/log-hours" className="flex flex-col items-center gap-1 text-slate-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/shop-owner/apprentices" className="flex flex-col items-center gap-1 text-brand-blue-400">
            <Users className="w-6 h-6" />
            <span className="text-xs">Team</span>
          </Link>
          <Link href="/pwa/shop-owner/reports" className="flex flex-col items-center gap-1 text-slate-400">
            <FileText className="w-6 h-6" />
            <span className="text-xs">Reports</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
