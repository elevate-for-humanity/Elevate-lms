import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export type ReadinessIssueCode =
  | "IRS_SOFTWARE_ID_MISSING"
  | "IRS_EFIN_MISSING"
  | "CRON_SECRET_MISSING"
  | "SCHEMA_DIR_MISSING"
  | "SCHEMA_FILES_MISSING"
  | "XMLLINT_NOT_AVAILABLE";

export type ReadinessIssue = {
  code: ReadinessIssueCode;
  message: string;
};

export type RuntimeReadiness = {
  ok: boolean;
  issues: ReadinessIssue[];
  details: {
    schemaDir: string;
    xmlLintAvailable: boolean;
    schemaFileCount: number;
    environment: string;
  };
};

const SCHEMA_DIR = path.join(process.cwd(), "lib", "tax-software", "schemas", "2024");

function hasEnv(name: string): boolean {
  return Boolean(process.env[name] && process.env[name]!.trim());
}

function checkXmllint(): boolean {
  try {
    execFileSync("xmllint", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function countSchemaFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;

  const files = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;

  for (const entry of files) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countSchemaFiles(full);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".xsd")) {
      count += 1;
    }
  }

  return count;
}

export function getRuntimeReadiness(): RuntimeReadiness {
  const issues: ReadinessIssue[] = [];
  const xmlLintAvailable = checkXmllint();

  if (!hasEnv("IRS_SOFTWARE_ID")) {
    issues.push({
      code: "IRS_SOFTWARE_ID_MISSING",
      message: "IRS_SOFTWARE_ID is not set.",
    });
  }

  if (!hasEnv("IRS_EFIN")) {
    issues.push({
      code: "IRS_EFIN_MISSING",
      message: "IRS_EFIN is not set.",
    });
  }

  if (!hasEnv("CRON_SECRET")) {
    issues.push({
      code: "CRON_SECRET_MISSING",
      message: "CRON_SECRET is not set.",
    });
  }

  if (!fs.existsSync(SCHEMA_DIR)) {
    issues.push({
      code: "SCHEMA_DIR_MISSING",
      message: `Schema directory does not exist: ${SCHEMA_DIR}`,
    });
  }

  const schemaFileCount = countSchemaFiles(SCHEMA_DIR);
  if (schemaFileCount === 0) {
    issues.push({
      code: "SCHEMA_FILES_MISSING",
      message: `No .xsd files found under ${SCHEMA_DIR}`,
    });
  }

  if (!xmlLintAvailable) {
    issues.push({
      code: "XMLLINT_NOT_AVAILABLE",
      message: "xmllint is not installed or not available on PATH.",
    });
  }

  return {
    ok: issues.length === 0,
    issues,
    details: {
      schemaDir: SCHEMA_DIR,
      xmlLintAvailable,
      schemaFileCount,
      environment: process.env.IRS_ENVIRONMENT || "test",
    },
  };
}

export function assertRuntimeReadyForSubmission(): void {
  const readiness = getRuntimeReadiness();

  const blockingCodes: ReadinessIssueCode[] = [
    "IRS_EFIN_MISSING",
    "SCHEMA_DIR_MISSING",
    "SCHEMA_FILES_MISSING",
    "XMLLINT_NOT_AVAILABLE",
  ];

  const blockers = readiness.issues.filter((i) => blockingCodes.includes(i.code));
  if (blockers.length > 0) {
    const err = new Error("MeF runtime is not ready for submission.");
    (err as Error & { issues?: ReadinessIssue[] }).issues = blockers;
    throw err;
  }
}
