/**
 * Generate Sora video clips for HVAC Module 1 training video.
 * Each clip is 8 seconds. Clips are grouped by scene to match narration.
 */

import fs from 'fs';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Narration durations (from TTS files already generated)
// Scene 1: 28.4s → 4 clips
// Scene 2: 18.4s → 3 clips  
// Scene 3: 37.8s → 5 clips
// Scene 4: 38.6s → 5 clips
// Scene 5: 36.3s → 5 clips
// Scene 6: 28.9s → 4 clips
// Total: 26 clips × 8s = 208s (covers 188s narration with buffer)

const CLIPS = [
  // Scene 1: Hook / System Overview (28.4s → 4 clips)
  { id: 's1_01', prompt: 'Wide establishing shot of a residential house on a sunny day, camera slowly panning to reveal a large HVAC condenser unit sitting on a concrete pad beside the house. Green lawn, blue sky. Professional training video cinematography, steady camera movement.' },
  { id: 's1_02', prompt: 'Aerial view slowly descending toward a residential HVAC split system. Shows the outdoor condenser unit connected by copper refrigerant lines running through the wall to the indoor unit. Professional training video, clear daylight.' },
  { id: 's1_03', prompt: 'Interior shot of a residential air handler with the panel open, showing the evaporator coil and blower motor. A technician points to the evaporator coil. Clean, well-lit utility room. Professional HVAC training video.' },
  { id: 's1_04', prompt: 'Smooth camera orbit around a residential outdoor HVAC condenser unit, showing all four sides. The unit is clean and running, with the fan spinning on top. Sunny day, professional training video quality.' },

  // Scene 2: Condenser Overview (18.4s → 3 clips)
  { id: 's2_01', prompt: 'An HVAC technician in blue uniform removes the side access panel from a residential condenser unit with a screwdriver, revealing the internal components. Camera zooms in slowly. Bright daylight, professional training video.' },
  { id: 's2_02', prompt: 'Close-up interior view of an open HVAC condenser unit showing the compressor, copper refrigerant lines, and aluminum condenser coil fins. Camera slowly pans across the components. Well-lit, professional training video.' },
  { id: 's2_03', prompt: 'Close-up of the electrical compartment inside an HVAC condenser unit, showing a silver cylindrical capacitor, a contactor relay switch, and wiring. Camera slowly moves across each component. Professional training video lighting.' },

  // Scene 3: Compressor & Coil Deep Dive (37.8s → 5 clips)
  { id: 's3_01', prompt: 'Extreme close-up of an HVAC compressor inside a condenser unit. The black cylindrical compressor has copper refrigerant lines connected to it. Camera slowly orbits around it. Professional HVAC training video, clear detail.' },
  { id: 's3_02', prompt: 'Close-up of a technician hands checking the amperage on an HVAC compressor using a clamp meter around the wire. The digital display shows a reading. Professional training video, well-lit.' },
  { id: 's3_03', prompt: 'Detailed close-up of aluminum condenser coil fins inside an HVAC unit. Camera slowly moves along the fins showing the copper tubing running through them. Some fins are slightly bent. Professional training video.' },
  { id: 's3_04', prompt: 'An HVAC technician spraying water from a garden hose through condenser coil fins from the inside out, cleaning debris. Water flows through the aluminum fins. Outdoor, sunny day. Professional training video.' },
  { id: 's3_05', prompt: 'Top-down view of an HVAC condenser unit with the fan spinning, pulling air upward through the unit. The fan blade rotates smoothly. Professional training video, clear detail of the fan motor assembly.' },

  // Scene 4: Electrical Components (38.6s → 5 clips)
  { id: 's4_01', prompt: 'Extreme close-up of a dual-run capacitor inside an HVAC electrical compartment. The silver cylinder has ratings printed on it. A technician hand reaches in to inspect it. Professional training video.' },
  { id: 's4_02', prompt: 'Close-up of a technician testing an HVAC capacitor with a digital multimeter set to microfarads. The multimeter probes touch the capacitor terminals and the display shows a reading. Professional training video.' },
  { id: 's4_03', prompt: 'Close-up of an HVAC contactor relay switch inside the electrical compartment. The contactor has visible contact points and a coil. Camera slowly zooms in to show the contact surfaces. Professional training video.' },
  { id: 's4_04', prompt: 'A technician hand pressing the contactor button on an HVAC unit to manually close the contacts, testing the circuit. The compressor starts humming in the background. Professional training video.' },
  { id: 's4_05', prompt: 'Close-up of two copper service valve ports on HVAC refrigerant lines exiting a condenser unit. One larger suction line and one smaller liquid line, both with brass caps. Camera slowly zooms in. Professional training video.' },

  // Scene 5: Inspection Walkthrough (36.3s → 5 clips)
  { id: 's5_01', prompt: 'An HVAC technician walking around a residential condenser unit doing a visual inspection, looking at all sides. He bends down to check the base and looks at the refrigerant lines. Sunny day, professional training video.' },
  { id: 's5_02', prompt: 'An HVAC technician placing his hand over the top fan grille of a running condenser unit to feel the airflow. Warm air blows upward. The technician nods. Outdoor, professional training video.' },
  { id: 's5_03', prompt: 'An HVAC technician turning off the disconnect switch next to a condenser unit, then removing the electrical access panel with a screwdriver. Safety procedure. Professional training video.' },
  { id: 's5_04', prompt: 'Close-up of a technician connecting a refrigerant manifold gauge set to the service valves on an HVAC condenser unit. Blue and red hoses connect to the ports. Professional training video, clear detail.' },
  { id: 's5_05', prompt: 'Close-up of a refrigerant manifold gauge set showing pressure readings on both the blue low-side and red high-side gauges. The needles are steady. Professional HVAC training video.' },

  // Scene 6: Summary / Wrap-up (28.9s → 4 clips)
  { id: 's6_01', prompt: 'Wide shot of a complete residential HVAC condenser unit with the access panel open, showing all internal components clearly visible. Golden hour lighting, professional training video.' },
  { id: 's6_02', prompt: 'An HVAC technician closing the access panel on a condenser unit after completing an inspection, tightening the screws. He stands up and gives a thumbs up. Professional training video.' },
  { id: 's6_03', prompt: 'A group of HVAC students in a training lab gathered around a condenser unit, one student pointing at the compressor while an instructor watches. Professional workforce training environment.' },
  { id: 's6_04', prompt: 'An HVAC technician walking away from a completed service call, carrying his tool bag. The condenser unit runs smoothly in the background. Residential setting, golden hour. Professional training video.' },
];

async function createClip(clip) {
  const res = await fetch('https://api.openai.com/v1/videos', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + OPENAI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sora-2',
      prompt: clip.prompt,
      size: '1280x720',
      seconds: '8',
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`${clip.id}: ${data.error.message}`);
  return { id: clip.id, videoId: data.id };
}

async function pollClip(clipId, videoId) {
  const maxWait = 300000; // 5 min per clip
  const interval = 10000;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const res = await fetch('https://api.openai.com/v1/videos/' + videoId, {
      headers: { 'Authorization': 'Bearer ' + OPENAI_API_KEY },
    });
    const data = await res.json();
    
    if (data.status === 'completed') return videoId;
    if (data.status === 'failed') throw new Error(`${clipId} failed: ${JSON.stringify(data.error)}`);
    
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`${clipId} timed out`);
}

async function downloadClip(videoId, outputPath) {
  const res = await fetch('https://api.openai.com/v1/videos/' + videoId + '/content', {
    headers: { 'Authorization': 'Bearer ' + OPENAI_API_KEY },
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  return buffer.length;
}

async function main() {
  const outDir = '/workspaces/Elevate-lms/temp/sora-clips';
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Generating ${CLIPS.length} Sora clips (8s each)...`);
  console.log(`Estimated total: ${CLIPS.length * 8}s of video\n`);

  // Submit all clips in batches of 5 to avoid rate limits
  const BATCH_SIZE = 5;
  const allJobs = [];

  for (let i = 0; i < CLIPS.length; i += BATCH_SIZE) {
    const batch = CLIPS.slice(i, i + BATCH_SIZE);
    console.log(`Submitting batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(CLIPS.length/BATCH_SIZE)}...`);
    
    const jobs = await Promise.all(batch.map(async (clip) => {
      try {
        const job = await createClip(clip);
        console.log(`  ✓ ${clip.id} → ${job.videoId}`);
        return job;
      } catch (e) {
        console.error(`  ✗ ${clip.id}: ${e.message}`);
        return null;
      }
    }));
    
    allJobs.push(...jobs.filter(Boolean));
    
    // Small delay between batches
    if (i + BATCH_SIZE < CLIPS.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\nSubmitted ${allJobs.length}/${CLIPS.length} clips. Polling for completion...\n`);

  // Poll all in parallel
  const results = await Promise.all(allJobs.map(async (job) => {
    try {
      await pollClip(job.id, job.videoId);
      const outPath = `${outDir}/${job.id}.mp4`;
      const size = await downloadClip(job.videoId, outPath);
      console.log(`  ✓ ${job.id} downloaded (${(size/1024/1024).toFixed(1)} MB)`);
      return { id: job.id, path: outPath, success: true };
    } catch (e) {
      console.error(`  ✗ ${job.id}: ${e.message}`);
      return { id: job.id, success: false, error: e.message };
    }
  }));

  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n=== DONE ===`);
  console.log(`Succeeded: ${succeeded.length}/${allJobs.length}`);
  if (failed.length > 0) {
    console.log(`Failed: ${failed.map(f => f.id).join(', ')}`);
  }

  // Save manifest
  fs.writeFileSync(`${outDir}/manifest.json`, JSON.stringify(results, null, 2));
  console.log(`Manifest saved to ${outDir}/manifest.json`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
