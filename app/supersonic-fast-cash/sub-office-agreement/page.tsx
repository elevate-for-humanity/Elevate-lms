'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';
import { useState } from 'react';
import { Shield, Download, FileText } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';



export default function SubOfficeAgreementPage() {
  const [formData, setFormData] = useState({
    subOfficeName: '',
    subOfficeAddress: '',
    subOfficeCity: '',
    subOfficeState: '',
    subOfficeZip: '',
    representativeName: '',
    representativeTitle: '',
    representativeEmail: '',
    representativePhone: '',
    effectiveDate: '',
  });

  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);
  const subOfficeSignatureRef = useRef<any>(null);
  const mainOfficeSignatureRef = useRef<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      alert('Please agree to the terms before signing');
      return;
    }

    if (subOfficeSignatureRef.current?.isEmpty()) {
      alert('Please provide your signature');
      return;
    }

    // Get signature data
    const subOfficeSignature = subOfficeSignatureRef.current?.toDataURL();

    // Prepare agreement data
    const agreementData = {
      ...formData,
      subOfficeSignature,
      signedAt: new Date().toISOString(),
      ipAddress: 'captured-on-server',
    };

    // Save to database
    try {
      const response = await fetch(
        '/api/supersonic-fast-cash/sub-office-agreements',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agreementData),
        }
      );

      if (response.ok) {
        setSigned(true);
        alert(
          'Agreement signed successfully! You will receive a copy via email.'
        );
      } else {
        alert('Error signing agreement. Please try again.');
      }
    } catch (error) {
      logger.error('Error:', error);
      alert('Error signing agreement. Please try again.');
    }
  };

  const clearSignature = () => {
    subOfficeSignatureRef.current?.clear();
  };

  if (signed) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <h1 className="text-3xl font-bold text-black mb-4">
              Agreement Signed Successfully!
            </h1>
            <p className="text-black mb-6">
              Your Sub-Office Agreement has been digitally signed and recorded.
              You will receive a copy via email shortly.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700"
              >
                <Download className="w-5 h-5 inline mr-2" />
                Download PDF
              </button>
              <a
                href="/supersonic-fast-cash"
                className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Sub Office Agreement" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-brand-blue-900 text-white rounded-t-lg p-8">
          <div className="flex items-center gap-4 mb-4">
            <Shield className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-black uppercase">
                Sub-Office Agreement
              </h1>
              <p className="text-brand-blue-200">
                Supersonic Fast Cash Tax Preparation
              </p>
            </div>
          </div>
        </div>

        {/* Agreement Content */}
        <div className="bg-white shadow-xl p-8">
          <div className="prose max-w-none mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              Sub-Office Tax Preparation Memorandum of Understanding
            </h2>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <p className="font-semibold">
                Important: Read Carefully Before Signing
              </p>
              <p className="text-sm">
                This is a legally binding agreement. By signing digitally, you
                agree to all terms.
              </p>
            </div>

            <h3 className="text-xl font-bold mt-6 mb-3">1. Relationship</h3>
            <p>
              This Memorandum of Understanding ("MOU") defines the working
              relationship between
              <strong> Supersonic Fast Cash</strong> ("Main Office") and
              approved Sub-Office operators ("Sub-Office"). This arrangement
              does not create a partnership, joint venture, or ownership
              interest.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3">2. Scope of Work</h3>
            <p>
              <strong>Sub-Office Responsibilities:</strong>
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Client intake and document collection</li>
              <li>Accurate data entry and preliminary preparation</li>
              <li>Adherence to Main Office procedures and timelines</li>
            </ul>

            <p>
              <strong>Main Office Responsibilities:</strong>
            </p>
            <ul className="list-disc ml-6 mb-4">
              <li>Software licensing and systems (SupersonicFastCash)</li>
              <li>Pricing structure and fee determination</li>
              <li>Final review and filing authority</li>
              <li>Compliance oversight, corrections, notices, and audits</li>
            </ul>

            <h3 className="text-xl font-bold mt-6 mb-3">3. Fees, Advances, and Compensation</h3>
            
            <h4 className="text-lg font-bold mt-4 mb-2">3.1 Tax Preparation Fees (Platform-Controlled)</h4>
            <p className="mb-4">
              All tax preparation fees associated with Supersonic Fast Cash are established, disclosed, and collected 
              exclusively by the Program Owner through the official platform. Sub-Office Operators are prohibited from 
              adding, modifying, bundling, or separately collecting any preparation fees.
            </p>

            <h4 className="text-lg font-bold mt-4 mb-2">3.2 Revenue Allocation (Preparation Fees Only)</h4>
            <p className="mb-2">Net tax preparation fees collected through the platform shall be allocated as follows:</p>
            <ul className="list-disc ml-6 mb-4">
              <li><strong>Sixty percent (60%)</strong> to the Program Owner</li>
              <li><strong>Forty percent (40%)</strong> to the Sub-Office Operator</li>
            </ul>
            <p className="mb-4">
              This allocation applies solely to tax preparation fees. No other fees are subject to revenue sharing.
            </p>

            <h4 className="text-lg font-bold mt-4 mb-2">3.3 Refund Advances (Third-Party Bank Product)</h4>
            <p className="mb-2">Refund advances are optional financial products offered through third-party banking partners.</p>
            <ul className="list-disc ml-6 mb-4">
              <li>Advance eligibility, amounts, terms, and costs are determined solely by the bank</li>
              <li>Any advance costs are deducted from the taxpayer's refund by the bank</li>
              <li><strong>Sub-Office Operators receive no portion of advance fees, interest, or related costs</strong></li>
              <li>Sub-Office Operators may not represent advance costs as compensation, commission, or income</li>
            </ul>

            <h4 className="text-lg font-bold mt-4 mb-2">3.4 Prohibited Fees and Practices</h4>
            <p className="mb-2">Sub-Office Operators may not impose, request, or collect any of the following:</p>
            <ul className="list-disc ml-6 mb-4">
              <li>Add-on fees of any kind</li>
              <li>Rush, document, processing, or convenience fees</li>
              <li>Advance "processing" or facilitation fees</li>
              <li>Off-platform payments or side agreements with clients</li>
            </ul>
            <div className="bg-red-50 border-l-4 border-red-600 p-4 my-4">
              <p className="font-bold">Critical:</p>
              <p>
                Any unauthorized fee activity constitutes a material breach and grounds for immediate termination.
              </p>
            </div>

            <h4 className="text-lg font-bold mt-4 mb-2">3.5 Payment Flow and Submission Control</h4>
            <p className="mb-4">
              All client payments must be processed through the official Supersonic Fast Cash system prior to tax return submission. 
              Off-platform collection or circumvention of platform controls is prohibited.
            </p>

            <h4 className="text-lg font-bold mt-4 mb-2">3.6 Compliance and Audit Rights</h4>
            <p className="mb-4">
              The Program Owner reserves the right to audit transactions, disclosures, and communications to ensure adherence 
              to this fee structure and applicable laws. Sub-Office Operators agree to cooperate fully with any such review.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3">4. Exclusions</h3>
            <p>No compensation is paid on:</p>
            <ul className="list-disc ml-6 mb-4">
              <li>Rejected or withdrawn returns</li>
              <li>Penalties or interest</li>
              <li>Audit or notice response work</li>
              <li>Refund advances or third-party incentives</li>
            </ul>

            <h3 className="text-xl font-bold mt-6 mb-3">
              5. Quality & Compliance
            </h3>
            <p>
              Sub-Offices are expected to maintain high accuracy and compliance
              standards. Excessive errors or violations may result in removal
              from bonus eligibility or termination.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3">6. Termination</h3>
            <p>
              Either party may terminate this agreement with written notice.
              Accepted returns completed prior to termination will be
              compensated according to this MOU.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="border-t-2 border-gray-200 pt-8"
          >
            <h3 className="text-2xl font-bold mb-6">Sub-Office Information</h3>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block font-bold mb-2">
                  Sub-Office Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subOfficeName}
                  onChange={(e) =>
                    setFormData({ ...formData, subOfficeName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Effective Date *</label>
                <input
                  type="date"
                  required
                  value={formData.effectiveDate}
                  onChange={(e) =>
                    setFormData({ ...formData, effectiveDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold mb-2">Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.subOfficeAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subOfficeAddress: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={formData.subOfficeCity}
                  onChange={(e) =>
                    setFormData({ ...formData, subOfficeCity: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">State *</label>
                <input
                  type="text"
                  required
                  value={formData.subOfficeState}
                  onChange={(e) =>
                    setFormData({ ...formData, subOfficeState: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">ZIP Code *</label>
                <input
                  type="text"
                  required
                  value={formData.subOfficeZip}
                  onChange={(e) =>
                    setFormData({ ...formData, subOfficeZip: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-6 mt-8">
              Representative Information
            </h3>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block font-bold mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.representativeName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      representativeName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.representativeTitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      representativeTitle: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.representativeEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      representativeEmail: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.representativePhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      representativePhone: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Digital Signature */}
            <div className="border-t-2 border-gray-200 pt-8 mt-8">
              <h3 className="text-2xl font-bold mb-6">Digital Signature</h3>

              <div className="mb-6">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    I have read and agree to all terms and conditions outlined
                    in this Sub-Office Agreement. I understand this is a legally
                    binding digital signature.
                  </span>
                </label>
              </div>

              <div className="mb-4">
                <label className="block font-bold mb-2">Sign Below *</label>
                <div className="border-2 border-gray-300 rounded-lg bg-white">
                  <SignatureCanvas
                    ref={subOfficeSignatureRef}
                    canvasProps={{
                      className: 'w-full h-40',
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="mt-2 text-sm text-brand-blue-600 hover:underline"
                >
                  Clear Signature
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-black">
                  <strong>Digital Signature Acknowledgment:</strong> By signing
                  above, you acknowledge that:
                </p>
                <ul className="text-sm text-black list-disc ml-6 mt-2">
                  <li>
                    This digital signature has the same legal effect as a
                    handwritten signature
                  </li>
                  <li>Your IP address and timestamp will be recorded</li>
                  <li>
                    You will receive a copy of this signed agreement via email
                  </li>
                  <li>This agreement is legally binding and enforceable</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={!agreed}
                className="w-full py-4 bg-brand-blue-900 text-white font-black text-lg rounded-lg hover:bg-brand-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed uppercase"
              >
                <FileText className="w-5 h-5 inline mr-2" />
                Sign Agreement Digitally
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 rounded-b-lg p-6 text-center text-sm text-black">
          <p>
            Supersonic Fast Cash | Licensed Enrolled Agent | IRS-Authorized Tax
            Professional
          </p>
          <p className="mt-2">
            Questions? Call Get Help Online or email supersonicfastcashllc@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
