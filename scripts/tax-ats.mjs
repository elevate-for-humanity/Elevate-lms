#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  buildSubmissionArchive,
  buildIfaTransmission,
} from '../lib/tax-software/ats/submission-package.mjs';

const command = process.argv[2] || 'audit';
const option = (name, fallback) =>
  process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;
const root = path.resolve(option('root', process.cwd()));
const digest = (content) => createHash('sha256').update(content).digest('hex');
const isFile = (name) =>
  Boolean(name && fs.existsSync(name) && fs.statSync(name).isFile() && fs.statSync(name).size);
function validate(xml, xsd) {
  if (!isFile(xml) || !isFile(xsd))
    throw new Error('Provide existing XML and the official matching XSD file');
  const result = execFileSync(
    option('python', 'python3'),
    [
      path.join(root, 'scripts/tax-ats-validate.py'),
      '--xml',
      path.resolve(xml),
      '--xsd',
      path.resolve(xsd),
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  return JSON.parse(result);
}
function audit() {
  const scenarioFile = path.join(root, 'tests/fixtures/tax-ats/ty2026/scenarios.json');
  const scenarioManifest = JSON.parse(fs.readFileSync(scenarioFile, 'utf8'));
  const registry = fs.readFileSync(
    path.join(root, 'lib/tax-software/form-registry-2026.ts'),
    'utf8',
  );
  const registered = new Set(
    [...registry.matchAll(/code\s*:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]),
  );
  const scenarios = scenarioManifest.scenarios.map((scenario) => ({
    id: scenario.id,
    sourceVerified:
      isFile(path.join(path.dirname(scenarioFile), scenario.fixture)) &&
      digest(fs.readFileSync(path.join(path.dirname(scenarioFile), scenario.fixture))) ===
        scenario.sourceSha256,
    missingRegistryForms: scenario.requiredForms.filter((form) => !registered.has(form)),
    atsAccepted: false,
  }));
  const files = {
    federalCalculator: 'lib/tax-software/calculation/federal-1040-2026.ts',
    creditWorksheets: 'lib/tax-software/calculation/credits-2026.ts',
    encryptedIdentityStorage: 'lib/tax-software/security/encryption.ts',
    signedSourceDigest: 'lib/tax-software/security/return-digest.ts',
    localXmlValidator: 'scripts/tax-ats-validate.py',
    localPackageBuilder: 'lib/tax-software/ats/submission-package.mjs',
    irsXmlGenerator: 'lib/tax-software/mef/return-xml.ts',
    businessRuleValidator: 'lib/tax-software/mef/business-rules.ts',
    a2aTransport: 'lib/tax-software/transmission/adapters/irs-mef.ts',
  };
  const code = Object.fromEntries(
    Object.entries(files).map(([key, file]) => [key, isFile(path.join(root, file))]),
  );
  const config = Object.fromEntries(
    ['IRS_EFIN', 'IRS_ETIN', 'IRS_SOFTWARE_ID', 'IRS_APPSYSID', 'TAX_DATA_ENCRYPTION_KEY'].map(
      (key) => [key, Boolean(process.env[key])],
    ),
  );
  config.IRS_WSDL_PATH = isFile(process.env.IRS_WSDL_PATH);
  config.IRS_BUSINESS_RULES_PATH = isFile(process.env.IRS_BUSINESS_RULES_PATH);
  config.IRS_A2A_CERT_PATH = isFile(process.env.IRS_A2A_CERT_PATH);
  const starter = option('starter', null);
  const parity = [];
  if (starter) {
    for (const relative of [
      'calculation/federal-1040-2026.ts',
      'calculation/credits-2026.ts',
      'calculation/input-schema.ts',
      'calculation/financial-inputs.ts',
      'calculation/prepare-federal-return.ts',
      'calculation/schedule-c-2026.ts',
      'mef/return-xml.ts',
      'mef/business-documents.ts',
      'mef/family-documents.ts',
      'mef/family-types.ts',
      'mef/ty2026-field-order.json',
      'mef/serialize-return.ts',
      'mef/business-rules.ts',
      'security/encryption.ts',
      'security/profile-schema.ts',
      'security/return-digest.ts',
      'calculation/ty2026-base-1040.ts',
      'diagnostics/return-diagnostics.ts',
      'document-extraction.ts',
      'form-registry-2026.ts',
      'mef-readiness.ts',
      'paris-interview.ts',
      'self-file-pricing.ts',
      'transmission/hub.ts',
      'transmission/adapters/certification-export.ts',
    ]) {
      const file = `lib/tax-software/${relative}`;
      const a = path.join(root, file),
        b = path.join(path.resolve(starter), file);
      parity.push({
        file,
        identical:
          isFile(a) && isFile(b) && digest(fs.readFileSync(a)) === digest(fs.readFileSync(b)),
      });
    }
  }
  return {
    taxYear: 2026,
    processingYear: 2027,
    code,
    codeCheckScope: 'File presence only; does not establish complete form or rule coverage',
    config,
    configScope: 'Current local process only; does not inspect deployed runtime secrets',
    scenarios,
    parity,
    atsAccepted: false,
    preparationAvailable: true,
  };
}

async function packageTransmission() {
  const inputPath = option('input', null);
  if (!inputPath) throw new Error('Use --input=path/to/package.json');
  const spec = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const base = path.dirname(path.resolve(inputPath));
  const local = (value) => path.resolve(base, value);
  const returnValidation = validate(local(spec.returnXml), local(spec.returnXsd));
  const manifestValidation = validate(local(spec.manifestXml), local(spec.manifestXsd));
  const envelopeValidation = validate(local(spec.soapEnvelopeXml), local(spec.soapEnvelopeXsd));
  const submission = await buildSubmissionArchive({
    submissionId: spec.submissionId,
    processingYear: spec.processingYear,
    manifestXml: fs.readFileSync(local(spec.manifestXml)),
    returnXml: fs.readFileSync(local(spec.returnXml)),
    attachments: (spec.attachments || []).map((attachment) => ({
      name: attachment.name,
      content: fs.readFileSync(local(attachment.path)),
    })),
  });
  const transmission = await buildIfaTransmission({
    soapEnvelopeXml: fs.readFileSync(local(spec.soapEnvelopeXml)),
    submissions: [submission],
  });
  const output = path.resolve(option('out', 'output/tax-ats'));
  fs.mkdirSync(output, { recursive: true, mode: 0o700 });
  for (const file of [submission, transmission])
    fs.writeFileSync(path.join(output, file.filename), file.content, { mode: 0o600, flag: 'wx' });
  const report = {
    status: 'local_ifa_package_generated',
    returnValidation,
    manifestValidation,
    envelopeValidation,
    submissionSha256: digest(submission.content),
    transmissionSha256: digest(transmission.content),
    businessRulesValidated: false,
    irsTransmitted: false,
    atsAccepted: false,
  };
  fs.writeFileSync(
    path.join(output, 'validation-report.json'),
    JSON.stringify(report, null, 2) + '\n',
    { mode: 0o600, flag: 'wx' },
  );
  return report;
}

try {
  if (command === 'audit') console.log(JSON.stringify(audit(), null, 2));
  else if (command === 'validate')
    console.log(JSON.stringify(validate(option('xml'), option('xsd')), null, 2));
  else if (command === 'package') console.log(JSON.stringify(await packageTransmission(), null, 2));
  else if (command === 'help')
    console.log(
      'Commands: audit [--starter=path], validate --xml=path --xsd=path, package --input=path --out=path. Packages use official IRS XML/XSD; creation does not submit them.',
    );
  else throw new Error('Unknown command; run node scripts/tax-ats.mjs help');
} catch (error) {
  // XML validation emits structural error locations, never document contents.
  console.error(error.stdout?.toString().trim() || error.message);
  process.exitCode = 1;
}
