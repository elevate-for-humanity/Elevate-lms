'use client';

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

interface EnrollButtonProps {
  courseId: number;
  courseSlug: string;
  isEnrolled: boolean;
}

export default function EnrollButton({
  courseId,
  courseSlug,
  isEnrolled,
}: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEnroll = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll');
      }

      // Redirect to the course page
      router.push(`/lms/courses/${courseId}`);
      router.refresh();
    } catch (err: any) {
      setError('Enrollment failed');
      setLoading(false);
    }
  };

  if (isEnrolled) {
    return (
      <Button className="w-full" asChild>
        <a href={`/lms/courses/${courseId}`}>Continue Learning</a>
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={handleEnroll} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enrolling...
          </>
        ) : (
          'Enroll Now'
        )}
      </Button>
      {error && (
        <p className="text-xs text-brand-orange-600 text-center">{error}</p>
      )}
      <Button variant="outline" className="w-full" asChild>
        <a href={`/lms/courses/${courseId}`}>View Details</a>
      </Button>
    </div>
  );
}
