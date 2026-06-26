import Link from 'next/link';
import { Metadata } from 'next';
import { Calendar, Users, Briefcase, ArrowRight, CheckCircle, MapPin, Clock, Video, Coffee, Handshake, Building2, Award } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Networking Events | Career Services | {PLATFORM_DEFAULTS.orgName}',
  description:
    'Connect with employers and industry professionals at our networking events. Monthly career fairs, industry mixers, alumni meetups, and virtual networking opportunities.',
  keywords: ['networking events', 'career fairs', 'job fairs', 'professional networking', 'employer events', 'alumni networking', 'industry meetups'],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/career-services/networking-events',
  },
};

export default function NetworkingEventsPage() {
  const eventTypes = [
    {
      icon: Calendar,
      title: 'Career Fairs',
      description: 'Monthly events with 20-50 employers actively hiring',
      frequency: 'Monthly',
      format: 'In-person & Virtual',
      features: [
        'Direct employer access',
        'On-site interviews',
        'Resume reviews',
        'Job offers same day',
      ],
    },
    {
      icon: Coffee,
      title: 'Industry Mixers',
      description: 'Casual networking with professionals in your field',
      frequency: 'Bi-weekly',
      format: 'In-person',
      features: [
        'Informal conversations',
        'Industry insights',
        'Mentorship connections',
        'Career advice',
      ],
    },
    {
      icon: Video,
      title: 'Virtual Networking',
      description: 'Online events connecting students with remote opportunities',
      frequency: 'Weekly',
      format: 'Virtual',
      features: [
        'National employer reach',
        'Remote job opportunities',
        'Flexible scheduling',
        'Recorded sessions',
      ],
    },
    {
      icon: Building2,
      title: 'Company Tours',
      description: 'Visit local employers and see workplaces firsthand',
      frequency: 'Monthly',
      format: 'In-person',
      features: [
        'Facility tours',
        'Meet hiring managers',
        'Learn company culture',
        'Application priority',
      ],
    },
    {
      icon: Handshake,
      title: 'Alumni Meetups',
      description: 'Connect with graduates working in your target industry',
      frequency: 'Monthly',
      format: 'Hybrid',
      features: [
        'Success stories',
        'Career pathways',
        'Referral opportunities',
        'Ongoing support',
      ],
    },
    {
      icon: Award,
      title: 'Industry Panels',
      description: 'Hear from leaders about trends and opportunities',
      frequency: 'Quarterly',
      format: 'Hybrid',
      features: [
        'Expert insights',
        'Q&A sessions',
        'Networking breaks',
        'Resource materials',
      ],
    },
  ];

  const benefits = [
    {
      icon: Users,
      title: 'Direct Employer Access',
      description:
        'Meet hiring managers, recruiters, and decision-makers face-to-face. Skip the online application black hole and make personal connections.',
    },
    {
      icon: Briefcase,
      title: 'Hidden Job Market',
      description:
        'Access unadvertised positions and opportunities shared exclusively at networking events. Many jobs are filled through connections before being posted.',
    },
    {
      icon: MapPin,
      title: 'Local & National Reach',
      description:
        'Connect with employers in your area and across the country. Our virtual events expand your network beyond geographic limitations.',
    },
    {
      icon: CheckCircle,
      title: 'Practice & Confidence',
      description:
        'Build your networking skills in a supportive environment. Learn to introduce yourself, ask questions, and follow up professionally.',
    },
  ];

  const upcomingEvents = [
    {
      title: 'Tech Industry Career Fair',
      date: 'January 25, 2026',
      time: '10:00 AM - 2:00 PM EST',
      location: 'Virtual',
      employers: 35,
      description:
        'Connect with software companies, IT departments, and tech startups hiring for entry-level positions.',
    },
    {
      title: 'Healthcare Networking Mixer',
      date: 'February 8, 2026',
      time: '5:00 PM - 7:00 PM EST',
      location: 'Indianapolis, IN',
      employers: 15,
      description:
        'Meet healthcare administrators, clinic managers, and hospital recruiters in an informal setting.',
    },
    {
      title: 'Manufacturing & Logistics Expo',
      date: 'February 22, 2026',
      time: '9:00 AM - 1:00 PM EST',
      location: 'Hybrid',
      employers: 28,
      description:
        'Explore opportunities in manufacturing, supply chain, and logistics with Indiana employers.',
    },
  ];

  const tips = [
    {
      title: 'Prepare Your Elevator Pitch',
      description:
        'Practice a 30-second introduction covering who you are, what you study, and what you\'re looking for.',
    },
    {
      title: 'Bring Multiple Resumes',
      description:
        'Print 20-30 copies on quality paper. Have digital versions ready for virtual events.',
    },
    {
      title: 'Research Attending Employers',
      description:
        'Review company websites and prepare specific questions about their culture and opportunities.',
    },
    {
      title: 'Dress Professionally',
      description:
        'Business casual minimum. When in doubt, dress one level above the workplace norm.',
    },
    {
      title: 'Ask Thoughtful Questions',
      description:
        'Inquire about day-to-day responsibilities, growth opportunities, and company values.',
    },
    {
      title: 'Follow Up Within 24 Hours',
      description:
        'Send personalized thank-you emails referencing specific conversations you had.',
    },
  ];

  const faqs = [
    {
      question: 'Are networking events free for students?',
      answer:
        'Yes, all networking events are completely free for enrolled students and alumni. We cover the costs through employer partnerships and program funding.',
    },
    {
      question: 'Do I need to register in advance?',
      answer:
        'Registration is recommended but not always required. For career fairs and company tours, advance registration helps us plan capacity and notify employers of attendee numbers.',
    },
    {
      question: 'What should I bring to a networking event?',
      answer:
        'Bring multiple copies of your resume, a professional notebook and pen, business cards if you have them, and a positive attitude. For virtual events, ensure your technology is working and your background is professional.',
    },
    {
      question: 'Can I attend if I haven\'t completed my program yet?',
      answer:
        'Absolutely! Networking events are valuable at any stage of your education. Early connections can lead to internships, mentorships, and job offers upon graduation.',
    },
    {
      question: 'What if I\'m nervous about networking?',
      answer:
        'Nervousness is normal! Attend our networking skills workshops beforehand, bring a friend for support, and remember that employers expect students to be learning. Start with less intimidating formats like industry mixers.',
    },
    {
      question: 'Are virtual events as effective as in-person?',
      answer:
        'Virtual events offer unique advantages including access to national employers, flexible scheduling, and the ability to connect from anywhere. Many students find them less intimidating and appreciate the recorded sessions for review.',
    },
    {
      question: 'How many employers typically attend?',
      answer:
        'Career fairs typically host 20-50 employers, while industry mixers and company tours feature 5-15 companies. Virtual events often have the largest employer participation due to reduced logistical barriers.',
    },
    {
      question: 'Can alumni attend networking events?',
      answer:
        'Yes! Alumni are welcome at all networking events. We encourage graduates to stay connected and continue building their professional networks.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-green-600 to-brand-blue-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-5xl font-black mb-6">Networking Events</h1>
          <p className="text-xl text-white/90 max-w-3xl mb-8">
            Connect with employers, alumni, and industry professionals through career fairs, 
            industry mixers, virtual networking, and exclusive company events. Build relationships 
            that lead to job offers.
          </p>
          <div className="flex flex-wrap gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>50+ Events Annually</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>500+ Employers</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>In-Person & Virtual</span>
            </div>
          </div>
        </div>
      </section>

      {/* Event Types */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-black text-black mb-4">Event Types</h2>
        <p className="text-xl text-gray-600 mb-12">
          Multiple formats to match your networking style and career goals
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {eventTypes.map((event, index) => (
            <div
              key={index}
              className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-brand-green-600 transition"
            >
              <event.icon className="w-12 h-12 text-brand-green-600 mb-4" />
              <h3 className="text-xl font-bold text-black mb-2">
                {event.title}
              </h3>
              <p className="text-gray-600 mb-4">{event.description}</p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{event.frequency}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{event.format}</span>
                </div>
              </div>
              <ul className="space-y-2">
                {event.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4">
            Why Attend Networking Events
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Face-to-face connections lead to job offers
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-2xl p-8">
                <benefit.icon className="w-12 h-12 text-brand-green-600 mb-4" />
                <h3 className="text-2xl font-bold text-black mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-black text-black mb-4">Upcoming Events</h2>
        <p className="text-xl text-gray-600 mb-12">
          Register early to secure your spot
        </p>
        <div className="space-y-6">
          {upcomingEvents.map((event, index) => (
            <div
              key={index}
              className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-brand-green-600 transition"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-black mb-3">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{event.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{event.employers} Employers</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-green-700 transition whitespace-nowrap"
                >
                  Register Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Networking Tips */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4">
            Networking Success Tips
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Make the most of every event
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip, index) => (
              <div key={index} className="bg-white rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black mb-2">
                      {tip.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{tip.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-black text-black mb-12 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-black mb-3">
                {faq.question}
              </h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-brand-green-600 to-brand-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-6">
            Start Building Your Network
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Register for upcoming events and connect with employers actively hiring
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-green-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition"
            >
              View Event Calendar
              <Calendar className="w-5 h-5" />
            </Link>
            <Link
              href="/career-services"
              className="inline-flex items-center justify-center gap-2 bg-brand-green-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-green-800 transition"
            >
              All Career Services
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-black mb-6">
          Related Career Services
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/career-services/interview-prep"
            className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition"
          >
            <h3 className="text-lg font-bold text-black mb-2">
              Interview Preparation
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              Practice with mock interviews and expert feedback
            </p>
            <span className="text-brand-green-600 font-semibold text-sm flex items-center gap-1">
              Learn More <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
          <Link
            href="/career-services/job-placement"
            className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition"
          >
            <h3 className="text-lg font-bold text-black mb-2">Job Placement</h3>
            <p className="text-gray-600 text-sm mb-3">
              Direct connections to employers with open positions
            </p>
            <span className="text-brand-green-600 font-semibold text-sm flex items-center gap-1">
              Learn More <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
          <Link
            href="/career-services/resume-building"
            className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition"
          >
            <h3 className="text-lg font-bold text-black mb-2">
              Resume Building
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              Create professional resumes that get interviews
            </p>
            <span className="text-brand-green-600 font-semibold text-sm flex items-center gap-1">
              Learn More <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
