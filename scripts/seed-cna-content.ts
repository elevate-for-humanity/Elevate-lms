// Seed script for CNA Module 1 content
export const cnaModule1Lessons = [
  {
    id: 'cna-lesson-1',
    title: 'Program Orientation & Introduction',
    order: 1,
    duration: 600, // 10 minutes
    video_url: '/videos/cna-orientation.mp4',
    content: `
      <h2>Welcome to the CNA Program</h2>
      <p>In this lesson, you'll learn about:</p>
      <ul>
        <li>Program structure and requirements</li>
        <li>Career opportunities as a CNA</li>
        <li>Professional expectations</li>
        <li>State certification process</li>
      </ul>
    `,
  },
  {
    id: 'cna-lesson-2',
    title: 'Healthcare Basics & Medical Terminology',
    order: 2,
    duration: 720, // 12 minutes
    video_url: '/videos/cna-healthcare-basics.mp4',
    content: `
      <h2>Healthcare Fundamentals</h2>
      <p>Understanding the healthcare environment and basic medical terms.</p>
    `,
  },
  {
    id: 'cna-lesson-3',
    title: 'Patient Safety & Infection Control',
    order: 3,
    duration: 900, // 15 minutes
    video_url: '/videos/cna-patient-safety.mp4',
    content: `
      <h2>Keeping Patients Safe</h2>
      <p>Learn critical safety protocols and infection prevention techniques.</p>
    `,
  },
  {
    id: 'cna-lesson-4',
    title: 'Infection Control Procedures',
    order: 4,
    duration: 720, // 12 minutes
    video_url: '/videos/cna-infection-control.mp4',
    content: `
      <h2>Infection Prevention</h2>
      <p>Proper handwashing, PPE usage, and contamination prevention.</p>
    `,
  },
  {
    id: 'cna-lesson-5',
    title: 'Communication Skills in Healthcare',
    order: 5,
    duration: 600, // 10 minutes
    video_url: '/videos/cna-communication.mp4',
    content: `
      <h2>Effective Communication</h2>
      <p>How to communicate with patients, families, and healthcare teams.</p>
    `,
  },
];

export const cnaModule1QuizQuestions = [
  {
    lesson_id: 'cna-lesson-1',
    question: 'What is the primary role of a Certified Nursing Assistant?',
    options: [
      'Prescribe medications',
      'Provide basic patient care under supervision',
      'Perform surgical procedures',
      'Diagnose medical conditions',
    ],
    correct_answer: 1,
    explanation:
      'CNAs provide basic patient care activities under the supervision of licensed nurses.',
  },
  {
    lesson_id: 'cna-lesson-1',
    question: 'How long is a typical CNA training program?',
    options: ['2-4 weeks', '4-12 weeks', '6 months', '1 year'],
    correct_answer: 1,
    explanation: 'Most CNA programs range from 4-12 weeks depending on the state and program.',
  },
  {
    lesson_id: 'cna-lesson-2',
    question: 'What does the medical term "vital signs" refer to?',
    options: [
      'Patient medications',
      'Temperature, pulse, respiration, blood pressure',
      'Patient diet',
      'Exercise routine',
    ],
    correct_answer: 1,
    explanation: "Vital signs are measurements of the body's basic functions.",
  },
  {
    lesson_id: 'cna-lesson-2',
    question: 'What does "NPO" mean in medical terminology?',
    options: [
      'New Patient Order',
      'Nothing by mouth',
      'Nurse Practice Only',
      'Normal Patient Observation',
    ],
    correct_answer: 1,
    explanation: 'NPO (nil per os) means the patient should not eat or drink anything.',
  },
  {
    lesson_id: 'cna-lesson-3',
    question: 'What is the most important way to prevent infection spread?',
    options: [
      'Wearing gloves at all times',
      'Proper hand hygiene',
      'Using antibiotics',
      'Avoiding all patient contact',
    ],
    correct_answer: 1,
    explanation: 'Hand hygiene is the single most effective way to prevent infection transmission.',
  },
  {
    lesson_id: 'cna-lesson-3',
    question: 'When should you wash your hands?',
    options: [
      'Only before meals',
      'Before and after patient contact',
      'Once per shift',
      'Only when visibly dirty',
    ],
    correct_answer: 1,
    explanation: 'Hands must be washed before and after every patient contact.',
  },
  {
    lesson_id: 'cna-lesson-4',
    question: 'What does PPE stand for?',
    options: [
      'Patient Protection Equipment',
      'Personal Protective Equipment',
      'Professional Practice Ethics',
      'Primary Prevention Effort',
    ],
    correct_answer: 1,
    explanation: 'PPE stands for Personal Protective Equipment.',
  },
  {
    lesson_id: 'cna-lesson-4',
    question: 'Which is NOT a component of standard precautions?',
    options: [
      'Hand hygiene',
      'Use of PPE',
      'Avoiding all patient contact',
      'Safe injection practices',
    ],
    correct_answer: 2,
    explanation: 'Standard precautions do not include avoiding patient contact.',
  },
  {
    lesson_id: 'cna-lesson-5',
    question: 'What is active listening?',
    options: [
      'Talking loudly',
      'Fully concentrating on what is being said',
      'Interrupting frequently',
      'Multitasking while listening',
    ],
    correct_answer: 1,
    explanation: 'Active listening means giving full attention to the speaker.',
  },
  {
    lesson_id: 'cna-lesson-5',
    question: 'How should you communicate with a patient who has hearing loss?',
    options: [
      'Shout loudly',
      'Face them and speak clearly',
      'Avoid communication',
      'Only use written notes',
    ],
    correct_answer: 1,
    explanation: 'Face the patient, speak clearly, and ensure good lighting for lip reading.',
  },
];
