const fs = require('fs');
const path = require('path');

const root = process.cwd();

const requiredFiles = [
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'Dockerfile.marketing',
  'Dockerfile.northflank-admin',
  'Dockerfile.northflank-lms',
  'apps/marketing/package.json',
  'apps/admin/package.json',
  'apps/lms/package.json',
];

const errors = [];

for (const relativePath of requiredFiles) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required file: ${relativePath}`);
  }
}

const retiredFiles = ['Dockerfile.northflank-marketing'];
for (const relativePath of retiredFiles) {
  if (fs.existsSync(path.join(root, relativePath))) {
    errors.push(`Retired duplicate build file must not exist: ${relativePath}`);
  }
}

const rootPackagePath = path.join(root, 'package.json');
if (fs.existsSync(rootPackagePath)) {
  const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));

  if (rootPackage.packageManager !== 'pnpm@10.28.2') {
    errors.push('packageManager must be pnpm@10.28.2');
  }
}

const adminPackagePath = path.join(root, 'apps/admin/package.json');
if (fs.existsSync(adminPackagePath)) {
  const adminPackage = JSON.parse(fs.readFileSync(adminPackagePath, 'utf8'));

  const requiredAdminDependencies = [
    'sharp',
    '@napi-rs/canvas',
    'fontkit',
    'pdfkit',
  ];

  for (const dep of requiredAdminDependencies) {
    if (!adminPackage.dependencies?.[dep]) {
      errors.push(`Admin is missing production dependency: ${dep}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Repository integrity check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Repository integrity check passed.');
