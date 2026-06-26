import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Script to generate AI avatar hero videos using HeyGen API
 * Run with: npx ts-node scripts/generate-hero-videos.ts
 */

const HEYGEN_API_KEY =
  process.env.HEYGEN_API_KEY || 'sk_V2_hgu_kije3e2gKQj_bvlFVjZVa0v82ie1s0d4ftFtkJwaIl1j';

interface HeroVideoConfig {
  id: string;
  title: string;
  script: string;
  avatarId: string;
  outputFile: string;
}

const heroVideos: HeroVideoConfig[] = [
  {
    id: 'homepage',
    title: 'Elevate for Humanity - Homepage',
    script: `Welcome to Elevate for Humanity. We're transforming lives through free workforce training in Indianapolis. Whether you're looking to start a new career in healthcare, technology, commercial driving, or skilled trades, we're here to help you succeed. Our programs are completely free for eligible participants, and we provide job placement assistance to help you land your dream career. Take the first step toward your future today.`,
    avatarId: 'Adriana_Business_Front_public',
    outputFile: 'homepage-hero.mp4',
  },
  {
    id: 'programs',
    title: 'Training Programs Overview',
    script: `Discover our comprehensive training programs designed to launch your career. From Commercial Driver's License certification to healthcare credentials, cybersecurity training to skilled trades, we offer pathways to high-demand careers. All our programs include hands-on training, industry certifications, and job placement support. Best of all, they're free for qualifying Indiana residents. Explore our programs and find your path to success.`,
    avatarId: 'Albert_public_2',
    outputFile: 'programs-hero.mp4',
  },
  {
    id: 'cdl',
    title: 'CDL Training Program',
    script: `Ready to hit the road to a rewarding career? Our Commercial Driver's License program prepares you for Class A CDL certification in just 4 weeks. You'll learn from experienced instructors, train on modern equipment, and gain the skills employers are looking for. With starting salaries averaging $55,000 and strong job demand, truck driving offers excellent career opportunities. Enroll today and start your journey.`,
    avatarId: 'Amanda_in_Blue_Shirt_Front',
    outputFile: 'cdl-hero.mp4',
  },
  {
    id: 'healthcare',
    title: 'Healthcare Training Programs',
    script: `Launch your healthcare career with Elevate for Humanity. Our programs include Certified Nursing Assistant, Medical Assistant, Phlebotomy, and Medical Terminology certifications. Healthcare is one of the fastest-growing industries, with excellent job security and opportunities for advancement. Our hands-on training and clinical experience prepare you for immediate employment. Join the healthcare workforce and make a difference in people's lives.`,
    avatarId: 'Adriana_Nurse_Front_public',
    outputFile: 'healthcare-hero.mp4',
  },
  {
    id: 'technology',
    title: 'Technology Training Programs',
    script: `Enter the world of technology with our cutting-edge training programs. From cybersecurity to software development, we prepare you for high-paying tech careers. Our curriculum is designed with industry partners to ensure you learn the skills employers need. With average starting salaries over $60,000 and remote work opportunities, technology offers incredible career potential. Start your tech journey with us today.`,
    avatarId: 'Adrian_public_2_20240312',
    outputFile: 'technology-hero.mp4',
  },
  {
    id: 'hvac',
    title: 'HVAC Training Program',
    script: `Build a career in heating, ventilation, and air conditioning with our HVAC technician program. You'll learn installation, maintenance, and repair of climate control systems. HVAC technicians are in high demand year-round, with excellent earning potential and job stability. Our program includes EPA certification preparation and hands-on training with industry-standard equipment. Start your HVAC career today.`,
    avatarId: 'Amanda_Maintenance_Front',
    outputFile: 'hvac-hero.mp4',
  },
  {
    id: 
    title: 'Tax Preparation Training',
    script: `Become a certified tax professional with our comprehensive tax preparation program. Learn federal and state tax law, tax software, and client service skills. Tax preparers enjoy flexible schedules, seasonal income opportunities, and the satisfaction of helping families maximize their refunds. Our program prepares you for IRS certification and immediate employment. Start your tax preparation career with us.`,
    avatarId: 'Abigail_expressive_2024112501',
    outputFile: 'tax-hero.mp4',
  },
  {
    id: 'employers',
    title: 'Employer Partnership',
    script: `Partner with Elevate for Humanity to access a pipeline of trained, job-ready candidates. Our graduates come with industry certifications, hands-on experience, and a commitment to excellence. We offer customized training programs, Work Opportunity Tax Credits, and ongoing support. Join our network of employer partners and build your workforce with qualified talent. Contact us to learn more about partnership opportunities.`,
    avatarId: 'Albert_public_1',
    outputFile: 'employers-hero.mp4',
  },
];

async function generateVideo(config: HeroVideoConfig): Promise<string | null> {
  console.log(`\nGenerating video: ${config.title}`);

  const payload = {
    video_inputs: [
      {
        character: {
          type: 'avatar',
          avatar_id: config.avatarId,
          avatar_style: 'normal',
        },
        voice: {
          type: 'text',
          input_text: config.script,
          voice_id: '1bd001e7e50f421d891986aad5158bc8',
          speed: 1.0,
        },
        background: {
          type: 'color',
          value: '#0f172a',
        },
      },
    ],
    dimension: {
      width: 1920,
      height: 1080,
    },
    aspect_ratio: '16:9',
    test: false,
  };

  try {
    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.error) {
      console.error(`Error generating ${config.id}:`, data.error);
      return null;
    }

    console.log(`Video ID for ${config.id}: ${data.data?.video_id}`);
    return data.data?.video_id;
  } catch (error) {
    console.error(`Failed to generate ${config.id}:`, error);
    return null;
  }
}

async function checkVideoStatus(videoId: string): Promise<{ status: string; url?: string }> {
  try {
    const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
      },
    });

    const data = await response.json();
    return {
      status: data.data?.status || 'unknown',
      url: data.data?.video_url,
    };
  } catch (error) {
    return { status: 'error' };
  }
}

async function main() {
  console.log('=== HeyGen Hero Video Generator ===\n');
  console.log(`Generating ${heroVideos.length} hero videos...\n`);

  const videoIds: { id: string; videoId: string }[] = [];

  // Generate all videos
  for (const config of heroVideos) {
    const videoId = await generateVideo(config);
    if (videoId) {
      videoIds.push({ id: config.id, videoId });
    }
    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n=== Video Generation Started ===');
  console.log('Video IDs:');
  videoIds.forEach((v) => console.log(`  ${v.id}: ${v.videoId}`));

  console.log('\nVideos are being processed. Check status with:');
  console.log(
    'curl -X GET "https://api.heygen.com/v1/video_status.get?video_id=VIDEO_ID" -H "X-Api-Key: YOUR_KEY"',
  );

  // Save video IDs to file for later reference
  const fs = await import('fs');
  fs.writeFileSync('scripts/video-ids.json', JSON.stringify(videoIds, null, 2));
  console.log('\nVideo IDs saved to scripts/video-ids.json');
}

main().catch(console.error);
