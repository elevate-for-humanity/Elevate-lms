#!/usr/bin/env node
/**
 * Store Product Integrity Check
 * Fails closed when visible product definitions cannot be proven.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const reportsDir = path.join(rootDir, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const PLACEHOLDER_PATTERNS = [/lorem ipsum/i,/placeholder/i,/coming soon/i,/\btbd\b/i,/\btodo\b/i,/sample product/i,/test product/i];
const containsPlaceholder = (text) => Boolean(text && PLACEHOLDER_PATTERNS.some((p)=>p.test(text)));

function checkPostPurchaseRoute() {
  const candidates = [
    path.join(rootDir,'app','checkout','success','page.tsx'),
    path.join(rootDir,'apps','marketing','app','store','checkout','success','page.tsx'),
    path.join(rootDir,'apps','marketing','app','checkout','success','page.tsx'),
    path.join(rootDir,'apps','lms','app','checkout','success','page.tsx'),
  ];
  return candidates.some(fs.existsSync);
}

function collectPricedObjects(content, source) {
  const products = [];
  const objectMatches = content.matchAll(/{[\s\S]*?(?:name|title):\s*["']([^"']+)["'][\s\S]*?(?:price|priceMonthly):\s*(?:["']?\$?([0-9]+(?:\.[0-9]{1,2})?)["']?)[\s\S]*?}/g);
  let i = 0;
  for (const match of objectMatches) {
    products.push({
      id: `${path.basename(source)}-${i++}`,
      name: match[1],
      price: Number(match[2]),
      source: path.relative(rootDir, source),
    });
  }
  return products;
}

function loadProducts() {
  // These are the canonical Store pricing/inventory sources consumed by the
  // live marketplace. UI pages themselves intentionally delegate pricing to
  // these catalogs instead of duplicating price literals in JSX.
  const sourceFiles = [
    path.join(rootDir,'lib','store','platform-pricing.ts'),
    path.join(rootDir,'lib','apps','individual-app-plans.ts'),
    path.join(rootDir,'lms-data','paymentPlans.ts'),
    path.join(rootDir,'apps','marketing','app','pricing','page.tsx'),
    path.join(rootDir,'apps','marketing','app','store','page.tsx'),
  ].filter(fs.existsSync);

  if (sourceFiles.length === 0) throw new Error('No canonical Store/pricing source files found');

  const products = sourceFiles.flatMap((filePath) => collectPricedObjects(fs.readFileSync(filePath,'utf-8'), filePath));
  if (products.length === 0) throw new Error('Canonical Store pricing catalogs contain zero priced products; inventory integrity cannot be proven');
  return products;
}

function validateProduct(product) {
  const issues=[];
  if (!product.name || product.name.length < 3) issues.push('Missing or invalid name');
  if (containsPlaceholder(product.name)) issues.push('Name contains placeholder content');
  if (!Number.isFinite(product.price) || product.price < 0) issues.push('Missing or invalid price');
  return { productId:product.id, name:product.name, price:product.price, source:product.source, status:issues.length?'FAIL':'PASS', issues };
}

try {
  const products = loadProducts();
  const hasPostPurchase = checkPostPurchaseRoute();
  const results = products.map(validateProduct);
  if (!hasPostPurchase) results.push({ productId:'post-purchase-flow', name:'Post-Purchase Confirmation', status:'FAIL', issues:['Missing checkout/success page'] });
  else results.push({ productId:'post-purchase-flow', name:'Post-Purchase Confirmation', status:'PASS', issues:[] });
  const failed=results.filter((r)=>r.status==='FAIL').length;
  const report={timestamp:new Date().toISOString(),summary:{totalChecks:results.length,productsDetected:products.length,passed:results.length-failed,failed,hasPostPurchaseFlow:hasPostPurchase},results};
  fs.writeFileSync(path.join(reportsDir,'store_integrity_report.json'),JSON.stringify(report,null,2));
  console.log(`Store integrity: ${products.length} priced products detected; ${failed} failed checks.`);
  if (failed) {
    for (const r of results.filter((r)=>r.status==='FAIL')) console.error(`FAIL ${r.name}: ${r.issues.join('; ')}`);
    process.exit(1);
  }
  console.log('PASS: Store product and post-purchase integrity proven.');
  process.exit(0);
} catch (error) {
  const report={timestamp:new Date().toISOString(),summary:{totalChecks:0,productsDetected:0,passed:0,failed:1},fatalError:String(error?.message||error),results:[]};
  fs.writeFileSync(path.join(reportsDir,'store_integrity_report.json'),JSON.stringify(report,null,2));
  console.error(`FAIL: Store integrity could not be proven: ${report.fatalError}`);
  process.exit(1);
}
