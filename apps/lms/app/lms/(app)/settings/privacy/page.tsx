import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Shield, Users, MessageSquare, UserPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Privacy | Elevate LMS',
  description: 'Control how your learner profile appears in the Elevate community.',
  robots: { index: false, follow: false },
};

async function saveCommunityPrivacy(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/settings/privacy');

  const communityVisible = formData.get('community_visible') === 'on';
  const allowMessages = formData.get('community_allow_messages') === 'on';
  const allowFollow = formData.get('community_allow_follow') === 'on';
  const showRole = formData.get('community_show_role') === 'on';

  const { error } = await supabase
    .from('profiles')
    .update({
      community_visible: communityVisible,
      community_allow_messages: allowMessages,
      community_allow_follow: allowFollow,
      community_show_role: showRole,
    })
    .eq('id', user.id);

  if (error) redirect('/lms/settings/privacy?error=1');
  revalidatePath('/lms/settings/privacy');
  revalidatePath('/lms/members');
  redirect('/lms/settings/privacy?saved=1');
}

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/settings/privacy');

  const { data: profile } = await supabase
    .from('profiles')
    .select('community_visible,community_allow_messages,community_allow_follow,community_show_role')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
      <section className="rounded-3xl bg-slate-950 p-6 text-white md:p-8">
        <div className="flex items-center gap-3"><Shield className="h-6 w-6 text-cyan-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Privacy</p></div>
        <h1 className="mt-3 text-3xl font-black">Community visibility</h1>
        <p className="mt-2 text-slate-300">Your workforce and student record is never automatically published to the community. You control whether other authenticated Elevate learners can discover and contact you.</p>
      </section>

      {params.saved === '1' && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">Privacy settings saved.</div>}
      {params.error === '1' && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">Your privacy settings could not be saved. Please try again.</div>}

      <form action={saveCommunityPrivacy} className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <PrivacyToggle
          name="community_visible"
          defaultChecked={profile?.community_visible ?? false}
          icon={<Users className="h-5 w-5" />}
          title="Show me in the member directory"
          description="Allows authenticated Elevate community members to find your name and profile. Existing accounts are private unless this is turned on."
        />
        <PrivacyToggle
          name="community_show_role"
          defaultChecked={profile?.community_show_role ?? true}
          icon={<Shield className="h-5 w-5" />}
          title="Show my community role"
          description="Displays a general role such as student, apprentice, or instructor. It does not expose funding, case-management, compliance, or eligibility data."
        />
        <PrivacyToggle
          name="community_allow_messages"
          defaultChecked={profile?.community_allow_messages ?? true}
          icon={<MessageSquare className="h-5 w-5" />}
          title="Allow direct messages"
          description="Lets visible community members start a direct conversation with you inside Elevate."
        />
        <PrivacyToggle
          name="community_allow_follow"
          defaultChecked={profile?.community_allow_follow ?? true}
          icon={<UserPlus className="h-5 w-5" />}
          title="Allow follows and connections"
          description="Lets other visible community members follow your community activity."
        />
        <div className="pt-2"><button type="submit" className="rounded-xl bg-brand-blue-600 px-6 py-3 font-black text-white hover:bg-brand-blue-700">Save privacy settings</button></div>
      </form>
    </main>
  );
}

function PrivacyToggle({ name, defaultChecked, icon, title, description }: { name: string; defaultChecked: boolean; icon: React.ReactNode; title: string; description: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 p-4 hover:border-brand-blue-300">
      <div className="mt-0.5 rounded-xl bg-slate-100 p-2 text-slate-700">{icon}</div>
      <div className="min-w-0 flex-1"><p className="font-black text-slate-900">{title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-2 h-5 w-5 rounded border-slate-300 text-brand-blue-600" />
    </label>
  );
}
