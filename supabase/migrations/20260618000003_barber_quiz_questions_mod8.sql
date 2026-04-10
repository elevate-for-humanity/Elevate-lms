-- Barber quiz questions — Module 8: State Board Exam Preparation
-- Lessons: 46, 47, 48, 49
-- 5 questions per lesson, grounded in lesson content.
-- Canonical course: 3fb5ce19-1cde-434c-a8c6-f138d7d7aa17

-- ── barber-lesson-46: Indiana State Board Exam Overview ──────────────────────
UPDATE public.course_lessons
SET quiz_questions = '[
  {
    "id": "bl46-q1",
    "question": "What is the passing score required for the Indiana State Board written exam?",
    "options": ["65%", "70%", "75%", "80%"],
    "correct": 2,
    "explanation": "The Indiana State Board written exam requires a 75% passing score. It consists of 100 multiple choice questions."
  },
  {
    "id": "bl46-q2",
    "question": "How many questions are on the Indiana State Board written exam?",
    "options": ["50", "75", "100", "120"],
    "correct": 2,
    "explanation": "The written exam has 100 multiple choice questions covering infection control, hair science, haircutting, chemical services, and Indiana law."
  },
  {
    "id": "bl46-q3",
    "question": "Which topic carries the highest weight on the Indiana State Board written exam?",
    "options": ["Chemical services (15%)", "Indiana laws and regulations (15%)", "Infection control and sanitation (25%)", "Hair science and scalp analysis (20%)"],
    "correct": 2,
    "explanation": "Infection control and sanitation is weighted at 25% — the largest single category on the written exam."
  },
  {
    "id": "bl46-q4",
    "question": "The practical exam is performed on:",
    "options": ["A photograph", "A mannequin or live model", "A synthetic wig only", "The examiner"],
    "correct": 1,
    "explanation": "The practical exam is performed on a mannequin or live model and graded by state board examiners."
  },
  {
    "id": "bl46-q5",
    "question": "Haircutting and styling accounts for what percentage of the Indiana State Board written exam?",
    "options": ["15%", "20%", "25%", "30%"],
    "correct": 2,
    "explanation": "Haircutting and styling is weighted at 25%, tied with infection control as the largest exam category."
  }
]'::jsonb
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-lesson-46';

-- ── barber-lesson-47: Written Exam Review — Sanitation & Science ─────────────
UPDATE public.course_lessons
SET quiz_questions = '[
  {
    "id": "bl47-q1",
    "question": "Between clients, tools must be:",
    "options": ["Sterilized in an autoclave", "Disinfected with an EPA-registered disinfectant", "Rinsed with hot water", "Wiped with a dry towel"],
    "correct": 1,
    "explanation": "Disinfection — not sterilization — is required between clients. EPA-registered disinfectants must be used."
  },
  {
    "id": "bl47-q2",
    "question": "Disinfectant solution must be changed:",
    "options": ["Once per week", "Once per month", "Daily or when visibly contaminated", "Only when it changes color"],
    "correct": 2,
    "explanation": "Disinfectant solution loses effectiveness over time and when contaminated. It must be changed daily or sooner if contaminated."
  },
  {
    "id": "bl47-q3",
    "question": "Which hair growth phase is the active growing phase?",
    "options": ["Catagen", "Telogen", "Anagen", "Exogen"],
    "correct": 2,
    "explanation": "Anagen is the active growth phase, lasting 2–7 years. Catagen is transitional; telogen is resting/shedding."
  },
  {
    "id": "bl47-q4",
    "question": "Melanin is found in which layer of the hair shaft?",
    "options": ["Cuticle", "Cortex", "Medulla", "Follicle"],
    "correct": 1,
    "explanation": "The cortex contains melanin — the pigment that gives hair its color. It also provides strength and elasticity."
  },
  {
    "id": "bl47-q5",
    "question": "A client presents with tinea capitis. The correct action is:",
    "options": ["Perform the service with gloves", "Apply an antifungal treatment", "Do not perform the service — refer to a physician", "Disinfect the scalp and proceed"],
    "correct": 2,
    "explanation": "Tinea capitis is a fungal scalp infection. Barbers cannot treat it — the client must be referred to a physician."
  }
]'::jsonb
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-lesson-47';

-- ── barber-lesson-48: Written Exam Review — Techniques & Laws ────────────────
UPDATE public.course_lessons
SET quiz_questions = '[
  {
    "id": "bl48-q1",
    "question": "The parietal ridge is used as a reference point for:",
    "options": ["Low fade line", "Mid fade line", "High fade line", "Neckline shaping"],
    "correct": 2,
    "explanation": "The parietal ridge is the widest part of the head and serves as the reference point for a high fade."
  },
  {
    "id": "bl48-q2",
    "question": "The occipital bone is the reference point for:",
    "options": ["High fade", "Low or mid fade", "Temple fade", "Crown blending"],
    "correct": 1,
    "explanation": "The occipital bone at the back of the skull is the reference for low and mid fade lines."
  },
  {
    "id": "bl48-q3",
    "question": "The correct angle for razor work is:",
    "options": ["15 degrees", "30 degrees", "45 degrees", "60 degrees"],
    "correct": 1,
    "explanation": "A 30-degree razor angle provides the optimal balance between closeness and safety for straight razor work."
  },
  {
    "id": "bl48-q4",
    "question": "Under Indiana law, the apprenticeship path to barber licensure requires how many OJT hours?",
    "options": ["1,000 hours", "1,500 hours", "2,000 hours", "2,500 hours"],
    "correct": 2,
    "explanation": "Indiana's apprenticeship path requires 2,000 OJT hours. The school path requires 1,500 hours of classroom/clinical training."
  },
  {
    "id": "bl48-q5",
    "question": "The first pass of a straight razor shave should be:",
    "options": ["Against the grain for closeness", "Across the grain at 45 degrees", "With the grain", "In circular motions"],
    "correct": 2,
    "explanation": "The first pass is always with the grain to reduce irritation. Subsequent passes can go across or against the grain."
  }
]'::jsonb
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-lesson-48';

-- ── barber-lesson-49: Practical Exam Preparation ─────────────────────────────
UPDATE public.course_lessons
SET quiz_questions = '[
  {
    "id": "bl49-q1",
    "question": "What is the correct order of operations at the start of a practical exam?",
    "options": [
      "Begin cutting immediately, then drape",
      "Drape client, then disinfect tools",
      "Disinfect tools, then drape client with neck strip and cape",
      "Consult with examiner before touching the client"
    ],
    "correct": 2,
    "explanation": "Tools must be disinfected first, then the client is draped with a neck strip and cape — in that order, as examiners watch for proper sanitation sequence."
  },
  {
    "id": "bl49-q2",
    "question": "During the practical exam, examiners specifically look for:",
    "options": [
      "Speed of completion",
      "Clean, even fade with smooth transitions and sharp lineup",
      "Use of the most products",
      "Conversation with the client"
    ],
    "correct": 1,
    "explanation": "Examiners grade technical execution: fade evenness, transition smoothness, lineup sharpness, and sanitation compliance."
  },
  {
    "id": "bl49-q3",
    "question": "Thinning shears are used to:",
    "options": [
      "Remove length from the hair",
      "Create a sharp outline",
      "Remove bulk without removing length",
      "Blend the fade line"
    ],
    "correct": 2,
    "explanation": "Thinning shears remove bulk from dense areas without changing the overall length — a key distinction from regular shears."
  },
  {
    "id": "bl49-q4",
    "question": "The neckline should be shaped approximately:",
    "options": [
      "At the hairline exactly",
      "1 finger-width above the Adam's apple",
      "2 finger-widths above the Adam's apple",
      "3 finger-widths above the Adam's apple"
    ],
    "correct": 2,
    "explanation": "The standard neckline position is 2 finger-widths above the Adam's apple — a clean, professional finish point."
  },
  {
    "id": "bl49-q5",
    "question": "Professional demeanor during the practical exam means:",
    "options": [
      "Talking constantly to show confidence",
      "Working silently with no client interaction",
      "Maintaining calm, focused professionalism throughout the service",
      "Asking the examiner for feedback during the cut"
    ],
    "correct": 2,
    "explanation": "Examiners assess professionalism as part of the grade. Calm, focused execution without disruption demonstrates readiness for real clients."
  }
]'::jsonb
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-lesson-49';
