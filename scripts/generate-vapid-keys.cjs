#!/usr/bin/env node

/**
 * Generate VAPID keys for Web Push notifications
 * Run: node scripts/generate-vapid-keys.cjs
 */

const crypto = require('crypto');

function urlBase64(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generateVapidKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der',
    },
  });

  return {
    publicKey: urlBase64(publicKey),
    privateKey: urlBase64(privateKey),
  };
}

console.log('\n🔑 Generating VAPID Keys for Web Push...\n');

const keys = generateVapidKeys();

console.log('✅ VAPID Keys Generated!\n');
console.log('Add these to your .env file:\n');
console.log('─'.repeat(60));
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@elevateforhumanity.org`);
console.log('─'.repeat(60));
console.log('\n⚠️  Important:');
console.log('  • Public key is exposed to the client');
console.log('  • Private key must be kept secret on the server');
console.log('  • Update VAPID_SUBJECT with your actual email\n');
