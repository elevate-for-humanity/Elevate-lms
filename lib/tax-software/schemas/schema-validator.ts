import { execFileSync } from "node:child_process";
import path from "node:path";

export type ValidationError = {
  code: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

function runXmllint(xmlPath: string, xsdPath: string): string | null {
  try {
    execFileSync("xmllint", ["--noout", "--schema", xsdPath, xmlPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return null;
  } catch (err) {
    const stderr =
      err && typeof err === "object" && "stderr" in err
        ? String((err as { stderr?: Buffer | string }).stderr || "")
        : "Unknown xmllint validation error";
    return stderr.trim();
  }
}

// xmlPath must be a path to a temp file containing the MeF XML.
// The caller is responsible for writing and cleaning up the temp file.
// assertRuntimeReadyForSubmission() must be called before this function
// to guarantee xmllint and schemas are present.
export function validateAgainstXsd(xmlPath: string): ValidationResult {
  const xsdPath = path.join(
    process.cwd(),
    "lib",
    "tax-software",
    "schemas",
    "2024",
    "Return.xsd"
  );

  const xmllintError = runXmllint(xmlPath, xsdPath);
  if (xmllintError) {
    return {
      valid: false,
      errors: [{ code: "XSD_VALIDATION_FAILED", message: xmllintError }],
    };
  }

  return { valid: true, errors: [] };
}
