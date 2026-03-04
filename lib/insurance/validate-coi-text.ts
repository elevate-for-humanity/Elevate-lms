import { z } from "zod";

// ── Public types ──

export const CoiTextInputSchema = z.object({
  extractedText: z.string(),
  expectedBusinessName: z.string().optional(),
  expectedShopAddress: z.string().optional(),
  expectedCertificateHolder: z.string().optional(),
  minGlPerOccurrence: z.number().default(1_000_000),
  minGlAggregate: z.number().default(2_000_000),
  minProLiabilityPerClaim: z.number().default(1_000_000),
  /** OCR confidence score (0-100). If provided and below threshold, triggers rejection. */
  ocrConfidence: z.number().optional(),
  /** Minimum OCR confidence to trust extraction. Default 40. */
  minOcrConfidence: z.number().default(40),
  /**
   * Worker relationship type. Drives conditional WC gate:
   * - w2_employees: WC is a hard fail if not verified
   * - 1099_contractors_only: WC not required, but attestation needed
   * - owner_only: WC not required, but attestation needed
   * - not_sure: WC treated as unknown — hard fail (fail-closed)
   */
  workerRelationship: z
    .enum(["w2_employees", "1099_contractors_only", "owner_only", "not_sure"])
    .optional(),
});

export type CoiTextValidationResult = {
  status: "PASS" | "FAIL";
  /**
   * Internal risk classification:
   * - CLEAN: all checks pass
   * - LOW_RISK: only soft failures (missing pro liability keyword but GL present, or renewal COI)
   * - HIGH_RISK: hard failures (expired, no GL, unreadable, identity mismatch, partial document)
   */
  riskLevel: "CLEAN" | "LOW_RISK" | "HIGH_RISK";
  extractedTextChars: number;
  missing: string[];
  reasonCodes: string[];
  fields: {
    acordFormDetected: boolean;

    // Insurer / policy identity (partial document guard)
    insurerName: string | null;
    policyNumberDetected: boolean;

    // Named Insured
    namedInsured: string | null;
    namedInsuredMatched: boolean | null;

    // General Liability
    glDetected: boolean;
    glPerOccurrence: number | null;
    glAggregate: number | null;

    // Professional / Barber Services Liability
    proLiabilityDetected: boolean;
    proLiabilityType: string | null;

    // Workers' Compensation
    workersCompDetected: boolean;
    /** WC has full policy metadata (carrier + policy number + dates), not just keyword */
    workersCompVerified: boolean;
    /** Whether WC was required based on worker relationship */
    workersCompRequired: boolean;

    // Business classification
    relevantBusinessClassDetected: boolean;
    detectedBusinessClass: string | null;

    // Dates
    effectiveDate: string | null;
    expirationDate: string | null;
    effectiveDateFuture: boolean | null;
    expired: boolean | null;

    // Address
    addressMatched: boolean | null;

    // Certificate holder
    certificateHolderDetected: boolean;
    certificateHolderMatched: boolean | null;

    // Additional Insured
    additionalInsuredDetected: boolean;

    // OCR quality
    ocrConfidence: number | null;
    ocrConfidenceSufficient: boolean | null;
  };
};

// ── Helpers ──

function normalize(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E]/g, " ")
    .trim()
    .toLowerCase();
}

function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDateLoose(dateStr: string): Date | null {
  const cleaned = dateStr.replace(/-/g, "/").trim();
  const parts = cleaned.split("/");
  if (parts.length !== 3) return null;
  const [m, d, y] = parts.map((p) => Number(p));
  if (!m || !d || !y) return null;
  const yyyy = y < 100 ? 2000 + y : y;
  const dt = new Date(Date.UTC(yyyy, m - 1, d));
  return Number.isFinite(dt.getTime()) ? dt : null;
}

function findFirst(re: RegExp, text: string, group = 1): string | null {
  const m = text.match(re);
  return m?.[group] ?? null;
}

/**
 * Extract a text block following a section header.
 * Returns up to `maxChars` after the header match.
 */
function extractSection(
  header: RegExp,
  text: string,
  maxChars = 300
): string | null {
  const m = text.match(header);
  if (!m || m.index === undefined) return null;
  return text.slice(m.index, m.index + m[0].length + maxChars);
}

/**
 * Find money value in a specific section of text (not globally).
 * Prevents grabbing umbrella/auto/WC limits when looking for GL.
 */
function findMoneyInSection(
  section: string,
  keyword: RegExp
): number | null {
  const m = section.match(keyword);
  if (!m || m.index === undefined) return null;
  // Look within 60 chars after the keyword match
  const after = section.slice(m.index, m.index + m[0].length + 60);
  const moneyMatch = after.match(/\$?\s?([\d,]{6,})/);
  if (!moneyMatch) return null;
  return parseMoney(moneyMatch[1]);
}

// ── Validator ──

export function validateCoiText(
  input: z.infer<typeof CoiTextInputSchema>
): CoiTextValidationResult {
  const data = CoiTextInputSchema.parse(input);

  const raw = data.extractedText || "";
  const t = normalize(raw);

  const missing: string[] = [];
  const hardFailures: string[] = [];
  const softFailures: string[] = [];

  // ── OCR confidence check ──
  let ocrConfidenceSufficient: boolean | null = null;
  if (data.ocrConfidence !== undefined) {
    ocrConfidenceSufficient = data.ocrConfidence >= data.minOcrConfidence;
    if (!ocrConfidenceSufficient) {
      missing.push(
        `OCR confidence too low (${data.ocrConfidence.toFixed(0)}% — minimum ${data.minOcrConfidence}%). Upload a clearer digital PDF.`
      );
      hardFailures.push("LOW_OCR_CONFIDENCE");
    }
  }

  // ── ACORD 25 form detection ──
  const acordFormDetected =
    /acord/.test(t) &&
    (/certificate of liability|certificate of insurance/.test(t) ||
      /insr\s*(ltr)?/.test(t) ||
      /type of insurance/.test(t));

  // ── Insurer / carrier name detection (partial document guard) ──
  // ACORD 25 has "INSURER A:", "INSURER B:", etc. or "INSURANCE COMPANY"
  let insurerName: string | null = null;
  const insurerMatch =
    raw.match(/insurer\s*[a-f]?\s*[:\-]\s*(.{5,80})/i) ||
    raw.match(/insurance\s+company\s*[:\-]?\s*(.{5,80})/i) ||
    raw.match(/carrier\s*[:\-]\s*(.{5,80})/i) ||
    raw.match(/underwritten\s+by\s*[:\-]?\s*(.{5,80})/i);
  if (insurerMatch?.[1]) {
    insurerName = insurerMatch[1].replace(/\s+/g, " ").trim().slice(0, 80);
  }

  // ── Policy number detection ──
  // ACORD 25: "POLICY NUMBER" column. Also matches common formats.
  const policyNumberDetected =
    /policy\s*(number|no|#|num)/i.test(raw) ||
    /pol\s*#/i.test(raw) ||
    // Common policy number patterns: letters + digits, 6+ chars
    /[A-Z]{2,4}[\s\-]?\d{5,}/i.test(raw);

  if (!insurerName) {
    missing.push("Insurance carrier/company name not detected — document may be incomplete");
    hardFailures.push("NO_INSURER");
  }
  if (!policyNumberDetected) {
    missing.push("Policy number not detected — document may be altered or partial");
    hardFailures.push("NO_POLICY_NUMBER");
  }

  // ── Named Insured extraction ──
  // ACORD 25: "INSURED" section (top-left, distinct from "INSURER")
  // Extract the named insured text block
  let namedInsured: string | null = null;
  let namedInsuredMatched: boolean | null = null;

  // Look for "INSURED" section (not "INSURER")
  const insuredSection =
    extractSection(/(?:named\s+)?insured\s*[:\n]/i, raw, 200) ||
    extractSection(/\binsured\b(?!\s*(a|b|c|d|e|f)\s*:)/i, raw, 200);

  if (insuredSection) {
    // Extract first meaningful line after the header
    const lines = insuredSection
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 2);
    // Skip the header line itself, take next non-empty line
    if (lines.length > 1) {
      namedInsured = lines[1].slice(0, 100);
    } else if (lines.length === 1) {
      // Header and value on same line
      const afterColon = lines[0].replace(/^.*?insured\s*[:\-]?\s*/i, "").trim();
      if (afterColon.length > 2) {
        namedInsured = afterColon.slice(0, 100);
      }
    }
  }

  // Compare named insured against expected business name
  if (data.expectedBusinessName) {
    const expected = normalize(data.expectedBusinessName);
    if (namedInsured) {
      const normalizedInsured = normalize(namedInsured);
      namedInsuredMatched =
        normalizedInsured.includes(expected) ||
        expected.includes(normalizedInsured) ||
        // Also check full document for the name (insured section parsing may be imprecise)
        t.includes(expected);
    } else {
      // No named insured section found — check full document as fallback
      namedInsuredMatched = t.includes(expected);
    }

    if (!namedInsuredMatched) {
      missing.push("Named Insured does not match expected business name");
      hardFailures.push("NAMED_INSURED_MISMATCH");
    }
  }

  // ── General Liability detection + limits (section-scoped) ──

  const glDetected =
    /general liability|commercial general liability|cgl/.test(t) ||
    (acordFormDetected && /commercial general/.test(t));

  let glPerOccurrence: number | null = null;
  let glAggregate: number | null = null;

  // Extract the GL section of the document to scope limit parsing.
  // This prevents grabbing umbrella/auto/WC limits.
  const glSection =
    extractSection(
      /general liability|commercial general liability|cgl/i,
      raw,
      500
    ) || raw; // fallback to full text if section not found

  // Find "Each Occurrence" limit within GL section only
  glPerOccurrence = findMoneyInSection(
    glSection,
    /each occurrence|per occurrence|each\s+occ/i
  );

  // Find "General Aggregate" limit within GL section only
  glAggregate = findMoneyInSection(
    glSection,
    /general aggregate|gen['']?l?\s*aggregate/i
  );

  // If aggregate not found in GL section, try "aggregate" near GL context
  if (!glAggregate) {
    glAggregate = findMoneyInSection(glSection, /aggregate/i);
  }

  if (!glDetected) {
    missing.push("General Liability coverage not detected");
    hardFailures.push("NO_GL");
  }
  if (!glPerOccurrence || glPerOccurrence < data.minGlPerOccurrence) {
    missing.push(
      `GL Each Occurrence >= $${data.minGlPerOccurrence.toLocaleString()}`
    );
    hardFailures.push("GL_PER_OCC_LOW");
  }
  if (!glAggregate || glAggregate < data.minGlAggregate) {
    missing.push(
      `GL Aggregate >= $${data.minGlAggregate.toLocaleString()}`
    );
    hardFailures.push("GL_AGG_LOW");
  }

  // ── Professional / Barber Services Liability ──

  let proLiabilityDetected = false;
  let proLiabilityType: string | null = null;

  const proLiabilityPatterns: [RegExp, string][] = [
    [/professional liability/, "Professional Liability"],
    [/errors and omissions|errors & omissions|e&o/, "Errors & Omissions"],
    [/malpractice/, "Malpractice"],
    [/barber.*liability|barber.*coverage/, "Barber Liability"],
    [/barbershop.*liability|barbershop.*coverage/, "Barbershop Liability"],
    [/cosmetology.*liability|cosmetology.*coverage/, "Cosmetology Liability"],
    [/beauty.*service.*liability|beauty.*service.*coverage/, "Beauty Services Liability"],
    [/salon.*liability|salon.*coverage/, "Salon Liability"],
    [/business owner.*policy|bop/, "Business Owner Policy (may include professional)"],
    [/professional.*endorsement|service.*liability.*endorsement/, "Professional Endorsement Rider"],
    [/prof.*liab|professional\s+liab/, "Professional Liability (abbreviated)"],
    [/barber.*professional|cosmetolog.*professional/, "Barber/Cosmetology Professional"],
  ];

  for (const [pattern, label] of proLiabilityPatterns) {
    if (pattern.test(t)) {
      proLiabilityDetected = true;
      proLiabilityType = label;
      break;
    }
  }

  if (!proLiabilityDetected) {
    missing.push(
      "Professional/Barber Services Liability coverage not detected"
    );
    softFailures.push("NO_PRO_LIABILITY");
  }

  // ── Workers' Compensation ──
  // Keyword detection (basic presence)
  const workersCompDetected =
    /workers.?\s*comp|workers.?\s*compensation|wc\s+statutory|statutory limits/.test(t) ||
    /work.*comp.*employer/.test(t);

  // Verified WC: must have carrier + policy number + dates in WC section
  // Not just "N/A" or a keyword mention
  let workersCompVerified = false;
  if (workersCompDetected) {
    const wcSection = extractSection(
      /workers.?\s*comp|workers.?\s*compensation/i,
      raw,
      400
    );
    if (wcSection) {
      const wcNorm = normalize(wcSection);
      // Reject "N/A", "not applicable", "none", "excluded" WC sections
      const isExcluded = /\bn\/?a\b|not applicable|none|excluded|waived/.test(wcNorm);
      if (!isExcluded) {
        // Must have at least a policy number pattern and a date
        const hasWcPolicyNum = /[A-Z]{1,4}[\s\-]?\d{4,}/i.test(wcSection);
        const hasWcDate = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(wcSection);
        workersCompVerified = hasWcPolicyNum && hasWcDate;
      }
    }
  }

  // WC gate logic based on worker relationship:
  // - w2_employees: hard fail if WC not verified
  // - not_sure: hard fail (fail-closed — must clarify relationship first)
  // - 1099_contractors_only / owner_only: WC not required (attestation handled separately)
  // - undefined: informational only (no worker relationship declared)
  const rel = data.workerRelationship;
  const workersCompRequired =
    rel === "w2_employees" || rel === "not_sure";

  if (workersCompRequired && !workersCompVerified) {
    if (rel === "not_sure") {
      missing.push(
        "Worker relationship is 'not sure' — clarify whether shop has W-2 employees. If yes, Workers' Compensation is required."
      );
      hardFailures.push("WORKER_RELATIONSHIP_UNKNOWN");
    } else if (!workersCompDetected) {
      missing.push(
        "Workers' Compensation coverage required (shop has W-2 employees)"
      );
      hardFailures.push("NO_WORKERS_COMP");
    } else {
      missing.push(
        "Workers' Compensation detected but not verified — missing policy number or dates in WC section"
      );
      hardFailures.push("NO_WORKERS_COMP");
    }
  }

  // ── Business Classification (soft signal) ──
  // Check if description of operations / classification includes barber-relevant terms
  let relevantBusinessClassDetected = false;
  let detectedBusinessClass: string | null = null;

  const classPatterns: [RegExp, string][] = [
    [/barber/, "Barber"],
    [/barbershop/, "Barbershop"],
    [/cosmetology/, "Cosmetology"],
    [/personal care service/, "Personal Care Services"],
    [/salon service/, "Salon Services"],
    [/salon/, "Salon"],
    [/hair\s*(care|cutting|styling|service)/, "Hair Services"],
    [/beauty\s*(shop|service|parlor)/, "Beauty Services"],
    [/grooming/, "Grooming Services"],
  ];

  for (const [pattern, label] of classPatterns) {
    if (pattern.test(t)) {
      relevantBusinessClassDetected = true;
      detectedBusinessClass = label;
      break;
    }
  }

  if (!relevantBusinessClassDetected) {
    // Soft signal — does not block approval but flags for review
    softFailures.push("NO_RELEVANT_BUSINESS_CLASS");
  }

  // ── Policy dates ──

  const effStr =
    findFirst(
      /effective(?:\s+date)?\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      raw
    ) ||
    findFirst(
      /policy\s+effective\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      raw
    ) ||
    findFirst(
      /inception\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      raw
    );

  const effDt = effStr ? parseDateLoose(effStr) : null;

  const expStr =
    findFirst(
      /expiration(?:\s+date)?\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      raw
    ) ||
    findFirst(
      /policy\s+expiration\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      raw
    ) ||
    findFirst(
      /expires?\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      raw
    );

  const expDt = expStr ? parseDateLoose(expStr) : null;

  if (!expDt) {
    missing.push("Policy expiration date not detected");
    hardFailures.push("NO_EXP_DATE");
  }

  let expired: boolean | null = null;
  if (expDt) {
    expired = expDt.getTime() <= Date.now();
    if (expired) {
      missing.push("Policy is expired");
      hardFailures.push("EXPIRED");
    }
  }

  // Future-dated policy logic:
  // - future effective + future expiration = renewal COI → LOW_RISK (not hard fail)
  // - future effective + no expiration = suspicious → HIGH_RISK
  // - future effective + past expiration = nonsensical → HIGH_RISK
  let effectiveDateFuture: boolean | null = null;
  if (effDt) {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    effectiveDateFuture = effDt.getTime() > tomorrow.getTime();

    if (effectiveDateFuture) {
      const isRenewal = expDt && expDt.getTime() > Date.now();
      if (isRenewal) {
        // Renewal COI: future effective + future expiration
        // Still a FAIL (policy not yet active) but LOW_RISK
        missing.push(
          `Policy effective date is in the future (${effStr}) — appears to be a renewal, not yet active`
        );
        softFailures.push("FUTURE_DATED_RENEWAL");
      } else {
        // No valid future expiration — suspicious
        missing.push(
          `Policy effective date is in the future (${effStr}) — not yet active`
        );
        hardFailures.push("FUTURE_DATED");
      }
    }
  }

  // ── Address match ──

  let addressMatched: boolean | null = null;
  if (data.expectedShopAddress) {
    const expected = normalize(data.expectedShopAddress);
    addressMatched = t.includes(expected);
    if (!addressMatched) {
      missing.push("Shop address does not match expected");
      hardFailures.push("ADDR_MISMATCH");
    }
  }

  // ── Certificate Holder (hard fail when expected value provided) ──

  let certificateHolderDetected = false;
  let certificateHolderMatched: boolean | null = null;

  const holderSectionMatch = raw.match(
    /certificate\s+holder[\s\S]{0,500}/i
  );
  if (holderSectionMatch) {
    certificateHolderDetected = true;
    if (data.expectedCertificateHolder) {
      const holderText = normalize(holderSectionMatch[0]);
      const expectedHolder = normalize(data.expectedCertificateHolder);
      certificateHolderMatched = holderText.includes(expectedHolder);
    }
  }

  // Hard fail if expected holder provided and not matched
  if (data.expectedCertificateHolder) {
    if (!certificateHolderDetected) {
      missing.push(
        "Certificate Holder section not found — COI must name your organization as holder"
      );
      hardFailures.push("NO_CERT_HOLDER");
    } else if (certificateHolderMatched === false) {
      missing.push(
        "Certificate Holder does not match your organization"
      );
      hardFailures.push("CERT_HOLDER_MISMATCH");
    }
  }

  // ── Additional Insured ──

  const additionalInsuredDetected =
    /additional insured|addl\s*insured|addl\s*insd|ai endorsement/.test(t) ||
    /addl\s*insd\s*[:\s]*(y|x|yes)/i.test(raw);

  // ── Build reason codes ──

  const reasonCodes = missing.map((m) => `MISSING:${m}`);

  // ── Risk level ──
  let riskLevel: CoiTextValidationResult["riskLevel"];
  if (missing.length === 0) {
    riskLevel = "CLEAN";
  } else if (hardFailures.length > 0) {
    riskLevel = "HIGH_RISK";
  } else {
    riskLevel = "LOW_RISK";
  }

  return {
    status: missing.length === 0 ? "PASS" : "FAIL",
    riskLevel,
    extractedTextChars: raw.length,
    missing,
    reasonCodes,
    fields: {
      acordFormDetected,
      insurerName,
      policyNumberDetected,
      namedInsured,
      namedInsuredMatched,
      glDetected,
      glPerOccurrence,
      glAggregate,
      proLiabilityDetected,
      proLiabilityType,
      workersCompDetected,
      workersCompVerified,
      workersCompRequired,
      relevantBusinessClassDetected,
      detectedBusinessClass,
      effectiveDate: effStr,
      expirationDate: expStr,
      effectiveDateFuture,
      expired,
      addressMatched,
      certificateHolderDetected,
      certificateHolderMatched,
      additionalInsuredDetected,
      ocrConfidence: data.ocrConfidence ?? null,
      ocrConfidenceSufficient,
    },
  };
}
