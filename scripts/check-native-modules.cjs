const requiredModules = [
  'sharp',
  '@napi-rs/canvas',
  'fontkit',
  'pdfkit',
];

let failed = false;

for (const moduleName of requiredModules) {
  try {
    require(moduleName);
    console.log(`[native-check] PASS ${moduleName}`);
  } catch (error) {
    failed = true;
    console.error(
      `[native-check] FAIL ${moduleName}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

if (failed) {
  process.exit(1);
}
