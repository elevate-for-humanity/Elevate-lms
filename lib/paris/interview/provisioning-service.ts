import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { InterviewSession, InterviewScore, EligibilityResult, ProvisioningResult } from './types';

// Initialize Supabase admin client
function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Program-specific document requirements for digital binder
 */
const PROGRAM_DOCUMENT_REQUIREMENTS: Record<string, string[]> = {
  default: [
    'Government-issued photo ID',
    'Social Security card or proof of SSN',
    'Proof of address (utility bill from last 30 days)',
    'High school diploma or GED',
    'Employment authorization'
  ],
  'barber-apprenticeship': [
    'Government-issued photo ID',
    'Social Security card or proof of SSN',
    'Proof of address (utility bill from last 30 days)',
    'High school diploma or GED',
    'Completion of barber theory exam',
    'Background check authorization',
    'Two professional references'
  ],
  'cdl-training': [
    'Government-issued photo ID',
    'Social Security card',
    'Valid state driver license',
    'Driving record (MVR) from past 3 years',
    'DOT physical examination certificate',
    'Drug screening clearance',
    'Proof of address',
    'High school diploma or GED'
  ],
  'hvac': [
    'Government-issued photo ID',
    'Social Security card or proof of SSN',
    'Proof of address',
    'High school diploma or GED',
    'EPA 608 certification (if available)',
    'Basic math skills assessment',
    'Technical aptitude evaluation'
  ],
  'medical-assistant': [
    'Government-issued photo ID',
    'Social Security card or proof of SSN',
    'Proof of address',
    'High school diploma or GED',
    'Immunization records',
    'Background check authorization',
    'CPR certification (if available)',
    'Healthcare experience documentation (if applicable)'
  ],
  'cosmetology': [
    'Government-issued photo ID',
    'Social Security card or proof of SSN',
    'Proof of address',
    'High school diploma or GED',
    'Cosmetology theory exam completion',
    'Background check authorization',
    'Creative portfolio (optional)'
  ],
  'phlebotomy': [
    'Government-issued photo ID',
    'Social Security card or proof of SSN',
    'Proof of address',
    'High school diploma or GED',
    'Immunization records',
    'Background check authorization',
    'CPR certification',
    'Proof of 18 years or older'
  ]
};

/**
 * Program-specific onboarding tasks
 */
const PROGRAM_ONBOARDING_TASKS: Record<string, { title: string; description: string; day: number }[]> = {
  default: [
    { title: 'Complete profile setup', description: 'Fill out your student profile with contact information', day: 1 },
    { title: 'Upload required documents', description: 'Submit all required enrollment documents', day: 1 },
    { title: 'Review student handbook', description: 'Read and acknowledge the student handbook', day: 2 },
    { title: 'Complete orientation module', description: 'Watch the program orientation video', day: 3 },
    { title: 'Meet your cohort', description: 'Introduce yourself in the cohort discussion forum', day: 5 }
  ],
  'barber-apprenticeship': [
    { title: 'Complete profile setup', description: 'Fill out your student profile with contact information', day: 1 },
    { title: 'Upload required documents', description: 'Submit all required enrollment documents including background check', day: 1 },
    { title: 'Review student handbook', description: 'Read and acknowledge the student handbook and safety guidelines', day: 2 },
    { title: 'Complete orientation module', description: 'Watch the barber apprenticeship orientation video', day: 3 },
    { title: 'Kit ordering', description: 'Order your barber kit and supplies', day: 5 },
    { title: 'Meet your mentor', description: 'Introduction session with your assigned mentor', day: 7 },
    { title: 'Review licensing requirements', description: 'Understand state barber licensing exam requirements', day: 10 }
  ],
  'cdl-training': [
    { title: 'Complete profile setup', description: 'Fill out your student profile with contact information', day: 1 },
    { title: 'Upload required documents', description: 'Submit driving record, DOT physical, drug screening results', day: 1 },
    { title: 'Review student handbook', description: 'Read and acknowledge the CDL program handbook', day: 2 },
    { title: 'Complete orientation module', description: 'Watch the CDL training orientation video', day: 3 },
    { title: 'Schedule permit test', description: 'Schedule your written CDL permit exam', day: 5 },
    { title: 'Meet your instructor', description: 'Introduction session with your driving instructor', day: 7 },
    { title: 'Pre-trip inspection study', description: 'Begin studying pre-trip inspection procedures', day: 10 }
  ],
  'hvac': [
    { title: 'Complete profile setup', description: 'Fill out your student profile with contact information', day: 1 },
    { title: 'Upload required documents', description: 'Submit all required enrollment documents', day: 1 },
    { title: 'Review student handbook', description: 'Read and acknowledge the HVAC program handbook', day: 2 },
    { title: 'Complete orientation module', description: 'Watch the HVAC technology orientation video', day: 3 },
    { title: 'Tool kit ordering', description: 'Order your HVAC tool kit', day: 5 },
    { title: 'EPA 608 exam registration', description: 'Register for EPA 608 certification exam', day: 7 },
    { title: 'Meet your cohort', description: 'Introduction session with your cohort', day: 10 }
  ],
  'medical-assistant': [
    { title: 'Complete profile setup', description: 'Fill out your student profile with contact information', day: 1 },
    { title: 'Upload required documents', description: 'Submit immunization records and background check authorization', day: 1 },
    { title: 'Review student handbook', description: 'Read and acknowledge the medical assistant handbook including HIPAA guidelines', day: 2 },
    { title: 'Complete orientation module', description: 'Watch the medical assistant program orientation', day: 3 },
    { title: 'Clinical skills assessment', description: 'Complete the pre-program clinical skills assessment', day: 5 },
    { title: 'CPR certification', description: 'Complete or upload CPR certification', day: 7 },
    { title: 'Clinical site orientation', description: 'Review clinical rotation site information', day: 10 }
  ],
  'cosmetology': [
    { title: 'Complete profile setup', description: 'Fill out your student profile with contact information', day: 1 },
    { title: 'Upload required documents', description: 'Submit all required enrollment documents', day: 1 },
    { title: 'Review student handbook', description: 'Read and acknowledge the cosmetology student handbook', day: 2 },
    { title: 'Complete orientation module', description: 'Watch the cosmetology program orientation', day: 3 },
    { title: 'Kit ordering', description: 'Order your cosmetology kit and supplies', day: 5 },
    { title: 'Meet your cohort', description: 'Introduction session with your cohort', day: 7 },
    { title: 'Review state licensing requirements', description: 'Understand state cosmetology board requirements', day: 10 }
  ],
  'phlebotomy': [
    { title: 'Complete profile setup', description: 'Fill out your student profile with contact information', day: 1 },
    { title: 'Upload required documents', description: 'Submit immunization records and background check authorization', day: 1 },
    { title: 'Review student handbook', description: 'Read and acknowledge the phlebotomy program handbook', day: 2 },
    { title: 'Complete orientation module', description: 'Watch the phlebotomy program orientation', day: 3 },
    { title: 'CPR certification', description: 'Complete or upload CPR certification', day: 5 },
    { title: 'Meet your cohort', description: 'Introduction session with your cohort', day: 7 },
    { title: 'Clinical site orientation', description: 'Review clinical rotation site information', day: 10 }
  ]
};

/**
 * Get application by reference number
 */
async function getApplicationByRef(supabase: SupabaseClient, applicationRef: string) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('reference_number', applicationRef)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch application: ${error.message}`);
  }
  
  return data;
}

/**
 * Get student by email
 */
async function getStudentByEmail(supabase: SupabaseClient, email: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch student: ${error.message}`);
  }
  
  return data;
}

/**
 * Create a new student profile
 */
async function createStudentProfile(
  supabase: SupabaseClient,
  application: { email: string; first_name: string; last_name: string; phone?: string }
): Promise<string> {
  const { data, error } = await supabase
    .from('students')
    .insert({
      email: application.email.toLowerCase(),
      first_name: application.first_name,
      last_name: application.last_name,
      phone: application.phone,
      status: 'interview_completed',
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to create student profile: ${error.message}`);
  }
  
  return data.id;
}

/**
 * Create program enrollment record
 */
async function createEnrollment(
  supabase: SupabaseClient,
  studentId: string,
  programSlug: string,
  eligibility: EligibilityResult,
  score: InterviewScore
): Promise<string> {
  const { data, error } = await supabase
    .from('program_enrollments')
    .insert({
      student_id: studentId,
      program_slug: programSlug,
      status: eligibility.eligible ? 'approved' : 'pending_review',
      eligibility_status: eligibility.status,
      risk_level: eligibility.riskLevel,
      interview_score: score.percentage,
      interview_session_id: null, // Will be updated with session ID
      funding_status: eligibility.eligible ? 'pending' : 'not_eligible',
      enrolled_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to create enrollment: ${error.message}`);
  }
  
  return data.id;
}

/**
 * Create digital binder with required documents
 */
async function createDigitalBinder(
  supabase: SupabaseClient,
  studentId: string,
  enrollmentId: string,
  programSlug: string
): Promise<string> {
  const requiredDocuments = PROGRAM_DOCUMENT_REQUIREMENTS[programSlug] || PROGRAM_DOCUMENT_REQUIREMENTS.default;
  
  const binderDocuments = requiredDocuments.map((doc, index) => ({
    student_id: studentId,
    enrollment_id: enrollmentId,
    document_type: doc,
    document_name: doc,
    status: 'pending',
    required: true,
    order_index: index,
    created_at: new Date().toISOString()
  }));
  
  const { data, error } = await supabase
    .from('digital_binders')
    .insert({
      student_id: studentId,
      enrollment_id: enrollmentId,
      status: 'incomplete',
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to create digital binder: ${error.message}`);
  }
  
  // Insert required documents
  if (binderDocuments.length > 0) {
    await supabase.from('binder_documents').insert(binderDocuments);
  }
  
  return data.id;
}

/**
 * Create onboarding plan with tasks
 */
async function createOnboardingPlan(
  supabase: SupabaseClient,
  studentId: string,
  enrollmentId: string,
  programSlug: string
): Promise<string> {
  const tasks = PROGRAM_ONBOARDING_TASKS[programSlug] || PROGRAM_ONBOARDING_TASKS.default;
  
  const onboardingTasks = tasks.map((task, index) => ({
    student_id: studentId,
    enrollment_id: enrollmentId,
    title: task.title,
    description: task.description,
    day_number: task.day,
    status: 'pending',
    order_index: index,
    created_at: new Date().toISOString()
  }));
  
  const { data, error } = await supabase
    .from('onboarding_plans')
    .insert({
      student_id: studentId,
      enrollment_id: enrollmentId,
      status: 'not_started',
      started_at: null,
      completed_at: null,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to create onboarding plan: ${error.message}`);
  }
  
  // Insert tasks
  if (onboardingTasks.length > 0) {
    await supabase.from('onboarding_tasks').insert(onboardingTasks);
  }
  
  return data.id;
}

/**
 * Send Ellie notification
 */
async function sendEllieNotification(
  supabase: SupabaseClient,
  studentId: string,
  enrollmentId: string,
  programSlug: string,
  eligibility: EligibilityResult
): Promise<void> {
  const notificationType = eligibility.eligible 
    ? 'interview_eligible' 
    : eligibility.status === 'review'
      ? 'interview_review'
      : 'interview_denied';
  
  await supabase
    .from('notifications')
    .insert({
      recipient_type: 'admissions_team',
      notification_type: notificationType,
      title: `PARS Interview ${eligibility.status === 'eligible' ? 'Completed' : 'Requires Review'}`,
      message: `Student has completed PARS interview with ${eligibility.status} status. Program: ${programSlug}.`,
      metadata: {
        student_id: studentId,
        enrollment_id: enrollmentId,
        program_slug: programSlug,
        eligibility_status: eligibility.status,
        risk_level: eligibility.riskLevel
      },
      status: 'unread',
      created_at: new Date().toISOString()
    });
}

/**
 * Update application status after interview completion
 */
async function updateApplicationStatus(
  supabase: SupabaseClient,
  applicationRef: string,
  status: string,
  score: InterviewScore,
  eligibility: EligibilityResult
): Promise<void> {
  await supabase
    .from('applications')
    .update({
      status: status,
      interview_completed_at: new Date().toISOString(),
      interview_score: score.percentage,
      eligibility_status: eligibility.status,
      risk_level: eligibility.riskLevel,
      updated_at: new Date().toISOString()
    })
    .eq('reference_number', applicationRef);
}

/**
 * Main provisioning function
 * Creates student profile, enrollment, digital binder, and onboarding plan
 */
export async function provisionStudentFromInterview(
  session: InterviewSession,
  score: InterviewScore,
  eligibility: EligibilityResult
): Promise<ProvisioningResult> {
  const errors: string[] = [];
  let studentId: string | undefined;
  let enrollmentId: string | undefined;
  let binderId: string | undefined;
  let onboardingPlanId: string | undefined;
  
  try {
    const supabase = getSupabaseAdmin();
    
    // Get application data
    const application = await getApplicationByRef(supabase, session.applicationRef);
    if (!application) {
      return {
        success: false,
        errors: [`Application not found: ${session.applicationRef}`]
      };
    }
    
    // Check if student already exists
    const existingStudent = await getStudentByEmail(supabase, application.email);
    
    if (existingStudent) {
      studentId = existingStudent.id;
    } else {
      // Create new student profile
      studentId = await createStudentProfile(supabase, {
        email: application.email,
        first_name: application.first_name || 'Unknown',
        last_name: application.last_name || 'Unknown',
        phone: application.phone
      });
    }
    
    // Create program enrollment
    enrollmentId = await createEnrollment(supabase, studentId, session.programSlug, eligibility, score);
    
    // Create digital binder with required documents
    binderId = await createDigitalBinder(supabase, studentId, enrollmentId, session.programSlug);
    
    // Create onboarding plan with tasks
    onboardingPlanId = await createOnboardingPlan(supabase, studentId, enrollmentId, session.programSlug);
    
    // Send Ellie notification to admissions team
    await sendEllieNotification(supabase, studentId, enrollmentId, session.programSlug, eligibility);
    
    // Update application status
    await updateApplicationStatus(
      supabase,
      session.applicationRef,
      eligibility.eligible ? 'interview_eligible' : eligibility.status === 'review' ? 'interview_review' : 'interview_denied',
      score,
      eligibility
    );
    
    return {
      success: true,
      studentId,
      enrollmentId,
      binderId,
      onboardingPlanId,
      errors: []
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    errors.push(errorMessage);
    
    return {
      success: false,
      studentId,
      enrollmentId,
      errors
    };
  }
}

/**
 * Check provisioning status for a student
 */
export async function checkProvisioningStatus(
  applicationRef: string
): Promise<{
  provisioned: boolean;
  studentId?: string;
  enrollmentId?: string;
  binderId?: string;
  onboardingPlanId?: string;
}> {
  try {
    const supabase = getSupabaseAdmin();
    
    const application = await getApplicationByRef(supabase, applicationRef);
    if (!application) {
      return { provisioned: false };
    }
    
    if (!application.student_id) {
      return { provisioned: false };
    }
    
    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('id')
      .eq('student_id', application.student_id)
      .single();
    
    if (!enrollment) {
      return { provisioned: false, studentId: application.student_id };
    }
    
    const { data: binder } = await supabase
      .from('digital_binders')
      .select('id')
      .eq('enrollment_id', enrollment.id)
      .single();
    
    const { data: onboarding } = await supabase
      .from('onboarding_plans')
      .select('id')
      .eq('enrollment_id', enrollment.id)
      .single();
    
    return {
      provisioned: true,
      studentId: application.student_id,
      enrollmentId: enrollment.id,
      binderId: binder?.id,
      onboardingPlanId: onboarding?.id
    };
    
  } catch (error) {
    return { provisioned: false };
  }
}

export default {
  provisionStudentFromInterview,
  checkProvisioningStatus
};
