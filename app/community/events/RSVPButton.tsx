'use client';

import { useState } from 'react';
import { Calendar, Loader2, Check } from 'lucide-react';

interface RSVPButtonProps {
  eventId: string;
  eventTitle: string;
}

export default function RSVPButton({ eventId, eventTitle }: RSVPButtonProps) {
  const [loading, setLoading] = useState(false);
  const [rsvped, setRsvped] = useState(false);

  const handleRSVP = async () => {
    setLoading(true);
    // Simulate RSVP
    await new Promise(resolve => setTimeout(resolve, 500));
    setRsvped(true);
    setLoading(false);
  };

  if (rsvped) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium"
      >
        <Check className="w-4 h-4" />
        RSVP Confirmed
      </button>
    );
  }

  return (
    <button
      onClick={handleRSVP}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-blue-700 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Calendar className="w-4 h-4" />
          RSVP
        </>
      )}
    </button>
  );
}
