/**
 * Generate full 6-scene HeyGen avatar video for HVAC Module 1.
 *
 * Usage: node scripts/generate-heygen-full.mjs
 * Requires: OPENAI_API_KEY, HEYGEN_API_KEY, SUPABASE_SERVICE_ROLE_KEY in env
 */

import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Avatar + voice config
const AVATAR_ID = 'Brandon_Business_Standing_Front_public';
const VOICE_ID = '61ac6ff657244feb9da60288fbcfea20'; // David Boles - Informative

/* ── 6 scenes ────────────────────────────────────────────────────── */

const scenes = [
  {
    id: 'hook',
    script: `Welcome to the Elevate for Humanity HVAC Technician Training Program. If you have ever walked past that big metal box humming outside a building and wondered what is inside it and how it works, this lesson is for you. In the next few minutes, you will learn the six major components inside a residential condenser unit and how a technician inspects them on a real service call. By the end, you will be able to identify each part by name and explain what it does. Let us get started.`,
    imagePrompt: 'Photorealistic wide shot of a residential HVAC condenser unit outdoors on a concrete pad next to a brick house, bright sunny day, green lawn, the metal cabinet is clean and visible with the fan grille on top, professional training photography, no text or labels, 16:9 landscape',
  },
  {
    id: 'system-overview',
    script: `A standard residential cooling system is called a split system because it has two main sections. The indoor unit sits inside the building and contains the evaporator coil and blower motor. It absorbs heat from the indoor air. The outdoor unit is the condenser. It contains the compressor, condenser coil, fan motor, and electrical controls. Its job is to reject the heat that was absorbed indoors and release it into the outdoor air. The thermostat is the control center. When the indoor temperature rises above the set point, the thermostat signals the system to start the cooling cycle. The duct system distributes conditioned air throughout the building.`,
    imagePrompt: 'Technical illustration style photorealistic cutaway diagram showing a residential split air conditioning system, indoor unit with evaporator coil on the left connected by refrigerant lines to outdoor condenser unit on the right, arrows showing airflow direction, clean white background, professional HVAC training visual, no text labels, 16:9 landscape',
  },
  {
    id: 'components',
    script: `Now let us look at the six key components inside the condenser. First, the compressor. This is the heart of the system. It pumps refrigerant by compressing low-pressure gas into high-pressure gas. If it fails, the entire system stops cooling. Next, the condenser coil. These are the copper tubes with aluminum fins that wrap around the cabinet walls. Hot refrigerant flows through and outdoor air carries the heat away. Dirty or bent fins block airflow and cause high pressures. The fan motor sits on top and pulls air through the coil. A failed fan causes the unit to overheat. The capacitor is a small cylinder that stores electrical energy to start the motors. It is the single most common failure in residential HVAC. The contactor is an electromagnetic switch that connects power to the compressor and fan when the thermostat calls for cooling. Finally, the service valves are the two copper connections where technicians attach gauges to read system pressures.`,
    imagePrompt: 'Photorealistic close-up of the inside of an open HVAC condenser unit showing the compressor cylinder, copper condenser coil with aluminum fins, fan motor mounted on top bracket, silver cylindrical capacitor, contactor relay switch, and copper service valve ports with caps, electrical compartment panel removed, bright workshop lighting, professional training photo, no text or labels, 16:9 landscape',
  },
  {
    id: 'inspection',
    script: `Here is how a technician inspects a condenser on a service call. Step one, visual inspection. Walk around the unit and look for debris, damaged fan blades, disconnected wiring, or oil stains on the refrigerant lines. Oil means a refrigerant leak. Step two, check airflow. With the system running, place your hand over the top grille. You should feel strong warm air. Weak airflow means a dirty coil or failing fan motor. Step three, inspect the capacitor. Turn off power at the disconnect, remove the electrical panel, and look for bulging or burn marks. Test it with a multimeter on the microfarad setting. Step four, connect your manifold gauges to the service valves. Let the system run for ten to fifteen minutes, then compare suction and discharge pressures to the manufacturer specs for the current outdoor temperature.`,
    imagePrompt: 'Photorealistic photo of an HVAC technician in uniform kneeling beside an open residential condenser unit, holding a digital multimeter, testing the capacitor inside the electrical compartment, tools laid out nearby, bright outdoor daylight, professional training photography, no text or labels, 16:9 landscape',
  },
  {
    id: 'quiz-preview',
    script: `Great work. You now know the six major components of a condenser unit and the four steps of a technician inspection. After this video, you will see five quiz questions below. Here is a preview. Which component compresses refrigerant gas? What is the most common failure point? What does the contactor do? Where are the service valves? And what should you check first when the fan is not spinning? You need to score at least four out of five to complete this module, but you can retake it as many times as you need.`,
    imagePrompt: 'Photorealistic photo of a clean modern training classroom with a large whiteboard showing a checklist of five items, empty student desks, bright fluorescent lighting, professional workforce training center environment, no readable text on the whiteboard, 16:9 landscape',
  },
  {
    id: 'wrapup',
    script: `That is the end of the video portion of Module 1. Scroll down to explore the interactive 3D condenser model where you can click on each component to review what you learned. Then take the five question quiz to complete this module. Remember, in the field, the technician who notices the small details is the one who solves problems faster and earns the customer's trust. Good luck, and welcome to your HVAC career.`,
    imagePrompt: 'Photorealistic photo of a professional training completion setting, a clean desk with an HVAC certification document and hard hat, American flag in background, warm office lighting, sense of accomplishment and career readiness, no readable text, 16:9 landscape',
  },
];

/* ── Step 1: Generate DALL-E backgrounds ─────────────────────────── */

async function generateBackgrounds() {
  console.log('\n=== Step 1: Generating DALL-E backgrounds ===');
  const results = await Promise.all(
    scenes.map(async (scene) => {
      console.log(`  Generating image for "${scene.id}"...`);
      const img = await openai.images.generate({
        model: 'dall-e-3',
        prompt: scene.imagePrompt,
        n: 1,
        size: '1792x1024',
        quality: 'standard',
        style: 'natural',
      });
      const url = img.data[0].url;
      console.log(`  ✓ ${scene.id} image ready`);
      return { id: scene.id, url };
    })
  );
  return Object.fromEntries(results.map((r) => [r.id, r.url]));
}

/* ── Step 2: Call HeyGen ─────────────────────────────────────────── */

async function createHeyGenVideo(backgroundUrls) {
  console.log('\n=== Step 2: Creating HeyGen video ===');

  const video_inputs = scenes.map((scene) => ({
    character: {
      type: 'avatar',
      avatar_id: AVATAR_ID,
      avatar_style: 'normal',
    },
    voice: {
      type: 'text',
      input_text: scene.script,
      voice_id: VOICE_ID,
    },
    background: {
      type: 'image',
      url: backgroundUrls[scene.id],
    },
  }));

  const res = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': HEYGEN_API_KEY,
    },
    body: JSON.stringify({
      video_inputs,
      dimension: { width: 1920, height: 1080 },
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`HeyGen create failed: ${JSON.stringify(data)}`);
  }

  const videoId = data.data.video_id;
  console.log(`  Video ID: ${videoId}`);
  return videoId;
}

/* ── Step 3: Poll for completion ─────────────────────────────────── */

async function pollVideo(videoId) {
  console.log('\n=== Step 3: Polling for completion ===');
  const maxWait = 900_000; // 15 min
  const interval = 20_000; // 20s
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const res = await fetch(
      `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
      { headers: { 'X-Api-Key': HEYGEN_API_KEY } }
    );
    const data = await res.json();
    const status = data.data?.status;
    const elapsed = Math.round((Date.now() - start) / 1000);
    console.log(`  ${status} (${elapsed}s)`);

    if (status === 'completed') return data.data.video_url;
    if (status === 'failed') throw new Error(`HeyGen failed: ${JSON.stringify(data.data)}`);
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error('HeyGen poll timeout');
}

/* ── Step 4: Download + upload to Supabase ───────────────────────── */

async function downloadAndUpload(videoUrl) {
  console.log('\n=== Step 4: Download + upload to Supabase ===');

  console.log('  Downloading from HeyGen...');
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log(`  Downloaded: ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);

  console.log('  Uploading to Supabase (overwriting existing)...');
  const uploadRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/course-videos/hvac/hvac-module1-lesson1.mp4`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'video/mp4',
        'x-upsert': 'true',
      },
      body: buffer,
    }
  );

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/course-videos/hvac/hvac-module1-lesson1.mp4`;
  console.log(`  ✓ Uploaded: ${publicUrl}`);
  return publicUrl;
}

/* ── Main ────────────────────────────────────────────────────────── */

async function main() {
  console.log('=== HeyGen Full Video Generation ===');
  console.log(`Scenes: ${scenes.length}`);
  console.log(`Total script: ${scenes.reduce((s, sc) => s + sc.script.length, 0)} chars`);

  // Check credits first
  const creditsRes = await fetch('https://api.heygen.com/v2/user/remaining_quota', {
    headers: { 'X-Api-Key': HEYGEN_API_KEY },
  });
  const creditsData = await creditsRes.json();
  const credits = creditsData.data?.remaining_quota ?? 0;
  console.log(`HeyGen credits: ${credits}s remaining`);

  if (credits < 300) {
    console.error('Not enough credits (need ~240s, want 300s buffer)');
    process.exit(1);
  }

  const bgUrls = await generateBackgrounds();
  const videoId = await createHeyGenVideo(bgUrls);
  const videoUrl = await pollVideo(videoId);
  const publicUrl = await downloadAndUpload(videoUrl);

  // Check credits after
  const afterRes = await fetch('https://api.heygen.com/v2/user/remaining_quota', {
    headers: { 'X-Api-Key': HEYGEN_API_KEY },
  });
  const afterData = await afterRes.json();
  const afterCredits = afterData.data?.remaining_quota ?? 0;
  console.log(`\nCredits used: ${credits - afterCredits}s`);
  console.log(`Credits remaining: ${afterCredits}s`);

  console.log('\n=== DONE ===');
  console.log(`Video URL: ${publicUrl}`);
  console.log('The Module 1 page at /preview/hvac-module-1 will now play this video.');
}

main().catch((e) => {
  console.error('\nFATAL:', e.message);
  process.exit(1);
});
