import { createClient } from '@/lib/supabase/server';

// =====================================================
// FEEDBACK TYPES
// =====================================================

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'complaint' | 'praise' | 'other';
export type FeedbackStatus =
  | 'new'
  | 'reviewing'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'declined';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Feedback {
  id: string;
  user_id: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  category?: string;
  page_url?: string;
  browser_info?: string;
  screenshot_url?: string;
  votes: number;
  created_at: string;
  updated_at: string;
  admin_response?: string;
  responded_at?: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  target_audience?: 'all' | 'students' | 'instructors' | 'admins';
  status: 'draft' | 'active' | 'closed';
  start_date?: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  response_count: number;
}

export interface SurveyQuestion {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'rating' | 'scale';
  question: string;
  options?: string[];
  required: boolean;
  order: number;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  user_id: string;
  answers: Record<string, any>;
  completed_at: string;
}

// =====================================================
// FEEDBACK FUNCTIONS
// =====================================================

/**
 * Submit user feedback
 */
export async function submitFeedback(
  userId: string,
  type: FeedbackType,
  title: string,
  description: string,
  options?: {
    category?: string;
    pageUrl?: string;
    browserInfo?: string;
    screenshotUrl?: string;
  },
): Promise<Feedback> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('feedback')
    .insert({
      user_id: userId,
      type,
      title,
      description,
      category: options?.category,
      page_url: options?.pageUrl,
      browser_info: options?.browserInfo,
      screenshot_url: options?.screenshotUrl,
      status: 'new',
      priority: 'medium',
      votes: 0,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Get all feedback
 */
export async function getAllFeedback(
  filters?: {
    type?: FeedbackType;
    status?: FeedbackStatus;
    priority?: FeedbackPriority;
  },
  limit: number = 50,
): Promise<Feedback[]> {
  const supabase = await createClient();

  let query = supabase
    .from('feedback')
    .select(
      `
      *,
      user:profiles!user_id(first_name, last_name, email)
    `,
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

/**
 * Get user's feedback
 */
export async function getUserFeedback(userId: string): Promise<Feedback[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

/**
 * Update feedback status
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus,
  adminResponse?: string,
): Promise<void> {
  const supabase = await createClient();

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (adminResponse) {
    updateData.admin_response = adminResponse;
    updateData.responded_at = new Date().toISOString();
  }

  const { error } = await supabase.from('feedback').update(updateData).eq('id', feedbackId);

  if (error) throw error;

  // Notify user if status changed to completed or declined
  if (status === 'completed' || status === 'declined') {
    const { data: feedback } = await supabase
      .from('feedback')
      .select('user_id, title')
      .eq('id', feedbackId)
      .single();

    if (feedback) {
      await supabase.from('notifications').insert({
        user_id: feedback.user_id,
        type: 'feedback_update',
        title: 'Feedback Update',
        message: `Your feedback "${feedback.title}" has been ${status}`,
        link: `/feedback/${feedbackId}`,
      });
    }
  }
}

/**
 * Vote on feedback
 */
export async function voteFeedback(feedbackId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from('feedback_votes')
    .select('id')
    .eq('feedback_id', feedbackId)
    .eq('user_id', userId)
    .single();

  if (existingVote) {
    // Remove vote
    await supabase.from('feedback_votes').delete().eq('id', existingVote.id);

    await supabase.rpc('decrement_feedback_votes', { feedback_id: feedbackId });
  } else {
    // Add vote
    await supabase.from('feedback_votes').insert({
      feedback_id: feedbackId,
      user_id: userId,
    });

    await supabase.rpc('increment_feedback_votes', { feedback_id: feedbackId });
  }
}

/**
 * Get feedback statistics
 */
export async function getFeedbackStats(): Promise<{
  total: number;
  byType: Record<FeedbackType, number>;
  byStatus: Record<FeedbackStatus, number>;
  byPriority: Record<FeedbackPriority, number>;
  averageResponseTime: number; // in hours
}> {
  const supabase = await createClient();

  const { data: feedback, error } = await supabase.from('feedback').select('*');

  if (error) throw error;

  const stats = {
    total: feedback?.length || 0,
    byType: {} as Record<FeedbackType, number>,
    byStatus: {} as Record<FeedbackStatus, number>,
    byPriority: {} as Record<FeedbackPriority, number>,
    averageResponseTime: 0,
  };

  feedback?.forEach((item) => {
    stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
    stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
    stats.byPriority[item.priority] = (stats.byPriority[item.priority] || 0) + 1;
  });

  // Calculate average response time
  const respondedFeedback = feedback?.filter((f) => f.responded_at) || [];
  if (respondedFeedback.length > 0) {
    const totalTime = respondedFeedback.reduce((sum, item) => {
      const created = new Date(item.created_at).getTime();
      const responded = new Date(item.responded_at!).getTime();
      return sum + (responded - created);
    }, 0);
    stats.averageResponseTime = totalTime / respondedFeedback.length / (1000 * 60 * 60);
  }

  return stats;
}

// =====================================================
// SURVEY FUNCTIONS
// =====================================================

/**
 * Create a survey
 */
export async function createSurvey(
  creatorId: string,
  title: string,
  description: string,
  questions: SurveyQuestion[],
  options?: {
    targetAudience?: 'all' | 'students' | 'instructors' | 'admins';
    startDate?: string;
    endDate?: string;
  },
): Promise<Survey> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('surveys')
    .insert({
      title,
      description,
      questions,
      target_audience: options?.targetAudience || 'all',
      status: 'draft',
      start_date: options?.startDate,
      end_date: options?.endDate,
      created_by: creatorId,
      response_count: 0,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Get active surveys for user
 */
export async function getActiveSurveys(
  userRole: 'student' | 'instructor' | 'admin',
): Promise<Survey[]> {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data, error }: any = await supabase
    .from('surveys')
    .select('*')
    .eq('status', 'active')
    .or(`target_audience.eq.all,target_audience.eq.${userRole}`)
    .lte('start_date', now)
    .gte('end_date', now)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

/**
 * Get all surveys (admin)
 */
export async function getAllSurveys(): Promise<Survey[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('surveys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

/**
 * Submit survey response
 */
export async function submitSurveyResponse(
  surveyId: string,
  userId: string,
  answers: Record<string, any>,
): Promise<SurveyResponse> {
  const supabase = await createClient();

  // Check if user already responded
  const { data: existing } = await supabase
    .from('survey_responses')
    .select('id')
    .eq('survey_id', surveyId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    throw new Error('You have already responded to this survey');
  }

  const { data, error }: any = await supabase
    .from('survey_responses')
    .insert({
      survey_id: surveyId,
      user_id: userId,
      answers,
    })
    .select()
    .single();

  if (error) throw error;

  // Increment response count
  await supabase.rpc('increment_survey_responses', { survey_id: surveyId });

  return data;
}

/**
 * Get survey responses
 */
export async function getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('survey_responses')
    .select(
      `
      *,
      user:profiles!user_id(first_name, last_name, email, role)
    `,
    )
    .eq('survey_id', surveyId)
    .order('completed_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

/**
 * Analyze survey results
 */
export async function analyzeSurveyResults(surveyId: string): Promise<{
  totalResponses: number;
  questionAnalysis: Array<{
    questionId: string;
    question: string;
    type: string;
    responses: any;
  }>;
}> {
  const supabase = await createClient();

  // Get survey
  const { data: survey } = await supabase.from('surveys').select('*').eq('id', surveyId).single();

  if (!survey) throw new Error('Survey not found');

  // Get responses
  const responses = await getSurveyResponses(surveyId);

  const analysis = {
    totalResponses: responses.length,
    questionAnalysis: survey.questions.map((q: SurveyQuestion) => {
      const questionResponses = responses.map((r) => r.answers[q.id]).filter(Boolean);

      let responseData: any = {};

      switch (q.type) {
        case 'text':
        case 'textarea':
          responseData = {
            responses: questionResponses,
          };
          break;

        case 'radio':
        case 'checkbox':
          responseData = {
            options: q.options?.map((option) => ({
              option,
              count: questionResponses.filter((r) =>
                Array.isArray(r) ? r.includes(option) : r === option,
              ).length,
            })),
          };
          break;

        case 'rating':
        case 'scale':
          const numericResponses = questionResponses.map((r) => Number(r)).filter((n) => !isNaN(n));
          responseData = {
            average: numericResponses.reduce((a, b) => a + b, 0) / numericResponses.length || 0,
            min: Math.min(...numericResponses),
            max: Math.max(...numericResponses),
            distribution: numericResponses.reduce(
              (acc, val) => {
                acc[val] = (acc[val] || 0) + 1;
                return acc;
              },
              {} as Record<number, number>,
            ),
          };
          break;
      }

      return {
        questionId: q.id,
        question: q.question,
        type: q.type,
        responses: responseData,
      };
    }),
  };

  return analysis;
}

/**
 * Update survey status
 */
export async function updateSurveyStatus(
  surveyId: string,
  status: 'draft' | 'active' | 'closed',
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('surveys').update({ status }).eq('id', surveyId);

  if (error) throw error;
}

/**
 * Delete survey
 */
export async function deleteSurvey(surveyId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('surveys').delete().eq('id', surveyId);

  if (error) throw error;
}
