const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generateLicensePDF(email, productId, licenseKey, expiresAt) {
  // Ensure certificates directory exists
  const certDir = './certificates';
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  const doc = new PDFDocument();
  const fileName = `${email.replace(/[@.]/g, '_')}_${Date.now()}.pdf`;
  const filePath = path.join(certDir, fileName);

  const qrDataURL = await QRCode.toDataURL(licenseKey);

  doc.pipe(fs.createWriteStream(filePath));

  // Header
  doc.fontSize(24).fillColor('#667eea').text('🚀 ELEVATE LICENSE CERTIFICATE', { align: 'center' });
  doc.moveDown();

  // Certificate border
  doc.rect(50, 100, 500, 600).stroke('#667eea');

  // Certificate content
  doc.fontSize(16).fillColor('#000').text('OFFICIAL LICENSE CERTIFICATE', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Licensed To: ${email}`, 70, 180);
  doc.text(`Product: ${productId}`, 70, 200);
  doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 70, 220);
  doc.text(`Expires: ${new Date(expiresAt).toLocaleDateString()}`, 70, 240);
  doc.moveDown();

  // License key section
  doc.fontSize(10).text('License Key:', 70, 280, { underline: true });
  doc.fontSize(8).text(licenseKey, 70, 300, { width: 450 });

  // QR Code
  const qrBuffer = Buffer.from(qrDataURL.split(',')[1], 'base64');
  doc.image(qrBuffer, 400, 350, { width: 100 });

  // Footer
  doc
    .fontSize(8)
    .text('This certificate validates your license to use Elevate Platform software.', 70, 600);
  doc.text('Keep this certificate secure and present when required for verification.', 70, 615);
  doc.text('© 2025 Elevate for Humanity - All Rights Reserved', 70, 630);

  doc.end();
  return filePath;
}

module.exports = generateLicensePDF;
