// Opt-in REAL image-analysis smoke test. This never mocks provider responses.
// Run only against your own configured Furney development server on loopback.
import { readFile } from 'node:fs/promises';

if(process.env.CONFIRM_BILLABLE_AI_TEST!=='yes'){
  console.error('Not run: this opt-in test can incur OpenAI charges. Set CONFIRM_BILLABLE_AI_TEST=yes only for your own explicitly enabled local server.');
  process.exit(1);
}

const baseUrl = process.env.PHOTO_SEARCH_BASE_URL || 'http://127.0.0.1:5173';
let endpoint;
try {
  const base = new URL(baseUrl);
  if (base.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(base.hostname) || base.username || base.password) {
    throw new Error('Expected an HTTP loopback address');
  }
  endpoint = new URL('/api/photo-search', base);
} catch {
  console.error('Not run: use an HTTP loopback address such as http://127.0.0.1:5173.');
  process.exit(1);
}
let failures = 0;
for (const [file, expected] of [['00457235.jpg', 'Chairs'], ['80519531.jpg', 'Sofas']]) {
  try {
    const image = await readFile(new URL(`../src/assets/ikea/${file}`, import.meta.url));
    const response = await fetch(endpoint, {
      method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl: `data:image/jpeg;base64,${image.toString('base64')}` }),
      signal: AbortSignal.timeout(30_000),
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) {
      failures++;
      console.error(`${file}: BLOCKED/FAILED (${response.status}, ${result.code || 'unknown'}). ${result.message || 'No successful analysis returned.'}`);
    } else if (result.analysis?.category !== expected) {
      failures++;
      console.error(`${file}: expected ${expected}, received ${String(result.analysis?.category)}.`);
    } else {
      console.log(`${file}: real endpoint returned ${expected}.`);
    }
  } catch {
    failures++;
    console.error(`${file}: could not complete the real image-analysis request. Check the server URL and configuration.`);
  }
}
if (failures) {
  console.error('Real chair/sofa classification is NOT verified. Resolve the errors above (server-side OPENAI_API_KEY and/or deployment access), then rerun this check.');
  process.exitCode = 1;
} else console.log('Verified distinct chair and sofa classifications through real image-analysis requests.');
