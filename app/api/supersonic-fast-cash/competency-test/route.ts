import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Tax preparer competency test questions
const TEST_QUESTIONS = [
  {
    id: 1,
    question: 'What form is used to report individual income tax?',
    options: ['Form 1040', 'Form W-2', 'Form 1099', 'Form 941'],
    correct: 0,
    category: 'basics',
  },
  {
    id: 2,
    question: 'What is the standard deduction for a single filer in 2024?',
    options: ['$12,950', '$13,850', '$14,600', '$15,000'],
    correct: 2,
    category: 'deductions',
  },
  {
    id: 3,
    question: 'Which form reports wages paid to an employee?',
    options: ['Form 1099-NEC', 'Form W-2', 'Form 1040', 'Form W-4'],
    correct: 1,
    category: 'forms',
  },
  {
    id: 4,
    question: 'What is the deadline for filing individual tax returns?',
    options: ['March 15', 'April 15', 'April 30', 'May 15'],
    correct: 1,
    category: 'deadlines',
  },
  {
    id: 5,
    question: 'Which schedule is used to report self-employment income?',
    options: ['Schedule A', 'Schedule B', 'Schedule C', 'Schedule D'],
    correct: 2,
    category: 'schedules',
  },
  {
    id: 6,
    question: 'What is the self-employment tax rate?',
    options: ['7.65%', '12.4%', '15.3%', '22%'],
    correct: 2,
    category: 'taxes',
  },
  {
    id: 7,
    question: 'Which form is used to report capital gains and losses?',
    options: ['Schedule A', 'Schedule C', 'Schedule D', 'Schedule E'],
    correct: 2,
    category: 'schedules',
  },
  {
    id: 8,
    question: 'What is the maximum contribution to a traditional IRA for someone under 50?',
    options: ['$6,000', '$6,500', '$7,000', '$7,500'],
    correct: 2,
    category: 'retirement',
  },
  {
    id: 9,
    question: 'Which filing status generally provides the lowest tax rates for married couples?',
    options: ['Single', 'Married Filing Separately', 'Married Filing Jointly', 'Head of Household'],
    correct: 2,
    category: 'filing-status',
  },
  {
    id: 10,
    question: 'What form is used to report rental income?',
    options: ['Schedule A', 'Schedule C', 'Schedule D', 'Schedule E'],
    correct: 3,
    category: 'schedules',
  },
];

export async function GET() {
  // Return test questions (without correct answers)
  const questions = TEST_QUESTIONS.map(({ correct, ...q }) => q);
  return NextResponse.json({ 
    questions,
    timeLimit: 30, // minutes
    passingScore: 70,
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid answers' }, { status: 400 });
    }

    // Score the test
    let correct = 0;
    const results = TEST_QUESTIONS.map((q, idx) => {
      const isCorrect = answers[idx] === q.correct;
      if (isCorrect) correct++;
      return {
        questionId: q.id,
        correct: isCorrect,
        category: q.category,
      };
    });

    const score = Math.round((correct / TEST_QUESTIONS.length) * 100);
    const passed = score >= 70;

    // Save result if user is logged in
    if (user) {
      try {
        await supabase
          .from('competency_tests')
          .insert({
            user_id: user.id,
            score,
            passed,
            answers: JSON.stringify(answers),
            completed_at: new Date().toISOString(),
          });
      } catch {
        // Table may not exist yet - ignore
      }
    }

    return NextResponse.json({
      score,
      passed,
      correct,
      total: TEST_QUESTIONS.length,
      results,
      message: passed 
        ? 'Congratulations! You passed the competency test.' 
        : 'You did not pass. Please review the material and try again.',
    });
  } catch (error) {
    console.error('Test submission error:', error);
    return NextResponse.json({ error: 'Failed to submit test' }, { status: 500 });
  }
}
