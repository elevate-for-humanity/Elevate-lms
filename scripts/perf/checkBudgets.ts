import * as fs from "fs";
import * as http from "http";
import * as https from "https";

type Budget = {
  ttfb_ms: number;
  total_bytes_kb: number;
};

type Budgets = Record<string, Budget>;

const budgets: Budgets = JSON.parse(
  fs.readFileSync("perf-budgets.json", "utf8")
);

const BASE_URL =
  process.env.PERF_BASE_URL || "https://www.elevateforhumanity.org";

function fetchMetrics(path: string): Promise<{ ttfb: number; bytes: number }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === "https:" ? https : http;
    const start = Date.now();
    let firstByteTime: number | null = null;
    let bytes = 0;

    const req = client.request(url, (res) => {
      res.on("data", (chunk) => {
        if (firstByteTime === null) {
          firstByteTime = Date.now();
        }
        bytes += chunk.length;
      });
      res.on("end", () => {
        resolve({
          ttfb: (firstByteTime ?? Date.now()) - start,
          bytes,
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.end();
  });
}

(async () => {
  let failed = false;
  const results: Array<{
    page: string;
    ttfb: number;
    bytes: number;
    passed: boolean;
  }> = [];


  for (const [key, budget] of Object.entries(budgets)) {
    const path = key === "home" ? "/" : `/${key}`;

    try {
      const { ttfb, bytes } = await fetchMetrics(path);
      const kb = bytes / 1024;

      const ttfbPassed = ttfb <= budget.ttfb_ms;
      const sizePassed = kb <= budget.total_bytes_kb;
      const passed = ttfbPassed && sizePassed;

      results.push({ page: key, ttfb, bytes, passed });

      console.log(
        `   TTFB: ${ttfb}ms ${ttfbPassed ? "✅" : "❌"} (budget: ${budget.ttfb_ms}ms)`
      );
      console.log(
        `   Size: ${kb.toFixed(1)}kb ${sizePassed ? "✅" : "❌"} (budget: ${budget.total_bytes_kb}kb)`
      );

      if (!passed) {
        failed = true;
      }
    } catch (error: any) {
      failed = true;
    }
  }

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;


  if (failed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
