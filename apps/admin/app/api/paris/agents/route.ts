import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hydrateProcessEnv } from '@/lib/secrets';

// Build-safe: lazily create the admin client at runtime.
// This prevents 'supabaseKey is required' errors during Next.js static build.
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!_supabase) {
    hydrateProcessEnv();
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

// Agent Templates
const AGENT_TEMPLATES = {
  recruiter: {
    name: 'Recruiter AI',
    role: 'recruiter',
    systemPrompt: `You are an AI Recruiter for Elevate Workforce Development.
You connect graduates with employment opportunities, screen candidates, and coordinate with employers.
Maintain professionalism and prioritize good job matches over quick placements.
Always verify credentials and work authorization before referring candidates.`,
    tools: ['student_db', 'employer_db', 'adzuna_api', 'matchmaking'],
    permissions: {
      canRead: { students: true, employers: true, reports: true },
      canWrite: { students: false, employers: true, reports: false },
      canDelete: {},
      maxRecordsPerAction: 25,
    },
  },
  marketing: {
    name: 'Marketing AI',
    role: 'marketing_manager',
    systemPrompt: `You are an AI Marketing Manager for Elevate Workforce Development.
You plan and execute marketing campaigns, analyze performance, and optimize messaging.
Be creative while maintaining brand consistency.
Always ensure accessibility compliance for all content.`,
    tools: ['content_generator', 'social_media', 'analytics'],
    permissions: {
      canRead: { reports: true },
      canWrite: { reports: true },
      canDelete: {},
      maxRecordsPerAction: 50,
    },
  },
  support: {
    name: 'Support AI',
    role: 'customer_support',
    systemPrompt: `You are an AI Customer Support Agent for Elevate Workforce Development.
You help students and stakeholders with questions and issues.
Be patient, empathetic, and escalate complex issues appropriately.
Always protect student privacy and data.`,
    tools: ['knowledge_base', 'ticket_system', 'student_db'],
    permissions: {
      canRead: { students: true },
      canWrite: {},
      canDelete: {},
      maxRecordsPerAction: 10,
    },
  },
  grant_writer: {
    name: 'Grant Writer AI',
    role: 'grant_writer',
    systemPrompt: `You are an AI Grant Writer for Elevate Workforce Development.
You draft grant proposals, track deadlines, and manage compliance documentation.
Be thorough and precise - grant writing requires attention to detail and compliance.
Always cite sources and follow grant guidelines exactly.`,
    tools: ['grant_templates', 'compliance_checker', 'document_generator'],
    permissions: {
      canRead: { programs: true, finances: true, reports: true },
      canWrite: { reports: true },
      canDelete: {},
      maxRecordsPerAction: 5,
    },
  },
};

export async function GET() {
  try {
    // List all agents
    const { data: agents, error } = await getSupabaseAdmin()
      .from('ai_agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      agents: agents || [],
      templates: Object.keys(AGENT_TEMPLATES),
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch agents' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, role, name, ownerId, config } = body;

    if (action === 'create') {
      // Get template
      const template = AGENT_TEMPLATES[role as keyof typeof AGENT_TEMPLATES];
      if (!template) {
        return NextResponse.json({ 
          success: false, 
          error: `Unknown agent role: ${role}` 
        }, { status: 400 });
      }

      const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create agent
      const { data, error } = await getSupabaseAdmin()
        .from('ai_agents')
        .insert({
          id: agentId,
          name: name || template.name,
          role: template.role,
          status: 'training',
          config: {
            model: 'claude',
            temperature: 0.4,
            maxTokens: 2048,
            systemPrompt: template.systemPrompt,
            tools: template.tools,
            memoryEnabled: true,
            learningEnabled: true,
            approvalRequired: true,
            approvalTypes: ['enrollment_decision', 'funding_approval'],
          },
          permissions: template.permissions,
          owner_id: ownerId,
          is_clone: false,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        agent: data,
        message: `${template.name} created successfully!`,
      });
    }

    if (action === 'update') {
      const { agentId, updates } = body;
      
      const { data, error } = await getSupabaseAdmin()
        .from('ai_agents')
        .update(updates)
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, agent: data });
    }

    if (action === 'delete') {
      const { agentId } = body;
      
      const { error } = await getSupabaseAdmin()
        .from('ai_agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'Agent deleted' });
    }

    if (action === 'clone') {
      const { agentId, newOwnerId, name } = body;
      
      // Get original
      const { data: original, error: fetchError } = await getSupabaseAdmin()
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (fetchError || !original) {
        return NextResponse.json({ 
          success: false, 
          error: 'Original agent not found' 
        }, { status: 404 });
      }

      // Create clone
      const { data: clone, error: cloneError } = await getSupabaseAdmin()
        .from('ai_agents')
        .insert({
          id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name || `${original.name} (Clone)`,
          role: original.role,
          status: 'training',
          config: {
            ...original.config,
            systemPrompt: `${original.config.systemPrompt}\n\nNote: You are a clone of ${original.name}.`,
          },
          permissions: original.permissions,
          owner_id: newOwnerId,
          is_clone: true,
          clone_of: agentId,
        })
        .select()
        .single();

      if (cloneError) throw cloneError;

      return NextResponse.json({ 
        success: true, 
        agent: clone,
        message: 'Agent cloned successfully!',
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 });

  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
