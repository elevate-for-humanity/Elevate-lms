// Shared phone configuration for legacy utility entry points.
// Public contact and private alert recipients are deliberately separate.
'use strict';
const { org } = require('../elevate.config.json');
const retiredNumbers = new Set(['13179999620', '13177607908']);

function normalizePhone(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!/^[+\d().\s-]+$/.test(raw)) throw new Error('Phone number contains invalid characters');
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 10) digits = '1' + digits;
  if (!/^[1-9]\d{7,14}$/.test(digits)) throw new Error('Phone number must be valid E.164');
  if (retiredNumbers.has(digits)) throw new Error('Retired phone number cannot be used');
  return '+' + digits;
}
function getAlertPhone(value = process.env.SMS_ALERT_PHONE) {
  return normalizePhone(value);
}
function requireAlertPhone(value = process.env.SMS_ALERT_PHONE) {
  const phone = getAlertPhone(value);
  if (!phone) throw new Error('SMS_ALERT_PHONE must be configured before sending alerts');
  return phone;
}
const publicPhone = normalizePhone(org.phone);
if (!publicPhone) throw new Error('Public contact phone must be configured');
module.exports = { publicPhone, getAlertPhone, requireAlertPhone };
