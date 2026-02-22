import { logger } from '@/lib/logger';
/**
 * Drug Testing Service
 * Integration with National Drug Screening
 */

import { createClient } from '@/lib/supabase/server';
import type { DrugTest, DrugTestOrder, DrugTestResult, CollectionSite } from './types';

/**
 * Create a new drug test order
 */
export async function createDrugTest(order: DrugTestOrder): Promise<string | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get organization from enrollment
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('organization_id')
    .eq('id', order.enrollment_id)
    .single();

  if (!enrollment) return null;

  const { data, error }: any = await supabase
    .from('drug_tests')
    .insert({
      student_id: order.student_id,
      enrollment_id: order.enrollment_id,
      organization_id: enrollment.organization_id,
      test_type: order.test_type,
      panel_type: order.panel_type,
      scheduled_date: order.scheduled_date,
      collection_site: order.collection_site_id,
      required_by_program: order.required_by_program,
      required_by_employer: order.required_by_employer,
      required_by_funding: order.required_by_funding,
      notes: order.notes,
      status: 'scheduled',
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Error creating drug test:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * Get drug tests for a student
 */
export async function getStudentDrugTests(studentId: string): Promise<DrugTest[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('drug_tests')
    .select('*')
    .eq('student_id', studentId)
    .order('scheduled_date', { ascending: false });

  if (error) {
    logger.error('Error fetching drug tests:', error);
    return [];
  }

  return data || [];
}

/**
 * Get drug tests for an enrollment
 */
export async function getEnrollmentDrugTests(enrollmentId: string): Promise<DrugTest[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('drug_tests')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('scheduled_date', { ascending: false });

  if (error) {
    logger.error('Error fetching enrollment drug tests:', error);
    return [];
  }

  return data || [];
}

/**
 * Get pending drug tests (scheduled but not completed)
 */
export async function getPendingDrugTests(studentId: string): Promise<DrugTest[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('drug_tests')
    .select('*')
    .eq('student_id', studentId)
    .in('status', ['scheduled', 'pending_collection'])
    .order('scheduled_date', { ascending: true });

  if (error) {
    logger.error('Error fetching pending drug tests:', error);
    return [];
  }

  return data || [];
}

/**
 * Update drug test status
 */
export async function updateDrugTestStatus(
  testId: string,
  status: DrugTest['status'],
  notes?: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('drug_tests')
    .update({
      status,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', testId);

  if (error) {
    logger.error('Error updating drug test status:', error);
    return false;
  }

  return true;
}

/**
 * Record drug test result
 */
export async function recordDrugTestResult(result: DrugTestResult): Promise<boolean> {
  const supabase = await createClient();

  const status = result.result === 'positive' ? 'positive' :
                 result.result === 'negative' ? 'negative' :
                 'completed';

  const { error } = await supabase
    .from('drug_tests')
    .update({
      result: result.result,
      result_date: result.result_date,
      result_details: result.notes,
      lab_report_url: result.lab_report_url,
      mro_review_required: result.mro_review_required,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', result.test_id);

  if (error) {
    logger.error('Error recording drug test result:', error);
    return false;
  }

  return true;
}

/**
 * Get collection sites by state
 */
export async function getCollectionSites(state: string): Promise<CollectionSite[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('collection_sites')
    .select('*')
    .eq('state', state)
    .eq('active', true)
    .order('city');

  if (error) {
    logger.error('Error fetching collection sites:', error);
    return [];
  }

  return data || [];
}

/**
 * Get collection sites by city
 */
export async function getCollectionSitesByCity(
  state: string,
  city: string
): Promise<CollectionSite[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('collection_sites')
    .select('*')
    .eq('state', state)
    .eq('city', city)
    .eq('active', true);

  if (error) {
    logger.error('Error fetching collection sites:', error);
    return [];
  }

  return data || [];
}

/**
 * Get nearest collection sites (requires coordinates)
 */
export async function getNearestCollectionSites(
  latitude: number,
  longitude: number,
  limit: number = 10
): Promise<CollectionSite[]> {
  const supabase = await createClient();

  // Use PostGIS distance calculation if available
  // For now, return all active sites (can be enhanced with distance calculation)
  const { data, error }: any = await supabase
    .from('collection_sites')
    .select('*')
    .eq('active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(limit);

  if (error) {
    logger.error('Error fetching nearest collection sites:', error);
    return [];
  }

  return data || [];
}

/**
 * Cancel drug test
 */
export async function cancelDrugTest(testId: string, reason: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('drug_tests')
    .update({
      status: 'cancelled',
      notes: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', testId);

  if (error) {
    logger.error('Error cancelling drug test:', error);
    return false;
  }

  return true;
}

/**
 * Mark drug test as no-show
 */
export async function markDrugTestNoShow(testId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('drug_tests')
    .update({
      status: 'no_show',
      updated_at: new Date().toISOString(),
    })
    .eq('id', testId);

  if (error) {
    logger.error('Error marking drug test as no-show:', error);
    return false;
  }

  return true;
}

/**
 * Get drug test history
 */
export async function getDrugTestHistory(testId: string) {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('drug_test_history')
    .select(`
      *,
      profiles:performed_by(first_name, last_name)
    `)
    .eq('drug_test_id', testId)
    .order('performed_at', { ascending: false });

  if (error) {
    logger.error('Error fetching drug test history:', error);
    return [];
  }

  return data || [];
}

/**
 * Get drug testing policy for program
 */
export async function getProgramDrugTestingPolicy(programId: string) {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('drug_testing_policies')
    .select('*')
    .eq('program_id', programId)
    .eq('active', true)
    .single();

  if (error) {
    logger.error('Error fetching drug testing policy:', error);
    return null;
  }

  return data;
}

/**
 * Check if student needs drug test
 */
export async function checkDrugTestRequired(enrollmentId: string): Promise<{
  required: boolean;
  reason?: string;
  policy?: any;
}> {
  const supabase = await createClient();

  // Get enrollment with program
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select(`
      *,
      programs(id, name)
    `)
    .eq('id', enrollmentId)
    .single();

  if (!enrollment) {
    return { required: false };
  }

  // Check if program has drug testing policy
  const policy = await getProgramDrugTestingPolicy(enrollment.programs.id);

  if (!policy) {
    return { required: false };
  }

  // Check if pre-employment test is required
  if (policy.pre_employment_required) {
    // Check if student already has a completed pre-employment test
    const { data: existingTests } = await supabase
      .from('drug_tests')
      .select('id')
      .eq('enrollment_id', enrollmentId)
      .eq('test_type', 'pre_employment')
      .in('status', ['negative', 'completed']);

    if (!existingTests || existingTests.length === 0) {
      return {
        required: true,
        reason: 'Pre-employment drug test required by program policy',
        policy,
      };
    }
  }

  return { required: false, policy };
}

/**
 * Get drug test statistics for organization
 */
export async function getDrugTestStatistics(organizationId: string) {
  const supabase = await createClient();

  const { data: tests } = await supabase
    .from('drug_tests')
    .select('status, result, test_type')
    .eq('organization_id', organizationId);

  if (!tests) {
    return {
      total: 0,
      completed: 0,
      pending: 0,
      positive: 0,
      negative: 0,
      byType: {},
    };
  }

  const stats = {
    total: tests.length,
    completed: tests.filter(t => ['completed', 'positive', 'negative'].includes(t.status)).length,
    pending: tests.filter(t => ['scheduled', 'pending_collection', 'collected', 'in_lab'].includes(t.status)).length,
    positive: tests.filter(t => t.result === 'positive').length,
    negative: tests.filter(t => t.result === 'negative').length,
    byType: tests.reduce((acc: any, test) => {
      acc[test.test_type] = (acc[test.test_type] || 0) + 1;
      return acc;
    }, {}),
  };

  return stats;
}
