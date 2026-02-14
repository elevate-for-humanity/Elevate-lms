'use client';

import { useState } from 'react';
import { submitAssignment } from './actions';
import { Upload, Send, Loader2, FileText } from 'lucide-react';

interface AssignmentSubmitFormProps {
  assignmentId: string;
  assignmentTitle: string;
}

export function AssignmentSubmitForm({ assignmentId, assignmentTitle }: AssignmentSubmitFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setMessage(null);

    formData.append('assignment_id', assignmentId);
    const result = await submitAssignment(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: result.message || 'Submitted!' });
      setFileName(null);
      const form = document.getElementById('assignment-form') as HTMLFormElement;
      form?.reset();
    }

    setSubmitting(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : null);
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Submit: {assignmentTitle}</h3>

      <form id="assignment-form" action={handleSubmit} className="space-y-4">
        {message && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Your Response
          </label>
          <textarea
            id="content"
            name="content"
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            placeholder="Enter your response here..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attach File (optional)
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200">
              <Upload className="w-4 h-4" />
              Choose File
              <input
                type="file"
                name="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
            </label>
            {fileName && (
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                {fileName}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Accepted: PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Assignment
            </>
          )}
        </button>
      </form>
    </div>
  );
}
