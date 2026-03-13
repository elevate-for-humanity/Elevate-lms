import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'AI Console | Admin',
};

export default async function AIConsolePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Ai Console" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin')
    redirect('/unauthorized');

  // Get AI usage stats
  const { count: totalConversations } = await db
    .from('conversations')
    .select('*', { count: 'exact', head: true });

  // Get AI task metrics
  const { count: totalTasks } = await db
    .from('ai_generation_tasks')
    .select('*', { count: 'exact', head: true });

  const { count: completedTasks } = await db
    .from('ai_generation_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  const { count: failedTasks } = await db
    .from('ai_generation_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed');

  const { count: runningTasks } = await db
    .from('ai_generation_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'running');

  // Get recent activity feed
  const { data: recentTasks } = await db
    .from('ai_generation_tasks')
    .select('id, task_type, status, input_config, created_at, completed_at, error_message')
    .order('created_at', { ascending: false })
    .limit(20);

  // Get generated asset counts
  const { count: totalImages } = await db
    .from('generated_images')
    .select('*', { count: 'exact', head: true });

  const { count: totalTTS } = await db
    .from('tts_audio_files')
    .select('*', { count: 'exact', head: true });

  const { count: totalVideos } = await db
    .from('video_generation_jobs')
    .select('*', { count: 'exact', head: true });

  const { count: totalCourses } = await db
    .from('course_generation_logs')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Hero Image */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Ai Console" }]} />
        </div>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">AI Console</h1>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Tasks</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalTasks || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</h3>
            <p className="text-3xl font-bold text-brand-green-600 mt-1">{completedTasks || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Running</h3>
            <p className="text-3xl font-bold text-brand-blue-600 mt-1">{runningTasks || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Failed</h3>
            <p className="text-3xl font-bold text-brand-red-600 mt-1">{failedTasks || 0}</p>
          </div>
        </div>

        {/* Asset Counts */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Conversations', count: totalConversations || 0 },
            { label: 'Images Generated', count: totalImages || 0 },
            { label: 'TTS Audio Files', count: totalTTS || 0 },
            { label: 'Videos Generated', count: totalVideos || 0 },
            { label: 'Courses Generated', count: totalCourses || 0 },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
            </div>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Recent AI Activity</h2>
          {recentTasks && recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      task.status === 'completed' ? 'bg-brand-green-500' :
                      task.status === 'running' ? 'bg-brand-blue-500 animate-pulse' :
                      task.status === 'failed' ? 'bg-brand-red-500' :
                      'bg-gray-400'
                    }`} />
                    <div>
                      <span className="text-sm font-medium text-gray-900 capitalize">{task.task_type}</span>
                      {task.input_config?.title && (
                        <span className="text-sm text-gray-500 ml-2">— {task.input_config.title}</span>
                      )}
                      {task.input_config?.prompt && (
                        <span className="text-sm text-gray-500 ml-2">— {String(task.input_config.prompt).substring(0, 60)}</span>
                      )}
                      {task.error_message && (
                        <p className="text-xs text-brand-red-600 mt-0.5">{task.error_message}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'completed' ? 'bg-brand-green-100 text-brand-green-700' :
                      task.status === 'running' ? 'bg-brand-blue-100 text-brand-blue-700' :
                      task.status === 'failed' ? 'bg-brand-red-100 text-brand-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{task.status}</span>
                    <p className="text-xs text-gray-400 mt-1">{new Date(task.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No AI tasks yet. Generate content to see activity here.</p>
          )}
        </div>

        {/* AI Tools Grid */}
        <h2 className="text-xl font-semibold mb-4">AI Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { name: 'Course Builder', desc: 'AI-powered course generation from topic and objectives', href: '/admin/course-builder', status: 'active' },
            { name: 'Video Generator', desc: 'Generate lesson videos with AI voiceover and scenes', href: '/admin/video-generator', status: 'active' },
            { name: 'Program Generator', desc: 'Auto-generate program structures and curricula', href: '/admin/program-generator', status: 'active' },
            { name: 'Image Generator', desc: 'DALL-E 3 thumbnails, heroes, and certificate backgrounds', href: '/admin/advanced-tools', status: 'active' },
            { name: 'Text-to-Speech', desc: 'Generate narration audio with 6 voice options', href: '/admin/advanced-tools', status: 'active' },
            { name: 'AI Copilot', desc: 'Admin AI assistant for platform management', href: '/admin/copilot', status: 'active' },
            { name: 'AI Tutor', desc: 'Student-facing chat, essay, and study guide modes', href: '/admin/ai-tutor-logs', status: 'active' },
            { name: 'Autopilot', desc: 'Automated content refresh, link checking, media enhancement', href: '/admin/autopilot', status: 'active' },
            { name: 'Asset Generator', desc: 'Generate images and content from prompts', href: '/admin/advanced-tools', status: 'active' },
          ].map((tool) => (
            <a key={tool.name} href={tool.href} className="bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-shadow block">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                <span className="w-2 h-2 rounded-full bg-brand-green-500" />
              </div>
              <p className="text-sm text-gray-600">{tool.desc}</p>
            </a>
          ))}
        </div>

        {/* API Endpoints */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
          <div className="space-y-2 font-mono text-sm">
            {[
              'POST /api/ai/course-builder — Generate course structure',
              'POST /api/ai/generate-image — DALL-E 3 image generation',
              'POST /api/ai/tts — Text-to-speech audio',
              'POST /api/ai-studio/generate-video — Scene-based video generation',
              'POST /api/video/generate — Course video with AI instructor',
              'POST /api/ai/generate-asset — Image or content generation',
              'POST /api/ai/chat — AI chat completion',
              'POST /api/autopilot/build-course — Autopilot course build',
              'POST /api/autopilot/scan-repo — Repository analysis',
            ].map((endpoint) => (
              <div key={endpoint} className="flex items-center gap-2 text-gray-700">
                <span className="text-brand-green-600">•</span>
                <span>{endpoint}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
