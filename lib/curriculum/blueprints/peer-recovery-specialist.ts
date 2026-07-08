import type { CredentialBlueprint } from './types';

export const peerRecoverySpecialistBlueprint: CredentialBlueprint = {
  id: 'peer-recovery-specialist-in-v1',
  version: '1.0.0',
  credentialSlug: 'peer-recovery-specialist',
  credentialTitle: 'Indiana Peer Recovery Specialist',
  credentialCode: 'ICRC-PRS', // maps to credential_domains table
  socCode: '21-1093.00', // O*NET: Social and Human Service Assistants
  state: 'IN',
  programSlug: 'peer-recovery-specialist',
  trackVariants: ['standard'],
  status: 'draft',
  credentialTarget: 'STATE_BOARD',
  minimumHours: 40,
  requiresFinalExam: true,
  skipLqs: true,
  expectedModuleCount: 6,
  expectedLessonCount: 37,
  generationRules: {
    minModules: 6,
    maxModules: 6,
    minLessonsPerModule: 5,
    maxLessonsPerModule: 6,
    requireCheckpointPerModule: true,
    requireFinalExam: true,
    passingScore: 70,
    allowedLessonTypes: ['lesson', 'checkpoint', 'exam'],
  },
  videoConfig: {
    videoGenerator: 'runway',
    template: 'elevate-slide',
    instructorName: 'Marcus Johnson',
    instructorTitle: 'Workforce Development Specialist',
    instructorImagePath: '/images/instructors/marcus-johnson.jpg',
    topBarColor: '#f97316',
    accentColor: '#3b82f6',
    backgroundColor: '#0f172a',
    ttsVoice: 'onyx',
    ttsSpeed: 0.85,
    slideCount: 5,
    segments: ['intro', 'concept', 'visual', 'application', 'wrapup'],
    generateDalleImage: true,
    dalleImageStyle: 'natural',
    width: 1920,
    height: 1080,
  },
  modules: [
    // MODULE 1 — PLACEHOLDER
    {
      slug: 'prs-foundations',
      title: 'Foundations of Peer Recovery',
      orderIndex: 1,
      domainKey: 'foundations',
      minLessons: 5,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [{ lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        {
          competencyKey: 'recovery_principles',
          isCritical: true,
          minimumTouchpoints: 2,
          assessmentMethod: 'quiz',
        },
      ],
      lessons: [
        {
          slug: 'prs-foundations-lesson-1',
          title: 'What Is Peer Recovery Support?',
          order: 1,
          domainKey: 'foundations',
          objective:
            'Define peer recovery support and explain the role of a Peer Recovery Specialist.',
          durationMinutes: 10,
          content: `<p>Peer recovery support is a form of non-clinical assistance provided by individuals who have lived experience with substance use disorder, mental health challenges, or both. Unlike clinical treatment, peer support is rooted in shared experience, mutual respect, and the belief that recovery is possible for everyone.</p><p>A Peer Recovery Specialist (PRS) is a trained professional who uses their own recovery journey to support others. In Indiana, the PRS credential is recognized by the Family and Social Services Administration (FSSA) and is a growing part of the behavioral health workforce.</p><p>The four dimensions of recovery — health, home, purpose, and community — guide the work of every PRS. Your role is not to fix people, but to walk alongside them as they build a life in recovery.</p><p>Key functions of a PRS include: providing emotional support, connecting individuals to community resources, assisting with goal-setting, and modeling recovery. You are a bridge between the person in recovery and the systems designed to help them.</p><p>Recovery looks different for everyone. Some people pursue abstinence; others use medication-assisted treatment. Your role is to support the individual's chosen path without judgment. This person-centered approach is the foundation of effective peer support.</p>`,
        },
        {
          slug: 'prs-foundations-lesson-2',
          title: 'The History and Science of Recovery',
          order: 2,
          domainKey: 'foundations',
          objective:
            'Describe the historical development of the recovery movement and the science behind addiction.',
          durationMinutes: 10,
          content: `<p>Understanding the history of the recovery movement helps you appreciate why peer support exists and why it matters. For much of the 20th century, addiction was viewed as a moral failing rather than a health condition. People were punished, institutionalized, or simply abandoned.</p><p>The modern recovery movement began with mutual aid groups like Alcoholics Anonymous in the 1930s and expanded through the consumer/survivor movement of the 1970s and 80s. SAMHSA's National Recovery Initiative, launched in 2003, formally recognized peer support as an evidence-based practice.</p><p>Science now confirms that addiction is a chronic brain disorder influenced by genetics, environment, and development. The brain's reward system is altered by substance use, making cravings powerful and relapse common. This is not weakness — it is biology.</p><p>Recovery is defined by SAMHSA as a process of change through which individuals improve their health and wellness, live self-directed lives, and strive to reach their full potential. This definition is broad by design — it includes people at all stages and using all pathways.</p><p>As a PRS, you carry this history with you. You are part of a movement that has fought for decades to humanize addiction and expand access to support. Your work continues that legacy.</p>`,
        },
        {
          slug: 'prs-foundations-lesson-3',
          title: 'Recovery Pathways and Person-Centered Care',
          order: 3,
          domainKey: 'foundations',
          objective:
            'Identify multiple pathways to recovery and apply person-centered principles in peer support.',
          durationMinutes: 10,
          content: `<p>There is no single road to recovery. Research and lived experience both confirm that people recover through many different pathways — and often through a combination of them. As a PRS, your job is to support the individual's chosen path, not to prescribe one.</p><p>Common recovery pathways include: mutual aid (AA, NA, SMART Recovery, Celebrate Recovery), medication-assisted treatment (MAT) with buprenorphine or methadone, faith-based recovery, therapeutic communities, and natural recovery without formal treatment. Each is valid.</p><p>Person-centered care means the individual drives their own recovery plan. You ask, you listen, you reflect — you do not direct. Questions like "What matters most to you right now?" and "What does a good day look like for you?" open space for the person to define their own goals.</p><p>Motivational interviewing (MI) principles align closely with person-centered peer support. Express empathy, develop discrepancy, roll with resistance, and support self-efficacy. You are not the expert on someone else's life — they are.</p><p>Confidentiality is essential to person-centered care. When people trust that their information is protected, they are more likely to be honest and engaged. Always explain confidentiality limits at the start of your relationship.</p>`,
        },
        {
          slug: 'prs-foundations-lesson-4',
          title: 'Wellness and the Eight Dimensions',
          order: 4,
          domainKey: 'foundations',
          objective:
            "Apply SAMHSA's eight dimensions of wellness to support holistic recovery planning.",
          durationMinutes: 10,
          content: `<p>SAMHSA's eight dimensions of wellness provide a holistic framework for recovery support. They are: emotional, environmental, financial, intellectual, occupational, physical, social, and spiritual wellness. A PRS uses this framework to help individuals identify strengths and gaps across all areas of life.</p><p>Emotional wellness involves the ability to cope with life's challenges and build positive relationships. Many people in recovery have experienced trauma that affects emotional regulation. Your role is to provide a safe, non-judgmental space for emotional expression.</p><p>Financial and occupational wellness are often overlooked in recovery planning. Stable income and meaningful work are powerful protective factors. Connecting individuals to workforce development programs, job training, and benefits navigation is a core PRS function.</p><p>Social wellness — having supportive relationships and community connections — is one of the strongest predictors of sustained recovery. Isolation is a major relapse risk. Help individuals identify and build their recovery community.</p><p>Spiritual wellness does not require religious belief. It refers to a sense of purpose, meaning, and connection to something larger than oneself. For many people in recovery, spirituality is a central pillar. Respect each person's spiritual framework without imposing your own.</p><p>Use the eight dimensions as a conversation tool, not a checklist. Ask open-ended questions about each area and let the individual identify where they want to focus their energy.</p>`,
        },
        {
          slug: 'prs-foundations-lesson-5',
          title: "The PRS Role in Indiana's Behavioral Health System",
          order: 5,
          domainKey: 'foundations',
          objective:
            "Describe the PRS role within Indiana's behavioral health system and key partner agencies.",
          durationMinutes: 10,
          content: `<p>Indiana's behavioral health system includes a network of providers, state agencies, and community organizations working together to support individuals in recovery. As a PRS, you are a vital connector within this system.</p><p>The Indiana Division of Mental Health and Addiction (DMHA) oversees behavioral health services and sets standards for peer support. The Family and Social Services Administration (FSSA) administers Medicaid, which now reimburses peer recovery services in Indiana — making your work billable and sustainable.</p><p>Key partners you will work with include: Certified Community Behavioral Health Clinics (CCBHCs), Recovery Community Organizations (RCOs), community mental health centers, hospital discharge planners, drug courts, and re-entry programs. Understanding each partner's role helps you make effective referrals.</p><p>The PRS credential in Indiana requires 46 hours of training, a competency exam, and ongoing continuing education. Maintaining your credential means staying current with best practices and ethical standards.</p><p>Professional conduct is non-negotiable. You represent not only yourself but the entire peer support profession. Arrive on time, maintain appropriate boundaries, document your work accurately, and communicate professionally with all partners. Your credibility is your most valuable asset.</p>`,
        },
        {
          slug: 'prs-foundations-checkpoint',
          title: 'Foundations of Peer Recovery — Knowledge Check',
          order: 6,
          domainKey: 'foundations',
          objective:
            'Demonstrate understanding of peer recovery foundations, history, and the PRS role.',
          durationMinutes: 10,
          passingScore: 70,
          content: `<p>Review what you have learned about the foundations of peer recovery before continuing.</p>`,
          quizQuestions: [
            {
              id: 'prs-f-q1',
              question:
                'Which of the following best describes the role of a Peer Recovery Specialist?',
              options: [
                'Providing clinical therapy and diagnosis',
                'Using lived experience to support others in recovery',
                'Prescribing medication-assisted treatment',
                'Managing inpatient treatment programs',
              ],
              correctAnswer: 1,
              explanation:
                'A PRS uses their own lived experience with recovery to support others — this is what distinguishes peer support from clinical treatment.',
            },
            {
              id: 'prs-f-q2',
              question: 'SAMHSA defines recovery as:',
              options: [
                'Complete abstinence from all substances',
                'A process of change through which individuals improve health, live self-directed lives, and reach their full potential',
                'Completion of a 28-day inpatient program',
                'Attendance at 90 AA meetings in 90 days',
              ],
              correctAnswer: 1,
              explanation:
                "SAMHSA's definition is broad and inclusive — it does not require abstinence and recognizes multiple pathways.",
            },
            {
              id: 'prs-f-q3',
              question:
                "Which of the following is NOT one of SAMHSA's eight dimensions of wellness?",
              options: ['Financial', 'Occupational', 'Political', 'Spiritual'],
              correctAnswer: 2,
              explanation:
                'The eight dimensions are emotional, environmental, financial, intellectual, occupational, physical, social, and spiritual. Political is not included.',
            },
            {
              id: 'prs-f-q4',
              question: 'Person-centered care means:',
              options: [
                'The PRS sets goals for the individual',
                'The individual drives their own recovery plan',
                'The treatment team decides the best pathway',
                'Recovery must follow a clinical protocol',
              ],
              correctAnswer: 1,
              explanation:
                "Person-centered care places the individual in the driver's seat — the PRS supports, not directs.",
            },
            {
              id: 'prs-f-q5',
              question:
                'In Indiana, which agency oversees behavioral health services and PRS credentialing standards?',
              options: [
                'Department of Education',
                'Division of Mental Health and Addiction (DMHA)',
                'Department of Labor',
                'Bureau of Motor Vehicles',
              ],
              correctAnswer: 1,
              explanation:
                'DMHA under FSSA oversees behavioral health services and sets standards for peer support in Indiana.',
            },
          ],
        },
      ],
    },
    // MODULE 2 — PLACEHOLDER
    {
      slug: 'prs-ethics',
      title: 'Ethics, Boundaries, and Professional Conduct',
      orderIndex: 2,
      domainKey: 'ethics',
      minLessons: 5,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      requiredLessonTypes: [{ lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        {
          competencyKey: 'professional_ethics',
          isCritical: true,
          minimumTouchpoints: 2,
          assessmentMethod: 'quiz',
        },
      ],
      lessons: [
        {
          slug: 'prs-ethics-lesson-1',
          title: 'The Code of Ethics for Peer Recovery Specialists',
          order: 1,
          domainKey: 'ethics',
          objective:
            'Identify the core ethical principles governing peer recovery support practice.',
          durationMinutes: 10,
          content: `<p>Ethics are the foundation of professional peer support. Without a clear ethical framework, the trust that makes peer support effective cannot exist. Indiana's PRS credential requires adherence to a code of ethics that protects both the people you serve and the integrity of the profession.</p><p>The core ethical principles for PRS practice include: respect for autonomy, non-maleficence (do no harm), beneficence (act in the person's best interest), justice (fair and equitable treatment), and fidelity (honesty and keeping commitments). These principles guide every interaction.</p><p>Respect for autonomy means honoring the individual's right to make their own decisions — even decisions you disagree with. Your role is to provide information and support, not to control outcomes. When someone chooses a path you would not choose, your job is to remain present and supportive.</p><p>Non-maleficence requires you to be aware of how your actions, words, and even your presence can cause harm. Sharing too much of your own story, giving unsolicited advice, or creating dependency are all forms of harm that well-meaning peers can cause.</p><p>Fidelity — keeping your word — is especially important in peer support. Many people you work with have experienced broken promises and betrayal. When you say you will do something, do it. When you cannot, communicate honestly and promptly.</p>`,
        },
        {
          slug: 'prs-ethics-lesson-2',
          title: 'Professional Boundaries in Peer Support',
          order: 2,
          domainKey: 'ethics',
          objective:
            'Define professional boundaries and identify boundary violations in peer support relationships.',
          durationMinutes: 10,
          content: `<p>Boundaries are the limits that define a healthy professional relationship. In peer support, boundaries can be especially challenging because the relationship is built on shared experience and genuine human connection. The line between peer and friend can blur — and when it does, harm often follows.</p><p>Professional boundaries include: maintaining appropriate physical space, avoiding dual relationships (being both a peer supporter and a personal friend), not sharing personal contact information, not accepting gifts, and not meeting outside of professional settings without supervisor approval.</p><p>Dual relationships are one of the most common boundary challenges in peer support. If you are supporting someone who is also your neighbor, family member, or former romantic partner, the relationship is compromised. Disclose the conflict to your supervisor and, if necessary, refer the person to another PRS.</p><p>Self-disclosure — sharing your own recovery story — is a powerful tool in peer support. But it must be intentional and purposeful. Ask yourself: "Am I sharing this to help them, or to help myself?" Over-disclosure shifts the focus from the person you are supporting to yourself.</p><p>When a boundary is crossed — by you or by the person you are supporting — address it directly, calmly, and without shame. Document the incident and consult your supervisor. Boundaries are not walls; they are the structure that keeps the relationship safe and effective.</p>`,
        },
        {
          slug: 'prs-ethics-lesson-3',
          title: 'Confidentiality and HIPAA in Peer Support',
          order: 3,
          domainKey: 'ethics',
          objective: 'Apply confidentiality rules and HIPAA requirements to peer support practice.',
          durationMinutes: 10,
          content: `<p>Confidentiality is both an ethical obligation and a legal requirement. People share deeply personal information with their peer supporters — information about their substance use, mental health, family situations, and legal history. Protecting that information is non-negotiable.</p><p>HIPAA (Health Insurance Portability and Accountability Act) applies to peer support services delivered within covered healthcare entities. It restricts the sharing of Protected Health Information (PHI) without written consent. Even confirming that someone is receiving services is a HIPAA violation without consent.</p><p>42 CFR Part 2 provides additional protections for substance use disorder treatment records. These records cannot be shared — even with other healthcare providers — without specific written consent. This is stricter than standard HIPAA and applies to most peer support settings.</p><p>There are limits to confidentiality that you must disclose at the start of every peer support relationship. You are required to break confidentiality when: the person discloses intent to harm themselves or others, there is suspected abuse or neglect of a child or vulnerable adult, or a court order requires disclosure.</p><p>When you must break confidentiality, do so with care. Inform the person before you make the report when it is safe to do so. Document your decision and the steps you took. Consult your supervisor whenever you are uncertain. Confidentiality is the cornerstone of trust — protect it fiercely.</p>`,
        },
        {
          slug: 'prs-ethics-lesson-4',
          title: 'Mandatory Reporting and Duty to Warn',
          order: 4,
          domainKey: 'ethics',
          objective:
            'Identify mandatory reporting obligations and apply duty-to-warn principles correctly.',
          durationMinutes: 10,
          content: `<p>As a PRS, you are a mandated reporter in Indiana. This means you are legally required to report suspected abuse or neglect of children and vulnerable adults to the appropriate authorities. Failure to report is a criminal offense.</p><p>Child abuse and neglect must be reported to the Indiana Department of Child Services (DCS) at 1-800-800-5556. You do not need proof — reasonable suspicion is sufficient. The report triggers an investigation; you are not the investigator. Document your report and the response.</p><p>Duty to warn applies when a person makes a credible, specific threat to harm an identifiable third party. In Indiana, mental health professionals have a duty to warn the potential victim and notify law enforcement. While PRS are not licensed clinicians, you must immediately notify your supervisor and follow your organization's protocol.</p><p>Suicide risk requires immediate action. If someone expresses suicidal ideation with a plan and means, do not leave them alone. Call 988 (Suicide and Crisis Lifeline) or 911. Follow your organization's crisis protocol. Document everything.</p><p>These situations are stressful and emotionally demanding. After a mandatory report or crisis intervention, debrief with your supervisor. Secondary trauma is real — peer supporters who witness crisis regularly need their own support systems. Professional conduct includes taking care of yourself so you can continue to take care of others.</p>`,
        },
        {
          slug: 'prs-ethics-lesson-5',
          title: 'Professional Conduct and Workplace Standards',
          order: 5,
          domainKey: 'ethics',
          objective: 'Demonstrate professional conduct standards expected of a credentialed PRS.',
          durationMinutes: 10,
          content: `<p>Professional conduct is how you show up — in your appearance, your communication, your reliability, and your attitude. As a PRS, you represent the peer support profession every time you interact with a person in recovery, a colleague, or a community partner.</p><p>Punctuality and reliability are foundational. When you are late or cancel without notice, you send a message that the person's time and recovery are not important. Build systems that help you stay organized — calendars, reminders, and clear communication with supervisors when challenges arise.</p><p>Professional communication includes written and verbal skills. Emails and documentation should be clear, concise, and free of jargon. In person, use active listening — make eye contact, reflect back what you hear, and avoid interrupting. Your words carry weight; choose them carefully.</p><p>Social media conduct is part of professional standards. Do not connect with people you support on personal social media accounts. Do not post about your work in ways that could identify individuals. Your online presence reflects on your employer and the profession.</p><p>Continuing education is a professional obligation, not an option. The field of peer recovery support is evolving rapidly. Stay current with best practices, attend trainings, and seek supervision regularly. A PRS who stops learning stops growing — and the people you serve deserve your best.</p>`,
        },
        {
          slug: 'prs-ethics-checkpoint',
          title: 'Ethics, Boundaries, and Professional Conduct — Knowledge Check',
          order: 6,
          domainKey: 'ethics',
          objective:
            'Demonstrate understanding of ethics, boundaries, confidentiality, and professional conduct.',
          durationMinutes: 10,
          passingScore: 70,
          content: `<p>Review what you have learned about ethics and professional conduct before continuing.</p>`,
          quizQuestions: [
            {
              id: 'prs-e-q1',
              question:
                'A person you support tells you they are planning to hurt a specific person. What is your first action?',
              options: [
                'Keep it confidential — they trusted you',
                'Immediately notify your supervisor and follow crisis protocol',
                'Ask them to promise they will not follow through',
                'Wait to see if they bring it up again',
              ],
              correctAnswer: 1,
              explanation:
                "Duty to warn requires immediate action. Notify your supervisor and follow your organization's protocol — this is not a situation where confidentiality applies.",
            },
            {
              id: 'prs-e-q2',
              question:
                'Which federal law provides the strictest protections for substance use disorder treatment records?',
              options: ['HIPAA', '42 CFR Part 2', 'ADA', 'FERPA'],
              correctAnswer: 1,
              explanation:
                '42 CFR Part 2 provides protections specifically for SUD records that are stricter than standard HIPAA — records cannot be shared without specific written consent.',
            },
            {
              id: 'prs-e-q3',
              question: 'Self-disclosure in peer support should be:',
              options: [
                'Avoided entirely to maintain professionalism',
                'Intentional and purposeful — shared to benefit the person you support',
                'As detailed as possible to build connection',
                'Limited to your worst moments in addiction',
              ],
              correctAnswer: 1,
              explanation:
                'Self-disclosure is a tool, not a default. Always ask: "Am I sharing this to help them?" If the answer is no, don\'t share it.',
            },
            {
              id: 'prs-e-q4',
              question: 'In Indiana, suspected child abuse must be reported to:',
              options: [
                'Local police only',
                'Your supervisor only',
                'Indiana Department of Child Services at 1-800-800-5556',
                "The child's school",
              ],
              correctAnswer: 2,
              explanation:
                'Indiana DCS is the mandatory reporting agency for child abuse and neglect. You do not need proof — reasonable suspicion is sufficient.',
            },
            {
              id: 'prs-e-q5',
              question: 'A dual relationship in peer support occurs when:',
              options: [
                'You support two people at the same time',
                'You have both a professional and personal relationship with someone you support',
                'You work for two different organizations',
                'You support someone with both mental health and substance use challenges',
              ],
              correctAnswer: 1,
              explanation:
                'Dual relationships compromise the professional relationship. Disclose to your supervisor and refer if necessary.',
            },
          ],
        },
      ],
    },
    // MODULE 3 — PLACEHOLDER
    {
      slug: 'prs-advocacy',
      title: 'Advocacy and Person-Centered Support',
      orderIndex: 3,
      domainKey: 'advocacy',
      minLessons: 5,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      requiredLessonTypes: [{ lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        {
          competencyKey: 'advocacy_skills',
          isCritical: false,
          minimumTouchpoints: 1,
          assessmentMethod: 'quiz',
        },
      ],
      lessons: [
        {
          slug: 'prs-advocacy-lesson-1',
          title: 'What Is Advocacy in Peer Recovery?',
          order: 1,
          domainKey: 'advocacy',
          objective:
            'Define advocacy in the context of peer recovery and identify its core functions.',
          durationMinutes: 10,
          content: `<p>Advocacy is one of the most powerful tools in a PRS's toolkit. At its core, advocacy means speaking up for and alongside the people you support — helping them navigate systems, access resources, and assert their rights. Advocacy is not doing things for people; it is empowering them to do things for themselves.</p><p>There are three levels of advocacy in peer support: individual advocacy (helping one person navigate a specific system), organizational advocacy (working within agencies to improve policies and practices), and systemic advocacy (working to change laws, regulations, and social norms that affect people in recovery).</p><p>Individual advocacy is where most PRS work happens. This might look like accompanying someone to a benefits appointment, helping them prepare questions for their doctor, or supporting them in communicating their needs to a housing provider. Your presence signals that they are not alone.</p><p>Effective advocacy requires knowledge of the systems you are navigating. Learn the eligibility requirements for Medicaid, SNAP, housing assistance, and workforce programs in Indiana. Know the appeals process when benefits are denied. This knowledge is power — and you share it freely.</p><p>Advocacy also means challenging stigma. When you hear language that dehumanizes people in recovery — in a waiting room, a workplace, or a community meeting — you have an opportunity to educate and redirect. You do not have to be confrontational; a calm, factual response is often more effective than anger.</p>`,
        },
        {
          slug: 'prs-advocacy-lesson-2',
          title: 'Motivational Interviewing Fundamentals',
          order: 2,
          domainKey: 'advocacy',
          objective:
            'Apply the four core principles of motivational interviewing in peer support conversations.',
          durationMinutes: 10,
          content: `<p>Motivational Interviewing (MI) is an evidence-based communication style that helps people explore and resolve ambivalence about change. It was developed by William Miller and Stephen Rollnick and is now widely used in peer support, counseling, and healthcare settings.</p><p>The four core principles of MI are: Express Empathy, Develop Discrepancy, Roll with Resistance, and Support Self-Efficacy. Together, these principles create a conversation style that is collaborative, non-judgmental, and focused on the person's own motivation for change.</p><p>Expressing empathy means reflecting back what you hear without judgment. "It sounds like you're feeling stuck between wanting to use and wanting to stay clean" is empathy. "You just need to try harder" is not. Empathy builds the alliance that makes change possible.</p><p>Developing discrepancy means helping the person see the gap between where they are and where they want to be. "You said you want to be present for your kids — how does your current situation affect that?" This question invites reflection without confrontation.</p><p>Rolling with resistance means not arguing when someone pushes back. Resistance is information — it tells you the person is not ready, or that your approach needs to shift. Reflect the resistance: "It sounds like you're not sure this is the right time." Then listen.</p><p>Supporting self-efficacy means affirming the person's ability to change. "You've gotten through hard things before — what helped you then?" reminds them of their own strength. People change when they believe they can.</p>`,
        },
        {
          slug: 'prs-advocacy-lesson-3',
          title: 'Goal Setting and Recovery Planning',
          order: 3,
          domainKey: 'advocacy',
          objective:
            'Facilitate collaborative goal-setting using SMART goals and recovery planning tools.',
          durationMinutes: 10,
          content: `<p>Recovery planning is a collaborative process that helps individuals identify their goals, strengths, and the steps needed to move forward. As a PRS, you facilitate this process — you do not create the plan for the person. The plan belongs to them.</p><p>SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound. Vague goals like "get my life together" are hard to act on. A SMART goal sounds like: "I will attend three NA meetings this week and call my sponsor after each one." This is specific, measurable, and time-bound.</p><p>Start with strengths. Before identifying challenges, ask the person to name what is already working in their life. Strengths-based planning builds confidence and provides a foundation for addressing harder areas. "What are you most proud of in your recovery so far?" is a powerful opening question.</p><p>Recovery plans should address multiple dimensions of wellness — not just sobriety. Housing stability, employment, relationships, and health all affect recovery outcomes. A plan that only addresses substance use misses the full picture of a person's life.</p><p>Review and revise the plan regularly. Recovery is not linear — goals change, circumstances shift, and setbacks happen. A good recovery plan is a living document, not a one-time exercise. Celebrate progress, acknowledge setbacks without shame, and adjust the plan as needed.</p>`,
        },
        {
          slug: 'prs-advocacy-lesson-4',
          title: 'Connecting People to Community Resources',
          order: 4,
          domainKey: 'advocacy',
          objective: 'Identify key community resources in Indiana and make effective referrals.',
          durationMinutes: 10,
          content: `<p>One of the most practical skills a PRS can have is knowing what resources exist in their community and how to connect people to them. A warm referral — where you personally introduce the person to the resource — is far more effective than handing someone a phone number.</p><p>Key resource categories include: housing (emergency shelters, transitional housing, Section 8), food assistance (SNAP, food pantries, community meals), healthcare (Medicaid enrollment, FQHCs, mental health centers), legal aid, transportation, childcare, and workforce development.</p><p>In Indiana, 211 is the primary resource navigation line. Calling 211 connects individuals to a trained specialist who can identify local resources for housing, food, utilities, and more. Familiarize yourself with 211 and encourage the people you support to use it.</p><p>Recovery Community Organizations (RCOs) are peer-run organizations that provide recovery support services, social activities, and community connection. Indiana has several RCOs — know the ones in your area and build relationships with their staff.</p><p>When making referrals, follow up. A referral is not complete when you give someone a phone number — it is complete when they have successfully connected with the resource. Check in after the appointment. If barriers arose, problem-solve together. Persistence is part of advocacy.</p>`,
        },
        {
          slug: 'prs-advocacy-lesson-5',
          title: 'Supporting Families and Natural Supports',
          order: 5,
          domainKey: 'advocacy',
          objective:
            'Engage family members and natural supports in the recovery process appropriately.',
          durationMinutes: 10,
          content: `<p>Recovery does not happen in isolation. Family members, friends, faith communities, and neighbors — what we call natural supports — play a critical role in sustaining recovery. As a PRS, part of your work is helping individuals identify, strengthen, and sometimes repair these relationships.</p><p>Family members of people in recovery often carry their own wounds — fear, grief, anger, and exhaustion. They may have enabled harmful behaviors or cut off contact entirely. Neither extreme is helpful. Your role is to support the individual in recovery while acknowledging the complexity of family dynamics.</p><p>Al-Anon, Nar-Anon, and SMART Recovery Family & Friends are mutual aid groups specifically for family members. Connecting families to these resources helps them develop their own support systems and reduces the burden on the person in recovery.</p><p>Boundaries apply in family relationships too. Help the individual in recovery identify what healthy family involvement looks like for them. Some people need to limit contact with family members who are actively using. Others need to rebuild trust slowly. The individual decides — not the family, and not you.</p><p>Cultural context matters enormously in family work. In many cultures, family involvement in health decisions is expected and valued. In others, privacy is paramount. Ask about cultural norms before making assumptions. Confidentiality rules still apply — never share information about the person you support with family members without explicit consent.</p>`,
        },
        {
          slug: 'prs-advocacy-checkpoint',
          title: 'Advocacy and Person-Centered Support — Knowledge Check',
          order: 6,
          domainKey: 'advocacy',
          objective:
            'Demonstrate understanding of advocacy, motivational interviewing, and resource navigation.',
          durationMinutes: 10,
          passingScore: 70,
          content: `<p>Review what you have learned about advocacy and person-centered support before continuing.</p>`,
          quizQuestions: [
            {
              id: 'prs-a-q1',
              question: 'Which of the following best describes a SMART goal?',
              options: [
                '"I want to get better"',
                '"I will attend three NA meetings this week and call my sponsor after each one"',
                '"I will try to stay sober"',
                '"I want to find a job someday"',
              ],
              correctAnswer: 1,
              explanation:
                'SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound. Option B meets all five criteria.',
            },
            {
              id: 'prs-a-q2',
              question: 'In motivational interviewing, "rolling with resistance" means:',
              options: [
                'Arguing until the person agrees with you',
                "Ignoring the person's concerns",
                'Not arguing when someone pushes back — reflecting the resistance instead',
                'Ending the session when resistance occurs',
              ],
              correctAnswer: 2,
              explanation:
                'Rolling with resistance means not fighting it. Reflect what you hear and let the person process at their own pace.',
            },
            {
              id: 'prs-a-q3',
              question: 'A warm referral is:',
              options: [
                'Giving someone a phone number and wishing them luck',
                'Personally introducing the person to the resource and following up',
                "Sending an email on the person's behalf",
                'Scheduling the appointment for the person without their input',
              ],
              correctAnswer: 1,
              explanation:
                'A warm referral involves personal connection and follow-up — it is far more effective than a cold handoff.',
            },
            {
              id: 'prs-a-q4',
              question: "Indiana's primary resource navigation line is:",
              options: ['911', '988', '211', '311'],
              correctAnswer: 2,
              explanation:
                '211 connects callers to local resources for housing, food, utilities, and more. It is a key tool for PRS resource navigation.',
            },
            {
              id: 'prs-a-q5',
              question:
                'When can you share information about the person you support with their family members?',
              options: [
                'Whenever the family asks',
                "Only with the person's explicit written consent",
                'When you think it would help the family understand',
                'Never — family is never involved in recovery',
              ],
              correctAnswer: 1,
              explanation:
                'Confidentiality rules apply to family members too. You need explicit consent before sharing any information.',
            },
          ],
        },
      ],
    },
    // MODULE 4 — PLACEHOLDER
    {
      slug: 'prs-cultural',
      title: 'Cultural Competency and Trauma-Informed Care',
      orderIndex: 4,
      domainKey: 'cultural_competency',
      minLessons: 5,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      requiredLessonTypes: [{ lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        {
          competencyKey: 'cultural_humility',
          isCritical: false,
          minimumTouchpoints: 1,
          assessmentMethod: 'quiz',
        },
      ],
      lessons: [
        {
          slug: 'prs-cultural-lesson-1',
          title: 'Cultural Humility in Peer Support',
          order: 1,
          domainKey: 'cultural_competency',
          objective:
            'Distinguish cultural humility from cultural competency and apply it in peer support practice.',
          durationMinutes: 10,
          content: `<p>Cultural competency — the idea that you can become fully competent in another culture — has largely been replaced by the concept of cultural humility. Cultural humility is an ongoing process of self-reflection and learning, not a destination you reach. It requires acknowledging that you will never fully understand another person's cultural experience.</p><p>Cultural humility has three core components: lifelong learning and critical self-reflection, recognizing and challenging power imbalances, and developing institutional accountability. As a PRS, this means continuously examining your own biases, listening more than you speak, and advocating for systems that serve all people equitably.</p><p>Race, ethnicity, gender identity, sexual orientation, religion, socioeconomic status, disability, and immigration status all shape how people experience addiction, recovery, and the systems designed to help them. A Black man in recovery navigates different barriers than a white woman. A transgender person faces different risks in a shelter than a cisgender person. These differences are real and must be acknowledged.</p><p>Ask, don't assume. "What should I know about your background that would help me support you better?" is a powerful question. It signals respect and opens space for the person to share what matters to them — on their terms.</p><p>Examine your own cultural background and biases. What assumptions do you carry about people who are different from you? Where did those assumptions come from? Regular supervision and peer consultation are essential tools for this ongoing self-examination.</p>`,
        },
        {
          slug: 'prs-cultural-lesson-2',
          title: 'Trauma-Informed Care Principles',
          order: 2,
          domainKey: 'cultural_competency',
          objective:
            "Apply SAMHSA's six principles of trauma-informed care in peer support interactions.",
          durationMinutes: 10,
          content: `<p>Trauma is nearly universal among people seeking recovery support. Adverse childhood experiences (ACEs), community violence, domestic abuse, sexual assault, and systemic oppression all leave lasting marks on the brain and body. Trauma-informed care (TIC) means recognizing this reality and responding in ways that do not re-traumatize.</p><p>SAMHSA's six principles of trauma-informed care are: Safety, Trustworthiness and Transparency, Peer Support, Collaboration and Mutuality, Empowerment and Choice, and Cultural, Historical, and Gender Issues. These principles apply to every interaction, not just crisis situations.</p><p>Safety means creating physical and emotional environments where people feel secure. This includes your tone of voice, your body language, the physical space where you meet, and the predictability of your behavior. Trauma survivors are hypervigilant — they read every signal you send.</p><p>Trustworthiness and transparency mean doing what you say you will do and being honest about what you can and cannot offer. Trauma survivors have often been let down by people in positions of trust. Consistency and honesty rebuild that trust over time.</p><p>Empowerment and choice are antidotes to the powerlessness that trauma creates. Offer choices whenever possible — where to meet, what to discuss, how to proceed. Even small choices restore a sense of agency that trauma has taken away.</p><p>Avoid re-traumatization by not requiring people to repeatedly tell their trauma story. You do not need to know the details of what happened to someone in order to support them effectively. Focus on the present and the future, not the past.</p>`,
        },
        {
          slug: 'prs-cultural-lesson-3',
          title: 'Working with Diverse Populations',
          order: 3,
          domainKey: 'cultural_competency',
          objective:
            'Identify specific considerations for supporting LGBTQ+, justice-involved, and veteran populations.',
          durationMinutes: 10,
          content: `<p>Peer support is most effective when it is tailored to the specific experiences and needs of the person being supported. Several populations face unique barriers in recovery that require specific knowledge and sensitivity.</p><p>LGBTQ+ individuals experience higher rates of substance use disorder than the general population, largely due to minority stress — the chronic stress of navigating a world that marginalizes their identity. Affirming language, knowledge of LGBTQ+-specific resources, and a non-judgmental stance are essential. Never assume someone's pronouns or sexual orientation — ask.</p><p>Justice-involved individuals face significant barriers to recovery: limited housing options, employment discrimination, loss of benefits, and the ongoing stress of supervision requirements. Know the specific restrictions that apply to people on probation or parole in Indiana, and help individuals navigate these systems without judgment.</p><p>Veterans carry unique experiences of trauma, loss, and identity transition. Many struggle with moral injury — the damage done when actions violate one's moral code. The VA system offers specific peer support services for veterans; know how to connect veterans to these resources while also supporting them in civilian recovery communities.</p><p>Pregnant and parenting women in recovery face stigma, fear of child welfare involvement, and limited access to gender-responsive treatment. Indiana has specific programs for this population — know them. Support without judgment is especially critical here; shame is a barrier to treatment, not a motivator.</p><p>In all cases, let the person define their own identity and needs. Your job is to listen, learn, and connect — not to categorize or assume.</p>`,
        },
        {
          slug: 'prs-cultural-lesson-4',
          title: 'Addressing Stigma in Recovery',
          order: 4,
          domainKey: 'cultural_competency',
          objective:
            'Identify forms of stigma affecting people in recovery and use person-first language effectively.',
          durationMinutes: 10,
          content: `<p>Stigma is one of the greatest barriers to recovery. It exists in three forms: public stigma (negative attitudes held by society), self-stigma (internalized shame), and structural stigma (policies and practices that discriminate against people in recovery). As a PRS, you combat all three.</p><p>Language matters enormously in reducing stigma. Person-first language — "person with a substance use disorder" rather than "addict" or "junkie" — affirms the humanity of the individual. The words we use shape how we think, and how we think shapes how we act.</p><p>Self-stigma is particularly damaging because it comes from within. When people believe they are fundamentally broken or unworthy of recovery, they are less likely to seek help and more likely to relapse. Your lived experience is a powerful antidote to self-stigma — you are proof that recovery is possible.</p><p>Structural stigma shows up in policies that deny housing, employment, and benefits to people with criminal records related to substance use. Advocacy for policy change is part of the PRS role. Know the laws in Indiana that affect people in recovery and connect individuals to legal aid when their rights are violated.</p><p>In your own practice, examine the language you use. Do you refer to a positive drug test as "dirty"? Do you describe someone who relapses as "failing"? These words carry stigma even when used casually. Commit to language that reflects the dignity of every person you serve.</p>`,
        },
        {
          slug: 'prs-cultural-lesson-5',
          title: 'Self-Care and Preventing Compassion Fatigue',
          order: 5,
          domainKey: 'cultural_competency',
          objective: 'Identify signs of compassion fatigue and develop a personal self-care plan.',
          durationMinutes: 10,
          content: `<p>Peer support work is deeply rewarding — and deeply demanding. You are regularly exposed to trauma, crisis, grief, and loss. Without intentional self-care, this exposure leads to compassion fatigue: a state of emotional exhaustion that diminishes your ability to empathize and support others effectively.</p><p>Signs of compassion fatigue include: emotional exhaustion, cynicism, reduced empathy, difficulty concentrating, physical symptoms (headaches, sleep disruption), and a sense of hopelessness about the work. If you recognize these signs in yourself, take them seriously — they are not weakness, they are warning signals.</p><p>Secondary traumatic stress (STS) is a related condition that occurs when you are exposed to the traumatic experiences of the people you support. Symptoms mirror PTSD: intrusive thoughts, avoidance, hypervigilance, and emotional numbing. STS requires professional support — not just self-care strategies.</p><p>A personal self-care plan addresses all eight dimensions of wellness. Physical self-care includes sleep, nutrition, and exercise. Emotional self-care includes therapy, journaling, and creative expression. Social self-care includes maintaining relationships outside of work. Spiritual self-care includes whatever gives you meaning and purpose.</p><p>Supervision is not optional — it is self-care. Regular check-ins with your supervisor allow you to process difficult cases, receive guidance, and maintain perspective. If your organization does not offer regular supervision, advocate for it. You cannot pour from an empty cup.</p>`,
        },
        {
          slug: 'prs-cultural-checkpoint',
          title: 'Cultural Competency and Trauma-Informed Care — Knowledge Check',
          order: 6,
          domainKey: 'cultural_competency',
          objective:
            'Demonstrate understanding of cultural humility, trauma-informed care, and self-care.',
          durationMinutes: 10,
          passingScore: 70,
          content: `<p>Review what you have learned about cultural competency and trauma-informed care before continuing.</p>`,
          quizQuestions: [
            {
              id: 'prs-c-q1',
              question: 'Cultural humility differs from cultural competency in that it:',
              options: [
                'Requires mastery of specific cultural facts',
                'Is an ongoing process of self-reflection, not a destination',
                'Applies only to racial and ethnic differences',
                'Is only relevant in clinical settings',
              ],
              correctAnswer: 1,
              explanation:
                'Cultural humility is a lifelong process of learning and self-reflection — you never "arrive" at full competency in another person\'s culture.',
            },
            {
              id: 'prs-c-q2',
              question:
                "Which of SAMHSA's trauma-informed care principles involves offering choices to restore a sense of agency?",
              options: ['Safety', 'Trustworthiness', 'Empowerment and Choice', 'Peer Support'],
              correctAnswer: 2,
              explanation:
                'Empowerment and Choice directly addresses the powerlessness that trauma creates by offering meaningful choices in every interaction.',
            },
            {
              id: 'prs-c-q3',
              question: 'Person-first language means:',
              options: [
                "Always putting the person's name first in documentation",
                'Using terms like "addict" to be direct and honest',
                'Saying "person with a substance use disorder" rather than "addict"',
                'Avoiding any mention of substance use',
              ],
              correctAnswer: 2,
              explanation:
                'Person-first language affirms the humanity of the individual by describing the condition they have, not defining them by it.',
            },
            {
              id: 'prs-c-q4',
              question: 'Compassion fatigue is best described as:',
              options: [
                'Feeling tired after a long shift',
                "Emotional exhaustion from regular exposure to others' trauma that reduces empathy",
                "Disagreeing with a person's recovery choices",
                'Being too emotionally invested in outcomes',
              ],
              correctAnswer: 1,
              explanation:
                'Compassion fatigue is a serious occupational hazard in peer support work — it requires intentional self-care and supervision to prevent and address.',
            },
            {
              id: 'prs-c-q5',
              question: 'When working with LGBTQ+ individuals, you should:',
              options: [
                'Assume their pronouns based on appearance',
                'Ask about their pronouns and use affirming language',
                'Avoid discussing identity to keep things professional',
                'Refer them only to LGBTQ+-specific programs',
              ],
              correctAnswer: 1,
              explanation:
                'Asking about pronouns and using affirming language signals respect and creates safety. Never assume — always ask.',
            },
          ],
        },
      ],
    },
    // MODULE 5 — PLACEHOLDER
    {
      slug: 'prs-documentation',
      title: 'Documentation and Service Coordination',
      orderIndex: 5,
      domainKey: 'documentation',
      minLessons: 5,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      requiredLessonTypes: [{ lessonType: 'checkpoint', requiredCount: 1 }],
      competencies: [
        {
          competencyKey: 'documentation_skills',
          isCritical: false,
          minimumTouchpoints: 1,
          assessmentMethod: 'quiz',
        },
      ],
      lessons: [
        {
          slug: 'prs-documentation-lesson-1',
          title: 'Why Documentation Matters in Peer Support',
          order: 1,
          domainKey: 'documentation',
          objective:
            'Explain the purpose of documentation in peer support and its role in service quality.',
          durationMinutes: 10,
          content: `<p>Documentation is not paperwork for its own sake — it is a professional and ethical obligation that protects the people you serve, supports continuity of care, and demonstrates the value of peer support services. In an era when peer support is increasingly reimbursed by Medicaid, accurate documentation is also a financial necessity.</p><p>Good documentation serves multiple purposes: it creates a record of the services provided, supports communication among care team members, provides evidence for billing and reimbursement, protects you legally if your actions are ever questioned, and helps you track the person's progress over time.</p><p>Documentation must be timely, accurate, objective, and complete. Timely means completed as close to the service as possible — ideally the same day. Accurate means reflecting what actually happened, not what you wish had happened. Objective means describing observable behaviors and statements, not your interpretations or judgments. Complete means including all required elements.</p><p>Confidentiality rules apply to documentation. Records must be stored securely — whether paper or electronic. Access must be limited to those with a legitimate need to know. Never leave records visible in public spaces or send them via unsecured email.</p><p>If you make an error in documentation, correct it properly: draw a single line through the error, write the correction, initial and date it. Never erase, white out, or delete entries. In electronic systems, follow your organization's correction protocol. Falsifying records is a serious ethical and legal violation.</p>`,
        },
        {
          slug: 'prs-documentation-lesson-2',
          title: 'Writing Effective Progress Notes',
          order: 2,
          domainKey: 'documentation',
          objective: 'Write clear, objective progress notes using the DAP or SOAP format.',
          durationMinutes: 10,
          content: `<p>Progress notes are the primary documentation tool for peer support services. They record what happened during a contact, what the person said and did, and what the next steps are. Two common formats are DAP (Data, Assessment, Plan) and SOAP (Subjective, Objective, Assessment, Plan).</p><p>In the DAP format: Data includes objective observations and direct quotes from the person. Assessment includes your interpretation of the data — what it means for the person's recovery. Plan includes the next steps agreed upon by you and the person.</p><p>Example DAP note: "Data: Met with client for 45-minute in-person session. Client reported attending 3 NA meetings this week and stated 'I feel more connected to my recovery community.' Client appeared calm and engaged. Assessment: Client is demonstrating increased engagement with recovery supports and reports improved sense of community connection. Plan: Client will continue attending NA meetings and will contact sponsor before next session. Follow-up scheduled for [date]."</p><p>Avoid vague language like "client doing well" or "good session." Be specific. What did the person say? What did you observe? What did you do? Specific documentation tells a story that vague documentation cannot.</p><p>Avoid clinical language that is outside your scope of practice. You do not diagnose, assess mental status, or make clinical recommendations. Describe what you observe and what the person reports — leave clinical interpretation to licensed clinicians.</p>`,
        },
        {
          slug: 'prs-documentation-lesson-3',
          title: 'Service Coordination and Care Team Communication',
          order: 3,
          domainKey: 'documentation',
          objective:
            'Coordinate services effectively with care team members while maintaining confidentiality.',
          durationMinutes: 10,
          content: `<p>Peer support does not happen in isolation. Most people you support are also connected to other services — treatment providers, case managers, housing workers, probation officers, and healthcare providers. Effective service coordination means communicating with these partners in ways that support the person's recovery without violating their confidentiality.</p><p>Before sharing any information with a care team member, obtain written consent from the person you support. The consent form should specify: who you can share information with, what information can be shared, and for how long the consent is valid. Review consent forms regularly and update them as the person's care team changes.</p><p>Care team meetings — sometimes called wraparound meetings or case conferences — bring together all of a person's service providers to coordinate care. As a PRS, your role in these meetings is to represent the person's voice and perspective. Before the meeting, ask the person: "What do you want the team to know? What are your priorities right now?"</p><p>Warm handoffs are a best practice in service coordination. When referring someone to a new provider, make a personal introduction — by phone, in person, or via a joint meeting. This reduces the likelihood that the person will fall through the cracks between services.</p><p>When care team members disagree about the best approach for a person, your role is to advocate for the person's stated preferences — not to take sides in a clinical debate. "What does [person's name] want?" is always the right question to bring the team back to center.</p>`,
        },
        {
          slug: 'prs-documentation-lesson-4',
          title: 'Medicaid Billing and Reimbursable Services',
          order: 4,
          domainKey: 'documentation',
          objective:
            'Identify Medicaid-reimbursable peer support services and documentation requirements in Indiana.',
          durationMinutes: 10,
          content: `<p>Indiana Medicaid now reimburses peer recovery support services, making the PRS role financially sustainable within the healthcare system. Understanding what services are reimbursable — and how to document them correctly — is essential for both your organization's financial health and your professional credibility.</p><p>Reimbursable peer support services in Indiana include: individual peer support sessions, group peer support, crisis support, and community-based recovery support activities. Each service type has specific documentation requirements and billing codes. Your organization's billing department will provide the specific codes used in your setting.</p><p>To be reimbursable, services must be: provided by a credentialed PRS, documented in the person's record on the day of service, medically necessary (connected to the person's treatment plan), and delivered within the scope of peer support practice.</p><p>Medical necessity does not mean the person must be in crisis. It means the service is appropriate and beneficial given the person's diagnosis and recovery goals. Your documentation should clearly connect the service to the person's recovery plan.</p><p>Never document services that were not provided. Billing fraud is a federal crime with serious consequences — for you, your organization, and the people you serve. If you are unsure whether a service is reimbursable, ask your supervisor before providing or documenting it.</p>`,
        },
        {
          slug: 'prs-documentation-lesson-5',
          title: 'Crisis Documentation and Incident Reporting',
          order: 5,
          domainKey: 'documentation',
          objective:
            'Document crisis situations and complete incident reports accurately and promptly.',
          durationMinutes: 10,
          content: `<p>Crisis situations require immediate action and careful documentation. Whether you are responding to a suicide risk, a relapse, a medical emergency, or a safety concern, your documentation of the event is critical — for the person's safety, for your legal protection, and for organizational learning.</p><p>Crisis documentation should include: the date, time, and location of the incident; a factual description of what occurred; the person's statements and behaviors; the actions you took; who you notified and when; and the outcome. Write it as soon as possible after the crisis — memory fades quickly and details matter.</p><p>Incident reports are formal organizational documents that record significant events. Your organization will have a specific incident report form and process. Complete it accurately and submit it within the required timeframe — usually 24 hours. Incident reports are not punitive; they are tools for organizational learning and quality improvement.</p><p>After a crisis, follow up with the person as soon as it is safe and appropriate to do so. A crisis is a turning point — it can be an opportunity to deepen the peer support relationship and strengthen the person's recovery plan. Document this follow-up contact as well.</p><p>Debrief with your supervisor after every crisis. Processing what happened — what went well, what you would do differently, how you are feeling — is essential for your own wellbeing and professional growth. Secondary trauma from crisis exposure is real; do not carry it alone.</p>`,
        },
        {
          slug: 'prs-documentation-checkpoint',
          title: 'Documentation and Service Coordination — Knowledge Check',
          order: 6,
          domainKey: 'documentation',
          objective:
            'Demonstrate understanding of documentation standards, care coordination, and Medicaid billing.',
          durationMinutes: 10,
          passingScore: 70,
          content: `<p>Review what you have learned about documentation and service coordination before continuing.</p>`,
          quizQuestions: [
            {
              id: 'prs-d-q1',
              question: 'In the DAP progress note format, "D" stands for:',
              options: ['Diagnosis', 'Data', 'Duration', 'Discharge'],
              correctAnswer: 1,
              explanation:
                'DAP stands for Data, Assessment, Plan. Data includes objective observations and direct quotes from the person.',
            },
            {
              id: 'prs-d-q2',
              question: 'If you make an error in a paper progress note, you should:',
              options: [
                'Use white-out to cover the error',
                'Erase the error completely',
                'Draw a single line through the error, write the correction, and initial and date it',
                'Start a new note and discard the old one',
              ],
              correctAnswer: 2,
              explanation:
                'Proper error correction preserves the original entry while clearly marking the correction. Erasing or using white-out is never acceptable in professional records.',
            },
            {
              id: 'prs-d-q3',
              question: 'Before sharing information with a care team member, you must:',
              options: [
                'Get verbal permission from the person',
                'Obtain written consent specifying who, what, and for how long',
                'Notify your supervisor',
                'Confirm the team member has a license',
              ],
              correctAnswer: 1,
              explanation:
                "Written consent is required before sharing any information. It must specify who can receive information, what can be shared, and the consent's duration.",
            },
            {
              id: 'prs-d-q4',
              question:
                'For a peer support service to be Medicaid-reimbursable in Indiana, it must be:',
              options: [
                'Provided by a licensed clinician',
                'Documented on the day of service by a credentialed PRS',
                "Approved by the person's insurance company in advance",
                'Conducted in a clinical setting only',
              ],
              correctAnswer: 1,
              explanation:
                'Reimbursable services must be provided by a credentialed PRS and documented on the day of service, among other requirements.',
            },
            {
              id: 'prs-d-q5',
              question: 'Incident reports should be submitted:',
              options: [
                'Within one week of the incident',
                'Only if the incident resulted in harm',
                "Within 24 hours, following your organization's protocol",
                'Only when requested by a supervisor',
              ],
              correctAnswer: 2,
              explanation:
                'Incident reports are typically required within 24 hours. They are tools for organizational learning, not punishment.',
            },
          ],
        },
      ],
    },
    // MODULE 6 — PLACEHOLDER
    {
      slug: 'prs-career',
      title: 'Career Readiness and Professional Development',
      orderIndex: 6,
      domainKey: 'career_readiness',
      minLessons: 5,
      maxLessons: 6,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      requiredLessonTypes: [
        { lessonType: 'checkpoint', requiredCount: 1 },
        { lessonType: 'exam', requiredCount: 1 },
      ],
      competencies: [
        {
          competencyKey: 'career_skills',
          isCritical: false,
          minimumTouchpoints: 1,
          assessmentMethod: 'quiz',
        },
      ],
      lessons: [
        {
          slug: 'prs-career-lesson-1',
          title: 'The PRS Job Market in Indiana',
          order: 1,
          domainKey: 'career_readiness',
          objective:
            'Identify career pathways, job titles, and salary expectations for credentialed PRS in Indiana.',
          durationMinutes: 10,
          content: `<p>The demand for Peer Recovery Specialists in Indiana is growing rapidly. As the state expands Medicaid reimbursement for peer support services and invests in behavioral health infrastructure, credentialed PRS are increasingly sought by a wide range of employers.</p><p>Common job titles for PRS include: Peer Recovery Specialist, Peer Support Specialist, Recovery Coach, Community Health Worker (Behavioral Health), Peer Navigator, and Recovery Community Outreach Worker. Some organizations use different titles for the same role — always read the job description carefully.</p><p>Employers hiring PRS in Indiana include: community mental health centers, Certified Community Behavioral Health Clinics (CCBHCs), Recovery Community Organizations (RCOs), hospital systems, federally qualified health centers (FQHCs), drug courts, re-entry programs, and county jails and prisons.</p><p>Entry-level PRS positions in Indiana typically pay between $16 and $22 per hour, with full-time positions offering benefits. With experience and additional credentials, PRS can advance to supervisory roles, program coordination, or training positions with salaries ranging from $40,000 to $60,000 annually.</p><p>The PRS credential is a stepping stone, not a ceiling. Many PRS go on to pursue additional education in social work, counseling, or public health. Your lived experience combined with professional training is a powerful foundation for a long career in behavioral health.</p>`,
        },
        {
          slug: 'prs-career-lesson-2',
          title: 'Resume Writing and Job Applications',
          order: 2,
          domainKey: 'career_readiness',
          objective:
            'Create a professional resume that highlights PRS credentials and lived experience appropriately.',
          durationMinutes: 10,
          content: `<p>Your resume is your first impression. For PRS positions, it should highlight both your professional credentials and — if you choose — your lived experience with recovery. Many employers in this field value lived experience as a qualification, not a liability.</p><p>A strong PRS resume includes: contact information, a professional summary (2-3 sentences describing your background and goals), your PRS credential and any other relevant certifications, work and volunteer experience, education, and relevant skills.</p><p>The professional summary is your elevator pitch. Example: "Indiana-credentialed Peer Recovery Specialist with 3 years of experience supporting individuals in recovery from substance use disorder. Skilled in motivational interviewing, crisis support, and community resource navigation. Committed to person-centered, trauma-informed care."</p><p>Disclosing your lived experience on a resume is a personal decision. Many PRS choose to include a brief statement like "Brings personal lived experience with recovery" in their summary. This can be a powerful differentiator — but it is never required. Make the choice that feels right for you and the position you are applying for.</p><p>Tailor your resume to each position. Read the job description carefully and use the same language in your resume. If the posting says "motivational interviewing," use that phrase — not "MI" or "counseling techniques." Applicant tracking systems scan for keywords, and so do hiring managers.</p>`,
        },
        {
          slug: 'prs-career-lesson-3',
          title: 'Interview Skills and Professional Presence',
          order: 3,
          domainKey: 'career_readiness',
          objective: 'Prepare for and perform effectively in a PRS job interview.',
          durationMinutes: 10,
          content: `<p>The job interview is your opportunity to demonstrate not just your knowledge, but your professional presence — the way you carry yourself, communicate, and connect with others. For PRS positions, interviewers are often assessing your interpersonal skills as much as your credentials.</p><p>Prepare for common PRS interview questions: "Tell me about your recovery journey and how it informs your work." "Describe a time you supported someone through a crisis." "How do you maintain professional boundaries?" "What would you do if a person you support relapsed?" Practice your answers out loud before the interview.</p><p>The STAR method (Situation, Task, Action, Result) is a useful framework for behavioral interview questions. "Tell me about a time you..." questions are best answered with a specific story: describe the situation, your role, what you did, and what happened as a result.</p><p>Professional appearance matters. Dress one level above what you expect the workplace dress code to be. Arrive 10-15 minutes early. Bring copies of your resume and credential. Make eye contact, listen actively, and ask thoughtful questions about the role and organization.</p><p>After the interview, send a thank-you email within 24 hours. Reference something specific from the conversation to show you were engaged. This small gesture sets you apart from candidates who do not follow up.</p>`,
        },
        {
          slug: 'prs-career-lesson-4',
          title: 'Maintaining Your Credential and Continuing Education',
          order: 4,
          domainKey: 'career_readiness',
          objective:
            'Identify continuing education requirements for PRS credential renewal in Indiana.',
          durationMinutes: 10,
          content: `<p>Earning your PRS credential is the beginning, not the end. Maintaining your credential requires ongoing continuing education, adherence to the code of ethics, and renewal at regular intervals. Staying current is both a professional obligation and a commitment to the people you serve.</p><p>Indiana's PRS credential renewal requirements include a specified number of continuing education hours per renewal period. Check with DMHA or your credentialing body for the current requirements, as these may change. Keep records of all trainings you attend — certificates, sign-in sheets, and transcripts.</p><p>Continuing education opportunities include: conferences (Indiana Recovery Alliance, NAADAC, SAMHSA), online trainings, in-person workshops, webinars, and college courses. Many are free or low-cost for credentialed PRS. Your employer may also offer or fund continuing education — ask.</p><p>Supervision is a form of continuing education. Regular supervision with a qualified supervisor helps you process difficult cases, develop new skills, and maintain ethical practice. If your organization does not provide regular supervision, advocate for it — it is a professional standard, not a luxury.</p><p>Consider joining professional associations: the Indiana Recovery Alliance, NAADAC (National Association for Addiction Professionals), and the Association of Recovery Community Organizations (ARCO) all offer resources, networking, and advocacy opportunities for PRS. Your professional community is a source of support and growth throughout your career.</p>`,
        },
        {
          slug: 'prs-career-lesson-5',
          title: 'Building Your Professional Network',
          order: 5,
          domainKey: 'career_readiness',
          objective:
            'Develop a professional network strategy to support career growth in peer recovery.',
          durationMinutes: 10,
          content: `<p>Your professional network is one of your most valuable career assets. In the behavioral health field, many positions are filled through relationships — people hire people they know and trust. Building your network intentionally and authentically opens doors that credentials alone cannot.</p><p>Start with the relationships you already have: supervisors, colleagues, trainers, and community partners. Nurture these relationships by staying in touch, offering help when you can, and expressing genuine interest in their work. Networking is not transactional — it is relational.</p><p>LinkedIn is a professional networking platform that is increasingly used in the behavioral health field. Create a profile that reflects your credentials, experience, and professional interests. Connect with colleagues, join relevant groups, and share content that demonstrates your knowledge and values.</p><p>Attend community events, conferences, and coalition meetings. Introduce yourself, exchange contact information, and follow up within 48 hours. A brief email — "It was great to meet you at the Indiana Recovery Alliance conference. I'd love to stay connected." — is all it takes to begin a professional relationship.</p><p>Mentorship is a powerful form of networking. Seek out experienced PRS, supervisors, and behavioral health leaders who can offer guidance and open doors. Be willing to serve as a mentor to newer PRS as your career develops. Giving back to the profession strengthens the entire field — and your place in it.</p>`,
        },
        {
          slug: 'prs-career-checkpoint',
          title: 'Career Readiness — Knowledge Check',
          order: 6,
          domainKey: 'career_readiness',
          objective:
            'Demonstrate understanding of career pathways, credential maintenance, and professional development.',
          durationMinutes: 10,
          passingScore: 70,
          content: `<p>Review what you have learned about career readiness and professional development before the final exam.</p>`,
          quizQuestions: [
            {
              id: 'prs-cr-q1',
              question: 'Which of the following is a common employer of PRS in Indiana?',
              options: [
                'Department of Motor Vehicles',
                'Certified Community Behavioral Health Clinics (CCBHCs)',
                'Indiana State Police',
                'Department of Education',
              ],
              correctAnswer: 1,
              explanation:
                'CCBHCs are a primary employer of PRS in Indiana, along with community mental health centers, RCOs, and hospital systems.',
            },
            {
              id: 'prs-cr-q2',
              question: 'The STAR method in job interviews stands for:',
              options: [
                'Skills, Training, Attitude, Results',
                'Situation, Task, Action, Result',
                'Strengths, Talents, Abilities, Readiness',
                'Support, Trust, Advocacy, Recovery',
              ],
              correctAnswer: 1,
              explanation:
                'STAR (Situation, Task, Action, Result) is a framework for answering behavioral interview questions with specific, structured stories.',
            },
            {
              id: 'prs-cr-q3',
              question: 'Disclosing your lived experience with recovery on a resume is:',
              options: [
                'Required for all PRS positions',
                'A personal decision that is never required',
                'Prohibited by HIPAA',
                'Only appropriate for peer-run organizations',
              ],
              correctAnswer: 1,
              explanation:
                'Disclosing lived experience is a personal choice. Many PRS choose to include it as a differentiator, but it is never required.',
            },
            {
              id: 'prs-cr-q4',
              question: 'After a job interview, you should:',
              options: [
                'Wait for the employer to contact you',
                'Send a thank-you email within 24 hours referencing something specific from the conversation',
                'Call the employer every day until you hear back',
                'Post about the interview on social media',
              ],
              correctAnswer: 1,
              explanation:
                'A timely, specific thank-you email demonstrates professionalism and sets you apart from candidates who do not follow up.',
            },
            {
              id: 'prs-cr-q5',
              question: 'Continuing education for PRS credential renewal in Indiana is:',
              options: [
                'Optional — only required if you want a promotion',
                'Required — check with DMHA for current hour requirements',
                'Only required after a disciplinary action',
                'Provided automatically by your employer',
              ],
              correctAnswer: 1,
              explanation:
                'Continuing education is required for credential renewal. Requirements are set by DMHA and may change — always verify current requirements.',
            },
          ],
        },
        {
          slug: 'prs-career-exam',
          title: 'Indiana Peer Recovery Specialist — Final Exam',
          order: 7,
          domainKey: 'career_readiness',
          objective: 'Demonstrate mastery of all Indiana PRS competency domains.',
          durationMinutes: 30,
          passingScore: 75,
          content: `<p>This final exam covers all six modules of the Indiana Peer Recovery Specialist training. You must score 75% or higher to receive your certificate of completion. You may review your course materials before beginning.</p>`,
          quizQuestions: [
            {
              id: 'prs-exam-q1',
              question: 'The four dimensions of recovery identified by SAMHSA are:',
              options: [
                'Health, Home, Purpose, Community',
                'Sobriety, Employment, Housing, Family',
                'Physical, Mental, Spiritual, Social',
                'Treatment, Support, Maintenance, Wellness',
              ],
              correctAnswer: 0,
              explanation:
                "SAMHSA's four dimensions of recovery are Health, Home, Purpose, and Community.",
            },
            {
              id: 'prs-exam-q2',
              question:
                'Which federal regulation provides the strictest protections for substance use disorder treatment records?',
              options: ['HIPAA', 'ADA', '42 CFR Part 2', 'FERPA'],
              correctAnswer: 2,
              explanation:
                '42 CFR Part 2 provides protections for SUD records that are stricter than standard HIPAA.',
            },
            {
              id: 'prs-exam-q3',
              question: "A PRS's primary role is to:",
              options: [
                'Diagnose and treat substance use disorders',
                'Use lived experience to support others in recovery',
                'Prescribe medication-assisted treatment',
                'Provide legal representation for people in recovery',
              ],
              correctAnswer: 1,
              explanation:
                'The PRS role is defined by lived experience and peer support — not clinical treatment or legal services.',
            },
            {
              id: 'prs-exam-q4',
              question: 'In motivational interviewing, expressing empathy means:',
              options: [
                'Agreeing with everything the person says',
                'Reflecting back what you hear without judgment',
                'Sharing your own recovery story to build connection',
                'Telling the person what they need to do to recover',
              ],
              correctAnswer: 1,
              explanation:
                'Empathy in MI means reflective listening — hearing and reflecting without judgment or advice.',
            },
            {
              id: 'prs-exam-q5',
              question: 'Mandatory reporting of suspected child abuse in Indiana must be made to:',
              options: [
                'Local police only',
                'Your supervisor only',
                'Indiana Department of Child Services at 1-800-800-5556',
                "The child's school",
              ],
              correctAnswer: 2,
              explanation:
                'Indiana DCS is the mandatory reporting agency. Reasonable suspicion is sufficient — you do not need proof.',
            },
            {
              id: 'prs-exam-q6',
              question: 'Cultural humility requires:',
              options: [
                'Mastering the cultural practices of every group you work with',
                "Ongoing self-reflection and acknowledging you will never fully understand another's cultural experience",
                'Treating everyone exactly the same regardless of background',
                'Avoiding discussions of race and culture to prevent discomfort',
              ],
              correctAnswer: 1,
              explanation:
                'Cultural humility is a lifelong process of learning and self-reflection — not a destination.',
            },
            {
              id: 'prs-exam-q7',
              question: 'A progress note should be:',
              options: [
                'Written at the end of the week for all sessions',
                'Timely, accurate, objective, and complete',
                'Written only when something significant happens',
                "Focused on your clinical interpretation of the person's behavior",
              ],
              correctAnswer: 1,
              explanation:
                'Progress notes must be timely (same day), accurate, objective (observable facts), and complete.',
            },
            {
              id: 'prs-exam-q8',
              question: 'Self-stigma in recovery refers to:',
              options: [
                'Negative attitudes held by society toward people in recovery',
                'Internalized shame that the person in recovery feels about themselves',
                'Policies that discriminate against people with SUD history',
                'Stigma experienced in the workplace',
              ],
              correctAnswer: 1,
              explanation:
                'Self-stigma is internalized shame — the person believes they are fundamentally broken or unworthy of recovery.',
            },
            {
              id: 'prs-exam-q9',
              question: 'Before sharing information with a care team member, you must:',
              options: [
                'Get verbal permission',
                'Obtain written consent specifying who, what, and for how long',
                'Notify your supervisor',
                'Confirm the team member is licensed',
              ],
              correctAnswer: 1,
              explanation:
                'Written consent is required before sharing any information with care team members.',
            },
            {
              id: 'prs-exam-q10',
              question:
                "SAMHSA's six principles of trauma-informed care include all of the following EXCEPT:",
              options: [
                'Safety',
                'Empowerment and Choice',
                'Abstinence Requirement',
                'Trustworthiness and Transparency',
              ],
              correctAnswer: 2,
              explanation:
                'Abstinence Requirement is not a TIC principle. The six principles are Safety, Trustworthiness and Transparency, Peer Support, Collaboration and Mutuality, Empowerment and Choice, and Cultural/Historical/Gender Issues.',
            },
          ],
        },
      ],
    },
  ],

  assessmentRules: [
    {
      assessmentType: 'module',
      scope: 'all',
      minQuestions: 8,
      maxQuestions: 15,
      passingThreshold: 0.7,
    },
    {
      assessmentType: 'final',
      scope: 'prs-career-exam',
      minQuestions: 50,
      maxQuestions: 75,
      passingThreshold: 0.8,
      distributionConstraints: {
        foundations: 0.2,
        ethics: 0.2,
        advocacy: 0.2,
        mentoring: 0.2,
        career_readiness: 0.2,
      },
    },
  ],
};
