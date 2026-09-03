// Gradebook Types - Mature LMS Grading System

export type GradeCategory = {
  id: string;
  name: string;
  weight: number; // Percentage (0-100)
  dropLowest?: number;
  color?: string;
};

export type RubricCriterion = {
  id: string;
  name: string;
  description: string;
  points: number;
  levels: RubricLevel[];
};

export type RubricLevel = {
  id: string;
  name: string;
  description: string;
  points: number;
};

export type Rubric = {
  id: string;
  name: string;
  description?: string;
  criteria: RubricCriterion[];
  totalPoints: number;
};

export type Assignment = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  categoryId: string;
  points: number;
  dueDate: Date;
  rubricId?: string;
  allowLateSubmissions: boolean;
  latePenalty?: number; // Percentage per day
};

export type Submission = {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: Date;
  content: string;
  attachments?: string[];
  status: 'submitted' | 'graded' | 'returned' | 'late';
  isLate: boolean;
};

export type Grade = {
  id: string;
  submissionId: string;
  assignmentId: string;
  studentId: string;
  points: number;
  maxPoints: number;
  percentage: number;
  letterGrade?: string;
  feedback?: string;
  rubricScores?: RubricScore[];
  gradedBy: string;
  gradedAt: Date;
  isExcused: boolean;
  isDropped: boolean;
};

export type RubricScore = {
  criterionId: string;
  levelId: string;
  points: number;
  feedback?: string;
};

export type StudentGradeSummary = {
  studentId: string;
  courseId: string;
  categoryGrades: CategoryGrade[];
  overallGrade: number;
  overallPercentage: number;
  letterGrade: string;
  trend: 'improving' | 'declining' | 'stable';
};

export type CategoryGrade = {
  categoryId: string;
  categoryName: string;
  weight: number;
  earnedPoints: number;
  possiblePoints: number;
  percentage: number;
  droppedAssignments: string[];
};

export type GradebookSettings = {
  courseId: string;
  categories: GradeCategory[];
  gradeScale: GradeScale;
  allowLateSubmissions: boolean;
  defaultLatePenalty: number;
  showStudentGrades: boolean;
  showStudentRubrics: boolean;
  roundGrades: boolean;
};

export type GradeScale = {
  A: number;
  'A-': number;
  'B+': number;
  B: number;
  'B-': number;
  'C+': number;
  C: number;
  'C-': number;
  'D+': number;
  D: number;
  'D-': number;
  F: number;
};

export const DEFAULT_GRADE_SCALE: GradeScale = {
  A: 93,
  'A-': 90,
  'B+': 87,
  B: 83,
  'B-': 80,
  'C+': 77,
  C: 73,
  'C-': 70,
  'D+': 67,
  D: 63,
  'D-': 60,
  F: 0,
};
