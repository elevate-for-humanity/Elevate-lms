/**
 * lib/curriculum/blueprints/it-help-desk.ts
 *
 * IT Help Desk & Support Technician — CompTIA A+ aligned.
 * SOC: 15-1232.00 — Computer User Support Specialists
 */
import type { CredentialBlueprint } from './types';

export const itHelpDeskBlueprint: CredentialBlueprint = {
  id: 'it-help-desk-v1',
  version: '1.0.0',
  credentialSlug: 'comptia-a-plus',
  credentialTitle: 'CompTIA A+ Certification',
  credentialCode: 'COMPTIA-A+',
  // CompTIA A+ is delivered by Pearson VUE (not Certiport).
  // These ITS stackable credentials are Certiport-delivered and align with
  // the networking and security modules in this program.
  certiportExamCodes: ['ITS-NETWORKING', 'ITS-CYBERSECURITY'],
  externalCourses: [
    {
      title: 'Google IT Support Certificate',
      provider: 'Google / Coursera',
      url: 'https://grow.google/certificates/it-support/',
      required: true,
    },
    {
      title: 'Microsoft Azure Fundamentals (AZ-900)',
      provider: 'Microsoft Learn',
      url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/',
      required: false,
    },
    {
      title: 'Cisco Networking Academy: Networking Basics',
      provider: 'Cisco Networking Academy',
      url: 'https://www.netacad.com/courses/networking/networking-basics',
      required: false,
    },
  ],
  state: 'federal',
  programSlug: 'it-help-desk',
  trackVariants: ['standard'],
  status: 'active',
  skipLqs: true,

  generationRules: {
    allowRemediation: true,
    allowExpansionLessons: false,
    maxTotalLessons: 60,
    requiresFinalExam: true,
    requiresUniversalReview: false,
    generatorMode: 'fixed',
  },

  expectedModuleCount: 7,
  expectedLessonCount: 49,

  videoConfig: {
    videoGenerator: 'runway',
    template: 'elevate-slide',
    instructorName: 'Marcus Washington',
    instructorTitle: 'CompTIA Certified IT Instructor',
    instructorImagePath: '/images/instructors/marcus-washington.jpg',
    topBarColor: '#6366f1',
    accentColor: '#3b82f6',
    backgroundColor: '#0f172a',
    ttsVoice: 'onyx',
    ttsSpeed: 0.95,
    slideCount: 5,
    segments: ['intro', 'concept', 'visual', 'application', 'wrapup'],
    generateDalleImage: true,
    dalleImageStyle: 'vivid',
    width: 1920,
    height: 1080,
  },

  assessmentRules: [
    { assessmentType: 'module', scope: 'all', minQuestions: 5, maxQuestions: 10, passingThreshold: 0.7 },
    { assessmentType: 'final', scope: 'all', minQuestions: 30, maxQuestions: 50, passingThreshold: 0.75 },
  ],

  modules: [
    {
      slug: 'it-hardware-fundamentals',
      title: 'PC Hardware Fundamentals',
      orderIndex: 1,
      domainKey: 'hardware',
      minLessons: 6, maxLessons: 8, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'hardware_components', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'motherboards', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'storage', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'it-hardware-intro', title: 'PC Hardware Components: CPU, RAM, and Motherboards', order: 1, domainKey: 'hardware' },
        { slug: 'it-storage-devices', title: 'Storage Technologies: HDD, SSD, NVMe, and RAID', order: 2, domainKey: 'hardware' },
        { slug: 'it-peripherals', title: 'Input/Output Devices and Peripheral Connectivity', order: 3, domainKey: 'hardware' },
        { slug: 'it-power-supplies', title: 'Power Supplies, Cooling, and Form Factors', order: 4, domainKey: 'hardware' },
        { slug: 'it-hardware-troubleshooting', title: 'Hardware Troubleshooting Methodology', order: 5, domainKey: 'hardware' },
        { slug: 'it-hardware-checkpoint', title: 'PC Hardware Fundamentals — Checkpoint', order: 6, domainKey: 'hardware' },
      ],
    },
    {
      slug: 'it-operating-systems',
      title: 'Operating Systems',
      orderIndex: 2,
      domainKey: 'os',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 6 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'windows', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'linux_basics', isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'macos', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'it-windows-installation', title: 'Windows Installation, Upgrade, and Imaging', order: 1, domainKey: 'os' },
        { slug: 'it-windows-admin', title: 'Windows Administration: Users, Groups, and Policies', order: 2, domainKey: 'os' },
        { slug: 'it-windows-tools', title: 'Windows Tools: Task Manager, Registry, and Event Viewer', order: 3, domainKey: 'os' },
        { slug: 'it-linux-basics', title: 'Linux Basics: Command Line, File System, and Permissions', order: 4, domainKey: 'os' },
        { slug: 'it-macos-overview', title: 'macOS Overview and Common Support Tasks', order: 5, domainKey: 'os' },
        { slug: 'it-os-troubleshooting', title: 'Operating System Troubleshooting and Recovery', order: 6, domainKey: 'os' },
        { slug: 'it-os-checkpoint', title: 'Operating Systems — Checkpoint', order: 7, domainKey: 'os' },
      ],
    },
    {
      slug: 'it-networking',
      title: 'Networking Fundamentals',
      orderIndex: 3,
      domainKey: 'networking',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 6 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'tcp_ip', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'wireless', isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'troubleshooting', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'it-tcp-ip', title: 'TCP/IP Protocols, IP Addressing, and Subnetting', order: 1, domainKey: 'networking' },
        { slug: 'it-network-hardware', title: 'Network Hardware: Routers, Switches, and Cables', order: 2, domainKey: 'networking' },
        { slug: 'it-wireless', title: 'Wireless Networking: Standards, Security, and Setup', order: 3, domainKey: 'networking' },
        { slug: 'it-dns-dhcp', title: 'DNS, DHCP, and Common Network Services', order: 4, domainKey: 'networking' },
        { slug: 'it-soho-networking', title: 'SOHO Network Setup and Configuration', order: 5, domainKey: 'networking' },
        { slug: 'it-network-troubleshooting', title: 'Network Troubleshooting Tools and Techniques', order: 6, domainKey: 'networking' },
        { slug: 'it-networking-checkpoint', title: 'Networking Fundamentals — Checkpoint', order: 7, domainKey: 'networking' },
      ],
    },
    {
      slug: 'it-security',
      title: 'Security Fundamentals',
      orderIndex: 4,
      domainKey: 'security',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 6 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'threats', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'authentication', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'data_protection', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'it-security-threats', title: 'Security Threats: Malware, Phishing, and Social Engineering', order: 1, domainKey: 'security' },
        { slug: 'it-authentication', title: 'Authentication Methods and Access Control', order: 2, domainKey: 'security' },
        { slug: 'it-windows-security', title: 'Windows Security Settings, Firewall, and Defender', order: 3, domainKey: 'security' },
        { slug: 'it-data-protection', title: 'Data Encryption, Backup, and Destruction', order: 4, domainKey: 'security' },
        { slug: 'it-mobile-security', title: 'Mobile Device Security and MDM Basics', order: 5, domainKey: 'security' },
        { slug: 'it-incident-response', title: 'Incident Response and Reporting Basics', order: 6, domainKey: 'security' },
        { slug: 'it-security-checkpoint', title: 'Security Fundamentals — Checkpoint', order: 7, domainKey: 'security' },
      ],
    },
    {
      slug: 'it-cloud-virtualization',
      title: 'Cloud Computing & Virtualization',
      orderIndex: 5,
      domainKey: 'cloud',
      minLessons: 6, maxLessons: 8, quizRequired: true, practicalRequired: false, isCritical: false,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'virtualization', isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'cloud_concepts', isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'remote_support', isCritical: true, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'it-virtualization', title: 'Virtualization: Hypervisors, VMs, and Containers', order: 1, domainKey: 'cloud' },
        { slug: 'it-cloud-concepts', title: 'Cloud Computing Models: IaaS, PaaS, SaaS', order: 2, domainKey: 'cloud' },
        { slug: 'it-remote-access', title: 'Remote Access Tools: RDP, VPN, and Remote Desktop', order: 3, domainKey: 'cloud' },
        { slug: 'it-cloud-storage', title: 'Cloud Storage Solutions and Backup Strategies', order: 4, domainKey: 'cloud' },
        { slug: 'it-office365-basics', title: 'Microsoft 365 and Google Workspace Administration Basics', order: 5, domainKey: 'cloud' },
        { slug: 'it-cloud-checkpoint', title: 'Cloud Computing & Virtualization — Checkpoint', order: 6, domainKey: 'cloud' },
      ],
    },
    {
      slug: 'it-mobile-printers',
      title: 'Mobile Devices & Printers',
      orderIndex: 6,
      domainKey: 'mobile',
      minLessons: 6, maxLessons: 7, quizRequired: true, practicalRequired: false, isCritical: false,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 5 }, { lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'mobile_support', isCritical: false, minimumTouchpoints: 1 },
        { competencyKey: 'printer_config', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        { slug: 'it-mobile-devices', title: 'Mobile Device Hardware, OS, and Connectivity', order: 1, domainKey: 'mobile' },
        { slug: 'it-mobile-troubleshooting', title: 'Mobile Device Troubleshooting and Repair', order: 2, domainKey: 'mobile' },
        { slug: 'it-printers-setup', title: 'Printer Types, Setup, and Network Printing', order: 3, domainKey: 'mobile' },
        { slug: 'it-printer-troubleshooting', title: 'Printer Troubleshooting and Maintenance', order: 4, domainKey: 'mobile' },
        { slug: 'it-iot-devices', title: 'IoT Devices, Smart Home Tech, and Support', order: 5, domainKey: 'mobile' },
        { slug: 'it-mobile-checkpoint', title: 'Mobile Devices & Printers — Checkpoint', order: 6, domainKey: 'mobile' },
      ],
    },
    {
      slug: 'it-exam-prep',
      title: 'CompTIA A+ Exam Preparation',
      orderIndex: 7,
      domainKey: 'exam_prep',
      minLessons: 7, maxLessons: 9, quizRequired: true, practicalRequired: false, isCritical: true,
      requiredLessonTypes: [{ lessonType: 'lesson', requiredCount: 4 }, { lessonType: 'checkpoint', requiredCount: 1 }, { lessonType: 'exam', requiredCount: 1 }],
      competencies: [
        { competencyKey: 'core1_prep', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'core2_prep', isCritical: true, minimumTouchpoints: 2 },
      ],
      lessons: [
        { slug: 'it-aplus-exam-overview', title: 'CompTIA A+ Exam: Core 1 and Core 2 Overview', order: 1, domainKey: 'exam_prep' },
        { slug: 'it-core1-review', title: 'Core 1 (220-1101) High-Yield Review', order: 2, domainKey: 'exam_prep' },
        { slug: 'it-core2-review', title: 'Core 2 (220-1102) High-Yield Review', order: 3, domainKey: 'exam_prep' },
        { slug: 'it-help-desk-soft-skills', title: 'Help Desk Soft Skills: Communication and Professionalism', order: 4, domainKey: 'exam_prep' },
        { slug: 'it-career-pathways', title: 'IT Career Pathways: Help Desk, Support, and Beyond', order: 5, domainKey: 'exam_prep' },
        { slug: 'it-exam-checkpoint', title: 'Exam Readiness — Checkpoint', order: 6, domainKey: 'exam_prep' },
        { slug: 'it-final-exam', title: 'IT Help Desk Comprehensive Final Exam', order: 7, domainKey: 'exam_prep' },
      ],
    },
  ],
};
