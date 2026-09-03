/**
 * k6 smoke/load script — main public and enrollment flows.
 *
 * Smoke (local):
 *   k6 run scripts/load/k6-mainflows.js
 *
 * Staged load:
 *   BASE_URL=https://staging.example.com k6 run --vus 50 --duration 2m scripts/load/k6-mainflows.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 25 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<3000'],
    errors: ['rate<0.05'],
  },
};

function get(path) {
  const res = http.get(`${BASE_URL}${path}`, { tags: { name: path } });
  const ok = check(res, {
    'status 2xx/3xx': (r) => r.status >= 200 && r.status < 400,
    'no PLATFORM_DEFAULTS template leak': (r) =>
      !r.body || !r.body.includes('${PLATFORM_DEFAULTS'),
  });
  errorRate.add(!ok);
  return res;
}

export default function () {
  get('/');
  get('/programs');
  get('/education');
  get('/career-training');
  get('/api/ready');
  get('/api/health');
  sleep(0.5);
}
