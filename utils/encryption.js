/* eslint-disable */
/**
 * Data Encryption Utility
 * Provides encryption/decryption for sensitive data fields
 * Uses AES-256-GCM for authenticated encryption
 */

const crypto = require('crypto');

// Lazy-initialize the encryption key to avoid crashing the process at import time
let _encryptionKey = null;

function getEncryptionKey() {
  if (!_encryptionKey) {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is required for encryption operations');
    }
    _encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }
  return _encryptionKey;
}

const ENCRYPTION_KEY = null; // Use getEncryptionKey() instead
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text with IV and auth tag (format: iv:authTag:encrypted)
 */
function encrypt(text) {
  if (!text) return null;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Encrypted text (format: iv:authTag:encrypted)
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedData) {
  if (!encryptedData) return null;

  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way, for comparison only)
 * @param {string} text - Text to hash
 * @returns {string} - SHA-256 hash
 */
function hash(text) {
  if (!text) return null;

  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Encrypt object fields
 * @param {Object} obj - Object with fields to encrypt
 * @param {Array<string>} fields - Field names to encrypt
 * @returns {Object} - Object with encrypted fields
 */
function encryptFields(obj, fields) {
  const encrypted = { ...obj };

  for (const field of fields) {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }

  return encrypted;
}

/**
 * Decrypt object fields
 * @param {Object} obj - Object with encrypted fields
 * @param {Array<string>} fields - Field names to decrypt
 * @returns {Object} - Object with decrypted fields
 */
function decryptFields(obj, fields) {
  const decrypted = { ...obj };

  for (const field of fields) {
    if (decrypted[field]) {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch (error) {
        decrypted[field] = null;
      }
    }
  }

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
  hash,
  encryptFields,
  decryptFields,
};
