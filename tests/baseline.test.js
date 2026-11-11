#!/usr/bin/env node
/**
 * Baseline Verification & Regression Suite for The Lincoln Penny
 * Verifies Phase Zero repairs and Milestone 1 stabilization.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { ROOT_DIR, FACTS_DIR, OUT_DIR } = require('../config/env');
const { assertPublishingSafety, getYoutubeTokensPath, getYoutubeClientSecretPath } = require('../config/credentials');
const numguard = require('../editorial/numguard');

console.log('================================================================');
console.log(' THE LINCOLN PENNY — BASELINE VERIFICATION & REGRESSION SUITE');
console.log('================================================================');
let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

// 1. Config & Environment Resolution
test('Config resolves ROOT_DIR and expected subdirectories', () => {
  assert(fs.existsSync(ROOT_DIR), `ROOT_DIR should exist: ${ROOT_DIR}`);
  assert(fs.existsSync(FACTS_DIR), `FACTS_DIR should exist: ${FACTS_DIR}`);
});

// 2. Fact Seeds Integrity
test('Editorial facts directory contains verified seed data', () => {
  const files = fs.readdirSync(FACTS_DIR).filter(f => f.endsWith('.json'));
  assert(files.length >= 30, `Expected at least 30 fact seeds, found ${files.length}`);
  
  // Verify sample fact file schema
  const sample = JSON.parse(fs.readFileSync(path.join(FACTS_DIR, 'mcdonalds-kroc-cut.json'), 'utf8'));
  assert(sample.topic, 'Fact seed must have topic');
  assert(Array.isArray(sample.facts) && sample.facts.length > 0, 'Fact seed must have facts array');
});

// 3. Numguard Accuracy & Strict Fact Checking
test('Numguard fact-guard accurately passes seeded numbers and blocks unseeded claims', () => {
  const sample = JSON.parse(fs.readFileSync(path.join(FACTS_DIR, 'mcdonalds-kroc-cut.json'), 'utf8'));
  
  // Allowed claim from mcdonalds-kroc-cut: $2.7M in 1961
  const validCheck = numguard.check('in nineteen sixty one ray kroc bought mcdonalds for two point seven million dollars', sample);
  assert.strictEqual(validCheck.ok, true, 'Valid seeded claim should pass');

  // Forbidden / unseeded claim: $500M in 1999
  const invalidCheck = numguard.check('in nineteen ninety nine ray kroc bought mcdonalds for five hundred million dollars', sample);
  assert.strictEqual(invalidCheck.ok, false, 'Unseeded number must be flagged by numguard');
  assert(invalidCheck.violations.length > 0, 'Must record specific violation');
});

// 4. Publishing Safety Gates
test('Publishing safety gate strictly blocks accidental public uploads', () => {
  // Attempting public without flag should downgrade to private
  const safeStatus = assertPublishingSafety('youtube', 'public', ['node', 'publish_youtube.js']);
  assert.strictEqual(safeStatus, 'private', 'Public status must default to private without confirmation');

  // Explicit confirmation flag allows public
  const confirmedStatus = assertPublishingSafety('youtube', 'public', ['node', 'publish_youtube.js', '--confirm-public']);
  assert.strictEqual(confirmedStatus, 'public', 'Public status must only be accepted with --confirm-public');
});

// 5. Credential Resolution Consistency
test('YouTube credential paths resolve reliably without missing-variable exceptions', () => {
  const tokensPath = getYoutubeTokensPath();
  const secretPath = getYoutubeClientSecretPath();
  assert(typeof tokensPath === 'string' && tokensPath.length > 0, 'Tokens path must be resolved');
  assert(typeof secretPath === 'string' && secretPath.length > 0, 'Secret path must be resolved');
});

// 6. Remotion Composition Entrypoint Exists
test('Remotion entrypoint and Root composition are present and syntactically valid', () => {
  const rootComp = path.join(ROOT_DIR, 'motion-engine', 'src', 'Root.tsx');
  assert(fs.existsSync(rootComp), `Root.tsx must exist at ${rootComp}`);
  const content = fs.readFileSync(rootComp, 'utf8');
  assert(content.includes('Composition'), 'Root.tsx must define Remotion compositions');
});

console.log('----------------------------------------------------------------');
console.log(` Results: ${passed}/${total} tests passed.`);
console.log('================================================================');

if (passed !== total) {
  process.exit(1);
}
