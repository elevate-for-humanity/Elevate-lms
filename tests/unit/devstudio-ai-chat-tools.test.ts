import { describe, expect, it } from 'vitest';
import { TOOL_META } from '@/components/studio/AIChat';

describe('Dev Studio AIChat tool metadata', () => {
  it('labels operational diagnostic tools explicitly', () => {
    expect(TOOL_META.inspect_platform_registry.label).toBe('Platform Registry');
    expect(TOOL_META.query_program_by_slug.label).toBe('Program');
    expect(TOOL_META.inspect_route.label).toBe('Route');
    expect(TOOL_META.get_component_source.label).toBe('Source');
    expect(TOOL_META.search_schema.label).toBe('Schema');
    expect(TOOL_META.search_code.label).toBe('Code Search');
    expect(TOOL_META.audit_auth_flow.label).toBe('Auth Audit');
    expect(TOOL_META.inspect_build_errors.label).toBe('Build Logs');
  });
});

