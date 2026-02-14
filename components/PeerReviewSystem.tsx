"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface PeerReview {
  id: string;
  studentName: string;
  assignmentTitle: string;
  submittedDate: string;
  status: 'pending' | 'completed';
  dueDate: string;
}

export default function PeerReviewSystem() {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const reviewsToComplete: PeerReview[] = [
    {
      id: '1',
      studentName: 'John D.',
      assignmentTitle: 'Fade Technique Video Submission',
      submittedDate: '2024-11-20',
      status: 'pending',
      dueDate: '2024-11-25',
    },
    {
      id: '2',
      studentName: 'Sarah M.',
      assignmentTitle: 'Client Consultation Practice',
      submittedDate: '2024-11-19',
      status: 'pending',
      dueDate: '2024-11-24',
    },
  ];

  const completedReviews: PeerReview[] = [
    {
      id: '3',
      studentName: 'Mike T.',
      assignmentTitle: 'Sanitation Procedures Essay',
      submittedDate: '2024-11-15',
      status: 'completed',
      dueDate: '2024-11-20',
    },
  ];

  const reviews = activeTab === 'pending' ? reviewsToComplete : completedReviews;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-brand-blue-600 border-b-2 border-brand-blue-600'
              : 'text-black hover:text-black'
          }`}
        >
          To Review ({reviewsToComplete.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'completed'
              ? 'text-brand-blue-600 border-b-2 border-brand-blue-600'
              : 'text-black hover:text-black'
          }`}
        >
          Completed ({completedReviews.length})
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-black">
                    {review.assignmentTitle}
                  </h3>
                  {review.status === 'pending' && (
                    <Badge variant="warning">Pending</Badge>
                  )}
                  {review.status === 'completed' && (
                    <Badge variant="success">Completed</Badge>
                  )}
                </div>
                <p className="text-sm text-black mb-1">
                  Submitted by: <span className="font-medium">{review.studentName}</span>
                </p>
                <p className="text-sm text-black">
                  Submitted: {new Date(review.submittedDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-black">
                  Review due: {new Date(review.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                {review.status === 'pending' ? (
                  <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors">
                    Start Review
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition-colors">
                    View Review
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {activeTab === 'pending'
              ? 'No peer reviews pending'
              : 'No completed reviews yet'}
          </p>
        </div>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-brand-blue-50 border-brand-blue-200">
        <h4 className="font-semibold text-black mb-2">Peer Review Guidelines</h4>
        <ul className="text-sm text-black space-y-1">
          <li>• Provide constructive and respectful feedback</li>
          <li>• Focus on specific strengths and areas for improvement</li>
          <li>• Use the rubric provided for each assignment</li>
          <li>• Complete reviews by the due date</li>
          <li>• Ask questions if you're unsure about any criteria</li>
        </ul>
      </Card>
    </div>
  );
}
