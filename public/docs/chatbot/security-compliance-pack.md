# Security & Compliance Pack

## Elevate for Humanity Platform Security Overview

---

## Executive Summary

Elevate for Humanity maintains enterprise-grade security controls to protect learner data, ensure regulatory compliance, and provide reliable service to our partners. This document outlines our security posture, compliance certifications, and data handling practices.

---

## 1. Infrastructure Security

### Cloud Infrastructure

| Component | Provider | Certification |
|-----------|----------|---------------|
| Application Hosting | Netlify / AWS | SOC 2 Type II |
| Database | Supabase (PostgreSQL) | SOC 2 Type II |
| File Storage | Supabase Storage | SOC 2 Type II |
| CDN | Cloudflare | SOC 2 Type II |
| Email | Resend | SOC 2 Type II |

### Network Security

- **TLS 1.3** encryption for all data in transit
- **DDoS protection** via Cloudflare
- **Web Application Firewall (WAF)** enabled
- **Rate limiting** on all API endpoints
- **IP allowlisting** available for enterprise clients

### Data Encryption

- **At Rest:** AES-256 encryption for all stored data
- **In Transit:** TLS 1.3 for all communications
- **Backups:** Encrypted and stored in geographically separate locations

---

## 2. Application Security

### Authentication & Access Control

- **Multi-factor authentication (MFA)** supported
- **Role-based access control (RBAC)** with granular permissions
- **Session management** with automatic timeout
- **Password requirements:** Minimum 12 characters, complexity enforced
- **Brute force protection:** Account lockout after failed attempts

### Security Development Lifecycle

- Code review required for all changes
- Automated security scanning (SAST/DAST)
- Dependency vulnerability monitoring
- Regular penetration testing
- Bug bounty program (contact security@elevateforhumanity.org)

### Audit Logging

All security-relevant events are logged, including:
- User authentication events
- Data access and modifications
- Administrative actions
- API access patterns

Logs retained for minimum 1 year.

---

## 3. Compliance Certifications

### Current Certifications

| Regulation | Status | Details |
|------------|--------|---------|
| **FERPA** | ✓ Compliant | Student data privacy controls |
| **WIOA** | ✓ Compliant | Workforce reporting automation |
| **ADA/Section 508** | ✓ Compliant | Accessibility standards |
| **GDPR** | ✓ Compliant | EU data protection (where applicable) |
| **CCPA** | ✓ Compliant | California privacy rights |

### FERPA Compliance Details

- Designated as "School Official" under FERPA
- No disclosure of PII without consent
- Parent/eligible student access rights supported
- Data minimization practices
- Annual FERPA training for all staff

### WIOA Compliance Details

- Automated quarterly reporting
- Performance metric tracking
- Credential attainment documentation
- Employment outcome tracking
- Audit-ready data exports

---

## 4. Data Handling

### Data Classification

| Classification | Examples | Handling |
|----------------|----------|----------|
| Public | Course catalogs, marketing | No restrictions |
| Internal | Aggregate analytics | Staff access only |
| Confidential | Learner PII, grades | Encrypted, access-controlled |
| Restricted | SSN, financial data | Additional encryption, audit logging |

### Data Retention

| Data Type | Retention Period | Deletion Method |
|-----------|------------------|-----------------|
| Active learner records | Duration of enrollment + 7 years | Secure deletion |
| Completed learner records | 7 years post-completion | Secure deletion |
| Audit logs | 7 years | Secure deletion |
| Marketing data | Until consent withdrawn | Immediate deletion |

### Data Subject Rights

We support the following rights for all users:
- **Access:** Request copy of personal data
- **Rectification:** Correct inaccurate data
- **Erasure:** Request deletion (subject to legal requirements)
- **Portability:** Export data in standard formats
- **Objection:** Opt out of certain processing

---

## 5. Incident Response

### Response Timeline

| Severity | Response Time | Resolution Target |
|----------|---------------|-------------------|
| Critical (data breach) | 1 hour | 24 hours |
| High (service outage) | 4 hours | 48 hours |
| Medium (degraded service) | 8 hours | 72 hours |
| Low (minor issues) | 24 hours | 1 week |

### Breach Notification

In the event of a data breach:
1. Affected parties notified within 72 hours
2. Regulatory bodies notified as required
3. Root cause analysis completed
4. Remediation plan implemented
5. Post-incident report provided

---

## 6. Business Continuity

### Availability

- **Target uptime:** 99.9%
- **Actual uptime (trailing 12 months):** 99.95%
- **Maintenance windows:** Scheduled, communicated 48 hours in advance

### Disaster Recovery

- **RPO (Recovery Point Objective):** 1 hour
- **RTO (Recovery Time Objective):** 4 hours
- **Backup frequency:** Continuous replication + daily snapshots
- **Geographic redundancy:** Multi-region deployment

---

## 7. Vendor Management

### Third-Party Risk

All vendors undergo security assessment including:
- SOC 2 report review
- Data processing agreement
- Annual reassessment
- Incident notification requirements

### Subprocessors

Current subprocessors are listed at: [elevateforhumanity.org/subprocessors](/subprocessors)

Changes communicated 30 days in advance.

---

## 8. Contact Information

**Security Team:** security@elevateforhumanity.org

**Data Protection Officer:** privacy@elevateforhumanity.org

**Compliance Questions:** compliance@elevateforhumanity.org

**Report a Vulnerability:** security@elevateforhumanity.org

---

## 9. Document Control

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-01 | Initial release |
| 1.1 | 2024-06-01 | Added CCPA compliance |
| 1.2 | 2025-01-01 | Updated infrastructure details |

---

*This document is provided for informational purposes. For specific compliance questions or to request a formal security assessment, please contact our security team.*
