import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';

export type HolderApplicationCopy = {
  id: string;
  programSlug: string;
  name: string;
  email: string;
  phone: string;
  userId?: string | null;
};
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char,
  );

/** Copies only to explicitly enabled, active holders assigned to this exact program. */
export async function copyApplicationToProgramHolders(
  db: SupabaseClient,
  application: HolderApplicationCopy,
) {
  const { data: program, error: programError } = await db
    .from('programs')
    .select('id,title')
    .eq('slug', application.programSlug)
    .maybeSingle();
  if (programError) throw new Error('Application copy program could not be verified.');
  if (!program) return;
  const { data: assignments, error: assignmentError } = await db
    .from('program_holder_programs')
    .select('program_holder_id')
    .eq('program_id', program.id)
    .eq('status', 'active');
  if (assignmentError) throw new Error('Application copy assignments could not load.');
  const ids = [...new Set((assignments || []).map((row) => row.program_holder_id))];
  if (!ids.length) return;
  const { data: holders, error: holderError } = await db
    .from('program_holders')
    .select('id,status,contact_email,features')
    .in('id', ids)
    .in('status', ['active', 'approved']);
  if (holderError) throw new Error('Application copy recipients could not load.');
  for (const holder of holders || []) {
    if (
      holder.features?.application_copies !== true ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(holder.contact_email || '')
    )
      continue;
    const { data: existing, error: existingError } = await db
      .from('program_holder_students')
      .select('id')
      .eq('program_holder_id', holder.id)
      .eq('application_id', application.id)
      .maybeSingle();
    if (existingError) throw new Error('Application copy could not be checked.');
    if (!existing) {
      const { error } = await db
        .from('program_holder_students')
        .insert({
          program_holder_id: holder.id,
          application_id: application.id,
          program_id: program.id,
          user_id: application.userId || null,
          student_id: application.userId || null,
          applicant_name: application.name,
          applicant_email: application.email,
          applicant_phone: application.phone,
          status: 'applicant',
          application_status: 'submitted',
        });
      if (error && error.code !== '23505') throw new Error('Application copy could not be saved.');
    }
    const subject = `Application copy [${application.id}]: ${program.title}`;
    const { data: sent, error: sentError } = await db
      .from('email_logs')
      .select('id')
      .eq('recipient_email', holder.contact_email)
      .eq('subject', subject)
      .in('status', ['accepted', 'sent', 'delivered'])
      .limit(1);
    if (sentError) throw new Error('Application copy delivery history could not load.');
    if (sent?.length) continue;
    const result = await sendEmail({
      to: holder.contact_email,
      subject,
      replyTo: application.email,
      singleAttempt: true,
      html: `<h2>New application: ${escape(program.title)}</h2><p><strong>Name:</strong> ${escape(application.name)}</p><p><strong>Email:</strong> ${escape(application.email)}</p><p><strong>Phone:</strong> ${escape(application.phone)}</p><p><strong>Application:</strong> ${escape(application.id)}</p><p><a href="https://app.elevateforhumanity.org/program-holder/students/pending">Open your applications dashboard</a></p>`,
    });
    if (!result.success)
      logger.error('[applications] program holder copy email failed', undefined, {
        applicationId: application.id,
        holderId: holder.id,
        error: result.error,
      });
  }
}
