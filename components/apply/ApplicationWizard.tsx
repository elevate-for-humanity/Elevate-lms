'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  Upload,
  DollarSign,
  Users,
  FileText,
  Shield,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';

// Step configuration
const STEPS = [
  { id: 'program', title: 'Choose Program', icon: GraduationCap },
  { id: 'personal', title: 'Personal Info', icon: Users },
  { id: 'contact', title: 'Contact', icon: Phone },
  { id: 'funding', title: 'Funding', icon: DollarSign },
  { id: 'documents', title: 'Documents', icon: FileText },
  { id: 'review', title: 'Review', icon: CheckCircle },
];

// Programs data
const PROGRAMS = [
  { id: 'barber', name: 'Barbering', duration: '52 weeks', credential: 'Indiana Barber License' },
  { id: 'cosmetology', name: 'Cosmetology', duration: '52 weeks', credential: 'Indiana Cosmetology License' },
  { id: 'hvac', name: 'HVAC/R Technician', duration: '48 weeks', credential: 'EPA 608 Certification' },
  { id: 'cna', name: 'CNA + Medication Aide', duration: '16 weeks', credential: 'CNA License' },
  { id: 'cdl', name: 'CDL Class A', duration: '8 weeks', credential: 'CDL Class A' },
  { id: 'ma', name: 'Medical Assistant', duration: '24 weeks', credential: 'RMA/CMA' },
];

// Funding options
const FUNDING_OPTIONS = [
  { id: 'wioa', name: 'WIOA Funding', desc: 'Workforce Innovation & Opportunity Act', icon: '💼' },
  { id: 'wrg', name: 'Workforce Ready Grant', desc: 'Indiana free training program', icon: '🎓' },
  { id: 'fssa', name: 'FSSA IMPACT', desc: 'Health and Human Services programs' },
  { id: 'vr', name: 'Vocational Rehabilitation', desc: 'Individualized support', icon: '♿' },
  { id: 'self', name: 'Self-Pay', desc: 'Payment plan available', icon: '💳' },
];

// Document requirements
const REQUIRED_DOCS = [
  { id: 'id', name: 'Government ID', desc: 'Driver\'s license or state ID' },
  { id: 'ss', name: 'Social Security Card', desc: 'Or official SS document' },
  { id: 'hs', name: 'High School Diploma/GED', desc: 'Or transcripts' },
  { id: 'birth', name: 'Birth Certificate', desc: 'For licensing purposes' },
];

interface FormData {
  program: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  funding: string[];
  employment: string;
  felon: string;
}

interface ValidationErrors {
  [key: string]: string;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-slate-500 mb-2">
        <span>Step {current} of {total}</span>
        <span>{Math.round((current / total) * 100)}% complete</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-brand-red-600"
          initial={{ width: 0 }}
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="flex justify-between mt-4 overflow-x-auto pb-2">
        {STEPS.map((step, i) => (
          <div
            key={step.id}
            className={`flex flex-col items-center min-w-[60px] ${
              i + 1 <= current ? 'text-brand-red-600' : 'text-slate-400'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              i + 1 < current ? 'bg-brand-red-600 text-white' :
              i + 1 === current ? 'bg-brand-red-100 border-2 border-brand-red-600 text-brand-red-600' :
              'bg-slate-100 text-slate-500'
            }`}>
              {i + 1 < current ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className="text-[10px] mt-1 hidden sm:block">{step.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgramStep({ data, onUpdate }: { data: FormData; onUpdate: (d: Partial<FormData>) => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Choose Your Program</h2>
      <p className="text-slate-600 mb-8">Select the program that best matches your career goals.</p>
      
      <div className="grid md:grid-cols-2 gap-4">
        {PROGRAMS.map((program) => (
          <button
            key={program.id}
            onClick={() => onUpdate({ program: program.id })}
            className={`p-5 rounded-xl border-2 text-left transition-all ${
              data.program === program.id
                ? 'border-brand-red-600 bg-brand-red-50'
                : 'border-slate-200 bg-white hover:border-brand-red-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-slate-900">{program.name}</h3>
              {data.program === program.id && <CheckCircle className="w-5 h-5 text-brand-red-600" />}
            </div>
            <div className="text-sm text-slate-500 space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{program.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                <span>{program.credential}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function PersonalStep({ data, onUpdate, errors }: { data: FormData; onUpdate: (d: Partial<FormData>) => void; errors: ValidationErrors }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Personal Information</h2>
      <p className="text-slate-600 mb-8">Tell us about yourself.</p>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red-500 ${
              errors.firstName ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="John"
          />
          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red-500 ${
              errors.lastName ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="Smith"
          />
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Street Address</label>
        <input
          type="text"
          value={data.address}
          onChange={(e) => onUpdate({ address: e.target.value })}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red-500"
          placeholder="123 Main St"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => onUpdate({ city: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red-500"
            placeholder="Indianapolis"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
          <input
            type="text"
            value={data.state}
            onChange={(e) => onUpdate({ state: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red-500"
            placeholder="IN"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">ZIP</label>
          <input
            type="text"
            value={data.zip}
            onChange={(e) => onUpdate({ zip: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red-500"
            placeholder="46204"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Employment Status</label>
          <select
            value={data.employment}
            onChange={(e) => onUpdate({ employment: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red-500"
          >
            <option value="">Select...</option>
            <option value="unemployed">Unemployed</option>
            <option value="part_time">Part-time</option>
            <option value="full_time">Full-time</option>
            <option value="student">Student</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Felon or Misdemeanor?</label>
          <select
            value={data.felon}
            onChange={(e) => onUpdate({ felon: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red-500"
          >
            <option value="">Select...</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
}

function ContactStep({ data, onUpdate, errors }: { data: FormData; onUpdate: (d: Partial<FormData>) => void; errors: ValidationErrors }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Contact Information</h2>
      <p className="text-slate-600 mb-8">How can we reach you?</p>
      
      <div className="space-y-6 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email Address *
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red-500 ${
              errors.email ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="john.smith@email.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          <p className="text-xs text-slate-500 mt-1">We'll send your application confirmation here.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Phone Number *
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red-500 ${
              errors.phone ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="(317) 314-3757"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          <p className="text-xs text-slate-500 mt-1">We'll call or text to discuss your application.</p>
        </div>

        <div className="bg-brand-blue-50 rounded-xl p-4 border border-brand-blue-100">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-brand-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-brand-blue-900">Your Information is Secure</h4>
              <p className="text-sm text-brand-blue-700 mt-1">
                We take privacy seriously. Your information is encrypted and only used to process your application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FundingStep({ data, onUpdate }: { data: FormData; onUpdate: (d: Partial<FormData>) => void }) {
  const toggleFunding = (id: string) => {
    const current = data.funding;
    if (current.includes(id)) {
      onUpdate({ funding: current.filter((f) => f !== id) });
    } else {
      onUpdate({ funding: [...current, id] });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Funding Options</h2>
      <p className="text-slate-600 mb-8">Select all funding sources you might qualify for. Most students qualify for at least one.</p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {FUNDING_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => toggleFunding(option.id)}
            className={`p-5 rounded-xl border-2 text-left transition-all ${
              data.funding.includes(option.id)
                ? 'border-brand-red-600 bg-brand-red-50'
                : 'border-slate-200 bg-white hover:border-brand-red-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{option.icon}</span>
              <div>
                <h3 className="font-bold text-slate-900">{option.name}</h3>
                <p className="text-sm text-slate-500">{option.desc}</p>
              </div>
            </div>
            {data.funding.includes(option.id) && (
              <div className="mt-3 flex items-center gap-1 text-brand-red-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Selected
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-brand-red-600" />
          <h3 className="font-bold text-slate-900">Not sure which funding to select?</h3>
        </div>
        <p className="text-slate-600 mb-4">
          Don't worry! Our team will review your application and help identify all funding options you qualify for. 
          You can also check your eligibility now with our free tool.
        </p>
        <Link
          href="/eligibility"
          className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold hover:text-brand-blue-700"
        >
          Check Eligibility Now - Free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

function DocumentsStep({ data }: { data: FormData }) {
  const [uploaded, setUploaded] = useState<{ [key: string]: boolean }>({});

  const handleUpload = (id: string) => {
    // Simulate upload
    setUploaded((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Required Documents</h2>
      <p className="text-slate-600 mb-8">
        Upload the following documents. Don't worry if you don't have them all - you can add more later.
      </p>
      
      <div className="space-y-4 max-w-2xl">
        {REQUIRED_DOCS.map((doc) => (
          <div
            key={doc.id}
            className={`p-5 rounded-xl border-2 transition-all ${
              uploaded[doc.id] ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  uploaded[doc.id] ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {uploaded[doc.id] ? <CheckCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{doc.name}</h3>
                  <p className="text-sm text-slate-500">{doc.desc}</p>
                </div>
              </div>
              {uploaded[doc.id] ? (
                <span className="text-green-600 font-medium text-sm">Uploaded</span>
              ) : (
                <button
                  onClick={() => handleUpload(doc.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900">Important</h4>
            <p className="text-sm text-amber-700 mt-1">
              You can complete your application now and upload documents later. We'll send you a secure link to upload documents.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ReviewStep({ data }: { data: FormData }) {
  const program = PROGRAMS.find((p) => p.id === data.program);
  
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Your Application</h2>
      <p className="text-slate-600 mb-8">Please review your information before submitting.</p>
      
      <div className="space-y-6 max-w-2xl">
        {/* Program */}
        <div className="bg-slate-50 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-red-600" />
            Program
          </h3>
          <p className="text-slate-700">{program?.name} ({program?.duration})</p>
          <p className="text-sm text-slate-500">{program?.credential}</p>
        </div>

        {/* Personal Info */}
        <div className="bg-slate-50 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-red-600" />
            Personal Information
          </h3>
          <p className="text-slate-700">{data.firstName} {data.lastName}</p>
          <p className="text-sm text-slate-500">
            {data.address && `${data.address}, `}{data.city && `${data.city}, `}{data.state} {data.zip}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            {data.employment && `Employment: ${data.employment}`}
          </p>
        </div>

        {/* Contact */}
        <div className="bg-slate-50 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Phone className="w-5 h-5 text-brand-red-600" />
            Contact Information
          </h3>
          <p className="text-slate-700">{data.email}</p>
          <p className="text-slate-500">{data.phone}</p>
        </div>

        {/* Funding */}
        <div className="bg-slate-50 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-red-600" />
            Funding Options
          </h3>
          {data.funding.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.funding.map((f) => {
                const option = FUNDING_OPTIONS.find((fo) => fo.id === f);
                return (
                  <span key={f} className="px-3 py-1 bg-brand-blue-100 text-brand-blue-700 rounded-full text-sm">
                    {option?.name}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500">No funding selected - will be determined later</p>
          )}
        </div>
      </div>

      <div className="mt-8 p-6 bg-brand-red-50 rounded-xl border border-brand-red-200">
        <h3 className="font-bold text-brand-red-900 mb-2">What happens next?</h3>
        <ul className="space-y-2 text-brand-red-800">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            You'll receive a confirmation email within 5 minutes
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Our team will call you within 1 business day
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            We'll help you complete funding applications
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            You'll get access to your student portal
          </li>
        </ul>
      </div>
    </motion.div>
  );
}

function SuccessScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-12 h-12 text-green-600" />
      </motion.div>
      
      <h2 className="text-3xl font-bold text-slate-900 mb-4">
        Application Submitted!
      </h2>
      <p className="text-xl text-slate-600 mb-8 max-w-lg mx-auto">
        Thank you for applying to Elevate for Humanity. We're excited to help you start your career journey!
      </p>

      <div className="bg-slate-50 rounded-xl p-6 max-w-md mx-auto mb-8">
        <h3 className="font-bold text-slate-900 mb-4">What to expect:</h3>
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-red-100 rounded-full flex items-center justify-center text-brand-red-600 font-bold">1</div>
            <div>
              <p className="font-medium text-slate-900">Check your email</p>
              <p className="text-sm text-slate-500">Confirmation sent to your inbox</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-red-100 rounded-full flex items-center justify-center text-brand-red-600 font-bold">2</div>
            <div>
              <p className="font-medium text-slate-900">Phone call within 24 hours</p>
              <p className="text-sm text-slate-500">Our team will guide you through funding</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-red-100 rounded-full flex items-center justify-center text-brand-red-600 font-bold">3</div>
            <div>
              <p className="font-medium text-slate-900">Get started on your new career!</p>
              <p className="text-sm text-slate-500">Begin your journey to employment</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
        >
          Return to Home
        </Link>
        <Link
          href="/eligibility"
          className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:border-brand-red-600 hover:text-brand-red-600 transition-colors"
        >
          Check Funding Eligibility
        </Link>
      </div>
    </motion.div>
  );
}

export function ApplicationWizard() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<FormData>({
    program: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'IN',
    zip: '',
    funding: [],
    employment: '',
    felon: '',
  });

  const updateForm = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (step === 0 && !formData.program) {
      newErrors.program = 'Please select a program';
    }
    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    }
    if (step === 2) {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      // Submit
      setSubmitted(true);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <SuccessScreen />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ProgressBar current={step + 1} total={STEPS.length} />
      
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <AnimatePresence mode="wait">
          {step === 0 && <ProgramStep key="program" data={formData} onUpdate={updateForm} />}
          {step === 1 && <PersonalStep key="personal" data={formData} onUpdate={updateForm} errors={errors} />}
          {step === 2 && <ContactStep key="contact" data={formData} onUpdate={updateForm} errors={errors} />}
          {step === 3 && <FundingStep key="funding" data={formData} onUpdate={updateForm} />}
          {step === 4 && <DocumentsStep key="documents" data={formData} />}
          {step === 5 && <ReviewStep key="review" data={formData} />}
        </AnimatePresence>

        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
          >
            {step === STEPS.length - 1 ? 'Submit Application' : 'Continue'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApplicationWizard;
