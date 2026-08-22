# Homepage Hero Commercial — Production Brief

Status: APPROVED DIRECTION

## Objective
Turn the existing homepage hero into a 30–35 second cinematic career commercial that sells the visitor's future while preserving the canonical HeroVideo runtime, autoplay behavior, accessibility controls, analytics, responsive layout, and verified-claims discipline.

Do not replace the hero with a static storyboard. Render a real MP4 through the existing commercial/video pipeline and then connect that asset to the canonical homepage hero configuration.

## Concurrency rule
Another engineering environment may modify the repository at the same time. Before every modification, re-read current `main` and the exact target file. Preserve newer valid work. Do not revert unrelated Course Builder, admissions, portal, media, or homepage work.

## Visual direction
High-energy, premium workforce commercial. Full-bleed 16:9 footage. Sharp 1080p minimum output. Authentic people performing the occupation rather than posing. Fast but readable cuts. Clean animated typography. No dark gradient over the homepage video. No poster flash when video is configured. Avoid generic classroom stock, fake certificates, fake logos, invented testimonials, fake statistics, and text baked into generated footage.

Use a diverse, realistic Indiana workforce visual language. Favor close/medium action shots, hands using tools, mentor/apprentice interaction, healthcare practice, barber work, HVAC/trades activity, computer/business work, and confident career-transition imagery.

## Storyboard
Target duration: 35 seconds.

### Scene 1 — Hook — 0:00–0:04
On-screen: `YOUR NEXT CAREER STARTS HERE.`
Visual: cinematic prospective learner entering a modern hands-on training/work environment; purposeful movement; Indianapolis/workforce feel without fabricating a recognizable location.
Narration: `Your next career can start here.`

### Scene 2 — Healthcare — 0:04–0:09
On-screen: `HEALTHCARE`
Secondary animation: `Train. Practice. Prepare.`
Visual: adult learner in scrubs performing supervised clinical skills in a realistic training environment.
Narration: `Train for hands-on healthcare careers and build skills you can use.`

### Scene 3 — Skilled Trades — 0:09–0:14
On-screen: `SKILLED TRADES`
Secondary animation: `Build skills. Solve problems.`
Visual: HVAC/building-services technician working safely with equipment and tools; active mentor presence where practical.
Narration: `Learn skilled trades by working with real tools and real-world problems.`

### Scene 4 — Barber & Beauty — 0:14–0:19
On-screen: `BARBER & BEAUTY`
Secondary animation: `Learn the craft in the workplace.`
Visual: apprentice actively cutting/styling hair in a professional shop with a mentor nearby; clients and authentic shop energy.
Narration: `Build your craft through workplace-connected barber and beauty pathways.`

### Scene 5 — Business & Technology — 0:19–0:24
On-screen: `BUSINESS & TECHNOLOGY`
Secondary animation: `Skills for today's opportunities.`
Visual: adult learner using modern business/software tools in a professional environment; avoid fake dashboards or branded software claims.
Narration: `Develop business and technology skills for today's opportunities.`

### Scene 6 — Apprenticeship — 0:24–0:29
On-screen: `EARN WHILE YOU LEARN`
Secondary animation: `Registered apprenticeship pathways`
Visual: apprentice and mentor working side-by-side in a real workplace. Do not imply every Elevate program is paid; this statement belongs specifically to qualifying apprenticeship pathways.
Narration: `And through qualifying apprenticeship pathways, earn while you learn in the workplace.`

### Scene 7 — Transformation / CTA — 0:29–0:35
On-screen sequence: `TRAIN.` → `BUILD.` → `GROW.` → `CHOOSE YOUR NEXT CHAPTER.`
Visual: rapid polished montage of healthcare, trades, barber/beauty, business/technology, mentor interaction, then a confident learner moving forward.
Narration: `Train. Build. Grow. Choose your next chapter with Elevate for Humanity.`

## Homepage overlay copy
Keep the website overlay concise so it does not compete with the commercial's animated text.

Headline: `Train for a career. Earn while you learn. Build your next chapter.`
Subheadline: `Hands-on career training, registered apprenticeships, and employer-connected learning in Indiana.`
Primary CTA: `Explore Programs` → `/programs`
Secondary CTA: `Explore Apprenticeships` → `/apprenticeships`

## Narration behavior
The video must remain browser-autoplay-safe (muted video). Narration must use the canonical hero audio control and may start after legitimate user interaction where browser policy allows. Do not attempt to bypass browser autoplay restrictions.

Narration master:
`Your next career can start here. Train for hands-on healthcare careers and build skills you can use. Learn skilled trades by working with real tools and real-world problems. Build your craft through workplace-connected barber and beauty pathways. Develop business and technology skills for today's opportunities. And through qualifying apprenticeship pathways, earn while you learn in the workplace. Train. Build. Grow. Choose your next chapter with Elevate for Humanity.`

## Existing pipeline
Use the existing commercial infrastructure rather than adding a second video system:
- `lib/media/commercial-plan.ts`
- `lib/media/commercial-renderer.ts`
- `/api/admin/media-studio/commercial`
- existing Pexels stock acquisition
- existing generative-video provider when configured
- existing OpenAI commercial narration
- FFmpeg assembly
- studio asset persistence

Recommended brief:
- projectName: `Homepage Hero 2026`
- title: `Choose Your Next Chapter`
- audience: `Adults in Indiana exploring career training, registered apprenticeships, career changes, and employer-connected learning`
- objective: `Create immediate excitement, show the breadth of career pathways, make apprenticeship tangible, and drive visitors to explore programs or apprenticeships`
- cta: `Choose Your Next Chapter`
- durationSeconds: `35`
- aspectRatio: `16:9`
- sourceMode: `hybrid`
- tone: `cinematic`
- voice: `coral`
- includeCaptions: `false` for the background hero master; accessibility transcript remains available through HeroVideo

## Claims guardrail
Do not claim:
- every program is free or funded
- every program is an apprenticeship
- every learner is paid
- guaranteed employment, wages, placement, licensing, certification, or completion
- unverified enrollment/outcome statistics
- blanket state/federal approval

The commercial may accurately describe career training, employer-connected learning, registered apprenticeship offerings, hands-on learning, and earn-while-you-learn specifically for qualifying apprenticeship pathways.

## Render and integration requirements
1. Generate/retrieve all scene media at sufficient quality for a full-width desktop hero.
2. Render the 16:9 master at 30 fps, H.264, yuv420p, fast-start enabled.
3. Keep animated typography within mobile-safe center regions because the desktop master may be cropped on narrow screens.
4. Create a mobile-safe derivative only if the desktop crop materially loses subjects/text.
5. Persist the final video through the existing media asset system/object storage.
6. Update the canonical `home` hero video source to the new persisted asset. Do not hardcode temporary URLs.
7. Keep `overlayMode="none"` on the homepage.
8. Do not render a poster layer when a valid homepage video is configured.
9. Connect the narration asset to the canonical homepage hero audio control.
10. Preserve transcript and reduced-motion/accessibility behavior.

## Acceptance gate
Do not call this complete until all are true:
- homepage video loads on desktop and mobile
- no poster flashes over/under normal video startup
- no unwanted gradient/dark overlay
- footage is sharp and not visibly stretched
- all seven concepts appear in the rendered story
- animated text is readable and not clipped
- CTA overlay remains usable
- narration Play Audio control works after user interaction
- transcript remains available
- reduced-motion behavior is safe
- no unsupported claims are present
- homepage visual-integrity checks pass
- marketing build passes
- deployed homepage is rechecked after release
