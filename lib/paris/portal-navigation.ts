export function resolvePortalNavigation(command: string, pathname: string) {
  const text = command.toLowerCase();
  // Questions and write requests must reach the server, never masquerade as navigation.
  if (!/^(?:please\s+)?(?:open|go to|take me to|navigate to|view|show)\s+/i.test(text.trim()))
    return null;
  if (
    /\b(how many|count|total|why|which|who|whether|status|send|submit|approve|update|change|draft|write|record|log)\b/.test(
      text,
    )
  )
    return null;
  if (/\b(card|payment method)\b/.test(text)) {
    return { href: '/account/payment-methods', label: 'billing and payment options' };
  }

  const prefix = pathname.startsWith('/program-holder')
    ? '/program-holder'
    : pathname.startsWith('/host-shop')
      ? '/host-shop/dashboard'
      : pathname.startsWith('/employer')
        ? '/employer'
        : pathname.startsWith('/apprentice')
          ? '/apprentice'
          : pathname.startsWith('/workforce')
            ? '/workforce'
            : pathname.startsWith('/creator')
              ? '/creator'
              : '/account';

  const routeMap: Record<string, Record<string, string>> = {
    '/program-holder': {
      settings: '/settings',
      profile: '/settings',
      students: '/students',
      programs: '/programs',
      documents: '/documents',
      reports: '/reports',
      hours: '/hours',
      payouts: '/payouts',
      applicants: '/students/pending',
      meetings: '/meetings',
      inbox: '/inbox',
      communications: '/email',
      compliance: '/compliance',
      orientation: '/how-to-use',
      agreement: '/sign-mou',
      phone: '/phone',
      dashboard: '/dashboard',
    },
    '/host-shop/dashboard': {
      settings: '/settings',
      profile: '/profile',
      students: '/students',
      programs: '/programs',
      documents: '/documents',
      reports: '/reports',
      hours: '/hours',
      meetings: '/schedule',
      inbox: '/messages',
      communications: '/communications',
      attendance: '/attendance',
      phone: '/phone',
      dashboard: '',
    },
    '/employer': {
      settings: '/settings',
      profile: '/company',
      students: '/apprentices',
      programs: '/programs',
      documents: '/documents',
      reports: '/reports',
      hours: '/hours',
      dashboard: '/dashboard',
    },
    '/apprentice': {
      profile: '/profile',
      programs: '/rti',
      documents: '/documents',
      hours: '/hours',
      dashboard: '/dashboard',
    },
    '/workforce': { students: '/participants', reports: '/dashboard', dashboard: '/dashboard' },
    '/creator': { programs: '/products', dashboard: '' },
    '/account': { settings: '/settings', profile: '/profile', dashboard: '' },
  };
  const destinations = [
    {
      key: 'settings',
      words: ['notification', 'alert', 'preference', 'setting'],
      label: 'notification settings',
    },
    { key: 'phone', words: ['phone', 'call', 'airscript'], label: 'your phone workspace' },
    {
      key: 'communications',
      words: ['email', 'message', 'text', 'communication'],
      label: 'communications',
    },
    { key: 'attendance', words: ['attendance'], label: 'attendance' },
    { key: 'profile', words: ['profile', 'picture', 'photo'], label: 'your profile' },
    {
      key: 'students',
      words: ['student', 'learner', 'apprentice'],
      label: 'students',
    },
    { key: 'applicants', words: ['applicant', 'application'], label: 'applicants' },
    {
      key: 'meetings',
      words: ['meeting', 'appointment', 'calendar', 'schedule'],
      label: 'team meetings',
    },
    { key: 'inbox', words: ['inbox', 'office mail', 'internal mail'], label: 'office mail' },
    {
      key: 'compliance',
      words: ['compliance', 'requirement', 'readiness'],
      label: 'compliance requirements',
    },
    {
      key: 'orientation',
      words: ['orientation', 'how to use', 'training guide'],
      label: 'orientation',
    },
    { key: 'agreement', words: ['agreement', 'mou', 'contract'], label: 'your agreement' },
    { key: 'programs', words: ['program', 'course'], label: 'your assigned programs' },
    { key: 'documents', words: ['document', 'upload'], label: 'documents' },
    { key: 'reports', words: ['report'], label: 'reports' },
    { key: 'hours', words: ['hour', 'attendance', 'time'], label: 'training hours' },
    { key: 'payouts', words: ['payment', 'payout', 'bank'], label: 'payouts' },
    { key: 'dashboard', words: ['dashboard', 'home'], label: 'your dashboard' },
  ];
  const destination = destinations.find(({ words }) =>
    words.some((word) => new RegExp(`\\b${word}(?:s)?\\b`).test(text)),
  );
  const suffix = destination ? routeMap[prefix]?.[destination.key] : undefined;
  if (!destination || suffix === undefined) return null;
  return { href: `${prefix}${suffix}`, label: destination.label };
}
