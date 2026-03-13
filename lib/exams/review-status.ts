export const EXAM_REVIEW_STATUSES = [
  'clear',
  'flagged',
  'under_review',
  'invalidated'
] as const

export type ExamReviewStatus = typeof EXAM_REVIEW_STATUSES[number]
