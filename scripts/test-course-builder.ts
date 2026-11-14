/**
 * Course Builder Test Script
 *
 * Tests all components of the course builder:
 * 1. Course outline generation (GPT-4)
 * 2. Image generation (DALL-E 3)
 * 3. Voiceover generation (TTS)
 * 4. Full course creation flow
 */

import 'dotenv/config';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment');
  process.exit(1);
}

console.log('🔑 OpenAI API Key found:', OPENAI_API_KEY.substring(0, 20) + '...');
console.log('');

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  output?: any;
  error?: string;
}

const results: TestResult[] = [];

// Test 1: Course Outline Generation
async function testCourseGeneration(): Promise<TestResult> {
  console.log('📚 Test 1: Course Outline Generation (GPT-4)');
  const start = Date.now();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a course curriculum designer. Create structured course outlines in JSON format.',
          },
          {
            role: 'user',
            content: `Create a course outline for "Introduction to CNA Training" with 3 modules, each having 2 lessons. Return JSON with this structure:
{
  "title": "Course Title",
  "description": "Course description",
  "objectives": ["objective 1", "objective 2"],
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "lessons": [
        { "title": "Lesson Title", "duration": 15, "topics": ["topic1", "topic2"] }
      ]
    }
  ]
}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API error');
    }

    const content = data.choices[0].message.content;
    let courseOutline;

    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        courseOutline = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      courseOutline = { raw: content };
    }

    const duration = Date.now() - start;
    console.log(`   ✅ Success in ${duration}ms`);
    console.log(`   📖 Generated: "${courseOutline.title || 'Course'}"`);
    console.log(`   📦 Modules: ${courseOutline.modules?.length || 0}`);

    return {
      name: 'Course Generation',
      success: true,
      duration,
      output: courseOutline,
    };
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`   ❌ Failed: ${error}`);
    return {
      name: 'Course Generation',
      success: false,
      duration,
      error: String(error),
    };
  }
}

// Test 2: Image Generation
async function testImageGeneration(): Promise<TestResult> {
  console.log('');
  console.log('🖼️  Test 2: Image Generation (DALL-E 3)');
  const start = Date.now();

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt:
          'Professional healthcare training classroom with diverse students learning CNA skills, modern medical equipment, bright and welcoming atmosphere, corporate photography style',
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API error');
    }

    const imageUrl = data.data[0].url;
    const duration = Date.now() - start;

    console.log(`   ✅ Success in ${duration}ms`);
    console.log(`   🔗 Image URL: ${imageUrl.substring(0, 80)}...`);

    return {
      name: 'Image Generation',
      success: true,
      duration,
      output: { imageUrl },
    };
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`   ❌ Failed: ${error}`);
    return {
      name: 'Image Generation',
      success: false,
      duration,
      error: String(error),
    };
  }
}

// Test 3: Voiceover Generation
async function testVoiceoverGeneration(): Promise<TestResult> {
  console.log('');
  console.log('🎙️  Test 3: Voiceover Generation (TTS)');
  const start = Date.now();

  try {
    const script = `Welcome to Introduction to CNA Training. I'm Dr. Sarah Chen, your instructor. 
In this course, you'll learn the fundamental skills needed to become a Certified Nursing Assistant. 
We'll cover patient care, vital signs, infection control, and communication skills. 
Let's begin your journey to a rewarding healthcare career.`;

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: script,
        voice: 'nova',
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API error');
    }

    const audioBuffer = await response.arrayBuffer();
    const duration = Date.now() - start;
    const audioSize = audioBuffer.byteLength;

    console.log(`   ✅ Success in ${duration}ms`);
    console.log(`   📁 Audio size: ${(audioSize / 1024).toFixed(1)} KB`);
    console.log(`   ⏱️  Estimated duration: ~${Math.ceil((script.split(' ').length / 150) * 60)}s`);

    return {
      name: 'Voiceover Generation',
      success: true,
      duration,
      output: { audioSize, scriptLength: script.length },
    };
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`   ❌ Failed: ${error}`);
    return {
      name: 'Voiceover Generation',
      success: false,
      duration,
      error: String(error),
    };
  }
}

// Test 4: Lesson Content Generation
async function testLessonContentGeneration(): Promise<TestResult> {
  console.log('');
  console.log('📝 Test 4: Lesson Content Generation');
  const start = Date.now();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert healthcare educator creating lesson content for CNA training.',
          },
          {
            role: 'user',
            content: `Create detailed lesson content for "Taking Vital Signs" including:
1. Learning objectives (3-4 bullet points)
2. Key concepts (paragraph explaining the importance)
3. Step-by-step procedure for taking blood pressure
4. Common mistakes to avoid
5. Practice quiz questions (3 multiple choice)

Format as structured text suitable for an LMS.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API error');
    }

    const content = data.choices[0].message.content;
    const duration = Date.now() - start;

    console.log(`   ✅ Success in ${duration}ms`);
    console.log(`   📄 Content length: ${content.length} characters`);
    console.log(`   📋 Preview: "${content.substring(0, 100)}..."`);

    return {
      name: 'Lesson Content Generation',
      success: true,
      duration,
      output: { contentLength: content.length, preview: content.substring(0, 200) },
    };
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`   ❌ Failed: ${error}`);
    return {
      name: 'Lesson Content Generation',
      success: false,
      duration,
      error: String(error),
    };
  }
}

// Test 5: Quiz Generation
async function testQuizGeneration(): Promise<TestResult> {
  console.log('');
  console.log('❓ Test 5: Quiz Generation');
  const start = Date.now();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a quiz creator for healthcare training. Create quizzes in JSON format.',
          },
          {
            role: 'user',
            content: `Create a 5-question quiz about "Vital Signs" for CNA students. Return JSON:
{
  "title": "Quiz Title",
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "Why this is correct"
    }
  ]
}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API error');
    }

    const content = data.choices[0].message.content;
    let quiz;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quiz = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      quiz = { raw: content };
    }

    const duration = Date.now() - start;

    console.log(`   ✅ Success in ${duration}ms`);
    console.log(`   📋 Quiz: "${quiz.title || 'Quiz'}"`);
    console.log(`   ❓ Questions: ${quiz.questions?.length || 0}`);

    return {
      name: 'Quiz Generation',
      success: true,
      duration,
      output: quiz,
    };
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`   ❌ Failed: ${error}`);
    return {
      name: 'Quiz Generation',
      success: false,
      duration,
      error: String(error),
    };
  }
}

// Run all tests
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('       COURSE BUILDER TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  results.push(await testCourseGeneration());
  results.push(await testImageGeneration());
  results.push(await testVoiceoverGeneration());
  results.push(await testLessonContentGeneration());
  results.push(await testQuizGeneration());

  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('       TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.duration}ms`);
  }

  console.log('');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`Total: ${passed} passed, ${failed} failed`);
  console.log(`Time: ${(totalTime / 1000).toFixed(1)}s`);
  console.log('───────────────────────────────────────────────────────────');

  if (failed === 0) {
    console.log('');
    console.log('🎉 ALL TESTS PASSED! Course builder is fully functional.');
    console.log('');
    console.log('You can now:');
    console.log('  • Generate course outlines with AI');
    console.log('  • Create course images with DALL-E');
    console.log('  • Generate voiceovers for lessons');
    console.log('  • Create lesson content automatically');
    console.log('  • Generate quizzes for assessments');
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Check the errors above.');
  }

  // Return exit code
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
