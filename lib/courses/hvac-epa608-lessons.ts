/**
 * EPA 608 Certification — Full Lesson Scripts
 * Covers Core, Type I, Type II, Type III sections
 * Each lesson is a complete voiceover script for video recording.
 * Lesson IDs follow the hvac-XX-YY pattern, slotted into Module 16.
 */

import { HVAC_LESSON_CONTENT } from './hvac-lesson-content';

function add(c: Parameters<typeof HVAC_LESSON_CONTENT extends Record<string, infer V> ? (v: V) => void : never>[0]) {
  (HVAC_LESSON_CONTENT as Record<string, typeof c>)[c.lessonId] = c;
}

// ═══════════════════════════════════════════════════════════════
// EPA 608 — CORE SECTION
// ═══════════════════════════════════════════════════════════════

add({
  lessonId: 'epa-core-01',
  concept: `The EPA Section 608 certification is required by federal law before you can purchase or handle any refrigerant. The Clean Air Act of 1990, Section 608, makes it illegal to knowingly vent refrigerants into the atmosphere. Fines go up to $44,539 per day per violation. There is no grace period and no exception for apprentices — if you touch refrigerant without this certification, you and your employer are both liable.

The exam has four sections: Core, Type I, Type II, and Type III. You must pass each section with a 70 percent score. Passing all four earns you Universal certification — the one employers want. Universal means you can legally work on any refrigeration or air conditioning equipment.

The Core section covers environmental law, refrigerant regulations, the refrigeration cycle, and safety. It applies to every technician regardless of what equipment they work on. You cannot skip it. Even if you only plan to work on small appliances, you still must pass Core.

Here is what the exam looks like: 25 multiple-choice questions per section, 100 questions total. The exam is proctored — you sit in front of a webcam and a proctor watches you take it. You cannot use notes. You cannot use your phone. You get one attempt per sitting. If you fail a section, you can retake just that section — you do not have to retake sections you already passed.

The certification never expires. Once you earn it, it is yours for life. Keep your card with you on every job. Refrigerant suppliers will ask to see it before they sell you refrigerant.`,
  keyTerms: [
    { term: 'Section 608', definition: 'The part of the Clean Air Act that regulates refrigerant handling and requires technician certification.' },
    { term: 'Universal Certification', definition: 'Earned by passing Core + Type I + Type II + Type III. Allows you to work on all equipment types.' },
    { term: 'Venting', definition: 'Intentionally releasing refrigerant into the atmosphere. Illegal under Section 608. Fine up to $44,539 per day per violation.' },
    { term: 'Proctored Exam', definition: 'Exam monitored by a live proctor via webcam. Closed book. No notes or phone.' },
  ],
  jobApplication: 'Every HVAC employer requires EPA 608 before your first day on the job. Without it you cannot legally touch a system that contains refrigerant.',
  watchFor: [
    '$44,539 per day per violation — memorize this number',
    '70 percent passing score per section',
    'Universal = Core + Type I + Type II + Type III',
    'Certification never expires',
  ],
});

add({
  lessonId: 'epa-core-02',
  concept: `Ozone is a molecule made of three oxygen atoms. The ozone layer sits in the stratosphere, 10 to 30 miles above the Earth. Its job is to absorb ultraviolet-B radiation from the sun. UV-B causes skin cancer, cataracts, and immune system damage in humans. It also damages crops and marine ecosystems.

Refrigerants containing chlorine destroy ozone. Here is the mechanism: when a CFC or HCFC refrigerant leaks into the atmosphere, it drifts up to the stratosphere. UV radiation breaks the molecule apart and releases a free chlorine atom. That chlorine atom attacks an ozone molecule, stealing one oxygen atom and turning ozone into ordinary oxygen. The chlorine atom is then released again to attack another ozone molecule. One chlorine atom can destroy up to 100,000 ozone molecules before it is neutralized.

The Ozone Depletion Potential, or ODP, measures how much a refrigerant damages ozone compared to R-11, which has an ODP of 1.0. CFCs like R-12 have high ODP. HCFCs like R-22 have lower ODP but still cause damage. HFCs like R-410A have zero ODP because they contain no chlorine. HFOs also have zero ODP.

Global Warming Potential, or GWP, measures how much heat a refrigerant traps in the atmosphere compared to carbon dioxide, which has a GWP of 1. R-410A has a GWP of 2,088. R-22 has a GWP of 1,810. Newer refrigerants like R-32 and R-454B have lower GWP and are replacing R-410A in new equipment.

The exam will ask you to compare ODP and GWP values across refrigerant types. Know that CFCs have the highest ODP, HCFCs have moderate ODP, and HFCs have zero ODP. Know that high GWP refrigerants are being phased down under the AIM Act.`,
  keyTerms: [
    { term: 'ODP', definition: 'Ozone Depletion Potential. Measured relative to R-11 (ODP = 1.0). CFCs highest, HCFCs moderate, HFCs zero.' },
    { term: 'GWP', definition: 'Global Warming Potential. Measured relative to CO2 (GWP = 1). R-410A = 2,088. R-22 = 1,810.' },
    { term: 'CFC', definition: 'Chlorofluorocarbon. Contains chlorine and fluorine. Highest ODP. Fully phased out. Example: R-12.' },
    { term: 'HCFC', definition: 'Hydrochlorofluorocarbon. Contains hydrogen, chlorine, fluorine. Lower ODP than CFCs. Being phased out. Example: R-22.' },
    { term: 'HFC', definition: 'Hydrofluorocarbon. Contains hydrogen and fluorine only. Zero ODP. Example: R-410A, R-134a.' },
    { term: 'HFO', definition: 'Hydrofluoroolefin. Zero ODP, very low GWP. Next-generation refrigerants. Example: R-1234yf.' },
  ],
  jobApplication: 'Understanding ODP and GWP helps you explain to customers why older refrigerants are being phased out and why newer systems use different refrigerants.',
  watchFor: [
    'One chlorine atom destroys up to 100,000 ozone molecules',
    'CFCs = highest ODP, HFCs = zero ODP',
    'R-11 is the ODP reference point (ODP = 1.0)',
    'GWP is measured relative to CO2',
  ],
});

add({
  lessonId: 'epa-core-03',
  concept: `Two international agreements govern refrigerant phase-outs. You need to know both for the exam.

The Montreal Protocol was signed in 1987. It is an international treaty that phases out the production and use of ozone-depleting substances. The United States ratified it and implemented it through the Clean Air Act. Under the Montreal Protocol, CFCs were fully phased out of production in the United States in 1996. HCFCs are being phased out on a schedule — R-22 production and import ended January 1, 2020. You can still use recovered or reclaimed R-22 to service existing equipment, but no new R-22 is being manufactured.

The Clean Air Act of 1990 is the U.S. law that implements the Montreal Protocol and adds additional requirements. Section 608 specifically covers refrigerant management. Key provisions: it is illegal to knowingly vent refrigerants. Technicians must be certified. Refrigerant must be recovered before opening any system. Leaks above certain rates must be repaired. Records must be kept for appliances with 50 or more pounds of refrigerant.

The AIM Act — American Innovation and Manufacturing Act — was signed in 2020. It phases down HFCs based on their GWP. R-410A is being phased down and will be replaced by lower-GWP alternatives like R-32, R-454B, and R-466A in new equipment. The AIM Act does not ban existing R-410A systems — you can still service them. It restricts new production.

Phase-out dates the exam tests: CFCs phased out 1996. R-22 production ended 2020. HFCs being phased down under AIM Act starting 2025.`,
  keyTerms: [
    { term: 'Montreal Protocol', definition: 'International treaty (1987) phasing out ozone-depleting substances. CFCs out by 1996, HCFCs phased out by schedule.' },
    { term: 'Clean Air Act Section 608', definition: 'U.S. law requiring technician certification, refrigerant recovery, and leak repair.' },
    { term: 'AIM Act', definition: 'American Innovation and Manufacturing Act (2020). Phases down HFCs based on GWP.' },
    { term: 'R-22 Phase-Out', definition: 'Production and import of R-22 ended January 1, 2020. Recovered/reclaimed R-22 can still be used for service.' },
  ],
  jobApplication: 'Customers with older R-22 systems ask about this constantly. You need to explain clearly that R-22 is still available for service but costs more because supply is limited.',
  watchFor: [
    'CFCs phased out 1996, R-22 production ended 2020',
    'Recovered and reclaimed R-22 can still be used for service',
    'AIM Act phases DOWN HFCs — does not ban existing systems',
    'Montreal Protocol = international, Clean Air Act = U.S. law',
  ],
});

add({
  lessonId: 'epa-core-04',
  concept: `The Three R's are the foundation of legal refrigerant handling. Every technician must know the exact definition of each one because the exam tests the differences precisely.

Recover means to remove refrigerant from a system and store it in an approved recovery cylinder. You are not cleaning it or testing it — you are just getting it out of the system and into a container. Recovery is required before opening any part of the refrigerant circuit. You use a recovery machine to do this. The recovered refrigerant may be contaminated with oil, moisture, or non-condensables. It cannot be put back into a different system without being reclaimed first.

Recycle means to clean refrigerant for reuse using oil separation and single or multiple passes through filter-driers. Recycled refrigerant can be returned to the same system or the same owner's other systems. It does not meet the purity standard of virgin refrigerant. You cannot sell recycled refrigerant or put it into a different owner's system. Recycling is done on-site with recycling equipment.

Reclaim means to reprocess refrigerant to the purity standard of new refrigerant, as defined by AHRI Standard 700. Reclaiming requires laboratory-grade equipment and chemical analysis. Only EPA-certified reclaimers can reclaim refrigerant. Reclaimed refrigerant meets virgin specifications and can be sold and used in any system.

The exam will give you scenarios and ask which R applies. Key distinctions: Recovery = remove and store. Recycle = clean for same owner. Reclaim = reprocess to virgin specs by a certified reclaimer.`,
  keyTerms: [
    { term: 'Recover', definition: 'Remove refrigerant from a system into an approved cylinder. Required before opening any refrigerant circuit.' },
    { term: 'Recycle', definition: 'Clean refrigerant using oil separation and filter-driers for reuse in the same system or same owner\'s systems.' },
    { term: 'Reclaim', definition: 'Reprocess refrigerant to AHRI 700 virgin purity standards. Only EPA-certified reclaimers can do this.' },
    { term: 'AHRI 700', definition: 'The purity standard that reclaimed refrigerant must meet. Equivalent to new virgin refrigerant.' },
  ],
  jobApplication: 'You will recover refrigerant on every service call that requires opening the system. Knowing the difference between the Three R\'s keeps you legally compliant.',
  watchFor: [
    'Recover = remove and store (no cleaning)',
    'Recycle = clean for same owner only',
    'Reclaim = virgin purity, certified reclaimers only',
    'You cannot put recovered refrigerant into a different owner\'s system',
  ],
});

add({
  lessonId: 'epa-core-05',
  concept: `Refrigerant safety is tested heavily on the Core exam. You need to know the hazards of refrigerants and the correct safety procedures.

Refrigerants are stored as liquids under pressure. When liquid refrigerant contacts skin or eyes, it causes frostbite instantly. Always wear safety glasses and chemical-resistant gloves when handling refrigerant. If refrigerant contacts your eyes, flush with water for 15 minutes and seek medical attention immediately.

Refrigerant cylinders must never be filled above 80 percent of their capacity by weight. This is the 80 percent rule. Liquid refrigerant expands when heated. If a cylinder is overfilled and exposed to heat, the liquid has no room to expand and the cylinder can rupture. Recovery cylinders have a gross weight stamped on them — the tare weight plus 80 percent of the cylinder's rated capacity gives you the maximum fill weight.

Refrigerant cylinders must be stored upright and secured so they cannot fall. They must be kept away from heat sources. They must never be heated with an open flame to increase pressure — this is extremely dangerous and illegal.

When refrigerant contacts an open flame, it decomposes into phosgene gas. Phosgene is highly toxic and was used as a chemical weapon in World War I. If you smell a sharp, acrid odor near a flame while working with refrigerant, evacuate immediately and ventilate the area.

DOT shipping requirements: refrigerant cylinders transported on public roads must comply with Department of Transportation regulations. Cylinders must be properly labeled, secured in the vehicle, and not transported in enclosed passenger compartments. Recovery cylinders must be labeled with the type of refrigerant recovered.`,
  keyTerms: [
    { term: '80% Fill Rule', definition: 'Recovery cylinders must never be filled above 80% of capacity by weight. Prevents rupture from thermal expansion.' },
    { term: 'Phosgene', definition: 'Toxic gas produced when refrigerant contacts an open flame. Evacuate and ventilate immediately.' },
    { term: 'DOT', definition: 'Department of Transportation. Regulates transport of refrigerant cylinders on public roads.' },
    { term: 'Tare Weight', definition: 'The weight of an empty cylinder. Stamped on the collar. Used to calculate maximum fill weight.' },
  ],
  jobApplication: 'You will handle refrigerant cylinders on every job. The 80% rule and proper storage prevent accidents that can injure you and others.',
  watchFor: [
    '80% fill rule — never overfill recovery cylinders',
    'Phosgene from refrigerant + open flame — evacuate immediately',
    'Never heat cylinders with open flame',
    'Cylinders must be secured upright during transport',
  ],
});

add({
  lessonId: 'epa-core-06',
  concept: `The vapor compression refrigeration cycle is the mechanical process that moves heat. Every air conditioner, heat pump, and refrigerator uses this cycle. Understanding it is essential for the exam and for diagnosing any system.

The cycle has four components: the compressor, the condenser, the expansion device, and the evaporator. Refrigerant flows through all four in a continuous loop.

Start at the compressor. The compressor takes in low-pressure refrigerant vapor from the suction line and compresses it into high-pressure, high-temperature vapor. The compressor is the heart of the system — it is what makes everything else work. After the compressor, the refrigerant is hot and at high pressure.

The hot high-pressure vapor flows to the condenser. In a residential split system, the condenser is the outdoor coil. The condenser fan blows outdoor air across the coil. The refrigerant releases its heat to the outdoor air and condenses from vapor into liquid. The refrigerant is still at high pressure but now it is a warm liquid.

The warm high-pressure liquid flows to the expansion device. This can be a thermostatic expansion valve (TXV), an electronic expansion valve (EEV), or a fixed orifice like a piston or capillary tube. The expansion device restricts flow, causing a sudden pressure drop. As pressure drops, the refrigerant's boiling point drops. Some of the liquid flashes to vapor, and the remaining liquid becomes very cold.

The cold low-pressure mixture enters the evaporator. In a split system, the evaporator is the indoor coil. The blower pushes warm room air across the cold coil. The refrigerant absorbs heat from the room air and boils from liquid to vapor. The room air is cooled and dehumidified. The refrigerant vapor returns to the compressor as low-pressure vapor and the cycle repeats.

Heat always flows from hot to cold. The refrigeration cycle exploits this by making the refrigerant colder than the space being cooled (so heat flows into the refrigerant) and hotter than the outdoor air (so heat flows out of the refrigerant).`,
  keyTerms: [
    { term: 'Compressor', definition: 'Pumps refrigerant and raises its pressure and temperature. Creates the pressure difference that drives the cycle.' },
    { term: 'Condenser', definition: 'Rejects heat from the refrigerant to the outdoor air. Refrigerant changes from vapor to liquid here.' },
    { term: 'Expansion Device', definition: 'Reduces refrigerant pressure, causing temperature to drop. TXV, EEV, piston, or capillary tube.' },
    { term: 'Evaporator', definition: 'Absorbs heat from the conditioned space. Refrigerant changes from liquid to vapor here.' },
    { term: 'Suction Line', definition: 'The large insulated line carrying low-pressure vapor from the evaporator to the compressor.' },
    { term: 'Liquid Line', definition: 'The small uninsulated line carrying high-pressure liquid from the condenser to the expansion device.' },
  ],
  jobApplication: 'Every diagnosis starts with understanding where the refrigerant is in the cycle and what state it should be in at each point.',
  watchFor: [
    'Compressor = low pressure in, high pressure out',
    'Condenser = vapor in, liquid out (heat rejected)',
    'Expansion device = high pressure in, low pressure out',
    'Evaporator = liquid in, vapor out (heat absorbed)',
  ],
});

add({
  lessonId: 'epa-core-07',
  concept: `Pressure-Temperature charts, called P/T charts, are one of the most important tools in refrigerant work. The exam tests your ability to read them and understand what they tell you.

Every refrigerant has a specific relationship between its pressure and its boiling point temperature. When you know the pressure of a refrigerant, you can look up its saturation temperature — the temperature at which it boils or condenses at that pressure. This is called the saturation temperature or the corresponding temperature.

Here is why this matters: when you connect your gauge manifold to a system and read the suction pressure, you can look up the corresponding saturation temperature on the P/T chart. That tells you the evaporator coil temperature. If the suction pressure for R-410A reads 120 psi, the P/T chart tells you the saturation temperature is approximately 40°F. That means the evaporator coil is boiling refrigerant at 40°F.

Superheat is the temperature of the refrigerant vapor above its saturation temperature. You measure superheat at the suction line near the evaporator. If the saturation temperature is 40°F and the actual suction line temperature is 50°F, the superheat is 10°F. Superheat tells you how much refrigerant is in the evaporator — low superheat means the evaporator is flooded, high superheat means it is starved.

Subcooling is the temperature of the liquid refrigerant below its saturation temperature. You measure subcooling at the liquid line near the condenser. If the saturation temperature at the liquid line pressure is 110°F and the actual liquid line temperature is 95°F, the subcooling is 15°F. Subcooling tells you the condition of the liquid leaving the condenser — adequate subcooling ensures no flash gas enters the expansion device.

The exam will give you a pressure reading and ask you to identify the refrigerant or determine if the system is operating correctly. Know how to use a P/T chart and understand what superheat and subcooling values indicate.`,
  keyTerms: [
    { term: 'P/T Chart', definition: 'Pressure-Temperature chart showing the saturation temperature of a refrigerant at any given pressure.' },
    { term: 'Saturation Temperature', definition: 'The temperature at which a refrigerant boils or condenses at a specific pressure.' },
    { term: 'Superheat', definition: 'Temperature of vapor above its saturation temperature. Measured at suction line. Indicates evaporator refrigerant level.' },
    { term: 'Subcooling', definition: 'Temperature of liquid below its saturation temperature. Measured at liquid line. Indicates condenser performance.' },
  ],
  jobApplication: 'You will use P/T charts on every refrigerant service call to verify system pressures are correct and calculate superheat and subcooling.',
  watchFor: [
    'Superheat measured at suction line near evaporator',
    'Subcooling measured at liquid line near condenser',
    'Low superheat = flooded evaporator, high superheat = starved evaporator',
    'P/T chart tells you saturation temperature at any pressure',
  ],
});
