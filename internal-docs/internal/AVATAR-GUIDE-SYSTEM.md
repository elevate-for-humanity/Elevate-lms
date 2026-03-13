# Avatar Guide System

AI-powered avatar guides that appear on pages to help users navigate, learn, and get assistance.

## Overview

The avatar system uses HeyGen API to generate talking avatar videos that:
- Auto-play when page loads
- Guide users through content
- Answer questions via chat
- Provide course instruction and orientation

## HeyGen API Setup

**API Key Location:** `.env.local`
```
HEYGEN_API_KEY=sk_V2_hgu_...
```

**API Endpoints:**
- Generate video: `POST https://api.heygen.com/v2/video/generate`
- Check status: `GET https://api.heygen.com/v1/video_status.get?video_id=XXX`
- List videos: `GET https://api.heygen.com/v1/video.list`
- List avatars: `GET https://api.heygen.com/v2/avatars`
- List voices: `GET https://api.heygen.com/v2/voices`
- Check quota: `GET https://api.heygen.com/v2/user/remaining_quota`

## Avatar & Voice Mapping

### Female Avatars (Best Lip Sync)
| Avatar ID | Name | Best For |
|-----------|------|----------|
| Annie_expressive10_public | Annie | Welcome, AI Tutor |
| Annie_expressive11_public | Annie | General guides |
| Annie_expressive12_public | Annie | Tech courses |
| Adriana_BizTalk_Front_public | Adriana | Store, Business |
| Adriana_BizTalk_Side_public | Adriana | Financial, Support |
| Carlotta_BizTalk_Front_public | Carlotta | Healthcare |
| Imelda_BizTalk_Front_public | Imelda | Orientation |

### Male Avatars (Best Lip Sync)
| Avatar ID | Name | Best For |
|-----------|------|----------|
| Marcus_expressive_2024120201 | Marcus | Trades |
| Brandon_expressive_public | Brandon | Barber, Casual |
| Brandon_expressive2_public | Brandon | Business |
| Max_expressive_2024112701 | Max | Tech |
| Riley_expressive_2024112501 | Riley | Support |

### Female Voices (English)
| Voice ID | Name | Style |
|----------|------|-------|
| 42d00d4aac5441279d8536cd6b52c53c | Hope | Warm, friendly |
| 4754e1ec667544b0bd18cdf4bec7d6a7 | Brittney | Professional |
| cef3bc4e0a84424cafcde6f2cf466c97 | Ivy | Clear, calm |
| 1704ea0565c04c5188d9b67062b31a1a | Jessica | Energetic |
| 007e1378fc454a9f976db570ba6164a7 | Aria | Warm |
| 0c418eab508d4030879c0c3381433806 | Juniper | Friendly |

### Male Voices (English)
| Voice ID | Name | Style |
|----------|------|-------|
| 828b59f834fd4c7188da322b6d9b6c75 | David | Professional |
| 88bb9ee1c81b466eb2a08fdde86d3619 | Adam | Casual, friendly |
| 8a8fb6db01a44463a087e68f54d0870b | James | Authoritative |
| 2eca0d3dd5ec4a1ea6efa6194b19eb78 | Ray | Relaxed |

## Generating New Videos

### Using curl (Quick)

```bash
curl -X POST "https://api.heygen.com/v2/video/generate" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_inputs": [{
      "character": {
        "type": "avatar",
        "avatar_id": "Annie_expressive11_public",
        "avatar_style": "normal"
      },
      "voice": {
        "type": "text",
        "input_text": "Your script here. Keep it conversational and natural.",
        "voice_id": "42d00d4aac5441279d8536cd6b52c53c",
        "speed": 1.0
      },
      "background": {
        "type": "color",
        "value": "#0f172a"
      }
    }],
    "dimension": { "width": 1280, "height": 720 }
  }'
```

### Check Video Status

```bash
curl "https://api.heygen.com/v1/video_status.get?video_id=YOUR_VIDEO_ID" \
  -H "X-Api-Key: YOUR_API_KEY"
```

### Download Completed Video

```bash
# Get video URL from status response, then:
curl -L -o public/videos/avatars/filename.mp4 "VIDEO_URL"
```

## Page Avatar Assignments

| Page | Avatar Name | Role | Context |
|------|-------------|------|---------|
| Home | Sarah | Welcome Guide | home |
| Store | Victoria | Store Assistant | store |
| Programs | Emma | Programs Advisor | programs |
| Healthcare | Dr. Maria | Healthcare Instructor | healthcare |
| CNA | Nurse Angela | CNA Instructor | healthcare |
| Trades | Mike | Trades Instructor | trades |
| HVAC | James | HVAC Instructor | trades |
| CDL | Marcus | CDL Instructor | trades |
| Barber | Darius | Barber Instructor | barber |
| Technology | Alex | Tech Instructor | technology |
| Financial Aid | Michelle | Financial Advisor | financial |
| VITA | Patricia | Tax Guide | vita |
| Supersonic | Rachel | Tax Prep Guide | supersonic |
| LMS Dashboard | Sophia | AI Tutor | course |
| Orientation | Lisa | Orientation Guide | orientation |
| Enrollment | Lisa | Enrollment Advisor | enrollment |
| Student Portal | Chris | Student Support | support |
| Employer Portal | Robert | Employer Relations | employers |

## Components

### SideAvatarGuide
Side panel avatar that appears on page load with chat functionality.

```tsx
import SideAvatarGuide from '@/components/SideAvatarGuide';

<SideAvatarGuide
  avatarVideoUrl="/videos/avatars/welcome.mp4"
  avatarName="Sarah"
  avatarRole="Welcome Guide"
  welcomeMessage="Hi! How can I help you today?"
  context="home"
  side="right"
/>
```

### PageAvatarGuide
Wrapper component with pre-configured avatars for each page.

```tsx
import PageAvatarGuide from '@/components/PageAvatarGuide';

// Just specify the page type
<PageAvatarGuide page="store" />
<PageAvatarGuide page="healthcare" />
<PageAvatarGuide page="lms" />
```

### AvatarCourseGuide
Step-by-step guide for courses and onboarding.

```tsx
import AvatarCourseGuide, { ORIENTATION_STEPS } from '@/components/AvatarCourseGuide';

<AvatarCourseGuide
  avatarName="Lisa"
  avatarRole="Orientation Guide"
  defaultVideoUrl="/videos/avatars/orientation.mp4"
  steps={ORIENTATION_STEPS}
  onComplete={() => router.push('/lms/dashboard')}
/>
```

## Script Writing Tips

1. **Be conversational** - Write like you're talking to a friend
2. **Keep it short** - 2-4 sentences per video
3. **Use contractions** - "I'm" not "I am", "you're" not "you are"
4. **Add personality** - Match the avatar's role
5. **End with a question** - Encourages engagement
6. **Avoid jargon** - Keep it simple

### Good Example:
> "Hey! I'm Mike, your trades instructor. Skilled trades are where the money's at. Good pay, job security, and you build things with your hands. What sounds interesting to you?"

### Bad Example:
> "Welcome to the skilled trades training program. I am your instructor. We offer HVAC, electrical, and welding certifications. Please select a program."

## Video File Naming

Store videos in: `/public/videos/avatars/`

Naming convention: `{page}-{role}.mp4`
- `home-welcome.mp4`
- `store-assistant.mp4`
- `healthcare-instructor.mp4`
- `cna-course.mp4`
- `orientation-guide.mp4`

## Troubleshooting

### Video won't autoplay with sound
Browsers block autoplay with sound. The component tries unmuted first, falls back to muted.

### Avatar not found error
Check avatar ID exists: `GET https://api.heygen.com/v2/avatars`

### Voice sounds robotic
- Use speed: 1.0 (not slower)
- Write conversational scripts
- Use expressive/BizTalk avatars (better lip sync)

### HeyGen watermark showing
Upgrade to Creator plan ($29/mo) or higher to remove watermark.

## Credits Usage

Each video uses ~1-2 credits per minute. Check remaining:
```bash
curl "https://api.heygen.com/v2/user/remaining_quota" \
  -H "X-Api-Key: YOUR_API_KEY"
```
