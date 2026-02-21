import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Users } from 'lucide-react';
import BecomeMentorForm from './BecomeMentorForm';

export const metadata: Metadata = {
  title: 'Become a Mentor | Elevate for Humanity',
  description: 'Volunteer as a mentor to guide students through career training programs. Share your industry experience with the next generation of workers.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/mentorship/become-mentor' },
};

export default function BecomeMentorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Mentorship', href: '/mentorship' },
            { label: 'Become a Mentor' },
          ]} />
        </div>
      </div>

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
          <h1 className="text-4xl font-bold mb-4">Become a Mentor</h1>
          <p className="text-xl text-slate-300">
            Share your experience. Help someone launch their career.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Why Mentor?</h2>
              <p className="text-slate-600 mb-4">
                Our students are adults entering new careers — barbers, HVAC technicians, CNAs,
                CDL drivers, IT professionals. Many are first-generation workers in their field.
                A mentor who has walked the path makes a real difference.
              </p>
              <p className="text-slate-600">
                Mentors meet with students 1–2 times per month (in person or virtual) to provide
                guidance on career decisions, workplace expectations, and professional development.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">What Mentors Do</h2>
              <ul className="space-y-3">
                {[
                  'Share industry knowledge and career advice',
                  'Help students set realistic goals and timelines',
                  'Review resumes and practice interview skills',
                  'Provide accountability during training',
                  'Connect students to professional networks',
                  'Offer guidance on workplace culture and expectations',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Requirements</h2>
              <ul className="space-y-2 text-slate-600">
                <li>• 3+ years of experience in your field</li>
                <li>• Willingness to commit 2–4 hours per month for at least 6 months</li>
                <li>• Pass a background check</li>
                <li>• Attend a 1-hour mentor orientation session</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Program Areas</h2>
              <div className="flex flex-wrap gap-2">
                {[
                  'Barbering', 'HVAC', 'CDL/Trucking', 'CNA/Healthcare',
                  'Electrical', 'Welding', 'IT/Cybersecurity', 'Tax Preparation',
                  'Business/Entrepreneurship', 'Esthetics',
                ].map((area) => (
                  <span key={area} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                    {area}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div>
            <BecomeMentorForm />
          </div>
        </div>
      </div>
    </div>
  );
}
