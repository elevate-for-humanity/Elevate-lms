import type { InterviewSession, ConversationMessage, InterviewQuestion } from './types';
import { getQuestionsForProgram } from './question-bank';
import { calculateInterviewScore } from './scoring-engine';

/**
 * Generates unique IDs for sessions and messages
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * PARS introduction message template
 */
const PARS_INTRO = `Hello! I'm PARS, your AI interview assistant for Elevate for Humanity. 

I'm here to learn more about you and your goals to help determine the best path forward for your career training.

This interview consists of 8 questions covering topics like your experience, motivation, and ability to meet program requirements. Take your time to answer each question thoughtfully.

Your responses will be used to:
• Assess your eligibility for the program
• Identify potential funding opportunities
• Create a personalized onboarding plan

Remember, there are no right or wrong answers. Just be honest and share your experiences openly.

Shall we begin?`;

/**
 * PARS follow-up question prompt
 */
const FOLLOWUP_PROMPT = `Thank you for sharing that. Let me follow up with another question to better understand your perspective...`;

/**
 * PARS completion message template
 */
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

/**
 * Generate feedback for a response
 */
function generateResponseFeedback(questionId: string, score: number): string {
  const question = getQuestionsForProgram('').find(q => q.id === questionId);
  const domain = question?.domain || 'General';
  
  if (score >= 8) {
    return `Excellent response! Your experience and qualifications in ${domain} are clearly evident.`;
  } else if (score >= 6) {
    return `Good response. You've demonstrated solid understanding in ${domain}.`;
  } else if (score >= 4) {
    return `Thank you for your response. Consider elaborating more on your specific experiences.`;
  } else {
    return `I see. Let's continue with the next question to learn more about your background.`;
  }
}

/**
 * Conversation Engine for managing interview sessions
 */
export class ConversationEngine {
  private session: InterviewSession;
  private questions: InterviewQuestion[];
  private currentFollowUpIndex: number = 0;

  constructor(session: InterviewSession) {
    this.session = session;
    this.questions = getQuestionsForProgram(session.programSlug);
    this.currentFollowUpIndex = 0;
  }

  /**
   * Start the interview with an introduction from PARS
   */
  startInterview(): ConversationMessage {
    if (this.session.status !== 'not_started') {
      throw new Error('Interview has already started');
    }

    // Update session status
    this.session.status = 'in_progress';
    this.session.startedAt = new Date();

    // Create introduction message
    const introMessage: ConversationMessage = {
      id: generateId(),
      role: 'paris',
      content: PARS_INTRO,
      timestamp: new Date()
    };

    this.session.messages.push(introMessage);

    // Add first question
    const firstQuestion = this.getCurrentQuestion();
    if (firstQuestion) {
      const questionMessage: ConversationMessage = {
        id: generateId(),
        role: 'paris',
        content: firstQuestion.question,
        timestamp: new Date(),
        questionId: firstQuestion.id
      };
      this.session.messages.push(questionMessage);
      this.session.currentQuestionIndex = 0;
    }

    return introMessage;
  }

  /**
   * Get the current question being asked
   */
  getCurrentQuestion(): InterviewQuestion | null {
    const questionIndex = this.session.currentQuestionIndex;
    
    // Check if there are follow-ups remaining for current question
    if (this.currentFollowUpIndex > 0 && this.currentFollowUpIndex < 2) {
      const currentQ = this.questions[questionIndex];
      if (currentQ && this.currentFollowUpIndex <= currentQ.followUps.length) {
        return {
          ...currentQ,
          question: currentQ.followUps[this.currentFollowUpIndex - 1],
          id: `${currentQ.id}-followup-${this.currentFollowUpIndex}`
        };
      }
    }
    
    // Return next main question
    if (questionIndex < this.questions.length) {
      return this.questions[questionIndex];
    }
    
    return null;
  }

  /**
   * Submit a response to the current question
   * Returns array of PARS messages (feedback + next question or completion)
   */
  submitResponse(response: string): ConversationMessage[] {
    const currentQuestion = this.getCurrentQuestion();
    
    if (!currentQuestion) {
      throw new Error('No active question');
    }

    const responseMessages: ConversationMessage[] = [];

    // Store the response
    const originalQuestionId = currentQuestion.id.split('-followup-')[0];
    this.session.responses[originalQuestionId] = this.session.responses[originalQuestionId] 
      ? `${this.session.responses[originalQuestionId]} ${response}`
      : response;

    // Store applicant message
    const applicantMessage: ConversationMessage = {
      id: generateId(),
      role: 'applicant',
      content: response,
      timestamp: new Date(),
      questionId: currentQuestion.id
    };
    this.session.messages.push(applicantMessage);

    // Determine if we should ask follow-up or move to next question
    const originalQuestion = this.questions.find(q => q.id === originalQuestionId);
    
    if (originalQuestion && this.currentFollowUpIndex < originalQuestion.followUps.length) {
      // Ask follow-up question
      this.currentFollowUpIndex++;
      
      const feedbackMessage: ConversationMessage = {
        id: generateId(),
        role: 'paris',
        content: FOLLOWUP_PROMPT,
        timestamp: new Date(),
        questionId: currentQuestion.id
      };
      responseMessages.push(feedbackMessage);

      const followUpQuestion = originalQuestion.followUps[this.currentFollowUpIndex - 1];
      const followUpMessage: ConversationMessage = {
        id: generateId(),
        role: 'paris',
        content: followUpQuestion,
        timestamp: new Date(),
        questionId: `${originalQuestionId}-followup-${this.currentFollowUpIndex}`
      };
      responseMessages.push(followUpMessage);
      this.session.messages.push(...responseMessages);
    } else {
      // Move to next question
      this.currentFollowUpIndex = 0;
      this.session.currentQuestionIndex++;

      // Check if interview is complete
      if (this.session.currentQuestionIndex >= this.questions.length) {
        const score = calculateInterviewScore(this.session.responses, this.session.programSlug);
        const completionMessage: ConversationMessage = {
          id: generateId(),
          role: 'paris',
          content: generateCompletionMessage(score.percentage, score.eligibility),
          timestamp: new Date()
        };
        responseMessages.push(completionMessage);
        this.session.messages.push(completionMessage);
        this.session.status = 'completed';
        this.session.completedAt = new Date();
      } else {
        // Send feedback and next question
        const score = calculateInterviewScore(this.session.responses, this.session.programSlug);
        const lastScore = score.questionScores[score.questionScores.length - 1];
        
        const feedbackMessage: ConversationMessage = {
          id: generateId(),
          role: 'paris',
          content: generateResponseFeedback(originalQuestionId, lastScore?.score || 5),
          timestamp: new Date(),
          questionId: currentQuestion.id,
          score: lastScore?.score
        };
        responseMessages.push(feedbackMessage);

        const nextQuestion = this.getCurrentQuestion();
        if (nextQuestion) {
          const nextMessage: ConversationMessage = {
            id: generateId(),
            role: 'paris',
            content: nextQuestion.question,
            timestamp: new Date(),
            questionId: nextQuestion.id
          };
          responseMessages.push(nextMessage);
        }
        
        this.session.messages.push(...responseMessages);
      }
    }

    return responseMessages;
  }

  /**
   * Skip the current question (marks as unanswered)
   */
  skipQuestion(): ConversationMessage {
    const currentQuestion = this.getCurrentQuestion();
    
    if (!currentQuestion) {
      throw new Error('No active question');
    }

    const originalQuestionId = currentQuestion.id.split('-followup-')[0];
    
    // Mark response as skipped
    this.session.responses[originalQuestionId] = '[SKIPPED]';

    const skipMessage: ConversationMessage = {
      id: generateId(),
      role: 'applicant',
      content: '[Question skipped]',
      timestamp: new Date(),
      questionId: currentQuestion.id
    };
    this.session.messages.push(skipMessage);

    // Move to next question
    this.currentFollowUpIndex = 0;
    this.session.currentQuestionIndex++;

    const responseMessages: ConversationMessage[] = [];

    // Check if interview is complete
    if (this.session.currentQuestionIndex >= this.questions.length) {
      const score = calculateInterviewScore(this.session.responses, this.session.programSlug);
      const completionMessage: ConversationMessage = {
        id: generateId(),
        role: 'paris',
        content: generateCompletionMessage(score.percentage, score.eligibility),
        timestamp: new Date()
      };
      responseMessages.push(completionMessage);
      this.session.messages.push(completionMessage);
      this.session.status = 'completed';
      this.session.completedAt = new Date();
    } else {
      const skipNotification: ConversationMessage = {
        id: generateId(),
        role: 'paris',
        content: "No problem! Let's move on to the next question.",
        timestamp: new Date()
      };
      responseMessages.push(skipNotification);

      const nextQuestion = this.getCurrentQuestion();
      if (nextQuestion) {
        const nextMessage: ConversationMessage = {
          id: generateId(),
          role: 'paris',
          content: nextQuestion.question,
          timestamp: new Date(),
          questionId: nextQuestion.id
        };
        responseMessages.push(nextMessage);
      }
      
      this.session.messages.push(...responseMessages);
    }

    return responseMessages[0];
  }

  /**
   * Complete the interview and calculate final score
   */
  completeInterview() {
    // Mark remaining questions as skipped
    for (let i = this.session.currentQuestionIndex; i < this.questions.length; i++) {
      const q = this.questions[i];
      if (!this.session.responses[q.id]) {
        this.session.responses[q.id] = '[NOT ANSWERED]';
      }
    }

    this.session.status = 'completed';
    this.session.completedAt = new Date();

    return calculateInterviewScore(this.session.responses, this.session.programSlug);
  }

  /**
   * Get progress information
   */
  getProgress(): { current: number; total: number; percentage: number } {
    const answeredQuestions = Object.keys(this.session.responses).filter(
      id => !id.includes('-followup-')
    ).length;
    
    return {
      current: answeredQuestions,
      total: this.questions.length,
      percentage: Math.round((answeredQuestions / this.questions.length) * 100)
    };
  }

  /**
   * Check if interview is complete
   */
  isComplete(): boolean {
    return this.session.status === 'completed';
  }

  /**
   * Check if interview can be resumed
   */
  canResume(): boolean {
    return this.session.status === 'in_progress';
  }

  /**
   * Serialize session for storage
   */
  toJSON(): InterviewSession {
    return {
      ...this.session,
      messages: this.session.messages.map(m => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp
      })),
      startedAt: this.session.startedAt instanceof Date ? this.session.startedAt.toISOString() : this.session.startedAt,
      completedAt: this.session.completedAt instanceof Date ? this.session.completedAt.toISOString() : this.session.completedAt
    };
  }

  /**
   * Deserialize session from storage
   */
  static fromJSON(data: InterviewSession): ConversationEngine {
    const session: InterviewSession = {
      ...data,
      messages: data.messages.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })),
      startedAt: new Date(data.startedAt),
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined
    };

    return new ConversationEngine(session);
  }

  /**
   * Create a new interview session
   */
  static createSession(applicationRef: string, programSlug: string): InterviewSession {
    return {
      sessionId: generateId(),
      applicationRef,
      programSlug,
      currentQuestionIndex: 0,
      messages: [],
      responses: {},
      status: 'not_started',
      startedAt: new Date()
    };
  }

  /**
   * Get the underlying session
   */
  getSession(): InterviewSession {
    return this.session;
  }
}

export default ConversationEngine;
