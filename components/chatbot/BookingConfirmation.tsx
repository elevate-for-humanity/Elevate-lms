'use client';

import { Clock, FileText, Users, Shield } from 'lucide-react';

interface BookingConfirmationProps {
  meetingTime?: string;
  meetingType?: 'standard' | 'government';
}

/**
 * Booking Confirmation Component
 * 
 * Displays the "What Happens Next" checklist after a call is scheduled.
 * Reduces no-shows and sets clear expectations.
 */
export function BookingConfirmation({ 
  meetingTime,
  meetingType = 'standard' 
}: BookingConfirmationProps) {
  const callLabel = meetingType === 'government' 
    ? 'Program Operations Review' 
    : 'Scope Confirmation Call';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-green-100 rounded-full mb-4">
          <span className="text-slate-400 flex-shrink-0">•</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Booked</h1>
        {meetingTime && (
          <p className="text-gray-600">{callLabel} scheduled for {meetingTime}</p>
        )}
      </div>

      {/* What Happens Next */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">What Happens Next</h2>
          <p className="text-sm text-gray-600">Here's what to expect.</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Before the Call */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-brand-blue-600" />
              <h3 className="font-semibold text-gray-900">Before the Call</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 ml-7">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>The Program Fit Navigator has prepared a summary of your responses.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Ona will review your program structure, scale, and governance needs in advance.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>No additional materials are required unless you choose to share them.</span>
              </li>
            </ul>
          </div>

          {/* During the Call */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-brand-blue-600" />
              <h3 className="font-semibold text-gray-900">During the Call (15 minutes)</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 ml-7">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Confirm whether the platform fits your program operations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Validate scope (programs, learners, credentials, partners).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Clarify any governance or compliance considerations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Determine whether it makes sense to proceed—and how.</span>
              </li>
            </ul>
          </div>

          {/* What This Call Is Not */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">What This Call Is Not</h3>
            </div>
            <ul className="space-y-1 text-sm text-gray-600 ml-7">
              <li>• Not a pricing negotiation.</li>
              <li>• Not a contract discussion.</li>
              <li>• Not a technical deep dive.</li>
            </ul>
          </div>

          {/* After the Call */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-brand-blue-600" />
              <h3 className="font-semibold text-gray-900">After the Call</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 ml-7">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>If there's a clear fit, next steps will be outlined (timeline, scope, documentation).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>If there's not a fit, you'll have clarity without obligation.</span>
              </li>
            </ul>
          </div>

          {/* Optional Preparation */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Your Preparation (Optional)</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Approximate number of programs and learners.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Any compliance or reporting constraints you're aware of.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-brand-blue-50 px-6 py-4 border-t border-brand-blue-100">
          <p className="text-sm text-brand-blue-800 font-medium text-center">
            That's it. No surprises.
          </p>
        </div>
      </div>
    </div>
  );
}
