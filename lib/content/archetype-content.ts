
/**
 * Centralized content configuration for all 10 archetypes
 *
 * Production-ready copy following student-first language standards
 * All content is truthful, operational, and ready to use today
 *
 * Pattern: Who is this for? What can you do? What happens next?
 */

export interface ArchetypeContent {
  hero: {
    title: string;
    purpose: string;
    image?: string;
    imageAlt?: string;
  };
  sections: Record<
    string,
    {
      title: string;
      content: string;
      emptyState?: string;
    }
  >;
  cta?: {
    primary?: string;
    secondary?: string;
    primaryHref?: string;
    secondaryHref?: string;
  };
}

export interface LocalizedContent {
  en: ArchetypeContent;
  es: ArchetypeContent;
}

/**
 * 1. Program / Training Detail Archetype
 */
export const programTrainingContent: LocalizedContent = {
  en: {
    hero: {
      title: 'Program Overview',
      purpose:
        'This page explains who this program is for, what you will learn, and how to apply.',
      image: '/images/pages/comp-cta-programs.jpg',
      imageAlt: 'Students in training program',
    },
    sections: {
      whoThisIsFor: {
        title: 'Who This Program Is For',
        content:
          'This program is designed for individuals who meet the eligibility requirements listed below and are ready to complete training toward employment.',
      },
      whatYouWillLearn: {
        title: 'What You Will Learn',
        content:
          'You will gain the skills and knowledge needed to prepare for work in this field, including required safety, technical, and job-readiness components.',
      },
      eligibility: {
        title: 'Eligibility Requirements',
        content:
          'To qualify, you must meet the listed criteria and provide required documentation during the application process.',
      },
      afterCompletion: {
        title: 'What Happens After Completion',
        content:
          'After completing the program, you will be eligible for job placement support or next-step opportunities connected to this training.',
      },
    },
    cta: {
      primary: 'Apply for This Program',
      secondary: 'View All Programs',
      primaryHref: '/apply',
      secondaryHref: '/programs',
    },
  },
  es: {
    hero: {
      title: 'Resumen del programa',
      purpose:
        'Esta página explica para quién es el programa, qué aprenderás y cómo aplicar.',
      image: '/images/pages/comp-cta-programs.jpg',
      imageAlt: 'Estudiantes en programa de capacitación',
    },
    sections: {
      eligibility: {
        title: 'Elegibilidad',
        content: 'Debes cumplir con los requisitos indicados.',
      },
      afterCompletion: {
        title: 'Después de completar',
        content: 'Recibirás apoyo para el siguiente paso laboral.',
      },
    },
    cta: {
      primary: 'Aplicar al programa',
      secondary: 'Ver todos los programas',
      primaryHref: '/apply',
      secondaryHref: '/programs',
    },
  },
};

/**
 * 2. Application / Enrollment Flow Archetype
 */
export const applicationEnrollmentContent: LocalizedContent = {
  en: {
    hero: {
      title: 'Program Application',
      purpose:
        'Use this page to apply and submit the information required for review.',
      image: '/images/pages/apply-employer-hero.jpg',
      imageAlt: 'Application form',
    },
    sections: {
      requiredInformation: {
        title: 'Required Information',
        content:
          'Complete all sections accurately. Missing information may delay review.',
      },
      afterYouApply: {
        title: 'What Happens After You Apply',
        content:
          'Your application is reviewed by staff. You will see updates in your dashboard.',
      },
      needHelp: {
        title: 'Need Help?',
        content:
          'If you are unsure about a question, contact support before submitting.',
      },
    },
    cta: {
      primary: 'Submit Application',
      secondary: 'Save and Continue Later',
      primaryHref: '/apply/submit',
      secondaryHref: '/dashboard',
    },
  },
  es: {
    hero: {
      title: 'Solicitud del programa',
      purpose:
        'Usa esta página para aplicar y enviar la información requerida.',
      image: '/images/pages/apply-employer-hero.jpg',
      imageAlt: 'Formulario de solicitud',
    },
    sections: {
      afterYouApply: {
        title: 'Después de aplicar',
        content:
          'El personal revisará tu solicitud y verás actualizaciones en tu panel.',
      },
    },
    cta: {
      primary: 'Enviar solicitud',
      secondary: 'Guardar y continuar después',
      primaryHref: '/apply/submit',
      secondaryHref: '/dashboard',
    },
  },
};

/**
 * 3. Dashboard / Portal Archetype
 */
export const dashboardPortalContent: LocalizedContent = {
  en: {
    hero: {
      title: 'My Dashboard',
      purpose: 'This page shows your current status and next required steps.',
      image: '/images/pages/comp-cta-training.jpg',
      imageAlt: 'Student dashboard',
    },
    sections: {
      myStatus: {
        title: 'My Status',
        content:
          'This section reflects your real application and enrollment status.',
      },
      myTasks: {
        title: 'My Tasks',
        content: 'Tasks appear here only when action is required from you.',
        emptyState:
          'No tasks appear because there are no actions required at this time.',
      },
      messages: {
        title: 'Messages',
        content: 'Messages from staff appear here when updates are available.',
        emptyState:
          'You have no new messages. Staff will contact you here if they need information.',
      },
      progress: {
        title: 'My Progress',
        content: 'Track your completion status and hours logged.',
        emptyState:
          'Your progress will appear here after you enroll in a program.',
      },
    },
    cta: {
      primary: 'View Programs',
      secondary: 'Contact Support',
      primaryHref: '/programs',
      secondaryHref: '/support',
    },
  },
  es: {
    hero: {
      title: 'Mi panel',
      purpose: 'Este panel muestra tu estado actual y los siguientes pasos.',
      image: '/images/pages/comp-cta-training.jpg',
      imageAlt: 'Panel del estudiante',
    },
    sections: {
      myTasks: {
        title: 'Mis tareas',
        emptyState:
          'No hay tareas porque no se requiere acción en este momento.',
      },
      messages: {
        title: 'Mensajes',
        emptyState:
          'No tienes mensajes nuevos. El personal te contactará aquí si necesita información.',
      },
    },
    cta: {
      primary: 'Ver programas',
      secondary: 'Contactar soporte',
      primaryHref: '/programs',
      secondaryHref: '/support',
    },
  },
};

/**
 * 4. Directory / Listing / Search Archetype
 */
export const directoryListingContent: LocalizedContent = {
  en: {
    hero: {
      title: 'Available Programs',
      purpose:
        'Browse and filter programs that are currently open for enrollment.',
      image: '/images/pages/comp-universal-hero.jpg',
      imageAlt: 'Program directory',
    },
    sections: {
      filters: {
        title: 'Filters',
        content:
          'Use filters to narrow results by location, eligibility, or program type.',
      },
      results: {
        title: 'Results',
        content: 'Select a program to view full details and apply.',
        emptyState:
          'No programs match your current filters. Try adjusting your search criteria.',
      },
    },
    cta: {
      primary: 'Clear Filters',
      secondary: 'View All Programs',
      primaryHref: '/programs',
      secondaryHref: '/programs',
    },
  },
  es: {
    hero: {
      title: 'Programas disponibles',
      purpose: 'Explora programas abiertos y filtra según tus necesidades.',
      image: '/images/pages/comp-universal-hero.jpg',
      imageAlt: 'Directorio de programas',
    },
    sections: {
      results: {
        title: 'Resultados',
        emptyState:
          'Ningún programa coincide con tus filtros actuales. Intenta ajustar tus criterios de búsqueda.',
      },
    },
    cta: {
      primary: 'Limpiar filtros',
      secondary: 'Ver todos los programas',
      primaryHref: '/programs',
      secondaryHref: '/programs',
    },
  },
};

/**
 * 5. Policy / Compliance / Legal Archetype
 */
export const policyComplianceContent: LocalizedContent = {
  en: {
    hero: {
      title: 'Policy Information',
      purpose:
        'This page explains policies that apply to your use of this platform.',
      image: '/images/pages/comp-cta-career.jpg',
      imageAlt: 'Policy documentation',
    },
    sections: {
      effectiveDate: {
        title: 'Effective Date',
        content: 'This policy is effective as of the date listed below.',
      },
      yourResponsibilities: {
        title: 'Your Responsibilities',
        content:
          'By using this platform, you agree to follow these guidelines.',
      },
      contact: {
        title: 'Contact',
        content:
          'If you have questions, contact us using the information provided.',
      },
    },
    cta: {
      primary: 'Return to Homepage',
      primaryHref: '/',
    },
  },
  es: {
    hero: {
      title: 'Información de políticas',
      purpose:
        'Esta página explica las políticas que aplican al uso de la plataforma.',
      image: '/images/pages/comp-cta-career.jpg',
      imageAlt: 'Documentación de políticas',
    },
    cta: {
      primary: 'Volver a la página principal',
      primaryHref: '/',
    },
  },
};

/**
 * 6. Partner / Employer / Agency Archetype
 */
export const partnerEmployerContent: LocalizedContent = {
  en: {
    hero: {
      title: 'Partner Information',
      purpose:
        'This page explains partnership opportunities and how to get started.',
      image: '/images/partners/hero.jpg',
      imageAlt: 'Partnership opportunities',
    },
    sections: {
      whoThisIsFor: {
        title: 'Who This Is For',
        content:
          'This information is for employers, training providers, and agencies interested in partnership.',
      },
      howToPartner: {
        title: 'How to Partner',
        content:
          'Review requirements and submit a partnership inquiry using the form below.',
      },
      contact: {
        title: 'Contact',
        content:
          'For questions about partnership, use the contact information provided.',
      },
    },
    cta: {
      primary: 'Submit Partnership Inquiry',
      secondary: 'View Partnership Requirements',
      primaryHref: '/partners/apply',
      secondaryHref: '/partners/requirements',
    },
  },
  es: {
    hero: {
      title: 'Información para socios',
      purpose:
        'Esta página explica oportunidades de asociación y cómo comenzar.',
      image: '/images/partners/hero.jpg',
      imageAlt: 'Oportunidades de asociación',
    },
    cta: {
      primary: 'Enviar consulta de asociación',
      secondary: 'Ver requisitos de asociación',
      primaryHref: '/partners/apply',
      secondaryHref: '/partners/requirements',
    },
  },
};

/**
 * 7. Auth / Account / Profile Archetype
 */
export const authAccountContent: LocalizedContent = {
  en: {
    hero: {
      title: 'Account Access',
      purpose:
        'Use this page to log in, create an account, or manage your profile.',
      image: '/images/pages/comp-highlights-success.jpg',
      imageAlt: 'Account login',
    },
    sections: {
      login: {
        title: 'Log In',
        content: 'Enter your credentials to access your dashboard.',
      },
      createAccount: {
        title: 'Create Account',
        content: 'New users can create an account to get started.',
      },
      forgotPassword: {
        title: 'Forgot Password?',
        content: 'Reset your password using the link below.',
      },
    },
    cta: {
      primary: 'Log In',
      secondary: 'Create Account',
      primaryHref: '/login',
      secondaryHref: '/signup',
    },
  },
  es: {
    hero: {
      title: 'Acceso a cuenta',
      purpose:
        'Usa esta página para iniciar sesión, crear una cuenta o administrar tu perfil.',
      image: '/images/pages/comp-highlights-success.jpg',
      imageAlt: 'Inicio de sesión',
    },
    cta: {
      primary: 'Iniciar sesión',
      secondary: 'Crear cuenta',
      primaryHref: '/login',
      secondaryHref: '/signup',
    },
  },
};

/**
 * 8. Reporting / Admin / Ops Archetype
 */
export const reportingAdminContent: LocalizedContent = {
  en: {
    hero: {
      title: 'Administrative Dashboard',
      purpose:
        'This page provides tools for reporting, management, and operations.',
      image: '/images/pages/comp-cta-training.jpg',
      imageAlt: 'Administrative dashboard',
    },
    sections: {
      reports: {
        title: 'Reports',
        content: 'Generate and export reports using the tools below.',
      },
      management: {
        title: 'Management',
        content: 'Manage users, programs, and system settings.',
      },
      audit: {
        title: 'Audit Logs',
        content: 'View system activity and compliance records.',
      },
    },
    cta: {
      primary: 'Generate Report',
      secondary: 'View Audit Logs',
      primaryHref: '/admin/reports/generate',
      secondaryHref: '/admin/audit',
    },
  },
  es: {
    hero: {
      title: 'Panel administrativo',
      purpose:
        'Esta página proporciona herramientas para informes, gestión y operaciones.',
      image: '/images/pages/comp-cta-training.jpg',
      imageAlt: 'Panel administrativo',
    },
    cta: {
      primary: 'Generar informe',
      secondary: 'Ver registros de auditoría',
      primaryHref: '/admin/reports/generate',
      secondaryHref: '/admin/audit',
    },
  },
};

/**
 * 9. Marketing / Informational Archetype
 */
export const marketingInformationalContent: LocalizedContent = {
  en: {
    hero: {
      title: 'About This Platform',
      purpose: 'Learn about our mission, programs, and how to get involved.',
      image: '/images/pages/comp-home-hero-programs.jpg',
      imageAlt: 'Platform overview',
    },
    sections: {
      mission: {
        title: 'Our Mission',
        content:
          'We connect individuals with training and employment opportunities.',
      },
      howItWorks: {
        title: 'How It Works',
        content:
          'Browse programs, apply, complete training, and access job placement support.',
      },
      contact: {
        title: 'Contact Us',
        content: 'Reach out with questions or to learn more.',
      },
    },
    cta: {
      primary: 'Explore Programs',
      secondary: 'Contact Us',
      primaryHref: '/programs',
      secondaryHref: '/contact',
    },
  },
  es: {
    hero: {
      title: 'Acerca de esta plataforma',
      purpose: 'Conoce nuestra misión, programas y cómo participar.',
      image: '/images/pages/comp-home-hero-programs.jpg',
      imageAlt: 'Resumen de la plataforma',
    },
    cta: {
      primary: 'Explorar programas',
      secondary: 'Contáctanos',
      primaryHref: '/programs',
      secondaryHref: '/contact',
    },
  },
};

/**
 * 10. System / Utility / Error Archetype
 */
export const systemUtilityContent: LocalizedContent = {
  en: {
    hero: {
      title: 'Page Not Found',
      purpose: "The page you're looking for doesn't exist or has been moved.",
      image: '/images/pages/comp-highlights-success.jpg',
      imageAlt: 'Page not found',
    },
    sections: {
      whatHappened: {
        title: 'What Happened',
        content:
          'This page may have been removed, renamed, or is temporarily unavailable.',
      },
      whatToDo: {
        title: 'What to Do Next',
        content:
          'Return to the homepage or use the navigation menu to find what you need.',
      },
    },
    cta: {
      primary: 'Go to Homepage',
      secondary: 'View Programs',
      primaryHref: '/',
      secondaryHref: '/programs',
    },
  },
  es: {
    hero: {
      title: 'Página no encontrada',
      purpose: 'La página que buscas no existe o ha sido movida.',
      image: '/images/pages/comp-highlights-success.jpg',
      imageAlt: 'Página no encontrada',
    },
    cta: {
      primary: 'Ir a la página principal',
      secondary: 'Ver programas',
      primaryHref: '/',
      secondaryHref: '/programs',
    },
  },
};

/**
 * Universal tooltips (used across all archetypes)
 */
export const universalTooltips = {
  en: {
    whyDoISeeThis: 'This shows what is required for your next step.',
    whyIsThisEmpty:
      'This will update after you complete the step listed above.',
    whatHappensIfISubmit: 'Your information is saved and reviewed by staff.',
    whyCantIAccessThis: 'This unlocks after required steps are completed.',
    whoCanSeeThis: 'Only you and authorized staff working with your program.',
  },
  es: {
    whyDoISeeThis: 'Muestra lo que se requiere para el siguiente paso.',
    whyIsThisEmpty: 'Se actualizará después de completar el paso indicado.',
    whatHappensIfISubmit: 'Tu información se guarda y el personal la revisa.',
    whyCantIAccessThis:
      'Se desbloquea después de completar los pasos requeridos.',
    whoCanSeeThis:
      'Solo tú y el personal autorizado que trabaja con tu programa.',
  },
};

/**
 * Global guarantee statement
 */
export const globalGuarantee = {
  en: 'If a page appears on this platform, it is complete, accurate, and ready to use.',
  es: 'Si una página aparece en esta plataforma, está completa, es correcta y está lista para usarse.',
};

/**
 * Content getter with fallback to English
 */
export function getArchetypeContent(
  archetype: string,
  locale: 'en' | 'es' = 'en'
): ArchetypeContent {
  const contentMap: Record<string, LocalizedContent> = {
    program_training_detail: programTrainingContent,
    application_enrollment_flow: applicationEnrollmentContent,
    dashboard_portal: dashboardPortalContent,
    directory_listing_search: directoryListingContent,
    policy_compliance_legal: policyComplianceContent,
    partner_employer_agency: partnerEmployerContent,
    auth_account_profile: authAccountContent,
    reporting_admin_ops: reportingAdminContent,
    marketing_informational: marketingInformationalContent,
    system_utility_error: systemUtilityContent,
  };

  const content = contentMap[archetype];
  if (!content) {
    throw new Error(`Unknown archetype: ${archetype}`);
  }

  return content[locale] || content.en;
}
