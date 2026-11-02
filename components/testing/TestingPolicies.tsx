import { FileText, CheckCircle, Clock, AlertTriangle, Shield, Calendar } from 'lucide-react';
const POLICIES = [
  {
    icon: CheckCircle,
    title: 'ID Requirements',
    items: [
      "Valid government-issued photo ID required (driver's license, state ID, passport, or military ID)",
      'Name on ID must match the name on your exam registration',
      'Expired IDs will not be accepted',
      'Second form of ID may be requested for certain exams',
    ],
  },
  {
    icon: Calendar,
    title: 'Scheduling & Rescheduling',
    items: [
      'All exams require an appointment — walk-ins are not accepted',
      'Reschedule with at least 24 hours notice at no charge',
      'Rescheduling within 24 hours may result in a rescheduling fee',
      'Online booking requires at least 24 hours notice',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'No-Show & Cancellation Policy',
    items: [
      'No-shows forfeit their exam fee — no refunds issued',
      'Cancellations within 24 hours are treated as no-shows',
      'Medical emergencies: contact us within 48 hours with documentation',
      'Technical issues: contact us immediately to reschedule',
    ],
  },
  {
    icon: Shield,
    title: 'Testing Rules',
    items: [
      'No personal items in the testing room — secure storage provided',
      'Cell phones and smartwatches must be powered off',
      'No notes, books, or external references unless permitted',
      'Calculators permitted only for exams that allow them',
      'No talking or communication with other test-takers',
      'Proctors may dismiss test-takers for rule violations',
    ],
  },
  {
    icon: Clock,
    title: 'Arrival & Check-In',
    items: [
      'Arrive 15 minutes before your scheduled exam time',
      'Late arrivals may not be admitted — no refunds for late arrivals',
      'Check-in includes identity verification and palm scan/photo',
      'Break policy varies by exam — check with proctor before starting',
    ],
  },
  {
    icon: FileText,
    title: 'Results & Certificates',
    items: [
      'Most exams provide immediate results upon completion',
      'Digital certificates typically issued within 24-48 hours of passing',
      'Physical certificates may be mailed for an additional fee',
      'Official score reports available upon request',
    ],
  },
];

export default function TestingPolicies() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {POLICIES.map((policy) => (
        <details key={policy.title} className="rounded-xl border border-slate-200 bg-white p-5">
          <summary className="cursor-pointer font-bold text-slate-950">{policy.title}</summary>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            {policy.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
