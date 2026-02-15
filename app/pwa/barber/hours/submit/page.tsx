'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Clock, Camera, Image, X, 
  CheckCircle, Loader2, AlertCircle, Calendar,
  MapPin, FileText
} from 'lucide-react';

type HourCategory = 'practical' | 'theory' | 'sanitation' | 'customer_service';

interface HourSubmission {
  date: string;
  hours: number;
  minutes: number;
  category: HourCategory;
  description: string;
  photoProof: string | null;
  location: string;
}

const CATEGORIES: { value: HourCategory; label: string; description: string }[] = [
  { value: 'practical', label: 'Practical Training', description: 'Hands-on cutting, styling, shaving' },
  { value: 'theory', label: 'Theory/Classroom', description: 'Milady curriculum, state board prep' },
  { value: 'sanitation', label: 'Sanitation', description: 'Cleaning, sterilization, safety' },
  { value: 'customer_service', label: 'Customer Service', description: 'Client interaction, consultation' },
];

export default function SubmitHoursPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [submission, setSubmission] = useState<HourSubmission>({
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    minutes: 0,
    category: 'practical',
    description: '',
    photoProof: null,
    location: '',
  });

  const handlePhotoCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSubmission(prev => ({ ...prev, photoProof: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSubmission(prev => ({ ...prev, photoProof: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (submission.hours === 0 && submission.minutes === 0) {
      setError('Please enter the hours worked');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hours/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submission,
          totalMinutes: submission.hours * 60 + submission.minutes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Submission failed');
      }

      setSuccess(true);
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Hours Submitted!</h1>
          <p className="text-slate-400 mb-2">
            {submission.hours}h {submission.minutes}m of {CATEGORIES.find(c => c.value === submission.category)?.label}
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Your supervisor will review and approve these hours.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setSuccess(false);
                setSubmission({
                  date: new Date().toISOString().split('T')[0],
                  hours: 0,
                  minutes: 0,
                  category: 'practical',
                  description: '',
                  photoProof: null,
                  location: '',
                });
              }}
              className="w-full bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700"
            >
              Submit More Hours
            </button>
            <Link
              href="/pwa/barber"
              className="block w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <Link href="/pwa/barber" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Submit Hours</h1>
            <p className="text-slate-400 text-sm">Log your training time</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Date Selection */}
        <div className="bg-slate-800 rounded-xl p-4">
          <label className="flex items-center gap-3 text-slate-400 text-sm mb-3">
            <Calendar className="w-4 h-4" />
            Date
          </label>
          <input
            type="date"
            value={submission.date}
            onChange={(e) => setSubmission(prev => ({ ...prev, date: e.target.value }))}
            max={new Date().toISOString().split('T')[0]}
            className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>

        {/* Time Entry */}
        <div className="bg-slate-800 rounded-xl p-4">
          <label className="flex items-center gap-3 text-slate-400 text-sm mb-3">
            <Clock className="w-4 h-4" />
            Time Worked
          </label>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={submission.hours}
                  onChange={(e) => setSubmission(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-700 text-white text-center text-2xl font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
                <span className="text-slate-400">hrs</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="15"
                  value={submission.minutes}
                  onChange={(e) => setSubmission(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-700 text-white text-center text-2xl font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
                <span className="text-slate-400">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Selection */}
        <div className="bg-slate-800 rounded-xl p-4">
          <label className="text-slate-400 text-sm mb-3 block">Category</label>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSubmission(prev => ({ ...prev, category: cat.value }))}
                className={`w-full text-left p-3 rounded-xl transition-colors ${
                  submission.category === cat.value
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <div className="font-medium">{cat.label}</div>
                <div className={`text-sm ${submission.category === cat.value ? 'text-brand-blue-200' : 'text-slate-500'}`}>
                  {cat.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="bg-slate-800 rounded-xl p-4">
          <label className="flex items-center gap-3 text-slate-400 text-sm mb-3">
            <MapPin className="w-4 h-4" />
            Location (Optional)
          </label>
          <input
            type="text"
            value={submission.location}
            onChange={(e) => setSubmission(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Shop name or training location"
            className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>

        {/* Description */}
        <div className="bg-slate-800 rounded-xl p-4">
          <label className="flex items-center gap-3 text-slate-400 text-sm mb-3">
            <FileText className="w-4 h-4" />
            Description (Optional)
          </label>
          <textarea
            value={submission.description}
            onChange={(e) => setSubmission(prev => ({ ...prev, description: e.target.value }))}
            placeholder="What did you work on?"
            rows={3}
            className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none"
          />
        </div>

        {/* Photo Proof */}
        <div className="bg-slate-800 rounded-xl p-4">
          <label className="flex items-center gap-3 text-slate-400 text-sm mb-3">
            <Camera className="w-4 h-4" />
            Photo Proof (Optional)
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {submission.photoProof ? (
            <div className="relative">
              <img
                src={submission.photoProof}
                alt="Proof"
                className="w-full h-48 object-cover rounded-xl"
              />
              <button
                onClick={removePhoto}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={handlePhotoCapture}
              className="w-full h-32 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-brand-blue-500 hover:text-brand-blue-400 transition-colors"
            >
              <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                <Image className="w-6 h-6" />
              </div>
              <span className="text-sm">Tap to add photo</span>
            </button>
          )}
          <p className="text-slate-500 text-xs mt-2">
            Adding a photo can help verify your hours faster
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || (submission.hours === 0 && submission.minutes === 0)}
          className="w-full bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Submit Hours
            </>
          )}
        </button>
      </main>
    </div>
  );
}
