import type { ScoreResult, InterviewScore } from './types';
import { getQuestionsForProgram, getQuestionById } from './question-bank';

/**
 * Positive keywords that strongly indicate qualification
 */
const STRONG_POSITIVE_KEYWORDS = [
  'experienced', 'confident', 'professional', 'extensive', 'certified',
  'expert', 'skilled', 'trained', 'qualified', 'proficient', 'accomplished',
  'dedicated', 'committed', 'passionate', 'proven', 'successful', 'mastered'
];

/**
 * Moderate positive keywords that indicate basic qualification
 */
const MODERATE_POSITIVE_KEYWORDS = [
  'good', 'comfortable', 'willing', 'capable', 'able', 'familiar', 'knowledgeable',
  'experienced', 'competent', 'reliable', 'responsible', 'organized', 'detail'
];

/**
 * Weak positive indicators
 */
const WEAK_POSITIVE_KEYWORDS = [
  'some', 'little', 'basic', 'learning', 'trying', 'interest', 'curious'
];

/**
 * Negative keywords that may indicate disqualification
 */
const NEGATIVE_KEYWORDS = [
  'no', 'never', 'not', "don't", "doesn't", "won't", "wouldn't", "can't",
  'unable', 'difficult', 'struggle', 'problem', 'issue', 'concern', 'fear',
  'phobia', 'allergy', 'sensitive', 'limitation', 'cannot', 'impossible'
];

/**
 * Experience indicators - specific mention of personal experience
 */
const EXPERIENCE_INDICATORS = [
  'i have', "i've", 'my experience', 'i worked', 'i performed', 'i completed',
  'in my', 'through my', 'during my', 'i am', "i'm", 'i do', "i've been"
];

/**
 * Calculate score for a single response
 */
export function scoreResponse(
  questionId: string,
  response: string,
  domain: string
): ScoreResult {
  const question = getQuestionById(questionId);
  const weight = question?.weight || 1;
  const maxBaseScore = 10;
  
  const responseLower = response.toLowerCase();
  const responseLength = response.length;
  
  let score = 5; // Start at neutral score of 5
  
  // Strong positive keywords: +2 each, max +4
  const strongPositiveCount = STRONG_POSITIVE_KEYWORDS.filter(
    keyword => responseLower.includes(keyword)
  ).length;
  score += Math.min(strongPositiveCount * 2, 4);
  
  // Moderate positive keywords: +1 each, max +3
  const moderatePositiveCount = MODERATE_POSITIVE_KEYWORDS.filter(
    keyword => responseLower.includes(keyword)
  ).length;
  score += Math.min(moderatePositiveCount, 3);
  
  // Negative keywords: -1 each, max -4
  const negativeCount = NEGATIVE_KEYWORDS.filter(
    keyword => responseLower.includes(keyword)
  ).length;
  score -= Math.min(negativeCount, 4);
  
  // Response length bonus/penalty
  if (responseLength > 150) {
    score += 1; // Detailed response bonus
  } else if (responseLength < 30) {
    score -= 1; // Too brief penalty
  }
  
  // Specific experience mention bonus
  const hasExperienceMention = EXPERIENCE_INDICATORS.some(
    indicator => responseLower.includes(indicator)
  );
  if (hasExperienceMention) {
    score += 1;
  }
  
  // Apply weight multiplier
  const weightedScore = score * weight;
  const maxWeightedScore = maxBaseScore * weight;
  
  // Determine which rubric level was achieved
  let rubricLevel: 'excellent' | 'good' | 'fair' | 'poor';
  const percentage = (score / maxBaseScore) * 100;
  
  if (percentage >= 85) {
    rubricLevel = 'excellent';
  } else if (percentage >= 70) {
    rubricLevel = 'good';
  } else if (percentage >= 50) {
    rubricLevel = 'fair';
  } else {
    rubricLevel = 'poor';
  }
  
  const rubricText = question?.scoringRubric[rubricLevel] || '';
  
  return {
    score: Math.max(0, Math.min(weightedScore, maxWeightedScore)),
    maxScore: maxWeightedScore,
    percentage: Math.max(0, Math.min(percentage, 100)),
    domain,
    rubric: rubricLevel
  };
}

/**
 * Calculate total interview score from all responses
 */
export function calculateInterviewScore(
  responses: Record<string, string>,
  programSlug: string
): InterviewScore {
  const questions = getQuestionsForProgram(programSlug);
  const questionScores: ScoreResult[] = [];
  const domainScores: Record<string, { score: number; maxScore: number }> = {};
  
  let totalScore = 0;
  let maxTotalScore = 0;
  
  // Score each response
  for (const question of questions) {
    const response = responses[question.id];
    
    if (response) {
      const result = scoreResponse(question.id, response, question.domain);
      questionScores.push(result);
      
      totalScore += result.score;
      maxTotalScore += result.maxScore;
      
      // Accumulate domain scores
      if (!domainScores[question.domain]) {
        domainScores[question.domain] = { score: 0, maxScore: 0 };
      }
      domainScores[question.domain].score += result.score;
      domainScores[question.domain].maxScore += result.maxScore;
    }
  }
  
  const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;
  
  // Determine eligibility based on percentage
  let eligibility: 'eligible' | 'review' | 'denied';
  if (percentage >= 60) {
    eligibility = 'eligible';
  } else if (percentage >= 40) {
    eligibility = 'review';
  } else {
    eligibility = 'denied';
  }
  
  // Check required domains - fail if any required domain has score < 5
  for (const question of questions) {
    if (question.requiredDomain && domainScores[question.domain]) {
      const domainPercentage = (domainScores[question.domain].score / domainScores[question.domain].maxScore) * 100;
      if (domainPercentage < 50) {
        eligibility = 'review';
        break;
      }
    }
  }
  
  // Determine risk level based on percentage
  let riskLevel: 'low' | 'medium' | 'high';
  if (percentage >= 85) {
    riskLevel = 'low';
  } else if (percentage >= 70) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }
  
  return {
    totalScore,
    maxScore: maxTotalScore,
    percentage: Math.round(percentage * 10) / 10,
    domainScores,
    questionScores,
    riskLevel,
    eligibility
  };
}

/**
 * Calculate domain-specific average score
 */
export function calculateDomainAverage(
  domainScores: Record<string, { score: number; maxScore: number }>,
  domain: string
): number {
  const domainScore = domainScores[domain];
  if (!domainScore || domainScore.maxScore === 0) return 0;
  return (domainScore.score / domainScore.maxScore) * 100;
}

/**
 * Get a summary of interview performance
 */
export function getInterviewSummary(score: InterviewScore): {
  overallRating: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendation: string;
} {
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  
  // Identify domain strengths and weaknesses
  for (const [domain, { score: domainScore, maxScore }] of Object.entries(score.domainScores)) {
    const percentage = (domainScore / maxScore) * 100;
    if (percentage >= 80) {
      strengths.push(`${domain}: ${percentage.toFixed(0)}%`);
    } else if (percentage < 60) {
      areasForImprovement.push(`${domain}: ${percentage.toFixed(0)}%`);
    }
  }
  
  let overallRating: string;
  if (score.percentage >= 90) {
    overallRating = 'Exceptional';
  } else if (score.percentage >= 80) {
    overallRating = 'Excellent';
  } else if (score.percentage >= 70) {
    overallRating = 'Good';
  } else if (score.percentage >= 60) {
    overallRating = 'Satisfactory';
  } else if (score.percentage >= 50) {
    overallRating = 'Needs Improvement';
  } else {
    overallRating = 'Below Expectations';
  }
  
  let recommendation: string;
  switch (score.eligibility) {
    case 'eligible':
      recommendation = 'Applicant is eligible for the program with full funding options.';
      break;
    case 'review':
      recommendation = 'Application requires additional review by admissions team.';
      break;
    case 'denied':
      recommendation = 'Application does not meet minimum requirements at this time.';
      break;
  }
  
  return {
    overallRating,
    strengths,
    areasForImprovement,
    recommendation
  };
}

export default {
  scoreResponse,
  calculateInterviewScore,
  calculateDomainAverage,
  getInterviewSummary
};
