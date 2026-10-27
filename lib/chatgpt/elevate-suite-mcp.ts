const SITE_URL = 'https://www.elevateforhumanity.org';

type Request = { id?: string | number | null; method?: string; params?: Record<string, unknown> };
const hints = { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true };

const tools = [
  tool('route_elevate_request', 'Route an Elevate request', 'Select PARIS, ELLIE, LIZZY, or ZORA for a task.', {
    intent: stringSchema(3, 1200),
  }, ['intent']),
  tool('draft_website_blueprint', 'Draft a website blueprint with PARIS', 'Create a read-only site blueprint; this does not publish or change an account.', {
    businessName: stringSchema(1, 120), industry: stringSchema(2, 160), primaryGoal: stringSchema(3, 500),
    requestedPages: { type: 'array', maxItems: 8, items: stringSchema(1, 80) },
  }, ['businessName', 'industry', 'primaryGoal']),
  tool('draft_course_blueprint', 'Draft a course blueprint with ELLIE', 'Create a read-only curriculum blueprint; this does not publish or sell a course.', {
    topic: stringSchema(2, 240), audience: stringSchema(2, 240), desiredOutcome: stringSchema(3, 500),
    moduleCount: { type: 'integer', minimum: 1, maximum: 12, default: 6 },
  }, ['topic', 'audience', 'desiredOutcome']),
  tool('get_program_and_funding_guidance', 'Get program and funding guidance from LIZZY', 'Give next steps without deciding eligibility or promising funding.', {
    programInterest: stringSchema(2, 200), paymentPath: { type: 'string', enum: ['self_pay', 'employer', 'workforce_funding', 'unsure'], default: 'unsure' }, stateCode: stringSchema(2, 2),
  }, ['programInterest']),
  tool('get_apprenticeship_compliance_checklist', 'Get an apprenticeship checklist from ZORA', 'Give a general recordkeeping checklist, not legal advice or regulatory approval.', {
    occupation: stringSchema(2, 160), businessType: stringSchema(2, 160), apprenticeCount: { type: 'integer', minimum: 0, maximum: 500, default: 0 },
  }, ['occupation', 'businessType']),
];

function stringSchema(minLength: number, maxLength: number) { return { type: 'string', minLength, maxLength }; }
function tool(name: string, title: string, description: string, properties: Record<string, unknown>, required: string[]) {
  return { name, title, description, inputSchema: { type: 'object', properties, required, additionalProperties: false }, annotations: hints };
}
function text(value: unknown, name: string, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min) throw new Error(`${name} is required`);
  return value.trim();
}
function integer(value: unknown, fallback: number, min: number, max: number) {
  const number = value === undefined ? fallback : value;
  if (!Number.isInteger(number) || (number as number) < min || (number as number) > max) throw new Error(`Value must be an integer from ${min} to ${max}`);
  return number as number;
}
function result(message: string, data: Record<string, unknown>) {
  return { content: [{ type: 'text', text: message }], structuredContent: data };
}
function route(intent: string) {
  const value = intent.toLowerCase();
  if (/website|landing page|storefront|domain|web design/.test(value)) return ['PARIS', 'website_builder', 'Website creation and digital presence'];
  if (/course|curriculum|lesson|syllabus|training portal|credential/.test(value)) return ['ELLIE', 'course_builder', 'Curriculum and learning design'];
  if (/funding|wioa|workone|enroll|application|career program|tuition/.test(value)) return ['LIZZY', 'program_guidance', 'Program intake and funding guidance'];
  if (/apprentice|host shop|rapids|dol|compliance|training hours/.test(value)) return ['ZORA', 'compliance_guidance', 'Apprenticeship and workforce compliance'];
  return ['PARIS', 'suite_router', 'General Elevate suite guidance'];
}

function call(name: unknown, args: Record<string, unknown>) {
  if (name === 'route_elevate_request') {
    const [agent, capability, reason] = route(text(args.intent, 'intent', 3));
    return result(`This request belongs with ${agent}: ${reason}.`, { agent, capability, reason });
  }
  if (name === 'draft_website_blueprint') {
    const businessName = text(args.businessName, 'businessName');
    const pages = Array.isArray(args.requestedPages) && args.requestedPages.length ? args.requestedPages.slice(0, 8).map((p) => text(p, 'requestedPages')) : ['Home', 'About', 'Services', 'Contact'];
    return result(`PARIS drafted a ${pages.length}-page website blueprint for ${businessName}. This preview does not publish a site or change an account.`, {
      agent: 'PARIS', businessName, industry: text(args.industry, 'industry', 2), primaryGoal: text(args.primaryGoal, 'primaryGoal', 3), pages,
      homepageSections: ['Outcome-led hero', 'Trust and proof', 'Services or offers', 'How it works', 'Primary call to action'], status: 'preview_only', informationUrl: `${SITE_URL}/apps/website-builder`,
    });
  }
  if (name === 'draft_course_blueprint') {
    const topic = text(args.topic, 'topic', 2); const count = integer(args.moduleCount, 6, 1, 12);
    const stages = ['Foundations', 'Core concepts', 'Guided practice', 'Applied workflow', 'Quality and safety', 'Capstone and next steps'];
    return result(`ELLIE drafted a ${count}-module course blueprint. This preview does not create, publish, or sell a course.`, {
      agent: 'ELLIE', topic, audience: text(args.audience, 'audience', 2), desiredOutcome: text(args.desiredOutcome, 'desiredOutcome', 3),
      modules: Array.from({ length: count }, (_, index) => ({ number: index + 1, title: `${stages[index % stages.length]}: ${topic}`, lessonPattern: ['Explain', 'Demonstrate', 'Practice', 'Check understanding'] })), status: 'preview_only', informationUrl: `${SITE_URL}/store/course-builder`,
    });
  }
  if (name === 'get_program_and_funding_guidance') {
    const paymentPath = typeof args.paymentPath === 'string' ? args.paymentPath : 'unsure';
    return result('LIZZY provided guidance without deciding eligibility or promising funding.', {
      agent: 'LIZZY', programInterest: text(args.programInterest, 'programInterest', 2), paymentPath, stateCode: typeof args.stateCode === 'string' ? args.stateCode.toUpperCase() : null, determination: 'not_determined',
      requiredNotice: 'Funding is not guaranteed. The responsible agency must determine eligibility, covered costs, and written authorization for the exact participant and program.',
      nextSteps: ['Review the exact published program record and current tuition information.', paymentPath === 'workforce_funding' ? 'Contact the responsible workforce agency and obtain written authorization before treating enrollment as funded.' : 'Review the selected payment path and application requirements.', 'Use the official Elevate application only when ready to submit information.'], programsUrl: `${SITE_URL}/programs`, fundingInformationUrl: `${SITE_URL}/funding`,
    });
  }
  if (name === 'get_apprenticeship_compliance_checklist') return result('ZORA prepared a general checklist. It does not approve a Host Shop or certify regulatory compliance.', {
    agent: 'ZORA', occupation: text(args.occupation, 'occupation', 2), businessType: text(args.businessType, 'businessType', 2), apprenticeCount: integer(args.apprenticeCount, 0, 0, 500), determination: 'not_a_compliance_approval',
    items: ['Verify the occupation and program registration status from the authoritative record.', 'Maintain required business, supervisor, insurance, payroll, and worksite evidence.', 'Track RTI, OJL, competencies, wages, attendance, and approvals in auditable records.', 'Protect apprentice privacy and limit access by role.', 'Obtain separate written authorization before claiming any workforce reimbursement.'], hostShopInformationUrl: `${SITE_URL}/partners/host-shops`,
  });
  throw new Error(`Unknown tool: ${String(name)}`);
}

const ok = (id: Request['id'], value: unknown) => ({ jsonrpc: '2.0', id: id ?? null, result: value });
const fail = (id: Request['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

export function handleElevateMcpMessage(message: Request) {
  if (!message || typeof message !== 'object') return fail(null, -32600, 'Invalid Request');
  if (message.method?.startsWith('notifications/')) return null;
  if (message.method === 'initialize') return ok(message.id, {
    protocolVersion: '2025-06-18', capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'elevate-ai-workforce-creator-suite', version: '1.0.0' },
    instructions: 'Route website work to PARIS, course design to ELLIE, program and funding guidance to LIZZY, and apprenticeship compliance guidance to ZORA. Public tools are read-only previews. Never promise funding, eligibility, enrollment, licensure, employment, wages, approvals, or compliance. Do not collect sensitive personal data or promote checkout for digital products.',
  });
  if (message.method === 'ping') return ok(message.id, {});
  if (message.method === 'tools/list') return ok(message.id, { tools });
  if (message.method === 'tools/call') {
    try { return ok(message.id, call(message.params?.name, (message.params?.arguments as Record<string, unknown>) ?? {})); }
    catch (caught) { return ok(message.id, { content: [{ type: 'text', text: caught instanceof Error ? caught.message : 'Tool request failed' }], isError: true }); }
  }
  return fail(message.id, -32601, 'Method not found');
}
