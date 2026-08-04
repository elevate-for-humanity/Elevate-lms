/**
 * WorkOne Funding Survey Configuration
 * 
 * This survey asks applicants about their WorkOne experience:
 * - Whether they went to WorkOne
 * - Whether they signed up for funding
 * - Whether they still need to go
 * - Whether they were put in other programs
 * - Whether they were persuaded away from Elevate
 */

export interface WorkOneSurveyQuestion {
  id: string;
  type: 'radio' | 'checkbox' | 'textarea' | 'text';
  question: string;
  description?: string;
  options?: string[];
  required: boolean;
  order: number;
}

export interface WorkOneSurveyConfig {
  id: string;
  label: string;
  title: string;
  description: string;
  emailSubject: string;
  emailPreviewText: string;
  questions: WorkOneSurveyQuestion[];
}

export const WORKONE_SURVEY: WorkOneSurveyConfig = {
  id: 'workone-funding-survey-v1',
  label: 'workone-funding-survey',
  title: 'WorkOne Experience Survey',
  description: 'We want to hear about your WorkOne experience to better support your career journey.',
  emailSubject: '📋 Quick Question About Your WorkOne Visit',
  emailPreviewText: 'Help us support you better — answer 5 quick questions',
  questions: [
    {
      id: 'went_to_workone',
      type: 'radio',
      question: 'Have you gone to WorkOne yet?',
      description: 'WorkOne is your local workforce center that can help with job training funding.',
      options: ['Yes, I have gone to WorkOne', 'No, I have not gone yet', 'I did not know I needed to go'],
      required: true,
      order: 1,
    },
    {
      id: 'signed_up_for_funding',
      type: 'radio',
      question: 'Did you sign up for funding through WorkOne?',
      description: 'Funding can help cover your training costs through programs like WIOA.',
      options: ['Yes, I signed up for funding', 'No, I did not sign up', 'I am still in the process', 'Not applicable — I went but did not need funding'],
      required: true,
      order: 2,
    },
    {
      id: 'needs_help_signing_up',
      type: 'radio',
      question: 'Do you need help signing up for funding or going to WorkOne?',
      options: [
        'Yes, I still need to go to WorkOne',
        'Yes, I went but did not sign up and need help',
        'No, I am all set with WorkOne',
      ],
      required: true,
      order: 3,
    },
    {
      id: 'was_put_in_other_program',
      type: 'radio',
      question: 'Were you put in another training program instead of Elevate?',
      description: 'Sometimes WorkOne may refer you to other programs. We want to know if that happened.',
      options: [
        'Yes, they put me in another program',
        'No, I was not put in another program',
        'I was encouraged to consider other options',
      ],
      required: true,
      order: 4,
    },
    {
      id: 'was_persuaded_away',
      type: 'radio',
      question: 'Did anyone try to convince you NOT to do the Elevate program?',
      description: 'We want to make sure you get the support you deserve.',
      options: [
        'Yes, someone tried to persuade me away from Elevate',
        'No, I was encouraged to pursue Elevate',
        'I did not experience any pressure either way',
      ],
      required: true,
      order: 5,
    },
    {
      id: 'additional_feedback',
      type: 'textarea',
      question: 'Is there anything else you would like to share about your WorkOne experience?',
      description: 'Your feedback helps us advocate for better support for students like you.',
      required: false,
      order: 6,
    },
    {
      id: 'wants_callback',
      type: 'checkbox',
      question: 'Would you like someone from Elevate to follow up with you?',
      options: ['Yes, please contact me', 'No, I am good for now'],
      required: true,
      order: 7,
    },
    {
      id: 'best_phone',
      type: 'text',
      question: 'What is the best phone number to reach you?',
      description: 'Only share if you want us to call you back.',
      required: false,
      order: 8,
    },
  ],
};

export function buildSurveyUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org';
  return `${baseUrl}/survey/workone?token=${token}`;
}

export function parseSurveyAnswers(
  answers: Record<string, any>
): Partial<{
  went_to_workone: boolean;
  signed_up_for_funding: boolean;
  still_needs_to_go: boolean;
  was_put_in_other_program: boolean;
  was_persuaded_away_from_elevate: boolean;
  other_program_details: string;
  feedback: string;
  wants_callback: boolean;
  preferred_contact_method: string;
  best_phone: string;
}> {
  const result: Record<string, any> = {};

  // Question 1: Went to WorkOne
  if (answers.went_to_workone) {
    result.went_to_workone = answers.went_to_workone.includes('Yes');
    result.still_needs_to_go = answers.went_to_workone.includes('have not gone') || 
                               answers.went_to_workone.includes('did not know');
  }

  // Question 2: Signed up for funding
  if (answers.signed_up_for_funding) {
    result.signed_up_for_funding = answers.signed_up_for_funding.includes('Yes');
  }

  // Question 3: Needs help
  if (answers.needs_help_signing_up) {
    result.still_needs_to_go = answers.needs_help_signing_up.includes('still need') || 
                               answers.needs_help_signing_up.includes('went but did not sign');
  }

  // Question 4: Put in other program
  if (answers.was_put_in_other_program) {
    result.was_put_in_other_program = answers.was_put_in_other_program.includes('Yes') ||
                                      answers.was_put_in_other_program.includes('encouraged');
    result.other_program_details = answers.was_put_in_other_program.join('; ');
  }

  // Question 5: Persuaded away
  if (answers.was_persuaded_away) {
    result.was_persuaded_away_from_elevate = answers.was_persuaded_away.includes('Yes');
  }

  // Question 6: Additional feedback
  if (answers.additional_feedback) {
    result.feedback = answers.additional_feedback;
  }

  // Question 7: Wants callback
  if (answers.wants_callback) {
    result.wants_callback = answers.wants_callback.includes('Yes');
    result.preferred_contact_method = 'phone';
  }

  // Question 8: Phone number
  if (answers.best_phone) {
    result.best_phone = answers.best_phone;
  }

  return result;
}
