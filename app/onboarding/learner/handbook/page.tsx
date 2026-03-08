'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { recordHandbookAcknowledgment } from '@/lib/compliance/enforcement';
import { ArrowLeft, CheckCircle2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const HANDBOOK_VERSION = '2025.1';

interface HandbookSection {
  id: string;
  title: string;
  content: string;
}

const HANDBOOK_SECTIONS: HandbookSection[] = [
  {
    id: 'attendance',
    title: 'Attendance Policy',
    content: `Students must maintain a minimum 80% attendance rate for both Related Technical Instruction (RTI) and On-the-Job Training (OJT) sessions.

Attendance is tracked daily. If you will be absent, you must notify your instructor within 24 hours.

Three (3) unexcused absences may result in academic probation. Two (2) consecutive unexcused absences will trigger an intervention meeting with your advisor.

Make-up work for missed sessions must be completed within one (1) week of the absence.

Chronic tardiness: Three (3) or more late arrivals per month counts as one (1) unexcused absence.

If you are experiencing transportation, childcare, health, or other barriers to attendance, contact your case manager immediately. Supportive services may be available.`,
  },
  {
    id: 'dress-code',
    title: 'Dress Code',
    content: `Professional attire is required during all clinical, practical, and OJT sessions.

General requirements:
- Closed-toe shoes are required in all lab and training environments
- No open-toed sandals, flip-flops, or slides in any training area
- Clothing must be clean, in good repair, and appropriate for a professional setting
- No offensive graphics, language, or imagery on clothing

Program-specific requirements:
- Healthcare programs: Scrubs and closed-toe shoes required during clinical sessions
- Skilled trades programs: Steel-toe boots, safety glasses, and hard hats as required by the training site
- Barber programs: All-black attire and closed-toe shoes
- CDL programs: Long pants and closed-toe boots required

Personal protective equipment (PPE) will be provided where required. Students must wear all required PPE at all times in designated areas.

Failure to comply with the dress code may result in being sent home for the day, which counts as an unexcused absence.`,
  },
  {
    id: 'conduct',
    title: 'Student Code of Conduct',
    content: `All students are expected to maintain professional conduct at all times — in the classroom, online, and at employer partner sites.

Expected behavior:
- Treat all instructors, staff, and fellow students with respect and dignity
- Complete all assignments and assessments honestly — all work must be your own
- Follow all safety protocols and procedures without exception
- Arrive on time and prepared for each session
- Participate actively in class discussions and group activities
- Keep your phone silenced during instruction time
- Maintain a clean and organized workspace

Prohibited behavior:
- Academic dishonesty: plagiarism, cheating, or submitting another person's work as your own
- Harassment, bullying, or discrimination of any kind
- Possession or use of drugs or alcohol during any training activity
- Possession of weapons on any training site
- Theft or destruction of property
- Disruptive behavior that interferes with instruction
- Unauthorized recording of classes or training sessions

Consequences:
- First offense: Written warning and meeting with advisor
- Second offense: Academic probation and mandatory counseling
- Third offense: Suspension or dismissal from the program

Serious violations (violence, drug use, theft) may result in immediate dismissal without prior warning.`,
  },
  {
    id: 'safety',
    title: 'Safety Protocols',
    content: `Student safety is our highest priority. All students must follow safety protocols at all times.

General safety:
- Report any unsafe conditions to your instructor immediately
- Know the location of emergency exits, fire extinguishers, and first aid kits
- Follow all posted safety signs and instructions
- Do not operate equipment without proper training and authorization
- Report all injuries, no matter how minor, to your instructor immediately

Lab and shop safety:
- Wear all required personal protective equipment (PPE) at all times
- No horseplay or running in lab or shop areas
- Keep work areas clean and free of hazards
- Follow lockout/tagout procedures for all equipment
- Never work alone in a lab or shop without instructor supervision

Healthcare clinical safety:
- Follow universal precautions and infection control procedures
- Properly dispose of sharps and biohazardous materials
- Wash hands before and after patient contact
- Report any exposure incidents immediately

Drug and alcohol policy:
- Students must be free from the influence of drugs and alcohol during all training activities
- Some employer partners require pre-employment drug screening and background checks
- A positive drug test or refusal to test may result in dismissal from the program and loss of funding eligibility

Emergency procedures:
- In case of fire: evacuate immediately using the nearest exit, do not use elevators
- In case of medical emergency: call 911, then notify your instructor
- In case of severe weather: follow instructor directions to designated shelter areas`,
  },
  {
    id: 'grievance',
    title: 'Grievance Procedures',
    content: `If you have a concern, complaint, or believe you have been treated unfairly, you have the right to file a grievance. You will not face retaliation for filing a complaint.

Step 1 — Informal Resolution:
Talk to your instructor or advisor. Most issues can be resolved through direct conversation. Your instructor will document the discussion and any agreed-upon resolution.

Step 2 — Written Grievance:
If the issue is not resolved informally, submit a written grievance through the student portal at elevateforhumanity.org/support/grievance or by emailing info@elevateforhumanity.org. Include:
- Your name and contact information
- Date and description of the incident
- Names of any witnesses
- Resolution you are seeking

Step 3 — Program Director Review:
The program director will review your grievance and respond in writing within five (5) business days. The director may request a meeting with all parties involved.

Step 4 — Appeal:
If you are not satisfied with the program director's response, you may appeal in writing to the executive director within ten (10) business days. The executive director's decision is final.

External complaints:
If your grievance involves discrimination, you may also file a complaint with:
- Indiana Civil Rights Commission: (317) 232-2600
- U.S. Department of Education Office for Civil Rights: (312) 730-1560
- Equal Employment Opportunity Commission (EEOC): (800) 669-4000

All grievance records are maintained for a minimum of three (3) years.`,
  },
];

export default function HandbookPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyAcknowledged, setAlreadyAcknowledged] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['attendance']));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { router.push('/login'); return; }

    supabase.auth.getUser().then(({ data, error: authErr }) => {
      if (authErr || !data?.user) { router.push('/login'); return; }
      setUserId(data.user.id);

      fetch('/api/compliance/record?type=handbook')
        .then(res => res.json())
        .then(result => {
          if (result.data && result.data.length > 0) setAlreadyAcknowledged(true);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [router]);

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

  const toggleAcknowledge = (id: string) => {
    const next = new Set(acknowledged);
    if (next.has(id)) next.delete(id); else next.add(id);
    setAcknowledged(next);

    // Auto-expand next unacknowledged section
    if (!next.has(id)) return;
    const currentIdx = HANDBOOK_SECTIONS.findIndex(s => s.id === id);
    for (let i = currentIdx + 1; i < HANDBOOK_SECTIONS.length; i++) {
      if (!next.has(HANDBOOK_SECTIONS[i].id)) {
        const expandNext = new Set(expanded);
        expandNext.add(HANDBOOK_SECTIONS[i].id);
        setExpanded(expandNext);
        break;
      }
    }
  };

  const allAcknowledged = HANDBOOK_SECTIONS.every(s => acknowledged.has(s.id));

  const handleSubmit = async () => {
    if (!allAcknowledged || !userId) return;
    setSubmitting(true);
    setError('');

    const result = await recordHandbookAcknowledgment({
      userId,
      handbookVersion: HANDBOOK_VERSION,
    });

    if (result.success) {
      setAlreadyAcknowledged(true);
    } else {
      setError(result.error || 'Failed to record acknowledgment');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* VIDEO HERO — full bleed, no text on top */}
      <div className="relative w-full" style={{ height: '55vh', minHeight: 280, maxHeight: 480 }}>
        <video src="/videos/elevate-overview-with-narration.mp4" autoPlay loop playsInline className="w-full h-full object-cover" />
      </div>
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Onboarding', href: '/onboarding/learner' },
            { label: 'Student Handbook' },
          ]} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/onboarding/learner" className="text-sm text-brand-blue-600 flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-7 h-7 text-brand-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Student Handbook</h1>
        </div>
        <p className="text-gray-600 mb-6">
          Read each section below and check the box to confirm you have read and understand the policy.
          You must acknowledge all {HANDBOOK_SECTIONS.length} sections to complete this step.
        </p>

        {alreadyAcknowledged && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-slate-500" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Handbook Acknowledged</h2>
              <p className="text-slate-500 text-sm">You have acknowledged all sections of the student handbook.</p>
            </div>
            <Link href="/onboarding/learner" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 flex-shrink-0">
              Continue <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        )}

        {!alreadyAcknowledged && (
          <>
            {/* Progress */}
            <div className="bg-white border rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Sections Acknowledged</span>
                <span className="text-gray-500">{acknowledged.size} of {HANDBOOK_SECTIONS.length}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${(acknowledged.size / HANDBOOK_SECTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-3">
              {HANDBOOK_SECTIONS.map((section) => {
                const isExpanded = expanded.has(section.id);
                const isAcked = acknowledged.has(section.id);

                return (
                  <div key={section.id} className={`bg-white border rounded-xl overflow-hidden ${isAcked ? 'border-brand-blue-200' : 'border-gray-200'}`}>
                    <button
                      type="button"
                      onClick={() => toggleExpand(section.id)}
                      className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50"
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isAcked ? 'bg-brand-blue-100' : 'bg-gray-100'}`}>
                        {isAcked ? <CheckCircle2 className="w-4 h-4 text-brand-blue-600" /> : <BookOpen className="w-4 h-4 text-gray-400" />}
                      </div>
                      <span className={`flex-1 font-semibold ${isAcked ? 'text-brand-blue-900' : 'text-gray-900'}`}>
                        {section.title}
                      </span>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 px-4 pb-4">
                        <div className="bg-slate-50 rounded-lg p-4 mt-3 mb-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                          {section.content}
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
                          <input
                            type="checkbox"
                            checked={isAcked}
                            onChange={() => toggleAcknowledge(section.id)}
                            className="mt-0.5 w-5 h-5 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            I have read and understand the <strong>{section.title}</strong>
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit */}
            {error && (
              <div className="mt-4 bg-brand-red-50 border border-brand-red-200 rounded-lg p-3 text-brand-red-700 text-sm">{error}</div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={handleSubmit}
                disabled={!allAcknowledged || submitting}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                  allAcknowledged && !submitting
                    ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Submitting...' : `Acknowledge All ${HANDBOOK_SECTIONS.length} Sections`}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Version {HANDBOOK_VERSION} — Your acknowledgment is recorded with timestamp for compliance purposes.
              </p>
            </div>
          </>
        )}

        {/* Full handbook link */}
        <div className="mt-8 text-center">
          <Link href="/student-handbook" className="text-brand-blue-600 text-sm hover:underline">
            View the complete Student Handbook →
          </Link>
        </div>
      </div>
    </div>
  );
}
