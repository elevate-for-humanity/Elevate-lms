/**
 * AI Grading Edge Function
 * Automatically grades assessments using AI for subjective questions
 *
 * Copyright (c) 2025 Elevate for Humanity
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface GradeRequest {
  submissionId: string;
  assessmentId: string;
  userId: string;
  orgId: string;
}

interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  correctAnswer?: string | number;
  rubric?: string;
  points: number;
}

interface Answer {
  questionId: string;
  answer: string | number;
}

interface GradingResult {
  questionId: string;
  score: number;
  maxScore: number;
  feedback: string;
  isCorrect: boolean;
}

async function gradeWithOpenAI(
  question: Question,
  answer: string,
): Promise<{ score: number; feedback: string }> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
You are an expert educator grading a student's answer. Grade the following response:

Question: ${question.question}
${question.rubric ? `Grading Rubric: ${question.rubric}` : ''}
${question.correctAnswer ? `Expected Answer: ${question.correctAnswer}` : ''}
Maximum Points: ${question.points}

Student's Answer: ${answer}

Provide a grade and constructive feedback in the following JSON format:
{
  "score": number (0 to ${question.points}),
  "feedback": "Detailed feedback explaining the grade, highlighting strengths and areas for improvement"
}

Be fair, constructive, and specific in your feedback.
Return ONLY valid JSON, no additional text.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert educator providing fair and constructive grading. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);

  return {
    score: Math.min(Math.max(0, result.score), question.points),
    feedback: result.feedback,
  };
}

async function gradeWithAnthropic(
  question: Question,
  answer: string,
): Promise<{ score: number; feedback: string }> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const prompt = `
You are an expert educator grading a student's answer. Grade the following response:

Question: ${question.question}
${question.rubric ? `Grading Rubric: ${question.rubric}` : ''}
${question.correctAnswer ? `Expected Answer: ${question.correctAnswer}` : ''}
Maximum Points: ${question.points}

Student's Answer: ${answer}

Provide a grade and constructive feedback in the following JSON format:
{
  "score": number (0 to ${question.points}),
  "feedback": "Detailed feedback explaining the grade, highlighting strengths and areas for improvement"
}

Be fair, constructive, and specific in your feedback.
Return ONLY valid JSON, no additional text.
`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const responseText = data.content[0].text;

  // Extract JSON if wrapped in markdown code blocks
  const jsonMatch =
    responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/);
  const jsonText = jsonMatch ? jsonMatch[1] : responseText;

  const result = JSON.parse(jsonText);

  return {
    score: Math.min(Math.max(0, result.score), question.points),
    feedback: result.feedback,
  };
}

function gradeObjectiveQuestion(question: Question, answer: string | number): GradingResult {
  let isCorrect = false;
  let feedback = '';

  if (question.type === 'multiple_choice') {
    isCorrect = answer === question.correctAnswer;
    feedback = isCorrect
      ? 'Correct! Well done.'
      : `Incorrect. The correct answer is: ${question.correctAnswer}`;
  } else if (question.type === 'true_false') {
    isCorrect = answer === question.correctAnswer;
    feedback = isCorrect
      ? 'Correct!'
      : `Incorrect. The correct answer is: ${question.correctAnswer}`;
  }

  return {
    questionId: question.id,
    score: isCorrect ? question.points : 0,
    maxScore: question.points,
    feedback,
    isCorrect,
  };
}

async function gradeSubjectiveQuestion(question: Question, answer: string): Promise<GradingResult> {
  try {
    let result: { score: number; feedback: string };

    // Try Anthropic first, fallback to OpenAI
    if (ANTHROPIC_API_KEY) {
      result = await gradeWithAnthropic(question, answer);
    } else if (OPENAI_API_KEY) {
      result = await gradeWithOpenAI(question, answer);
    } else {
      throw new Error('No AI provider configured');
    }

    return {
      questionId: question.id,
      score: result.score,
      maxScore: question.points,
      feedback: result.feedback,
      isCorrect: result.score >= question.points * 0.7, // 70% threshold
    };
  } catch (error: any) {
    // Return ungraded result
    return {
      questionId: question.id,
      score: 0,
      maxScore: question.points,
      feedback: 'Unable to grade automatically. Manual review required.',
      isCorrect: false,
    };
  }
}

async function gradeSubmission(request: GradeRequest) {
  try {
    // Fetch submission
    const { data: submission, error: submissionError } = await supabase
      .from('assessment_submissions')
      .select('*')
      .eq('id', request.submissionId)
      .single();

    if (submissionError) throw submissionError;
    if (!submission) throw new Error('Submission not found');

    // Fetch assessment with questions
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', request.assessmentId)
      .single();

    if (assessmentError) throw assessmentError;
    if (!assessment) throw new Error('Assessment not found');

    const questions: Question[] = assessment.questions || [];
    const answers: Answer[] = submission.answers || [];

    // Grade each question
    const gradingResults: GradingResult[] = [];

    for (const question of questions) {
      const answer = answers.find((a) => a.questionId === question.id);

      if (!answer) {
        // No answer provided
        gradingResults.push({
          questionId: question.id,
          score: 0,
          maxScore: question.points,
          feedback: 'No answer provided.',
          isCorrect: false,
        });
        continue;
      }

      // Grade based on question type
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        gradingResults.push(gradeObjectiveQuestion(question, answer.answer));
      } else if (question.type === 'short_answer' || question.type === 'essay') {
        const result = await gradeSubjectiveQuestion(question, String(answer.answer));
        gradingResults.push(result);
      }
    }

    // Calculate total score
    const totalScore = gradingResults.reduce((sum, r) => sum + r.score, 0);
    const maxScore = gradingResults.reduce((sum, r) => sum + r.maxScore, 0);
    const percentageScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Update submission with grades
    const { error: updateError } = await supabase
      .from('assessment_submissions')
      .update({
        score: percentageScore,
        graded: true,
        grading_results: gradingResults,
        graded_at: new Date().toISOString(),
        graded_by: 'ai',
      })
      .eq('id', request.submissionId);

    if (updateError) throw updateError;

    // Log AI grading
    await supabase.from('ai_generations').insert({
      org_id: request.orgId,
      user_id: request.userId,
      type: 'grading',
      entity_id: request.submissionId,
      metadata: {
        assessmentId: request.assessmentId,
        totalScore,
        maxScore,
        percentageScore,
        questionCount: questions.length,
      },
    });

    return {
      success: true,
      submissionId: request.submissionId,
      score: percentageScore,
      totalScore,
      maxScore,
      results: gradingResults,
    };
  } catch (error: any) {
    throw error;
  }
}

async function processGradingQueue() {
  try {
    // Fetch pending submissions that need AI grading
    const { data: submissions, error } = await supabase
      .from('assessment_submissions')
      .select('*, assessment:assessments(*)')
      .eq('graded', false)
      .eq('requires_ai_grading', true)
      .order('submitted_at', { ascending: true })
      .limit(5);

    if (error) throw error;

    if (!submissions || submissions.length === 0) {
      return { processed: 0 };
    }

    let processed = 0;
    for (const submission of submissions) {
      try {
        await gradeSubmission({
          submissionId: submission.id,
          assessmentId: submission.assessment_id,
          userId: submission.user_id,
          orgId: submission.org_id,
        });
        processed++;
      } catch (error) {
        console.error(`[grade-ai] Failed to grade submission ${submission.id}:`, error instanceof Error ? error.message : error);
      }
    }

    return { processed };
  } catch (error: any) {
    throw error;
  }
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'grade';

    if (action === 'process-queue') {
      // Process grading queue (called by cron)
      const result = await processGradingQueue();
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Direct grading
    const request: GradeRequest = await req.json();

    // Validate request
    if (!request.submissionId || !request.assessmentId || !request.userId || !request.orgId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: submissionId, assessmentId, userId, orgId',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Check if AI provider is configured
    if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'No AI provider configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await gradeSubmission(request);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
