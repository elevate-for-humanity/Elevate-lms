import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  // Dev-only bypass: allow seeding without auth in local development.
  // In all other environments, require admin role.
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) {
    const auth = await apiRequireAdmin(request);
    if (auth.error) return auth.error;
  }

  const supabase = await createClient();

  const results: Record<string, { success: boolean; count?: number; error?: string }> = {};

  // Seed Leads
  const leadsData = [
    {
      first_name: 'Maria',
      last_name: 'Garcia',
      email: 'maria.garcia@example.com',
      phone: '(317) 555-0101',
      program_interest: 'CNA',
      source: 'website',
      status: 'new',
    },
    {
      first_name: 'James',
      last_name: 'Wilson',
      email: 'james.wilson@example.com',
      phone: '(317) 555-0102',
      program_interest: 'HVAC',
      source: 'referral',
      status: 'contacted',
    },
    {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.j@example.com',
      phone: '(317) 555-0103',
      program_interest: 'Medical Admin',
      source: 'job_fair',
      status: 'qualified',
    },
    {
      first_name: 'Michael',
      last_name: 'Brown',
      email: 'mbrown@example.com',
      phone: '(317) 555-0104',
      program_interest: 'IT Support',
      source: 'social_media',
      status: 'appointment_set',
    },
    {
      first_name: 'Emily',
      last_name: 'Davis',
      email: 'emily.davis@example.com',
      phone: '(317) 555-0105',
      program_interest: 'Phlebotomy',
      source: 'website',
      status: 'new',
    },
    {
      first_name: 'David',
      last_name: 'Martinez',
      email: 'david.m@example.com',
      phone: '(317) 555-0106',
      program_interest: 'Electrical',
      source: 'workforce_agency',
      status: 'contacted',
    },
    {
      first_name: 'Jennifer',
      last_name: 'Anderson',
      email: 'janderson@example.com',
      phone: '(317) 555-0107',
      program_interest: 'CNA',
      source: 'community_event',
      status: 'qualified',
    },
    {
      first_name: 'Robert',
      last_name: 'Taylor',
      email: 'rtaylor@example.com',
      phone: '(317) 555-0108',
      program_interest: 'Welding',
      source: 'website',
      status: 'new',
    },
  ];

  const { error: leadsError, data: leadsResult } = await supabase
    .from('leads')
    .upsert(leadsData, { onConflict: 'email' })
    .select();

  results.leads = leadsError
    ? { success: false, error: leadsError.message }
    : { success: true, count: leadsResult?.length || 0 };

  // Seed Campaigns
  const campaignsData = [
    {
      name: 'Spring 2025 Enrollment',
      description: 'Promote spring enrollment for all programs',
      type: 'email',
      status: 'active',
      stats: { sent: 2450, opened: 1034, clicked: 287, converted: 45 },
    },
    {
      name: 'Healthcare Career Fair',
      description: 'Invite leads to healthcare career fair',
      type: 'email',
      status: 'completed',
      stats: { sent: 1800, opened: 756, clicked: 198, converted: 32 },
    },
    {
      name: 'WIOA Funding Awareness',
      description: 'Educate prospects about free training through WIOA',
      type: 'email',
      status: 'active',
      stats: { sent: 3200, opened: 1408, clicked: 412, converted: 67 },
    },
    {
      name: 'Alumni Success Stories',
      description: 'Share graduate success stories',
      type: 'social',
      status: 'scheduled',
      stats: { sent: 0, opened: 0, clicked: 0, converted: 0 },
    },
    {
      name: 'Trade Skills Workshop',
      description: 'Free workshop for skilled trades',
      type: 'event',
      status: 'draft',
      stats: { sent: 0, opened: 0, clicked: 0, converted: 0 },
    },
  ];

  const { error: campaignsError, data: campaignsResult } = await supabase
    .from('campaigns')
    .upsert(campaignsData, { onConflict: 'name' })
    .select();

  results.campaigns = campaignsError
    ? { success: false, error: campaignsError.message }
    : { success: true, count: campaignsResult?.length || 0 };

  // Seed Grant Opportunities
  const grantsData = [
    {
      title: 'Workforce Innovation Grant',
      description: 'Funding for innovative workforce development programs',
      funder: 'US Department of Labor',
      amount_min: 50000,
      amount_max: 250000,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      focus_areas: ['workforce', 'training', 'innovation'],
      status: 'open',
    },
    {
      title: 'Healthcare Training Initiative',
      description: 'Support for healthcare career training programs',
      funder: 'Indiana State Health Department',
      amount_min: 25000,
      amount_max: 100000,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      focus_areas: ['healthcare', 'nursing', 'medical'],
      status: 'open',
    },
    {
      title: 'STEM Education Fund',
      description: 'Grants for STEM-focused vocational training',
      funder: 'National Science Foundation',
      amount_min: 75000,
      amount_max: 500000,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      focus_areas: ['technology', 'engineering', 'science'],
      status: 'open',
    },
    {
      title: 'Community Development Block Grant',
      description: 'Support for community-based job training',
      funder: 'HUD',
      amount_min: 100000,
      amount_max: 750000,
      deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      focus_areas: ['community', 'economic development'],
      status: 'closed',
    },
    {
      title: 'Green Jobs Training Grant',
      description: 'Funding for sustainable energy workforce training',
      funder: 'EPA',
      amount_min: 50000,
      amount_max: 200000,
      deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      focus_areas: ['sustainability', 'energy', 'environment'],
      status: 'upcoming',
    },
  ];

  const { error: grantsError, data: grantsResult } = await supabase
    .from('grant_opportunities')
    .upsert(grantsData, { onConflict: 'title' })
    .select();

  results.grants = grantsError
    ? { success: false, error: grantsError.message }
    : { success: true, count: grantsResult?.length || 0 };

  // Seed WOTC Applications
  const wotcData = [
    {
      employee_first_name: 'John',
      employee_last_name: 'Smith',
      employer_name: 'Acme Healthcare',
      employer_ein: '12-3456789',
      target_groups: ['veteran', 'snap'],
      status: 'approved',
      tax_credit_amount: 2400,
    },
    {
      employee_first_name: 'Lisa',
      employee_last_name: 'Chen',
      employer_name: 'BuildRight Construction',
      employer_ein: '98-7654321',
      target_groups: ['longterm'],
      status: 'approved',
      tax_credit_amount: 9600,
    },
    {
      employee_first_name: 'Marcus',
      employee_last_name: 'Johnson',
      employer_name: 'CareFirst Medical',
      employer_ein: '45-6789012',
      target_groups: ['exfelon'],
      status: 'pending_review',
      tax_credit_amount: null,
    },
    {
      employee_first_name: 'Angela',
      employee_last_name: 'Williams',
      employer_name: 'Tech Solutions Inc',
      employer_ein: '78-9012345',
      target_groups: ['tanf', 'snap'],
      status: 'submitted',
      tax_credit_amount: null,
    },
    {
      employee_first_name: 'David',
      employee_last_name: 'Brown',
      employer_name: 'Midwest Manufacturing',
      employer_ein: '23-4567890',
      target_groups: ['veteran'],
      status: 'approved',
      tax_credit_amount: 4800,
    },
  ];

  const { error: wotcError, data: wotcResult } = await supabase
    .from('wotc_applications')
    .insert(wotcData)
    .select();

  results.wotc = wotcError
    ? { success: false, error: wotcError.message }
    : { success: true, count: wotcResult?.length || 0 };

  // Seed CRM Contacts
  const contactsData = [
    {
      first_name: 'John',
      last_name: 'Smith',
      email: 'jsmith@acmehealthcare.com',
      phone: '(317) 555-0201',
      company: 'Acme Healthcare',
      job_title: 'HR Director',
      contact_type: 'employer',
    },
    {
      first_name: 'Lisa',
      last_name: 'Chen',
      email: 'lchen@indytech.com',
      phone: '(317) 555-0202',
      company: 'Indy Tech Solutions',
      job_title: 'Hiring Manager',
      contact_type: 'employer',
    },
    {
      first_name: 'Mark',
      last_name: 'Thompson',
      email: 'mthompson@buildright.com',
      phone: '(317) 555-0203',
      company: 'BuildRight Construction',
      job_title: 'Operations Manager',
      contact_type: 'employer',
    },
    {
      first_name: 'Amanda',
      last_name: 'White',
      email: 'awhite@carefirst.org',
      phone: '(317) 555-0204',
      company: 'CareFirst Medical',
      job_title: 'Nurse Manager',
      contact_type: 'employer',
    },
    {
      first_name: 'Carlos',
      last_name: 'Rodriguez',
      email: 'crodriguez@example.com',
      phone: '(317) 555-0205',
      company: null,
      job_title: null,
      contact_type: 'alumni',
    },
  ];

  const { error: contactsError, data: contactsResult } = await supabase
    .from('crm_contacts')
    .upsert(contactsData, { onConflict: 'email' })
    .select();

  results.contacts = contactsError
    ? { success: false, error: contactsError.message }
    : { success: true, count: contactsResult?.length || 0 };

  // Calculate totals
  const totalSeeded = Object.values(results)
    .filter((r) => r.success)
    .reduce((sum, r) => sum + (r.count || 0), 0);

  const errors = Object.entries(results)
    .filter(([_, r]) => !r.success)
    .map(([table, r]) => `${table}: ${r.error}`);

  return NextResponse.json({
    success: errors.length === 0,
    message:
      errors.length === 0
        ? `Successfully seeded ${totalSeeded} records`
        : `Seeded with some errors`,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
