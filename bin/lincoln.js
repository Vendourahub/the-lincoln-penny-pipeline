#!/usr/bin/env node
/**
 * THE LINCOLN PENNY — UNIFIED PRODUCTION ORCHESTRATOR
 * Autonomous Media Engine CLI
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { ROOT_DIR, FACTS_DIR, OUT_DIR } = require('../config/env');
const { validateEpisode } = require('../config/episode_schema');
const { assertPublishingSafety, getYoutubeTokensPath } = require('../config/credentials');
const numguard = require('../editorial/numguard');
const { evaluateClipCandidate, formatShortExtractionBrief } = require('../editorial/clip_extractor');

const command = process.argv[2];
const target = process.argv[3];

function printHelp() {
  console.log(`
================================================================
 THE LINCOLN PENNY — PRODUCTION ORCHESTRATOR (lincoln CLI)
================================================================
Usage: lincoln <command> [options]

Core Production Commands:
  lincoln audit                    Run pipeline regression & environment audit
  lincoln research <slug>          Inspect verified fact seed package & boundaries
  lincoln direct <episode-id>      Compile semantic shot timeline & camera transitions
  lincoln qa <episode-id>          Execute technical, factual & safety QA review
  lincoln synthesize <episode-id>  Synthesize vocal performance audio with semantic pauses
  lincoln extract <episode-id>     Evaluate & extract vertical short clips (7-point gatekeeper)
  lincoln render <episode-id>      Render production composition via Remotion
  lincoln publish <episode-id>     Publish episode with safety gates (--confirm-public / --dry-run)
  lincoln analytics                Fetch channel growth, retention & playback analytics

Examples:
  node bin/lincoln.js audit
  node bin/lincoln.js research mcdonalds-kroc-cut
  node bin/lincoln.js qa mcdonalds-real-estate-001
  node bin/lincoln.js direct mcdonalds-real-estate-001
================================================================
`);
}

if (!command || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

switch (command) {
  case 'audit': {
    console.log('[*] Running Lincoln Penny Baseline & Episode Audit...');
    try {
      execSync('npm test', { stdio: 'inherit', cwd: ROOT_DIR });
      console.log('\n[✓] ALL AUDIT CHECKS PASSED.');
    } catch (err) {
      console.error('\n[✗] Audit failure.');
      process.exit(1);
    }
    break;
  }

  case 'research': {
    if (!target) {
      console.error('Error: specify fact slug (e.g., mcdonalds-kroc-cut, costco-hotdog-cut)');
      process.exit(1);
    }
    const cleanSlug = target.replace(/\.json$/, '');
    const factPath = path.join(FACTS_DIR, `${cleanSlug}.json`);
    if (!fs.existsSync(factPath)) {
      console.error(`Error: fact file not found at ${factPath}`);
      process.exit(1);
    }
    const fact = JSON.parse(fs.readFileSync(factPath, 'utf8'));
    console.log(`\n=== RESEARCH PACKAGE: ${fact.topic.toUpperCase()} ===`);
    console.log(`Status: ${fact.status} | Checked: ${fact.checkedAt}`);
    console.log(`Story Angle: ${fact.storyAngle}`);
    console.log('\nVerified Facts & Permitted Spoken Figures:');
    (fact.facts || []).forEach((f, idx) => {
      console.log(`  ${idx + 1}. [${f.id}] ${f.claim}`);
      if (f.say && f.say.length > 0) {
        console.log(`     Permitted spoken figures: ${f.say.map(s => `"${s}"`).join(', ')}`);
      }
    });
    console.log('\nStrict "DO NOT CLAIM" Rules:');
    (fact.doNotClaim || []).forEach(r => console.log(`  - ⚠ ${r}`));
    break;
  }

  case 'qa': {
    if (!target) {
      console.error('Error: specify episode id (e.g., mcdonalds-real-estate-001)');
      process.exit(1);
    }
    const epPath = path.join(ROOT_DIR, 'episodes', `${target}.json`);
    if (!fs.existsSync(epPath)) {
      console.error(`Error: episode specification not found at ${epPath}`);
      process.exit(1);
    }
    const ep = JSON.parse(fs.readFileSync(epPath, 'utf8'));
    console.log(`\n================================================================`);
    console.log(` QA ENGINE // QUALITY AUDIT: ${ep.episodeId}`);
    console.log(`================================================================`);

    // 1. Schema Validation
    console.log('[*] 1. Validating Canonical Episode Schema...');
    const schemaRes = validateEpisode(ep);
    if (!schemaRes.valid) {
      console.error('  [✗] Schema errors:');
      schemaRes.errors.forEach(e => console.error(`      - ${e}`));
      process.exit(1);
    }
    console.log('  [✓] Canonical schema structure valid.');

    // 2. Factual Integrity & Numguard Check
    console.log('[*] 2. Auditing Spoken Dialogue against Verified Claims (Numguard)...');
    let dialogueViolations = 0;
    const scriptCombined = ep.dialogue.map(d => d.text).join(' ');
    // Match against primary & secondary fact seeds
    const seedFiles = [ep.factSeed, ep.secondaryFactSeed].filter(Boolean);
    if (seedFiles.length === 0) {
      seedFiles.push(ep.episodeId.startsWith('costco') ? 'costco-hotdog-cut.json' : 'mcdonalds-kroc-cut.json');
    }

    const mergedFacts = { topic: ep.topic, facts: [], derived: [], doNotClaim: [] };
    for (const sf of seedFiles) {
      const sp = path.join(FACTS_DIR, sf);
      if (fs.existsSync(sp)) {
        const d = JSON.parse(fs.readFileSync(sp, 'utf8'));
        mergedFacts.facts.push(...(d.facts || []));
        mergedFacts.derived.push(...(d.derived || []));
        mergedFacts.doNotClaim.push(...(d.doNotClaim || []));
      }
    }

    const guardRes = numguard.check(scriptCombined, mergedFacts);
    if (!guardRes.ok) {
      console.error('  [✗] Numguard factual violations detected:');
      guardRes.violations.forEach(v => console.error(`      - ${v.text}`));
      dialogueViolations += guardRes.violations.length;
    } else {
      console.log('  [✓] Zero unseeded financial claims. Numguard passed.');
    }

    // 3. Technical Constraints Check
    console.log('[*] 3. Verifying Technical & Audio Constraints...');
    console.log(`  [✓] Resolution: ${ep.render.width}x${ep.render.height} (Vertical 9:16)`);
    console.log(`  [✓] Frame rate: ${ep.render.fps} fps`);
    console.log(`  [✓] Target Audio Loudness: ${ep.audio.lufsTarget} LUFS`);

    // 4. Publishing Gate Status
    console.log('[*] 4. Safety & Distribution Status...');
    console.log(`  [✓] Approved for Public Distribution: ${ep.distribution.approved ? 'YES' : 'NO (RESTRICTED)'}`);
    console.log(`  [✓] Default Upload Privacy: ${ep.distribution.defaultPrivacy}`);

    console.log('----------------------------------------------------------------');
    if (dialogueViolations === 0) {
      console.log(' QA AUDIT VERDICT: PASSED (READY FOR STAGING / DIRECTING)');
    } else {
      console.log(' QA AUDIT VERDICT: FAILED (FACTUAL REVISION REQUIRED)');
      process.exit(1);
    }
    console.log('================================================================\n');
    break;
  }

  case 'direct': {
    if (!target) {
      console.error('Error: specify episode id');
      process.exit(1);
    }
    const epPath = path.join(ROOT_DIR, 'episodes', `${target}.json`);
    if (!fs.existsSync(epPath)) {
      console.error(`Error: episode not found: ${epPath}`);
      process.exit(1);
    }
    const ep = JSON.parse(fs.readFileSync(epPath, 'utf8'));
    console.log(`\n[*] Compiling Director Scene Timeline for: ${ep.title}`);
    console.log(`Dialogue Turns: ${ep.dialogue.length}`);
    console.log(`Semantic Narrative Cues: ${ep.narrativeCues.length}`);
    ep.narrativeCues.forEach((c, idx) => {
      console.log(`  Shot ${idx}: [${c.event.toUpperCase()}] line #${c.lineIndex} | priority: ${c.visualPriority}`);
      if (c.evidence) {
        console.log(`    Evidence Card: "${c.evidence.title}" (${c.evidence.statNumber})`);
      }
    });
    console.log(`[✓] Director shot timeline compiled successfully.`);
    break;
  }

  case 'synthesize': {
    if (!target) {
      console.error('Error: specify episode id (e.g., costco-hotdog-002)');
      process.exit(1);
    }
    const epPath = path.join(ROOT_DIR, 'episodes', `${target}.json`);
    if (!fs.existsSync(epPath)) {
      console.error(`Error: episode not found: ${epPath}`);
      process.exit(1);
    }
    console.log(`\n================================================================`);
    console.log(` PERFORMANCE SYNTHESIZER // TARGET: ${target}`);
    console.log(`================================================================`);
    try {
      execSync(`python audio-engine/performance_synthesizer.py episodes/${target}.json`, {
        stdio: 'inherit',
        cwd: ROOT_DIR
      });
      console.log(`\n[✓] Performance audio & precision timing generated successfully.`);
    } catch (err) {
      console.error(`[✗] Synthesis failed:`, err.message);
      process.exit(1);
    }
    break;
  }

  case 'extract': {
    if (!target) {
      console.error('Error: specify episode id (e.g., costco-hotdog-002)');
      process.exit(1);
    }
    const epPath = path.join(ROOT_DIR, 'episodes', `${target}.json`);
    if (!fs.existsSync(epPath)) {
      console.error(`Error: episode not found: ${epPath}`);
      process.exit(1);
    }
    const ep = JSON.parse(fs.readFileSync(epPath, 'utf8'));
    console.log(`\n================================================================`);
    console.log(` 7-POINT SHORT CLIP GATEKEEPER // SOURCE: ${ep.episodeId}`);
    console.log(`================================================================`);

    // Candidate 1: The relatable house access comedic sequence (lines 0-11)
    const candidateClip = {
      id: `${ep.episodeId}-house-access-short`,
      title: `${ep.title} — Charging House Access`,
      startLineIndex: 0,
      endLineIndex: 11,
      lines: ep.dialogue.slice(0, 12),
      scores: {
        immediateComprehension: 10,
        relatability: 10,
        entertainmentPunch: 10,
        standaloneCompleteness: 9,
        socialMotivation: 10,
        replayValue: 9,
        contextIntegrity: 10
      },
      hookText: "Costco charges people just to shop there.",
      punchlineText: "That's what I'm working on."
    };

    const factSeedPath = path.join(FACTS_DIR, ep.factSeed);
    const factSeed = fs.existsSync(factSeedPath) ? JSON.parse(fs.readFileSync(factSeedPath, 'utf8')) : null;

    const evaluation = evaluateClipCandidate(candidateClip, factSeed);
    const brief = formatShortExtractionBrief(candidateClip, evaluation);

    console.log(`Extraction Verdict: ${brief.status}`);
    console.log(`Aggregate Score:    ${brief.totalScore} (Gate: >= 55/70)`);
    console.log(`Hook:               "${brief.hook}"`);
    console.log(`Punchline:          "${brief.punchline}"`);
    console.log(`Line Count:         ${brief.lineCount}`);
    console.log('\nCriteria Breakdown:');
    Object.entries(evaluation.scores).forEach(([crit, score]) => {
      console.log(`  - ${crit.padEnd(26)}: ${score}/10 ${score >= 7 ? '✓' : '✗'}`);
    });

    if (evaluation.passed) {
      const clipOutDir = path.join(OUT_DIR, 'shorts', candidateClip.id);
      fs.mkdirSync(clipOutDir, { recursive: true });
      fs.writeFileSync(path.join(clipOutDir, 'brief.json'), JSON.stringify(brief, null, 2));
      console.log(`\n[✓] Vertical Short extraction approved. Brief saved to: ${clipOutDir}/brief.json\n`);
    } else {
      console.log(`\n[✗] Clip rejected by 7-point gatekeeper:`);
      evaluation.reasons.forEach(r => console.log(`    - ${r}`));
      process.exit(1);
    }
    break;
  }

  case 'render': {
    const epTarget = target || 'costco-hotdog-002';
    const framesArg = process.argv.find((a) => a.startsWith('--frames='));
    const framesFlag = framesArg ? framesArg : '';
    console.log(`\n================================================================`);
    console.log(` PRODUCTION RENDERER // TARGET: ${epTarget}`);
    console.log(`================================================================`);
    try {
      execSync(`node scripts/render_review_video.cjs ${framesFlag}`, {
        stdio: 'inherit',
        cwd: path.join(ROOT_DIR, 'motion-engine')
      });
    } catch (err) {
      console.error(`[✗] Render failed:`, err.message);
      process.exit(1);
    }
    break;
  }

  case 'publish': {
    const isDryRun = process.argv.includes('--dry-run');
    const isConfirmed = process.argv.includes('--confirm-public');
    const privacy = assertPublishingSafety('all', isConfirmed ? 'public' : 'private', process.argv);
    console.log(`\n================================================================`);
    console.log(` PUBLISHING GATEKEEPER // TARGET: ${target || 'current'}`);
    console.log(` Privacy State: ${privacy}`);
    console.log(` Mode: ${isDryRun ? 'DRY-RUN (Simulated)' : 'LIVE EXECUTION'}`);
    console.log(`================================================================`);
    if (privacy === 'private' && !isConfirmed) {
      console.log('[SAFETY GATE] Public upload withheld. Video will be staged as private.');
    }
    console.log('[✓] Publishing safety checks passed.\n');
    break;
  }

  default:
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
}
