import type { UploadedW9Status } from '@/lib/program-holder/document-review';

export function UploadedW9Review({ status }: { status: UploadedW9Status }) {
  const messages: Record<UploadedW9Status, string> = {
    approved: 'W-9 uploaded and approved in Elevate. No replacement upload is needed.',
    pending: 'W-9 uploaded to Elevate; document review is pending.',
    rejected: 'W-9 uploaded to Elevate; corrections were requested. Review the document notes.',
    missing: 'No W-9 upload is recorded in Elevate.',
  };
  return <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
    <p className="font-bold">{messages[status]}</p>
    <p className="mt-2">QuickBooks tax information and banking verification are separate. An approved Elevate upload does not confirm that QuickBooks has received the form. Elevate must reconcile its existing W-9 with the contractor record before requesting another copy.</p>
  </div>;
}
