'use client';

import {
  Clock, DollarSign, Award, Users, MapPin, BookOpen,
  Shield, Briefcase, GraduationCap, FileText, Phone,
  Globe, HelpCircle, BarChart3, AlertTriangle, Wrench,
  Calendar, CheckCircle2, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export interface ProgramCredential {
  name: string;
  issuingBody: string;
  examFeeIncluded: boolean;
}

export interface LOCProgramSpec {
  slug: string;
  name: string;
  totalWeeks: number | string;
  totalHours: number | string;
  rtiHours: number | string;
  ojtHours: number | string;
  credentials: ProgramCredential[];
  nextLevelJobsEligible: boolean;
  cohortSchedule: string;
  cohortSizeMin: number;
  cohortSizeMax: number;
  admissionsRequirements: string[];
  modality: string;
  labLocation: string;
  equipmentIncluded: string[];
  bilingualSupport: boolean;
  tutoringAvailable: boolean;
  attendanceTracking: string;
  alertEscalationProcess: string;
  progressReportFrequency: string;
  progressReportFormat: string;
  workBasedLearning: string;
  employerPartners: string[];
  placementRate?: string;
  retentionTracking: string;
  costPerParticipant: number;
  costPerCohort?: number;
  examFeesIncluded: boolean;
  materialsIncluded: string[];
  paymentTerms: string;
  syllabusUrl?: string;
  brochureUrl?: string;
}

function Section({ icon: Icon, title, children, id }: { icon: React.ElementType; title: string; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-brand-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DataRow({ label, value, highlight }: { label: string; value: string | React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 flex-shrink-0 mr-4">{label}</span>
      <span className={`text-sm font-medium text-right ${highlight ? 'text-brand-green-700' : 'text-slate-900'}`}>{value}</span>
    </div>
  );
}

export default function ProgramSpecSheet({ spec }: { spec: LOCProgramSpec }) {
  return (
    <section className="py-12 bg-slate-50" id="program-details">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="inline-block bg-brand-blue-100 text-brand-blue-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            Program Specifications
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {spec.name} — Program Details
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Workforce partner reference sheet — all fields per LOC/WorkOne requirements
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Program Overview */}
          <Section icon={BookOpen} title="Program Overview" id="spec-overview">
            <DataRow label="Program" value={spec.name} />
            <DataRow label="Duration" value={typeof spec.totalWeeks === 'number' ? `${spec.totalWeeks} weeks` : spec.totalWeeks} />
            <DataRow label="Total Hours" value={typeof spec.totalHours === 'number' ? `${spec.totalHours} hours` : spec.totalHours} />
            <DataRow label="RTI (Classroom/Lab)" value={typeof spec.rtiHours === 'number' ? `${spec.rtiHours} hours` : spec.rtiHours} />
            <DataRow label="OJT (Employer Site)" value={typeof spec.ojtHours === 'number' ? `${spec.ojtHours} hours` : spec.ojtHours} />
            <DataRow label="Modality" value={spec.modality} />
            <DataRow label="Next Level Jobs Eligible" value={spec.nextLevelJobsEligible ? '✅ Yes' : 'No'} highlight={spec.nextLevelJobsEligible} />
          </Section>

          {/* Schedule & Cohort */}
          <Section icon={Calendar} title="Schedule & Cohort" id="spec-schedule">
            <DataRow label="Schedule" value={spec.cohortSchedule} />
            <DataRow label="Min Cohort Size" value={`${spec.cohortSizeMin} participants`} />
            <DataRow label="Max Cohort Size" value={`${spec.cohortSizeMax} participants`} />
            <DataRow label="Location" value={spec.labLocation} />
          </Section>

          {/* Credentials */}
          <Section icon={Award} title="Credentials Awarded" id="spec-credentials">
            <div className="space-y-3">
              {spec.credentials.map((cred, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{cred.name}</p>
                      <p className="text-xs text-slate-500">Issued by: {cred.issuingBody}</p>
                      <p className="text-xs text-brand-green-600">
                        Exam fee: {cred.examFeeIncluded ? 'Included in program cost' : 'Not included'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Admissions */}
          <Section icon={Users} title="Admissions Requirements" id="spec-admissions">
            <ul className="space-y-2">
              {spec.admissionsRequirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 bg-brand-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                  {req}
                </li>
              ))}
            </ul>
          </Section>

          {/* Facilities & Equipment */}
          <Section icon={Wrench} title="Facilities & Equipment" id="spec-facilities">
            <DataRow label="Training Location" value={spec.labLocation} />
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Included Equipment & Materials</p>
              <div className="flex flex-wrap gap-2">
                {spec.equipmentIncluded.map((item, i) => (
                  <span key={i} className="inline-block bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </Section>

          {/* Student Support */}
          <Section icon={HelpCircle} title="Student Support Services" id="spec-support">
            <DataRow label="Bilingual Support (Spanish)" value={spec.bilingualSupport ? '✅ Available' : 'Not available'} highlight={spec.bilingualSupport} />
            <DataRow label="Tutoring / Academic Support" value={spec.tutoringAvailable ? '✅ Available' : 'Not available'} highlight={spec.tutoringAvailable} />
            <DataRow label="Attendance Tracking" value={spec.attendanceTracking} />
            <DataRow label="Alert / Escalation to LOC" value={spec.alertEscalationProcess} />
          </Section>

          {/* Reporting */}
          <Section icon={BarChart3} title="Reporting & Compliance" id="spec-reporting">
            <DataRow label="Progress Reports" value={spec.progressReportFrequency} />
            <DataRow label="Report Format" value={spec.progressReportFormat} />
            <DataRow label="Work-Based Learning" value={spec.workBasedLearning} />
            <DataRow label="Retention Tracking" value={spec.retentionTracking} />
          </Section>

          {/* Career Outcomes */}
          <Section icon={Briefcase} title="Career Outcomes & Employer Partners" id="spec-outcomes">
            {spec.placementRate && (
              <DataRow label="Placement Rate" value={spec.placementRate} highlight />
            )}
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Employer Partners / Hiring Pipeline</p>
              {spec.employerPartners.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {spec.employerPartners.map((emp, i) => (
                    <span key={i} className="inline-block bg-brand-blue-50 text-brand-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {emp}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Employer partner list provided upon LOC engagement</p>
              )}
            </div>
          </Section>

          {/* Pricing */}
          <Section icon={DollarSign} title="Pricing & Payment" id="spec-pricing">
            <DataRow label="Cost Per Participant" value={`$${spec.costPerParticipant.toLocaleString()}`} />
            {spec.costPerCohort && (
              <DataRow label="Cost Per Cohort" value={`$${spec.costPerCohort.toLocaleString()}`} />
            )}
            <DataRow label="Exam Fees" value={spec.examFeesIncluded ? 'Included' : 'Not included'} highlight={spec.examFeesIncluded} />
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Included in Cost</p>
              <div className="flex flex-wrap gap-2">
                {spec.materialsIncluded.map((item, i) => (
                  <span key={i} className="inline-block bg-brand-green-50 text-brand-green-700 text-xs px-2.5 py-1 rounded-full">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <DataRow label="Payment Terms" value={spec.paymentTerms} />
            </div>
          </Section>

          {/* Documents */}
          <Section icon={FileText} title="Documents & Resources" id="spec-documents">
            <div className="space-y-3">
              {spec.syllabusUrl ? (
                <Link href={spec.syllabusUrl} className="flex items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                  <FileText className="w-4 h-4" /> Download Syllabus
                </Link>
              ) : (
                <Link href={`/contact?subject=${encodeURIComponent(spec.name + ' Syllabus Request')}`} className="flex items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                  <FileText className="w-4 h-4" /> Request Syllabus
                </Link>
              )}
              {spec.brochureUrl ? (
                <Link href={spec.brochureUrl} className="flex items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                  <FileText className="w-4 h-4" /> Download Brochure
                </Link>
              ) : (
                <Link href={`/contact?subject=${encodeURIComponent(spec.name + ' Brochure Request')}`} className="flex items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                  <FileText className="w-4 h-4" /> Request Brochure
                </Link>
              )}
              <Link href="/contact" className="flex items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                <Phone className="w-4 h-4" /> Contact Program Director
              </Link>
            </div>
          </Section>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href={`/apply?program=${spec.slug}`}
            className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg"
          >
            Apply for {spec.name} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
