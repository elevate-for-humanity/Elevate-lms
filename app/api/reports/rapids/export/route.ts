import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * RAPIDS Export API
 * 
 * Exports apprentice data in DOL RAPIDS-ready format
 * 
 * GET /api/reports/rapids/export?format=csv&type=registration
 * 
 * Query params:
 *   format: csv | json (default: csv)
 *   type: registration | progress | completion | all (default: all)
 *   status: pending | registered | active | completed (optional filter)
 */

interface RAPIDSApprentice {
  // Personal Info
  firstName: string;
  lastName: string;
  middleName: string;
  suffix: string;
  ssnLastFour: string;
  dateOfBirth: string;
  gender: string;
  
  // Demographics
  raceEthnicity: string;
  veteranStatus: string;
  disabilityStatus: string;
  educationLevel: string;
  
  // Contact
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Program
  programName: string;
  occupationCode: string;
  occupationTitle: string;
  sponsorName: string;
  rapidsId: string;
  
  // Dates
  registrationDate: string;
  expectedCompletionDate: string;
  actualCompletionDate: string;
  
  // Hours
  totalHoursRequired: number;
  ojtHoursCompleted: number;
  rtiHoursRequired: number;
  rtiHoursCompleted: number;
  
  // Employer
  employerName: string;
  employerFEIN: string;
  employerAddress: string;
  employerCity: string;
  employerState: string;
  employerZip: string;
  
  // Wages
  wageAtEntry: string;
  currentWage: string;
  
  // Status
  status: string;
  cancellationDate: string;
  cancellationReason: string;
}

// RAPIDS field mapping for CSV headers (matches DOL format)
const RAPIDS_HEADERS = {
  registration: [
    'Last Name',
    'First Name', 
    'Middle Name',
    'Suffix',
    'SSN (Last 4)',
    'Date of Birth',
    'Gender',
    'Race/Ethnicity',
    'Veteran Status',
    'Disability Status',
    'Education Level',
    'Email',
    'Phone',
    'Street Address',
    'City',
    'State',
    'ZIP Code',
    'Program Name',
    'Occupation Code (O*NET/SOC)',
    'Occupation Title',
    'Sponsor Name',
    'Registration Date',
    'Expected Completion Date',
    'Total OJT Hours Required',
    'Total RTI Hours Required',
    'Employer Name',
    'Employer FEIN',
    'Employer Street Address',
    'Employer City',
    'Employer State',
    'Employer ZIP',
    'Starting Wage',
    'Status',
  ],
  progress: [
    'RAPIDS ID',
    'Last Name',
    'First Name',
    'SSN (Last 4)',
    'Reporting Period',
    'OJT Hours This Period',
    'OJT Hours Cumulative',
    'RTI Hours This Period',
    'RTI Hours Cumulative',
    'Current Wage',
    'Wage Increased',
    'Status',
    'Notes',
  ],
  completion: [
    'RAPIDS ID',
    'Last Name',
    'First Name',
    'SSN (Last 4)',
    'Registration Date',
    'Completion Date',
    'Total OJT Hours',
    'Total RTI Hours',
    'Final Wage',
    'Credential Earned',
    'License Number',
    'License Date',
  ],
};

function formatDate(date: string | null): string {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit', 
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '';
  return `$${Number(amount).toFixed(2)}`;
}

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const type = searchParams.get('type') || 'registration';
    const status = searchParams.get('status');
    
    // Build query based on available tables
    // Try multiple table sources in order of preference
    let apprentices: any[] = [];
    
    // 1. Try rapids_apprentices first (new dedicated table)
    const { data: rapidsData, error: rapidsError } = await supabase
      .from('rapids_apprentices')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!rapidsError && rapidsData?.length) {
      apprentices = rapidsData;
    } else {
      // 2. Try student_enrollments with profiles
      const { data: enrollments, error: enrollError } = await supabase
        .from('student_enrollments')
        .select(`
          *,
          profiles:student_id (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });
      
      if (!enrollError && enrollments?.length) {
        apprentices = enrollments;
      } else {
        // 3. Try rapids_registrations
        const { data: registrations, error: regError } = await supabase
          .from('rapids_registrations')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!regError && registrations?.length) {
          apprentices = registrations;
        } else {
          // 4. Try enrollments table with users
          const { data: basicEnrollments } = await supabase
            .from('enrollments')
            .select(`
              *,
              users:user_id (
                id,
                email
              ),
              programs:course_id (
                title,
                slug
              )
            `)
            .order('enrolled_at', { ascending: false });
          
          apprentices = basicEnrollments || [];
        }
      }
    }
    
    // Apply status filter if provided
    if (status && apprentices.length) {
      apprentices = apprentices.filter(a => 
        (a.status === status) || (a.rapids_status === status)
      );
    }
    
    if (!apprentices.length) {
      return NextResponse.json({ 
        error: 'No apprentice data found',
        hint: 'Ensure apprentices are enrolled and have RAPIDS status set'
      }, { status: 404 });
    }
    
    // Transform data to RAPIDS format
    const rapidsData2 = apprentices.map(a => {
      const profile = a.profiles || {};
      return {
        firstName: a.first_name || profile.first_name || '',
        lastName: a.last_name || profile.last_name || '',
        middleName: a.middle_name || '',
        suffix: a.suffix || '',
        ssnLastFour: a.ssn_last_four || '****',
        dateOfBirth: formatDate(a.date_of_birth),
        gender: a.gender || '',
        raceEthnicity: a.race_ethnicity || '',
        veteranStatus: a.veteran_status ? 'Yes' : 'No',
        disabilityStatus: a.disability_status ? 'Yes' : 'No',
        educationLevel: a.education_level || '',
        email: a.email || profile.email || '',
        phone: a.phone || profile.phone || '',
        address: a.address_line1 || '',
        city: a.city || '',
        state: a.state || 'IN',
        zipCode: a.zip_code || '',
        programName: a.program_slug || 'Barber Apprenticeship',
        occupationCode: a.occupation_code || '39-5011.00',
        occupationTitle: a.occupation_title || 'Barber',
        sponsorName: process.env.NEXT_PUBLIC_RAPIDS_SPONSOR_NAME || '2Exclusive LLC',
        rapidsId: a.rapids_id || '',
        registrationDate: formatDate(a.registration_date || a.started_at || a.created_at),
        expectedCompletionDate: formatDate(a.expected_completion_date),
        actualCompletionDate: formatDate(a.completion_date || a.completed_at),
        totalHoursRequired: a.total_hours_required || a.required_hours || 1500,
        ojtHoursCompleted: a.ojt_hours_completed || 0,
        rtiHoursRequired: a.related_instruction_hours_required || 144,
        rtiHoursCompleted: a.rti_hours_completed || 0,
        employerName: a.employer_name || '',
        employerFEIN: a.employer_fein || '',
        employerAddress: a.employer_address || '',
        employerCity: a.employer_city || '',
        employerState: a.employer_state || 'IN',
        employerZip: a.employer_zip || '',
        wageAtEntry: formatCurrency(a.wage_at_entry),
        currentWage: formatCurrency(a.current_wage),
        status: a.status || a.rapids_status || 'pending',
        cancellationDate: formatDate(a.cancellation_date),
        cancellationReason: a.cancellation_reason || '',
      };
    });
    
    // Return JSON format
    if (format === 'json') {
      return NextResponse.json({
        exportDate: new Date().toISOString(),
        exportType: type,
        recordCount: rapidsData2.length,
        sponsorName: process.env.NEXT_PUBLIC_RAPIDS_SPONSOR_NAME || '2Exclusive LLC',
        programNumber: process.env.NEXT_PUBLIC_RAPIDS_PROGRAM_NUMBER || '2025-IN-132301',
        apprentices: rapidsData2,
      });
    }
    
    // Generate CSV
    const headers = RAPIDS_HEADERS[type as keyof typeof RAPIDS_HEADERS] || RAPIDS_HEADERS.registration;
    
    let csvRows: string[][] = [];
    
    if (type === 'registration' || type === 'all') {
      csvRows = rapidsData2.map(a => [
        a.lastName,
        a.firstName,
        a.middleName,
        a.suffix,
        a.ssnLastFour,
        a.dateOfBirth,
        a.gender,
        a.raceEthnicity,
        a.veteranStatus,
        a.disabilityStatus,
        a.educationLevel,
        a.email,
        a.phone,
        a.address,
        a.city,
        a.state,
        a.zipCode,
        a.programName,
        a.occupationCode,
        a.occupationTitle,
        a.sponsorName,
        a.registrationDate,
        a.expectedCompletionDate,
        String(a.totalHoursRequired),
        String(a.rtiHoursRequired),
        a.employerName,
        a.employerFEIN,
        a.employerAddress,
        a.employerCity,
        a.employerState,
        a.employerZip,
        a.wageAtEntry,
        a.status,
      ]);
    } else if (type === 'progress') {
      csvRows = rapidsData2.map(a => [
        a.rapidsId,
        a.lastName,
        a.firstName,
        a.ssnLastFour,
        '', // Reporting period - to be filled
        String(a.ojtHoursCompleted), // This period (would need delta calc)
        String(a.ojtHoursCompleted),
        String(a.rtiHoursCompleted),
        String(a.rtiHoursCompleted),
        a.currentWage,
        '', // Wage increased
        a.status,
        '',
      ]);
    } else if (type === 'completion') {
      csvRows = rapidsData2
        .filter(a => a.status === 'completed')
        .map(a => [
          a.rapidsId,
          a.lastName,
          a.firstName,
          a.ssnLastFour,
          a.registrationDate,
          a.actualCompletionDate,
          String(a.ojtHoursCompleted),
          String(a.rtiHoursCompleted),
          a.currentWage,
          '', // Credential
          '', // License number
          '', // License date
        ]);
    }
    
    const csv = [
      headers.map(h => escapeCSV(h)).join(','),
      ...csvRows.map(row => row.map(cell => escapeCSV(cell)).join(','))
    ].join('\n');
    
    const filename = `rapids-${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
    
  } catch (error) {
    logger.error('[RAPIDS Export] Error:', error);
    return NextResponse.json(
      { error: 'Export failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
