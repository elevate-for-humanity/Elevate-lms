// PUBLIC ROUTE: public interest form


// =====================================================
// INTAKE STAGE 1: INTEREST
// Captures initial interest without overwhelming the user
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const InterestSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  careerInterest: z.string().min(1),
  source: z.string().optional(),
});

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const parsed = InterestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = await createServerSupabaseClient();

    // Check for existing lead
    const { data: existing } = await supabase
      .from('leads')
      .select('id, stage')
      .eq('email', data.email)
      .single();

    if (existing) {
      // Update existing lead
      const { data: lead, error } = await supabase
        .from('leads')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          career_interest: data.careerInterest,
          source: data.source,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update lead', { error, email: data.email });
        return NextResponse.json(
          { error: 'Failed to update interest' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        leadId: lead.id,
        stage: lead.stage,
        nextStep: '/intake/eligibility',
        message: 'Welcome back! Let\'s continue where you left off.',
      });
    }

    // Create new lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        career_interest: data.careerInterest,
        source: data.source,
        stage: 'INTEREST',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create lead', { error, data });
      return NextResponse.json(
        { error: 'Failed to save interest' },
        { status: 500 }
      );
    }

    // Log event
    await supabase.from('audit_logs').insert({
      event_type: 'lead_created',
      resource_type: 'lead',
      resource_id: lead.id,
      metadata: {
        stage: 'INTEREST',
        career_interest: data.careerInterest,
        source: data.source,
      },
    });

    logger.info('Lead created', { leadId: lead.id, email: data.email });

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      stage: 'INTEREST',
      nextStep: '/intake/eligibility',
      message: 'Thank you for your interest! Next, let\'s check your eligibility.',
    });
  } catch (error) {
    logger.error('Interest intake error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/intake/interest', _POST);
