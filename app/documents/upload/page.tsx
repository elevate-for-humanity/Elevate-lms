
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function DocumentUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Please log in to upload documents');
        return;
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_path: uploadData.path,
          file_name: file.name,
          file_type: file.type,
          document_type: documentType,
          description: description,
        });

      if (dbError) throw dbError;

      setUploaded(true);
    } catch (error) {
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold mb-4">Document Uploaded!</h1>
            <p className="text-black mb-6">
              Your document has been uploaded successfully.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setUploaded(false)}>
                Upload Another
              </Button>
              <Link href="/lms/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Documents', href: '/documents' }, { label: 'Upload' }]} />
        </div>
      </div>

      <div className="py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Upload Required Documents to Stay on Track</h1>
        <p className="text-black mb-8">
          This step is what keeps your application moving. If any required document is missing, your application cannot be approved yet. Once your uploads are complete, you'll submit your application.
        </p>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Document Type *
              </label>
              <select
                required
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select type...</option>
                <option value="certificate">Certificate</option>
                <option value="transcript">Transcript</option>
                <option value="id">ID Document</option>
                <option value="resume">Resume</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Brief description of the document"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                File *
              </label>
              <input
                type="file"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <p className="text-sm text-black mt-2">
                Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Document'}
              </Button>
              <Link href="/lms/dashboard">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
