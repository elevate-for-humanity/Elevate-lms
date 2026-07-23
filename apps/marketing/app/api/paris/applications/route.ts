/**
 * POST /api/paris/applications
 * 
 * Create a new application
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApplication } from '@/lib/paris/admissions/application-service';

// ============================================
// REQUEST VALIDATION
// ============================================

const createApplicationSchema = z.object({
  programId: z.string().uuid('Invalid program ID'),
  applicationType: z.enum(['STUDENT', 'APPRENTICE', 'TESTING_CANDIDATE']).default('STUDENT'),
  
  // Personal
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  middleName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(30),
  
  // Address
  addressLine1: z.string().trim().max(200).optional(),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(50).optional(),
  postalCode: z.string().trim().max(20).optional(),
  
  // Education & Career
  highestEducation: z.string().max(100).optional(),
  employmentStatus: z.string().max(100).optional(),
  preferredSchedule: z.string().max(100).optional(),
  desiredStartDate: z.string().optional(),
  careerGoal: z.string().max(2000).optional(),
  barriers: z.array(z.string().max(100)).default([]),
  eligibilityAnswers: z.record(z.string(), z.unknown()).default({}),
  
  // Funding
  requestedFunding: z.array(z.enum([
    'WIOA',
    'WORKFORCE_READY_GRANT',
    'VOCATIONAL_REHABILITATION',
    'EMPLOYER_SPONSORSHIP',
    'APPRENTICESHIP',
    'GRANT',
    'SELF_PAY',
    'BNPL',
    'PAYMENT_PLAN',
    'OTHER',
  ])).min(1, 'At least one funding source is required'),
  
  // Source
  source: z.string().max(100).optional(),
  referralCode: z.string().max(100).optional(),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================
// HANDLERS
// ============================================

/**
 * POST - Create application
 */
export async function POST(request: Request) {
  try {
    // Get authenticated user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 },
      );
    }
    
    // Get user from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }
    
    const token = authHeader.substring(7);
    
    // Verify token and get user
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 },
      );
    }
    
    // Parse and validate request body
    const json = await request.json();
    const parsed = createApplicationSchema.parse(json);
    
    // Create application
    const application = await createApplication({
      ...parsed,
      applicantId: user.id,
    });
    
    return NextResponse.json(
      {
        success: true,
        applicationId: application.id,
        applicationNumber: application.application_number,
        workflowStatus: application.workflow_status,
        redirectTo: `/applicant/application/${application.id}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('paris.application.create.failed', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to create application',
      },
      { status: 400 },
    );
  }
}

/**
 * GET - List user's applications
 */
export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 },
      );
    }
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }
    
    const token = authHeader.substring(7);
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 },
      );
    }
    
    // Fetch applications
    const { data: applications, error: fetchError } = await supabase
      .from('paris_applications')
      .select(`
        *,
        documents:paris_application_documents(count),
        funding_cases:paris_funding_cases(count),
        tasks:paris_workflow_tasks(count)
      `)
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      throw fetchError;
    }
    
    return NextResponse.json({
      success: true,
      applications: applications ?? [],
    });
  } catch (error) {
    console.error('paris.application.list.failed', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to list applications',
      },
      { status: 400 },
    );
  }
}
