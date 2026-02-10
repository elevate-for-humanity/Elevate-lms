import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;
import {
  generateQuarterlyReport,
  exportToINTrainingCSV,
  calculateWIOAPerformance,
  getUpcomingDeadlines,
} from '@/lib/compliance/wioa-reporting';

/**
 * Test Compliance Reporting
 * GET /api/test-compliance
 */
export async function GET() {
  // Block in production — this endpoint is for development/testing only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    // Test 1: Get upcoming deadlines
    const deadlines = getUpcomingDeadlines();
    results.tests.push({
      name: 'Get Upcoming Deadlines',
      passed: Array.isArray(deadlines) && deadlines.length > 0,
      data: { count: deadlines.length, deadlines: deadlines.slice(0, 3) },
    });

    // Test 2: Generate quarterly report
    try {
      const report = await generateQuarterlyReport('Q1', 2026);
      results.tests.push({
        name: 'Generate Q1 2026 Report',
        passed: report !== null && report.quarter === 'Q1',
        data: {
          quarter: report.quarter,
          year: report.year,
          student_count: report.students.length,
          summary: report.summary,
        },
      });

      // Test 3: Export to CSV
      if (report) {
        const csv = exportToINTrainingCSV(report);
        const hasHeaders =
          csv.includes('Student ID') && csv.includes('Program Name');
        results.tests.push({
          name: 'Export to INTraining CSV',
          passed: hasHeaders && csv.length > 100,
          data: {
            csv_length: csv.length,
            has_headers: hasHeaders,
            preview: csv.substring(0, 200) + '...',
          },
        });
      }
    } catch (error) { /* Error handled silently */ 
      results.tests.push({
        name: 'Generate Q1 2026 Report',
        passed: false,
        error: error.message,
      });
    }

    // Test 4: Calculate WIOA performance
    try {
      const startDate = '2025-07-01';
      const endDate = '2025-09-30';
      const performance = await calculateWIOAPerformance(startDate, endDate);

      results.tests.push({
        name: 'Calculate WIOA Performance Metrics',
        passed: performance !== null,
        data: {
          reporting_period: performance.reporting_period,
          employment_2nd_quarter: performance.employment_2nd_quarter,
          employment_4th_quarter: performance.employment_4th_quarter,
          median_earnings: performance.median_earnings_2nd_quarter,
          credential_attainment: performance.credential_attainment,
          measurable_skill_gains: performance.measurable_skill_gains,
        },
      });
    } catch (error) { /* Error handled silently */ 
      results.tests.push({
        name: 'Calculate WIOA Performance Metrics',
        passed: false,
        error: error.message,
      });
    }

    // Test 5: Verify all required fields in report
    try {
      const report = await generateQuarterlyReport('Q2', 2026);
      const requiredFields = [
        'quarter',
        'year',
        'start_date',
        'end_date',
        'due_date',
        'students',
        'summary',
      ];

      const hasAllFields = requiredFields.every((field) => field in report);

      results.tests.push({
        name: 'Report Has All Required Fields',
        passed: hasAllFields,
        data: {
          required_fields: requiredFields,
          present_fields: Object.keys(report),
        },
      });
    } catch (error) { /* Error handled silently */ 
      results.tests.push({
        name: 'Report Has All Required Fields',
        passed: false,
        error: error.message,
      });
    }

    // Calculate summary
    const totalTests = results.tests.length;
    const passedTests = results.tests.filter((t: any) => t.passed).length;
    const failedTests = totalTests - passedTests;

    results.summary = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      success_rate: ((passedTests / totalTests) * 100).toFixed(1) + '%',
      all_passed: failedTests === 0,
    };

    results.compliance_ready = failedTests === 0;

    return NextResponse.json(results);
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
