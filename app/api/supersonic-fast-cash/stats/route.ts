import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get client counts
    const { count: totalClients } = await supabase
      .from('tax_clients')
      .select('*', { count: 'exact', head: true });

    const { count: pendingReturns } = await supabase
      .from('tax_clients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: completedReturns } = await supabase
      .from('tax_clients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get total refunds
    const { data: refundData } = await supabase
      .from('tax_clients')
      .select('refund_amount')
      .eq('status', 'completed');

    const totalRefunds = (refundData || []).reduce(
      (sum, client) => sum + (client.refund_amount || 0),
      0
    );

    // Get today's appointments
    const today = new Date().toISOString().split('T')[0];
    const { count: todayAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today)
      .eq('service_type', 'tax_preparation');

    // Get weekly revenue (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: revenueData } = await supabase
      .from('tax_clients')
      .select('preparation_fee')
      .eq('status', 'completed')
      .gte('created_at', weekAgo.toISOString());

    const weeklyRevenue = (revenueData || []).reduce(
      (sum, client) => sum + (client.preparation_fee || 0),
      0
    );

    return NextResponse.json({
      totalClients: totalClients || 0,
      pendingReturns: pendingReturns || 0,
      completedReturns: completedReturns || 0,
      totalRefunds: totalRefunds || 0,
      todayAppointments: todayAppointments || 0,
      weeklyRevenue: weeklyRevenue || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    
    // Return zeros if tables don't exist yet
    return NextResponse.json({
      totalClients: 0,
      pendingReturns: 0,
      completedReturns: 0,
      totalRefunds: 0,
      todayAppointments: 0,
      weeklyRevenue: 0,
    });
  }
}
