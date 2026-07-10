'use client';

import Link from 'next/link';
import { DollarSign, ExternalLink, Phone, MapPin, CheckCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface FundingInfoBlockProps {
  programName: string;
  fundingSources: string[];
  selfPayPrice: number;
  regularPrice?: number;
}

export default function FundingInfoBlock({
  programName,
  fundingSources,
  selfPayPrice,
  regularPrice,
}: FundingInfoBlockProps) {
  return (
    <div className="space-y-5">
      {/* Funding explanation */}
      <div className="bg-brand-green-50 border border-brand-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-brand-green-700" />
          <h3 className="font-bold text-brand-green-900">This Program May Cost You $0</h3>
        </div>
        <p className="text-brand-green-800 text-sm leading-relaxed mb-4">
          {programName} is approved for federal and state workforce funding. Eligible Indiana 
          residents can have <strong>100% of tuition, books, and certification exam fees covered</strong> through 
          programs like {fundingSources.join(', ')}. Eligibility is based on income, employment status, 
          and other factors determined by your local workforce office.
        </p>
        <div className="space-y-2 mb-4">
          {fundingSources.map((source) => (
            <div key={source} className="flex items-center gap-2 text-sm text-brand-green-800">
              <CheckCircle className="w-4 h-4 text-brand-green-600 shrink-0" />
              <span>{source} — approved training provider</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-brand-green-200 p-4">
          <p className="font-semibold text-slate-900 text-sm mb-2">How to Check Your Eligibility:</p>
          <ol className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="bg-brand-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
              <span>Visit <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 font-semibold hover:underline inline-flex items-center gap-1">www.indianacareerconnect.com <ExternalLink className="w-3 h-3" /></a> and create an account</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-brand-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
              <span>Search for &quot;{PLATFORM_DEFAULTS.orgName}&quot; under training providers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-brand-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
              <span>Schedule an appointment with your local <strong>WorkOne</strong> office to complete an eligibility assessment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-brand-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
              <span>Once approved, your WorkOne case manager will issue a training voucher — you pay nothing</span>
            </li>
          </ol>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="https://www.indianacareerconnect.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-green-800 transition"
          >
            <ExternalLink className="w-4 h-4" />
            Indiana Career Connect
          </a>
          <a
            href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
            className="inline-flex items-center gap-2 bg-white border border-brand-green-300 text-brand-green-800 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-green-50 transition"
          >
            <Phone className="w-4 h-4" />
            Call Us: {PLATFORM_DEFAULTS.supportPhone}
          </a>
        </div>
      </div>

      {/* WorkOne locations */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-blue-600" />
          WorkOne Locations (Indianapolis Area)
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="font-semibold text-slate-900">WorkOne Indy — West</p>
            <p className="text-slate-600">3400 W 16th St, Indianapolis, IN 46222</p>
            <p className="text-slate-500">(317) 916-4600</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="font-semibold text-slate-900">WorkOne Indy — East</p>
            <p className="text-slate-600">2511 E 46th St, Suite B, Indianapolis, IN 46205</p>
            <p className="text-slate-500">(317) 916-4600</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="font-semibold text-slate-900">EmployIndy</p>
            <p className="text-slate-600">1845 W 18th St, Suite B, Indianapolis, IN 46202</p>
            <p className="text-slate-500">(317) 639-4400</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="font-semibold text-slate-900">WorkOne Express — Library</p>
            <p className="text-slate-600">40 E St. Clair St, Indianapolis, IN 46204</p>
            <p className="text-slate-500">(317) 275-4100</p>
          </div>
        </div>
      </div>

      {/* Self-pay section */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h3 className="font-bold text-amber-900 mb-2">Don&apos;t Qualify for Funding? We Have Options.</h3>
        <p className="text-amber-800 text-sm leading-relaxed mb-3">
          If you don&apos;t qualify for WIOA or other workforce funding, you can still enroll. 
          We offer flexible self-pay options so cost is never a barrier to your career:
        </p>
        <ul className="space-y-1.5 text-sm text-amber-800">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Payment plan</strong> — choose your down payment and weekly amount</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Affirm</strong> — monthly financing, 0% APR available, instant decision</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Sezzle</strong> — 4 interest-free payments every 2 weeks</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Pay in full</strong> — one-time payment{regularPrice && regularPrice > selfPayPrice ? ` at sale price $${selfPayPrice.toLocaleString()}` : ''}</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Employer sponsorship</strong> — your employer can pay directly</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
