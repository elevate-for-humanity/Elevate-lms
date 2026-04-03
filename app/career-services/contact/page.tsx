
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Contact Career Services | Elevate for Humanity',
  description:
    'Get in touch with our career services team. Schedule appointments, ask questions, or get help with your job search.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/career-services/contact',
  },
};

export default function CareerServicesContactPage() {

  return (
    <div className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Services', href: '/career-services' }, { label: 'Contact' }]} />
        </div>
      </div>

      {/* Header */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Contact Career Services
          </h1>
          <p className="text-xl text-white">
            We are here to help you succeed in your career journey
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Phone */}
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Contact Us</h2>
              <p className="text-black mb-4">Speak directly with a career advisor</p>
              <a
                href="/support"
                className="text-2xl font-bold text-brand-blue-600 hover:text-brand-blue-700"
              >
                (317) 314-3757
              </a>
              <p className="text-sm text-black mt-2">Mon-Fri, 9am-5pm EST</p>
            </div>

            {/* Email */}
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-brand-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email Us</h2>
              <p className="text-black mb-4">Get a response within 24 hours</p>
              <a
                href="/contact"
                className="text-lg font-bold text-brand-green-600 hover:text-brand-green-700 break-all"
              >
                our contact form
              </a>
              <p className="text-sm text-black mt-2">We respond within 1 business day</p>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Schedule Appointment</h2>
              <p className="text-black mb-4">Book a one-on-one session</p>
              <Link
                href="/schedule"
                className="inline-flex items-center text-lg font-bold text-brand-blue-600 hover:text-brand-blue-700"
              >
                Book Now <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <p className="text-sm text-black mt-2">In-person or virtual available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Office Location */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Visit Our Office
          </h2>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 p-8">
                <div className="flex items-start mb-6">
                  <MapPin className="w-6 h-6 text-brand-blue-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Career Services Center</h3>
                    <p className="text-black">
                      8888 Keystone Crossing, Suite 1300<br />
                      Indianapolis, IN 46240
                    </p>
                  </div>
                </div>

                <div className="flex items-start mb-6">
                  <Clock className="w-6 h-6 text-brand-blue-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Office Hours</h3>
                    <p className="text-black">
                      Monday - Friday: 9:00 AM - 5:00 PM<br />
                      Saturday: By appointment<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MessageSquare className="w-6 h-6 text-brand-blue-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">By Appointment Only</h3>
                    <p className="text-black">
                      By appointment only — for meetings, support, testing, and hands-on training. This is not a walk-in location.
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:w-1/2 bg-gray-200 min-h-[300px] flex items-center justify-center">
                <div className="text-center p-8">
                  <MapPin className="w-12 h-12 text-black mx-auto mb-4" />
                  <p className="text-black">
                    <a
                      href="https://maps.google.com/?q=8888+Keystone+Crossing+Suite+1300+Indianapolis+IN+46240"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue-600 hover:underline font-medium"
                    >
                      View on Google Maps
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Quick Links */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Career Services Available
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/career-services/resume-building"
              className="bg-white rounded-lg p-6 hover:bg-white transition flex items-center"
            >
              <div className="w-12 h-12 bg-brand-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">📄</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Resume Building</h3>
                <p className="text-sm text-black">Create a professional resume</p>
              </div>
              <ArrowRight className="w-5 h-5 text-black ml-auto" />
            </Link>

            <Link
              href="/career-services/interview-prep"
              className="bg-white rounded-lg p-6 hover:bg-white transition flex items-center"
            >
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Interview Prep</h3>
                <p className="text-sm text-black">Practice with mock interviews</p>
              </div>
              <ArrowRight className="w-5 h-5 text-black ml-auto" />
            </Link>

            <Link
              href="/career-services/career-counseling"
              className="bg-white rounded-lg p-6 hover:bg-white transition flex items-center"
            >
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">🧭</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Career Counseling</h3>
                <p className="text-sm text-black">Explore your career options</p>
              </div>
              <ArrowRight className="w-5 h-5 text-black ml-auto" />
            </Link>

            <Link
              href="/career-services/job-placement"
              className="bg-white rounded-lg p-6 hover:bg-white transition flex items-center"
            >
              <div className="w-12 h-12 bg-brand-orange-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">💼</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Job Placement</h3>
                <p className="text-sm text-black">Connect with employers</p>
              </div>
              <ArrowRight className="w-5 h-5 text-black ml-auto" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">Are career services free?</h3>
              <p className="text-black">
                Yes, all career services are free for current students and program participants. Alumni also have access to many services.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">Do I need an appointment?</h3>
              <p className="text-black">
                Yes — all visits are by appointment only. Elevate is a hybrid training institute, not a walk-in location. Schedule through the booking link on this page.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">Can I get help virtually?</h3>
              <p className="text-black">
                Absolutely! We offer all services via video call. Schedule a virtual appointment through our booking system.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">How long are appointments?</h3>
              <p className="text-black">
                Initial consultations are 30 minutes. Resume reviews and mock interviews are typically 60 minutes. Career counseling sessions can be 60-90 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Take the Next Step?
          </h2>
          <p className="text-xl mb-8 text-white">
            Our career services team is here to support your success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/schedule"
              className="bg-white hover:bg-white text-brand-blue-900 px-8 py-4 rounded-lg text-lg font-bold transition-all inline-flex items-center justify-center"
            >
              <Calendar className="mr-2 w-5 h-5" />
              Schedule Appointment
            </Link>
            <Link
              href="/career-services"
              className="bg-brand-blue-800 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all border-2 border-white"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
