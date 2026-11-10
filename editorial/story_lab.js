#!/usr/bin/env node
/*
 * story_lab.js — LAB ONLY. Story-first writer for the money Shorts. Writes to out/story_lab/, never to models/ or the queue.
 *   node story_lab.js <fact-slug> [--old]      (--old also prints the legacy v3 script for the same topic if one exists)
 * Pipeline: (1) STORY PLAN: protagonist, want, obstacle, reversal, running gag, joke bank  (2) DRAFT from the plan
 *           (3) PUNCH-UP: a second editor pass that cuts every sentence that is only information and sharpens jokes
 *           (4) numguard + claims-checker, same as production.
 */
const fs = require('fs'), path = require('path'), https = require('https');
const ROOT = __dirname;
for (const l of (fs.existsSync(path.join(ROOT, '.env')) ? fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n') : [])) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const KEY = process.env.GROQ_API_KEY, guard = require('./numguard');
const slug = process.argv[2]; const FACTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'facts', slug + '.json'), 'utf8'));

function factsBlock() {
  const lines = FACTS.facts.map(f => '- ' + f.claim + (f.say && f.say.length ? '  [say it as: ' + f.say.map(s => '"' + s + '"').join(' / ') + ']' : '  [no figure; story color only]') + (f.note ? ' (' + f.note + ')' : ''));
  const der = (FACTS.derived || []).map(d => '- ' + d.claim + (d.say ? '  [say it as: ' + d.say.map(s => '"' + s + '"').join(' / ') + ']' : ''));
  return `VERIFIED FACTS (the ONLY facts and ONLY figures you may use):\n${lines.join('\n')}${der.length ? '\nDerived:\n' + der.join('\n') : ''}\nSTORY ANGLE: ${FACTS.storyAngle}\nDO NOT CLAIM: ${(FACTS.doNotClaim || []).join(' | ')}\nFIGURE RULES: every dollar amount, percentage, count, multiple and year must be one of the 'say it as' figures. In the script write every number out in words. Use the real period ("in twenty twenty four"), never "last year/recently". Never compare two different measures as if alike. Name only companies/people that appear in the facts. NEVER invent a statistic, quote, scene detail presented as fact, or event: jokes and imagery may exaggerate the SITUATION plainly (a cartoon), but must not assert a new real-world fact.`;
}
function extractJson(s) { const i = s.indexOf('{'); let d = 0; for (let j = i; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}') { d--; if (d === 0) return s.slice(i, j + 1); } } return null; }
function groq(messages, model = 'openai/gpt-oss-120b', temperature = 0.8) {
  const body = JSON.stringify({ model, messages, reasoning_effort: 'medium', temperature, max_tokens: 6000 });
  return new Promise((resolve, reject) => { const req = https.request('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY } }, res => { let d = ''; res.on('data', c => d += c); res.on('end', async () => { try { resolve(JSON.parse(d).choices[0].message.content); } catch (e) { const m = /try again in ([0-9.]+)s/i.exec(d); if (m) { await new Promise(r => setTimeout(r, (parseFloat(m[1]) + 2) * 1000)); return resolve(groq(messages, model, temperature)); } reject(new Error(d.slice(0, 300))); } }); }); req.on('error', reject); req.write(body); req.end(); });
}

const CRAFT = `You are a comedy-minded storyteller who makes dry business facts feel like a gripping little story. Your model is the best explainer creators: a video about how an egg is fertilised can hold millions of people because it is never a list of facts. It is a JOURNEY with a protagonist, a goal, a clock, obstacles, reveals, and a new question every few seconds. You do the same with money.

CRAFT RULES
1. A STORY, NOT A BRIEFING. There is a PROTAGONIST (the customer, the hot dog, the dollar bill, the founder, the CEO; a character with a face) who WANTS something and runs into an OBSTACLE, then a REVERSAL the viewer did not see coming. Facts are the plot points, never the point.
2. START IN THE MIDDLE OF SOMETHING. First sentence = a tiny scene or an absurd contradiction (7 to 14 words). Never state the thesis. Never 'Did you know', 'Here's the thing', 'Let's talk about', 'Imagine', 'Picture this', 'Most people think'.
3. CURIOSITY CHAIN. Every one or two sentences must answer one question AND open the next. The viewer should never feel the answer is finished until the last line.
4. A JOKE EVERY EIGHT SECONDS OR SO, and the first one inside the first five seconds. Jokes come from the facts' own contradiction: deadpan understatement, comic literalism, escalation, a specific silly detail, an anticlimax. No puns, no 'this is fine' meme talk, no 'plot twist', no 'spoiler alert', no emoji language.
5. SPECIFIC BEATS GENERIC. 'The paper towels' beats 'other items'. Pick ONE concrete object and let it carry the story.
6. MAKE THE VIEWER GUILTY OR SMUG. They should feel 'that is me' or 'I knew it'. Second person, present tense, spoken like a friend, contractions, short sentences, one sentence that is allowed to be very short ('Nope.').
7. NUMBERS ARE PUNCHLINES, not data. At most THREE figures, each one placed where it lands as a reveal, with a beat of setup before it.
8. END WITH A CALLBACK that re-reads the opening image with new meaning, so the first line is funnier on the second watch. No call to action, no 'follow for more', no question to the audience, no moral.
9. NO JARGON. No 'unit economics', 'margin' lectures, 'monetize', 'loss leader' unless the joke is about the term itself.

LENGTH: 80 to 100 spoken words (about 30 to 38 seconds at a brisk read). Plain spoken English, numbers spelled out as words.`;

(async () => {
  const facts = factsBlock();
  // 1) plan
  const plan = JSON.parse(extractJson(await groq([{ role: 'system', content: CRAFT }, { role: 'user', content: `${facts}\n\nTOPIC: ${FACTS.topic}\n\nPLAN the story. Return ONLY JSON:\n{"protagonist":"who/what the viewer follows, with one visual trait","want":"what they are trying to do in plain terms","obstacle":"what gets in the way","reversal":"the moment the viewer's assumption flips, built from the facts","openingImage":"the first-line scene or contradiction","jokeBank":["FIVE possible jokes or comic details, each built only on the facts or on the plain situation"],"runningGag":"one small thing that returns at the end with a new meaning","figures":["the (max three) figures you will use, each exactly as a 'say it as' form"]}` }])));
  // 2) draft
  const draft = JSON.parse(extractJson(await groq([{ role: 'system', content: CRAFT }, { role: 'user', content: `${facts}\n\nSTORY PLAN:\n${JSON.stringify(plan, null, 1)}\n\nWrite the script from this plan. Return ONLY JSON:\n{"hook":"the on-screen opening line, ALL CAPS, 5 to 10 words, the strongest open loop in the story","script":"80 to 100 words of spoken narration, one paragraph, no labels","scenes":["four short concrete visual descriptions, one per quarter of the video, each a physical gag or character moment with a clear emotion"]}` }])));
  // 3) punch-up
  const pun = JSON.parse(extractJson(await groq([{ role: 'system', content: CRAFT }, { role: 'user', content: `${facts}\n\nDRAFT SCRIPT:\n${draft.script}\n\nYou are the punch-up editor. Read it as a bored stranger scrolling past. 1) Mark every sentence that is only information with no tension, joke, image or new question, and CUT or rewrite it. 2) Make sure a joke lands inside the first five seconds. 3) Replace any generic noun with a specific one from the facts. 4) Check the last line calls back to the first image. 5) Keep 80 to 100 words and every figure exactly as allowed. Return ONLY JSON: {"verdict":"one line: what was weak","script":"the improved script","hook":"${draft.hook}"}` }], 'openai/gpt-oss-120b', 0.6)));
  const out = { slug, topic: FACTS.topic, plan, draftScript: draft.script, hook: pun.hook || draft.hook, finalScript: pun.script, editorNote: pun.verdict, scenes: draft.scenes };
  // 4) guards
  const g = guard.check(out.finalScript, FACTS); out.numguard = g.ok ? 'PASS' : g.violations.map(v => v.text);
  const gh = guard.check(out.hook, FACTS); out.hookGuard = gh.ok ? 'PASS' : gh.violations.map(v => v.text);
  const facts2 = FACTS.facts.map(f => '- ' + f.claim).concat((FACTS.derived || []).map(d => '- ' + d.claim)).join('\n');
  try {
    const v = JSON.parse(extractJson(await groq([{ role: 'system', content: 'You are a strict fact-checker. You only trust the FACTS given.' }, { role: 'user', content: `FACTS:\n${facts2}\nDO NOT CLAIM: ${(FACTS.doNotClaim || []).join(' | ')}\n\nSCRIPT:\n${out.hook}\n${out.finalScript}\n\nFlag every sentence that asserts something about the real world that the FACTS do not directly support (a named company/person not in the facts, an invented event, quote, count, or date; an overstated claim). Jokes that plainly exaggerate a cartoon situation without asserting a real-world fact are fine. Return ONLY JSON: {"unsupported":[{"sentence":"...","why":"..."}]}` }], 'openai/gpt-oss-20b', 0.1)));
    out.claimsCheck = v.unsupported && v.unsupported.length ? v.unsupported : 'PASS';
  } catch (e) { out.claimsCheck = 'checker unavailable: ' + e.message.slice(0, 80); }
  out.words = out.finalScript.split(/\s+/).length;
  fs.mkdirSync(path.join(ROOT, 'out', 'story_lab'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'out', 'story_lab', slug + '.json'), JSON.stringify(out, null, 2));
  let old = ''; try { old = JSON.parse(fs.readFileSync(path.join(ROOT, 'models', slug + '-short.brief.json'))).script; } catch (e) {}
  console.log('=== ' + slug + '\nHOOK: ' + out.hook + '\n\nPLAN: ' + plan.protagonist + ' | wants: ' + plan.want + ' | blocked by: ' + plan.obstacle + ' | flip: ' + plan.reversal + '\n\nFINAL (' + out.words + ' words):\n' + out.finalScript + '\n\nEDITOR: ' + out.editorNote + '\nnumguard: ' + JSON.stringify(out.numguard) + ' | hook: ' + JSON.stringify(out.hookGuard) + '\nclaims: ' + JSON.stringify(out.claimsCheck) + (process.argv[3] === '--old' && old ? '\n\nLEGACY SCRIPT FOR COMPARISON:\n' + old : ''));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
