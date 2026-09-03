#!/usr/bin/env node

/**
 * Download Partner Logos
 * Fetches logos for all partner organizations
 */

import https from 'https';
import http from 'http';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const partners = [
  {
    name: 'EmployIndy',
    urls: [
      'https://www.employindy.org/wp-content/uploads/2023/01/EmployIndy-Logo.png',
      'https://learning.employindy.org/logo.png',
      'https://jri.employindy.org/logo.png',
    ],
    filename: 'employindy-logo.png',
  },
  {
    name: 'Certiport',
    urls: [
      'https://www.certiport.com/images/certiport-logo.png',
      'https://certiport.pearsonvue.com/images/certiport-logo.png',
    ],
    filename: 'certiport-logo.png',
  },
  {
    name: 'Link+Learn',
    urls: [
      'https://linklearncertification.com/images/logo.png',
      'https://www.linklearntaxes.com/images/logo.png',
    ],
    filename: 'linklearn-logo.png',
  },
  {
    name: 'Milady',
    urls: [
      'https://www.milady.com/-/media/milady/images/milady-logo.png',
      'https://www.cengage.com/milady/images/milady-logo.png',
    ],
    filename: 'milady-logo.png',
  },
  {
    name: 'IRS VITA',
    urls: [
      'https://www.irs.gov/pub/irs-utl/vita_logo.jpg',
      'https://www.irs.gov/images/vita-logo.png',
    ],
    filename: 'irs-vita-logo.png',
  },
  {
    name: 'Microsoft',
    urls: [
      'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b',
      'https://www.microsoft.com/en-us/microsoft-365/blog/wp-content/uploads/sites/2/2012/08/Microsoft-logo_rgb_c-gray.png',
    ],
    filename: 'microsoft-logo.png',
  },
  {
    name: 'Adobe',
    urls: [
      'https://www.adobe.com/content/dam/cc/icons/Adobe_Corporate_Horizontal_Red_HEX.svg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Adobe_Corporate_Logo.png/640px-Adobe_Corporate_Logo.png',
    ],
    filename: 'adobe-logo.png',
  },
  {
    name: 'Autodesk',
    urls: [
      'https://damassets.autodesk.net/content/dam/autodesk/www/autodesk-logo-primary.svg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Autodesk_Logo.svg/640px-Autodesk_Logo.svg.png',
    ],
    filename: 'autodesk-logo.png',
  },
  {
    name: 'Indiana DWD',
    urls: [
      'https://www.in.gov/dwd/files/DWD-logo.png',
      'https://www.in.gov/dwd/images/dwd-logo.png',
    ],
    filename: 'indiana-dwd-logo.png',
  },
  {
    name: 'WIOA',
    urls: [
      'https://www.dol.gov/sites/dolgov/files/ETA/wioa/images/WIOA-logo.png',
    ],
    filename: 'wioa-logo.png',
  },
  {
    name: 'NCCER',
    urls: [
      'https://www.nccer.org/images/nccer-logo.png',
      'https://www.nccer.org/images/logo.png',
    ],
    filename: 'nccer-logo.png',
  },
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const request = client.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      },
      (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          downloadImage(res.headers.location, filepath)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download: ${res.statusCode}`));
          return;
        }

        const fileStream = fsSync.createWriteStream(filepath);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filepath);
        });

        fileStream.on('error', (err) => {
          fsSync.unlink(filepath, () => {});
          reject(err);
        });
      }
    );

    request.on('error', (err) => {
      reject(err);
    });

    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function downloadPartnerLogos() {

  const logosDir = path.join(process.cwd(), 'public', 'images', 'partners');
  await fs.mkdir(logosDir, { recursive: true });

  const results = {
    success: [],
    failed: [],
  };

  for (const partner of partners) {

    let downloaded = false;

    for (const url of partner.urls) {
      if (downloaded) break;

      try {
        const filepath = path.join(logosDir, partner.filename);
        await downloadImage(url, filepath);
        results.success.push(partner.name);
        downloaded = true;
      } catch (error) {
      }
    }

    if (!downloaded) {
        `   ❌ Could not download ${partner.name} logo from any source`
      );
      results.failed.push(partner.name);
    }

  }

  return results;
}

async function createPartnerLogosData(results) {
  const partnersData = {
    partners: partners.map((p) => ({
      name: p.name,
      logo: `/images/partners/${p.filename}`,
      available: results.success.includes(p.name),
    })),

    categories: {
      workforce: ['EmployIndy', 'Indiana DWD', 'WIOA'],
      certifications: ['Certiport', 'Link+Learn', 'IRS VITA', 'Milady'],
      technology: ['Microsoft', 'Adobe', 'Autodesk'],
    },
  };

  const dataDir = path.join(process.cwd(), 'src', 'data');
  const filePath = path.join(dataDir, 'partnerLogos.ts');

  await fs.mkdir(dataDir, { recursive: true });

  const fileContent = `/**
 * Partner Logos Data
 * Elevate for Humanity Career and Training Institute
 */

export const partnerLogos = ${JSON.stringify(partnersData, null, 2)};

export default partnerLogos;
`;

  await fs.writeFile(filePath, fileContent, 'utf-8');
}

async function createFallbackLogos() {

  const logosDir = path.join(process.cwd(), 'public', 'images', 'partners');

  const fallbackLogos = [
    {
      filename: 'employindy-logo.png',
      text: 'EmployIndy',
      color: '#0066CC',
    },
    {
      filename: 'certiport-logo.png',
      text: 'Certiport',
      color: '#E31837',
    },
    {
      filename: 'linklearn-logo.png',
      text: 'Link+Learn',
      color: '#00A651',
    },
    {
      filename: 'milady-logo.png',
      text: 'Milady',
      color: '#8B4789',
    },
    {
      filename: 'irs-vita-logo.png',
      text: 'IRS VITA',
      color: '#003366',
    },
    {
      filename: 'microsoft-logo.png',
      text: 'Microsoft',
      color: '#00A4EF',
    },
    {
      filename: 'adobe-logo.png',
      text: 'Adobe',
      color: '#FF0000',
    },
    {
      filename: 'autodesk-logo.png',
      text: 'Autodesk',
      color: '#0696D7',
    },
    {
      filename: 'indiana-dwd-logo.png',
      text: 'Indiana DWD',
      color: '#002855',
    },
    {
      filename: 'wioa-logo.png',
      text: 'WIOA',
      color: '#1C3F94',
    },
  ];

  for (const logo of fallbackLogos) {
    const filepath = path.join(logosDir, logo.filename.replace('.png', '.svg'));

    const svg = `<svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="80" fill="${logo.color}" rx="4"/>
  <text x="100" y="45" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">${logo.text}</text>
</svg>`;

    await fs.writeFile(filepath, svg, 'utf-8');
      `   ✅ Created fallback SVG: ${logo.filename.replace('.png', '.svg')}`
    );
  }
}

async function main() {
  try {

    const results = await downloadPartnerLogos();
    await createFallbackLogos();
    await createPartnerLogosData(results);


    if (results.success.length > 0) {
    }

    if (results.failed.length > 0) {
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
