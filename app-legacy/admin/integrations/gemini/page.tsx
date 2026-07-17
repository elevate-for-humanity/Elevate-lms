import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import GeminiIntegrationClient from './GeminiIntegrationClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Gemini AI | Integrations | Admin',
};

export default async function GeminiIntegrationPage() {
  await requireRole(['admin', 'super_admin']);

  const hasKey = !!process.env.GEMINI_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAzure = !!process.env.AZURE_OPENAI_API_KEY;
  const preferredEnv = process.env.AI_PROVIDER ?? 'openai';

  // Determine which provider would actually be used
  let activeProvider = 'none';
  if (preferredEnv === 'gemini' && hasKey) activeProvider = 'gemini';
  else if (preferredEnv === 'openai' && hasOpenAI) activeProvider = 'openai';
  else if (preferredEnv === 'azure' && hasAzure) activeProvider = 'azure';
  else if (hasOpenAI) activeProvider = 'openai (fallback)';
  else if (hasKey) activeProvider = 'gemini (fallback)';
  else if (hasAzure) activeProvider = 'azure (fallback)';

  const usedIn = [
    {
      surface: 'AI Tutor',
      route: '/api/ai-tutor/chat',
      description: 'Answers learner questions in the lesson sidebar',
    },
    {
      surface: 'AI Instructor',
      route: '/api/ai-instructor/message',
      description: 'Instructor-facing lesson Q&A and content help',
    },
    {
      surface: 'HVAC AI Instructor',
      route: '/api/ai-instructor/hvac',
      description: 'HVAC-specific lesson assistant',
    },
    {
      surface: 'Lesson Audio',
      route: '/api/lessons/[id]/audio',
      description: 'Generates TTS audio for lesson content',
    },
    {
      surface: 'Course Pipeline',
      route: '/admin/studio',
      description: 'AI-assisted course outline and lesson generation',
    },
    {
      surface: 'Quiz Generator',
      route: '/admin/quiz-builder',
      description: 'Generates quiz questions from lesson content',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Integrations', href: '/admin/integrations' },
            { label: 'Gemini AI' },
          ]}
        />

        <div className="mt-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
              <rect width="48" height="48" rx="8" fill="#1A73E8" />
              <path
                d="M24 8C15.16 8 8 15.16 8 24s7.16 16 16 16 16-7.16 16-16S32.84 8 24 8zm0 6l4 10-4 2-4-2 4-10zm0 20l-4-2 4-10 4 10-4 2z"
                fill="white"
                opacity=".9"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Google Gemini AI</h1>
            <p className="text-slate-500 text-sm">
              AI provider for tutoring, content generation, and quiz creation
            </p>
          </div>
        </div>

        <GeminiIntegrationClient
          hasKey={hasKey}
          hasOpenAI={hasOpenAI}
          hasAzure={hasAzure}
          activeProvider={activeProvider}
          preferredEnv={preferredEnv}
          usedIn={usedIn}
        />
      </div>
    </div>
  );
}
