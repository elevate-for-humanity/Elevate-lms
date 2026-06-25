import type { BlueprintModule } from '../types';

export const barberModule1: BlueprintModule = {
      slug: 'barber-module-1',
      title: 'Module 1: Infection Control & Safety',
      orderIndex: 1,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: true,
      domainKey: 'infection_control',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'sanitation_standards', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'disinfection_protocols', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'osha_compliance', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'bloodborne_pathogens', isCritical: true, minimumTouchpoints: 1 },
      ],
      // NHA-Style Interaction Specs
      interactionSpecs: {
        includeKnowledgeChecks: true,
        includeScenarios: true,
        includeFlashcards: true,
        includeClickToReveal: true,
        includeDragDrop: false,
        knowledgeCheckCount: 4,
        scenarioCount: 2,
        flashcardCount: 8,
      },
      lessons: [
        {
          slug: 'barber-lesson-1',
          title: 'Introduction to Barbering',
          order: 1,
          domainKey: 'infection_control',
          objective:
            'Describe the history and legal framework of barbering in Indiana, explain the DOL apprenticeship structure, and identify the scope of practice for licensed barbers.',
          durationMinutes: 25,
          videoFile: '/videos/barber-lessons/barber-apprenticeship-intro.mp4',
          content: `<h2>Overview</h2><p>Barbering in Indiana is regulated under the Indiana Department of Labor (DOL) and requires apprentices to complete a structured, competency-based program combining classroom instruction with supervised practical experience. This lesson introduces the legal framework governing barber licensure, the apprenticeship pathway structure, and the defined scope of practice that licensed barbers must operate within. Understanding these foundational elements ensures compliance with state regulations and prepares apprentices for professional responsibilities.</p><h2>Tools Required</h2><ul><li>Straight razor with leather strop</li><li>Safety razor or clipper with multiple guard sizes</li><li>Scissors and thinning shears</li><li>Comb (wide-tooth and fine-tooth)</li><li>Disinfectant solution (EPA-registered barbicide or equivalent)</li><li>Sterilization pouches and autoclave equipment</li><li>Personal protective equipment (gloves, mask, apron)</li></ul><h2>Decision Tree for Client Variation</h2><ul><li><strong>IF</strong> client has coarse, curly hair and sensitive scalp, <strong>THEN</strong> use wider clipper guard, apply pre-shave oil, and select chemical-free aftershave to prevent irritation.</li><li><strong>IF</strong> client presents with visible skin abrasions or lesions, <strong>THEN</strong> DO NOT proceed with service; refer to healthcare provider and document in client file per DOL requirements.</li><li><strong>IF</strong> client has fine, thin hair and prone to ingrown hairs, <strong>THEN</strong> use smaller clipper guard, employ exfoliating pre-shave preparation, and recommend post-service beard oil application.</li></ul><h2>Sanitation and Disinfection</h2><p>All tools must be sanitized before each client service. Immerse implements in EPA-registered disinfectant (such as Barbicide) for the manufacturer-specified duration, typically 10-15 minutes. Rinse thoroughly with clean water, then dry with a lint-free towel. Tools contacting blood or open wounds require high-level disinfection or sterilization via autoclave at 250°F for 15-30 minutes. Single-use items (razors, applicators) must be discarded immediately after use. Reusable towels and capes are laundered at 160°F minimum.</p><h2>Critical Contraindication</h2><p><strong>DO NOT cut, trim, or style the hair of any client presenting with active contagious scalp or skin infection (ringworm, impetigo, head lice, severe dermatitis). Performing services on infected clients violates Indiana barber law, exposes the barber to liability, contaminates the barbershop environment, and spreads disease to subsequent clients. Politely decline service, document the refusal with client consent, and recommend medical evaluation before rescheduling.</strong></p><h2>Failure Mode and Recovery</h2><p>Failure Mode: Disinfectant solution becomes contaminated or expires before use. Cause: Tools were immersed in old solution, solution was left uncovered, or expiration date was not monitored. Recovery: (1) Immediately discard contaminated solution; (2) Visually inspect all tools for residue and rinse under running water; (3) Prepare fresh disinfectant per manufacturer instructions and note preparation date; (4) Re-immerse all tools for full recommended contact time; (5) Review tool sanitation log to prevent future lapses; (6) Document the incident and corrective action in the shop maintenance record.</p><h2>Visual Execution Cues</h2><p>Position yourself at a 45-degree angle to the client, maintaining clear sight lines to both ears and the nape. The client's head should be upright and neutral, not tilted or rotated. Observe the natural hairline and growth pattern—note any cowlicks, waves, or asymmetries. Work from the sides inward, maintaining consistent clipper or scissor angles relative to the contour of the head. The finished cut should appear symmetrical, with smooth transitions between sections, clean edges at the nape and sideburns, and appropriate fade or taper blending. Run your comb through the final cut; no stray hairs should catch or pull.</p><h2>Procedure</h2><ol><li>Greet client, confirm service requested, and review any allergies, skin conditions, or previous reactions documented in client record.</li><li>Perform hand hygiene: wash hands with soap and warm water for 20 seconds, then apply hand sanitizer and don clean gloves.</li><li>Sanitize all tools by immersing in EPA-registered disinfectant solution for the required contact time, then rinse and dry thoroughly.</li><li>Drape client with clean cape and neck strip, ensuring no skin contact with contaminated surfaces, and position client upright at neutral head angle.</li><li>Analyze hair type, texture, density, and scalp condition; assess any contraindications that would prevent safe service delivery.</li><li>Consult Indiana barber scope-of-practice guidelines to confirm the requested service falls within your licensure authority and apprenticeship level.</li><li>Perform the barbering service (cut, shave, or style) using proper technique, sanitation, and safety protocols throughout the entire process.</li><li>Inspect completed work for symmetry, clean lines, and appropriate finishing; make final corrections as needed to meet professional standards.</li><li>Remove cape and brush away all clippings; allow client to inspect final result and address any concerns or adjustments.</li><li>Document service rendered, any observations (skin conditions, product recommendations), and client satisfaction in the shop record system.</li></ol><h2>Safety</h2><p>Maintain current knowledge of Indiana Department of Labor barbering regulations and apprenticeship requirements. All services must comply with the defined scope of practice—barbers are licensed to cut, trim, style, and shave hair and provide scalp massage. Barbers are NOT licensed to diagnose scalp or skin conditions, prescribe treatments, or perform chemical services (permanent waves, relaxers) unless separately credentialed. Follow bloodborne pathogens protocols per OSHA standards. Always use single-use instruments for open wounds; never reuse razors or lancets. Report any needlestick injuries or blood exposure immediately to your supervising journeyman and the shop owner. Maintain confidentiality of client health information and follow all state privacy regulations.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-1-q1",
                              "question": "What is the minimum contact time for tools immersed in EPA-registered barbicide?",
                              "options": [
                                        "A. 5 minutes",
                                        "B. 10-15 minutes",
                                        "C. 20-25 minutes",
                                        "D. 30 minutes"
                              ],
                              "correctAnswer": 1,
                              "explanation": "EPA-registered disinfectants like Barbicide typically require 10-15 minutes of contact time to ensure proper sanitation of barber tools. Always follow the manufacturer's specific instructions."
                    },
                    {
                              "id": "barber-lesson-1-q2",
                              "question": "Which of the following services falls OUTSIDE the scope of practice for an Indiana licensed barber?",
                              "options": [
                                        "A. Hair cutting and styling",
                                        "B. Straight razor shaving and trimming",
                                        "C. Scalp massage",
                                        "D. Chemical hair relaxing treatments"
                              ],
                              "correctAnswer": 3,
                              "explanation": "Barbers in Indiana are licensed to cut, trim, style, and shave hair and provide scalp massage. Chemical services like permanent waves or relaxers require separate licensure and credentials beyond basic barber licensing."
                    },
                    {
                              "id": "barber-lesson-1-q3",
                              "question": "What is the required water temperature for laundering reusable barbershop towels and capes?",
                              "options": [
                                        "A. 120°F minimum",
                                        "B. 140°F minimum",
                                        "C. 160°F minimum",
                                        "D. 180°F minimum"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Reusable towels, capes, and linens must be laundered at 160°F minimum to achieve adequate sanitation and eliminate potential pathogens."
                    },
                    {
                              "id": "barber-lesson-1-q4",
                              "question": "SCENARIO: A client arrives with visible ringworm on the scalp. What is the correct action?",
                              "options": [
                                        "A. Proceed with the haircut using extra disinfectant on tools",
                                        "B. Politely decline service, document the refusal, and recommend medical evaluation before rescheduling",
                                        "C. Perform the service but charge a higher fee for the extra sanitation required",
                                        "D. Use a barrier cream to isolate the affected area and proceed with service"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Active contagious scalp infections are absolute contraindications. Performing services on an infected client violates Indiana barber law, exposes the barber to liability, and spreads disease. Always decline, document, and refer to healthcare provider."
                    },
                    {
                              "id": "barber-lesson-1-q5",
                              "question": "SCENARIO: During tool preparation, you notice the disinfectant solution smells foul and appears cloudy. What is the correct response?",
                              "options": [
                                        "A. Add fresh disinfectant to the container and proceed with tool immersion",
                                        "B. Immediately discard contaminated solution, prepare fresh disinfectant per manufacturer instructions, and re-immerse tools for full contact time",
                                        "C. Strain the solution through a filter and reuse it",
                                        "D. Proceed with service using only surface-wiped tools"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Contaminated or expired disinfectant cannot protect clients or prevent disease transmission. Discard immediately, prepare fresh solution, and document the incident. This ensures full compliance with Indiana health and safety regulations."
                    }
          ],
        },
        {
          slug: 'barber-lesson-2',
          title: 'Professional Conduct & Ethics',
          order: 2,
          domainKey: 'infection_control',
          objective:
            'Apply professional standards of conduct, ethics, and client communication in a barbershop setting.',
          durationMinutes: 20,
          videoFile: '/videos/barber-client-experience.mp4',
          content: `<h2>Professional Conduct & Ethics</h2><p>Welcome to Module 1: Infection Control & Safety, Lesson 2: Professional Conduct & Ethics. In this lesson, we will cover the importance of professional standards of conduct, ethics, and client communication in a barbershop setting.</p><h3>Introduction to Professional Conduct</h3><p>As a barber, it is essential to maintain a professional demeanor at all times. This includes being respectful, courteous, and attentive to clients. Professional conduct also involves maintaining a clean and organized workspace, adhering to sanitation and disinfection protocols, and using proper equipment and tools.</p><p>The following tools, equipment, and materials are required for this lesson:</p><ul><li>Barber chair</li><li>Sanitation and disinfection solutions</li><li>Equipment (scissors, clippers, razors)</li><li>Client gowns and capes</li><li>Sanitation and disinfection checklists</li></ul><h3>Client Communication and Ethics</h3><p>Effective client communication is crucial in a barbershop setting. Barbers must be able to listen attentively to clients, understand their needs and preferences, and provide clear and concise instructions. Ethics play a significant role in client communication, as barbers must maintain confidentiality, respect client boundaries, and avoid making false or misleading claims.</p><p>When dealing with clients, it is essential to consider hair type variation, skin condition variation, and client situation variation. For example:</p><p>IF a client has sensitive skin, THEN you should use gentle products and avoid using harsh chemicals. IF a client has a skin condition such as eczema or psoriasis, THEN you should take extra precautions to avoid irritating the condition. IF a client is experiencing stress or anxiety, THEN you should provide a calming and relaxing environment.</p><h3>Sanitation and Disinfection</h3><p>Sanitation and disinfection are critical components of professional conduct and ethics in a barbershop setting. Barbers must adhere to strict sanitation and disinfection protocols to prevent the spread of infections and maintain a clean and safe environment for clients.</p><p>DO NOT touch your face, eyes, or mouth while working with clients, as this can spread infection. DO NOT share equipment or tools with other barbers, as this can also spread infection.</p><h3>Failure Mode and Recovery</h3><p>A failure mode that can occur in a barbershop setting is failing to properly sanitize and disinfect equipment and tools. This can lead to the spread of infections and compromise client safety.</p><p>To recover from this failure mode, barbers should immediately stop working and properly sanitize and disinfect all equipment and tools. They should also inform their supervisor or manager of the incident and take steps to prevent it from happening again in the future.</p><p>Correct execution of sanitation and disinfection protocols involves visually inspecting equipment and tools for any signs of contamination, using the correct sanitation and disinfection solutions, and following the manufacturer's instructions for use. Barbers should also maintain a clean and organized workspace, with all equipment and tools properly stored and labeled.</p><h3>Visual Cues</h3><p>When performing sanitation and disinfection protocols, barbers should look for the following visual cues:</p><ul><li>Equipment and tools should be free of visible debris and contamination</li><li>Sanitation and disinfection solutions should be used according to the manufacturer's instructions</li><li>The workspace should be clean and organized, with all equipment and tools properly stored and labeled</li></ul>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-2-q1",
                              "question": "A client presents with a skin condition that requires extra precautions to avoid irritation. What do you do?",
                              "options": [
                                        "Use harsh chemicals to treat the condition",
                                        "Take extra precautions to avoid irritating the condition",
                                        "Ignore the condition and proceed with the service",
                                        "Refer the client to a doctor"
                              ],
                              "correctAnswer": 1,
                              "explanation": "As a barber, it is essential to take extra precautions to avoid irritating a client's skin condition. This includes using gentle products, avoiding harsh chemicals, and providing a clean and safe environment for the client."
                    },
                    {
                              "id": "barber-lesson-2-q2",
                              "question": "What is the correct way to sanitize and disinfect equipment and tools in a barbershop setting?",
                              "options": [
                                        "Use soap and water only",
                                        "Use a combination of sanitation and disinfection solutions",
                                        "Use harsh chemicals only",
                                        "Do not sanitize and disinfect equipment and tools"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct way to sanitize and disinfect equipment and tools in a barbershop setting is to use a combination of sanitation and disinfection solutions, following the manufacturer's instructions for use."
                    },
                    {
                              "id": "barber-lesson-2-q3",
                              "question": "A client is experiencing stress and anxiety during a service. What do you do?",
                              "options": [
                                        "Provide a calming and relaxing environment",
                                        "Ignore the client's feelings and proceed with the service",
                                        "Refer the client to a doctor",
                                        "Use harsh chemicals to calm the client"
                              ],
                              "correctAnswer": 0,
                              "explanation": "As a barber, it is essential to provide a calming and relaxing environment for clients who are experiencing stress and anxiety. This includes using soothing music, dimming the lights, and providing a comfortable and supportive atmosphere."
                    },
                    {
                              "id": "barber-lesson-2-q4",
                              "question": "What is a contraindication for sharing equipment and tools with other barbers?",
                              "options": [
                                        "It is allowed as long as the equipment and tools are cleaned",
                                        "It is allowed as long as the client consents",
                                        "It can spread infection and compromise client safety",
                                        "It is required by law"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Sharing equipment and tools with other barbers can spread infection and compromise client safety. As a barber, it is essential to use your own equipment and tools and to properly sanitize and disinfect them after each use."
                    },
                    {
                              "id": "barber-lesson-2-q5",
                              "question": "What is the correct way to visually inspect equipment and tools for signs of contamination?",
                              "options": [
                                        "Look for visible debris and contamination",
                                        "Use a microscope to inspect the equipment and tools",
                                        "Ignore the equipment and tools and proceed with the service",
                                        "Use harsh chemicals to clean the equipment and tools"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The correct way to visually inspect equipment and tools for signs of contamination is to look for visible debris and contamination. This includes checking for any signs of dirt, dust, or other substances that could compromise client safety."
                    }
          ],
        },
        {
          slug: 'barber-lesson-3',
          title: 'Tools & Equipment',
          order: 3,
          domainKey: 'infection_control',
          objective:
            'Identify, name, and describe the correct use of essential barbering tools and equipment.',
          durationMinutes: 25,
          videoFile: '/videos/course-barber-clipper-techniques.mp4',
          content: `<h2>Tools & Equipment</h2><p><strong>Lesson Slug:</strong> barber-lesson-3<br><strong>Module:</strong> Module 1: Infection Control & Safety<br><strong>Estimated Duration:</strong> 25 minutes</p><h3>Learning Objective</h3><p>By the end of this lesson, you will be able to identify, name, and describe the correct use of essential barbering tools and equipment, understand proper sanitation protocols for each tool, and recognize safety contraindications.</p><h3>Introduction</h3><p>The foundation of professional barbering rests on understanding and properly using your tools. In Indiana's regulated barbering environment, every tool serves a specific purpose, and improper use or sanitation can compromise both client safety and the quality of your work. This lesson covers the essential tools you will use daily, how to identify them, their proper applications, sanitation requirements, and critical safety rules.</p><h3>Essential Barbering Tools & Equipment</h3><h4>Cutting Tools</h4><ul><li><strong>Straight Razor:</strong> A folding blade with a handle, typically 5/8 inch wide, used for precise cutting, outlining, and close shaving. The blade must be stropped before each use and honed regularly. Straight razors require meticulous sanitation—they must be cleaned with a brush and soap, disinfected in an EPA-registered disinfectant for a minimum of 10 minutes, and stored in a clean, dry location. <strong>DO NOT</strong> use a straight razor that shows signs of rust, chips, or dullness.</li><li><strong>Clipper:</strong> A motorized tool with oscillating or rotating blades for cutting hair to various lengths. Clipper guards (numbered 0.5 to 4) determine cutting length. Clippers must be cleaned of hair and debris after each client, lubricated with clipper oil, and disinfected by wiping with an EPA-registered disinfectant or placing in a sanitizing container. Blade guards must be disinfected separately.</li><li><strong>Scissors (Shears):</strong> Used for detailed work, blending, and styling. Available in various blade configurations (straight, curved, texturizing). Scissors must be sanitized between clients by wiping with disinfectant and stored with blades closed. Dull scissors produce ragged cuts and require sharpening by a professional.</li><li><strong>Thinning Shears:</strong> Specialized scissors with teeth on one blade, used for removing bulk and creating texture while maintaining length. Sanitization protocols match standard scissors.</li></ul><h4>Styling & Finishing Tools</h4><ul><li><strong>Comb:</strong> Essential for sectioning, detangling, and guiding the blade. Metal combs withstand disinfection better than plastic. Combs must be cleaned of hair and disinfected in an EPA-registered solution for 10 minutes between each client.</li><li><strong>Brush:</strong> Used for applying lather and removing loose hair. Brushes accumulate bacteria and must be thoroughly cleaned daily and disinfected. Replace brushes regularly—typically every 3-6 months depending on usage.</li><li><strong>Blow Dryer:</strong> For drying and styling finished haircuts. The external surface must be wiped with disinfectant between clients; the nozzle should be cleaned of lint regularly.</li><li><strong>Clipper Trimmer/Edger:</strong> Precision tool for detailing around ears, neckline, and sideburns. Sanitization and maintenance match clippers.</li></ul><h4>Preparation & Sanitation Equipment</h4><ul><li><strong>Disinfectant Container:</strong> An EPA-registered disinfectant solution in which tools are soaked. Solution must be changed daily and concentration verified according to product instructions.</li><li><strong>Towels and Neck Strips:</strong> Single-use or laundered between clients. Must be clean and stored in a sanitary manner.</li><li><strong>Lather/Shaving Cream:</strong> Applied with a brush or hands. Do not double-dip brushes into shared containers—dispense a fresh application for each client or use single-use packets.</li><li><strong>Styptic Powder or Liquid:</strong> Applied to minor cuts to stop bleeding. Keep container sealed and store safely.</li></ul><h3>Proper Use & Positioning</h3><h4>Clipper Use</h4><p>Hold the clipper at a 45-degree angle against the scalp in the direction of hair growth. The blade should glide smoothly without resistance. Correct execution shows even, parallel lines with no missed patches or visible blade marks. Move in smooth strokes from lower to upper areas, overlapping slightly for even coverage. The clipper should produce a soft humming sound—a grinding or stuttering noise indicates dull blades or improper technique.</p><h4>Straight Razor Use</h4><p>Position the straight razor at a 30-45 degree angle relative to the skin. The spine of the blade (not the edge) guides the cut, with the edge meeting the skin at the correct angle. Proper execution produces a smooth outline with no razor burn, nicks, or uneven edges. The cut line should be clean and precise, following natural facial contours. Incorrect angle or excessive pressure causes razor burn, skin irritation, or cuts.</p><h4>Scissors/Shears Use</h4><p>Hold scissors with the thumb in the lower loop, fingers in the upper loop, and the pinky finger supporting the ring. The hand holding the comb guides the blade. Correct execution produces even, clean cut lines without chewing or fraying. The scissors should open and close smoothly—resistance or grinding indicates blade misalignment or dullness requiring professional sharpening.</p><h3>Decision Block: Tool Selection Based on Hair & Client Variation</h3><p><strong>IF</strong> a client presents with <strong>very coarse, thick facial hair</strong> requiring a close shave, <strong>THEN</strong> use a straight razor rather than electric clippers, as the straight razor cuts closer to the skin and produces a smoother finish. However, ensure the client has no open cuts, razor sensitivity, or bleeding disorders. Perform a patch test on a small area first.</p><p><strong>IF</strong> a client has <strong>sensitive skin or a history of razor burn</strong>, <strong>THEN</strong> use a clipper with appropriate guard length or electric shaver rather than a straight razor. Apply pre-shave oil or balm to reduce friction and irritation. Monitor skin response throughout the service.</p><p><strong>IF</strong> a client requests <strong>precise detailing or blending between fade lengths</strong>, <strong>THEN</strong> use thinning shears or texturizing shears after clipper work to soften harsh lines. This requires scissors skill and cannot be achieved with clippers alone.</p><h3>Failure Mode: Dull Clipper Blades</h3><p><strong>What goes wrong:</strong> Dull clipper blades pull and chew hair rather than cutting cleanly, leaving a ragged appearance, causing discomfort to the client, and producing visible stubble within hours.</p><p><strong>Why it happens:</strong> Blades dull from regular use, exposure to moisture, or lack of lubrication. Cutting over dirt or debris accelerates dulling.</p><p><strong>How to recover:</strong> Stop the service immediately. Explain the issue to the client professionally. Replace the blade guard with a fresh one if available, or use an alternate clipper. If neither option exists, reschedule the client at no charge and provide a discount on a future visit as service recovery. Document the equipment failure and send blades for professional sharpening or replacement. Between services, always test clippers on a sample of hair before beginning—dull clippers require noticeably more pressure to cut.</p><h3>Critical Safety Contraindications</h3><ul><li><strong>DO NOT</strong> use a straight razor on a client with active bleeding, open wounds, or cuts on the face or neck. Wait until skin has healed.</li><li><strong>DO NOT</strong> use clippers or razors that show visible damage, rust, or misalignment. This violates Indiana barber regulations and risks client injury.</li><li><strong>DO NOT</strong> reuse disinfectant solution beyond the recommended time frame or concentrate. Weak disinfectant fails to eliminate pathogens. Change solution daily.</li><li><strong>DO NOT</strong> place disinfected tools on an unclean surface. Store them in a designated clean holder or on a disinfected towel.</li><li><strong>DO NOT</strong> allow a second client to use the same towel, neck strip, or brush without disinfection. Cross-contamination spreads infection.</li><li><strong>DO NOT</strong> touch your face or other surfaces with unclean tools during a service.</li></ul><h3>Sanitation & Infection Control Summary</h3><p>Every tool that contacts skin or blood must be cleaned and disinfected according to Indiana Health Department regulations. The standard protocol is: (1) Remove visible debris with soap and water or a cleaning brush. (2) Immerse in EPA-registered disinfectant for the time specified on the product label (typically 10 minutes minimum). (3) Rinse with clean water or allow to air dry. (4) Store in a clean, dry container. Tools that contact mucous membranes or blood require enhanced disinfection. Never assume a tool is clean—treat every tool as potentially contaminated after each use.</p><h3>Visual Reference: Correct Execution Indicators</h3><ul><li><strong>Well-executed clipper cut:</strong> Uniform length, parallel lines, smooth fade transitions, no missed spots, sharp blade sound, skin is not irritated.</li><li><strong>Well-executed straight razor outline:</strong> Clean, precise line following natural contours, no razor burn (redness), even pressure marks, skin is smooth and not nicked.</li><li><strong>Well-executed scissor work:</strong> Clean edges without fraying, blended transitions, no visible chop marks, hair lays naturally, skin is not irritated.</li><li><strong>Clean, sanitized tools:</strong> No visible hair, debris, or discoloration; tools feel smooth and operate without grinding or resistance; tools stored in a designated, clean location.</li></ul><h3>Conclusion</h3><p>Mastery of barbering tools is not simply about technique—it is about understanding each tool's purpose, maintaining it to professional standards, and prioritizing client safety and infection control. Throughout your apprenticeship, you will develop muscle memory with these tools, but your foundation must be respect for their power and commitment to sanitation. Regular inspection, proper maintenance, and adherence to infection control protocols protect your clients and your professional reputation.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-3-q1",
                              "question": "Which of the following is the minimum time a straight razor must remain in an EPA-registered disinfectant solution?",
                              "options": [
                                        "A. 5 minutes",
                                        "B. 10 minutes",
                                        "C. 15 minutes",
                                        "D. 20 minutes"
                              ],
                              "correctAnswer": 1,
                              "explanation": "According to Indiana barber regulations and industry standards, tools that contact skin must be immersed in EPA-registered disinfectant for a minimum of 10 minutes. Five minutes is insufficient to eliminate pathogens. Fifteen and twenty minutes are acceptable but exceed the minimum requirement."
                    },
                    {
                              "id": "barber-lesson-3-q2",
                              "question": "A client arrives for a haircut but mentions they had a small razor cut on their neck from a prior service at another barbershop three days ago. The area appears mostly healed but is still slightly pink. What should you do?",
                              "options": [
                                        "A. Proceed with a straight razor shave since the cut is mostly healed and the client consents",
                                        "B. Postpone straight razor work, use clippers or electric shaver instead, and monitor the area closely for any irritation during the service",
                                        "C. Perform a full straight razor shave but apply extra lather to protect the area",
                                        "D. Use a straight razor only on the unaffected areas and avoid the healing wound entirely"
                              ],
                              "correctAnswer": 1,
                              "explanation": "A healing wound on the face or neck is a contraindication for straight razor use. Even if mostly healed, the skin is still vulnerable to infection and irritation. Using clippers or an electric shaver avoids direct blade contact with the sensitive area while still delivering quality service. Monitoring the client's skin response demonstrates professional care and protects both the client and your liability."
                    },
                    {
                              "id": "barber-lesson-3-q3",
                              "question": "During a haircut using clippers, you notice the blade is making a grinding sound rather than its normal humming sound, and it requires more pressure to cut. What is the most likely issue and what should you do?",
                              "options": [
                                        "A. The blade is dull; stop the service, replace the blade or clipper, and resume the cut",
                                        "B. The clipper needs more oil; apply clipper oil and continue cutting",
                                        "C. The blade is too tight; loosen the tension screw and continue",
                                        "D. This is normal; continue the service as the blade will warm up"
                              ],
                              "correctAnswer": 0,
                              "explanation": "A grinding sound and increased cutting pressure are classic signs of dull clipper blades. Continuing with dull blades produces a ragged cut, discomforts the client, and violates service standards. Immediately stop the service, replace the blade guard or use a fresh clipper, and resume. Clipper oil addresses lubrication issues but will not fix a dull blade. The sound and pressure will not improve with continued use."
                    },
                    {
                              "id": "barber-lesson-3-q4",
                              "question": "Which tool should be used when a client requests precise blending between two different clipper fade lengths to create a smooth transition?",
                              "options": [
                                        "A. Straight razor",
                                        "B. Thinning shears or texturizing shears",
                                        "C. Comb only",
                                        "D. A second pass with the same clipper guard"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Thinning or texturizing shears soften harsh lines between clipper lengths and create smooth blending. A straight razor is for outlining and shaving, not blending. A comb alone cannot cut hair. A second pass with the same guard will not create a transition between different lengths. Scissors blending is a critical skill in barbering."
                    },
                    {
                              "id": "barber-lesson-3-q5",
                              "question": "You finish disinfecting a set of scissors in an EPA-registered solution. You remove the scissors, rinse them with clean water, and set them on your workstation counter to air dry. What is the infection control concern with this approach?",
                              "options": [
                                        "A. The rinsing step removes the disinfectant and re-contaminates the tool",
                                        "B. Air drying is slower than towel drying and allows bacterial growth",
                                        "C. The workstation counter may not be clean, potentially re-contaminating the disinfected tool",
                                        "D. Disinfected scissors should never touch any surface until used on the next client"
                              ],
                              "correctAnswer": 2,
                              "explanation": "After disinfection, a tool must be stored on a clean surface—a dirty or unclean workstation counter risks re-contamination, negating the disinfection process. Disinfected tools should be placed on a designated clean holder, disinfected towel, or in a sealed storage container. Rinsing is appropriate (removes residual disinfectant), and air drying is acceptable. The critical error is the storage surface itself."
                    }
          ],
        },
        {
          slug: 'barber-lesson-4',
          title: 'Infection Control & Safety',
          order: 4,
          domainKey: 'infection_control',
          objective:
            'Differentiate between cleaning, disinfecting, and sterilization; identify types of microorganisms and how they spread; apply OSHA infection control standards; execute blood exposure protocol; maintain a state board-compliant workstation.',
          durationMinutes: 35,
          // Locked to the semantically-mapped infection control video (alloy 0.88x, 20 segments)
          videoFile: '/videos/barber-lessons/barber-infection-control.mp4',
          competencyChecks: [
            'barbicide_immersion',
            'razor_blade_change',
            'neck_strip_application',
          ],
          instructorNotes: [
          'Verify all three competency checks in person before marking this lesson complete.',
          'Barbicide check: watch the student submerge tools — partial submersion is a fail.',
          'Razor check: confirm the used blade goes directly into the sharps container — not the trash.',
          'Neck strip check: cape must not touch skin before the strip is placed.',
          'Indiana State Board inspectors check disinfection logs — remind students to document every session.',
        ],
          content: `<h2>Overview</h2><p>Infection control and safety form the foundation of professional barbering. This lesson distinguishes cleaning (physical removal of debris), disinfection (killing pathogens on surfaces), and sterilization (eliminating all microorganisms). Understanding bacteria, viruses, and fungi transmission routes—contact, airborne, and bloodborne—enables you to implement OSHA standards, execute proper exposure protocols, and maintain state board-compliant workstations that protect both you and your clients.</p><h2>Tools Required</h2><ul><li>EPA-registered disinfectant (quaternary ammonium or phenolic-based)</li><li>Autoclave or dry heat sterilizer for metal implements</li><li>Barbicide jar or disinfectant immersion container</li><li>Personal protective equipment (nitrile gloves, face mask, eye protection)</li><li>Sharps container for contaminated needles or lancets</li><li>Clean white towels and disposable cape liners</li><li>Bloodborne pathogen kit including gauze, antiseptic, and incident log</li></ul><h2>Procedure</h2><ol><li>Put on nitriles, mask, and eye protection; inspect workstation for visible debris, hair, or contamination before each client.</li><li>Clean all surfaces with soap and water, removing organic matter; use friction for 30 seconds on chairs, mirrors, and tools.</li><li>Spray EPA-registered disinfectant (contact time 10 minutes per product label) on all non-porous surfaces and allow to air dry completely.</li><li>Place single-use items (capes, neck strips, towels) in designated hamper; never reuse without laundering at 160°F minimum.</li><li>Immerse all metal cutting tools in Barbicide or approved disinfectant for minimum contact time specified by manufacturer (typically 15 minutes).</li><li>Remove implements with sanitized tongs, rinse under running water, and pat dry with clean towel before placing in sterile container.</li><li>If blood exposure occurs, immediately stop service, don fresh gloves, apply direct pressure with gauze, and clean wound with antiseptic soap.</li><li>Document incident with date, time, client, exposure type, and action taken; notify supervisor and follow OSHA recordkeeping requirements within 24 hours.</li></ol><h2>Safety</h2><p><strong>DO NOT reuse single-use items or skip disinfection steps.</strong> Consequence: cross-contamination spreads bloodborne pathogens (HIV, Hepatitis B/C), violates Indiana State Board rules, triggers OSHA penalties, and causes serious client illness or legal liability.</p><p><strong>Failure Mode & Recovery:</strong> You immerse tools but forget to air-dry the disinfectant, causing chemical residue on client skin. Recovery: (1) Stop immediately when chemical contact noticed; (2) rinse client area with cool water for 15 seconds; (3) dry thoroughly; (4) document on client intake form; (5) revise drying protocol by using lint-free towels and allowing 5-minute air-dry post-rinse; (6) discard contaminated tools and restart sterilization cycle properly.</p><p><strong>IF/THEN Decision Block—Client Variations:</strong> IF client has open cuts or lesions on scalp or neck, THEN defer service and require physician clearance; do not proceed. IF client reports recent hepatitis exposure, THEN use fresh gloves, avoid contact with any bleeding areas, and increase disinfection frequency on all touched surfaces. IF client has active ringworm or fungal infection, THEN refuse service per state law until treated and documented clear.</p><h2>Visual Cues</h2><p>Proper workstation appearance: mirror spotless and streak-free, chair upholstered surface free of hair or stains, all metal tools gleaming without water spots or dried disinfectant residue. Correct implement positioning: handles point outward in sterile container; no tools touching non-sterile surfaces. Your personal appearance shows rolled sleeves exposing clean forearms, clean-fitting shirt or uniform without visible debris, and properly fitted gloves creating seal at wrist without wrinkles or tears. Disinfectant contact is complete when surfaces appear wet for full duration specified on product label before air-drying to a clean, dry finish with no visible contamination.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-4-q1",
                              "question": "Which of the following correctly defines the difference between disinfection and sterilization?",
                              "options": [
                                        "A. Disinfection removes all microorganisms; sterilization kills only pathogens on surfaces.",
                                        "B. Sterilization eliminates all microorganisms including spores; disinfection kills most pathogens but not all.",
                                        "C. Both terms mean the same thing and can be used interchangeably in barbering.",
                                        "D. Disinfection is only used for tools; sterilization is only used for surfaces."
                              ],
                              "correctAnswer": 1,
                              "explanation": "Sterilization is the most rigorous process, eliminating all microorganisms including bacterial spores via autoclave or dry heat. Disinfection kills most pathogens using chemical agents but does not eliminate all resistant forms. Both are essential in barbering, but sterilization is required for metal implements that contact blood."
                    },
                    {
                              "id": "barber-lesson-4-q2",
                              "question": "According to OSHA and Indiana State Board standards, what is the minimum contact time for most EPA-registered disinfectants on barber workstation surfaces?",
                              "options": [
                                        "A. 5 minutes of wet contact time.",
                                        "B. 10 minutes of wet contact time as specified on the product label.",
                                        "C. 20 minutes regardless of product type.",
                                        "D. Contact time is not regulated; visual cleanliness is sufficient."
                              ],
                              "correctAnswer": 1,
                              "explanation": "EPA-registered disinfectants require a contact time (typically 10 minutes) that must be followed per the product label. Surfaces must remain visibly wet for the entire contact duration to ensure pathogen kill. Shorter times do not achieve adequate disinfection and violate state regulations."
                    },
                    {
                              "id": "barber-lesson-4-q3",
                              "question": "Which items in a barber shop MUST be discarded after each client rather than disinfected and reused?",
                              "options": [
                                        "A. Neck strips, single-use capes, and paper towels.",
                                        "B. All metal tools and combs.",
                                        "C. Only items that visibly touch blood.",
                                        "D. Chairs and mirrors after every service."
                              ],
                              "correctAnswer": 0,
                              "explanation": "Single-use items including neck strips, disposable capes, and paper towels must be discarded after each client to prevent cross-contamination. Metal tools are disinfected and sterilized for reuse. Reusing single-use items violates Indiana State Board rules and OSHA standards."
                    },
                    {
                              "id": "barber-lesson-4-q4",
                              "question": "SCENARIO: A client mentions they recently had a blood test at a medical clinic and has a small cut on their scalp. What is the correct action?",
                              "options": [
                                        "A. Proceed with the haircut using standard precautions and gloves.",
                                        "B. Ask if the test was related to infectious disease; if no recent exposure, use double gloves and proceed carefully.",
                                        "C. Refuse service until the client provides physician clearance or written documentation showing no bloodborne pathogen exposure.",
                                        "D. Use triple gloves and aggressive disinfection to proceed safely."
                              ],
                              "correctAnswer": 2,
                              "explanation": "Indiana State Board regulations require deferral of service for clients with recent potential bloodborne pathogen exposure or open lesions. A physician clearance letter documents safety and protects both you and the client. Using extra gloves does not eliminate transmission risk and does not comply with state law."
                    },
                    {
                              "id": "barber-lesson-4-q5",
                              "question": "SCENARIO: During a fade, you accidentally cut the client's ear, causing light bleeding. After applying pressure and stopping the bleed, what must you do next?",
                              "options": [
                                        "A. Continue the service immediately while wearing fresh gloves and monitoring the area.",
                                        "B. Stop service, document the incident with date/time/type of exposure, apply first aid, change gloves, and follow OSHA recordkeeping within 24 hours.",
                                        "C. Clean the area with disinfectant only and resume service without documentation.",
                                        "D. Refer the client to an emergency room regardless of bleed severity."
                              ],
                              "correctAnswer": 1,
                              "explanation": "OSHA bloodborne pathogen standard requires documentation of all exposure incidents including date, time, client, type of exposure, and actions taken. Incident logs must be maintained and reported within 24 hours. Proper first aid (pressure, antiseptic) and fresh PPE are applied, but documentation is mandatory for compliance and liability protection."
                    }
          ],
        },

        {
          slug: 'barber-lesson-5',
          title: 'Workplace Safety',
          order: 5,
          domainKey: 'infection_control',
          objective:
            'Apply OSHA workplace safety standards and identify hazards specific to barbershop environments.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-sanitation.mp4',
          competencyChecks: [
            'chemical_storage',
            'hazard_identification',
          ],
          instructorNotes: [
          'Chemical storage check: confirm all products are in original or labeled containers, stored away from heat sources. SDS check: student must locate and read the SDS for at least one product without assistance. Hazard walk-through: conduct in the actual shop, not from memory.',
        ],
          content: `<h2>Overview</h2><p>Workplace safety in barbershops requires strict adherence to OSHA standards and identification of environmental hazards. This lesson covers essential safety protocols, hazard recognition, and proper response procedures to protect barbers, apprentices, and clients. Understanding bloodborne pathogens, chemical exposure, ergonomic risks, and emergency procedures ensures a safe, compliant barbershop environment.</p><h2>Tools Required</h2><ul><li>OSHA Bloodborne Pathogens Standard documentation</li><li>Safety Data Sheets (SDS) for all chemical products</li><li>First aid kit with biohazard sharps container</li><li>Personal protective equipment: gloves, masks, eye protection</li><li>Disinfectant solutions (EPA-registered hospital-grade or barbicide)</li><li>Fire extinguisher (Class B and C rated)</li><li>Spill kits and absorbent materials</li><li>Ergonomic footrest and anti-fatigue mat</li></ul><h2>Client Variation Decision Tree</h2><ul><li><strong>IF</strong> client has open cuts, sores, or bleeding skin condition, <strong>THEN</strong> refuse service, document reason, and refer to healthcare provider. Never proceed with service on compromised skin.</li><li><strong>IF</strong> client reports recent tattoo or piercing (less than 4 weeks), <strong>THEN</strong> avoid that area completely and use extra precautions; contact may introduce infection to healing tissue.</li><li><strong>IF</strong> client presents with visible fungal infection, rash, or unusual scalp lesions, <strong>THEN</strong> decline service, document observations, and recommend dermatological evaluation before returning.</li></ul><h2>Sanitation Protocol</h2><p>All non-porous tools must be immersed in EPA-registered hospital-grade disinfectant (such as Barbicide) for minimum 10 minutes at proper concentration per manufacturer instructions. Verify disinfectant solution is changed daily and chemical strength is tested with color-change strips. Reusable towels must be washed in hot water with high-heat drying cycle; single-use neck strips are preferred. Workspace surfaces, including chairs and mirrors, require spray disinfection between each client with hospital-grade surface cleaner.</p><h2>Critical Contraindication</h2><p><strong>DO NOT proceed with any service if you observe or suspect bloodborne pathogen exposure risk without proper PPE and engineering controls in place. Failure to implement infection control increases liability, violates OSHA regulations, and risks serious illness or legal consequences for yourself, your employer, and the establishment.</strong></p><h2>Failure Mode: Chemical Spill Response</h2><p><strong>Cause:</strong> Disinfectant bottle knocked over during cleaning, creating slip hazard and chemical exposure risk. <strong>Recovery Steps:</strong> (1) Alert nearby personnel and cordon off area with caution sign; (2) Don nitrile gloves and eye protection immediately; (3) Allow spill to evaporate or carefully absorb with absorbent material into biohazard waste container; (4) Spray affected area with appropriate neutralizing solution or disinfectant per SDS; (5) Wipe thoroughly with clean cloth and allow to air dry completely; (6) Document incident, notify supervisor, and verify no residual hazard exists before resuming operations.</p><h2>Visual Execution Cues</h2><p>When observing proper ergonomic positioning, barber's feet should be shoulder-width apart with weight distributed evenly; knees remain slightly bent, never locked. Shoulders stay relaxed and level, avoiding forward slouch toward client. Elbows maintain 90-degree angle with workstation. Client chair height adjusts so work area sits at barber's elbow level, eliminating excessive reaching or bending. All sharp tools are stored point-down in proper containers; scissors never left on work surface. Gloves show no tears, and fresh pair is donned before each new client. Clean workspace is organized, clutter-free, with all chemical bottles labeled and closed.</p><h2>Procedure</h2><ol><li>Review OSHA Bloodborne Pathogens Standard and barbershop-specific hazard assessment documentation before beginning any shift or new apprentice orientation.</li><li>Inspect all tools, equipment, and workstation for damage, contamination, or hazards; report unsafe conditions to supervisor immediately and do not use compromised items.</li><li>Don appropriate PPE including nitrile gloves, mask, and eye protection; verify fit and integrity before client interaction or tool handling.</li><li>Verify disinfectant solution concentration using color-change test strips; discard and replace solution if concentration is inadequate or solution is visibly contaminated.</li><li>Screen each client for contraindications: open wounds, recent piercings, skin infections, or communicable diseases; document refusals and provide referrals when appropriate.</li><li>Immerse all non-porous tools in hospital-grade disinfectant for full 10-minute contact time; remove with clean forceps and air-dry on clean towel before use.</li><li>Perform service using proper ergonomic positioning with shoulders relaxed, elbows at 90 degrees, and client chair adjusted to workstation height.</li><li>Handle all sharps with extreme care; place used blades immediately in designated sharps container; never recap, bend, or hand-pass sharp instruments to others.</li><li>Disinfect workspace, chair, and mirrors between clients using EPA-registered hospital-grade surface spray; allow adequate contact time per product instructions.</li><li>Document any incidents, exposures, or safety concerns in establishment incident log and report to supervisor or safety officer within 24 hours.</li></ol><h2>Safety Standards and Hazard Recognition</h2><p>OSHA requires barbershops to maintain bloodborne pathogen compliance, including exposure control plans, training documentation, and vaccination records. Chemical hazards include disinfectant inhalation, skin irritation, and eye exposure; all SDS must be accessible and reviewed. Sharps injuries are leading cause of occupational injury in barbershops; proper handling and disposal eliminates 95% of incidents. Ergonomic hazards develop over time; proper positioning prevents chronic back, neck, and shoulder injuries. Fire safety requires accessible extinguishers rated for electrical and chemical fires. Maintain incident log for all exposures or injuries; report to OSHA within 24 hours if serious injury occurs. Apprentices must receive documented training on all hazards before independent work and annually thereafter.</p><h2>Visual Cues</h2><p>Proper hand positioning shows wrists straight and fingers relaxed, avoiding excessive force or tension during tool manipulation. Safe tool storage displays all sharp instruments point-down in dedicated containers, never scattered on surfaces or handles-first in jars. Clean workspace organization keeps disinfectants away from client areas, chemical bottles capped and labeled clearly, and reusable items in covered containers. Correct PPE appearance includes intact gloves with no visible tears, mask fitting snugly across nose and mouth, and eye protection sitting securely. Client chair positioning appears comfortable and at optimal height where barber's elbows align naturally with work surface, eliminating visible reaching, bending, or slouching.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-5-q1",
                              "question": "According to OSHA Bloodborne Pathogens Standard, what is the minimum contact time for tools immersed in hospital-grade disinfectant?",
                              "options": [
                                        "A. 10 minutes",
                                        "B. 5 minutes",
                                        "C. 15 minutes",
                                        "D. 20 minutes"
                              ],
                              "correctAnswer": 0,
                              "explanation": "OSHA and barbershop infection control protocols require minimum 10-minute immersion time in EPA-registered hospital-grade disinfectant such as Barbicide. Shorter times do not ensure adequate pathogen elimination."
                    },
                    {
                              "id": "barber-lesson-5-q2",
                              "question": "Which of the following is NOT acceptable for storing reusable towels in a barbershop?",
                              "options": [
                                        "A. Hot water washing with high-heat drying cycle",
                                        "B. Leaving damp towels in closed container overnight",
                                        "C. Separate storage from contaminated items",
                                        "D. Single-use towels when available"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Damp towels left in closed containers overnight create ideal conditions for bacterial and fungal growth, violating OSHA sanitation standards. All reusable towels must be fully dried after hot-water washing."
                    },
                    {
                              "id": "barber-lesson-5-q3",
                              "question": "What is the correct ergonomic position for a barber's elbows while working?",
                              "options": [
                                        "A. 90-degree angle with workstation",
                                        "B. Fully extended straight",
                                        "C. Bent at 45 degrees",
                                        "D. Locked in fixed position"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Proper ergonomic positioning maintains elbows at 90-degree angle with the workstation, preventing strain, fatigue, and chronic injury to shoulders, arms, and back over time."
                    },
                    {
                              "id": "barber-lesson-5-q4",
                              "question": "SCENARIO: A client presents with a fresh tattoo on their neck from 2 weeks ago and visible redness around the site. What is the correct response?",
                              "options": [
                                        "A. Proceed with service but avoid the tattoo area completely",
                                        "B. Perform full service as normal; tattoo is healed after 2 weeks",
                                        "C. Decline service and recommend client wait 2 more weeks before returning",
                                        "D. Use extra disinfectant around the area to ensure safety"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fresh tattoos require 4-week minimum healing time. Visible redness indicates incomplete healing. Service refusal protects the client from infection risk and the barber from bloodborne pathogen exposure. Document the refusal and recommend client return after full healing."
                    },
                    {
                              "id": "barber-lesson-5-q5",
                              "question": "SCENARIO: During a haircut, you notice the disinfectant solution in the tool container appears cloudy and slightly discolored. What is the correct action?",
                              "options": [
                                        "A. Continue using the solution; it is still effective when discolored",
                                        "B. Immediately stop using the solution, change it with fresh disinfectant, and retest concentration with color-change strips",
                                        "C. Add more concentrated disinfectant to the existing solution to restore strength",
                                        "D. Use the solution only for non-critical tools and change it at end of shift"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Cloudy or discolored disinfectant indicates contamination or degraded effectiveness. OSHA standards require immediate replacement with fresh solution and verification of proper concentration using color-change test strips before resuming tool use."
                    }
          ],
        },
        {
          slug: 'barber-lesson-6',
          title: 'Client Consultation',
          order: 6,
          domainKey: 'infection_control',
          objective:
            'Conduct a complete client consultation that identifies needs, contraindications, and service goals before beginning any service.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          competencyChecks: [
            'consultation_live',
          ],
          instructorNotes: [
          'Observe the full consultation — student must ask about scalp conditions, allergies, and service history. Refusal criteria must be stated correctly if a contraindication is present.',
        ],
          content: `<h2>Overview</h2><p>Client consultation is the foundation of every barbering service. Before cutting, shaving, or treating hair and skin, you must conduct a thorough consultation to identify the client's needs, assess for contraindications, and establish realistic service goals. This prevents service failures, protects client health, and builds trust and professional credibility. A complete consultation takes 5–10 minutes and involves questioning, visual assessment, and documentation.</p><h2>Tools Required</h2><ul><li>Consultation form or intake sheet (printed or digital)</li><li>Pen or stylus for recording notes</li><li>Hand mirror and overhead mirror for client viewing</li><li>Magnifying lamp or loupe to inspect scalp and skin condition</li><li>Color wheel or shade guide (if color services discussed)</li><li>Hair texture/type reference chart</li><li>Disinfectant wipes and clean towel for mirror and lamp surfaces</li></ul><h2>Procedure</h2><ol><li>Greet the client warmly, offer a seat in the consultation area, and confirm whether this is a first visit or returning client.</li><li>Ask open-ended questions: desired style, hair concerns, daily grooming routine, and any recent scalp or skin treatments or reactions.</li><li>Inspect the client's hair type, texture, density, and growth pattern; note curl pattern, damage, or thinning areas using the magnifying lamp.</li><li>Examine the scalp for signs of infection, irritation, lesions, dandruff, or contraindicated conditions; document all findings.</li><li>Assess skin condition on face and neck; ask about sensitivity, allergies, or recent shaving reactions before any service.</li><li>Review contraindications and determine if the service is safe to perform; if unsafe, explain professionally and suggest alternatives or referral.</li><li>Discuss service timeline, maintenance requirements, and aftercare instructions; clarify pricing and confirm the client's agreement.</li><li>Document all consultation findings, signed consent, and any service restrictions in the client file for future reference.</li></ol><h2>Decision Tree: Hair Type & Skin Variations</h2><p><strong>IF</strong> client has coarse, curly hair: THEN ask about curl definition goals, discuss fade or taper techniques that enhance texture, and recommend curl-defining products. <strong>IF</strong> client has fine or thinning hair: THEN assess for androgenetic alopecia, avoid aggressive techniques, and recommend gentle clipper work or scissor-over-comb methods. <strong>IF</strong> client has sensitive skin or reports razor burn history: THEN use single-use or freshly sterilized straight razors, apply pre-shave oil, and plan shorter contact time with the blade.</p><h2>Sanitation & Disinfection</h2><p>Before and after consultation, disinfect all contact surfaces with EPA-registered hospital-grade disinfectant (such as Barbicide or 10% bleach solution) using clean paper towels. Wipe mirrors, lamp handles, and armrests. Allow 10 seconds contact time. Use clean, lint-free towels to dry. If using a magnifying lamp with a client, place a disposable cover over the lens or disinfect the exterior lens with an alcohol wipe before client use. Never share consultation forms between clients; use individual, dated records.</p><h2>Contraindications & Do-NOT Statement</h2><p><strong>DO NOT perform any shaving or clipper service on a client with active bacterial, viral, or fungal scalp infection (such as impetigo, ringworm, or severe folliculitis), as doing so will spread the infection to other clients and contaminate your tools, resulting in license suspension, legal liability, and harm to public health. Always refer such clients to a dermatologist and document the referral.</strong></p><h2>Failure Mode & Recovery</h2><p><strong>Failure:</strong> You begin a service and the client suddenly reports a metal allergy or mentions a recent scalp treatment you missed during consultation. <strong>Recovery Step 1:</strong> Stop the service immediately and do not proceed. <strong>Step 2:</strong> Apologize and review the intake form to identify the missed information. <strong>Step 3:</strong> Ask clarifying questions about the allergy or treatment type and timing. <strong>Step 4:</strong> Assess whether the service remains safe; if unsafe, reschedule and refer as needed. <strong>Step 5:</strong> Update the client file with the new information and implement a checklist to prevent recurrence.</p><h2>Visual Execution Cues</h2><p>During consultation, position yourself at a 45-degree angle to the client so both of you can see the mirror clearly. Tilt the client's head slightly forward to inspect the crown and nape; tilt sideways to assess temple density and ear area hair growth. Use the magnifying lamp with the beam directed at the scalp at a 90-degree angle to reveal texture, shedding, and inflammation. Observe the client's posture and facial expression for signs of discomfort or hesitation, which may indicate unreported contraindications or anxiety about the service.</p><h2>Safety</h2><p>Client consultation prevents infection transmission, allergic reactions, and service failure. Always sanitize mirrors and lamps before each use. Never assume a returning client has no new health concerns—ask every time. If you observe signs of contagious scalp or skin disease, do not proceed; politely explain that a dermatologist clearance is required. Document all findings, contraindications, and client agreement in writing. Keep consultation records confidential and retain per Indiana State Board of Health regulations (minimum 1 year). If a client refuses to disclose health information or denies visible contraindicated conditions, you may decline the service to protect public health.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-6-q1",
                              "question": "What is the primary purpose of a client consultation before any barbering service?",
                              "options": [
                                        "A. To fill time and make the client comfortable waiting.",
                                        "B. To identify needs, assess contraindications, and establish realistic service goals while protecting client health.",
                                        "C. To sell additional products to increase revenue.",
                                        "D. To determine if the client can pay for the service."
                              ],
                              "correctAnswer": 1,
                              "explanation": "Client consultation is a clinical and professional step that identifies client needs, assesses for contraindications (conditions that make service unsafe), and sets service expectations. It protects both the client and the barber."
                    },
                    {
                              "id": "barber-lesson-6-q2",
                              "question": "When inspecting the client's scalp with a magnifying lamp, at what angle should the lamp beam be directed for optimal visibility?",
                              "options": [
                                        "A. At a 45-degree angle from the side.",
                                        "B. At a 90-degree angle (perpendicular) to the scalp surface.",
                                        "C. At a 30-degree angle from above.",
                                        "D. At any angle, as long as the client can see it."
                              ],
                              "correctAnswer": 1,
                              "explanation": "A 90-degree (perpendicular) beam angle reveals texture, shedding, inflammation, and contraindicated conditions most clearly without casting shadows."
                    },
                    {
                              "id": "barber-lesson-6-q3",
                              "question": "What should you do immediately after noticing signs of an active scalp infection during consultation?",
                              "options": [
                                        "A. Proceed with the service but use extra disinfectant afterward.",
                                        "B. Stop the service, do not proceed, and refer the client to a dermatologist while documenting the referral.",
                                        "C. Ask the client to return after treating it at home.",
                                        "D. Perform the service but charge a reduced rate."
                              ],
                              "correctAnswer": 1,
                              "explanation": "Active infections are contraindications. Proceeding spreads infection to other clients and equipment, risking your license and legal liability. Always refer and document."
                    },
                    {
                              "id": "barber-lesson-6-q4",
                              "question": "SCENARIO: A client presents with a history of severe razor burn from a previous barber and reports sensitive skin. What do you do?",
                              "options": [
                                        "A. Use the same technique the previous barber used to provide consistency.",
                                        "B. Decline the shaving service entirely and offer only clipper work.",
                                        "C. Document the sensitivity, use a freshly sterilized or single-use straight razor, apply pre-shave oil, and plan shorter blade contact time.",
                                        "D. Ask the client to apply numbing cream before the appointment."
                              ],
                              "correctAnswer": 2,
                              "explanation": "Sensitive skin and prior razor burn are managed through documentation, tool selection (fresh or single-use razor), protective measures (pre-shave oil), and modified technique (shorter contact), not avoidance."
                    },
                    {
                              "id": "barber-lesson-6-q5",
                              "question": "SCENARIO: After beginning a haircut, the client mentions a recent metal allergy and a scalp treatment from three days ago that you missed during consultation. What is the correct response?",
                              "options": [
                                        "A. Continue the service since you have already started; bring it up at the next visit.",
                                        "B. Stop immediately, apologize, review the missed information, assess safety, reschedule if unsafe, and update the client file with a checklist.",
                                        "C. Switch to a different tool and continue the service without stopping.",
                                        "D. Charge the client less because of the missed information."
                              ],
                              "correctAnswer": 1,
                              "explanation": "Stopping immediately prevents service failure and potential harm. Reviewing, assessing, and updating records ensures the error is corrected and prevents future recurrence."
                    }
          ],
        },
        {
          slug: 'barber-module-1-checkpoint',
          title: 'Module 1 Checkpoint — Foundations & Safety',
          order: 7,
          domainKey: 'infection_control',
          objective:
            'Demonstrate mastery of professional conduct, tools, sanitation, workplace safety, and client consultation.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Overview</h2><p>Module 1 Checkpoint assesses your mastery of infection control, safety protocols, tool sterilization, professional conduct, and client consultation. This checkpoint ensures you meet Indiana Department of Labor apprenticeship standards for barbering services. Successful completion demonstrates readiness for hands-on barbering procedures with live clients and mastery of foundational competencies required throughout your apprenticeship.</p><h2>Tools Required</h2><ul><li>Straight razors (sanitized and stropped)</li><li>Clipper sets with sanitized guards and blades</li><li>Scissors (shears) and thinning shears, sterilized</li><li>Combs, brushes, and sectioning clips</li><li>Autoclave sterilizer or EPA-registered liquid disinfectant (e.g., Barbicide or 10% bleach solution)</li><li>Towels, neck strips, and single-use cape liners</li><li>Barrier cream, aftershave balm, and professional grooming products</li></ul><h2>Client Consultation Decision Matrix</h2><ul><li>IF client has fine, thin hair THEN use longer clipper guards, reduce tension, and avoid aggressive texturizing to prevent scalp irritation and uneven weight distribution.</li><li>IF client presents with sensitive skin or razor bumps THEN apply pre-shave oil, use single-pass technique with straight razor, and recommend post-service aftercare to minimize inflammation.</li><li>IF client requests fade or undercut THEN establish baseline length preference, confirm blend zone, and verify client expectations through visual references before beginning service.</li></ul><h2>Sanitation &amp; Disinfection</h2><p>All multi-use tools must be sterilized via autoclave (15 minutes at 250°F) or submerged in EPA-registered disinfectant (e.g., Barbicide) for minimum contact time per manufacturer instructions—typically 10-15 minutes. Single-use items (razors, blades, neck strips) must be discarded immediately after use. Workstations must be cleaned with hospital-grade disinfectant between clients. Wash hands thoroughly with soap and warm water for minimum 20 seconds before and after client contact. Never reuse tools from one client on another without proper sterilization.</p><h2>Critical Contraindication</h2><p><strong>DO NOT perform any cutting, shaving, or chemical service on clients with open wounds, active infections, severe dermatitis, or contagious skin conditions. Proceeding violates sanitation codes, risks cross-contamination, and may cause serious skin damage, infection spread, and legal liability for the shop and apprentice.</strong></p><h2>Failure Mode &amp; Recovery</h2><p>Failure: Clipper blade becomes dull or pulls hair during fade service. Cause: Inadequate sterilization left residue dulling blade edge. Recovery: (1) Stop service immediately. (2) Remove blade and inspect for debris or buildup. (3) Soak blade in hot disinfectant for 15 minutes. (4) Use soft brush to gently clean grooves. (5) Rinse under warm water. (6) Dry completely. (7) Test on spare hair or practice pad. (8) If pulling persists, replace blade. (9) Apologize to client and explain maintenance issue. (10) Resume with fresh blade and adjusted technique.</p><h2>Visual Execution Cues</h2><p>Maintain 45-degree blade angle to scalp for clipper work; hold clipper body parallel to client's head during fades. Position clippers with grain for smooth cutting, against grain for closer cuts. Straight razor angle should be 15-30 degrees to skin surface with light pressure. Client should sit upright with neck relaxed, head tilted slightly forward for nape work. Scissor grip: thumb in one loop, ring and middle fingers in other loop, index finger stabilizing shears. Final appearance: clean lines, even blend zones, no visible clipper marks or scissor tracks, consistent fade progression, smooth skin feel without irritation.</p><h2>Step-by-Step Procedure</h2><ol><li>Greet client professionally, confirm service request, verify identity, and document any allergies or skin sensitivities on intake form before proceeding.</li><li>Perform visual and tactile scalp assessment; identify hair texture, density, growth patterns, and any contraindications requiring service modification or referral.</li><li>Sanitize hands with soap and warm water for 20 seconds; don fresh gloves and apply clean, sanitized cape with neck strip protecting client clothing.</li><li>Section hair using clean, sanitized clips; establish baseline guide length and confirm client preference using reference images or demonstration haircut.</li><li>Use sanitized clipper with appropriate guard, working systematically from sides to top, maintaining consistent blade angle and even pressure throughout fade area.</li><li>Refine blend zones using thinning shears or clipper-over-comb technique; verify symmetry by comparing both sides and adjusting as needed for balance.</li><li>Clean neck and ears with sanitized straight razor or trimmer, using light pressure and smooth, controlled strokes following hair growth direction.</li><li>Apply aftershave balm or conditioning product; remove cape carefully without dropping hair on client, and provide grooming and home-care recommendations.</li><li>Document service completion, product used, client feedback, and any concerns in apprenticeship logbook for supervisor review and quality assurance.</li></ol><h2>Safety &amp; Professional Standards</h2><p>Maintain universal precautions at all times: assume all clients may carry bloodborne pathogens. Never cut if you have open wounds on hands; cover with bandage and glove. Dispose of razors in sharps container only. Report any accidental cuts to supervisor immediately and follow bloodborne pathogen exposure protocol. Maintain professional posture to prevent back strain; take breaks and adjust chair height. Keep work area organized and clutter-free to prevent tripping hazards. Communicate clearly with client throughout service and address concerns immediately. Document all services, products, and client preferences in apprenticeship record for continuous improvement and legal compliance.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-module-1-checkpoint-q1",
                              "question": "Which of the following is the correct minimum sterilization time for tools submerged in Barbicide?",
                              "options": [
                                        "A. 5 minutes",
                                        "B. 10-15 minutes per manufacturer instructions",
                                        "C. 20 minutes",
                                        "D. 30 minutes"
                              ],
                              "correctAnswer": 1,
                              "explanation": "EPA-registered disinfectants like Barbicide require minimum contact time of 10-15 minutes per manufacturer specifications. Shorter times reduce effectiveness and violate sanitation standards."
                    },
                    {
                              "id": "barber-module-1-checkpoint-q2",
                              "question": "What is the recommended straight razor angle relative to the skin surface for safe, effective shaving?",
                              "options": [
                                        "A. 45-60 degrees",
                                        "B. 75-90 degrees",
                                        "C. 15-30 degrees",
                                        "D. 0-5 degrees (flat against skin)"
                              ],
                              "correctAnswer": 2,
                              "explanation": "A 15-30 degree angle ensures proper blade contact, minimizes nick risk, and provides smooth cutting. Angles exceeding 45 degrees reduce control and increase trauma to skin."
                    },
                    {
                              "id": "barber-module-1-checkpoint-q3",
                              "question": "Which single-use barbering item must be discarded immediately after use rather than sterilized?",
                              "options": [
                                        "A. Clipper guards",
                                        "B. Straight razor blades and neck strips",
                                        "C. Metal scissors",
                                        "D. Combs"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Single-use items like razor blades and neck strips must be discarded in appropriate waste containers to prevent cross-contamination. Reusable metal tools are sterilized via autoclave or disinfectant."
                    },
                    {
                              "id": "barber-module-1-checkpoint-q4",
                              "question": "SCENARIO: A client presents with visible razor bumps on the neck and mentions sensitive skin history. What is your correct response?",
                              "options": [
                                        "A. Proceed with standard shaving technique to build client tolerance",
                                        "B. Apply pre-shave oil, use single-pass straight razor technique, and recommend aftercare to minimize inflammation",
                                        "C. Substitute clippers for razors without discussing with client",
                                        "D. Decline service entirely and refuse to work with sensitive skin"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Professional modification ensures client safety and comfort. Pre-shave oil reduces friction, single-pass minimizes trauma, and aftercare recommendations prevent infection. Proceeding without modification risks complications."
                    },
                    {
                              "id": "barber-module-1-checkpoint-q5",
                              "question": "SCENARIO: During a fade, your clipper blade begins pulling and snagging hair instead of cutting cleanly. What is your first corrective action?",
                              "options": [
                                        "A. Switch to scissors to complete the service quickly",
                                        "B. Stop immediately, soak blade in hot disinfectant, inspect for debris, and test on practice pad before resuming",
                                        "C. Continue with increased pressure to compensate for blade dullness",
                                        "D. Replace the clipper entirely without investigating the cause"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Stopping immediately protects client comfort and prevents damage. Disinfection and inspection address the root cause (residue or dullness). Testing ensures blade readiness before resuming service."
                    }
          ],
        },
      ],
    }

;
