import fs from 'node:fs';
import path from 'node:path';

function replaceOrThrow(text, before, after, label) {
  if (!text.includes(before)) throw new Error(`Expected ${label} block was not found`);
  return text.replace(before, after);
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

// Normalize emitted legacy LMS paths without touching imports such as @/lib/portal/...
for (const root of ['apps/lms/app', 'components', 'lib']) {
  for (const file of walk(root)) {
    let text = fs.readFileSync(file, 'utf8');
    const original = text;
    text = text
      .replaceAll("'/learner/dashboard'", "'/lms/dashboard'")
      .replaceAll('"/learner/dashboard"', '"/lms/dashboard"')
      .replaceAll('`/learner/dashboard`', '`/lms/dashboard`')
      .replaceAll("'/portal/apprentice", "'/apprentice")
      .replaceAll('"/portal/apprentice', '"/apprentice')
      .replaceAll('`/portal/apprentice', '`/apprentice');
    if (text !== original) fs.writeFileSync(file, text);
  }
}

// Shared shell: partner role is the host-shop portal, not a parallel /partner UI.
{
  const file = 'components/dashboard/PlatformShell.tsx';
  let text = fs.readFileSync(file, 'utf8');
  const oldPartner = `      { href: '/partner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/partner/programs', label: 'Programs', icon: BookOpen },
      { href: '/partner/reports', label: 'Reports', icon: BarChart3 },
      { href: '/partner/messages', label: 'Messages', icon: MessageSquare },
      { href: '/partner/settings', label: 'Settings', icon: Settings },`;
  const newPartner = `      { href: '/host-shop/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/host-shop/resources', label: 'Resources', icon: BookOpen },
      { href: '/host-shop/mou', label: 'MOU', icon: FileText },
      { href: '/host-shop/onboarding', label: 'Onboarding', icon: ClipboardCheck },`;
  text = replaceOrThrow(text, oldPartner, newPartner, 'partner navigation');
  fs.writeFileSync(file, text);
}

// Profile menu: mirror the canonical role destination registry and cross service hosts.
{
  const file = 'components/navigation/ProfileDropdown.tsx';
  let text = fs.readFileSync(file, 'utf8');
  if (!text.includes("import { siteUrls } from '@/lib/utils/site-urls';")) {
    text = replaceOrThrow(
      text,
      "import { createClient } from '@/lib/supabase/client';",
      "import { createClient } from '@/lib/supabase/client';\nimport { siteUrls } from '@/lib/utils/site-urls';",
      'ProfileDropdown import',
    );
  }

  const marker = 'const ROLE_PORTAL: Record<string, { label: string; href: string }> = {';
  const start = text.indexOf(marker);
  if (start < 0) throw new Error('ROLE_PORTAL registry not found');
  const end = text.indexOf('\n};', start);
  if (end < 0) throw new Error('ROLE_PORTAL registry terminator not found');

  const canonical = `const ROLE_PORTAL: Record<string, { label: string; href: string }> = {
  super_admin: { label: 'Admin Dashboard', href: \`${'${siteUrls.admin}'}/dashboard\` },
  admin: { label: 'Admin Dashboard', href: \`${'${siteUrls.admin}'}/dashboard\` },
  org_admin: { label: 'Admin Dashboard', href: \`${'${siteUrls.admin}'}/dashboard\` },
  staff: { label: 'Staff Portal', href: \`${'${siteUrls.admin}'}/staff-portal/dashboard\` },
  instructor: { label: 'Instructor Portal', href: \`${'${siteUrls.admin}'}/instructor/dashboard\` },
  creator: { label: 'Creator Portal', href: \`${'${siteUrls.app}'}/creator/products\` },
  case_manager: { label: 'Case Manager Portal', href: \`${'${siteUrls.site}'}/case-manager/dashboard\` },
  workforce_board: { label: 'Workforce Board', href: \`${'${siteUrls.site}'}/workforce-board/dashboard\` },
  program_holder: { label: 'Program Holder Portal', href: \`${'${siteUrls.site}'}/program-holder/dashboard\` },
  provider: { label: 'Provider Portal', href: \`${'${siteUrls.site}'}/provider/dashboard\` },
  provider_admin: { label: 'Provider Portal', href: \`${'${siteUrls.site}'}/provider/dashboard\` },
  employer: { label: 'Employer Portal', href: \`${'${siteUrls.app}'}/employer/dashboard\` },
  sponsor: { label: 'Employer Portal', href: \`${'${siteUrls.app}'}/employer/dashboard\` },
  partner: { label: 'Host Shop Portal', href: \`${'${siteUrls.app}'}/host-shop/dashboard\` },
  host_shop: { label: 'Host Shop Portal', href: \`${'${siteUrls.app}'}/host-shop/dashboard\` },
  host_shop_admin: { label: 'Host Shop Portal', href: \`${'${siteUrls.app}'}/host-shop/dashboard\` },
  workforce_partner: { label: 'Workforce Portal', href: \`${'${siteUrls.app}'}/workforce/dashboard\` },
  parent: { label: 'Parent Portal', href: \`${'${siteUrls.app}'}/parent-portal/dashboard\` },
  apprentice: { label: 'Apprentice Portal', href: \`${'${siteUrls.app}'}/apprentice\` },
  barber_apprentice: { label: 'Apprentice Portal', href: \`${'${siteUrls.app}'}/apprentice\` },
  cosmetology_apprentice: { label: 'Apprentice Portal', href: \`${'${siteUrls.app}'}/apprentice\` },
  student: { label: 'My Dashboard', href: \`${'${siteUrls.app}'}/lms/dashboard\` },
  learner: { label: 'My Dashboard', href: \`${'${siteUrls.app}'}/lms/dashboard\` },
};`;
  text = text.slice(0, start) + canonical + text.slice(end + 3);
  fs.writeFileSync(file, text);
}

// Redirect-only/dead route wrappers duplicate canonical surfaces and contain no unique functionality.
for (const file of [
  'apps/lms/app/learner/page.tsx',
  'apps/lms/app/learner/dashboard/error.tsx',
  'apps/lms/app/lms/login/page.tsx',
]) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

const required = [
  'apps/lms/app/lms/(app)/dashboard/page.tsx',
  'apps/lms/app/apprentice/page.tsx',
  'apps/lms/app/host-shop/dashboard/page.tsx',
  'apps/lms/app/login/page.tsx',
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Canonical route missing: ${file}`);
}

console.log('LMS route consolidation completed.');
