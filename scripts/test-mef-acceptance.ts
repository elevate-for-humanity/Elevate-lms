#!/usr/bin/env tsx
import { getRuntimeReadiness } from "../lib/tax-software/config/runtime-readiness";

function log(name: string, ok: boolean, detail?: string) {
  const prefix = ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const readiness = getRuntimeReadiness();

  const infraIssues = readiness.issues.filter(
    (i) => i.code !== "IRS_SOFTWARE_ID_MISSING"
  );

  log("Runtime readiness excluding IRS_SOFTWARE_ID", infraIssues.length === 0);

  for (const issue of readiness.issues) {
    log(issue.code, false, issue.message);
  }

  if (infraIssues.length > 0) {
    console.error("\nVERDICT: NO-GO — internal environment incomplete");
    process.exit(1);
  }

  if (readiness.issues.some((i) => i.code === "IRS_SOFTWARE_ID_MISSING")) {
    console.warn("\nVERDICT: PARTIAL GO — infrastructure ready, waiting on IRS_SOFTWARE_ID");
    process.exit(0);
  }

  console.log("\nVERDICT: GO — environment ready for submission testing");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
