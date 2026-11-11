// Blackspot visual-generation adapter (Node 18+; no external dependencies).
// KIE API contracts verified against docs.kie.ai. Do not copy README's obsolete Muapi contract.
// No remote request happens until a caller explicitly invokes executeJob().
export const KIE_BASE_URL = 'https://api.kie.ai';

const hasOwn = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const requiredString = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(name + ' is required');
  return value.trim();
};
const httpsUrl = (value, name) => {
  const raw = requiredString(value, name);
  const u = new URL(raw);
  if (u.protocol !== 'https:') throw new Error(name + ' must use HTTPS');
  if (u.username || u.password) throw new Error(name + ' must not contain credentials');
  return raw;
};
const noExtra = (job, allowed) => {
  for (const key of Object.keys(job)) {
    if (!allowed.includes(key)) throw new Error('Unknown job field: ' + key);
  }
};
const common = ['id', 'kind', 'characterId', 'sceneId', 'approved', 'prompt', 'seed', 'metadata'];
const checkCommon = (job) => {
  if (!job || typeof job !== 'object' || Array.isArray(job)) throw new Error('Job must be an object');
  requiredString(job.id, 'id');
  requiredString(job.sceneId, 'sceneId');
  requiredString(job.characterId, 'characterId');
  requiredString(job.prompt, 'prompt');
  if (job.approved !== true) throw new Error('Director approval required before generation');
  if (hasOwn(job, 'seed') && (!Number.isSafeInteger(job.seed) || job.seed < -1)) throw new Error('seed must be an integer >= -1');
};

export function compileKieRequest(job) {
  checkCommon(job);
  let model, input;
  if (job.kind === 'image-edit') {
    noExtra(job, [...common, 'referenceUrls', 'aspectRatio']);
    if (!Array.isArray(job.referenceUrls) || job.referenceUrls.length < 1 || job.referenceUrls.length > 10) {
      throw new Error('image-edit requires 1 to 10 approved referenceUrls');
    }
    const urls = job.referenceUrls.map((url,i) => httpsUrl(url, 'referenceUrls[' + i + ']'));
    model = 'google/nano-banana-edit';
    input = { prompt: job.prompt, image_urls: urls, output_format: 'png', aspect_ratio: job.aspectRatio || '16:9' };
    if (!['16:9', '9:16', '1:1', '4:3', '3:4'].includes(input.aspect_ratio)) throw new Error('Unsupported aspectRatio');
  } else if (job.kind === 'image-to-video') {
    noExtra(job, [...common, 'keyframeUrl', 'duration']);
    model = 'kling/v2-1-pro';
    if (![5, 10].includes(job.duration)) throw new Error('Kling duration must be 5 or 10 seconds');
    input = { prompt: job.prompt, image_url: httpsUrl(job.keyframeUrl, 'keyframeUrl'), duration: String(job.duration) };
  } else if (job.kind === 'lip-sync') {
    noExtra(job, [...common, 'portraitUrl', 'audioUrl', 'audioDurationSeconds', 'resolution']);
    model = 'omnihuman-1-5';
    if (!(typeof job.audioDurationSeconds === 'number' && job.audioDurationSeconds > 0 && job.audioDurationSeconds < 60)) {
      throw new Error('OmniHuman audioDurationSeconds must be > 0 and < 60');
    }
    input = {
      image_url: httpsUrl(job.portraitUrl, 'portraitUrl'),
      audio_url: httpsUrl(job.audioUrl, 'audioUrl'),
      prompt: job.prompt.slice(0, 300),
      output_resolution: job.resolution || '1080'
    };
    if (!['720', '1080'].includes(input.output_resolution)) throw new Error('resolution must be 720 or 1080');
    if (hasOwn(job, 'seed')) input.seed = job.seed;
  } else {
    throw new Error('Unsupported kind: ' + job.kind);
  }
  return { model, input };
}

export function extractResultUrls(data) {
  const urls = [];
  const add = x => { if (typeof x === 'string' && x.startsWith('https://')) urls.push(x); };
  if (Array.isArray(data?.resultUrls)) data.resultUrls.forEach(add);
  if (Array.isArray(data?.response?.resultUrls)) data.response.resultUrls.forEach(add);
  let json = data?.resultJson;
  if (typeof json === 'string') {
    try { json = JSON.parse(json); } catch { json = null; }
  }
  if (json && typeof json === 'object') {
    if (Array.isArray(json.resultUrls)) json.resultUrls.forEach(add);
    if (Array.isArray(json.result_urls)) json.result_urls.forEach(add);
    if (typeof json.url === 'string') add(json.url);
  }
  if (typeof data?.url === 'string') add(data.url);
  return [...new Set(urls)];
}

export class KieVisualProvider {
  constructor({ apiKey = process.env.KIE_API_KEY, fetchImpl = globalThis.fetch, baseUrl = KIE_BASE_URL } = {}) {
    this.apiKey = apiKey;
    this.fetchImpl = fetchImpl;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }
  async request(path, options = {}) {
    if (!this.apiKey) throw new Error('KIE_API_KEY is required for live generation');
    if (!this.fetchImpl) throw new Error('fetch implementation is required');
    const response = await this.fetchImpl(this.baseUrl + path, {
      ...options,
      headers: { Authorization: 'Bearer ' + this.apiKey, 'Content-Type': 'application/json', ...options.headers }
    });
    if (!response.ok) throw new Error('KIE HTTP ' + response.status);
    const json = await response.json();
    if (json.code !== undefined && json.code !== 200) throw new Error('KIE API code ' + json.code + ': ' + String(json.msg || 'request failed'));
    return json;
  }
  async submit(compiled) {
    const result = await this.request('/api/v1/jobs/createTask', { method: 'POST', body: JSON.stringify(compiled) });
    const taskId = result.data?.taskId;
    if (!taskId) throw new Error('KIE returned no taskId');
    return taskId;
  }
  async status(taskId) {
    requiredString(taskId, 'taskId');
    const json = await this.request('/api/v1/jobs/recordInfo?taskId=' + encodeURIComponent(taskId));
    const data = json.data || {};
    const state = String(data.state || '').toLowerCase();
    const urls = extractResultUrls(data);
    if (state === 'success') {
      if (!urls.length) throw new Error('KIE completed without a parseable result URL');
      return { state: 'completed', urls, rawState: state };
    }
    if (state === 'fail' || state === 'failed' || state === 'error') {
      return { state: 'failed', error: String(data.failMsg || data.errorMessage || 'KIE generation failed'), rawState: state };
    }
    return { state: 'pending', rawState: state };
  }
  async executeJob(job, { maxPolls = 90, pollIntervalMs = 4000, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), onTaskId } = {}) {
    const compiled = compileKieRequest(job);
    const taskId = await this.submit(compiled);
    if (onTaskId) await onTaskId(taskId);
    for (let attempt = 0; attempt < maxPolls; attempt++) {
      await sleep(pollIntervalMs);
      const result = await this.status(taskId);
      if (result.state === 'completed') return { jobId: job.id, taskId, provider: 'kie', model: compiled.model, urls: result.urls };
      if (result.state === 'failed') throw new Error('KIE task ' + taskId + ': ' + result.error);
    }
    throw new Error('KIE task ' + taskId + ' still pending after polling timeout; resume polling instead of resubmitting');
  }
}
