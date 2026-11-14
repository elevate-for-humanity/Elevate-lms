import type { BlueprintModule } from '../types';

export const barberModule7: BlueprintModule = {
      slug: 'barber-module-7',
      title: 'Module 7: Professional & Business Skills',
      orderIndex: 7,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'professional_skills',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'client_retention', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'shop_management', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'professional_image', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-40',
          title: 'Building Your Clientele',
          order: 1,
          domainKey: 'professional_skills',
          objective: 'Apply strategies to attract and retain clients.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation.mp4',
          content: `<h2>Overview</h2><p>Building Your Clientele in Module 7: Professional & Business Skills requires consistent technique, sanitation discipline, and judgment-based adjustments for client variation. This lesson reinforces repeatable execution standards tied to Indiana apprenticeship expectations. Learners focus on setup, safe tool handling, sequencing, and communication while maintaining service quality under time pressure. Objective: Apply strategies to attract and retain clients.</p><h2>Tools Required</h2><ul><li>Primary service tools for Building Your Clientele</li><li>Secondary detailing tools</li><li>Disinfectant solution and clean towel set</li><li>Disposable gloves and neck strips</li><li>Mirror and lighting check tools</li><li>Sectioning and control implements</li></ul><h2>Decision Logic</h2><p>If the client has coarse or dense hair, reduce speed and increase control passes to maintain clean lines. If the client has fine or fragile hair, use lighter pressure and shorter contact to avoid damage. If skin is sensitive or irritated, avoid aggressive friction and adjust technique to protect barrier function. Depending on growth pattern and head shape, alter angle and position before final refinement.</p><h2>Procedure</h2><ol><li>Sanitize station, disinfect tools, and verify all equipment is clean, dry, and organized before client contact.</li><li>Complete consultation, identify goals, and confirm contraindications, including open skin, irritation, or recent chemical sensitivity.</li><li>Drape and position client for clear visibility; maintain body mechanics and stable hand support during execution.</li><li>Execute baseline technical sequence with controlled pressure, deliberate sections, and frequent visual checks for balance.</li><li>Refine details by adjusting angle, position, and tension based on texture, density, and growth direction.</li><li>Re-check symmetry from multiple viewpoints and confirm appearance quality under direct and side lighting.</li><li>Finish service with cleanup, product guidance, and maintenance recommendations tailored to the client profile.</li></ol><h2>Safety</h2><p>Disinfect all reusable tools with an EPA-registered disinfectant between clients and follow contact-time instructions. Do not proceed when active infection signs, broken skin, or severe irritation are present; continuing can worsen inflammation and create contamination risk. Common failure mode: overworking one area due to rushed correction. Cause: poor section control and inconsistent angle. Recovery: stop, reset section lines, reduce pressure, and rebuild sequence step-by-step.</p><h2>Visual Cues</h2><p>Correct execution looks like clean transitions, stable line integrity, and uniform finish from front, profile, and rear views. Incorrect execution looks patchy, heavy, or asymmetrical with visible pressure marks and uneven blending. You should see balanced weight distribution and consistent detail boundaries. When positioning is correct, the service reads intentional and polished under normal shop lighting.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-40-q1",
                              "question": "What is the best first priority before starting Building Your Clientele?",
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
                              "id": "barber-lesson-40-q2",
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
                              "id": "barber-lesson-40-q3",
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
                              "id": "barber-lesson-40-q4",
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
                              "id": "barber-lesson-40-q5",
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
          slug: 'barber-lesson-41',
          title: 'Booth Rental vs. Commission vs. Ownership',
          order: 2,
          domainKey: 'professional_skills',
          objective: 'Compare barbershop business models and their financial implications.',
          durationMinutes: 20,
          videoFile: '/videos/barber-shop-culture.mp4',
          content: `<h2>Overview</h2><p>Booth Rental vs. Commission vs. Ownership in Module 7: Professional & Business Skills requires consistent technique, sanitation discipline, and judgment-based adjustments for client variation. This lesson reinforces repeatable execution standards tied to Indiana apprenticeship expectations. Learners focus on setup, safe tool handling, sequencing, and communication while maintaining service quality under time pressure. Objective: Compare barbershop business models and their financial implications.</p><h2>Tools Required</h2><ul><li>Primary service tools for Booth Rental vs. Commission vs. Ownership</li><li>Secondary detailing tools</li><li>Disinfectant solution and clean towel set</li><li>Disposable gloves and neck strips</li><li>Mirror and lighting check tools</li><li>Sectioning and control implements</li></ul><h2>Decision Logic</h2><p>If the client has coarse or dense hair, reduce speed and increase control passes to maintain clean lines. If the client has fine or fragile hair, use lighter pressure and shorter contact to avoid damage. If skin is sensitive or irritated, avoid aggressive friction and adjust technique to protect barrier function. Depending on growth pattern and head shape, alter angle and position before final refinement.</p><h2>Procedure</h2><ol><li>Sanitize station, disinfect tools, and verify all equipment is clean, dry, and organized before client contact.</li><li>Complete consultation, identify goals, and confirm contraindications, including open skin, irritation, or recent chemical sensitivity.</li><li>Drape and position client for clear visibility; maintain body mechanics and stable hand support during execution.</li><li>Execute baseline technical sequence with controlled pressure, deliberate sections, and frequent visual checks for balance.</li><li>Refine details by adjusting angle, position, and tension based on texture, density, and growth direction.</li><li>Re-check symmetry from multiple viewpoints and confirm appearance quality under direct and side lighting.</li><li>Finish service with cleanup, product guidance, and maintenance recommendations tailored to the client profile.</li></ol><h2>Safety</h2><p>Disinfect all reusable tools with an EPA-registered disinfectant between clients and follow contact-time instructions. Do not proceed when active infection signs, broken skin, or severe irritation are present; continuing can worsen inflammation and create contamination risk. Common failure mode: overworking one area due to rushed correction. Cause: poor section control and inconsistent angle. Recovery: stop, reset section lines, reduce pressure, and rebuild sequence step-by-step.</p><h2>Visual Cues</h2><p>Correct execution looks like clean transitions, stable line integrity, and uniform finish from front, profile, and rear views. Incorrect execution looks patchy, heavy, or asymmetrical with visible pressure marks and uneven blending. You should see balanced weight distribution and consistent detail boundaries. When positioning is correct, the service reads intentional and polished under normal shop lighting.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-41-q1",
                              "question": "What is the best first priority before starting Booth Rental vs. Commission vs. Ownership?",
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
                              "id": "barber-lesson-41-q2",
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
                              "id": "barber-lesson-41-q3",
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
                              "id": "barber-lesson-41-q4",
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
                              "id": "barber-lesson-41-q5",
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
          slug: 'barber-lesson-42',
          title: 'Pricing, Tipping & Financial Basics',
          order: 3,
          domainKey: 'professional_skills',
          objective: 'Set competitive prices and manage basic barbershop finances.',
          durationMinutes: 20,
          videoFile: '/videos/barber-shop-culture.mp4',
          content: `<h2>Overview</h2><p>Pricing, Tipping & Financial Basics in Module 7: Professional & Business Skills requires consistent technique, sanitation discipline, and judgment-based adjustments for client variation. This lesson reinforces repeatable execution standards tied to Indiana apprenticeship expectations. Learners focus on setup, safe tool handling, sequencing, and communication while maintaining service quality under time pressure. Objective: Set competitive prices and manage basic barbershop finances.</p><h2>Tools Required</h2><ul><li>Primary service tools for Pricing, Tipping & Financial Basics</li><li>Secondary detailing tools</li><li>Disinfectant solution and clean towel set</li><li>Disposable gloves and neck strips</li><li>Mirror and lighting check tools</li><li>Sectioning and control implements</li></ul><h2>Decision Logic</h2><p>If the client has coarse or dense hair, reduce speed and increase control passes to maintain clean lines. If the client has fine or fragile hair, use lighter pressure and shorter contact to avoid damage. If skin is sensitive or irritated, avoid aggressive friction and adjust technique to protect barrier function. Depending on growth pattern and head shape, alter angle and position before final refinement.</p><h2>Procedure</h2><ol><li>Sanitize station, disinfect tools, and verify all equipment is clean, dry, and organized before client contact.</li><li>Complete consultation, identify goals, and confirm contraindications, including open skin, irritation, or recent chemical sensitivity.</li><li>Drape and position client for clear visibility; maintain body mechanics and stable hand support during execution.</li><li>Execute baseline technical sequence with controlled pressure, deliberate sections, and frequent visual checks for balance.</li><li>Refine details by adjusting angle, position, and tension based on texture, density, and growth direction.</li><li>Re-check symmetry from multiple viewpoints and confirm appearance quality under direct and side lighting.</li><li>Finish service with cleanup, product guidance, and maintenance recommendations tailored to the client profile.</li></ol><h2>Safety</h2><p>Disinfect all reusable tools with an EPA-registered disinfectant between clients and follow contact-time instructions. Do not proceed when active infection signs, broken skin, or severe irritation are present; continuing can worsen inflammation and create contamination risk. Common failure mode: overworking one area due to rushed correction. Cause: poor section control and inconsistent angle. Recovery: stop, reset section lines, reduce pressure, and rebuild sequence step-by-step.</p><h2>Visual Cues</h2><p>Correct execution looks like clean transitions, stable line integrity, and uniform finish from front, profile, and rear views. Incorrect execution looks patchy, heavy, or asymmetrical with visible pressure marks and uneven blending. You should see balanced weight distribution and consistent detail boundaries. When positioning is correct, the service reads intentional and polished under normal shop lighting.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-42-q1",
                              "question": "What is the best first priority before starting Pricing, Tipping & Financial Basics?",
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
                              "id": "barber-lesson-42-q2",
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
                              "id": "barber-lesson-42-q3",
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
                              "id": "barber-lesson-42-q4",
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
                              "id": "barber-lesson-42-q5",
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
          slug: 'barber-lesson-43',
          title: 'Professionalism & Ethics',
          order: 4,
          domainKey: 'professional_skills',
          objective: 'Apply professional and ethical standards in the barbershop.',
          durationMinutes: 15,
          videoFile: '/videos/barber-client-experience.mp4',
          content: `<h2>Overview</h2><p>Professionalism & Ethics in Module 7: Professional & Business Skills requires consistent technique, sanitation discipline, and judgment-based adjustments for client variation. This lesson reinforces repeatable execution standards tied to Indiana apprenticeship expectations. Learners focus on setup, safe tool handling, sequencing, and communication while maintaining service quality under time pressure. Objective: Apply professional and ethical standards in the barbershop.</p><h2>Tools Required</h2><ul><li>Primary service tools for Professionalism & Ethics</li><li>Secondary detailing tools</li><li>Disinfectant solution and clean towel set</li><li>Disposable gloves and neck strips</li><li>Mirror and lighting check tools</li><li>Sectioning and control implements</li></ul><h2>Decision Logic</h2><p>If the client has coarse or dense hair, reduce speed and increase control passes to maintain clean lines. If the client has fine or fragile hair, use lighter pressure and shorter contact to avoid damage. If skin is sensitive or irritated, avoid aggressive friction and adjust technique to protect barrier function. Depending on growth pattern and head shape, alter angle and position before final refinement.</p><h2>Procedure</h2><ol><li>Sanitize station, disinfect tools, and verify all equipment is clean, dry, and organized before client contact.</li><li>Complete consultation, identify goals, and confirm contraindications, including open skin, irritation, or recent chemical sensitivity.</li><li>Drape and position client for clear visibility; maintain body mechanics and stable hand support during execution.</li><li>Execute baseline technical sequence with controlled pressure, deliberate sections, and frequent visual checks for balance.</li><li>Refine details by adjusting angle, position, and tension based on texture, density, and growth direction.</li><li>Re-check symmetry from multiple viewpoints and confirm appearance quality under direct and side lighting.</li><li>Finish service with cleanup, product guidance, and maintenance recommendations tailored to the client profile.</li></ol><h2>Safety</h2><p>Disinfect all reusable tools with an EPA-registered disinfectant between clients and follow contact-time instructions. Do not proceed when active infection signs, broken skin, or severe irritation are present; continuing can worsen inflammation and create contamination risk. Common failure mode: overworking one area due to rushed correction. Cause: poor section control and inconsistent angle. Recovery: stop, reset section lines, reduce pressure, and rebuild sequence step-by-step.</p><h2>Visual Cues</h2><p>Correct execution looks like clean transitions, stable line integrity, and uniform finish from front, profile, and rear views. Incorrect execution looks patchy, heavy, or asymmetrical with visible pressure marks and uneven blending. You should see balanced weight distribution and consistent detail boundaries. When positioning is correct, the service reads intentional and polished under normal shop lighting.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-43-q1",
                              "question": "What is the best first priority before starting Professionalism & Ethics?",
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
                              "id": "barber-lesson-43-q2",
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
                              "id": "barber-lesson-43-q3",
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
                              "id": "barber-lesson-43-q4",
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
                              "id": "barber-lesson-43-q5",
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
          slug: 'barber-lesson-44',
          title: 'Styling Products & Finishing',
          order: 5,
          domainKey: 'professional_skills',
          objective: 'Select and apply appropriate styling products for different hair types.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-styling-narrated.mp4',
          content: `<h2>Overview</h2><p>Styling Products & Finishing in Module 7: Professional & Business Skills requires consistent technique, sanitation discipline, and judgment-based adjustments for client variation. This lesson reinforces repeatable execution standards tied to Indiana apprenticeship expectations. Learners focus on setup, safe tool handling, sequencing, and communication while maintaining service quality under time pressure. Objective: Select and apply appropriate styling products for different hair types.</p><h2>Tools Required</h2><ul><li>Primary service tools for Styling Products & Finishing</li><li>Secondary detailing tools</li><li>Disinfectant solution and clean towel set</li><li>Disposable gloves and neck strips</li><li>Mirror and lighting check tools</li><li>Sectioning and control implements</li></ul><h2>Decision Logic</h2><p>If the client has coarse or dense hair, reduce speed and increase control passes to maintain clean lines. If the client has fine or fragile hair, use lighter pressure and shorter contact to avoid damage. If skin is sensitive or irritated, avoid aggressive friction and adjust technique to protect barrier function. Depending on growth pattern and head shape, alter angle and position before final refinement.</p><h2>Procedure</h2><ol><li>Sanitize station, disinfect tools, and verify all equipment is clean, dry, and organized before client contact.</li><li>Complete consultation, identify goals, and confirm contraindications, including open skin, irritation, or recent chemical sensitivity.</li><li>Drape and position client for clear visibility; maintain body mechanics and stable hand support during execution.</li><li>Execute baseline technical sequence with controlled pressure, deliberate sections, and frequent visual checks for balance.</li><li>Refine details by adjusting angle, position, and tension based on texture, density, and growth direction.</li><li>Re-check symmetry from multiple viewpoints and confirm appearance quality under direct and side lighting.</li><li>Finish service with cleanup, product guidance, and maintenance recommendations tailored to the client profile.</li></ol><h2>Safety</h2><p>Disinfect all reusable tools with an EPA-registered disinfectant between clients and follow contact-time instructions. Do not proceed when active infection signs, broken skin, or severe irritation are present; continuing can worsen inflammation and create contamination risk. Common failure mode: overworking one area due to rushed correction. Cause: poor section control and inconsistent angle. Recovery: stop, reset section lines, reduce pressure, and rebuild sequence step-by-step.</p><h2>Visual Cues</h2><p>Correct execution looks like clean transitions, stable line integrity, and uniform finish from front, profile, and rear views. Incorrect execution looks patchy, heavy, or asymmetrical with visible pressure marks and uneven blending. You should see balanced weight distribution and consistent detail boundaries. When positioning is correct, the service reads intentional and polished under normal shop lighting.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-44-q1",
                              "question": "What is the best first priority before starting Styling Products & Finishing?",
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
                              "id": "barber-lesson-44-q2",
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
                              "id": "barber-lesson-44-q3",
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
                              "id": "barber-lesson-44-q4",
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
                              "id": "barber-lesson-44-q5",
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
          slug: 'barber-module-7-checkpoint',
          title: 'Professional Skills Checkpoint',
          order: 6,
          domainKey: 'professional_skills',
          objective: 'Demonstrate mastery of professional and business skills.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Overview</h2><p>Professional Skills Checkpoint in Module 7: Professional & Business Skills requires consistent technique, sanitation discipline, and judgment-based adjustments for client variation. This lesson reinforces repeatable execution standards tied to Indiana apprenticeship expectations. Learners focus on setup, safe tool handling, sequencing, and communication while maintaining service quality under time pressure. Objective: Demonstrate mastery of professional and business skills.</p><h2>Tools Required</h2><ul><li>Primary service tools for Professional Skills Checkpoint</li><li>Secondary detailing tools</li><li>Disinfectant solution and clean towel set</li><li>Disposable gloves and neck strips</li><li>Mirror and lighting check tools</li><li>Sectioning and control implements</li></ul><h2>Decision Logic</h2><p>If the client has coarse or dense hair, reduce speed and increase control passes to maintain clean lines. If the client has fine or fragile hair, use lighter pressure and shorter contact to avoid damage. If skin is sensitive or irritated, avoid aggressive friction and adjust technique to protect barrier function. Depending on growth pattern and head shape, alter angle and position before final refinement.</p><h2>Procedure</h2><ol><li>Sanitize station, disinfect tools, and verify all equipment is clean, dry, and organized before client contact.</li><li>Complete consultation, identify goals, and confirm contraindications, including open skin, irritation, or recent chemical sensitivity.</li><li>Drape and position client for clear visibility; maintain body mechanics and stable hand support during execution.</li><li>Execute baseline technical sequence with controlled pressure, deliberate sections, and frequent visual checks for balance.</li><li>Refine details by adjusting angle, position, and tension based on texture, density, and growth direction.</li><li>Re-check symmetry from multiple viewpoints and confirm appearance quality under direct and side lighting.</li><li>Finish service with cleanup, product guidance, and maintenance recommendations tailored to the client profile.</li></ol><h2>Safety</h2><p>Disinfect all reusable tools with an EPA-registered disinfectant between clients and follow contact-time instructions. Do not proceed when active infection signs, broken skin, or severe irritation are present; continuing can worsen inflammation and create contamination risk. Common failure mode: overworking one area due to rushed correction. Cause: poor section control and inconsistent angle. Recovery: stop, reset section lines, reduce pressure, and rebuild sequence step-by-step.</p><h2>Visual Cues</h2><p>Correct execution looks like clean transitions, stable line integrity, and uniform finish from front, profile, and rear views. Incorrect execution looks patchy, heavy, or asymmetrical with visible pressure marks and uneven blending. You should see balanced weight distribution and consistent detail boundaries. When positioning is correct, the service reads intentional and polished under normal shop lighting.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-module-7-checkpoint-q1",
                              "question": "What is the best first priority before starting Professional Skills Checkpoint?",
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
                              "id": "barber-module-7-checkpoint-q2",
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
                              "id": "barber-module-7-checkpoint-q3",
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
                              "id": "barber-module-7-checkpoint-q4",
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
                              "id": "barber-module-7-checkpoint-q5",
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
      ],
    }

;
