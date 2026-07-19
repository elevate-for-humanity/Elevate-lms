/**
 * Prompt Selector
 * 
 * Selects the correct generation prompts based on course type and credential.
 * This is the heart of the Credential Intelligence Engine.
 */

import { type CourseType, type GenerationMode } from './course-types';
import { type CredentialBlueprint } from './credential-registry';
import { type CredentialDefinition } from './credential-registry-universal';
import { type ExamBlueprint, topicToPrompt } from './exam-blueprints';

export interface PromptConfig {
  courseType: CourseType;
  credential?: CredentialBlueprint | CredentialDefinition;
  blueprint?: ExamBlueprint;
  generationMode: GenerationMode;
}

export interface ContentPrompts {
  lesson: string;
  quiz: string;
  flashcard: string;
  procedure?: string;
  practiceExam?: string;
}

/**
 * Generic prompts for non-credential courses
 */
const GENERIC_PROMPTS: ContentPrompts = {
  lesson: `You are writing instructional content for a professional training course.

Write 900-1100 words covering:
- Learning objectives
- Key concepts and definitions
- Practical applications
- Step-by-step procedures where applicable
- Common mistakes to avoid

Use clear, professional language appropriate for adult learners.
Return ONLY the lesson text in markdown.`,

  quiz: `Generate 10 multiple-choice quiz questions.

Requirements:
- Exactly 4 answer choices per question
- One correct answer
- Rationale for correct answer
- Mix of factual and scenario-based questions
- Do NOT use "all of the above" or "none of the above"

Return valid JSON.`,

  flashcard: `Generate 10 flashcard term/definition pairs.

Requirements:
- Key vocabulary and concepts
- Concise definitions (1-2 sentences)
- Return valid JSON.`,

  practiceExam: `Generate a practice exam with questions covering all course topics.

Format: 50 multiple-choice questions
- Include all major topics
- Mix of difficulty levels
- Include rationale for answers`,
};

/**
 * Barber apprenticeship prompts
 */
const BARBER_PROMPTS: ContentPrompts = {
  lesson: `You are writing instructional content for a DOL-registered barber apprenticeship program in Indiana.

Write 900-1100 words covering:
- Why this topic matters to working barbers
- State board exam relevance
- Competency demonstrations
- Indiana-specific regulations where applicable

Use professional but accessible language.
Return ONLY the lesson text in markdown.`,

  quiz: `You are writing quiz questions for Indiana barber apprenticeship.

Generate 20 questions:
- 8 factual recall
- 8 scenario-based
- 4 applied judgment

Indiana state board exam relevance required.
Return valid JSON.`,

  flashcard: `Generate 15 barber-specific flashcards.

Cover: terminology, state regulations, techniques, safety.
Return valid JSON.`,

  practiceExam: `Generate Indiana barber state board practice exam.

100 questions matching state board format:
- Infection Control: 25%
- Hair Science & Scalp: 20%
- Haircutting & Styling: 25%
- Chemical Services: 15%
- State Laws: 15%`,
};

/**
 * Credential exam prep prompts
 */
const CREDENTIAL_PROMPTS: ContentPrompts = {
  lesson: `You are writing EXAM PREP content for the {CREDENTIAL_NAME}.

EXAM: {CREDENTIAL_EXAM_FORMAT}
PASSING: {CREDENTIAL_PASSING_SCORE}%

Write content that:
- Covers EXACTLY what will be tested
- Includes critical numbers and rules students MUST memorize
- Has exam tips: "Students often miss this question because..."
- Uses the exact regulation language from official standards
- Explains WHY answers are correct, not just WHAT is correct

Return 900-1100 words in markdown.`,

  quiz: `You are writing {CREDENTIAL_NAME} exam practice questions.

EXAM: {CREDENTIAL_EXAM_FORMAT}
STYLE: Match the actual {CREDENTIAL_PROVIDER} exam

Generate {QUESTION_COUNT} questions:
- Factual recall (definitions, rules, numbers)
- Scenario-based ("A technician is servicing...")
- Calculation questions where applicable

Each question:
- Exactly 4 choices
- One correct answer
- Detailed rationale explaining WHY it's correct
- Note which exam topic it covers

CRITICAL NUMBERS TO INCLUDE:
{CRITICAL_NUMBERS}

Return valid JSON.`,

  flashcard: `Generate {CREDENTIAL_NAME} exam flashcards.

Include:
- Key vocabulary
- Critical numbers
- Rules and regulations
- Common exam traps

{QUESTION_COUNT} flashcards.
Return valid JSON.`,

  practiceExam: `Generate {CREDENTIAL_NAME} full practice exam.

EXAM: {CREDENTIAL_EXAM_FORMAT}
SECTIONS: {EXAM_SECTIONS}

Generate {TOTAL_QUESTIONS} questions matching the exact exam structure.
Include:
- Section breakdown
- Correct answers
- Detailed rationales
- Exam strategy tips

Format: Timed exam simulation`,

  procedure: `You are writing hands-on lab procedures for {CREDENTIAL_NAME} practical skills.

Cover:
- Safety requirements
- Step-by-step procedure
- Common mistakes
- Competency checklist

Return JSON array of steps.`,
};

/**
 * Build credential prompt with substitutions
 */
function buildCredentialPrompt(template: string, config: PromptConfig): string {
  const { credential, blueprint } = config;
  
  if (!credential) return template;
  
  let prompt = template
    .replace('{CREDENTIAL_NAME}', credential.name)
    .replace('{CREDENTIAL_PROVIDER}', credential.provider)
    .replace('{CREDENTIAL_PASSING_SCORE}', `${credential.passingScore}%`)
    .replace('{CREDENTIAL_EXAM_FORMAT}', credential.examFormat);
  
  // Add exam sections
  if (credential.examSections.length > 0) {
    const sections = credential.examSections
      .map(s => `${s.name}: ${s.questions} questions`)
      .join('; ');
    prompt = prompt.replace('{EXAM_SECTIONS}', sections);
    prompt = prompt.replace('{TOTAL_QUESTIONS}', `${credential.totalQuestions}`);
  }
  
  // Add blueprint topics
  if (blueprint) {
    prompt = prompt.replace('{BLUEPRINT_TOPICS}', topicToPrompt(blueprint));
  }
  
  // Add critical numbers
  if (blueprint?.criticalNumbers) {
    const numbers = Object.entries(blueprint.criticalNumbers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    prompt = prompt.replace('{CRITICAL_NUMBERS}', numbers);
  }
  
  // Add question count
  prompt = prompt.replace('{QUESTION_COUNT}', '20');
  
  return prompt;
}

/**
 * Get prompts for course type and credential
 */
export function getPrompts(config: PromptConfig): ContentPrompts {
  const { courseType, credential } = config;
  
  // Credential exam prep
  if (courseType === 'credential' && credential) {
    return {
      lesson: buildCredentialPrompt(CREDENTIAL_PROMPTS.lesson, config),
      quiz: buildCredentialPrompt(CREDENTIAL_PROMPTS.quiz, config),
      flashcard: buildCredentialPrompt(CREDENTIAL_PROMPTS.flashcard, config),
      practiceExam: buildCredentialPrompt(CREDENTIAL_PROMPTS.practiceExam, config),
    };
  }
  
  // Apprenticeship
  if (courseType === 'apprenticeship') {
    // Check if barber
    if (credential?.slug === 'indiana-barber' || 
        credential?.slug?.includes('barber')) {
      return BARBER_PROMPTS;
    }
    
    // Generic apprenticeship
    return {
      ...GENERIC_PROMPTS,
      lesson: `You are writing instructional content for a DOL-registered apprenticeship program.

Write 900-1100 words covering:
- Related Technical Instruction (RTI) objectives
- On-the-Job Learning (OJL) alignment
- Competency demonstrations
- Industry standards

Return markdown.`,
    };
  }
  
  // Licensure exam prep
  if (courseType === 'licensure') {
    return {
      ...GENERIC_PROMPTS,
      lesson: `You are writing state licensure exam prep content.

Write 900-1100 words covering:
- State board exam format and requirements
- Key regulations and rules
- Commonly tested topics
- Exam strategies

Return markdown.`,
      quiz: `Generate state board exam style questions.

Focus on:
- State-specific regulations
- Commonly missed questions
- Scenario-based situations

Return valid JSON.`,
    };
  }
  
  // Default: generic
  return GENERIC_PROMPTS;
}

/**
 * Get system prompt for AI instructor
 */
export function getInstructorSystemPrompt(config: PromptConfig): string {
  const { courseType, credential } = config;
  
  if (courseType === 'credential' && credential) {
    return `You are an expert instructor for ${credential.name} certification exam prep.

Your role:
- Prepare students to PASS the ${credential.name} exam
- Focus on exam-critical content
- Identify weak areas
- Provide practice questions

Exam: ${credential.examFormat}
Passing: ${credential.passingScore}%
Provider: ${credential.provider}

Always connect content to exam objectives.`;
  }
  
  if (courseType === 'apprenticeship') {
    return `You are a master craftsman instructor for a DOL-registered apprenticeship.

Your role:
- Guide students through related technical instruction
- Connect theory to on-the-job learning
- Prepare students for competency demonstrations

Connect every lesson to practical application.`;
  }
  
  return `You are a professional training instructor.

Your role:
- Deliver clear, accurate instruction
- Check understanding regularly
- Connect concepts to real-world application

Keep responses focused and practical.`;
}

/**
 * Get content generation system prompt
 */
export function getContentSystemPrompt(config: PromptConfig): string {
  const { courseType, credential, blueprint } = config;
  
  let prompt = `You are an expert instructional designer.`;
  
  if (courseType === 'credential' && credential) {
    prompt += `

You are creating ${credential.name} certification exam prep materials.
Provider: ${credential.provider}
Exam format: ${credential.examFormat}
Passing score: ${credential.passingScore}%`;
    
    if (blueprint) {
      prompt += `

CRITICAL NUMBERS STUDENTS MUST MEMORIZE:
${Object.entries(blueprint.criticalNumbers).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`;
    }
  }
  
  prompt += `

Your content MUST:
- Be exam-focused
- Include specific numbers and rules
- Have clear explanations
- Help students pass the certification exam

Write for adult learners who need practical, actionable content.`;
  
  return prompt;
}
