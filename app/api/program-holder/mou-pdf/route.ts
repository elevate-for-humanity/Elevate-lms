import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createRouteHandlerClient } from '@/lib/auth';
import { generateMOUPDF } from '@/lib/mou-pdf-generator';

// Use Node.js runtime for PDF generation

export async function GET() {
  const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get user's program holder
  const { data: prof } = await supabase
    .from('user_profiles')
    .select('program_holder_id')
    .eq('user_id', user.id)
    .single();

  if (!prof?.program_holder_id) {
    return new Response('No program holder found', { status: 404 });
  }

  // Get program holder details
  const { data: holder, error } = await supabase
    .from('program_holders')
    .select(
      `
      id,
      name,
      payout_share,
      application:program_holder_applications(
        contact_name,
        contact_email,
        phone,
        site_address
      )
    `
    )
    .eq('id', prof.program_holder_id)
    .single();

  if (error || !holder) {
    return new Response('Program holder not found', { status: 404 });
  }

  // Generate PDF
  const pdfBytes = await generateMOUPDF({
    programHolderName: holder.name,
    payoutShare: holder.payout_share || 0.333,
    contactName: holder.application?.[0]?.contact_name,
    contactEmail: holder.application?.[0]?.contact_email,
    phone: holder.application?.[0]?.phone,
    siteAddress: holder.application?.[0]?.site_address,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  });

  const filename = `EFH_MOU_${holder.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  return new Response(pdfBytes as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
