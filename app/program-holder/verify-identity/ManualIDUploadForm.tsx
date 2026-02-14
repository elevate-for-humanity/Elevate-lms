'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle,
  File,
  Loader2,
  Smartphone,
  Upload,
} from 'lucide-react';

interface ManualIDUploadFormProps {
  userId: string;
  userName: string;
  userEmail: string;
}

export default function ManualIDUploadForm({
  userId,
  userName,
  userEmail,
}: ManualIDUploadFormProps) {
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'back' | 'selfie'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image (JPG, PNG, etc.)');
      return;
    }

    setError(null);

    if (type === 'front') setIdFrontFile(file);
    else if (type === 'back') setIdBackFile(file);
    else if (type === 'selfie') setSelfieFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!idFrontFile || !selfieFile) {
      setError('Please upload ID front and selfie (minimum required)');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('id_front', idFrontFile);
      if (idBackFile) formData.append('id_back', idBackFile);
      formData.append('selfie', selfieFile);
      formData.append('user_id', userId);
      formData.append('user_name', userName);
      formData.append('user_email', userEmail);

      const response = await fetch('/api/identity/upload-manual', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setError(null);
      } else {
        setError(data.error || 'Upload failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Documents Uploaded Successfully!
          </h2>
          <p className="text-black mb-6">
            Your identity documents have been submitted for review. Our team
            will verify your documents within 1-2 business days.
          </p>
          <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-4 text-left">
            <p className="text-sm text-brand-blue-900">
              <strong>What happens next:</strong>
              <br />
              1. Admin reviews your documents (1-2 business days)
              <br />
              2. You'll receive an email notification
              <br />
              3. Once approved, you can start enrolling students
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Upload Photo ID (FREE)</h2>
        <p className="text-black">
          Upload photos of your government-issued ID and a selfie. Admin will
          review within 1-2 business days.
        </p>
        <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-400">
          <p className="text-sm text-green-900">
            <strong>
              <CheckCircle className="w-5 h-5 inline-block" /> FREE
            </strong>{' '}
            - No cost for manual verification
            <br />
            <strong>
              <Smartphone className="w-5 h-5 inline-block" /> Easy
            </strong>{' '}
            - Take photos with your phone
            <br />
            <strong>⏱️ Fast</strong> - Review within 1-2 business days
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ID Front */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            ID Front <span className="text-red-600">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-blue-400 transition">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'front')}
              className="hidden"
              id="id-front"
              required
            />
            <label
              htmlFor="id-front"
              className="cursor-pointer flex flex-col items-center"
            >
              {idFrontFile ? (
                <>
                  <CheckCircle className="text-green-600 mb-2" size={32} />
                  <p className="text-sm font-medium text-black">
                    {idFrontFile.name}
                  </p>
                  <p className="text-xs text-black mt-1">Click to change</p>
                </>
              ) : (
                <>
                  <Upload className="text-black mb-2" size={32} />
                  <p className="text-sm font-medium text-black">
                    Upload front of ID
                  </p>
                  <p className="text-xs text-black mt-1">
                    Driver's license, passport, or state ID
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* ID Back */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            ID Back <span className="text-black">(Optional)</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-blue-400 transition">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'back')}
              className="hidden"
              id="id-back"
            />
            <label
              htmlFor="id-back"
              className="cursor-pointer flex flex-col items-center"
            >
              {idBackFile ? (
                <>
                  <CheckCircle className="text-green-600 mb-2" size={32} />
                  <p className="text-sm font-medium text-black">
                    {idBackFile.name}
                  </p>
                  <p className="text-xs text-black mt-1">Click to change</p>
                </>
              ) : (
                <>
                  <Upload className="text-black mb-2" size={32} />
                  <p className="text-sm font-medium text-black">
                    Upload back of ID
                  </p>
                  <p className="text-xs text-black mt-1">
                    Optional but recommended
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Selfie */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Selfie Holding ID <span className="text-red-600">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-blue-400 transition">
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={(e) => handleFileChange(e, 'selfie')}
              className="hidden"
              id="selfie"
              required
            />
            <label
              htmlFor="selfie"
              className="cursor-pointer flex flex-col items-center"
            >
              {selfieFile ? (
                <>
                  <CheckCircle className="text-green-600 mb-2" size={32} />
                  <p className="text-sm font-medium text-black">
                    {selfieFile.name}
                  </p>
                  <p className="text-xs text-black mt-1">Click to change</p>
                </>
              ) : (
                <>
                  <Camera className="text-black mb-2" size={32} />
                  <p className="text-sm font-medium text-black">
                    Take selfie holding ID
                  </p>
                  <p className="text-xs text-black mt-1">
                    Hold your ID next to your face
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-black mb-2">
            📸 Photo Tips:
          </p>
          <ul className="text-sm text-black space-y-1">
            <li>• Ensure good lighting</li>
            <li>• ID should be clearly visible and readable</li>
            <li>• No glare or shadows on ID</li>
            <li>• Your face should be clearly visible in selfie</li>
            <li>• Hold ID next to your face in selfie</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || !idFrontFile || !selfieFile}
            className="w-full bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            {loading ? 'Uploading...' : 'Submit for Review (FREE)'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-black">
          <strong>What we verify:</strong>
          <br />
          • ID is not expired
          <br />
          • Photo on ID matches your selfie
          <br />
          • Name matches your application
          <br />
          • No signs of tampering or fraud
          <br />
          <br />
          <strong>Review time:</strong> 1-2 business days
        </p>
      </div>
    </div>
  );
}
