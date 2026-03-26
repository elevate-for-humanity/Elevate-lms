import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const body = await request.json();

    const {
      service_id,
      first_name,
      last_name,
      email,
      phone,
      appointment_date,
      appointment_time,
      notes,
    } = body;

    // Validate required fields
    if (!service_id || !first_name || !last_name || !email || !phone || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser();

    // Create appointment
    const { data: appointment, error } = await supabase
      .from('curvature_appointments')
      .insert({
        user_id: user?.id || null,
        service_id,
        first_name,
        last_name,
        email,
        phone,
        appointment_date,
        appointment_time,
        notes: notes || null,
        status: 'pending',
      })
      .select(`
        *,
        service:curvature_services(name, duration_minutes, price)
      `)
      .single();

    if (error) {
      logger.error('Appointment creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    // Send confirmation email
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: appointment.email,
          subject: 'Appointment Confirmation - Curvature Body Sculpting',
          template: 'appointment-confirmation',
          data: { appointment }
        })
      });
    } catch (emailError) {
      logger.error('Failed to send confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Appointment request submitted successfully',
    });
  } catch (error) {
    logger.error('Appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // Get services
    const { data: services, error: servicesError } = await supabase
      .from('curvature_services')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (servicesError) {
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    // If date provided, get booked times for that date
    let bookedTimes: string[] = [];
    if (date) {
      const { data: appointments } = await supabase
        .from('curvature_appointments')
        .select('appointment_time')
        .eq('appointment_date', date)
        .in('status', ['pending', 'confirmed']);

      bookedTimes = appointments?.map(a => a.appointment_time) || [];
    }

    return NextResponse.json({
      services,
      bookedTimes,
    });
  } catch (error) {
    logger.error('Services fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/curvature/appointments', _GET);
export const POST = withApiAudit('/api/curvature/appointments', _POST);
