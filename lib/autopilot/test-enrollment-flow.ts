import { logger } from '@/lib/logger';
/**
 * Autopilot: Test Enrollment Flow
 * Tests complete student enrollment including AI instructor assignment
 */

import { createClient } from '@supabase/supabase-js';
import { setAuditContext } from '@/lib/audit-context';

interface TestResult {
  step: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  data?: any;
  error?: any;
}

interface EnrollmentTestConfig {
  studentEmail: string;
  studentPassword: string;
  programSlug: string;
  skipPayment?: boolean;
}

export async function testEnrollmentFlow(
  config: EnrollmentTestConfig
): Promise<{
  success: boolean;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}> {
  const results: TestResult[] = [];

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    results.push({
      step: 'Initialize',
      status: 'failed',
      message: 'Missing Supabase credentials',
    });
    return {
      success: false,
      results,
      summary: { total: 1, passed: 0, failed: 1, skipped: 0 },
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  await setAuditContext(supabase, { systemActor: 'autopilot_test' });

  // STEP 1: Create or get test student
  try {
    // Try to sign in first
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: config.studentEmail,
        password: config.studentPassword,
      });

    let userId: string;

    if (signInError) {
      // Create new user
      const { data: signUpData, error: signUpError } =
        await supabase.auth.admin.createUser({
          email: config.studentEmail,
          password: config.studentPassword,
          email_confirm: true,
          user_metadata: {
            full_name: 'Test Student (Autopilot)',
            role: 'student',
          },
        });

      if (signUpError || !signUpData.user) {
        throw new Error(`Failed to create user: ${signUpError?.message}`);
      }

      userId = signUpData.user.id;

      results.push({
        step: 'Create Student',
        status: 'success',
        message: `Created new test student: ${config.studentEmail}`,
        data: { userId },
      });
    } else {
      userId = signInData.user.id;

      results.push({
        step: 'Get Student',
        status: 'success',
        message: `Found existing student: ${config.studentEmail}`,
        data: { userId },
      });
    }

    // STEP 2: Get program details

    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('slug', config.programSlug)
      .single();

    if (programError || !program) {
      throw new Error(`Program not found: ${config.programSlug}`);
    }

    results.push({
      step: 'Get Program',
      status: 'success',
      message: `Found program: ${program.title}`,
      data: { programId: program.id, programName: program.title },
    });

    // STEP 3: Create enrollment

    const { data: existingEnrollment } = await supabase
      .from('program_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('program_id', program.id)
      .maybeSingle();

    let enrollmentId: string;

    if (existingEnrollment) {
      enrollmentId = existingEnrollment.id;

      // Update to active
      await supabase
        .from('program_enrollments')
        .update({
          status: 'active',
          payment_status: 'paid',
          enrolled_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId);

      results.push({
        step: 'Update Enrollment',
        status: 'success',
        message: 'Activated existing enrollment',
        data: { enrollmentId },
      });
    } else {
      const { data: newEnrollment, error: enrollError } = await supabase
        .from('program_enrollments')
        .insert({
          user_id: userId,
          program_id: program.id,
          status: 'active',
          payment_status: config.skipPayment ? 'waived' : 'paid',
          source: 'autopilot_test',
          enrolled_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (enrollError || !newEnrollment) {
        throw new Error(`Failed to create enrollment: ${enrollError?.message}`);
      }

      enrollmentId = newEnrollment.id;

      results.push({
        step: 'Create Enrollment',
        status: 'success',
        message: 'Created new enrollment',
        data: { enrollmentId },
      });
    }

    // STEP 4: Check AI instructor exists for program

    const { data: instructor, error: instructorError } = await supabase
      .from('ai_instructors')
      .select('*')
      .eq('program_slug', config.programSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (instructorError) {
      throw new Error(
        `Failed to query instructors: ${instructorError.message}`
      );
    }

    if (!instructor) {
      results.push({
        step: 'Check AI Instructor',
        status: 'failed',
        message: `No active AI instructor found for program: ${config.programSlug}`,
      });
    } else {
      results.push({
        step: 'Check AI Instructor',
        status: 'success',
        message: `Found AI instructor: ${instructor.name}`,
        data: { instructorId: instructor.id, instructorName: instructor.name },
      });
    }

    // STEP 5: Assign AI instructor

    if (instructor) {
      const { data: existingAssignment } = await supabase
        .from('ai_instructor_assignments')
        .select('*')
        .eq('student_id', userId)
        .eq('instructor_id', instructor.id)
        .maybeSingle();

      if (existingAssignment) {
        results.push({
          step: 'Assign AI Instructor',
          status: 'success',
          message: 'AI instructor already assigned',
          data: { assignmentId: existingAssignment.id },
        });
      } else {
        const { data: assignment, error: assignError } = await supabase
          .from('ai_instructor_assignments')
          .insert({
            student_id: userId,
            instructor_id: instructor.id,
            program_slug: config.programSlug,
            status: 'active',
          })
          .select()
          .single();

        if (assignError || !assignment) {
          throw new Error(
            `Failed to assign instructor: ${assignError?.message}`
          );
        }

        results.push({
          step: 'Assign AI Instructor',
          status: 'success',
          message: 'AI instructor assigned successfully',
          data: { assignmentId: assignment.id },
        });

        // Log to audit trail
        await supabase.from('ai_audit_log').insert({
          user_id: userId,
          action: 'ASSIGN_INSTRUCTOR',
          details: {
            program_slug: config.programSlug,
            instructor_slug: instructor.slug,
            source: 'autopilot_test',
          },
        });
      }
    }

    // STEP 6: Verify assignment

    const { data: verifyAssignment } = await supabase
      .from('ai_instructor_assignments')
      .select(
        `
        *,
        instructor:ai_instructors(*)
      `
      )
      .eq('student_id', userId)
      .eq('program_slug', config.programSlug)
      .eq('status', 'active')
      .maybeSingle();

    if (verifyAssignment) {
      results.push({
        step: 'Verify Assignment',
        status: 'success',
        message: 'Assignment verified successfully',
        data: {
          assignmentId: verifyAssignment.id,
          instructorName: verifyAssignment.instructor?.name,
        },
      });
    } else {
      results.push({
        step: 'Verify Assignment',
        status: 'failed',
        message: 'Assignment verification failed',
      });
    }

    // STEP 7: Test chat conversation creation

    if (instructor) {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          student_id: userId,
          instructor_id: instructor.id,
          program_slug: config.programSlug,
          title: 'Autopilot Test Conversation',
        })
        .select()
        .single();

      if (convError) {
        results.push({
          step: 'Create Conversation',
          status: 'failed',
          message: `Failed to create conversation: ${convError.message}`,
          error: convError,
        });
      } else {
        results.push({
          step: 'Create Conversation',
          status: 'success',
          message: 'Test conversation created',
          data: { conversationId: conversation.id },
        });

        // Test message insertion
        const { error: msgError } = await supabase.from('ai_messages').insert({
          conversation_id: conversation.id,
          student_id: userId,
          instructor_id: instructor.id,
          role: 'student',
          content: 'Test message from autopilot',
          metadata: { source: 'autopilot_test' },
        });

        if (msgError) {
          results.push({
            step: 'Send Test Message',
            status: 'failed',
            message: `Failed to send message: ${msgError.message}`,
            error: msgError,
          });
        } else {
          results.push({
            step: 'Send Test Message',
            status: 'success',
            message: 'Test message sent successfully',
          });
        }
      }
    }

    // STEP 8: Check audit log

    const { data: auditLogs, error: auditError } = await supabase
      .from('ai_audit_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (auditError) {
      results.push({
        step: 'Check Audit Log',
        status: 'failed',
        message: `Failed to query audit log: ${auditError.message}`,
        error: auditError,
      });
    } else {
      results.push({
        step: 'Check Audit Log',
        status: 'success',
        message: `Found ${auditLogs?.length || 0} audit log entries`,
        data: { logCount: auditLogs?.length || 0 },
      });
    }
  } catch (data: any) {
    results.push({
      step: 'Test Execution',
      status: 'failed',
      message:
        (data instanceof Error ? data.message : String(data)) || 'Unknown data',
      data,
    });
  }

  // Calculate summary
  const summary = {
    total: results.length,
    passed: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'failed').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
  };

  const success = summary.failed === 0 && summary.passed > 0;

  // Print summary

  return { success, results, summary };
}

// CLI execution
if (require.main === module) {
  const config: EnrollmentTestConfig = {
    studentEmail:
      process.env.TEST_STUDENT_EMAIL || 'test-student@autopilot.test',
    studentPassword: process.env.TEST_STUDENT_PASSWORD || 'TestPassword123!',
    programSlug: process.env.TEST_PROGRAM_SLUG || 'barber-apprenticeship',
    skipPayment: true,
  };

  testEnrollmentFlow(config)
    .then((result) => {
      result.results.forEach((r, i) => {
        const icon =
          r.status === 'success' ? '✅' : r.status === 'failed' ? '❌' : '⏭️';
        if (r.data) {
          logger.info('  Data:', JSON.stringify(r.data, null, 2));
        }
        if (r.error) {
          logger.error('  Error:', r.error);
        }
      });

      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      logger.error('Test failed:', error);
      process.exit(1);
    });
}
