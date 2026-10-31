import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const contract = JSON.parse(
  readFileSync(new URL('../config/store-commerce.json', import.meta.url), 'utf8'),
);
if (
  contract.repository !== 'elevateforhumanity/elevate-store-platform' ||
  !/^[a-f0-9]{40}$/.test(contract.sourceCommit) ||
  contract.supabaseProject !== 'ebnbeqdsuxygopetptlv' ||
  contract.paymentReceiptUrl !==
    `https://${contract.supabaseProject}.supabase.co/functions/v1/quickbooks-payment-receipt` ||
  contract.billingProvider !== 'quickbooks'
)
  throw Error('Store ownership contract is invalid');
const directory = mkdtempSync(join(tmpdir(), 'store-component-contracts-'));
try {
  const run = (command, args) =>
    execFileSync(command, args, { cwd: directory, stdio: 'inherit', timeout: 120000 });
  run('git', ['init', '--quiet']);
  run('git', ['remote', 'add', 'origin', `https://github.com/${contract.repository}.git`]);
  run('git', ['fetch', '--quiet', '--depth=1', 'origin', contract.sourceCommit]);
  run('git', ['checkout', '--quiet', '--detach', 'FETCH_HEAD']);
  const actual = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: directory,
    encoding: 'utf8',
  }).trim();
  if (actual !== contract.sourceCommit) throw Error('Store backend revision changed');
  run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund']);
  run('npm', ['test']);
  console.log(
    `[store-components] ${contract.repository}@${actual}: backend payment and provisioning contracts passed`,
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
