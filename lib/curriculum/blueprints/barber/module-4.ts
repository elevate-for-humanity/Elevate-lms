import type { BlueprintModule } from '../types';

export const barberModule4: BlueprintModule = 
    {
      slug: 'barber-module-4',
      title: 'Module 4: Haircutting Techniques',
      orderIndex: 4,
      minLessons: 8,
      maxLessons: 10,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'haircutting',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 5 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'fade_technique', isCritical: true, minimumTouchpoints: 3 },
        { competencyKey: 'clipper_over_comb', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'scissor_over_comb', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'lineup_edging', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'head_shape_analysis', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-22',
          title: 'Head Shape & Sectioning',
          order: 1,
          domainKey: 'haircutting',
          objective: 'Identify the sections of the head and use them to guide haircut structure.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-fade-narrated.mp4',
          content: `<h2>Overview</h2><p>Understanding head shape and sectioning is fundamental to executing precise, balanced haircuts. The human head contains reference points and sections that guide clipper and shear work, ensuring consistency and symmetry. Mastering these anatomical landmarks allows barbers to adapt techniques to individual head shapes, create reliable partings, and maintain control throughout the service. This lesson covers the four primary head sections, key reference points including apex, occipital bone, parietal ridge, and four corners, plus practical application methods for mapping the head before cutting.</p><h2>Tools Required</h2><ul><li>Tail comb for precise parting and sectioning</li><li>Sectioning clips to secure hair divisions</li><li>Spray bottle with clean water for dampening</li><li>Barber shears for cutting sectioned hair</li><li>Neck strip and cape for client draping</li><li>Mirror for visual verification of sections</li><li>Marking pencil or highlighter for training purposes</li></ul><h2>Client Variation Guidance</h2><p>IF the client has a flat occipital bone, THEN adjust your horizontal sections lower to avoid removing excess weight at the nape, which can create an unbalanced silhouette. IF the client has a prominent parietal ridge or uneven head shape, THEN modify section placement by following the natural contours rather than forcing geometric divisions, ensuring the finished cut appears balanced when viewed from all angles despite anatomical variations.</p><h2>Procedure</h2><ol><li>Drape the client properly with neck strip and cape, then comb hair to remove tangles and identify natural growth patterns.</li><li>Locate the apex by intersecting lines from recession areas to crown; identify occipital bone by feeling the protruding bump at nape.</li><li>Find the parietal ridge by placing comb flat against head and tilting until it naturally falls away from the curve.</li><li>Section the top area from front hairline to crown, connecting ear-to-ear across the parietal ridge with tail comb.</li><li>Divide sides by parting from top of ear to previously established top section, creating distinct temporal sections on each side.</li><li>Create back section below the occipital bone, completing the four-quadrant division required for systematic cutting.</li><li>Secure each section with clips, maintaining tension to keep divisions clean and prevent hair from crossing into adjacent sections.</li><li>Verify symmetry by comparing section widths on both sides using mirror and checking that partings align with anatomical landmarks.</li></ol><h2>Safety</h2><p>All combs and sectioning clips must be cleaned with EPA-registered hospital-grade disinfectant such as Barbicide after each client, following manufacturer contact time of ten minutes minimum. <strong>Do NOT section over open wounds, active scalp infections, or inflamed areas, as this can spread pathogens to unaffected areas and cause cross-contamination throughout the service.</strong> If sections fall during cutting and hair mixes between quadrants, stop immediately; re-wet the hair, recomb to identify original growth direction, re-establish sections using original reference points, verify placement bilaterally, then resume cutting from the last completed guideline.</p><h2>Visual Cues</h2><p>Proper sections create visible clean lines along the scalp where hair divides; partings should appear straight and precise when viewed perpendicular to the section. The parietal ridge section curves naturally around the head roughly one finger-width above the ear tops, while the apex sits at the highest point where head begins to round downward. Four corners form distinct right angles at the intersection of top and side sections. When clips are placed, they should sit flat without pulling hair, indicating sections follow the head's natural curvature rather than forcing unnatural geometric angles.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-22-q1",
                              "question": "What is the primary purpose of identifying the parietal ridge during head sectioning?",
                              "options": [
                                        "A. It marks the natural division between the top and side sections of the head",
                                        "B. It indicates where the hairline naturally recedes",
                                        "C. It shows the location of the crown whorl",
                                        "D. It determines the client's natural part location"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The parietal ridge is the curved bone structure that naturally separates the top of the head from the sides, making it the ideal anatomical landmark for dividing these two sections during systematic haircutting."
                    },
                    {
                              "id": "barber-lesson-22-q2",
                              "question": "How many primary sections are created in the standard four-quadrant head sectioning method?",
                              "options": [
                                        "A. Three sections: top, left side, and right side",
                                        "B. Four sections: top, two sides, and back",
                                        "C. Five sections including the nape area",
                                        "D. Six sections to include fringe area"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The standard four-quadrant method divides the head into top, left side, right side, and back sections, providing systematic organization for controlled, balanced haircutting."
                    },
                    {
                              "id": "barber-lesson-22-q3",
                              "question": "Where is the apex located on the head?",
                              "options": [
                                        "A. At the highest point where lines from the recession areas and crown intersect",
                                        "B. At the center of the occipital bone",
                                        "C. Directly at the parietal ridge midpoint",
                                        "D. At the front hairline center"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The apex is found by intersecting imaginary lines from the recession areas to the crown, marking the highest central point of the head and serving as a key reference for top sectioning."
                    },
                    {
                              "id": "barber-lesson-22-q4",
                              "question": "SCENARIO: A client has a noticeably flat occipital bone. What adjustment should you make?",
                              "options": [
                                        "A. Create wider sections throughout all quadrants",
                                        "B. Use vertical rather than horizontal sections exclusively",
                                        "C. Position horizontal sections lower at the nape to preserve weight and balance",
                                        "D. Avoid sectioning the back area entirely"
                              ],
                              "correctAnswer": 2,
                              "explanation": "With a flat occipital bone, lowering the horizontal sections at the nape helps retain weight in an area that lacks natural projection, preventing an overly flat or unbalanced appearance in the finished cut."
                    },
                    {
                              "id": "barber-lesson-22-q5",
                              "question": "SCENARIO: During cutting you notice hair from the side section has fallen into the back section. What is the correct response?",
                              "options": [
                                        "A. Continue cutting and blend the areas together at the end",
                                        "B. Stop cutting, re-wet and recomb hair, re-establish sections at original reference points, then resume from last guideline",
                                        "C. Remove all clips and start the entire sectioning process over",
                                        "D. Cut the mixed hair shorter to match the surrounding area"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When sections mix, stopping immediately prevents compounding errors. Re-wetting, recombing to original growth patterns, and re-establishing sections using anatomical landmarks restores control, allowing you to resume from your last accurate guideline."
                    }
          ],
          competencyChecks: [
            'Identifies all head sections and reference points correctly',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
          ],
        },
        {
          slug: 'barber-lesson-23',
          title: 'The Fade — Low, Mid & High',
          order: 2,
          domainKey: 'haircutting',
          objective: 'Execute low, mid, and high fade techniques with smooth transitions.',
          durationMinutes: 30,
          videoFile: '/videos/course-barber-fade-narrated.mp4',
          content: `<h2>Overview</h2><p>The fade is a foundational barbering technique that creates a seamless gradient from longer hair on top to progressively shorter hair toward the neckline and sides. Low fades begin the blend just above the ears, mid fades start around the temple area, and high fades commence near the top of the head. Mastering these variations requires understanding clipper guard selection, lever positioning, and controlled hand movements. Each fade type serves different aesthetic goals and client preferences. This lesson covers the technical execution required to deliver clean, professional fades that meet industry standards and client expectations in a DOL-registered apprenticeship setting.</p><h2>Tools Required</h2><ul><li>Professional-grade clipper with taper lever (adjustable blade)</li><li>Detachable blade clipper or trimmer for detailing</li><li>Clipper guards: #0.5, #1, #1.5, #2, #3 (minimum set)</li><li>Barber comb (carbon fiber or hard rubber)</li><li>Neck duster brush</li><li>Handheld mirror for client consultation</li><li>Spray bottle with clean water</li><li>Disinfected cape and neck strips</li></ul><h2>Client Variations</h2><p>IF the client has coarse, curly hair, THEN use a slightly open lever on initial passes and work more gradually through guard sizes to prevent harsh lines, as curly texture can reveal abrupt transitions more noticeably. IF the client has fine, straight hair, THEN execute tighter passes with closed lever positions because fine hair shows imperfections and requires more precision blending to achieve smooth gradients without visible demarcation lines or patches.</p><h2>Procedure</h2><ol><li>Consult with client to determine fade height preference (low, mid, or high) and establish the guideline using a mirror for visual agreement.</li><li>Begin with a longer guard (#3 or #2) at the top fade line, using upward clipper motion with lever closed to establish initial length.</li><li>Switch to the next shorter guard, overlapping the previous pass by half, using a scooping outward motion to begin the blend transition.</li><li>Continue with progressively shorter guards, opening and closing the taper lever between passes to create intermediate lengths and eliminate visible lines.</li><li>Use the lever-only technique in the transition zone, making short upward flicking motions to refine the gradient without changing guards.</li><li>Blend the lowest section with a #1 or #0.5 guard closed, ensuring smooth connection to the bare fade line or natural hairline.</li><li>Detail edges with a trimmer, creating clean perimeter lines at the sideburns, around the ears, and along the neckline contour.</li><li>Cross-check the fade by viewing from multiple angles under proper lighting, making corrections with clipper-over-comb or lever adjustments as needed.</li></ol><h2>Safety</h2><p>Always clean clipper blades with Clipper-Cide or hospital-grade disinfectant spray between clients, allowing proper contact time per manufacturer instructions. Remove hair buildup and apply blade oil to maintain cutting efficiency and prevent bacterial transmission. <strong>Do NOT execute fades on clients with active scalp infections, open lesions, or inflamed skin conditions, as clipper contact will spread pathogens, cause client discomfort, and violate sanitation protocols, potentially resulting in cross-contamination and infection.</strong> Inspect the scalp thoroughly during consultation before beginning any cutting service.</p><h2>Visual Cues</h2><p>Position your body at a 45-degree angle to the client's head with clippers held at a consistent angle perpendicular to the scalp surface. Watch for the hair to lift and fall naturally as you scoop outward—this indicates proper lever tension and guard glide. The fade should appear as a smooth color gradient with no shelves or demarcation lines visible when viewed from three feet away. Proper blending creates a shadow effect where you cannot identify exactly where one length ends and another begins. The taper lever halfway open creates an intermediate length between guard sizes, essential for seamless transitions in the blend zone.</p><h2>Failure Recovery</h2><p>IF you create a visible line or shelf in the fade: This occurs when guard changes are too abrupt or lever technique is inconsistent. To recover, identify the demarcation line's exact position. Use the guard size that created the line with lever fully open, making gentle upward passes that extend slightly above the problem area. Next, use clipper-over-comb technique to manually blend the transition, holding the comb at a low angle and skimming with clipper teeth lightly across the comb. Finally, use the next shorter guard with lever halfway open to soften the lower boundary, working in small sections until the gradient appears continuous.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-23-q1",
                              "question": "What is the primary difference between low, mid, and high fade placement?",
                              "options": [
                                        "A. The starting point where the fade transition begins on the head",
                                        "B. The clipper guard sizes used for each fade type",
                                        "C. The angle at which the clippers are held during execution",
                                        "D. The amount of time required to complete each fade variation"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Low, mid, and high fades are distinguished by where the fade transition begins: low fades start just above the ears, mid fades begin around the temple, and high fades commence near the top of the head."
                    },
                    {
                              "id": "barber-lesson-23-q2",
                              "question": "What technique is most effective for eliminating visible lines between guard lengths?",
                              "options": [
                                        "A. Using only closed lever positions throughout the entire fade",
                                        "B. Opening and closing the taper lever to create intermediate lengths between guard changes",
                                        "C. Applying more pressure with the clippers during upward strokes",
                                        "D. Switching to a different clipper brand for the transition area"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The taper lever creates intermediate lengths between guard sizes, which is essential for smooth blending and eliminating visible demarcation lines in fade transitions."
                    },
                    {
                              "id": "barber-lesson-23-q3",
                              "question": "When should Clipper-Cide or hospital-grade disinfectant be applied to clipper blades?",
                              "options": [
                                        "A. Between every client after cleaning and before the next service",
                                        "B. Only at the end of the business day",
                                        "C. Once per week during deep cleaning procedures",
                                        "D. Only when visible hair buildup appears on the blades"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Proper sanitation protocol requires disinfecting clipper blades between each client to prevent cross-contamination and bacterial transmission, regardless of visible debris."
                    },
                    {
                              "id": "barber-lesson-23-q4",
                              "question": "SCENARIO: A client with very coarse, tightly curled hair requests a mid fade. During your first pass with a #2 guard, you notice the line is more pronounced than expected. What do you do?",
                              "options": [
                                        "A. Continue with the #1 guard as planned to stay on schedule",
                                        "B. Apply more pressure with the clippers to cut through the coarse texture",
                                        "C. Switch to a more gradual approach using lever adjustments and intermediate guard sizes",
                                        "D. Recommend the client get a different haircut style instead"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Coarse, curly hair reveals transitions more noticeably and requires more gradual blending with intermediate lengths using lever adjustments and closer guard progressions to prevent harsh lines."
                    },
                    {
                              "id": "barber-lesson-23-q5",
                              "question": "SCENARIO: During the fade you notice redness and several small raised bumps with whiteheads near the client's neckline. Correct response?",
                              "options": [
                                        "A. Apply alcohol to disinfect the area and continue carefully",
                                        "B. Stop the service immediately, explain you cannot continue due to the skin condition, and recommend medical consultation",
                                        "C. Avoid that specific area but complete the fade on the rest of the head",
                                        "D. Use a trimmer instead of clippers to finish the neckline area"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Active skin infections or inflammatory conditions are contraindications for barbering services. Continuing would spread infection, violate sanitation protocols, and potentially harm the client. The service must be stopped and medical evaluation recommended."
                    }
          ],
          competencyChecks: [
            'Executes low, mid, and high fade with smooth transitions',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Uses clipper disinfectant spray with correct dwell time on blades',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
          ],
        },
        {
          slug: 'barber-lesson-24',
          title: 'Clipper Over Comb',
          order: 3,
          domainKey: 'haircutting',
          objective: 'Use the clipper-over-comb technique to cut and blend hair.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-clipper-techniques.mp4',
          content: `<h2>Overview</h2><p>The clipper-over-comb technique is a fundamental barbering skill that allows precise control when cutting, tapering, and blending hair. This method combines the use of clippers with a comb to remove length gradually and create seamless transitions between different hair lengths. Mastering this technique is essential for creating professional tapers, fades, and blended haircuts. The barber uses the comb as a guide to lift hair away from the scalp while the clipper cuts over the comb teeth, providing exceptional control over graduation and texture.</p><h2>Tools Required</h2><ul><li>Professional adjustable blade clipper with lever</li><li>Barber comb (7-inch or 8-inch styling comb with fine and wide teeth)</li><li>Clipper oil and cleaning brush</li><li>Neck strip and cape for client protection</li><li>Spray bottle with clean water for dampening</li><li>Mirror for client consultation and verification</li><li>Disinfected shears for detailing</li></ul><h2>Client Considerations</h2><p>IF the client has thick, coarse hair, THEN use wider comb teeth and make multiple passes with the clipper to avoid pulling or snagging. IF the client has fine or thinning hair, THEN use finer comb teeth and exercise lighter pressure to prevent removing too much length too quickly. IF working near sensitive areas or scar tissue, THEN reduce clipper speed and use gentler strokes to minimize discomfort.</p><h2>Procedure</h2><ol><li>Drape the client properly with neck strip and cape, then consult on desired length, style, and ensure hair is clean and slightly damp.</li><li>Section the hair appropriately, beginning at the lower occipital area where the taper or blend will start for the style.</li><li>Insert the comb at the desired angle, typically 45 to 90 degrees from the scalp, with teeth pointing outward to guide the cut.</li><li>Position clippers so the blade runs parallel to the comb, moving upward in smooth, continuous strokes without hesitation or stopping midway.</li><li>Gradually adjust the angle of the comb outward as you move up the head to create seamless tapering and natural graduation.</li><li>Blend any visible lines by adjusting the clipper lever position and repeating strokes with varying comb angles until transitions are smooth.</li><li>Cross-check your work by combing hair in multiple directions, checking for balance, symmetry, and even graduation throughout all sections.</li><li>Finish by detailing edges, removing loose hair with a neck duster, and showing client the final result using a mirror.</li></ol><h2>Safety</h2><p>All tools must be cleaned and disinfected according to Indiana State Board regulations using EPA-registered hospital-grade disinfectant such as Barbicide or approved quaternary ammonium compounds. Clippers should be sanitized between clients with clipper spray disinfectant and blades should be removed weekly for thorough cleaning. <strong>Do NOT use clipper-over-comb on irritated, abraded, or infected skin as this can spread infection, cause additional trauma, and violate sanitation protocols.</strong> Always inspect the scalp before beginning any service.</p><h2>Failure Mode and Recovery</h2><p>If you create a visible line or step in the hair, this typically occurs from holding the comb at an inconsistent angle or stopping the clipper motion prematurely. To recover: first, identify the exact location of the line by combing the hair smooth. Second, position your comb just below the line at a slightly more outward angle. Third, make several light passes with the clipper over the comb, gradually working upward through the problem area. Fourth, blend above and below the corrected area to ensure seamless integration. Fifth, cross-check from multiple angles to verify the line has been eliminated.</p><h2>Visual Cues</h2><p>Watch for the hair standing perpendicular to the comb teeth, indicating proper tension and positioning for clean cutting. The clipper blade should remain parallel to the comb spine throughout each stroke, never tilting or angling away. Observe the hair falling evenly from the clipper, which indicates consistent speed and pressure. Check that your wrist remains flexible, allowing smooth arcing motions that follow the head shape. The finished blend should show no visible demarcation lines when hair is combed in any direction. Proper head positioning places the area being cut at your chest level with adequate lighting to see every detail clearly.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-24-q1",
                              "question": "What is the primary purpose of the comb in the clipper-over-comb technique?",
                              "options": [
                                        "A. To guide the clippers and control the amount of hair being removed",
                                        "B. To hold the hair flat against the scalp during cutting",
                                        "C. To detangle the hair before using clippers",
                                        "D. To measure exact length in inches"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The comb acts as a guide that lifts hair away from the scalp, allowing the barber to control precisely how much hair is removed as the clipper cuts over the comb teeth."
                    },
                    {
                              "id": "barber-lesson-24-q2",
                              "question": "At what angle should the clipper blade be held in relation to the comb during execution?",
                              "options": [
                                        "A. Perpendicular to the comb at 90 degrees",
                                        "B. Parallel to the comb spine",
                                        "C. At a 45-degree angle pointing downward",
                                        "D. At varying angles depending on hair texture"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The clipper blade must remain parallel to the comb spine throughout the stroke to ensure even cutting and proper technique execution."
                    },
                    {
                              "id": "barber-lesson-24-q3",
                              "question": "Which disinfection method is specifically mentioned as appropriate for clipper sanitation between clients?",
                              "options": [
                                        "A. Clipper spray disinfectant and EPA-registered hospital-grade disinfectant",
                                        "B. Soap and warm water only",
                                        "C. Alcohol wipes exclusively",
                                        "D. UV light sanitizer"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The lesson specifies using clipper spray disinfectant between clients and EPA-registered hospital-grade disinfectants like Barbicide or quaternary ammonium compounds according to Indiana regulations."
                    },
                    {
                              "id": "barber-lesson-24-q4",
                              "question": "SCENARIO: A client with very thick, coarse hair sits in your chair requesting a tapered fade. What adjustment should you make?",
                              "options": [
                                        "A. Use only the finest teeth on the comb for maximum precision",
                                        "B. Increase clipper speed and use single fast strokes",
                                        "C. Use wider comb teeth and make multiple passes to avoid pulling",
                                        "D. Skip the comb and use clipper guards only"
                              ],
                              "correctAnswer": 2,
                              "explanation": "According to the client considerations section, thick coarse hair requires wider comb teeth and multiple passes to prevent pulling or snagging the hair during the cutting process."
                    },
                    {
                              "id": "barber-lesson-24-q5",
                              "question": "SCENARIO: Halfway through the service you notice a visible line in the blend at the occipital area. What is the correct recovery method?",
                              "options": [
                                        "A. Continue cutting and hope it blends naturally when styled",
                                        "B. Position the comb below the line at a more outward angle and make light passes to blend",
                                        "C. Start over completely from the beginning of the haircut",
                                        "D. Use shears to cut the entire section shorter"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The failure mode section specifies positioning the comb just below the line at a slightly more outward angle, then making several light passes with the clipper to gradually eliminate the line and blend the area."
                    }
          ],
          competencyChecks: [
            'Executes clipper-over-comb with consistent angle and smooth motion',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Uses clipper disinfectant spray with correct dwell time on blades',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
          ],
        },
        {
          slug: 'barber-lesson-25',
          title: 'Scissor Over Comb',
          order: 4,
          domainKey: 'haircutting',
          objective: 'Use scissor-over-comb to cut and blend the top and sides.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-scissors.mp4',
          content: `<h2>Overview</h2><p>Scissor-over-comb is a fundamental barbering technique used to create smooth, blended cuts on short to medium-length hair. This method involves using the comb to lift and control hair while scissors cut the hair that extends beyond the comb. The technique requires coordination between both hands and provides precision control for tapering, blending, and creating graduated lengths. Mastering scissor-over-comb allows barbers to achieve seamless transitions between different hair lengths, particularly effective on the sides, back, and top of the head. This technique is essential for classic men's cuts and provides an alternative to clipper work for clients who prefer scissor-only services.</p><h2>Tools Required</h2><ul><li>Professional barber shears (6.5 to 7 inches recommended)</li><li>Barber comb (fine-tooth cutting comb, 7 to 8 inches)</li><li>Neck strip and cape for client protection</li><li>Spray bottle with clean water for dampening</li><li>Cleaning brush for removing cut hair from tools</li><li>EPA-registered disinfectant for tool sanitation</li><li>Sectioning clips for hair management</li></ul><h2>Client Considerations</h2><p>IF the client has thick, coarse hair, THEN use wider comb teeth and work in smaller sections to maintain control and prevent the comb from catching or pulling. IF the client has fine, thin hair, THEN use closer comb teeth, apply lighter pressure, and keep hair slightly damp to prevent flyaways and ensure precision cutting. IF the client has sensitive skin or previous irritation, THEN maintain the comb flat against the scalp without applying excessive pressure and avoid repeated passes over the same area.</p><h2>Sanitation Protocol</h2><p>Before beginning any service, ensure all tools are properly sanitized using an EPA-registered hospital-grade disinfectant such as Barbicide or a quaternary ammonium compound solution. Immerse combs and shears in disinfectant solution for the manufacturer's recommended contact time, typically ten minutes. Between clients, remove all visible hair debris with a cleaning brush and re-sanitize all implements. This protocol prevents cross-contamination and ensures compliance with state board regulations and professional standards.</p><h2>Safety</h2><p><strong>Do NOT use scissor-over-comb technique on wet, slippery hair when working near the ears or hairline, as this significantly increases the risk of accidentally cutting the skin.</strong> Excessive moisture reduces tactile feedback and can cause the comb to slip unexpectedly, leading to painful cuts or nicks that require immediate first aid and potentially disrupt the client relationship. Always maintain appropriate dampness—hair should be barely moist, not saturated.</p><h2>Failure Recovery</h2><p>If you create an uneven line or remove too much length in one area, immediately assess the depth and location of the error. First, stop cutting and evaluate the surrounding hair to determine how much additional length must be removed to correct the mistake. Second, blend the area by using the scissor-over-comb technique at a slightly lower angle to gradually taper into the mistake. Third, work outward from the problem area in small increments, constantly cross-checking symmetry on both sides. Fourth, dampen the hair and comb through repeatedly to identify any remaining unevenness before making final corrections.</p><h2>Visual Cues</h2><p>Position yourself at eye level with the section you are cutting, maintaining a working angle between 45 and 90 degrees depending on the desired graduation. The comb should glide smoothly through the hair with consistent tension, neither too tight nor too loose. Watch for the hair extending beyond the comb teeth—this extension should be uniform before each cut. Your shear blades should remain parallel to the comb, moving in a fluid scooping motion. The cut hair should fall cleanly without pulling or bending. Check for even graduation by observing the hair's natural fall pattern and ensuring smooth transitions without visible lines or steps between sections.</p><h2>Procedure</h2><ol><li>Section the hair appropriately and dampen with water spray to achieve workable moisture without saturation, ensuring even texture throughout all areas.</li><li>Begin at the lower hairline, inserting the comb at the desired starting point with teeth angled slightly upward toward the head.</li><li>Draw the comb upward smoothly through the hair, maintaining consistent tension and allowing hair to extend beyond the comb teeth uniformly.</li><li>Position scissors parallel to the comb, blades slightly open, and cut the hair protruding beyond the comb using smooth, controlled strokes.</li><li>Move the comb incrementally upward, overlapping the previous section by one-quarter inch to ensure seamless blending and prevent demarcation lines.</li><li>Repeat the combing and cutting motion, gradually adjusting the comb angle to create the desired taper and graduation through the section.</li><li>Cross-check your work by combing hair in the opposite direction, looking for uneven lengths, and making corrective cuts as necessary.</li><li>Blend transition areas between sections using diagonal comb angles, ensuring smooth integration without visible lines separating different lengths throughout the cut.</li></ol>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-25-q1",
                              "question": "What is the primary purpose of the comb in scissor-over-comb technique?",
                              "options": [
                                        "A. To lift and control hair while providing a cutting guide for the scissors",
                                        "B. To detangle hair and remove knots before cutting begins",
                                        "C. To measure exact lengths in inches for precision cutting",
                                        "D. To apply tension to the scalp for easier cutting"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The comb serves as both a lifting mechanism and a cutting guide, allowing the barber to control the hair while the scissors cut only the hair extending beyond the comb teeth."
                    },
                    {
                              "id": "barber-lesson-25-q2",
                              "question": "What angle range should shear blades maintain relative to the comb during scissor-over-comb cutting?",
                              "options": [
                                        "A. Perpendicular at 90 degrees to create texture",
                                        "B. Parallel to the comb for smooth, even cutting",
                                        "C. At 45 degrees downward to increase speed",
                                        "D. At varying random angles for natural appearance"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The shear blades must remain parallel to the comb to ensure even, controlled cutting and to prevent accidentally cutting into the comb or creating uneven results."
                    },
                    {
                              "id": "barber-lesson-25-q3",
                              "question": "How much should each successive comb pass overlap the previous section?",
                              "options": [
                                        "A. One-quarter inch to ensure seamless blending",
                                        "B. One full inch for faster work completion",
                                        "C. No overlap is necessary with this technique",
                                        "D. One-half inch only on thick hair types"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Overlapping by one-quarter inch ensures proper blending between sections and prevents visible demarcation lines or steps in the finished haircut."
                    },
                    {
                              "id": "barber-lesson-25-q4",
                              "question": "SCENARIO: A client with very thick, coarse hair keeps experiencing the comb catching and pulling during scissor-over-comb work. What is the correct adjustment?",
                              "options": [
                                        "A. Add more water to make the hair completely saturated",
                                        "B. Switch to a finer-tooth comb for better control",
                                        "C. Use wider comb teeth and work in smaller sections",
                                        "D. Increase cutting speed to minimize discomfort"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Thick, coarse hair requires wider comb teeth to prevent catching, and smaller sections provide better control and reduce pulling, making the service more comfortable and precise."
                    },
                    {
                              "id": "barber-lesson-25-q5",
                              "question": "SCENARIO: During the service you notice you have created a visible horizontal line across the side of the head. What is the correct response?",
                              "options": [
                                        "A. Continue cutting and address it at the end with clippers",
                                        "B. Stop immediately, blend the area by adjusting comb angle and working outward in small increments",
                                        "C. Wet the hair heavily to hide the line temporarily",
                                        "D. Cut all surrounding hair to match the shortest length"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Immediately stopping and using adjusted comb angles to blend outward from the problem area allows for correction without removing excessive length, following the proper failure recovery protocol."
                    }
          ],
          competencyChecks: [
            'Executes scissor-over-comb with consistent angle and soft finish',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
            'Disinfects shears and combs with EPA-registered disinfectant before service',
          ],
        },
        {
          slug: 'barber-lesson-26',
          title: 'Lineup & Edging',
          order: 5,
          domainKey: 'haircutting',
          objective:
            'Create clean, sharp lines at the hairline, temples, around the ears, sideburns, and nape while preserving the natural hairline, protecting the skin, maintaining sanitation, and choosing shapes that suit the client and grow out cleanly.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-lineup-narrated.mp4',
          content: `<h2>Lesson 26: Lineup &amp; Edging</h2>

<h3>Why this skill matters</h3>
<p>A lineup is a <strong>finishing service</strong>, not a haircut correction tool. Its job is to make the haircut look clean and intentional by sharpening the <strong>front hairline, temples, sideburn edges, around the ears, and nape</strong>. Good edging makes the haircut look polished. Bad edging removes too much hair, creates uneven corners, irritates skin, and can permanently push the hairline back over time.</p>
<p>The barber's rule is simple: <strong>define what is already there; do not invent a new hairline unless the service plan clearly calls for it and the client understands the maintenance.</strong></p>

<h3>Tools and setup</h3>
<p>Use only clean, disinfected tools and a stable setup.</p>
<h4>Required tools</h4>
<ul>
<li>T-liner, outliner, or detailer trimmer</li>
<li>Straight razor or shavette, if appropriate</li>
<li>Barber comb</li>
<li>Hand mirror</li>
<li>Neck strip and cape</li>
<li>Towels or disposable wipes</li>
<li>Shaving gel or lather</li>
<li>Antiseptic or astringent as allowed by shop policy</li>
<li>EPA-registered disinfectant</li>
<li>Gloves if required by service condition or shop policy</li>
</ul>
<h4>Pre-service preparation</h4>
<ol>
<li>Wash or sanitize hands before service.</li>
<li>Clean and disinfect all tools with an EPA-registered disinfectant.</li>
<li>Prepare a clean workstation to avoid cross-contamination.</li>
<li>Drape the client with a neck strip and cape so the cape does not touch bare skin.</li>
<li>Seat the client upright with the head in a natural position so the line is not created on a tilted angle.</li>
<li>Inspect lighting and mirror position before beginning.</li>
</ol>

<h3>Client consultation</h3>
<ul>
<li>Ask whether the client wants a natural lineup or a sharper, more defined finish.</li>
<li>Confirm temple shape, sideburn shape, and nape preference: tapered, rounded, or square.</li>
<li>Ask about recent irritation, razor sensitivity, acne breakout, ingrown hairs, or cuts.</li>
<li>Explain that razor detailing will not be performed on broken or irritated skin.</li>
<li>Confirm that the goal is a clean edge without pushing the hairline back.</li>
</ul>

<h3>Contraindications and razor safety</h3>
<p>Do <strong>not</strong> use a razor over:</p>
<ul>
<li>Cuts, abrasions, or open skin</li>
<li>Active acne</li>
<li>Inflamed bumps</li>
<li>Rash or infection</li>
<li>Skin that is already irritated</li>
<li>Areas prone to keloid scarring if razor use may trigger trauma</li>
</ul>
<p>Use extra caution or modify the service on clients with razor bumps, ingrown hairs, or highly irritated skin.</p>
<p>If the skin condition makes edging unsafe, stop and refer to the instructor or follow shop procedure.</p>
<p><strong>Non-negotiable rule:</strong> trimmer defines first, razor refines second. Never use the razor to guess the shape.</p>

<h3>Service order</h3>
<p>Front hairline → temples → around ears → sideburns → nape → symmetry check → razor detailing if appropriate</p>

<h3>Procedure</h3>
<ol>
<li><strong>Establish the front hairline</strong>
<ul>
<li>Stand directly in front of the client.</li>
<li>Identify the natural front hairline before cutting.</li>
<li>Start at the center and work outward to keep both sides balanced.</li>
<li>Use the trimmer with light pressure and short, controlled motions.</li>
<li>Remove only the overgrowth outside the line. Do not push the line back.</li>
</ul>
</li>
<li><strong>Refine the front edge</strong>
<ul>
<li>Use small anchor strokes instead of one long pass.</li>
<li>Keep the blade steady and let the corners of the trimmer help create detail.</li>
<li>Check the line from the front and slightly above eye level to catch uneven corners.</li>
</ul>
</li>
<li><strong>Shape the temples</strong>
<ul>
<li>Decide whether the temple should be squared or softly tapered based on the haircut, growth pattern, and client preference.</li>
<li>Follow the natural temple area instead of cutting above it.</li>
<li>Match both sides by checking height, width, and angle before deepening the line.</li>
</ul>
</li>
<li><strong>Outline around the ears</strong>
<ul>
<li>Fold the ear gently only as needed for visibility and safety.</li>
<li>Use the trimmer in short controlled movements around the ear curve.</li>
<li>Keep the outline clean without cutting into the skin.</li>
</ul>
</li>
<li><strong>Balance the sideburns</strong>
<ul>
<li>Comb the sideburn area down.</li>
<li>Check both sideburns from the front, not only from the side.</li>
<li>Match length, width, and bottom line before finalizing.</li>
</ul>
</li>
<li><strong>Create the nape outline</strong>
<ul>
<li>Ask whether the client wants a tapered, rounded, or square nape.</li>
<li>Use the trimmer to outline the chosen shape.</li>
<li>Keep the nape centered and symmetrical with the spine and head position.</li>
</ul>
</li>
<li><strong>Check symmetry before detailing</strong>
<ul>
<li>Step back and inspect the entire outline.</li>
<li>Use the mirror to compare both sides.</li>
<li>Correct only the area that is uneven. Do not keep cutting both sides higher trying to chase perfection.</li>
</ul>
</li>
<li><strong>Razor detailing if the skin is healthy</strong>
<ul>
<li>Apply lather or shaving gel if used in your service procedure.</li>
<li>Stretch the skin firmly before using the razor.</li>
<li>Hold the razor at a low angle with light pressure.</li>
<li>Use short, controlled strokes to sharpen the edge.</li>
<li>Wipe the blade safely as required by shop procedure.</li>
<li>Do not go over broken, raised, or irritated skin.</li>
</ul>
</li>
</ol>

<h3>Safety &amp; Infection Control</h3>
<p>Follow this sequence in order. NIC practical exams test sequence, not just knowledge.</p>
<h4>Before service</h4>
<ol>
<li>Wash or sanitize hands before touching tools or the client.</li>
<li><strong>Pre-clean all tools</strong> — remove all hair and debris before applying disinfectant. Debris blocks disinfectant effectiveness and makes the step invalid.</li>
<li>Apply EPA-registered disinfectant and allow full contact time per the product label — typically 10 minutes for full disinfection. Do not wipe off early.</li>
<li>For clipper and trimmer blades: use a clipper disinfectant spray and keep blades visibly wet for the full required contact time.</li>
</ol>
<h4>During service</h4>
<ul>
<li>Use only clean implements on the client.</li>
<li>Avoid cross-contamination by keeping soiled items separate from disinfected tools.</li>
<li>Do not perform razor work on irritated or broken skin.</li>
<li>Maintain proper draping and client protection throughout the service.</li>
<li><strong>Single-use items</strong> (razor blades, neck strips, disposable wipes) must be discarded immediately after use. Do not reuse.</li>
<li><strong>Porous items</strong> (wooden sticks, foam, emery boards) cannot be disinfected — treat as single-use and discard.</li>
</ul>
<h4>After service</h4>
<ol>
<li>Pre-clean tools again — remove debris.</li>
<li>Apply disinfectant and allow full contact time before storing.</li>
<li>Disinfect workstation surfaces and chair between every client.</li>
<li>Dispose of all single-use materials properly.</li>
<li>Replace disinfectant solution if it is visibly cloudy or dirty. Change at minimum every 24 hours.</li>
</ol>

<h3>Correct vs. Incorrect Lineup Logic</h3>
<h4>Correct</h4>
<ul>
<li>Follows the natural hairline</li>
<li>Looks even from the front</li>
<li>Matches the haircut design</li>
<li>Keeps temple height appropriate</li>
<li>Preserves density at weak corners</li>
<li>Sharpens without irritating the skin</li>
</ul>
<h4>Incorrect</h4>
<ul>
<li>Pushed back to make it look "extra clean"</li>
<li>One temple cut higher than the other</li>
<li>Jagged line from long uncontrolled strokes</li>
<li>Sideburns different in length or width</li>
<li>Nape off-center</li>
<li>Razor used over broken or inflamed skin</li>
</ul>

<h3>Hair type and growth-pattern decision rules</h3>
<h4>IF the client has coarse or curly hair</h4>
<p>Use a lighter touch and take less hair per pass. Follow the natural edge more closely. Avoid over-defining the front line. Expect the line to appear strong with less cutting. <em>Why: coarse or curly hair creates visual density fast. Too much pressure or carving makes the line look harsh and unnatural.</em></p>
<h4>IF the client has fine or straight hair</h4>
<p>Use extra caution because mistakes show immediately. Keep corners soft unless the haircut design clearly supports a harder edge. Do not widen the line trying to make it look darker. <em>Why: fine hair gives less visual forgiveness. Once pushed back, the edge can look thin and weak.</em></p>
<h4>IF the client has a receding hairline</h4>
<p>Do not force a low straight line across recessed corners. Clean the natural outline and preserve what exists. Explain that a conservative line will look better and grow out cleaner.</p>
<h4>IF the hairline is naturally uneven</h4>
<p>Improve the appearance without overcutting both sides. Remove obvious strays first. Decide what difference is natural and acceptable before cutting. Symmetry means <strong>balanced appearance</strong>, not always identical biology.</p>
<h4>IF there are cowlicks at the temple or nape</h4>
<p>Follow the growth pattern. Use smaller strokes. Avoid making the area shorter just to overpower the growth.</p>
<h4>IF the skin is sensitive</h4>
<p>Limit razor passes. Use gentle tension and clean strokes. Stop if redness or irritation develops.</p>

<h3>Razor refinement</h3>
<p>Only refine after the trimmer shape is correct.</p>
<ol>
<li>Apply appropriate prep according to shop protocol.</li>
<li>Stretch the skin firmly.</li>
<li>Use short, controlled razor strokes.</li>
<li>Shave only the hair outside the established trimmer line.</li>
<li>Wipe and inspect the skin often.</li>
<li>Stop immediately if irritation appears.</li>
</ol>
<p>The razor is a refinement tool, not the primary design tool.</p>

<h3>Common Failure Modes and Corrections</h3>
<h4>Crooked front line</h4>
<p><strong>Cause:</strong> started from one side instead of establishing the center.<br/><strong>Correction:</strong> recheck the center point, compare both corners, and make only minimal balancing adjustments.</p>
<h4>Temple cut too high</h4>
<p><strong>Cause:</strong> chasing sharpness instead of respecting the natural temple.<br/><strong>Correction:</strong> stop raising the opposite side; preserve what remains and let the area grow back rather than compounding the error.</p>
<h4>Jagged edge</h4>
<p><strong>Cause:</strong> heavy pressure or fast dragging motion.<br/><strong>Correction:</strong> use shorter anchor strokes with lighter pressure.</p>
<h4>Uneven sideburns</h4>
<p><strong>Cause:</strong> checked from side view only.<br/><strong>Correction:</strong> face the client head-on and compare both bottom lines visually.</p>
<h4>Razor irritation or razor burn</h4>
<p><strong>Cause:</strong> too many passes, poor skin tension, or working over compromised skin.<br/><strong>Correction:</strong> reduce passes, improve tension, and skip razor work where the skin is unsafe.</p>

<h3>Sanitation and compliance</h3>
<ul>
<li>Clean and disinfect tools before service</li>
<li>Remove cut hair from tools as needed during service</li>
<li>Avoid cross-contaminating zones if skin becomes irritated</li>
<li>Replace blades according to shop and safety protocol</li>
<li>Dispose of single-use razor blades correctly</li>
<li>Maintain clean draping and workstation control</li>
</ul>
<p>For state board readiness: proper draping, clean and disinfected implements, safe handling of sharp tools, protection of the client's skin, sanitary disposal of waste.</p>

<h3>Quick service checklist</h3>
<ul>
<li>Front line is balanced</li>
<li>Temple points are intentional</li>
<li>Around-ear edge is clean</li>
<li>Sideburns match from the front</li>
<li>Nape matches requested shape</li>
<li>No zone has been pushed back unnecessarily</li>
<li>Skin is clean and not overworked</li>
<li>Client has seen the result in the mirror</li>
</ul>

<h3>Summary</h3>
<p>Lineup and edging require restraint, not aggression. Use the trimmer to establish shape, skin tension to protect precision, and the razor only when appropriate. Preserve the natural hairline whenever possible, adapt to hair type and growth pattern, and check symmetry from the client's front view before calling the service complete.</p>

<h3>Result</h3>
<ul>
<li>Hairline is clean, even, and appropriate for the client.</li>
<li>Temples, sideburns, and nape are balanced and symmetrical.</li>
<li>The finish is sharp without obvious pushback of the natural line.</li>
<li>The skin remains free from cuts, razor burn, and unnecessary irritation.</li>
</ul>

<h3>Advanced barber insight</h3>
<p>A lineup should look intentional on day one and still grow out cleanly. A sharp line is not automatically a good line. The best lineup respects the client's natural growth pattern, face shape, density, and weak points in the hairline.</p>

<h3>Technique notes</h3>
<ul>
<li>Anchor strokes create better control than a single sweeping pass.</li>
<li>Skin tension is mandatory for razor detailing and helpful for cleaner trimmer work in loose skin areas.</li>
<li>The corners of the trimmer are for detail; the full blade is for longer straight segments.</li>
<li>Always judge the line with the client's head in a natural upright position.</li>
</ul>

<h3>Post-service procedure</h3>
<ol>
<li>Remove loose hair from the neck, face, and cape.</li>
<li>Apply soothing product if appropriate and allowed by service protocol.</li>
<li>Dispose of single-use items properly.</li>
<li>Clean and disinfect tools and workstation.</li>
<li>Reset the station for the next client.</li>
</ol>`,
          quizQuestions: [
            {
              id: 'l26-q1',
              question:
                'A client has slight recession in both front corners and asks for a perfectly straight, boxed hairline. What is the best professional response?',
              options: [
                'Cut a straight line higher to create a stronger look',
                'Follow the natural hairline and create the sharpest realistic shape without pushing the corners back',
                'Ignore the recession and cut both corners square at any cost',
                'Refuse to line the front hairline at all',
              ],
              correctAnswer: 1,
              explanation:
                'A professional lineup improves neatness without creating an artificial line that removes too much natural hair or grows out poorly.',
            },
            {
              id: 'l26-q2',
              question: 'What is the safest reason to stretch the skin before razor detailing?',
              options: [
                'It makes the haircut take less time',
                'It helps the razor glide on a flatter surface and reduces the risk of cuts',
                'It removes more hair with each pass',
                'It darkens the lineup visually',
              ],
              correctAnswer: 1,
              explanation:
                'Skin tension creates a flatter working surface so the razor moves more safely and precisely.',
            },
            {
              id: 'l26-q3',
              question:
                'While detailing the temples, you notice one temple naturally sits slightly higher. What should you do?',
              options: [
                'Cut the lower temple higher to force both sides to match exactly',
                'Ignore both temples and focus only on the nape',
                'Respect the natural pattern and improve visual balance without unnecessarily raising either side',
                'Round both temples to hide the difference',
              ],
              correctAnswer: 2,
              explanation:
                'The goal is visual balance, not destruction of the natural hairline. Chasing exact sameness often makes the result worse.',
            },
            {
              id: 'l26-q4',
              question:
                'A student creates a jagged front line with the trimmer. What is the most likely cause?',
              options: [
                'Using short controlled anchor strokes',
                'Holding the head upright',
                'Using heavy pressure or dragging the trimmer in one uncontrolled pass',
                'Checking the line in the mirror',
              ],
              correctAnswer: 2,
              explanation:
                'Jagged edges usually come from poor control, excessive pressure, or trying to create the line in one long pass.',
            },
            {
              id: 'l26-q5',
              question: 'After finishing the lineup, what should happen before the client leaves?',
              options: [
                'Only brush the client off and move to the next service',
                'Remove loose hair, apply product if appropriate, then clean and disinfect tools and workstation',
                'Leave used tools aside until the end of the day',
                'Have the client inspect the cut while the station remains soiled',
              ],
              correctAnswer: 1,
              explanation:
                'State board standards require proper client cleanup plus cleaning and disinfection of tools and the workstation after service.',
            },
          ],
          instructorNotes: [
            'Demonstrate front-view checking, not mirror-only side checking.',
            'Emphasize that razor use is optional and contraindication-dependent.',
            'Correct students who try to create a new hairline instead of cleaning the existing one.',
            'Require named skin tension and short anchor strokes during practical evaluation.',
          ],
          competencyChecks: [
            'Demonstrates proper hand sanitation, draping, and workstation preparation',
            'Identifies contraindications before service',
            'Maintains skin tension during edging',
            'Preserves natural hairline unless redesign is intentionally planned',
            'Uses short controlled strokes instead of one long sweep',
            'Checks symmetry from the front view',
            'Selects correct nape shape based on client preference',
            'Avoids razor use on contraindicated skin',
            'Completes post-service cleanup and disinfection properly',
          ],
        },
        {
          slug: 'barber-lesson-27',
          title: 'Flat Top & Classic Cuts',
          order: 6,
          domainKey: 'haircutting',
          objective: 'Execute a flat top and classic taper haircut.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-scissors-narrated.mp4',
          content: `<h2>Overview</h2><p>The flat top and classic taper haircut represent foundational skills in traditional barbering. The flat top features a horizontal plane on top with squared corners and tight sides, while the classic taper blends smoothly from longer crown hair to shorter sides and neckline. Both styles require precise clipper control, proper body positioning, and an understanding of head shape. Mastering these cuts builds essential technical skills including elevation, guideline establishment, and blending techniques. These timeless styles remain popular across diverse clientele and form the basis for many contemporary variations in men's grooming.</p><h2>Tools Required</h2><ul><li>Professional barber clippers with guards (#000 to #8)</li><li>Flat top comb with level indicator</li><li>Wide-tooth clipper-over-comb</li><li>Taper/blending shears</li><li>Neck duster and cape</li><li>Spray bottle with clean water</li><li>Styling products (pomade or gel)</li><li>Hand mirror for client consultation</li></ul><h2>Client Variations</h2><p>IF the client has coarse, dense hair, THEN use a higher guard number initially and work down gradually to avoid removing too much length too quickly. IF the client has fine or thinning hair, THEN avoid creating a flat top as it may expose scalp visibility on the plane; recommend a textured crew cut or classic taper instead. IF the client has an elongated head shape, THEN keep the flat top height moderate to maintain proportion. IF the client has scalp sensitivity or recent abrasions, THEN use guards rather than clipper-over-comb techniques near affected areas.</p><h2>Procedure</h2><ol><li>Drape client properly and consult on desired flat top height and taper length, confirming head shape suitability for the style requested.</li><li>Establish guideline by cutting top section to desired length using clippers with appropriate guard, working front to back with consistent pressure.</li><li>Create the flat plane by using clipper-over-comb technique, holding comb parallel to floor and removing hair protruding above comb teeth.</li><li>Square the corners by angling clipper at forty-five degrees where top plane meets side sections, creating crisp architectural definition.</li><li>Taper the sides using progressively shorter guards, starting at temple and working down, blending each section with overlapping clipper strokes.</li><li>Detail the outline at ears, sideburns, and neckline using trimmer or inverted clipper blade for clean, defined perimeter lines.</li><li>Blend any visible lines using shear-over-comb or light clipper work, ensuring smooth transitions between all sections and lengths.</li><li>Apply light styling product, check symmetry using mirror and client feedback, and perform final detailing for polished, professional finish.</li></ol><h2>Safety</h2><p>Sanitize all clippers, guards, combs, and shears using EPA-registered hospital-grade disinfectant such as Barbicide or Marvicide for minimum ten minutes between clients. <strong>Do NOT attempt a flat top on clients with active scalp infections, open wounds, or severe psoriasis, as clipper-over-comb techniques require close scalp contact and can spread infection or cause painful irritation to compromised skin.</strong> Always inspect scalp before beginning service.</p><h2>Failure Recovery</h2><p>If an uneven plane appears on the flat top with one corner lower than others, the cause is typically inconsistent comb angle or body position shifts during clipper-over-comb work. To recover: First, re-establish your stance directly behind the client for centered perspective. Second, dampen the top section lightly to control hair. Third, place flat top comb across the entire plane to identify high spots. Fourth, carefully remove only the elevated areas using controlled clipper-over-comb passes. Fifth, recheck plane from multiple angles including side views. Sixth, blend any new cutting lines into surrounding sections.</p><h2>Visual Cues</h2><p>The flat top plane should appear perfectly horizontal when viewed from the side, with no doming or concave depressions across the surface. Corners should form crisp ninety-degree angles when viewed from front or back, creating a distinct architectural silhouette. The taper should show gradual progression from approximately one-eighth inch at the bottom to the guideline length, with no visible lines or steps between sections. Proper elevation during cutting keeps clippers perpendicular to the head curve on sides and parallel to floor on top. Client head position should remain upright and straight; tilting creates asymmetry. Observe the natural fall of hair between passes to identify any missed sections or uneven areas requiring correction.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-27-q1",
                              "question": "What is the primary purpose of using a flat top comb with level indicator during this haircut?",
                              "options": [
                                        "A. To ensure the horizontal plane remains level and parallel to the floor throughout the cutting process",
                                        "B. To detangle the hair before beginning the clipper work on top",
                                        "C. To measure the exact length of hair being removed from sides",
                                        "D. To create texture and remove bulk from dense hair sections"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The flat top comb with level indicator is specifically designed to help the barber maintain a perfectly horizontal plane on top of the head, which is the defining characteristic of a flat top haircut."
                    },
                    {
                              "id": "barber-lesson-27-q2",
                              "question": "When tapering the sides of a classic haircut, what technique ensures smooth blending between guard lengths?",
                              "options": [
                                        "A. Using only one guard length throughout the entire side section",
                                        "B. Overlapping clipper strokes while progressing through shorter guards from top to bottom",
                                        "C. Cutting all hair to the same length before blending",
                                        "D. Working from the neckline upward with increasing guard sizes"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Overlapping clipper strokes while using progressively shorter guards creates seamless transitions without visible lines, which is essential for a professional taper. This gradual progression ensures smooth blending."
                    },
                    {
                              "id": "barber-lesson-27-q3",
                              "question": "Why must all clippers and tools be disinfected with hospital-grade disinfectant for a minimum of ten minutes between clients?",
                              "options": [
                                        "A. To comply with DOL apprenticeship regulations and prevent transmission of scalp infections and bloodborne pathogens",
                                        "B. To keep the tools lubricated and functioning properly",
                                        "C. To remove hair clippings that might dull the blades",
                                        "D. To make the tools appear clean and professional to clients"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Hospital-grade disinfection for the proper contact time is required to kill pathogens including bacteria, viruses, and fungi that can be transmitted between clients, protecting both client and barber health and meeting regulatory requirements."
                    },
                    {
                              "id": "barber-lesson-27-q4",
                              "question": "SCENARIO: A client with very fine, thinning hair requests a flat top haircut. What is the appropriate professional response?",
                              "options": [
                                        "A. Proceed with the flat top as requested since the client knows what they want",
                                        "B. Create a shorter flat top to minimize the appearance of thinning",
                                        "C. Recommend an alternative style such as a textured crew cut or classic taper that better suits their hair density",
                                        "D. Use a higher guard number to leave more length on top"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fine or thinning hair is not suitable for a flat top because the horizontal plane will expose scalp visibility. A professional barber should recommend alternatives that work with the client's hair characteristics while achieving a similar aesthetic."
                    },
                    {
                              "id": "barber-lesson-27-q5",
                              "question": "SCENARIO: While executing clipper-over-comb on the flat top plane, you notice one corner is significantly lower than the others. What is the correct response?",
                              "options": [
                                        "A. Continue cutting and lower all other sections to match the lowest corner",
                                        "B. Re-establish centered body position, identify high spots with the comb, and carefully remove only elevated areas",
                                        "C. Switch to a longer guard and start over from the beginning",
                                        "D. Blend the low corner into the sides to hide the mistake"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The recovery procedure involves repositioning for proper perspective, identifying what remains high rather than cutting more from the low area, and making targeted corrections. Starting over or reducing all sections would result in an excessively short flat top."
                    }
          ],
          competencyChecks: [
            'Executes flat top with level, even surface across the top',
            'Executes classic taper with smooth transitions from top to nape',
            'Follows pre-clean → disinfect → contact time sequence before service',
            'Uses clipper disinfectant spray with correct dwell time on blades',
            'Stops service and follows blood exposure protocol if skin is broken',
            'Discards single-use items immediately after use',
          ],
        },
        {
          slug: 'barber-module-4-checkpoint',
          title: 'Haircutting Checkpoint',
          order: 7,
          domainKey: 'haircutting',
          objective: 'Demonstrate mastery of haircutting techniques.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Overview</h2><p>This checkpoint lesson assesses your mastery of fundamental haircutting techniques covered throughout Module 4. You will demonstrate proper tool selection, sectioning, elevation, cutting angles, and finishing techniques while maintaining sanitation standards and client safety. This comprehensive evaluation ensures you can execute various haircuts with precision and professionalism. Your performance will reflect your readiness to progress in the apprenticeship program and serve clients independently under supervision.</p><h2>Tools Required</h2><ul><li>Professional haircutting shears with adjustable tension</li><li>Texturizing or thinning shears for blending and weight removal</li><li>Multiple cutting combs including all-purpose and tail combs</li><li>Sectioning clips in various sizes for hair management</li><li>Spray bottle filled with clean water for dampening</li><li>Barber cape and neck strip for client protection</li><li>Clippers with multiple guard attachments and accessories</li><li>Disinfectant solution approved for salon tools and surfaces</li></ul><h2>Procedure</h2><ol><li>Conduct thorough client consultation identifying desired style, hair characteristics, growth patterns, and any contraindications before beginning the service.</li><li>Drape client properly with sanitized cape and neck strip, ensuring complete coverage and comfort throughout the haircutting procedure.</li><li>Shampoo and towel-dry hair to appropriate dampness level, detangling gently with wide-tooth comb from ends to roots progressively.</li><li>Section hair systematically using appropriate parting patterns for chosen technique, securing each section with clips to maintain organization and control.</li><li>Establish guideline using proper elevation, finger position, and cutting angle consistent with desired style and hair texture requirements.</li><li>Progress through sections methodically using traveling guide or stationary guide technique, maintaining consistent tension and visualizing projected length.</li><li>Cross-check entire haircut using opposite sectioning pattern to identify and correct any unevenness or weight line inconsistencies immediately.</li><li>Refine perimeter, blend weight lines, and personalize cut using point cutting, slide cutting, or texturizing techniques as appropriate.</li><li>Style hair using appropriate products and tools to showcase the finished cut, ensuring client satisfaction before concluding service.</li><li>Clean and disinfect all tools immediately, sweep station thoroughly, and document service details for client record maintenance.</li></ol><h2>Safety</h2><p>All cutting tools must be cleaned with soap and water then fully immersed in EPA-registered hospital-grade disinfectant for manufacturer-recommended contact time between clients. <strong>Do NOT attempt haircuts on clients with open scalp wounds, active infections, or contagious conditions as this creates cross-contamination risk and may worsen the client's condition requiring medical attention.</strong> IF the client has coarse, dense hair, THEN use wider tooth combs and adjust tension to prevent hand fatigue and ensure cutting accuracy. IF the client has fine, thin hair, THEN reduce tension and use smaller subsections to prevent over-removal and maintain desired density throughout the cut.</p><h2>Visual Cues</h2><p>Monitor finger position maintaining consistent elevation angle between zero and ninety degrees depending on technique requirements. Observe hair projection perpendicular to curve of head for graduation or parallel to floor for uniform layers. Watch for clean, decisive shear closure producing sharp cutting lines without bending or folding hair strands. Check weight distribution by observing how hair falls naturally, identifying heavy areas appearing bulky or disconnected sections showing gaps. Verify perimeter hangs evenly when client's head is in neutral position with symmetrical balance on both sides. If sections appear uneven during cross-checking, you have inconsistent guideline adherence requiring immediate correction by re-cutting affected areas using proper elevation and original guideline as reference point for accuracy.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-module-4-checkpoint-q1",
                              "question": "What is the primary purpose of cross-checking a haircut?",
                              "options": [
                                        "A. To identify and correct any unevenness or inconsistencies in the cut",
                                        "B. To add texture and remove bulk from thick hair",
                                        "C. To establish the initial guideline for the haircut",
                                        "D. To determine the client's desired style and length"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Cross-checking involves cutting through opposite sectioning patterns to identify any unevenness, weight line inconsistencies, or errors that occurred during the initial cutting process, allowing for immediate correction."
                    },
                    {
                              "id": "barber-module-4-checkpoint-q2",
                              "question": "Which technique maintains consistent length throughout by keeping hair projection perpendicular to the head curve?",
                              "options": [
                                        "A. Uniform layering with zero elevation",
                                        "B. Graduation technique creating stacked weight",
                                        "C. Blunt cutting with hair at natural fall",
                                        "D. Texturizing to remove internal weight"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Graduation technique involves projecting hair perpendicular to the curve of the head and cutting at an angle, which creates a stacked or built-up weight area while maintaining controlled length progression."
                    },
                    {
                              "id": "barber-module-4-checkpoint-q3",
                              "question": "What is the correct contact time requirement for tool disinfection between clients?",
                              "options": [
                                        "A. The manufacturer-recommended contact time for the EPA-registered disinfectant being used",
                                        "B. Exactly five minutes regardless of the disinfectant product",
                                        "C. A quick spray and immediate wipe-down",
                                        "D. Overnight soaking in any antibacterial solution"
                              ],
                              "correctAnswer": 0,
                              "explanation": "EPA-registered hospital-grade disinfectants have specific manufacturer-recommended contact times that must be followed to ensure proper disinfection. This time varies by product and must be strictly observed for effective sanitation."
                    },
                    {
                              "id": "barber-module-4-checkpoint-q4",
                              "question": "SCENARIO: A client with fine, thin hair requests a layered cut. What adjustment should you make?",
                              "options": [
                                        "A. Use maximum tension and large sections to speed up the service",
                                        "B. Apply heavy thinning shears throughout to create texture",
                                        "C. Reduce tension and use smaller subsections to prevent over-removal",
                                        "D. Increase elevation angles to remove more weight"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fine, thin hair requires reduced tension and smaller subsections to maintain control and prevent removing too much hair, which would make the hair appear even thinner and compromise the desired density and style."
                    },
                    {
                              "id": "barber-module-4-checkpoint-q5",
                              "question": "SCENARIO: During cross-checking you notice sections appear uneven with visible gaps. What is the correct response?",
                              "options": [
                                        "A. Continue with styling as the product will hide the unevenness",
                                        "B. Re-cut affected areas using proper elevation and the original guideline as reference",
                                        "C. Apply texturizing shears randomly to blend the inconsistencies",
                                        "D. Inform the client that hair settles differently after a few days"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Unevenness discovered during cross-checking must be corrected immediately by re-cutting the affected areas using proper technique and referencing the original guideline to ensure consistency and precision throughout the haircut."
                    }
          ],
        },
      ],
    }

;
