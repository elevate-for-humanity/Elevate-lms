import type { BlueprintModule } from '../types';

export const barberModule6: BlueprintModule = {
      slug: 'barber-module-6',
      title: 'Module 6: Chemical Services',
      orderIndex: 6,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'chemical_services',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'hair_color_theory', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'relaxer_services', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'chemical_safety', isCritical: true, minimumTouchpoints: 2 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-35',
          title: 'Hair Color Theory',
          order: 1,
          domainKey: 'chemical_services',
          objective: 'Explain the color wheel and how it applies to hair color services.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-styling-narrated.mp4',
          content: `<h2>Overview</h2><p>Hair color theory is the foundation of successful chemical color services in the barbershop. Understanding the color wheel enables barbers to predict color outcomes, correct unwanted tones, and achieve desired results consistently. The color wheel consists of primary colors (red, yellow, blue), secondary colors (orange, green, violet), and tertiary colors created by mixing adjacent hues. Complementary colors sit opposite each other on the wheel and neutralize one another when combined. This principle is essential for color correction, toning, and formulation. Mastering color theory allows barbers to communicate professionally with clients and deliver predictable, quality results in highlighting, grey blending, and full color applications.</p><h2>Client Assessment</h2><p>IF the client has warm undertones in their skin, THEN select ash or cool tones to create balance and avoid brassy results. IF the client has cool undertones with pink or blue base, THEN choose warm or golden tones to complement their complexion and create harmonious results. IF the client has previously colored hair with visible banding or multiple levels, THEN perform a strand test to determine processing time and formulation adjustments needed for even color distribution.</p><h2>Tools Required</h2><ul><li>Color wheel chart displaying primary, secondary, and tertiary color relationships</li><li>Color swatches or manufacturer's shade guide showing level and tone variations</li><li>Mixing bowl (glass or plastic, non-metallic) for color formulation</li><li>Tint brush with firm bristles for precise application techniques</li><li>Protective gloves (nitrile or vinyl) for barrier protection during application</li><li>Measuring tools including applicator bottle or scale for accurate formulation</li><li>Sectioning clips (metal-free plastic) to organize hair during application</li><li>Protective cape and towels to shield client's skin and clothing</li></ul><h2>Procedure</h2><ol><li>Conduct thorough consultation identifying current hair level, desired outcome, and any previous chemical treatments to establish realistic expectations and proper formulation.</li><li>Perform strand test on inconspicuous section to verify processing time, color result, and hair integrity before proceeding with full application.</li><li>Section hair into four quadrants from center front hairline to nape and ear to ear, securing each with clips.</li><li>Mix color formula according to manufacturer's directions, measuring developer and colorant precisely to maintain proper ratios and achieve predictable results.</li><li>Apply color beginning at areas requiring most deposit or lift, typically starting one-half inch from scalp on virgin hair applications.</li><li>Process according to strand test results and manufacturer's timing, checking color development every five to ten minutes to monitor progress.</li><li>Rinse thoroughly with lukewarm water until water runs clear, then apply color-safe shampoo and conditioner to stabilize pH balance.</li><li>Style hair and evaluate final result against desired outcome, documenting formula and timing for client record maintenance and future services.</li></ol><h2>Safety</h2><p>All color mixing tools and applicators must be sanitized between clients using EPA-registered hospital-grade disinfectant with appropriate contact time, typically ten minutes for non-porous implements. Combs and brushes should be cleaned of all hair and debris, then fully immersed in disinfectant solution. <strong>Do NOT apply permanent color or lightener to hair that shows signs of severe breakage, excessive damage, or scalp abrasions, as this will cause further structural damage, chemical burns, or hair loss requiring extensive corrective treatment.</strong> Always perform a patch test twenty-four to forty-eight hours before service for clients with sensitivity concerns or previous allergic reactions.</p><h2>Color Correction</h2><p>If unwanted orange or brassy tones appear after lightening, the cause is typically insufficient lifting or improper toner selection. To recover: first, evaluate the current level achieved versus desired level. Second, identify the unwanted tone using the color wheel to determine its complement. Third, formulate a toner using the opposite color (blue-violet for orange, blue for orange-yellow). Fourth, apply toner to damp, towel-dried hair for even saturation. Fifth, process for recommended time while monitoring every three to five minutes. Sixth, rinse thoroughly and assess, repeating if necessary with reduced processing time.</p><h2>Visual Cues</h2><p>Observe the hair's underlying pigment by holding sections at a forty-five degree angle against natural light to identify warm or cool tones present. Proper saturation appears glossy and uniform throughout each section, with no dry spots or uneven application visible. During processing, color development should progress evenly from application point outward without demarcation lines or spotting. The hair should maintain its structural integrity with minimal swelling or softening. Completed color results should show consistent tone from roots to ends when viewed in both natural and artificial lighting conditions, with no banding or patchiness visible.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-35-q1",
                              "question": "Which colors are considered primary colors on the color wheel used in hair color theory?",
                              "options": [
                                        "A. Red, yellow, and blue",
                                        "B. Orange, green, and violet",
                                        "C. Red, orange, and yellow",
                                        "D. Blue, green, and violet"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Red, yellow, and blue are the three primary colors that cannot be created by mixing other colors. All other colors on the wheel are created by combining these primary colors in various proportions."
                    },
                    {
                              "id": "barber-lesson-35-q2",
                              "question": "What is the relationship between complementary colors on the color wheel?",
                              "options": [
                                        "A. They are adjacent to each other and blend harmoniously",
                                        "B. They sit opposite each other and neutralize one another",
                                        "C. They are variations of the same hue at different levels",
                                        "D. They are always warm tones that create vibrant results"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Complementary colors are positioned directly opposite each other on the color wheel and neutralize each other when mixed. This principle is fundamental for color correction and toning services to eliminate unwanted tones."
                    },
                    {
                              "id": "barber-lesson-35-q3",
                              "question": "Why must color mixing bowls and tools be non-metallic during hair color application?",
                              "options": [
                                        "A. Metal can react with color chemicals causing unpredictable results or oxidation",
                                        "B. Metal tools are too heavy for precise application techniques",
                                        "C. Non-metallic tools are easier to clean and sanitize between clients",
                                        "D. Metal bowls retain heat that accelerates processing time excessively"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Metal can cause oxidation reactions with hair color chemicals, leading to unpredictable color results, altered formulations, or compromised chemical stability. Non-metallic tools ensure color integrity and predictable outcomes."
                    },
                    {
                              "id": "barber-lesson-35-q4",
                              "question": "SCENARIO: A client with warm, golden skin undertones requests a hair color service and wants to avoid looking brassy. What do you do?",
                              "options": [
                                        "A. Apply warm golden tones to match their skin and enhance the warmth",
                                        "B. Use red-based colors to create vibrant contrast with their complexion",
                                        "C. Select ash or cool-toned colors to balance their warm undertones and prevent brassiness",
                                        "D. Refuse the service because warm skin always results in brassy hair color"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Clients with warm skin undertones benefit from ash or cool-toned hair colors that create balance and prevent brassy results. Cool tones neutralize excess warmth and create a complementary, harmonious appearance."
                    },
                    {
                              "id": "barber-lesson-35-q5",
                              "question": "SCENARIO: During color processing you notice unwanted orange tones developing on previously lightened hair. Correct response?",
                              "options": [
                                        "A. Immediately rinse the color out and start over with a darker shade",
                                        "B. Formulate a blue-violet toner to neutralize the orange and apply after rinsing",
                                        "C. Continue processing longer to push through the orange stage to pale yellow",
                                        "D. Apply additional lightener over the wet color to lift out the orange pigment"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Orange tones should be neutralized using their complementary color from the wheel: blue-violet. After rinsing the initial color, formulate and apply a blue-violet toner to correct the unwanted warm tones and achieve the desired result."
                    }
          ],
        },
        {
          slug: 'barber-lesson-36',
          title: 'Chemical Safety & Patch Testing',
          order: 2,
          domainKey: 'chemical_services',
          objective: 'Perform a patch test and identify chemical service contraindications.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-sanitation-narrated.mp4',
          content: `<h2>Overview</h2><p>Chemical safety and patch testing are critical foundations for every barber performing chemical services. A patch test identifies allergic reactions or sensitivities before full application, protecting both client health and professional liability. This lesson covers proper patch test execution, contraindication identification, and emergency response protocols. Understanding chemical interactions with skin and hair prevents adverse reactions, burns, and legal complications. Mastery of these skills ensures safe service delivery and builds client trust in your professional judgment.</p><h2>Tools Required</h2><ul><li>Disposable gloves (nitrile or vinyl)</li><li>Chemical product to be tested (hair color, relaxer, or perm solution)</li><li>Cotton swabs or applicator sticks</li><li>Client consultation card with allergy history documentation</li><li>Timer or stopwatch for monitoring development time</li><li>Antiseptic wipes or alcohol pads</li><li>Small mixing bowl and measuring tools</li><li>Adhesive bandage or non-stick gauze pad</li></ul><h2>Client Variation Decision Protocol</h2><p>IF the client has a history of skin allergies, eczema, psoriasis, or previous reactions to hair products, THEN perform the patch test 48 hours before service and document results thoroughly. IF the client has open wounds, active dermatitis, sunburn, or inflamed scalp conditions, THEN postpone chemical services until the condition fully heals. IF the client is using prescription retinoids, has undergone recent laser treatments, or takes photosensitizing medications, THEN extend the patch test observation period to 72 hours and consult with their physician before proceeding.</p><h2>Sanitation Protocol</h2><p>All mixing tools and application instruments must be sanitized with hospital-grade EPA-registered disinfectant such as Barbicide or Marvicide for the manufacturer-specified contact time, typically ten minutes. Discard all single-use items including gloves, cotton swabs, and applicators immediately after patch test completion. Clean work surfaces with disinfectant before and after each client interaction to prevent cross-contamination and maintain professional hygiene standards.</p><h2>Safety</h2><p><strong>Do NOT perform chemical services on clients with active scalp abrasions, open sores, or bleeding lesions. Applying chemicals to compromised skin can cause severe chemical burns, systemic absorption of toxic substances, infection, permanent scarring, and potential litigation for negligence.</strong> Always conduct a thorough scalp and skin analysis before beginning any chemical service. Document all observations and client responses in writing. If a client shows signs of allergic reaction during the patch test including redness, swelling, itching, or blistering, immediately remove the product with cool water and apply a cold compress. Advise the client to seek medical attention if symptoms persist or worsen after initial treatment.</p><h2>Failure Mode and Recovery</h2><p>If a client develops localized irritation or mild redness during the patch test observation period, this indicates sensitivity to the chemical formula. Immediately discontinue plans for the full chemical service. Apply cool water to the test area for five minutes. Pat dry gently with a clean towel. Apply a thin layer of hydrocortisone cream if available and not contraindicated. Document the reaction with photographs if possible. Recommend the client consult a dermatologist before attempting alternative chemical formulations. Suggest alternative non-chemical services that achieve similar aesthetic goals without triggering sensitivity reactions.</p><h2>Visual Cues</h2><p>Apply the patch test mixture to a small area approximately the size of a quarter behind the ear or on the inner elbow. The test area should be clean, dry, and free from lotions or oils. Position your application at a 45-degree angle to ensure even product distribution without excessive saturation. The applied product should appear as a thin, uniform layer without pooling or dripping. Healthy skin remains its natural color while negative reactions show progressive redness, raised welts, or blister formation. Observe skin texture changes including roughness, flaking, or unusual warmth indicating inflammatory response.</p><h2>Procedure</h2><ol><li>Review client consultation card thoroughly, asking specifically about previous chemical service reactions, current medications, and known allergies to cosmetic ingredients or fragrances.</li><li>Put on disposable gloves and clean the test area behind the ear or inner elbow with an antiseptic wipe, allowing the area to air dry completely.</li><li>Mix a small amount of the chemical product according to manufacturer instructions, using the exact formula and proportions planned for the full service application.</li><li>Apply a quarter-sized amount of product to the test area using a cotton swab, spreading it evenly in a thin layer without rubbing vigorously.</li><li>Allow the product to remain on the skin for the manufacturer-recommended development time, typically 20 to 30 minutes, monitoring for immediate adverse reactions throughout.</li><li>Remove the product gently with cool water and pat the area dry, then cover with a small adhesive bandage or gauze if recommended by product instructions.</li><li>Instruct the client to leave the test area undisturbed for 48 hours, avoiding water exposure, and to monitor for redness, itching, swelling, or blistering reactions.</li><li>Document the patch test date, time, product used, and initial skin response in the client record, scheduling the follow-up service only after negative test confirmation.</li></ol>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-36-q1",
                              "question": "What is the primary purpose of performing a patch test before chemical services?",
                              "options": [
                                        "A. To identify allergic reactions or sensitivities before full application",
                                        "B. To determine the correct processing time for the chemical",
                                        "C. To test the strength of the chemical formula",
                                        "D. To practice application techniques on a small area"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The primary purpose of a patch test is to identify allergic reactions or sensitivities before applying chemicals to the entire scalp or hair, protecting client health and preventing adverse reactions."
                    },
                    {
                              "id": "barber-lesson-36-q2",
                              "question": "How long should properly mixed chemical products remain on the patch test area during initial application?",
                              "options": [
                                        "A. 5 to 10 minutes",
                                        "B. 20 to 30 minutes according to manufacturer instructions",
                                        "C. 1 hour minimum",
                                        "D. Until the client reports discomfort"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Chemical products should remain on the patch test area for the manufacturer-recommended development time, typically 20 to 30 minutes, to accurately simulate the conditions of a full service application."
                    },
                    {
                              "id": "barber-lesson-36-q3",
                              "question": "Where should a patch test be applied on the client?",
                              "options": [
                                        "A. Behind the ear or on the inner elbow in a quarter-sized area",
                                        "B. On the scalp near the hairline",
                                        "C. On the back of the hand",
                                        "D. On the neck below the hairline"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The patch test should be applied behind the ear or on the inner elbow in a quarter-sized area, as these locations provide accessible skin that closely resembles scalp sensitivity without being highly visible."
                    },
                    {
                              "id": "barber-lesson-36-q4",
                              "question": "SCENARIO: A client arrives for a color service and mentions they have active eczema patches on their scalp and neck. What do you do?",
                              "options": [
                                        "A. Apply a protective barrier cream and proceed with the service",
                                        "B. Perform a quick patch test and proceed if no immediate reaction occurs",
                                        "C. Postpone the chemical service until the eczema condition fully heals",
                                        "D. Use a gentler chemical formula designed for sensitive skin"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Active eczema represents compromised skin integrity and is a contraindication for chemical services. The service must be postponed until the condition fully heals to prevent severe reactions, chemical burns, and complications."
                    },
                    {
                              "id": "barber-lesson-36-q5",
                              "question": "SCENARIO: During the 48-hour observation period, your client calls reporting mild redness and slight itching at the patch test site. Correct response?",
                              "options": [
                                        "A. Tell them it is normal and proceed with the scheduled service",
                                        "B. Advise them to remove any covering, apply cool water, discontinue the planned service, and recommend dermatologist consultation",
                                        "C. Instruct them to apply moisturizer and monitor for another 24 hours",
                                        "D. Schedule them immediately to complete the service before reaction worsens"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Redness and itching indicate sensitivity or allergic reaction. The correct response is to discontinue service plans immediately, advise cool water application, and recommend professional medical consultation to prevent severe reactions during full application."
                    }
          ],
        },
        {
          slug: 'barber-lesson-37',
          title: 'Relaxers & Texturizers',
          order: 3,
          domainKey: 'chemical_services',
          objective: 'Understand relaxer chemistry and application safety.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-styling-narrated.mp4',
          content: `<h2>Overview</h2><p>Relaxers and texturizers permanently alter hair structure by breaking disulfide bonds within the cortex. Sodium hydroxide, guanidine hydroxide, and ammonium thioglycolate are common active ingredients that rearrange protein chains to achieve straightening or softening effects. Understanding pH levels, processing times, and client hair history is critical for safe application. This service demands precision, timing, and thorough consultation to prevent irreversible damage. Proper technique protects scalp integrity while delivering desired texture modification results for diverse clientele.</p><h2>Tools Required</h2><ul><li>Relaxer or texturizer chemical system with neutralizing shampoo</li><li>Protective base cream or petroleum jelly</li><li>Applicator brushes and tail comb for sectioning</li><li>Timer for accurate processing monitoring</li><li>Plastic or rubber gloves for chemical protection</li><li>Neutralizing conditioner and pH-balanced post-service treatment</li><li>Spray bottle with cool water for emergency dilution</li><li>Cape, towels, and neck strips for client protection</li></ul><h2>Client Assessment</h2><p><strong>IF</strong> the client has virgin hair with no previous chemical treatments, <strong>THEN</strong> apply relaxer from mid-shaft to ends first, then roots last to avoid over-processing at the scalp where heat accelerates the reaction. <strong>IF</strong> the client has previously relaxed hair requiring a touch-up, <strong>THEN</strong> apply only to new growth, maintaining at least one-eighth inch distance from previously processed hair to prevent overlapping, breakage, and excessive thinning.</p><h2>Safety</h2><p>Disinfect all non-porous tools including combs, brushes, and bowls using an EPA-registered hospital-grade disinfectant such as 10% sodium hypochlorite solution or quaternary ammonium compound, ensuring ten-minute contact time between clients. <strong>Do NOT</strong> apply relaxer to hair with existing scalp abrasions, cuts, irritation, or if metallic dyes are present, as this will cause severe chemical burns, uncontrollable exothermic reactions, hair disintegration, and potential permanent scarring requiring medical intervention.</p><h2>Failure Recovery</h2><p>If hair becomes excessively limp or shows signs of over-processing such as a mushy texture or stretching without returning to form, immediately rinse chemical thoroughly with cool water for at least five minutes. Apply neutralizing shampoo, lather gently without manipulation, and rinse completely. Apply protein-based reconstructor to damaged areas, process according to manufacturer instructions. Follow with intensive moisturizing conditioner, then assess breakage extent. Schedule follow-up treatment and advise client on gentle handling and no further chemical services for minimum eight weeks.</p><h2>Visual Cues</h2><p>Maintain consistent one-eighth to one-quarter inch sections for uniform saturation and processing. Apply relaxer with applicator brush at forty-five-degree angle to hair shaft, ensuring cream flows from base through mid-lengths smoothly. Hair should exhibit gradual softening with natural sheen rather than chalky, dull appearance indicating over-processing. Test curl pattern by gently smoothing section; hair should straighten to desired degree without excessive stretching. Scalp should remain free of redness; any irritation signals immediate removal necessity.</p><h2>Procedure</h2><ol><li>Conduct thorough consultation examining hair porosity, elasticity, prior chemical history, and perform strand test to determine appropriate processing time and formula strength.</li><li>Drape client with waterproof cape and towels, then apply protective base cream generously to hairline, ears, nape, and entire scalp perimeter.</li><li>Section hair into four quadrants from crown to nape and ear to ear, securing each with clips for systematic application control.</li><li>Beginning in the most resistant area, apply relaxer to one-quarter inch sections from scalp to ends on virgin hair or new growth only on retouch.</li><li>Smooth product through hair shaft using applicator or back of comb, monitoring processing every three to five minutes by testing strand relaxation degree.</li><li>When desired straightness is achieved without over-processing, rinse thoroughly with lukewarm water for minimum five minutes until water runs completely clear of product.</li><li>Apply neutralizing shampoo, lather gently, and rinse completely; repeat neutralizing process two additional times to halt chemical action and restore pH balance.</li><li>Apply deep conditioning treatment, process according to directions, then rinse, towel blot, and style as desired using appropriate heat protectants and minimal tension.</li></ol>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-37-q1",
                              "question": "What is the primary chemical action that occurs during relaxer application to permanently straighten hair?",
                              "options": [
                                        "A. Breaking disulfide bonds within the hair cortex",
                                        "B. Coating the cuticle layer with silicone polymers",
                                        "C. Heating the hair shaft to denature melanin",
                                        "D. Evaporating moisture from the medulla"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Relaxers work by breaking disulfide bonds in the cortex, which allows permanent rearrangement of the hair's protein structure for straightening effects."
                    },
                    {
                              "id": "barber-lesson-37-q2",
                              "question": "When performing a relaxer retouch service, where should the chemical be applied?",
                              "options": [
                                        "A. From scalp through all previously relaxed hair",
                                        "B. Only to new growth, avoiding previously processed areas",
                                        "C. Only to the ends where damage is most visible",
                                        "D. Uniformly throughout all hair for consistent results"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Relaxer should only be applied to new growth during retouch services to prevent overlapping on previously processed hair, which causes breakage and excessive damage."
                    },
                    {
                              "id": "barber-lesson-37-q3",
                              "question": "What is the minimum rinse time required to remove relaxer chemical before neutralizing?",
                              "options": [
                                        "A. Five minutes with lukewarm water",
                                        "B. Thirty seconds with cold water",
                                        "C. Two minutes with hot water",
                                        "D. Ten minutes alternating temperatures"
                              ],
                              "correctAnswer": 0,
                              "explanation": "A minimum of five minutes of thorough rinsing with lukewarm water is essential to completely remove relaxer chemical before beginning the neutralization process."
                    },
                    {
                              "id": "barber-lesson-37-q4",
                              "question": "SCENARIO: A client arrives with visible scalp abrasions from recent braiding and requests a relaxer service. What do you do?",
                              "options": [
                                        "A. Apply extra protective base and proceed carefully",
                                        "B. Use a mild formula texturizer instead of regular relaxer",
                                        "C. Refuse service and reschedule after scalp heals completely",
                                        "D. Apply relaxer quickly to minimize scalp contact time"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Relaxer must never be applied to abraded or irritated scalp as it will cause severe chemical burns and potential scarring. The service must be postponed until complete healing occurs."
                    },
                    {
                              "id": "barber-lesson-37-q5",
                              "question": "SCENARIO: During processing you notice hair becoming mushy and stretching excessively without returning to form. Correct response?",
                              "options": [
                                        "A. Apply more relaxer to balance the chemical reaction",
                                        "B. Immediately rinse with cool water, neutralize, and apply protein treatment",
                                        "C. Continue processing to achieve maximum straightness",
                                        "D. Blow dry the hair to firm up the structure"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Mushy, overstretched hair indicates severe over-processing. Immediate rinsing, neutralizing, and protein treatment are critical to halt damage and attempt structural recovery."
                    }
          ],
        },
        {
          slug: 'barber-lesson-38',
          title: 'Scalp Treatments',
          order: 4,
          domainKey: 'chemical_services',
          objective: 'Select and apply appropriate scalp treatments for common conditions.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-shampoo-narrated.mp4',
          content: `<h2>Overview</h2><p>Scalp treatments address a range of conditions including dryness, oiliness, dandruff, and minor irritations. As a barber apprentice, you must accurately assess scalp health, select appropriate products, and apply treatments using proper techniques. Understanding the scalp's physiology and recognizing common conditions enables you to provide therapeutic services that improve client comfort and hair health. This lesson covers assessment protocols, product selection criteria, application methods, and contraindications. Effective scalp treatments require knowledge of ingredients, manual manipulation techniques, and timing. Proper execution promotes circulation, balances sebum production, and creates optimal conditions for healthy hair growth while enhancing the overall barbering experience.</p><h2>Tools Required</h2><ul><li>Shampoo bowl and adjustable chair</li><li>Scalp analysis magnifying lamp or dermatoscope</li><li>Treatment applicator bottles with precision nozzles</li><li>Scalp massage brushes with rubber or silicone bristles</li><li>Towels, capes, and neck strips</li><li>Disinfected combs and sectioning clips</li><li>Treatment products: oils, serums, medicated lotions, exfoliating scrubs</li><li>Timer for product processing</li></ul><h2>Client Assessment Decision Matrix</h2><p>IF the client presents with visible flaking and itching, THEN select anti-dandruff treatment containing zinc pyrithione or ketoconazole, apply directly to affected areas, and allow five to seven minutes processing time before rinsing. IF the client has oily scalp with clogged follicles, THEN use clarifying treatment with tea tree oil or salicylic acid, focus on problem zones, perform gentle exfoliation, and follow with balancing toner to regulate sebum production.</p><h2>Procedure</h2><ol><li>Drape client properly with cape and towel, position comfortably at shampoo bowl, and perform visual scalp analysis under adequate lighting to identify conditions.</li><li>Section hair into four quadrants using clips, part cleanly to expose scalp surface, and examine closely for inflammation, lesions, or contraindications requiring referral.</li><li>Apply selected treatment product using applicator bottle, distribute evenly across affected areas, and use fingertips to spread thin layer without oversaturating or missing spots.</li><li>Perform rotary massage using fingertip pads in circular motions, apply gentle pressure moving from hairline to crown, stimulate circulation for three to five minutes.</li><li>Allow product to process according to manufacturer instructions, typically five to fifteen minutes, monitor client comfort, and check for adverse reactions during processing time.</li><li>Rinse thoroughly with lukewarm water, ensure complete product removal from scalp and hair, and apply appropriate conditioner to hair lengths avoiding scalp if necessary.</li><li>Towel dry gently by patting rather than rubbing, examine scalp post-treatment for immediate results, and document condition plus products used in client record.</li><li>Provide homecare recommendations including product suggestions, treatment frequency, and advise client to schedule follow-up appointment to monitor progress and adjust protocol.</li></ol><h2>Safety</h2><p>All tools contacting the scalp must be disinfected using EPA-registered hospital-grade disinfectant such as Barbicide solution mixed at proper concentration, with minimum ten-minute immersion time. <strong>Do NOT apply scalp treatments if client presents with open wounds, active infections, severe inflammation, or undiagnosed lesions, as application can spread pathogens, worsen condition, cause intense pain, and create liability for practicing outside scope by treating medical conditions requiring physician care.</strong> Always perform patch test twenty-four hours prior when using new products on sensitive clients.</p><h2>Failure Mode and Recovery</h2><p>If client experiences burning sensation during treatment, the cause is typically product sensitivity or overly concentrated formula on compromised scalp barrier. Immediately rinse product completely using cool water, apply soothing aloe vera gel or chamomile compress, document incident in client record, and apply cold compress if redness persists. Offer complimentary gentle shampoo service the following week. Never reapply the same product. Always conduct patch testing for future visits and select hypoallergenic alternatives formulated for sensitive scalp conditions.</p><h2>Visual Cues</h2><p>Position client reclined at forty-five degree angle at shampoo bowl with neck comfortably supported on basin edge, ensuring proper alignment without strain. Part hair in clean, straight lines creating quarter-inch subsections that expose scalp clearly. Apply treatment in thin, visible layer resembling light glaze rather than thick paste. During massage, fingertips should maintain contact moving in consistent circles approximately one-inch diameter. Scalp should appear slightly pink from stimulation but never red or irritated. Product distribution should be even with no pooling or dry patches visible through magnification.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-38-q1",
                              "question": "What is the primary purpose of performing scalp treatments in a barbershop setting?",
                              "options": [
                                        "A. To diagnose and cure medical scalp diseases",
                                        "B. To address common conditions like dryness, oiliness, and dandruff while promoting scalp health",
                                        "C. To replace the need for dermatological consultation",
                                        "D. To eliminate the need for regular shampooing"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Scalp treatments in barbering address common non-medical conditions to improve comfort and hair health. Barbers do not diagnose or treat medical conditions, which require physician care."
                    },
                    {
                              "id": "barber-lesson-38-q2",
                              "question": "Which massage motion is recommended during scalp treatment application?",
                              "options": [
                                        "A. Linear strokes from front to back only",
                                        "B. Rotary circular motions using fingertip pads with gentle pressure",
                                        "C. Vigorous rubbing with palm of hand",
                                        "D. Tapping motions with fingernails"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Rotary circular motions with fingertip pads provide effective stimulation, promote circulation, and distribute product evenly without causing irritation or discomfort to the client."
                    },
                    {
                              "id": "barber-lesson-38-q3",
                              "question": "What is the minimum immersion time for disinfecting scalp treatment tools in Barbicide solution?",
                              "options": [
                                        "A. Ten minutes",
                                        "B. Five minutes",
                                        "C. Twenty minutes",
                                        "D. Three minutes"
                              ],
                              "correctAnswer": 0,
                              "explanation": "EPA-registered disinfectants like Barbicide require a minimum ten-minute immersion time at proper dilution to effectively eliminate pathogens and ensure client safety."
                    },
                    {
                              "id": "barber-lesson-38-q4",
                              "question": "SCENARIO: A client arrives complaining of itchy scalp with visible white flakes throughout the hair. What is the appropriate treatment approach?",
                              "options": [
                                        "A. Apply heavy conditioning oil and wrap in hot towel",
                                        "B. Refuse service and refer to dermatologist immediately",
                                        "C. Select anti-dandruff treatment with zinc pyrithione, apply to affected areas, and process for five to seven minutes",
                                        "D. Use clarifying shampoo only without additional treatment"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Visible flaking with itching indicates dandruff, a common non-medical condition. Anti-dandruff treatments containing zinc pyrithione are appropriate for barbershop application with proper processing time."
                    },
                    {
                              "id": "barber-lesson-38-q5",
                              "question": "SCENARIO: During application, your client suddenly complains of burning sensation on the scalp. What is the correct immediate response?",
                              "options": [
                                        "A. Tell client it is normal and continue with treatment",
                                        "B. Immediately rinse product completely with cool water and apply soothing gel",
                                        "C. Reduce processing time by half and then rinse",
                                        "D. Apply more product to dilute the concentration"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Burning indicates sensitivity or adverse reaction requiring immediate cessation. Complete rinsing with cool water removes the irritant, and soothing gel provides relief. Document the incident and avoid the product in future services."
                    }
          ],
        },
        {
          slug: 'barber-module-6-checkpoint',
          title: 'Chemical Services Checkpoint',
          order: 5,
          domainKey: 'chemical_services',
          objective: 'Demonstrate mastery of chemical service knowledge.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Overview</h2><p>This checkpoint validates comprehensive understanding of chemical services in barbering, including permanent waves, chemical relaxers, and texture modifications. Mastery requires knowledge of product chemistry, scalp analysis, timing protocols, neutralization procedures, and corrective techniques. You must demonstrate ability to assess client suitability, execute services safely, recognize processing stages, and troubleshoot complications. Chemical services demand precision, attention to detail, and strict adherence to manufacturer instructions and safety protocols to protect client health and achieve desired results.</p><h2>Tools Required</h2><ul><li>Chemical relaxer or perm solution with appropriate strength for hair type and desired result</li><li>Neutralizer or neutralizing shampoo specifically formulated to halt chemical processing and restore pH balance</li><li>Protective gloves, cape, and towels to prevent chemical contact with skin and clothing</li><li>Applicator bottles or brushes designed for precise product application and sectioning control</li><li>Timer with audible alarm to ensure accurate processing duration and prevent over-processing damage</li><li>Clarifying shampoo and deep conditioning treatment for pre-service preparation and post-service restoration</li><li>Plastic sectioning clips, tail comb, and wide-tooth comb for controlled application patterns</li></ul><h2>Client Assessment Decision Points</h2><p>IF the client has fine, color-treated hair, THEN select a mild-strength chemical formula, reduce processing time by 20-30 percent, and perform a test strand to assess porosity and potential breakage before full application. IF the client has coarse, resistant virgin hair, THEN use regular or super-strength formula with full recommended processing time and ensure complete saturation through all hair layers for uniform results. IF scalp shows irritation, abrasions, or recent chemical services within six weeks, THEN postpone service and reschedule after healing or waiting period.</p><h2>Procedure</h2><ol><li>Perform thorough consultation and scalp analysis, documenting previous chemical services, examining hair texture, porosity, and elasticity to determine appropriate product strength.</li><li>Drape client with chemical-safe cape and towels, apply protective barrier cream around hairline and ears to prevent skin irritation from chemical contact.</li><li>Section hair systematically into four quadrants, then subdivide into workable sections no larger than one-half inch for complete product saturation and control.</li><li>Apply chemical product beginning at most resistant areas first, maintaining consistent one-quarter inch distance from scalp, working quickly for even processing throughout.</li><li>Monitor processing continuously, checking texture and curl pattern development every three to five minutes, performing strand tests to assess chemical action progress.</li><li>Rinse thoroughly with lukewarm water for minimum five minutes until water runs clear, gently squeezing sections without tangling or manipulating hair structure.</li><li>Apply neutralizer according to manufacturer directions, timing precisely to re-bond disulfide bonds and lock in new hair configuration permanently.</li><li>Rinse neutralizer completely, apply pH-balancing conditioner, towel-dry gently, and provide aftercare instructions including twenty-four hour water avoidance and specialized product recommendations.</li></ol><h2>Safety</h2><p>All chemical services require EPA-registered hospital-grade disinfectant such as Barbicide solution for implements, with ten-minute immersion time before reuse. <strong>Do NOT apply chemical relaxers or perms over hair previously treated with metallic dyes or incompatible chemicals, as this causes severe breakage, heat generation, smoking, and potential scalp burns requiring emergency medical intervention.</strong> Always wear nitrile gloves during application and perform patch tests twenty-four to forty-eight hours before service on clients with sensitivity history. If chemical enters eyes, flush immediately with water for fifteen minutes and seek medical attention.</p><h2>Visual Cues</h2><p>Observe cream consistency during application, maintaining smooth, even coating without gaps or heavy buildup that indicates improper saturation patterns. Hair should appear uniformly dampened and darkened by product throughout all sections with visible sheen under lighting. During processing, properly softened hair exhibits smooth texture when strand is gently pressed, while under-processed hair feels rough or resistant. Over-processing shows excessive limpness, stretching without return, or webbing appearance when fingers spread through strands. Neutralizer foam should be bright white and evenly distributed, turning slightly cream-colored as oxidation occurs, indicating proper chemical bonding throughout molecular structure.</p><h2>Failure Mode and Recovery</h2><p>If hair becomes over-processed showing extreme elasticity, breakage, or gummy texture, immediately rinse all chemical product with cool water for ten minutes to halt processing. First, apply concentrated protein treatment to temporarily strengthen compromised bonds and reduce further damage. Second, follow with deep moisturizing conditioner to restore flexibility and prevent britttle fracture. Third, trim visibly compromised ends to remove weakest sections. Fourth, instruct client to avoid all heat styling for two weeks. Fifth, schedule follow-up conditioning treatments weekly for one month to rebuild internal structure progressively.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-module-6-checkpoint-q1",
                              "question": "What is the primary purpose of neutralizer in chemical texture services?",
                              "options": [
                                        "A. To re-bond disulfide bonds and permanently lock in the new hair configuration",
                                        "B. To remove excess chemical product from the hair shaft",
                                        "C. To add moisture and shine to chemically processed hair",
                                        "D. To lower the pH level before shampooing"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Neutralizer re-bonds the disulfide bonds that were broken during chemical processing, permanently fixing the new curl or straightening pattern. This oxidation process is essential to stabilize the hair structure."
                    },
                    {
                              "id": "barber-module-6-checkpoint-q2",
                              "question": "When applying chemical relaxer, where should application begin?",
                              "options": [
                                        "A. At the scalp working outward to the ends",
                                        "B. At the most resistant areas first, maintaining quarter-inch distance from scalp",
                                        "C. At the hairline moving toward the crown",
                                        "D. At previously relaxed areas to ensure even processing"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Application begins at the most resistant areas first while maintaining a quarter-inch distance from the scalp to prevent burns. This ensures even processing throughout and protects sensitive scalp tissue."
                    },
                    {
                              "id": "barber-module-6-checkpoint-q3",
                              "question": "How long should implements be immersed in Barbicide solution for proper disinfection?",
                              "options": [
                                        "A. Ten minutes minimum for hospital-grade disinfection",
                                        "B. Three minutes for quick turnaround between clients",
                                        "C. Thirty minutes for complete sterilization",
                                        "D. Five minutes for adequate cleaning"
                              ],
                              "correctAnswer": 0,
                              "explanation": "EPA-registered hospital-grade disinfectants like Barbicide require a minimum ten-minute immersion time to effectively kill pathogens and meet professional sanitation standards."
                    },
                    {
                              "id": "barber-module-6-checkpoint-q4",
                              "question": "SCENARIO: A client arrives requesting a relaxer service. During consultation, you notice her scalp has several small scratches and irritated areas. What do you do?",
                              "options": [
                                        "A. Apply extra barrier cream to the irritated areas and proceed carefully",
                                        "B. Use a milder formula and reduce processing time",
                                        "C. Postpone the service and reschedule after the scalp has healed completely",
                                        "D. Perform a strand test first to check for adverse reactions"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Chemical services must never be performed on broken, irritated, or abraded skin as chemicals will cause severe burning, pain, and potential scarring. The service must be postponed until complete healing occurs."
                    },
                    {
                              "id": "barber-module-6-checkpoint-q5",
                              "question": "SCENARIO: During processing, you perform a strand test and notice the hair stretches excessively without returning and feels gummy. Correct response?",
                              "options": [
                                        "A. Continue processing but check again in two minutes",
                                        "B. Immediately rinse with cool water, then apply protein treatment followed by deep conditioner",
                                        "C. Apply neutralizer immediately to stop the chemical action",
                                        "D. Add more product to ensure complete processing"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Excessive stretching and gummy texture indicate over-processing. Immediate cool water rinsing halts chemical action, followed by protein treatment to strengthen bonds and deep conditioning to restore moisture and prevent breakage."
                    }
          ],
        },
      ],
    }

;
