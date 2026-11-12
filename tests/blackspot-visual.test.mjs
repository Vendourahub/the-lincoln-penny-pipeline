import test from 'node:test';
import assert from 'node:assert/strict';
import { compileKieRequest, extractResultUrls, KieVisualProvider } from '../packages/visual-generation/kie-adapter.mjs';

const base = { id: 'ep01-shot01', sceneId: 'ep01-door', characterId: 'james', approved: true, prompt: 'He opens the door and freezes.' };
const img = { ...base, kind: 'image-edit', referenceUrls: ['https://assets.example.com/james.png'], aspectRatio: '16:9' };

test('image edit retains canonical reference and uses documented KIE payload', () => {
  const r = compileKieRequest(img);
  assert.equal(r.model, 'google/nano-banana-edit');
  assert.deepEqual(r.input.image_urls, ['https://assets.example.com/james.png']);
});
test('image-to-video uses image_url, NOT image_urls, for Kling v2.1 Pro', () => {
  const r = compileKieRequest({ ...base, kind: 'image-to-video', keyframeUrl: 'https://assets.example.com/keyframe.png', duration: 5 });
  assert.equal(r.model, 'kling/v2-1-pro');
  assert.equal(r.input.image_url, 'https://assets.example.com/keyframe.png');
  assert.equal(r.input.duration, '5');
  assert.equal(r.input.image_urls, undefined);
});
test('audio-driven portrait requires short audio duration', () => {
  const job = { ...base, kind: 'lip-sync', portraitUrl: 'https://assets.example.com/james.png', audioUrl: 'https://assets.example.com/dialogue.mp3', audioDurationSeconds: 12 };
  assert.equal(compileKieRequest(job).model, 'omnihuman-1-5');
  assert.throws(() => compileKieRequest({ ...job, audioDurationSeconds: 65 }), /< 60/);
});
test('rejects jobs without approval or approved references', () => {
  assert.throws(() => compileKieRequest({ ...img, approved: false }), /approval/i);
  assert.throws(() => compileKieRequest({ ...img, referenceUrls: [] }), /referenceUrls/);
  assert.throws(() => compileKieRequest({ ...img, referenceUrls: ['http:\/\/example.com/a.png'] }), /HTTPS/);
  assert.throws(() => compileKieRequest({ ...img, unsupportedOption: true }), /Unknown/);
});
test('KIE parses JSON resultJson payloads', () => {
  assert.deepEqual(extractResultUrls({ resultJson: JSON.stringify({ resultUrls: ['https://media.example.com/video.mp4'] }) }), ['https://media.example.com/video.mp4']);
});
test('KIE submit/poll request succeeds using injected mock; never hits network', async () => {
  const urls = [];
  const mockFetch = async (url, init) => {
    urls.push([url, init]);
    if (url.endsWith('/createTask')) return { ok: true, json: async () => ({ code: 200, data: { taskId: 'task-1' } }) };
    return { ok: true, json: async () => ({ code: 200, data: { state: 'success', resultJson: '{"resultUrls":["https://media.example.com/out.png"]}' } }) };
  };
  const provider = new KieVisualProvider({ apiKey: 'TEST_KEY', fetchImpl: mockFetch });
  const r = await provider.executeJob(img, { sleep: async () => {}, maxPolls: 1 });
  assert.equal(r.taskId, 'task-1');
  assert.deepEqual(r.urls, ['https://media.example.com/out.png']);
  assert.equal(urls.length, 2);
  assert.equal(JSON.parse(urls[0][1].body).input.image_urls.length, 1);
});
test('rejects failed KIE response instead of treating HTTP 200 as generation success', async () => {
  const provider = new KieVisualProvider({ apiKey: 'TEST_KEY', fetchImpl: async () => ({ ok: true, json: async () => ({ code: 402, msg: 'Insufficient credits' }) }) });
  await assert.rejects(() => provider.executeJob(img), /402/);
});
