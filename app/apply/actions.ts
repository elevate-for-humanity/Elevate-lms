'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sendWelcomeEmail } from '@/lib/email/send';

/**
 * UNIFIED APPLICATION ACTIONS
 *
 * Server-side role assignment and application processing.
 * Each role gets ONE submission path with deterministic outcomes.
 */

export type ApplicationRole =
  | 'student'
  | 'program_holder'
  | 'employer'
  | 'staff'
  | 'instructor';

export interface BaseApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: ApplicationRole;
}

export interface StudentApplicationData extends BaseApplicationData {
  role: 'student';
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  programInterest?: string;
  employmentStatus?: string;
  educationLevel?: string;
  goals?: string;
}

export interface ProgramHolderApplicationData extends BaseApplicationData {
  role: 'program_holder';
  organizationName: string;
  organizationType?: string;
  website?: string;
  numberOfStudents?: string;
  programsOffered?: string;
  partnershipGoals?: string;
}

export interface EmployerApplicationData extends BaseApplicationData {
  role: 'employer';
  companyName: string;
  industry?: string;
  companySize?: string;
  website?: string;
  hiringNeeds?: string;
  positionsAvailable?: string;
}

export interface StaffApplicationData extends BaseApplicationData {
  role: 'staff' | 'instructor';
  position: string;
  experience?: string;
  education?: string;
  certifications?: string;
  availability?: string;
  coverLetter?: string;
}

export type ApplicationData =
  | StudentApplicationData
  | ProgramHolderApplicationData
  | EmployerApplicationData
  | StaffApplicationData;

/**
 * Submit Student Application
 * Creates user account with 'student' role and redirects to LMS dashboard
 */
export async function submitStudentApplication(data: StudentApplicationData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Use admin client for DB writes (bypasses RLS), fall back to regular client
  const dbClient = adminClient || supabase;

  try {
    // 1. Store application in the canonical applications table FIRST
    // This is the most important step — never lose an application
    const { error: appError } = await dbClient
      .from('applications')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        program_id: data.programInterest || null,
        status: 'pending',
        notes: JSON.stringify({
          role: 'student',
          date_of_birth: data.dateOfBirth,
          address: data.address,
          city: data.city,
          state: data.state,
          zip_code: data.zipCode,
          employment_status: data.employmentStatus,
          education_level: data.educationLevel,
          goals: data.goals,
        }),
        submitted_at: new Date().toISOString(),
      });

    if (appError) throw appError;

    // 2. Try to create auth user (non-blocking — application is already saved)
    let userId: string | null = null;
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: generateTemporaryPassword(),
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            role: 'student',
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });

      if (!authError && authData.user) {
        userId = authData.user.id;

        // 3. Create profile (best-effort, uses admin client to bypass RLS)
        await dbClient.from('profiles').upsert({
          id: authData.user.id,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          role: 'student',
          tenant_id: process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || null,
        }, { onConflict: 'id' });
      }
    } catch {
      // Auth/profile creation failed — application is still saved
      console.warn('[apply] Auth creation failed for', data.email, '— application saved');
    }

    // 4. Send welcome email (best-effort)
    try {
      await sendWelcomeEmail(data.email, data.firstName, 'student');
    } catch {
      console.warn('[apply] Welcome email failed for', data.email);
    }

    revalidatePath('/admin/applications');

    return {
      success: true,
      userId: userId,
      redirectTo: '/apply/success?role=student',
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to submit application',
    };
  }
}

/**
 * Submit Program Holder Application
 * Creates user account with 'program_holder' role and sets onboarding flag
 */
export async function submitProgramHolderApplication(
  data: ProgramHolderApplicationData
) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const dbClient = adminClient || supabase;

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: generateTemporaryPassword(),
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          role: 'program_holder',
          organization_name: data.organizationName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // 2. Create profile with program_holder role
    const { error: profileError } = await dbClient.from('profiles').insert({
      id: authData.user.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      role: 'program_holder',
      tenant_id: process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || null,
      onboarding_completed: false,
    });

    if (profileError) throw profileError;

    // 3. Store application in the canonical applications table
    const { error: appError } = await dbClient
      .from('applications')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        program_id: 'program_holder',
        status: 'pending',
        notes: JSON.stringify({
          role: 'program_holder',
          organization_name: data.organizationName,
          organization_type: data.organizationType,
          website: data.website,
          number_of_students: data.numberOfStudents,
          programs_offered: data.programsOffered,
          partnership_goals: data.partnershipGoals,
        }),
        submitted_at: new Date().toISOString(),
      });

    if (appError) throw appError;

    revalidatePath('/admin/applications');

    return {
      success: true,
      userId: authData.user.id,
      redirectTo: '/apply/success?role=program-holder',
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to submit application',
    };
  }
}

/**
 * Submit Employer Application
 * Creates user account with 'employer' role and sets verification flag
 */
export async function submitEmployerApplication(data: EmployerApplicationData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const dbClient = adminClient || supabase;

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: generateTemporaryPassword(),
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          role: 'employer',
          company_name: data.companyName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // 2. Create profile with employer role
    const { error: profileError } = await dbClient.from('profiles').insert({
      id: authData.user.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      role: 'employer',
      tenant_id: process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || null,
      verified: false,
    });

    if (profileError) throw profileError;

    // 3. Store application in the canonical applications table
    const { error: appError } = await dbClient
      .from('applications')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        program_id: 'employer',
        status: 'pending',
        notes: JSON.stringify({
          role: 'employer',
          company_name: data.companyName,
          industry: data.industry,
          company_size: data.companySize,
          website: data.website,
          hiring_needs: data.hiringNeeds,
          positions_available: data.positionsAvailable,
        }),
        submitted_at: new Date().toISOString(),
      });

    if (appError) throw appError;

    revalidatePath('/admin/applications');

    return {
      success: true,
      userId: authData.user.id,
      redirectTo: '/apply/success?role=employer',
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to submit application',
    };
  }
}

/**
 * Submit Staff/Instructor Application
 * Creates user account with 'staff' or 'instructor' role and requires admin approval
 */
export async function submitStaffApplication(data: StaffApplicationData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const dbClient = adminClient || supabase;

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: generateTemporaryPassword(),
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          role: data.role,
          position: data.position,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // 2. Create profile with staff/instructor role (inactive until approved)
    const { error: profileError } = await dbClient.from('profiles').insert({
      id: authData.user.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      role: data.role,
      tenant_id: process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || null,
      active: false, // Requires admin approval
    });

    if (profileError) throw profileError;

    // 3. Store application in the canonical applications table
    const { error: appError } = await dbClient
      .from('applications')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        program_id: data.role,
        status: 'pending',
        notes: JSON.stringify({
          role: data.role,
          position: data.position,
          experience: data.experience,
          education: data.education,
          certifications: data.certifications,
          availability: data.availability,
          cover_letter: data.coverLetter,
        }),
        submitted_at: new Date().toISOString(),
      });

    if (appError) throw appError;

    revalidatePath('/admin/applications');

    return {
      success: true,
      userId: authData.user.id,
      redirectTo: '/apply/success?role=staff',
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to submit application',
    };
  }
}

/**
 * Generate temporary password for new users
 * Users will be prompted to set their own password on first login
 */
function generateTemporaryPassword(): string {
  const length = 16;
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Get application status for a user
 */
export async function getApplicationStatus(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!profile) return null;

  const tableName = `${profile.role}_applications`;

  const { data, error }: any = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;

  return data;
}
