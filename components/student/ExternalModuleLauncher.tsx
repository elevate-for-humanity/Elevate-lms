'use client';

import React from 'react';
/**
 * External Module Launcher
 *
 * For modules hosted on partner platforms (Milady, Choice Medical, etc.)
 * Provides launch button and certificate upload
 */
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
interface ExternalModuleLauncherProps {
  module: {
    id: string;
    title: string;
    description?: string;
    partner_name?: string;
    external_url: string;
    requires_proof: boolean;
  };
  enrollmentId: string;
  progressId?: string;
}
export default function ExternalModuleLauncher({
  module,
  enrollmentId,
  progressId,
}: ExternalModuleLauncherProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const supabase = createClient();
  async function handleCertificateUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file || !progressId) return;
    try {
      setUploading(true);
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${enrollmentId}/${module.id}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('module-certificates')
        .upload(fileName, file);
      if (uploadError) {
        throw uploadError;
      }
      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('module-certificates').getPublicUrl(fileName);
      // Update module progress
      const { error: updateError } = await supabase
        .from('enrollment_module_progress')
        .update({
          status: 'awaiting_proof',
          partner_completion_proof_url: publicUrl,
        })
        .eq('id', progressId);
      if (updateError) {
        throw updateError;
      }
      setUploadSuccess(true);
      alert(
        'Certificate uploaded successfully! Your instructor will review it soon.'
      );
    } catch (err: any) {
      // Error: $1
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }
  return (
    <div className="glow-card p-8">
      {/* Module Info */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">{module.title}</h2>
        {module.description && (
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            {module.description}
          </p>
        )}
        {module.partner_name && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 rounded-lg">
            <span className="text-slate-400 text-sm">Partner:</span>
            <span className="text-white font-medium">
              {module.partner_name}
            </span>
          </div>
        )}
      </div>
      {/* Launch Button */}
      <div className="flex justify-center mb-8">
        <a
          href={module.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="glow-btn text-lg px-8 py-4"
          onClick={() => {
            // Update status to in_progress when they launch
            if (progressId) {
              supabase
                .from('enrollment_module_progress')
                .update({
                  status: 'in_progress',
                  last_accessed_at: new Date().toISOString(),
                })
                .eq('id', progressId)
                .then(() => {
                  // Progress updated
                });
            }
          }}
        >
          Launch {module.partner_name || 'Partner'} Course →
        </a>
      </div>
      {/* Instructions */}
      <div className="bg-white/50 rounded-lg p-6 mb-8">
        <h3 className="text-white font-semibold mb-3">📋 Instructions</h3>
        <ol className="text-slate-300 text-sm space-y-2 list-decimal list-inside">
          <li>
            Click the button above to open the partner course in a new tab
          </li>
          <li>Complete all required activities on the partner platform</li>
          <li>Download your completion certificate from the partner site</li>
          <li>Return here and upload your certificate below</li>
          <li>Your instructor will verify and mark the module as complete</li>
        </ol>
      </div>
      {/* Certificate Upload */}
      {module.requires_proof && (
        <div className="border-t border-slate-700 pt-8">
          <h3 className="text-white font-semibold mb-4 text-center">
            Upload Completion Certificate
          </h3>
          {uploadSuccess ? (
            <div className="text-center py-8">
              <div className="text-brand-green-500 text-5xl mb-4 text-3xl md:text-4xl lg:text-5xl">
                •
              </div>
              <p className="text-white font-medium mb-2">
                Certificate Uploaded!
              </p>
              <p className="text-slate-400 text-sm">
                Your instructor will review and approve your completion.
              </p>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <label className="block">
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-brand-blue-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleCertificateUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading ? (
                    <div>
                      <div className="animate-spin rounded-full h-11 w-11 border-b-2 border-brand-blue-500 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Uploading...</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2 text-2xl md:text-3xl lg:text-4xl">
                        📄
                      </div>
                      <p className="text-white font-medium mb-1">
                        Click to upload certificate
                      </p>
                      <p className="text-slate-400 text-sm">
                        PDF, JPG, or PNG (max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
