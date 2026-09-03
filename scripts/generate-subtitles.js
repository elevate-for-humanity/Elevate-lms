#!/usr/bin/env node
/**
 * Generate VTT subtitle files for course videos
 * This creates placeholder subtitles - replace with actual transcriptions
 */

const fs = require('fs');
const path = require('path');

const videos = [
  { file: 'medical-assistant-10002419.mp4', title: 'Medical Assistant Training' },
  { file: 'barber-apprenticeship-10002417.mp4', title: 'Barber Apprenticeship Program' },
  { file: 'hvac-technician-10002289.mp4', title: 'HVAC Technician Fundamentals' },
  { file: 'home-health-aide-10002413.mp4', title: 'Home Health Aide Training' },
  { file: 'cpr-aed-first-aid-10002448.mp4', title: 'CPR AED First Aid Certification' },
  { file: 'emergency-health-safety-technician-10002408.mp4', title: 'Emergency Health Safety' },
  { file: 'esthetician-client-services-10002415.mp4', title: 'Esthetician Client Services' },
  { file: 'business-startup-marketing-10002422.mp4', title: 'Business Startup Marketing' },
  { file: 'public-safety-reentry-specialist-10002439.mp4', title: 'Public Safety Reentry' },
];

const subtitlesDir = path.join(__dirname, '../public/subtitles');

// Create subtitles directory if it doesn't exist
if (!fs.existsSync(subtitlesDir)) {
  fs.mkdirSync(subtitlesDir, { recursive: true });
}

// Generate placeholder VTT files
videos.forEach((video) => {
  const vttFilename = video.file.replace('.mp4', '.vtt');
  const vttPath = path.join(subtitlesDir, vttFilename);

  const vttContent = `WEBVTT

NOTE
This is a placeholder subtitle file for ${video.title}
Replace with actual transcription from YouTube auto-captions or professional service

00:00:00.000 --> 00:00:05.000
Welcome to ${video.title}

00:00:05.000 --> 00:00:10.000
In this course, you will learn essential skills and knowledge

00:00:10.000 --> 00:00:15.000
needed to succeed in your career path.

00:00:15.000 --> 00:00:20.000
Let's get started with the fundamentals.

00:00:20.000 --> 00:00:25.000
[Instructor speaking - transcription needed]

00:00:25.000 --> 00:00:30.000
[Continue with actual video content]

NOTE
To add real subtitles:
1. Upload video to YouTube (unlisted)
2. Use auto-captions feature
3. Download as .srt file
4. Convert to .vtt format
5. Replace this file

Or use professional services:
- Rev.com ($1.50/min)
- Otter.ai (AI transcription)
- Descript (AI + editing)
`;

  fs.writeFileSync(vttPath, vttContent);
});
