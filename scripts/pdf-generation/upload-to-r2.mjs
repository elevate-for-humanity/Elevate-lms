/**
 * Upload PDFs to Cloudflare R2
 *
 * Usage:
 *   R2_ENDPOINT=xxx R2_ACCESS_KEY=xxx R2_SECRET_KEY=xxx R2_BUCKET=xxx node scripts/pdf-generation/upload-to-r2.mjs
 *
 * Or set env vars in .env.local and run:
 *   node -r dotenv/config scripts/pdf-generation/upload-to-r2.mjs
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const LOCAL_DIR = './public/downloads/guides';

const FILES = [
  { local: 'capital-readiness-guide-v1.pdf', remote: 'guides/capital-readiness-guide-v1.pdf' },
  { local: 'tax-business-toolkit-v1.pdf', remote: 'guides/tax-business-toolkit-v1.pdf' },
  { local: 'grant-readiness-guide-v1.pdf', remote: 'guides/grant-readiness-guide-v1.pdf' },
];

async function main() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKey = process.env.R2_ACCESS_KEY;
  const secretKey = process.env.R2_SECRET_KEY;
  const bucket = process.env.R2_BUCKET || 'elevate-downloads';

  if (!endpoint || !accessKey || !secretKey) {
    console.error('Missing R2 credentials. Set R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY');
    console.log('\nFor now, PDFs are available locally at:');
    FILES.forEach((f) => console.log(`  ${LOCAL_DIR}/${f.local}`));
    console.log('\nManually upload to R2 bucket or use wrangler CLI.');
    process.exit(1);
  }

  const client = new S3Client({
    endpoint,
    region: 'auto',
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  console.log(`Uploading to R2 bucket: ${bucket}\n`);

  for (const file of FILES) {
    const localPath = path.join(LOCAL_DIR, file.local);

    if (!fs.existsSync(localPath)) {
      console.error(`✗ File not found: ${localPath}`);
      continue;
    }

    const body = fs.readFileSync(localPath);

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: file.remote,
          Body: body,
          ContentType: 'application/pdf',
        }),
      );
      console.log(`✓ Uploaded: ${file.remote}`);
    } catch (err) {
      console.error(`✗ Failed to upload ${file.remote}:`, err.message);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
