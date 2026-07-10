import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Generate AI Avatar Videos for all sections
 * Run with: npx ts-node scripts/generate-avatar-videos.ts
 */

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

interface VideoScript {
  id: string;
  avatarId: string;
  voiceId: string;
  script: string;
  filename: string;
}

const VIDEO_SCRIPTS: VideoScript[] = [
  // === MAIN GUIDES ===
  {
    id: 'welcome',
    avatarId: 'Annie_expressive5_public',
    voiceId: '1704ea0565c04c5188d9b67062b31a1a',
    script: `Welcome to ' + PLATFORM_DEFAULTS.orgName + '! I'm here to help you start your career journey. 
We offer free training in healthcare, skilled trades, technology, and more. 
Most students qualify for one hundred percent free tuition through WIOA funding. 
Ready to change your life? Let's get started!`,
    filename: 'avatar-welcome.mp4',
  },
  {
    id: 'chat-assistant',
    avatarId: 'Annie_expressive11_public',
    voiceId: '42d00d4aac5441279d8536cd6b52c53c',
    script: `Hi! I'm your learning assistant. I can help you with course questions, study tips, and career guidance. 
Just type your question and I'll do my best to help. 
Whether you need help understanding a concept or preparing for an exam, I'm here for you!`,
    filename: 'avatar-chat-assistant.mp4',
  },

  // === STORE ===
  {
    id: 'store',
    avatarId: 'Adriana_Business_Front_public',
    voiceId: '4754e1ec667544b0bd18cdf4bec7d6a7',
    script: `Welcome to our store! Here you'll find study materials, workbooks, and certification prep resources. 
All products are designed to help you succeed in your training. 
Need help finding something? Just ask!`,
    filename: 'avatar-store.mp4',
  },

  // === FINANCIAL ===
  {
    id: 'financial-aid',
    avatarId: 'Abigail_standing_office_front',
    voiceId: 'cef3bc4e0a84424cafcde6f2cf466c97',
    script: `Let me help you understand your funding options. 
Most of our students qualify for free training through WIOA, Workforce Ready Grants, or JRI funding. 
I can guide you through the eligibility process. It's easier than you think!`,
    filename: 'avatar-financial-aid.mp4',
  },
  {
    id: 'vita',
    avatarId: 'Adriana_Business_Front_2_public',
    voiceId: '007e1378fc454a9f976db570ba6164a7',
    script: `Welcome to VITA free tax preparation! If you earn under sixty-four thousand dollars, you qualify for free tax filing. 
Our IRS-certified volunteers will prepare your taxes at no cost. 
Schedule your appointment today and keep more of your refund!`,
    filename: 'avatar-vita.mp4',
  },

  // === HEALTHCARE ===
  {
    id: 'healthcare',
    avatarId: 'Adriana_Nurse_Front_public',
    voiceId: '42d00d4aac5441279d8536cd6b52c53c',
    script: `Welcome to healthcare training! I'll be your guide through CNA, phlebotomy, and medical assistant programs. 
Healthcare careers are in high demand with great pay and job security. 
Let's start your journey to helping others!`,
    filename: 'avatar-healthcare.mp4',
  },
  {
    id: 'cna',
    avatarId: 'Adriana_Nurse_Front_2_public',
    voiceId: 'cef3bc4e0a84424cafcde6f2cf466c97',
    script: `Welcome to CNA training! In just eight to twelve weeks, you'll be ready to start your nursing career. 
I'll teach you patient care, vital signs, and clinical skills. 
CNAs are essential to healthcare. Let's get you certified!`,
    filename: 'avatar-cna.mp4',
  },
  {
    id: 'phlebotomy',
    avatarId: 'Adriana_Nurse_Side_public',
    voiceId: '4754e1ec667544b0bd18cdf4bec7d6a7',
    script: `Ready to become a phlebotomist? I'll teach you blood collection techniques, safety protocols, and patient care. 
Phlebotomists are in high demand at hospitals, labs, and clinics. 
Let's master the art of the draw!`,
    filename: 'avatar-phlebotomy.mp4',
  },

  // === TRADES ===
  {
    id: 'trades',
    avatarId: 'Armando_Casual_Front_public',
    voiceId: '3ae75279043648ce8f96310333c9288f',
    script: `Welcome to skilled trades training! I'm here to help you build a career with your hands. 
HVAC, electrical, welding - these are careers that can't be outsourced. 
Good pay, job security, and the satisfaction of building things. Let's get to work!`,
    filename: 'avatar-trades.mp4',
  },
  {
    id: 'hvac',
    avatarId: 'Artur_standing_sofacasual_front',
    voiceId: '2eca0d3dd5ec4a1ea6efa6194b19eb78',
    script: `HVAC technicians are always in demand. I'll teach you heating, cooling, and refrigeration systems. 
You'll get EPA six-oh-eight certified and ready for a career that pays well year-round. 
Hot or cold outside, HVAC techs stay busy!`,
    filename: 'avatar-hvac.mp4',
  },
  {
    id: 'cdl',
    avatarId: 'Armando_Casual_Side_public',
    voiceId: 'a50b2b18a4bf49109caf46a3a6c6a08a',
    script: `Ready to hit the road? CDL training will get you behind the wheel of a commercial truck. 
Truck drivers are essential to our economy and earn great money. 
I'll help you pass your CDL test and start your driving career!`,
    filename: 'avatar-cdl.mp4',
  },

  // === BARBER ===
  {
    id: 'barber',
    avatarId: 'Armando_Casual_Front_public',
    voiceId: '2eca0d3dd5ec4a1ea6efa6194b19eb78',
    script: `Welcome to the barber apprenticeship! This is a USDOL registered program. 
You'll earn while you learn, getting paid as you master cuts, fades, and shaves. 
Two thousand hours of training leads to your Indiana barber license. Let's cut it up!`,
    filename: 'avatar-barber.mp4',
  },

  // === TECHNOLOGY ===
  {
    id: 'technology',
    avatarId: 'Annie_expressive10_public',
    voiceId: '1704ea0565c04c5188d9b67062b31a1a',
    script: `Tech careers are the future! I'll guide you through IT support, cybersecurity, and cloud computing. 
No coding experience needed to start. We'll build your skills from the ground up. 
Ready to join the digital workforce?`,
    filename: 'avatar-technology.mp4',
  },

  // === AI TUTOR ===
  {
    id: 'ai-tutor',
    avatarId: 'Annie_expressive11_public',
    voiceId: '42d00d4aac5441279d8536cd6b52c53c',
    script: 'I'm your AI tutor, here to help you succeed! Ask me to explain concepts, create study guides, or generate practice questions. 
I'm available twenty-four seven to support your learning. 
What would you like to study today?`,
    filename: 'avatar-ai-tutor.mp4',
  },
];

async function generateVideo(script: VideoScript): Promise<string | null> {
  console.log(`Generating video: ${script.id}...`);

  try {
    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: script.avatarId,
              avatar_style: 'normal',
            },
            voice: {
              type: 'text',
              input_text: script.script,
              voice_id: script.voiceId,
              speed: 0.95,
            },
            background: {
              type: 'color',
              value: '#0f172a',
            },
          },
        ],
        dimension: {
          width: 1280,
          height: 720,
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error(`Error for ${script.id}:`, data.error);
      return null;
    }

    console.log(`Video ${script.id} started: ${data.data.video_id}`);
    return data.data.video_id;
  } catch (error) {
    console.error(`Failed to generate ${script.id}:`, error);
    return null;
  }
}

async function checkVideoStatus(videoId: string): Promise<{ status: string; url?: string }> {
  const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: { 'X-Api-Key': HEYGEN_API_KEY! },
  });

  const data = await response.json();
  return {
    status: data.data.status,
    url: data.data.video_url,
  };
}

async function main() {
  if (!HEYGEN_API_KEY) {
    console.error('HEYGEN_API_KEY not set');
    process.exit(1);
  }

  console.log(`Generating ${VIDEO_SCRIPTS.length} avatar videos...\\n`);

  const videoIds: Record<string, string> = {};

  // Generate all videos
  for (const script of VIDEO_SCRIPTS) {
    const videoId = await generateVideo(script);
    if (videoId) {
      videoIds[script.id] = videoId;
    }
    // Small delay between requests
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log('\\nAll videos submitted. Video IDs:');
  console.log(JSON.stringify(videoIds, null, 2));

  console.log('\\nRun this script again later to check status and download completed videos.');
}

main().catch(console.error);
