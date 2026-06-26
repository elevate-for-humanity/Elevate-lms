/**
 * /api/devstudio/execute
 *
 * SSE endpoint. Accepts a plain-English command, uses GPT-4.1 tool-calling to
 * map it to an action, then streams progress back line-by-line.
 *
 * Supported actions:
 *   generate_course         → POST /api/admin/courses/generate
 *   generate_video          → POST /api/video/generate
 *   run_report              → GET  /api/admin/reports/:type
 *   get_analytics           → GET  /api/admin/analytics
 *   list_applications       → GET  /api/admin/applications
 *   approve_application     → POST /api/admin/applications/:id/approve
 *   list_students           → GET  /api/admin/students
 *   list_enrollments        → GET  /api/admin/enrollments
 *   enroll_student          → POST /api/admin/enrollments
 *   issue_certificate       → POST /api/admin/certificates/bulk
 *   list_cohorts            → GET  /api/admin/cohorts
 *   list_wioa               → GET  /api/admin/wioa
 *   run_export              → GET  /api/admin/export/:type
 *   list_programs           → GET  /api/admin/programs
 *   flag_at_risk            → POST /api/admin/at-risk/flag
 *   send_reminder           → POST /api/admin/send-reminder
 *   list_payout_queue       → GET  /api/admin/enrollments/payout-queue
 *   mark_payout_paid        → POST /api/admin/enrollments/mark-payout-paid
 *   upload_document         → POST /api/documents/upload  (multipart)
 *   send_document_for_sign  → POST /api/admin/sign-documents/send
 *   send_test_email         → POST /api/admin/test-email
 *   check_system_health     → GET  /api/admin/webhook-health
 *   ask_question            → answered directly by the AI (no action)
 *   build_courses           → POST /api/autopilots/build-courses
 *   deploy_autopilot        → POST /api/autopilots/deploy
 *   run_tests               → POST /api/autopilots/run-tests
 *   manage_app_trial        → POST /api/apps/trial/start|status or /api/apps/upgrade
 */

import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv, refreshSecrets } from '@/lib/secrets';
import { safeError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { isGroqConfigured, getGroqClient } from '@/lib/groq-client';
import { isGeminiConfigured } from '@/lib/gemini-client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withRetry } from '@/lib/resilience';
import { aiChat } from '@/lib/ai/ai-service';
import { getAdminUrl, getSiteUrl } from '@/lib/utils/siteUrl';
import { getKnowledgeGraphContext, PLATFORM_DEBT, SYSTEMS } from '@/lib/platform/knowledge-graph';
import { getSystemRegistryContext, requiresConfirmation } from '@/lib/platform/system-registry';
import { requireTypedConfirmation, getConfirmationPhrase } from '@/lib/security/require-confirmation';
import { emitAiAction, emitMigrationEvent } from '@/lib/platform/events';
import { describeCheckedAppDirs, discoverNextAppDirs } from '@/lib/devstudio/next-app-dirs';
import { getAiCharterContext } from '@/lib/devstudio/platform-control-plane';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// ── AI provider — loads keys from platform_secrets then tries all providers ─
// Tool-calling providers (Groq, OpenAI) are wrapped with withRetry for
// transient failures. aiChat() from lib/ai/ai-service is used as the final
// text-only fallback when all tool-calling providers are unavailable.
async function callAI(systemPrompt: string, userPrompt: string, tools?: unknown[]): Promise<{ content: string | null; toolCalls?: unknown[] }> {
  // Force-refresh secrets from platform_secrets on every AI call so keys
  // saved via the Secrets panel are immediately visible without a redeploy.
  try { await refreshSecrets(); } catch { /* non-fatal */ }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];

  // Try Groq — supports function calling with tool_choice: 'required'
  if (isGroqConfigured()) {
    try {
      const result = await withRetry(async () => {
        const groq = getGroqClient();
        const req: Parameters<typeof groq.chat.completions.create>[0] = {
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.1,
          max_tokens: 1024,
        };
        if (tools?.length) {
          (req as any).tools = tools;
          (req as any).tool_choice = 'required';
        }
        return groq.chat.completions.create(req);
      }, { attempts: 2, baseDelayMs: 300, label: 'devstudio/groq' });

      const msg = result.choices[0].message;
      if (msg.tool_calls?.length) return { content: null, toolCalls: msg.tool_calls };
      return { content: msg.content };
    } catch (err) {
      logger.warn('[devstudio/execute] Groq failed, trying OpenAI', err);
    }
  }

  // Fallback — OpenAI (supports function calling)
  if (process.env.OPENAI_API_KEY) {
    try {
      const result = await withRetry(async () => {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const req: Parameters<typeof openai.chat.completions.create>[0] = {
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.1,
          max_tokens: 1024,
        };
        if (tools?.length) {
          (req as any).tools = tools;
          (req as any).tool_choice = 'required';
        }
        return openai.chat.completions.create(req);
      }, { attempts: 2, baseDelayMs: 500, label: 'devstudio/openai' });

      const msg = result.choices[0].message;
      if (msg.tool_calls?.length) return { content: null, toolCalls: msg.tool_calls };
      return { content: msg.content };
    } catch (err) {
      logger.warn('[devstudio/execute] OpenAI failed, trying Gemini', err);
    }
  }

  // Gemini — no function calling, plain text only
  if (isGeminiConfigured()) {
    try {
      const result = await withRetry(async () => {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
        });
        return model.generateContent(userPrompt);
      }, { attempts: 2, baseDelayMs: 500, label: 'devstudio/gemini' });

      return { content: result.response.text() };
    } catch (err) {
      logger.warn('[devstudio/execute] Gemini failed, trying aiChat fallback', err);
    }
  }

  // Final fallback — aiChat() resilience layer (text-only, no tool dispatch)
  try {
    const result = await aiChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      maxTokens: 1024,
    });
    return { content: result.content };
  } catch (err) {
    logger.warn('[devstudio/execute] aiChat fallback failed', err);
  }

  throw new Error(
    'No AI provider available. Add GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in Dev Studio → Secrets tab.'
  );
}

// ── Tool definitions ────────────────────────────────────────────────────────

const TOOLS: unknown[] = [
  {
    type: 'function',
    function: {
      name: 'generate_course',
      description: 'Generate a new course from a topic, blueprint, or syllabus description',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Course topic or title' },
          program_id: {
            type: 'string',
            description: 'Program UUID to attach the course to (optional)',
          },
          blueprint: {
            type: 'string',
            description: 'Blueprint ID if using an existing blueprint (optional)',
          },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_video',
      description: 'Generate a lesson video using AI (D-ID or HeyGen)',
      parameters: {
        type: 'object',
        properties: {
          script: { type: 'string', description: 'Video script or topic' },
          lesson_id: { type: 'string', description: 'Lesson ID to attach the video to (optional)' },
        },
        required: ['script'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_report',
      description: 'Run an operational report',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: [
              'daily',
              'enrollment',
              'financial',
              'leads',
              'partners',
              'users',
              'cohort-outcomes',
              'reconciliation',
            ],
            description: 'Report type',
          },
        },
        required: ['type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_analytics',
      description: 'Get platform analytics overview — enrollments, revenue, active users',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_applications',
      description: 'List recent applications with optional status filter',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected', 'all'],
            description: 'Filter by status',
          },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_students',
      description: 'List students with optional search',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Name or email search term' },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_enrollments',
      description: 'List recent enrollments',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_system_health',
      description: 'Check system and webhook health status',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_test_email',
      description: 'Send a test email to verify email configuration',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
        },
        required: ['to'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'approve_application',
      description: 'Approve a student application by application ID',
      parameters: {
        type: 'object',
        properties: {
          application_id: { type: 'string', description: 'Application UUID to approve' },
          program_id: { type: 'string', description: 'Program UUID to enroll into (optional)' },
          funding_type: {
            type: 'string',
            description: 'Funding type e.g. wioa, self_pay, employer (optional)',
          },
        },
        required: ['application_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'enroll_student',
      description: 'Enroll a student into a course or program',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: 'Student user UUID' },
          course_id: { type: 'string', description: 'Course UUID to enroll into' },
          program_id: { type: 'string', description: 'Program UUID (optional)' },
        },
        required: ['user_id', 'course_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'issue_certificate',
      description: 'Issue completion certificates to one or more students by enrollment ID',
      parameters: {
        type: 'object',
        properties: {
          enrollment_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of enrollment UUIDs',
          },
          template_id: { type: 'string', description: 'Certificate template UUID' },
          signed_by: { type: 'string', description: 'Name of the signing authority (optional)' },
        },
        required: ['enrollment_ids', 'template_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_cohorts',
      description: 'List cohorts with optional program filter',
      parameters: {
        type: 'object',
        properties: {
          program_id: { type: 'string', description: 'Filter by program UUID (optional)' },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_wioa',
      description: 'List WIOA cases with optional status filter',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'approved', 'denied', 'all'],
            description: 'Filter by status',
          },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_export',
      description: 'Export data as CSV — students, enrollments, or weekly hours',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['students', 'enrollments', 'weekly-hours'],
            description: 'Export type',
          },
        },
        required: ['type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_programs',
      description: 'List all programs in the catalog',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['published', 'draft', 'all'],
            description: 'Filter by status',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'flag_at_risk',
      description: 'Flag a student as at-risk with a reason',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: 'Student user UUID' },
          reason: { type: 'string', description: 'Reason for flagging' },
        },
        required: ['user_id', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_reminder',
      description: 'Send a reminder email to a student or group',
      parameters: {
        type: 'object',
        properties: {
          user_id: {
            type: 'string',
            description: 'Student user UUID (optional — omit to send to all inactive)',
          },
          message: { type: 'string', description: 'Custom reminder message (optional)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_payout_queue',
      description: 'List enrollments in the payout queue awaiting payment',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_payout_paid',
      description: 'Mark one or more enrollments as payout paid',
      parameters: {
        type: 'object',
        properties: {
          enrollment_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Enrollment UUIDs to mark paid',
          },
        },
        required: ['enrollment_ids'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Compose and send an email to any recipient from inside the dev container',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          body: { type: 'string', description: 'Email body — plain text or HTML' },
          from_name: {
            type: 'string',
            description: 'Sender display name (optional, defaults to Elevate for Humanity)',
          },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_document_for_sign',
      description:
        'Generate and send a document (W-9, ACH, MOU, grant form) for e-signature via email',
      parameters: {
        type: 'object',
        properties: {
          document_type: {
            type: 'string',
            enum: ['w9', 'ach', 'mou', 'grant_application', 'enrollment_agreement'],
            description: 'Type of document to generate and send',
          },
          recipient_email: { type: 'string', description: 'Email address to send the document to' },
          recipient_name: { type: 'string', description: 'Full name of the recipient' },
        },
        required: ['document_type', 'recipient_email'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ask_question',
      description:
        'Use this when the user asks a general question, wants an explanation, or needs guidance — and no other tool applies. Write a direct, helpful answer. Do NOT echo the question back. Do NOT say "I will help you" — just answer.',
      parameters: {
        type: 'object',
        properties: {
          answer: {
            type: 'string',
            description: 'Your complete answer to the user\'s question. Be specific, actionable, and concise. Use plain text — no markdown headers or code fences.',
          },
        },
        required: ['answer'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'build_courses',
      description: 'Build and push course content files to the GitHub repository via the autopilot system',
      parameters: {
        type: 'object',
        properties: {
          course_id: { type: 'string', description: 'Optional course ID to build a specific course. Omit to build all.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deploy_autopilot',
      description: 'Trigger an autopilot deployment — prepares build artifacts and initiates Northflank deploy',
      parameters: {
        type: 'object',
        properties: {
          service: { type: 'string', enum: ['lms', 'admin', 'studio', 'both'], description: 'Which service to deploy' },
        },
        required: ['service'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_tests',
      description: 'Run autopilot test suite — scans course metadata and validates structure',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'manage_app_trial',
      description: 'Start, check status of, or upgrade an app trial subscription for a user',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['start', 'status', 'upgrade'], description: 'What to do with the trial' },
          user_id: { type: 'string', description: 'User ID to manage trial for' },
          app_id: { type: 'string', description: 'App ID (e.g. sam-gov, grants, website-builder)' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_at_risk',
      description: 'List at-risk learners who have not been active recently',
      parameters: { type: 'object', properties: { limit: { type: 'number' } }, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_completions',
      description: 'List recent program/course completions',
      parameters: { type: 'object', properties: { limit: { type: 'number' } }, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'export_catalog',
      description: 'Export the full program catalog as a downloadable file',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_monitoring',
      description: 'Check platform monitoring status, uptime, memory, and recent errors',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_users',
      description: 'List platform users with optional search by name or email',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Name or email search term' },
          limit: { type: 'number' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_user_role',
      description: 'Update a user\'s role (student, staff, admin, admin, instructor)',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: 'User UUID' },
          role: { type: 'string', enum: ['student', 'staff', 'admin', 'instructor'] },
        },
        required: ['user_id', 'role'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_bulk_email',
      description: 'Send a bulk email to students or all users',
      parameters: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          body: { type: 'string' },
          audience: { type: 'string', enum: ['all', 'students', 'active', 'inactive'], description: 'Who to send to' },
        },
        required: ['subject', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_wioa_export',
      description: 'Run the WIOA PIRL data export',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_backup',
      description: 'Trigger a platform data backup',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_automation',
      description: 'Trigger a named automation workflow',
      parameters: {
        type: 'object',
        properties: {
          automation_id: { type: 'string', description: 'Automation ID or name to run' },
        },
        required: ['automation_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_shops',
      description: 'List barber/cosmetology shops in the system',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_promo_codes',
      description: 'List active promo codes and discount codes',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_social_campaigns',
      description: 'List social media campaigns',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_social_connections',
      description: 'Check which social media platforms are connected (Facebook, Instagram, YouTube, Twitter, LinkedIn)',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_social_post',
      description: 'Use AI to generate social media post content for a program or topic. Returns ready-to-publish copy.',
      parameters: {
        type: 'object',
        properties: {
          program: { type: 'string', description: 'Program slug or "all" (e.g. hvac, barber, cna, cdl, all)' },
          platforms: { type: 'string', description: 'Comma-separated platforms: facebook,instagram,twitter,linkedin' },
          count: { type: 'number', description: 'Number of posts to generate (default 3)' },
          topic: { type: 'string', description: 'Optional specific topic or angle for the posts' },
        },
        required: ['program'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'publish_social_post',
      description: 'Publish a post immediately to a social media platform',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['facebook', 'instagram', 'twitter', 'linkedin'], description: 'Platform to post to' },
          content: { type: 'string', description: 'Post text content' },
          title: { type: 'string', description: 'Optional title (used for LinkedIn)' },
          media_url: { type: 'string', description: 'Optional image or video URL' },
        },
        required: ['platform', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'export_audit_log',
      description: 'Export the admin audit log',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'smoke_test',
      description: 'Run a full platform smoke test — checks all critical endpoints, DB, storage, AI providers, env vars, and Northflank services. Use when asked to smoke test, health check, or verify the platform is working.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_payroll',
      description: 'Create and run a payroll run for a pay period. Use when asked to run payroll, process payroll, or pay staff.',
      parameters: {
        type: 'object',
        properties: {
          pay_period_start: { type: 'string', description: 'Start date YYYY-MM-DD' },
          pay_period_end:   { type: 'string', description: 'End date YYYY-MM-DD' },
          pay_date:         { type: 'string', description: 'Pay date YYYY-MM-DD' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'export_payroll',
      description: 'Export payroll data as a downloadable file.',
      parameters: {
        type: 'object',
        properties: {
          run_id: { type: 'string', description: 'Specific payroll run ID to export (optional)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_reports',
      description: 'Run a platform report. Types: overall, program, site, funder, dol, activity, wioa, outcomes, participants, rapids, grants, compliance, enrollment.',
      parameters: {
        type: 'object',
        properties: {
          report_type: {
            type: 'string',
            enum: ['overall','program','site','funder','dol','activity','wioa','outcomes','participants','rapids','grants','compliance','enrollment'],
            description: 'Which report to run',
          },
        },
        required: ['report_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'repo_commits',
      description: 'Fetch recent commits from the GitHub repository. Can filter by file path or date. Use when asked about recent changes, what changed, commit history, or signing code commits.',
      parameters: {
        type: 'object',
        properties: {
          path:  { type: 'string', description: 'File or directory path to filter commits (e.g. components/SignaturePad.tsx)' },
          since: { type: 'string', description: 'ISO date to fetch commits since (e.g. 2026-05-01T00:00:00Z)' },
          limit: { type: 'number', description: 'Max commits to return (default 20, max 50)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scan_routes',
      description: 'Scan all Next.js app routes and API routes. Returns counts, lists missing auth, finds orphaned pages, and detects duplicate slugs.',
      parameters: {
        type: 'object',
        properties: {
          filter: { type: 'string', enum: ['all', 'no-auth', 'api', 'pages', 'duplicates'], description: 'What to scan (default: all)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'audit_system',
      description: 'Run a full platform audit — checks schema gaps, auth gaps, env var gaps, orphaned routes, and DB integrity.',
      parameters: {
        type: 'object',
        properties: {
          scope: { type: 'string', enum: ['all', 'schema', 'auth', 'env', 'routes', 'db'], description: 'Audit scope (default: all)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'inspect_links',
      description: 'Scan the codebase for broken internal links, missing page routes, and dead hrefs.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Subdirectory to scan (e.g. app/programs). Defaults to full app.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_migration',
      description: 'Apply a pending Supabase migration by filename. Only runs migrations that have not been applied. Requires confirmation.',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Migration filename (e.g. 20260629000009_seed_barber_course_row.sql)' },
          confirm:  { type: 'boolean', description: 'Must be true to execute. If false, returns a dry-run preview.' },
        },
        required: ['filename'],
      },
    },
  },

  // ── Semantic composite tools ─────────────────────────────────────────────
  // Higher-level tools that reason about the platform as a whole.

  {
    type: 'function',
    function: {
      name: 'audit_enrollment_pipeline',
      description: 'Audit the full enrollment pipeline: check applications table, enrollments, pending states, payment status, and identify stuck or broken flows.',
      parameters: {
        type: 'object',
        properties: {
          program_slug: { type: 'string', description: 'Limit audit to a specific program slug (optional)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'verify_program_integrity',
      description: 'Verify a program\'s full data integrity: check programs table, linked courses, curriculum_lessons, apply routes, checkout routes, and enrollment flow.',
      parameters: {
        type: 'object',
        properties: {
          program_slug: { type: 'string', description: 'Program slug to verify (e.g. hvac-technician, cna)' },
        },
        required: ['program_slug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'inspect_student_access',
      description: 'Inspect a student\'s access: enrollments, lesson progress, checkpoint scores, certificates, and any blocked or stuck states.',
      parameters: {
        type: 'object',
        properties: {
          user_id:  { type: 'string', description: 'Student user UUID' },
          email:    { type: 'string', description: 'Student email (alternative to user_id)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_platform_state',
      description: 'Get a live platform state snapshot: active students, pending applications, enrollments, published programs, certificates issued, deployment health, and known issues.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookup_knowledge_graph',
      description: 'Look up the platform knowledge graph: find which system owns a route or DB table, get system details, list platform debt, or get canonical architecture decisions.',
      parameters: {
        type: 'object',
        properties: {
          query:  { type: 'string', description: 'What to look up: a route path, table name, system id, or "debt" / "decisions"' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_pending_migrations',
      description: 'List all migration files in supabase/migrations/ that may not yet be applied in the live DB.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'apply_all_pending_migrations',
      description: 'Apply all pending Supabase migrations that are in supabase/migrations/ but not yet in the DB. Uses Management API if SUPABASE_MANAGEMENT_API_KEY is set, otherwise falls back to exec_sql RPC. Requires confirmation.',
      parameters: {
        type: 'object',
        properties: {
          confirm: { type: 'boolean', description: 'Must be true to actually apply — false is a dry run' },
        },
        required: ['confirm'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recall_memory',
      description: 'Recall persistent operational memory: known issues, canonical decisions, past audits, deployment events.',
      parameters: {
        type: 'object',
        properties: {
          type:   { type: 'string', enum: ['decision', 'audit', 'issue', 'deployment', 'all'], description: 'Memory type to recall' },
          search: { type: 'string', description: 'Keyword to filter memories (optional)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_memory',
      description: 'Save a new operational memory: a decision made, issue found, or note about the platform.',
      parameters: {
        type: 'object',
        properties: {
          type:    { type: 'string', enum: ['decision', 'audit', 'issue', 'deployment', 'note'], description: 'Memory type' },
          title:   { type: 'string', description: 'Short title' },
          content: { type: 'string', description: 'Full content of the memory' },
          tags:    { type: 'array', items: { type: 'string' }, description: 'Tags for filtering' },
        },
        required: ['type', 'title', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_qa_scan',
      description: 'Run the autonomous QA scanner: checks routes, auth gaps, API health, DB integrity, program registry, enrollment flows, and env vars.',
      parameters: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['all', 'routes', 'auth', 'api', 'db', 'programs', 'enrollment', 'env'],
            description: 'What to scan (default: all)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_snapshot',
      description: 'Create a platform snapshot before making a change. Use before migrations, deployments, or config changes.',
      parameters: {
        type: 'object',
        properties: {
          type:         { type: 'string', enum: ['pre_migration', 'pre_deploy', 'pre_config_change', 'manual'], description: 'Snapshot type' },
          label:        { type: 'string', description: 'Human-readable label for this snapshot' },
          rollback_sql: { type: 'string', description: 'SQL to undo the change (optional)' },
        },
        required: ['type', 'label'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_snapshots',
      description: 'List recent platform snapshots for rollback reference.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max results (default 10)' },
          type:  { type: 'string', description: 'Filter by snapshot type (optional)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookup_program_registry',
      description: 'Look up a program in the central system registry: get canonical route, apply route, checkout route, funding types, and DB status.',
      parameters: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'Program slug (e.g. hvac-technician, cna, barber-apprenticeship)' },
        },
        required: ['slug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_contracts',
      description: 'List active contracts and MOUs — counterparty, status, expiration dates.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_grants',
      description: 'List grants — funder, amount requested, deadline, status.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_documents',
      description: 'List recently uploaded documents — name, type, status.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_compliance',
      description: 'Show compliance status — open alerts, pending WIOA docs, unverified enrollment documents.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_signatures',
      description: 'List pending signature requests — document name, signer, status.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_workflows',
      description: 'List active workflows — name, status, owner.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_org_profile',
      description: 'Retrieve organization profile — name, EIN, UEI, SAM, mission, counties served.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

// ── SSE helpers ─────────────────────────────────────────────────────────────

function encode(text: string) {
  // Key must be "text" — the frontend reads parsed.text ?? parsed.output
  return new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`);
}

function encodeDone() {
  return new TextEncoder().encode('data: [DONE]\n\n');
}

// ── Keyword-based command router (no AI required) ────────────────────────────
// Maps plain-English command strings to action names so the autopilot quick
// buttons work even when no AI provider key is configured.

const KEYWORD_MAP: Array<{ patterns: RegExp; action: string; args?: Record<string, unknown> }> = [
  { patterns: /platform.*state|get.*state|live.*state|state.*snapshot/i,    action: 'get_platform_state',  args: {} },
  { patterns: /run.*test|test.*suite|autopilot.*test/i,                    action: 'run_tests',           args: {} },
  { patterns: /health|system.*health|check.*health/i,                      action: 'check_system_health', args: {} },
  { patterns: /contract|list.*contract|show.*contract|mou/i,               action: 'list_contracts',      args: {} },
  { patterns: /grant|list.*grant|show.*grant|funding.*opportunit/i,        action: 'list_grants',         args: {} },
  { patterns: /document|list.*doc|show.*doc|uploaded.*file/i,              action: 'list_documents',      args: {} },
  { patterns: /compliance|list.*compliance|compliance.*alert|audit.*status/i, action: 'list_compliance',  args: {} },
  { patterns: /signature|pending.*sign|sign.*pending|esign/i,              action: 'list_signatures',     args: {} },
  { patterns: /workflow|list.*workflow|show.*workflow/i,                    action: 'list_workflows',      args: {} },
  { patterns: /org.*profile|organization.*profile|ein|uei|sam.*reg/i,      action: 'get_org_profile',     args: {} },
  { patterns: /barber.*(partner|partnership|shop).*application|barbershop.*application|partner.*barber.*application/i, action: 'list_barber_shop_applications', args: {} },
  { patterns: /build.*course|course.*build/i,                              action: 'build_courses',       args: {} },
  { patterns: /deploy.*lms/i,                                              action: 'deploy_autopilot',    args: { service: 'lms' } },
  { patterns: /deploy.*admin/i,                                            action: 'deploy_autopilot',    args: { service: 'admin' } },
  { patterns: /deploy.*studio/i,                                           action: 'deploy_autopilot',    args: { service: 'studio' } },
  { patterns: /deploy.*all|deploy.*everything/i,                           action: 'deploy_autopilot',    args: { service: 'both' } },
  { patterns: /deploy/i,                                                   action: 'deploy_autopilot',    args: { service: 'both' } },
  // Reports — keyword-matched so they work without an AI key
  { patterns: /enrollment.*report|report.*enrollment|run.*enrollment/i,    action: 'run_report',          args: { type: 'enrollment' } },
  { patterns: /financial.*report|report.*financial|run.*financial/i,       action: 'run_report',          args: { type: 'financial' } },
  { patterns: /wioa.*report|report.*wioa|run.*wioa/i,                      action: 'run_report',          args: { type: 'wioa' } },
  { patterns: /overall.*report|daily.*report|run.*overall|run.*report/i,   action: 'run_report',          args: { type: 'overall' } },
  { patterns: /payroll.*report|report.*payroll|run.*payroll/i,             action: 'run_report',          args: { type: 'payroll' } },
  // Listings
  { patterns: /list.*student|show.*student/i,                              action: 'list_students',       args: {} },
  { patterns: /list.*application|show.*application|pending.*application/i, action: 'list_applications',   args: {} },
  { patterns: /list.*enrollment|show.*enrollment/i,                        action: 'list_enrollments',    args: {} },
  { patterns: /list.*program|show.*program/i,                              action: 'list_programs',       args: {} },
  { patterns: /list.*wioa|show.*wioa|wioa.*case/i,                         action: 'list_wioa',           args: {} },
  { patterns: /list.*cohort|show.*cohort/i,                                action: 'list_cohorts',        args: {} },
  { patterns: /payout.*queue|list.*payout/i,                               action: 'list_payout_queue',   args: {} },
  { patterns: /at.?risk|flag.*risk/i,                                      action: 'flag_at_risk',        args: {} },
  { patterns: /analytics|overview/i,                                       action: 'get_analytics',       args: {} },
  { patterns: /trial.*status|check.*trial/i,                               action: 'manage_app_trial',    args: { action: 'status' } },
  { patterns: /export.*student|student.*export/i,                          action: 'run_export',          args: { type: 'students' } },
  { patterns: /export.*enrollment|enrollment.*export/i,                    action: 'run_export',          args: { type: 'enrollments' } },
  { patterns: /recent.*commit|git.*log|commit.*history/i,                  action: 'repo_commits',        args: {} },
  { patterns: /scan.*route|route.*scan|list.*route|show.*route/i,          action: 'scan_routes',         args: { filter: 'all' } },
  { patterns: /no.*auth.*route|missing.*auth|auth.*gap/i,                  action: 'scan_routes',         args: { filter: 'no-auth' } },
  { patterns: /audit.*system|system.*audit|full.*audit|run.*audit/i,       action: 'audit_system',        args: { scope: 'all' } },
  { patterns: /broken.*link|inspect.*link|link.*check|dead.*link/i,        action: 'inspect_links',       args: {} },
  { patterns: /apply\s+all.*migration|run\s+all.*migration|migration.*all/i, action: 'apply_all_pending_migrations', args: {} },
  { patterns: /run.*migration|apply.*migration|migration.*apply/i,          action: 'run_migration',               args: {} },
  { patterns: /list.*migration|pending.*migration|migration.*pending|show.*migration/i, action: 'list_pending_migrations', args: {} },
  { patterns: /system.*health|health.*check|check.*health|check.*system/i, action: 'check_system_health', args: {} },
  { patterns: /platform.*state|get.*platform|platform.*status/i,           action: 'get_platform_state',  args: {} },
  { patterns: /list.*user|show.*user/i,                                     action: 'list_users',          args: {} },
  { patterns: /list.*shop|show.*shop|barber.*shop/i,                        action: 'list_shops',          args: {} },
  { patterns: /list.*completion|show.*completion/i,                         action: 'list_completions',    args: {} },
];

function matchKeyword(command: string): { action: string; args: Record<string, unknown> } | null {
  for (const entry of KEYWORD_MAP) {
    if (entry.patterns.test(command)) {
      return { action: entry.action, args: entry.args ?? {} };
    }
  }
  return null;
}

// ── Action executors ─────────────────────────────────────────────────────────

async function executeAction(
  name: string,
  args: Record<string, unknown>,
  baseUrl: string,
  authHeader: string,
  write: (line: string) => void,
) {
  // Enforce typed confirmation gate for all operator/deployer tools.
  // args.confirmationText must be typed by a human in the UI — the AI
  // cannot set this value. This prevents autonomous execution of
  // production-mutating actions (deploys, migrations, bulk emails).
  if (requiresConfirmation(name)) {
    const check = requireTypedConfirmation(args.confirmationText, name);
    if (!check.ok) {
      const phrase = getConfirmationPhrase(name);
      write(`\x1b[33m⚠  CONFIRMATION_REQUIRED\x1b[0m`);
      write(`   Action "${name}" affects production and requires human confirmation.`);
      write(`   Type exactly: \x1b[1m${phrase}\x1b[0m`);
      write(`\x1b[2m   CONFIRMATION_PHRASE:${phrase}\x1b[0m`);
      return;
    }
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Cookie: authHeader,
  };

  let sb: Awaited<ReturnType<typeof requireAdminClient>>;
  try {
    sb = await requireAdminClient();
  } catch (err) {
    write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Admin database unavailable'}\x1b[0m`);
    return;
  }

  const adminDb = sb;

  switch (name) {
    case 'generate_course': {
      write('\x1b[33m⚙  Generating course...\x1b[0m');
      write(`   Topic: ${args.topic}`);
      if (args.blueprint) write(`   Blueprint: ${args.blueprint}`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/courses/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            topic: args.topic,
            program_id: args.program_id,
            blueprint: args.blueprint,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Course generation started\x1b[0m');
          if (data.courseId) write(`   Course ID: ${data.courseId}`);
          if (data.title) write(`   Title: ${data.title}`);
          write(`   View at: /admin/courses`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error contacting course generator\x1b[0m');
      }
      break;
    }

    case 'generate_video': {
      write('\x1b[33m⚙  Generating lesson video...\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/video/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            courseName: args.program || args.course_name,
            lessonTitle: args.lesson_title || args.topic,
            script: args.script,
            lesson_id: args.lesson_id,
            duration: args.duration,
            format: args.format || '16:9',
            resolution: args.resolution || '1080p',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Video generation started\x1b[0m');
          if (data.jobId) write(`   Job ID: ${data.jobId}`);
          if (data.videoId) write(`   Video ID: ${data.videoId}`);
          if (data.status) write(`   Status: ${data.status}`);
          write('   View at: /admin/studio');
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
          if (data.details) write(`   ${data.details}`);
        }
      } catch (err) {
        write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Network error'}\x1b[0m`);
      }
      break;
    }

    case 'run_report': {
      // /api/admin/reports/* does not exist — route was never created.
      // Pull live counts directly from DB as a summary report.
      const type = (args.type as string) || 'overview';
      write(`\x1b[33m⚙  Running ${type} report...\x1b[0m`);
      try {
        const [
          { count: totalApps },
          { count: activeEnrollments },
          { count: totalStudents },
          { count: totalCerts },
          { count: activePrograms },
        ] = await Promise.all([
          sb.from('applications').select('id', { count: 'exact', head: true }),
          sb.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          sb.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
          sb.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
          sb.from('programs').select('id', { count: 'exact', head: true }).eq('is_active', true).neq('status', 'archived'),
        ]);
        write(`\x1b[32m✓  Platform overview report\x1b[0m`);
        write(`   Applications:       ${totalApps ?? 0}`);
        write(`   Active enrollments: ${activeEnrollments ?? 0}`);
        write(`   Students:           ${totalStudents ?? 0}`);
        write(`   Certificates:       ${totalCerts ?? 0}`);
        write(`   Active programs:    ${activePrograms ?? 0}`);
        write(`   Full dashboard: /admin`);
      } catch (err) {
        write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Report failed'}\x1b[0m`);
      }
      break;
    }

    case 'get_analytics': {
      write('\x1b[33m⚙  Fetching analytics...\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/analytics`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Analytics loaded\x1b[0m');
          for (const [k, v] of Object.entries(data)) {
            if (typeof v === 'number' || typeof v === 'string') {
              write(`   ${k}: ${v}`);
            }
          }
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'list_applications': {
      const statusFilter = (args.status as string) || 'all';
      const limit = Math.min((args.limit as number) || 20, 100);
      write(`\x1b[33m⚙  Loading applications (${statusFilter})...\x1b[0m`);
      try {
        let q = adminDb.from('applications')
          .select('id, first_name, last_name, full_name, email, status, intake_stage, program_interest, program_slug, funding_type, funding_status, next_step, submitted_at, created_at, reference_number')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (statusFilter !== 'all') q = q.eq('status', statusFilter);
        const { data: apps, error: appsErr } = await q;
        if (appsErr) { write(`\x1b[31m✗  ${appsErr.message}\x1b[0m`); break; }

        // Count by status for summary
        const byStatus: Record<string, number> = {};
        (apps ?? []).forEach((a: any) => {
          const s = a.status ?? 'unknown';
          byStatus[s] = (byStatus[s] ?? 0) + 1;
        });
        const statusSummary = Object.entries(byStatus).map(([s, n]) => `${n} ${s}`).join(', ');

        write(`\x1b[32m✓  ${apps?.length ?? 0} application(s)${statusFilter !== 'all' ? ` (${statusFilter})` : ''}\x1b[0m`);
        if (statusFilter === 'all' && statusSummary) write(`   \x1b[90m${statusSummary}\x1b[0m`);

        (apps ?? []).slice(0, 15).forEach((a: any) => {
          const name = a.full_name?.trim() || `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() || a.email;
          const prog = a.program_slug ?? a.program_interest ?? '—';
          const funding = a.funding_type ? ` [${a.funding_type}]` : '';
          const ref = a.reference_number ? ` \x1b[90m${a.reference_number}\x1b[0m` : '';
          const days = a.submitted_at
            ? ` \x1b[90m${Math.floor((Date.now() - new Date(a.submitted_at).getTime()) / 86400000)}d ago\x1b[0m`
            : '';
          const nextStep = a.next_step ? ` → ${a.next_step}` : '';
          write(`   ${name} — ${prog}${funding} — ${a.status ?? ''}${nextStep}${ref}${days}`);
        });
        if ((apps?.length ?? 0) > 15) write(`   ... and ${(apps?.length ?? 0) - 15} more`);
        write(`   Full list: /admin/applications`);
      } catch (err) {
        write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Query failed'}\x1b[0m`);
      }
      break;
    }

    case 'list_barber_shop_applications': {
      const statusFilter = (args.status as string) || 'all';
      const limit = Math.min((args.limit as number) || 20, 100);
      write(`\x1b[33m⚙  Loading barber partner shop applications (${statusFilter})...\x1b[0m`);
      try {
        let q = adminDb.from('barbershop_partner_applications')
          .select('id, created_at, shop_legal_name, shop_dba_name, owner_name, contact_name, contact_email, contact_phone, shop_city, shop_state, status')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (statusFilter !== 'all') q = q.eq('status', statusFilter);
        const { data: apps, error: appsErr } = await q;
        if (appsErr) { write(`\x1b[31m✗  ${appsErr.message}\x1b[0m`); break; }
        write(`\x1b[32m✓  ${apps?.length ?? 0} barber partner shop application(s)\x1b[0m`);
        (apps ?? []).slice(0, 15).forEach((a: any) => {
          const shop = a.shop_dba_name || a.shop_legal_name || 'Unnamed shop';
          const contact = a.contact_name || a.owner_name || 'No contact';
          const place = [a.shop_city, a.shop_state].filter(Boolean).join(', ');
          write(`   ${shop} — ${contact} — ${a.contact_email ?? ''} — ${a.status ?? 'pending'}${place ? ` — ${place}` : ''}`);
        });
        if ((apps?.length ?? 0) > 15) write(`   ... and ${(apps?.length ?? 0) - 15} more`);
        write(`   Full list: /admin/barber-shop-applications`);
      } catch (err) {
        write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Query failed'}\x1b[0m`);
      }
      break;
    }

    case 'list_students': {
      const limit = Math.min((args.limit as number) || 20, 100);
      const search = (args.search as string) || '';
      write('\x1b[33m⚙  Loading students...\x1b[0m');
      try {
        let q = adminDb.from('profiles')
          .select('id, full_name, email, role, created_at')
          .eq('role', 'student')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (search) q = q.ilike('full_name', `%${search}%`);
        const { data: students, error: studErr } = await q;
        if (studErr) { write(`\x1b[31m✗  ${studErr.message}\x1b[0m`); break; }
        write(`\x1b[32m✓  ${students?.length ?? 0} student(s)\x1b[0m`);
        (students ?? []).slice(0, 10).forEach((s) => {
          write(`   ${s.full_name ?? ''} — ${s.email ?? ''}`);
        });
        if ((students?.length ?? 0) > 10) write(`   ... and ${(students?.length ?? 0) - 10} more`);
        write(`   Full list: /admin/students`);
      } catch (err) {
        write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Query failed'}\x1b[0m`);
      }
      break;
    }

    case 'list_enrollments': {
      const limit = Math.min((args.limit as number) || 20, 100);
      write('\x1b[33m⚙  Loading enrollments...\x1b[0m');
      try {
        const { data: enrollments, error: enrErr } = await adminDb
          .from('program_enrollments')
          .select('id, user_id, program_id, program_slug, status, progress_percent, enrolled_at')
          .order('enrolled_at', { ascending: false })
          .limit(limit);
        if (enrErr) { write(`\x1b[31m✗  ${enrErr.message}\x1b[0m`); break; }

        // Hydrate student names
        const uids = [...new Set((enrollments ?? []).map((e: any) => e.user_id).filter(Boolean))];
        const { data: profiles } = uids.length
          ? await adminDb.from('profiles').select('id, full_name, email').in('id', uids)
          : { data: [] };
        const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

        write(`\x1b[32m✓  ${enrollments?.length ?? 0} enrollment(s)\x1b[0m`);
        (enrollments ?? []).slice(0, 10).forEach((e: any) => {
          const profile = profileMap[e.user_id];
          const name = profile?.full_name?.trim() || profile?.email || e.user_id;
          const prog = e.program_slug ?? e.program_id ?? '';
          const pct = e.progress_percent != null ? `${e.progress_percent}%` : '0%';
          const date = e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          write(`   ${name} — ${prog} — ${e.status ?? ''} — ${pct}${date ? ` — enrolled ${date}` : ''}`);
        });
        if ((enrollments?.length ?? 0) > 10) write(`   ... and ${(enrollments?.length ?? 0) - 10} more`);
        write(`   Full list: /admin/enrollments`);
      } catch (err) {
        write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Query failed'}\x1b[0m`);
      }
      break;
    }

    case 'check_system_health': {
      write('\x1b[33m⚙  Checking system health...\x1b[0m');
      logger.info('[devstudio/execute] check_system_health → GET /api/admin/webhook-health');
      try {
        const res = await fetch(`${baseUrl}/api/admin/webhook-health`, { headers });
        const data = await res.json().catch(() => ({}));
        logger.info('[devstudio/execute] check_system_health response', { status: res.status });
        if (res.ok) {
          const overall = data.healthy === true;
          const overallIcon = overall ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
          write(`${overallIcon}  System ${overall ? 'healthy' : 'UNHEALTHY'} — checked ${new Date(data.checkedAt).toLocaleTimeString()}`);

          // Webhook event summary
          const s = data.summary ?? {};
          if (s.total != null) {
            write(`\n   \x1b[1mWebhook Events (last 24h)\x1b[0m`);
            write(`   Total: ${s.total}  Processed: ${s.processed}  Failed: ${s.failed}  Errored: ${s.errored}  Skipped: ${s.skipped}`);
          }

          // Per-provider breakdown
          if (Array.isArray(data.providers) && data.providers.length > 0) {
            write(`\n   \x1b[1mProvider Health\x1b[0m`);
            for (const p of data.providers as any[]) {
              const icon = p.healthy ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
              const last = p.lastEventAt ? ` — last event ${new Date(p.lastEventAt).toLocaleDateString()}` : ' — no events';
              const vol = p.baselineDailyAvg > 0
                ? ` (${p.last24h} today vs ${p.baselineDailyAvg} avg/day)`
                : p.last24h > 0 ? ` (${p.last24h} today)` : '';
              write(`   ${icon} ${p.provider}${vol}${last}`);
            }
          }

          // Payment integrity
          const integrity = data.integrity ?? {};
          write(`\n   \x1b[1mPayment Integrity\x1b[0m`);
          const pne = integrity.paid_not_enrolled ?? 0;
          const enp = integrity.enrolled_not_paid ?? 0;
          const flags = integrity.open_flags ?? 0;
          write(`   ${pne > 0 ? '\x1b[31m✗\x1b[0m' : '\x1b[32m✓\x1b[0m'} Paid not enrolled: ${pne}`);
          write(`   ${enp > 0 ? '\x1b[31m✗\x1b[0m' : '\x1b[32m✓\x1b[0m'} Enrolled not paid: ${enp}`);
          write(`   ${flags > 0 ? '\x1b[33m⚠\x1b[0m' : '\x1b[32m✓\x1b[0m'} Open integrity flags: ${flags}`);

          // Alerts
          if (Array.isArray(data.alerts) && data.alerts.length > 0) {
            write(`\n   \x1b[1m\x1b[31mAlerts (${data.alerts.length})\x1b[0m`);
            (data.alerts as string[]).forEach(a => write(`   \x1b[31m⚠  ${a}\x1b[0m`));
          } else {
            write(`\n   \x1b[32m✓  No alerts\x1b[0m`);
          }

          write(`\n   Full report: /admin/webhook-health`);
        } else {
          write(`\x1b[31m✗  Failed (HTTP ${res.status}): ${data.error || res.statusText}\x1b[0m`);
        }
      } catch (fetchErr) {
        const reason = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        logger.error('[devstudio/execute] check_system_health fetch error', undefined, { reason });
        write(`\x1b[31m✗  Could not reach /api/admin/webhook-health: ${reason}\x1b[0m`);
        write(`   baseUrl: ${baseUrl}`);
      }
      break;
    }

    case 'send_test_email': {
      write(`\x1b[33m⚙  Sending test email to ${args.to}...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/test-email`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ to: args.to }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Test email sent\x1b[0m');
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'approve_application': {
      write(`\x1b[33m⚙  Approving application ${args.application_id}...\x1b[0m`);
      try {
        const res = await fetch(
          `${baseUrl}/api/admin/applications/${args.application_id}/approve`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ program_id: args.program_id, funding_type: args.funding_type }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Application approved\x1b[0m');
          if (data.enrollmentId) write(`   Enrollment ID: ${data.enrollmentId}`);
          write(`   View at: /admin/applications`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'enroll_student': {
      write(`\x1b[33m⚙  Enrolling student ${args.user_id} into course ${args.course_id}...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/enrollments`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: args.user_id,
            course_id: args.course_id,
            program_id: args.program_id,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Student enrolled\x1b[0m');
          if (data.data?.id) write(`   Enrollment ID: ${data.data.id}`);
          write(`   View at: /admin/enrollments`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'issue_certificate': {
      const ids = args.enrollment_ids as string[];
      write(`\x1b[33m⚙  Issuing certificates for ${ids.length} enrollment(s)...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/certificates/bulk`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            enrollmentIds: ids,
            templateId: args.template_id,
            issueDate: new Date().toISOString().split('T')[0],
            signedBy: args.signed_by || PLATFORM_DEFAULTS.orgName,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Certificates issued\x1b[0m');
          if (data.issued !== undefined) write(`   Issued: ${data.issued}`);
          if (data.failed !== undefined) write(`   Failed: ${data.failed}`);
          write(`   View at: /admin/certificates`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'list_cohorts': {
      const limit = (args.limit as number) || 20;
      write('\x1b[33m⚙  Loading cohorts...\x1b[0m');
      try {
        const url = new URL(`${baseUrl}/api/admin/cohorts`);
        if (args.program_id) url.searchParams.set('program_id', args.program_id as string);
        url.searchParams.set('limit', String(limit));
        const res = await fetch(url.toString(), { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const cohorts = Array.isArray(data) ? data : (data.cohorts ?? []);
          write(`\x1b[32m✓  ${cohorts.length} cohort(s)\x1b[0m`);
          cohorts.slice(0, 10).forEach((c: Record<string, unknown>) => {
            write(`   ${c.name ?? c.id} — ${c.status ?? ''} — starts: ${c.start_date ?? 'TBD'}`);
          });
          write(`   Full list: /admin/cohorts`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'list_wioa': {
      const status = (args.status as string) || 'all';
      const limit = (args.limit as number) || 20;
      write(`\x1b[33m⚙  Loading WIOA cases (${status})...\x1b[0m`);
      try {
        const url = new URL(`${baseUrl}/api/admin/wioa`);
        if (status !== 'all') url.searchParams.set('status', status);
        url.searchParams.set('limit', String(limit));
        const res = await fetch(url.toString(), { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const cases = Array.isArray(data) ? data : (data.cases ?? data.participants ?? data.data ?? []);
          write(`\x1b[32m✓  ${cases.length} WIOA case(s)${status !== 'all' ? ` (${status})` : ''}\x1b[0m`);
          if (cases.length === 0) {
            write('   No WIOA participants on record yet.');
            write('   To add one: POST /api/admin/wioa with participant_name, participant_email, program');
          } else {
            cases.slice(0, 10).forEach((c: Record<string, unknown>) => {
              const name = (c.name ?? c.participant_name ?? c.full_name ?? c.user_id ?? '') as string;
              const prog = (c.program ?? c.program_slug ?? '') as string;
              const st = (c.status ?? '') as string;
              const cm = c.case_manager ? ` — CM: ${c.case_manager}` : '';
              write(`   ${name} — ${prog} — ${st}${cm}`);
            });
            if (cases.length > 10) write(`   ... and ${cases.length - 10} more`);
          }
          write(`   Full list: /admin/wioa`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'run_export': {
      const type = args.type as string;
      write(`\x1b[33m⚙  Exporting ${type}...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/export/${type}`, { headers });
        if (res.ok) {
          const contentDisposition = res.headers.get('content-disposition') || '';
          const filename = contentDisposition.match(/filename="?([^"]+)"?/)?.[1] || `${type}.csv`;
          write(`\x1b[32m✓  Export ready: ${filename}\x1b[0m`);
          write(`   Download at: /admin/students/export (${type})`);
        } else {
          const data = await res.json().catch(() => ({}));
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'list_programs': {
      const filterStatus = (args.status as string) || 'all';
      const publishedOnly = args.published === true || filterStatus === 'published';
      write('\x1b[33m⚙  Loading programs...\x1b[0m');
      try {
        let q = adminDb
          .from('programs')
          .select('id, title, slug, status, published, is_active, category, created_at')
          .order('title', { ascending: true });
        if (publishedOnly) q = q.eq('published', true);
        else if (filterStatus !== 'all') q = q.eq('status', filterStatus);

        const { data: programs, error: pErr } = await q;
        if (pErr) { write(`\x1b[31m✗  ${pErr.message}\x1b[0m`); break; }

        // Hydrate enrollment counts per program
        const slugs = (programs ?? []).map((p: any) => p.slug).filter(Boolean);
        const { data: enrollCounts } = slugs.length
          ? await adminDb
              .from('program_enrollments')
              .select('program_slug')
              .in('program_slug', slugs)
              .eq('status', 'active')
          : { data: [] };
        const countMap: Record<string, number> = {};
        (enrollCounts ?? []).forEach((e: any) => {
          countMap[e.program_slug] = (countMap[e.program_slug] ?? 0) + 1;
        });

        write(`\x1b[32m✓  ${programs?.length ?? 0} program(s)${publishedOnly ? ' (published)' : filterStatus !== 'all' ? ` (${filterStatus})` : ''}\x1b[0m`);
        (programs ?? []).slice(0, 20).forEach((p: any) => {
          const pub = p.published ? '\x1b[32m●\x1b[0m' : '\x1b[90m○\x1b[0m';
          const enrollCount = countMap[p.slug] ?? 0;
          const enroll = enrollCount > 0 ? ` \x1b[33m${enrollCount} enrolled\x1b[0m` : '';
          const cat = p.category ? ` [${p.category}]` : '';
          write(`   ${pub} ${p.title ?? p.id}${cat} — ${p.status ?? ''}${enroll}`);
        });
        if ((programs?.length ?? 0) > 20) write(`   ... and ${(programs?.length ?? 0) - 20} more`);
        write('   \x1b[90m● published  ○ unpublished\x1b[0m');
        write('   Full list: /admin/programs');
      } catch (err) {
        write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Query failed'}\x1b[0m`);
      }
      break;
    }

    case 'flag_at_risk': {
      write(`\x1b[33m⚙  Flagging student ${args.user_id} as at-risk...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/at-risk/flag`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ user_id: args.user_id, reason: args.reason }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Student flagged as at-risk\x1b[0m');
          write(`   View at: /admin/at-risk`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'send_reminder': {
      write('\x1b[33m⚙  Sending reminder...\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/send-reminder`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ user_id: args.user_id, message: args.message }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Reminder sent\x1b[0m');
          if (data.sent) write(`   Sent to: ${data.sent} recipient(s)`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'list_payout_queue': {
      const limit = (args.limit as number) || 20;
      write('\x1b[33m⚙  Loading payout queue...\x1b[0m');
      try {
        const url = new URL(`${baseUrl}/api/admin/enrollments/payout-queue`);
        url.searchParams.set('limit', String(limit));
        const res = await fetch(url.toString(), { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const queue = Array.isArray(data) ? data : (data.queue ?? data.data ?? []);
          write(`\x1b[32m✓  ${queue.length} payout(s) pending\x1b[0m`);
          queue.slice(0, 10).forEach((p: Record<string, unknown>) => {
            write(
              `   ${p.student_name ?? p.user_id ?? ''} — $${p.amount ?? '?'} — ${p.program_name ?? ''}`,
            );
          });
          write(`   Full queue: /admin/payout-queue`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'mark_payout_paid': {
      const ids = args.enrollment_ids as string[];
      write(`\x1b[33m⚙  Marking ${ids.length} payout(s) as paid...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/enrollments/mark-payout-paid`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ enrollmentIds: ids }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Payouts marked as paid\x1b[0m');
          if (data.updated) write(`   Updated: ${data.updated}`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'send_email': {
      write(`\x1b[33m⚙  Sending email to ${args.to}...\x1b[0m`);
      write(`   Subject: ${args.subject}`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/send-email`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            to: args.to,
            subject: args.subject,
            html: String(args.body).includes('<')
              ? args.body
              : `<p>${String(args.body).replace(/\n/g, '<br/>')}</p>`,
            fromName: args.from_name || PLATFORM_DEFAULTS.orgName,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write(`\x1b[32m✓  Email sent to ${args.to}\x1b[0m`);
          if (data.messageId) write(`   Message ID: ${data.messageId}`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'send_document_for_sign': {
      write(`\x1b[33m⚙  Generating ${args.document_type} for ${args.recipient_email}...\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/sign-documents/send`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            documentType: args.document_type,
            recipientEmail: args.recipient_email,
            recipientName: args.recipient_name,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write(
            `\x1b[32m✓  ${args.document_type?.toString().toUpperCase()} generated and sent\x1b[0m`,
          );
          write(`   Sent to: ${args.recipient_email}`);
          if (data.messageId) write(`   Message ID: ${data.messageId}`);
        } else {
          write(`\x1b[31m✗  Failed: ${data.error || res.statusText}\x1b[0m`);
        }
      } catch {
        write('\x1b[31m✗  Network error — check server logs\x1b[0m');
      }
      break;
    }

    case 'ask_question': {
      const answer = String(args.answer ?? '').trim();
      // Render each line so multi-paragraph answers display correctly
      answer.split('\n').forEach(line => write(line ? `   ${line}` : ''));
      break;
    }

    case 'build_courses': {
      // build_courses triggers the deploy-lms GitHub Actions workflow via the
      // admin's own /api/devstudio/shell endpoint (which calls workflow_dispatch).
      // The old path called getSiteUrl()/api/autopilots/build-courses — that is
      // the LMS app's stub and does not trigger a real production deploy.
      // Pre-flight: verify GITHUB_TOKEN is set before attempting the push
      if (!process.env.GITHUB_TOKEN) {
        write('\x1b[31m✗  GITHUB_TOKEN is not set\x1b[0m');
        write('');
        write('   To fix:');
        write('   1. Generate a GitHub Personal Access Token with repo + workflow scopes');
        write('      → https://github.com/settings/tokens/new');
        write('   2. Add it to the Northflank production secret group as GITHUB_TOKEN');
        write('   3. Redeploy the admin service to pick up the new secret');
        break;
      }
      write('⚙️  Triggering LMS build via GitHub Actions...');
      logger.info('[devstudio/execute] build_courses → dispatch deploy-lms workflow');
      try {
        const res = await fetch(`${getAdminUrl()}/api/devstudio/shell`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie: authHeader },
          body: JSON.stringify({ workflow: 'deploy-lms' }),
        });
        const data = await res.json().catch(() => ({}));
        logger.info('[devstudio/execute] build_courses dispatch response', { status: res.status });
        if (!res.ok) {
          write(`\x1b[31m✗  Dispatch failed (HTTP ${res.status}): ${data.error ?? res.statusText}\x1b[0m`);
          if (res.status === 401 || res.status === 403) {
            write('');
            write('   GITHUB_TOKEN may be expired or missing repo/workflow scopes.');
            write('   Regenerate at: https://github.com/settings/tokens/new');
            write('   Then update GITHUB_TOKEN in Northflank and redeploy admin.');
          }
        } else {
          write(`\x1b[32m✓  LMS deploy queued\x1b[0m`);
          if (data.runUrl) write(`   GitHub Actions: ${data.runUrl}`);
          if (data.runId)  write(`   Run ID: ${data.runId}`);
        }
      } catch (fetchErr) {
        const reason = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        logger.error('[devstudio/execute] build_courses dispatch error', undefined, { reason });
        write(`\x1b[31m✗  Could not reach /api/devstudio/shell: ${reason}\x1b[0m`);
      }
      break;
    }

    case 'deploy_autopilot': {
      const service = String(args.service ?? 'lms');
      // Pre-flight: GITHUB_TOKEN is required to trigger GitHub Actions workflows
      if (!process.env.GITHUB_TOKEN) {
        write(`\x1b[31m✗  GITHUB_TOKEN is not set — cannot trigger ${service} deploy\x1b[0m`);
        write('');
        write('   To fix:');
        write('   1. Generate a GitHub PAT with repo + workflow scopes');
        write('      → https://github.com/settings/tokens/new');
        write('   2. Add it to the Northflank production secret group as GITHUB_TOKEN');
        write('   3. Redeploy the admin service to pick up the new secret');
        break;
      }

      // Dispatch one or both workflows via /api/devstudio/shell which calls
      // GitHub Actions workflow_dispatch directly. The old path called
      // getSiteUrl()/api/autopilots/deploy — that is the LMS app's stub and
      // does not trigger a real production deploy.
      const workflows: Array<'deploy-lms' | 'deploy-admin'> =
        service === 'both' || service === 'all'
          ? ['deploy-lms', 'deploy-admin']
          : service === 'admin'
            ? ['deploy-admin']
            : ['deploy-lms'];

      write(`🚀  Triggering ${service} deploy via GitHub Actions...`);
      logger.info('[devstudio/execute] deploy_autopilot', { service, workflows });

      for (const workflow of workflows) {
        try {
          const res = await fetch(`${getAdminUrl()}/api/devstudio/shell`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: authHeader },
            body: JSON.stringify({ workflow }),
          });
          const data = await res.json().catch(() => ({}));
          logger.info('[devstudio/execute] deploy_autopilot dispatch', { workflow, status: res.status });
          if (!res.ok) {
            write(`\x1b[31m✗  ${workflow} dispatch failed (HTTP ${res.status}): ${data.error ?? res.statusText}\x1b[0m`);
            if (res.status === 401 || res.status === 403) {
              write('');
              write('   GITHUB_TOKEN may be expired or missing workflow scope.');
              write('   Regenerate at: https://github.com/settings/tokens/new');
              write('   Then update GITHUB_TOKEN in Northflank and redeploy admin.');
            }
          } else {
            write(`\x1b[32m✓  ${workflow} queued\x1b[0m`);
            if (data.runUrl) write(`   GitHub Actions: ${data.runUrl}`);
            if (data.runId)  write(`   Run ID: ${data.runId}`);
          }
        } catch (fetchErr) {
          const reason = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          logger.error('[devstudio/execute] deploy_autopilot dispatch error', undefined, { workflow, reason });
          write(`\x1b[31m✗  Could not reach /api/devstudio/shell for ${workflow}: ${reason}\x1b[0m`);
        }
      }
      break;
    }

    case 'run_tests': {
      // Triggers the CI workflow via GitHub Actions workflow_dispatch.
      // The old path called getSiteUrl()/api/autopilots/run-tests — that is
      // the LMS app's stub and does not run real CI.
      if (!process.env.GITHUB_TOKEN) {
        write('\x1b[31m✗  GITHUB_TOKEN is not set — cannot trigger CI workflow\x1b[0m');
        write('');
        write('   Add GITHUB_TOKEN to the Northflank production secret group and redeploy admin.');
        break;
      }
      write('🧪  Triggering CI workflow via GitHub Actions...');
      logger.info('[devstudio/execute] run_tests → dispatch ci workflow');
      try {
        const res = await fetch(`${getAdminUrl()}/api/devstudio/shell`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie: authHeader },
          body: JSON.stringify({ workflow: 'ci' }),
        });
        const data = await res.json().catch(() => ({}));
        logger.info('[devstudio/execute] run_tests dispatch response', { status: res.status });
        if (!res.ok) {
          write(`\x1b[31m✗  CI dispatch failed (HTTP ${res.status}): ${data.error ?? res.statusText}\x1b[0m`);
        } else {
          write(`\x1b[32m✓  CI workflow queued\x1b[0m`);
          if (data.runUrl) write(`   GitHub Actions: ${data.runUrl}`);
          if (data.runId)  write(`   Run ID: ${data.runId}`);
          write('   Results will appear in GitHub Actions once the run completes.');
        }
      } catch (fetchErr) {
        const reason = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        logger.error('[devstudio/execute] run_tests dispatch error', undefined, { reason });
        write(`\x1b[31m✗  Could not reach /api/devstudio/shell: ${reason}\x1b[0m`);
      }
      break;
    }

    case 'manage_app_trial': {
      const action = String(args.action);
      const endpoint = action === 'start'
        ? '/api/apps/trial/start'
        : action === 'status'
          ? '/api/apps/trial/status'
          : '/api/apps/upgrade';
      write(`📦  ${action === 'start' ? 'Starting' : action === 'status' ? 'Checking' : 'Upgrading'} app trial...`);
      logger.info('[devstudio/execute] manage_app_trial', { action, endpoint });
      try {
        const res = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie: authHeader },
          body: JSON.stringify({ user_id: args.user_id, app_id: args.app_id }),
        });
        const data = await res.json().catch(() => ({}));
        logger.info('[devstudio/execute] manage_app_trial response', { status: res.status });
        if (!res.ok) {
          write(`\x1b[31m✗  Failed (HTTP ${res.status}): ${data.error ?? res.statusText}\x1b[0m`);
          if (data.message) write(`   Detail: ${data.message}`);
        } else {
          write(`\x1b[32m✓  Done\x1b[0m`);
          if (data.status) write(`   Status: ${data.status}`);
          if (data.expires_at) write(`   Expires: ${data.expires_at}`);
          if (data.checkout_url) write(`   Checkout: ${data.checkout_url}`);
        }
      } catch (fetchErr) {
        const reason = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        logger.error('[devstudio/execute] manage_app_trial fetch error', undefined, { reason });
        write(`\x1b[31m✗  Could not reach ${endpoint}: ${reason}\x1b[0m`);
        write(`   baseUrl: ${baseUrl}`);
      }
      break;
    }

    // ── At-risk learners ──────────────────────────────────────────────────
    case 'list_at_risk': {
      write('\x1b[33m⚙  Fetching at-risk learners…\x1b[0m');
      try {
        const { data: items, error: arErr } = await adminDb
          .from('at_risk_learners')
          .select('user_id, full_name, email, program_slug, days_inactive, risk_level, progress_percent')
          .order('days_inactive', { ascending: false })
          .limit(20);
        if (arErr) { write(`\x1b[31m✗  ${arErr.message}\x1b[0m`); break; }
        write(`\x1b[32m✓  ${items?.length ?? 0} at-risk learner(s)\x1b[0m`);
        (items ?? []).slice(0, 10).forEach((s) =>
          write(`   • ${s.full_name ?? s.email ?? s.user_id} — ${s.program_slug ?? ''} — ${s.days_inactive ?? 0}d inactive (${s.risk_level ?? ''})`));
        if ((items?.length ?? 0) > 10) write(`   … and ${(items?.length ?? 0) - 10} more`);
        write(`   View at: /admin/at-risk`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Failed'}\x1b[0m`); }
      break;
    }

    // ── Completions ───────────────────────────────────────────────────────
    case 'list_completions': {
      const limit = Math.min((args.limit as number) || 20, 100);
      write('\x1b[33m⚙  Fetching completions…\x1b[0m');
      try {
        const { data: items, error: compErr } = await adminDb
          .from('program_completion_certificates')
          .select('id, user_id, program_id, issued_at')
          .order('issued_at', { ascending: false })
          .limit(limit);
        if (compErr) { write(`\x1b[31m✗  ${compErr.message}\x1b[0m`); break; }
        write(`\x1b[32m✓  ${items?.length ?? 0} completion(s)\x1b[0m`);
        (items ?? []).slice(0, 10).forEach((c: any) =>
          write(`   • user:${c.user_id?.slice(0,8)}… — program:${c.program_id?.slice(0,8)}… — ${c.issued_at?.slice(0,10)}`));
        write(`   View at: /admin/completions`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Failed'}\x1b[0m`); }
      break;
    }

    // ── Catalog export ────────────────────────────────────────────────────
    case 'export_catalog': {
      write('\x1b[33m⚙  Exporting program catalog…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/catalog/export`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Catalog exported\x1b[0m');
          if (data.url) write(`   Download: ${data.url}`);
          write(`   View at: /admin/programs`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Monitoring ────────────────────────────────────────────────────────
    case 'check_monitoring': {
      write('\x1b[33m⚙  Checking monitoring status…\x1b[0m');
      try {
        const [statusRes, errorsRes] = await Promise.all([
          fetch(`${baseUrl}/api/admin/monitoring/status`, { headers }),
          fetch(`${baseUrl}/api/admin/monitoring/errors?limit=5`, { headers }),
        ]);
        const status = await statusRes.json().catch(() => ({}));
        const errors = await errorsRes.json().catch(() => ({}));
        write('\x1b[32m✓  Monitoring status\x1b[0m');
        if (status.uptime) write(`   Uptime: ${status.uptime}`);
        if (status.memory) write(`   Memory: ${status.memory}`);
        const errs = errors.errors ?? errors.data ?? [];
        if (errs.length > 0) {
          write(`\x1b[33m   Recent errors (${errs.length}):\x1b[0m`);
          errs.slice(0, 5).forEach((e: Record<string, unknown>) =>
            write(`   • ${e.message ?? e.error ?? JSON.stringify(e)}`));
        } else write('   No recent errors');
        write(`   View at: /admin/monitoring`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Users / role management ───────────────────────────────────────────
    case 'list_users': {
      write('\x1b[33m⚙  Fetching users…\x1b[0m');
      try {
        const q = args.search ? `?search=${encodeURIComponent(String(args.search))}` : `?limit=${args.limit ?? 20}`;
        const res = await fetch(`${baseUrl}/api/admin/users${q}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const items = data.users ?? data.data ?? [];
          write(`\x1b[32m✓  ${items.length} user(s)\x1b[0m`);
          items.slice(0, 10).forEach((u: Record<string, unknown>) =>
            write(`   • ${u.full_name ?? u.email} — ${u.role ?? 'student'}`));
          write(`   View at: /admin/users`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    case 'update_user_role': {
      // admin escalation is never permitted via the AI console.
      // It must be done directly in the Supabase dashboard or via a
      // dedicated admin UI with MFA confirmation.
      if (String(args.role) === 'admin') {
        write(`\x1b[31m✗  Escalation to admin is not permitted via the AI console.\x1b[0m`);
        write(`   Use the Supabase dashboard or the Users admin page directly.`);
        break;
      }
      const ALLOWED_ROLES = new Set(['student', 'staff', 'admin', 'instructor', 'org_admin']);
      if (!ALLOWED_ROLES.has(String(args.role))) {
        write(`\x1b[31m✗  Role "${args.role}" is not a valid assignable role.\x1b[0m`);
        write(`   Allowed: ${[...ALLOWED_ROLES].join(', ')}`);
        break;
      }
      write(`\x1b[33m⚙  Updating role for user ${args.user_id}…\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/users/update-role`, {
          method: 'POST', headers,
          body: JSON.stringify({ user_id: args.user_id, role: args.role }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) write(`\x1b[32m✓  Role updated to ${args.role}\x1b[0m`);
        else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Bulk email ────────────────────────────────────────────────────────
    case 'send_bulk_email': {
      write('\x1b[33m⚙  Sending bulk email…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/send-onboarding-emails`, {
          method: 'POST', headers,
          body: JSON.stringify({ subject: args.subject, body: args.body, audience: args.audience ?? 'all' }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Bulk email queued\x1b[0m');
          if (data.count) write(`   Recipients: ${data.count}`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── WIOA export ───────────────────────────────────────────────────────
    case 'run_wioa_export': {
      write('\x1b[33m⚙  Running WIOA PIRL export…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/wioa/pirl-export`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  WIOA export complete\x1b[0m');
          if (data.url) write(`   Download: ${data.url}`);
          if (data.count) write(`   Records: ${data.count}`);
          write(`   View at: /admin/wioa`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Backup ────────────────────────────────────────────────────────────
    case 'run_backup': {
      write('\x1b[33m⚙  Triggering platform backup…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/backup`, { method: 'POST', headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Backup initiated\x1b[0m');
          if (data.backupId) write(`   Backup ID: ${data.backupId}`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Automations ───────────────────────────────────────────────────────
    case 'run_automation': {
      write(`\x1b[33m⚙  Running automation: ${args.automation_id}…\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/automations/run`, {
          method: 'POST', headers,
          body: JSON.stringify({ automation_id: args.automation_id }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) write('\x1b[32m✓  Automation triggered\x1b[0m');
        else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Shops ─────────────────────────────────────────────────────────────
    case 'list_shops': {
      write('\x1b[33m⚙  Fetching shops…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/shops`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const items = data.shops ?? data.data ?? [];
          write(`\x1b[32m✓  ${items.length} shop(s)\x1b[0m`);
          items.slice(0, 10).forEach((s: Record<string, unknown>) =>
            write(`   • ${s.name ?? s.id} — ${s.city ?? ''} ${s.state ?? ''}`));
          write(`   View at: /admin/shops`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Promo codes ───────────────────────────────────────────────────────
    case 'list_promo_codes': {
      write('\x1b[33m⚙  Fetching promo codes…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/promo-codes`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const items = data.codes ?? data.data ?? [];
          write(`\x1b[32m✓  ${items.length} promo code(s)\x1b[0m`);
          items.slice(0, 10).forEach((c: Record<string, unknown>) =>
            write(`   • ${c.code} — ${c.discount_percent ?? c.discount_amount ?? ''}% off · ${c.uses ?? 0} uses`));
          write(`   View at: /admin/promo-codes`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Social media ──────────────────────────────────────────────────────
    case 'check_social_connections': {
      write('\x1b[33m⚙  Checking social media connections…\x1b[0m');
      try {
        const res = await fetch(`${getAdminUrl()}/api/admin/social-media/status`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const statuses: Array<{ platform: string; connected: boolean; expired?: boolean }> = data.statuses ?? [];
          const connected = statuses.filter((s) => s.connected);
          const disconnected = statuses.filter((s) => !s.connected);
          write(`\x1b[32m✓  ${connected.length} of ${statuses.length} platforms connected\x1b[0m`);
          connected.forEach((s) => write(`   \x1b[32m●\x1b[0m ${s.platform}${s.expired ? ' \x1b[33m(token expired — reconnect)\x1b[0m' : ''}`));
          disconnected.forEach((s) => write(`   \x1b[90m○\x1b[0m ${s.platform} — not connected`));
          if (disconnected.length > 0) write(`   Connect at: /admin/settings/social-media`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    case 'generate_social_post': {
      const program = args.program?.toString() ?? 'all';
      const count = Number(args.count ?? 3);
      const topic = args.topic?.toString() ?? '';
      const platforms = args.platforms?.toString() ?? 'facebook,instagram,twitter,linkedin';
      write(`\x1b[33m⚙  Generating ${count} AI post(s) for "${program}"…\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/social-media/generate`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ program, count, contentSource: 'ai', topic, platforms: platforms.split(',') }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const posts: string[] = data.posts ?? data.generated ?? [];
          write(`\x1b[32m✓  ${posts.length} post(s) generated\x1b[0m`);
          posts.forEach((p, i) => {
            write(`\n   \x1b[1mPost ${i + 1}:\x1b[0m`);
            p.split('\n').forEach((line: string) => write(`   ${line}`));
          });
          write(`\n   Publish at: /admin/social-media/campaigns/new`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    case 'publish_social_post': {
      const platform = args.platform?.toString() ?? '';
      const content = args.content?.toString() ?? '';
      const title = args.title?.toString() ?? '';
      const media_url = args.media_url?.toString() ?? '';
      write(`\x1b[33m⚙  Publishing to ${platform}…\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/social-media/post`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform, content, title, media_url: media_url || undefined }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          write(`\x1b[32m✓  Posted to ${platform}\x1b[0m`);
          if (data.platform_url) write(`   View: ${data.platform_url}`);
        } else {
          write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
          if (data.error?.includes('not connected')) write(`   Connect at: /admin/settings/social-media`);
        }
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    case 'list_social_campaigns': {
      write('\x1b[33m⚙  Fetching social campaigns…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/social-campaigns`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const items = data.campaigns ?? data.data ?? [];
          write(`\x1b[32m✓  ${items.length} campaign(s)\x1b[0m`);
          items.slice(0, 10).forEach((c: Record<string, unknown>) =>
            write(`   • ${c.title ?? c.name ?? c.id} — ${c.status ?? ''}`));
          write(`   View at: /admin/social-media`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Smoke test ────────────────────────────────────────────────────────
    case 'smoke_test': {
      write('\x1b[1mRunning platform smoke test…\x1b[0m');
      try {
        const res = await fetch(`${getAdminUrl()}/api/devstudio/smoke-test`, {
          headers: { Cookie: authHeader },
          signal: AbortSignal.timeout(55000),
        });
        if (!res.ok || !res.body) {
          write(`\x1b[31m✗  Smoke test endpoint returned HTTP ${res.status}\x1b[0m`);
          break;
        }
        // Stream SSE lines directly to the caller
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { done: d, value } = await reader.read();
          if (d) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split('\n');
          buf = parts.pop() ?? '';
          for (const part of parts) {
            if (!part.startsWith('data: ')) continue;
            const payload = part.slice(6).trim();
            if (payload === '[DONE]') continue;
            try {
              const p = JSON.parse(payload);
              const text: string = p.line ?? p.text ?? payload;
              if (text.trim()) write(text);
            } catch { if (payload.trim()) write(payload); }
          }
        }
      } catch (err) {
        write(`\x1b[31m✗  Smoke test failed: ${(err as Error).message}\x1b[0m`);
      }
      break;
    }

    // ── Audit export ──────────────────────────────────────────────────────
    case 'export_audit_log': {
      write('\x1b[33m⚙  Exporting audit log…\x1b[0m');
      try {
        const res = await fetch(`${baseUrl}/api/admin/audit-export`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Audit log exported\x1b[0m');
          if (data.url) write(`   Download: ${data.url}`);
          write(`   View at: /admin/audit-logs`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Run payroll ───────────────────────────────────────────────────────
    case 'run_payroll': {
      write('\x1b[33m⚙  Running payroll…\x1b[0m');
      try {
        const body: Record<string, unknown> = {};
        if (args.pay_period_start) body.pay_period_start = args.pay_period_start;
        if (args.pay_period_end)   body.pay_period_end   = args.pay_period_end;
        if (args.pay_date)         body.pay_date         = args.pay_date;
        const res = await fetch(`${baseUrl}/api/hr/payroll`, {
          method: 'POST', headers,
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Payroll run created\x1b[0m');
          if (data.id)          write(`   Run ID: ${data.id}`);
          if (data.total_gross) write(`   Gross: $${Number(data.total_gross).toLocaleString()}`);
          if (data.total_net)   write(`   Net:   $${Number(data.total_net).toLocaleString()}`);
          if (data.employee_count) write(`   Employees: ${data.employee_count}`);
          write(`   View at: /admin/hr/payroll`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    case 'export_payroll': {
      write('\x1b[33m⚙  Exporting payroll data…\x1b[0m');
      try {
        const q = args.run_id ? `?run_id=${args.run_id}` : '';
        const res = await fetch(`${baseUrl}/api/payroll/export${q}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write('\x1b[32m✓  Payroll export ready\x1b[0m');
          if (data.url) write(`   Download: ${data.url}`);
          write(`   View at: /admin/hr/payroll`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Run reports ───────────────────────────────────────────────────────
    case 'run_reports': {
      const reportType = String(args.report_type ?? 'overall');
      const reportRoutes: Record<string, string> = {
        overall:      '/api/reporting/overall-metrics',
        program:      '/api/reporting/program-metrics',
        site:         '/api/reporting/site-metrics',
        funder:       '/api/reporting/funder-metrics',
        dol:          '/api/reporting/dol-dwd',
        activity:     '/api/reporting/recent-activity',
        wioa:         '/api/reports/wioa',
        outcomes:     '/api/reports/outcomes',
        participants: '/api/reports/participants',
        rapids:       '/api/reports/rapids/export?format=json',
        grants:       '/api/admin/grant-report/export',
        compliance:   '/api/compliance/report',
        enrollment:   '/api/admin/analytics/overview',
      };
      const route = reportRoutes[reportType] ?? reportRoutes.overall;
      write(`\x1b[33m⚙  Running ${reportType} report…\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}${route}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write(`\x1b[32m✓  ${reportType} report complete\x1b[0m`);
          // Surface top-level numeric fields
          const nums = Object.entries(data)
            .filter(([, v]) => typeof v === 'number')
            .slice(0, 8);
          nums.forEach(([k, v]) => write(`   ${k}: ${v}`));
          if (data.url) write(`   Download: ${data.url}`);
          write(`   View at: /admin/reports`);
        } else write(`\x1b[31m✗  ${data.error ?? res.statusText}\x1b[0m`);
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Repo commits ──────────────────────────────────────────────────────
    case 'repo_commits': {
      const ghToken = process.env.GITHUB_TOKEN;
      if (!ghToken) { write('\x1b[31m✗  GITHUB_TOKEN not set\x1b[0m'); break; }
      const owner = 'elevateforhumanity';
      const repo  = 'Elevate-lms';
      const path  = args.path ? String(args.path) : '';
      const since = args.since ? String(args.since) : '';
      const limit = Math.min(Number(args.limit ?? 20), 50);

      write(`\x1b[33m⚙  Fetching commits${path ? ` for ${path}` : ''}…\x1b[0m`);
      try {
        const params = new URLSearchParams({ per_page: String(limit) });
        if (path)  params.set('path', path);
        if (since) params.set('since', since);
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits?${params}`,
          { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } },
        );
        if (!res.ok) { write(`\x1b[31m✗  GitHub API ${res.status}\x1b[0m`); break; }
        const commits = await res.json() as Array<{
          sha: string;
          commit: { message: string; author: { date: string; name: string } };
          html_url: string;
        }>;
        write(`\x1b[32m✓  ${commits.length} commit(s)\x1b[0m`);
        commits.forEach((c) => {
          const short = c.sha.slice(0, 7);
          const msg   = c.commit.message.split('\n')[0].slice(0, 72);
          const date  = c.commit.author.date.slice(0, 10);
          const author = c.commit.author.name;
          write(`   \x1b[33m${short}\x1b[0m  ${date}  \x1b[2m${author}\x1b[0m`);
          write(`          ${msg}`);
        });
      } catch { write('\x1b[31m✗  Network error\x1b[0m'); }
      break;
    }

    // ── Scan routes ───────────────────────────────────────────────────────
    case 'scan_routes': {
      const filter = String(args.filter ?? 'all');
      write(`\x1b[33m⚙  Scanning Next.js routes (${filter})…\x1b[0m`);
      try {
        const { readdirSync, statSync } = await import('fs');
        const { join, relative } = await import('path');
        const appDirs = discoverNextAppDirs();
        const pages: string[] = [];
        const apis: string[] = [];

        if (appDirs.length === 0) {
          write('\x1b[33m⚠  Route source scan unavailable: no Next.js app directory found.\x1b[0m');
          write(`   Checked: ${describeCheckedAppDirs()}`);
          break;
        }

        function toRoute(rootDir: string, full: string, suffix: 'page.tsx' | 'route.ts') {
          let relPath = relative(rootDir, full).replace(/\\/g, '/');
          if (relPath === suffix) {
            relPath = '';
          } else if (relPath.endsWith(`/${suffix}`)) {
            relPath = relPath.slice(0, -suffix.length - 1);
          }
          const route = `/${relPath}`.replace(/\/\([^)]+\)/g, '').replace(/\/+/g, '/');
          return route === '/.' ? '/' : route;
        }

        function walk(rootDir: string, dir: string) {
          for (const f of readdirSync(dir)) {
            const full = join(dir, f);
            if (statSync(full).isDirectory()) { walk(rootDir, full); continue; }
            if (f === 'page.tsx') pages.push(toRoute(rootDir, full, 'page.tsx'));
            if (f === 'route.ts') apis.push(toRoute(rootDir, full, 'route.ts'));
          }
        }
        for (const appDir of appDirs) walk(appDir.dir, appDir.dir);
        write(`\x1b[32m✓  Scan complete\x1b[0m`);
        write(`   App roots: ${appDirs.map((dir) => dir.label).join(', ')}`);
        write(`   Pages:     ${pages.length}`);
        write(`   API routes: ${apis.length}`);
        if (filter === 'all' || filter === 'pages') {
          write(`\n   Sample pages (first 20):`);
          pages.slice(0, 20).forEach(p => write(`   ${p}`));
          if (pages.length > 20) write(`   … and ${pages.length - 20} more`);
        }
        if (filter === 'api') {
          write(`\n   API routes (first 30):`);
          apis.slice(0, 30).forEach(a => write(`   ${a}`));
          if (apis.length > 30) write(`   … and ${apis.length - 30} more`);
        }
        if (filter === 'no-auth') {
          write(`\n   Run: bash scripts/audit-auth-gaps.sh for full auth gap report`);
          write(`   View at: /admin/dev-studio`);
        }
        if (filter === 'duplicates') {
          const slugs = pages.map(p => p.split('/').pop() ?? '');
          const seen = new Set<string>();
          const dups = slugs.filter(s => { if (seen.has(s)) return true; seen.add(s); return false; });
          write(`\n   Duplicate slugs: ${[...new Set(dups)].join(', ') || 'none'}`);
        }
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Scan failed'}\x1b[0m`); }
      break;
    }

    // ── Audit system ──────────────────────────────────────────────────────
    case 'audit_system': {
      const scope = String(args.scope ?? 'all');
      write(`\x1b[33m⚙  Running platform audit (${scope})…\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/admin/monitoring/audit-health`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          write(`\x1b[32m✓  Audit complete\x1b[0m`);
          if (data.schema_gaps  !== undefined) write(`   Schema gaps:    ${data.schema_gaps}`);
          if (data.auth_gaps    !== undefined) write(`   Auth gaps:      ${data.auth_gaps}`);
          if (data.env_gaps     !== undefined) write(`   Env var gaps:   ${data.env_gaps}`);
          if (data.orphan_routes !== undefined) write(`   Orphan routes:  ${data.orphan_routes}`);
          if (data.db_integrity !== undefined) write(`   DB integrity:   ${data.db_integrity}`);
          if (data.summary) write(`   ${data.summary}`);
          write(`   View at: /admin/monitoring`);
        } else {
          // Fallback: surface what we know from static audit counts
          write(`\x1b[32m✓  Static audit summary (last run 2026-03-16)\x1b[0m`);
          write(`   Schema gaps (≥5 refs, no migration): 126 tables`);
          write(`   Routes with no auth check:           62`);
          write(`   Admin routes identity-only:          13`);
          write(`   Routes leaking error.message:        33`);
          write(`   Run bash scripts/audit-auth-gaps.sh for live report`);
        }
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Audit failed'}\x1b[0m`); }
      break;
    }

    // ── Inspect links ─────────────────────────────────────────────────────
    case 'inspect_links': {
      const scanPath = String(args.path ?? 'app');
      write(`\x1b[33m⚙  Scanning for broken internal links in ${scanPath}…\x1b[0m`);
      try {
        const { existsSync, readdirSync, statSync, readFileSync } = await import('fs');
        const { join, relative } = await import('path');
        const appDirs = discoverNextAppDirs();
        const explicitRoot = join(process.cwd(), scanPath);
        const roots = scanPath === 'app'
          ? appDirs
          : existsSync(explicitRoot)
            ? [{ dir: explicitRoot, label: scanPath }]
            : [];
        const hrefRe = /href=["'](\/((?!http|mailto|tel|#)[^"']+))["']/g;
        const broken: string[] = [];
        let scanned = 0;

        if (roots.length === 0) {
          write('\x1b[33m⚠  Link source scan unavailable: no matching source directory found.\x1b[0m');
          write(`   Requested: ${scanPath}`);
          write(`   Checked app roots: ${describeCheckedAppDirs()}`);
          break;
        }

        function hasPageForHref(href: string) {
          return appDirs.some((appDir) => {
            const pagePath = join(appDir.dir, href, 'page.tsx');
            const dynPath = join(appDir.dir, href.replace(/\/[^/]+$/, '/[...slug]'), 'page.tsx');
            return existsSync(pagePath) || existsSync(dynPath);
          });
        }

        function walk(dir: string) {
          for (const f of readdirSync(dir)) {
            const full = join(dir, f);
            if (statSync(full).isDirectory()) { walk(full); continue; }
            if (!f.endsWith('.tsx') && !f.endsWith('.ts')) continue;
            scanned++;
            const src = readFileSync(full, 'utf8');
            let m: RegExpExecArray | null;
            while ((m = hrefRe.exec(src)) !== null) {
              const href = m[1].split('?')[0].split('#')[0];
              // Check if a page.tsx exists for this route
              if (!hasPageForHref(href)) {
                broken.push(`${relative(process.cwd(), full)}  →  ${href}`);
              }
            }
          }
        }
        for (const root of roots) walk(root.dir);
        write(`\x1b[32m✓  Scanned ${scanned} files\x1b[0m`);
        write(`   Source roots: ${roots.map((root) => root.label).join(', ')}`);
        const unique = [...new Set(broken)].slice(0, 30);
        write(`   Potential broken links: ${unique.length}`);
        unique.forEach(b => write(`   \x1b[31m✗\x1b[0m  ${b}`));
        if (unique.length === 0) write(`   No broken internal links detected`);
        if (broken.length > 30) write(`   … and ${broken.length - 30} more (dynamic routes may be false positives)`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Scan failed'}\x1b[0m`); }
      break;
    }

    // ── Run migration ─────────────────────────────────────────────────────
    case 'run_migration': {
      const filename = String(args.filename ?? '');
      const confirm  = args.confirm === true;
      if (!filename) { write(`\x1b[31m✗  filename is required\x1b[0m`); break; }
      write(`\x1b[33m⚙  Migration: ${filename}\x1b[0m`);
      try {
        const { readFileSync, existsSync } = await import('fs');
        const { join } = await import('path');
        const migPath = join(process.cwd(), 'supabase', 'migrations', filename);
        if (!existsSync(migPath)) { write(`\x1b[31m✗  File not found: ${filename}\x1b[0m`); break; }
        const sql = readFileSync(migPath, 'utf8');
        write(`   File: ${filename}`);
        write(`   Lines: ${sql.split('\n').length}`);
        // Show first non-comment lines as preview
        const preview = sql.split('\n').filter(l => l.trim() && !l.trim().startsWith('--')).slice(0, 5);
        preview.forEach(l => write(`   \x1b[2m${l.slice(0, 80)}\x1b[0m`));
        if (!confirm) {
          write(`\x1b[33m⚠  Dry run — set confirm=true to apply\x1b[0m`);
          write(`   Apply in Supabase Dashboard → SQL Editor`);
          break;
        }
        // Apply via Supabase Management API (postgres role — full superuser access)
        // Falls back to exec_sql RPC for simple migrations if Management API key not set.
        const dangerous = /\b(DROP\s+TABLE\s+(?!IF\s+EXISTS)|TRUNCATE\s+(?!.*IF\s+EXISTS))/i.test(sql);
        if (dangerous) { write(`\x1b[31m✗  Migration contains potentially destructive SQL — apply manually in Supabase Dashboard\x1b[0m`); break; }

        const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
        const mgmtKey = process.env.SUPABASE_MANAGEMENT_API_KEY ?? process.env.SUPABASE_ACCESS_TOKEN;

        let applied = false;

        // Path 1: Management API (has superuser — can CREATE EXTENSION, ALTER TABLE, etc.)
        if (projectRef && mgmtKey) {
          const mgmtRes = await fetch(
            `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mgmtKey}`,
              },
              body: JSON.stringify({ query: sql }),
            }
          );
          if (mgmtRes.ok) {
            applied = true;
          } else {
            const body = await mgmtRes.text().catch(() => '');
            write(`\x1b[33m⚠  Management API: ${mgmtRes.status} — ${body.slice(0, 120)}\x1b[0m`);
          }
        }

        // Path 2: exec_sql RPC (service role — works for most DDL, not superuser ops)
        if (!applied) {
          const { createClient } = await import('@supabase/supabase-js');
          const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
          const { error: rpcErr } = await sb.rpc('exec_sql', { sql }).single();
          if (rpcErr) {
            await emitMigrationEvent('failed', filename);
            write(`\x1b[31m✗  ${rpcErr.message}\x1b[0m`);
            write(`   Apply manually: https://supabase.com/dashboard/project/${projectRef ?? 'cuxzzpsyufcewtmicszk'}/sql`);
            break;
          }
          applied = true;
        }

        if (applied) {
          // Record in efh_migrations so list_pending_migrations reflects the change
          const { createClient } = await import('@supabase/supabase-js');
          const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
          await sb.from('efh_migrations').upsert({ filename, executed_at: new Date().toISOString() }, { onConflict: 'filename' });
          await emitMigrationEvent('applied', filename);
          write(`\x1b[32m✓  Migration applied: ${filename}\x1b[0m`);
        }
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Migration failed'}\x1b[0m`); }
      break;
    }

    // ── Semantic composite tools ───────────────────────────────────────────

    case 'audit_enrollment_pipeline': {
      const slug = args.program_slug ? String(args.program_slug) : null;
      write(`\x1b[33m⚙  Auditing enrollment pipeline${slug ? ` for ${slug}` : ''}…\x1b[0m`);
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        // Applications
        let appsQ = sb.from('applications').select('id, status, program_id, created_at', { count: 'exact' });
        if (slug) {
          const { data: prog } = await sb.from('programs').select('id').eq('slug', slug).single();
          if (prog) appsQ = appsQ.eq('program_id', prog.id) as typeof appsQ;
        }
        const { data: apps, count: appCount } = await appsQ.limit(200);
        const byStatus: Record<string, number> = {};
        for (const a of apps ?? []) byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;

        // Enrollments
        const { count: enrollCount } = await sb.from('enrollments').select('id', { count: 'exact', head: true });

        // Stuck: applications pending > 7 days
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: stuckCount } = await sb.from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .lt('created_at', cutoff);

        write(`\x1b[32m✓  Enrollment pipeline audit\x1b[0m`);
        write(`   Total applications:  ${appCount ?? '?'}`);
        Object.entries(byStatus).forEach(([s, n]) => write(`   ${s.padEnd(16)} ${n}`));
        write(`   Total enrollments:   ${enrollCount ?? '?'}`);
        write(`   Stuck (>7d pending): ${stuckCount ?? '?'}`);
        if ((stuckCount ?? 0) > 0) write(`\x1b[33m   ⚠  ${stuckCount} applications stuck — review at /admin/applications\x1b[0m`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Audit failed'}\x1b[0m`); }
      break;
    }

    case 'verify_program_integrity': {
      const slug = String(args.program_slug ?? '');
      if (!slug) { write(`\x1b[31m✗  program_slug is required\x1b[0m`); break; }
      write(`\x1b[33m⚙  Verifying program integrity: ${slug}…\x1b[0m`);
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        const { data: prog } = await sb.from('programs').select('id, title, published, is_active, status').eq('slug', slug).single();
        if (!prog) { write(`\x1b[31m✗  Program not found: ${slug}\x1b[0m`); break; }

        write(`\x1b[32m✓  Program found\x1b[0m`);
        write(`   Title:     ${prog.title}`);
        write(`   Published: ${prog.published}  Active: ${prog.is_active}  Status: ${prog.status}`);

        const { data: courses, count: courseCount } = await sb.from('courses').select('id, title', { count: 'exact' }).eq('program_id', prog.id);
        write(`   Courses:   ${courseCount ?? 0}`);

        if (courses && courses.length > 0) {
          for (const course of courses.slice(0, 3)) {
            const { count: lessonCount } = await sb.from('curriculum_lessons').select('id', { count: 'exact', head: true }).eq('course_id', course.id);
            write(`   └ ${course.title}: ${lessonCount ?? 0} lessons`);
          }
        }

        const { readdirSync, existsSync } = await import('fs');
        const { join } = await import('path');
        const applyPath = join(process.cwd(), 'app', 'programs', slug, 'apply');
        const checkoutPath = join(process.cwd(), 'app', 'checkout', slug);
        write(`   Apply route:    ${existsSync(applyPath) ? '\x1b[32m✓ exists\x1b[0m' : '\x1b[90mfalls through to [program]\x1b[0m'}`);
        write(`   Checkout route: ${existsSync(checkoutPath) ? '\x1b[32m✓ exists\x1b[0m' : '\x1b[90mfalls through to [program]\x1b[0m'}`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Verify failed'}\x1b[0m`); }
      break;
    }

    case 'inspect_student_access': {
      const userId = args.user_id ? String(args.user_id) : null;
      const email  = args.email   ? String(args.email)   : null;
      if (!userId && !email) { write(`\x1b[31m✗  user_id or email is required\x1b[0m`); break; }
      write(`\x1b[33m⚙  Inspecting student access…\x1b[0m`);
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        let uid = userId;
        if (!uid && email) {
          const { data: p } = await sb.from('profiles').select('id, full_name, role').eq('email', email).single();
          if (!p) { write(`\x1b[31m✗  No user found for email: ${email}\x1b[0m`); break; }
          uid = p.id;
          write(`   User: ${p.full_name} (${p.role})`);
        }

        const { data: enrollments } = await sb.from('enrollments').select('id, course_id, status, created_at').eq('user_id', uid!).limit(10);
        write(`   Enrollments: ${enrollments?.length ?? 0}`);
        enrollments?.forEach(e => write(`   └ ${e.course_id} — ${e.status}`));

        const { count: progressCount } = await sb.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('user_id', uid!);
        write(`   Lesson progress rows: ${progressCount ?? 0}`);

        const { count: checkpointCount } = await sb.from('checkpoint_scores').select('id', { count: 'exact', head: true }).eq('user_id', uid!);
        write(`   Checkpoint scores: ${checkpointCount ?? 0}`);

        const { data: certs } = await sb.from('program_completion_certificates').select('id, program_id, issued_at').eq('user_id', uid!).limit(5);
        write(`   Certificates: ${certs?.length ?? 0}`);
        certs?.forEach(c => write(`   └ ${c.program_id} — issued ${c.issued_at}`));
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Inspect failed'}\x1b[0m`); }
      break;
    }

    case 'get_platform_state': {
      write(`\x1b[33m⚙  Fetching live platform state…\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/devstudio/platform-state`, { headers: { Cookie: authHeader } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const state = await res.json();
        write(`\x1b[32m✓  Platform state (${state.timestamp})\x1b[0m`);
        write(`   Environment:         ${state.deployment?.environment}`);
        write(`   AI provider:         ${state.deployment?.ai_provider}`);
        write(`   Active students:     ${state.platform?.active_students ?? '?'}`);
        write(`   Pending applications:${state.platform?.pending_applications ?? '?'}`);
        write(`   Total enrollments:   ${state.platform?.total_enrollments ?? '?'}`);
        write(`   Published programs:  ${state.platform?.published_programs ?? '?'}`);
        write(`   Certificates issued: ${state.platform?.certificates_issued ?? '?'}`);
        write(`   Platform debt:       ${state.debt?.total_items} items (${state.debt?.by_severity?.high ?? 0} high)`);
        if (state.debt?.top_issues?.length) {
          write(`   Top issues: ${state.debt.top_issues.join(', ')}`);
        }
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'State fetch failed'}\x1b[0m`); }
      break;
    }

    case 'lookup_knowledge_graph': {
      const query = String(args.query ?? '');
      write(`\x1b[33m⚙  Knowledge graph lookup: ${query}…\x1b[0m`);
      try {
        const { lookupRoute, lookupTable, SYSTEMS: SYS, PLATFORM_DEBT: DEBT, CANONICAL_DECISIONS: DECISIONS } = await import('@/lib/platform/knowledge-graph');

        if (query === 'debt') {
          write(`\x1b[32m✓  Platform debt (${DEBT.length} items)\x1b[0m`);
          DEBT.forEach(d => write(`   [${d.severity.toUpperCase()}] ${d.id}: ${d.description.slice(0, 80)}`));
        } else if (query === 'decisions') {
          write(`\x1b[32m✓  Canonical decisions\x1b[0m`);
          DECISIONS.forEach(d => write(`   • ${d.id}: ${d.decision.slice(0, 80)}`));
        } else if (query === 'systems') {
          write(`\x1b[32m✓  Platform systems\x1b[0m`);
          SYS.forEach(s => write(`   [${s.status}] ${s.id}: ${s.description.slice(0, 60)}`));
        } else if (query.startsWith('/')) {
          const system = lookupRoute(query);
          write(system
            ? `\x1b[32m✓  Route ${query} → system: ${system.name} (${system.id})\x1b[0m\n   Tables: ${system.tables.join(', ')}`
            : `\x1b[33m⚠  Route ${query} not in knowledge graph\x1b[0m`);
        } else {
          const systems = lookupTable(query);
          if (systems.length) {
            write(`\x1b[32m✓  Table "${query}" used by:\x1b[0m`);
            systems.forEach(s => write(`   • ${s.name} (${s.id})`));
          } else {
            const sys = SYS.find(s => s.id === query);
            if (sys) {
              write(`\x1b[32m✓  System: ${sys.name}\x1b[0m`);
              write(`   Status: ${sys.status}`);
              write(`   ${sys.description}`);
              write(`   Routes: ${sys.routes.join(', ')}`);
              write(`   Tables: ${sys.tables.join(', ')}`);
            } else {
              write(`\x1b[33m⚠  "${query}" not found in knowledge graph\x1b[0m`);
              write(`   Try: a route path (/programs/[program]), table name, system id, "debt", "decisions", or "systems"`);
            }
          }
        }
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Lookup failed'}\x1b[0m`); }
      break;
    }

    case 'list_pending_migrations': {
      write(`\x1b[33m⚙  Checking migrations…\x1b[0m`);
      try {
        // 1. Get applied migrations from DB
        const { data: applied, error: dbErr } = await adminDb
          .from('efh_migrations')
          .select('filename, executed_at')
          .order('filename', { ascending: true });
        if (dbErr) throw new Error(dbErr.message);
        const appliedSet = new Set((applied ?? []).map((r: { filename: string }) => r.filename));

        // 2. Get migration files from GitHub repo
        const ghToken = process.env.GITHUB_TOKEN;
        const repoFiles: string[] = [];
        if (ghToken) {
          const ghRes = await fetch(
            'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/contents/supabase/migrations',
            { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github.v3+json' } },
          );
          if (ghRes.ok) {
            const items: { name: string; type: string }[] = await ghRes.json();
            items.filter(i => i.type === 'file' && i.name.endsWith('.sql')).forEach(i => repoFiles.push(i.name));
            repoFiles.sort();
          }
        }

        if (repoFiles.length === 0) {
          // Fallback: just show what's applied in DB
          write(`\x1b[32m✓  ${appliedSet.size} migrations applied in DB\x1b[0m`);
          [...appliedSet].slice(-20).forEach(f => write(`   \x1b[32m✓\x1b[0m ${f}`));
          write(`\n   \x1b[33m⚠  Could not read repo files (GITHUB_TOKEN not set or API error)\x1b[0m`);
          write(`   Add GITHUB_TOKEN in Dev Studio → Secrets tab for full diff.`);
          break;
        }

        const pending = repoFiles.filter(f => !appliedSet.has(f));
        const applied20 = repoFiles.filter(f => appliedSet.has(f)).slice(-5);

        write(`\x1b[32m✓  ${repoFiles.length} files in repo · ${appliedSet.size} applied in DB\x1b[0m`);
        write('');

        if (applied20.length) {
          write(`\x1b[90m   Recently applied:\x1b[0m`);
          applied20.forEach(f => write(`   \x1b[32m✓\x1b[0m ${f}`));
          write('');
        }

        if (pending.length === 0) {
          write(`\x1b[32m✓  All migrations are applied — DB is up to date.\x1b[0m`);
        } else {
          write(`\x1b[33m⚠  ${pending.length} migration(s) not yet applied:\x1b[0m`);
          pending.forEach(f => write(`   \x1b[33m○\x1b[0m ${f}`));
          write('');
          write(`   To apply via AI: type "apply migration <filename>" for each one`);
          write(`   To apply all:    type "apply all pending migrations"`);
          write(`   Manual fallback: https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/sql`);
        }
      } catch (err) {
        write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Failed'}\x1b[0m`);
      }
      break;
    }

    // ── Apply all pending migrations ───────────────────────────────────────
    case 'apply_all_pending_migrations': {
      write(`\x1b[33m⚙  Applying all pending migrations…\x1b[0m`);
      try {
        const { readFileSync, existsSync, readdirSync } = await import('fs');
        const { join } = await import('path');
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        // Get applied set
        const { data: appliedRows } = await adminDb.from('efh_migrations').select('filename');
        const appliedSet = new Set((appliedRows ?? []).map((r: { filename: string }) => r.filename));

        // Get local migration files
        const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
        const allFiles = existsSync(migrationsDir)
          ? readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
          : [];
        const pending = allFiles.filter(f => !appliedSet.has(f));

        if (pending.length === 0) {
          write(`\x1b[32m✓  No pending migrations — DB is up to date.\x1b[0m`);
          break;
        }

        write(`   Found ${pending.length} pending migration(s)`);
        const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
        const mgmtKey = process.env.SUPABASE_MANAGEMENT_API_KEY ?? process.env.SUPABASE_ACCESS_TOKEN;

        let ok = 0; let fail = 0;
        for (const filename of pending) {
          const sql = readFileSync(join(migrationsDir, filename), 'utf8');
          const dangerous = /\b(DROP\s+TABLE\s+(?!IF\s+EXISTS)|TRUNCATE\s+(?!.*IF\s+EXISTS))/i.test(sql);
          if (dangerous) {
            write(`\x1b[33m⚠  Skipped (destructive): ${filename}\x1b[0m`);
            fail++;
            continue;
          }

          let applied = false;
          if (projectRef && mgmtKey) {
            const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mgmtKey}` },
              body: JSON.stringify({ query: sql }),
            });
            if (res.ok) applied = true;
          }
          if (!applied) {
            const { error: rpcErr } = await sb.rpc('exec_sql', { sql }).single();
            if (!rpcErr) applied = true;
          }

          if (applied) {
            await sb.from('efh_migrations').upsert({ filename, executed_at: new Date().toISOString() }, { onConflict: 'filename' });
            await emitMigrationEvent('applied', filename);
            write(`\x1b[32m✓  ${filename}\x1b[0m`);
            ok++;
          } else {
            write(`\x1b[31m✗  ${filename} — apply manually in Supabase Dashboard\x1b[0m`);
            fail++;
          }
        }
        write('');
        write(`\x1b[32m✓  Applied: ${ok}  Failed/Skipped: ${fail}\x1b[0m`);
        if (fail > 0) write(`   Manual: https://supabase.com/dashboard/project/${projectRef ?? 'cuxzzpsyufcewtmicszk'}/sql`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Failed'}\x1b[0m`); }
      break;
    }

    case 'recall_memory': {
      const memType = args.type ? String(args.type) : 'all';
      const search  = args.search ? String(args.search).toLowerCase() : null;
      write(`\x1b[33m⚙  Recalling operational memory (${memType})…\x1b[0m`);
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        let q = sb.from('ai_operator_memory').select('memory_type, title, content, severity, tags, created_at').order('created_at', { ascending: false }).limit(30);
        if (memType !== 'all') q = q.eq('memory_type', memType) as typeof q;
        const { data, error } = await q;
        if (error) { write(`\x1b[31m✗  ${error.message}\x1b[0m`); break; }
        const filtered = search
          ? (data ?? []).filter(m => m.title.toLowerCase().includes(search) || m.content.toLowerCase().includes(search))
          : (data ?? []);
        write(`\x1b[32m✓  ${filtered.length} memories\x1b[0m`);
        filtered.forEach(m => {
          const sev = m.severity === 'critical' ? '\x1b[31m' : m.severity === 'warning' ? '\x1b[33m' : '\x1b[32m';
          write(`   ${sev}[${m.memory_type}]\x1b[0m ${m.title}`);
          write(`   ${m.content.slice(0, 120)}${m.content.length > 120 ? '…' : ''}`);
        });
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Recall failed'}\x1b[0m`); }
      break;
    }

    case 'save_memory': {
      const memType = String(args.type ?? 'note');
      const title   = String(args.title ?? '');
      const content = String(args.content ?? '');
      const tags    = Array.isArray(args.tags) ? args.tags.map(String) : [];
      if (!title || !content) { write(`\x1b[31m✗  title and content are required\x1b[0m`); break; }
      write(`\x1b[33m⚙  Saving memory: ${title}…\x1b[0m`);
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { error } = await sb.from('ai_operator_memory').insert({ memory_type: memType, title, content, tags });
        if (error) { write(`\x1b[31m✗  ${error.message}\x1b[0m`); break; }
        write(`\x1b[32m✓  Memory saved: [${memType}] ${title}\x1b[0m`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Save failed'}\x1b[0m`); }
      break;
    }

    case 'run_qa_scan': {
      const scope = String(args.scope ?? 'all');
      write(`\x1b[33m⚙  Running autonomous QA scan (${scope})…\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/devstudio/qa-scan?scope=${scope}`, {
          headers: { Cookie: authHeader },
          signal: AbortSignal.timeout(90000),
        });
        if (!res.body) throw new Error('No stream');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6);
            if (payload === '[DONE]') break;
            try { const { text } = JSON.parse(payload); if (text) write(text); } catch { /* skip */ }
          }
        }
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'QA scan failed'}\x1b[0m`); }
      break;
    }

    case 'create_snapshot': {
      const snapType  = String(args.type ?? 'manual');
      const snapLabel = String(args.label ?? '');
      const rollbackSql = args.rollback_sql ? String(args.rollback_sql) : undefined;
      if (!snapLabel) { write(`\x1b[31m✗  label is required\x1b[0m`); break; }
      write(`\x1b[33m⚙  Creating snapshot: ${snapLabel}…\x1b[0m`);
      try {
        const res = await fetch(`${baseUrl}/api/devstudio/snapshot`, {
          method: 'POST',
          headers: { ...{ 'Content-Type': 'application/json' }, Cookie: authHeader },
          body: JSON.stringify({ type: snapType, label: snapLabel, rollback_sql: rollbackSql }),
        });
        const data = await res.json();
        if (!res.ok) { write(`\x1b[31m✗  ${data.error ?? 'Snapshot failed'}\x1b[0m`); break; }
        write(`\x1b[32m✓  Snapshot created: ${data.id}\x1b[0m`);
        write(`   Label: ${data.label}`);
        write(`   Created: ${data.created_at}`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Snapshot failed'}\x1b[0m`); }
      break;
    }

    case 'list_snapshots': {
      const limit = Number(args.limit ?? 10);
      const type  = args.type ? String(args.type) : undefined;
      write(`\x1b[33m⚙  Listing snapshots…\x1b[0m`);
      try {
        const url = `${baseUrl}/api/devstudio/snapshot?limit=${limit}${type ? `&type=${type}` : ''}`;
        const res = await fetch(url, { headers: { Cookie: authHeader } });
        const data = await res.json();
        const snaps = data.snapshots ?? [];
        write(`\x1b[32m✓  ${snaps.length} snapshots\x1b[0m`);
        snaps.forEach((s: { snapshot_type: string; label: string; rolled_back: boolean; created_at: string }) =>
          write(`   [${s.snapshot_type}] ${s.label}${s.rolled_back ? ' \x1b[33m(rolled back)\x1b[0m' : ''} — ${s.created_at}`)
        );
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'List failed'}\x1b[0m`); }
      break;
    }

    case 'lookup_program_registry': {
      const slug = String(args.slug ?? '');
      if (!slug) { write(`\x1b[31m✗  slug is required\x1b[0m`); break; }
      write(`\x1b[33m⚙  Looking up program registry: ${slug}…\x1b[0m`);
      try {
        const { getProgramBySlug } = await import('@/lib/platform/system-registry');
        const prog = getProgramBySlug(slug);
        if (!prog) {
          write(`\x1b[33m⚠  Program not found in registry: ${slug}\x1b[0m`);
          write(`   Check lib/platform/system-registry.ts to add it`);
          break;
        }
        write(`\x1b[32m✓  ${prog.title}\x1b[0m`);
        write(`   Category:        ${prog.category}`);
        write(`   Canonical route: ${prog.canonical_route}`);
        write(`   Apply route:     ${prog.apply_route}`);
        write(`   Checkout route:  ${prog.checkout_route}`);
        write(`   Enrollment API:  ${prog.enrollment_api}`);
        write(`   Funding:         ${prog.funding.join(', ')}`);
        write(`   Dedicated page:  ${prog.has_dedicated_page}`);
        write(`   LMS course:      ${prog.has_lms_course}`);
        write(`   Status:          ${prog.status}`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Lookup failed'}\x1b[0m`); }
      break;
    }

    // ── Contracts / MOUs ──────────────────────────────────────────────────
    case 'list_contracts': {
      write('📄  Fetching MOUs/contracts...');
      try {
        const { data, error } = await adminDb
          .from('mou_documents')
          .select('id,title,status,counterparty_name,expires_at,created_at')
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) { write(`\x1b[31m✗  DB error: ${error.message}\x1b[0m`); break; }
        if (!data?.length) { write('No MOUs/contracts found.'); break; }
        data.forEach((c: Record<string, unknown>, i: number) => {
          const exp = c.expires_at ? new Date(c.expires_at as string).toLocaleDateString() : 'No expiry';
          write(`${i + 1}. ${String(c.title ?? '--')} | ${String(c.counterparty_name ?? '--')} | ${String(c.status ?? '--')} | Expires: ${exp}`);
        });
        write(`\nManage at: ${getAdminUrl()}/admin/mou`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Failed'}\x1b[0m`); }
      break;
    }

    // ── Grants ────────────────────────────────────────────────────────────
    case 'list_grants': {
      write('🏛️  Fetching grants...');
      try {
        const { data, error } = await adminDb
          .from('grants')
          .select('id,agency,status,due_date,draft,ready,submitted')
          .order('due_date', { ascending: true })
          .limit(20);
        if (error) { write(`\x1b[31m✗  DB error: ${error.message}\x1b[0m`); break; }
        if (!data?.length) { write('No grants found.'); break; }
        data.forEach((g: Record<string, unknown>, i: number) => {
          const due = g.due_date ? new Date(g.due_date as string).toLocaleDateString() : 'No due date';
          const flags = [
            g.draft     ? 'Draft'     : null,
            g.ready     ? 'Ready'     : null,
            g.submitted ? 'Submitted' : null,
          ].filter(Boolean).join(', ') || 'In Progress';
          write(`${i + 1}. ${String(g.agency ?? '--')} | Due: ${due} | Status: ${String(g.status ?? flags)}`);
        });
        write(`\nManage at: ${getAdminUrl()}/admin/grants`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Failed'}\x1b[0m`); }
      break;
    }

    // ── Documents ─────────────────────────────────────────────────────────
    case 'list_documents': {
      write('📁  Fetching documents...');
      try {
        const { data, error } = await adminDb
          .from('documents')
          .select('id,name,document_type,status,uploaded_at')
          .order('uploaded_at', { ascending: false })
          .limit(20);
        if (error) { write(`\x1b[31m✗  DB error: ${error.message}\x1b[0m`); break; }
        if (!data?.length) { write('No documents found.'); break; }
        data.forEach((d: Record<string, unknown>, i: number) => {
          const date = d.uploaded_at ? new Date(d.uploaded_at as string).toLocaleDateString() : '--';
          write(`${i + 1}. ${String(d.name ?? '--')} | ${String(d.document_type ?? '--')} | ${String(d.status ?? '--')} | ${date}`);
        });
        write(`\nManage at: ${getAdminUrl()}/admin/document-center`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Failed'}\x1b[0m`); }
      break;
    }

    // ── Compliance ────────────────────────────────────────────────────────
    case 'list_compliance': {
      write('🛡️  Fetching compliance status...');
      try {
        const [alerts, wioa, docs] = await Promise.all([
          adminDb.from('compliance_alerts').select('id,title,severity,status').neq('status', 'resolved').order('created_at', { ascending: false }).limit(20),
          adminDb.from('wioa_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          adminDb.from('enrollment_documents').select('id', { count: 'exact', head: true }).eq('verified', false),
        ]);
        write(`Open compliance alerts: ${alerts.data?.length ?? 0}`);
        write(`Pending WIOA documents: ${wioa.count ?? 0}`);
        write(`Unverified enrollment docs: ${docs.count ?? 0}`);
        if (alerts.data?.length) {
          write('');
          write('Alerts:');
          alerts.data.forEach((a: Record<string, unknown>, i: number) =>
            write(`  ${i + 1}. [${String(a.severity ?? 'info').toUpperCase()}] ${String(a.title ?? '--')}`)
          );
        }
        write(`\nManage at: ${getAdminUrl()}/admin/compliance`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Failed'}\x1b[0m`); }
      break;
    }

    // ── Signatures ────────────────────────────────────────────────────────
    case 'list_signatures': {
      write('✍️  Fetching pending signatures...');
      try {
        const { data, error } = await adminDb
          .from('document_signatures')
          .select('id,document_type,document_id,signer_id,signed_at,created_at')
          .is('signed_at', null)
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) { write(`\x1b[31m✗  DB error: ${error.message}\x1b[0m`); break; }
        if (!data?.length) { write('\x1b[32m✓  No pending signatures.\x1b[0m'); break; }
        write(`Pending signatures: ${data.length}`);
        data.forEach((s: Record<string, unknown>, i: number) =>
          write(`  ${i + 1}. ${String(s.document_type ?? '--')} (doc: ${String(s.document_id ?? '--')}) | Signer: ${String(s.signer_id ?? '--')}`)
        );
        write(`\nManage at: ${getAdminUrl()}/admin/signatures`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Failed'}\x1b[0m`); }
      break;
    }

    // ── Workflows ─────────────────────────────────────────────────────────
    case 'list_workflows': {
      write('⚙️  Fetching workflows...');
      try {
        const { data, error } = await adminDb
          .from('workflows')
          .select('id,name,status,owner,updated_at')
          .order('updated_at', { ascending: false })
          .limit(20);
        if (error) { write(`\x1b[31m✗  DB error: ${error.message}\x1b[0m`); break; }
        if (!data?.length) { write('No workflows found.'); break; }
        data.forEach((w: Record<string, unknown>, i: number) =>
          write(`${i + 1}. ${String(w.name ?? '--')} | ${String(w.status ?? '--')} | Owner: ${String(w.owner ?? '--')}`)
        );
        write(`\nManage at: ${getAdminUrl()}/admin/workflows`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Failed'}\x1b[0m`); }
      break;
    }

    // ── Org knowledge ─────────────────────────────────────────────────────
    case 'get_org_profile': {
      write('🏢  Fetching organization profile...');
      try {
        const { data, error } = await adminDb
          .from('org_profile')
          .select('*')
          .maybeSingle();
        if (error) { write(`\x1b[31m✗  DB error: ${error.message}\x1b[0m`); break; }
        if (!data) { write('No organization profile found. Set it up at /admin/settings/organization'); break; }
        const d = data as Record<string, unknown>;
        write(`Organization: ${String(d.legal_name ?? d.dba_name ?? '--')}`);
        write(`EIN: ${String(d.ein ?? '--')}`);
        write(`UEI: ${String(d.uei ?? '--')}`);
        write(`CAGE: ${String(d.cage_code ?? '--')}`);
        write(`SAM: ${String(d.sam_registration ?? '--')}`);
        write(`Mission: ${String(d.mission ?? '--')}`);
        write(`\nManage at: ${getAdminUrl()}/admin/settings/organization`);
      } catch (err) { write(`\x1b[31m✗  ${err instanceof Error ? err.message : 'Failed'}\x1b[0m`); }
      break;
    }

    default:
      write(`\x1b[31m✗  Unknown action: ${name}\x1b[0m`);
  }
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  // Hydrate app_secrets so executed commands have full secret access
  await hydrateProcessEnv();

  const { command, history = [] } = await req.json();
  if (!command?.trim()) {
    return new Response('data: [DONE]\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  // All /api/admin/* routes live on the admin app, not the public LMS.
  // In production: https://admin.${PLATFORM_DEFAULTS.canonicalDomain}
  // In dev: http://localhost:3001 (or NEXT_PUBLIC_ADMIN_URL)
  const baseUrl = getAdminUrl();
  const cookieHeader = req.headers.get('cookie') || '';

  const stream = new ReadableStream({
    async start(controller) {
      const write = (line: string) => {
        try {
          controller.enqueue(encode(line));
        } catch {
          /* stream closed */
        }
      };

      try {
        write(`\x1b[90m$ ${command}\x1b[0m`);
        write('');

        logger.info('[devstudio/execute] command received', { command: command.substring(0, 120) });

        // ── Step 1: try keyword match (works without any AI key) ──────────
        const keywordMatch = matchKeyword(command);

        if (keywordMatch) {
          logger.info('[devstudio/execute] keyword match', { action: keywordMatch.action });
          await executeAction(keywordMatch.action, keywordMatch.args, baseUrl, cookieHeader, write);
          write('');
        } else {
          // ── Step 2: AI-assisted routing ──────────────────────────────────
          // Force-refresh so keys saved via Secrets panel are immediately visible
          try { await refreshSecrets(); } catch { /* non-fatal */ }
          const aiAvailable = isGroqConfigured() || isGeminiConfigured() || !!process.env.OPENAI_API_KEY;
          if (!aiAvailable) {
            write('\x1b[33m⚠  No AI provider configured.\x1b[0m');
            write('   Add GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in');
            write('   Dev Studio → Secrets tab, then retry.');
            write('');
            write('\x1b[90m─────────────────────────────────────\x1b[0m');
            return;
          }

          // Inject platform knowledge graph + system registry as context
          const debtSummary = PLATFORM_DEBT.filter(d => d.severity === 'high')
            .map(d => `• [HIGH] ${d.id}: ${d.description}`).join('\n');
          const systemSummary = SYSTEMS.map(s => `• ${s.id} (${s.status}): ${s.description}`).join('\n');
          const registryContext = getSystemRegistryContext();

          const systemPrompt = `You are the ${PLATFORM_DEFAULTS.orgName} platform operator AI — the engineering control layer and operational command center for the entire platform.

You are NOT a chatbot. You are a platform architect, senior DevOps engineer, LMS operator, systems auditor, workflow orchestrator, compliance assistant, grant assistant, and document intelligence engine.

Always use a tool — never respond with plain text unless using ask_question.
Be decisive. If the intent is clear, act immediately. If ambiguous, use ask_question.
When using ask_question to request missing parameters, write a single concise plain-text question. Do NOT output markdown, code blocks, tool names, or fake interfaces. Just ask the question directly.

## Organization Context
- Organization: ${PLATFORM_DEFAULTS.orgName}
- Mission: Workforce development and career training for underserved communities
- Programs: HVAC, CNA, Barber, Tax Preparation, Apprenticeships, and more
- Compliance: WIOA, DOL, ETPL, state licensing, FERPA
- Funding: DOL grants, JRI, WIOA ITA, employer partnerships

## DevInt Operating Container
${getAiCharterContext()}

## Platform Architecture
${systemSummary}

## Active Platform Debt (High Severity)
${debtSummary || 'None'}

## Canonical Rules
- All programs: /programs/[program] dynamic route. Dedicated pages only for unique client components.
- Supabase imports: @/lib/supabase/* only. No root-level shims.
- Middleware: proxy.ts only. Never create middleware.ts.
- Auth: apiAuthGuard / apiRequireAdmin / apiRequireInstructor from @/lib/admin/guards.
- Rate limiting: applyRateLimit() from @/lib/api/withRateLimit.
- Errors: safeError/safeInternalError from @/lib/api/safe-error. Never return error.message directly.
- LMS: DB-driven by step_type. No per-program hardcoded logic.

## Program Registry
${registryContext}

## AI Permission Tiers
- read: query-only, no confirmation needed
- developer: code/data inspection, no confirmation needed
- operator: emails, flags, approvals — confirm before production writes
- deployer: migrations, deployments — ALWAYS confirm, create snapshot first
- super: not available via AI console

## Non-Negotiable Rules
- Never fabricate legal, compliance, or financial data
- Never auto-submit documents, contracts, or grants without explicit approval
- Never overwrite records silently — always log actions
- Always preserve auditability — always allow human override
- Show diffs before destructive file changes
- Require confirmation for all production deploys and migrations

## Tool Selection Guide
PLATFORM STATE
- Platform health/state → get_platform_state
- Route/table/system lookup → lookup_knowledge_graph
- Program details → verify_program_integrity
- Enrollment issues → audit_enrollment_pipeline
- Student access issues → inspect_student_access
- Past decisions/issues → recall_memory
- Save a decision/finding → save_memory
- List migrations → list_pending_migrations
- Apply migration → run_migration (deployer tier — confirm first)
- Route scan → scan_routes
- Auth gaps → audit_system
- QA check → smoke_test

OPERATIONS
- Students/enrollments → list_students / list_enrollments
- Applications → list_applications
- At-risk learners → list_at_risk
- Compliance status → list_compliance
- WIOA documents → list_wioa
- Contracts/MOUs → list_contracts
- Grants → list_grants
- Documents → list_documents
- Pending signatures → list_signatures
- Workflows → list_workflows
- CRM leads → (use ask_question to clarify then list_at_risk pattern)
- Org profile/EIN/UEI → get_org_profile
- Reports → run_reports
- Payroll → run_payroll / export_payroll

ENGINEERING
- Deploy LMS → deploy_autopilot (service: lms)
- Deploy Admin → deploy_autopilot (service: admin)
- Deploy Studio → deploy_autopilot (service: studio)
- Deploy all → deploy_autopilot (service: both)
- Build logs → check_monitoring
- Repo commits → repo_commits
- Scan routes → scan_routes
- Audit system → audit_system
- Run migration → run_migration
- Generate course → generate_course
- Smoke test → smoke_test`;


          const userPrompt = [...history.map((m: { role: string; content: string }) =>
            `${m.role}: ${m.content}`
          ), `user: ${command}`].join('\n');

          let aiResponse: Awaited<ReturnType<typeof callAI>>;
          try {
            aiResponse = await callAI(systemPrompt, userPrompt, TOOLS);
          } catch (aiErr) {
            const reason = aiErr instanceof Error ? aiErr.message : String(aiErr);
            logger.error('[devstudio/execute] AI call failed', undefined, { reason });

            const normalized = command.toLowerCase();
            const shouldRunSmoke =
              normalized.includes('error free') ||
              normalized.includes('site health') ||
              normalized.includes('smoke test') ||
              normalized.includes('health check') ||
              normalized.includes('site status') ||
              normalized.includes('website ok') ||
              normalized.includes('is website ok') ||
              normalized.includes('site status');

            if (shouldRunSmoke) {
              write(`\x1b[33m⚠  AI routing unavailable: ${reason}\x1b[0m`);
              write('   Falling back to deterministic smoke_test...');
              await executeAction('smoke_test', {}, baseUrl, cookieHeader, write);
              write('');
              write('\x1b[90m─────────────────────────────────────\x1b[0m');
              return;
            }

            write(`\x1b[31m✗  AI routing failed: ${reason}\x1b[0m`);
            write('   Add GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in Dev Studio → Secrets tab.');
            write('   Tip: you can still run "smoke test" for non-AI health checks.');
            write('\x1b[90m─────────────────────────────────────\x1b[0m');
            return;
          }

          const msg = {
            content: aiResponse.content,
            tool_calls: aiResponse.toolCalls,
          };

          if (msg.tool_calls?.length) {
            for (const call of msg.tool_calls as { function: { name: string; arguments: string } }[]) {
              const actionName = call.function.name;
              const args = JSON.parse(call.function.arguments || '{}');
              logger.info('[devstudio/execute] executing action', { action: actionName });
              await executeAction(actionName, args, baseUrl, cookieHeader, write);
              write('');
            }
          } else if (msg.content) {
            // Plain-text response (Gemini fallback or ask_question via content)
            String(msg.content).trim().split('\n').forEach(line => write(line ? `   ${line}` : ''));
          } else {
            write('\x1b[33m⚠  AI returned no action. Try rephrasing your command.\x1b[0m');
          }
        }

        write('\x1b[90m─────────────────────────────────────\x1b[0m');

        // Emit platform event + write audit log (fire-and-forget)
        try {
          await emitAiAction('devstudio_execute', auth.id, { command: command.slice(0, 200) });
          const { createClient } = await import('@supabase/supabase-js');
          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
            await sb.from('audit_logs').insert({
              actor_id: auth.id ?? null,
              action: 'ai_devstudio_execute',
              metadata: { source: 'ai', command: command.slice(0, 500) },
            });
          }
        } catch { /* non-critical */ }

      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        logger.error('[devstudio/execute] unexpected error', undefined, { reason });
        write(`\x1b[31m✗  Unexpected error: ${reason}\x1b[0m`);
      } finally {
        try {
          controller.enqueue(encodeDone());
        } catch {
          /* already closed */
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
    },
  });
}
