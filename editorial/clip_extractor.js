/**
 * THE LINCOLN PENNY — LONG-FORM TO SHORT EXTRACTION ENGINE
 * Evaluates candidate conversational dialogue slices against the 7-Point Gatekeeper Standard.
 * 
 * Criteria (0-10 each, min 7/10 required on each, aggregate threshold >= 55/70):
 * 1. Immediate Comprehension
 * 2. Relatability
 * 3. Comedic / Revelation Punch
 * 4. Standalone Completeness
 * 5. Social Motivation (Shareability)
 * 6. Replay Value
 * 7. Context & Factual Integrity (Numguard compliant)
 */

const numguard = require('./numguard');

const CRITERIA_WEIGHTS = {
  immediateComprehension: { weight: 1.0, min: 7, label: "Immediate Comprehension" },
  relatability: { weight: 1.0, min: 7, label: "Relatability" },
  entertainmentPunch: { weight: 1.0, min: 7, label: "Comedic / Revelation Punch" },
  standaloneCompleteness: { weight: 1.0, min: 7, label: "Standalone Completeness" },
  socialMotivation: { weight: 1.0, min: 7, label: "Social Motivation / Shareability" },
  replayValue: { weight: 1.0, min: 7, label: "Replay Value" },
  contextIntegrity: { weight: 1.0, min: 7, label: "Context & Factual Integrity" }
};

const QUALIFYING_SCORE_THRESHOLD = 55;

/**
 * Evaluates a candidate clip from an episode
 */
function evaluateClipCandidate(candidate, factSeed = null) {
  const { id, title, startLineIndex, endLineIndex, lines, scores = {}, hookText, punchlineText } = candidate;

  const result = {
    clipId: id,
    title,
    range: [startLineIndex, endLineIndex],
    scores: {},
    totalScore: 0,
    passed: true,
    reasons: []
  };

  let total = 0;
  for (const [key, meta] of Object.entries(CRITERIA_WEIGHTS)) {
    const score = Number(scores[key] ?? 0);
    result.scores[key] = score;
    total += score;

    if (score < meta.min) {
      result.passed = false;
      result.reasons.push(`Criterion '${meta.label}' scored ${score} (below required minimum ${meta.min})`);
    }
  }

  result.totalScore = total;
  if (total < QUALIFYING_SCORE_THRESHOLD) {
    result.passed = false;
    result.reasons.push(`Total score ${total}/70 is below qualifying gate threshold (${QUALIFYING_SCORE_THRESHOLD})`);
  }

  // Check Numguard if facts provided
  if (factSeed && lines) {
    const scriptCombined = lines.map(l => l.text).join(' ');
    const guard = numguard.check(scriptCombined, factSeed);
    if (!guard.ok) {
      result.passed = false;
      result.scores.contextIntegrity = 0;
      result.reasons.push(`Numguard violation in clip: ${guard.violations.map(v => v.text).join(', ')}`);
    }
  }

  return result;
}

/**
 * Formats an extraction brief for vertical publishing
 */
function formatShortExtractionBrief(candidate, evaluation) {
  return {
    clipId: candidate.id,
    title: candidate.title,
    status: evaluation.passed ? "APPROVED_FOR_SHORT" : "REJECTED",
    totalScore: `${evaluation.totalScore}/70`,
    hook: candidate.hookText || candidate.lines[0]?.text,
    punchline: candidate.punchlineText || candidate.lines[candidate.lines.length - 1]?.text,
    lineCount: candidate.lines.length,
    estimatedDurationSeconds: candidate.lines.reduce((acc, l) => acc + (l.durationSeconds || 3.0), 0),
    scores: evaluation.scores,
    reasons: evaluation.reasons
  };
}

module.exports = {
  evaluateClipCandidate,
  formatShortExtractionBrief,
  CRITERIA_WEIGHTS,
  QUALIFYING_SCORE_THRESHOLD
};
