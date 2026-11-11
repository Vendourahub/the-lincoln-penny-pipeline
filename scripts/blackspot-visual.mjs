#!/usr/bin/env node
// Dry-run default. --execute performs paid remote generation ONLY with explicit confirmation.
// Node 18+; no third-party package required.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { compileKieRequest, KieVisualProvider } from '../packages/visual-generation/kie-adapter.mjs';

const usage = 'Usage: node scripts/blackspot-visual.mjs path/to/shot.json [--execute --approve-spend] [--output path/to/manifest.json]';
const args = process.argv.slice(2);
const configPath = args.find(x => !x.startsWith('--') && x !== args[args.indexOf('--output') + 1]);
if (!configPath || args.includes('--help')) { console.log(usage); process.exit(configPath ? 0 : 2); }
const execute = args.includes('--execute');
const approveSpend = args.includes('--approve-spend');
if (execute && !approveSpend) { console.error('--execute requires --approve-spend'); process.exit(2); }
const outFlag = args.indexOf('--output');
const outputPath = outFlag >= 0 ? args[outFlag + 1] : null;
if (outFlag >= 0 && (!outputPath || outputPath.startsWith('--'))) { console.error('Missing --output path'); process.exit(2); }

function validateCharacter(job, registry) {
  const character = registry?.[job.characterId];
  if (!character || character.locked !== true || !Array.isArray(character.approvedAssetUrls)) {
    throw new Error('Character ' + job.characterId + ' requires a locked sheet and approvedAssetUrls');
  }
  const approved = character.approvedAssetUrls;
  if (!approved.length) throw new Error('Character has no approved reference assets');
  if (job.kind === 'image-edit' && !job.referenceUrls.some(url => approved.includes(url))) {
    throw new Error('image-edit must include at least one canonical approved character reference');
  }
  if (job.kind === 'image-to-video' && !approved.includes(job.keyframeUrl)) {
    throw new Error('image-to-video keyframe must be explicitly approved for the character');
  }
  if (job.kind === 'lip-sync' && !approved.includes(job.portraitUrl)) {
    throw new Error('lip-sync portrait must be explicitly approved for the character');
  }
}

try {
  const spec = JSON.parse(await readFile(resolve(configPath), 'utf8'));
  const job = spec.job;
  const compiled = compileKieRequest(job);
  validateCharacter(job, spec.characters);
  const manifest = {
    schemaVersion: 1, provider: 'kie', approvedCharacter: job.characterId, sceneId: job.sceneId,
    jobId: job.id, kind: job.kind, model: compiled.model, input: compiled.input, timestamp: new Date().toISOString(),
    status: execute ? 'submitted' : 'dry-run', outputUrls: [], archived: false
  };
  if (execute) {
    const provider = new KieVisualProvider();
    const onTaskId = async taskId => {
      manifest.taskId = taskId;
      if (outputPath) {
        await mkdir(dirname(resolve(outputPath)), { recursive: true });
        await writeFile(resolve(outputPath), JSON.stringify(manifest, null, 2) + '\n');
      }
    };
    const result = await provider.executeJob(job, { onTaskId });
    manifest.status = 'generated-unreviewed';
    manifest.taskId = result.taskId;
    manifest.outputUrls = result.urls;
    manifest.nextAction = 'Archive asset to owned storage, inspect visual continuity, then approve it for editing. Not automatically approved.';
  } else {
    manifest.nextAction = 'Dry-run only. No API calls, credits, or model inference.';
  }
  if (outputPath) {
    await mkdir(dirname(resolve(outputPath)), { recursive: true });
    await writeFile(resolve(outputPath), JSON.stringify(manifest, null, 2) + '\n');
  }
  console.log(JSON.stringify(manifest, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
