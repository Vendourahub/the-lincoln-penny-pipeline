#!/usr/bin/env node
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { evaluateClipCandidate, formatShortExtractionBrief } = require('../editorial/clip_extractor');

console.log('================================================================');
console.log(' THE LINCOLN PENNY — SHORT CLIP EXTRACTION GATEKEEPER TESTS');
console.log('================================================================');

// 1. Qualifying candidate: Costco House Membership joke
const validClip = {
  id: 'costco-house-access-clip',
  title: 'Costco House Access',
  startLineIndex: 0,
  endLineIndex: 12,
  lines: [
    { speaker: 'insider', text: 'Costco charges people just to shop there.' },
    { speaker: 'host', text: 'Charges them how?' },
    { speaker: 'insider', text: 'Membership. You pay annually.' },
    { speaker: 'host', text: 'To buy groceries?' },
    { speaker: 'insider', text: 'Yeah.' },
    { speaker: 'host', text: '...And people agreed?' },
    { speaker: 'insider', text: 'Millions of them.' },
    { speaker: 'host', text: 'I need to start charging people to visit my house.' },
    { speaker: 'insider', text: 'For what?' },
    { speaker: 'host', text: 'Access.' },
    { speaker: 'insider', text: 'To what?' },
    { speaker: 'host', text: 'That\'s what I\'m working on.' }
  ],
  scores: {
    immediateComprehension: 10,
    relatability: 10,
    entertainmentPunch: 9,
    standaloneCompleteness: 9,
    socialMotivation: 9,
    replayValue: 8,
    contextIntegrity: 10
  },
  hookText: "Costco charges people just to shop there.",
  punchlineText: "That's what I'm working on."
};

const evalValid = evaluateClipCandidate(validClip);
assert.strictEqual(evalValid.passed, true, 'Valid clip should pass gatekeeper');
assert.strictEqual(evalValid.totalScore, 65, 'Total score should be 65');
const brief = formatShortExtractionBrief(validClip, evalValid);
assert.strictEqual(brief.status, 'APPROVED_FOR_SHORT');
console.log('  ✓ PASS: Qualifying relatable comedic clip passed 7-point gatekeeper (65/70)');

// 2. Rejecting candidate: Boring generic clip scoring below threshold
const boringClip = {
  id: 'dry-accounting-clip',
  title: 'Depreciation of Forklifts',
  startLineIndex: 0,
  endLineIndex: 2,
  lines: [
    { speaker: 'insider', text: 'The forklifts depreciate over seven years.' },
    { speaker: 'host', text: 'Okay.' }
  ],
  scores: {
    immediateComprehension: 7,
    relatability: 3, // Below min 7
    entertainmentPunch: 2, // Below min 7
    standaloneCompleteness: 4,
    socialMotivation: 2,
    replayValue: 3,
    contextIntegrity: 9
  }
};

const evalBoring = evaluateClipCandidate(boringClip);
assert.strictEqual(evalBoring.passed, false, 'Boring clip must be rejected');
console.log('  ✓ PASS: Low-relatability / low-entertainment clip rejected by gatekeeper');

// 3. Rejecting candidate: Numguard violation
const factsSeed = {
  facts: [{ id: "f1", claim: "Membership fee revenue was $4.8 billion", say: ["$4.8 billion", "four point eight billion dollars"] }],
  derived: [],
  doNotClaim: []
};
const violationClip = {
  id: 'fake-num-clip',
  title: 'Invented Numbers',
  startLineIndex: 0,
  endLineIndex: 1,
  lines: [
    { speaker: 'insider', text: 'Costco made seventy-five billion dollars on hot dogs alone.' }
  ],
  scores: {
    immediateComprehension: 9,
    relatability: 9,
    entertainmentPunch: 9,
    standaloneCompleteness: 9,
    socialMotivation: 9,
    replayValue: 9,
    contextIntegrity: 10
  }
};

const evalViolation = evaluateClipCandidate(violationClip, factsSeed);
assert.strictEqual(evalViolation.passed, false, 'Numguard violation must fail clip');
console.log('  ✓ PASS: Unseeded financial claim failed gatekeeper via Numguard');

console.log('----------------------------------------------------------------');
console.log(' Results: 3/3 Clip Extractor tests passed.');
console.log('================================================================');
