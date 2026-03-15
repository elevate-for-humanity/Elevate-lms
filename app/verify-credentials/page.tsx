import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  Shield, 
  
  ExternalLink, 
  Building2, 
  Award, 
  FileCheck,
  BadgeCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertCircle
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verify Our Credentials | Elevate For Humanity',
  description: 'Verify Elevate For Humanity credentials including ETPL listing, RAPIDS registration, state approvals, and accreditation status. All credentials are independently verifiable.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/verify-credentials',
  },
};

interface VerifiableCredential {
  name: string;
  issuer: string;
  idNumber: string | null;
  status: 'active' | 'pending' | 'renewal';
  validThrough: string | null;
  verificationUrl: string | null;
  verificationInstructions: string;
  icon: React.ElementType;
  image: string;
  category: 'federal' | 'state' | 'accreditation' | 'funding';
}

const credentials: VerifiableCredential[] = [
  {
    name: 'Registered Apprenticeship Sponsor',
    issuer: 'U.S. Department of Labor (DOL)',
    idNumber: 'RAPIDS ID: 2025-IN-132301',
    status: 'active',
    validThrough: null,
    verificationUrl: 'https://www.apprenticeship.gov/partner-finder',
    verificationInstructions: 'Search for "Elevate for Humanity" in the DOL Apprenticeship Partner Finder',
    icon: Shield,
    image: '/images/pages/credential-partners-hero.jpg',
    category: 'federal',
  },
  {
    name: 'Eligible Training Provider (ETPL)',
    issuer: 'Indiana Department of Workforce Development (DWD)',
    idNumber: 'INTraining Location ID: 10004621',
    status: 'active',
    validThrough: null,
    verificationUrl: 'https://intraining.dwd.in.gov/',
    verificationInstructions: 'Search INTraining for Location ID 10004621 or "Elevate for Humanity"',
    icon: Building2,
    image: '/images/pages/credential-partners-hero.jpg',
    category: 'state',
  },
  {
    name: 'Approved Postsecondary Proprietary Educational Institution',
    issuer: 'Indiana Department of Education (DOE)',
    idNumber: null,
    status: 'active',
    validThrough: null,
    verificationUrl: 'https://www.in.gov/doe/students/private-schools/',
    verificationInstructions: 'Contact Indiana DOE to verify approval status',
    icon: Award,
    image: '/images/pages/credential-partners-hero.jpg',
    category: 'state',
  },
  {
    name: 'WIOA Eligible Training Provider',
    issuer: 'Workforce Innovation and Opportunity Act',
    idNumber: null,
    status: 'active',
    validThrough: null,
    verificationUrl: 'https://intraining.dwd.in.gov/',
    verificationInstructions: 'WIOA eligibility verified through ETPL listing on INTraining',
    icon: FileCheck,
    image: '/images/pages/credential-partners-hero.jpg',
    category: 'funding',
  },
  {
    name: 'Workforce Ready Grant (WRG) Approved',
    issuer: 'Indiana Commission for Higher Education',
    idNumber: null,
    status: 'active',
    validThrough: null,
    verificationUrl: 'https://www.in.gov/che/state-financial-aid/state-financial-aid-by-program/workforce-ready-grant/',
    verificationInstructions: 'WRG eligibility tied to ETPL-approved programs',
    icon: BadgeCheck,
    image: '/images/pages/credential-partners-hero.jpg',
    category: 'funding',
  },
  {
    name: 'Job Ready Indy (JRI) Partner',
    issuer: 'Indiana Department of Correction',
    idNumber: null,
    status: 'active',
    validThrough: null,
    verificationUrl: null,
    verificationInstructions: 'Contact Indiana DOC or local WorkOne office to verify JRI partnership',
    icon: Shield,
    image: '/images/pages/credential-partners-hero.jpg',
    category: 'funding',
  },
];

function StatusBadge({ status }: { status: 'active' | 'pending' | 'renewal' }) {
  const styles = {
    active: 'bg-brand-green-100 text-brand-green-800 border-brand-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    renewal: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-200',
  };
  
  const labels = {
    active: 'Active',
    pending: 'Pending',
    renewal: 'Renewal in Progress',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status === 'active' && <span className="text-slate-400 flex-shrink-0">•</span>}
      {status === 'pending' && <Clock className="w-3 h-3" />}
      {status === 'renewal' && <AlertCircle className="w-3 h-3" />}
      {labels[status]}
    </span>
  );
}

function CredentialCard({ credential }: { credential: VerifiableCredential }) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-brand-blue-300 transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <Image src={credential.image} alt={credential.name} fill sizes="48px" className="object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{credential.name}</h3>
            <p className="text-sm text-gray-600">{credential.issuer}</p>
          </div>
        </div>
        <StatusBadge status={credential.status} />
      </div>
      
      {credential.idNumber && (
        <div className="mb-4 p-3 bg-white rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Credential ID</p>
          <p className="font-mono text-sm font-medium text-gray-900">{credential.idNumber}</p>
        </div>
      )}
      
      {credential.validThrough && (
        <p className="text-sm text-gray-600 mb-4">
          <strong>Valid Through:</strong> {credential.validThrough}
        </p>
      )}
      
      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-3">
          <strong>How to Verify:</strong> {credential.verificationInstructions}
        </p>
        {credential.verificationUrl && (
          <a
            href={credential.verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
          >
            Verify Online <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function VerifyCredentialsPage() {
  const federalCredentials = credentials.filter(c => c.category === 'federal');
  const stateCredentials = credentials.filter(c => c.category === 'state');
  const fundingCredentials = credentials.filter(c => c.category === 'funding');

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Verify Credentials' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px] overflow-hidden">
        <Image
          src="/images/pages/verify-credentials-page-1.jpg"
          alt="Elevate for Humanity credential verification"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm font-semibold tracking-wide text-brand-blue-300 mb-1">Credential Verification</p>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              Verify Our Credentials
            </h1>
            <p className="text-base md:text-lg text-white/90 max-w-3xl">
              All credentials are independently verifiable through official 
              government databases and issuing authorities.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Verification Box */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white text-white rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4">Quick Verification</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-brand-blue-100 mb-4">
                  For workforce board staff and government agencies conducting compliance reviews:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span><strong>ETPL:</strong> INTraining Location ID 10004621</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span><strong>RAPIDS:</strong> 2025-IN-132301</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span><strong>Legal Name:</strong> 2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Technical Institute</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-brand-blue-100 mb-3">Need documentation?</p>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-50 transition"
                >
                  Request Verification Letter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Federal Credentials */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-blue-600" />
            Federal Credentials
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {federalCredentials.map((credential, index) => (
              <CredentialCard key={index} credential={credential} />
            ))}
          </div>
        </div>
      </section>

      {/* State Credentials */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-blue-600" />
            State Credentials (Indiana)
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {stateCredentials.map((credential, index) => (
              <CredentialCard key={index} credential={credential} />
            ))}
          </div>
        </div>
      </section>

      {/* Funding Eligibility */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-brand-blue-600" />
            Funding Eligibility
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fundingCredentials.map((credential, index) => (
              <CredentialCard key={index} credential={credential} />
            ))}
          </div>
        </div>
      </section>

      {/* Verification Contact */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Need Additional Verification?
              </h2>
              <p className="text-gray-600 mb-6">
                If you need official documentation, verification letters, or have questions 
                about our credentials, contact our compliance team directly.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <a href="/support" className="font-medium text-gray-900 hover:text-brand-blue-600">
                      (317) 314-3757
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a href="/contact" className="font-medium text-gray-900 hover:text-brand-blue-600">
                      our contact form
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">Indianapolis, IN</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">Related Compliance Pages</h3>
              <div className="space-y-3">
                <Link
                  href="/accreditation"
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-brand-blue-300 transition"
                >
                  <span className="font-medium">Accreditation & Approvals</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  href="/federal-compliance"
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-brand-blue-300 transition"
                >
                  <span className="font-medium">Federal Compliance</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  href="/disclosures"
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-brand-blue-300 transition"
                >
                  <span className="font-medium">Disclosures</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  href="/compliance"
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-brand-blue-300 transition"
                >
                  <span className="font-medium">Compliance Center</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Credential status is current as of the last update. 
              For the most up-to-date verification, please use the official verification 
              links provided above. Some credentials may be in renewal status during 
              annual review periods. Contact us if you have questions about any credential status.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
