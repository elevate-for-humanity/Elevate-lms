import Link from 'next/link';
import { Metadata } from 'next';
import { 
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
  Heart, 
  MessageCircle, 
  TrendingUp, 
  ArrowRight, 
  Users, 
  Briefcase, 
  GraduationCap, 
  Target, 
  CheckCircle, 
  Calendar, 
  Phone, 
  Mail, 
  Video, 
  FileText, 
  Award, 
  Lightbulb,
  Shield,
  Clock,
  Zap
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ongoing Career Support | Career Services | {PLATFORM_DEFAULTS.orgName}',
  description:
    'Lifetime career support for all graduates. Career coaching, alumni networking, advancement opportunities, job search assistance, and professional development resources.',
  keywords: ['career support', 'alumni services', 'career coaching', 'professional development', 'career advancement', 'job search help', 'lifetime support'],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/career-services/ongoing-support',
  },
};

export default function OngoingSupportPage() {
  const supportServices = [
    {
      icon: Heart,
      title: 'Career Coaching',
      description:
        'One-on-one guidance for career decisions, advancement strategies, and professional development',
      features: [
        'Personalized career planning',
        'Goal setting and tracking',
        'Skill gap analysis',
        'Industry transition support',
      ],
      availability: 'Unlimited sessions',
    },
    {
      icon: Briefcase,
      title: 'Job Search Assistance',
      description:
        'Help finding new opportunities when you\'re ready to advance or make a change',
      features: [
        'Job market research',
        'Application strategy',
        'Resume updates',
        'Interview preparation',
      ],
      availability: 'On-demand',
    },
    {
      icon: Users,
      title: 'Alumni Network',
      description:
        'Connect with thousands of graduates for mentorship, referrals, and career advice',
      features: [
        'Alumni directory access',
        'Mentorship matching',
        'Industry groups',
        'Networking events',
      ],
      availability: 'Lifetime access',
    },
    {
      icon: TrendingUp,
      title: 'Advancement Support',
      description:
        'Strategies for promotions, raises, and career progression within your current field',
      features: [
        'Promotion preparation',
        'Salary negotiation',
        'Leadership development',
        'Performance reviews',
      ],
      availability: 'As needed',
    },
    {
      icon: GraduationCap,
      title: 'Continuing Education',
      description:
        'Guidance on additional certifications, degrees, and training to advance your career',
      features: [
        'Certification recommendations',
        'Education planning',
        'Funding resources',
        'Program selection',
      ],
      availability: 'Consultation',
    },
    {
      icon: Target,
      title: 'Career Transition',
      description:
        'Support for changing industries, roles, or career paths entirely',
      features: [
        'Transferable skills analysis',
        'Industry research',
        'Transition planning',
        'Networking strategies',
      ],
      availability: 'Full support',
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Lifetime Guarantee',
      description:
        'Your career support never expires. Whether you graduated last month or ten years ago, we\'re here to help.',
    },
    {
      icon: Zap,
      title: 'Rapid Response',
      description:
        'Get help when you need it most. We respond to support requests within 24 hours, often much faster.',
    },
    {
      icon: CheckCircle,
      title: 'No Additional Cost',
      description:
        'All ongoing support services are included in your program. No hidden fees, no subscription required.',
    },
    {
      icon: Award,
      title: 'Expert Guidance',
      description:
        'Work with experienced career coaches who understand your industry and career goals.',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Reach Out',
      description:
        'Contact us via email, phone, or our alumni portal whenever you need career support.',
      icon: Phone,
    },
    {
      step: 2,
      title: 'Schedule Consultation',
      description:
        'Book a time that works for you - in-person, phone, or video call options available.',
      icon: Calendar,
    },
    {
      step: 3,
      title: 'Get Personalized Help',
      description:
        'Work with a career coach to address your specific needs and develop an action plan.',
      icon: Target,
    },
    {
      step: 4,
      title: 'Take Action',
      description:
        'Implement your plan with ongoing support and follow-up as needed.',
      icon: TrendingUp,
    },
  ];

  const commonScenarios = [
    {
      scenario: 'Looking for a Better Job',
      support:
        'We help you identify opportunities, update your resume, prepare for interviews, and negotiate offers.',
      icon: Briefcase,
    },
    {
      scenario: 'Seeking a Promotion',
      support:
        'We develop strategies to demonstrate your value, prepare for performance reviews, and negotiate advancement.',
      icon: TrendingUp,
    },
    {
      scenario: 'Changing Careers',
      support:
        'We analyze your transferable skills, research new industries, and create a transition plan.',
      icon: Target,
    },
    {
      scenario: 'Dealing with Job Loss',
      support:
        'We provide immediate job search support, emotional encouragement, and practical resources.',
      icon: Heart,
    },
    {
      scenario: 'Returning After a Break',
      support:
        'We help you update skills, address employment gaps, and re-enter the workforce confidently.',
      icon: GraduationCap,
    },
    {
      scenario: 'Starting a Business',
      support:
        'We connect you with entrepreneurship resources, mentors, and business development support.',
      icon: Lightbulb,
    },
  ];

  const alumniResources = [
    {
      title: 'Alumni Portal',
      description:
        'Access job boards, networking tools, and career resources 24/7',
      icon: Video,
    },
    {
      title: 'Career Library',
      description:
        'Hundreds of articles, videos, and guides on career development topics',
      icon: FileText,
    },
    {
      title: 'Webinar Series',
      description:
        'Monthly professional development webinars on trending career topics',
      icon: Video,
    },
    {
      title: 'Mentorship Program',
      description:
        'Connect with experienced professionals for guidance and advice',
      icon: Users,
    },
  ];

  const testimonials = [
    {
      quote:
        'Five years after graduation, I reached out for help with a career change. Within two weeks, I had a new resume, interview prep, and three job offers. The lifetime support is real.',
      author: 'Marcus T.',
      role: 'Software Developer',
      year: '2021 Graduate',
    },
    {
      quote:
        'I was laid off unexpectedly and panicked. Career services responded the same day, helped me update my resume, and connected me with employers. I was back to work in three weeks.',
      author: 'Jennifer L.',
      role: 'Healthcare Administrator',
      year: '2019 Graduate',
    },
    {
      quote:
        'The alumni network has been invaluable. I\'ve gotten two promotions through connections I made at alumni events, and I regularly mentor current students.',
      author: 'David R.',
      role: 'Operations Manager',
      year: '2018 Graduate',
    },
  ];

  const faqs = [
    {
      question: 'Is ongoing support really free for life?',
      answer:
        'Yes, absolutely. All career support services are included in your program tuition and never expire. There are no additional fees, subscriptions, or time limits.',
    },
    {
      question: 'How do I access ongoing support?',
      answer:
        'Contact us via email at careers@www.elevateforhumanity.org, call our career services line, or log into the alumni portal to schedule an appointment. We respond within 24 hours.',
    },
    {
      question: 'What if I graduated years ago?',
      answer:
        'It doesn\'t matter when you graduated - our support is truly lifetime. We regularly work with alumni who graduated 5, 10, or even 15 years ago.',
    },
    {
      question: 'Can you help if I want to change careers entirely?',
      answer:
        'Absolutely. Career transitions are one of our specialties. We help you identify transferable skills, research new industries, and develop a realistic transition plan.',
    },
    {
      question: 'Do you help with salary negotiations?',
      answer:
        'Yes! We provide salary research, negotiation strategies, and even practice conversations to help you secure the compensation you deserve.',
    },
    {
      question: 'What if I\'m unemployed and need immediate help?',
      answer:
        'We prioritize urgent requests. If you\'re unemployed or facing job loss, we can typically schedule a consultation within 24-48 hours and provide immediate job search support.',
    },
    {
      question: 'Can I access support if I moved to a different state?',
      answer:
        'Yes! We offer phone and video consultations, and our alumni network spans all 50 states. We can connect you with local alumni and employers wherever you are.',
    },
    {
      question: 'How often can I use career support services?',
      answer:
        'As often as you need. There are no limits on the number of consultations, resume reviews, or support sessions you can request.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-blue-600 to-brand-green-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-5xl font-black mb-6">Ongoing Career Support</h1>
          <p className="text-xl text-white/90 max-w-3xl mb-8">
            Your career support doesn't end at graduation. We provide lifetime assistance 
            for job searches, career advancement, transitions, and professional development. 
            No expiration date, no additional cost.
          </p>
          <div className="flex flex-wrap gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Lifetime Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>24-Hour Response</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>No Additional Cost</span>
            </div>
          </div>
        </div>
      </section>

      {/* Support Services */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-black text-black mb-4">
          Lifetime Support Services
        </h2>
        <p className="text-xl text-gray-600 mb-12">
          Comprehensive career assistance whenever you need it
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {supportServices.map((service, index) => (
            <div
              key={index}
              className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-brand-blue-600 transition"
            >
              <service.icon className="w-12 h-12 text-brand-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-black mb-2">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <ul className="space-y-2 mb-4">
                {service.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="text-sm font-semibold text-brand-blue-600">
                {service.availability}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            Why Our Support Stands Out
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <benefit.icon className="w-16 h-16 text-brand-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-black mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-black text-black mb-4">How It Works</h2>
        <p className="text-xl text-gray-600 mb-12">
          Getting support is simple and straightforward
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {howItWorks.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  {step.step}
                </div>
                <step.icon className="w-8 h-8 text-brand-green-600 mb-3" />
                <h3 className="text-lg font-bold text-black mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
              {index < howItWorks.length - 1 && (
                <ArrowRight className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 w-8 h-8 text-gray-300" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Common Scenarios */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4">
            Common Support Scenarios
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            We help with every career challenge
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {commonScenarios.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border-2 border-gray-200"
              >
                <item.icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-black mb-2">
                  {item.scenario}
                </h3>
                <p className="text-gray-600 text-sm">{item.support}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alumni Resources */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-black text-black mb-4">
          Alumni Resources
        </h2>
        <p className="text-xl text-gray-600 mb-12">
          24/7 access to career development tools
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {alumniResources.map((resource, index) => (
            <div
              key={index}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-brand-blue-600 transition"
            >
              <resource.icon className="w-10 h-10 text-brand-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-black mb-2">
                {resource.title}
              </h3>
              <p className="text-gray-600 text-sm">{resource.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-br from-brand-blue-50 to-brand-green-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            Alumni Success Stories
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8">
                <p className="text-gray-600 mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div className="border-t pt-4">
                  <p className="font-bold text-black">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-sm text-brand-blue-600">
                    {testimonial.year}
                  </p>
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
            <div
              key={index}
              className="bg-white border-2 border-gray-200 rounded-xl p-6"
            >
              <h3 className="text-xl font-bold text-black mb-3">
                {faq.question}
              </h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-brand-blue-600 to-brand-green-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-6">Need Career Support?</h2>
          <p className="text-xl text-white/90 mb-8">
            Whether you graduated last month or ten years ago, we're here to help
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition"
            >
              Contact Career Services
              <Mail className="w-5 h-5" />
            </Link>
            <Link
              href="/career-services"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-blue-800 transition"
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
            href="/career-services/job-placement"
            className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition"
          >
            <h3 className="text-lg font-bold text-black mb-2">Job Placement</h3>
            <p className="text-gray-600 text-sm mb-3">
              Direct connections to employers with open positions
            </p>
            <span className="text-brand-blue-600 font-semibold text-sm flex items-center gap-1">
              Learn More <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
          <Link
            href="/career-services/networking-events"
            className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition"
          >
            <h3 className="text-lg font-bold text-black mb-2">
              Networking Events
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              Connect with employers and industry professionals
            </p>
            <span className="text-brand-blue-600 font-semibold text-sm flex items-center gap-1">
              Learn More <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
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
            <span className="text-brand-blue-600 font-semibold text-sm flex items-center gap-1">
              Learn More <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
