#!/usr/bin/env node
/*
 * short_brief.js — generate viral stickman-Short briefs (hook + punchy script + scenes + visual cues)
 * via Groq, incorporating the 4th-Grade Playground Translation Rule and the Gamified Level Progression Framework.
 *
 *   node short_brief.js <base-slug> "<topic/subject sentence>" [--format levels|contrast]
 *   -> models/<base-slug>-short.brief.json
 *   -> models/<base-slug>-short.script.json
 */
const fs=require('fs'), path=require('path'), https=require('https');
const ROOT=__dirname;
for(const l of (fs.existsSync(path.join(ROOT,'.env'))?fs.readFileSync(path.join(ROOT,'.env'),'utf8').split('\n'):[])){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const KEY=process.env.GROQ_API_KEY;
const slug=(process.argv[2]||'').replace(/[^a-z0-9_-]/gi,'');
const topic=process.argv[3]||'';
if(!slug||!topic||!KEY){console.error('usage: node short_brief.js <slug> "<topic>"  (needs GROQ_API_KEY)');process.exit(1);}

// fact-seeded mode: facts/<slug>.json holds the ONLY figures the copy may use; numguard rejects anything else
const guard=require('./numguard');
const FACTS_FILE=path.join(ROOT,'facts',slug+'.json');
const FACTS=fs.existsSync(FACTS_FILE)?JSON.parse(fs.readFileSync(FACTS_FILE,'utf8')):null;
if(!FACTS && process.env.FACTS_REQUIRED==='1'){console.error('FACTS_REQUIRED: no facts/'+slug+'.json — topic needs seeding');process.exit(4);}
function factsBlock(){
  if(!FACTS) return '';
  const lines=FACTS.facts.map(f=>'- '+f.claim+(f.say&&f.say.length?'  [say it as: '+f.say.map(s=>'"'+s+'"').join(' / ')+']':'  [no figure; story color only]')+(f.note?' ('+f.note+')':''));
  const der=(FACTS.derived||[]).map(d=>'- '+d.claim+'  [say it as: '+d.say.map(s=>'"'+s+'"').join(' / ')+']');
  return `\n\nVERIFIED FACTS. These are the ONLY facts and the ONLY figures you may use:\n${lines.join('\n')}${der.length?'\nDerived from the above:\n'+der.join('\n'):''}\nSTORY ANGLE: ${FACTS.storyAngle}\nDO NOT CLAIM: ${(FACTS.doNotClaim||[]).join(' | ')}\nFIGURE RULES: every dollar amount, percentage, count, multiple and year in the hooks AND the script must be one of the 'say it as' figures (written out as spoken words is fine). Never introduce another figure and never round a listed figure to a different number. 'Half' or 'a third' is allowed only if it matches a listed percentage. If the facts do not support a punchy claim, make a different claim. Name only the companies, products and people that appear in the facts above; never invent or swap one. Hooks that state a number must use a listed figure exactly. The first time you use a figure, say what it covers (which company or segment, which period, forecast or actual) exactly as its fact states, using the REAL period such as 'in twenty twenty four' and NEVER relative time words (last year, this year, last quarter, recently), and phrase a take rate as 'of every dollar booked' only if the fact says so. In the SCRIPT write every number out in words (no digits, no dollar signs, no percent signs); hooks may use digits. Each figure measures exactly what its fact says (revenue, operating income, margin, price): NEVER compare two different measures as if they were alike (for example sales against profit), and NEVER use vague money words such as 'a few cents', 'pennies' or 'pocket change'.`;
}

// v3 "attention-first": the viewer is mid-scroll past funny, brilliant human creators. The goal is not to teach, it is to
// open a question they cannot close in the first second and pay it off with one number that lands like a punchline.
const FRAMES=[
  {id:'receipt',  desc:'THE RECEIPT: walk one specific purchase through where each dollar goes, and let the final remainder be the shock.'},
  {id:'villain',  desc:'THE QUIET TAKER: one unglamorous middleman or line item quietly takes the biggest cut. Reveal it like a heist, but stay strictly factual and never accuse anyone of wrongdoing.'},
  {id:'wrongthing',desc:'YOU ARE PAYING FOR THE WRONG THING: the customer thinks they pay for X, but the money is really paying for Y.'},
  {id:'twoprices',desc:'TWO PRICES: the same thing sells at two very different prices; the whole Short is the reason the gap exists.'},
  {id:'winner',   desc:'WHO REALLY WINS: set up the obvious winner, then show the surprising one that actually keeps the money.'},
];
const FRAME=FRAMES[Math.floor(Math.random()*FRAMES.length)];
const SYS='You write short-form videos (Instagram Reels / YouTube Shorts / TikTok) about where everyday money really goes. You are competing for attention against genuinely funny, brilliant human creators, so you do NOT lecture and you do NOT write a mini-lesson. You write like a dry, quick-witted friend who just found out something slightly outrageous and cannot wait to tell you: short sentences, contractions, second person, one wry aside at most. Reading level stays simple (short everyday words) but never childish: never say "most kids think", never talk down. NEVER use MBA jargon (amortize, monetize, subsidize, synergy, ARR, gross margin, capital expenditure, liquidity, aggregate); use physical things and dollar amounts instead. Honesty is non-negotiable: only defensible unit economics, round and clearly approximate figures when unsure, never invent a statistic, report, study, source or date.';

const prompt=`Topic: ${topic}

Write a stickman Short. Return ONLY this JSON:
{
  "hooks": "an array of FIVE candidate on-screen hooks, 5 to 10 words, ALL CAPS. Each hook must OPEN A LOOP: a specific, true, slightly outrageous claim or question whose answer the viewer can only get by watching. It must name the real brand or thing, use the EXACT number from the topic if there is one (never change or invent a number), and end on a concrete word. Use FIVE DIFFERENT shapes, one each: [Question] a 'WHY...' or 'WHO...' question with a number; [Contrarian] flip what everyone believes; [Warning] something to know before the next purchase; [Comparison] two numbers that should not belong together; [Impossible] a claim that sounds false but is true. Format-only examples (never reuse them): 'WHY IS THE POPCORN MORE PROFITABLE THAN THE MOVIE?', 'THE CHEAP PRINTER IS NOT THE CHEAP PART', 'BEFORE YOU BUY THE WARRANTY, SEE WHO KEEPS IT'. BANNED: 'secret', 'revealed', 'you won't believe', 'shocking', 'the truth about', 'steals', ending on 'this' or 'here'.",
  "hookFormulas": "an array of FIVE strings, same order as hooks, each exactly one of: question, contrarian, warning, comparison, impossible",
  "breadcrumb": "a 3-5 word monospaced header for the top left, starting with // (e.g. '// 5 levels of airline profit' or '// the hidden rolex ladder')",
  "accentWord": "ONE single punchy word from the winning hook or opening sentence to be styled in red italic serif (e.g. 'ZERO', 'SEAT', 'PROFIT', 'CASH')",
  "script": "24 to 32 seconds of narration, 60 to 80 words, ONE flowing spoken paragraph, simple everyday words, never childish. NARRATIVE FRAME for this Short: ${FRAME.desc} Build it as five moves, but NEVER write any label, number or the word 'beat' in the narration because a voice reads it word for word: (1) COLD OPEN, 14 words or fewer: say the winning hook as a spoken line, no warm-up, never start with 'Here is', 'Did you know', 'Imagine' or 'Let me'. (2) THE TWIST: one or two sentences putting two numbers or two beliefs in direct conflict. (3) THE MOVE: the single mechanism, told through ONE vivid concrete image specific to this exact business (the actual cup, seat, screw, app). A metaphor is allowed only if it is fresh and used once. BANNED devices that every other Short already uses: arcade token, lemonade stand, playground, tollbooth, vending machine, candy trade, 'most kids think'. (4) THE RECEIPT: land the key number in a short punchy sentence of 4 to 8 words, like a punchline ('Eleven cents. That is the profit.'). If you are not certain of a figure, say 'roughly' or 'about'; attribute only to generic sources ('their own filings', 'basic unit economics') and NEVER name a specific report, study, agency or year. (5) THE LAST LINE: end with ONE short sentence that leaves the opening question feeling newly urgent, so the first words follow naturally when the video replays. NEVER write the words 'loop', 'replay' or 'question', never describe the structure of the video, and do NOT add a call to action or a sign-off. Dry, quick, a little funny, one wry aside at most. SPELL OUT numbers and symbols for text-to-speech (write 'sixteen dollars', not '$16').",
  "scenes": ["three short concrete visual backdrop descriptions, one per third of the video, each showing the ACTUAL physical object or place from the story in a situation with an obvious emotion (surprise, annoyance, smugness), easy to illustrate as a cartoon scene, no text in them"],
  "emotions": ["three to five emotions matching the beats, each one of: neutral, shock, smirk, angry, happy, think"]
}`;

function extractJson(s){ const i=s.indexOf('{'); if(i<0) return null; let d=0; for(let j=i;j<s.length;j++){ if(s[j]==='{')d++; else if(s[j]==='}'){ d--; if(d===0) return s.slice(i,j+1); } } return null; }

function scoreHook(hRaw){
  const h=(hRaw||'').toUpperCase().trim(); if(!h) return -99;
  let s=0; const words=h.split(/\s+/).length;
  if(/\$|%|\bCENTS?\b|\bDOLLARS?\b|\bPERCENT\b|\bBILLION\b|\bMILLION\b|\d/.test(h)) s+=3;
  if(/\bVS\.?\b|\.$/.test(h)) s-=2;   // clunky "A VS B." comparison hooks read like a spreadsheet, not a scroll-stopper
  if(words>=5 && words<=10) s+=2; else if(words>11||words<4) s-=2;
  // v3: reward an open loop (question / warning / contrast), not a flat "BRAND VERB $N" headline
  if(/\?$|^(WHY|WHO|WHAT|HOW|WHICH|BEFORE|NOBODY|EVERYONE|THE .{3,24} IS NOT)\b/.test(h)) s+=3;
  if(/(\$0|\bZERO\b|\bNONE\b|\bLOSES?\b|\bBARELY\b|\bPENNIES\b|ALMOST NOTHING)/.test(h)) s+=2;
  if(/\b(STEALS?|SCAMS?|ROBS?|RIPS? OFF|CHEATS?|SCAMMING)\b/.test(h)) s-=3;
  if(/\b(THIS|HERE|IT|THAT)$/.test(h) || /FINDS THIS/.test(h)) s-=5;
  if(/\b(SECRET|REVEALED|WON'?T BELIEVE|SHOCKING|THE TRUTH ABOUT|GOES HERE|CRAZY)\b/.test(h)) s-=4;
  return s;
}
function pickHook(cands,formulas){
  const list=(Array.isArray(cands)?cands:[cands]).filter(Boolean).map((x,i)=>({h:String(x).toUpperCase().trim(),f:(Array.isArray(formulas)&&formulas[i])||null}));
  if(!list.length) return null;
  return list.map(o=>({...o,s:scoreHook(o.h)})).sort((a,b)=>b.s-a.s)[0];
}

function callGroq(messages,model='openai/gpt-oss-120b',temperature=0.55){
  const body=JSON.stringify({model,messages,reasoning_effort:'low',temperature,max_tokens:6000});
  return new Promise((resolve,reject)=>{
    const req=https.request('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+KEY}},res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{ resolve(JSON.parse(d).choices[0].message.content); }catch(e){ reject(new Error('groq parse: '+(d||'').slice(0,300))); } });
    });
    req.on('error',reject); req.write(body); req.end();
  });
}

// one attempt -> {brief} or {violations}
function build(content){
  const brief=JSON.parse(extractJson(content));
  let cands=[].concat(brief.hooks||brief.hook||[]).map((h,i)=>({h,f:(brief.hookFormulas||[])[i]}));
  const bad=[];
  if(/[0-9$%]/.test(String(brief.script||''))) bad.push('script contains digits or symbols; spell every number out in words');
  if(FACTS){
    cands=cands.filter(c=>{ const r=guard.check(c.h,FACTS); if(!r.ok) bad.push(...r.violations.map(v=>'hook "'+c.h+'": '+v.text)); return r.ok; });
    const sr=guard.check(String(brief.script||''),FACTS);
    if(!sr.ok) bad.push(...sr.violations.map(v=>'script: "'+v.text+'"'));
    if(!cands.length) bad.push('every hook candidate used an unlisted figure');
    if(bad.length) return {violations:bad};
  }
  const win=pickHook(cands.map(c=>c.h),cands.map(c=>c.f));
  brief.hook=win&&win.h; brief.hookFormula=(win&&win.f)||'unknown'; brief.frame=FRAME.id; delete brief.hookFormulas;
  if(!brief.hook||!brief.script) throw new Error('missing hook/script');
  brief.script=String(brief.script).replace(/\bbeat\s*(?:one|two|three|four|\d+)\s*[:.)\-–—]*\s*/gi,'').replace(/\s{2,}/g,' ').trim();
  brief.hookCandidates=brief.hooks; delete brief.hooks;
  brief.slug=slug; brief.topic=topic; brief.hook=brief.hook.toUpperCase();
  brief.breadcrumb=brief.breadcrumb||'// the hidden money engine';
  brief.accentWord=(brief.accentWord||'MONEY').toUpperCase();
  brief.scenes=(brief.scenes||[]).slice(0,3); brief.emotions=(brief.emotions||['shock','think','smirk']);
  brief.factSeeded=!!FACTS;
  if(FACTS) brief.sources=[...new Set(FACTS.facts.map(f=>f.source))];
  return {brief};
}

// second pass: a separate model call must find direct support in the fact list for every factual sentence
async function verifyClaims(script){
  const facts=FACTS.facts.map(f=>'- '+f.claim).concat((FACTS.derived||[]).map(d=>'- '+d.claim)).join('\n');
  const msgs=[{role:'system',content:'You are a strict fact-checker for a finance video channel. You only trust the FACTS you are given.'},
    {role:'user',content:`FACTS:\n${facts}\nDO NOT CLAIM: ${(FACTS.doNotClaim||[]).join(' | ')}\n\nSCRIPT:\n${script}\n\nFor every sentence in the SCRIPT that asserts something about the real world, decide whether the FACTS directly support it. Imagery that plainly describes an illustration (for example "picture a row of servers") is fine. The first line is the on-screen HOOK; check it like any other sentence. Flag a sentence if it: names a company, product or person that does not appear in the FACTS; is not supported by the facts; contradicts DO NOT CLAIM; overstates a fact (words like never, always, nothing, all, only, barely, stuck, broke); implies a split, cause or motive the facts do not state; or uses relative time (last year, recently). Return ONLY JSON: {"unsupported":[{"sentence":"...","why":"..."}]} with an empty array if every claim is supported.`}];
  for(let w=0; w<4; w++){
    try{ const out=JSON.parse(extractJson(await callGroq(msgs,'openai/gpt-oss-20b',0.1))); return Array.isArray(out.unsupported)?out.unsupported:[]; }
    catch(e){ const m=/try again in ([0-9.]+)s/i.exec(e.message); if(m){ await new Promise(r=>setTimeout(r,(parseFloat(m[1])+1.5)*1000)); continue; } break; }
  }
  console.error('VERIFIER_UNAVAILABLE: numbers were still guarded, claims were not second-checked'); return [];
}

(async()=>{
  const msgs=[{role:'system',content:SYS},{role:'user',content:prompt+factsBlock()}];
  let result=null;
  for(let attempt=1; attempt<=3; attempt++){
    let content; for(let w=0; ; w++){ try{ content=await callGroq(msgs); break; }catch(e){ const m=/try again in ([0-9.]+)s/i.exec(e.message); if(m&&w<4){ console.error('rate limited, waiting '+m[1]+'s'); await new Promise(r=>setTimeout(r,(parseFloat(m[1])+1.5)*1000)); continue; } console.error('groq error:',e.message); process.exit(1); } }
    try{ result=build(content); }catch(e){ console.error('attempt '+attempt+' parse failed:',e.message); result={violations:['output was not valid JSON with hook+script']}; }
    if(result.brief && FACTS){ const un=await verifyClaims(result.brief.hook+'\n'+result.brief.script); if(un.length) result={violations:un.map(x=>'unsupported claim "'+x.sentence+'" ('+x.why+')')}; else result.brief.claimsChecked=true; }
    if(result.brief) break;
    console.error('attempt '+attempt+' rejected by fact guard: '+result.violations.slice(0,6).join('; '));
    msgs.push({role:'assistant',content},{role:'user',content:'REJECTED. Fix these problems (figures that are not in the verified facts, or claims the facts do not support): '+result.violations.slice(0,8).join('; ')+'. Rewrite the whole JSON. Use ONLY the listed figures, spelled as allowed. Do not use a figure you cannot find in the list.'});
  }
  if(!result||!result.brief){ console.error('FACT_GUARD_FAILED after 3 attempts: '+slug); process.exit(3); }
  const brief=result.brief;
  fs.writeFileSync(path.join(ROOT,'models',slug+'-short.brief.json'),JSON.stringify(brief,null,2));
  fs.writeFileSync(path.join(ROOT,'models',slug+'-short.script.json'),JSON.stringify({slug:slug+'-short',title:brief.hook,beats:[{key:'short',name:'Short',narration:brief.script}]},null,2));
  console.log('✓ brief:',slug,FACTS?'(fact-seeded, guard passed)':'(UNSEEDED — no facts file)');
  console.log('  HOOK:',brief.hook,'| formula:',brief.hookFormula,'| frame:',brief.frame);
  console.log('  BREADCRUMB:',brief.breadcrumb,'| ACCENT:',brief.accentWord);
  console.log('  script:',brief.script.slice(0,140)+'…');
  console.log('  scenes:',brief.scenes.length,'| emotions:',brief.emotions.join(','));
})();
