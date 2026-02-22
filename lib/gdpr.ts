// GDPR compliance utilities

import { createClient } from '@/lib/supabase/server';

export async function exportUserData(userId: string) {
  const supabase = await createClient();

  try {
    // Collect all user data from various tables
    const [profile, enrollments, certificates, assignments, grades, notes, messages] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('program_enrollments').select('*').eq('student_id', userId),
      supabase.from('certificates').select('*').eq('student_id', userId),
      supabase.from('assignments').select('*').eq('student_id', userId),
      supabase.from('grades').select('*').eq('student_id', userId),
      supabase.from('notes').select('*').eq('user_id', userId),
      supabase.from('messages').select('*').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`),
    ]);

    const userData = {
      profile: profile.data,
      enrollments: enrollments.data || [],
      certificates: certificates.data || [],
      assignments: assignments.data || [],
      grades: grades.data || [],
      notes: notes.data || [],
      messages: messages.data || [],
      exportDate: new Date().toISOString(),
      dataSubject: userId,
    };

    // Log the export request
    await supabase.from('gdpr_requests').insert({
      user_id: userId,
      request_type: 'data_export',
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    return {
      success: true,
      data: userData,
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

export async function deleteUserData(userId: string, options: { keepProfile?: boolean } = {}) {
  const supabase = await createClient();

  try {
    // Delete user data from all tables
    const deletions = await Promise.all([
      supabase.from('program_enrollments').delete().eq('student_id', userId),
      supabase.from('certificates').delete().eq('student_id', userId),
      supabase.from('assignments').delete().eq('student_id', userId),
      supabase.from('grades').delete().eq('student_id', userId),
      supabase.from('notes').delete().eq('user_id', userId),
      supabase.from('messages').delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`),
      supabase.from('quiz_attempts').delete().eq('student_id', userId),
      supabase.from('discussion_threads').delete().eq('author_id', userId),
    ]);

    // Optionally delete profile
    if (!options.keepProfile) {
      await supabase.from('profiles').delete().eq('id', userId);
    }

    // Log the deletion request
    await supabase.from('gdpr_requests').insert({
      user_id: userId,
      request_type: 'data_deletion',
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    return {
      success: true,
      deletedRecords: deletions.filter(d => !d.error).length,
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

export async function anonymizeUserData(userId: string) {
  const supabase = await createClient();

  try {
    // Anonymize personal data while keeping records for analytics
    const anonymousId = `anonymous_${Date.now()}`;

    await Promise.all([
      supabase.from('profiles').update({
        full_name: 'Anonymous User',
        email: `${anonymousId}@anonymized.local`,
        phone: null,
        address: null,
        date_of_birth: null,
      }).eq('id', userId),

      supabase.from('messages').update({
        content: '[Message content removed]',
      }).or(`sender_id.eq.${userId},recipient_id.eq.${userId}`),

      supabase.from('notes').update({
        content: '[Note content removed]',
      }).eq('user_id', userId),
    ]);

    // Log the anonymization request
    await supabase.from('gdpr_requests').insert({
      user_id: userId,
      request_type: 'data_anonymization',
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

export async function requestDataPortability(userId: string, format: 'json' | 'csv' = 'json') {
  const result = await exportUserData(userId);

  if (!result.success) {
    return result;
  }

  if (format === 'json') {
    return {
      success: true,
      data: JSON.stringify(result.data, null, 2),
      contentType: 'application/json',
      filename: `user_data_${userId}_${Date.now()}.json`,
    };
  }

  // CSV format would require converting each table to CSV
  return {
    success: true,
    data: result.data,
    contentType: 'application/json',
    filename: `user_data_${userId}_${Date.now()}.json`,
  };
}

export async function getGDPRRequests(userId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('gdpr_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    // Error: $1
    return [];
  }

  return data || [];
}

export async function updateConsentPreferences(userId: string, preferences: {
  marketing?: boolean;
  analytics?: boolean;
  functional?: boolean;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('consent_preferences')
    .upsert({
      user_id: userId,
      marketing: preferences.marketing ?? false,
      analytics: preferences.analytics ?? true,
      functional: preferences.functional ?? true,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    // Error: $1
    return { success: false, error: 'Operation failed' };
  }

  return { success: true };
}

export async function getConsentPreferences(userId: string) {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('consent_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // Return default preferences if none exist
    return {
      marketing: false,
      analytics: true,
      functional: true,
    };
  }

  return data;
}
