import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  Shield, 
  CheckCircle, 
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
    category: 'funding',
  },
  {
    name: 'Justice Reinvestment Initiative (JRI) Partner',
    issuer: 'Indiana Department of Correction',
    idNumber: null,
    status: 'active',
    validThrough: null,
    verificationUrl: null,
    verificationInstructions: 'Contact Indiana DOC or local WorkOne office to verify JRI partnership',
    icon: Shield,
    category: 'funding',
  },
];

function StatusBadge({ status }: { status: 'active' | 'pending' | 'renewal' }) {
  const styles = {
    active: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    renewal: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  
  const labels = {
    active: 'Active',
    pending: 'Pending',
    renewal: 'Renewal in Progress',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status === 'active' && <CheckCircle className="w-3 h-3" />}
      {status === 'pending' && <Clock className="w-3 h-3" />}
      {status === 'renewal' && <AlertCircle className="w-3 h-3" />}
      {labels[status]}
    </span>
  );
}

function CredentialCard({ credential }: { credential: VerifiableCredential }) {
  const Icon = credential.icon;
  
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{credential.name}</h3>
            <p className="text-sm text-gray-600">{credential.issuer}</p>
          </div>
        </div>
        <StatusBadge status={credential.status} />
      </div>
      
      {credential.idNumber && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
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
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
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
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Verify Credentials' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <BadgeCheck className="w-10 h-10 text-blue-400" />
            <span className="text-blue-400 font-medium">Credential Verification</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Verify Our Credentials
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl">
            All Elevate for Humanity credentials are independently verifiable through official 
            government databases and issuing authorities. Use this page to confirm our 
            authorization to provide workforce training services.
          </p>
        </div>
      </section>

      {/* Quick Verification Box */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-blue-600 text-white rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4">Quick Verification</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-blue-100 mb-4">
                  For workforce board staff and government agencies conducting compliance reviews:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
                    <span><strong>ETPL:</strong> INTraining Location ID 10004621</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
                    <span><strong>RAPIDS:</strong> 2025-IN-132301</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
                    <span><strong>Legal Name:</strong> Elevate for Humanity Inc.</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-blue-100 mb-3">Need documentation?</p>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
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
            <Shield className="w-6 h-6 text-blue-600" />
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
            <Building2 className="w-6 h-6 text-blue-600" />
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
            <FileCheck className="w-6 h-6 text-blue-600" />
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
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <a href="mailto:elevate4humanityedu@gmail.com" className="font-medium text-gray-900 hover:text-blue-600">
                      (317) 314-3757
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a href="mailto:elevate4humanityedu@gmail.com" className="font-medium text-gray-900 hover:text-blue-600">
                      elevate4humanityedu@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">Indianapolis, IN</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">Related Compliance Pages</h3>
              <div className="space-y-3">
                <Link
                  href="/accreditation"
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-blue-300 transition"
                >
                  <span className="font-medium">Accreditation & Approvals</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  href="/federal-compliance"
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-blue-300 transition"
                >
                  <span className="font-medium">Federal Compliance</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  href="/disclosures"
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-blue-300 transition"
                >
                  <span className="font-medium">Disclosures</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </Link>
                <Link
                  href="/compliance"
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-blue-300 transition"
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
      <section className="py-8 bg-gray-100">
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
