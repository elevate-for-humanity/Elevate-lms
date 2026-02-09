'use client';

import { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, User, Award, Globe, AlertTriangle, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface ShopFormData {
  trainingRegion: string;
  trainingRegionOther: string;
  programTrack: string;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  ownerManagerName: string;
  supervisorName: string;
  supervisorLicenseType: string;
  shopAcknowledgment: boolean;
  regionAcknowledgment: boolean;
}

interface ApprenticeshipShopFieldsProps {
  formData: ShopFormData;
  onChange: (data: Partial<ShopFormData>) => void;
  errors?: Record<string, string>;
  applicationId?: string;
}

// Hook to load existing shop data and save drafts
function useShopFormDB(applicationId?: string) {
  const supabase = createClient();

  const loadExistingShop = async (shopName: string) => {
    const { data } = await supabase
      .from('apprenticeship_shops')
      .select('*')
      .ilike('shop_name', shopName)
      .single();
    return data;
  };

  const saveDraft = async (formData: ShopFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('apprenticeship_shop_drafts')
      .upsert({
        user_id: user?.id,
        application_id: applicationId,
        form_data: formData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,application_id' });
  };

  return { loadExistingShop, saveDraft };
}

const TRAINING_REGIONS = [
  { value: 'indiana', label: 'Indiana' },
  { value: 'illinois-chicago', label: 'Illinois (Chicago/Cook County)' },
  { value: 'other', label: 'Other (Specify)' },
];

const PROGRAM_TRACKS = [
  { value: 'barber', label: 'Barber' },
  { value: 'cosmetology', label: 'Cosmetology' },
  { value: 'esthetician', label: 'Esthetics' },
  { value: 'nail-technician', label: 'Nail Technology' },
];

const SUPERVISOR_LICENSE_TYPES: Record<string, { value: string; label: string }[]> = {
  barber: [
    { value: 'licensed-barber', label: 'Licensed Barber' },
    { value: 'master-barber', label: 'Master Barber' },
    { value: 'barber-instructor', label: 'Barber Instructor' },
  ],
  cosmetology: [
    { value: 'licensed-cosmetologist', label: 'Licensed Cosmetologist' },
    { value: 'cosmetology-instructor', label: 'Cosmetology Instructor' },
  ],
  esthetician: [
    { value: 'licensed-esthetician', label: 'Licensed Esthetician' },
    { value: 'master-esthetician', label: 'Master Esthetician' },
    { value: 'esthetics-instructor', label: 'Esthetics Instructor' },
  ],
  'nail-technician': [
    { value: 'licensed-nail-tech', label: 'Licensed Nail Technician' },
    { value: 'nail-tech-instructor', label: 'Nail Technology Instructor' },
  ],
};

export function ApprenticeshipShopFields({ 
  formData, 
  onChange, 
  errors = {} 
}: ApprenticeshipShopFieldsProps) {
  const showOtherRegion = formData.trainingRegion === 'other';
  const licenseTypes = SUPERVISOR_LICENSE_TYPES[formData.programTrack] || [];

  return (
    <div className="space-y-6">
      {/* Multi-Region Notice */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-5 text-white">
        <div className="flex items-start gap-3">
          <Globe className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-lg mb-2">Multi-Region Requirements</h3>
            <p className="text-purple-100 text-sm">
              We are based in Indiana, but apprenticeship and host-site requirements can vary by region 
              (state licensing rules, local workforce board policies, and employer eligibility standards). 
              Your selected region determines the host shop guidelines we apply.
            </p>
          </div>
        </div>
      </div>

      {/* Training Region */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Training Region <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.trainingRegion}
          onChange={(e) => onChange({ trainingRegion: e.target.value, trainingRegionOther: '' })}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 ${
            errors.trainingRegion ? 'border-red-500' : 'border-slate-300'
          }`}
          required
        >
          <option value="">Select your training region...</option>
          {TRAINING_REGIONS.map((region) => (
            <option key={region.value} value={region.value}>
              {region.label}
            </option>
          ))}
        </select>
        {errors.trainingRegion && (
          <p className="mt-1 text-sm text-red-600">{errors.trainingRegion}</p>
        )}
      </div>

      {/* Other Region Specification */}
      {showOtherRegion && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Specify State/Region <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.trainingRegionOther}
            onChange={(e) => onChange({ trainingRegionOther: e.target.value })}
            placeholder="e.g., Ohio, Michigan, Kentucky"
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 ${
              errors.trainingRegionOther ? 'border-red-500' : 'border-slate-300'
            }`}
            required={showOtherRegion}
          />
          {errors.trainingRegionOther && (
            <p className="mt-1 text-sm text-red-600">{errors.trainingRegionOther}</p>
          )}
        </div>
      )}

      {/* Program Track */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Program Track <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.programTrack}
          onChange={(e) => onChange({ programTrack: e.target.value, supervisorLicenseType: '' })}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 ${
            errors.programTrack ? 'border-red-500' : 'border-slate-300'
          }`}
          required
        >
          <option value="">Select program track...</option>
          {PROGRAM_TRACKS.map((track) => (
            <option key={track.value} value={track.value}>
              {track.label}
            </option>
          ))}
        </select>
        {errors.programTrack && (
          <p className="mt-1 text-sm text-red-600">{errors.programTrack}</p>
        )}
      </div>

      {/* Shop Information Header */}
      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-purple-600" />
          Host Shop Information
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Provide details about the shop where you will complete your apprenticeship training.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800 flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Tip:</strong> Submit 2–3 shop options if possible. Requirements vary by region, 
              and verification may differ by state/local policy.
            </span>
          </p>
        </div>
      </div>

      {/* Shop Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Shop Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.shopName}
          onChange={(e) => onChange({ shopName: e.target.value })}
          placeholder="Enter shop/salon name"
          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 ${
            errors.shopName ? 'border-red-500' : 'border-slate-300'
          }`}
          required
        />
        {errors.shopName && (
          <p className="mt-1 text-sm text-red-600">{errors.shopName}</p>
        )}
      </div>

      {/* Shop Address */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Shop Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={formData.shopAddress}
            onChange={(e) => onChange({ shopAddress: e.target.value })}
            placeholder="Full street address, city, state, ZIP"
            className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 ${
              errors.shopAddress ? 'border-red-500' : 'border-slate-300'
            }`}
            required
          />
        </div>
        {errors.shopAddress && (
          <p className="mt-1 text-sm text-red-600">{errors.shopAddress}</p>
        )}
      </div>

      {/* Shop Phone */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Shop Phone <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="tel"
            value={formData.shopPhone}
            onChange={(e) => onChange({ shopPhone: e.target.value })}
            placeholder="(317) 314-3757"
            className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 ${
              errors.shopPhone ? 'border-red-500' : 'border-slate-300'
            }`}
            required
          />
        </div>
        {errors.shopPhone && (
          <p className="mt-1 text-sm text-red-600">{errors.shopPhone}</p>
        )}
      </div>

      {/* Owner/Manager Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Owner/Manager Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={formData.ownerManagerName}
            onChange={(e) => onChange({ ownerManagerName: e.target.value })}
            placeholder="Shop owner or manager name"
            className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 ${
              errors.ownerManagerName ? 'border-red-500' : 'border-slate-300'
            }`}
            required
          />
        </div>
        {errors.ownerManagerName && (
          <p className="mt-1 text-sm text-red-600">{errors.ownerManagerName}</p>
        )}
      </div>

      {/* Supervisor Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Supervisor Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={formData.supervisorName}
            onChange={(e) => onChange({ supervisorName: e.target.value })}
            placeholder="Licensed professional who will supervise you"
            className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 ${
              errors.supervisorName ? 'border-red-500' : 'border-slate-300'
            }`}
            required
          />
        </div>
        {errors.supervisorName && (
          <p className="mt-1 text-sm text-red-600">{errors.supervisorName}</p>
        )}
      </div>

      {/* Supervisor License Type */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Supervisor License Type <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Award className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
          <select
            value={formData.supervisorLicenseType}
            onChange={(e) => onChange({ supervisorLicenseType: e.target.value })}
            className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 ${
              errors.supervisorLicenseType ? 'border-red-500' : 'border-slate-300'
            }`}
            required
            disabled={!formData.programTrack}
          >
            <option value="">
              {formData.programTrack ? 'Select license type...' : 'Select program track first'}
            </option>
            {licenseTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        {errors.supervisorLicenseType && (
          <p className="mt-1 text-sm text-red-600">{errors.supervisorLicenseType}</p>
        )}
      </div>

      {/* Acknowledgments */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Required Acknowledgments
        </h3>

        {/* Region Acknowledgment */}
        <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
          formData.regionAcknowledgment 
            ? 'bg-green-50 border-green-300' 
            : errors.regionAcknowledgment 
              ? 'bg-red-50 border-red-300' 
              : 'bg-slate-50 border-slate-200 hover:border-purple-300'
        }`}>
          <input
            type="checkbox"
            checked={formData.regionAcknowledgment}
            onChange={(e) => onChange({ regionAcknowledgment: e.target.checked })}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            required
          />
          <span className="text-sm text-slate-700">
            <strong>I understand requirements can vary by region/state</strong> and my host shop must 
            meet the guidelines for my selected training region before placement is confirmed.
          </span>
        </label>
        {errors.regionAcknowledgment && (
          <p className="text-sm text-red-600">{errors.regionAcknowledgment}</p>
        )}

        {/* Shop Acknowledgment */}
        <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
          formData.shopAcknowledgment 
            ? 'bg-green-50 border-green-300' 
            : errors.shopAcknowledgment 
              ? 'bg-red-50 border-red-300' 
              : 'bg-slate-50 border-slate-200 hover:border-purple-300'
        }`}>
          <input
            type="checkbox"
            checked={formData.shopAcknowledgment}
            onChange={(e) => onChange({ shopAcknowledgment: e.target.checked })}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            required
          />
          <span className="text-sm text-slate-700">
            <strong>I understand my host shop must be licensed and approved</strong> for my selected 
            training region and track before placement is confirmed.
          </span>
        </label>
        {errors.shopAcknowledgment && (
          <p className="text-sm text-red-600">{errors.shopAcknowledgment}</p>
        )}
      </div>
    </div>
  );
}

export default ApprenticeshipShopFields;
