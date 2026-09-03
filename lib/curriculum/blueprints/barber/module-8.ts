import type { BlueprintModule } from '../types';

export const barberModule8: BlueprintModule = {
      slug: 'barber-module-8',
      title: 'Module 8: State Board Exam Preparation',
      orderIndex: 8,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'exam_prep',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 3 },
        { lessonType: 'checkpoint', requiredCount: 1 },
        { lessonType: 'exam', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'written_exam_prep', isCritical: true, minimumTouchpoints: 3 },
        { competencyKey: 'practical_exam_prep', isCritical: true, minimumTouchpoints: 2 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-46',
          title: 'Indiana State Board Exam Overview',
          order: 1,
          domainKey: 'exam_prep',
          objective:
            'Understand the format and requirements of the Indiana barber state board exam.',
          durationMinutes: 20,
          videoFile: '/videos/barber-lessons/barber-apprenticeship-intro.mp4',
          content: `<h2>Overview</h2><p>Indiana State Board Exam Overview in Module 8: State Board Exam Preparation requires consistent technique, sanitation discipline, and judgment-based adjustments for client variation. This lesson reinforces repeatable execution standards tied to Indiana apprenticeship expectations. Learners focus on setup, safe tool handling, sequencing, and communication while maintaining service quality under time pressure. Objective: Understand the format and requirements of the Indiana barber state board exam.</p><h2>Tools Required</h2><ul><li>Primary service tools for Indiana State Board Exam Overview</li><li>Secondary detailing tools</li><li>Disinfectant solution and clean towel set</li><li>Disposable gloves and neck strips</li><li>Mirror and lighting check tools</li><li>Sectioning and control implements</li></ul><h2>Decision Logic</h2><p>If the client has coarse or dense hair, reduce speed and increase control passes to maintain clean lines. If the client has fine or fragile hair, use lighter pressure and shorter contact to avoid damage. If skin is sensitive or irritated, avoid aggressive friction and adjust technique to protect barrier function. Depending on growth pattern and head shape, alter angle and position before final refinement.</p><h2>Procedure</h2><ol><li>Sanitize station, disinfect tools, and verify all equipment is clean, dry, and organized before client contact.</li><li>Complete consultation, identify goals, and confirm contraindications, including open skin, irritation, or recent chemical sensitivity.</li><li>Drape and position client for clear visibility; maintain body mechanics and stable hand support during execution.</li><li>Execute baseline technical sequence with controlled pressure, deliberate sections, and frequent visual checks for balance.</li><li>Refine details by adjusting angle, position, and tension based on texture, density, and growth direction.</li><li>Re-check symmetry from multiple viewpoints and confirm appearance quality under direct and side lighting.</li><li>Finish service with cleanup, product guidance, and maintenance recommendations tailored to the client profile.</li></ol><h2>Safety</h2><p>Disinfect all reusable tools with an EPA-registered disinfectant between clients and follow contact-time instructions. Do not proceed when active infection signs, broken skin, or severe irritation are present; continuing can worsen inflammation and create contamination risk. Common failure mode: overworking one area due to rushed correction. Cause: poor section control and inconsistent angle. Recovery: stop, reset section lines, reduce pressure, and rebuild sequence step-by-step.</p><h2>Visual Cues</h2><p>Correct execution looks like clean transitions, stable line integrity, and uniform finish from front, profile, and rear views. Incorrect execution looks patchy, heavy, or asymmetrical with visible pressure marks and uneven blending. You should see balanced weight distribution and consistent detail boundaries. When positioning is correct, the service reads intentional and polished under normal shop lighting.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-46-q1",
                              "question": "What is the best first priority before starting Indiana State Board Exam Overview?",
                              "options": [
                                        "A. Begin immediately to save time",
                                        "B. Sanitize station and disinfect tools",
                                        "C. Skip consultation if client is returning",
                                        "D. Apply product before setup"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Safe, consistent execution starts with sanitation, tool readiness, and controlled setup."
                    },
                    {
                              "id": "barber-lesson-46-q2",
                              "question": "Which adjustment is most appropriate for fine or fragile hair?",
                              "options": [
                                        "A. Increase pressure for faster results",
                                        "B. Use heavier friction to remove bulk quickly",
                                        "C. Use lighter pressure and shorter contact",
                                        "D. Ignore variation and keep one technique"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fine or fragile hair requires lighter control to avoid breakage and uneven finish."
                    },
                    {
                              "id": "barber-lesson-46-q3",
                              "question": "What is the correct response to visible asymmetry during final check?",
                              "options": [
                                        "A. Add random detail work",
                                        "B. Stop and reset section lines before refinement",
                                        "C. Increase speed to finish sooner",
                                        "D. Ignore if one side looks acceptable"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Resetting sections and rebuilding sequence prevents overcorrection and preserves control."
                    },
                    {
                              "id": "barber-lesson-46-q4",
                              "question": "A client has sensitive skin with mild irritation. What should you do?",
                              "options": [
                                        "A. Continue with standard pressure",
                                        "B. Increase pressure to reduce passes",
                                        "C. Adjust technique to protect skin and avoid aggressive friction",
                                        "D. Skip all safety checks"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Skin variation requires controlled adaptation to prevent further irritation."
                    },
                    {
                              "id": "barber-lesson-46-q5",
                              "question": "During service you notice overworked areas from repeated corrections. What is the best recovery?",
                              "options": [
                                        "A. Keep repeating the same pass",
                                        "B. Stop, reset section lines, reduce pressure, and rebuild step-by-step",
                                        "C. Add product and continue at high speed",
                                        "D. End service without correction"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Structured recovery prevents compounding errors and restores visual balance."
                    }
          ],
        },
        {
          slug: 'barber-lesson-47',
          title: 'Written Exam Review — Sanitation & Science',
          order: 2,
          domainKey: 'exam_prep',
          objective: 'Review key concepts in sanitation and hair science for the written exam.',
          durationMinutes: 25,
          videoFile: '/videos/course-barber-sanitation-narrated.mp4',
          content: `<h2>Overview</h2><p>Written Exam Review — Sanitation & Science in Module 8: State Board Exam Preparation requires consistent technique, sanitation discipline, and judgment-based adjustments for client variation. This lesson reinforces repeatable execution standards tied to Indiana apprenticeship expectations. Learners focus on setup, safe tool handling, sequencing, and communication while maintaining service quality under time pressure. Objective: Review key concepts in sanitation and hair science for the written exam.</p><h2>Tools Required</h2><ul><li>Primary service tools for Written Exam Review — Sanitation & Science</li><li>Secondary detailing tools</li><li>Disinfectant solution and clean towel set</li><li>Disposable gloves and neck strips</li><li>Mirror and lighting check tools</li><li>Sectioning and control implements</li></ul><h2>Decision Logic</h2><p>If the client has coarse or dense hair, reduce speed and increase control passes to maintain clean lines. If the client has fine or fragile hair, use lighter pressure and shorter contact to avoid damage. If skin is sensitive or irritated, avoid aggressive friction and adjust technique to protect barrier function. Depending on growth pattern and head shape, alter angle and position before final refinement.</p><h2>Procedure</h2><ol><li>Sanitize station, disinfect tools, and verify all equipment is clean, dry, and organized before client contact.</li><li>Complete consultation, identify goals, and confirm contraindications, including open skin, irritation, or recent chemical sensitivity.</li><li>Drape and position client for clear visibility; maintain body mechanics and stable hand support during execution.</li><li>Execute baseline technical sequence with controlled pressure, deliberate sections, and frequent visual checks for balance.</li><li>Refine details by adjusting angle, position, and tension based on texture, density, and growth direction.</li><li>Re-check symmetry from multiple viewpoints and confirm appearance quality under direct and side lighting.</li><li>Finish service with cleanup, product guidance, and maintenance recommendations tailored to the client profile.</li></ol><h2>Safety</h2><p>Disinfect all reusable tools with an EPA-registered disinfectant between clients and follow contact-time instructions. Do not proceed when active infection signs, broken skin, or severe irritation are present; continuing can worsen inflammation and create contamination risk. Common failure mode: overworking one area due to rushed correction. Cause: poor section control and inconsistent angle. Recovery: stop, reset section lines, reduce pressure, and rebuild sequence step-by-step.</p><h2>Visual Cues</h2><p>Correct execution looks like clean transitions, stable line integrity, and uniform finish from front, profile, and rear views. Incorrect execution looks patchy, heavy, or asymmetrical with visible pressure marks and uneven blending. You should see balanced weight distribution and consistent detail boundaries. When positioning is correct, the service reads intentional and polished under normal shop lighting.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-47-q1",
                              "question": "What is the best first priority before starting Written Exam Review — Sanitation & Science?",
                              "options": [
                                        "A. Begin immediately to save time",
                                        "B. Sanitize station and disinfect tools",
                                        "C. Skip consultation if client is returning",
                                        "D. Apply product before setup"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Safe, consistent execution starts with sanitation, tool readiness, and controlled setup."
                    },
                    {
                              "id": "barber-lesson-47-q2",
                              "question": "Which adjustment is most appropriate for fine or fragile hair?",
                              "options": [
                                        "A. Increase pressure for faster results",
                                        "B. Use heavier friction to remove bulk quickly",
                                        "C. Use lighter pressure and shorter contact",
                                        "D. Ignore variation and keep one technique"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fine or fragile hair requires lighter control to avoid breakage and uneven finish."
                    },
                    {
                              "id": "barber-lesson-47-q3",
                              "question": "What is the correct response to visible asymmetry during final check?",
                              "options": [
                                        "A. Add random detail work",
                                        "B. Stop and reset section lines before refinement",
                                        "C. Increase speed to finish sooner",
                                        "D. Ignore if one side looks acceptable"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Resetting sections and rebuilding sequence prevents overcorrection and preserves control."
                    },
                    {
                              "id": "barber-lesson-47-q4",
                              "question": "A client has sensitive skin with mild irritation. What should you do?",
                              "options": [
                                        "A. Continue with standard pressure",
                                        "B. Increase pressure to reduce passes",
                                        "C. Adjust technique to protect skin and avoid aggressive friction",
                                        "D. Skip all safety checks"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Skin variation requires controlled adaptation to prevent further irritation."
                    },
                    {
                              "id": "barber-lesson-47-q5",
                              "question": "During service you notice overworked areas from repeated corrections. What is the best recovery?",
                              "options": [
                                        "A. Keep repeating the same pass",
                                        "B. Stop, reset section lines, reduce pressure, and rebuild step-by-step",
                                        "C. Add product and continue at high speed",
                                        "D. End service without correction"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Structured recovery prevents compounding errors and restores visual balance."
                    }
          ],
        },
        {
          slug: 'barber-lesson-48',
          title: 'Written Exam Review — Techniques & Laws',
          order: 3,
          domainKey: 'exam_prep',
          objective: 'Review haircutting techniques and Indiana laws for the written exam.',
          durationMinutes: 25,
          videoFile: '/videos/course-barber-fade-narrated.mp4',
          content: `<h2>Overview</h2><p>Written Exam Review — Techniques & Laws in Module 8: State Board Exam Preparation requires consistent technique, sanitation discipline, and judgment-based adjustments for client variation. This lesson reinforces repeatable execution standards tied to Indiana apprenticeship expectations. Learners focus on setup, safe tool handling, sequencing, and communication while maintaining service quality under time pressure. Objective: Review haircutting techniques and Indiana laws for the written exam.</p><h2>Tools Required</h2><ul><li>Primary service tools for Written Exam Review — Techniques & Laws</li><li>Secondary detailing tools</li><li>Disinfectant solution and clean towel set</li><li>Disposable gloves and neck strips</li><li>Mirror and lighting check tools</li><li>Sectioning and control implements</li></ul><h2>Decision Logic</h2><p>If the client has coarse or dense hair, reduce speed and increase control passes to maintain clean lines. If the client has fine or fragile hair, use lighter pressure and shorter contact to avoid damage. If skin is sensitive or irritated, avoid aggressive friction and adjust technique to protect barrier function. Depending on growth pattern and head shape, alter angle and position before final refinement.</p><h2>Procedure</h2><ol><li>Sanitize station, disinfect tools, and verify all equipment is clean, dry, and organized before client contact.</li><li>Complete consultation, identify goals, and confirm contraindications, including open skin, irritation, or recent chemical sensitivity.</li><li>Drape and position client for clear visibility; maintain body mechanics and stable hand support during execution.</li><li>Execute baseline technical sequence with controlled pressure, deliberate sections, and frequent visual checks for balance.</li><li>Refine details by adjusting angle, position, and tension based on texture, density, and growth direction.</li><li>Re-check symmetry from multiple viewpoints and confirm appearance quality under direct and side lighting.</li><li>Finish service with cleanup, product guidance, and maintenance recommendations tailored to the client profile.</li></ol><h2>Safety</h2><p>Disinfect all reusable tools with an EPA-registered disinfectant between clients and follow contact-time instructions. Do not proceed when active infection signs, broken skin, or severe irritation are present; continuing can worsen inflammation and create contamination risk. Common failure mode: overworking one area due to rushed correction. Cause: poor section control and inconsistent angle. Recovery: stop, reset section lines, reduce pressure, and rebuild sequence step-by-step.</p><h2>Visual Cues</h2><p>Correct execution looks like clean transitions, stable line integrity, and uniform finish from front, profile, and rear views. Incorrect execution looks patchy, heavy, or asymmetrical with visible pressure marks and uneven blending. You should see balanced weight distribution and consistent detail boundaries. When positioning is correct, the service reads intentional and polished under normal shop lighting.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-48-q1",
                              "question": "What is the best first priority before starting Written Exam Review — Techniques & Laws?",
                              "options": [
                                        "A. Begin immediately to save time",
                                        "B. Sanitize station and disinfect tools",
                                        "C. Skip consultation if client is returning",
                                        "D. Apply product before setup"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Safe, consistent execution starts with sanitation, tool readiness, and controlled setup."
                    },
                    {
                              "id": "barber-lesson-48-q2",
                              "question": "Which adjustment is most appropriate for fine or fragile hair?",
                              "options": [
                                        "A. Increase pressure for faster results",
                                        "B. Use heavier friction to remove bulk quickly",
                                        "C. Use lighter pressure and shorter contact",
                                        "D. Ignore variation and keep one technique"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fine or fragile hair requires lighter control to avoid breakage and uneven finish."
                    },
                    {
                              "id": "barber-lesson-48-q3",
                              "question": "What is the correct response to visible asymmetry during final check?",
                              "options": [
                                        "A. Add random detail work",
                                        "B. Stop and reset section lines before refinement",
                                        "C. Increase speed to finish sooner",
                                        "D. Ignore if one side looks acceptable"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Resetting sections and rebuilding sequence prevents overcorrection and preserves control."
                    },
                    {
                              "id": "barber-lesson-48-q4",
                              "question": "A client has sensitive skin with mild irritation. What should you do?",
                              "options": [
                                        "A. Continue with standard pressure",
                                        "B. Increase pressure to reduce passes",
                                        "C. Adjust technique to protect skin and avoid aggressive friction",
                                        "D. Skip all safety checks"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Skin variation requires controlled adaptation to prevent further irritation."
                    },
                    {
                              "id": "barber-lesson-48-q5",
                              "question": "During service you notice overworked areas from repeated corrections. What is the best recovery?",
                              "options": [
                                        "A. Keep repeating the same pass",
                                        "B. Stop, reset section lines, reduce pressure, and rebuild step-by-step",
                                        "C. Add product and continue at high speed",
                                        "D. End service without correction"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Structured recovery prevents compounding errors and restores visual balance."
                    }
          ],
        },
        {
          slug: 'barber-lesson-49',
          title: 'Practical Exam Preparation',
          order: 4,
          domainKey: 'exam_prep',
          objective: 'Prepare for the practical exam with a structured practice checklist.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-scissors-narrated.mp4',
          content: `<h2>Overview</h2><p>Practical Exam Preparation in Module 8: State Board Exam Preparation requires consistent technique, sanitation discipline, and judgment-based adjustments for client variation. This lesson reinforces repeatable execution standards tied to Indiana apprenticeship expectations. Learners focus on setup, safe tool handling, sequencing, and communication while maintaining service quality under time pressure. Objective: Prepare for the practical exam with a structured practice checklist.</p><h2>Tools Required</h2><ul><li>Primary service tools for Practical Exam Preparation</li><li>Secondary detailing tools</li><li>Disinfectant solution and clean towel set</li><li>Disposable gloves and neck strips</li><li>Mirror and lighting check tools</li><li>Sectioning and control implements</li></ul><h2>Decision Logic</h2><p>If the client has coarse or dense hair, reduce speed and increase control passes to maintain clean lines. If the client has fine or fragile hair, use lighter pressure and shorter contact to avoid damage. If skin is sensitive or irritated, avoid aggressive friction and adjust technique to protect barrier function. Depending on growth pattern and head shape, alter angle and position before final refinement.</p><h2>Procedure</h2><ol><li>Sanitize station, disinfect tools, and verify all equipment is clean, dry, and organized before client contact.</li><li>Complete consultation, identify goals, and confirm contraindications, including open skin, irritation, or recent chemical sensitivity.</li><li>Drape and position client for clear visibility; maintain body mechanics and stable hand support during execution.</li><li>Execute baseline technical sequence with controlled pressure, deliberate sections, and frequent visual checks for balance.</li><li>Refine details by adjusting angle, position, and tension based on texture, density, and growth direction.</li><li>Re-check symmetry from multiple viewpoints and confirm appearance quality under direct and side lighting.</li><li>Finish service with cleanup, product guidance, and maintenance recommendations tailored to the client profile.</li></ol><h2>Safety</h2><p>Disinfect all reusable tools with an EPA-registered disinfectant between clients and follow contact-time instructions. Do not proceed when active infection signs, broken skin, or severe irritation are present; continuing can worsen inflammation and create contamination risk. Common failure mode: overworking one area due to rushed correction. Cause: poor section control and inconsistent angle. Recovery: stop, reset section lines, reduce pressure, and rebuild sequence step-by-step.</p><h2>Visual Cues</h2><p>Correct execution looks like clean transitions, stable line integrity, and uniform finish from front, profile, and rear views. Incorrect execution looks patchy, heavy, or asymmetrical with visible pressure marks and uneven blending. You should see balanced weight distribution and consistent detail boundaries. When positioning is correct, the service reads intentional and polished under normal shop lighting.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-49-q1",
                              "question": "What is the best first priority before starting Practical Exam Preparation?",
                              "options": [
                                        "A. Begin immediately to save time",
                                        "B. Sanitize station and disinfect tools",
                                        "C. Skip consultation if client is returning",
                                        "D. Apply product before setup"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Safe, consistent execution starts with sanitation, tool readiness, and controlled setup."
                    },
                    {
                              "id": "barber-lesson-49-q2",
                              "question": "Which adjustment is most appropriate for fine or fragile hair?",
                              "options": [
                                        "A. Increase pressure for faster results",
                                        "B. Use heavier friction to remove bulk quickly",
                                        "C. Use lighter pressure and shorter contact",
                                        "D. Ignore variation and keep one technique"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fine or fragile hair requires lighter control to avoid breakage and uneven finish."
                    },
                    {
                              "id": "barber-lesson-49-q3",
                              "question": "What is the correct response to visible asymmetry during final check?",
                              "options": [
                                        "A. Add random detail work",
                                        "B. Stop and reset section lines before refinement",
                                        "C. Increase speed to finish sooner",
                                        "D. Ignore if one side looks acceptable"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Resetting sections and rebuilding sequence prevents overcorrection and preserves control."
                    },
                    {
                              "id": "barber-lesson-49-q4",
                              "question": "A client has sensitive skin with mild irritation. What should you do?",
                              "options": [
                                        "A. Continue with standard pressure",
                                        "B. Increase pressure to reduce passes",
                                        "C. Adjust technique to protect skin and avoid aggressive friction",
                                        "D. Skip all safety checks"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Skin variation requires controlled adaptation to prevent further irritation."
                    },
                    {
                              "id": "barber-lesson-49-q5",
                              "question": "During service you notice overworked areas from repeated corrections. What is the best recovery?",
                              "options": [
                                        "A. Keep repeating the same pass",
                                        "B. Stop, reset section lines, reduce pressure, and rebuild step-by-step",
                                        "C. Add product and continue at high speed",
                                        "D. End service without correction"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Structured recovery prevents compounding errors and restores visual balance."
                    }
          ],
        },
        {
          slug: 'barber-indiana-state-board-exam',
          title: 'Program Final Exam',
          order: 5,
          domainKey: 'exam_prep',
          objective: 'Demonstrate comprehensive mastery of the barber apprenticeship curriculum.',
          durationMinutes: 30,
          passingScore: 70,
          content: `<h2>Program Final Exam</h2><p>This comprehensive final exam covers all modules of the Indiana Barber Apprenticeship program. Topics include infection control and sanitation, hair science, tools and equipment, haircutting techniques, shaving and beard services, chemical services, professional skills, anatomy and physiology, skin science, shampooing and conditioning, thermal styling, advanced color, Indiana laws, and career development. Score 70% or higher to complete the program and be eligible for the Indiana state board exams.</p>`,
          quizQuestions: [
            // ── INFECTION CONTROL & SANITATION ───────────────────────────────
            {
              id: 'ep-q1',
              question: 'What type of disinfectant is required in Indiana barbershops?',
              options: [
                'Any hospital-grade cleaner',
                'EPA-registered disinfectant',
                'Bleach and water only',
                'Isopropyl alcohol only',
              ],
              correctAnswer: 1,
              explanation:
                'Indiana requires EPA-registered disinfectants — these meet federal efficacy standards for killing pathogens on tools.',
            },
            {
              id: 'ep-q2',
              question: 'Disinfectant solution in a wet sanitizer should be changed:',
              options: [
                'Once a week',
                'Daily or when contaminated/visibly soiled',
                'Once a month',
                'Only when it smells bad',
              ],
              correctAnswer: 1,
              explanation:
                'Disinfectant solution must be changed daily or whenever it becomes contaminated or visibly soiled.',
            },
            {
              id: 'ep-q3',
              question: 'A client has tinea capitis. You should:',
              options: [
                'Proceed with gloves',
                'Perform a dry cut only',
                'Decline service and refer to a physician',
                'Use medicated shampoo first',
              ],
              correctAnswer: 2,
              explanation:
                'Tinea capitis (ringworm of the scalp) is a contagious fungal infection — no services may be performed.',
            },
            {
              id: 'ep-q4',
              question: 'Shavette blades must be disposed of in:',
              options: [
                'The regular trash',
                'A sealed plastic bag',
                'A sharps (puncture-resistant) container',
                'The recycling bin',
              ],
              correctAnswer: 2,
              explanation:
                'Single-use sharps are biohazardous and must always go into a puncture-resistant sharps container.',
            },
            {
              id: 'ep-q5',
              question: 'When blood exposure occurs during a service, what is the FIRST action?',
              options: [
                'Continue the service with gloves',
                'Stop the service immediately',
                "Apply antiseptic to the barber's hands",
                'Change tools and continue',
              ],
              correctAnswer: 1,
              explanation:
                'Stopping the service immediately is the first step in the blood exposure protocol — client safety comes first.',
            },
            // ── HAIR SCIENCE ─────────────────────────────────────────────────
            {
              id: 'ep-q6',
              question: 'Which layer of the hair shaft contains melanin?',
              options: ['Cuticle', 'Cortex', 'Medulla', 'Follicle sheath'],
              correctAnswer: 1,
              explanation:
                'The cortex is the middle layer of the hair shaft and contains the melanin granules that determine hair color.',
            },
            {
              id: 'ep-q7',
              question: 'The active hair growth phase is called:',
              options: ['Telogen', 'Catagen', 'Anagen', 'Kenogen'],
              correctAnswer: 2,
              explanation:
                'Anagen is the active growth phase, lasting 2–7 years and determining the potential length of the hair.',
            },
            {
              id: 'ep-q8',
              question: 'Normal daily hair loss for a healthy adult is approximately:',
              options: ['10–25 hairs', '50–100 hairs', '150–200 hairs', '300+ hairs'],
              correctAnswer: 1,
              explanation:
                'Losing 50–100 hairs per day is within the normal range for the hair growth cycle.',
            },
            {
              id: 'ep-q9',
              question: 'High porosity hair indicates:',
              options: [
                'A healthy, compact cuticle',
                'A damaged or raised cuticle',
                'Excess melanin',
                'Underactive sebaceous glands',
              ],
              correctAnswer: 1,
              explanation:
                'High porosity results from a damaged or raised cuticle that absorbs moisture quickly but cannot retain it.',
            },
            {
              id: 'ep-q10',
              question: 'The healthy pH range for hair and scalp is:',
              options: ['1.0–2.0', '4.5–5.5', '7.0–8.0', '9.0–10.0'],
              correctAnswer: 1,
              explanation:
                'Hair and scalp are slightly acidic at pH 4.5–5.5. Products outside this range can disrupt the moisture balance.',
            },
            // ── TOOLS & EQUIPMENT ────────────────────────────────────────────
            {
              id: 'ep-q11',
              question: "What is placed around the client's neck before the cutting cape?",
              options: ['A towel', 'A neck strip', 'A paper collar', 'Nothing is required'],
              correctAnswer: 1,
              explanation:
                "A neck strip (paper neck strip) prevents the cape from directly touching and irritating the client's skin.",
            },
            {
              id: 'ep-q12',
              question:
                'How many drops of oil should be applied to clipper blades during maintenance?',
              options: ['10–15 drops', '5–8 drops', '2–3 drops', 'Soak the blades'],
              correctAnswer: 2,
              explanation:
                '2–3 drops while the clipper is running is sufficient — excess oil attracts hair debris.',
            },
            {
              id: 'ep-q13',
              question: 'The #0 clipper guard (no guard attached) produces:',
              options: ['1/8 inch', '1/4 inch', 'Skin-level (closest to skin)', '3/8 inch'],
              correctAnswer: 2,
              explanation:
                'Removing the guard entirely (or using #0) produces the closest possible clipper cut — used for skin fades.',
            },
            {
              id: 'ep-q14',
              question: 'Thinning shears are used to:',
              options: [
                'Create blunt lines',
                'Remove bulk without changing overall length',
                'Create a skin fade',
                'Texturize and point-cut simultaneously',
              ],
              correctAnswer: 1,
              explanation:
                'Thinning shears have one serrated blade and are designed to remove bulk while maintaining length.',
            },
            {
              id: 'ep-q15',
              question:
                'The correct chair height for ergonomic barbering positions the barber to work at:',
              options: [
                'Eye level with the client',
                'Elbow level',
                'Shoulder level',
                'Waist level',
              ],
              correctAnswer: 1,
              explanation:
                'Working at elbow level keeps the back straight, prevents hunching, and reduces repetitive strain.',
            },
            // ── HAIRCUTTING TECHNIQUES ────────────────────────────────────────
            {
              id: 'ep-q16',
              question: 'The neckline is set at:',
              options: [
                'The jawline',
                "The Adam's apple",
                "Two finger-widths above the Adam's apple",
                'The occipital bone',
              ],
              correctAnswer: 2,
              explanation:
                "Two finger-widths above the Adam's apple is the standard neckline position taught in state board preparation.",
            },
            {
              id: 'ep-q17',
              question: 'A mid fade starts at which reference point?',
              options: ['The nape', 'The occipital bone', 'The temple', 'The parietal ridge'],
              correctAnswer: 2,
              explanation:
                'A mid fade begins at the temple area — between the low fade (near occipital) and high fade (parietal ridge).',
            },
            {
              id: 'ep-q18',
              question: 'The parietal ridge is the reference point for:',
              options: ['Low fade', 'Mid fade', 'High fade', 'Neckline placement'],
              correctAnswer: 2,
              explanation:
                'The parietal ridge — the widest part of the head — is the starting point for a high fade.',
            },
            {
              id: 'ep-q19',
              question: 'Point cutting is used to:',
              options: [
                'Create a blunt, heavy line',
                'Remove weight and add texture',
                'Execute a skin fade',
                'Establish the guide line',
              ],
              correctAnswer: 1,
              explanation:
                'Point cutting removes weight from the ends and adds texture and movement to the hair.',
            },
            {
              id: 'ep-q20',
              question: 'Scissor over comb produces a result that is:',
              options: [
                'Identical to clipper over comb',
                'Softer and more natural than clipper over comb',
                'Always shorter than clipper over comb',
                'Used only for fades',
              ],
              correctAnswer: 1,
              explanation:
                'Scissor over comb produces a softer, more natural finish, often preferred for textured or ethnic hair.',
            },
            // ── SHAVING & BEARD ───────────────────────────────────────────────
            {
              id: 'ep-q21',
              question: 'The first pass in a three-pass straight razor shave goes:',
              options: [
                'Against the grain',
                'Across the grain',
                'With the grain',
                'In circular motions',
              ],
              correctAnswer: 2,
              explanation:
                'The first pass (WTG — with the grain) safely removes the bulk of the beard before closer passes.',
            },
            {
              id: 'ep-q22',
              question: 'The straight razor should be held at what angle to the skin?',
              options: ['15 degrees', '30 degrees', '45 degrees', '60 degrees'],
              correctAnswer: 1,
              explanation:
                'A 30-degree angle provides optimal closeness while minimizing the risk of cuts.',
            },
            {
              id: 'ep-q23',
              question: 'Razor bumps (pseudofolliculitis barbae) are most common in clients with:',
              options: ['Straight hair', 'Fine hair', 'Curly hair', 'Thick hair'],
              correctAnswer: 2,
              explanation:
                'Curly hair tends to re-enter the skin after shaving, causing ingrown hairs and razor bumps.',
            },
            {
              id: 'ep-q24',
              question: 'Which product is applied to a razor nick to stop minor bleeding?',
              options: ['Pre-shave oil', 'Aftershave balm', 'Alum block', 'Witch hazel'],
              correctAnswer: 2,
              explanation:
                'An alum block is an antiseptic astringent that constricts blood vessels to stop minor bleeding from nicks.',
            },
            {
              id: 'ep-q25',
              question: 'The standard neckline position for beard design is:',
              options: [
                'At the jawline',
                "At the Adam's apple",
                "Two finger-widths above the Adam's apple",
                'Below the chin',
              ],
              correctAnswer: 2,
              explanation:
                "Two finger-widths above the Adam's apple is the industry standard for beard necklines.",
            },
            // ── CHEMICAL SERVICES ─────────────────────────────────────────────
            {
              id: 'ep-q26',
              question: 'A patch test must be performed how long before a chemical service?',
              options: ['1 hour', '6 hours', '24–48 hours', '1 week'],
              correctAnswer: 2,
              explanation:
                'A 24–48 hour window is required to detect any allergic reaction before performing the service.',
            },
            {
              id: 'ep-q27',
              question: 'Relaxers break which bonds in the hair to straighten it?',
              options: [
                'Hydrogen bonds',
                'Disulfide bonds in the cortex',
                'Melanin bonds',
                'Cuticle bonds',
              ],
              correctAnswer: 1,
              explanation:
                'Chemical relaxers break the disulfide bonds in the hair cortex — the bonds that create the curl pattern.',
            },
            {
              id: 'ep-q28',
              question: 'What stops the relaxer chemical process?',
              options: ['Shampoo', 'Water rinse', 'Neutralizer', 'Conditioner'],
              correctAnswer: 2,
              explanation:
                "The neutralizer restores the hair's pH and halts the relaxer from processing further.",
            },
            {
              id: 'ep-q29',
              question: 'Hair color level 1 represents:',
              options: ['Lightest blonde', 'Medium brown', 'Dark brown', 'Black'],
              correctAnswer: 3,
              explanation:
                'Level 1 is the darkest (black). Level 10 is the lightest (pale blonde). The scale goes darkest to lightest.',
            },
            {
              id: 'ep-q30',
              question: 'Before applying a relaxer, the scalp should be protected with:',
              options: ['Pre-shave oil', 'Petroleum jelly (base)', 'Aloe vera gel', 'Conditioner'],
              correctAnswer: 1,
              explanation:
                'Petroleum jelly (base) is applied to the scalp to protect it from chemical burns during relaxer application.',
            },
            // ── PROFESSIONAL SKILLS ───────────────────────────────────────────
            {
              id: 'ep-q31',
              question: 'Indiana barber licenses must be renewed every:',
              options: ['1 year', '2 years', '3 years', '5 years'],
              correctAnswer: 1,
              explanation: 'Indiana requires barber license renewal every two years.',
            },
            {
              id: 'ep-q32',
              question:
                'In a booth rental arrangement, the barber keeps what percentage of service revenue?',
              options: ['40–60%', '70–80%', '90–95%', '100%'],
              correctAnswer: 3,
              explanation:
                'Booth renters are self-employed — they keep 100% of service revenue after paying their fixed booth fee.',
            },
            {
              id: 'ep-q33',
              question: 'What is the standard tip for barbering services?',
              options: ['5–10%', '15–20%', '25–30%', 'Tips are not standard'],
              correctAnswer: 1,
              explanation:
                '15–20% is the industry standard tip for personal service professionals including barbers.',
            },
            {
              id: 'ep-q34',
              question:
                'Self-employed barbers should set aside what percentage of income for taxes?',
              options: ['5–10%', '15–20%', '25–30%', '40–50%'],
              correctAnswer: 2,
              explanation:
                'Self-employed individuals pay income tax plus self-employment tax (Social Security + Medicare), totaling 25–30%.',
            },
            {
              id: 'ep-q35',
              question: 'Which styling product provides medium-to-high hold with a MATTE finish?',
              options: ['Pomade', 'Gel', 'Clay', 'Cream'],
              correctAnswer: 2,
              explanation:
                'Clay provides medium-to-high hold with a natural matte finish — popular for modern textured styles.',
            },
            // ── INDIANA LAWS & REGULATIONS ────────────────────────────────────
            {
              id: 'ep-q36',
              question: 'The Indiana Barber Act is located in:',
              options: [
                'Indiana Code Title 16, Article 4',
                'Indiana Code Title 25, Article 8',
                'Indiana Code Title 22, Article 3',
                'Indiana Code Title 12, Article 7',
              ],
              correctAnswer: 1,
              explanation:
                'Indiana Code Title 25, Article 8 governs all licensed barbers and barbershops in Indiana.',
            },
            {
              id: 'ep-q37',
              question: 'Barbershop licenses in Indiana are issued by:',
              options: [
                'The Indiana Department of Health',
                'The Indiana Professional Licensing Agency (IPLA)',
                'The Indiana State Board of Education',
                'The U.S. Department of Labor',
              ],
              correctAnswer: 1,
              explanation:
                'The Indiana Professional Licensing Agency (IPLA) administers all barber and barbershop licenses in the state.',
            },
            {
              id: 'ep-q38',
              question: 'Indiana barber licenses must be displayed:',
              options: [
                'At the shop entrance',
                "At each barber's individual workstation",
                "In the shop owner's office only",
                'Online only',
              ],
              correctAnswer: 1,
              explanation:
                "Each licensed barber's license must be displayed at their workstation — this is an inspectable requirement.",
            },
            {
              id: 'ep-q39',
              question: 'The passing score for the Indiana barber written state board exam is:',
              options: ['60%', '70%', '75%', '80%'],
              correctAnswer: 2,
              explanation:
                'Indiana requires a 75% passing score on the written portion of the state board examination.',
            },
            {
              id: 'ep-q40',
              question:
                'The DOL-registered apprenticeship path to a barber license in Indiana requires:',
              options: ['1,000 OJT hours', '1,500 OJT hours', '2,000 OJT hours', '2,500 OJT hours'],
              correctAnswer: 2,
              explanation:
                'The Department of Labor registered apprenticeship path requires 2,000 on-the-job training hours.',
            },
            // ── ANATOMY & PHYSIOLOGY ──────────────────────────────────────────
            {
              id: 'ep-q41',
              question: 'The human skull has how many cranial bones?',
              options: ['6', '7', '8', '10'],
              correctAnswer: 2,
              explanation:
                'There are 8 cranial bones: frontal, 2 parietal, 2 temporal, occipital, ethmoid, and sphenoid.',
            },
            {
              id: 'ep-q42',
              question: 'The largest movable bone in the face is the:',
              options: ['Frontal bone', 'Zygomatic bone', 'Maxilla', 'Mandible'],
              correctAnswer: 3,
              explanation:
                'The mandible (lower jaw) is the only movable bone of the face — it hinges at the temporomandibular joint.',
            },
            {
              id: 'ep-q43',
              question: 'The muscle primarily responsible for chewing is the:',
              options: ['Frontalis', 'Masseter', 'Trapezius', 'Orbicularis oris'],
              correctAnswer: 1,
              explanation:
                'The masseter muscle closes the jaw and is the primary muscle of mastication (chewing).',
            },
            {
              id: 'ep-q44',
              question: 'The trigeminal nerve is cranial nerve number:',
              options: ['III', 'IV', 'V', 'VII'],
              correctAnswer: 2,
              explanation:
                'Cranial nerve V (the trigeminal) provides sensation to the face and scalp and is key to facial massage knowledge.',
            },
            {
              id: 'ep-q45',
              question: 'Sebum is produced by:',
              options: ['Sweat glands', 'Sebaceous glands', 'The dermis layer', 'The hair medulla'],
              correctAnswer: 1,
              explanation:
                'Sebaceous (oil) glands produce sebum, which lubricates the hair and skin and is part of the acid mantle.',
            },
            // ── SKIN SCIENCE & FACIALS ────────────────────────────────────────
            {
              id: 'ep-q46',
              question: 'Hair follicles and sebaceous glands are located in the:',
              options: ['Epidermis', 'Dermis', 'Subcutaneous layer', 'Stratum corneum'],
              correctAnswer: 1,
              explanation:
                'The dermis (middle layer of the skin) contains hair follicles, sebaceous glands, sweat glands, and blood vessels.',
            },
            {
              id: 'ep-q47',
              question: 'Oily skin is characterized by:',
              options: [
                'Small tight pores and a matte finish',
                'Enlarged pores and a shiny appearance',
                'Flaking and tightness',
                'Redness and easy irritation',
              ],
              correctAnswer: 1,
              explanation:
                'Oily skin results from overactive sebaceous glands — enlarged pores and shininess are the telltale signs.',
            },
            {
              id: 'ep-q48',
              question: 'The opening and closing stroke used in facial massage is called:',
              options: ['Petrissage', 'Tapotement', 'Effleurage', 'Friction'],
              correctAnswer: 2,
              explanation:
                'Effleurage is the light, stroking movement used to open and close a facial massage — it relaxes and prepares the skin.',
            },
            // ── ADVANCED COLOR ────────────────────────────────────────────────
            {
              id: 'ep-q49',
              question: '20-volume developer lifts hair approximately:',
              options: ['0–1 level', '1–2 levels', '3–4 levels', '5+ levels'],
              correctAnswer: 1,
              explanation:
                '20-volume developer provides 1–2 levels of lift — the most common developer for permanent color services.',
            },
            {
              id: 'ep-q50',
              question: 'Purple toner is used to neutralize which unwanted hair tone?',
              options: ['Orange', 'Red', 'Yellow/brassy', 'Green'],
              correctAnswer: 2,
              explanation:
                'Purple and yellow are complementary colors — purple toner cancels out yellow/brassy tones in lightened hair.',
            },
          ],
        },
      ],
    }
;
