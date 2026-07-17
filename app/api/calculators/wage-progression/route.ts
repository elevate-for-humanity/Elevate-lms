import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const wageProgressionSchema = z.object({
  programSlug: z.string().optional(),
  employmentStatus: z.enum(['unemployed', 'part_time', 'full_time']),
  currentWage: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = wageProgressionSchema.parse(body);
    
    // Barbering apprenticeship wage progression
    const apprenticeshipStages = [
      { period: 'Months 1-6', hourlyRate: 14.00, description: 'Starting apprentice wage' },
      { period: 'Months 7-12', hourlyRate: 16.00, description: 'After 1,000 hours completed' },
      { period: 'Months 13-18', hourlyRate: 18.00, description: 'Senior apprentice rate' }
    ];
    
    const weeklyHours = 40;
    
    // Calculate earnings for each stage
    const stageEarnings = apprenticeshipStages.map(stage => ({
      ...stage,
      weeklyEarnings: stage.hourlyRate * weeklyHours,
      monthlyEarnings: stage.hourlyRate * weeklyHours * 4.33,
      periodTotal: stage.hourlyRate * weeklyHours * 4.33 * 6 // 6 months per stage
    }));
    
    const totalApprenticeshipEarnings = stageEarnings.reduce((sum, stage) => sum + stage.periodTotal, 0);
    
    // Post-licensure salary projections
    const careerProjections = {
      entryLevel: {
        hourlyRate: 20,
        annualSalary: 41600,
        monthlyWithTips: 5000,
        description: 'Entry-level licensed barber'
      },
      experienced: {
        hourlyRate: 25,
        annualSalary: 52000,
        monthlyWithTips: 7000,
        description: 'Experienced barber with client base'
      },
      senior: {
        hourlyRate: 30,
        annualSalary: 62400,
        monthlyWithTips: 9000,
        description: 'Senior stylist or lead barber'
      }
    };
    
    // Compare to current situation
    let comparison = null;
    if (validated.currentWage) {
      const currentAnnual = validated.currentWage * 2080; // 40hrs * 52wks
      comparison = {
        currentAnnual,
        currentMonthly: currentAnnual / 12,
        afterElevateAnnual: careerProjections.experienced.annualSalary + (careerProjections.experienced.monthlyWithTips - 5000) * 12,
        annualIncrease: (careerProjections.experienced.annualSalary + 15000) - currentAnnual,
        fiveYearGain: ((careerProjections.experienced.annualSalary + 15000) - currentAnnual) * 5
      };
    }
    
    // Log calculation
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('calculator_usage').insert({
        user_id: user?.id || null,
        calculator_type: 'wage_progression',
        program_slug: validated.programSlug || 'barbering-apprenticeship',
        employment_status: validated.employmentStatus,
        current_wage: validated.currentWage || null,
        calculated_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log calculation:', logError);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        apprenticeshipStages: stageEarnings,
        totalApprenticeshipEarnings: Math.round(totalApprenticeshipEarnings),
        careerProjections,
        comparison,
        disclaimer: 'Wage estimates based on Indiana Bureau of Labor Statistics and Elevate graduate surveys. Actual earnings may vary.'
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Wage progression calculation error:', error);
    return NextResponse.json(
      { success: false, error: 'Calculation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return default wage progression data for program
  return NextResponse.json({
    success: true,
    data: {
      programName: 'Barbering Registered Apprenticeship',
      defaultWages: [
        { period: 'Months 1-6', hourlyRate: 14.00, description: 'Starting apprentice wage' },
        { period: 'Months 7-12', hourlyRate: 16.00, description: 'After 1,000 hours completed' },
        { period: 'Months 13-18', hourlyRate: 18.00, description: 'Senior apprentice rate' }
      ],
      licenseCareerData: {
        averageStarting: 42000,
        averageExperienced: 55000,
        tipsAverage: 15000
      }
    }
  });
}
