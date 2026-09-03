/**
 * Question Bank System - Full Assessment Management
 * Question types, banks, randomization, analytics
 */

export type QuestionType =
  | 'multiple-choice'
  | 'multiple-select'
  | 'true-false'
  | 'short-answer'
  | 'essay'
  | 'matching'
  | 'fill-in-blank'
  | 'ordering'
  | 'file-upload';

export interface Question {
  id: string;
  bankId: string;
  type: QuestionType;
  title: string;
  text: string;
  points: number;

  // Options for multiple choice/select
  options?: QuestionOption[];

  // Correct answers
  correctAnswers: string[];

  // Matching pairs
  matchingPairs?: MatchingPair[];

  // Ordering items
  orderingItems?: string[];

  // Metadata
  difficulty: 'easy' | 'medium' | 'hard';
  bloomsLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  tags: string[];
  learningObjectives: string[];

  // Analytics
  timesUsed: number;
  averageScore: number;
  discriminationIndex: number; // How well it separates high/low performers

  // Settings
  allowPartialCredit: boolean;
  caseSensitive: boolean;
  randomizeOptions: boolean;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface MatchingPair {
  id: string;
  prompt: string;
  match: string;
}

export interface QuestionBank {
  id: string;
  name: string;
  description: string;
  courseId?: string;

  // Organization
  category: string;
  tags: string[];

  // Questions
  questionCount: number;

  // Sharing
  isPublic: boolean;
  sharedWith: string[]; // User IDs

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  instructions: string;

  // Question selection
  questions: AssessmentQuestion[];
  randomizeQuestions: boolean;
  questionsPerPage: number;

  // Timing
  timeLimit?: number; // minutes
  allowMultipleAttempts: boolean;
  attemptsAllowed: number;

  // Availability
  availableFrom: Date;
  availableUntil: Date;
  dueDate: Date;

  // Settings
  showCorrectAnswers: boolean;
  showCorrectAnswersAfter?: Date;
  oneQuestionAtATime: boolean;
  lockQuestionsAfterAnswering: boolean;
  requireRespondusLockdown: boolean;

  // Grading
  totalPoints: number;
  passingScore: number;
  gradingType: 'points' | 'percentage' | 'pass-fail' | 'letter-grade';

  // Access
  accessCode?: string;
  ipRestrictions?: string[];

  status: 'draft' | 'published' | 'archived';

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentQuestion {
  questionId: string;
  order: number;
  points: number; // Can override question default
  required: boolean;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  studentId: string;
  attemptNumber: number;

  // Timing
  startedAt: Date;
  submittedAt?: Date;
  timeSpent: number; // seconds

  // Answers
  answers: StudentAnswer[];

  // Scoring
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;

  // Status
  status: 'in-progress' | 'submitted' | 'graded' | 'needs-grading';

  // Proctoring
  ipAddress?: string;
  userAgent?: string;
  flaggedForReview: boolean;
  proctorNotes?: string;
}

export interface StudentAnswer {
  questionId: string;
  answer: string | string[]; // Single or multiple answers
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
  feedback?: string;
  timeSpent: number; // seconds
}

export interface AssessmentAnalytics {
  assessmentId: string;

  // Overall stats
  totalAttempts: number;
  averageScore: number;
  medianScore: number;
  highScore: number;
  lowScore: number;
  standardDeviation: number;

  // Distribution
  scoreDistribution: { range: string; count: number }[];

  // Question analysis
  questionStats: QuestionStats[];

  // Time analysis
  averageTimeSpent: number;
  medianTimeSpent: number;

  // Difficulty
  difficultyRating: 'too-easy' | 'appropriate' | 'too-hard';

  // Discrimination
  discriminationIndex: number; // -1 to 1, higher is better
}

export interface QuestionStats {
  questionId: string;
  questionText: string;

  // Performance
  timesAnswered: number;
  correctCount: number;
  incorrectCount: number;
  percentCorrect: number;

  // Item analysis
  discriminationIndex: number;
  pointBiserialCorrelation: number;

  // Common wrong answers
  commonWrongAnswers: { answer: string; count: number }[];

  // Recommendations
  needsReview: boolean;
  reviewReason?: string;
}

/**
 * Create question bank
 */
export async function createQuestionBank(
  name: string,
  description: string,
  courseId?: string,
): Promise<QuestionBank> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();

  const { data, error }: any = await supabase
    .from('question_banks')
    .insert({
      name,
      description,
      course_id: courseId,
      created_by: user.user?.id,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Add question to bank
 */
export async function addQuestionToBank(
  bankId: string,
  question: Omit<Question, 'id' | 'bankId' | 'createdAt' | 'updatedAt' | 'createdBy'>,
): Promise<Question> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();

  const { data, error }: any = await supabase
    .from('questions')
    .insert({
      bank_id: bankId,
      ...question,
      created_by: user.user?.id,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create assessment from question bank
 */
export async function createAssessmentFromBank(
  courseId: string,
  title: string,
  bankId: string,
  questionCount: number,
  options: {
    randomize?: boolean;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
  } = {},
): Promise<Assessment> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  // Get questions from bank
  let query = supabase.from('questions').select('*').eq('bank_id', bankId);

  if (options.difficulty) {
    query = query.eq('difficulty', options.difficulty);
  }

  if (options.tags && options.tags.length > 0) {
    query = query.contains('tags', options.tags);
  }

  const { data: questions } = await query;

  if (!questions || questions.length < questionCount) {
    throw new Error('Not enough questions in bank');
  }

  // Randomly select questions
  const selectedQuestions = options.randomize
    ? shuffleArray(questions).slice(0, questionCount)
    : questions.slice(0, questionCount);

  const assessmentQuestions: AssessmentQuestion[] = selectedQuestions.map((q, i) => ({
    questionId: q.id,
    order: i + 1,
    points: q.points,
    required: true,
  }));

  const totalPoints = assessmentQuestions.reduce((sum, q) => sum + q.points, 0);

  const { data: user } = await supabase.auth.getUser();

  const { data, error }: any = await supabase
    .from('assessments')
    .insert({
      course_id: courseId,
      title,
      questions: assessmentQuestions,
      total_points: totalPoints,
      randomize_questions: options.randomize || false,
      created_by: user.user?.id,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Grade assessment attempt
 */
export async function gradeAssessmentAttempt(attemptId: string): Promise<AssessmentAttempt> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  // Get attempt with questions
  const { data: attempt } = await supabase
    .from('assessment_attempts')
    .select(
      `
      *,
      assessment:assessments(*),
      answers:student_answers(*)
    `,
    )
    .eq('id', attemptId)
    .maybeSingle();

  if (!attempt) throw new Error('Attempt not found');

  // Get questions
  const questionIds = attempt.answers.map((a: Record<string, any>) => a.question_id);
  const { data: questions } = await supabase.from('questions').select('*').in('id', questionIds);

  if (!questions) throw new Error('Questions not found');

  // Grade each answer
  let totalScore = 0;
  const gradedAnswers: StudentAnswer[] = [];

  for (const answer of attempt.answers) {
    const question = questions.find((q) => q.id === answer.question_id);
    if (!question) continue;

    const graded = gradeAnswer(question, answer.answer);
    totalScore += graded.pointsEarned;

    gradedAnswers.push({
      questionId: answer.question_id,
      answer: answer.answer,
      isCorrect: graded.isCorrect,
      pointsEarned: graded.pointsEarned,
      pointsPossible: question.points,
      feedback: graded.feedback,
      timeSpent: answer.time_spent || 0,
    });
  }

  const maxScore = attempt.assessment.total_points;
  const percentage = (totalScore / maxScore) * 100;
  const passed = percentage >= attempt.assessment.passing_score;

  // Update attempt
  const { data: updated } = await supabase
    .from('assessment_attempts')
    .update({
      score: totalScore,
      max_score: maxScore,
      percentage,
      passed,
      status: 'graded',
      graded_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .select()
    .maybeSingle();

  return updated;
}

/**
 * Grade individual answer
 */
function gradeAnswer(
  question: Question,
  studentAnswer: string | string[],
): { isCorrect: boolean; pointsEarned: number; feedback?: string } {
  switch (question.type) {
    case 'multiple-choice':
    case 'true-false':
      const isCorrect = studentAnswer === question.correctAnswers[0];
      return {
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
        feedback: isCorrect ? 'Correct!' : 'Incorrect',
      };

    case 'multiple-select':
      const studentAnswers = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];
      const allCorrect = question.correctAnswers.every((a) => studentAnswers.includes(a));
      const noExtra = studentAnswers.every((a) => question.correctAnswers.includes(a));
      const correct = allCorrect && noExtra;

      if (question.allowPartialCredit) {
        const correctCount = studentAnswers.filter((a) =>
          question.correctAnswers.includes(a),
        ).length;
        const incorrectCount = studentAnswers.filter(
          (a) => !question.correctAnswers.includes(a),
        ).length;
        const score = Math.max(0, correctCount - incorrectCount);
        const maxScore = question.correctAnswers.length;
        const points = (score / maxScore) * question.points;

        return {
          isCorrect: correct,
          pointsEarned: points,
          feedback: correct ? 'Correct!' : 'Partially correct',
        };
      }

      return {
        isCorrect: correct,
        pointsEarned: correct ? question.points : 0,
        feedback: correct ? 'Correct!' : 'Incorrect',
      };

    case 'short-answer':
    case 'fill-in-blank':
      const answer = typeof studentAnswer === 'string' ? studentAnswer : studentAnswer[0];
      const matches = question.correctAnswers.some((correct) => {
        if (question.caseSensitive) {
          return answer === correct;
        }
        return answer.toLowerCase() === correct.toLowerCase();
      });

      return {
        isCorrect: matches,
        pointsEarned: matches ? question.points : 0,
        feedback: matches ? 'Correct!' : 'Incorrect',
      };

    case 'essay':
    case 'file-upload':
      // Requires manual grading
      return {
        isCorrect: false,
        pointsEarned: 0,
        feedback: 'Awaiting instructor review',
      };

    default:
      return {
        isCorrect: false,
        pointsEarned: 0,
        feedback: 'Unable to grade',
      };
  }
}

/**
 * Calculate assessment analytics
 */
export async function calculateAssessmentAnalytics(
  assessmentId: string,
): Promise<AssessmentAnalytics> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data: attempts } = await supabase
    .from('assessment_attempts')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('status', 'graded');

  if (!attempts || attempts.length === 0) {
    throw new Error('No graded attempts found');
  }

  const scores = attempts.map((a) => a.percentage);
  const times = attempts.map((a) => a.time_spent);

  const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const medianScore = calculateMedian(scores);
  const highScore = Math.max(...scores);
  const lowScore = Math.min(...scores);
  const stdDev = calculateStandardDeviation(scores);

  const averageTime = times.reduce((sum, t) => sum + t, 0) / times.length;
  const medianTime = calculateMedian(times);

  // Score distribution
  const distribution = [
    { range: '0-59%', count: scores.filter((s) => s < 60).length },
    { range: '60-69%', count: scores.filter((s) => s >= 60 && s < 70).length },
    { range: '70-79%', count: scores.filter((s) => s >= 70 && s < 80).length },
    { range: '80-89%', count: scores.filter((s) => s >= 80 && s < 90).length },
    { range: '90-100%', count: scores.filter((s) => s >= 90).length },
  ];

  // Difficulty rating
  let difficultyRating: 'too-easy' | 'appropriate' | 'too-hard';
  if (averageScore > 90) difficultyRating = 'too-easy';
  else if (averageScore < 60) difficultyRating = 'too-hard';
  else difficultyRating = 'appropriate';

  return {
    assessmentId,
    totalAttempts: attempts.length,
    averageScore,
    medianScore,
    highScore,
    lowScore,
    standardDeviation: stdDev,
    scoreDistribution: distribution,
    questionStats: [], // Would calculate per-question stats
    averageTimeSpent: averageTime,
    medianTimeSpent: medianTime,
    difficultyRating,
    discriminationIndex: 0, // Would calculate
  };
}

// Helper functions
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function calculateMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function calculateStandardDeviation(numbers: number[]): number {
  const avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const squareDiffs = numbers.map((n) => Math.pow(n - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, n) => sum + n, 0) / numbers.length;
  return Math.sqrt(avgSquareDiff);
}
