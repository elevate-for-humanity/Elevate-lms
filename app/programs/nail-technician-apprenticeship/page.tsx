'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { createBrowserClient } from '@supabase/ssr';
import {
  Clock, DollarSign, TrendingUp, ArrowRight,
  Award, Calendar, ChevronDown, ChevronUp,
  Phone, GraduationCap, Briefcase, Sparkles,
  Users, Shield, Heart, Scissors
} from 'lucide-react';

export default function NailTechnicianApprenticeshipPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('programs').select('*').eq('slug', 'nail-technician-apprenticeship').limit(1)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need any experience to enroll?",
      answer: "No prior experience is required. The apprenticeship is designed for beginners. You'll start with basic nail care fundamentals — sanitation, tool identification, and client consultation — before progressing to advanced techniques like gel application, nail art, and acrylic sculpting."
    },
    {
      question: "How does the apprenticeship model work?",
      answer: "You train inside a licensed nail salon under the supervision of a licensed nail technician. You earn while you learn — performing services on real clients as your skills develop. Elevate provides the related technical instruction (classroom/online), and the salon provides the on-the-job training hours."
    },
    {
      question: "How many hours do I need to complete?",
      answer: "Indiana requires 450 hours of training for a nail technician license. This includes both on-the-job training at your salon placement and related technical instruction through Elevate. Most apprentices complete the program in 20–24 weeks depending on their schedule."
    },
    {
      question: "Will I get paid during the apprenticeship?",
      answer: "Yes. As an apprentice in a licensed salon, you earn wages for the hours you work. Pay varies by salon — most start at minimum wage or slightly above, with increases as your skills develop. Many apprentices also earn tips once they begin serving clients independently."
    },
    {
      question: "What license will I earn?",
      answer: "Upon completion, you'll be eligible to apply for an Indiana Nail Technician License through the Indiana Professional Licensing Agency (State Board of Cosmetology and Barber Examiners). You must pass the state board exam, which includes both written and practical components."
    },
    {
      question: "How much does the program cost?",
      answer: "Tuition is $3,500 which covers all related technical instruction, materials, practice supplies, and exam preparation. Weekly payment plans and BNPL options are available. Some salon sponsors offset a portion of tuition in exchange for a work commitment."
    },
    {
      question: "What's the difference between this and cosmetology school?",
      answer: "Traditional cosmetology school requires 1,500 hours and covers hair, skin, and nails. Our nail technician apprenticeship focuses exclusively on nails (450 hours) and uses an earn-while-you-learn model instead of full-time classroom attendance. It's faster, more affordable, and you earn income during training."
    },
    {
      question: "Can I open my own nail salon after completing the program?",
      answer: "Yes, once you're licensed. Many nail technicians work in salons for 1–2 years to build their client base, then open their own studio or rent a booth. Pair this program with our Entrepreneurship course to build your business plan while completing your apprenticeship."
    }
  ];

  const curriculum = [
    {
      week: "Weeks 1-4",
      title: "Foundations & Sanitation",
      topics: ["Indiana cosmetology law and regulations", "Sanitation, disinfection, and infection control", "Nail anatomy and common nail disorders", "Tool identification, maintenance, and sterilization"],
      project: "Pass the sanitation and safety competency assessment"
    },
    {
      week: "Weeks 5-8",
      title: "Manicure & Pedicure Techniques",
      topics: ["Classic manicure procedures step by step", "Spa pedicure techniques and foot care", "Cuticle care and nail shaping", "Hand and arm massage techniques"],
      project: "Perform supervised manicure and pedicure services on clients"
    },
    {
      week: "Weeks 9-12",
      title: "Gel & Acrylic Application",
      topics: ["Gel polish application and removal", "Hard gel overlay and extensions", "Acrylic nail sculpting and tips", "Fill and maintenance procedures"],
      project: "Complete gel and acrylic sets meeting salon quality standards"
    },
    {
      week: "Weeks 13-16",
      title: "Nail Art & Design",
      topics: ["Freehand nail art techniques", "Stamping, foils, and decal application", "3D nail art and embellishments", "Trending designs and client consultation"],
      project: "Build a nail art portfolio with 10+ original designs"
    },
    {
      week: "Weeks 17-20",
      title: "Business Operations & Exam Prep",
      topics: ["Client consultation and service planning", "Salon retail and upselling techniques", "Appointment scheduling and client retention", "Indiana state board exam preparation"],
      project: "Pass practice state board exam (written and practical)"
    }
  ];

  const stats = [
    { value: "450", label: "Training Hours", icon: Clock },
    { value: "$35K", label: "Average Starting Salary", icon: DollarSign },
    { value: "20", label: "Weeks to Licensed", icon: Calendar },
    { value: "Paid", label: "Earn While You Learn", icon: Award }
  ];

  return (
    <>
      <ProgramHeroBanner videoSrc="/videos/beauty-cosmetology.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Beauty & Cosmetology' },
            { label: 'Nail Technician Apprenticeship' }
          ]} />
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/programs-hq/barber-training.jpg" alt="Nail technician apprenticeship hands-on training in salon" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Stats */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Overview */}
      <section className="py-16 bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-pink-100 text-pink-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Apprenticeship Program
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Nail Technician Apprenticeship
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Earn while you learn in a licensed nail salon. Complete 450 hours of hands-on training, master manicure, pedicure, gel, acrylic, and nail art techniques, and qualify for your Indiana nail technician license.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-7 h-7 text-pink-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">300+</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">On-the-Job Hours</div>
              <p className="text-gray-600 text-sm">Train inside a licensed salon performing real services under supervision. Build your client base and earn wages from day one.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-pink-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">150</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Classroom/LMS Hours</div>
              <p className="text-gray-600 text-sm">Related technical instruction covering nail science, sanitation, Indiana law, and business operations through evening classes and online modules.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-brand-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">IN</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">State License Eligible</div>
              <p className="text-gray-600 text-sm">Completers qualify to sit for the Indiana State Board exam. We provide exam prep, practice tests, and scheduling assistance.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-4">Tuition & Payment</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold text-gray-900">$3,500</div>
                <p className="text-sm text-gray-500">Total tuition (materials included)</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">Weekly Payment Plans</div>
                <p className="text-sm text-gray-500">20 weekly payments of $175</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">BNPL Available</div>
                <p className="text-sm text-gray-500">Buy Now, Pay Later through Affirm</p>
              </div>
            </div>
            <FundingBadge type="self-pay" className="mt-4" />
          </div>
        </div>
      </section>

      {/* Why Nail Tech */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-pink-100 text-pink-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Why Nail Technology?
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              A Creative Career with Real Demand
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The nail care industry generates $10 billion annually in the U.S. Licensed nail technicians are in demand at salons, spas, and as independent operators.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Creative Expression",
                description: "Nail art is one of the fastest-growing segments of the beauty industry. From minimalist designs to elaborate 3D art, your creativity becomes your signature and your brand.",
                image: "/images/programs-hq/barber-hero.jpg"
              },
              {
                title: "Flexible Work Options",
                description: "Work in a salon, rent a booth, do mobile services, or open your own studio. Many nail techs set their own hours and build a schedule that fits their life.",
                image: "/images/programs-hq/barber-training.jpg"
              },
              {
                title: "Low Startup Costs",
                description: "Compared to other beauty careers, nail technology has low startup costs. A basic professional kit costs $500–$1,000. Booth rental starts at $200–$400/month.",
                image: "/images/programs-hq/business-office.jpg"
              },
              {
                title: "Repeat Clients",
                description: "Nail services are recurring — clients return every 2–3 weeks. Build a loyal client base and you have predictable, steady income month after month.",
                image: "/images/heroes-hq/success-hero.jpg"
              },
              {
                title: "Earn While You Learn",
                description: "Unlike traditional beauty school, our apprenticeship model means you earn wages from day one. No sitting in a classroom full-time — you're in a real salon with real clients.",
                image: "/images/heroes-hq/career-services-hero.jpg"
              },
              {
                title: "Stack with Cosmetology",
                description: "A nail technician license is a stepping stone. Many graduates later pursue full cosmetology licensure, adding hair and skin services to their repertoire.",
                image: "/images/programs-hq/training-classroom.jpg"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-50 rounded-2xl overflow-hidden"
              >
                <div className="relative h-48">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-pink-100 text-pink-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Curriculum
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Training Timeline
            </h2>
          </div>

          <div className="space-y-6">
            {curriculum.map((module, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-8 shadow-sm"
              >
                <div className="flex items-start gap-6">
                  <div className="w-24 flex-shrink-0">
                    <div className="text-xs font-semibold text-pink-600 uppercase tracking-wide">{module.week}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3">{module.title}</h3>
                    <div className="grid md:grid-cols-2 gap-2 mb-4">
                      {module.topics.map((topic, i) => (
                        <div key={i} className="text-gray-600 text-sm">• {topic}</div>
                      ))}
                    </div>
                    <div className="bg-pink-50 rounded-lg px-4 py-2 text-sm">
                      <span className="font-semibold text-pink-700">Milestone:</span> <span className="text-pink-600">{module.project}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-slate-50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-100 transition"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openFaq === index ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-6 pb-6"
                  >
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-pink-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Start Your Nail Technician Career</h2>
          <p className="text-lg text-pink-100 mb-8 max-w-2xl mx-auto">
            Submit an inquiry to get matched with a salon sponsor and learn about enrollment, payment plans, and orientation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply?program=nail-technician-apprenticeship" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-pink-600 font-bold rounded-xl hover:bg-gray-100 transition text-lg shadow-lg">
              Submit Inquiry <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/programs/nail-technician-apprenticeship/orientation" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-bold rounded-xl hover:bg-white/10 transition text-lg border-2 border-white">
              View Orientation
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
