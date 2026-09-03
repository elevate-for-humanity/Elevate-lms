/**
 * DUAL CERTIFICATE SYSTEM
 * Automated generation of both Elevate for Humanity and Partner certificates
 */

const fs = require('fs').promises;
const path = require('path');

class DualCertificateSystem {
  constructor() {
    this.certificateTemplates = this.initializeTemplates();
    this.verificationDatabase = new Map(); // Would use actual database
    this.blockchainVerification = new BlockchainVerification();
  }

  /**
   * Initialize certificate templates for each partner
   */
  initializeTemplates() {
    return {
      elevate_for_humanity: {
        template_path: './certificates/templates/elevate-template.html',
        logo_url: 'https://elevateforhumanity.org/assets/logo-certificate.png',
        signature_image:
          'https://elevateforhumanity.org/assets/signature-ceo.png',
        authority_name: 'Rise Forward Foundation',
        authority_title: 'Chief Executive Officer',
        colors: {
          primary: '#4c1d95',
          secondary: '#22c55e',
          accent: '#d97706',
        },
      },
      google_cloud: {
        template_path: './certificates/templates/google-cloud-template.html',
        logo_url:
          'https://cloud.google.com/images/social-icon-google-cloud-1200-630.png',
        authority_name: 'Google Cloud',
        verification_url: 'https://www.credential.net/profile/',
        colors: {
          primary: '#4285f4',
          secondary: '#34a853',
          accent: '#fbbc04',
        },
      },
      microsoft: {
        template_path: './certificates/templates/microsoft-template.html',
        logo_url:
          'https://docs.microsoft.com/en-us/media/logos/logo-ms-social.png',
        authority_name: 'Microsoft',
        verification_url:
          'https://docs.microsoft.com/en-us/learn/certifications/',
        colors: {
          primary: '#0078d4',
          secondary: '#106ebe',
          accent: '#005a9e',
        },
      },
      comptia: {
        template_path: './certificates/templates/comptia-template.html',
        logo_url:
          'https://www.comptia.org/images/default-source/logos/comptia-logo.png',
        authority_name: 'CompTIA',
        verification_url: 'https://www.certmetrics.com/comptia/',
        colors: {
          primary: '#c8102e',
          secondary: '#1f1f1f',
          accent: '#f5f5f5',
        },
      },
      ibew: {
        template_path: './certificates/templates/ibew-template.html',
        logo_url: 'https://www.ibew.org/images/ibew-logo.png',
        authority_name: 'International Brotherhood of Electrical Workers',
        verification_url: 'https://www.ibew.org/verify/',
        colors: {
          primary: '#003366',
          secondary: '#ffcc00',
          accent: '#ffffff',
        },
      },
      milady: {
        template_path: './certificates/templates/milady-template.html',
        logo_url: 'https://www.milady.com/images/milady-logo.png',
        authority_name: 'Milady Training',
        verification_url: 'https://www.milady.com/verify/',
        colors: {
          primary: '#8b1538',
          secondary: '#f4c2c2',
          accent: '#ffffff',
        },
      },
      nccer: {
        template_path: './certificates/templates/nccer-template.html',
        logo_url: 'https://www.nccer.org/images/nccer-logo.png',
        authority_name:
          'National Center for Construction Education and Research',
        verification_url: 'https://www.nccer.org/verify/',
        colors: {
          primary: '#1e3a8a',
          secondary: '#fbbf24',
          accent: '#ffffff',
        },
      },
    };
  }

  /**
   * Generate dual certificates for completed program
   */
  async generateDualCertificates(enrollmentData, completionData) {
    try {
        `🏆 Generating dual certificates for ${enrollmentData.student.email}`
      );

      // Generate Elevate for Humanity certificate
      const elevateCertificate = await this.generateElevateCertificate(
        enrollmentData,
        completionData
      );

      // Generate Partner certificate
      const partnerCertificate = await this.generatePartnerCertificate(
        enrollmentData,
        completionData
      );

      // Create verification records
      const verificationRecords = await this.createVerificationRecords(
        elevateCertificate,
        partnerCertificate
      );

      // Generate blockchain verification (optional)
      const blockchainRecord = await this.blockchainVerification.createRecord({
        elevate_cert_id: elevateCertificate.id,
        partner_cert_id: partnerCertificate.id,
        student_email: enrollmentData.student.email,
        completion_date: completionData.completion_date,
      });

      const certificatePackage = {
        elevate_certificate: elevateCertificate,
        partner_certificate: partnerCertificate,
        verification: verificationRecords,
        blockchain_record: blockchainRecord,
        delivery_package: await this.createDeliveryPackage(
          elevateCertificate,
          partnerCertificate,
          enrollmentData
        ),
      };

      return certificatePackage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate Elevate for Humanity certificate
   */
  async generateElevateCertificate(enrollmentData, completionData) {
    const certificateId = `elevate_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const template = this.certificateTemplates.elevate_for_humanity;

    const certificateData = {
      id: certificateId,
      type: 'completion_certificate',
      title: 'Certificate of Completion',
      subtitle: enrollmentData.program.name,

      // Student Information
      recipient: {
        name: `${enrollmentData.student.firstName} ${enrollmentData.student.lastName}`,
        email: enrollmentData.student.email,
      },

      // Program Information
      program: {
        name: enrollmentData.program.name,
        description: enrollmentData.program.description,
        level: enrollmentData.program.level,
        duration_completed:
          completionData.actual_duration || enrollmentData.program.duration,
        partner_name: enrollmentData.partner.name,
      },

      // Issuing Authority
      issuer: {
        name: 'Elevate for Humanity',
        authority: 'Rise Forward Foundation',
        logo_url: template.logo_url,
        signature_image: template.signature_image,
      },

      // Dates
      dates: {
        enrolled: enrollmentData.timestamps.enrolled_at,
        completed: completionData.completion_date,
        issued: new Date().toISOString(),
        expires: null, // Elevate certificates don't expire
      },

      // Verification
      verification: {
        url: `https://elevateforhumanity.org/verify/${certificateId}`,
        qr_code: `https://elevateforhumanity.org/qr/${certificateId}`,
        verification_code: this.generateVerificationCode(certificateId),
      },

      // Performance Metrics
      performance: {
        completion_rate: completionData.completion_percentage || 100,
        grade: completionData.final_grade || 'Pass',
        hours_completed: completionData.hours_completed || 'N/A',
        modules_completed: completionData.modules_completed || 'All',
      },

      // Design
      design: {
        template: 'elevate_professional',
        colors: template.colors,
        layout: 'landscape',
      },
    };

    // Generate PDF and HTML versions
    const certificateFiles = await this.renderCertificate(
      certificateData,
      'elevate_for_humanity'
    );

    return {
      ...certificateData,
      files: certificateFiles,
    };
  }

  /**
   * Generate Partner certificate
   */
  async generatePartnerCertificate(enrollmentData, completionData) {
    const partnerId = enrollmentData.partner.id;
    const template = this.certificateTemplates[partnerId];
    const certificateId = `${partnerId}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    const certificateData = {
      id: certificateId,
      type: 'professional_certification',
      title: enrollmentData.program.certification,
      subtitle: `Issued by ${enrollmentData.partner.name}`,

      // Student Information
      recipient: {
        name: `${enrollmentData.student.firstName} ${enrollmentData.student.lastName}`,
        email: enrollmentData.student.email,
      },

      // Certification Information
      certification: {
        name: enrollmentData.program.certification,
        level: enrollmentData.program.level,
        credential_id:
          completionData.partner_credential_id ||
          this.generateCredentialId(partnerId),
        industry_recognition: this.getIndustryRecognition(partnerId),
        continuing_education_units: this.getCEUs(
          partnerId,
          enrollmentData.program.id
        ),
      },

      // Issuing Authority
      issuer: {
        name: enrollmentData.partner.name,
        logo_url: template.logo_url,
        authority_type: 'Professional Certification Body',
        accreditation: this.getAccreditation(partnerId),
      },

      // Dates
      dates: {
        completed: completionData.completion_date,
        issued: new Date().toISOString(),
        expires: this.calculateExpirationDate(
          partnerId,
          completionData.completion_date
        ),
      },

      // Verification
      verification: {
        url: `${template.verification_url}${certificateId}`,
        partner_verification: completionData.partner_verification_url,
        credential_id: completionData.partner_credential_id,
      },

      // Skills and Competencies
      competencies: this.getCompetencies(partnerId, enrollmentData.program.id),

      // Design
      design: {
        template: `${partnerId}_official`,
        colors: template.colors,
        layout: 'portrait',
      },
    };

    // Generate PDF and HTML versions
    const certificateFiles = await this.renderCertificate(
      certificateData,
      partnerId
    );

    return {
      ...certificateData,
      files: certificateFiles,
    };
  }

  /**
   * Render certificate to PDF and HTML
   */
  async renderCertificate(certificateData, templateType) {
    const template = this.certificateTemplates[templateType];

    // Generate HTML version
    const htmlContent = await this.generateHTMLCertificate(
      certificateData,
      template
    );

    // Generate PDF version (would use puppeteer or similar)
    const pdfBuffer = await this.generatePDFCertificate(htmlContent);

    // Save files
    const files = {
      html: {
        content: htmlContent,
        url: `https://elevateforhumanity.org/certificates/${certificateData.id}/certificate.html`,
        filename: `${certificateData.id}_certificate.html`,
      },
      pdf: {
        buffer: pdfBuffer,
        url: `https://elevateforhumanity.org/certificates/${certificateData.id}/certificate.pdf`,
        filename: `${certificateData.id}_certificate.pdf`,
      },
      thumbnail: {
        url: `https://elevateforhumanity.org/certificates/${certificateData.id}/thumbnail.jpg`,
        filename: `${certificateData.id}_thumbnail.jpg`,
      },
    };

    return files;
  }

  /**
   * Generate HTML certificate
   */
  async generateHTMLCertificate(certificateData, template) {
    const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${certificateData.title} - ${certificateData.recipient.name}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap');

                body {
                    margin: 0;
                    padding: 40px;
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, ${template.colors.primary}10 0%, ${template.colors.secondary}10 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .certificate {
                    width: 800px;
                    height: 600px;
                    background: white;
                    border: 8px solid ${template.colors.primary};
                    border-radius: 20px;
                    padding: 60px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    position: relative;
                    overflow: hidden;
                }

                .certificate::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 8px;
                    background: linear-gradient(90deg, ${template.colors.primary}, ${template.colors.secondary}, ${template.colors.accent});
                }

                .header {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .logo {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 20px;
                }

                .title {
                    font-family: 'Playfair Display', serif;
                    font-size: 36px;
                    font-weight: 700;
                    color: ${template.colors.primary};
                    margin: 0 0 10px 0;
                }

                .subtitle {
                    font-size: 18px;
                    color: #666;
                    margin: 0;
                }

                .recipient {
                    text-align: center;
                    margin: 40px 0;
                }

                .recipient-name {
                    font-family: 'Playfair Display', serif;
                    font-size: 42px;
                    font-weight: 700;
                    color: ${template.colors.primary};
                    margin: 0 0 20px 0;
                    text-decoration: underline;
                    text-decoration-color: ${template.colors.accent};
                }

                .program-info {
                    text-align: center;
                    margin: 30px 0;
                }

                .program-name {
                    font-size: 24px;
                    font-weight: 600;
                    color: #333;
                    margin: 0 0 10px 0;
                }

                .completion-info {
                    display: flex;
                    justify-content: space-between;
                    margin: 40px 0;
                    font-size: 14px;
                    color: #666;
                }

                .verification {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 12px;
                    color: #888;
                }

                .qr-code {
                    width: 60px;
                    height: 60px;
                    margin: 0 auto;
                }
            </style>
        </head>
        <body>
            <div class="certificate">
                <div class="header">
                    <img src="${certificateData.issuer.logo_url}" alt="Logo" class="logo">
                    <h1 class="title">${certificateData.title}</h1>
                    <p class="subtitle">${certificateData.subtitle}</p>
                </div>

                <div class="recipient">
                    <div class="recipient-name">${certificateData.recipient.name}</div>
                    <p>has successfully completed</p>
                </div>

                <div class="program-info">
                    <div class="program-name">${certificateData.program.name}</div>
                    <p>${certificateData.program.description}</p>
                </div>

                <div class="completion-info">
                    <div>
                        <strong>Completed:</strong><br>
                        ${new Date(certificateData.dates.completed).toLocaleDateString()}
                    </div>
                    <div>
                        <strong>Level:</strong><br>
                        ${certificateData.program.level}
                    </div>
                    <div>
                        <strong>Duration:</strong><br>
                        ${certificateData.program.duration_completed}
                    </div>
                </div>

                <div class="verification">
                    <div class="qr-code">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${certificateData.verification.url}" alt="QR Code">
                    </div>
                    <p>Certificate ID: ${certificateData.id}</p>
                    <p>Verify at: ${certificateData.verification.url}</p>
                </div>
            </div>
        </body>
        </html>`;

    return htmlTemplate;
  }

  /**
   * Generate PDF certificate (mock implementation)
   */
  async generatePDFCertificate(htmlContent) {
    // Would use puppeteer or similar to convert HTML to PDF
    return Buffer.from('Mock PDF content'); // Placeholder
  }

  /**
   * Create verification records
   */
  async createVerificationRecords(elevateCertificate, partnerCertificate) {
    const verificationRecord = {
      id: `verify_${Date.now()}`,
      elevate_cert_id: elevateCertificate.id,
      partner_cert_id: partnerCertificate.id,
      student_email: elevateCertificate.recipient.email,
      created_at: new Date().toISOString(),
      verification_urls: {
        elevate: elevateCertificate.verification.url,
        partner: partnerCertificate.verification.url,
      },
      status: 'active',
    };

    // Store in verification database
    this.verificationDatabase.set(verificationRecord.id, verificationRecord);

    return verificationRecord;
  }

  /**
   * Create delivery package for certificates
   */
  async createDeliveryPackage(
    elevateCertificate,
    partnerCertificate,
    enrollmentData
  ) {
    return {
      email_package: {
        subject: `🏆 Your Certificates Are Ready! ${elevateCertificate.program.name}`,
        template: 'dual_certificate_delivery',
        attachments: [
          {
            filename: elevateCertificate.files.pdf.filename,
            content: elevateCertificate.files.pdf.buffer,
            contentType: 'application/pdf',
          },
          {
            filename: partnerCertificate.files.pdf.filename,
            content: partnerCertificate.files.pdf.buffer,
            contentType: 'application/pdf',
          },
        ],
        data: {
          student_name: enrollmentData.student.firstName,
          program_name: elevateCertificate.program.name,
          partner_name: enrollmentData.partner.name,
          elevate_cert_url: elevateCertificate.files.html.url,
          partner_cert_url: partnerCertificate.files.html.url,
          verification_urls: {
            elevate: elevateCertificate.verification.url,
            partner: partnerCertificate.verification.url,
          },
        },
      },
      social_sharing: {
        linkedin_post: this.generateLinkedInPost(
          elevateCertificate,
          partnerCertificate
        ),
        twitter_post: this.generateTwitterPost(
          elevateCertificate,
          partnerCertificate
        ),
        facebook_post: this.generateFacebookPost(
          elevateCertificate,
          partnerCertificate
        ),
      },
      wallet_integration: {
        apple_wallet: this.generateAppleWalletPass(elevateCertificate),
        google_wallet: this.generateGoogleWalletPass(elevateCertificate),
      },
    };
  }

  /**
   * Utility functions
   */
  generateVerificationCode(certificateId) {
    return certificateId.substr(-8).toUpperCase();
  }

  generateCredentialId(partnerId) {
    return `${partnerId.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  calculateExpirationDate(partnerId, completionDate) {
    const expirationYears = {
      google_cloud: 2,
      microsoft: 2,
      comptia: 3,
      ibew: null, // No expiration
      milady: 2,
      nccer: 5,
    };

    const years = expirationYears[partnerId];
    if (!years) return null;

    const expiration = new Date(completionDate);
    expiration.setFullYear(expiration.getFullYear() + years);
    return expiration.toISOString();
  }

  getIndustryRecognition(partnerId) {
    const recognition = {
      google_cloud: 'Globally recognized cloud computing certification',
      microsoft: 'Industry-standard Microsoft technology certification',
      comptia: 'Vendor-neutral IT certification recognized worldwide',
      ibew: 'Union-recognized electrical trade certification',
      milady: 'State-approved beauty and wellness certification',
      nccer: 'Construction industry standard certification',
    };

    return recognition[partnerId] || 'Professional certification';
  }

  getCEUs(partnerId, programId) {
    // Mock CEU calculation
    return Math.floor(Math.random() * 20) + 10;
  }

  getAccreditation(partnerId) {
    const accreditations = {
      google_cloud: 'Google Cloud Authorized Training Partner',
      microsoft: 'Microsoft Learning Partner',
      comptia: 'CompTIA Authorized Partner',
      ibew: 'IBEW Training Alliance',
      milady: 'NACCAS Accredited',
      nccer: 'NCCER Accredited Training Sponsor',
    };

    return accreditations[partnerId] || 'Accredited Training Provider';
  }

  getCompetencies(partnerId, programId) {
    // Would return program-specific competencies
    return [
      'Technical proficiency demonstrated',
      'Industry best practices mastered',
      'Professional standards met',
      'Continuing education completed',
    ];
  }

  generateLinkedInPost(elevateCert, partnerCert) {
    return `🎓 Excited to share that I've completed ${elevateCert.program.name}!

Earned dual certifications:
✅ ${elevateCert.title} from Elevate for Humanity
✅ ${partnerCert.title} from ${partnerCert.issuer.name}

Ready to apply these new skills in my career!

#ProfessionalDevelopment #Certification #CareerGrowth #ElevateForHumanity`;
  }

  generateTwitterPost(elevateCert, partnerCert) {
    return `🏆 Just earned my ${partnerCert.title} certification! Dual certs from @ElevateHumanity and ${partnerCert.issuer.name}. Ready for the next challenge! #Certified #CareerGrowth`;
  }

  generateFacebookPost(elevateCert, partnerCert) {
    return `🎉 Milestone achieved! Successfully completed ${elevateCert.program.name} and earned certifications from both Elevate for Humanity and ${partnerCert.issuer.name}. Grateful for this learning opportunity and excited for what's next!`;
  }

  generateAppleWalletPass(certificate) {
    // Would generate Apple Wallet pass
    return {
      url: `https://elevateforhumanity.org/wallet/apple/${certificate.id}`,
    };
  }

  generateGoogleWalletPass(certificate) {
    // Would generate Google Wallet pass
    return {
      url: `https://elevateforhumanity.org/wallet/google/${certificate.id}`,
    };
  }
}

/**
 * Blockchain Verification System
 */
class BlockchainVerification {
  async createRecord(data) {
    // Mock blockchain verification
    const blockchainRecord = {
      transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      block_number: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString(),
      verification_url: `https://etherscan.io/tx/${data.transaction_hash}`,
      immutable_record: true,
    };

      `⛓️ Blockchain verification created: ${blockchainRecord.transaction_hash}`
    );
    return blockchainRecord;
  }
}

module.exports = DualCertificateSystem;

// Example usage
if (require.main === module) {
  const certificateSystem = new DualCertificateSystem();

}
