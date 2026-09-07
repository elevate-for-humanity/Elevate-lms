import { readFileSync } from 'node:fs';

const compose = readFileSync('apps/admin/app/communications/new/page.tsx', 'utf8');
const action = readFileSync('apps/admin/app/communications/new/actions.ts', 'utf8');
const hub = readFileSync('apps/admin/app/communications/page.tsx', 'utf8');

describe('Admin communications send contract', () => {
  it('uses explicit recipients and canonical template fields', () => {
    expect(compose).toContain('action={sendCommunication}');
    expect(compose).toContain("select('id,key,subject')");
    expect(compose).not.toContain('All Students');
    expect(compose).not.toContain('Save as Draft');
  });

  it('validates bounded recipient lists and records delivery state', () => {
    expect(action).toContain('recipients.length > 25');
    expect(action).toContain("status: 'queued'");
    expect(action).toContain('recipient_id:');
    expect(action).toContain('sender_id: auth.user.id');
    expect(action).toContain('body: message');
    expect(action).not.toContain('user_id:');
    expect(action).not.toContain('content: message');
    expect(action).toContain("status: result.success ? 'sent' : 'failed'");
    expect(action).toContain('sendEmail({');
  });

  it('uses canonical communications and scheduled-message fields', () => {
    expect(hub).toContain("select('id,recipient_id,type,subject,body,status,sent_at,created_at,metadata')");
    expect(hub).toContain("select('id,recipient,message,channel,scheduled_at,status')");
    expect(hub).not.toContain('comm.recipient}');
    expect(hub).not.toContain('msg.send_at');
    expect(hub).not.toContain('tmpl.name');
  });
});
