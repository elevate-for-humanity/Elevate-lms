-- Barber quiz questions — Modules 6 and 7
-- Lessons: 35, 36, 37, 38 (Module 6: Chemical Services)
--          40, 41, 42, 43, 44 (Module 7: Professional & Business Skills)
-- 5 questions per lesson, grounded in lesson content.
-- Canonical course: 3fb5ce19-1cde-434c-a8c6-f138d7d7aa17

-- ── barber-lesson-35: Hair Color Theory ──────────────────────────────────────
UPDATE public.course_lessons
SET quiz_questions = '[
  {
    "id": "bl35-q1",
    "question": "Hair color levels are measured on a scale of 1 to 10. What does level 1 represent?",
    "options": ["Lightest blonde", "Medium brown", "Black", "Dark red"],
    "correct": 2,
    "explanation": "Level 1 is black — the darkest end of the scale. Level 10 is the lightest blonde."
  },
  {
    "id": "bl35-q2",
    "question": "Which type of hair color penetrates the cortex and provides permanent color change?",
    "options": ["Temporary color", "Semi-permanent color", "Permanent color", "Toner"],
    "correct": 2,
    "explanation": "Permanent color uses developer to open the cuticle and deposit color into the cortex."
  },
  {
    "id": "bl35-q3",
    "question": "Complementary colors on the color wheel are used in barbering to:",
    "options": ["Deepen color", "Neutralize unwanted tones", "Lift color faster", "Add shine"],
    "correct": 1,
    "explanation": "Complementary colors cancel each other out. For example, violet toner neutralizes yellow brassiness."
  },
  {
    "id": "bl35-q4",
    "question": "What are the three primary colors?",
    "options": ["Red, orange, yellow", "Red, yellow, blue", "Blue, green, red", "Yellow, green, violet"],
    "correct": 1,
    "explanation": "Red, yellow, and blue are the primary colors. All other colors are mixed from these."
  },
  {
    "id": "bl35-q5",
    "question": "Lifting hair color to a lighter level requires:",
    "options": ["A toner only", "Removing existing pigment with developer", "Applying semi-permanent color", "Using a clarifying shampoo"],
    "correct": 1,
    "explanation": "Developer (hydrogen peroxide) oxidizes and removes existing melanin pigment to lift the hair to a lighter level."
  }
]'::jsonb
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-lesson-35';

-- ── barber-lesson-36: Chemical Safety & Patch Testing ────────────────────────
UPDATE public.course_lessons
SET quiz_questions = '[
  {
    "id": "bl36-q1",
    "question": "How far in advance must a patch test be performed before a chemical service?",
    "options": ["1 hour", "6 hours", "24–48 hours", "72 hours"],
    "correct": 2,
    "explanation": "A patch test must be done 24–48 hours before any chemical service to detect allergic reactions."
  },
  {
    "id": "bl36-q2",
    "question": "Where is a patch test typically applied?",
    "options": ["On the scalp", "Behind the ear or inside the elbow", "On the forearm only", "On the wrist"],
    "correct": 1,
    "explanation": "The patch test is applied behind the ear or inside the elbow — areas with thin, sensitive skin."
  },
  {
    "id": "bl36-q3",
    "question": "Which gloves are required when performing chemical services?",
    "options": ["Latex gloves", "Cotton gloves", "Nitrile gloves", "Vinyl gloves"],
    "correct": 2,
    "explanation": "Nitrile gloves are required — they resist chemical penetration and are latex-free."
  },
  {
    "id": "bl36-q4",
    "question": "If a client shows redness and swelling after a patch test, you should:",
    "options": ["Dilute the product and proceed", "Wait an extra hour and retest", "Do not proceed with the service", "Apply a neutralizer and continue"],
    "correct": 2,
    "explanation": "Any reaction — redness, swelling, or itching — means the service must not be performed."
  },
  {
    "id": "bl36-q5",
    "question": "Which of the following is a contraindication for chemical services?",
    "options": ["Dry hair", "Scratched or irritated scalp", "Fine hair texture", "Recently shampooed hair"],
    "correct": 1,
    "explanation": "A scratched or irritated scalp allows chemicals to penetrate the skin, causing burns or reactions."
  }
]'::jsonb
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-lesson-36';

-- ── barber-lesson-37: Relaxers & Texturizers ─────────────────────────────────
UPDATE public.course_lessons
SET quiz_questions = '[
  {
    "id": "bl37-q1",
    "question": "How do relaxers chemically alter hair?",
    "options": ["They coat the cuticle with protein", "They break disulfide bonds in the cortex", "They add moisture to the medulla", "They seal the cuticle with heat"],
    "correct": 1,
    "explanation": "Relaxers break the disulfide bonds in the cortex that give hair its curl pattern, allowing it to be restructured straight."
  },
  {
    "id": "bl37-q2",
    "question": "What is the active ingredient in lye relaxers?",
    "options": ["Guanidine", "Ammonium thioglycolate", "Sodium hydroxide", "Hydrogen peroxide"],
    "correct": 2,
    "explanation": "Lye relaxers use sodium hydroxide. They process faster but can be harsher on the scalp."
  },
  {
    "id": "bl37-q3",
    "question": "How does a texturizer differ from a full relaxer?",
    "options": ["It uses a different chemical", "It has a shorter processing time and loosens curl without fully straightening", "It is applied to dry hair only", "It requires no neutralizer"],
    "correct": 1,
    "explanation": "Texturizers use the same chemistry as relaxers but are processed for a shorter time to loosen curl rather than fully straighten."
  },
  {
    "id": "bl37-q4",
    "question": "Before applying a relaxer, the scalp should be:",
    "options": ["Scratched to open pores", "Based with petroleum jelly", "Shampooed with clarifying shampoo", "Treated with heat"],
    "correct": 1,
    "explanation": "Petroleum jelly is applied to the scalp as a base to protect it from chemical burns during relaxer application."
  },
  {
    "id": "bl37-q5",
    "question": "What stops the relaxer chemical process?",
    "options": ["Rinsing with cold water only", "Applying conditioner", "Neutralizing shampoo", "Blow drying"],
    "correct": 2,
    "explanation": "Neutralizing shampoo stops the chemical process by restoring the hair's pH. Thorough neutralization is critical."
  }
]'::jsonb
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-lesson-37';

-- ── barber-lesson-38: Scalp Treatments ───────────────────────────────────────
UPDATE public.course_lessons
SET quiz_questions = '[
  {
    "id": "bl38-q1",
    "question": "Which active ingredient is commonly found in anti-dandruff scalp treatments?",
    "options": ["Menthol", "Zinc pyrithione or selenium sulfide", "Petroleum jelly", "Sodium hydroxide"],
    "correct": 1,
    "explanation": "Zinc pyrithione and selenium sulfide are antifungal agents that treat dandruff caused by Malassezia yeast."
  },
  {
    "id": "bl38-q2",
    "question": "What is the purpose of a clarifying scalp treatment?",
    "options": ["Add moisture to dry scalp", "Remove product buildup", "Stimulate circulation", "Treat fungal infection"],
    "correct": 1,
    "explanation": "Clarifying treatments dissolve and remove product buildup, excess oil, and mineral deposits from the scalp."
  },
  {
    "id": "bl38-q3",
    "question": "A stimulating scalp treatment typically contains which ingredient?",
    "options": ["Zinc pyrithione", "Petroleum jelly", "Menthol or peppermint", "Guanidine"],
    "correct": 2,
    "explanation": "Menthol and peppermint create a cooling sensation and increase blood circulation to the scalp."
  },
  {
    "id": "bl38-q4",
    "question": "What is the correct first step when applying a scalp treatment?",
    "options": ["Apply treatment to dry hair", "Shampoo hair first", "Apply heat for 10 minutes", "Section hair without washing"],
    "correct": 1,
    "explanation": "Hair should be shampooed first to remove surface debris so the treatment can penetrate the scalp effectively."
  },
  {
    "id": "bl38-q5",
    "question": "How should a scalp treatment be applied?",
    "options": ["Poured directly from the bottle onto the crown", "Applied to the lengths of the hair", "Applied directly to the scalp in sections and massaged with fingertips", "Sprayed on and left without massage"],
    "correct": 2,
    "explanation": "Sectioning ensures even coverage. Fingertip massage increases absorption and stimulates circulation."
  }
]'::jsonb
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-lesson-38';

-- ── barber-lesson-40: Building Your Clientele ─────────────────────────────────
UPDATE public.course_lessons
SET quiz_questions = '[
  {
    "id": "bl40-q1",
    "question": "According to client retention research, clients decide whether to return within:",
    "options": ["The first 5 minutes", "The first 30 seconds", "After seeing the finished cut", "After their second visit"],
    "correct": 1,
    "explanation": "First impressions form within 30 seconds. Punctuality, cleanliness, and professionalism drive return visits."
  },
  {
    "id": "bl40-q2",
    "question": "Which is the most effective retention strategy for a new client?",
    "options": ["Offer a discount on their next visit", "Recommend rebooking before they leave the chair", "Send a promotional email after one week", "Post their photo on social media"],
    "correct": 1,
    "explanation": "Rebooking at the chair locks in the next appointment while the client is satisfied and engaged."
  },
  {
    "id": "bl40-q3",
    "question": "What should a barber keep on a client card?",
    "options": ["Client's home address and income", "Style preferences, products used, and last visit date", "Credit card information", "Social media handles"],
    "correct": 1,
    "explanation": "Client cards track style history and preferences, allowing personalized service that builds loyalty."
  },
  {
    "id": "bl40-q4",
    "question": "Social media is most effective for building clientele when you:",
    "options": ["Post only promotional pricing", "Post consistently and show your actual work", "Follow competitors only", "Post once per month"],
    "correct": 1,
    "explanation": "Consistent posting of real work builds credibility and attracts new clients organically."
  },
  {
    "id": "bl40-q5",
    "question": "A simple follow-up text to a new client after their visit primarily serves to:",
    "options": ["Ask for a tip", "Upsell products", "Build relationship and encourage return", "Collect feedback for social media"],
    "correct": 2,
    "explanation": "A follow-up shows the client they are valued, which significantly increases the likelihood of return."
  }
]'::jsonb
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-lesson-40';

-- ── barber-lesson-41: Booth Rental vs. Commission vs. Ownership ───────────────
UPDATE public.course_lessons
SET quiz_questions = '[
  {
    "id": "bl41-q1",
    "question": "Under a commission model, the barber typically receives what percentage of service revenue?",
    "options": ["100%", "10–20%", "40–60%", "75–90%"],
    "correct": 2,
    "explanation": "Commission arrangements typically pay the barber 40–60% of service revenue. The shop covers supplies and client acquisition."
  },
  {
    "id": "bl41-q2",
    "question": "Under a booth rental model, who is responsible for the barber's taxes?",
    "options": ["The shop owner", "The state board", "The barber — they are self-employed", "The client"],
    "correct": 2,
    "explanation": "Booth renters are self-employed independent contractors. They keep 100% of revenue but handle their own taxes and expenses."
  },
  {
    "id": "bl41-q3",
    "question": "Which business model is generally recommended for a new barber still building skills?",
    "options": ["Booth rental", "Shop ownership", "Commission", "Franchise"],
    "correct": 2,
    "explanation": "Commission is best for new barbers — the shop provides clients, supplies, and mentorship while the barber develops their craft."
  },
  {
    "id": "bl41-q4",
    "question": "A booth renter pays the shop owner:",
    "options": ["A percentage of each service", "Nothing — they keep all revenue", "A fixed weekly or monthly fee", "A percentage of tips only"],
    "correct": 2,
    "explanation": "Booth renters pay a fixed rent (weekly or monthly) for use of the chair, regardless of how much they earn."
  },
  {
    "id": "bl41-q5",
    "question": "Shop ownership offers the highest earning potential but requires:",
    "options": ["Only a barber license", "Capital, business management skills, and staff oversight", "A commission agreement with another shop", "Approval from the state board only"],
    "correct": 1,
    "explanation": "Ownership means managing rent, payroll, supplies, marketing, and compliance — significant responsibility beyond cutting hair."
  }
]'::jsonb
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-lesson-41';

-- ── barber-lesson-42: Pricing, Tipping & Financial Basics ────────────────────
UPDATE public.course_lessons
SET quiz_questions = '[
  {
    "id": "bl42-q1",
    "question": "When setting your service prices, which factor should you research first?",
    "options": ["Your personal income goal only", "Local market rates", "What the most expensive shop charges", "What your friends charge"],
    "correct": 1,
    "explanation": "Local market rates establish the baseline. Price too high and you lose clients; too low and you undervalue your work."
  },
  {
    "id": "bl42-q2",
    "question": "The standard tip percentage for barbering services is:",
    "options": ["5–10%", "15–20%", "25–30%", "Tips are not customary in barbering"],
    "correct": 1,
    "explanation": "15–20% is the standard tip range for barbering, consistent with other personal service industries."
  },
  {
    "id": "bl42-q3",
    "question": "As a self-employed barber, you are required to pay self-employment tax, which covers:",
    "options": ["State income tax only", "Social Security and Medicare", "Federal income tax only", "Sales tax on services"],
    "correct": 1,
    "explanation": "Self-employment tax (15.3%) covers Social Security and Medicare contributions that an employer would otherwise split with you."
  },
  {
    "id": "bl42-q4",
    "question": "When should a barber raise their prices?",
    "options": ["Never — it drives clients away", "Only when the shop owner says so", "As clientele grows and experience increases", "Only after 10 years in the industry"],
    "correct": 2,
    "explanation": "Prices should increase as your skill, reputation, and demand grow. Underpricing experienced work is a common mistake."
  },
  {
    "id": "bl42-q5",
    "question": "To make tipping easy for clients, a barber should:",
    "options": ["Ask clients directly for a tip", "Have a tip jar or use a payment system that prompts for tips", "Include the tip in the service price", "Only accept cash tips"],
    "correct": 1,
    "explanation": "Removing friction from the tipping process — tip jar, digital prompt — increases tip frequency without awkward requests."
  }
]'::jsonb
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-lesson-42';

-- ── barber-lesson-43: Professionalism & Ethics ────────────────────────────────
UPDATE public.course_lessons
SET quiz_questions = '[
  {
    "id": "bl43-q1",
    "question": "Client confidentiality in the barbershop means:",
    "options": ["You can share client stories anonymously online", "What a client shares in the chair stays private", "You must report all client conversations to the shop owner", "Confidentiality only applies to medical information"],
    "correct": 1,
    "explanation": "Clients share personal information in the chair. Respecting that privacy is fundamental to professional ethics."
  },
  {
    "id": "bl43-q2",
    "question": "If a client is abusive or threatening, the correct response is to:",
    "options": ["Argue back to defend yourself", "Finish the service quickly and say nothing", "Calmly end the service and ask them to leave", "Call the police immediately without warning"],
    "correct": 2,
    "explanation": "De-escalate calmly. You have the right to refuse service. Safety comes first — do not continue a service under threat."
  },
  {
    "id": "bl43-q3",
    "question": "Speaking negatively about other barbers or shops to clients is considered:",
    "options": ["Acceptable if it is true", "A violation of professional ethics", "Good marketing", "Required disclosure"],
    "correct": 1,
    "explanation": "Disparaging competitors reflects poorly on your own professionalism and violates the barber's code of conduct."
  },
  {
    "id": "bl43-q4",
    "question": "If you make an error on a client's cut, the professional response is to:",
    "options": ["Charge full price and say nothing", "Blame the client's hair type", "Offer to fix the issue at no charge", "Refer them to another barber"],
    "correct": 2,
    "explanation": "Owning mistakes and offering to correct them builds trust and demonstrates integrity."
  },
  {
    "id": "bl43-q5",
    "question": "Performing services outside your scope of practice means:",
    "options": ["Doing services you are not licensed or trained to perform", "Working longer hours than scheduled", "Charging more than market rate", "Using products not sold in your shop"],
    "correct": 0,
    "explanation": "Scope of practice is defined by your license. Performing services beyond it is illegal and puts clients at risk."
  }
]'::jsonb
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-lesson-43';

-- ── barber-lesson-44: Styling Products & Finishing ───────────────────────────
UPDATE public.course_lessons
SET quiz_questions = '[
  {
    "id": "bl44-q1",
    "question": "Which styling product provides medium-to-high hold with high shine — the classic barbershop finish?",
    "options": ["Clay", "Cream", "Pomade", "Wax"],
    "correct": 2,
    "explanation": "Pomade is the traditional barbershop product — medium to high hold with a glossy finish, ideal for slick styles and waves."
  },
  {
    "id": "bl44-q2",
    "question": "Clay styling products are best described as:",
    "options": ["High hold, high shine", "Light hold, natural finish", "Medium-to-high hold, matte finish", "Strong hold, wet look"],
    "correct": 2,
    "explanation": "Clay provides medium-to-high hold with a matte finish — popular for modern textured and natural styles."
  },
  {
    "id": "bl44-q3",
    "question": "When applying styling product, you should start with:",
    "options": ["A large amount to ensure coverage", "A small amount — you can always add more", "The product applied directly to the scalp", "Product on wet hair only"],
    "correct": 1,
    "explanation": "Starting small prevents over-application, which weighs hair down and creates a greasy appearance."
  },
  {
    "id": "bl44-q4",
    "question": "Which product is best suited for mustaches and detailed styling work?",
    "options": ["Gel", "Cream", "Pomade", "Wax"],
    "correct": 3,
    "explanation": "Wax provides flexible hold and precision control — ideal for mustaches, beards, and detailed finishing work."
  },
  {
    "id": "bl44-q5",
    "question": "To activate most styling products before application, you should:",
    "options": ["Mix with water in your palm", "Warm the product between your palms", "Apply directly from the container to hair", "Heat with a blow dryer first"],
    "correct": 1,
    "explanation": "Warming product between the palms softens it, ensures even distribution, and improves workability."
  }
]'::jsonb
WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-lesson-44';
