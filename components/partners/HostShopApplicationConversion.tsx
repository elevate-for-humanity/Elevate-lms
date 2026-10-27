'use client';

import { useEffect } from 'react';
import { EnrollmentEvents } from '@/lib/analytics/events';

export default function HostShopApplicationConversion() {
  useEffect(() => {
    EnrollmentEvents.applicationSubmit('host-shop');
  }, []);
  return null;
}
