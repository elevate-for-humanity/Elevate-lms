import { aiChat } from '../lib/ai/ai-service';
import { requireAdminClient } from '../lib/supabase/admin';

const SYSTEM_PROMPT = `You are a professional instructional designer for Elevate, a workforce development LMS.
Given a topic, produce a complete course structure.
Return ONLY valid JSON wrapped in <<<COURSE_JSON>>> and <<<END_COURSE_JSON>>>:

{
  "title": "string",
  "subtitle": "string",
  "description": "string",
  "audience": "string",
  "duration_hours": number,
  "category": "trades",
  "passing_score": 80,
  "completion_rule": "all_lessons",
  "modules": [
    {
      "title": "string",
      "sort_order": 1,
      "lessons": [
        {
          "lesson_number": 1,
          "title": "string",
          "description": "string",
          "objectives": ["string"],
          "content": "string (instructional text)",
          "content_type": "reading",
          "duration_minutes": 15,
          "is_required": true,
          "quiz_questions": [
            {
              "question": "string",
              "options": ["A","B","C","D"],
              "correct_index": 0,
              "explanation": "string"
            }
          ]
        }
      ]
    }
  ]
}`;

async function runGenerator() {
  console.log('--- STARTING COSMETOLOGY COURSE GENERATOR ---');
  
  const prompt = "Generate a 1,500-hour Cosmetology Apprenticeship program focusing on Indiana State Board compliance, including modules covering hair, skin, and nails.";
  
  try {
    console.log('Calling AI Brain...');
    const completion = await aiChat({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    });

    const raw = completion.content;
    const jsonMatch = raw.match(/<<<COURSE_JSON>>>([\s\S]*?)<<<END_COURSE_JSON>>>/);
    
    if (!jsonMatch) {
      console.error('Failed to extract JSON from AI response');
      return;
    }

    const course = JSON.parse(jsonMatch[1].trim());
    console.log(`Generated: ${course.title}`);
    console.log(`Duration: ${course.duration_hours} hours`);
    console.log(`Modules: ${course.modules.length}`);

    course.modules.forEach((m: any, i: number) => {
      console.log(`  [Module ${i+1}] ${m.title} (${m.lessons.length} lessons)`);
    });

    // Write to DB
    console.log('Writing to production database...');
    const db = await requireAdminClient();
    
    const { data: courseRow } = await db.from('lms_courses').insert({
      course_name: course.title,
      title: course.title,
      description: course.description,
      category: 'trades',
      duration_hours: course.duration_hours,
      slug: `cosmetology-apprenticeship-${Date.now().toString().slice(-4)}`,
      status: 'published',
      is_published: true,
      is_active: true
    }).select('id').single();

    if (courseRow) {
      console.log(`Successfully published course ID: ${courseRow.id}`);
      
      // Map to program if it exists
      const { data: prog } = await db.from('programs').select('id').eq('slug', 'cosmetology-apprenticeship').maybeSingle();
      if (prog) {
        await db.from('program_courses').insert({
          program_id: prog.id,
          course_id: courseRow.id,
          is_required: true,
          order_index: 1
        });
        console.log('Linked to Cosmetology Apprenticeship program.');
      }
    }

    console.log('--- GENERATOR RUN COMPLETE ---');
  } catch (err) {
    console.error('Generator error:', err);
  }
}

runGenerator();
