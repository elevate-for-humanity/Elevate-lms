import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Scale, Users, Accessibility, FileText, ArrowRight, Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Federal Compliance Policy | Elevate for Humanity',
  description: 'Our commitment to compliance with FERPA, Title IX, ADA, WIOA, and other federal regulations.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/federal-compliance',
  },
};

export default function FederalCompliancePage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Federal Compliance" }]} />
      </div>
{/* Hero */}
      <section className="relative min-h-[400px] flex items-center overflow-hidden">
        <Image
          src="/images/heroes/training-provider-2.jpg"
          alt="Federal Compliance"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 w-full">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-500 text-white text-sm font-semibold rounded-full mb-6">
              <Shield className="w-4 h-4" />
              Compliance
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Federal Compliance Policy</h1>
            <p className="text-xl text-brand-blue-100">
              Elevate for Humanity maintains full compliance with all applicable federal laws governing educational institutions and workforce development programs.
            </p>
            <p className="text-sm text-brand-blue-200 mt-4">Effective Date: January 1, 2025 | Last Updated: January 2026</p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Policy Statement</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              Elevate for Humanity ("the Institution") is committed to maintaining full compliance with all applicable federal laws, regulations, and guidelines that govern educational institutions and workforce development programs. As a recipient of federal funding through the Workforce Innovation and Opportunity Act (WIOA) and other federal programs, we recognize our responsibility to uphold the highest standards of legal and ethical conduct.
            </p>
            <p>
              This policy establishes our framework for ensuring compliance with key federal statutes including the Family Educational Rights and Privacy Act (FERPA), Title IX of the Education Amendments of 1972, the Americans with Disabilities Act (ADA), Section 504 of the Rehabilitation Act, and the Workforce Innovation and Opportunity Act (WIOA). All employees, contractors, and partners are required to understand and adhere to these requirements.
            </p>
          </div>
        </section>

        {/* FERPA Section */}
        <section className="mb-12 bg-brand-blue-50 rounded-2xl p-8 border-2 border-brand-blue-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-brand-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">FERPA Compliance</h2>
              <p className="text-gray-600">Family Educational Rights and Privacy Act</p>
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              The Family Educational Rights and Privacy Act (FERPA) is a federal law that protects the privacy of student education records. FERPA applies to all schools that receive funds under an applicable program of the U.S. Department of Education. Elevate for Humanity fully complies with FERPA requirements.
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Student Rights Under FERPA</h3>
            <p>Under FERPA, eligible students have the following rights:</p>
            <p>
              <strong>Right to Inspect and Review:</strong> Students have the right to inspect and review their education records maintained by the Institution. The Institution will comply with requests within 45 days of receiving a written request. Students should submit written requests to the Registrar identifying the records they wish to inspect.
            </p>
            <p>
              <strong>Right to Request Amendment:</strong> Students have the right to request amendment of education records they believe are inaccurate, misleading, or in violation of their privacy rights. Students should submit a written request to the Registrar clearly identifying the part of the record they want changed and specifying why it should be changed.
            </p>
            <p>
              <strong>Right to Consent to Disclosures:</strong> Students have the right to consent to disclosures of personally identifiable information contained in their education records, except to the extent that FERPA authorizes disclosure without consent. One exception permits disclosure to school officials with legitimate educational interests.
            </p>
            <p>
              <strong>Right to File a Complaint:</strong> Students have the right to file a complaint with the U.S. Department of Education concerning alleged failures by the Institution to comply with FERPA requirements. Complaints may be filed with the Family Policy Compliance Office, U.S. Department of Education, 400 Maryland Avenue SW, Washington, DC 20202.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Directory Information</h3>
            <p>
              The Institution may disclose "directory information" without prior consent unless the student has opted out. Directory information includes: student name, address, telephone number, email address, photograph, program of study, enrollment status, dates of attendance, degrees and certificates awarded, and honors received. Students may opt out of directory information disclosure by submitting a written request to the Registrar within 14 days of enrollment.
            </p>
          </div>
          
          <Link href="/policies/ferpa" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition">
            View Complete FERPA Policy <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        {/* Title IX Section */}
        <section className="mb-12 bg-brand-blue-50 rounded-2xl p-8 border-2 border-brand-blue-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center">
              <Scale className="w-7 h-7 text-brand-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Title IX Compliance</h2>
              <p className="text-gray-600">Education Amendments of 1972</p>
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              Title IX of the Education Amendments of 1972 prohibits discrimination on the basis of sex in any education program or activity receiving federal financial assistance. Elevate for Humanity does not discriminate on the basis of sex in its educational programs, activities, or employment practices.
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Scope of Protection</h3>
            <p>
              Title IX protects students, employees, applicants for admission and employment, and other persons from all forms of sex discrimination, including discrimination based on gender identity or failure to conform to stereotypical notions of masculinity or femininity. Title IX also prohibits sexual harassment, which includes sexual violence, and gender-based harassment.
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Prohibited Conduct</h3>
            <p>The following conduct is prohibited under Title IX:</p>
            <p>
              <strong>Sexual Harassment:</strong> Unwelcome conduct of a sexual nature, including unwelcome sexual advances, requests for sexual favors, and other verbal, nonverbal, or physical conduct of a sexual nature. This includes conduct that is sufficiently severe, persistent, or pervasive to limit a student's ability to participate in or benefit from an education program or activity.
            </p>
            <p>
              <strong>Sexual Violence:</strong> Physical sexual acts perpetrated against a person's will or where a person is incapable of giving consent. This includes rape, sexual assault, sexual battery, sexual abuse, and sexual coercion.
            </p>
            <p>
              <strong>Gender-Based Harassment:</strong> Unwelcome conduct based on a student's sex, including harassment based on gender identity, gender expression, or nonconformity with gender stereotypes.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Title IX Coordinator</h3>
            <p>
              The Institution has designated a Title IX Coordinator to oversee compliance with Title IX requirements. The Title IX Coordinator is responsible for coordinating the Institution's efforts to comply with Title IX, including investigating complaints of sex discrimination and sexual harassment.
            </p>
            <div className="bg-white rounded-lg p-4 mt-4">
              <p className="font-semibold text-gray-900">Title IX Coordinator Contact:</p>
              <p>Email: elevate4humanityedu@gmail.com</p>
              <p>Phone: (317) 314-3757</p>
            </div>
          </div>
        </section>

        {/* ADA Section */}
        <section className="mb-12 bg-green-50 rounded-2xl p-8 border-2 border-green-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <Accessibility className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">ADA & Section 504 Compliance</h2>
              <p className="text-gray-600">Americans with Disabilities Act & Rehabilitation Act</p>
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              The Americans with Disabilities Act (ADA) and Section 504 of the Rehabilitation Act prohibit discrimination against individuals with disabilities. Elevate for Humanity is committed to providing equal access to all programs, services, and activities for individuals with disabilities.
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Reasonable Accommodations</h3>
            <p>
              The Institution provides reasonable accommodations to qualified individuals with disabilities to ensure equal access to educational programs and employment opportunities. Reasonable accommodations are modifications or adjustments that enable individuals with disabilities to perform essential functions or enjoy equal benefits and privileges.
            </p>
            <p>
              Examples of reasonable accommodations include: extended time on examinations, alternative testing formats, note-taking assistance, sign language interpreters, accessible course materials, assistive technology, modified schedules, and physical accessibility modifications.
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Requesting Accommodations</h3>
            <p>
              Students and employees seeking accommodations should contact the Disability Services Coordinator. Requests should be made as early as possible to allow adequate time for review and implementation. Documentation of the disability may be required to support accommodation requests.
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Physical and Digital Accessibility</h3>
            <p>
              The Institution maintains physically accessible facilities in compliance with ADA Accessibility Guidelines. Our digital platforms, including the learning management system and website, are designed to meet Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
            </p>
          </div>
          
          <Link href="/accessibility" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
            View Accessibility Statement <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        {/* WIOA Section */}
        <section className="mb-12 bg-orange-50 rounded-2xl p-8 border-2 border-orange-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">WIOA Compliance</h2>
              <p className="text-gray-600">Workforce Innovation and Opportunity Act</p>
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              The Workforce Innovation and Opportunity Act (WIOA) is the primary federal workforce development legislation. As a WIOA-approved Eligible Training Provider, Elevate for Humanity complies with all WIOA requirements regarding program delivery, participant eligibility, data collection, and performance reporting.
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Equal Opportunity Requirements</h3>
            <p>
              WIOA Section 188 prohibits discrimination against individuals in any WIOA Title I-financially assisted program or activity on the basis of race, color, religion, sex, national origin, age, disability, political affiliation or belief, and for beneficiaries, applicants, and participants only, on the basis of citizenship status or participation in a WIOA Title I-financially assisted program or activity.
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Data Collection and Privacy</h3>
            <p>
              The Institution collects participant data as required by WIOA for eligibility determination and performance reporting. All data is collected, stored, and transmitted in compliance with applicable privacy laws and WIOA data security requirements. Participant information is used only for authorized purposes and is protected from unauthorized disclosure.
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Performance Accountability</h3>
            <p>
              The Institution tracks and reports performance outcomes as required by WIOA, including employment rates, median earnings, credential attainment, and measurable skill gains. Performance data is reported to the Indiana Department of Workforce Development and is publicly available on the Eligible Training Provider List.
            </p>
          </div>
          
          <Link href="/policies/wioa" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition">
            View Complete WIOA Policy <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        {/* Reporting and Contact */}
        <section className="bg-gray-900 text-white rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Reporting Compliance Concerns</h2>
          <p className="text-gray-300 mb-6">
            If you believe the Institution has violated any federal compliance requirement, you may report your concern through the following channels:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Internal Reporting</h3>
              <div className="space-y-2 text-gray-300">
                <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> elevate4humanityedu@gmail.com</p>
                <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> (317) 314-3757</p>
              </div>
              <Link href="/policies/grievance" className="inline-block mt-4 text-orange-400 hover:text-orange-300">
                View Grievance Procedure →
              </Link>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">External Reporting</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p>U.S. Department of Education Office for Civil Rights</p>
                <p>U.S. Department of Labor Civil Rights Center</p>
                <p>Indiana Civil Rights Commission</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
