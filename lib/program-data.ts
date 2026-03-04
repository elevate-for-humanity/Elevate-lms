// lib/program-data.ts
export interface ProgramData {
  name: string;
  slug: string;
  description: string;
  duration: string;
  salaryRange: string;
  heroImage: string;
  skills: Array<{ title: string; description: string }>;
  jobTitles: Array<{ title: string; setting: string }>;
  outcomes: {
    jobPlacement: number;
    certificationPass: number;
    satisfaction: number;
  };
  certification: string;
  schedule: string[];
  requirements: string[];
  support: string[];
}

export const programsData: Record<string, ProgramData> = {
  "medical-assistant": {
    name: "Medical Assistant",
    slug: "medical-assistant",
    description: "Launch your healthcare career as a Medical Assistant. Provide essential clinical and administrative support in hospitals, clinics, and medical offices. Get certified in just 12 weeks with 100% funded training.",
    duration: "12 Weeks",
    salaryRange: "$35K-$45K",
    heroImage: "/images/pages/comp-pathway-healthcare.jpg",
    skills: [
      { title: "Clinical Skills", description: "Vital signs, injections, EKG, phlebotomy, and patient care procedures." },
      { title: "Administrative Skills", description: "Medical records, scheduling, billing, and insurance processing." },
      { title: "Medical Terminology", description: "Comprehensive understanding of healthcare language and documentation." },
      { title: "Laboratory Procedures", description: "Specimen collection, processing, and basic lab testing." },
      { title: "Patient Communication", description: "Professional interaction, empathy, and patient education skills." },
      { title: "Electronic Health Records", description: "EHR systems, data entry, and digital documentation." },
    ],
    jobTitles: [
      { title: "Clinical Medical Assistant", setting: "Hospitals, clinics, urgent care centers" },
      { title: "Administrative Medical Assistant", setting: "Medical offices, healthcare facilities" },
      { title: "Specialty Medical Assistant", setting: "Cardiology, pediatrics, orthopedics" },
      { title: "Back Office Medical Assistant", setting: "Private practices, group practices" },
    ],
    outcomes: { jobPlacement: 85, certificationPass: 92, satisfaction: 95 },
    certification: "Earn your Certified Medical Assistant (CMA) credential upon successful completion.",
    schedule: ["Full-time: Mon-Fri, 9am-3pm", "Part-time: Evenings available", "Weekend options"],
    requirements: ["High school diploma or GED", "18 years or older", "Background check required"],
    support: ["Job placement assistance", "Resume & interview prep", "Career counseling"],
  },

  "phlebotomy": {
    name: "Phlebotomy Technician",
    slug: "phlebotomy",
    description: "Become a certified Phlebotomy Technician and specialize in blood collection and laboratory procedures. This fast-track 8-week program prepares you for immediate employment in hospitals, labs, and clinics.",
    duration: "8 Weeks",
    salaryRange: "$32K-$42K",
    heroImage: "/images/pages/comp-pathway-healthcare.jpg",
    skills: [
      { title: "Venipuncture Techniques", description: "Master blood draw procedures using various methods and equipment." },
      { title: "Specimen Handling", description: "Proper collection, labeling, and processing of blood samples." },
      { title: "Patient Care", description: "Comfort techniques, communication, and safety protocols." },
      { title: "Laboratory Safety", description: "Infection control, PPE usage, and hazardous material handling." },
      { title: "Medical Equipment", description: "Operation of centrifuges, analyzers, and collection devices." },
      { title: "Quality Control", description: "Ensuring accuracy and compliance with laboratory standards." },
    ],
    jobTitles: [
      { title: "Hospital Phlebotomist", setting: "Hospitals, emergency departments" },
      { title: "Laboratory Phlebotomist", setting: "Diagnostic labs, blood banks" },
      { title: "Mobile Phlebotomist", setting: "Home health, mobile collection services" },
      { title: "Donor Center Phlebotomist", setting: "Blood donation centers, plasma centers" },
    ],
    outcomes: { jobPlacement: 88, certificationPass: 90, satisfaction: 93 },
    certification: "Earn your Certified Phlebotomy Technician (CPT) credential upon successful completion.",
    schedule: ["Full-time: Mon-Fri, 9am-2pm", "Evening classes available", "Weekend intensive options"],
    requirements: ["High school diploma or GED", "18 years or older", "Background check and drug screening"],
    support: ["Job placement assistance", "Externship opportunities", "Certification exam prep"],
  },

  "ekg-technician": {
    name: "EKG Technician",
    slug: "ekg-technician",
    description: "Train to become an EKG Technician and perform vital cardiac monitoring tests. This specialized 6-week program prepares you for a focused career in cardiovascular diagnostics.",
    duration: "6 Weeks",
    salaryRange: "$33K-$43K",
    heroImage: "/images/pages/comp-pathway-healthcare.jpg",
    skills: [
      { title: "EKG Procedures", description: "12-lead EKG, Holter monitoring, and stress test administration." },
      { title: "Cardiac Anatomy", description: "Understanding heart structure, function, and electrical conduction." },
      { title: "Rhythm Analysis", description: "Identifying normal and abnormal cardiac rhythms." },
      { title: "Equipment Operation", description: "EKG machines, telemetry systems, and monitoring devices." },
      { title: "Patient Preparation", description: "Electrode placement, patient positioning, and comfort care." },
      { title: "Medical Documentation", description: "Accurate recording and reporting of test results." },
    ],
    jobTitles: [
      { title: "EKG Technician", setting: "Hospitals, cardiology clinics" },
      { title: "Cardiac Monitor Technician", setting: "Telemetry units, ICU departments" },
      { title: "Stress Test Technician", setting: "Cardiac rehabilitation centers" },
      { title: "Holter Monitor Technician", setting: "Diagnostic centers, medical offices" },
    ],
    outcomes: { jobPlacement: 82, certificationPass: 89, satisfaction: 91 },
    certification: "Earn your Certified EKG Technician (CET) credential upon successful completion.",
    schedule: ["Full-time: Mon-Fri, 10am-2pm", "Part-time: Evenings twice weekly", "Flexible scheduling"],
    requirements: ["High school diploma or GED", "18 years or older", "Basic computer skills"],
    support: ["Job placement assistance", "Clinical externship", "Continuing education resources"],
  },

  "pharmacy-technician": {
    name: "Pharmacy Technician",
    slug: "pharmacy-technician",
    description: "Become a certified Pharmacy Technician and assist pharmacists in preparing and dispensing medications. This comprehensive 12-week program covers retail and hospital pharmacy settings.",
    duration: "12 Weeks",
    salaryRange: "$34K-$44K",
    heroImage: "/images/pages/comp-pathway-healthcare.jpg",
    skills: [
      { title: "Medication Preparation", description: "Counting, measuring, and compounding medications safely." },
      { title: "Pharmacy Calculations", description: "Dosage calculations, conversions, and measurements." },
      { title: "Prescription Processing", description: "Receiving, verifying, and filling prescriptions accurately." },
      { title: "Inventory Management", description: "Stock control, ordering, and medication storage." },
      { title: "Insurance Billing", description: "Processing claims and understanding pharmacy benefits." },
      { title: "Pharmacy Law", description: "Regulations, controlled substances, and ethical practices." },
    ],
    jobTitles: [
      { title: "Retail Pharmacy Technician", setting: "Chain pharmacies, independent pharmacies" },
      { title: "Hospital Pharmacy Technician", setting: "Hospitals, medical centers" },
      { title: "Compounding Technician", setting: "Specialty compounding pharmacies" },
      { title: "Mail Order Pharmacy Technician", setting: "Online pharmacies, distribution centers" },
    ],
    outcomes: { jobPlacement: 86, certificationPass: 91, satisfaction: 94 },
    certification: "Earn your Certified Pharmacy Technician (CPhT) credential upon successful completion.",
    schedule: ["Full-time: Mon-Fri, 9am-3pm", "Part-time: Evening classes", "Hybrid online/in-person options"],
    requirements: ["High school diploma or GED", "18 years or older", "Background check required"],
    support: ["Job placement assistance", "Externship placement", "PTCB exam preparation"],
  },

  "dental-assistant": {
    name: "Dental Assistant",
    slug: "dental-assistant",
    description: "Start your dental career as a Dental Assistant. Support dental professionals in patient care and office operations. This 10-week program prepares you for immediate employment in dental practices.",
    duration: "10 Weeks",
    salaryRange: "$36K-$46K",
    heroImage: "/images/pages/comp-pathway-healthcare.jpg",
    skills: [
      { title: "Chairside Assisting", description: "Four-handed dentistry, instrument passing, and patient care." },
      { title: "Dental Radiography", description: "X-ray techniques, safety protocols, and image processing." },
      { title: "Infection Control", description: "Sterilization, disinfection, and OSHA compliance." },
      { title: "Dental Materials", description: "Mixing cements, impressions, and temporary restorations." },
      { title: "Office Procedures", description: "Scheduling, billing, and patient communication." },
      { title: "Dental Anatomy", description: "Tooth structure, oral health, and dental terminology." },
    ],
    jobTitles: [
      { title: "Chairside Dental Assistant", setting: "General dentistry, specialty practices" },
      { title: "Expanded Functions Dental Assistant", setting: "Orthodontics, pediatric dentistry" },
      { title: "Dental Office Coordinator", setting: "Multi-doctor practices, dental groups" },
      { title: "Orthodontic Assistant", setting: "Orthodontic offices, specialty clinics" },
    ],
    outcomes: { jobPlacement: 87, certificationPass: 93, satisfaction: 96 },
    certification: "Earn your Certified Dental Assistant (CDA) credential upon successful completion.",
    schedule: ["Full-time: Mon-Fri, 9am-3pm", "Part-time: Evening options", "Weekend intensive available"],
    requirements: ["High school diploma or GED", "18 years or older", "Background check and health screening"],
    support: ["Job placement assistance", "Externship opportunities", "Resume and interview coaching"],
  },

  "patient-care-technician": {
    name: "Patient Care Technician",
    slug: "patient-care-technician",
    description: "Become a Patient Care Technician and provide direct patient care in hospitals and healthcare facilities. This comprehensive 14-week program combines CNA, EKG, and phlebotomy skills.",
    duration: "14 Weeks",
    salaryRange: "$35K-$45K",
    heroImage: "/images/pages/comp-pathway-healthcare.jpg",
    skills: [
      { title: "Basic Nursing Skills", description: "Vital signs, patient hygiene, mobility assistance, and comfort care." },
      { title: "EKG Monitoring", description: "Cardiac monitoring, telemetry, and rhythm recognition." },
      { title: "Phlebotomy", description: "Blood collection, specimen handling, and laboratory procedures." },
      { title: "Patient Safety", description: "Fall prevention, infection control, and emergency response." },
      { title: "Medical Documentation", description: "Charting, reporting, and electronic health records." },
      { title: "Communication Skills", description: "Patient interaction, family support, and team collaboration." },
    ],
    jobTitles: [
      { title: "Patient Care Technician", setting: "Hospitals, medical-surgical units" },
      { title: "Telemetry Technician", setting: "Cardiac care units, step-down units" },
      { title: "Emergency Department Technician", setting: "Emergency rooms, urgent care" },
      { title: "ICU Technician", setting: "Intensive care units, critical care" },
    ],
    outcomes: { jobPlacement: 89, certificationPass: 92, satisfaction: 95 },
    certification: "Earn multiple certifications: CNA, EKG Technician, and Phlebotomy Technician credentials.",
    schedule: ["Full-time: Mon-Fri, 8am-4pm", "Clinical rotations included", "Flexible scheduling available"],
    requirements: ["High school diploma or GED", "18 years or older", "Background check, drug screening, and immunizations"],
    support: ["Job placement assistance", "Clinical preceptorship", "Multi-certification exam prep"],
  },

  "sterile-processing": {
    name: "Sterile Processing Technician",
    slug: "sterile-processing",
    description: "Train as a Sterile Processing Technician and ensure medical instruments are properly sterilized and maintained. This critical 12-week program prepares you for behind-the-scenes healthcare work.",
    duration: "12 Weeks",
    salaryRange: "$37K-$47K",
    heroImage: "/images/pages/comp-pathway-healthcare.jpg",
    skills: [
      { title: "Decontamination", description: "Cleaning, disinfecting, and preparing instruments for sterilization." },
      { title: "Sterilization Methods", description: "Autoclaving, gas sterilization, and low-temperature methods." },
      { title: "Instrument Identification", description: "Recognizing surgical instruments and assembly procedures." },
      { title: "Quality Assurance", description: "Testing, monitoring, and documenting sterilization processes." },
      { title: "Inventory Management", description: "Tracking instruments, supplies, and equipment maintenance." },
      { title: "Safety Protocols", description: "Infection prevention, chemical safety, and regulatory compliance." },
    ],
    jobTitles: [
      { title: "Sterile Processing Technician", setting: "Hospitals, surgical centers" },
      { title: "Central Supply Technician", setting: "Medical centers, healthcare facilities" },
      { title: "Surgical Instrument Technician", setting: "Operating rooms, ambulatory surgery centers" },
      { title: "Endoscopy Technician", setting: "GI labs, endoscopy centers" },
    ],
    outcomes: { jobPlacement: 84, certificationPass: 90, satisfaction: 92 },
    certification: "Earn your Certified Registered Central Service Technician (CRCST) credential upon successful completion.",
    schedule: ["Full-time: Mon-Fri, 9am-3pm", "Part-time: Evening classes", "Weekend options available"],
    requirements: ["High school diploma or GED", "18 years or older", "Background check required"],
    support: ["Job placement assistance", "Hands-on lab training", "Certification exam preparation"],
  },

  "healthcare-administration": {
    name: "Healthcare Administration",
    slug: "healthcare-administration",
    description: "Launch your career in Healthcare Administration and manage healthcare office operations and patient records. This comprehensive 16-week program covers medical billing, coding, and office management.",
    duration: "16 Weeks",
    salaryRange: "$40K-$50K",
    heroImage: "/media/programs/healthcare-programs-grid-hd.jpg",
    skills: [
      { title: "Medical Billing", description: "Claims processing, reimbursement, and revenue cycle management." },
      { title: "Medical Coding", description: "ICD-10, CPT coding, and diagnosis code assignment." },
      { title: "Office Management", description: "Scheduling, staffing, and operational procedures." },
      { title: "Health Information", description: "Medical records, HIPAA compliance, and data management." },
      { title: "Insurance Processing", description: "Verification, authorization, and claims follow-up." },
      { title: "Healthcare Software", description: "EHR systems, practice management, and billing software." },
    ],
    jobTitles: [
      { title: "Medical Office Manager", setting: "Physician offices, medical practices" },
      { title: "Medical Billing Specialist", setting: "Billing companies, healthcare facilities" },
      { title: "Health Information Technician", setting: "Hospitals, medical records departments" },
      { title: "Patient Services Coordinator", setting: "Clinics, healthcare organizations" },
    ],
    outcomes: { jobPlacement: 83, certificationPass: 88, satisfaction: 93 },
    certification: "Earn your Certified Medical Administrative Assistant (CMAA) credential upon successful completion.",
    schedule: ["Full-time: Mon-Fri, 9am-3pm", "Part-time: Evening classes", "Hybrid online/in-person format"],
    requirements: ["High school diploma or GED", "18 years or older", "Basic computer skills"],
    support: ["Job placement assistance", "Internship opportunities", "Professional development resources"],
  },
};
