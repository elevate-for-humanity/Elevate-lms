import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Users, Target, Award, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Organization | Elevate for Humanity',
  description: 'Learn about Elevate for Humanity - Workforce development organization providing career training and apprenticeship programs.',
};

export default function OrganizationPage() {
  const stats = [
    { label: 'Students Trained', value: '5,000+' },
    { label: 'Partner Employers', value: '200+' },
    { label: 'Programs Offered', value: '50+' },
    { label: 'Completion Rate', value: '92%' },
  ];

  const leadership = [
    {
      name: 'Organization Leadership',
      role: 'Executive Team',
      description: 'Our leadership team brings decades of experience in workforce development, education, and career services.',
    },
  ];

  const certifications = [
    { name: 'DOL Registered Apprenticeship', desc: 'National apprenticeship program certification' },
    { name: 'ETPL Approved', desc: 'Eligible Training Provider List' },
    { name: 'Accredited Institution', desc: 'Career and technical education accreditation' },
    { name: 'WIOA Partner', desc: 'Workforce Innovation and Opportunity Act compliant' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-700 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Admin', href: '/' }, { label: 'Organization' }]} />
          <h1 className="text-4xl font-bold mt-6 mb-4">Elevate for Humanity</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Transforming careers through workforce development, apprenticeship programs, and career training services.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stat.value}</div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-purple-600" />
                <h2 className="text-2xl font-bold">Our Mission</h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Elevate for Humanity provides workforce development services that empower individuals to achieve 
                career success through quality training, apprenticeships, and job placement support.
              </p>
              <p className="text-slate-600 leading-relaxed mt-4">
                We partner with employers, educational institutions, and government agencies to create 
                pathways to meaningful employment for working adults and career changers.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold">Our Vision</h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                A workforce where every individual has access to quality training, fair wages, and 
                career advancement opportunities regardless of their background or circumstances.
              </p>
              <p className="text-slate-600 leading-relaxed mt-4">
                We envision communities where employers have access to skilled workers and individuals 
                have the training they need to succeed in today's economy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Award className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl font-bold">Certifications & Partnerships</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert) => (
              <div key={cert.name} className="bg-slate-50 rounded-xl p-6 border">
                <h3 className="font-semibold text-slate-900 mb-2">{cert.name}</h3>
                <p className="text-sm text-slate-600">{cert.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 bg-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Contact Information</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium">Address</div>
                <div className="text-slate-600 text-sm">Indianapolis, IN</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium">Phone</div>
                <div className="text-slate-600 text-sm">(317) 314-3757</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium">Email</div>
                <div className="text-slate-600 text-sm">info@elevateforhumanity.org</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
