import { execFileSync } from 'node:child_process';

const project = 'elegant-racer-299721';
const name = 'Elevate admin cloud $90 warning';
const topic = `projects/${project}/topics/elevate-admin-cloud-budget`;
const subscription = `projects/${project}/subscriptions/elevate-admin-cloud-budget`;
const gc = args => execFileSync('gcloud', [...args, '--project='+project, '--quiet'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 }).trim();
const read = args => JSON.parse(gc([...args, '--format=json']));

// Use the existing production deploy identity. Do not grant it new billing
// authority, change payments, modify spend caps or disable billing.
gc(['services', 'enable', 'billingbudgets.googleapis.com', 'pubsub.googleapis.com']);
const billing = read(['billing', 'projects', 'describe', project]);
if (!/^billingAccounts\/[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}$/.test(billing.billingAccountName ?? '')) throw Error('Linked billing account is unavailable');
const access = gc(['auth', 'print-access-token']);
async function api(url, method='GET', body) {
  const response = await fetch(url, { method, headers: { authorization: 'Bearer '+access, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000), redirect: 'error' });
  if (!response.ok) throw Error(`Cloud budget API ${method} failed: HTTP ${response.status}`);
  return response.json();
}
const base = 'https://billingbudgets.googleapis.com/v1/'+billing.billingAccountName+'/budgets';
const budgets = [];
let pageToken;
do {
  const page = await api(base+'?scope=projects%2F484736877039&pageSize=100'+(pageToken ? '&pageToken='+encodeURIComponent(pageToken) : ''));
  budgets.push(...(page.budgets ?? [])); pageToken=page.nextPageToken;
} while (pageToken);
const matching = budgets.filter(b => b.displayName === name);
if (matching.length > 1 || matching[0]?.spendCap) throw Error('Existing budget ownership requires review');
const topics = read(['pubsub', 'topics', 'list']);
let current = topics.find(t => t.name === topic);
if (current && current.labels?.elevate_component !== 'cloud_budget') throw Error('Existing topic ownership requires review');
if (!current) gc(['pubsub', 'topics', 'create', topic, '--labels=elevate_component=cloud_budget']);
const subscriptions = read(['pubsub', 'subscriptions', 'list']);
current = subscriptions.find(s => s.name === subscription);
if (current && (current.topic !== topic || current.labels?.elevate_component !== 'cloud_budget' || current.pushConfig?.pushEndpoint)) throw Error('Existing subscription ownership requires review');
if (!current) gc(['pubsub', 'subscriptions', 'create', subscription, '--topic='+topic, '--labels=elevate_component=cloud_budget', '--message-retention-duration=7d', '--expiration-period=never']);
const admin = read(['run', 'services', 'describe', 'elevate-admin-migration', '--region=us-central1']);
const identity = admin.spec?.template?.spec?.serviceAccountName;
if (!/^[a-z0-9-]+@elegant-racer-299721\.iam\.gserviceaccount\.com$/.test(identity ?? '')) throw Error('Admin service identity requires review');
// This consumer can read only this budget subscription; no project-wide role.
gc(['pubsub', 'subscriptions', 'add-iam-policy-binding', subscription, '--member=serviceAccount:'+identity, '--role=roles/pubsub.subscriber']);
const desired = {
  displayName: name,
  budgetFilter: { projects: ['projects/484736877039'], calendarPeriod: 'MONTH', creditTypesTreatment: 'INCLUDE_ALL_CREDITS' },
  amount: { specifiedAmount: { currencyCode: 'USD', units: '100' } },
  thresholdRules: [
    { thresholdPercent: 0.9, spendBasis: 'CURRENT_SPEND' },
    { thresholdPercent: 1, spendBasis: 'CURRENT_SPEND' },
    { thresholdPercent: 0.9, spendBasis: 'FORECASTED_SPEND' },
  ],
  notificationsRule: { pubsubTopic: topic, schemaVersion: '1.0', disableDefaultIamRecipients: false, enableProjectLevelRecipients: true },
};
const saved = matching[0]
  ? await api('https://billingbudgets.googleapis.com/v1/'+matching[0].name+'?updateMask=budgetFilter,amount,thresholdRules,notificationsRule', 'PATCH', { ...desired, name: matching[0].name, etag: matching[0].etag })
  : await api(base, 'POST', desired);
const verified = await api('https://billingbudgets.googleapis.com/v1/'+saved.name);
if (verified.amount?.specifiedAmount?.units !== '100' || verified.amount?.specifiedAmount?.currencyCode !== 'USD' ||
    !verified.thresholdRules?.some(t => t.thresholdPercent === 0.9 && t.spendBasis === 'CURRENT_SPEND') ||
    verified.notificationsRule?.pubsubTopic !== topic || verified.notificationsRule?.disableDefaultIamRecipients === true) throw Error('Cloud budget readback failed');
console.log(JSON.stringify({ configured: true, warningUSD: 90, monthlyBudgetUSD: 100, emailAlerts: true, dashboardSubscription: true, billingEnabled: billing.billingEnabled }));
