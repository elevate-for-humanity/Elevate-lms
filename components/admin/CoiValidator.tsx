'use client';

import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Shield,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Calendar,
  Building2,
  MapPin,
  HardHat,
  Fingerprint,
  FileSearch,
  Eye,
} from 'lucide-react';

// ── Types matching the API response ──

type ValidationFields = {
  acordFormDetected: boolean;
  insurerName: string | null;
  policyNumberDetected: boolean;
  namedInsured: string | null;
  namedInsuredMatched: boolean | null;
  glDetected: boolean;
  glPerOccurrence: number | null;
  glAggregate: number | null;
  proLiabilityDetected: boolean;
  proLiabilityType: string | null;
  workersCompDetected: boolean;
  workersCompVerified: boolean;
  workersCompRequired: boolean;
  relevantBusinessClassDetected: boolean;
  detectedBusinessClass: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  effectiveDateFuture: boolean | null;
  expired: boolean | null;
  addressMatched: boolean | null;
  certificateHolderDetected: boolean;
  certificateHolderMatched: boolean | null;
  additionalInsuredDetected: boolean;
  ocrConfidence: number | null;
  ocrConfidenceSufficient: boolean | null;
};

type ValidationResult = {
  status: 'PASS' | 'FAIL';
  riskLevel: 'CLEAN' | 'LOW_RISK' | 'HIGH_RISK';
  extractedTextChars: number;
  missing: string[];
  reasonCodes: string[];
  fields: ValidationFields;
};

type DecisionResult = {
  decision: 'APPROVED' | 'REJECTED';
  method: 'PDF_TEXT' | 'OCR' | 'NONE';
  riskLevel: 'CLEAN' | 'LOW_RISK' | 'HIGH_RISK';
  validation: ValidationResult;
};

type WorkerRelationship = 'w2_employees' | '1099_contractors_only' | 'owner_only' | 'not_sure';

interface CoiValidatorProps {
  applicationId?: string;
  expectedBusinessName?: string;
  expectedShopAddress?: string;
  expectedCertificateHolder?: string;
  /** Pre-set from application data. Drives conditional WC gate. */
  workerRelationship?: WorkerRelationship;
  onResult?: (result: DecisionResult) => void;
}

export function CoiValidator({
  applicationId,
  expectedBusinessName = '',
  expectedShopAddress = '',
  expectedCertificateHolder = 'Elevate for Humanity',
  workerRelationship: initialRelationship,
  onResult,
}: CoiValidatorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [businessName, setBusinessName] = useState(expectedBusinessName);
  const [shopAddress, setShopAddress] = useState(expectedShopAddress);
  const [certHolder, setCertHolder] = useState(expectedCertificateHolder);
  const [workerRel, setWorkerRel] = useState<WorkerRelationship | undefined>(initialRelationship);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append('file', file);
    if (businessName.trim()) form.append('expectedBusinessName', businessName.trim());
    if (shopAddress.trim()) form.append('expectedShopAddress', shopAddress.trim());
    if (certHolder.trim()) form.append('expectedCertificateHolder', certHolder.trim());
    if (workerRel) form.append('workerRelationship', workerRel);
    if (applicationId) form.append('applicationId', applicationId);

    try {
      const res = await fetch('/api/admin/validate-coi', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${res.status})`);
      }

      const { result: decision } = await res.json();
      setResult(decision);
      onResult?.(decision);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-brand-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">COI Validation</h3>
      </div>

      {!result && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Certificate of Insurance (PDF)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                <Upload className="h-4 w-4" />
                {file ? 'Change file' : 'Choose PDF'}
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {file && (
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  {file.name}
                  <span className="text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Expected Business Name
                <span className="ml-1 text-xs text-red-500">*matched against Named Insured</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Elite Cuts Barbershop LLC"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Expected Shop Address
                <span className="ml-1 text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="e.g. 123 Main St, Indianapolis, IN"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Certificate Holder (your org)
                <span className="ml-1 text-xs text-red-500">*hard fail if not matched</span>
              </label>
              <input
                type="text"
                value={certHolder}
                onChange={(e) => setCertHolder(e.target.value)}
                placeholder="Elevate for Humanity"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
              />
            </div>
          </div>

          {/* Worker relationship — drives conditional WC gate */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Worker relationship
              <span className="ml-1 text-xs text-red-500">*WC required for W-2 employees</span>
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="workerRel"
                  checked={workerRel === 'w2_employees'}
                  onChange={() => setWorkerRel('w2_employees')}
                  className="h-4 w-4 text-brand-blue-600"
                />
                W-2 employees
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="workerRel"
                  checked={workerRel === '1099_contractors_only'}
                  onChange={() => setWorkerRel('1099_contractors_only')}
                  className="h-4 w-4 text-brand-blue-600"
                />
                1099 contractors only
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="workerRel"
                  checked={workerRel === 'owner_only'}
                  onChange={() => setWorkerRel('owner_only')}
                  className="h-4 w-4 text-brand-blue-600"
                />
                Owner only
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-500">
                <input
                  type="radio"
                  name="workerRel"
                  checked={workerRel === 'not_sure' || workerRel === undefined}
                  onChange={() => setWorkerRel('not_sure')}
                  className="h-4 w-4 text-gray-400"
                />
                Not sure
              </label>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="flex items-center gap-2 rounded-md bg-brand-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning COI...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Validate COI
              </>
            )}
          </button>
        </form>
      )}

      {result && <ResultDisplay result={result} onReset={handleReset} />}
    </div>
  );
}

// ── Result display ──

function ResultDisplay({
  result,
  onReset,
}: {
  result: DecisionResult;
  onReset: () => void;
}) {
  const approved = result.decision === 'APPROVED';
  const v = result.validation;
  const f = v.fields;

  return (
    <div className="space-y-4">
      {/* Decision banner */}
      <div
        className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
          approved ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}
      >
        {approved ? (
          <ShieldCheck className="h-6 w-6 flex-shrink-0 text-green-600" />
        ) : (
          <ShieldX className="h-6 w-6 flex-shrink-0 text-red-600" />
        )}
        <div>
          <p className="font-semibold">{approved ? 'COI Approved' : 'COI Rejected'}</p>
          <p className="text-sm opacity-80">
            Extraction: {result.method} &middot; {v.extractedTextChars.toLocaleString()} chars
            {f.acordFormDetected && ' \u00B7 ACORD form detected'}
            {f.ocrConfidence !== null && ` \u00B7 OCR confidence: ${f.ocrConfidence.toFixed(0)}%`}
          </p>
        </div>
      </div>

      {/* Risk level */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase text-gray-500">Risk Level:</span>
        <RiskBadge level={v.riskLevel} />
      </div>

      {/* Missing items */}
      {v.missing.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-sm font-semibold text-red-800">Missing or insufficient:</p>
          <ul className="space-y-1">
            {v.missing.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-md bg-white p-3 text-sm text-gray-700">
            <p className="font-medium">What to tell the partner:</p>
            <p className="mt-1 text-gray-600">
              Request a new COI (ACORD 25 form) from your insurance agent showing: Commercial
              General Liability ($1M per occurrence / $2M aggregate), Professional/Barber Services
              Liability ($1M per claim), active policy dates, your shop as Named Insured, and
              &quot;Elevate for Humanity&quot; as Certificate Holder. Upload as a digital PDF.
            </p>
          </div>
        </div>
      )}

      {/* Field-by-field breakdown */}
      <div className="rounded-md border border-gray-200 p-4">
        <p className="mb-3 text-sm font-semibold text-gray-700">Validation Details</p>
        <div className="space-y-2">
          {/* Document identity */}
          <FieldRow
            label="ACORD 25 Form"
            ok={f.acordFormDetected}
            detail={f.acordFormDetected ? 'Detected' : 'Not detected (non-standard format)'}
            informational
            icon={<FileSearch className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />}
          />
          <FieldRow
            label="Insurance Carrier"
            ok={!!f.insurerName}
            detail={f.insurerName || 'Not detected — document may be incomplete'}
            icon={<Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />}
          />
          <FieldRow
            label="Policy Number"
            ok={f.policyNumberDetected}
            detail={f.policyNumberDetected ? 'Detected' : 'Not detected — document may be altered or partial'}
            icon={<Fingerprint className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />}
          />

          {/* Named Insured */}
          <FieldRow
            label="Named Insured"
            ok={f.namedInsuredMatched === true}
            detail={
              f.namedInsured
                ? `"${f.namedInsured}"${f.namedInsuredMatched === true ? ' — matches expected' : f.namedInsuredMatched === false ? ' — DOES NOT match expected business name' : ''}`
                : 'Not extracted'
            }
          />

          {/* Coverage */}
          <FieldRow
            label="General Liability"
            ok={f.glDetected && (f.glPerOccurrence ?? 0) >= 1_000_000}
            detail={
              f.glDetected
                ? `Per Occ: ${fmtMoney(f.glPerOccurrence)}, Aggregate: ${fmtMoney(f.glAggregate)}`
                : 'Not detected'
            }
          />
          <FieldRow
            label="Professional/Barber Liability"
            ok={f.proLiabilityDetected}
            detail={
              f.proLiabilityDetected
                ? `Detected as: ${f.proLiabilityType}`
                : 'Not detected — may be bundled under GL or BOP'
            }
          />
          <FieldRow
            label="Workers&apos; Compensation"
            ok={f.workersCompRequired ? f.workersCompVerified : f.workersCompDetected}
            detail={
              f.workersCompRequired
                ? f.workersCompVerified
                  ? 'Verified (carrier + policy + dates)'
                  : f.workersCompDetected
                    ? 'Detected but NOT verified — missing policy metadata'
                    : 'NOT detected — required (shop has employees)'
                : f.workersCompDetected
                  ? `Detected${f.workersCompVerified ? ' (verified)' : ''}`
                  : 'Not detected (not required — no employees declared)'
            }
            informational={!f.workersCompRequired}
            icon={<HardHat className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />}
          />
          <FieldRow
            label="Business Classification"
            ok={f.relevantBusinessClassDetected}
            detail={
              f.relevantBusinessClassDetected
                ? `Detected: ${f.detectedBusinessClass}`
                : 'No barber/cosmetology/salon classification found — verify policy scope'
            }
            informational
          />

          {/* Dates */}
          <FieldRow
            label="Effective Date"
            ok={f.effectiveDate !== null && !f.effectiveDateFuture}
            detail={
              f.effectiveDate
                ? `${f.effectiveDate}${f.effectiveDateFuture ? ' (FUTURE — not yet active)' : ''}`
                : 'Not detected'
            }
            informational={f.effectiveDate === null}
            icon={<Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />}
          />
          <FieldRow
            label="Expiration Date"
            ok={f.expired === false}
            detail={
              f.expirationDate
                ? `${f.expirationDate}${f.expired ? ' (EXPIRED)' : ''}`
                : 'Not detected'
            }
            icon={<Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />}
          />

          {/* Address */}
          {f.addressMatched !== null && (
            <FieldRow
              label="Shop Address"
              ok={f.addressMatched}
              detail={f.addressMatched ? 'Matched' : 'Not matched'}
              icon={<MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />}
            />
          )}

          {/* Certificate Holder */}
          <FieldRow
            label="Certificate Holder"
            ok={f.certificateHolderMatched === true}
            detail={
              !f.certificateHolderDetected
                ? 'Holder section not found — COI must name your organization'
                : f.certificateHolderMatched === null
                  ? 'Holder section found (no expected value to match)'
                  : f.certificateHolderMatched
                    ? 'Your organization found in holder section'
                    : 'Your organization NOT found in holder section'
            }
          />

          <FieldRow
            label="Additional Insured"
            ok={f.additionalInsuredDetected}
            detail={f.additionalInsuredDetected ? 'Endorsement language detected' : 'Not detected'}
            informational
          />

          {/* OCR quality */}
          {f.ocrConfidence !== null && (
            <FieldRow
              label="OCR Quality"
              ok={f.ocrConfidenceSufficient === true}
              detail={`${f.ocrConfidence.toFixed(0)}% confidence${f.ocrConfidenceSufficient === false ? ' — below minimum threshold' : ''}`}
              icon={<Eye className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />}
            />
          )}
        </div>
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <RotateCcw className="h-4 w-4" />
        Validate Another COI
      </button>
    </div>
  );
}

// ── Sub-components ──

function RiskBadge({ level }: { level: 'CLEAN' | 'LOW_RISK' | 'HIGH_RISK' }) {
  const config = {
    CLEAN: { bg: 'bg-green-100 text-green-800', icon: ShieldCheck, label: 'Clean' },
    LOW_RISK: { bg: 'bg-amber-100 text-amber-800', icon: ShieldAlert, label: 'Low Risk' },
    HIGH_RISK: { bg: 'bg-red-100 text-red-800', icon: ShieldX, label: 'High Risk' },
  }[level];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function FieldRow({
  label,
  ok,
  detail,
  informational = false,
  icon,
}: {
  label: string;
  ok: boolean;
  detail: string;
  informational?: boolean;
  icon?: React.ReactNode;
}) {
  const defaultIcon = ok ? (
    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
  ) : informational ? (
    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
  ) : (
    <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
  );

  return (
    <div className="flex items-start gap-2 text-sm">
      {icon || defaultIcon}
      <div>
        <span className="font-medium text-gray-800">{label}:</span>{' '}
        <span className="text-gray-600">{detail}</span>
      </div>
    </div>
  );
}

function fmtMoney(n: number | null): string {
  if (n === null) return 'Not parsed';
  return '$' + n.toLocaleString();
}
