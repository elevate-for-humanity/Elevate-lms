import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    openapi: '3.0.0',
    info: { title: 'Elevate LMS API', version: '1.0.0' }
  });
}
