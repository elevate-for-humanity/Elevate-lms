
'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Upload, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface License {
  license_key: string;
  license_type: string;
  lms_model: string;
  can_create_courses: boolean;
  can_upload_scorm: boolean;
  max_enrollments: number;
  current_enrollments: number;
  status: string;
  expires_at: string | null;
}

export default function CreateCoursePage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [selectedLicense, setSelectedLicense] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [scormFile, setScormFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_partner_license_info', {
        p_partner_id: user.id
      });

      if (error) throw error;
      setLicenses(data || []);
    } catch (error) { /* Error handled silently */ 
      setMessage('Failed to load licenses');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const license = licenses.find(l => l.license_key === selectedLicense);
      if (!license) throw new Error('Invalid license selected');

      if (!license.can_create_courses) {
        throw new Error('Your license does not allow course creation');
      }

      let scormUrl = null;
      if (scormFile && license.can_upload_scorm) {
        const fileExt = scormFile.name.split('.').pop();
        const fileName = `${user.id}/scorm_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('scorm-packages')
          .upload(fileName, scormFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('scorm-packages')
          .getPublicUrl(fileName);

        scormUrl = publicUrl;
      }

      const { error: insertError } = await supabase
        .from('partner_lms_courses')
        .insert({
          partner_id: user.id,
          license_id: selectedLicense,
          course_name: courseName,
          course_description: courseDescription,
          duration_hours: parseInt(duration),
          scorm_package_url: scormUrl,
          lms_model: license.lms_model,
          status: 'active'
        });

      if (insertError) throw insertError;

      setMessage('Course created successfully!');
      setCourseName('');
      setCourseDescription('');
      setDuration('');
      setScormFile(null);
      setSelectedLicense('');
    } catch (error) { /* Error handled silently */ 
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedLicenseData = licenses.find(l => l.license_key === selectedLicense);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/programs-hero.jpg" alt="Create course" fill sizes="100vw" className="object-cover" priority />
      </section>
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner' }, { label: 'Courses', href: '/partner/courses' }, { label: 'Create' }]} />
        </div>
      </div>

      <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-8 h-8 text-brand-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Partner Course</h1>
              <p className="mt-1 text-gray-600">Add a new course to your LMS platform</p>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.includes('Error')
                ? 'bg-brand-red-50 text-brand-red-800'
                : 'bg-brand-green-50 text-brand-green-800'
            }`}>
              {message.includes('Error') ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <span className="text-slate-400 flex-shrink-0">•</span>
              )}
              <span>{message}</span>
            </div>
          )}

          {licenses.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Licenses</h3>
              <p className="text-gray-600">You need an active license to create courses.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select License *
                </label>
                <select
                  value={selectedLicense}
                  onChange={(e) => setSelectedLicense(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a license...</option>
                  {licenses.map((license) => (
                    <option key={license.license_key} value={license.license_key}>
                      {license.license_type.toUpperCase()} - {license.lms_model} 
                      ({license.current_enrollments}/{license.max_enrollments} used)
                    </option>
                  ))}
                </select>
              </div>

              {selectedLicenseData && (
                <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-brand-blue-900 mb-2">License Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-brand-blue-700">Model:</span>
                      <span className="ml-2 font-medium text-brand-blue-900">
                        {selectedLicenseData.lms_model}
                      </span>
                    </div>
                    <div>
                      <span className="text-brand-blue-700">Create Courses:</span>
                      <span className="ml-2 font-medium text-brand-blue-900">
                        {selectedLicenseData.can_create_courses ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-brand-blue-700">Upload SCORM:</span>
                      <span className="ml-2 font-medium text-brand-blue-900">
                        {selectedLicenseData.can_upload_scorm ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-brand-blue-700">Enrollments:</span>
                      <span className="ml-2 font-medium text-brand-blue-900">
                        {selectedLicenseData.current_enrollments}/{selectedLicenseData.max_enrollments}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="Introduction to HVAC Systems"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Description *
                </label>
                <textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="Describe what students will learn in this course..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours) *
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="40"
                  required
                />
              </div>

              {selectedLicenseData?.can_upload_scorm && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SCORM Package (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept=".zip"
                        onChange={(e) => setScormFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-blue-400 transition-colors">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">
                          {scormFile ? scormFile.name : 'Upload SCORM package (.zip)'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating Course...' : 'Create Course'}
                </button>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
