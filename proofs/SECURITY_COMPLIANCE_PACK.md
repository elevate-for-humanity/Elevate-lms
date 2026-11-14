# Security & Compliance Questionnaire Response Pack

For enterprise, government, and funder review.
Use as a master response. Copy/paste sections as needed.

---

## 1. Data Security

**Q: How is data protected?**
A: The Platform follows industry-standard security practices including encrypted data transmission, access controls, and environment separation. Sensitive operations are system-enforced and logged.

**Q: Is data encrypted?**
A: Data is encrypted in transit using HTTPS/TLS. Data at rest is protected by the underlying infrastructure provider's encryption controls.

---

## 2. Access Control

**Q: How is access managed?**
A: Role-based access controls are enforced. Administrative actions are restricted to authorized users and require authentication.

**Q: Can access be revoked?**
A: Yes. Administrative access can be granted or revoked at any time.

---

## 3. Auditability & Logging

**Q: Are actions logged?**
A: Yes. Key lifecycle events (enrollment, completion, credential issuance) are system-recorded and reproducible.

**Q: Can reports be regenerated?**
A: Yes. Reports are derived from system-recorded events, not manual inputs.

---

## 4. Data Ownership

**Q: Who owns the data?**
A: The Client retains ownership of all Client data. Provider acts as a data processor for the purposes of delivering the Platform.

---

## 5. Availability & Reliability

**Q: What is the uptime commitment?**
A: The Platform is designed for continuous availability. Formal SLAs may be defined in the Agreement if required.

**Q: How are failures handled?**
A: The Platform enforces idempotent operations to prevent duplicate or inconsistent outcomes during retries or transient failures.

---

## 6. Compliance Alignment

**Q: Is the Platform compliant with [FERPA / GDPR / other]?**
A: The Platform is designed to support compliance by enforcing access controls, data separation, and auditability. Ultimate compliance obligations remain with the Client.

**Q: Does the Platform support audits?**
A: Yes. Deterministic lifecycle enforcement and logging support audit review.

---

## 7. Third-Party Services

**Q: Are third parties involved?**
A: The Platform may rely on reputable infrastructure and service providers. No Client data is sold or used outside the scope of service delivery.

---

## 8. Incident Response

**Q: What happens in the event of an incident?**
A: Incidents are addressed promptly, with appropriate notification and remediation consistent with the Agreement.

---

## 9. Custom Security Reviews

**Q: Can you complete our security questionnaire?**
A: Yes. Institution-specific questionnaires can be reviewed as part of the procurement process.

---

## Quick Reference for Common Frameworks

| Framework              | Platform Support                                             |
| ---------------------- | ------------------------------------------------------------ |
| **FERPA**              | Access controls, audit logging, data separation              |
| **GDPR**               | Data ownership clarity, access controls, deletion capability |
| **SOC 2**              | Logging, access controls, availability design                |
| **State Privacy Laws** | Configurable data handling, audit trails                     |

---

## Why This Works

- Answers 80–90% of standard security reviews
- Avoids over-committing
- Keeps responsibility boundaries clear
