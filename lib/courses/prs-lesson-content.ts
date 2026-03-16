/**
 * lib/courses/prs-lesson-content.ts
 *
 * Full instructional content for every PRS lesson.
 * Each lesson has: concept, keyTerms, jobApplication, watchFor, competencyKeys.
 * Used by the patch script to hydrate curriculum_lessons rows.
 */

export interface PrsLessonContent {
  lessonTitle: string;
  moduleTitle: string;
  competencyKeys: string[];
  concept: string;
  keyTerms: { term: string; definition: string }[];
  jobApplication: string;
  watchFor: string[];
  reflectionPrompt: string;
  summaryText: string;
}

export const PRS_LESSON_CONTENT: Record<string, PrsLessonContent> = {};

function add(lessonTitle: string, c: Omit<PrsLessonContent, 'lessonTitle'>) {
  PRS_LESSON_CONTENT[lessonTitle] = { lessonTitle, ...c };
}

// ═══════════════════════════════════════════
// MODULE 1 — Introduction to Peer Recovery
// ═══════════════════════════════════════════

add('Peer Recovery Specialist Role', {
  moduleTitle: 'Introduction to Peer Recovery',
  competencyKeys: ['prs_role_definition', 'recovery_oriented_principles'],
  concept: 'A Peer Recovery Specialist (PRS) is a person with lived experience of addiction, mental health challenges, or both, who uses that experience to support others on their recovery journey. The PRS role is distinct from clinical roles: you are not a therapist, counselor, or case manager. You are a peer — someone who has walked a similar path and can offer hope, connection, and practical guidance that a clinician cannot. In Indiana, the Certified Peer Recovery Specialist (CPRS) credential is issued by the Division of Mental Health and Addiction (DMHA) and requires 46 hours of training, a supervised practicum, and a written exam. The PRS works in a wide range of settings: recovery community organizations, treatment centers, hospitals, jails and prisons, homeless shelters, and community health agencies. Your primary tools are your story, your empathy, and your knowledge of the recovery system. Employers value PRS staff because peer support has strong evidence behind it — studies consistently show that peer support reduces hospitalization, increases treatment engagement, and improves long-term recovery outcomes.',
  keyTerms: [
    { term: 'Peer Recovery Specialist (PRS)', definition: 'A person with lived recovery experience trained to support others in their recovery. Not a clinical role.' },
    { term: 'CPRS', definition: 'Certified Peer Recovery Specialist — the Indiana state credential issued by DMHA after completing required training, practicum, and exam.' },
    { term: 'Lived Experience', definition: 'Personal, first-hand experience with addiction, mental health challenges, or both. The foundation of peer credibility.' },
    { term: 'DMHA', definition: 'Indiana Division of Mental Health and Addiction — the state agency that oversees behavioral health services and the CPRS credential.' },
    { term: 'Recovery Community Organization (RCO)', definition: 'A nonprofit organization led and governed by people in recovery that provides peer support and recovery services.' },
  ],
  jobApplication: 'On your first day at a new PRS position, your supervisor will likely ask you to introduce yourself to clients. How you frame your role matters. Saying "I am here to support your recovery journey — I have been through something similar" opens doors that clinical introductions cannot. Practice a 60-second introduction that shares your role, your lived experience (at an appropriate level), and what you can offer.',
  watchFor: [
    'Do not present yourself as a counselor or therapist — this creates false expectations and may violate scope of practice',
    'Your lived experience is an asset, not a liability — do not minimize it',
    'Know the difference between peer support and clinical treatment before your first client interaction',
  ],
  reflectionPrompt: 'What aspect of your lived experience do you believe will be most valuable to the people you support, and why?',
  summaryText: 'The PRS role is built on lived experience, not clinical credentials. Understanding the scope, credential requirements, and evidence base for peer support is the foundation of effective practice.',
});

add('Recovery-Oriented Principles', {
  moduleTitle: 'Introduction to Peer Recovery',
  competencyKeys: ['recovery_oriented_principles', 'prs_role_definition'],
  concept: 'Recovery-oriented systems of care (ROSC) are built on a set of core principles that guide how peer specialists work. SAMHSA identifies four major dimensions of recovery: Health (overcoming or managing disease), Home (stable and safe living), Purpose (meaningful daily activities), and Community (relationships and social networks). Recovery is not a single event — it is a process that looks different for every person. Some people achieve abstinence; others use harm reduction approaches. Some recover with medication-assisted treatment (MAT); others do not. As a PRS, your job is to support the person\'s chosen path, not to impose your own recovery story on them. Key recovery-oriented principles include: person-centered care (the individual drives their own recovery plan), hope (recovery is possible for everyone), self-determination (people have the right to make their own choices), and strengths-based practice (focus on what people can do, not what they cannot). These principles are not just philosophy — they directly shape how you conduct every interaction.',
  keyTerms: [
    { term: 'ROSC', definition: 'Recovery-Oriented Systems of Care — a coordinated network of services built around recovery principles rather than just symptom management.' },
    { term: 'SAMHSA', definition: 'Substance Abuse and Mental Health Services Administration — the federal agency that sets national standards for behavioral health.' },
    { term: 'Person-Centered Care', definition: 'An approach where the individual\'s goals, preferences, and values drive the support plan — not the provider\'s agenda.' },
    { term: 'Harm Reduction', definition: 'Strategies that reduce the negative consequences of substance use without requiring abstinence as a precondition for support.' },
    { term: 'MAT', definition: 'Medication-Assisted Treatment — the use of FDA-approved medications (buprenorphine, methadone, naltrexone) combined with counseling to treat opioid or alcohol use disorder.' },
  ],
  jobApplication: 'A client tells you they are not ready to stop using but want help staying safer. A recovery-oriented response does not lecture them about abstinence — it meets them where they are, explores what safer use looks like for them, and keeps the door open for future conversations about recovery. This is harm reduction in practice.',
  watchFor: [
    'Do not project your own recovery path onto clients — what worked for you may not work for them',
    'Avoid language like "you need to want it" — this blames the person for systemic barriers',
    'MAT is evidence-based treatment, not "trading one addiction for another" — correct this misconception when you hear it',
  ],
  reflectionPrompt: 'Think of a time when someone met you where you were instead of where they thought you should be. How did that affect your willingness to engage?',
  summaryText: 'Recovery-oriented principles — person-centered care, hope, self-determination, and strengths-based practice — are the operating framework for every peer interaction.',
});

add('History of Peer Support Movement', {
  moduleTitle: 'Introduction to Peer Recovery',
  competencyKeys: ['peer_support_history', 'recovery_oriented_principles'],
  concept: 'The peer support movement grew out of two parallel traditions: the consumer/survivor movement in mental health and the 12-step recovery movement in addiction. Alcoholics Anonymous, founded in 1935, was the first large-scale peer support model — people with lived experience of alcoholism helping each other stay sober. The mental health consumer movement emerged in the 1970s as psychiatric patients began advocating for their own rights and creating alternatives to institutional care. By the 1990s, states began formally recognizing peer support as a billable Medicaid service, which transformed peer work from volunteer activity into a paid profession. In 2007, CMS (Centers for Medicare and Medicaid Services) issued guidance allowing states to bill Medicaid for peer support services, accelerating the professionalization of the field. Today, all 50 states have some form of peer specialist certification. Indiana\'s CPRS credential was established through DMHA and is recognized by most behavioral health employers in the state. Understanding this history matters because it explains why peer support is structured the way it is — and why the boundaries between peer and clinical roles are drawn where they are.',
  keyTerms: [
    { term: 'Consumer/Survivor Movement', definition: 'A civil rights movement led by people with mental health diagnoses advocating for self-determination and alternatives to forced treatment.' },
    { term: 'CMS', definition: 'Centers for Medicare and Medicaid Services — the federal agency that issued guidance in 2007 allowing states to bill Medicaid for peer support services.' },
    { term: 'Medicaid Billable', definition: 'A service that can be reimbursed through Medicaid, making it financially sustainable for agencies to employ peer specialists.' },
    { term: 'Professionalization', definition: 'The process by which peer support moved from informal volunteer work to a credentialed, paid profession with defined competencies and ethics.' },
  ],
  jobApplication: 'When a client or colleague questions whether peer support is "real" work, you can explain the evidence base and the policy history. Peer support has been a Medicaid-billable service for nearly 20 years because research shows it works. Knowing this history gives you confidence and credibility.',
  watchFor: [
    'Do not conflate peer support with 12-step sponsorship — they share roots but have different structures and accountability',
    'The history of forced psychiatric treatment is relevant context for clients who distrust the system',
    'Professionalization created standards but also tensions — some peer advocates worry it dilutes the authenticity of peer work',
  ],
  reflectionPrompt: 'How does knowing the history of the peer support movement change how you think about your role?',
  summaryText: 'Peer support evolved from grassroots recovery communities into a credentialed profession. Understanding this history explains the structure of the role and the importance of maintaining peer authenticity.',
});

add('Professional Boundaries', {
  moduleTitle: 'Introduction to Peer Recovery',
  competencyKeys: ['professional_boundaries_intro', 'prs_role_definition'],
  concept: 'Professional boundaries are the limits that define the peer support relationship and protect both the peer specialist and the person being supported. Boundaries are not about being cold or distant — they are about maintaining a relationship that is safe, ethical, and effective. Common boundary issues for peer specialists include: dual relationships (when you know the client outside of work), over-identification (when your own story takes over the conversation), self-disclosure (sharing too much personal information), and role confusion (doing things outside your scope of practice). The key question for any boundary decision is: "Does this serve the client\'s recovery, or does it serve my own needs?" Healthy self-disclosure means sharing your experience in a way that builds hope and connection for the client — not processing your own unresolved issues. Dual relationships are not always avoidable in small communities, but they must be disclosed to your supervisor and managed carefully. Over-involvement — texting clients at all hours, giving them money, letting them stay at your home — crosses into territory that harms both parties. Your agency will have a code of conduct that defines specific boundary expectations. Know it before your first client contact.',
  keyTerms: [
    { term: 'Professional Boundary', definition: 'A limit that defines the appropriate scope of the peer support relationship, protecting both parties.' },
    { term: 'Dual Relationship', definition: 'When a peer specialist has a relationship with a client outside of the professional context (friend, family member, neighbor, etc.).' },
    { term: 'Over-Identification', definition: 'When a peer specialist becomes so focused on similarities with a client that objectivity and professional judgment are lost.' },
    { term: 'Self-Disclosure', definition: 'Intentionally sharing personal information or experience with a client. Appropriate when it serves the client\'s recovery; inappropriate when it serves the peer\'s needs.' },
    { term: 'Scope of Practice', definition: 'The defined range of activities a PRS is trained and authorized to perform. Anything outside this scope must be referred to the appropriate professional.' },
  ],
  jobApplication: 'A client you have been supporting for three months asks if they can call you on your personal cell phone when they are in crisis. The right response is to explain your agency\'s contact policy, provide the crisis line number, and document the conversation. Giving out your personal number feels helpful in the moment but creates a boundary problem that is hard to walk back.',
  watchFor: [
    'Boundary violations often start small — a personal phone number, a small loan, a ride home — and escalate',
    'If you feel like you are the only person who can help a specific client, that is a warning sign of over-involvement',
    'Disclose dual relationships to your supervisor immediately — do not try to manage them alone',
  ],
  reflectionPrompt: 'Describe a situation where maintaining a professional boundary might feel uncomfortable. How would you handle it?',
  summaryText: 'Professional boundaries protect the peer support relationship. Healthy self-disclosure, clear scope of practice, and early disclosure of dual relationships are the core boundary skills every PRS must develop.',
});

add('Introduction Quiz', {
  moduleTitle: 'Introduction to Peer Recovery',
  competencyKeys: ['prs_role_definition', 'recovery_oriented_principles', 'professional_boundaries_intro'],
  concept: 'This quiz covers the foundational concepts of the Peer Recovery Specialist role: the definition and scope of the PRS, recovery-oriented principles, the history of peer support, and professional boundaries. You must score 70% or higher to proceed. Review the four SAMHSA dimensions of recovery, the distinction between peer support and clinical roles, and the key boundary concepts before attempting the quiz.',
  keyTerms: [],
  jobApplication: 'Employers will test your knowledge of these fundamentals during interviews. Being able to articulate what a PRS does — and does not do — is a core competency.',
  watchFor: [
    'Know the difference between peer support and clinical treatment',
    'Be able to name the four SAMHSA dimensions of recovery',
    'Understand why professional boundaries exist and how to maintain them',
  ],
  reflectionPrompt: 'What is the most important thing you learned in this module, and how will it change how you approach your work?',
  summaryText: 'Module 1 checkpoint covering PRS role definition, recovery-oriented principles, peer support history, and professional boundaries.',
});

// ═══════════════════════════════════════════
// MODULE 2 — Ethics and Professional Conduct
// ═══════════════════════════════════════════

add('Code of Ethics for Peer Specialists', {
  moduleTitle: 'Ethics and Professional Conduct',
  competencyKeys: ['prs_code_of_ethics', 'ethical_decision_making'],
  concept: 'The Code of Ethics for peer specialists establishes the professional standards that govern the peer support relationship. Most state peer specialist codes are built around five core principles: integrity (being honest and transparent), respect (honoring the dignity and autonomy of every person), responsibility (being accountable for your actions and their impact), competence (working within your training and scope), and advocacy (supporting the rights and interests of the people you serve). In Indiana, the CPRS code of ethics is aligned with the NAADAC Code of Ethics and the SAMHSA peer support guidelines. Key ethical obligations include: maintaining confidentiality, avoiding exploitation of the peer relationship, not accepting gifts or money from clients, reporting abuse or neglect as required by law, and seeking supervision when facing ethical dilemmas. Ethics are not just rules — they are the foundation of trust. When clients trust that you will act ethically, they are more likely to engage honestly and take risks in their recovery. Ethical violations, even minor ones, can destroy that trust and harm the person you are trying to help.',
  keyTerms: [
    { term: 'Code of Ethics', definition: 'A formal document that defines the professional standards and obligations of peer specialists.' },
    { term: 'Integrity', definition: 'Being honest, transparent, and consistent in your professional conduct.' },
    { term: 'Competence', definition: 'Working only within the boundaries of your training, credential, and scope of practice.' },
    { term: 'Exploitation', definition: 'Using the peer relationship for personal gain — financial, emotional, or otherwise. Always unethical.' },
    { term: 'Mandatory Reporting', definition: 'The legal obligation to report suspected abuse, neglect, or imminent danger to the appropriate authorities, regardless of confidentiality.' },
  ],
  jobApplication: 'A client offers you a gift card as a thank-you for your support. The ethical response is to decline graciously, explain your agency\'s policy on gifts, and document the interaction. Accepting gifts — even small ones — creates an obligation that compromises the professional relationship.',
  watchFor: [
    'Ethical violations are often rationalized as exceptions — "just this once" is a warning sign',
    'When in doubt, consult your supervisor before acting, not after',
    'Mandatory reporting obligations override confidentiality — know your state\'s reporting requirements',
  ],
  reflectionPrompt: 'Describe an ethical dilemma you might face as a PRS and how the code of ethics would guide your decision.',
  summaryText: 'The Code of Ethics defines the professional standards that make peer support trustworthy. Integrity, competence, and accountability are the core obligations of every certified peer specialist.',
});

add('Confidentiality and HIPAA', {
  moduleTitle: 'Ethics and Professional Conduct',
  competencyKeys: ['confidentiality_hipaa', 'prs_code_of_ethics'],
  concept: 'Confidentiality is the cornerstone of the peer support relationship. Clients share sensitive information — about their substance use, mental health, trauma, legal history, and family — because they trust that it will not be shared without their consent. HIPAA (Health Insurance Portability and Accountability Act) is the federal law that protects the privacy of health information. As a PRS working in a healthcare or behavioral health setting, you are likely a covered entity or business associate under HIPAA, which means you have legal obligations around protected health information (PHI). Key HIPAA rules for peer specialists: do not discuss client information in public spaces, do not share client information with family members without written consent, do not access client records you do not need for your work, and report any suspected breach to your supervisor immediately. 42 CFR Part 2 is an additional federal regulation that provides extra protections for substance use disorder treatment records — it is stricter than HIPAA and requires specific written consent for disclosure. Exceptions to confidentiality include: imminent danger to self or others, mandatory reporting of abuse or neglect, and court orders. Know these exceptions cold — you will face them in practice.',
  keyTerms: [
    { term: 'HIPAA', definition: 'Health Insurance Portability and Accountability Act — federal law protecting the privacy and security of health information.' },
    { term: 'PHI', definition: 'Protected Health Information — any individually identifiable health information covered by HIPAA.' },
    { term: '42 CFR Part 2', definition: 'Federal regulation providing extra confidentiality protections for substance use disorder treatment records, stricter than HIPAA.' },
    { term: 'Covered Entity', definition: 'A healthcare provider, health plan, or clearinghouse that must comply with HIPAA.' },
    { term: 'Breach', definition: 'An unauthorized use or disclosure of PHI. Must be reported to your supervisor and may require notification to the affected individual.' },
  ],
  jobApplication: 'A client\'s mother calls you and asks how her son is doing in the program. Even if you know the client well, you cannot confirm or deny that he is a client without his written consent. The correct response: "I\'m not able to share any information about our clients. If your son would like to include you in his care, he can sign a release of information."',
  watchFor: [
    'Talking about clients in hallways, elevators, or public spaces is a HIPAA violation',
    '42 CFR Part 2 applies specifically to SUD records — do not share these even with other providers without specific consent',
    'Family members do not automatically have the right to a client\'s information, even if the client is an adult living at home',
  ],
  reflectionPrompt: 'A colleague asks you about a mutual acquaintance who is a client at your agency. How do you respond?',
  summaryText: 'Confidentiality and HIPAA compliance are non-negotiable. Know the rules, know the exceptions, and when in doubt, say nothing and consult your supervisor.',
});

add('Dual Relationships and Boundaries', {
  moduleTitle: 'Ethics and Professional Conduct',
  competencyKeys: ['dual_relationships', 'professional_boundaries_intro'],
  concept: 'A dual relationship exists when a peer specialist has a relationship with a client outside of the professional context — as a friend, family member, neighbor, fellow AA member, or romantic partner. Dual relationships are not always avoidable, especially in small communities or tight-knit recovery networks. But they must always be disclosed to your supervisor and managed carefully. The risk of dual relationships is that they blur the line between personal and professional, create conflicts of interest, and can lead to exploitation — intentional or not. The most dangerous dual relationships are romantic or sexual ones, which are always unethical and often illegal in professional contexts. Financial dual relationships — lending money, accepting gifts, doing business with clients — are also prohibited. When a dual relationship is unavoidable (for example, a client attends the same recovery meeting you do), the ethical response is to: disclose it to your supervisor, document it, establish clear boundaries with the client about the two different contexts, and seek guidance on whether a transfer of care is appropriate. The test for any boundary decision is: "Who does this serve — the client or me?"',
  keyTerms: [
    { term: 'Dual Relationship', definition: 'Any relationship with a client that exists outside the professional peer support context.' },
    { term: 'Conflict of Interest', definition: 'A situation where personal interests could improperly influence professional judgment.' },
    { term: 'Transfer of Care', definition: 'Referring a client to another peer specialist when a dual relationship makes it impossible to maintain appropriate boundaries.' },
    { term: 'Exploitation', definition: 'Using the power differential in the peer relationship for personal benefit. Always unethical.' },
  ],
  jobApplication: 'You discover that a new client is someone you used to use drugs with. Before your next session, you disclose this to your supervisor, document it, and together you decide whether you can continue working with this client or whether a transfer is appropriate. You do not try to manage this situation alone.',
  watchFor: [
    'Romantic feelings toward a client must be disclosed to a supervisor immediately — do not act on them',
    'Lending money to a client, even a small amount, creates a power dynamic that harms the relationship',
    'Attending the same recovery meeting as a client is manageable with clear boundaries — but must be disclosed',
  ],
  reflectionPrompt: 'How would you handle discovering that a client is someone you know from your personal life?',
  summaryText: 'Dual relationships require immediate disclosure, documentation, and supervisor guidance. The question is always: who does this serve?',
});

add('Ethical Dilemmas Practice', {
  moduleTitle: 'Ethics and Professional Conduct',
  competencyKeys: ['ethical_decision_making', 'prs_code_of_ethics', 'dual_relationships'],
  concept: 'Ethical dilemmas are situations where two or more ethical principles conflict and there is no obviously correct answer. For example: a client tells you they are using again but begs you not to tell anyone — confidentiality says keep it private, but your duty of care says address the risk. Or: a client asks you to lie to their probation officer about their attendance — loyalty to the client conflicts with your obligation to be honest. The ethical decision-making process for peer specialists follows these steps: (1) Identify the ethical issue — what principles are in conflict? (2) Gather relevant information — what are the facts, the risks, the applicable rules? (3) Consider your options — what are the possible courses of action and their consequences? (4) Consult your supervisor or ethics resources — do not make hard calls alone. (5) Act and document — take the most ethical action available and record your reasoning. Practice scenarios in this lesson will walk through real-world dilemmas you are likely to face. The goal is not to find the "perfect" answer but to develop a consistent, principled decision-making process.',
  keyTerms: [
    { term: 'Ethical Dilemma', definition: 'A situation where two or more ethical principles conflict, making the right course of action unclear.' },
    { term: 'Duty of Care', definition: 'The obligation to take reasonable steps to protect a client from harm.' },
    { term: 'Ethical Decision-Making Process', definition: 'A structured approach to resolving ethical dilemmas: identify, gather, consider, consult, act, document.' },
    { term: 'Documentation', definition: 'Recording your reasoning and actions in the client\'s file. Protects you and the client if questions arise later.' },
  ],
  jobApplication: 'In practice, you will face ethical dilemmas regularly. The peer specialists who handle them well are not the ones who always know the right answer — they are the ones who have a process, consult their supervisor, and document their reasoning. Build that habit now.',
  watchFor: [
    'Never make a hard ethical call alone — always consult your supervisor',
    'Document your reasoning, not just your action — "I did X because Y" is more defensible than just "I did X"',
    'If a situation feels wrong, it probably is — trust your instincts and seek guidance',
  ],
  reflectionPrompt: 'Walk through a real or hypothetical ethical dilemma using the five-step decision-making process.',
  summaryText: 'Ethical dilemmas require a structured decision-making process, supervisor consultation, and documentation. The goal is principled consistency, not perfect answers.',
});

add('Ethics Quiz', {
  moduleTitle: 'Ethics and Professional Conduct',
  competencyKeys: ['prs_code_of_ethics', 'confidentiality_hipaa', 'dual_relationships', 'ethical_decision_making'],
  concept: 'This quiz covers the ethics and professional conduct module: the code of ethics, HIPAA and 42 CFR Part 2 confidentiality rules, dual relationships, and ethical decision-making. You must score 70% or higher to proceed. Pay particular attention to the exceptions to confidentiality and the steps of the ethical decision-making process.',
  keyTerms: [],
  jobApplication: 'Ethics questions appear on the CPRS exam. Knowing the code of ethics and confidentiality rules is tested directly.',
  watchFor: [
    'Know the three main exceptions to confidentiality',
    'Know the difference between HIPAA and 42 CFR Part 2',
    'Know the five steps of the ethical decision-making process',
  ],
  reflectionPrompt: 'Which ethical principle do you find most challenging to apply in practice, and why?',
  summaryText: 'Module 2 checkpoint covering code of ethics, confidentiality, dual relationships, and ethical decision-making.',
});

