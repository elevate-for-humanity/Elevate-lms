import type { InterviewSession, ConversationMessage, InterviewQuestion } from './types';
import { getQuestionsForProgram } from './question-bank';
import { calculateInterviewScore } from './scoring-engine';

export type SerializedConversationMessage = Omit<ConversationMessage, 'timestamp'> & {
  timestamp: string;
};

export type SerializedInterviewSession = Omit<
  InterviewSession,
  'messages' | 'startedAt' | 'completedAt'
> & {
  messages: SerializedConversationMessage[];
  startedAt: string;
  completedAt?: string;
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

const PARS_INTRO = `Hello! I'm PARS, your AI interview assistant for Elevate for Humanity. 

I'm here to learn more about you and your goals to help determine the best path forward for your career training.

This interview consists of 8 questions covering topics like your experience, motivation, and ability to meet program requirements. Take your time to answer each question thoughtfully.

Your responses will be used to:
• Assess your eligibility for the program
• Identify potential funding opportunities
• Create a personalized onboarding plan

Remember, there are no right or wrong answers. Just be honest and share your experiences openly.

Shall we begin?`;

const FOLLOWUP_PROMPT = `Thank you for sharing that. Let me follow up with another question to better understand your perspective...`;

function generateCompletionMessage(score: number, eligibility: string): string {
  const scoreEmoji = score >= 80 ? '🌟' : score >= 60 ? '👍' : '📋';
  let message = `${scoreEmoji} Thank you for completing the PARS Interview!\n\n`;
  message += `Your responses have been scored and analyzed. Here's a summary:\n\n`;
  message += `**Interview Score:** ${score}%\n`;
  message += `**Status:** ${eligibility.charAt(0).toUpperCase() + eligibility.slice(1)}\n\n`;
  if (eligibility === 'eligible') {
    message += `🎉 **Great news!** You've demonstrated the qualifications needed for this program.\n\n`;
    message += `**Next Steps:**\n`;
    message += `1. Complete your document submission\n`;
    message += `2. Verify your funding eligibility\n`;
    message += `3. Schedule your enrollment approval\n\n`;
    message += `Our admissions team will be in touch within 24-48 hours to guide you through the next steps.`;
  } else if (eligibility === 'review') {
    message += `📋 Your application has been flagged for additional review by our admissions team.\n\n`;
    message += `**What happens next:**\n`;
    message += `• Our team will review your responses\n`;
    message += `• You may be contacted for additional information\n`;
    message += `• We'll reach out within 2-3 business days\n\n`;
    message += `Please ensure your contact information is up to date.`;
  } else {
    message += `⚠️ Based on your responses, this program may not be the best fit at this time.\n\n`;
    message += `**Why this decision was made:**\n`;
    message += `Your responses indicate some areas that may need additional development before pursuing this career path.\n\n`;
    message += `**Options available:**\n`;
    message += `• Contact admissions for guidance\n`;
    message += `• Consider alternative programs\n`;
    message += `• Reapply after 90 days with updated experience\n\n`;
    message += `We encourage you to explore other opportunities with Elevate.`;
  }
  return message;
}

function generateResponseFeedback(questionId: string, score: number): string {
  const question = getQuestionsForProgram('').find((item) => item.id === questionId);
  const domain = question?.domain || 'General';
  if (score >= 8) return `Excellent response! Your experience and qualifications in ${domain} are clearly evident.`;
  if (score >= 6) return `Good response. You've demonstrated solid understanding in ${domain}.`;
  if (score >= 4) return `Thank you for your response. Consider elaborating more on your specific experiences.`;
  return `I see. Let's continue with the next question to learn more about your background.`;
}

export class ConversationEngine {
  private session: InterviewSession;
  private questions: InterviewQuestion[];
  private currentFollowUpIndex = 0;

  constructor(session: InterviewSession) {
    this.session = session;
    this.questions = getQuestionsForProgram(session.programSlug);
  }

  startInterview(): ConversationMessage {
    if (this.session.status !== 'not_started') throw new Error('Interview has already started');
    this.session.status = 'in_progress';
    this.session.startedAt = new Date();
    const introMessage: ConversationMessage = {
      id: generateId(),
      role: 'paris',
      content: PARS_INTRO,
      timestamp: new Date(),
    };
    this.session.messages.push(introMessage);
    const firstQuestion = this.getCurrentQuestion();
    if (firstQuestion) {
      this.session.messages.push({
        id: generateId(),
        role: 'paris',
        content: firstQuestion.question,
        timestamp: new Date(),
        questionId: firstQuestion.id,
      });
      this.session.currentQuestionIndex = 0;
    }
    return introMessage;
  }

  getCurrentQuestion(): InterviewQuestion | null {
    const questionIndex = this.session.currentQuestionIndex;
    if (this.currentFollowUpIndex > 0 && this.currentFollowUpIndex < 2) {
      const current = this.questions[questionIndex];
      if (current && this.currentFollowUpIndex <= current.followUps.length) {
        return {
          ...current,
          question: current.followUps[this.currentFollowUpIndex - 1],
          id: `${current.id}-followup-${this.currentFollowUpIndex}`,
        };
      }
    }
    return questionIndex < this.questions.length ? this.questions[questionIndex] : null;
  }

  submitResponse(response: string): ConversationMessage[] {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) throw new Error('No active question');
    const responseMessages: ConversationMessage[] = [];
    const originalQuestionId = currentQuestion.id.split('-followup-')[0];
    this.session.responses[originalQuestionId] = this.session.responses[originalQuestionId]
      ? `${this.session.responses[originalQuestionId]} ${response}`
      : response;
    this.session.messages.push({
      id: generateId(),
      role: 'applicant',
      content: response,
      timestamp: new Date(),
      questionId: currentQuestion.id,
    });

    const originalQuestion = this.questions.find((question) => question.id === originalQuestionId);
    if (originalQuestion && this.currentFollowUpIndex < originalQuestion.followUps.length) {
      this.currentFollowUpIndex++;
      responseMessages.push({
        id: generateId(),
        role: 'paris',
        content: FOLLOWUP_PROMPT,
        timestamp: new Date(),
        questionId: currentQuestion.id,
      });
      responseMessages.push({
        id: generateId(),
        role: 'paris',
        content: originalQuestion.followUps[this.currentFollowUpIndex - 1],
        timestamp: new Date(),
        questionId: `${originalQuestionId}-followup-${this.currentFollowUpIndex}`,
      });
      this.session.messages.push(...responseMessages);
      return responseMessages;
    }

    this.currentFollowUpIndex = 0;
    this.session.currentQuestionIndex++;
    if (this.session.currentQuestionIndex >= this.questions.length) {
      const score = calculateInterviewScore(this.session.responses, this.session.programSlug);
      const completion: ConversationMessage = {
        id: generateId(),
        role: 'paris',
        content: generateCompletionMessage(score.percentage, score.eligibility),
        timestamp: new Date(),
      };
      this.session.messages.push(completion);
      responseMessages.push(completion);
      this.session.status = 'completed';
      this.session.completedAt = new Date();
      return responseMessages;
    }

    const score = calculateInterviewScore(this.session.responses, this.session.programSlug);
    const lastScore = score.questionScores[score.questionScores.length - 1];
    responseMessages.push({
      id: generateId(),
      role: 'paris',
      content: generateResponseFeedback(originalQuestionId, lastScore?.score || 5),
      timestamp: new Date(),
      questionId: currentQuestion.id,
      score: lastScore?.score,
    });
    const nextQuestion = this.getCurrentQuestion();
    if (nextQuestion) {
      responseMessages.push({
        id: generateId(),
        role: 'paris',
        content: nextQuestion.question,
        timestamp: new Date(),
        questionId: nextQuestion.id,
      });
    }
    this.session.messages.push(...responseMessages);
    return responseMessages;
  }

  skipQuestion(): ConversationMessage {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) throw new Error('No active question');
    const originalQuestionId = currentQuestion.id.split('-followup-')[0];
    this.session.responses[originalQuestionId] = '[SKIPPED]';
    this.session.messages.push({
      id: generateId(),
      role: 'applicant',
      content: '[Question skipped]',
      timestamp: new Date(),
      questionId: currentQuestion.id,
    });
    this.currentFollowUpIndex = 0;
    this.session.currentQuestionIndex++;

    if (this.session.currentQuestionIndex >= this.questions.length) {
      const score = calculateInterviewScore(this.session.responses, this.session.programSlug);
      const completion: ConversationMessage = {
        id: generateId(),
        role: 'paris',
        content: generateCompletionMessage(score.percentage, score.eligibility),
        timestamp: new Date(),
      };
      this.session.messages.push(completion);
      this.session.status = 'completed';
      this.session.completedAt = new Date();
      return completion;
    }

    const notification: ConversationMessage = {
      id: generateId(),
      role: 'paris',
      content: "No problem! Let's move on to the next question.",
      timestamp: new Date(),
    };
    this.session.messages.push(notification);
    const nextQuestion = this.getCurrentQuestion();
    if (nextQuestion) {
      this.session.messages.push({
        id: generateId(),
        role: 'paris',
        content: nextQuestion.question,
        timestamp: new Date(),
        questionId: nextQuestion.id,
      });
    }
    return notification;
  }

  completeInterview() {
    for (let index = this.session.currentQuestionIndex; index < this.questions.length; index++) {
      const question = this.questions[index];
      if (!this.session.responses[question.id]) this.session.responses[question.id] = '[NOT ANSWERED]';
    }
    this.session.status = 'completed';
    this.session.completedAt = new Date();
    return calculateInterviewScore(this.session.responses, this.session.programSlug);
  }

  getProgress(): { current: number; total: number; percentage: number } {
    const answeredQuestions = Object.keys(this.session.responses).filter((id) => !id.includes('-followup-')).length;
    return {
      current: answeredQuestions,
      total: this.questions.length,
      percentage: this.questions.length ? Math.round((answeredQuestions / this.questions.length) * 100) : 0,
    };
  }

  isComplete(): boolean {
    return this.session.status === 'completed';
  }

  canResume(): boolean {
    return this.session.status === 'in_progress';
  }

  toJSON(): SerializedInterviewSession {
    return {
      ...this.session,
      messages: this.session.messages.map((message) => ({
        ...message,
        timestamp: message.timestamp.toISOString(),
      })),
      startedAt: this.session.startedAt.toISOString(),
      completedAt: this.session.completedAt?.toISOString(),
    };
  }

  static fromJSON(data: SerializedInterviewSession | InterviewSession): ConversationEngine {
    const session: InterviewSession = {
      ...data,
      messages: data.messages.map((message) => ({
        ...message,
        timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp),
      })),
      startedAt: data.startedAt instanceof Date ? data.startedAt : new Date(data.startedAt),
      completedAt: data.completedAt
        ? data.completedAt instanceof Date
          ? data.completedAt
          : new Date(data.completedAt)
        : undefined,
    };
    return new ConversationEngine(session);
  }

  static createSession(applicationRef: string, programSlug: string): InterviewSession {
    return {
      sessionId: generateId(),
      applicationRef,
      programSlug,
      currentQuestionIndex: 0,
      messages: [],
      responses: {},
      status: 'not_started',
      startedAt: new Date(),
    };
  }

  getSession(): InterviewSession {
    return this.session;
  }
}

export default ConversationEngine;
