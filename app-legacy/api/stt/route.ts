// PUBLIC ROUTE: Speech-to-text transcription for voice input. Rate-limited via
// applyRateLimit('public'). No user data is read or written.
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  try {
    // Support both JSON (with base64 audio) and multipart form data
    const contentType = request.headers.get('content-type') || '';
    
    let audioData: ArrayBuffer | null = null;
    let model = 'whisper-1';
    let language: string | undefined;

    if (contentType.includes('application/json')) {
      // JSON body with base64 encoded audio
      const { audio, model: reqModel, language: reqLang } = await request.json();
      
      if (!audio) {
        return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
      }
      
      // Decode base64 audio
      const binaryString = atob(audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      audioData = bytes.buffer;
      
      if (reqModel) model = reqModel;
      if (reqLang) language = reqLang;
    } else if (contentType.includes('multipart/form-data')) {
      // Multipart form data with file upload
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File | null;
      
      if (!audioFile) {
        return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
      }
      
      audioData = await audioFile.arrayBuffer();
      const reqModel = formData.get('model');
      const reqLang = formData.get('language');
      
      if (reqModel) model = reqModel as string;
      if (reqLang) language = reqLang as string | undefined;
    } else {
      return NextResponse.json(
        { error: 'Content-Type must be application/json or multipart/form-data' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      // Return mock response for demo/testing
      logger.warn('STT API called without OPENAI_API_KEY - returning mock response');
      return NextResponse.json({
        text: '[Transcription requires OPENAI_API_KEY]',
        mock: true,
        message: 'Speech-to-text is configured but requires OpenAI API key'
      }, { status: 200 });
    }

    // Create FormData for OpenAI API
    const openAiFormData = new FormData();
    const blob = new Blob([audioData!], { type: 'audio/webm' });
    openAiFormData.append('file', blob, 'audio.webm');
    openAiFormData.append('model', model);
    if (language) {
      openAiFormData.append('language', language);
    }

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: openAiFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('OpenAI STT API error:', errorData);
      return NextResponse.json(
        { error: 'Transcription failed', details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      text: result.text,
      language: result.language || language,
      duration: result.duration,
      model: model
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    logger.error('STT API error:', error);
    return NextResponse.json(
      { error: 'Speech-to-text processing failed' },
      { status: 500 }
    );
  }
}

// GET endpoint returns API info
export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  return NextResponse.json({
    service: 'stt',
    description: 'Speech-to-text transcription API',
    provider: apiKey ? 'OpenAI Whisper' : 'Not configured',
    methods: {
      post: {
        contentType: ['application/json', 'multipart/form-data'],
        jsonBody: { audio: 'base64 encoded audio', model: 'optional (default: whisper-1)', language: 'optional ISO 639-1' },
        formData: { audio: 'audio file', model: 'optional', language: 'optional' },
        returns: { text: 'transcribed text', language: 'detected or provided language', duration: 'audio duration in seconds' }
      }
    },
    status: apiKey ? 'ready' : 'requires_api_key'
  });
}
