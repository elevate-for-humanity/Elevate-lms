// PARS AI Knowledge System - Program Blueprints & Interview Questions
// Comprehensive scoring rubrics for each program pathway

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  scoringRubric: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
  weight: number;
}

export interface ProgramBlueprint {
  id: string;
  name: string;
  description: string;
  duration: string;
  credentials: string[];
  careerPaths: string[];
  targetProfile: {
    traits: string[];
    background: string[];
    goals: string[];
  };
  interviewQuestions: InterviewQuestion[];
  fundingTiers: {
    tier1: { min: number; max: number; criteria: string[] };
    tier2: { min: number; max: number; criteria: string[] };
    tier3: { min: number; max: number; criteria: string[] };
  };
}

export const PARS_KNOWLEDGE: Record<string, ProgramBlueprint> = {
  data_science: {
    id: "data_science",
    name: "Data Science & Machine Learning",
    description: "Master data analysis, statistical modeling, and ML algorithms to extract insights from complex datasets.",
    duration: "16 weeks",
    credentials: ["Google Data Analytics Certificate", "IBM Data Science Certificate", "Capstone Project"],
    careerPaths: ["Data Scientist", "ML Engineer", "Data Analyst", "AI Research Scientist"],
    targetProfile: {
      traits: ["Analytical mindset", "Curiosity", "Attention to detail", "Persistence", "Mathematical aptitude"],
      background: ["Basic programming", "Statistics knowledge", "SQL proficiency", "Python fundamentals"],
      goals: ["Transition to tech", "Build ML models", "Data-driven decision making", "AI innovation"]
    },
    interviewQuestions: [
      { id: "ds_1", question: "Tell me about a dataset you worked with and what insights you derived from it.", category: "Data Experience", scoringRubric: { 1: "No relevant data experience mentioned", 2: "Basic data work with minimal analysis described", 3: "Moderate project with clear methodology shown", 4: "Strong analytical project with multiple insights derived", 5: "Complex project demonstrating advanced analysis, visualization, and business impact" }, weight: 1.2 },
      { id: "ds_2", question: "How would you approach analyzing a dataset with missing values and outliers?", category: "Technical Skills", scoringRubric: { 1: "No strategy for handling data quality issues", 2: "Vague mention of removing bad data", 3: "Basic techniques like mean imputation mentioned", 4: "Comprehensive approach with multiple strategies discussed", 5: "Advanced techniques including multiple imputation, outlier detection algorithms, and business context considerations" }, weight: 1.3 },
      { id: "ds_3", question: "Explain the difference between supervised and unsupervised learning with examples.", category: "Conceptual Knowledge", scoringRubric: { 1: "Cannot distinguish between learning types", 2: "Basic distinction made without examples", 3: "Clear explanation with one example each", 4: "Detailed explanation with real-world applications and algorithm examples", 5: "Comprehensive coverage including hybrid approaches and advanced use cases" }, weight: 1.0 },
      { id: "ds_4", question: "Describe a time when your data analysis changed someone's mind or influenced a decision.", category: "Impact & Communication", scoringRubric: { 1: "No example of data-driven influence", 2: "Minor influence without clear outcome", 3: "Clear example with measurable outcome", 4: "Strong story with business impact quantified", 5: "Compelling narrative with significant organizational change driven by insights" }, weight: 1.1 },
      { id: "ds_5", question: "What programming languages and tools are you familiar with for data analysis?", category: "Technical Proficiency", scoringRubric: { 1: "No programming experience", 2: "Basic Excel or spreadsheet skills only", 3: "Some Python or R experience with libraries", 4: "Multiple languages with specific library expertise", 5: "Full stack data science toolkit including cloud platforms and deployment" }, weight: 1.2 },
      { id: "ds_6", question: "How do you stay current with developments in data science and ML?", category: "Learning Agility", scoringRubric: { 1: "No strategy for staying current", 2: "Occasional reading without structure", 3: "Follows some blogs or communities", 4: "Active learner with defined resources and practice", 5: "Engages with research papers, contributes to communities, experiments with new techniques" }, weight: 1.0 },
      { id: "ds_7", question: "Walk me through how you would build a model to predict customer churn.", category: "Problem Solving", scoringRubric: { 1: "No structured approach to the problem", 2: "Basic outline without technical depth", 3: "Clear steps from data prep to model selection", 4: "Comprehensive approach including feature engineering and model evaluation", 5: "Production-ready thinking with deployment, monitoring, and business integration" }, weight: 1.3 },
      { id: "ds_8", question: "What do you hope to achieve after completing this data science program?", category: "Motivation & Fit", scoringRubric: { 1: "Unclear or unrealistic goals", 2: "Vague interest in tech careers", 3: "Clear career transition goals stated", 4: "Specific role and timeline with realistic plan", 5: "Comprehensive roadmap with intermediate milestones and long-term vision" }, weight: 1.1 }
    ],
    fundingTiers: { tier1: { min: 70, max: 79, criteria: ["Demonstrated analytical aptitude", "Clear career transition plan", "Basic technical foundation"] }, tier2: { min: 80, max: 89, criteria: ["Strong data project portfolio", "Professional growth evidence", "Technical prerequisites met"] }, tier3: { min: 90, max: 100, criteria: ["Exceptional analytical thinking", "Published or presented work", "Industry connections or referrals"] } }
  },
  cloud_devops: {
    id: "cloud_devops",
    name: "Cloud Engineering & DevOps",
    description: "Learn cloud infrastructure, CI/CD pipelines, containerization, and site reliability engineering practices.",
    duration: "14 weeks",
    credentials: ["AWS Solutions Architect", "Kubernetes Administrator", "Terraform Associate"],
    careerPaths: ["Cloud Engineer", "DevOps Engineer", "SRE", "Platform Engineer", "Infrastructure Architect"],
    targetProfile: { traits: ["Systems thinking", "Automation mindset", "Debugging skills", "Collaboration", "Documentation habit"], background: ["Command line proficiency", "Basic scripting", "Networking fundamentals", "Version control"], goals: ["Cloud certification", "Infrastructure as code", "Career advancement", "Multi-cloud expertise"] },
    interviewQuestions: [
      { id: "cd_1", question: "Describe your experience with cloud platforms and what you've deployed.", category: "Cloud Experience", scoringRubric: { 1: "No cloud experience", 2: "Basic familiarity with one platform", 3: "Hands-on experience with deployments and services", 4: "Multi-cloud experience with advanced services", 5: "Production-grade implementations with thousands of users" }, weight: 1.2 },
      { id: "cd_2", question: "How would you design a CI/CD pipeline for a microservices application?", category: "DevOps Practices", scoringRubric: { 1: "No understanding of CI/CD concepts", 2: "Basic pipeline understanding without specifics", 3: "Standard pipeline with build, test, deploy stages", 4: "Advanced pipeline with security scanning, canary deployments, rollback", 5: "Enterprise-grade pipeline with GitOps, feature flags, observability, and SRE practices" }, weight: 1.3 },
      { id: "cd_3", question: "Explain Infrastructure as Code. Why is it important and what tools have you used?", category: "IaC Knowledge", scoringRubric: { 1: "No concept of IaC", 2: "Basic definition without tool experience", 3: "Hands-on with Terraform or CloudFormation", 4: "Multi-tool experience with best practices", 5: "Advanced patterns including modules, state management, policy-as-code" }, weight: 1.2 },
      { id: "cd_4", question: "Tell me about a time you debugged a production issue under pressure.", category: "Troubleshooting", scoringRubric: { 1: "No relevant experience", 2: "Minor issue resolution without stress", 3: "Clear incident with resolution process shown", 4: "Complex incident with systematic debugging approach", 5: "Multi-team coordination, root cause analysis, and preventive measures implemented" }, weight: 1.3 },
      { id: "cd_5", question: "How do you approach containerization and orchestration for an application?", category: "Container Knowledge", scoringRubric: { 1: "No container experience", 2: "Basic Docker knowledge", 3: "Docker experience with docker-compose", 4: "Kubernetes experience with deployments, services, ingress", 5: "Advanced Kubernetes including Helm, operators, service mesh, autoscaling" }, weight: 1.2 },
      { id: "cd_6", question: "What monitoring and observability tools do you use or want to learn?", category: "Observability", scoringRubric: { 1: "No monitoring experience", 2: "Basic logging or single metric tool", 3: "Familiar with standard stack (Prometheus, Grafana, ELK)", 4: "Advanced observability with distributed tracing, alerting", 5: "Full observability with SLOs, error budgets, chaos engineering" }, weight: 1.1 },
      { id: "cd_7", question: "Describe your scripting and automation experience.", category: "Automation Skills", scoringRubric: { 1: "No scripting experience", 2: "Basic shell scripts", 3: "Scripting in Python or similar for automation", 4: "Advanced automation with configuration management", 5: "Full automation framework development, self-healing systems" }, weight: 1.1 },
      { id: "cd_8", question: "Where do you see the DevOps/SRE field heading in the next 5 years?", category: "Industry Awareness", scoringRubric: { 1: "No awareness of industry trends", 2: "Basic familiarity with current tools", 3: "Aware of major trends like GitOps, platform engineering", 4: "Deep understanding of trends with informed opinions", 5: "Thought leader perspective on future of operations, FinOps, platform teams" }, weight: 1.0 }
    ],
    fundingTiers: { tier1: { min: 65, max: 74, criteria: ["Basic Linux and networking knowledge", "Command line proficiency", "Clear DevOps interest"] }, tier2: { min: 75, max: 84, criteria: ["Some CI/CD experience", "Container basics", "Scripting skills"] }, tier3: { min: 85, max: 100, criteria: ["Production infrastructure experience", "Multiple cloud platforms", "Open source contributions"] } }
  },
  product_management: {
    id: "product_management",
    name: "Product Management",
    description: "Develop skills in product strategy, roadmapping, user research, agile methodologies, and stakeholder management.",
    duration: "12 weeks",
    credentials: ["Scrum.org PSM I", "Product School Certificate", "AWS Cloud Practitioner"],
    careerPaths: ["Product Manager", "Associate PM", "Product Owner", "VP of Product", "CPO"],
    targetProfile: { traits: ["Empathy", "Strategic thinking", "Communication", "Decision making", "Cross-functional leadership"], background: ["Business acumen", "Customer interaction", "Project coordination", "Basic analytics"], goals: ["PM role transition", "Product leadership", "Startup founding", "Tech management"] },
    interviewQuestions: [
      { id: "pm_1", question: "Describe a product you use regularly. What would you improve and why?", category: "Product Sense", scoringRubric: { 1: "Cannot articulate product strengths or weaknesses", 2: "Surface-level observations without depth", 3: "Clear identification of 1-2 improvements with rationale", 4: "Multi-dimensional analysis including user segments, tradeoffs", 5: "Comprehensive analysis with data backing, prioritization framework, and business impact" }, weight: 1.3 },
      { id: "pm_2", question: "Tell me about a time you had to make a decision with incomplete information.", category: "Decision Making", scoringRubric: { 1: "No example of decision-making under uncertainty", 2: "Avoided decision or deferred to others", 3: "Clear example with reasoning process shown", 4: "Structured approach with risk assessment and contingencies", 5: "Sophisticated decision framework with data triangulation and outcome learning" }, weight: 1.2 },
      { id: "pm_3", question: "How do you prioritize features when you have limited resources and time?", category: "Prioritization", scoringRubric: { 1: "No prioritization framework", 2: "Basic approach like first-come-first-served", 3: "Known framework like RICE or MoSCoW applied", 4: "Multi-factor analysis with stakeholder input", 5: "Dynamic prioritization with continuous reevaluation and clear success metrics" }, weight: 1.3 },
      { id: "pm_4", question: "How do you gather and incorporate customer feedback into product decisions?", category: "Customer Centricity", scoringRubric: { 1: "No customer feedback experience", 2: "Basic feedback collection without systematic approach", 3: "Multiple feedback channels with basic analysis", 4: "Comprehensive feedback system with synthesis and prioritization", 5: "Deep customer intimacy program with quantitative and qualitative insights driving roadmap" }, weight: 1.2 },
      { id: "pm_5", question: "Describe how you work with engineering teams. How do you handle technical constraints?", category: "Stakeholder Management", scoringRubric: { 1: "No experience working with technical teams", 2: "Dictated requirements without consultation", 3: "Collaborative approach with some technical understanding", 4: "Strong partnership with engineering, technical debt awareness", 5: "True product-engineering partnership with technical strategy input and innovation proposals" }, weight: 1.1 },
      { id: "pm_6", question: "Tell me about a product failure. What did you learn from it?", category: "Growth Mindset", scoringRubric: { 1: "Cannot identify any product failures", 2: "Blamed external factors without learning", 3: "Clear failure with lessons identified", 4: "Deep reflection with process changes implemented", 5: "Transformative learning shared with team, driving organizational change" }, weight: 1.2 },
      { id: "pm_7", question: "How do you define and measure success for a product or feature?", category: "Metrics & Analytics", scoringRubric: { 1: "No framework for measuring success", 2: "Vanity metrics without business correlation", 3: "Clear KPIs with baseline and targets", 4: "Comprehensive metrics framework with leading and lagging indicators", 5: "Full measurement system with experimentation, statistical significance, and business impact correlation" }, weight: 1.2 },
      { id: "pm_8", question: "What type of product organization or industry excites you most and why?", category: "Motivation & Fit", scoringRubric: { 1: "No clear direction or interest", 2: "Generic tech interest without specifics", 3: "Specific industry or company type mentioned", 4: "Clear alignment between background, goals, and target companies", 5: "Deep passion with relevant experience, unique insights, and authentic connection to mission" }, weight: 1.1 }
    ],
    fundingTiers: { tier1: { min: 68, max: 77, criteria: ["Business or customer-facing background", "Basic analytical skills", "Clear PM interest"] }, tier2: { min: 78, max: 87, criteria: ["Some product or project experience", "Stakeholder management", "Agile familiarity"] }, tier3: { min: 88, max: 100, criteria: ["Formal PM training or experience", "Product launches", "Cross-functional leadership"] } }
  },
  digital_marketing: {
    id: "digital_marketing",
    name: "Digital Marketing & Growth",
    description: "Master SEO, SEM, social media marketing, content strategy, analytics, and growth hacking techniques.",
    duration: "10 weeks",
    credentials: ["Google Ads Certification", "HubSpot Inbound Marketing", "Meta Marketing Science"],
    careerPaths: ["Digital Marketing Manager", "Growth Manager", "SEO Specialist", "Content Strategist", "CMO"],
    targetProfile: { traits: ["Creativity", "Analytical mindset", "Adaptability", "Data-driven", "Storytelling ability"], background: ["Marketing basics", "Social media proficiency", "Basic analytics", "Content creation"], goals: ["Marketing career launch", "Digital expertise", "Growth hacking", "Entrepreneurial marketing"] },
    interviewQuestions: [
      { id: "dm_1", question: "Walk me through how you would develop a digital marketing strategy for a new product.", category: "Strategy Development", scoringRubric: { 1: "No structured marketing approach", 2: "Basic social media or advertising mention", 3: "Multi-channel strategy with basic rationale", 4: "Comprehensive strategy with audience research, channel mix, budget allocation", 5: "Full growth strategy with funnel stages, attribution, testing roadmap, and scaling plan" }, weight: 1.3 },
      { id: "dm_2", question: "How do you measure the effectiveness of marketing campaigns?", category: "Analytics", scoringRubric: { 1: "No measurement approach", 2: "Vanity metrics like impressions or likes", 3: "Clear KPIs like conversion rates and ROAS", 4: "Multi-touch attribution with funnel analysis", 5: "Advanced analytics with cohort analysis, incrementality testing, and ML-driven optimization" }, weight: 1.3 },
      { id: "dm_3", question: "Tell me about a successful marketing campaign you ran or were part of.", category: "Execution & Results", scoringRubric: { 1: "No marketing campaign experience", 2: "Minimal results without context", 3: "Clear campaign with measurable outcomes", 4: "Strong campaign with optimization journey and learnings", 5: "Exceptional results with creative innovation, strategic testing, and industry recognition" }, weight: 1.2 },
      { id: "dm_4", question: "How do you stay current with digital marketing trends and algorithm changes?", category: "Industry Awareness", scoringRubric: { 1: "No strategy for staying current", 2: "Occasional reading without structure", 3: "Follows key influencers and publications", 4: "Active experimentation with new platforms and features", 5: "Thought leadership through content creation, community engagement, and trend prediction" }, weight: 1.0 },
      { id: "dm_5", question: "Describe your experience with content marketing and SEO.", category: "Content & SEO", scoringRubric: { 1: "No content or SEO experience", 2: "Basic social media posting", 3: "Blog or content creation with basic SEO", 4: "Comprehensive content strategy with technical SEO knowledge", 5: "Full content marketing system with editorial calendar, link building, and organic growth" }, weight: 1.1 },
      { id: "dm_6", question: "How would you approach paid advertising with a limited budget?", category: "Resource Optimization", scoringRubric: { 1: "No budget management experience", 2: "Generic advice without specifics", 3: "Clear channel selection and targeting approach", 4: "Test-and-learn framework with clear success metrics", 5: "Maximized impact through creative testing, audience research, and rapid iteration" }, weight: 1.2 },
      { id: "dm_7", question: "Tell me about a marketing experiment that failed. What did you learn?", category: "Growth Mindset", scoringRubric: { 1: "Cannot identify any marketing experiments", 2: "Blame external factors without learning", 3: "Clear failure with insights identified", 4: "Systematic testing culture demonstrated with iteration", 5: "Learning-driven culture established with shared learnings and process improvements" }, weight: 1.1 },
      { id: "dm_8", question: "What marketing tools and platforms are you proficient in?", category: "Technical Skills", scoringRubric: { 1: "No marketing tools experience", 2: "Basic social media scheduling tools", 3: "Standard stack like Google Analytics, Meta Business Manager", 4: "Multi-platform expertise with automation and CRM integration", 5: "Full marketing technology stack with attribution, personalization, and CDP" }, weight: 1.0 }
    ],
    fundingTiers: { tier1: { min: 65, max: 74, criteria: ["Social media presence", "Basic marketing interest", "Content creation experience"] }, tier2: { min: 75, max: 84, criteria: ["Marketing course completion", "Analytics familiarity", "Campaign management"] }, tier3: { min: 85, max: 100, criteria: ["Marketing certifications", "Portfolio of campaigns", "Proven results"] } }
  },
  ux_design: {
    id: "ux_design",
    name: "UX/UI Design",
    description: "Learn user experience design, wireframing, prototyping, usability testing, and design systems.",
    duration: "12 weeks",
    credentials: ["Google UX Design Certificate", "Figma Professional", "Portfolio Review"],
    careerPaths: ["UX Designer", "UI Designer", "Product Designer", "Design Lead", "Head of Design"],
    targetProfile: { traits: ["Empathy", "Visual design sense", "Problem solving", "Attention to detail", "User advocacy"], background: ["Design tools basics", "Basic drawing", "User research exposure", "Figma familiarity"], goals: ["Design career transition", "Portfolio development", "Design leadership", "Design systems"] },
    interviewQuestions: [
      { id: "ux_1", question: "Show me a design project you completed. Walk me through your process.", category: "Design Process", scoringRubric: { 1: "No design projects to share", 2: "Basic project without process clarity", 3: "Clear design process from research to delivery", 4: "Comprehensive process with user research, iteration, testing", 5: "End-to-end process with stakeholder management, constraints navigation, and measurable impact" }, weight: 1.3 },
      { id: "ux_2", question: "How do you conduct user research on a limited budget and timeline?", category: "Research Skills", scoringRubric: { 1: "No research methodology knowledge", 2: "Generic research suggestion without specifics", 3: "Lean research methods like guerrilla testing", 4: "Multi-method approach with research synthesis", 5: "Strategic research with guerrilla + systematic methods, stakeholder alignment, and actionable insights" }, weight: 1.2 },
      { id: "ux_3", question: "Describe how you balance user needs with business goals.", category: "Strategic Thinking", scoringRubric: { 1: "No understanding of business constraints", 2: "Pure user focus without business consideration", 3: "Balanced approach with examples", 4: "Framework for resolving tensions between user and business", 5: "Win-win solutions that delight users while achieving business outcomes" }, weight: 1.2 },
      { id: "ux_4", question: "What design tools are you proficient in?", category: "Technical Skills", scoringRubric: { 1: "No design tools experience", 2: "Basic tools like Canva or PowerPoint", 3: "Figma or Sketch with basic features", 4: "Advanced Figma with components, auto-layout, prototyping", 5: "Full design system mastery, dev handoff, and tool integration" }, weight: 1.1 },
      { id: "ux_5", question: "Tell me about a time you had to defend a design decision to stakeholders.", category: "Communication", scoringRubric: { 1: "No stakeholder presentation experience", 2: "Followed stakeholder direction without pushback", 3: "Defended design with user research backing", 4: "Persuasive presentation with multiple data points", 5: "Executive-level presentation with business case, user evidence, and compromise navigation" }, weight: 1.2 },
      { id: "ux_6", question: "How do you approach accessibility in your designs?", category: "Inclusive Design", scoringRubric: { 1: "No accessibility knowledge", 2: "Basic awareness without implementation", 3: "WCAG guidelines familiarity", 4: "Accessibility built into design process", 5: "Accessibility champion with inclusive research, testing with disabled users, advocacy" }, weight: 1.1 },
      { id: "ux_7", question: "Describe your experience with design systems.", category: "Systems Thinking", scoringRubric: { 1: "No design system experience", 2: "Used component libraries without creating", 3: "Created or maintained small component library", 4: "Design system contribution with documentation", 5: "Full design system ownership with tokens, governance, and cross-platform consistency" }, weight: 1.0 },
      { id: "ux_8", question: "What area of UX design are you most passionate about and why?", category: "Motivation & Fit", scoringRubric: { 1: "No specific UX interest", 2: "Generic interest in making things look good", 3: "Clear specialty area with reasoning", 4: "Passionate area with relevant projects and growth path", 5: "Deep expertise with unique perspective, published work, and industry contribution" }, weight: 1.1 }
    ],
    fundingTiers: { tier1: { min: 65, max: 74, criteria: ["Basic design interest", "Visual creativity", "User-centric mindset"] }, tier2: { min: 75, max: 84, criteria: ["Design tool proficiency", "Some portfolio work", "User research basics"] }, tier3: { min: 85, max: 100, criteria: ["Professional portfolio", "Design education or experience", "Design community"] } }
  },
  cybersecurity: {
    id: "cybersecurity",
    name: "Cybersecurity",
    description: "Develop skills in network security, ethical hacking, incident response, and security compliance.",
    duration: "16 weeks",
    credentials: ["CompTIA Security+", "CEH Preparation", "CySA+ Preparation"],
    careerPaths: ["Security Analyst", "SOC Analyst", "Penetration Tester", "Security Engineer", "CISO"],
    targetProfile: { traits: ["Attention to detail", "Ethical integrity", "Problem solving", "Curiosity", "Continuous learning"], background: ["IT fundamentals", "Networking basics", "Operating systems", "Basic programming"], goals: ["Security certification", "SOC analyst role", "Pen testing", "Security leadership"] },
    interviewQuestions: [
      { id: "cs_1", question: "What motivated you to pursue a career in cybersecurity?", category: "Motivation", scoringRubric: { 1: "No clear motivation stated", 2: "Generic interest in tech or money", 3: "Genuine interest in security with some context", 4: "Strong personal or professional driver identified", 5: "Deep personal mission with relevant experience and long-term vision" }, weight: 1.0 },
      { id: "cs_2", question: "Describe the layers of the OSI model and how they relate to security.", category: "Technical Knowledge", scoringRubric: { 1: "Cannot describe OSI model", 2: "Basic layer knowledge without security relevance", 3: "Clear layers with security protocols mapped", 4: "Deep understanding with attack vectors at each layer", 5: "Expert-level correlation with modern threats, segmentation, and defense-in-depth" }, weight: 1.2 },
      { id: "cs_3", question: "What is the difference between symmetric and asymmetric encryption?", category: "Cryptography", scoringRubric: { 1: "No encryption knowledge", 2: "Basic distinction without examples", 3: "Clear explanation with use cases", 4: "Detailed comparison with algorithm examples", 5: "Comprehensive coverage including hybrid systems, key exchange, and real-world application" }, weight: 1.1 },
      { id: "cs_4", question: "How would you respond to a suspected security breach?", category: "Incident Response", scoringRubric: { 1: "No incident response knowledge", 2: "Basic call IT response", 3: "Basic containment and reporting steps", 4: "Structured incident response with forensics awareness", 5: "Full IR lifecycle with chain of custody, threat hunting, and lessons learned" }, weight: 1.3 },
      { id: "cs_5", question: "What security frameworks or compliance standards are you familiar with?", category: "Compliance", scoringRubric: { 1: "No framework knowledge", 2: "Heard of GDPR or SOC 2 but cannot explain", 3: "Familiar with one framework like NIST or ISO", 4: "Multiple frameworks with implementation experience", 5: "Expert-level knowledge with audit experience and gap assessment" }, weight: 1.1 },
      { id: "cs_6", question: "Describe your experience with vulnerability scanning and penetration testing.", category: "Assessment Skills", scoringRubric: { 1: "No assessment experience", 2: "Basic vulnerability scanner usage", 3: "Hands-on scanning and basic exploitation", 4: "Full penetration testing methodology with reporting", 5: "Advanced testing including web app, network, social engineering with remediation guidance" }, weight: 1.2 },
      { id: "cs_7", question: "How do you stay current with the latest security threats and vulnerabilities?", category: "Continuous Learning", scoringRubric: { 1: "No learning strategy", 2: "Occasional news without depth", 3: "Follows security feeds and publications", 4: "Active learning with labs and certifications", 5: "Community contributor with threat hunting practice and conference participation" }, weight: 1.1 },
      { id: "cs_8", question: "What is your ethical stance on hacking and penetration testing?", category: "Ethics", scoringRubric: { 1: "No ethical framework discussed", 2: "Ambiguous or concerning ethical stance", 3: "Clear ethical boundaries with reasoning", 4: "Strong ethical foundation with professional codes", 5: "Thoughtful ethical framework with real-world dilemma examples and resolution" }, weight: 1.2 }
    ],
    fundingTiers: { tier1: { min: 68, max: 77, criteria: ["IT background or degree", "Basic networking knowledge", "Security interest"] }, tier2: { min: 78, max: 87, criteria: ["Security certifications started", "Lab experience", "Compliance awareness"] }, tier3: { min: 88, max: 100, criteria: ["Active security practice", "CTF participation", "Security community"] } }
  }
};

export const PROGRAM_IDS = Object.keys(PARS_KNOWLEDGE);

export function getProgram(id: string): ProgramBlueprint | undefined {
  return PARS_KNOWLEDGE[id];
}

export function getAllQuestionsForProgram(programId: string): InterviewQuestion[] {
  return PARS_KNOWLEDGE[programId]?.interviewQuestions || [];
}

export function calculateWeightedScore(responses: Record<string, number>, programId: string): number {
  const program = PARS_KNOWLEDGE[programId];
  if (!program) return 0;
  
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  for (const question of program.interviewQuestions) {
    const response = responses[question.id];
    if (response !== undefined) {
      totalWeightedScore += response * question.weight;
      totalWeight += question.weight;
    }
  }
  
  return totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 20) : 0;
}

export function determineFundingTier(score: number, programId: string): string {
  const program = PARS_KNOWLEDGE[programId];
  if (!program) return "tier1";
  
  const { fundingTiers } = program;
  
  if (score >= fundingTiers.tier3.min) return "tier3";
  if (score >= fundingTiers.tier2.min) return "tier2";
  return "tier1";
}

export function getFundingRecommendation(score: number, programId: string): {
  tier: string;
  percentage: number;
  reasoning: string[];
} {
  const tier = determineFundingTier(score, programId);
  const program = PARS_KNOWLEDGE[programId];
  
  const percentages: Record<string, number> = {
    tier1: 25,
    tier2: 50,
    tier3: 75
  };
  
  return {
    tier,
    percentage: percentages[tier],
    reasoning: program.fundingTiers[tier as keyof typeof program.fundingTiers].criteria
  };
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  scoringRubric: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
  weight: number;
}

export interface ProgramBlueprint {
  id: string;
  name: string;
  description: string;
  duration: string;
  credentials: string[];
  careerPaths: string[];
  targetProfile: {
    traits: string[];
    background: string[];
    goals: string[];
  };
  interviewquestions: InterviewQuestion[];
  fundingTiers: {
    tier1: { min: number; max: number; criteria: string[]; };
    tier2: { min: number; max: number; criteria: string[]; };
    tier3: { min: number; max: number; criteria: string[]; };
  };
}

export const PARS_KNOWLEDGE: Record<string, ProgramBlueprint> = {
  data_science: {
    id: "data_science",
    name: "Data Science & Machine Learning",
    description: "Master data analysis, statistical modeling, and ML algorithms to extract insights from complex datasets.",
    duration: "16 weeks",
    credentials: ["Google Data Analytics Certificate", "IBM Data Science Certificate", "Capstone Project"],
    careerPaths: ["Data Scientist", "ML Engineer", "Data Analyst", "AI Research Scientist"],
    targetProfile: {
      traits: ["Analytical mindset", "Curiosity", "Attention to detail", "Persistence", "Mathematical aptitude"],
      background: ["Basic programming", "Statistics knowledge", "SQL proficiency", "Python fundamentals"],
      goals: ["Transition to tech", "Build ML models", "Data-driven decision making", "AI innovation"]
    },
    interviewQuestions: [
      {
        id: "ds_1",
        question: "Tell me about a dataset you worked with and what insights you derived from it.",
        category: "Data Experience",
        scoringRubric: {
          1: "No relevant data experience mentioned",
          2: "Basic data work with minimal analysis described",
          3: "Moderate project with clear methodology shown",
          4: "Strong analytical project with multiple insights derived",
          5: "Complex project demonstrating advanced analysis, visualization, and business impact"
        },
        weight: 1.2
      },
      {
        id: "ds_2",
        question: "How would you approach analyzing a dataset with missing values and outliers?",
        category: "Technical Skills",
        scoringRubric: {
          1: "No strategy for handling data quality issues",
          2: "Vague mention of removing bad data",
          3: "Basic techniques like mean imputation mentioned",
          4: "Comprehensive approach with multiple strategies discussed",
          5: "Advanced techniques including multiple imputation, outlier detection algorithms, and business context considerations"
        },
        weight: 1.3
      },
      { 
        id: "ds_3",
        question: "Explain the difference between supervised and unsupervised learning with examples.",
        category: "Conceptual Knowledge",
        scoringRubric: {
          1: "Cannot distinguish between learning types",
          2: "Basic distinction made without examples",
          3: "Clear explanation with one example each",
          4: "Detailed explanation with real-world applications and algorithm examples",
          5: "Comprehensive coverage including hybrid approaches and advanced use cases"
        },
        weight: 1.0
      },
      { 
        id: "ds_4",
        question: "Describe a time when your data analysis changed someone's mind or influenced a decision.",
        category: "Impact & Communication",
        scoringRubric: {
          1: "No example of data-driven influence",
          2: "Minor influence without clear outcome",
          3: "Clear example with measurable outcome",
          4: "Strong story with business impact quantified",
          5: "Compelling narrative with significant organizational change driven by insights"
        },
        weight: 1.1
      },
      {
        id: "ds?5",
        question: "What programming languages and tools are you familiar with for data analysis?",
        category: "Technical Proficiency",
        scoringRubric: {
          1: "No programming experience",
          2: "Basic Excel or spreadsaheet skills only",
          3: "Some Python or R experience with libraries",
          4: "Multiple languages with specific library expertise",
          5: "Full stack data science toolkit including cloud platforms and deployment"
        },
        weight: 1.2
      },
      { 
        id: "ds_6",
        question: "How do you stay current with developments in data science and ML?",
        category: "Learning Agility",
        scoringRubric: {
          1: "No strategy for staying current",
          2: "Occasional reading without structure",
          3: "Follows some blogs or communities",
          4: "Active learner with defined resources and practice",
          5: "Engages with research papers, contributes to communities, experiments with new techniques"
        },
        weight: 1.0
      },
      {
        id: "ds_7",
        question: "Walk me through how you would build a model to predict customer churn.",
        category: "Problem Solving",
        scoringRubric: {
          1: "No structured approach to the problem",
          2: "Basic outline without technical depth",
          3: "Clear steps from data prep to model selection",
          4: "Comprehensive approach including feature engineering and model evaluation",
          5: "Production-ready thinking with deployment, monitoring, and business integration"
        },
        weight: 1.3
      },
      { 
        id: "ds_8",
        question: "what do you hope to achieve after completing this data science program?",
        category: "Motivation & Fit",
        scoringRubric: {
          1: "Unclear or unrealistic goals",
          2: "Vague interest in tech careers",
          3: "Clear career transition goals stated",
          4: "Specific role and timeline with realistic plan",
          5: "Comprehensive roadmap with intermediate milestones and long-term vision"
        },
        weight: 1.1
      }
    ],
    fundingTiers: {
      tier1: { min: 70, max: 79, criteria: ["Demonstrated analytical aptitude", "Clear career transition plan", "Basic technical foundation"] },
      tier2: { min: 80, max: 89, criteria: ["Strong data project portfolio", "Professional growth evidence", "Technical prererquisites met"] },
      tier3: { min: 90, max: 100, criteria: ["Exceptional analytical thinking", "Published or presented work", "Industry connections or referrals"] }
    }
  },
  cloud_devops: {
    id: "cloud_devops",
    name: "Cloud Engineering & DevOps",
    description: "Learn cloud infrastructure, CID/CD Ppelines, containerization, and site reliability engineering practices.",
    duration: "14 weeks",
    credentials: ["AWS Solutions Architect", "Kubernetes Administrator", "Terraform Associate"],
    careerPaths: ["Cloud Engineer", "DevOps Engineer", "SRE", "Platform Engineer", "Infrastructure Architect"],
    targetProfile: {
      traits: ["Systems thinking", "Automation mindset", "Debugging skills", "Collaboration", "Documentation habit"],
      background: ["Command line proficiency", "Basic scripting", "Networking fundamentals", "Version control"],
      goals: ["Cloud certification", "Infrastructure as code", "Career advancement", "Multi-cloud expertise"]
    },
    interviewQuestions: [
      { id: "cd_1", question: "Describe your experience with cloud platforms and what you've deployed.", category: "Cloud Experience", scoringRubric: { 1: "No cloud experience", 2: "Basic familiarity with one platform", 3: "Hands-on experience with deployments and services", 4: "Multi-cloud experience with advanced services", 5: "Production-grade implementations with thousands of users" }, weight: 1.2 },
      { id: "cd_2", question: "How would you design a CID/CD Ppeline for a microservices application?", category: "DevOps Practices", scoringRubric: { 1: "No understanding of CI/CD concepts", 2: "Basic pipeline understanding without specifics", 3: "Standard pipeline with build, test, deploy stages", 4: "Advanced pipeline with security scanning, canary deployments, rollback", 5: "Enterprise-grade pipeline with GitOps, feature flags, observability, and SRE practices" }, weight: 1.3 },
      { id: "cd_3", question: "Explain Infrastructure as Code. Why is it important and what tools have you used?", category: "Iac Knowledge", scoringRubric: { 1: "No concept of Iac", 2: "Basic definition without tool experience", 3: "Hands-on with Terraform or CloudFormation", 4: "Multi-tool experience with best practices", 5: "Advanced patterns including modules, state management, policy-as-code" }, weight: 1.2 },
      { id: "cd_4", question: "Tell me about a time you debugged a production issue under pressure.", category: "Troubleshooting", scoringRubric: { 1: "No relevant experience", 2: "Minor issue resolution without stress", 3: "Clear incident with resolution process shown", 4: "Complex incident with systematic debugging approach", 5: "Multi-team coordination, root cause analysis, and preventive measures implemented" }, weight: 1.3 },
      { id: "cd_5", question: "How do you approach containerization and orchestration for an application?", category: "Container Knowledge", scoringRubric: { 1: "No container experience", 2: "Basic Docker knowledge", 3: "Docker experience with docker-compose", 4: "Kubernetes experience with deployments, services, ingress", 5: "Advanced Kubernetes including Helm, operators, service mesh, autoscaling" }, weight: 1.2 },
      { id: "cd_6", question: "What monitoring and observability tools do you use or want to learn?", category: "Observability", scoringRubric: { 1: "No monitoring experience", 2: "Basic logging or single metric tool", 3: "Familiar with standard stack (Prometheus, Grafana, ELK)", 4: "Advanced observability with distributed tracing, alerting", 5: "Full observability with SLOs, error budgets, chaos engineering" }, weight: 1.1 },
      { id: "cd_7", question: "Describe your scripting and automation experience.", category: "Automation Skills", scoringRubric: { 1: "No scripting experience", 2: "Basic shell scripts", 3: "Scripting in Python or similar for automation", 4: "Advanced automation with configuration management", 5: "Full automation framework development, self-healing systems" }, weight: 1.1 },
      { id: "cd_8", question: "where do you see the DevOps/SRE field heading in the next 5 years?", category: "Industry Awareness", scoringRubric: { 1: "No awareness of industry trends", 2: "Basic familiarity with current tools", 3: "Aware of major trends like GitOps, platform engineering", 4: "Deep understanding of trends with informed opinions", 5: "Thought leader perspective on future of operations, FinOps, platform teams" }, weight: 1.0 }
    ],
    fundingTiers: { tier1: { min: 65, max: 74, criteria: ["Basic Linux and networking knowledge", "Command line proficiency", "Clear DevOps interest"] }, tier2: { min: 75, max: 84, criteria: ["Some CI/CD experience", "Container basics", "Scripting skills"] }, tier3: { min: 85, max: 100, criteria: ["Production infrastructure experience", "Multiple cloud platforms", "Open source contributions"] } }
  },
  product_management: {
    id: "product_management",
    name: "Product Management",
    description: "Learn product strategy, roadmapping, user research, and agile methodologies.",
    duration: "12 weeks",
    credentials: ["Product Management Certificate"],
    careerPaths: ["Product Manager", "Product Owner", "Scrum Master"],
    targetProfile: {
      traits: ["Strategic thinking", "Communication", "Analytical", "Empathy"],
      background: ["Business experience", "Basic analytics", "Stakeholder management"],
      goals: ["PM role", "Product leadership", "Startup experience"]
    },
    interviewQuestions: [],
    fundingTiers: { tier1: { min: 50, max: 69, criteria: ["Basic business knowledge"] }, tier2: { min: 70, max: 89, criteria: ["Some product experience"] }, tier3: { min: 90, max: 100, criteria: ["Strong PM skills"] } }
  }
};
