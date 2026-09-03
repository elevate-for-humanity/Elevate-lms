import type { BlueprintModule } from '../types';

export const barberModule5: BlueprintModule = {
      slug: 'barber-module-5',
      title: 'Module 5: Shaving & Beard Services',
      orderIndex: 5,
      minLessons: 7,
      maxLessons: 9,
      quizRequired: true,
      practicalRequired: true,
      isCritical: true,
      domainKey: 'shaving',
      requiredLessonTypes: [
        { lessonType: 'concept', requiredCount: 4 },
        { lessonType: 'checkpoint', requiredCount: 1 },
      ],
      competencies: [
        { competencyKey: 'shave_preparation', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'razor_technique', isCritical: true, minimumTouchpoints: 3 },
        { competencyKey: 'beard_design', isCritical: true, minimumTouchpoints: 2 },
        { competencyKey: 'skin_care', isCritical: false, minimumTouchpoints: 1 },
      ],
      lessons: [
        {
          slug: 'barber-lesson-29',
          title: 'Shave Preparation & Hot Towel Service',
          order: 1,
          domainKey: 'shaving',
          objective:
            'Prepare the skin for a professional shave using hot towel and pre-shave products.',
          durationMinutes: 20,
          videoFile: '/videos/course-barber-razor-narrated.mp4',
          content: `<h2>Overview</h2><p>Proper shave preparation is essential for achieving a close, comfortable shave while minimizing irritation and ingrown hairs. Hot towel service softens beard hair, opens pores, and relaxes facial muscles, creating optimal conditions for razor glide. This foundational skill combines thermal therapy with product application to prepare skin and hair for blade contact. Mastering shave preparation demonstrates professionalism and ensures client comfort throughout the service. Understanding skin response to heat and moisture allows you to customize treatment for individual client needs while maintaining sanitation standards.</p><h2>Tools Required</h2><ul><li>Hot towel cabinet or steamer maintaining 130-140°F temperature range</li><li>Clean terry cloth towels, minimum 12x12 inches, lint-free white or light colored</li><li>Pre-shave oil containing natural lubricants like jojoba or grape seed</li><li>Lather product: shaving cream, soap, or gel appropriate for skin type</li><li>Lather brush with badger, boar, or synthetic bristles for product distribution</li><li>Disinfected shaving bowl or mug for lather preparation and application</li><li>EPA-registered hospital-grade disinfectant spray for surface preparation</li></ul><h2>Procedure</h2><ol><li>Sanitize hands and drape client with clean towel tucked snugly around neck, ensuring full chest and shoulder protection from moisture.</li><li>Analyze facial skin condition and hair growth patterns, identifying any contraindications like lesions, severe acne, or active skin infections.</li><li>Steam towel to 130-140°F, wring thoroughly to remove excess water, test temperature on your inner wrist before client application.</li><li>Apply first hot towel to face covering beard area completely, leaving nose exposed for breathing, maintain contact two to three minutes.</li><li>Remove towel and immediately apply pre-shave oil using circular motions, massaging into beard area to coat hair shafts and soften cuticles.</li><li>Prepare lather to creamy consistency using brush in circular motions, building volume with appropriate water-to-product ratio for rich texture.</li><li>Apply second hot towel over pre-shave oil for one to two minutes, allowing additional softening and pore opening before lathering.</li><li>Remove towel and apply generous lather using brush in circular motions, ensuring complete beard coverage with consistent product thickness throughout.</li></ol><h2>Safety</h2><p>All towels must be laundered in hot water with detergent and dried completely between clients to prevent bacterial growth and cross-contamination. <strong>Do NOT apply hot towels to clients with diabetes, impaired circulation, or reduced thermal sensitivity as they may experience burns without feeling excessive heat, resulting in second-degree burns and potential liability.</strong> IF the client has sensitive skin or rosacea, THEN reduce towel temperature to 120°F and decrease contact time to 90 seconds maximum. IF the client has coarse, dense beard hair, THEN extend hot towel application to three full minutes and consider a third towel cycle for optimal softening. Use EPA-registered hospital-grade disinfectant on all surface areas before service begins. Failure mode: If towel is too hot causing client discomfort, immediately remove towel, apply cool damp cloth to affected area for 30 seconds, assess for redness or irritation, allow skin to return to normal temperature for two minutes, then proceed with properly tested warm towel at reduced temperature before continuing service.</p><h2>Visual Cues</h2><p>Position client reclined at 30-45 degree angle with head supported in headrest, ensuring neck is relaxed and accessible. Towel should conform smoothly to facial contours without gaps, covering from sideburns down to jawline and chin. Properly steamed towel releases visible vapor when unfolded and appears uniformly damp throughout. Pre-shave oil application should create subtle sheen across beard area without pooling or dripping. Lather consistency should form stiff peaks when lifted with brush, appearing bright white and creamy. Properly prepared skin shows slight redness from increased circulation, with beard hair appearing darker and lying flat against skin rather than standing erect.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-29-q1",
                              "question": "What is the optimal temperature range for hot towels used in shave preparation?",
                              "options": [
                                        "A. 130-140°F",
                                        "B. 150-160°F",
                                        "C. 110-120°F",
                                        "D. 160-170°F"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Hot towels should be maintained at 130-140°F to effectively soften beard hair and open pores without risking burns or client discomfort. This temperature range provides therapeutic benefit while remaining safe."
                    },
                    {
                              "id": "barber-lesson-29-q2",
                              "question": "When should pre-shave oil be applied during the hot towel service?",
                              "options": [
                                        "A. Before the first hot towel application",
                                        "B. After the first hot towel and before the second towel",
                                        "C. After both hot towels are complete",
                                        "D. Mixed into the lather product"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Pre-shave oil is applied after the first hot towel softens the hair and opens pores, then a second hot towel is applied over the oil to drive it deeper into the hair shaft and skin for maximum effectiveness."
                    },
                    {
                              "id": "barber-lesson-29-q3",
                              "question": "What indicates properly prepared lather consistency?",
                              "options": [
                                        "A. Forms stiff peaks when lifted with brush and appears creamy white",
                                        "B. Runs freely off the brush in liquid form",
                                        "C. Appears transparent and watery",
                                        "D. Contains visible bubbles and foam only"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Proper lather should be thick enough to form stiff peaks, indicating the right water-to-product ratio. This creamy, dense consistency provides optimal cushion and lubrication for the razor during shaving."
                    },
                    {
                              "id": "barber-lesson-29-q4",
                              "question": "SCENARIO: A client mentions he has Type 2 diabetes and asks for the hot towel shave service. What do you do?",
                              "options": [
                                        "A. Proceed normally since diabetes does not affect shaving",
                                        "B. Apply towels at higher temperature to ensure effectiveness",
                                        "C. Decline the hot towel service due to impaired thermal sensitivity and circulation concerns",
                                        "D. Use only one towel instead of two"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Clients with diabetes often have impaired circulation and reduced thermal sensitivity, meaning they may not feel excessive heat and could suffer burns. This is a contraindication for hot towel service and the service should be declined or modified significantly."
                    },
                    {
                              "id": "barber-lesson-29-q5",
                              "question": "SCENARIO: During the first hot towel application you notice the client suddenly flinches and says the towel feels too hot. Correct response?",
                              "options": [
                                        "A. Tell the client to tolerate it because hot towels are supposed to be hot",
                                        "B. Immediately remove towel, apply cool damp cloth for 30 seconds, assess skin, then retry with properly tested cooler towel",
                                        "C. Leave the towel in place but reduce the time to 30 seconds",
                                        "D. Remove the towel and proceed directly to lathering without further preparation"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Client safety is paramount. Immediately remove the hot towel, apply a cool compress to prevent burns, assess for damage, allow skin to recover, and then retry with a properly temperature-tested towel at a lower heat to continue the service safely."
                    }
          ],
        },
        {
          slug: 'barber-lesson-30',
          title: 'Straight Razor Shaving Technique',
          order: 2,
          domainKey: 'shaving',
          objective: 'Execute a professional straight razor shave with correct angle and stroke.',
          durationMinutes: 25,
          videoFile: '/videos/course-barber-razor-narrated.mp4',
          content: `<h2>Introduction to Straight Razor Shaving Technique</h2><p>The straight razor shave is a classic technique that requires skill, precision, and attention to detail. As a barber, it is essential to master this technique to provide a professional and safe service to your clients. In this lesson, we will cover the tools, equipment, and materials required, as well as the correct angle and stroke to execute a professional straight razor shave.</p><h3>Tools, Equipment, and Materials Required</h3><ul><li>Straight razor</li><li>Shaving cream or soap</li><li>Hot towel</li><li>Cold towel</li><li>Aftershave</li><li>Sanitizer or disinfectant</li></ul><h3>Sanitation, Disinfection, and Infection Control</h3><p>Before starting the shave, it is crucial to sanitize and disinfect the straight razor and any other equipment that will come into contact with the client's skin. This will prevent the spread of infections and ensure a safe service. Always wash your hands before and after the service, and use a clean towel for each client.</p><h3>Executing the Straight Razor Shave</h3><p>To execute a professional straight razor shave, follow these steps:</p><ol><li>Prepare the client's skin by washing and exfoliating the area to be shaved.</li><li>Apply a hot towel to the area to soften the hair and open up the pores.</li><li>Apply shaving cream or soap and work it into a lather.</li><li>Hold the straight razor at a 20-30 degree angle, with the blade facing the direction of hair growth.</li><li>Start shaving in smooth, even strokes, following the direction of hair growth.</li><li>Rinse the razor and repeat the process until the area is smooth and hair-free.</li><li>Apply a cold towel to close the pores and reduce inflammation.</li><li>Apply aftershave to soothe and moisturize the skin.</li></ol><h3>IF/THEN Decision Block</h3><p>IF the client has sensitive skin, THEN use a gentle shaving cream or soap and avoid applying too much pressure with the straight razor. IF the client has coarse or curly hair, THEN use a sharper razor and take smaller strokes to avoid pulling or tugging on the hair.</p><h3>Contraindications and Safety Rules</h3><p>DO NOT shave over open wounds, cuts, or irritated skin. DO NOT use a straight razor that is dull or damaged, as this can cause nicks and cuts. Always use a clean and sanitized razor, and never share razors between clients.</p><h3>Failure Mode and Recovery</h3><p>Failure mode: The client experiences nicks or cuts during the shave. Why: The razor is dull or damaged, or the barber is applying too much pressure. Recovery: Stop the service immediately and apply pressure to the affected area to stop the bleeding. Clean and disinfect the area, and apply a cold compress to reduce swelling. Offer the client a complimentary service or discount on their next visit.</p><h3>Correct Execution</h3><p>Correct execution of the straight razor shave looks like this: the barber holds the razor at a 20-30 degree angle, with the blade facing the direction of hair growth. The strokes are smooth and even, following the direction of hair growth. The skin is smooth and hair-free, with no nicks or cuts. The client's skin is relaxed and comfortable, with no signs of irritation or discomfort.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-30-q1",
                              "question": "What is the correct angle to hold the straight razor during a shave?",
                              "options": [
                                        "10-20 degrees",
                                        "20-30 degrees",
                                        "30-40 degrees",
                                        "40-50 degrees"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct angle to hold the straight razor is between 20-30 degrees, with the blade facing the direction of hair growth."
                    },
                    {
                              "id": "barber-lesson-30-q2",
                              "question": "A client presents with sensitive skin. What do you do?",
                              "options": [
                                        "Use a regular shaving cream or soap",
                                        "Use a gentle shaving cream or soap",
                                        "Apply more pressure with the straight razor",
                                        "Avoid shaving the area altogether"
                              ],
                              "correctAnswer": 1,
                              "explanation": "If the client has sensitive skin, you should use a gentle shaving cream or soap to avoid irritating the skin further."
                    },
                    {
                              "id": "barber-lesson-30-q3",
                              "question": "What is the purpose of applying a hot towel to the area to be shaved?",
                              "options": [
                                        "To soften the hair and open up the pores",
                                        "To close the pores and reduce inflammation",
                                        "To sanitize the skin",
                                        "To apply aftershave"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The purpose of applying a hot towel is to soften the hair and open up the pores, making it easier to shave the area."
                    },
                    {
                              "id": "barber-lesson-30-q4",
                              "question": "A client experiences nicks or cuts during the shave. What do you do?",
                              "options": [
                                        "Continue with the service as usual",
                                        "Stop the service and apply pressure to the affected area",
                                        "Apply aftershave to the affected area",
                                        "Use a dull razor to finish the service"
                              ],
                              "correctAnswer": 1,
                              "explanation": "If the client experiences nicks or cuts, you should stop the service immediately and apply pressure to the affected area to stop the bleeding."
                    },
                    {
                              "id": "barber-lesson-30-q5",
                              "question": "What is a contraindication for using a straight razor?",
                              "options": [
                                        "Sensitive skin",
                                        "Coarse or curly hair",
                                        "Open wounds or cuts",
                                        "All of the above"
                              ],
                              "correctAnswer": 2,
                              "explanation": "A contraindication for using a straight razor is open wounds or cuts, as this can lead to further irritation and infection."
                    }
          ],
        },
        {
          slug: 'barber-lesson-31',
          title: 'Beard Design & Shaping',
          order: 3,
          domainKey: 'shaving',
          objective: "Design and shape a beard to complement the client's face shape.",
          durationMinutes: 20,
          videoFile: '/videos/course-barber-beard-narrated.mp4',
          content: `<h2>Overview</h2><p>Beard design and shaping is a specialized barber service that combines artistic vision with technical precision to enhance a client's facial features. This lesson teaches you how to analyze face shapes and create complementary beard designs using professional tools and techniques. Proper beard shaping requires understanding facial structure, hair growth patterns, and style principles. Mastering this skill allows you to provide personalized grooming services that boost client confidence and satisfaction.</p><h2>Tools Required</h2><ul><li>Professional adjustable clippers with guard attachments (sizes 1-8)</li><li>Detailing trimmer or T-blade outliner for precision work</li><li>Barber shears for scissor-over-comb technique</li><li>Fine-tooth comb and wide-tooth comb for sectioning</li><li>Beard brush with natural or synthetic bristles</li><li>Straight razor or safety razor for clean edge definition</li><li>Hand mirror for client consultation and approval</li><li>Neck strip and cape for proper draping</li></ul><h2>Client Considerations</h2><p>IF the client has a round face shape, THEN design a longer, more angular beard with defined cheek lines and shorter sides to create vertical length and elongate the face. IF the client has an oblong or rectangular face, THEN keep the beard fuller on the sides with shorter length on the chin to add width and balance proportions. IF the client has coarse, curly beard hair, THEN use longer guard settings initially as curly hair appears shorter when dry and will shrink after trimming.</p><h2>Procedure</h2><ol><li>Consult with client to determine desired beard style, assess face shape, and identify natural growth patterns and density variations throughout the beard area.</li><li>Drape the client properly with neck strip and cape, then cleanse and brush the beard thoroughly to remove debris and detangle hair.</li><li>Establish cheek line and neckline boundaries using detailing trimmer, creating clean, symmetrical lines that complement the client's facial structure and jawline.</li><li>Select appropriate clipper guard length and trim beard to desired length, moving against growth direction for even cutting across all facial zones.</li><li>Blend the beard gradually from neckline to chin using progressively longer guards, creating smooth transitions without visible lines or unevenness throughout.</li><li>Use scissor-over-comb technique to refine length, remove bulk, and shape the mustache area, checking symmetry from multiple angles throughout the process.</li><li>Detail edges with trimmer or razor, removing stray hairs outside design lines, then apply aftershave or beard oil as finishing product.</li><li>Show client the finished result using hand mirror for front and side views, making minor adjustments as needed for complete satisfaction.</li></ol><h2>Safety</h2><p>All tools must be sanitized before and after each client service. Clipper blades should be cleaned with Clippercide or similar EPA-registered disinfectant spray, while combs and guards must be washed with soap and water then immersed in Barbicide solution for ten minutes. Razors require blade disposal in sharps container and handle disinfection between uses.<strong>Do NOT perform beard shaping services on clients with active skin infections, open wounds, or severe acne in the beard area, as cutting and trimming can spread bacteria, worsen the condition, and potentially expose you to bloodborne pathogens requiring medical intervention.</strong></p><h2>Visual Cues</h2><p>Position yourself at eye level with the client's beard, moving systematically from one side to the other to maintain symmetry. Observe the natural angle where the jawline meets the neck, typically one finger-width above the Adam's apple for proper neckline placement. Check that cheek lines follow a straight or slightly curved path from the sideburn to the mustache corner, typically level with the nose bottom. The beard should appear denser at the chin and gradually lighter toward the cheeks. Step back periodically to assess overall balance and proportion from three feet away, ensuring both sides match in length, shape, and definition.</p><h2>Failure Recovery</h2><p>If you accidentally create an uneven patch or cut the beard too short in one area, do not attempt to match the mistake by cutting everything shorter immediately. First, assess the damage by combing the area and determining the exact length difference. Then, use scissor-over-comb technique with minimal tension to gradually blend the shorter section into surrounding areas, creating a subtle transition. Work in small increments, checking symmetry after each pass. If the error is significant, consult with the client about adjusting the overall beard length or modifying the style to incorporate the shorter section as an intentional design element.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-31-q1",
                              "question": "What is the primary purpose of using the scissor-over-comb technique during beard shaping?",
                              "options": [
                                        "A. To refine length, remove bulk, and create smooth transitions in the beard",
                                        "B. To establish the initial cheek line and neckline boundaries",
                                        "C. To apply finishing products evenly throughout the beard",
                                        "D. To detangle and prepare the beard before using clippers"
                              ],
                              "correctAnswer": 0,
                              "explanation": "The scissor-over-comb technique is specifically used to refine length, remove excess bulk, and shape areas like the mustache while creating smooth, natural-looking results that clippers alone cannot achieve."
                    },
                    {
                              "id": "barber-lesson-31-q2",
                              "question": "Where should the neckline typically be positioned when shaping a beard?",
                              "options": [
                                        "A. Directly at the jawbone where it meets the neck",
                                        "B. Approximately one finger-width above the Adam's apple",
                                        "C. Two inches below the chin for all face shapes",
                                        "D. At the point where the neck meets the shoulder"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The proper neckline placement is typically one finger-width above the Adam's apple, following the natural angle where the jawline meets the neck for a clean, professional appearance."
                    },
                    {
                              "id": "barber-lesson-31-q3",
                              "question": "Why must clipper blades be disinfected between clients?",
                              "options": [
                                        "A. To prevent cross-contamination and transmission of bacteria, fungi, or bloodborne pathogens between clients",
                                        "B. To keep the blades sharp and functioning properly",
                                        "C. To remove hair clippings that might dull the cutting edges",
                                        "D. To comply with manufacturer warranty requirements"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Disinfecting clipper blades between clients is essential to prevent cross-contamination and the spread of infections, bacteria, fungi, or bloodborne pathogens, protecting both clients and the barber."
                    },
                    {
                              "id": "barber-lesson-31-q4",
                              "question": "SCENARIO: A client with a round face requests a full, bushy beard that adds width to his face. What do you do?",
                              "options": [
                                        "A. Proceed with the requested style exactly as the client described it",
                                        "B. Refuse the service and tell the client his idea will not work",
                                        "C. Professionally explain how a longer, angular beard would better complement his face shape and suggest modifications",
                                        "D. Create the bushy beard but charge extra for the consultation"
                              ],
                              "correctAnswer": 2,
                              "explanation": "As a professional barber, you should educate clients about styles that complement their features. Diplomatically suggest a longer, more angular design that creates vertical length for round faces while respecting the client's input."
                    },
                    {
                              "id": "barber-lesson-31-q5",
                              "question": "SCENARIO: During the service you notice you have accidentally created an uneven patch on one side of the beard. Correct response?",
                              "options": [
                                        "A. Immediately cut the entire beard to match the shortest area",
                                        "B. Use scissor-over-comb technique to gradually blend the shorter section, working in small increments",
                                        "C. Tell the client it will grow back and continue with the original plan",
                                        "D. Apply more product to the area to hide the unevenness"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct recovery method is to use scissor-over-comb technique to gradually blend the shorter section into surrounding areas, working carefully in small increments rather than hastily cutting everything shorter."
                    }
          ],
        },
        {
          slug: 'barber-lesson-32',
          title: 'Post-Shave Care & Skin Treatment',
          order: 4,
          domainKey: 'shaving',
          objective: 'Apply correct post-shave products and handle common skin reactions.',
          durationMinutes: 15,
          videoFile: '/videos/course-barber-beard-narrated.mp4',
          content: `<h2>Overview</h2><p>Post-shave care is essential to prevent irritation, ingrown hairs, and infection while promoting healthy skin recovery. After removing hair, the skin barrier is temporarily compromised and requires immediate attention with appropriate products and techniques. Proper post-shave treatment soothes razor burn, closes pores, restores pH balance, and provides antimicrobial protection. This lesson covers product selection, application techniques, client skin assessment, and management of common reactions. Mastering these skills ensures client comfort, prevents complications, and demonstrates professional expertise that builds trust and repeat business in your barbering practice.</p><h2>Tools Required</h2><ul><li>Cold water or cold towel compress</li><li>Aftershave lotion, balm, or astringent (alcohol-based or alcohol-free options)</li><li>Moisturizer or post-shave serum with soothing ingredients</li><li>Alum block or styptic powder for minor nicks</li><li>Clean towels (separate from shaving towels)</li><li>Antiseptic spray or EPA-registered disinfectant for workspace</li><li>Cotton pads or applicators for product application</li></ul><h2>Decision Factors</h2><p>IF the client has sensitive skin or visible redness, THEN use alcohol-free aftershave balm with aloe vera or chamomile and avoid astringents that cause stinging or further irritation. IF the client has oily or acne-prone skin, THEN apply a lightweight, non-comedogenic aftershave with salicylic acid or witch hazel to prevent clogged pores and breakouts. IF the client has dry or mature skin, THEN select a rich moisturizing balm with hyaluronic acid or vitamin E to restore hydration and elasticity.</p><h2>Procedure</h2><ol><li>Rinse the shaved area thoroughly with cool water to remove all remaining shaving cream, stubble, and debris from the skin surface.</li><li>Pat the skin completely dry using a clean towel with gentle pressing motions, avoiding any rubbing that could cause additional irritation.</li><li>Apply alum block or styptic powder to any nicks or cuts using light pressure until bleeding stops, typically within seconds.</li><li>Dispense a small amount of chosen aftershave product into your palm or onto a cotton pad for controlled, sanitary application.</li><li>Apply the aftershave using gentle upward and outward motions, covering all shaved areas evenly without excessive rubbing or pressure on skin.</li><li>Follow with moisturizer if needed, using light patting motions to seal in hydration and create a protective barrier on skin.</li><li>Advise the client on home care, including avoiding sun exposure, touching the area, or applying fragranced products for twenty-four hours.</li></ol><h2>Safety</h2><p>All post-shave products must be dispensed from containers using clean applicators or hands washed immediately before application to prevent cross-contamination between clients. Workstations should be disinfected with EPA-registered hospital-grade disinfectant between each client, including all product containers and dispensers. <strong>Do NOT apply aftershave products containing alcohol or fragrance to clients with open cuts, active infections, or inflamed skin conditions, as this causes severe burning, delayed healing, and potential bacterial introduction into compromised tissue.</strong> Always check expiration dates on products and discard any items showing contamination signs.</p><h2>Visual Cues</h2><p>Properly treated skin should appear calm with reduced redness within two to three minutes of aftershave application, showing even moisture distribution without pooling or dry patches. Watch for immediate adverse reactions including increased redness, hives, or swelling that indicate allergic response requiring product removal. The skin should feel cool and taut but not tight or uncomfortable, with a subtle matte or slight sheen depending on product type used. Observe the neck area at a forty-five-degree angle under proper lighting to detect any missed spots, uneven application, or developing razor bumps that need attention.</p><h2>Failure Mode</h2><p>If a client develops sudden widespread redness and burning sensation after aftershave application, this indicates allergic reaction or inappropriate product selection for skin type. Immediately remove the product by rinsing the entire area with cool water for at least sixty seconds. Pat dry gently and apply a plain, fragrance-free aloe vera gel or hypoallergenic moisturizer to calm inflammation. Place a cold compress on the affected area for five-minute intervals. Document the product used and reaction observed, and recommend the client avoid that ingredient family in future. If swelling or hives develop, advise seeking medical attention and do not proceed with additional products.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-32-q1",
                              "question": "What is the primary purpose of applying aftershave products immediately following a shave service?",
                              "options": [
                                        "A. To soothe skin, close pores, restore pH balance, and provide antimicrobial protection",
                                        "B. To add fragrance and make the client smell pleasant for the rest of the day",
                                        "C. To remove any remaining shaving cream residue from the skin surface",
                                        "D. To prepare the skin for immediate sun exposure and outdoor activities"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Aftershave products serve multiple therapeutic purposes including soothing irritation, closing pores, restoring skin pH, and providing antimicrobial protection to prevent infection in the temporarily compromised skin barrier."
                    },
                    {
                              "id": "barber-lesson-32-q2",
                              "question": "Which type of aftershave product is most appropriate for a client with oily, acne-prone skin?",
                              "options": [
                                        "A. Rich moisturizing balm with hyaluronic acid and heavy emollients",
                                        "B. Lightweight, non-comedogenic aftershave with salicylic acid or witch hazel",
                                        "C. Alcohol-based astringent with added synthetic fragrances and dyes",
                                        "D. Thick cream containing petroleum jelly and mineral oil base"
                              ],
                              "correctAnswer": 1,
                              "explanation": "Oily and acne-prone skin requires lightweight, non-comedogenic products that won't clog pores. Ingredients like salicylic acid and witch hazel help control oil and prevent breakouts without adding heaviness."
                    },
                    {
                              "id": "barber-lesson-32-q3",
                              "question": "What is the correct method for drying the skin immediately after rinsing following a shave?",
                              "options": [
                                        "A. Pat the skin completely dry using gentle pressing motions with a clean towel, avoiding rubbing",
                                        "B. Vigorously rub the skin with a coarse towel to stimulate blood circulation",
                                        "C. Allow the skin to air dry naturally without using any towel contact",
                                        "D. Use a high-speed blow dryer on cool setting to evaporate water quickly"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Patting with gentle pressing motions removes water without causing additional irritation to freshly shaved skin. Rubbing can cause friction and inflammation on the compromised skin barrier."
                    },
                    {
                              "id": "barber-lesson-32-q4",
                              "question": "SCENARIO: A client with visible razor burn and multiple areas of redness requests aftershave application. What do you do?",
                              "options": [
                                        "A. Apply a strong alcohol-based astringent to disinfect and tighten the irritated areas",
                                        "B. Skip all aftershave products and send the client home without post-shave treatment",
                                        "C. Select an alcohol-free aftershave balm with aloe vera or chamomile and apply gently",
                                        "D. Use a medicated acne treatment containing benzoyl peroxide on the affected areas"
                              ],
                              "correctAnswer": 2,
                              "explanation": "Sensitive, irritated skin requires gentle, alcohol-free products with soothing ingredients like aloe vera or chamomile. Alcohol-based products would cause burning and worsen the irritation on already compromised skin."
                    },
                    {
                              "id": "barber-lesson-32-q5",
                              "question": "SCENARIO: During post-shave product application you notice the client's skin becoming increasingly red with visible hives forming. Correct response?",
                              "options": [
                                        "A. Continue with the service and apply additional moisturizer to cover the reaction",
                                        "B. Immediately rinse the area with cool water, apply plain aloe vera gel, and use a cold compress",
                                        "C. Apply more of the same product to help the skin adjust to the ingredients",
                                        "D. Ignore the reaction as it will resolve naturally within a few hours"
                              ],
                              "correctAnswer": 1,
                              "explanation": "This indicates an allergic reaction requiring immediate product removal. Rinsing with cool water, applying plain aloe vera, and using cold compresses are the correct steps to manage the reaction and prevent worsening symptoms."
                    }
          ],
        },
        {
          slug: 'barber-lesson-33',
          title: 'Mustache Trimming & Styling',
          order: 5,
          domainKey: 'shaving',
          objective: "Trim and style a mustache to complement the client's features.",
          durationMinutes: 15,
          videoFile: '/videos/course-barber-beard.mp4',
          content: `<h2>Overview</h2><p>Mustache trimming and styling is a precision service that requires careful attention to facial structure, hair growth patterns, and client preferences. A well-groomed mustache enhances facial features and complements overall appearance. This skill combines technical execution with artistic vision, requiring the barber to assess symmetry, proportion, and balance. Mastering mustache trimming demonstrates professionalism and builds client loyalty. Understanding various mustache styles, from classic handlebar to modern pencil designs, allows you to recommend options that best suit each client's face shape and personal style.</p><h2>Tools Required</h2><ul><li>Barber shears (preferably 5.5 to 6 inches with fine tips for detail work)</li><li>Mustache comb (fine-toothed, typically 4 to 5 inches in length)</li><li>Trimming clippers with guards (sizes 1 through 4 for length control)</li><li>Detailing trimmer or outliner for precise edge work</li><li>Straight razor or safety razor for clean lines and definition</li><li>Mustache wax or styling product for shaping and hold</li><li>Disinfected towels and neck strips for client protection</li><li>Handheld mirror for client consultation and approval</li></ul><h2>Client Assessment</h2><p>IF the client has coarse, thick mustache hair, THEN use thinning shears after initial trimming to reduce bulk and create a softer appearance without losing length. IF the client has fine or sparse mustache hair, THEN avoid over-trimming and use minimal tension when combing to prevent removing too much hair, which can create patchy areas. IF the client has sensitive skin or recent irritation, THEN postpone razor detailing and use only scissors and clippers for this service.</p><h2>Procedure</h2><ol><li>Consult with client to determine desired mustache style, length, and shape while assessing facial features and natural growth patterns for best results.</li><li>Drape client properly with neck strip and cape, then sanitize hands and ensure all tools are clean and disinfected before beginning service.</li><li>Comb mustache hair downward in natural growth direction to remove tangles and assess current length, identifying any uneven areas requiring attention.</li><li>Begin trimming at center of upper lip using shears, working outward toward corners while maintaining consistent length and checking symmetry between both sides.</li><li>Use clippers with appropriate guard to establish overall length, moving horizontally across mustache while following natural contour of upper lip for even results.</li><li>Detail edges using trimmer or razor to define clean upper and lower borders, creating sharp lines that frame the mustache precisely.</li><li>Thin bulk if necessary using thinning shears at mid-length, avoiding roots and tips to maintain natural appearance while reducing excess weight.</li><li>Apply small amount of mustache wax or styling product, working through hair with fingertips, then comb into desired shape and style.</li><li>Show client results using handheld mirror, make any final adjustments based on feedback, and provide styling recommendations for home maintenance.</li></ol><h2>Safety</h2><p>All combs, shears, and clipper blades must be cleaned with Barbicide or EPA-registered hospital-grade disinfectant between clients, with minimum ten-minute contact time per manufacturer specifications. Tools should be stored in sanitized containers after proper disinfection. <strong>Do NOT trim a mustache if active cold sores, open lesions, or skin infections are present in the mustache area, as this can spread infection to other facial areas and contaminate tools, requiring immediate service termination and medical referral.</strong></p><h2>Failure Mode Recovery</h2><p>If you accidentally trim the mustache too short on one side, creating visible asymmetry, immediately stop cutting. First, inform the client honestly about the mistake. Second, carefully assess whether you can shorten the opposite side to match without compromising the overall style. Third, if matching is possible, use scissors to carefully remove hair incrementally while constantly checking symmetry. Fourth, if the mustache is now too short for the desired style, discuss alternative shorter styles that work with the current length. Fifth, document the incident and offer a complimentary follow-up appointment when growth allows proper reshaping.</p><h2>Visual Cues</h2><p>Position yourself directly in front of the client at eye level to assess symmetry accurately throughout the service. The mustache should follow the natural curve of the upper lip, with corners typically ending at the outer edges of the mouth or slightly beyond. Shears should be held at a 45-degree angle when point-cutting for texture. Hair should appear even when combed downward, with no gaps or patches visible. The upper border should create a clean line approximately one-eighth inch below the nose base. Lower border follows the natural lip line, maintaining consistent distance. Observe that both sides mirror each other in length, density, and shape when viewed from the front.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-lesson-33-q1",
                              "question": "What is the primary purpose of using thinning shears during mustache trimming?",
                              "options": [
                                        "A. To reduce bulk and create a softer appearance without significantly affecting length",
                                        "B. To establish the initial length and overall shape of the mustache",
                                        "C. To create sharp, defined edges along the borders of the mustache",
                                        "D. To remove all hair that extends beyond the desired mustache area"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Thinning shears are used to reduce bulk and create a softer appearance without losing significant length, particularly useful for clients with coarse, thick mustache hair."
                    },
                    {
                              "id": "barber-lesson-33-q2",
                              "question": "When trimming a mustache with scissors, what is the recommended starting point?",
                              "options": [
                                        "A. Begin at the outer corners and work inward toward the center",
                                        "B. Start at the center of the upper lip and work outward toward the corners",
                                        "C. Begin at the lower border and work upward to the upper border",
                                        "D. Start randomly at any point to ensure a natural, uneven appearance"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct technique is to begin trimming at the center of the upper lip using shears and work outward toward the corners while maintaining consistent length and checking symmetry."
                    },
                    {
                              "id": "barber-lesson-33-q3",
                              "question": "What is the minimum contact time required for Barbicide or EPA-registered disinfectant on barbering tools?",
                              "options": [
                                        "A. Ten minutes per manufacturer specifications",
                                        "B. Three minutes for basic sanitation",
                                        "C. Thirty seconds of spray application",
                                        "D. Five minutes for adequate disinfection"
                              ],
                              "correctAnswer": 0,
                              "explanation": "All tools must be cleaned with Barbicide or EPA-registered hospital-grade disinfectant with a minimum ten-minute contact time per manufacturer specifications to ensure proper disinfection."
                    },
                    {
                              "id": "barber-lesson-33-q4",
                              "question": "SCENARIO: A client with very fine, sparse mustache hair requests a trim to clean up stray hairs. What is your best approach?",
                              "options": [
                                        "A. Use heavy tension when combing and trim aggressively to create a defined shape",
                                        "B. Apply thinning shears throughout to reduce any appearance of bulk",
                                        "C. Use minimal tension when combing and avoid over-trimming to prevent creating patchy areas",
                                        "D. Recommend shaving the mustache completely and starting over for better results"
                              ],
                              "correctAnswer": 2,
                              "explanation": "For clients with fine or sparse mustache hair, you should use minimal tension when combing and avoid over-trimming to prevent removing too much hair, which can create patchy, uneven areas."
                    },
                    {
                              "id": "barber-lesson-33-q5",
                              "question": "SCENARIO: During the service you notice you accidentally trimmed one side of the mustache significantly shorter than the other. What is the correct response?",
                              "options": [
                                        "A. Continue trimming and hope the client doesn't notice the difference",
                                        "B. Immediately stop, inform the client honestly, assess if matching is possible, and offer solutions or a follow-up appointment",
                                        "C. Apply extra mustache wax to the shorter side to make it appear longer",
                                        "D. Quickly trim the entire mustache very short to hide the mistake"
                              ],
                              "correctAnswer": 1,
                              "explanation": "When a mistake occurs, professional protocol requires immediately stopping, honestly informing the client, carefully assessing whether the opposite side can be matched, and offering appropriate solutions including complimentary follow-up appointments if needed."
                    }
          ],
        },
        {
          slug: 'barber-module-5-checkpoint',
          title: 'Shaving & Beard Checkpoint',
          order: 6,
          domainKey: 'shaving',
          objective: 'Demonstrate mastery of shaving and beard services.',
          durationMinutes: 20,
          passingScore: 70,
          content: `<h2>Shaving & Beard Checkpoint</h2><p>This lesson is designed to assess your mastery of shaving and beard services. As a barber, it is essential to demonstrate proficiency in these skills to provide high-quality services to your clients.</p><h3>Tools, Equipment, and Materials</h3><p>The following tools, equipment, and materials are required for shaving and beard services:</p><ul><li>Straight razor or shavette</li><li>Shaving cream or gel</li><li>Aftershave lotion or balm</li><li>Beard trimmer or clippers</li><li>Comb or brush</li><li>Sanitizing solution</li><li>Disinfectant spray</li></ul><h3>Sanitation, Disinfection, and Infection Control</h3><p>Sanitation, disinfection, and infection control are crucial in shaving and beard services. Always sanitize your tools and equipment before and after use, and disinfect any surfaces that come into contact with the client's skin.</p><p>IF the client has a skin condition such as acne or eczema, THEN you should take extra precautions to avoid irritating the skin further. Use a gentle shaving cream or gel, and avoid using hot water or harsh exfoliants.</p><h3>Contraindications and Safety Rules</h3><p>DO NOT shave a client with a skin condition such as impetigo or ringworm, as this can spread the infection. Also, DO NOT use a straight razor on a client with a bleeding disorder or taking anticoagulant medication.</p><h3>Failure Mode and Recovery</h3><p>A common failure mode in shaving and beard services is cutting the client's skin. This can happen if the razor is not properly sanitized or if the client's skin is not properly prepared. To recover from this failure mode, stop the service immediately and apply pressure to the cut to stop the bleeding. Then, clean and disinfect the area, and apply an antiseptic ointment to prevent infection.</p><h3>Correct Execution</h3><p>Correct execution of shaving and beard services involves using the right tools and techniques for the client's hair type and skin condition. For example, if the client has coarse hair, you may need to use a more aggressive shaving cream or gel. If the client has sensitive skin, you may need to use a gentler shaving cream or gel and avoid using hot water or harsh exfoliants.</p><p>Visually, correct execution involves holding the razor at a 20-30 degree angle, with the blade facing the direction of hair growth. The client's skin should be smooth and even, with no visible cuts or irritation.</p><h3>Angles, Positioning, and Appearance Cues</h3><p>When shaving, the razor should be held at a 20-30 degree angle, with the blade facing the direction of hair growth. The client's head should be positioned at a 45-degree angle, with the chin lifted and the neck stretched.</p><p>Appearance cues include a smooth, even skin tone, with no visible cuts or irritation. The client's hair should be evenly trimmed, with no visible stray hairs or uneven edges.</p>`,
          quizQuestions: [
                    {
                              "id": "barber-module-5-checkpoint-q1",
                              "question": "A client presents with a skin condition such as acne or eczema. What do you do?",
                              "options": [
                                        "Use a gentle shaving cream or gel and avoid using hot water or harsh exfoliants",
                                        "Use a medicated shaving cream or gel and apply a topical antibiotic ointment",
                                        "Avoid shaving the affected area and recommend a different service",
                                        "Use a regular shaving cream or gel and proceed with the service as usual"
                              ],
                              "correctAnswer": 0,
                              "explanation": "When a client presents with a skin condition such as acne or eczema, it is essential to take extra precautions to avoid irritating the skin further. Using a gentle shaving cream or gel and avoiding hot water or harsh exfoliants can help to minimize irritation and prevent further inflammation."
                    },
                    {
                              "id": "barber-module-5-checkpoint-q2",
                              "question": "What is the correct angle to hold the razor when shaving?",
                              "options": [
                                        "10-20 degrees",
                                        "20-30 degrees",
                                        "30-40 degrees",
                                        "40-50 degrees"
                              ],
                              "correctAnswer": 1,
                              "explanation": "The correct angle to hold the razor when shaving is 20-30 degrees, with the blade facing the direction of hair growth. This angle helps to prevent cuts and irritation, and ensures a smooth, even shave."
                    },
                    {
                              "id": "barber-module-5-checkpoint-q3",
                              "question": "A client has a bleeding disorder and is taking anticoagulant medication. What do you do?",
                              "options": [
                                        "Use a straight razor and proceed with the service as usual",
                                        "Use a safety razor and take extra precautions to avoid cutting the client",
                                        "Avoid using a razor altogether and recommend a different service",
                                        "Use a razor with a guard and apply pressure to the skin to minimize bleeding"
                              ],
                              "correctAnswer": 2,
                              "explanation": "When a client has a bleeding disorder and is taking anticoagulant medication, it is essential to avoid using a razor altogether. This is because the client's blood may not be able to clot properly, and using a razor could lead to excessive bleeding and potentially serious complications."
                    },
                    {
                              "id": "barber-module-5-checkpoint-q4",
                              "question": "What is the purpose of sanitizing and disinfecting tools and equipment?",
                              "options": [
                                        "To prevent the spread of infection and maintain a clean and hygienic environment",
                                        "To improve the appearance of the tools and equipment",
                                        "To increase the lifespan of the tools and equipment",
                                        "To reduce the cost of maintaining the tools and equipment"
                              ],
                              "correctAnswer": 0,
                              "explanation": "Sanitizing and disinfecting tools and equipment is essential to prevent the spread of infection and maintain a clean and hygienic environment. This helps to protect both the client and the barber from the risk of infection, and ensures that the service is provided in a safe and healthy manner."
                    },
                    {
                              "id": "barber-module-5-checkpoint-q5",
                              "question": "A client presents with a skin condition such as impetigo or ringworm. What do you do?",
                              "options": [
                                        "Use a medicated shaving cream or gel and apply a topical antibiotic ointment",
                                        "Avoid shaving the affected area and recommend a different service",
                                        "Use a regular shaving cream or gel and proceed with the service as usual",
                                        "Refer the client to a doctor or dermatologist for treatment"
                              ],
                              "correctAnswer": 3,
                              "explanation": "When a client presents with a skin condition such as impetigo or ringworm, it is essential to refer them to a doctor or dermatologist for treatment. These conditions are highly contagious and can spread easily, and using a razor or other tools on the affected area could exacerbate the condition and put others at risk."
                    }
          ],
        },
      ],
    }

;
