import { createClient } from '@/lib/supabase/server';
import { auditLog } from '@/lib/auditLog';

// =====================================================
// CONTENT MODERATION TYPES
// =====================================================

export type ContentType = 'course' | 'discussion' | 'comment' | 'review' | 'message' | 'profile';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'removed';
export type ModerationAction = 'approve' | 'reject' | 'flag' | 'remove' | 'warn';
export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'copyright'
  | 'misinformation'
  | 'hate_speech'
  | 'violence'
  | 'other';

export interface ModerationReport {
  id: string;
  content_type: ContentType;
  content_id: string;
  reporter_id: string;
  reason: ReportReason;
  description?: string;
  status: ModerationStatus;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  moderator_notes?: string;
}

export interface ModerationRule {
  id: string;
  name: string;
  description: string;
  content_types: ContentType[];
  keywords: string[];
  action: ModerationAction;
  enabled: boolean;
}

// =====================================================
// CONTENT FILTERING
// =====================================================

const PROFANITY_LIST = [
  // Add profanity words here
  'badword1',
  'badword2', // Content
];

const SPAM_PATTERNS = [
  /\b(buy now|click here|limited time|act now)\b/gi,
  /\b(viagra|cialis|pharmacy)\b/gi,
  /\b(casino|poker|gambling)\b/gi,
  /(http[s]?:\/\/[^\s]+){3,}/gi, // Multiple URLs
];

/**
 * Check if content contains profanity
 */
export function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some((word) => lowerText.includes(word));
}

/**
 * Check if content appears to be spam
 */
export function isSpam(text: string): boolean {
  return SPAM_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Filter profanity from text
 */
export function filterProfanity(text: string): string {
  let filtered = text;
  PROFANITY_LIST.forEach((word) => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  return filtered;
}

/**
 * Analyze content for moderation issues
 */
export function analyzeContent(text: string): {
  hasProfanity: boolean;
  isSpam: boolean;
  score: number; // 0-100, higher = more problematic
  flags: string[];
} {
  const flags: string[] = [];
  let score = 0;

  if (containsProfanity(text)) {
    flags.push('profanity');
    score += 30;
  }

  if (isSpam(text)) {
    flags.push('spam');
    score += 40;
  }

  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 20) {
    flags.push('excessive_caps');
    score += 10;
  }

  // Check for excessive punctuation
  const punctRatio = (text.match(/[!?]{2,}/g) || []).length;
  if (punctRatio > 3) {
    flags.push('excessive_punctuation');
    score += 10;
  }

  return {
    hasProfanity: flags.includes('profanity'),
    isSpam: flags.includes('spam'),
    score,
    flags,
  };
}

// =====================================================
// REPORTING SYSTEM
// =====================================================

/**
 * Report content for moderation
 */
export async function reportContent(
  contentType: ContentType,
  contentId: string,
  reporterId: string,
  reason: ReportReason,
  description?: string,
): Promise<ModerationReport> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('moderation_reports')
    .insert({
      content_type: contentType,
      content_id: contentId,
      reporter_id: reporterId,
      reason,
      description,
      status: 'pending',
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  // Log audit event
  await auditLog({
    action: 'content_reported',
    actor_id: reporterId,
    target_type: contentType,
    target_id: contentId,
    metadata: { reason, description },
  });

  return data;
}

/**
 * Get pending moderation reports
 */
export async function getPendingReports(
  contentType?: ContentType,
  limit: number = 50,
): Promise<ModerationReport[]> {
  const supabase = await createClient();

  let query = supabase
    .from('moderation_reports')
    .select(
      `
      *,
      reporter:profiles!reporter_id(first_name, last_name, email),
      reviewer:profiles!reviewed_by(first_name, last_name, email)
    `,
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

/**
 * Get all reports for specific content
 */
export async function getContentReports(
  contentType: ContentType,
  contentId: string,
): Promise<ModerationReport[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('moderation_reports')
    .select('*')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

/**
 * Review a moderation report
 */
export async function reviewReport(
  reportId: string,
  moderatorId: string,
  action: ModerationAction,
  notes?: string,
): Promise<void> {
  const supabase = await createClient();

  // Get report details
  const { data: report } = await supabase
    .from('moderation_reports')
    .select('*')
    .eq('id', reportId)
    .maybeSingle();

  if (!report) throw new Error('Report not found');

  // Update report status
  const newStatus =
    action === 'approve'
      ? 'approved'
      : action === 'reject'
        ? 'rejected'
        : action === 'flag'
          ? 'flagged'
          : action === 'remove'
            ? 'removed'
            : 'pending';

  await supabase
    .from('moderation_reports')
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: moderatorId,
      moderator_notes: notes,
    })
    .eq('id', reportId);

  // Take action on the content
  await moderateContent(report.content_type, report.content_id, action, moderatorId, notes);

  // Log audit event
  await auditLog({
    action: 'content_moderated',
    actor_id: moderatorId,
    target_type: report.content_type,
    target_id: report.content_id,
    metadata: {
      report_id: reportId,
      action,
      reason: report.reason,
      notes,
    },
  });
}

/**
 * Moderate content directly
 */
export async function moderateContent(
  contentType: ContentType,
  contentId: string,
  action: ModerationAction,
  moderatorId: string,
  notes?: string,
): Promise<void> {
  const supabase = await createClient();

  switch (action) {
    case 'approve':
      // Mark content as approved
      await updateContentStatus(contentType, contentId, 'approved');
      break;

    case 'reject':
      // Mark content as rejected (hidden but not deleted)
      await updateContentStatus(contentType, contentId, 'rejected');
      break;

    case 'flag':
      // Flag content for further review
      await updateContentStatus(contentType, contentId, 'flagged');
      break;

    case 'remove':
      // Remove content (soft delete)
      await updateContentStatus(contentType, contentId, 'removed');
      break;

    case 'warn':
      // Send warning to content creator
      await sendModerationWarning(contentType, contentId, moderatorId, notes);
      break;
  }

  // Record moderation action
  await supabase.from('moderation_actions').insert({
    content_type: contentType,
    content_id: contentId,
    moderator_id: moderatorId,
    action,
    notes,
  });
}

/**
 * Update content moderation status
 */
async function updateContentStatus(
  contentType: ContentType,
  contentId: string,
  status: ModerationStatus,
): Promise<void> {
  const supabase = await createClient();

  const tableName = getTableName(contentType);

  await supabase.from(tableName).update({ moderation_status: status }).eq('id', contentId);
}

/**
 * Send moderation warning to user
 */
async function sendModerationWarning(
  contentType: ContentType,
  contentId: string,
  moderatorId: string,
  reason?: string,
): Promise<void> {
  const supabase = await createClient();

  // Get content creator
  const tableName = getTableName(contentType);
  const { data: content } = await supabase
    .from(tableName)
    .select('user_id, author_id, instructor_id')
    .eq('id', contentId)
    .maybeSingle();

  if (!content) return;

  const userId = content.user_id || content.author_id || content.instructor_id;

  // Create notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'moderation_warning',
    title: 'Content Moderation Warning',
    message: `Your ${contentType} has been flagged for review. ${reason || 'Please review our community guidelines.'}`,
    link: `/moderation/${contentType}/${contentId}`,
  });
}

/**
 * Get table name for content type
 */
function getTableName(contentType: ContentType): string {
  const tableMap: Record<ContentType, string> = {
    course: 'courses',
    discussion: 'discussions',
    comment: 'comments',
    review: 'reviews',
    message: 'messages',
    profile: 'profiles',
  };
  return tableMap[contentType];
}

// =====================================================
// AUTOMATED MODERATION RULES
// =====================================================

/**
 * Get active moderation rules
 */
export async function getModerationRules(): Promise<ModerationRule[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('moderation_rules')
    .select('*')
    .eq('enabled', true)
    .order('name');

  if (error) throw error;

  return data || [];
}

/**
 * Apply moderation rules to content
 */
export async function applyModerationRules(
  contentType: ContentType,
  contentId: string,
  text: string,
): Promise<{
  shouldFlag: boolean;
  matchedRules: string[];
  suggestedAction: ModerationAction | null;
}> {
  const rules = await getModerationRules();
  const matchedRules: string[] = [];
  let suggestedAction: ModerationAction | null = null;

  for (const rule of rules) {
    // Check if rule applies to this content type
    if (!rule.content_types.includes(contentType)) continue;

    // Check if any keywords match
    const lowerText = text.toLowerCase();
    const hasMatch = rule.keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()));

    if (hasMatch) {
      matchedRules.push(rule.name);
      suggestedAction = rule.action;
    }
  }

  return {
    shouldFlag: matchedRules.length > 0,
    matchedRules,
    suggestedAction,
  };
}

/**
 * Auto-moderate content on creation
 */
export async function autoModerateContent(
  contentType: ContentType,
  contentId: string,
  text: string,
  authorId: string,
): Promise<{
  approved: boolean;
  reason?: string;
}> {
  // Analyze content
  const analysis = analyzeContent(text);

  // Apply rules
  const ruleCheck = await applyModerationRules(contentType, contentId, text);

  // Auto-reject if score is too high
  if (analysis.score >= 70) {
    await moderateContent(
      contentType,
      contentId,
      'remove',
      'system',
      `Auto-moderated: High risk score (${analysis.score})`,
    );
    return { approved: false, reason: 'Content flagged by automated system' };
  }

  // Flag for review if score is moderate
  if (analysis.score >= 40 || ruleCheck.shouldFlag) {
    await moderateContent(
      contentType,
      contentId,
      'flag',
      'system',
      `Flagged for review: Score ${analysis.score}, Rules: ${ruleCheck.matchedRules.join(', ')}`,
    );
    return { approved: false, reason: 'Content flagged for manual review' };
  }

  // Auto-approve if score is low
  await updateContentStatus(contentType, contentId, 'approved');
  return { approved: true };
}

// =====================================================
// MODERATION STATISTICS
// =====================================================

/**
 * Get moderation statistics
 */
export async function getModerationStats(
  startDate?: string,
  endDate?: string,
): Promise<{
  totalReports: number;
  pendingReports: number;
  approvedReports: number;
  rejectedReports: number;
  reportsByType: Record<ContentType, number>;
  reportsByReason: Record<ReportReason, number>;
  averageReviewTime: number; // in hours
}> {
  const supabase = await createClient();

  let query = supabase.from('moderation_reports').select('*');

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: reports, error } = await query;

  if (error) throw error;

  const stats = {
    totalReports: reports?.length || 0,
    pendingReports: reports?.filter((r) => r.status === 'pending').length || 0,
    approvedReports: reports?.filter((r) => r.status === 'approved').length || 0,
    rejectedReports: reports?.filter((r) => r.status === 'rejected').length || 0,
    reportsByType: {} as Record<ContentType, number>,
    reportsByReason: {} as Record<ReportReason, number>,
    averageReviewTime: 0,
  };

  // Calculate by type
  reports?.forEach((report) => {
    stats.reportsByType[report.content_type] = (stats.reportsByType[report.content_type] || 0) + 1;
    stats.reportsByReason[report.reason] = (stats.reportsByReason[report.reason] || 0) + 1;
  });

  // Calculate average review time
  const reviewedReports = reports?.filter((r) => r.reviewed_at) || [];
  if (reviewedReports.length > 0) {
    const totalTime = reviewedReports.reduce((sum, report) => {
      const created = new Date(report.created_at).getTime();
      const reviewed = new Date(report.reviewed_at!).getTime();
      return sum + (reviewed - created);
    }, 0);
    stats.averageReviewTime = totalTime / reviewedReports.length / (1000 * 60 * 60); // Convert to hours
  }

  return stats;
}

/**
 * Get moderator performance
 */
export async function getModeratorPerformance(
  moderatorId: string,
  startDate?: string,
  endDate?: string,
): Promise<{
  totalReviews: number;
  approvals: number;
  rejections: number;
  averageReviewTime: number;
}> {
  const supabase = await createClient();

  let query = supabase.from('moderation_reports').select('*').eq('reviewed_by', moderatorId);

  if (startDate) {
    query = query.gte('reviewed_at', startDate);
  }
  if (endDate) {
    query = query.lte('reviewed_at', endDate);
  }

  const { data: reviews, error } = await query;

  if (error) throw error;

  const stats = {
    totalReviews: reviews?.length || 0,
    approvals: reviews?.filter((r) => r.status === 'approved').length || 0,
    rejections: reviews?.filter((r) => r.status === 'rejected').length || 0,
    averageReviewTime: 0,
  };

  if (reviews && reviews.length > 0) {
    const totalTime = reviews.reduce((sum, review) => {
      const created = new Date(review.created_at).getTime();
      const reviewed = new Date(review.reviewed_at!).getTime();
      return sum + (reviewed - created);
    }, 0);
    stats.averageReviewTime = totalTime / reviews.length / (1000 * 60 * 60);
  }

  return stats;
}
