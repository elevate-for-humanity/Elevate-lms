import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import TransferRequestForm from './TransferRequestForm';

export const metadata: Metadata = {
  title: 'Request Hour Transfer | Apprentice Portal',
  description: 'Submit a request to transfer hours from previous training or employment.',
};

export const dynamic = 'force-dynamic';

export default async function TransferRequestPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) {
    redirect('/login');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/transfer-hours/request');
  }

  // Get apprentice profile
  const { data: apprentice } = await db
    .from('apprentices')
    .select('*, program:program_id(name, total_hours, allows_transfer)')
    .eq('user_id', user.id)
    .single();

  if (!apprentice) {
    redirect('/apprentice');
  }

  // Get existing documents for this apprentice
  const { data: existingDocs } = await db
    .from('documents')
    .select('id, document_type, file_name, status')
    .eq('user_id', user.id)
    .in('document_type', [
      'school_transcript',
      'certificate',
      'out_of_state_license',
      'employment_verification',
    ]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <a
            href="/apprentice/transfer-hours"
            className="text-brand-blue-600 hover:text-brand-blue-700 text-sm mb-4 inline-block"
          >
            ← Back to Transfer Hours
          </a>
          <h1 className="text-2xl font-bold">Request Hour Transfer</h1>
          <p className="text-gray-600">
            Submit documentation to request transfer of hours from previous training
          </p>
        </div>

        <TransferRequestForm
          apprenticeId={apprentice.id}
          programName={apprentice.program?.name || 'Program'}
          maxTransferHours={Math.floor((apprentice.program?.total_hours || 2000) * 0.5)}
          existingDocuments={existingDocs || []}
        />
      </div>
    </div>
  );
}
