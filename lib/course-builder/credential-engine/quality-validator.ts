/**
 * Quality Validator
 * 
 * After generation, automatically verify course quality against blueprint.
 * If below threshold, flag for regeneration or human review.
 */

import { type CredentialBlueprint } from './credential-registry';
import { type ExamBlueprint, getCriticalTopics } from './exam-blueprints';

export interface QualityScore {
  overall: number;
  blueprintCoverage: number;
  competencyAlignment: number;
  examReadiness: number;
  handsOnCoverage: number;
  accessibility: number;
  instructionalDesign: number;
}

export interface ValidationResult {
  passed: boolean;
  scores: QualityScore;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  type: 'missing' | 'incorrect' | 'incomplete' | 'quality';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location?: string;
  suggestion: string;
}

const QUALITY_THRESHOLD = 95;

/**
 * Validate generated course against blueprint
 */
export function validateCourse(
  generatedModules: GeneratedModule[],
  blueprint: ExamBlueprint,
  credential: CredentialBlueprint
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const recommendations: string[] = [];
  
  // Check blueprint coverage
  const blueprintCoverage = checkBlueprintCoverage(generatedModules, blueprint, issues);
  
  // Check competency alignment
  const competencyAlignment = checkCompetencyAlignment(generatedModules, blueprint, issues);
  
  // Check exam readiness
  const examReadiness = checkExamReadiness(generatedModules, blueprint, issues);
  
  // Check hands-on coverage
  const handsOnCoverage = checkHandsOnCoverage(generatedModules, blueprint, issues);
  
  // Check accessibility
  const accessibility = checkAccessibility(generatedModules, issues);
  
  // Check instructional design
  const instructionalDesign = checkInstructionalDesign(generatedModules, issues);
  
  // Calculate overall score
  const overall = Math.round(
    (blueprintCoverage * 0.25 +
     competencyAlignment * 0.20 +
     examReadiness * 0.25 +
     handsOnCoverage * 0.10 +
     accessibility * 0.10 +
     instructionalDesign * 0.10)
  );
  
  // Generate recommendations
  if (blueprintCoverage < 90) {
    recommendations.push('Add content for missing exam topics');
  }
  if (examReadiness < 90) {
    recommendations.push('Include more practice questions and exam strategies');
  }
  if (handsOnCoverage < 80) {
    recommendations.push('Add hands-on lab procedures if required by credential');
  }
  
  return {
    passed: overall >= QUALITY_THRESHOLD,
    scores: {
      overall,
      blueprintCoverage,
      competencyAlignment,
      examReadiness,
      handsOnCoverage,
      accessibility,
      instructionalDesign,
    },
    issues,
    recommendations,
  };
}

interface GeneratedModule {
  id: string;
  title: string;
  content: string;
  quizQuestions: number;
  flashcards: number;
  hasPracticeExam: boolean;
  examDomain?: string;
}

/**
 * Check if all blueprint topics are covered
 */
function checkBlueprintCoverage(
  modules: GeneratedModule[],
  blueprint: ExamBlueprint,
  issues: ValidationIssue[]
): number {
  const coveredTopics = new Set<string>();
  const criticalTopics = getCriticalTopics(blueprint);
  
  // Check each module for topic coverage
  for (const module of modules) {
    const contentLower = module.content.toLowerCase();
    
    for (const topic of blueprint.topics) {
      if (contentLower.includes(topic.title.toLowerCase())) {
        coveredTopics.add(topic.id);
      }
      
      // Check for key facts
      for (const fact of topic.keyFacts) {
        const keyWords = fact.toLowerCase().split(' ').slice(0, 3);
        if (keyWords.some(w => w.length > 4 && contentLower.includes(w))) {
          coveredTopics.add(topic.id);
        }
      }
    }
  }
  
  // Calculate coverage percentage
  const totalTopics = blueprint.topics.length;
  const covered = coveredTopics.size;
  const coverage = (covered / totalTopics) * 100;
  
  // Find missing critical topics
  for (const topic of criticalTopics) {
    if (!coveredTopics.has(topic.id)) {
      issues.push({
        type: 'missing',
        severity: 'critical',
        description: `Critical topic not covered: ${topic.title}`,
        suggestion: `Add content covering "${topic.title}" and key facts: ${topic.keyFacts.join('; ')}`,
      });
    }
  }
  
  return Math.round(coverage);
}

/**
 * Check competency alignment
 */
function checkCompetencyAlignment(
  modules: GeneratedModule[],
  blueprint: ExamBlueprint,
  issues: ValidationIssue[]
): number {
  // Check if exam domains are properly covered
  const domainCoverage = new Map<string, number>();
  
  for (const module of modules) {
    const domain = module.examDomain || 'unknown';
    const current = domainCoverage.get(domain) || 0;
    domainCoverage.set(domain, current + module.quizQuestions);
  }
  
  // Check if each exam section has questions
  let alignedSections = 0;
  const totalSections = blueprint.credential.examSections.length;
  
  for (const section of blueprint.credential.examSections) {
    const questions = domainCoverage.get(section.name) || 0;
    if (questions >= section.questions * 0.5) {
      alignedSections++;
    } else {
      issues.push({
        type: 'incomplete',
        severity: 'high',
        description: `${section.name} section has only ${questions} practice questions (need ~${section.questions})`,
        suggestion: `Add more quiz questions for ${section.name} section`,
      });
    }
  }
  
  alignedSections = domainCoverage.size > 0 ? alignedSections / totalSections : 0;
  return Math.round(alignedSections * 100);
}

/**
 * Check exam readiness
 */
function checkExamReadiness(
  modules: GeneratedModule[],
  blueprint: ExamBlueprint,
  issues: ValidationIssue[]
): number {
  let score = 100;
  
  // Check for practice exam
  const hasPracticeExam = modules.some(m => m.hasPracticeExam);
  if (!hasPracticeExam) {
    score -= 30;
    issues.push({
      type: 'missing',
      severity: 'critical',
      description: 'No practice exam found in course',
      suggestion: 'Add a full-length practice exam matching the certification exam format',
    });
  }
  
  // Check for flashcards
  const totalFlashcards = modules.reduce((sum, m) => sum + m.flashcards, 0);
  if (totalFlashcards < 50) {
    score -= 15;
    issues.push({
      type: 'incomplete',
      severity: 'medium',
      description: `Only ${totalFlashcards} flashcards found (recommend 50+)`,
      suggestion: 'Add more flashcards for key vocabulary and formulas',
    });
  }
  
  // Check for quiz questions
  const totalQuestions = modules.reduce((sum, m) => sum + m.quizQuestions, 0);
  const requiredQuestions = blueprint.credential.totalQuestions;
  if (totalQuestions < requiredQuestions * 0.8) {
    score -= 25;
    issues.push({
      type: 'incomplete',
      severity: 'high',
      description: `Only ${totalQuestions} practice questions (recommend ${requiredQuestions}+)`,
      suggestion: 'Add more quiz questions to match exam format',
    });
  }
  
  // Check for critical numbers in content
  const allContent = modules.map(m => m.content).join(' ');
  const criticalNumbers = blueprint.criticalNumbers || {};
  
  let numbersFound = 0;
  for (const value of Object.values(criticalNumbers)) {
    const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanValue.length >= 2 && allContent.includes(cleanValue)) {
      numbersFound++;
    }
  }
  
  const numbersCoverage = Object.keys(criticalNumbers).length > 0
    ? (numbersFound / Object.keys(criticalNumbers).length) * 100
    : 100;
  
  if (numbersCoverage < 80) {
    score -= 20;
    issues.push({
      type: 'missing',
      severity: 'high',
      description: 'Critical numbers not found in content',
      suggestion: 'Ensure all critical numbers (recovery %, vacuum levels, fines) are in the content',
    });
  }
  
  return Math.max(0, score);
}

/**
 * Check hands-on coverage
 */
function checkHandsOnCoverage(
  modules: GeneratedModule[],
  blueprint: ExamBlueprint,
  issues: ValidationIssue[]
): number {
  // If no lab requirements, return 100
  if (!blueprint.labRequirements || blueprint.labRequirements.length === 0) {
    return 100;
  }
  
  const allContent = modules.map(m => m.content).join(' ');
  let covered = 0;
  
  for (const lab of blueprint.labRequirements) {
    if (allContent.toLowerCase().includes(lab.toLowerCase())) {
      covered++;
    }
  }
  
  const coverage = (covered / blueprint.labRequirements.length) * 100;
  
  if (coverage < 100) {
    const missing = blueprint.labRequirements.filter(
      lab => !allContent.toLowerCase().includes(lab.toLowerCase())
    );
    issues.push({
      type: 'missing',
      severity: coverage < 50 ? 'high' : 'medium',
      description: `Missing lab coverage: ${missing.join(', ')}`,
      suggestion: 'Add hands-on procedures for practical skills',
    });
  }
  
  return Math.round(coverage);
}

/**
 * Check accessibility
 */
function checkAccessibility(
  modules: GeneratedModule[],
  issues: ValidationIssue[]
): number {
  let score = 100;
  
  for (const module of modules) {
    const content = module.content;
    
    // Check reading level (simplified)
    const words = content.split(/\s+/);
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    
    if (avgWordLength > 7) {
      score -= 5;
    }
  }
  
  return Math.max(0, score);
}

/**
 * Check instructional design quality
 */
function checkInstructionalDesign(
  modules: GeneratedModule[],
  issues: ValidationIssue[]
): number {
  let score = 100;
  
  for (const module of modules) {
    const content = module.content;
    
    // Check for variety in content
    if (content.length < 500) {
      score -= 10;
      issues.push({
        type: 'quality',
        severity: 'medium',
        description: `${module.title} has insufficient content`,
        suggestion: 'Expand lesson content to at least 800 words',
      });
    }
    
    // Check for quiz questions
    if (module.quizQuestions === 0) {
      score -= 15;
      issues.push({
        type: 'missing',
        severity: 'medium',
        description: `${module.title} has no quiz questions`,
        suggestion: 'Add assessment questions to check understanding',
      });
    }
  }
  
  return Math.max(0, score);
}

/**
 * Generate quality report
 */
export function generateQualityReport(result: ValidationResult): string {
  let report = '# Course Quality Report\n\n';
  
  report += `## Overall Score: ${result.scores.overall}%\n`;
  report += result.passed 
    ? '✅ **PASSED** - Course is ready for publication\n\n'
    : '⚠️ **NEEDS IMPROVEMENT** - Review issues below\n\n';
  
  report += '## Detailed Scores\n';
  report += `| Metric | Score | Status |\n`;
  report += `|--------|-------|--------|\n`;
  report += `| Blueprint Coverage | ${result.scores.blueprintCoverage}% | ${result.scores.blueprintCoverage >= 90 ? '✅' : '❌'} |\n`;
  report += `| Competency Alignment | ${result.scores.competencyAlignment}% | ${result.scores.competencyAlignment >= 90 ? '✅' : '❌'} |\n`;
  report += `| Exam Readiness | ${result.scores.examReadiness}% | ${result.scores.examReadiness >= 90 ? '✅' : '❌'} |\n`;
  report += `| Hands-on Coverage | ${result.scores.handsOnCoverage}% | ${result.scores.handsOnCoverage >= 80 ? '✅' : '❌'} |\n`;
  report += `| Accessibility | ${result.scores.accessibility}% | ${result.scores.accessibility >= 90 ? '✅' : '❌'} |\n`;
  report += `| Instructional Design | ${result.scores.instructionalDesign}% | ${result.scores.instructionalDesign >= 90 ? '✅' : '❌'} |\n`;
  
  if (result.issues.length > 0) {
    report += '\n## Issues\n';
    for (const issue of result.issues) {
      report += `\n### ${issue.severity.toUpperCase()}: ${issue.description}\n`;
      report += `**Suggestion:** ${issue.suggestion}\n`;
    }
  }
  
  if (result.recommendations.length > 0) {
    report += '\n## Recommendations\n';
    for (const rec of result.recommendations) {
      report += `- ${rec}\n`;
    }
  }
  
  return report;
}
