import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AgentMessage, ConversationSession, AgentConfig } from '@/lib/dev-studio/agent';

export const dynamic = 'force-dynamic';

interface StoredConversation {
  id: string;
  user_id: string;
  title: string;
  messages: AgentMessage[];
  config: AgentConfig;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('studio_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ conversations: data });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, messages, config } = body;

    const { data, error } = await supabase
      .from('studio_conversations')
      .insert({
        user_id: user.id,
        title: title || 'New Conversation',
        messages: messages || [],
        config: config || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ conversation: data });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, messages } = body;

    const { data, error } = await supabase
      .from('studio_conversations')
      .update({
        title,
        messages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ conversation: data });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing conversation ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('studio_conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}