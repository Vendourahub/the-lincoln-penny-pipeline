#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { validateEpisode } = require('../config/episode_schema');

console.log('================================================================');
console.log(' THE LINCOLN PENNY — CANONICAL EPISODE CONTRACT VERIFICATION');
console.log('================================================================');

const episodesDir = path.resolve(__dirname, '../episodes');
const files = fs.readdirSync(episodesDir).filter(f => f.endsWith('.json'));

let passed = 0;

for (const file of files) {
  const filePath = path.join(episodesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const res = validateEpisode(data);

  if (res.valid) {
    console.log(`  ✓ VALID EPISODE: ${data.episodeId} ("${data.title}")`);
    passed++;
  } else {
    console.error(`  ✗ INVALID EPISODE: ${file}`);
    res.errors.forEach(e => console.error(`    - ${e}`));
    process.exit(1);
  }
}

console.log('----------------------------------------------------------------');
console.log(` Result: ${passed}/${files.length} canonical episodes verified.`);
console.log('================================================================');
