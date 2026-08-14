import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { name, prefix = 'key', length = 32 } = await request.json();

    // Generate a secure random key
    const randomPart = randomBytes(length).toString('hex');
    const timestamp = Date.now().toString(36);
    const hash = createHash('sha256').update(randomPart + timestamp).digest('hex').slice(0, 16);
    
    const key = `${prefix}_${randomPart.slice(0, length)}${hash}`;

    return NextResponse.json({
      success: true,
      key,
      name: name || 'Generated Key',
      created: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate key' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // List available key prefixes
  return NextResponse.json({
    prefixes: [
      { name: 'API Key', prefix: 'key', length: 32, description: 'General API key' },
      { name: 'Secret', prefix: 'sec', length: 48, description: 'Long-lived secret' },
      { name: 'Token', prefix: 'tok', length: 32, description: 'Auth token' },
      { name: 'iPerations', prefix: 'iper', length: 32, description: 'iPerations integration key' },
    ]
  });
}