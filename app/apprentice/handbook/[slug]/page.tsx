import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

const SECTION_CONTENT: Record<string, { title: string; content: string }> = {
  introduction: {
    title: 'Welcome & Introduction',
    content: `Welcome to the Elevate for Humanity Apprenticeship Program!

This handbook is your comprehensive guide to successfully completing your apprenticeship. Here you'll find everything you need to know about program requirements, policies, and resources.

## What is an Apprenticeship?

An apprenticeship is a structured training program that combines on-the-job learning with related technical instruction. As an apprentice, you'll work under the supervision of experienced professionals while completing required training hours.

## Your Journey

Your apprenticeship journey includes:
- **On-the-Job Training (OJT):** Hands-on work experience at your training site
- **Related Technical Instruction (RTI):** Classroom or online learning to complement your practical skills
- **Skills Competencies:** Demonstrated proficiency in required techniques and procedures

## Getting Started

1. Review this handbook thoroughly
2. Acknowledge that you've read and understood the policies
3. Contact your program coordinator with any questions
4. Begin tracking your hours using the timeclock system

We're here to support your success every step of the way!`,
  },
  requirements: {
    title: 'Program Requirements',
    content: `To successfully complete your apprenticeship, you must meet the following requirements:

## Hour Requirements

- **Total Hours Required:** 2,000 hours of on-the-job training (OJT)
- **Related Technical Instruction (RTI):** As determined by your specific program
- **Minimum Progress Rate:** Consistent progress expected throughout the program

## Skills Competencies

You must demonstrate proficiency in all required skills, including:
- Safety procedures and protocols
- Tool usage and equipment operation
- Industry-specific techniques
- Professional communication

## Documentation Requirements

- Signed apprenticeship agreement
- Progress evaluations (quarterly minimum)
- Skills verification by supervisor
- Completion of all required RTI modules

## Time Limits

- **Minimum Duration:** As specified by your program (typically 12-24 months)
- **Maximum Duration:** Must complete within program guidelines
- **Extensions:** Available only with documented extenuating circumstances`,
  },
  policies: {
    title: 'Policies & Procedures',
    content: `Understanding and following these policies ensures a safe and productive learning environment.

## Attendance Policy

- Notify your supervisor and training coordinator of any absences
- Make up missed hours within the same pay period when possible
- Excessive absences may result in program termination

## Code of Conduct

- Maintain professional behavior at all times
- Treat colleagues, clients, and supervisors with respect
- Follow all workplace safety guidelines
- Maintain confidentiality of sensitive information

## Dress Code

- Wear appropriate work attire as required by your training site
- Follow safety equipment requirements (PPE)
- Maintain personal grooming standards

## Performance Reviews

- Quarterly evaluations with your supervisor
- Skills competency assessments
- Progress toward hour requirements
- Action plans for areas needing improvement

## Grievance Procedure

If you have concerns about your training:
1. Discuss with your immediate supervisor
2. Escalate to program coordinator if unresolved
3. Contact the main office for final resolution`,
  },
  safety: {
    title: 'Safety Guidelines',
    content: `Your safety is our top priority. Follow these guidelines at all times.

## General Safety

- Always be aware of your surroundings
- Report hazards immediately
- Never perform tasks without proper training
- Use all required personal protective equipment (PPE)

## Equipment Safety

- Only operate equipment you've been trained on
- Inspect tools before each use
- Report malfunctioning equipment immediately
- Follow lockout/tagout procedures

## Emergency Procedures

Know the location of:
- Emergency exits
- Fire extinguishers
- First aid kits
- Emergency contact numbers

## Workplace Hazards

Be aware of common hazards in your industry:
- Chemical exposure
- Electrical hazards
- Sharp tools and equipment
- Slips, trips, and falls

## Reporting Incidents

Report all injuries, near-misses, and safety concerns to your supervisor immediately, regardless of severity.`,
  },
  'logging-hours': {
    title: 'Logging Hours',
    content: `Accurate hour tracking is essential for program completion.

## Using the Timeclock

Your primary method for tracking hours is the timeclock system:
- Clock in when you begin work
- Clock out when you finish
- Take required breaks (do not clock out for short breaks)

## Hour Categories

- **OJT (On-the-Job Training):** Hours worked at your training site
- **RTI (Related Technical Instruction):** Classroom, online, or other structured learning

## Approval Process

1. Submit your hours through the timeclock
2. Your supervisor verifies your hours
3. Program coordinator approves hours
4. Hours are credited to your record

## Tips for Accurate Tracking

- Clock in/out at the correct times
- Report any discrepancies immediately
- Keep personal records as backup
- Review your hour statement regularly`,
  },
  'skills-assessment': {
    title: 'Skills Assessment',
    content: `Skills assessments verify your competency in required areas.

## Skills Checklist

Your program includes a skills checklist covering:
- Safety procedures
- Tool usage
- Technical skills specific to your trade
- Professional competencies

## Assessment Process

1. Your supervisor observes your work
2. Skills are marked as: Not Started, In Progress, or Verified
3. All skills must be verified before completion

## Getting Verified

- Ask your supervisor to observe you performing skills
- Document your work when possible
- Request feedback on areas needing improvement
- Practice challenging skills before assessment

## Appeals Process

If you disagree with a skills assessment:
1. Discuss with your supervisor
2. Request a second observation
3. Appeal to program coordinator if needed`,
  },
  resources: {
    title: 'Support Resources',
    content: `We're here to help you succeed. Here are your support resources:

## Program Coordinator

Your program coordinator can help with:
- Questions about requirements
- Scheduling concerns
- Workplace issues
- Progress tracking

## Technical Support

For issues with:
- Timeclock system
- Online learning platform
- Technical difficulties

## Mental Health & Wellness

Your well-being matters:
- Employee assistance programs (if available)
- Peer support networks
- Counseling services

## Additional Resources

- Industry associations
- Continuing education opportunities
- Professional development
- Job placement assistance

## Contact Information

See the main office or your program coordinator for current contact information for all resources.`,
  },
  completion: {
    title: 'Completion & Certification',
    content: `Congratulations on working toward completion! Here's what you need to know:

## Completion Requirements

To receive your certification, you must have:
- ✅ 2,000 OJT hours logged and approved
- ✅ All RTI requirements completed
- ✅ All skills competencies verified
- ✅ All required documentation submitted
- ✅ Final evaluation completed

## Certification Process

1. Program coordinator reviews your file
2. All requirements verified
3. Certification issued by relevant authority
4. Recognition ceremony (if applicable)

## After Completion

- Update your resume with your certification
- Request references from supervisors
- Explore job opportunities
- Consider continuing education

## Got Questions?

Contact your program coordinator at least 60 days before your anticipated completion date to ensure all requirements will be met.`,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const section = SECTION_CONTENT[slug];
  
  if (!section) {
    return { title: 'Section Not Found' };
  }
  
  return {
    title: `${section.title} | Apprentice Handbook`,
    description: section.content.substring(0, 160),
  };
}

export default async function HandbookSectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const section = SECTION_CONTENT[slug];
  
  if (!section) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get all sections for navigation
  const { data: sections } = await supabase
    .from('handbook_sections')
    .select('*')
    .eq('handbook_type', 'apprentice')
    .eq('is_active', true)
    .order('order', { ascending: true });

  const defaultSections = [
    { slug: 'introduction', title: 'Welcome & Introduction' },
    { slug: 'requirements', title: 'Program Requirements' },
    { slug: 'policies', title: 'Policies & Procedures' },
    { slug: 'safety', title: 'Safety Guidelines' },
    { slug: 'logging-hours', title: 'Logging Hours' },
    { slug: 'skills-assessment', title: 'Skills Assessment' },
    { slug: 'resources', title: 'Support Resources' },
    { slug: 'completion', title: 'Completion & Certification' },
  ];

  const displaySections = sections && sections.length > 0 
    ? sections.map((s: any) => ({ slug: s.slug, title: s.title })) 
    : defaultSections;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Apprentice', href: '/apprentice' },
              { label: 'Handbook', href: '/apprentice/handbook' },
              { label: section.title },
            ]}
          />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href="/apprentice/handbook"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Handbook
          </Link>
          <BookOpen className="w-12 h-12 mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold">{section.title}</h1>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-4">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wide mb-3">
                Table of Contents
              </h3>
              <nav className="space-y-1">
                {displaySections.map((item: any) => (
                  <Link
                    key={item.slug}
                    href={`/apprentice/handbook/${item.slug}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                      item.slug === slug
                        ? 'bg-brand-blue-100 text-brand-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <div className="prose prose-slate max-w-none">
                {section.content.split('\n').map((paragraph, index) => {
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-2xl font-bold text-slate-900 mt-8 mb-4 first:mt-0">
                        {paragraph.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <ul key={index} className="list-disc list-inside text-slate-700 mb-4 space-y-1">
                        <li className="ml-4">{paragraph.replace('- ', '')}</li>
                      </ul>
                    );
                  }
                  if (paragraph.match(/^\d+\./)) {
                    return (
                      <ol key={index} className="list-decimal list-inside text-slate-700 mb-4 space-y-1">
                        <li className="ml-4">{paragraph.replace(/^\d+\.\s*/, '')}</li>
                      </ol>
                    );
                  }
                  if (paragraph.trim() === '') {
                    return <div key={index} className="h-4" />;
                  }
                  return (
                    <p key={index} className="text-slate-700 mb-4">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
