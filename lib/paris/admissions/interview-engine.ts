export type ApplicationInterviewLocale = 'en' | 'es';

export type ApplicationInterviewField =
  | 'firstName'
  | 'lastName'
  | 'dateOfBirth'
  | 'email'
  | 'phone'
  | 'preferredContact'
  | 'address'
  | 'city'
  | 'state'
  | 'zipCode'
  | 'program'
  | 'goals'
  | 'fundingSource'
  | 'hasWorkOneReferral'
  | 'workoneCenter'
  | 'employmentStatus'
  | 'currentEmployer'
  | 'highestEducation'
  | 'modalityPreference'
  | 'hasHostShop'
  | 'hostShopName'
  | 'transferHours'
  | 'transportationNeeds'
  | 'childcareNeeds'
  | 'supportNeeds'
  | 'applicationCertification';

export type ApplicationInterviewAnswers = Partial<Record<ApplicationInterviewField, string>>;

export interface ApplicationInterviewState {
  locale: ApplicationInterviewLocale;
  answers: ApplicationInterviewAnswers;
  confirmed: ApplicationInterviewField[];
  pendingConfirmation?: {
    field: ApplicationInterviewField;
    value: string;
  } | null;
  lastQuestionField?: ApplicationInterviewField | null;
}

export interface ApplicationInterviewQuestion {
  field: ApplicationInterviewField;
  prompt: string;
  help?: string;
  required: boolean;
  critical: boolean;
  options?: Array<{ value: string; label: string }>;
}

const TEXT = {
  en: {
    firstName: 'What is your legal first name?',
    lastName: 'What is your legal last name?',
    dateOfBirth: 'What is your date of birth?',
    email: 'What email address should we use for your application and updates?',
    phone: 'What phone number should we use to reach you?',
    preferredContact: 'How do you prefer that we contact you?',
    address: 'What is your current street address?',
    city: 'What city do you live in?',
    state: 'What state do you live in?',
    zipCode: 'What is your ZIP code?',
    program: 'Which program are you interested in?',
    goals: 'What are you hoping this training will help you accomplish?',
    fundingSource: 'How are you planning to pay for training?',
    hasWorkOneReferral: 'Have you already started the WorkOne referral or intake process?',
    workoneCenter: 'Which WorkOne office or workforce center are you working with?',
    employmentStatus: 'What is your current employment status?',
    currentEmployer: 'Who is your current employer? You can say “none” if you are not currently employed.',
    highestEducation: 'What is the highest level of education you completed?',
    modalityPreference: 'Do you prefer in-person, virtual, or hybrid training when the program allows it?',
    hasHostShop: 'Do you already have a host shop or employer for this apprenticeship?',
    hostShopName: 'What is the name of the host shop or employer?',
    transferHours: 'Are you requesting credit for prior apprenticeship hours? If yes, tell me how many hours you are claiming.',
    transportationNeeds: 'Would transportation support help you participate in training?',
    childcareNeeds: 'Would childcare support help you participate in training?',
    supportNeeds: 'Is there any other support you want the admissions team to know you may need?',
    applicationCertification: 'Before submission, do you certify that the information you provided is true and complete to the best of your knowledge and understand that supporting information may be verified?',
    fundingHelp: 'Submitting this application does not guarantee workforce funding. WorkOne or the responsible funding agency determines participant eligibility and authorization.',
    transferHelp: 'Claimed transfer hours require supporting evidence and sponsor review before any hours are credited.',
    certificationHelp: 'Your confirmation is recorded with this application. It is not reused as a signature for any separate agreement that requires its own review and signature.',
  },
  es: {
    firstName: '¿Cuál es su nombre legal?',
    lastName: '¿Cuál es su apellido legal?',
    dateOfBirth: '¿Cuál es su fecha de nacimiento?',
    email: '¿Qué correo electrónico debemos usar para su solicitud y las actualizaciones?',
    phone: '¿Qué número de teléfono debemos usar para comunicarnos con usted?',
    preferredContact: '¿Cómo prefiere que nos comuniquemos con usted?',
    address: '¿Cuál es su dirección actual?',
    city: '¿En qué ciudad vive?',
    state: '¿En qué estado vive?',
    zipCode: '¿Cuál es su código postal?',
    program: '¿Qué programa le interesa?',
    goals: '¿Qué espera lograr con esta capacitación?',
    fundingSource: '¿Cómo planea pagar la capacitación?',
    hasWorkOneReferral: '¿Ya comenzó el proceso de referido o admisión con WorkOne?',
    workoneCenter: '¿Con qué oficina de WorkOne o centro de fuerza laboral está trabajando?',
    employmentStatus: '¿Cuál es su situación laboral actual?',
    currentEmployer: '¿Quién es su empleador actual? Puede decir “ninguno” si no trabaja actualmente.',
    highestEducation: '¿Cuál es el nivel educativo más alto que completó?',
    modalityPreference: '¿Prefiere capacitación presencial, virtual o híbrida cuando el programa lo permite?',
    hasHostShop: '¿Ya tiene un salón anfitrión o empleador para este aprendizaje?',
    hostShopName: '¿Cuál es el nombre del salón anfitrión o empleador?',
    transferHours: '¿Solicita crédito por horas previas de aprendizaje? Si es así, indique cuántas horas reclama.',
    transportationNeeds: '¿El apoyo de transporte le ayudaría a participar en la capacitación?',
    childcareNeeds: '¿El apoyo de cuidado infantil le ayudaría a participar en la capacitación?',
    supportNeeds: '¿Hay algún otro apoyo que quiera que el equipo de admisiones sepa que podría necesitar?',
    applicationCertification: 'Antes de enviar, ¿certifica que la información proporcionada es verdadera y completa según su leal saber y entender y comprende que la información de respaldo puede verificarse?',
    fundingHelp: 'Enviar esta solicitud no garantiza financiamiento laboral. WorkOne o la agencia responsable determina la elegibilidad y autorización del participante.',
    transferHelp: 'Las horas de transferencia reclamadas requieren evidencia y revisión del patrocinador antes de que se acrediten.',
    certificationHelp: 'Su confirmación queda registrada con esta solicitud. No se reutiliza como firma para acuerdos separados que requieran su propia revisión y firma.',
  },
} as const;

const CRITICAL_FIELDS = new Set<ApplicationInterviewField>([
  'firstName',
  'lastName',
  'dateOfBirth',
  'email',
  'phone',
  'address',
  'city',
  'state',
  'zipCode',
  'program',
  'fundingSource',
  'transferHours',
  'applicationCertification',
]);

const BASE_REQUIRED: ApplicationInterviewField[] = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'email',
  'phone',
  'address',
  'city',
  'state',
  'zipCode',
  'program',
  'goals',
  'fundingSource',
  'employmentStatus',
  'highestEducation',
  'applicationCertification',
];

function normalized(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

export function isApprenticeshipProgram(program: string | undefined): boolean {
  return normalized(program).includes('apprentice');
}

export function requiresWorkOne(fundingSource: string | undefined): boolean {
  const value = normalized(fundingSource);
  return value === 'wioa' || value === 'wrg' || value.includes('workforce ready');
}

export function claimedTransferHours(value: string | undefined): number {
  const parsed = Number.parseInt(value || '0', 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function getRequiredInterviewFields(answers: ApplicationInterviewAnswers): ApplicationInterviewField[] {
  const fields = [...BASE_REQUIRED];
  if (requiresWorkOne(answers.fundingSource)) {
    fields.push('hasWorkOneReferral');
    if (normalized(answers.hasWorkOneReferral) === 'yes') fields.push('workoneCenter');
  }
  if (isApprenticeshipProgram(answers.program)) {
    fields.push('hasHostShop', 'transferHours');
    if (normalized(answers.hasHostShop) === 'yes') fields.push('hostShopName');
  }
  return [...new Set(fields)];
}

export function calculateApplicationInterviewProgress(state: ApplicationInterviewState) {
  const required = getRequiredInterviewFields(state.answers);
  const complete = required.filter((field) => {
    const value = state.answers[field];
    return Boolean(value?.trim()) && (!CRITICAL_FIELDS.has(field) || state.confirmed.includes(field));
  });
  const missing = required.filter((field) => !complete.includes(field));
  const percent = required.length ? Math.round((complete.length / required.length) * 100) : 0;
  return { percent, required, complete, missing };
}

function questionOptions(field: ApplicationInterviewField, locale: ApplicationInterviewLocale) {
  const es = locale === 'es';
  switch (field) {
    case 'preferredContact':
      return [
        { value: 'phone', label: es ? 'Teléfono' : 'Phone' },
        { value: 'text', label: es ? 'Mensaje de texto' : 'Text message' },
        { value: 'email', label: es ? 'Correo electrónico' : 'Email' },
      ];
    case 'fundingSource':
      return [
        { value: 'wioa', label: 'WIOA / WorkOne' },
        { value: 'wrg', label: 'Workforce Ready Grant' },
        { value: 'employer', label: es ? 'Patrocinio del empleador' : 'Employer sponsorship' },
        { value: 'self_pay', label: es ? 'Pago personal' : 'Self-pay' },
        { value: 'payment_plan', label: es ? 'Plan de pagos' : 'Payment plan' },
        { value: 'not_sure', label: es ? 'No estoy seguro' : 'Not sure yet' },
      ];
    case 'hasWorkOneReferral':
    case 'hasHostShop':
      return [
        { value: 'yes', label: es ? 'Sí' : 'Yes' },
        { value: 'no', label: 'No' },
      ];
    case 'applicationCertification':
      return [
        { value: 'yes', label: es ? 'Sí, certifico' : 'Yes, I certify' },
        { value: 'no', label: es ? 'No, necesito revisar' : 'No, I need to review' },
      ];
    case 'employmentStatus':
      return [
        { value: 'unemployed', label: es ? 'Desempleado' : 'Unemployed' },
        { value: 'part_time', label: es ? 'Medio tiempo' : 'Part-time' },
        { value: 'full_time', label: es ? 'Tiempo completo' : 'Full-time' },
        { value: 'student', label: es ? 'Estudiante' : 'Student' },
      ];
    case 'modalityPreference':
      return [
        { value: 'in_person', label: es ? 'Presencial' : 'In person' },
        { value: 'virtual', label: 'Virtual' },
        { value: 'hybrid', label: es ? 'Híbrido' : 'Hybrid' },
      ];
    default:
      return undefined;
  }
}

export function getNextApplicationInterviewQuestion(state: ApplicationInterviewState): ApplicationInterviewQuestion | null {
  if (state.pendingConfirmation) {
    return {
      field: state.pendingConfirmation.field,
      prompt:
        state.locale === 'es'
          ? `Antes de guardar este dato importante, confirme: ${state.pendingConfirmation.value}`
          : `Before I save this important answer, please confirm: ${state.pendingConfirmation.value}`,
      required: true,
      critical: true,
      options: [
        { value: 'confirm', label: state.locale === 'es' ? 'Confirmar' : 'Confirm' },
        { value: 'change', label: state.locale === 'es' ? 'Cambiar' : 'Change' },
      ],
    };
  }

  const required = getRequiredInterviewFields(state.answers);
  const next = required.find((field) => !state.answers[field]?.trim() || (CRITICAL_FIELDS.has(field) && !state.confirmed.includes(field)));
  if (!next) return null;

  const help =
    next === 'fundingSource'
      ? TEXT[state.locale].fundingHelp
      : next === 'transferHours'
        ? TEXT[state.locale].transferHelp
        : next === 'applicationCertification'
          ? TEXT[state.locale].certificationHelp
          : undefined;

  return {
    field: next,
    prompt: TEXT[state.locale][next],
    help,
    required: true,
    critical: CRITICAL_FIELDS.has(next),
    options: questionOptions(next, state.locale),
  };
}

export function applyInterviewAnswer(
  state: ApplicationInterviewState,
  field: ApplicationInterviewField,
  rawValue: string,
  confirmCritical = false,
): ApplicationInterviewState {
  const value = rawValue.trim();
  if (!value) return state;

  if (field === 'applicationCertification' && normalized(value) !== 'yes') {
    return {
      ...state,
      answers: { ...state.answers, applicationCertification: '' },
      confirmed: state.confirmed.filter((item) => item !== 'applicationCertification'),
      pendingConfirmation: null,
      lastQuestionField: field,
    };
  }

  if (CRITICAL_FIELDS.has(field) && !confirmCritical) {
    return {
      ...state,
      pendingConfirmation: { field, value },
      lastQuestionField: field,
    };
  }

  return {
    ...state,
    answers: { ...state.answers, [field]: value },
    confirmed: CRITICAL_FIELDS.has(field)
      ? [...new Set([...state.confirmed, field])]
      : state.confirmed,
    pendingConfirmation: null,
    lastQuestionField: field,
  };
}

export function confirmPendingInterviewAnswer(state: ApplicationInterviewState): ApplicationInterviewState {
  const pending = state.pendingConfirmation;
  if (!pending) return state;
  return applyInterviewAnswer({ ...state, pendingConfirmation: null }, pending.field, pending.value, true);
}

export function changePendingInterviewAnswer(state: ApplicationInterviewState): ApplicationInterviewState {
  if (!state.pendingConfirmation) return state;
  return { ...state, pendingConfirmation: null, lastQuestionField: state.pendingConfirmation.field };
}

export function createApplicationInterviewState(locale: ApplicationInterviewLocale = 'en'): ApplicationInterviewState {
  return { locale, answers: {}, confirmed: [], pendingConfirmation: null, lastQuestionField: null };
}

export function applicationInterviewReadyForSubmission(state: ApplicationInterviewState): boolean {
  return (
    calculateApplicationInterviewProgress(state).missing.length === 0 &&
    !state.pendingConfirmation &&
    normalized(state.answers.applicationCertification) === 'yes' &&
    state.confirmed.includes('applicationCertification')
  );
}

export function interviewStateToApplicationPayload(state: ApplicationInterviewState) {
  const a = state.answers;
  const transferHours = claimedTransferHours(a.transferHours);
  const apprenticeship = isApprenticeshipProgram(a.program);
  const workOne = requiresWorkOne(a.fundingSource);
  const hasWorkOneReferral = normalized(a.hasWorkOneReferral);
  const needsWorkOneAppointment = workOne && hasWorkOneReferral === 'no';
  return {
    firstName: a.firstName,
    lastName: a.lastName,
    dateOfBirth: a.dateOfBirth,
    email: a.email,
    phone: a.phone,
    preferredContact: a.preferredContact || 'phone',
    address: a.address,
    city: a.city,
    state: a.state,
    zip: a.zipCode,
    zipCode: a.zipCode,
    program: a.program,
    programSlug: a.program,
    goals: a.goals,
    fundingType: a.fundingSource,
    funding: a.fundingSource,
    fundingEligibilityStatus: needsWorkOneAppointment ? 'needs_appointment' : undefined,
    hasWorkOneReferral: workOne ? a.hasWorkOneReferral : undefined,
    workoneCenter: workOne ? a.workoneCenter : undefined,
    workoneIntakeCompleted: workOne ? (hasWorkOneReferral === 'yes' ? 'in_process' : 'not_started') : undefined,
    employmentStatus: a.employmentStatus,
    currentEmployer: a.currentEmployer,
    highestEducation: a.highestEducation,
    modalityPreference: a.modalityPreference,
    hasHostShop: apprenticeship ? a.hasHostShop : undefined,
    hostShopName: apprenticeship ? a.hostShopName : undefined,
    transferHours: apprenticeship ? String(transferHours) : '0',
    transportationNeeds: a.transportationNeeds,
    childcareNeeds: a.childcareNeeds,
    supportNeeds: a.supportNeeds,
    preferredLanguage: state.locale,
    source: 'paris-application-interview',
    applicationCertification: true,
  };
}
