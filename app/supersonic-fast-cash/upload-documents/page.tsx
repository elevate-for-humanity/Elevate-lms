
'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';
import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, ChevronDown, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// IRS Required Tax Documents - Based on IRS.gov VITA/TCE checklist
const TAX_DOCUMENT_CATEGORIES = [
  {
    category: 'Identity Documents',
    description: 'Required for all filers',
    documents: [
      { id: 'drivers-license', name: "Driver's License or State ID", required: true, description: 'Valid photo ID for you and spouse' },
      { id: 'social-security-card', name: 'Social Security Card', required: true, description: 'For you, spouse, and all dependents' },
      { id: 'itin-notice', name: 'ITIN Notice (CP-01A)', required: false, description: 'If you have an ITIN instead of SSN' },
      { id: 'ip-pin', name: 'Identity Protection PIN', required: false, description: 'If issued by IRS' },
    ],
  },
  {
    category: 'Income - Employment',
    description: 'Wage and salary income',
    documents: [
      { id: 'w2', name: 'Form W-2 (Wage Statement)', required: true, description: 'From all employers' },
      { id: 'w2g', name: 'Form W-2G (Gambling Winnings)', required: false, description: 'If you had gambling winnings' },
    ],
  },
  {
    category: 'Income - 1099 Forms',
    description: 'Other income sources',
    documents: [
      { id: '1099-nec', name: 'Form 1099-NEC (Nonemployee Compensation)', required: false, description: 'Freelance/contract income' },
      { id: '1099-misc', name: 'Form 1099-MISC (Miscellaneous Income)', required: false, description: 'Rents, royalties, other income' },
      { id: '1099-int', name: 'Form 1099-INT (Interest Income)', required: false, description: 'Bank interest earned' },
      { id: '1099-div', name: 'Form 1099-DIV (Dividend Income)', required: false, description: 'Stock dividends' },
      { id: '1099-b', name: 'Form 1099-B (Stock Sales)', required: false, description: 'Proceeds from broker transactions' },
      { id: '1099-r', name: 'Form 1099-R (Retirement Distributions)', required: false, description: 'Pension, IRA, 401(k) distributions' },
      { id: '1099-g', name: 'Form 1099-G (Government Payments)', required: false, description: 'Unemployment, state tax refunds' },
      { id: '1099-ssa', name: 'Form SSA-1099 (Social Security Benefits)', required: false, description: 'Social Security income' },
      { id: '1099-k', name: 'Form 1099-K (Payment Card Transactions)', required: false, description: 'PayPal, Venmo, credit card payments' },
      { id: '1099-c', name: 'Form 1099-C (Cancellation of Debt)', required: false, description: 'Forgiven debt income' },
      { id: '1099-s', name: 'Form 1099-S (Real Estate Sales)', required: false, description: 'Proceeds from real estate transactions' },
    ],
  },
  {
    category: 'Self-Employment',
    description: 'Business and freelance income',
    documents: [
      { id: 'schedule-c-records', name: 'Business Income Records', required: false, description: 'Gross receipts, invoices' },
      { id: 'business-expenses', name: 'Business Expense Records', required: false, description: 'Receipts for deductible expenses' },
      { id: 'mileage-log', name: 'Vehicle Mileage Log', required: false, description: 'Business miles driven' },
      { id: 'home-office', name: 'Home Office Expenses', required: false, description: 'Square footage, utilities, rent' },
    ],
  },
  {
    category: 'Deductions - Itemized',
    description: 'If itemizing instead of standard deduction',
    documents: [
      { id: '1098', name: 'Form 1098 (Mortgage Interest)', required: false, description: 'Mortgage interest paid' },
      { id: '1098-t', name: 'Form 1098-T (Tuition Statement)', required: false, description: 'College tuition paid' },
      { id: '1098-e', name: 'Form 1098-E (Student Loan Interest)', required: false, description: 'Student loan interest paid' },
      { id: 'property-tax', name: 'Property Tax Statements', required: false, description: 'Real estate taxes paid' },
      { id: 'charitable-receipts', name: 'Charitable Donation Receipts', required: false, description: 'Cash and non-cash donations' },
      { id: 'medical-receipts', name: 'Medical Expense Receipts', required: false, description: 'Out-of-pocket medical costs' },
    ],
  },
  {
    category: 'Healthcare',
    description: 'Health insurance documentation',
    documents: [
      { id: '1095-a', name: 'Form 1095-A (Marketplace Insurance)', required: false, description: 'If you had ACA marketplace coverage' },
      { id: '1095-b', name: 'Form 1095-B (Health Coverage)', required: false, description: 'Proof of health insurance' },
      { id: '1095-c', name: 'Form 1095-C (Employer Health Coverage)', required: false, description: 'Employer-provided insurance' },
    ],
  },
  {
    category: 'Credits & Other',
    description: 'Documents for tax credits',
    documents: [
      { id: 'daycare-info', name: 'Childcare Provider Information', required: false, description: 'Provider name, address, EIN/SSN, amount paid' },
      { id: 'prior-year-return', name: 'Prior Year Tax Return', required: false, description: 'Last year\'s federal and state returns' },
      { id: 'bank-info', name: 'Bank Account Information', required: false, description: 'Routing and account numbers for direct deposit' },
      { id: 'estimated-payments', name: 'Estimated Tax Payments', required: false, description: 'Records of quarterly payments made' },
    ],
  },
];

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  documentType: string;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export default function UploadDocumentsPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setUploading(true);

    for (const file of selectedFiles) {
      // Add file to list with uploading status
      const newFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        documentType: selectedDocType,
        status: 'uploading',
      };
      setFiles((prev) => [...prev, newFile]);

      try {
        const supabase = createClient();

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `tax-documents/${fileName}`;

        const { data, error }: any = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('documents').getPublicUrl(filePath);

        // Save to database
        await supabase.from('tax_documents').insert({
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          document_type: selectedDocType,
          email: email,
          phone: phone,
          status: 'pending_review',
        });

        // Update file status to success
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? { ...f, status: 'success', url: publicUrl }
              : f
          )
        );
      } catch (error) {
        logger.error('Upload error:', error);
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? {
                  ...f,
                  status: 'error',
                  error:
                    'An error occurred',
                }
              : f
          )
        );
      }
    }

    setUploading(false);
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Upload Documents" }]} />
      </div>
<div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">
            Upload Your Tax Documents
          </h1>
          <p className="text-xl text-black">
            Securely upload your W-2s, 1099s, receipts, and other tax documents
          </p>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-black mb-6">
            Your Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                placeholder="(317) 555-0123"
                required
              />
            </div>
          </div>
        </div>

        {/* Document Type Selection */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-black mb-2">
            Select Document Type
          </h2>
          <p className="text-gray-600 mb-6">
            Choose the type of document you&apos;re uploading (based on IRS requirements)
          </p>

          <div className="mb-6">
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-black bg-white"
            >
              <option value="">-- Select Document Type --</option>
              {TAX_DOCUMENT_CATEGORIES.map((category) => (
                <optgroup key={category.category} label={category.category}>
                  {category.documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} {doc.required ? '(Required)' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Show description for selected document */}
          {selectedDocType && (
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  {TAX_DOCUMENT_CATEGORIES.flatMap(c => c.documents).find(d => d.id === selectedDocType)?.description}
                </div>
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-brand-blue-500 transition-colors">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-gray-600 mb-6">
              Accepted: PDF, JPG, PNG, DOC, DOCX (Max 10MB per file)
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={!email || !phone || !selectedDocType || uploading}
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                !email || !phone || !selectedDocType || uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
              }`}
            >
              <Upload className="w-5 h-5" />
              Select Files
            </label>
          </div>

          {(!email || !phone || !selectedDocType) && (
            <p className="text-sm text-amber-600 mt-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {!email || !phone 
                ? 'Please enter your email and phone number before uploading'
                : 'Please select a document type before uploading'}
            </p>
          )}
        </div>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-black mb-6">
              Uploaded Files
            </h2>
            <div className="space-y-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-black truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-black">
                        {formatFileSize(file.size)}
                      </p>
                      {file.error && (
                        <p className="text-sm text-red-600 mt-1">
                          {file.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {file.status === 'uploading' && (
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue-600" />
                    )}
                    {file.status === 'success' && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                    <button
                      onClick={() => removeFile(file.name)}
                      className="p-1 hover:bg-gray-100 rounded"
                      disabled={file.status === 'uploading'}
                    >
                      <X className="w-5 h-5 text-black" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IRS Document Checklist */}
        <div className="bg-white rounded-xl shadow-sm p-8 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-brand-blue-600" />
            <div>
              <h3 className="text-xl font-bold text-black">
                IRS Tax Document Checklist
              </h3>
              <p className="text-gray-600 text-sm">Based on IRS VITA/TCE requirements</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {TAX_DOCUMENT_CATEGORIES.map((category) => (
              <div key={category.category} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.category ? null : category.category)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div>
                    <h4 className="font-semibold text-black">{category.category}</h4>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedCategory === category.category ? 'rotate-180' : ''}`} />
                </button>
                
                {expandedCategory === category.category && (
                  <div className="p-4 bg-white">
                    <ul className="space-y-3">
                      {category.documents.map((doc) => (
                        <li key={doc.id} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${doc.required ? 'bg-red-100' : 'bg-gray-100'}`}>
                            {doc.required ? (
                              <span className="text-red-600 text-xs font-bold">!</span>
                            ) : (
                              <CheckCircle className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-black">{doc.name}</span>
                            {doc.required && <span className="text-red-600 text-xs ml-2">(Required)</span>}
                            <p className="text-sm text-gray-600">{doc.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Important:</strong> Bring original documents to your appointment. 
                If filing jointly, both spouses must be present to sign. 
                For more information, visit <a href="https://www.irs.gov/individuals/checklist-for-free-tax-return-preparation" target="_blank" rel="noopener noreferrer" className="underline font-medium">IRS.gov</a>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
