/**
 * scripts/prs-lesson-payloads.ts
 * PRS lesson content — all 39 lessons, matched by lesson_slug.
 * Built in batches. Do not edit slugs — they are DB identity.
 */

export type LessonPayload = {
  lesson_slug: string;
  script_text: string;
  summary_text: string;
  reflection_prompt: string;
  key_terms: string[];
  competency_keys: string[];
  job_application: string;
  watch_for: string[];
};

export const PRS_LESSONS: LessonPayload[] = [

// ── MODULE 1 ──────────────────────────────────────────────────────────────────
{
  lesson_slug: 'peer-mod-1-peer-1-1',
  summary_text: 'Defines the PRS role, scope, and how lived experience functions as a professional tool.',
  reflection_prompt: 'What aspect of your lived experience will be most useful to the people you support, and why?',
  key_terms: ['peer recovery specialist', 'lived experience', 'scope of role', 'mutuality', 'CPRS'],
  competency_keys: ['prs_role_definition', 'recovery_oriented_principles'],
  job_application: 'Practice a 60-second introduction that shares your role and what you can offer without oversharing personal detail.',
  watch_for: ['Do not present yourself as a counselor or therapist', 'Your lived experience is an asset — do not minimize it', 'Know scope of practice before your first client interaction'],
  script_text: `A Peer Recovery Specialist uses lived experience of addiction, mental health challenges, or both to support others in recovery. The role is not clinical. You are not a therapist, counselor, or case manager. You are a peer who has walked a similar path and can offer hope, connection, and practical guidance that a clinician cannot.

In Indiana, the CPRS credential is issued by DMHA and requires 46 hours of training, a supervised practicum, and a written exam. PRS staff work in recovery community organizations, treatment centers, hospitals, jails, shelters, and community health agencies.

Your primary tools are your story, your empathy, and your knowledge of the recovery system. Studies consistently show peer support reduces hospitalization, increases treatment engagement, and improves long-term recovery outcomes.

The PRS role differs from clinical roles in three ways: you use shared experience rather than clinical assessment, you focus on hope and possibility rather than diagnosis, and you work alongside the person rather than directing their care.`,
},
{
  lesson_slug: 'peer-mod-1-peer-1-2',
  summary_text: 'Introduces recovery-oriented principles including person-centered care, hope, self-determination, and strengths-based practice.',
  reflection_prompt: 'Think of a time someone met you where you were instead of where they thought you should be. How did that affect your willingness to engage?',
  key_terms: ['ROSC', 'person-centered care', 'self-determination', 'strengths-based', 'harm reduction'],
  competency_keys: ['recovery_oriented_principles', 'prs_role_definition'],
  job_application: 'When a client says they are not ready to stop using, a recovery-oriented response meets them where they are and keeps the door open rather than lecturing about abstinence.',
  watch_for: ['Do not project your own recovery path onto clients', 'MAT is evidence-based treatment, not trading one addiction for another', 'Avoid language like "you need to want it" — this blames the person for systemic barriers'],
  script_text: `Recovery-oriented systems of care are built on core principles that guide every peer interaction. SAMHSA identifies four major dimensions of recovery: Health, Home, Purpose, and Community.

Recovery is a process, not a single event. It looks different for every person. Some achieve abstinence. Others use harm reduction. Some recover with MAT. As a PRS, your job is to support the person's chosen path, not impose your own story on them.

Key recovery-oriented principles:
- Person-centered care: the individual drives their own recovery plan
- Hope: recovery is possible for everyone
- Self-determination: people have the right to make their own choices
- Strengths-based practice: focus on what people can do, not what they cannot

These principles shape every interaction — how you ask questions, how you respond to setbacks, and how you talk about options.`,
},
{
  lesson_slug: 'peer-mod-1-peer-1-3',
  summary_text: 'Explains how peer support evolved from mutual aid and consumer-survivor movements into a credentialed profession.',
  reflection_prompt: 'How does knowing the history of peer support change how you think about your role?',
  key_terms: ['consumer-survivor movement', 'mutual aid', 'Medicaid billable', 'professionalization', 'recovery advocacy'],
  competency_keys: ['peer_support_history', 'recovery_oriented_principles'],
  job_application: 'When a colleague questions whether peer support is real work, explain the evidence base and policy history — peer support has been Medicaid-billable for nearly 20 years.',
  watch_for: ['Do not conflate peer support with 12-step sponsorship', 'The history of forced psychiatric treatment is relevant context for clients who distrust the system', 'Professionalization created standards but also tensions around authenticity'],
  script_text: `The peer support movement grew from two parallel traditions: the consumer-survivor movement in mental health and the 12-step recovery movement in addiction. Alcoholics Anonymous, founded in 1935, was the first large-scale peer support model.

The mental health consumer movement emerged in the 1970s as psychiatric patients began advocating for their own rights. By the 1990s, states began recognizing peer support as a billable Medicaid service. In 2007, CMS issued guidance allowing states to bill Medicaid for peer support services, transforming peer work from volunteer activity into a paid profession.

Today all 50 states have some form of peer specialist certification. Indiana's CPRS credential was established through DMHA.

Understanding this history matters because it explains why peer support is structured the way it is and why the boundaries between peer and clinical roles are drawn where they are.`,
},
{
  lesson_slug: 'peer-mod-1-peer-1-4',
  summary_text: 'Defines professional boundaries, role clarity, and the difference between caring support and overinvolvement.',
  reflection_prompt: 'Describe a situation where maintaining a professional boundary might feel uncomfortable. How would you handle it?',
  key_terms: ['professional boundary', 'dual relationship', 'over-identification', 'self-disclosure', 'scope of practice'],
  competency_keys: ['professional_boundaries_intro', 'prs_role_definition'],
  job_application: 'A client asks for your personal cell number for crisis calls. Explain your agency contact policy, provide the crisis line, and document the conversation.',
  watch_for: ['Boundary violations often start small and escalate', 'If you feel like you are the only person who can help a specific client, that is a warning sign of over-involvement', 'Disclose dual relationships to your supervisor immediately'],
  script_text: `Professional boundaries are the limits that define the peer support relationship and protect both parties. Boundaries are not about being cold — they are about maintaining a relationship that is safe, ethical, and effective.

Common boundary issues for peer specialists:
- Dual relationships: knowing the client outside of work
- Over-identification: your own story takes over the conversation
- Self-disclosure: sharing too much personal information
- Role confusion: doing things outside your scope of practice

The key question for any boundary decision: Does this serve the client's recovery, or does it serve my own needs?

Healthy self-disclosure means sharing your experience in a way that builds hope for the client, not processing your own unresolved issues. Over-involvement — texting clients at all hours, giving money, letting them stay at your home — crosses into territory that harms both parties.

Your agency will have a code of conduct that defines specific boundary expectations. Know it before your first client contact.`,
},
{
  lesson_slug: 'peer-mod-1-peer-1-5',
  summary_text: 'Module 1 checkpoint covering PRS role, recovery-oriented principles, peer support history, and professional boundaries.',
  reflection_prompt: 'What is the most important thing you learned in this module, and how will it change how you approach your work?',
  key_terms: ['module review', 'role clarity', 'recovery principles', 'boundaries', 'readiness check'],
  competency_keys: ['prs_role_definition', 'recovery_oriented_principles', 'peer_support_history', 'professional_boundaries_intro'],
  job_application: 'Employers test these fundamentals in interviews. Being able to articulate what a PRS does and does not do is a core competency.',
  watch_for: ['Know the difference between peer support and clinical treatment', 'Be able to name the four SAMHSA dimensions of recovery', 'Understand why professional boundaries exist'],
  script_text: `This checkpoint covers the foundational concepts of the Peer Recovery Specialist role.

You should be able to:
1. Distinguish peer support from clinical treatment
2. Explain at least three recovery-oriented principles
3. Describe why lived experience matters in peer work
4. Recognize early warning signs of boundary drift
5. Explain why the history of peer support still matters in practice today

Score 70% or higher to proceed.`,
},

// ── MODULE 2 ──────────────────────────────────────────────────────────────────
{
  lesson_slug: 'peer-mod-2-peer-2-1',
  summary_text: 'Reviews the code of ethics for peer specialists including integrity, respect, competence, and mandatory reporting.',
  reflection_prompt: 'Describe an ethical dilemma you might face as a PRS and how the code of ethics would guide your decision.',
  key_terms: ['code of ethics', 'integrity', 'competence', 'exploitation', 'mandatory reporting'],
  competency_keys: ['prs_code_of_ethics', 'ethical_decision_making'],
  job_application: 'A client offers you a gift card as a thank-you. Decline graciously, explain your agency policy on gifts, and document the interaction.',
  watch_for: ['Ethical violations are often rationalized as exceptions', 'When in doubt, consult your supervisor before acting', 'Mandatory reporting obligations override confidentiality'],
  script_text: `The Code of Ethics establishes professional standards that govern the peer support relationship. Most state peer specialist codes are built around five core principles: integrity, respect, responsibility, competence, and advocacy.

Key ethical obligations:
- Maintain confidentiality
- Avoid exploitation of the peer relationship
- Do not accept gifts or money from clients
- Report abuse or neglect as required by law
- Seek supervision when facing ethical dilemmas

Ethics are the foundation of trust. When clients trust that you will act ethically, they are more likely to engage honestly and take risks in their recovery. Ethical violations, even minor ones, can destroy that trust.`,
},
{
  lesson_slug: 'peer-mod-2-peer-2-2',
  summary_text: 'Explains HIPAA, 42 CFR Part 2, confidentiality limits, and the exceptions peer specialists must know.',
  reflection_prompt: 'A colleague asks about a mutual acquaintance who is a client at your agency. How do you respond?',
  key_terms: ['HIPAA', 'PHI', '42 CFR Part 2', 'covered entity', 'breach'],
  competency_keys: ['confidentiality_hipaa', 'prs_code_of_ethics'],
  job_application: "A client's mother calls asking how her son is doing. You cannot confirm or deny he is a client without written consent. Say: I'm not able to share information about our clients. If your son would like to include you in his care, he can sign a release.",
  watch_for: ['Talking about clients in hallways or public spaces is a HIPAA violation', '42 CFR Part 2 applies specifically to SUD records and is stricter than HIPAA', 'Family members do not automatically have the right to a client\'s information'],
  script_text: `Confidentiality is the cornerstone of the peer support relationship. HIPAA is the federal law that protects the privacy of health information.

Key HIPAA rules for peer specialists:
- Do not discuss client information in public spaces
- Do not share client information with family without written consent
- Do not access client records you do not need for your work
- Report any suspected breach to your supervisor immediately

42 CFR Part 2 provides extra protections for substance use disorder treatment records. It is stricter than HIPAA and requires specific written consent for disclosure.

Exceptions to confidentiality:
- Imminent danger to self or others
- Mandatory reporting of abuse or neglect
- Court orders

Never promise a client that everything stays between you. That is inaccurate and dangerous.`,
},
{
  lesson_slug: 'peer-mod-2-peer-2-3',
  summary_text: 'Examines dual relationships, role conflicts, and how personal overlap can undermine safe peer practice.',
  reflection_prompt: 'How would you handle discovering that a client is someone you know from your personal life?',
  key_terms: ['dual relationship', 'conflict of interest', 'transfer of care', 'exploitation', 'role conflict'],
  competency_keys: ['dual_relationships', 'prs_code_of_ethics'],
  job_application: 'You discover a new client is someone you used to use drugs with. Before your next session, disclose this to your supervisor, document it, and decide together whether to continue or transfer.',
  watch_for: ['Romantic feelings toward a client must be disclosed to a supervisor immediately', 'Lending money to a client creates a power dynamic that harms the relationship', 'Attending the same recovery meeting as a client must be disclosed'],
  script_text: `A dual relationship exists when a peer specialist has a relationship with a client outside of the professional context — as a friend, family member, neighbor, romantic partner, or business associate.

Dual relationships are not always avoidable in small communities. But they must always be disclosed to your supervisor and managed carefully.

The risk: dual relationships blur the line between personal and professional, create conflicts of interest, and can lead to exploitation.

When a dual relationship is unavoidable:
1. Disclose it to your supervisor immediately
2. Document it
3. Establish clear boundaries with the client about the two different contexts
4. Seek guidance on whether a transfer of care is appropriate

The test for any boundary decision: Who does this serve — the client or me?`,
},
{
  lesson_slug: 'peer-mod-2-peer-2-4',
  summary_text: 'Applies ethical reasoning to realistic practice scenarios involving privacy, boundaries, role drift, and supervision.',
  reflection_prompt: 'Walk through a real or hypothetical ethical dilemma using the five-step decision-making process.',
  key_terms: ['ethical dilemma', 'duty of care', 'ethical decision-making process', 'documentation', 'gray area'],
  competency_keys: ['ethical_decision_making', 'dual_relationships', 'confidentiality_hipaa'],
  job_application: 'The peer specialists who handle ethical dilemmas well are not the ones who always know the right answer — they are the ones who have a process, consult their supervisor, and document their reasoning.',
  watch_for: ['Never make a hard ethical call alone', 'Document your reasoning, not just your action', 'If a situation feels wrong, it probably is — trust your instincts and seek guidance'],
  script_text: `Ethical dilemmas are situations where two or more ethical principles conflict and there is no obviously correct answer.

The ethical decision-making process:
1. Identify the ethical issue — what principles are in conflict?
2. Gather relevant information — what are the facts, risks, applicable rules?
3. Consider your options — what are the possible courses of action and their consequences?
4. Consult your supervisor or ethics resources — do not make hard calls alone
5. Act and document — take the most ethical action available and record your reasoning

The goal is not to find the perfect answer but to develop a consistent, principled decision-making process.`,
},
{
  lesson_slug: 'peer-mod-2-peer-2-5',
  summary_text: 'Module 2 checkpoint covering code of ethics, confidentiality, dual relationships, and ethical decision-making.',
  reflection_prompt: 'Which ethics topic still feels most vulnerable to confusion in your own practice?',
  key_terms: ['ethics quiz', 'confidentiality', 'boundaries', 'decision-making', 'professional conduct'],
  competency_keys: ['prs_code_of_ethics', 'confidentiality_hipaa', 'dual_relationships', 'ethical_decision_making'],
  job_application: 'Ethics questions appear on the CPRS exam. Knowing the code of ethics and confidentiality rules is tested directly.',
  watch_for: ['Know the three main exceptions to confidentiality', 'Know the difference between HIPAA and 42 CFR Part 2', 'Know the five steps of the ethical decision-making process'],
  script_text: `This checkpoint evaluates ethics, confidentiality, dual relationships, and applied ethical judgment.

You should be able to:
1. Explain the purpose of a code of ethics
2. Describe the limits of confidentiality and the three main exceptions
3. Recognize high-risk dual relationship situations
4. Use a stepwise method for ethical problem-solving
5. Identify when supervision is required

Score 70% or higher to proceed.`,
},

// ── MODULE 3 ──────────────────────────────────────────────────────────────────
{
  lesson_slug: 'peer-mod-3-peer-3-1',
  summary_text: 'Compares major recovery models including abstinence-based, harm reduction, MAT, and wellness frameworks.',
  reflection_prompt: 'Which recovery model best describes your own experience, and how does that shape how you might work with someone whose path looks different?',
  key_terms: ['abstinence-based', 'harm reduction', 'MAT', 'ROSC', 'wellness model'],
  competency_keys: ['recovery_models', 'recovery_oriented_principles'],
  job_application: 'When a client on buprenorphine is told by a sponsor they are not really sober, help them understand that MAT is evidence-based treatment and their recovery is valid.',
  watch_for: ['Do not impose your own recovery model on clients', 'MAT is not a moral failure — it is medicine', 'Harm reduction and abstinence are not opposites'],
  script_text: `Recovery is not one thing. Multiple evidence-based models exist and each has a place depending on the person, the substance, and the context.

Abstinence-based models define recovery as complete cessation of substance use. 12-step programs are the most widely known example. These models work well for many people and have decades of community infrastructure behind them.

Harm reduction models focus on reducing the negative consequences of substance use without requiring abstinence as a precondition for support. Needle exchanges, naloxone distribution, and safe consumption sites are harm reduction interventions.

MAT uses FDA-approved medications like buprenorphine, methadone, and naltrexone to treat opioid and alcohol use disorders. MAT is the gold standard for opioid use disorder. It reduces overdose deaths, increases treatment retention, and improves social functioning.

Wellness models like SAMHSA's eight dimensions address the whole person: emotional, physical, occupational, intellectual, financial, social, environmental, and spiritual health.

As a PRS you support the client's chosen path. Your job is not to decide which model is correct.`,
},
{
  lesson_slug: 'peer-mod-3-peer-3-2',
  summary_text: 'Explains the Stages of Change model and how peer specialists adapt their approach to each stage.',
  reflection_prompt: 'Think about a change you made in your own life. Which stage took the longest, and what finally moved you forward?',
  key_terms: ['Stages of Change', 'precontemplation', 'contemplation', 'preparation', 'action', 'maintenance'],
  competency_keys: ['stages_of_change', 'motivational_interviewing'],
  job_application: 'A client says they do not think they have a problem. Rather than arguing, ask open questions that invite reflection — meet them in precontemplation without pushing toward action they are not ready for.',
  watch_for: ['Pushing someone in precontemplation toward action usually backfires', 'Relapse is part of the model, not a failure of the model', 'Your job is to reduce ambivalence, not eliminate it by force'],
  script_text: `The Transtheoretical Model describes how people move through behavior change. The stages are:

1. Precontemplation — not yet considering change
2. Contemplation — aware of the problem, ambivalent about change
3. Preparation — intending to act, making plans
4. Action — actively changing behavior
5. Maintenance — sustaining the change over time
6. Relapse — returning to old behavior (common and expected)

Peer specialists match their approach to the client's stage. In precontemplation, you plant seeds. In contemplation, you explore ambivalence. In preparation, you help with planning. In action, you provide support and accountability. In maintenance, you help build a sustainable recovery lifestyle.

Pushing someone to act before they are ready increases resistance. Meeting people where they are is not giving up — it is effective practice.`,
},
{
  lesson_slug: 'peer-mod-3-peer-3-3',
  summary_text: 'Covers wellness and self-care as professional obligations, including the eight dimensions of wellness and burnout prevention.',
  reflection_prompt: 'Which dimension of your own wellness needs the most attention right now, and what is one concrete step you can take this week?',
  key_terms: ['wellness', 'self-care', 'burnout', 'vicarious trauma', 'eight dimensions'],
  competency_keys: ['wellness_self_care', 'professional_sustainability'],
  job_application: 'Identify your personal warning signs of burnout and have a plan before you need it.',
  watch_for: ['Peer specialists are at elevated risk for vicarious trauma and relapse', 'Self-care is not optional — it is a professional obligation', 'Burnout looks like cynicism, exhaustion, and reduced empathy'],
  script_text: `SAMHSA identifies eight dimensions of wellness: emotional, physical, occupational, intellectual, financial, social, environmental, and spiritual. Peer specialists must attend to their own wellness to sustain effective practice.

Vicarious trauma occurs when repeated exposure to others' trauma affects your own mental health. Burnout is the result of chronic workplace stress that has not been managed. Both are occupational hazards for peer specialists.

Warning signs of burnout: emotional exhaustion, cynicism toward clients, reduced sense of accomplishment, physical symptoms, increased use of substances or other coping behaviors.

Prevention strategies: regular supervision, peer consultation, clear work-life boundaries, physical activity, spiritual practice, social connection outside of work, and honest self-assessment.

Your recovery is not a credential you earned once. It requires ongoing maintenance. If your own wellness is deteriorating, you cannot effectively support someone else's.`,
},
{
  lesson_slug: 'peer-mod-3-peer-3-4',
  summary_text: 'Teaches relapse prevention concepts including triggers, warning signs, coping strategies, and how peer specialists support clients through relapse.',
  reflection_prompt: 'What were your personal early warning signs before a relapse or a difficult period, and how would you help a client identify theirs?',
  key_terms: ['relapse', 'trigger', 'warning signs', 'coping strategies', 'relapse prevention plan'],
  competency_keys: ['relapse_prevention', 'recovery_models'],
  job_application: 'Help a client identify three personal triggers, three early warning signs, and three coping strategies they can use before reaching out for help.',
  watch_for: ['Relapse is not the end of recovery — how you respond matters more than the relapse itself', 'Shame after relapse is a major barrier to re-engagement', 'Do not lecture — express concern and help the client reconnect to their plan'],
  script_text: `Relapse is a return to substance use after a period of abstinence or reduced use. It is common — not a moral failure. Most people with substance use disorders experience multiple relapses before achieving sustained recovery.

Relapse prevention focuses on identifying and managing the factors that increase relapse risk.

Triggers: people, places, things, emotions, and situations associated with past use. Internal triggers include stress, loneliness, boredom, and negative emotions. External triggers include environments, social contacts, and sensory cues.

Warning signs: behavioral and emotional changes that precede relapse — isolation, skipping meetings, romanticizing past use, increased stress, poor self-care.

Coping strategies: the skills and supports a person uses to manage triggers without using — calling a sponsor, attending a meeting, exercise, mindfulness, reaching out to a peer specialist.

When a client relapses, your job is to reduce shame, help them understand what happened, and reconnect them to their recovery plan. Shame is the enemy of re-engagement.`,
},
{
  lesson_slug: 'peer-mod-3-peer-3-5',
  summary_text: 'Module 3 checkpoint covering recovery models, stages of change, wellness, and relapse prevention.',
  reflection_prompt: 'Which recovery model or concept from this module will most change how you approach your work with clients?',
  key_terms: ['recovery models quiz', 'stages of change', 'wellness', 'relapse prevention', 'MAT'],
  competency_keys: ['recovery_models', 'stages_of_change', 'wellness_self_care', 'relapse_prevention'],
  job_application: 'Recovery models and stages of change are tested on the CPRS exam and come up in every client interaction.',
  watch_for: ['Know the six stages of change and what peer support looks like at each', 'Know the difference between abstinence-based and harm reduction approaches', 'Know the eight dimensions of wellness'],
  script_text: `Checkpoint for Module 3. You should be able to compare major recovery models, describe the six stages of change and adapt your approach to each, explain the eight dimensions of wellness and why self-care is a professional obligation, and describe the relapse prevention process including triggers, warning signs, and coping strategies. Score 70% or higher to proceed.`,
},

// ── MODULE 4 ──────────────────────────────────────────────────────────────────
{
  lesson_slug: 'peer-mod-4-peer-4-1',
  summary_text: 'Teaches active listening skills including reflective listening, open questions, summarizing, and non-verbal communication.',
  reflection_prompt: 'Think of someone who made you feel truly heard. What did they do, and how did it affect your willingness to open up?',
  key_terms: ['active listening', 'reflective listening', 'open questions', 'summarizing', 'non-verbal communication'],
  competency_keys: ['active_listening_empathy', 'peer_support_skills'],
  job_application: 'In your next conversation, practice reflecting back what you hear before responding. Notice how the other person responds when they feel heard.',
  watch_for: ['Listening is not waiting for your turn to talk', 'Advice before understanding shuts people down', 'Non-verbal cues communicate as much as words'],
  script_text: `Active listening is the foundation of peer support. It requires full attention, intentional responses, and the discipline to stay curious rather than jumping to solutions.

Core active listening skills:

Reflective listening: mirror back what you heard, both content and emotion. "It sounds like you're feeling overwhelmed and not sure where to start."

Open questions: questions that cannot be answered yes or no. "What has been hardest about this week?" rather than "Was this week hard?"

Summarizing: periodically pull together what you have heard to show you are tracking and to give the person a chance to correct misunderstandings.

Non-verbal communication: eye contact, body posture, facial expression, and tone of voice communicate whether you are truly present. Crossed arms, checking your phone, or looking away all signal disengagement.

The goal of active listening is not to gather information — it is to make the person feel understood. When people feel heard, they are more likely to engage honestly and take risks in their recovery.`,
},
{
  lesson_slug: 'peer-mod-4-peer-4-2',
  summary_text: 'Introduces motivational interviewing principles — OARS, rolling with resistance, and eliciting change talk.',
  reflection_prompt: 'Describe a time someone used a confrontational approach to try to change your behavior. How did it affect your motivation?',
  key_terms: ['motivational interviewing', 'OARS', 'ambivalence', 'rolling with resistance', 'change talk'],
  competency_keys: ['motivational_interviewing', 'peer_support_skills'],
  job_application: 'When a client expresses ambivalence about treatment, use OARS to explore both sides without pushing — and listen for change talk to reflect back.',
  watch_for: ['Confrontation increases resistance — MI is collaborative not coercive', 'Your job is to elicit change talk, not produce it', 'Sustain talk is normal — do not panic when clients express reasons not to change'],
  script_text: `Motivational Interviewing is an evidence-based communication style that helps people resolve ambivalence about change. It was developed by William Miller and Stephen Rollnick and has strong research support across addiction, mental health, and health behavior change.

The spirit of MI: collaboration, evocation, and autonomy. You are not the expert on the client's life — they are.

OARS — the core MI skills:
- Open questions: invite exploration
- Affirmations: recognize strengths and efforts
- Reflective listening: demonstrate understanding
- Summarizing: pull together what you have heard

Ambivalence is normal. Most people in contemplation feel pulled in two directions. Your job is to explore both sides without pushing, and to listen for change talk — statements the client makes about wanting, being able to, having reasons for, or being committed to change.

Rolling with resistance means not arguing when a client pushes back. Instead, reflect their perspective and stay curious. Arguing increases resistance. Curiosity reduces it.`,
},
{
  lesson_slug: 'peer-mod-4-peer-4-3',
  summary_text: 'Teaches strategic self-disclosure — how to share lived experience in ways that serve the client rather than the peer specialist.',
  reflection_prompt: 'What part of your story is most likely to build hope for the people you will work with, and what part should stay private?',
  key_terms: ['self-disclosure', 'strategic sharing', 'boundaries', 'hope', 'authenticity'],
  competency_keys: ['self_disclosure', 'peer_support_skills'],
  job_application: 'Before sharing a piece of your story, ask: Does this serve the client\'s recovery right now, or does it serve my need to be understood?',
  watch_for: ['Over-disclosure shifts focus from client to peer specialist', 'Sharing graphic details of past use can be triggering', 'Your story is a tool — use it intentionally, not reflexively'],
  script_text: `Self-disclosure is one of the most powerful tools a peer specialist has — and one of the most easily misused. The difference between therapeutic self-disclosure and over-disclosure is purpose.

Therapeutic self-disclosure: sharing a piece of your experience that builds hope, normalizes struggle, or demonstrates that recovery is possible. It is brief, purposeful, and focused on the client's needs.

Over-disclosure: sharing your story in ways that shift the focus to you, process your own unresolved issues, or burden the client with your experience.

Before disclosing, ask three questions:
1. Does this serve the client's recovery right now?
2. Is this the right moment?
3. Am I sharing this for them or for me?

Your story is not the point of the conversation — the client's story is. Use your experience to open doors, not to fill the room.`,
},
{
  lesson_slug: 'peer-mod-4-peer-4-4',
  summary_text: 'Covers rapport-building, trust development, and how trauma history affects a client\'s ability to engage with support.',
  reflection_prompt: 'What made you trust or distrust the people who tried to help you during your own recovery?',
  key_terms: ['rapport', 'trust', 'trauma-informed', 'consistency', 'therapeutic alliance'],
  competency_keys: ['rapport_trust_building', 'trauma_informed_practice'],
  job_application: 'With a new client who has been let down by multiple systems, your first job is not to fix anything — it is to show up consistently and do what you say you will do.',
  watch_for: ['Trust is built through consistency, not intensity', 'Trauma history often means clients test relationships before trusting them', 'Breaking a small commitment can set back trust significantly'],
  script_text: `Rapport is the foundation of the peer support relationship. Without it, nothing else works. Rapport is built through consistency, authenticity, and genuine interest in the person — not through technique.

Many clients have been failed by systems, families, and helpers before. They may test the relationship — missing appointments, pushing boundaries, or withdrawing — to see if you will stay. This is not manipulation. It is a reasonable response to a history of abandonment.

Trauma-informed practice means understanding that many behaviors that look like resistance are actually adaptations to past harm. A client who does not make eye contact, who is hypervigilant, or who shuts down when asked direct questions may be responding to trauma, not being difficult.

Building trust requires:
- Showing up consistently
- Doing what you say you will do
- Being honest when you cannot do something
- Maintaining confidentiality
- Respecting the client's pace

Trust cannot be rushed. It is earned through repeated small acts of reliability.`,
},
{
  lesson_slug: 'peer-mod-4-peer-4-5',
  summary_text: 'Module 4 practice session applying active listening, MI, self-disclosure, and rapport-building in simulated peer support scenarios.',
  reflection_prompt: 'After practicing these skills, which one feels most natural and which one will require the most intentional effort?',
  key_terms: ['practice scenarios', 'role play', 'skill integration', 'feedback', 'reflection'],
  competency_keys: ['active_listening_empathy', 'motivational_interviewing', 'self_disclosure', 'rapport_trust_building'],
  job_application: 'Peer support skills are not learned by reading about them — they are learned by practicing them, getting feedback, and practicing again.',
  watch_for: ['Discomfort during practice is normal and useful', 'Ask for specific feedback, not just general impressions', 'Record yourself if possible — you will notice things you cannot see in the moment'],
  script_text: `This lesson is a practice session. Work through four scenarios that require you to apply the skills from Module 4.

Scenario 1: A client tells you they have been using again and is ashamed. Practice active listening and reflective responses without jumping to problem-solving.

Scenario 2: A client says they do not see the point of treatment because nothing has worked before. Practice OARS and rolling with resistance.

Scenario 3: A client asks about your own recovery. Practice strategic self-disclosure — share something useful without over-disclosing.

Scenario 4: A new client is guarded and gives one-word answers. Practice rapport-building through patience, consistency, and genuine curiosity.

After each scenario, reflect: What worked? What felt forced? What would you do differently?`,
},

// ── MODULE 5 ──────────────────────────────────────────────────────────────────
{
  lesson_slug: 'peer-mod-5-peer-5-1',
  summary_text: 'Defines self-advocacy, explains the peer specialist\'s role in building client self-advocacy capacity, and distinguishes it from doing things for clients.',
  reflection_prompt: 'What made it hard to advocate for yourself when you were in the middle of your own recovery, and what would have helped?',
  key_terms: ['self-advocacy', 'empowerment', 'autonomy', 'capacity building', 'person-centered'],
  competency_keys: ['advocacy_empowerment', 'peer_support_skills'],
  job_application: 'Before a client\'s appointment with a housing authority, help them write down their three most important questions and practice saying them out loud.',
  watch_for: ['Doing things for clients instead of with them creates dependency', 'Self-advocacy is a skill that must be practiced, not just explained', 'Celebrate small wins — they build confidence for bigger ones'],
  script_text: `Self-advocacy is the ability to speak up for your own needs, rights, and interests. For many people in recovery, this is a skill that was never developed or was damaged by years of trauma, addiction, or system involvement.

As a PRS, your job is to build the client's self-advocacy capacity — not to advocate for them indefinitely. The difference matters: doing things for people creates dependency; doing things with people builds skills.

Self-advocacy skill-building looks like:
- Helping clients identify what they need and why
- Practicing how to ask for it
- Preparing for appointments and difficult conversations
- Debriefing after interactions to build on what worked
- Celebrating when they successfully advocate for themselves

The goal is that over time the client needs you less for these tasks — not more. Empowerment means increasing the client's power, not transferring your power to them.`,
},
{
  lesson_slug: 'peer-mod-5-peer-5-2',
  summary_text: 'Covers systems advocacy — how peer specialists identify systemic barriers and work within their role to address them.',
  reflection_prompt: 'What is one policy or practice in the systems you have encountered that consistently harms people in recovery?',
  key_terms: ['systems advocacy', 'systemic barriers', 'policy', 'collective voice', 'scope of role'],
  competency_keys: ['advocacy_empowerment', 'professional_boundaries_intro'],
  job_application: 'When you notice the same barrier affecting multiple clients, document it and bring it to your supervisor as a systemic issue — not just an individual problem.',
  watch_for: ['Systems advocacy is within PRS scope — political campaigning is not', 'Document patterns, not just individual incidents', 'Work through your agency\'s channels before going outside them'],
  script_text: `Individual advocacy helps one person navigate one situation. Systems advocacy addresses the policies, practices, and structures that create barriers for many people.

As a PRS you are positioned to see systemic problems that clinicians and administrators may miss — because you work directly with people navigating those systems every day.

Systems advocacy within PRS scope includes:
- Documenting recurring barriers and reporting them to supervisors
- Participating in agency quality improvement processes
- Contributing to community needs assessments
- Sharing client perspectives (with consent) in policy discussions
- Supporting clients in participating in advocacy organizations

The most powerful advocacy tool you have is documentation. When you can show that 15 clients in one month were denied housing because of a specific policy, that is data that can drive change.`,
},
{
  lesson_slug: 'peer-mod-5-peer-5-3',
  summary_text: 'Reviews participant rights in behavioral health settings including informed consent, right to refuse treatment, and grievance procedures.',
  reflection_prompt: 'Did you know your rights as a patient when you were receiving services? What difference would it have made?',
  key_terms: ['participant rights', 'informed consent', 'right to refuse', 'grievance', 'HIPAA rights'],
  competency_keys: ['participant_rights', 'ethics_professional_conduct'],
  job_application: 'A client says their provider changed their medication without explaining why. Help them understand their right to informed consent and how to request a conversation with their prescriber.',
  watch_for: ['Rights exist on paper — advocacy makes them real', 'Grievance procedures are often buried — help clients find them', 'Do not discourage clients from filing complaints when warranted'],
  script_text: `Participants in behavioral health services have rights that are often not explained to them. As a PRS, knowing these rights and helping clients exercise them is a core function.

Key rights in behavioral health:
- Informed consent: the right to understand and agree to treatment before it begins
- Right to refuse treatment: the right to decline any treatment, including medication
- Right to access records: the right to see your own health records
- Right to confidentiality: protection of health information under HIPAA
- Right to file a grievance: the right to complain about care without retaliation

Grievance procedures are the formal process for addressing complaints about services. Most agencies are required to have them. Many clients do not know they exist.

Your role is to help clients understand their rights, prepare to exercise them, and navigate the process when they are denied. Rights without knowledge are not real rights.`,
},
{
  lesson_slug: 'peer-mod-5-peer-5-4',
  summary_text: 'Applies advocacy skills through practice scenarios involving rights violations, systemic barriers, and empowerment conversations.',
  reflection_prompt: 'Which advocacy scenario felt most challenging, and what would you do differently with more preparation?',
  key_terms: ['advocacy scenarios', 'role play', 'rights', 'barriers', 'empowerment practice'],
  competency_keys: ['advocacy_empowerment', 'participant_rights'],
  job_application: 'Advocacy skills are tested in the CPRS exam through scenario questions. Practice applying the principles, not just reciting them.',
  watch_for: ['Advocacy is not arguing — it is helping people navigate systems effectively', 'Know when to escalate and when to work within existing channels', 'Document every advocacy interaction'],
  script_text: `Practice scenarios for Module 5.

Scenario 1: A client was discharged from a treatment program without a transition plan. They do not know they have the right to appeal. Walk them through the grievance process.

Scenario 2: A client keeps getting turned away from housing programs because of a felony conviction. Help them identify which programs have ban-the-box policies and prepare to apply.

Scenario 3: A client wants to stop taking their prescribed medication but is afraid to tell their doctor. Help them prepare to have that conversation assertively.

Scenario 4: You have noticed that three clients this month were denied benefits because of a confusing form. Describe how you would document and escalate this as a systemic issue.

After each scenario, identify: What advocacy skill did you use? What was the outcome? What would you do differently?`,
},
{
  lesson_slug: 'peer-mod-5-peer-5-5',
  summary_text: 'Module 5 checkpoint covering self-advocacy, systems advocacy, participant rights, and advocacy practice.',
  reflection_prompt: 'What is one advocacy skill you want to practice before you start working with clients?',
  key_terms: ['advocacy quiz', 'participant rights', 'self-advocacy', 'systems advocacy', 'empowerment'],
  competency_keys: ['advocacy_empowerment', 'participant_rights'],
  job_application: 'Advocacy content appears on the CPRS exam and in every client interaction involving systems navigation.',
  watch_for: ['Know the difference between self-advocacy and systems advocacy', 'Know key participant rights in behavioral health', 'Know how to document advocacy efforts'],
  script_text: `Checkpoint for Module 5. You should be able to explain the difference between self-advocacy and systems advocacy, describe key participant rights in behavioral health settings, demonstrate self-advocacy skill-building strategies, and explain how to document and escalate systemic barriers. Score 70% or higher to proceed.`,
},

// ── MODULE 6 ──────────────────────────────────────────────────────────────────
{
  lesson_slug: 'peer-mod-6-peer-6-1',
  summary_text: 'Introduces community resource mapping and how peer specialists build and maintain a working knowledge of local services.',
  reflection_prompt: 'What resources do you already know about in your community, and what gaps have you noticed?',
  key_terms: ['resource mapping', 'community assets', 'warm handoff', 'referral', '211'],
  competency_keys: ['resource_navigation', 'community_connections'],
  job_application: 'Build and maintain a personal resource directory organized by need category: housing, food, employment, treatment, legal, transportation.',
  watch_for: ['Resources change — verify before referring', 'Know eligibility requirements before sending someone to a resource', 'A referral without follow-up is often a referral that fails'],
  script_text: `Resource navigation is a core peer specialist function. Participants often need help connecting to housing, food, employment, treatment, legal services, transportation, and childcare. As a PRS you build a working knowledge of local resources and keep it current.

Key tools: 211 (national resource hotline), local resource directories, agency partnerships, and your own community knowledge. A warm handoff — personally introducing the participant to the next provider — is far more effective than handing someone a phone number.

Build your resource directory before you need it. Organize by need category. Note eligibility requirements, hours, contact names, and any barriers to access. Update it regularly — programs close, funding runs out, and eligibility rules change.

Your community knowledge is a professional asset. The more you know about what exists and how to access it, the more effective you will be.`,
},
{
  lesson_slug: 'peer-mod-6-peer-6-2',
  summary_text: 'Covers the warm handoff process, how to make effective referrals, and how to follow up to ensure linkage was successful.',
  reflection_prompt: 'Think of a time a referral failed. What broke down and what would a warm handoff have changed?',
  key_terms: ['warm handoff', 'referral', 'follow-up', 'linkage', 'care coordination'],
  competency_keys: ['resource_navigation', 'rapport_trust_building'],
  job_application: 'When referring a client to a new provider, call ahead, introduce the client by name, explain the context, and schedule a follow-up to confirm the connection was made.',
  watch_for: ['Cold referrals fail at high rates — especially for people with trauma histories', 'Follow-up is not optional', 'Document referrals and outcomes in case notes'],
  script_text: `A warm handoff means personally connecting the participant to the next service rather than just giving them a number. This includes calling ahead, making an introduction, explaining the context (with consent), and following up to confirm the connection was made.

Warm handoffs are especially important for participants with trauma histories, distrust of systems, or previous experiences of being turned away. The relationship you have built is a bridge to the next service.

Steps for an effective warm handoff:
1. Get consent to share information with the receiving provider
2. Call ahead and introduce the client by name
3. Briefly explain the context and what the client needs
4. If possible, accompany the client to the first appointment
5. Follow up within 48-72 hours to confirm the connection was made

Document every referral: who you referred to, when, what was communicated, and the outcome. If the referral failed, document why and what you did next.`,
},
{
  lesson_slug: 'peer-mod-6-peer-6-3',
  summary_text: 'Addresses barriers to service access including transportation, documentation, eligibility, and systemic discrimination.',
  reflection_prompt: 'What is the most common barrier to service access you have seen in your community, and what creative solutions have worked?',
  key_terms: ['access barriers', 'transportation', 'documentation', 'eligibility', 'systemic discrimination'],
  competency_keys: ['resource_navigation', 'advocacy_empowerment'],
  job_application: 'A client cannot get to treatment because they have no transportation and no ID. Help them access transit assistance and connect them to an ID recovery program before the appointment.',
  watch_for: ['Barriers are often stacked — one problem creates another', 'Do not assume the client is not motivated if they cannot navigate barriers alone', 'Document barriers in case notes to support systemic advocacy'],
  script_text: `Common barriers to service access include: lack of transportation, missing identification documents, insurance gaps, eligibility restrictions, language barriers, childcare needs, work schedule conflicts, and past negative experiences with systems.

Barriers are often stacked. A client who needs treatment may also need an ID to enroll, transportation to get there, childcare to attend, and a phone to stay in contact. Each barrier compounds the others.

As a PRS you help participants identify and address barriers one at a time. You also document patterns of barriers to support systemic advocacy.

A participant who cannot get to treatment is not unmotivated — they are facing real obstacles that require real solutions. Your job is to help them solve the problems, not judge their commitment.

Know your local resources for each common barrier: transit assistance programs, ID recovery services, insurance enrollment navigators, childcare subsidies, and language interpretation services.`,
},
{
  lesson_slug: 'peer-mod-6-peer-6-4',
  summary_text: 'Module 6 checkpoint covering resource navigation, warm handoffs, referral follow-up, and barrier removal.',
  reflection_prompt: 'What is one resource gap in your community that you want to address through advocacy?',
  key_terms: ['resource navigation quiz', 'warm handoff', 'referral', 'barriers', 'linkage'],
  competency_keys: ['resource_navigation', 'community_connections', 'advocacy_empowerment'],
  job_application: 'Resource navigation and linkage content appears on the CPRS exam and is central to daily peer specialist work.',
  watch_for: ['Know the difference between a warm handoff and a cold referral', 'Know common barriers and strategies to address them', 'Know how to document referrals and follow-up'],
  script_text: `Checkpoint for Module 6. You should be able to describe the resource mapping process, explain the warm handoff and why it matters, identify common barriers to service access and strategies to address them, and explain how to document referrals and follow-up. Score 70% or higher to proceed.`,
},

// ── MODULE 7 ──────────────────────────────────────────────────────────────────
{
  lesson_slug: 'peer-mod-7-peer-7-1',
  summary_text: 'Defines crisis in behavioral health, explains the peer specialist\'s role in crisis support, and distinguishes it from clinical crisis intervention.',
  reflection_prompt: 'What does it feel like to be in crisis, and what kind of support actually helped versus made things worse?',
  key_terms: ['crisis', 'crisis support', 'de-escalation', 'safety planning', 'scope of practice'],
  competency_keys: ['crisis_support_safety', 'professional_boundaries_intro'],
  job_application: 'When a participant appears to be in crisis, your first job is to stay calm, stay present, and assess safety — not to fix the crisis alone.',
  watch_for: ['Do not attempt clinical crisis intervention — that is outside PRS scope', 'Your calm presence is itself a de-escalation tool', 'Know your agency\'s crisis protocol before you need it'],
  script_text: `A crisis is any situation in which a person's safety or stability is acutely threatened. In behavioral health this includes suicidal ideation, acute psychiatric symptoms, overdose, domestic violence, and severe emotional dysregulation.

As a PRS your role in crisis is to stay calm, stay present, assess immediate safety, and connect the participant to appropriate crisis services. You are not a crisis clinician. You do not manage crises alone. You know your agency's protocol and you follow it.

Before your first day on the job, know:
- Your agency's crisis response protocol
- The local crisis line number
- The nearest crisis stabilization unit
- When to call 911 and how to do it safely
- How to document a crisis interaction

Your calm presence is itself a de-escalation tool. If you are anxious or reactive, the participant will feel it. Practice regulating yourself so you can be steady when someone else cannot be.`,
},
{
  lesson_slug: 'peer-mod-7-peer-7-2',
  summary_text: 'Covers suicide risk awareness and how peer specialists respond to disclosures of suicidal ideation within their scope of practice.',
  reflection_prompt: 'What would make it easier or harder for you to ask a client directly about suicidal thoughts?',
  key_terms: ['suicidal ideation', 'risk awareness', 'direct questioning', 'safety planning', 'mandatory reporting'],
  competency_keys: ['crisis_support_safety', 'mandatory_reporting'],
  job_application: 'If a client hints at not wanting to be here anymore, ask directly: "Are you thinking about suicide?" Asking does not plant the idea — it opens the door.',
  watch_for: ['Do not conduct clinical suicide risk assessments — that is outside PRS scope', 'Asking directly about suicide does not increase risk', 'Every disclosure of suicidal ideation requires supervisor notification and documentation'],
  script_text: `Peer specialists are not trained to conduct clinical suicide risk assessments. That is the role of a licensed clinician. But peer specialists are often the first person a client tells — and how you respond in that moment matters enormously.

If a client discloses suicidal ideation:
1. Stay calm. Do not panic or overreact.
2. Ask directly: "Are you thinking about suicide?" Direct questions do not increase risk — they reduce it by opening the conversation.
3. Listen without judgment.
4. Do not leave the person alone if you believe they are in immediate danger.
5. Notify your supervisor immediately.
6. Connect the client to clinical crisis support.
7. Document the disclosure and your response.

You are not responsible for preventing every suicide. You are responsible for responding appropriately, following your agency's protocol, and getting the person connected to the right level of care.`,
},
{
  lesson_slug: 'peer-mod-7-peer-7-3',
  summary_text: 'Teaches de-escalation techniques for supporting participants in acute emotional distress.',
  reflection_prompt: 'What de-escalation strategies have worked on you when you were in distress, and what made them effective?',
  key_terms: ['de-escalation', 'emotional regulation', 'grounding', 'validation', 'trauma-informed response'],
  competency_keys: ['crisis_support_safety', 'active_listening_empathy'],
  job_application: 'When a participant is escalating, lower your voice, slow your pace, validate their feelings, and avoid power struggles.',
  watch_for: ['Matching escalation with escalation makes things worse', 'Validation does not mean agreement', 'Physical safety comes first — know when to step back and call for help'],
  script_text: `De-escalation is the process of reducing the intensity of a crisis through calm, respectful, trauma-informed engagement.

Key de-escalation techniques:
- Speak slowly and calmly — your tone regulates the room
- Reduce environmental stimulation when possible
- Validate feelings without agreeing with all behaviors: "I can see you're really frustrated right now"
- Offer choices to restore a sense of control: "Would you like to sit down or step outside for a minute?"
- Use grounding techniques: focus on the present moment, breathing, sensory awareness
- Avoid power struggles — you will not win them and they escalate the situation

What not to do:
- Do not raise your voice to match theirs
- Do not issue ultimatums
- Do not crowd the person's physical space
- Do not argue about facts when someone is emotionally flooded

Your own regulation is the first tool. If you are anxious, reactive, or triggered, you cannot de-escalate someone else. Practice self-regulation before you need it in the field.`,
},
{
  lesson_slug: 'peer-mod-7-peer-7-4',
  summary_text: 'Explains mandatory reporting obligations and how peer specialists navigate confidentiality when safety is at risk.',
  reflection_prompt: 'How do you balance a participant\'s right to confidentiality with your obligation to report when safety is at risk?',
  key_terms: ['mandatory reporting', 'duty to warn', 'confidentiality limits', 'imminent danger', 'documentation'],
  competency_keys: ['mandatory_reporting', 'ethics_professional_conduct'],
  job_application: 'Explain confidentiality limits to clients at the start of your relationship — not after a disclosure.',
  watch_for: ['Mandatory reporting is not optional — failure to report can result in liability and certification loss', 'Explain confidentiality limits at intake not after a disclosure', 'Document all safety-related disclosures and actions taken'],
  script_text: `Confidentiality has limits. Peer specialists are required to report when:
- A participant discloses imminent danger to themselves or others
- There is suspected abuse or neglect of a child or vulnerable adult
- A court order requires disclosure
- Other situations defined by state law and agency policy

The duty to warn requires that identifiable third parties be warned when a participant makes a credible threat against them.

As a PRS you must know your agency's reporting procedures and follow them. Ignorance of the requirement is not a defense.

Best practice: explain confidentiality limits to every client at the beginning of your relationship. Say something like: "Everything we talk about stays between us, with a few exceptions. If I believe you are in danger of hurting yourself or someone else, I am required to report that. I want you to know that upfront."

This conversation is not a threat — it is honesty. And it is far better to have it before a disclosure than after.`,
},
{
  lesson_slug: 'peer-mod-7-peer-7-5',
  summary_text: 'Module 7 checkpoint covering crisis recognition, suicide response, de-escalation, and mandatory reporting.',
  reflection_prompt: 'What is the most important thing you learned in this module about your role in a crisis situation?',
  key_terms: ['crisis quiz', 'suicide response', 'de-escalation', 'mandatory reporting', 'scope of practice'],
  competency_keys: ['crisis_support_safety', 'mandatory_reporting'],
  job_application: 'Crisis support content is heavily tested on the CPRS exam and is essential for safe practice.',
  watch_for: ['Know the limits of PRS scope in crisis situations', 'Know how to respond to a suicide disclosure', 'Know mandatory reporting triggers'],
  script_text: `Checkpoint for Module 7. You should be able to describe the PRS role in crisis support and its limits, explain how to respond to a disclosure of suicidal ideation, demonstrate de-escalation principles, and identify mandatory reporting obligations. Score 70% or higher to proceed.`,
},

// ── MODULE 8 ──────────────────────────────────────────────────────────────────
{
  lesson_slug: 'peer-mod-8-peer-8-1',
  summary_text: 'Prepares learners for the practicum experience including expectations, documentation of hours, and how to get the most from supervised field work.',
  reflection_prompt: 'What do you most want to learn during your practicum, and how will you communicate that to your supervisor?',
  key_terms: ['practicum', 'supervised hours', 'field experience', 'learning goals', 'competency demonstration'],
  competency_keys: ['certification_prep', 'professional_development'],
  job_application: 'Before your first practicum day, write down three specific skills you want to practice and share them with your supervisor.',
  watch_for: ['Practicum hours must be documented accurately', 'Use supervision time to debrief difficult interactions', 'The practicum is a learning experience — mistakes are expected and should be discussed'],
  script_text: `The practicum is your supervised field experience. It is where you apply everything from this training in real interactions with real participants under the guidance of a qualified supervisor.

Practicum requirements for CPRS in Indiana: a minimum number of supervised hours working directly with people in recovery. Check current DMHA requirements for the exact number.

Expectations during practicum:
- Show up reliably and on time
- Document your hours accurately on the required forms
- Bring questions and challenges to supervision
- Practice the skills you have learned — do not just observe
- Ask for feedback after interactions
- Debrief difficult situations with your supervisor before they become problems

The practicum is not just a requirement to check off. It is the most important part of your preparation for independent practice. Treat every interaction as a learning opportunity.`,
},
{
  lesson_slug: 'peer-mod-8-peer-8-2',
  summary_text: 'Covers documentation standards, case note writing, and professional communication in peer support settings.',
  reflection_prompt: 'Why does documentation matter for a peer specialist, and what are the risks of poor documentation?',
  key_terms: ['documentation', 'case notes', 'DAP notes', 'professional communication', 'legal record'],
  competency_keys: ['documentation_skills', 'professional_identity'],
  job_application: 'Write a case note that documents a participant interaction, the support provided, any referrals made, and the follow-up plan — without including clinical assessments or diagnoses.',
  watch_for: ['Case notes are legal documents', 'Do not document opinions or judgments about the participant', 'If it is not documented it did not happen'],
  script_text: `Documentation is a professional and legal obligation. Case notes should be objective, factual, timely, and focused on what was done and what was planned.

Common formats:
- DAP notes: Data (what happened), Assessment (your observations), Plan (next steps)
- SOAP notes: Subjective, Objective, Assessment, Plan

As a PRS your notes document the support you provided, referrals made, participant responses, and follow-up plans. You do not document clinical assessments or diagnoses — that is outside your scope.

Rules for case notes:
- Write in the third person or first person consistently — follow your agency's standard
- Be specific: "Client reported missing two AA meetings this week" not "Client seems unmotivated"
- Document facts, not interpretations
- Complete notes within 24 hours of the interaction
- Never alter a note after the fact without following your agency's amendment procedure

Case notes may be reviewed by supervisors, auditors, billing staff, and courts. Write as if anyone might read it.`,
},
{
  lesson_slug: 'peer-mod-8-peer-8-3',
  summary_text: 'Reviews the CPRS exam structure, content domains, eligibility requirements, and test-taking strategies.',
  reflection_prompt: 'Which content domain feels least solid for you right now, and what is your plan to strengthen it before the exam?',
  key_terms: ['CPRS exam', 'IC&RC', 'content domains', 'eligibility', 'test-taking strategies'],
  competency_keys: ['certification_prep', 'professional_identity'],
  job_application: 'Know the IC&RC exam domains, the eligibility requirements, and the application process before your practicum ends.',
  watch_for: ['The CPRS exam is competency-based not just knowledge-based', 'Practice applying concepts to scenarios not just memorizing definitions', 'Exam anxiety is real — build a preparation routine'],
  script_text: `The CPRS exam is administered by IC&RC (International Certification and Reciprocity Consortium). Indiana uses the IC&RC Peer Recovery Support Specialist exam.

Exam domains (approximate weighting):
- Advocacy: supporting clients in navigating systems and exercising rights
- Ethical Responsibility: applying the code of ethics and confidentiality rules
- Mentoring and Education: sharing lived experience, teaching recovery skills
- Recovery and Wellness Support: applying recovery models, wellness planning, relapse prevention

Eligibility requirements: completion of approved training hours, supervised practicum hours, and passing the written exam. Verify current requirements with DMHA before applying.

Test-taking strategies:
- Read every question carefully — scenario questions often have two plausible answers
- Eliminate clearly wrong answers first
- When in doubt, apply the peer support values framework: person-centered, strengths-based, non-judgmental
- Manage your time — do not spend too long on any one question
- Review flagged questions if time allows`,
},
{
  lesson_slug: 'peer-mod-8-peer-8-4',
  summary_text: 'Practice exam covering all eight modules to assess readiness for the CPRS certification exam.',
  reflection_prompt: 'After the practice exam, which domains need the most review before your actual exam?',
  key_terms: ['practice exam', 'CPRS readiness', 'domain review', 'scenario questions', 'exam preparation'],
  competency_keys: ['certification_prep', 'prs_role_definition', 'ethics_professional_conduct', 'recovery_models'],
  job_application: 'Use your practice exam results to build a targeted study plan for the two weeks before your CPRS exam.',
  watch_for: ['A low score on the practice exam is information, not failure — use it to guide your review', 'Focus extra time on domains where you scored below 70%', 'Scenario questions require applying principles, not just recalling facts'],
  script_text: `This practice exam covers all eight modules of the Peer Recovery Specialist program. It is designed to simulate the format and difficulty of the CPRS certification exam.

The practice exam includes scenario-based questions that require you to apply peer support principles to realistic situations. There are no trick questions — the correct answer is always the one most consistent with recovery-oriented, person-centered, ethical peer practice.

After completing the practice exam:
1. Review every question you got wrong
2. Identify which domain each wrong answer belongs to
3. Go back to the relevant module and review the content
4. Build a study plan focused on your weakest domains
5. Retake the practice exam after your review

Target score: 80% or higher before scheduling your actual CPRS exam.`,
},
{
  lesson_slug: 'peer-mod-8-peer-8-5',
  summary_text: 'Final program assessment and certification readiness review covering all eight modules.',
  reflection_prompt: 'Looking back at everything you have learned, what has changed most in how you see yourself as a peer recovery specialist?',
  key_terms: ['final assessment', 'CPRS readiness', 'program completion', 'professional identity', 'next steps'],
  competency_keys: ['certification_prep', 'professional_identity', 'prs_role_definition', 'ethics_professional_conduct'],
  job_application: 'Complete the final assessment, review any domains where you scored below 80%, and submit your CPRS application within 30 days of completing your practicum hours.',
  watch_for: ['Review all eight modules before the final assessment', 'Know the CPRS application process and deadlines', 'Completing this training is the beginning, not the end'],
  script_text: `Final assessment for the Peer Recovery Specialist program. This assessment covers all eight modules: Foundations of Peer Recovery Support, Ethics and Professional Conduct, Recovery Models and Wellness, Peer Support Skills, Advocacy and Empowerment, Resource Navigation and Linkage, Crisis Support and Safety, and Field Practicum and Certification Prep.

Score 80% or higher to receive your certificate of completion and be cleared to apply for the CPRS exam.

Next steps after completing this program:
1. Complete your supervised practicum hours
2. Submit your CPRS application to IC&RC through DMHA
3. Schedule and pass the CPRS exam
4. Begin your career as a credentialed Peer Recovery Specialist

You have done the work. The people you will support are waiting. Go do the job.`,
},

];
