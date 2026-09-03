import type { BlueprintModule } from '../types';

export const barberModule2: BlueprintModule = {
      slug: 'barber-module-2',
      title: 'Module 2: Hair Science & Scalp Analysis',
      orderIndex: 2,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: false,
      isCritical: false,
      domainKey: 'hair_science',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'hair_structure', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'hair_growth_cycle', isCritical: true, minimumTouchpoints: 1 },
        { competencyKey: 'scalp_conditions', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'hair_texture', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-8',
          title: 'Structure of the Hair and Scalp',
          order: 1,
          domainKey: 'hair_science',
          objective: 'Identify the layers of the hair shaft and scalp anatomy.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          learningObjectives: [
            'Identify the three layers of the hair shaft: cuticle, cortex, and medulla',
            'Describe the structure of the hair follicle and its role in hair growth',
            'Explain how scalp anatomy affects service decisions',
            'Distinguish between the five layers of the scalp',
          ],
          content: `<h2>Overview</h2><p>Understanding hair and scalp structure is foundational to barbering. The hair shaft consists of three layers—cuticle, cortex, and medulla—each with distinct properties affecting texture, strength, and appearance. The scalp is living skin with specialized glands and follicles. Mastering this anatomy enables accurate assessment, appropriate service selection, and client communication. This lesson covers microscopic and macroscopic anatomy essential for safe, effective barbering practices.</p><h2>Tools Required</h2><ul><li>Magnifying glass or lighted magnifier (10x minimum)</li><li>Hair strand samples: straight, wavy, curly, coily</li><li>Scalp assessment chart or diagram</li><li>Microscope slides and cover slips (optional)</li><li>Disinfectant solution (EPA-registered quaternary ammonium or phenolic)</li><li>Disposable gloves and applicator sticks</li><li>Anatomical chart or model of hair follicle cross-section</li></ul><h2>Procedure</h2><ol><li>Don gloves and inspect client scalp under magnification, noting follicle pattern, oil distribution, and visible irritation or lesions systematically.</li><li>Examine hair samples under magnifier, identifying cuticle layer characteristics: smooth (healthy), raised (damaged), or missing sections (severe damage).</li><li>Assess cortex layer density by gently bending hair strands, observing elasticity and resistance to breakage during slight tension application.</li><li>Evaluate medulla presence in coarse hair; note that fine or thin hair may lack visible medulla under standard magnification.</li><li>Document scalp condition: oily, dry, normal, or combination; correlate to sebaceous gland activity and client hygiene practices.</li><li>Identify follicle type and density; explain findings to client using anatomical chart to set service expectations and aftercare parameters.</li><li>Apply sanitation protocol: disinfect all tools and magnification equipment with EPA-registered solution per manufacturer contact time before and after examination.</li><li>Record observations on client consultation form, noting any contraindications requiring referral to dermatologist before proceeding with chemical services.</li></ol><h2>Safety</h2><p>Sanitization is critical: all magnification tools contact scalp surfaces and must be disinfected with EPA-registered quaternary ammonium (Barbicide, Lysol) or phenolic solution for minimum 10 minutes between clients. <strong>Do NOT proceed with chemical services (color, relaxer, perm) on scalp showing active lesions, severe flaking, or open wounds; consequences include chemical burns, infection spread, and client harm.</strong> If scalp contraindications exist, document findings and recommend dermatological evaluation before rescheduling chemical services. Failure mode: Client reports scalp burning during service due to undetected sensitivity. Recovery: (1) Stop service immediately; (2) Rinse scalp thoroughly with lukewarm water for 5+ minutes; (3) Apply soothing, non-irritant conditioner; (4) Contact supervising barber; (5) Document incident and client response; (6) Advise patch test 48 hours before rescheduling.</p><h2>Decision Logic</h2><ul><li>IF hair appears fine and straight with smooth cuticle, THEN use gentle handling, avoid over-processing, and recommend protein-based treatments to strengthen cortex.</li><li>IF scalp shows seborrheic buildup or flaking, THEN recommend medicated shampoo and lighter oil products; avoid heavy pomades that trap bacteria.</li><li>IF client reports previous color damage with raised cuticle, THEN assess cortex integrity and may recommend conditioning treatments or referral before additional chemical service.</li></ul><h2>Visual Cues</h2><p>Healthy hair cuticle appears smooth, flat, and reflective under magnification; raised or splintered cuticle indicates damage or over-processing. Cortex elasticity shows as hair stretching 20-30% when wet before returning to original length; excessive stretch or snapping indicates cortex weakness. Scalp should appear pink or tan with even follicle distribution; red, inflamed, or scaly areas signal inflammation or infection requiring referral. Follicle angles determine hair texture: straight follicles produce straight hair; curved follicles (90-180°) produce wavy, curly, or coily patterns. Observe client's head position at 45° angle to assess crown density and occipital contour during consultation.</p><h2>Client Variation Scenarios</h2><p>Coarse, curly hair: cortex is denser, medulla usually visible, cuticle layers thicker; requires stronger conditioning and careful heat application to prevent frizz and breakage. Fine, straight hair: thin cortex, minimal or absent medulla, delicate cuticle easily raised; use low-alkali products and avoid excessive tension during service. Oily scalp with dry ends: sebaceous glands overactive near roots while distal hair lacks moisture; address with clarifying shampoo at scalp only and moisture-rich treatments at mid-length and ends.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-8-q1",
                              "question": "Which layer of the hair shaft is primarily responsible for hair strength and elasticity?",
                              "options": [
                                        "A. Cuticle",
                                        "B. Cortex",
                                        "C. Medulla",
                                        "D. Sebaceous gland"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The cortex is the thickest layer containing protein chains (keratin) and melanin; it determines hair strength, elasticity, and color. The cuticle protects it; the medulla is the innermost core."
                    },
                    {
                              "id": "barber-lesson-8-q2",
                              "question": "Under magnification, what does a smooth, flat cuticle layer indicate?",
                              "options": [
                                        "A. Severe damage requiring cutting",
                                        "B. Healthy, undamaged hair",
                                        "C. Excess sebum buildup",
                                        "D. Medulla exposure"
                              ],
                              "correctAnswer": 1,
                              "explanation": "A smooth, flat, reflective cuticle under magnification indicates the hair has not been over-processed and is in good condition. Raised or splintered cuticle indicates damage."
                    },
                    {
                              "id": "barber-lesson-8-q3",
                              "question": "What is the minimum magnification recommended for accurate scalp and hair examination?",
                              "options": [
                                        "A. 5x magnification",
                                        "B. 10x magnification or greater",
                                        "C. 3x magnification",
                                        "D. No magnification needed"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Professional practice requires at least 10x magnification to clearly observe cuticle condition, follicle pattern, scalp health, and potential contraindications before service."
                    },
                    {
                              "id": "barber-lesson-8-q4",
                              "question": "SCENARIO: A client presents with an active scalp lesion and requests a color service. What is the correct action?",
                              "options": [
                                        "A. Proceed with color and monitor closely",
                                        "B. Apply additional protective barrier and color",
                                        "C. Document the lesion and recommend dermatological evaluation before chemical service",
                                        "D. Use a gentler color formula to reduce irritation"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Chemical services on compromised scalp skin risk severe burns and infection. Document findings, recommend dermatologist referral, and reschedule the service after scalp heals."
                    },
                    {
                              "id": "barber-lesson-8-q5",
                              "question": "SCENARIO: During scalp examination, you notice the client's hair stretches excessively when wet and snaps without returning to original length. What does this indicate?",
                              "options": [
                                        "A. Normal elasticity; proceed with any service",
                                        "B. Cortex damage from over-processing; recommend conditioning and caution with chemical services",
                                        "C. Medulla exposure requiring immediate cutting",
                                        "D. Sebaceous gland dysfunction"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Excessive stretch with snapping indicates compromised cortex integrity from prior chemical damage or heat. Recommend protein treatments and avoid additional processing until cortex strength improves."
                    }
          ],
        },
        {
          slug: 'barber-lesson-9',
          title: 'Hair Growth Cycle',
          order: 2,
          domainKey: 'hair_science',
          objective: 'Explain the three phases of the hair growth cycle.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          content: `<h2>Overview</h2><p>The hair growth cycle consists of three distinct phases: anagen (growth), catagen (transition), and telogen (resting). Understanding these phases is essential for barbers to assess client scalp health, predict hair shedding patterns, and recommend appropriate treatments. Knowledge of the growth cycle informs cutting techniques, helps identify scalp conditions, and enables professionals to educate clients about normal hair loss and growth expectations.</p><h2>Tools Required</h2><ul><li>Magnifying glass or loupe (10x magnification)</li><li>Scalp probe or metal comb</li><li>Hair sample collection bag</li><li>Client intake form with hair history section</li><li>Disinfectant spray (EPA-approved, quaternary ammonium-based)</li><li>Disposable gloves and barrier tissues</li><li>Mirror or video scalp microscope for client education</li></ul><h2>Client Variation Decision Matrix</h2><ul><li><strong>IF</strong> client has fine, thin hair <strong>THEN</strong> expect shorter anagen phase (2-3 years) and more frequent shedding; recommend gentle handling and moisturizing treatments.</li><li><strong>IF</strong> client reports recent illness, medication change, or high stress <strong>THEN</strong> suspect telogen effluvium; observe increased shedding and advise dermatology referral if excessive.</li><li><strong>IF</strong> client has coarse, thick hair <strong>THEN</strong> expect longer anagen phase (5-7 years) and denser follicle population; cutting will appear fuller longer.</li></ul><h2>Sanitation Protocol</h2><p>Before examining any client's scalp, disinfect your magnifying glass and scalp probe using EPA-approved quaternary ammonium disinfectant spray. Allow 30 seconds contact time. Wear fresh disposable gloves for each client. Between clients, spray all tools with disinfectant and wipe with clean paper towel. Never reuse barrier tissues. This prevents cross-contamination and meets Indiana Board of Cosmetology sanitation standards.</p><h2>Critical Contraindication</h2><p><strong>DO NOT attempt to extract hair by force or aggressive pulling during scalp analysis.</strong> Forceful extraction can trigger premature catagen phase, damage follicles, and cause client pain and potential infection. This may result in temporary alopecia, client complaints, and liability issues.</p><h2>Failure Mode & Recovery</h2><p><strong>Scenario:</strong> During scalp assessment, you observe what appears to be dead (telogen) hairs but client reports sudden, excessive shedding beyond normal 50-100 hairs daily. <strong>Recovery:</strong> (1) Stop active pulling; (2) Document shedding pattern and duration in client notes; (3) Examine hair root bulb—if white, it is telogen; if black, client may have anagen effluvium; (4) Ask client about recent illness, weight loss, or medications; (5) Recommend dermatology consultation before proceeding with chemical services; (6) Schedule follow-up assessment in 4-6 weeks.</p><h2>Visual Execution Cues</h2><p>Position client under bright, natural or LED lighting. Part hair in four quadrants; examine each section systematically. Look for hair bulbs: white bulbs indicate telogen (resting), black bulbs indicate anagen (growing). Healthy scalp shows minimal visible sebum. Anagen hairs appear shiny and pigmented; telogen hairs appear matte and lighter. Observe hair angle perpendicular to scalp; anagen hairs emerge at 90 degrees, while telogen hairs may angle slightly outward.</p><h2>Procedure: Hair Growth Cycle Assessment</h2><ol><li>Cleanse hands and don fresh disposable gloves; disinfect magnifying glass and scalp probe with quaternary ammonium solution.</li><li>Seat client comfortably; explain the three-phase cycle and why you are assessing scalp health today.</li><li>Part hair into four sections (front-left, front-right, back-left, back-right) using tail comb; secure sections with clips.</li><li>Examine first section under magnification; gently (without pulling) observe 10-15 hairs, noting bulb color and root appearance.</li><li>Document bulb colors, shedding patterns, and scalp condition; repeat for remaining three sections.</li><li>Gently pluck 3-5 naturally shed hairs (client-offered) and place in sample bag; compare bulb characteristics to anagen/catagen/telogen references.</li><li>Release hair sections; educate client on findings using visual aids; explain normal shedding (50-100 daily) versus abnormal patterns.</li><li>Recommend appropriate treatment or referral based on observations; note assessment in client record for continuity of care.</li></ol><h2>Safety & Professional Standards</h2><p>Always maintain client confidentiality and document findings accurately. If scalp conditions appear infected, inflamed, or abnormal, refer client to a licensed dermatologist rather than proceeding with chemical services. Ensure proper hand hygiene, tool sanitation, and barrier precautions. Communicate clearly with clients about what you observe; avoid diagnosing medical conditions outside your scope of practice.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-9-q1",
                              "question": "During the anagen phase, which characteristic best describes the hair bulb?",
                              "options": [
                                        "A. White, club-shaped bulb indicating dormant follicle",
                                        "B. Black, pigmented bulb indicating active growth and division",
                                        "C. Elongated gray bulb indicating transition",
                                        "D. Hardened white bulb with no pigmentation"
                              ],
                              "correctAnswer": 1,
                              "explanation": "During anagen, the hair matrix actively produces new cells. The bulb appears black or dark because melanin is being incorporated into the growing hair shaft. White bulbs are telogen hairs."
                    },
                    {
                              "id": "barber-lesson-9-q2",
                              "question": "What is the typical daily hair shedding range considered normal for clients?",
                              "options": [
                                        "A. 10-25 hairs per day",
                                        "B. 50-100 hairs per day",
                                        "C. 150-200 hairs per day",
                                        "D. 250+ hairs per day"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Normal telogen shedding is 50-100 hairs daily. Hair in the resting phase naturally releases. Shedding exceeding 100 daily may indicate telogen effluvium or other conditions requiring dermatology referral."
                    },
                    {
                              "id": "barber-lesson-9-q3",
                              "question": "Which disinfectant method is required for scalp assessment tools between clients?",
                              "options": [
                                        "A. Rinse with warm water only",
                                        "B. Wipe with dry cloth",
                                        "C. Apply EPA-approved quaternary ammonium spray, allow 30 seconds contact time, then wipe clean",
                                        "D. Soak in alcohol for 5 minutes"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Indiana Board of Cosmetology standards require EPA-approved disinfectants with proper contact time. Quaternary ammonium solutions effectively kill pathogens on tools used for scalp assessment."
                    },
                    {
                              "id": "barber-lesson-9-q4",
                              "question": "SCENARIO: A client reports suddenly noticing significant hair shedding over the past two weeks, more than normal brushing out. Upon scalp examination, you observe mostly white bulbs on shed hairs. What should you do?",
                              "options": [
                                        "A. Proceed with all scheduled chemical services; shedding will resolve naturally",
                                        "B. Recommend the client see a dermatologist before proceeding; document findings and ask about recent illness or stress",
                                        "C. Immediately pluck more hairs to gather additional samples for diagnosis",
                                        "D. Prescribe a scalp treatment that will stop the shedding cycle"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Excessive shedding with white (telogen) bulbs may indicate telogen effluvium, often triggered by stress, illness, or medication changes. This requires professional medical evaluation. You should not proceed with chemical services until cleared by a dermatologist, and you cannot prescribe medical treatments."
                    },
                    {
                              "id": "barber-lesson-9-q5",
                              "question": "SCENARIO: While examining a client's scalp, you notice what appears to be an inflamed, weeping follicle with pustule formation in the occipital area. What is the correct professional response?",
                              "options": [
                                        "A. Continue with haircut and recommend the client use over-the-counter acne treatment",
                                        "B. Stop the service, do not touch the affected area, and refer the client to a dermatologist before proceeding with any chemical services",
                                        "C. Apply disinfectant directly to the area and continue with a modified service",
                                        "D. Document it as seborrheic dermatitis and recommend medicated shampoo"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Signs of infection, inflammation, or pustules indicate a scalp condition requiring medical evaluation. Barbers must not perform chemical services or aggressive manipulation on infected scalps. Professional referral protects client health and prevents service complications."
                    }
          ],
        },
        {
          slug: 'barber-lesson-10',
          title: 'Hair Texture, Density & Porosity',
          order: 3,
          domainKey: 'hair_science',
          objective: 'Assess hair texture, density, and porosity to select appropriate techniques.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          content: `<h2>Overview</h2><p>Hair texture, density, and porosity are foundational properties that determine how hair responds to cutting, styling, and chemical services. Texture refers to the diameter of individual hair strands (fine, medium, coarse). Density describes the number of hair follicles per square inch of scalp. Porosity indicates the hair's ability to absorb and retain moisture, determined by the cuticle layer's condition. Mastering assessment of these properties enables barbers to select appropriate techniques, recommend suitable products, and deliver results that meet client expectations while maintaining scalp and hair health.</p><h2>Tools Required</h2><ul><li>Pull-out hair sample card (texture reference guide with fine, medium, coarse standards)</li><li>Magnifying glass or digital microscope for strand diameter examination</li><li>Sectioning clips (minimum 4) for organized scalp assessment</li><li>Fine-tooth comb for detangling and porosity testing</li><li>Spray bottle with distilled water for hydration assessment</li><li>Sectioning cape to isolate assessment areas and prevent cross-contamination</li><li>Client consultation worksheet with texture-density-porosity documentation fields</li></ul><h2>Procedure</h2><ol><li>Drape client securely with cape; ask about current hair care routine, chemical history, and environmental exposure to inform assessment accuracy.</li><li>Section hair into four quadrants using sectioning clips; begin assessment at crown, progressing to temporal and occipital regions systematically.</li><li>Remove single strand from each quadrant; compare strand diameter against pull-out reference card under consistent lighting to determine texture classification.</li><li>Assess density by observing scalp visibility: part hair and count approximate follicles per square inch; classify as sparse, normal, or dense.</li><li>Perform porosity test by spraying small hair section with distilled water; observe how quickly water absorbs and if hair appears dull or shiny after moisture contact.</li><li>Document all findings on consultation worksheet, noting any variations across scalp regions that may affect service planning or product selection decisions.</li><li>Discuss assessment results with client; explain how texture, density, and porosity influence service outcomes and maintenance requirements moving forward.</li><li>Recommend cutting angles and techniques aligned with identified properties; explain why specific approaches optimize results for their hair type.</li></ol><h2>Decision Factors</h2><ul><li><strong>IF</strong> client has fine texture AND high porosity: THEN use moisturizing shampoo, avoid aggressive detangling, select techniques that minimize breakage (e.g., blunt cuts rather than tapered fades on delicate strands).</li><li><strong>IF</strong> client has coarse texture AND low porosity: THEN recommend clarifying shampoo, use deeper conditioning treatments, employ techniques like texturizing or point-cutting to manage density and reduce bulk.</li><li><strong>IF</strong> density is sparse: THEN avoid clipper-over-comb techniques on short lengths; use scissor-over-comb for controlled, conservative removal to preserve fullness perception.</li></ul><h2>Sanitation</h2><p>All tools contacting scalp or hair must be disinfected before use. Immerse combs, sectioning clips, and reference cards in 10% bleach solution (or hospital-grade disinfectant per state board standards) for minimum 10 minutes, then rinse thoroughly with clean water and air-dry. Pull-out reference cards should be placed in clear plastic sleeves; replace sleeve weekly or when visibly soiled. Spray bottles must be filled with fresh distilled water daily; do not reuse water between clients. Hands must be washed with antimicrobial soap before and after each client assessment.</p><h2>Contraindications</h2><p><strong>Do NOT attempt chemical relaxer or permanent wave services on hair showing signs of severe damage, breakage, or extreme porosity without consulting a licensed cosmetologist or performing a patch test first. Failure to assess porosity can result in over-processing, chemical burns to scalp, hair breakage, and potential liability claims.</strong></p><h2>Failure Mode & Recovery</h2><p><strong>Failure:</strong> Misidentifying texture as coarse when it is actually fine, leading to aggressive cutting techniques that create unwanted taper or reduce perceived volume. <strong>Recovery:</strong> (1) Stop service and re-examine strand under magnifying glass alongside reference card. (2) Compare sample against multiple reference standards to confirm actual texture. (3) Adjust blade angle and cutting pressure immediately; shift to gentler scissor-over-comb or blunt-cut approach. (4) Communicate change to client transparently, explaining texture reassessment. (5) Document correct classification in service notes for future appointments. (6) Demonstrate adapted technique on inconspicuous section before continuing visible areas.</p><h2>Visual Cues</h2><p><strong>Texture Assessment:</strong> Fine hair appears almost transparent when isolated; medium hair displays visible diameter without magnification; coarse hair shows prominent, almost wire-like strand structure. <strong>Density Observation:</strong> Sparse density reveals scalp easily when hair is parted; normal density partially conceals scalp with slight visibility; dense hair completely obscures scalp when parted. <strong>Porosity Indicators:</strong> Low porosity hair repels water droplets, appearing shiny and tightly aligned; high porosity hair absorbs water rapidly, appearing dull and slightly raised from scalp. Healthy cuticles lay flat and smooth; damaged high-porosity hair shows lifted, rough cuticle appearance and may feel rough or cottony to touch.</p><h2>Safety</h2><p>Never force combs through tangled hair when assessing wet porosity; use detangling spray and gentle pressure to avoid scalp injury. Avoid prolonged magnifying glass use; position lighting to reduce eye strain. If client reports scalp sensitivity, itching, or irritation, discontinue assessment and refer to dermatologist before proceeding with chemical services. Always perform patch tests 48 hours before chemical applications on clients with unknown history or newly identified high porosity. Maintain proper posture during assessment to prevent repetitive strain injury; position client and magnification tools at ergonomic height.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-10-q1",
                              "question": "Which of the following best defines hair porosity in professional barber context?",
                              "options": [
                                        "A. The hair's ability to absorb and retain moisture, determined by cuticle layer condition",
                                        "B. The diameter measurement of individual hair strands from follicle to tip",
                                        "C. The number of hair follicles per square inch of scalp surface",
                                        "D. The natural color pigment concentration within the hair cortex"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Porosity specifically refers to moisture absorption capacity and cuticle condition. Texture (B) is strand diameter, density (C) is follicle count, and color (D) is unrelated to porosity assessment."
                    },
                    {
                              "id": "barber-lesson-10-q2",
                              "question": "When assessing a client with fine texture and high porosity, which service approach is MOST appropriate?",
                              "options": [
                                        "A. Aggressive clipper-over-comb fading to remove bulk quickly",
                                        "B. Use moisturizing shampoo and select blunt cuts to minimize breakage risk",
                                        "C. Apply clarifying shampoo and perform heavy texturizing techniques",
                                        "D. Recommend permanent wave service to add strength to delicate strands"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Fine + high porosity hair is delicate and susceptible to breakage. Moisturizing products and conservative blunt cuts protect the hair. Aggressive techniques (A), clarifying shampoo (C), and chemical services (D) would damage this hair type."
                    },
                    {
                              "id": "barber-lesson-10-q3",
                              "question": "Which tool is essential for comparing hair strand diameter during texture assessment?",
                              "options": [
                                        "A. Pull-out hair sample reference card with fine, medium, and coarse standards",
                                        "B. Digital pH meter to measure scalp acidity levels",
                                        "C. Spectrophotometer to analyze light reflection from hair surface",
                                        "D. Moisture meter to determine water content percentage"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Pull-out reference cards provide direct visual comparison for texture classification. pH meters (B), spectrophotometers (C), and moisture meters (D) measure other properties unrelated to texture diameter assessment."
                    },
                    {
                              "id": "barber-lesson-10-q4",
                              "question": "SCENARIO: A client presents with coarse hair texture, normal density, and low porosity. Upon questioning, they reveal past relaxer use and frequent heat styling. What is your appropriate response?",
                              "options": [
                                        "A. Proceed with clipper-over-comb fade immediately; low porosity means hair is resistant",
                                        "B. Recommend clarifying shampoo, use point-cutting to manage texture, and discuss heat protectant products for maintenance",
                                        "C. Schedule chemical relaxer service to further smooth the coarse texture",
                                        "D. Defer service to cosmetologist; barbers cannot cut heat-damaged coarse hair"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Coarse + low porosity benefits from clarifying treatment and texturizing techniques. Point-cutting manages bulk; heat protectant recommendations support maintenance. Clipper technique (A) ignores texture characteristics. Relaxer service (C) risks over-processing. Deferral (D) is unnecessary; barbers assess and cut all texture types."
                    },
                    {
                              "id": "barber-lesson-10-q5",
                              "question": "SCENARIO: During density assessment, you part the client's hair and observe scalp visibility throughout. Upon further examination with magnification, you realize you initially misidentified texture as medium when it is actually fine. What is the correct corrective action?",
                              "options": [
                                        "A. Continue service with original medium-texture cutting technique; admitting error reduces client confidence",
                                        "B. Stop service, re-examine strand against reference card, document correct classification, and adjust blade angle and pressure to gentler techniques before continuing",
                                        "C. Complete the cut using medium-texture approach, then recommend corrective service in two weeks",
                                        "D. Ask client if they prefer medium or fine haircut result; let them decide which technique to use"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Professional recovery requires immediate reassessment, transparent communication, and technique adjustment before continuing. Proceeding with wrong approach (A, C) risks damage. Client decisions on technique (D) are barber's responsibility. Correct identification protects hair integrity and service quality."
                    }
          ],
        },
        {
          slug: 'barber-lesson-11',
          title: 'Scalp Conditions & Disorders',
          order: 4,
          domainKey: 'hair_science',
          objective: 'Identify common scalp conditions and determine when to refer clients.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-shampoo-narrated.mp4',
          content: `<h2>Overview</h2><p>Barbers must identify common scalp conditions and disorders to provide safe, effective services and recognize when professional medical referral is necessary. This lesson covers clinical assessment techniques, condition recognition, sanitation protocols, and appropriate boundaries of barber scope of practice. Proper scalp analysis protects client health and establishes professional credibility.</p><h2>Tools Required</h2><ul><li>Scalp magnifier or headband magnifying glass (10x magnification)</li><li>Sterilized metal scalp probe or applicator stick</li><li>Wood's lamp for fungal detection</li><li>Disposable gloves (nitrile, non-powdered)</li><li>Barrier spray or disinfectant (70% isopropyl alcohol or EPA-registered spray)</li><li>Client intake form with scalp condition checklist</li><li>Referral resource list (dermatologist, trichologist contacts)</li><li>Clean towels and headrest covers</li></ul><h2>Decision Scenarios</h2><ul><li><strong>IF</strong> client has oily scalp with visible flaking and mild odor, <strong>THEN</strong> assess for seborrheic dermatitis; observe distribution and severity; if confined to scalp and mild, proceed with gentle service; if spreading to face or severe, refer to dermatologist.</li><li><strong>IF</strong> client reports itching, burning, or scaling following a recent chemical service, <strong>THEN</strong> examine for contact dermatitis; check timing of onset relative to service date; if symptoms appeared within 24-48 hours post-service, document and refer; do not repeat similar chemical service without medical clearance.</li><li><strong>IF</strong> scalp shows pustules, crusting, or weeping areas, <strong>THEN</strong> suspect bacterial or fungal infection; do not proceed with cutting or chemical services; refer client to physician immediately; maintain sanitation barriers.</li></ul><h2>Sanitation Protocol</h2><p>Before and after every scalp assessment, sanitize all contact surfaces and tools. Use EPA-registered disinfectant spray on magnifying equipment and headrest covers between clients. Sterilize metal probes in a dry-heat sterilizer at 320°F for 15 minutes or autoclave at 250°F for 3 minutes. Always wear fresh nitrile gloves during assessment. If client has known fungal or parasitic infection, use disposable barrier cape and isolate all contaminated materials in sealed biohazard bag per Indiana health code requirements.</p><h2>Critical Contraindication</h2><p><strong>DO NOT cut, shave, treat, or apply any chemical service to a scalp displaying signs of active ringworm (tinea capitis), lice infestation, or bacterial infection.</strong> Continuing service spreads contagion to other clients, violates state board regulations, and exposes you to disciplinary action or license suspension. Immediate referral to physician is legally and ethically required.</p><h2>Failure Mode & Recovery</h2><p><strong>Failure:</strong> During scalp examination, you misidentify seborrheic dermatitis as simple dandruff and proceed with harsh scrubbing or medicated treatment. Client experiences increased inflammation, redness, and burning within hours. <strong>Recovery Steps:</strong> (1) Stop service immediately and explain findings. (2) Document what you observed and client's reaction. (3) Recommend client apply cool compress and avoid hot water. (4) Provide written referral to dermatologist with specific concern noted. (5) Follow up via phone within 24 hours. (6) Discuss with supervising barber or instructor to refine your assessment technique. (7) Review condition characteristics to prevent recurrence.</p><h2>Visual Execution Cues</h2><p>Position client upright in chair with neck supported on headrest. Part hair systematically using metal probe, working from center front scalp backward in 1-inch sections. Maintain magnifier at 2-3 inches from scalp surface. Look for: raised or flat red patches (erythema), white or yellow scaling (desquamation), pustules or crusts (exudation), areas of hair loss (alopecia), or threadlike objects on hair shafts (lice nits). Compare left and right sides; note symmetry or localization. Healthy scalp appears pale pink to tan with minimal visible scaling and no odor.</p><h2>Procedure</h2><ol><li>Review client intake form and ask targeted questions: recent itching, flaking, scaling, hair loss, or chemical exposure. Note any medications or allergies affecting scalp.</li><li>Don fresh nitrile gloves and inspect scalp under natural light first, observing overall color, texture, and visible lesions or patterns without touching.</li><li>Position magnifier 2-3 inches above scalp. Systematically part hair in 1-inch sections from front to crown, examining each area for inflammation, scaling, pustules, crusting, or foreign objects.</li><li>Use sterilized metal probe to gently separate hair and observe scalp surface; note distribution (localized vs. generalized) and severity of any abnormalities.</li><li>If fungal infection suspected, use Wood's lamp in dimmed room; tinea capitis shows blue-green fluorescence. Document findings and do not proceed with service.</li><li>Assess client sensation: ask if scalp is tender or painful. Extreme tenderness with visible lesions indicates infection or inflammatory condition requiring referral.</li><li>If condition is within barber scope (mild dandruff, seborrhea without active inflammation), document findings and recommend appropriate home care or gentle scalp massage service.</li><li>For any suspicious, severe, spreading, or unidentifiable condition, provide written referral to dermatologist or physician; do not attempt treatment or chemical service.</li><li>Document all findings on client card with date, description, and any referrals made; maintain confidentiality per HIPAA principles.</li><li>Dispose of all materials in appropriate waste containers; spray chair and headrest with disinfectant; remove and discard gloves in biohazard container.</li></ol><h2>Safety</h2><p><strong>Do NOT diagnose medical conditions.</strong> Your role is to identify signs and refer appropriately. Never apply medicated products, shampoos, or treatments to an undiagnosed scalp condition. Always use barrier protection and maintain strict sanitation to prevent cross-contamination of fungal or parasitic infections. Maintain confidentiality regarding any scalp conditions observed. If client refuses referral for a serious condition, document the conversation and your recommendation in writing. Understand Indiana barber scope of practice: you can assess, observe, and refer, but cannot treat medical conditions. Keep current contact information for local dermatologists and trichologists for client referrals.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-11-q1",
                              "question": "Which tool is most appropriate for systematically examining scalp sections during condition assessment?",
                              "options": [
                                        "A. Straight razor",
                                        "B. Sterilized metal scalp probe and magnifier",
                                        "C. Electric clipper",
                                        "D. Standard comb"
                              ],
                              "correctAnswer": 1,
                              "explanation": "A sterilized metal probe allows gentle separation of hair to view scalp surface clearly, while a magnifier (10x) provides clinical detail. Razors, clippers, and combs are cutting/styling tools, not diagnostic instruments."
                    },
                    {
                              "id": "barber-lesson-11-q2",
                              "question": "What does blue-green fluorescence under a Wood's lamp indicate on the scalp?",
                              "options": [
                                        "A. Healthy scalp with normal bacteria",
                                        "B. Contact dermatitis or allergic reaction",
                                        "C. Suspected tinea capitis (ringworm)",
                                        "D. Seborrheic dermatitis or dandruff"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Wood's lamp produces characteristic blue-green fluorescence when tinea capitis fungal spores are present. This is a clinical diagnostic sign requiring immediate referral to a physician. Other conditions do not produce this fluorescence."
                    },
                    {
                              "id": "barber-lesson-11-q3",
                              "question": "Which scalp condition is WITHIN the barber scope of practice to address with a gentle service?",
                              "options": [
                                        "A. Mild seborrhea with flaking but no active inflammation",
                                        "B. Active ringworm with pustules and crusting",
                                        "C. Bacterial scalp infection with weeping lesions",
                                        "D. Lice infestation with visible nits"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Mild seborrhea without active inflammation (redness, pustules, crusting) is within scope; you can provide gentle scalp massage and recommend home care. Active infections, ringworm, and parasitic infestations require immediate physician referral and are contraindications to service."
                    },
                    {
                              "id": "barber-lesson-11-q4",
                              "question": "SCENARIO: A client presents with tender, localized pustules and crusting on the scalp. Yellow fluid is visible on the affected area. What is your correct response?",
                              "options": [
                                        "A. Proceed with haircut using careful technique around the affected area.",
                                        "B. Apply a medicated scalp treatment to address the infection.",
                                        "C. Stop service immediately, document findings, and provide written referral to physician. Do not proceed with any cutting or chemical service.",
                                        "D. Use the Wood's lamp to confirm the condition, then treat with antiseptic spray."
                              ],
                              "correctAnswer": 2,
                              "explanation": "Pustules, crusting, and exudate indicate active bacterial or fungal infection. This is a contraindication to all barber services. Immediate physician referral is legally and ethically required. Continuing service spreads infection and violates state regulations. Never attempt treatment of active infections."
                    },
                    {
                              "id": "barber-lesson-11-q5",
                              "question": "SCENARIO: During scalp examination, you misidentify mild seborrheic dermatitis as simple dandruff and perform harsh scalp scrubbing. Within two hours, the client reports increased burning and visible redness. What is your correct recovery step?",
                              "options": [
                                        "A. Recommend the client use ice and a gentle shampoo at home and schedule another service.",
                                        "B. Stop immediately, apologize, document the incident, apply cool compress guidance, and refer to dermatologist with written notes on your findings and the client's reaction.",
                                        "C. Explain that this is a normal reaction and the condition will improve in a few days.",
                                        "D. Apply soothing lotion to the scalp to reduce inflammation and reassure the client."
                              ],
                              "correctAnswer": 1,
                              "explanation": "When a client experiences adverse reaction to your service, you must immediately stop, document everything, provide comfort guidance, and refer to a medical professional. This protects the client, documents your professional response, and creates a record for your protection. Never minimize client symptoms or attempt further treatment."
                    }
          ],
        },
        {
          slug: 'barber-lesson-12',
          title: 'Client Consultation',
          order: 5,
          domainKey: 'hair_science',
          objective:
            'Conduct a professional client consultation to assess needs and set expectations.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-consultation-narrated.mp4',
          content: `<h2>Overview</h2><p>Client consultation is the foundation of every successful barber service. A professional consultation assesses the client's hair type, scalp condition, lifestyle, and expectations while establishing trust and setting realistic service outcomes. This lesson teaches apprentices how to conduct thorough consultations using systematic observation, targeted questioning, and clear communication to deliver customized barbering services that exceed client expectations.</p><h2>Tools Required</h2><ul><li>Consultation card or digital intake form</li><li>Hand mirror and wall-mounted mirror for client viewing</li><li>Scalp analysis light or magnifying glass</li><li>Color swatches or style reference photos</li><li>Disposable gloves for scalp examination</li><li>Disinfectant spray (EPA-approved, such as Barbicide or hospital-grade quaternary ammonium solution)</li><li>Clean towel for draping during assessment</li></ul><h2>Decision Matrix: Hair Type & Scalp Variations</h2><p><strong>IF</strong> client has fine, thin hair with visible scalp: <strong>THEN</strong> recommend shorter lengths, lighter products, and frequent trims to maintain shape and avoid matting. Avoid heavy conditioning treatments that weigh hair down.</p><p><strong>IF</strong> client presents with oily scalp but dry ends: <strong>THEN</strong> assess for buildup from product misuse, recommend clarifying wash monthly, lightweight pomade on ends only, and oil-controlling shampoo for scalp.</p><p><strong>IF</strong> client has textured or curly hair with visible dryness or flaking: <strong>THEN</strong> examine for fungal conditions versus simple dehydration, recommend moisture-rich products, and refer to dermatologist if scaling persists after two weeks.</p><h2>Sanitation Protocol</h2><p>Before and after each consultation, disinfect all tools and surfaces. Spray consultation mirrors, color swatches, and magnifying glasses with EPA-approved Barbicide spray or equivalent hospital-grade disinfectant. Allow 10-second contact time. Use fresh disposable gloves when examining scalp; remove gloves immediately after assessment and dispose in biohazard container. Wash hands with antimicrobial soap for 20 seconds. Never reuse consultation cards without sanitizing clipboard surfaces between clients.</p><h2>Critical Contraindication</h2><p><strong>Do NOT proceed with any scalp service if you observe signs of contagious conditions such as active ringworm, head lice, severe psoriasis with open lesions, or bacterial infection.</strong> Proceeding exposes you, other clients, and the barbershop to legal liability, regulatory violations, and license suspension. Always refer the client to a physician, document the observation in writing, and inform the shop owner immediately.</p><h2>Failure Mode & Recovery</h2><p><strong>Failure:</strong> Client states they want a specific style, but after consultation you realize their hair texture cannot achieve that look without chemical treatment or excessive damage. <strong>Recovery steps:</strong> (1) Acknowledge their desired outcome respectfully. (2) Explain the hair science limitation clearly using the mirror to show texture and growth patterns. (3) Show photos of similar styles achievable with their hair type. (4) Offer a modified version that approximates their goal while maintaining hair health. (5) Document the conversation and recommendation on their consultation card. (6) Follow up at next visit to confirm satisfaction and adjust expectations collaboratively.</p><h2>Visual Execution Cues</h2><p>Position the client upright in the chair with shoulders relaxed and head level with yours. Use cross-lighting (natural light from window plus overhead fixture) to observe scalp color, texture, and condition clearly. Part hair in three sections: center crown, left and right sides. Examine at 45-degree angles by lifting sections toward you. Healthy scalp appears light pink with no visible flaking, inflammation, or odor. Hair should feel smooth when stroked from root to tip, with consistent diameter and shine. Document any asymmetries, scars, moles, or unusual features that may affect cutting angles or safety.</p><h2>Step-by-Step Consultation Procedure</h2><ol><li>Greet client warmly, offer refreshment, and seat them comfortably. Drape shoulders with clean towel and position mirror for full-face and head visibility from both angles.</li><li>Begin conversation by asking about their occupation, hobbies, and hair maintenance routine to understand lifestyle demands and time available for grooming.</li><li>Ask about previous haircuts: what they liked, disliked, and why. Inquire about frequency of visits and current products they use at home.</li><li>Show reference photos or style examples and ask clarifying questions about length, fade depth, texture preference, and overall aesthetic direction they envision.</li><li>Don safety gloves and perform systematic scalp examination by parting hair in sections, observing color, texture, moisture level, and any signs of irritation or infection.</li><li>Assess hair density, diameter, and growth patterns by lifting sections and observing how hair falls naturally and resists or follows gravity and directional flow.</li><li>Discuss findings with client in simple, non-technical language. Explain any limitations or recommendations based on hair type, scalp health, and their stated lifestyle.</li><li>Document all information on consultation card including hair type, scalp condition, style preference, contraindications, and any special requests or allergies.</li><li>Set clear expectations by explaining the recommended service, timeframe, aftercare instructions, and maintenance frequency needed to sustain the style.</li><li>Confirm client understanding and gain their verbal agreement before beginning the actual service. Ask if they have questions or concerns.</li></ol><h2>Safety</h2><p>Always wear disposable gloves during scalp examination. Never use personal tools or equipment that has not been disinfected. Maintain professional distance and respect client comfort; ask permission before touching their hair. If client reports pain, tenderness, or discomfort during assessment, stop immediately and refer to medical provider. Document any observed skin conditions, allergies, or sensitivities. Keep consultation records confidential and secure. If you observe signs of abuse, neglect, or trafficking, follow mandatory reporting procedures outlined in your barbershop policy and Indiana law.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-2-q1",
                              "question": "What is the primary purpose of a professional client consultation in barbering?",
                              "options": [
                                        "A. To upsell additional products to the client",
                                        "B. To assess client needs, hair type, scalp condition, and set realistic expectations",
                                        "C. To determine how much to charge for the service",
                                        "D. To complete paperwork as quickly as possible"
                              ],
                              "correctAnswer": 1,
                              "explanation": "A consultation assesses the client's hair characteristics, health, and expectations to deliver customized, safe services. While documentation and pricing occur, the primary purpose is understanding the client's needs and educating them on achievable outcomes."
                    },
                    {
                              "id": "barber-lesson-2-q2",
                              "question": "Which of the following is the correct disinfection procedure for consultation mirrors?",
                              "options": [
                                        "A. Wipe with dry cloth between clients",
                                        "B. Spray with EPA-approved disinfectant, allow 10-second contact time, then wipe clean",
                                        "C. Rinse with warm water only",
                                        "D. Soak in Barbicide overnight once per week"
                              ],
                              "correctAnswer": 1,
                              "explanation": "EPA-approved disinfectants like Barbicide require proper contact time (typically 10 seconds) to kill pathogens. Dry wiping and water rinses are insufficient. Overnight soaking may be part of maintenance but cannot replace between-client sanitation."
                    },
                    {
                              "id": "barber-lesson-2-q3",
                              "question": "What visual appearance indicates a healthy scalp during consultation?",
                              "options": [
                                        "A. Dark red or inflamed surface with visible flaking",
                                        "B. Light pink color with no flaking, inflammation, or odor, consistent throughout",
                                        "C. Yellow or greasy appearance with strong odor",
                                        "D. White or chalky patches indicating good exfoliation"
                              ],
                              "correctAnswer": 1,
                              "explanation": "A healthy scalp is light pink, free from inflammation, flaking, and odor. Red, yellow, white patches, or strong odors indicate conditions requiring medical referral or product adjustment."
                    },
                    {
                              "id": "barber-lesson-2-q4",
                              "question": "SCENARIO: During consultation, you observe what appears to be active ringworm on the client's scalp with visible circular lesions and scaling. What is your correct response?",
                              "options": [
                                        "A. Proceed with the haircut but use extra disinfectant afterward",
                                        "B. Tell the client you can treat it with a special shampoo from your barber supply",
                                        "C. Stop immediately, do not touch the scalp further, refer to physician, document observation, inform shop owner, and reschedule after medical clearance",
                                        "D. Suggest the client come back after applying over-the-counter antifungal cream"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Ringworm is contagious and legally reportable. Proceeding creates liability, health risk, and potential regulatory violations. Medical referral is mandatory. Documentation protects you, the client, and the barbershop."
                    },
                    {
                              "id": "barber-lesson-2-q5",
                              "question": "SCENARIO: During consultation, the client requests a fade with very short sides and requests their hair be cut in a way that their visible scalp scar from previous surgery is concealed as much as possible. How should you respond?",
                              "options": [
                                        "A. Tell them the scar will always be visible and refuse to accommodate their request",
                                        "B. Acknowledge the scar, listen to their preference, show them styling options that work with their hair type and scalp shape, document their request, and explain how you'll position the fade to minimize visibility while maintaining style integrity",
                                        "C. Cut the hair exactly as requested without discussing the scar to avoid embarrassment",
                                        "D. Recommend they grow their hair longer instead to cover the scar"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Professional consultation requires acknowledging client concerns with sensitivity, offering practical solutions, and documenting preferences. Respecting the client's goals while using your technical expertise builds trust and ensures they feel heard and cared for."
                    }
          ],
        },
        {
          slug: 'barber-lesson-13',
          title: 'Shampoo & Scalp Massage',
          order: 6,
          domainKey: 'hair_science',
          objective: 'Perform a professional shampoo service and scalp massage.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-shampoo-narrated.mp4',
          content: `<h2>Overview</h2><p>Professional shampoo and scalp massage are foundational barbering services that cleanse hair, stimulate blood circulation, and provide therapeutic relaxation. Mastering proper technique protects scalp health, enhances client comfort, and builds the trust essential to a thriving barbering practice. This lesson covers assessment, safe product selection, and execution standards for all hair and scalp types.</p><h2>Tools Required</h2><ul><li>Shampoo basin or sink with adjustable water temperature and pressure controls</li><li>Barbicide or EPA-registered disinfectant for tools and surfaces</li><li>Clean towels (minimum two: one neck protector, one head wrap)</li><li>pH-balanced shampoo appropriate for client hair type</li><li>Scalp massager or fingertips for therapeutic massage application</li><li>Water thermometer to verify safe temperature (95–110°F)</li><li>Comb or brush for gentle detangling post-shampoo</li></ul><h2>Client Assessment &amp; Variation</h2><p><strong>IF</strong> client has fine or thinning hair, <strong>THEN</strong> use gentle circular motions with light pressure and volumizing shampoo; avoid vigorous friction. <strong>IF</strong> client presents with oily scalp or dandruff, <strong>THEN</strong> apply clarifying or medicated shampoo and focus massage on scalp for 3–5 minutes to increase circulation. <strong>IF</strong> client reports scalp sensitivity or recent color treatment, <strong>THEN</strong> use sulfate-free, color-safe shampoo and reduce water temperature to 100°F maximum.</p><h2>Sanitation Protocol</h2><p>Before each service, sanitize the shampoo basin with Barbicide solution for 10 minutes or use EPA-approved spray disinfectant. Wash hands thoroughly with antimicrobial soap. Inspect towels for stains or odors; use only fresh, clean linens for each client. If using a scalp massager tool, submerge in Barbicide for the required contact time. Replace water in the basin between clients and check temperature with a thermometer to prevent scalding.</p><h2>Critical Contraindication</h2><p><strong>Do NOT proceed with shampooing if the client has open wounds, severe burns, or acute scalp infections (ringworm, impetigo, or oozing lesions).</strong> Performing a shampoo under these conditions risks spreading infection, increases client pain, causes cross-contamination, and violates Indiana barber licensing regulations. Always refer the client to a dermatologist and document the referral in writing.</p><h2>Failure Mode: Water Temperature Shock</h2><p><strong>Cause:</strong> Water suddenly becomes too hot, causing client discomfort or scalp burn. <strong>Recovery Step 1:</strong> Immediately reduce water temperature to lukewarm (below 100°F). <strong>Step 2:</strong> Pause the service and ask the client if they are okay. <strong>Step 3:</strong> Test water on your inner wrist before resuming. <strong>Step 4:</strong> Resume shampooing with gradual temperature increases, communicating each change to the client. <strong>Step 5:</strong> Document the incident and inform your instructor or supervisor.</p><h2>Visual Execution Cues</h2><p>Position the client's head at a 45-degree angle over the basin, with the nape resting securely on the rim. The client's shoulders should be covered with a towel and cape to prevent water drips. Fingers and thumbs work in rhythmic, overlapping circles across the scalp, moving from the hairline toward the crown and down the occipital area. The massage should appear fluid and synchronized; the client's scalp skin should move slightly beneath your fingers, indicating proper pressure—not so light as to tickle, not so deep as to cause tenderness.</p><h2>Step-by-Step Procedure</h2><ol><li>Greet client, review any scalp or hair concerns, and select appropriate shampoo product based on hair type and condition.</li><li>Drape client with clean neck towel and cape; adjust water temperature to 100–105°F and test on your wrist before wetting hair.</li><li>Wet hair thoroughly from hairline to nape, using gentle water pressure to avoid splashing; ensure scalp is saturated evenly.</li><li>Apply shampoo using one quarter-sized amount; distribute across scalp using fingertips in systematic circular motions, section by section.</li><li>Perform 3–5 minute scalp massage using alternating thumbs and fingers, working from temporal areas toward the center crown and down to the nape.</li><li>Rinse thoroughly with lukewarm water, ensuring no shampoo residue remains; repeat rinse until water runs clear.</li><li>Optional: Apply conditioner to ends for 1–2 minutes if hair type requires, then rinse completely with cool water to seal cuticles.</li><li>Gently squeeze excess water from hair; wrap head in clean towel and allow client to sit upright for 1–2 minutes before proceeding.</li></ol><h2>Safety &amp; Compliance</h2><p>Always maintain professional boundaries during scalp massage—keep contact to the scalp and neck area only. Monitor the client's comfort verbally and non-verbally throughout. Never use products not listed on the salon's approved inventory. Document any client reactions or scalp abnormalities observed during the service. Follow Indiana State Board of Cosmetology &amp; Barbers regulations regarding sanitation, water safety, and professional conduct.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-13-q1",
                              "question": "What is the recommended water temperature range for professional shampooing?",
                              "options": [
                                        "A. 110–120°F to ensure deep cleansing",
                                        "B. 95–110°F to prevent scalp irritation and burns",
                                        "C. 70–80°F for client comfort",
                                        "D. 120°F or higher for sanitization"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Water between 95–110°F is warm enough for effective cleansing and massage without causing scalp burns or discomfort. Temperatures above 110°F increase risk of thermal injury; below 95°F may feel uncomfortably cold and reduce product effectiveness."
                    },
                    {
                              "id": "barber-lesson-13-q2",
                              "question": "Which shampoo product selection is correct for a client with fine, thinning hair?",
                              "options": [
                                        "A. Heavy moisturizing shampoo with strong lather",
                                        "B. Clarifying shampoo with vigorous massage",
                                        "C. Gentle, volumizing shampoo with light pressure and minimal friction",
                                        "D. Medicated shampoo regardless of scalp condition"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Fine and thinning hair requires gentle handling to prevent breakage. Volumizing formulas add body without weight, and light pressure during massage protects delicate strands. Heavy moisturizers and vigorous friction would cause additional hair loss and damage."
                    },
                    {
                              "id": "barber-lesson-13-q3",
                              "question": "According to sanitation protocol, how should a shampoo basin be disinfected between clients?",
                              "options": [
                                        "A. Rinse with hot water only",
                                        "B. Submerge tools in Barbicide for 10 minutes or use EPA-approved spray disinfectant",
                                        "C. Wipe with a damp cloth",
                                        "D. Replace water without additional sanitization"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Barbicide immersion for 10 minutes or EPA-registered spray disinfectants are required by Indiana barber regulations to eliminate pathogens. Hot water alone and wiping are insufficient to meet state sanitation standards and protect against cross-contamination."
                    },
                    {
                              "id": "barber-lesson-13-q4",
                              "question": "SCENARIO: A client presents with an oozing scalp lesion and reports it appeared three days ago. What is your correct action?",
                              "options": [
                                        "A. Proceed with shampooing using medicated shampoo only",
                                        "B. Perform a brief scalp massage to stimulate healing",
                                        "C. Proceed with shampooing but use extra Barbicide afterward",
                                        "D. Decline the service, refer the client to a dermatologist, and document the referral in writing"
                              ],
                              "correctAnswer": 3,
                              "explanation": "Oozing lesions indicate a possible infection (ringworm, impetigo, etc.). Shampooing risks spreading infection, causes pain, and violates licensing regulations. Referral to a dermatologist is mandatory, and all barbering services must be declined until cleared by a healthcare provider."
                    },
                    {
                              "id": "barber-lesson-13-q5",
                              "question": "SCENARIO: During shampooing, the water suddenly becomes too hot and the client flinches. What is your immediate corrective response?",
                              "options": [
                                        "A. Continue at current temperature; the client will adjust",
                                        "B. Immediately reduce water temperature to lukewarm, pause the service, ask if the client is okay, then test water on your wrist before resuming",
                                        "C. Stop all water flow and proceed with dry shampoo instead",
                                        "D. Blame the water heater and apologize without taking action"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Immediate temperature reduction prevents scalp burns and demonstrates professional care. Pausing to check on the client shows attentiveness, testing water on your wrist prevents recurrence, and resuming with clear communication rebuilds client trust and safety."
                    }
          ],
        },
        {
          slug: 'barber-module-2-checkpoint',
          title: 'Hair Science Checkpoint',
          order: 7,
          domainKey: 'hair_science',
          objective: 'Demonstrate mastery of hair science and scalp analysis.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Overview</h2><p>Hair science and scalp analysis form the foundation of professional barbering. This checkpoint verifies your ability to identify hair types, scalp conditions, and appropriate service recommendations. Mastery ensures client safety, satisfaction, and proper service selection based on individual characteristics.</p><h2>Tools Required</h2><ul><li>Magnifying glass or lighted magnifier</li><li>Scalp analysis chart or reference guide</li><li>Hair type classification cards</li><li>Disinfectant spray (EPA-registered barbicide solution)</li><li>Clean towels and drapes</li><li>Sectioning clips and comb</li><li>Dermoscope or Wood's lamp (optional advanced tool)</li></ul><h2>Decision Matrix: Client Hair & Scalp Variations</h2><p><strong>IF</strong> client presents with fine, straight hair: THEN recommend conservative fade heights and avoid aggressive texturizing to prevent breakage. <strong>IF</strong> client has coily or textured hair: THEN select appropriate clipper guards and consider edge work techniques that complement curl pattern. <strong>IF</strong> client displays flaking or visible irritation on scalp: THEN assess for dandruff versus dermatitis and recommend professional scalp treatment before cutting service.</p><h2>Sanitation Protocol</h2><p>All tools must be cleaned and disinfected using EPA-registered barbicide solution per Indiana State Board guidelines. Immerse implements in solution for minimum 15 minutes. All combs, brushes, and clippers contact skin and must be disinfected between clients. Work surface and chair must be sprayed with disinfectant and wiped clean with disposable towel after each client.</p><h2>Critical Contraindication</h2><p><strong>DO NOT attempt to cut or treat hair showing signs of active fungal infection, severe dermatitis, or open sores on the scalp.</strong> Proceeding risks cross-contamination, client harm, regulatory violation, and potential license disciplinary action. Refer client to dermatologist and document refusal in client record.</p><h2>Failure Mode & Recovery</h2><p><strong>Failure:</strong> Misidentified scalp condition as non-contagious when client actually has tinea capitis (ringworm). <strong>Recovery Step 1:</strong> Stop service immediately upon recognition of circular patches with inflammation. Step 2: Disinfect all tools used. Step 3: Politely inform client condition requires medical evaluation before barbering services. Step 4: Recommend dermatologist referral. Step 5: Document incident and condition observation in client file. Step 6: Disinfect entire workstation and chair per protocol.</p><h2>Visual Execution Cues</h2><p>Position client facing mirror with good overhead lighting. Scalp should be visible in sections; part hair systematically from front hairline to nape in half-inch sections. Healthy scalp appears uniform color, free of flaking or inflammation. Hair shaft should lie flat when combed; cuticle should reflect light evenly. Assess hair diameter by comparison to reference fiber samples. Note any areas of excessive oiliness, dryness, or discoloration as indicators of condition type.</p><h2>Step-by-Step Procedure</h2><ol><li>Drape client properly and wash hands; don clean gloves if necessary for detailed scalp examination and analysis.</li><li>Part hair into five sections using clips; create vertical sections from center front to nape dividing crown area into quadrants.</li><li>Examine scalp under each section using magnifying glass, noting color, texture, flaking, redness, or unusual odor indicators.</li><li>Feel scalp texture with fingertips; note tightness, oiliness, or dryness; compare findings to scalp analysis chart provided.</li><li>Assess individual hair strand diameter, elasticity, and porosity by stretching single strands and observing recovery and moisture absorption.</li><li>Determine overall hair type classification using reference guide; document findings in client service record clearly.</li><li>Recommend appropriate service plan based on analysis; discuss maintenance and home care aligned with identified hair type.</li><li>Disinfect magnifying glass and all tools used during analysis with EPA-registered solution before next client service begins.</li></ol><h2>Safety & Compliance Notes</h2><p>Always maintain professional boundaries during scalp analysis. Refer clients with suspicious lesions, infections, or dermatological conditions to medical professionals. Document all findings and recommendations. Maintain client privacy and confidentiality regarding any scalp or hair condition observations. Follow Indiana State Board regulations regarding scope of practice; barbers diagnose conditions for service appropriateness only, not medical diagnosis.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-module-2-checkpoint-q1",
                              "question": "What is the minimum immersion time for tools in EPA-registered barbicide disinfectant solution?",
                              "options": [
                                        "A. 15 minutes",
                                        "B. 5 minutes",
                                        "C. 30 minutes",
                                        "D. 1 minute"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Indiana State Board regulations and EPA guidelines require minimum 15-minute immersion in registered barbicide solution for proper disinfection of implements that contact skin."
                    },
                    {
                              "id": "barber-module-2-checkpoint-q2",
                              "question": "When analyzing a client's hair type, which tool provides the most detailed magnified view of scalp condition?",
                              "options": [
                                        "A. Regular comb",
                                        "B. Magnifying glass or lighted magnifier",
                                        "C. Mirror only",
                                        "D. Visual inspection without tools"
                              ],
                              "correctAnswer": 1,
                              "explanation": "A magnifying glass or lighted magnifier allows detailed visualization of scalp condition, hair shaft characteristics, and potential issues that are invisible to the naked eye."
                    },
                    {
                              "id": "barber-module-2-checkpoint-q3",
                              "question": "Which of the following is NOT an appropriate response to identifying a fungal scalp infection?",
                              "options": [
                                        "A. Stop service immediately and refer to dermatologist",
                                        "B. Proceed with service and apply medicated product",
                                        "C. Document findings in client record",
                                        "D. Disinfect all tools used"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Proceeding with service on a fungal infection risks cross-contamination, violates health regulations, and causes client harm. Immediate referral and service termination are required by law."
                    },
                    {
                              "id": "barber-module-2-checkpoint-q4",
                              "question": "SCENARIO: A client presents with visible flaking, redness on the scalp, and reports itching. You observe this during initial consultation. What do you do?",
                              "options": [
                                        "A. Begin cutting immediately; the condition is not your concern",
                                        "B. Apply conditioner to mask the appearance and proceed with service",
                                        "C. Assess whether this is dandruff or dermatitis; recommend professional scalp treatment before cutting service",
                                        "D. Tell the client to wash their hair more frequently"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Professional assessment distinguishes between treatable dandruff and conditions requiring medical referral. Proper diagnosis guides appropriate service recommendations and protects client health and regulatory compliance."
                    },
                    {
                              "id": "barber-module-2-checkpoint-q5",
                              "question": "SCENARIO: During scalp analysis, you notice circular patches with inflammation and suspect tinea capitis. Your correct recovery response is:",
                              "options": [
                                        "A. Continue service but use extra disinfectant on tools",
                                        "B. Stop service, disinfect tools, refer client to dermatologist, and document incident",
                                        "C. Recommend the client purchase antifungal shampoo and return next week",
                                        "D. Treat the area with store-bought fungal cream yourself"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Suspected fungal infections require immediate service termination, professional referral, complete disinfection of tools and workspace, and detailed documentation. Barbers cannot treat infections; medical professionals must evaluate and manage."
                    }
          ],
        },
      ],
    }

;
