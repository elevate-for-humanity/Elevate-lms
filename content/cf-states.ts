export type StateContent = {
  slug: string;
  name: string;
  abbreviation: string;
  careerTrainingSummary: string;
  communityServicesSummary: string;
  fundingNote: string;
};

export const states: StateContent[] = [
  {
    slug: 'illinois',
    name: 'Illinois',
    abbreviation: 'IL',
    careerTrainingSummary:
      'Career training programs serving Illinois residents in healthcare, skilled trades, and technology.',
    communityServicesSummary:
      'Community support services for Illinois residents including workforce navigation and social services.',
    fundingNote:
      'Illinois residents may be eligible for WIOA Title I funding through local American Job Centers.',
  },
  {
    slug: 'indiana',
    name: 'Indiana',
    abbreviation: 'IN',
    careerTrainingSummary:
      'Indiana-based career training with Workforce Ready Grant and WIOA funding available for eligible residents.',
    communityServicesSummary:
      'Community services for Indiana residents including FSSA partnerships and workforce board referrals.',
    fundingNote:
      'Indiana Workforce Ready Grant covers full tuition for eligible high-demand programs. WIOA funding also available.',
  },
  {
    slug: 'ohio',
    name: 'Ohio',
    abbreviation: 'OH',
    careerTrainingSummary:
      'Career training programs for Ohio residents in high-demand fields with credential-bearing outcomes.',
    communityServicesSummary:
      'Community support services for Ohio residents through workforce and social service partnerships.',
    fundingNote: 'Ohio residents may qualify for WIOA funding through OhioMeansJobs centers.',
  },
  {
    slug: 'tennessee',
    name: 'Tennessee',
    abbreviation: 'TN',
    careerTrainingSummary:
      'Career training for Tennessee residents in healthcare, trades, and technology sectors.',
    communityServicesSummary:
      'Community services for Tennessee residents through local workforce and social service networks.',
    fundingNote: 'Tennessee residents may be eligible for WIOA and Tennessee Reconnect funding.',
  },
  {
    slug: 'texas',
    name: 'Texas',
    abbreviation: 'TX',
    careerTrainingSummary:
      'Career training programs for Texas residents with industry-recognized credentials.',
    communityServicesSummary:
      'Community support services for Texas residents through workforce and community partnerships.',
    fundingNote:
      'Texas residents may qualify for WIOA funding through Workforce Solutions offices.',
  },
];
