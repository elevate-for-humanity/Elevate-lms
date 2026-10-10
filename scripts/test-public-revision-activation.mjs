import test from 'node:test';
import assert from 'node:assert/strict';
import { activateTestedRevision, unusedCandidateTags } from './gcp/activate-tested-public-revision.mjs';

const commit = 'a'.repeat(40), service = 'elevate-marketing-migration', revision = service + '-candidate-a';
const healthy = { revision, service: 'marketing', healthy: true, ready: true, configuration: { ok: true }, dependencies: { supabase: { ok: true } }, commit };
function fixture(state = healthy, status = 200, component = 'marketing') {
  const service = 'elevate-' + component + '-migration';
  const revision = service + '-candidate-a';
  const calls = [];
  const f = { calls, traffic: [{ revisionName: service + '-old', percent: 100 }], latest: revision };
  f.read = args => {
    calls.push(args);
    if (args[1] === 'revisions') return { spec: { containers: [{ image: 'registry/image@sha256:' + 'a'.repeat(64) }] } };
    if (args[2] === 'update-traffic') {
      for (const flag of args.filter(x => /^--(remove-tags|update-tags|to-revisions)=/.test(x))) {
      if (flag.startsWith('--remove-tags=')) {
        const tags = flag.slice('--remove-tags='.length).split(',');
        f.traffic = f.traffic.flatMap(item => tags.includes(item.tag) ? (item.percent > 0 ? [{ revisionName: item.revisionName, percent: item.percent }] : []) : [item]);
      } else if (flag.startsWith('--update-tags=')) {
        f.traffic.push({ tag: 'c-aaaaaaaaaaaa', revisionName: revision, url: 'https://candidate.example.run.app' });
        if (f.failTag) throw Error('CPU quota exhausted');
      } else {
        f.traffic = f.traffic.map(item => ({ ...item, percent: item.revisionName === revision ? 100 : 0 }));
      }
      }
    }
    return { spec: f.spec, status: { latestReadyRevisionName: service + '-old', latestCreatedRevisionName: f.latest, traffic: structuredClone(f.traffic) } };
  };
  f.fetcher = async () => ({ ok: status === 200, async json() { return state; } });
  f.options = { service, revision, commit, read: f.read, fetcher: f.fetcher, attempts: 1 };
  f.promoted = () => calls.some(a => a.some(x => x.startsWith('--to-revisions=')));
  return f;
}

test('pinned old latest-ready revision does not prevent exact tested candidate activation', async () => {
  const f = fixture(); const result = await activateTestedRevision(f.options);
  assert.equal(result.traffic, 100); assert.equal(f.promoted(), true);
});
test('wrong candidate commit never switches public traffic and releases failed tag', async () => {
  const f = fixture({ ...healthy, commit: 'b'.repeat(40) });
  await assert.rejects(activateTestedRevision(f.options), /wrong immutable commit/);
  assert.equal(f.promoted(), false); assert.equal(f.traffic.some(x => x.tag === 'c-aaaaaaaaaaaa'), false);
});
for (const [name, state, status] of [
  ['non-success response', healthy, 503],
  ['not healthy', { ...healthy, healthy: false }, 200],
  ['not ready', { ...healthy, ready: false }, 200],
  ['missing revision', { ...healthy, revision: undefined }, 200],
  ['wrong revision', { ...healthy, revision: service + '-other' }, 200],
  ['wrong service', { ...healthy, service: 'admin' }, 200],
  ['missing configuration', { ...healthy, configuration: undefined }, 200],
  ['Supabase unavailable', { ...healthy, dependencies: { supabase: { ok: false } } }, 200],
  ['null body', null, 200],
]) {
  test(name + ' preserves serving traffic', async () => {
    const f = fixture(state, status);
    await assert.rejects(activateTestedRevision(f.options), /failed runtime health/);
    assert.equal(f.promoted(), false);
    assert.deepEqual(f.traffic, [{ revisionName: service + '-old', percent: 100 }]);
  });
}
test('mutable image is refused before adding candidate tag', async () => {
  const f = fixture(); f.options.read = args => { f.calls.push(args); return { spec: { containers: [{ image: 'registry/image:latest' }] } }; };
  await assert.rejects(activateTestedRevision(f.options), /immutable/); assert.equal(f.calls.length, 1);
});
test('only obsolete generated zero-percent tags are removed before candidate startup', async () => {
  const f = fixture(); f.latest = service + '-other-release';
  f.traffic.push(
    { tag: 'c-bbbbbbbbbbbb', revisionName: service + '-obsolete' },
    { tag: 'manual-rollback', revisionName: service + '-manual' },
    { tag: 'c-cccccccccccc', revisionName: service + '-old' },
    { tag: 'c-dddddddddddd', revisionName: f.latest },
  );
  const result = await activateTestedRevision(f.options);
  assert.deepEqual(result.retiredCandidateTags, ['c-bbbbbbbbbbbb', 'c-cccccccccccc']);
  assert.ok(f.traffic.some(x => x.tag === 'manual-rollback'));
  assert.equal(f.traffic.some(x => x.tag === 'c-cccccccccccc'), false);
  assert.ok(f.traffic.some(x => x.tag === 'c-dddddddddddd'));
  const removal = f.calls.findIndex(a => a.includes('--remove-tags=c-bbbbbbbbbbbb'));
  const tagging = f.calls.findIndex(a => a.some(x => x.startsWith('--update-tags=')));
  assert.equal(removal, tagging);
  assert.equal(f.calls.some(a => a.includes('delete')), false);
});
test('failed tag command is read back and released without changing public traffic', async () => {
  const f = fixture(); f.failTag = true;
  await assert.rejects(activateTestedRevision(f.options), /CPU quota/);
  assert.equal(f.promoted(), false); assert.deepEqual(f.traffic, [{ revisionName: service + '-old', percent: 100 }]);
});
test('concurrent traffic change stops activation without undoing another release', async () => {
  const f = fixture(); f.options.fetcher = async () => {
    f.traffic[0] = { revisionName: service + '-another-release', percent: 100 };
    return { ok: true, json: async () => healthy };
  };
  await assert.rejects(activateTestedRevision(f.options), /changed concurrently/);
  assert.equal(f.promoted(), false); assert.equal(f.traffic[0].revisionName, service + '-another-release');
});
test('concurrent new revision prevents promotion of an older verified candidate', async () => {
  const f = fixture(); f.options.fetcher = async () => {
    f.latest = service + '-newer'; return { ok: true, json: async () => healthy };
  };
  await assert.rejects(activateTestedRevision(f.options), /Newer revision/); assert.equal(f.promoted(), false);
});
test('candidate tag and service name fit Google limit', () => { assert.ok(('c-' + commit.slice(0, 12) + service).length <= 46); });
test('configured region is used for every revision and traffic operation', async () => {
  const f = fixture(); await activateTestedRevision(f.options);
  for (const args of f.calls) assert.ok(args.includes('--region=' + (process.env.CANDIDATE_REGION || 'us-central1')));
});

for (const component of ['admin', 'lms', 'store']) {
  test(component + ' uses the same exact revision and dependency gate', async () => {
    const f = fixture({ ...healthy, service: component, revision: 'elevate-' + component + '-migration-candidate-a' }, 200, component);
    const result = await activateTestedRevision(f.options);
    assert.equal(result.traffic, 100); assert.equal(f.promoted(), true);
  });
}


test('spec and status traffic both protect serving tags, and ambiguous mappings stay', () => {
  const rows = [
    { revisionName: 'serving', percent: 100 },
    { revisionName: 'serving', tag: 'c-111111111111' },
    { revisionName: 'old', tag: 'c-222222222222' },
    { revisionName: 'old', tag: 'release-verified' },
  ];
  assert.deepEqual(unusedCandidateTags({ status: { traffic: rows } }), ['c-222222222222']);
  assert.deepEqual(unusedCandidateTags({ spec: { traffic: [{ revisionName: 'old', percent: 100 }] }, status: { traffic: rows } }), []);
  assert.deepEqual(unusedCandidateTags({ spec: { traffic: [{ revisionName: 'other', tag: 'c-222222222222' }] }, status: { traffic: rows } }), []);
});
test('legacy startup test tag is retired only after successful promotion', async () => {
  const f = fixture(); f.traffic[0].tag = 'startup-gen2';
  await activateTestedRevision(f.options);
  assert.equal(f.traffic.some(item => item.tag === 'startup-gen2'), false);
  const promotion = f.calls.findIndex(args => args.some(flag => flag.startsWith('--to-revisions=')));
  const removal = f.calls.findIndex(args => args.includes('--remove-tags=startup-gen2'));
  assert.ok(removal > promotion);
});
test('failure cleanup preserves a candidate requested to serve in spec', async () => {
  const f = fixture({ ...healthy, healthy: false }, 503);
  f.options.fetcher = async () => {
    f.spec = { traffic: [{ revisionName: revision, percent: 100, tag: 'c-aaaaaaaaaaaa' }] };
    return { ok: false, json: async () => ({ ...healthy, healthy: false }) };
  };
  await assert.rejects(activateTestedRevision(f.options), /failed runtime health/);
  assert.equal(f.calls.some(args => args.includes('--remove-tags=c-aaaaaaaaaaaa')), false);
});
test('failed cleanup reports the original failure and the cleanup failure', async () => {
  const f = fixture(); const read = f.read; f.failTag = true;
  f.options.read = args => {
    if (args.some(flag => flag.startsWith('--remove-tags='))) throw Error('cleanup denied');
    return read(args);
  };
  await assert.rejects(activateTestedRevision(f.options), error =>
    error instanceof AggregateError && /CPU quota/.test(error.message) && error.errors.some(cause => cause.message === 'cleanup denied'));
});

test('a pending latest-revision traffic assignment protects its candidate tag', () => {
  const state = { spec: { traffic: [{ latestRevision: true, percent: 100 }] }, status: {
    latestCreatedRevisionName: revision,
    traffic: [{ revisionName: service + '-old', percent: 100 }, { revisionName: revision, tag: 'c-aaaaaaaaaaaa' }],
  } };
  assert.deepEqual(unusedCandidateTags(state), []);
});
