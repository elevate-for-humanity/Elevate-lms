/**
 * INDIANA COMPLIANCE TESTS
 *
 * Test scenarios for Indiana DWD compliance automation
 */

import { describe, test, expect } from 'vitest';

import {
  meetsIndianaETPLStandards,
  getNextIndianaReportDueDate,
  INDIANA_ETPL_STANDARDS,
  INDIANA_REPORTING_SCHEDULES,
  INDIANA_EMAIL_TEMPLATES,
} from '../indiana-compliance';

import {
  getIndianaAlertForReport,
  checkIndianaPerformanceStandards,
  BATCH_CONFIG,
} from '../alert-system';

describe('Indiana ETPL Standards', () => {
  test('Program meets all standards', () => {
    const result = meetsIndianaETPLStandards(
      0.75, // 75% employment rate
      0.65, // 65% credential rate
      5000, // $5,000 wage gain
      25, // 25 students
      0.95, // 95% data quality
    );

    expect(result.meets).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  test('Program fails employment rate', () => {
    const result = meetsIndianaETPLStandards(
      0.65, // 65% employment rate (below 70% minimum)
      0.65, // 65% credential rate
      5000, // $5,000 wage gain
      25, // 25 students
      0.95, // 95% data quality
    );

    expect(result.meets).toBe(false);
    expect(result.failures).toEqual(
      expect.arrayContaining([expect.stringContaining('Employment rate')]),
    );
  });

  test('Program fails credential rate', () => {
    const result = meetsIndianaETPLStandards(
      0.75, // 75% employment rate
      0.55, // 55% credential rate (below 60% minimum)
      5000, // $5,000 wage gain
      25, // 25 students
      0.95, // 95% data quality
    );

    expect(result.meets).toBe(false);
    expect(result.failures).toEqual(
      expect.arrayContaining([expect.stringContaining('Credential rate')]),
    );
  });

  test('Program fails multiple standards', () => {
    const result = meetsIndianaETPLStandards(
      0.55, // 55% employment rate (below 70%)
      0.45, // 45% credential rate (below 60%)
      -1000, // Negative wage gain
      5, // 5 students (below 10 minimum)
      0.75, // 75% data quality (below 90%)
    );

    expect(result.meets).toBe(false);
    expect(result.failures.length).toBeGreaterThan(3);
  });
});

describe('Indiana Performance Alerts', () => {
  test('Critical performance triggers critical alert', () => {
    const result = checkIndianaPerformanceStandards(
      0.55, // 55% employment rate (critically below 60%)
      0.45, // 45% credential rate (critically below 50%)
      -1000, // Negative wage gain
      5, // 5 students
      0.75, // 75% data quality (critically below 80%)
    );

    expect(result.needsAlert).toBe(true);
    expect(result.alertLevel).toBe('critical');
    expect(result.failures.length).toBeGreaterThan(0);
  });

  test('Warning performance triggers warning alert', () => {
    const result = checkIndianaPerformanceStandards(
      0.68, // 68% employment rate (below 70% but above 60%)
      0.58, // 58% credential rate (below 60% but above 50%)
      5000, // Positive wage gain
      25, // 25 students
      0.92, // 92% data quality (above 90% threshold)
    );

    expect(result.needsAlert).toBe(true);
    expect(result.alertLevel).toBe('warning');
  });

  test('Good performance triggers no alert', () => {
    const result = checkIndianaPerformanceStandards(
      0.8, // 80% employment rate
      0.7, // 70% credential rate
      8000, // $8,000 wage gain
      50, // 50 students
      0.95, // 95% data quality
    );

    expect(result.needsAlert).toBe(false);
  });
});

describe('Indiana Report Alerts', () => {
  test('Federal reporting overdue triggers critical alert', () => {
    const alert = getIndianaAlertForReport('federal_reporting', -1);

    expect(alert).not.toBeNull();
    expect(alert?.level).toBe('critical');
    expect(alert?.channels).toContain('phone');
    expect(alert?.escalationHours).toBe(0); // Immediate action
  });

  test('Federal reporting due soon triggers urgent alert', () => {
    const alert = getIndianaAlertForReport('federal_reporting', 3);

    expect(alert).not.toBeNull();
    expect(alert?.level).toBe('urgent');
    expect(alert?.requiresAcknowledgment).toBe(true);
  });

  test('Student data 30+ days overdue triggers critical alert', () => {
    const alert = getIndianaAlertForReport('student_data_submission', -31);

    expect(alert).not.toBeNull();
    expect(alert?.level).toBe('critical');
    expect(alert?.channels).toContain('phone');
  });

  test('Student data due in 7 days triggers reminder', () => {
    const alert = getIndianaAlertForReport('student_data_submission', 7);

    expect(alert).not.toBeNull();
    expect(alert?.level).toBe('reminder');
    expect(alert?.requiresAcknowledgment).toBe(false);
  });

  test('ETPL expired triggers critical alert', () => {
    const alert = getIndianaAlertForReport('etpl_renewal', -1);

    expect(alert).not.toBeNull();
    expect(alert?.level).toBe('critical');
    expect(alert?.escalationHours).toBe(0);
  });

  test('ETPL renewal window open triggers reminder', () => {
    const alert = getIndianaAlertForReport('etpl_renewal', 60);

    expect(alert).not.toBeNull();
    expect(alert?.level).toBe('reminder');
  });
});

describe('Indiana Reporting Schedules', () => {
  test('Student data submission is quarterly', () => {
    const schedule = INDIANA_REPORTING_SCHEDULES.student_data_submission;

    expect(schedule.frequency).toBe('quarterly');
    expect(schedule.quarters).toHaveLength(4);
    expect(schedule.lateSubmissionConsequence).toContain('30 days');
  });

  test('Federal reporting is annual', () => {
    const schedule = INDIANA_REPORTING_SCHEDULES.federal_reporting;

    expect(schedule.frequency).toBe('annual');
    expect(schedule.dueDate).toContain('September 30');
    expect(schedule.lateSubmissionConsequence).toContain('Immediate removal');
  });

  test('ETPL renewal is annual', () => {
    const schedule = INDIANA_REPORTING_SCHEDULES.etpl_renewal;

    expect(schedule.frequency).toBe('annual');
    expect(schedule.renewalWindow).toBe('90 days before expiration');
    expect(schedule.performanceCriteria.employmentRate).toContain('70%');
  });

  test('Enrollment verification is monthly', () => {
    const schedule = INDIANA_REPORTING_SCHEDULES.enrollment_verification;

    expect(schedule.frequency).toBe('monthly');
    expect(schedule.dueDate).toContain('10th day');
  });
});

describe('Indiana Alert Scenarios', () => {
  test('Scenario 1: New program holder - all compliant', () => {
    // Program holder just started, all metrics good
    const performanceCheck = checkIndianaPerformanceStandards(0.8, 0.7, 8000, 30, 0.95);

    expect(performanceCheck.needsAlert).toBe(false);
  });

  test('Scenario 2: Program holder with declining performance', () => {
    // Employment rate dropping below threshold
    const performanceCheck = checkIndianaPerformanceStandards(0.68, 0.65, 5000, 25, 0.92);

    expect(performanceCheck.needsAlert).toBe(true);
    expect(performanceCheck.alertLevel).toBe('warning');
  });

  test('Scenario 3: Program holder with critical performance', () => {
    // Multiple metrics critically low
    const performanceCheck = checkIndianaPerformanceStandards(0.55, 0.45, -500, 8, 0.75);

    expect(performanceCheck.needsAlert).toBe(true);
    expect(performanceCheck.alertLevel).toBe('critical');
    expect(performanceCheck.failures.length).toBeGreaterThan(3);
  });

  test('Scenario 4: Report due in 7 days - first reminder', () => {
    const alert = getIndianaAlertForReport('student_data_submission', 7);

    expect(alert?.level).toBe('reminder');
    expect(alert?.channels).toContain('email');
    expect(alert?.requiresAcknowledgment).toBe(false);
  });

  test('Scenario 5: Report overdue 1 day - urgent action', () => {
    const alert = getIndianaAlertForReport('student_data_submission', -1);

    expect(alert?.level).toBe('urgent');
    expect(alert?.channels).toContain('sms');
    expect(alert?.requiresAcknowledgment).toBe(true);
  });

  test('Scenario 6: Report overdue 31 days - removal imminent', () => {
    const alert = getIndianaAlertForReport('student_data_submission', -31);

    expect(alert?.level).toBe('critical');
    expect(alert?.channels).toContain('phone');
    expect(alert?.escalationHours).toBe(0);
  });

  test('Scenario 7: Federal reporting overdue - immediate removal', () => {
    const alert = getIndianaAlertForReport('federal_reporting', -1);

    expect(alert?.level).toBe('critical');
    expect(alert?.escalationHours).toBe(0);
  });

  test('Scenario 8: ETPL expiring in 30 days - urgent renewal', () => {
    const alert = getIndianaAlertForReport('etpl_renewal', 30);

    expect(alert?.level).toBe('urgent');
    expect(alert?.requiresAcknowledgment).toBe(true);
  });
});

describe('Mass Scale Processing', () => {
  test('Batch configuration is set for mass scale', () => {
    expect(BATCH_CONFIG.batchSize).toBe(50);
    expect(BATCH_CONFIG.delayBetweenBatches).toBeGreaterThan(0);
    expect(BATCH_CONFIG.maxConcurrent).toBeGreaterThan(0);
    expect(BATCH_CONFIG.retryAttempts).toBeGreaterThan(0);
  });

  test('Can process 500 program holders in batches', () => {
    const totalProgramHolders = 500;
    const expectedBatches = Math.ceil(totalProgramHolders / BATCH_CONFIG.batchSize);

    expect(expectedBatches).toBe(10); // 500 / 50 = 10 batches
  });
});

describe('Indiana Email Templates', () => {
  test('Student data submission reminder template exists', () => {
    expect(INDIANA_EMAIL_TEMPLATES.student_data_submission_reminder).toBeDefined();
    expect(INDIANA_EMAIL_TEMPLATES.student_data_submission_reminder.subject).toContain(
      'Student Data',
    );
    expect(INDIANA_EMAIL_TEMPLATES.student_data_submission_reminder.body).toContain(
      'INTraining Portal',
    );
  });

  test('ETPL renewal reminder template exists', () => {
    expect(INDIANA_EMAIL_TEMPLATES.etpl_renewal_reminder).toBeDefined();
    expect(INDIANA_EMAIL_TEMPLATES.etpl_renewal_reminder.body).toContain('70% employment rate');
    expect(INDIANA_EMAIL_TEMPLATES.etpl_renewal_reminder.body).toContain('60% credential rate');
  });

  test('Performance below threshold template exists', () => {
    expect(INDIANA_EMAIL_TEMPLATES.performance_below_threshold).toBeDefined();
    expect(INDIANA_EMAIL_TEMPLATES.performance_below_threshold.body).toContain(
      'Corrective Action Plan',
    );
  });

  test('Federal reporting overdue template exists', () => {
    expect(INDIANA_EMAIL_TEMPLATES.federal_reporting_overdue).toBeDefined();
    expect(INDIANA_EMAIL_TEMPLATES.federal_reporting_overdue.body).toContain('immediate removal');
  });
});
