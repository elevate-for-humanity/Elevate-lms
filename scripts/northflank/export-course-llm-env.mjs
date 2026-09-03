#!/usr/bin/env node
/**
 * Resolve the canonical Elevate LLM runtime for production course workflows.
 *
 * Reads the existing restricted Northflank worker secret, verifies authenticated
 * inference, masks sensitive values in Actions logs, and exports them only to
 * the current job's GITHUB_ENV file.
 */
import fs from 'node:fs';

const API_BASE = 'https://api.northflank.com/v1/projects/elevate-media-gpu';
const SERVICE_ID = 'elevate-llm-worker';
const SECRET_GROUP_ID = 'elevate-llm-worker-env';
const token = process.env.NORTHFLANK_API_TOKEN?.trim();
const githubEnv = process.env.GITHUB_ENV;

if (!token) throw new Error('Missing NORTHFLANK_API_TOKEN');
if (!githubEnv) throw new Error('GITHUB_ENV is unavailable');

async function get(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Northflank ${response.status} for ${path}: ${text.slice(0, 300)}`);
  }
  const parsed = text ? JSON.parse(text) : {};
  return parsed.data ?? parsed;
}

const service = await get(`/services/${SERVICE_ID}`);
const port = (service.ports ?? []).find(
  (candidate) => candidate?.name === 'llm' && candidate?.public === true,
);
if (!port?.dns || !/^[a-z0-9.-]+\.code\.run$/i.test(port.dns)) {
  throw new Error('Canonical Elevate LLM public endpoint is unavailable or invalid');
}

const secretGroup = await get(`/secrets/${SECRET_GROUP_ID}/details`);
const secret = secretGroup?.secrets?.variables?.LLM_WORKER_SECRET;
if (typeof secret !== 'string' || !/^[a-f0-9]{64}$/i.test(secret)) {
  throw new Error('Canonical Elevate LLM credential is unavailable or invalid');
}

const url = `https://${port.dns}`;
console.log(`::add-mask::${secret}`);
console.log(`::add-mask::${url}`);

const deadline = Date.now() + 15 * 60 * 1000;
let accepted = false;
let lastStatus = 'not attempted';

while (Date.now() < deadline) {
  try {
    const response = await fetch(`${url}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${secret}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'elevate-local',
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        temperature: 0,
        max_tokens: 8,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    lastStatus = String(response.status);
    if (response.ok) {
      const payload = await response.json();
      if (String(payload?.choices?.[0]?.message?.content ?? '').trim()) {
        accepted = true;
        break;
      }
    }
  } catch (error) {
    lastStatus = error instanceof Error ? error.message.slice(0, 120) : String(error);
  }
  await new Promise((resolve) => setTimeout(resolve, 20_000));
}

if (!accepted) {
  throw new Error(`Elevate LLM did not pass inference acceptance: ${lastStatus}`);
}

fs.appendFileSync(
  githubEnv,
  `ELEVATE_LLM_URL=${url}\nELEVATE_LLM_SECRET=${secret}\n`,
  { encoding: 'utf8', mode: 0o600 },
);
console.log('Canonical Elevate LLM accepted for checkpointed course generation.');
