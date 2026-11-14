import type { BlueprintModule } from '../types';

export const barberModule3: BlueprintModule = {
      slug: 'barber-module-3',
      title: 'Module 3: Tools, Equipment & Ergonomics',
      orderIndex: 3,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'tools_equipment',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'clipper_operation', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'scissor_technique', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'razor_safety', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'tool_maintenance', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-15',
          title: 'Clippers & Trimmers — Types and Guards',
          order: 1,
          domainKey: 'tools_equipment',
          objective: 'Identify clipper types, guard sizes, and their uses.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-clipper-techniques.mp4',
          learningObjectives: [
            'Identify the difference between clippers and trimmers and when to use each',
            'Match guard sizes to their corresponding hair lengths',
            'Demonstrate correct clipper blade alignment and tension adjustment',
            'Explain proper clipper maintenance: oiling, cleaning, and blade replacement',
          ],
          competencyChecks: [
            {
              key: 'clipper_maintenance',
              label: 'Clipper Maintenance Demonstration',
              description:
                'Student oils, cleans, and correctly adjusts blade tension on a clipper in front of the instructor.',
              isCritical: true,
              requiresInstructorSignoff: true,
            },
          ],
          instructorNotes: `Blade tension check: student must demonstrate both too-loose and correct tension settings. Oil application must be on the correct points — not flooded. Blade must be removed and cleaned, not just sprayed.`,
          content: `<h2>Overview</h2><p>Clippers and trimmers are fundamental tools for barbers, used to cut, blend, and detail hair efficiently. Understanding the differences between clipper types, guard sizes, and their specific applications ensures professional results and client satisfaction. Magnetic motor clippers provide power for bulk cutting, while rotary clippers offer quieter operation. Pivot motor trimmers excel at detailing and edging. Guards, measured in eighths of an inch, control cutting length from skin-close fades to longer textured cuts. Mastery of these tools allows barbers to execute diverse styles, from classic tapers to modern fades, while maintaining precision and consistency throughout every service.</p><h2>Tools Required</h2><ul><li>Magnetic motor clippers with detachable blade system</li><li>Rotary motor clippers for precision fading</li><li>Pivot motor trimmers for edging and detail work</li><li>Guard attachment set ranging from #0.5 to #8</li><li>Clipper blade oil and cleaning brush</li><li>Disinfectant spray specifically labeled for tools</li><li>Neck duster for removing loose hair</li><li>Blade coolant or cooling spray</li></ul><h2>Client Assessment</h2><p>IF the client has thick, coarse hair, THEN use magnetic motor clippers with guards #3 or higher for initial bulk removal, as these provide sufficient power without bogging down. IF the client has fine or thinning hair, THEN select rotary clippers with guards #1 to #2 and work with lighter pressure to avoid creating unintended bald spots or lines of demarcation that become visible as the hair lies flat against the scalp.</p><h2>Procedure</h2><ol><li>Inspect clippers and trimmers for blade alignment, ensuring cutting edges are even and free of rust, gaps, or visible damage before service.</li><li>Select appropriate guard size based on desired length, starting with larger guards for conservative length and working down as needed for precision.</li><li>Attach guard firmly to clipper, ensuring it clicks securely into place and sits flush against the blade to prevent uneven cutting.</li><li>Begin cutting with clippers held at proper angle, typically perpendicular to scalp for uniform length or angled for tapering and blending techniques.</li><li>Move clippers against hair growth direction using smooth, overlapping strokes to ensure complete coverage and eliminate missed patches or track marks.</li><li>Switch to smaller guards progressively when creating fades, blending each section seamlessly by using scooping or flicking motions at transition points.</li><li>Use trimmers without guards for detail work around ears, neckline, and sideburns, holding them at shallow angles for clean, precise lines.</li><li>Apply blade coolant if clippers become warm during extended use, then complete final inspection for symmetry and blending before concluding service.</li></ol><h2>Safety</h2><p>After each client, remove guards and spray all clipper and trimmer surfaces with EPA-registered hospital-grade disinfectant such as Barbicide spray or Clippercide, allowing appropriate contact time per manufacturer instructions. Brush away loose hair from between blade teeth, apply two drops of clipper oil, and run briefly to distribute lubricant.<strong>Do NOT use clippers with misaligned or damaged blades, as this causes skin irritation, painful pulling, and potential cuts or abrasions that create infection risk and liability.</strong>If clippers pull hair instead of cutting cleanly, this indicates dull blades requiring immediate replacement or sharpening, compromising service quality and client comfort significantly.</p><h2>Failure Recovery</h2><p>If you accidentally remove too much hair by using an incorrect guard size, causing a visible bald patch or line, immediately stop cutting. Assess the damage extent by combing surrounding hair over the area. Gradually blend the surrounding sections using the next smaller guard size, working in small increments. Use clipper-over-comb technique to feather edges. Apply texturizing or point-cutting scissors to soften harsh lines. Communicate honestly with the client about correction options, which may include adjusting the overall style shorter or creating a different look that incorporates the mistake into an intentional design element.</p><h2>Visual Cues</h2><p>Hold clippers perpendicular to the head for uniform all-over cuts, with the guard base flat against the scalp throughout the stroke. For fades and tapers, angle clippers progressively as you move upward, rotating from flat against the head to approximately forty-five degrees at transition zones. Observe the hair falling away from the clipper; it should release cleanly without bunching or pulling. Watch for track marks appearing as visible lines in the cut, indicating overlapping strokes are needed. Monitor blade temperature by periodically touching the housing; excessive heat signals need for coolant application or motor rest to prevent discomfort during service.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-15-q1",
                              "question": "What is the primary advantage of magnetic motor clippers over other clipper types?",
                              "options": [
                                        "A. They provide the most power for cutting thick, coarse hair and bulk removal",
                                        "B. They operate most quietly among all clipper motor types",
                                        "C. They are best suited exclusively for fine detail work around the ears",
                                        "D. They require no maintenance or blade oil between clients"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Magnetic motor clippers deliver the most cutting power, making them ideal for bulk removal and cutting through thick, coarse hair efficiently without bogging down during the service."
                    },
                    {
                              "id": "barber-lesson-15-q2",
                              "question": "Guard sizes on clipper attachments are typically measured in what increment?",
                              "options": [
                                        "A. Millimeters only, following metric standards",
                                        "B. Eighths of an inch for standard sizing",
                                        "C. Quarters of an inch for all manufacturers",
                                        "D. Centimeters according to international guidelines"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Clipper guards are measured in eighths of an inch, with each guard number representing that many eighths. For example, a #4 guard leaves 4/8 or 1/2 inch of hair length."
                    },
                    {
                              "id": "barber-lesson-15-q3",
                              "question": "Which tool is most appropriate for creating clean edge lines around the ears and neckline?",
                              "options": [
                                        "A. Pivot motor trimmers without guards for precision detailing",
                                        "B. Magnetic motor clippers with a #8 guard attached",
                                        "C. Rotary clippers with the longest guard available",
                                        "D. Thinning shears held at a forty-five degree angle"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Pivot motor trimmers used without guards provide the precision and maneuverability needed for clean, detailed edge work around ears, necklines, and sideburns where accuracy is essential."
                    },
                    {
                              "id": "barber-lesson-15-q4",
                              "question": "SCENARIO: A client with very fine, thinning hair requests a fade. What is the most appropriate approach?",
                              "options": [
                                        "A. Use magnetic motor clippers with heavy pressure to ensure complete coverage",
                                        "B. Apply the shortest guards first and work upward to longer lengths",
                                        "C. Select rotary clippers with guards #1 to #2 and use lighter pressure to avoid visible demarcation lines",
                                        "D. Recommend using only scissors throughout the entire service"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fine, thinning hair requires rotary clippers with appropriate guards and lighter pressure to prevent creating harsh lines or bald spots that become highly visible when fine hair lies flat against the scalp."
                    },
                    {
                              "id": "barber-lesson-15-q5",
                              "question": "SCENARIO: During a clipper cut, you notice the hair is pulling rather than cutting cleanly. What is the correct response?",
                              "options": [
                                        "A. Increase pressure and speed to force the clippers through the hair",
                                        "B. Stop immediately, as this indicates dull blades that require replacement or sharpening before continuing",
                                        "C. Switch to a smaller guard size to reduce the amount of hair being cut",
                                        "D. Apply more blade oil while continuing to cut through the section"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Hair pulling indicates dull or damaged blades that compromise both service quality and client comfort. The barber must stop immediately and replace or sharpen the blades before continuing to prevent discomfort and poor results."
                    }
          ],
        },
        {
          slug: 'barber-lesson-16',
          title: 'Scissors & Shears',
          order: 2,
          domainKey: 'tools_equipment',
          objective: 'Select and use the correct scissors for different cutting techniques.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-scissors-narrated.mp4',
          content: `<h2>Introduction to Scissors & Shears</h2><p>In this lesson, we will cover the selection and use of the correct scissors for different cutting techniques. As a barber, it is essential to understand the various types of scissors and shears available and how to use them safely and effectively.</p><h3>Tools and Equipment Required</h3><ul><li>Thinning scissors</li><li>Curved scissors</li><li>Texturizing shears</li><li>Sanitizing solution</li><li>Disinfectant spray</li></ul><h3>Selection and Use of Scissors</h3><p>When selecting scissors, consider the hair type and cutting technique. For example, thinning scissors are ideal for cutting fine or damaged hair, while curved scissors are better suited for cutting curly or wavy hair.</p><p>IF the client has dry or damaged hair, THEN use thinning scissors to minimize further damage. IF the client has curly or wavy hair, THEN use curved scissors to enhance the natural texture.</p><h3>Sanitation and Infection Control</h3><p>It is crucial to maintain sanitation and infection control when using scissors and shears. Always sanitize the scissors and shears with a sanitizing solution before and after each use. Disinfect the scissors and shears with a disinfectant spray at the end of each day.</p><p>DO NOT share scissors or shears with other barbers or clients, as this can spread infection and disease.</p><h3>Failure Mode and Recovery</h3><p>A common failure mode when using scissors is cutting the hair too short or unevenly. This can happen when the barber is not paying attention to the length or angle of the cut. To recover from this failure mode, the barber can use texturizing shears to blend the layers and create a more natural look.</p><h3>Correct Execution</h3><p>Correct execution of scissors and shears techniques involves holding the scissors at a 45-degree angle, with the blades facing the direction of the cut. The scissors should be opened and closed smoothly, with a gentle snipping motion. The hair should be cut in small, even sections, with the scissors gliding through the hair with ease.</p><h3>Visual Cues</h3><p>When using scissors and shears, look for the following visual cues: the hair should be cut evenly, with no visible lines or layers. The scissors should be moving smoothly, with no hesitation or snagging. The client's hair should be looking healthy and natural, with no visible damage or split ends.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-16-q1",
                              "question": "What type of scissors is ideal for cutting fine or damaged hair?",
                              "options": [
                                        "Thinning scissors",
                                        "Curved scissors",
                                        "Texturizing shears",
                                        "Regular scissors"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Thinning scissors are designed to minimize further damage to fine or damaged hair."
                    },
                    {
                              "id": "barber-lesson-16-q2",
                              "question": "A client presents with curly hair and wants a trim. What type of scissors should you use?",
                              "options": [
                                        "Thinning scissors",
                                        "Curved scissors",
                                        "Texturizing shears",
                                        "Regular scissors"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Curved scissors are better suited for cutting curly or wavy hair, as they enhance the natural texture."
                    },
                    {
                              "id": "barber-lesson-16-q3",
                              "question": "What is the correct angle to hold the scissors when cutting hair?",
                              "options": [
                                        "30 degrees",
                                        "45 degrees",
                                        "60 degrees",
                                        "90 degrees"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct angle to hold the scissors is 45 degrees, with the blades facing the direction of the cut."
                    },
                    {
                              "id": "barber-lesson-16-q4",
                              "question": "A client has dry and damaged hair, and you accidentally cut it too short. What can you do to recover from this failure mode?",
                              "options": [
                                        "Use thinning scissors to cut more hair",
                                        "Use texturizing shears to blend the layers",
                                        "Use a hair mask to moisturize the hair",
                                        "Start over with a new haircut"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Using texturizing shears to blend the layers can help recover from cutting the hair too short, as it creates a more natural look."
                    },
                    {
                              "id": "barber-lesson-16-q5",
                              "question": "What is a contraindication when using scissors and shears?",
                              "options": [
                                        "Sharing scissors with other barbers",
                                        "Sanitizing scissors before each use",
                                        "Using scissors with dull blades",
                                        "Cutting hair with the scissors at a 45-degree angle"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Sharing scissors with other barbers is a contraindication, as it can spread infection and disease."
                    }
          ],
        },
        {
          slug: 'barber-lesson-17',
          title: 'Straight Razor & Safety Razor',
          order: 3,
          domainKey: 'tools_equipment',
          objective: 'Safely handle, use, and maintain straight and safety razors.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-razor-narrated.mp4',
          learningObjectives: [
            'Demonstrate safe straight razor handling — correct grip, angle, and stroke direction',
            'Replace a safety razor blade correctly and dispose of the used blade in a sharps container',
            'Explain the difference between a straight razor and a shavette',
            'Identify when a razor is too dull for safe use',
            'Apply correct strop technique to maintain a straight razor edge',
          ],
          competencyChecks: [
            {
              key: 'razor_blade_change',
              label: 'Safety Razor Blade Change',
              description:
                'Student removes used blade safely, places it in sharps container, and inserts a fresh blade correctly.',
              isCritical: true,
              requiresInstructorSignoff: true,
            },
            {
              key: 'straight_razor_grip',
              label: 'Straight Razor Grip & Angle',
              description:
                'Student demonstrates correct grip, 30-degree blade angle, and with-the-grain first pass on a practice surface.',
              isCritical: true,
              requiresInstructorSignoff: true,
            },
          ],
          instructorNotes: `Blade change: used blade must go directly into sharps container — not the trash, not the counter. Straight razor grip: check thumb placement and blade angle before any live client work. Student must not proceed to live shaving until both checks are signed off.`,
          content: `<h2>Overview</h2><p>Straight razors and safety razors are essential precision tools in professional barbering, requiring mastery of technique, maintenance, and safety protocols. This lesson covers proper handling, stropping, sanitizing, and execution of razor services. Understanding blade angles, skin tension, and client assessment ensures safe, comfortable shaves while preventing injury and infection. Mastery of these tools distinguishes professional barbers and enables traditional wet shaving services that clients value.</p><h2>Tools Required</h2><ul><li>Straight razor with changeable blade system or traditional fixed blade</li><li>Safety razor with guard and fresh double-edge blades</li><li>Leather strop and canvas strop for honing and maintenance</li><li>Pre-shave oil and quality shaving cream or soap</li><li>Hot towels and towel warmer for skin preparation</li><li>Styptic powder or alum block for minor nicks</li><li>EPA-registered hospital-grade disinfectant such as Barbicide or Marvicide</li></ul><h2>Client Assessment</h2><p>IF the client has coarse, curly hair prone to ingrown hairs, THEN shave with the grain only and use pre-shave oil to soften hair and reduce irritation. IF the client has sensitive skin or visible irritation, THEN reduce passes to a single with-grain pass and apply cool compresses between towel applications to minimize inflammation and discomfort.</p><h2>Procedure</h2><ol><li>Sanitize hands and inspect razor for damage or dullness. Ensure blade is properly seated and secure in the handle mechanism.</li><li>Apply hot towel to client's face for two to three minutes to soften hair and open pores, ensuring optimal cutting conditions.</li><li>Apply pre-shave oil and work quality lather into beard using circular motions, ensuring complete coverage and hydration of hair shafts.</li><li>Establish proper skin tension with non-dominant hand, stretching skin taut in direction opposite to razor stroke for optimal cutting surface.</li><li>Execute first pass with grain using 30-degree blade angle, employing short controlled strokes with consistent light pressure throughout coverage area.</li><li>Reapply lather and perform across-grain pass if needed, maintaining proper angle and tension while checking for missed areas or irregularities.</li><li>Apply cold towel to close pores, then aftershave or moisturizer. Clean and disinfect razor per manufacturer protocols immediately after service.</li></ol><h2>Safety</h2><p>Immerse razors completely in EPA-registered disinfectant solution such as Barbicide for ten minutes minimum contact time between clients, ensuring all blood-borne pathogen exposure risks are eliminated. Follow state board requirements for storage of disinfected tools in clean, covered containers.</p><p><strong>Do NOT perform razor services on clients with active skin infections, open wounds, or contagious skin conditions such as impetigo or herpes simplex, as this will spread infection, contaminate tools, and violate health codes, potentially resulting in license suspension and legal liability.</strong></p><p>If a nick or cut occurs during service, immediately apply firm pressure with clean gauze or cotton, followed by styptic powder application. Stop the service temporarily. Once bleeding stops completely, assess whether to continue based on severity. Document the incident. Clean contaminated surfaces with hospital-grade disinfectant. Replace blade immediately and place used blade in sharps container. Comfort the client and explain the recovery steps taken to ensure their safety and well-being.</p><h2>Visual Cues</h2><p>Maintain a 30-degree angle between blade edge and skin surface, visible as a shallow approach rather than perpendicular positioning. Properly stretched skin appears smooth, taut, and free of wrinkles in the stroke path. Observe the shaving cream removing cleanly in single strokes without multiple passes over the same area. The blade should glide smoothly without dragging, skipping, or pulling sensations. Watch for skin redness or irritation developing during service, indicating excessive pressure or improper angle. Completed areas should appear smooth, even-toned, and free from visible stubble or razor burn patterns.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-17-q1",
                              "question": "What is the correct blade angle for straight razor shaving?",
                              "options": [
                                        "A. 30 degrees between blade and skin surface",
                                        "B. 45 degrees between blade and skin surface",
                                        "C. 90 degrees perpendicular to skin surface",
                                        "D. 15 degrees nearly flat against skin"
                              ],
                              "correctAnswer": 0,
                              "explanation": "A 30-degree angle provides optimal cutting efficiency while minimizing irritation and risk of cuts. This angle allows the blade edge to slice through hair effectively without scraping or dragging on the skin surface."
                    },
                    {
                              "id": "barber-lesson-17-q2",
                              "question": "What is the minimum contact time required for disinfecting razors in EPA-registered solution?",
                              "options": [
                                        "A. Five minutes in solution",
                                        "B. Ten minutes in solution",
                                        "C. Fifteen minutes in solution",
                                        "D. Three minutes in solution"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Ten minutes minimum contact time in EPA-registered disinfectant like Barbicide ensures complete elimination of blood-borne pathogens and meets state board sanitation requirements for razor services."
                    },
                    {
                              "id": "barber-lesson-17-q3",
                              "question": "What is the primary purpose of applying hot towels before razor shaving?",
                              "options": [
                                        "A. Soften hair and open pores for optimal cutting conditions",
                                        "B. Remove all oils from the skin surface",
                                        "C. Disinfect the skin before service",
                                        "D. Test client tolerance for heat"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Hot towels soften hair shafts and open pores, making hair easier to cut and reducing drag on the blade. This preparation step is essential for comfortable, effective razor shaving and reduces irritation."
                    },
                    {
                              "id": "barber-lesson-17-q4",
                              "question": "SCENARIO: A client with coarse, curly hair prone to ingrown hairs requests a close shave. What do you do?",
                              "options": [
                                        "A. Perform multiple against-grain passes for maximum closeness",
                                        "B. Use a dull blade to avoid cutting too close",
                                        "C. Shave with the grain only and apply pre-shave oil to reduce irritation",
                                        "D. Refuse the service entirely"
                              ],
                              "correctAnswer": 2,
                              "explanation": "For clients prone to ingrown hairs, shaving with the grain only prevents hair from being cut too short below the skin surface. Pre-shave oil softens hair and reduces friction, minimizing the risk of ingrown hairs and irritation."
                    },
                    {
                              "id": "barber-lesson-17-q5",
                              "question": "SCENARIO: During the service you notice the blade is dragging and pulling rather than gliding smoothly. Correct response?",
                              "options": [
                                        "A. Apply more pressure to force the blade through",
                                        "B. Stop, assess blade sharpness, replace or strop as needed, and reapply lather",
                                        "C. Continue the service using faster strokes",
                                        "D. Switch to shaving against the grain"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Dragging indicates a dull blade or insufficient lubrication. Stopping to replace or strop the blade and reapply lather ensures client comfort and safety. Continuing with a dull blade causes irritation, cuts, and poor results."
                    }
          ],
        },
        {
          slug: 'barber-lesson-18',
          title: 'Clipper Maintenance & Blade Care',
          order: 4,
          domainKey: 'tools_equipment',
          objective:
            'Perform routine clipper maintenance to extend tool life and ensure performance.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-clipper-techniques.mp4',
          content: `<h2>Overview</h2><p>Proper clipper maintenance is essential for delivering consistent, professional haircuts and extending the life of your most important tools. Regular cleaning, oiling, and blade care prevent performance degradation, reduce client discomfort, and maintain hygiene standards. This lesson covers the fundamental maintenance procedures every barber apprentice must master, including daily cleaning protocols, blade alignment checks, and troubleshooting common issues. Understanding these techniques will save you money on premature replacement costs and ensure your clippers perform at peak efficiency throughout each service day.</p><h2>Tools Required</h2><ul><li>Clipper blade brush with stiff bristles</li><li>Clipper blade oil (manufacturer-recommended or professional-grade)</li><li>Barbicide or EPA-registered disinfectant solution</li><li>Clean, lint-free microfiber cloths</li><li>Small flathead screwdriver for blade adjustment</li><li>Blade coolant spray or cooling lubricant</li><li>Replacement blade set compatible with your clipper model</li><li>Compressed air canister or electric air blower</li></ul><h2>Client Variations</h2><p>IF the client has thick, coarse hair, THEN expect faster blade dulling and increased friction; apply blade coolant more frequently during the cut and inspect blades for wear after each service. IF the client has fine, thin hair, THEN less frequent oiling is needed during the service, but ensure blades remain sharp as dull blades snag delicate hair shafts more readily.</p><h2>Sanitation Protocol</h2><p>After each client service, remove loose hair with a brush, then spray blades thoroughly with Barbicide spray disinfectant or immerse detachable blades in Barbicide solution for ten minutes. Allow blades to air dry completely before reassembling to prevent rust formation. This hospital-grade disinfection kills bacteria, viruses, and fungi that accumulate during client contact, meeting Indiana State Board sanitation requirements.</p><h2>Safety</h2><p><strong>Do NOT operate clippers with misaligned blades</strong>, as this causes uneven cutting, painful skin pinching, and potential lacerations to the client's scalp. Misalignment also creates excessive heat buildup and motor strain, leading to premature clipper failure and costly repairs. Always verify proper blade alignment before beginning any service and stop immediately if you notice dragging or uneven cutting performance during use.</p><h2>Failure Mode</h2><p>If clippers suddenly stop cutting effectively mid-service despite running normally, the cause is typically hair and product buildup between blade teeth creating a barrier. To recover: First, turn off and unplug clippers immediately. Second, remove blade assembly using the screwdriver. Third, brush all visible debris from both blades. Fourth, use compressed air to remove packed material. Fifth, apply three drops of clipper oil across the blade. Sixth, reassemble, test on back of hand, then resume service with properly functioning tool.</p><h2>Visual Cues</h2><p>Properly maintained blades appear silver or steel-colored without brown oxidation spots or black carbon buildup between teeth. The cutting blade should move smoothly side-to-side with a quiet humming sound, not grinding or clicking noises. Blade teeth should align perfectly with no visible gaps when viewed straight-on at eye level. Oil should create a thin, even sheen across the blade surface without pooling or dripping. During operation, blades should remain cool enough to touch comfortably within thirty seconds of shutting off the clipper motor.</p><h2>Procedure</h2><ol><li>Turn off and unplug clippers completely. Remove loose hair using the blade brush, sweeping from base toward teeth in firm strokes.</li><li>Use compressed air to blow out packed debris from between blade teeth and inside the blade housing, holding nozzle at forty-five degrees.</li><li>Apply two to three drops of clipper oil evenly across the top blade while holding clipper horizontal with blades facing upward.</li><li>Turn on clippers briefly for five seconds to distribute oil across all contact surfaces, then wipe excess with clean cloth.</li><li>Inspect blade alignment by viewing straight-on; adjust screws if cutting blade extends beyond guide blade or gaps appear between teeth.</li><li>Spray blades with Barbicide disinfectant until fully saturated, ensuring solution contacts all blade surfaces. Allow ten-minute contact time before air drying.</li><li>Test clippers on back of your hand for smooth operation and proper cutting action before using on next client.</li><li>Store clippers in clean, dry location with blades protected from impact damage. Repeat full maintenance after every three to four clients.</li></ol>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-18-q1",
                              "question": "What is the primary reason for applying clipper oil during routine maintenance?",
                              "options": [
                                        "A. To reduce friction between blade surfaces and prevent overheating during operation",
                                        "B. To make the clippers appear more professional and shiny",
                                        "C. To disinfect the blades and kill bacteria between clients",
                                        "D. To sharpen the blade teeth and restore cutting performance"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Clipper oil reduces friction between moving blade surfaces, prevents overheating, and ensures smooth operation. It is not a disinfectant or sharpening agent, though it does protect against rust."
                    },
                    {
                              "id": "barber-lesson-18-q2",
                              "question": "How long should clipper blades remain in contact with Barbicide disinfectant solution?",
                              "options": [
                                        "A. Thirty seconds for quick sanitation",
                                        "B. Ten minutes for proper hospital-grade disinfection",
                                        "C. One hour to ensure complete sterilization",
                                        "D. Five minutes as a standard protocol"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Barbicide requires a ten-minute contact time to effectively kill bacteria, viruses, and fungi according to EPA registration and Indiana State Board requirements for proper disinfection."
                    },
                    {
                              "id": "barber-lesson-18-q3",
                              "question": "What visual indicator suggests clipper blades need immediate cleaning?",
                              "options": [
                                        "A. Black carbon buildup or brown oxidation visible between blade teeth",
                                        "B. A shiny, reflective surface across the entire blade",
                                        "C. Slight warmth felt on the blade housing",
                                        "D. Quiet humming sound during operation"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Black carbon buildup or brown oxidation between teeth indicates accumulated debris and potential rust, requiring immediate cleaning. A shiny surface and quiet operation indicate proper maintenance."
                    },
                    {
                              "id": "barber-lesson-18-q4",
                              "question": "SCENARIO: A client with extremely thick, coarse hair is scheduled for a full clipper cut. What maintenance adjustment should you make?",
                              "options": [
                                        "A. Use less oil than normal to prevent hair from sticking to blades",
                                        "B. Skip the pre-service blade inspection to save time",
                                        "C. Apply blade coolant more frequently and inspect for wear after the service",
                                        "D. Increase blade gap spacing to accommodate the hair thickness"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Thick, coarse hair creates more friction and heat, dulling blades faster. Applying coolant frequently prevents overheating, and post-service inspection catches accelerated wear before it affects future clients."
                    },
                    {
                              "id": "barber-lesson-18-q5",
                              "question": "SCENARIO: During a haircut, your clippers suddenly stop cutting effectively although the motor still runs. What is your correct first response?",
                              "options": [
                                        "A. Apply more pressure and continue cutting to push through the problem",
                                        "B. Turn off and unplug the clippers immediately, then disassemble for cleaning",
                                        "C. Spray the blades with oil while running to lubricate them",
                                        "D. Switch to a different clipper and continue without interruption"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When clippers stop cutting despite running, hair buildup is blocking the blades. Immediately turning off and unplugging ensures safety, and disassembly allows proper cleaning to restore function before resuming service."
                    }
          ],
        },
        {
          slug: 'barber-lesson-19',
          title: 'Ergonomics & Body Mechanics',
          order: 5,
          domainKey: 'tools_equipment',
          objective: 'Apply ergonomic principles to prevent injury during barbering services.',
          durationMinutes: 15,
          videoFile: '/videos/barber-client-experience.mp4',
          content: `<h2>Overview</h2><p>Ergonomics and proper body mechanics are essential for preventing chronic pain, fatigue, and career-ending injuries in barbering. This lesson teaches you to position your body, adjust equipment, and move efficiently during services. Applying these principles reduces strain on your back, neck, shoulders, and wrists while improving service quality and stamina. Understanding neutral postures, weight distribution, and workspace organization will extend your professional longevity. Client considerations such as height, mobility limitations, and service duration require adaptive ergonomic strategies to protect both barber and client throughout each appointment.</p><h2>Tools Required</h2><ul><li>Hydraulic barber chair with adjustable height and recline functions</li><li>Anti-fatigue mat with cushioned support for standing work</li><li>Adjustable work station or tool tray at elbow height</li><li>Ergonomic shears and clippers with balanced weight distribution</li><li>Footstool or step platform for reaching different angles</li><li>Full-length mirror for self-monitoring posture and positioning</li><li>Lumbar support cushion for seated client services</li></ul><h2>Client Variations</h2><p>IF the client is significantly taller or shorter than average, THEN adjust chair height so the working area is between your waist and chest level to avoid excessive bending or reaching. IF the client has limited mobility or cannot hold their head steady, THEN position yourself to support their head with your non-dominant hand while working, and take frequent breaks to reset your own posture and avoid compensatory strain.</p><h2>Procedure</h2><ol><li>Adjust the hydraulic chair height so the client's head aligns between your waist and mid-chest when standing in neutral posture with relaxed shoulders.</li><li>Position anti-fatigue mat beneath your work area and stand with feet shoulder-width apart, distributing weight evenly between both legs throughout service.</li><li>Arrange tools on adjustable tray at elbow height to minimize reaching and twisting; keep frequently used implements within forearm's length.</li><li>Maintain neutral spine alignment by engaging core muscles, keeping shoulders back and down, and avoiding forward head posture during detailed work.</li><li>Pivot your entire body by stepping around the chair rather than twisting at the waist; reposition your feet to face your work.</li><li>Hold tools with relaxed grip pressure, keeping wrists in neutral alignment and elbows close to your body at approximately ninety-degree angles.</li><li>Take micro-breaks every fifteen minutes to roll shoulders, stretch wrists, and reset posture; perform full stretching routine between clients.</li><li>Lower or recline chair for top-of-head work to avoid sustained overhead arm positions that cause shoulder fatigue and impingement.</li></ol><h2>Safety</h2><p>All equipment contact surfaces including chair upholstery, hydraulic controls, and anti-fatigue mats must be cleaned with EPA-registered disinfectant such as Barbicide or hospital-grade quaternary ammonium solution after each client to prevent cross-contamination. <strong>Do NOT lock your knees while standing during services, as this restricts circulation, increases lower back strain, and can cause fainting or venous pooling, leading to varicose veins and chronic leg pain over time.</strong> If you experience acute lower back spasm from improper lifting or sudden twisting, immediately stop work and apply this recovery protocol: first, sit or lie down to remove load from the spine; second, apply ice for fifteen minutes to reduce inflammation; third, perform gentle pelvic tilts and knee-to-chest stretches; fourth, avoid returning to work until pain subsides and normal range of motion returns; fifth, evaluate and correct the movement pattern that caused the injury.</p><h2>Visual Cues</h2><p>Observe your reflection to verify ear-shoulder-hip vertical alignment with natural spinal curves maintained, not flattened or exaggerated. Your elbows should bend at approximately ninety degrees with upper arms hanging naturally at your sides. Wrists remain straight in line with forearms, not flexed upward or downward during cutting motions. Knees stay soft with slight bend, never locked straight. The client's head should appear directly in your line of sight without requiring you to tilt your head forward or crane your neck. Your shoulders remain level and relaxed, not elevated toward your ears or rotated forward in a rounded position.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-19-q1",
                              "question": "What is the optimal height range for the client's head when adjusting the barber chair for ergonomic cutting?",
                              "options": [
                                        "A. Between the barber's waist and mid-chest level",
                                        "B. At the barber's shoulder height",
                                        "C. At the barber's eye level",
                                        "D. Below the barber's waist for easier access"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The client's head should be positioned between the barber's waist and mid-chest level to maintain neutral spine alignment, prevent excessive bending or reaching, and reduce strain on the back and shoulders during services."
                    },
                    {
                              "id": "barber-lesson-19-q2",
                              "question": "How frequently should barbers take micro-breaks to reset posture and prevent repetitive strain injuries?",
                              "options": [
                                        "A. Every thirty minutes",
                                        "B. Every fifteen minutes",
                                        "C. Every five minutes",
                                        "D. Only between clients"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Micro-breaks every fifteen minutes allow barbers to roll shoulders, stretch wrists, and reset posture, preventing the accumulation of muscular tension and reducing the risk of chronic repetitive strain injuries throughout the workday."
                    },
                    {
                              "id": "barber-lesson-19-q3",
                              "question": "What is the correct elbow angle when holding tools with proper ergonomic positioning?",
                              "options": [
                                        "A. Approximately ninety degrees with upper arms at sides",
                                        "B. Fully extended arms away from body",
                                        "C. Forty-five degrees with elbows behind the torso",
                                        "D. One hundred thirty-five degrees with raised shoulders"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Maintaining elbows at approximately ninety degrees with upper arms hanging naturally at the sides keeps the work within the optimal ergonomic zone, minimizing shoulder and arm fatigue while maximizing control and precision."
                    },
                    {
                              "id": "barber-lesson-19-q4",
                              "question": "SCENARIO: A client who is six feet four inches tall sits in your chair for a haircut. What do you do?",
                              "options": [
                                        "A. Leave the chair at standard height and bend forward to reach",
                                        "B. Ask the client to slouch down in the chair",
                                        "C. Raise the hydraulic chair so the client's head is between your waist and chest",
                                        "D. Stand on a footstool throughout the entire service"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Adjusting the chair height for taller clients ensures the working area remains in the ergonomic zone between waist and chest, maintaining neutral posture and preventing back strain from excessive bending or compensatory positions."
                    },
                    {
                              "id": "barber-lesson-19-q5",
                              "question": "SCENARIO: During a service you notice your shoulders are elevated toward your ears and your neck feels tense. Correct response?",
                              "options": [
                                        "A. Continue working and address it after the client leaves",
                                        "B. Stop briefly, roll your shoulders back and down, reset your posture, and adjust chair height if needed",
                                        "C. Shift your weight to one leg to compensate",
                                        "D. Grip your tools more tightly for better control"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Elevated shoulders and neck tension indicate poor ergonomics that will worsen without correction. Taking a micro-break to reset posture, adjust equipment, and restore neutral alignment prevents injury progression and maintains service quality."
                    }
          ],
        },
        {
          slug: 'barber-lesson-20',
          title: 'Draping & Client Preparation',
          order: 6,
          domainKey: 'tools_equipment',
          objective: 'Properly drape a client for haircut and shaving services.',
          durationMinutes: 10,
          videoFile: '/videos/course-barber-consultation.mp4',
          content: `<h2>Overview</h2><p>Proper draping and client preparation are essential foundational skills for every barber. Draping protects the client's clothing from hair clippings, water, and chemical products while maintaining professional sanitation standards. Effective draping techniques ensure client comfort, prevent cross-contamination, and establish trust. This lesson covers the proper selection and application of draping materials for both haircutting and shaving services. Mastering these techniques demonstrates professionalism and prepares you for all subsequent barbering procedures. Understanding client variations and adapting your approach ensures consistent quality across diverse clientele.</p><h2>Tools Required</h2><ul><li>Neck strip (disposable paper or tissue)</li><li>Cape or cloth (chemical-resistant for color services, standard waterproof for cutting)</li><li>Towels (clean, freshly laundered, at least two per client)</li><li>Spray bottle with clean water</li><li>Disinfected chair with adjustable headrest</li><li>Booster seat or cushion for children</li><li>Clips or clamps for securing cape</li></ul><h2>Decision Factors</h2><p>IF the client has extremely long hair extending below shoulders, THEN secure hair outside the cape initially and drape with extra coverage at the back, using two towels if necessary to prevent hair from falling inside clothing. IF the client is a child or has sensitive skin around the neck, THEN use two overlapping neck strips to create a softer barrier and prevent irritation from cape contact. IF performing a shaving service, THEN position towels for steam application and use a separate face draping technique with the cape lowered to shoulder level.</p><h2>Sanitation Protocol</h2><p>All capes must be laundered with hospital-grade detergent and dried at high temperature between each client. Neck strips are single-use disposable items and must never be reused. Towels require washing in hot water with EPA-registered laundry sanitizer such as quaternary ammonium compounds or bleach solution at proper dilution. The barber chair should be wiped down with EPA-registered disinfectant spray or wipes before seating each client, allowing proper contact time per manufacturer instructions.</p><h2>Safety</h2><p><strong>Do NOT secure the cape so tightly around the neck that it restricts breathing or causes discomfort.</strong> Excessive tightness can cause client anxiety, restrict blood flow, trigger claustrophobia, and create liability issues. Always maintain a two-finger clearance between the neck strip and the client's skin. Clients with respiratory conditions or anxiety disorders are particularly vulnerable to complications from overly tight draping.</p><h2>Failure Mode and Recovery</h2><p>If hair clippings fall inside the client's collar despite proper draping, this typically results from inadequate neck strip coverage or cape gaps at the shoulders. To recover: first, stop the service immediately. Second, carefully remove the cape without shaking it. Third, use a neck duster to remove visible hair from the client's neck and collar area. Fourth, offer the client a moment to shake out their shirt in a private area. Fifth, redrape properly with overlapping neck strip coverage. Sixth, apologize professionally and resume service with heightened attention to cape positioning throughout the remainder of the appointment.</p><h2>Visual Cues</h2><p>The neck strip should sit smoothly against the skin with no wrinkles or gaps, positioned approximately one inch above the collar line. The cape should drape evenly across both shoulders at matching heights, with the front closure centered on the client's chest. Observe that the cape falls straight down without twisting, covering all clothing completely to the client's lap. The client's head should remain vertical and comfortable, not tilted forward by cape tension. Check that shoulder seams of the client's clothing remain visible as reference points beneath the cape outline. For shaving services, towels should wrap snugly but comfortably around the neck with corners tucked securely.</p><h2>Procedure</h2><ol><li>Seat the client comfortably in the adjusted barber chair and secure any personal items away from the work area safely.</li><li>Wash and dry your hands thoroughly, then explain the draping process briefly to establish client comfort and trust.</li><li>Place the neck strip around the client's neck, overlapping ends in front, ensuring smooth contact without gaps or wrinkles.</li><li>Unfold the cape completely and drape it over the client from behind, bringing it forward evenly across both shoulders.</li><li>Secure the cape at the front using the closure mechanism, adjusting tension to allow two-finger clearance at the neckline.</li><li>Smooth the cape across the shoulders and lap, tucking edges inward to prevent hair from falling onto client's clothing.</li><li>Perform a final comfort check by asking the client if the draping feels secure but not restrictive or uncomfortable.</li><li>Position towels as needed for the specific service, either folded on the shoulder or prepared for shaving application.</li></ol>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-20-q1",
                              "question": "What is the primary purpose of using a disposable neck strip during draping?",
                              "options": [
                                        "A. To create a sanitary barrier between the client's skin and reusable cape",
                                        "B. To absorb excess water during shampooing procedures",
                                        "C. To provide additional warmth for client comfort",
                                        "D. To protect the barber chair from hair clippings"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The neck strip creates a sanitary single-use barrier between the client's skin and the cape, which is reused between clients. This prevents cross-contamination and maintains proper infection control standards."
                    },
                    {
                              "id": "barber-lesson-20-q2",
                              "question": "How much clearance should exist between the secured cape and the client's neck?",
                              "options": [
                                        "A. The cape should fit as tightly as possible to prevent hair entry",
                                        "B. Approximately two fingers should fit between the neck strip and skin",
                                        "C. At least four inches of space for unrestricted movement",
                                        "D. The cape should not contact the neck at all"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Two-finger clearance ensures the cape is secure enough to prevent hair from entering while avoiding excessive tightness that could restrict breathing, cause discomfort, or trigger anxiety in clients."
                    },
                    {
                              "id": "barber-lesson-20-q3",
                              "question": "What is the correct sanitation method for capes between clients?",
                              "options": [
                                        "A. Laundering with hospital-grade detergent at high temperature",
                                        "B. Wiping down with a dry towel to remove visible hair",
                                        "C. Spraying with air freshener and hanging to air out",
                                        "D. Shaking vigorously outdoors to remove clippings"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Capes must be laundered with hospital-grade detergent and dried at high temperature between each client to ensure proper disinfection and meet professional sanitation standards required by barber regulations."
                    },
                    {
                              "id": "barber-lesson-20-q4",
                              "question": "SCENARIO: A client with hair extending to the mid-back arrives for a haircut. What is your draping approach?",
                              "options": [
                                        "A. Use standard draping and tuck all hair inside the cape immediately",
                                        "B. Refuse service until the client pins up their hair themselves",
                                        "C. Secure hair outside the cape initially and use extra back coverage with additional towels",
                                        "D. Cut the cape shorter to accommodate the long hair length"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Long hair requires modified draping technique with hair initially secured outside the cape and extra coverage at the back using additional towels. This prevents hair from falling inside clothing while maintaining proper protection."
                    },
                    {
                              "id": "barber-lesson-20-q5",
                              "question": "SCENARIO: Midway through a haircut you notice hair clippings have fallen inside the client's collar. What is the correct response?",
                              "options": [
                                        "A. Continue the service and address the issue after completing the haircut",
                                        "B. Stop immediately, remove the cape carefully, use neck duster, allow client to shake out shirt, then redrape properly",
                                        "C. Brush the hair deeper into the shirt so it falls out when they undress later",
                                        "D. Apologize but explain that some hair entry is normal and unavoidable"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When hair enters the client's clothing, immediately stop service, carefully remove the cape without shaking, use a neck duster, offer the client privacy to shake out their shirt, then redrape properly with corrected technique. This demonstrates professionalism and prevents further contamination."
                    }
          ],
        },
        {
          slug: 'barber-module-3-checkpoint',
          title: 'Tools & Equipment Checkpoint',
          order: 7,
          domainKey: 'tools_equipment',
          objective: 'Demonstrate mastery of barbering tools and equipment.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Introduction to Tools & Equipment Checkpoint</h2><p>In this lesson, we will review the essential tools and equipment required for barbering services. As a barber, it is crucial to demonstrate mastery of these tools to provide safe and effective services to clients.</p><h3>Required Tools and Equipment</h3><ul><li>Clippers</li><li>Scissors</li><li>Razors</li><li>Combs</li><li>Brushes</li><li>Sanitizing solutions</li><li>Disinfectant sprays</li></ul><h3>Sanitation and Disinfection</h3><p>Sanitation and disinfection are critical components of barbering services. All tools and equipment must be sanitized and disinfected after each use to prevent the spread of infections. The following steps must be taken:</p><ol><li>Wash hands with soap and water</li><li>Sanitize tools and equipment with a sanitizing solution</li><li>Disinfect tools and equipment with a disinfectant spray</li></ol><h3>Client Variations and Tool Selection</h3><p>When working with clients, it is essential to consider their hair type, skin condition, and personal preferences. The following decision block can be used to determine the best tools and equipment for each client:</p><p>IF the client has curly hair, THEN use a wide-tooth comb or a detangling brush to minimize breakage and tangles.</p><p>IF the client has sensitive skin, THEN use a razor with a protective guard to prevent nicks and cuts.</p><p>IF the client has a skin condition such as eczema or psoriasis, THEN avoid using harsh chemicals or abrasive tools that may exacerbate the condition.</p><h3>Contraindications and Safety Rules</h3><p>There are several contraindications and safety rules to consider when using barbering tools and equipment. The following are some examples:</p><ul><li>Do NOT use clippers or razors near open wounds or sensitive areas.</li><li>Do NOT use harsh chemicals or abrasive tools on clients with sensitive skin or skin conditions.</li><li>Do NOT share tools or equipment between clients to prevent the spread of infections.</li></ul><h3>Failure Modes and Recovery</h3><p>Failure modes can occur when using barbering tools and equipment. The following is an example of a failure mode and how to recover:</p><p>Failure mode: Using dull clippers can result in uneven cutting and damage to the client's hair.</p><p>Why: Dull clippers can cause the hair to split or break, leading to uneven cutting and damage.</p><p>Recovery: To recover from this failure mode, replace the dull clippers with sharp ones and re-cut the client's hair using the correct technique.</p><h3>Correct Execution</h3><p>Correct execution of barbering tools and equipment can be observed visually. The following are some examples:</p><ul><li>Clippers should be held at a 45-degree angle to the client's head, with the blade facing the direction of hair growth.</li><li>Scissors should be held with the blades facing the direction of hair growth, and the handles should be held firmly but not too tightly.</li><li>Razors should be held at a 20-degree angle to the client's skin, with the blade facing the direction of hair growth.</li></ul>`,
          quizQuestions: [
                    {
                              "id": "barber-module-3-checkpoint-q1",
                              "question": "A client presents with curly hair and sensitive skin. What tools and equipment would you use to minimize breakage and tangles, and prevent nicks and cuts?",
                              "options": [
                                        "A) Wide-tooth comb and razor with protective guard",
                                        "B) Fine-tooth comb and clippers",
                                        "C) Detangling brush and scissors",
                                        "D) Regular comb and straight razor"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The correct answer is A) Wide-tooth comb and razor with protective guard. The wide-tooth comb will help to minimize breakage and tangles, while the razor with protective guard will help to prevent nicks and cuts on the client's sensitive skin."
                    },
                    {
                              "id": "barber-module-3-checkpoint-q2",
                              "question": "What is the correct angle to hold clippers when cutting a client's hair?",
                              "options": [
                                        "A) 20 degrees",
                                        "B) 45 degrees",
                                        "C) 60 degrees",
                                        "D) 90 degrees"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct answer is B) 45 degrees. Holding clippers at a 45-degree angle to the client's head, with the blade facing the direction of hair growth, will help to achieve an even cut and prevent damage to the hair."
                    },
                    {
                              "id": "barber-module-3-checkpoint-q3",
                              "question": "A client has a skin condition such as eczema or psoriasis. What should you avoid using on this client?",
                              "options": [
                                        "A) Harsh chemicals or abrasive tools",
                                        "B) Sanitizing solutions or disinfectant sprays",
                                        "C) Clippers or razors",
                                        "D) Combs or brushes"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The correct answer is A) Harsh chemicals or abrasive tools. These can exacerbate the client's skin condition and cause further irritation or damage."
                    },
                    {
                              "id": "barber-module-3-checkpoint-q4",
                              "question": "What is the consequence of using dull clippers on a client's hair?",
                              "options": [
                                        "A) Even cutting and no damage",
                                        "B) Uneven cutting and damage to the hair",
                                        "C) Increased risk of infection",
                                        "D) Improved sanitation and disinfection"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct answer is B) Uneven cutting and damage to the hair. Using dull clippers can cause the hair to split or break, leading to uneven cutting and damage."
                    },
                    {
                              "id": "barber-module-3-checkpoint-q5",
                              "question": "A client presents with a open wound on their scalp. What should you do?",
                              "options": [
                                        "A) Use clippers or razors to cut the client's hair",
                                        "B) Use scissors to trim the client's hair",
                                        "C) Reschedule the appointment for a later date",
                                        "D) Use a sanitizing solution or disinfectant spray on the wound"
                              ],
                              "correctAnswer": 2,
                              "explanation": "The correct answer is C) Reschedule the appointment for a later date. Using clippers or razors near an open wound can cause further injury or infection, and it is best to reschedule the appointment for a later date when the wound has healed."
                    }
          ],
        },
      ],
    }

;
