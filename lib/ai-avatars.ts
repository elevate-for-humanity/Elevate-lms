/**
 * AI Avatar Configuration
 * Maps avatars to different sections of the platform
 */

export interface AvatarConfig {
  id: string;
  name: string;
  avatarId: string;
  voiceId: string;
  gender: 'male' | 'female';
  role: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

// Female voices (English)
export const FEMALE_VOICES = {
  jessica: '1704ea0565c04c5188d9b67062b31a1a', // Jessica Anne Bogart
  hope: '42d00d4aac5441279d8536cd6b52c53c', // Hope
  ivy: 'cef3bc4e0a84424cafcde6f2cf466c97', // Ivy
  brittney: '4754e1ec667544b0bd18cdf4bec7d6a7', // Brittney
  aria: '007e1378fc454a9f976db570ba6164a7', // Aria
};

// Male voices (English)
export const MALE_VOICES = {
  ray: '2eca0d3dd5ec4a1ea6efa6194b19eb78', // Ray
  mike: '3ae75279043648ce8f96310333c9288f', // Mike
  marco: 'a50b2b18a4bf49109caf46a3a6c6a08a', // Marco
};

// Avatar assignments by section/course
export const AVATARS: Record<string, AvatarConfig> = {
  // === MAIN SITE GUIDES ===
  welcome: {
    id: 'welcome',
    name: 'Sarah',
    avatarId: 'Annie_expressive5_public',
    voiceId: FEMALE_VOICES.jessica,
    gender: 'female',
    role: 'Welcome Guide',
  },
  
  chatAssistant: {
    id: 'chat-assistant',
    name: 'Emma',
    avatarId: 'Annie_expressive11_public',
    voiceId: FEMALE_VOICES.hope,
    gender: 'female',
    role: 'Chat Assistant',
  },

  // === STORE & FINANCE ===
  store: {
    id: 'store',
    name: 'Victoria',
    avatarId: 'Adriana_Business_Front_public',
    voiceId: FEMALE_VOICES.brittney,
    gender: 'female',
    role: 'Store Assistant',
  },
  
  financialAid: {
    id: 'financial-aid',
    name: 'Michelle',
    avatarId: 'Abigail_standing_office_front',
    voiceId: FEMALE_VOICES.ivy,
    gender: 'female',
    role: 'Financial Aid Advisor',
  },

  vita: {
    id: 'vita',
    name: 'Patricia',
    avatarId: 'Adriana_Business_Front_2_public',
    voiceId: FEMALE_VOICES.aria,
    gender: 'female',
    role: 'VITA Tax Guide',
  },

  supersonic: {
    id: 'supersonic',
    name: 'Rachel',
    avatarId: 'Adriana_BizTalk_Front_public',
    voiceId: FEMALE_VOICES.jessica,
    gender: 'female',
    role: 'Tax Preparation Guide',
  },

  // === HEALTHCARE COURSES ===
  healthcare: {
    id: 'healthcare',
    name: 'Dr. Maria',
    avatarId: 'Adriana_Nurse_Front_public',
    voiceId: FEMALE_VOICES.hope,
    gender: 'female',
    role: 'Healthcare Instructor',
  },

  cna: {
    id: 'cna',
    name: 'Nurse Angela',
    avatarId: 'Adriana_Nurse_Front_2_public',
    voiceId: FEMALE_VOICES.ivy,
    gender: 'female',
    role: 'CNA Instructor',
  },

  phlebotomy: {
    id: 'phlebotomy',
    name: 'Dr. Lisa',
    avatarId: 'Adriana_Nurse_Side_public',
    voiceId: FEMALE_VOICES.brittney,
    gender: 'female',
    role: 'Phlebotomy Instructor',
  },

  medicalAssistant: {
    id: 'medical-assistant',
    name: 'Dr. Karen',
    avatarId: 'Adriana_Nurse_Sitting_Side_public',
    voiceId: FEMALE_VOICES.aria,
    gender: 'female',
    role: 'Medical Assistant Instructor',
  },

  // === SKILLED TRADES ===
  trades: {
    id: 'trades',
    name: 'Mike',
    avatarId: 'Armando_Casual_Front_public',
    voiceId: MALE_VOICES.mike,
    gender: 'male',
    role: 'Trades Instructor',
  },

  hvac: {
    id: 'hvac',
    name: 'James',
    avatarId: 'Artur_standing_sofacasual_front',
    voiceId: MALE_VOICES.ray,
    gender: 'male',
    role: 'HVAC Instructor',
  },

  cdl: {
    id: 'cdl',
    name: 'Marcus',
    avatarId: 'Armando_Casual_Side_public',
    voiceId: MALE_VOICES.marco,
    gender: 'male',
    role: 'CDL Instructor',
  },

  electrical: {
    id: 'electrical',
    name: 'Robert',
    avatarId: 'Artur_sitting_sofacasual_front',
    voiceId: MALE_VOICES.mike,
    gender: 'male',
    role: 'Electrical Instructor',
  },

  // === BEAUTY & BARBER ===
  barber: {
    id: 'barber',
    name: 'Darius',
    avatarId: 'Armando_Casual_Front_public',
    voiceId: MALE_VOICES.ray,
    gender: 'male',
    role: 'Barber Instructor',
  },

  cosmetology: {
    id: 'cosmetology',
    name: 'Jasmine',
    avatarId: 'Annie_expressive6_public',
    voiceId: FEMALE_VOICES.brittney,
    gender: 'female',
    role: 'Cosmetology Instructor',
  },

  // === TECHNOLOGY ===
  technology: {
    id: 'technology',
    name: 'Alex',
    avatarId: 'Annie_expressive10_public',
    voiceId: FEMALE_VOICES.jessica,
    gender: 'female',
    role: 'Technology Instructor',
  },

  itSupport: {
    id: 'it-support',
    name: 'David',
    avatarId: 'Artur_standing_sofacasual_side',
    voiceId: MALE_VOICES.marco,
    gender: 'male',
    role: 'IT Support Instructor',
  },

  cybersecurity: {
    id: 'cybersecurity',
    name: 'Nina',
    avatarId: 'Annie_expressive12_public',
    voiceId: FEMALE_VOICES.aria,
    gender: 'female',
    role: 'Cybersecurity Instructor',
  },

  // === AI TUTOR ===
  aiTutor: {
    id: 'ai-tutor',
    name: 'Sophia',
    avatarId: 'Annie_expressive11_public',
    voiceId: FEMALE_VOICES.hope,
    gender: 'female',
    role: 'AI Learning Assistant',
  },
};

// Get avatar by course/section ID
export function getAvatar(id: string): AvatarConfig | undefined {
  return AVATARS[id];
}

// Get avatar for a course by slug
export function getAvatarForCourse(courseSlug: string): AvatarConfig {
  const mapping: Record<string, string> = {
    'cna': 'cna',
    'cna-training': 'cna',
    'phlebotomy': 'phlebotomy',
    'medical-assistant': 'medicalAssistant',
    'healthcare': 'healthcare',
    'hvac': 'hvac',
    'hvac-technician': 'hvac',
    'cdl': 'cdl',
    'cdl-training': 'cdl',
    'electrical': 'electrical',
    'barber': 'barber',
    'barber-apprenticeship': 'barber',
    'cosmetology': 'cosmetology',
    'it-support': 'itSupport',
    'cybersecurity': 'cybersecurity',
    'technology': 'technology',
  };

  const avatarKey = mapping[courseSlug] || 'aiTutor';
  return AVATARS[avatarKey] || AVATARS.aiTutor;
}

// Get all avatars for a category
export function getAvatarsByCategory(category: 'healthcare' | 'trades' | 'technology' | 'beauty' | 'guides'): AvatarConfig[] {
  const categories: Record<string, string[]> = {
    healthcare: ['healthcare', 'cna', 'phlebotomy', 'medicalAssistant'],
    trades: ['trades', 'hvac', 'cdl', 'electrical'],
    technology: ['technology', 'itSupport', 'cybersecurity'],
    beauty: ['barber', 'cosmetology'],
    guides: ['welcome', 'chatAssistant', 'store', 'financialAid', 'vita', 'supersonic', 'aiTutor'],
  };

  return (categories[category] || []).map(id => AVATARS[id]).filter(Boolean);
}
