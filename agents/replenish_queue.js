#!/usr/bin/env node
/*
 * replenish_queue.js — keep stickman_queue.txt topped up with fresh topics via Groq.
 * Only generates when the unmade backlog drops below --min, refilling up to --target.
 * Dedupes against queued + already-made slugs.
 *
 *   node replenish_queue.js [--min 20] [--target 40] [--force]
 */
const fs=require('fs'), path=require('path'), https=require('https');
const ROOT=__dirname;
for(const l of (fs.existsSync(path.join(ROOT,'.env'))?fs.readFileSync(path.join(ROOT,'.env'),'utf8').split('\n'):[])){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const KEY=process.env.GROQ_API_KEY;
const arg=(f,d)=>{const i=process.argv.indexOf(f);return i>=0?process.argv[i+1]:d;};
const MIN=parseInt(arg('--min','20'),10), TARGET=parseInt(arg('--target','40'),10), FORCE=process.argv.includes('--force');
const QF=path.join(ROOT,'stickman_queue.txt');
if(!KEY){console.error('GROQ_API_KEY missing');process.exit(1);}

const queueLines = fs.existsSync(QF)?fs.readFileSync(QF,'utf8').split('\n'):[];
const queued = queueLines.filter(l=>l.trim()&&!l.startsWith('#')).map(l=>l.split('|')[0].trim());
const made = fs.existsSync(path.join(ROOT,'out')) ? fs.readdirSync(path.join(ROOT,'out')).filter(f=>f.endsWith('-stickman.mp4')).map(f=>f.replace('-stickman.mp4','')) : [];
const existing = new Set([...queued, ...made]);
const unmade = queued.filter(s=>!made.includes(s)).length;

if(!FORCE && unmade>=MIN){ console.log(`queue healthy: ${unmade} unmade (>= ${MIN}); no refill`); process.exit(0); }
const need = Math.max(5, TARGET-unmade);
console.log(`unmade ${unmade} < ${MIN} -> generating ${need} fresh topics`);

function extractJsonArray(s){ const i=s.indexOf('['); if(i<0) return null; let d=0; for(let j=i;j<s.length;j++){ if(s[j]==='[')d++; else if(s[j]===']'){ d--; if(d===0) return s.slice(i,j+1); } } return null; }

const SYS='You generate ideas for viral animated stickman podcast shorts (two characters having a studio conversation exposing dirty corporate business secrets, hidden money loops, and shocking economics). Tense, forensic, number-driven, revealing what companies hide behind glossy marketing.';
const prompt=`Generate ${need} FRESH, distinct ideas. Each must expose a DIRTY CORPORATE SECRET, hidden franchise racket, shocking markup, controversial business lawsuit, loss leader trap, or counter-intuitive money-printing machine of a globally famous company or everyday product.
Requirements:
1. SPECIFIC NUMBERS (e.g. $500M lawsuit, 1,200% margin, $16 cost on $180 shoes, $1.8B unspent cards).
2. TENSE FORENSIC ANGLE (expose the dirty trick, fine print, or what the customer doesn't see).
3. CONVERSATION-READY: Written so a podcast insider can drop it on a host who reacts with shock.
Spread across tech giants, fast food, airlines, luxury fashion, entertainment, retail monopolies, and subscription traps.

Do NOT repeat any of these already-used slugs: ${[...existing].join(', ')||'(none)'}.

Return ONLY a JSON array, each item {"slug","topic"}:
- "slug": short kebab-case, unique, ending in "-cut" (e.g. "apple-battery-throttle-cut").
- "topic": one sentence stating the dirty corporate secret or hidden economic racket with specific numbers.
Example: {"slug":"starbucks-giftcard-bank-cut","topic":"how Starbucks holds nearly two billion dollars in unspent customer cards and operates as an unregulated bank"}`;

const body=JSON.stringify({model:'openai/gpt-oss-120b',messages:[{role:'system',content:SYS},{role:'user',content:prompt}],reasoning_effort:'low',temperature:0.9,max_tokens:6000});
const req=https.request('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+KEY}},res=>{
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    try{
      const content=JSON.parse(d).choices[0].message.content;
      const arr=JSON.parse(extractJsonArray(content));
      let added=0, lines=[];
      for(const it of arr){
        let slug=(it.slug||'').toLowerCase().replace(/[^a-z0-9-]/g,'').replace(/^-+|-+$/g,'');
        if(!slug||!it.topic) continue;
        if(!slug.endsWith('-cut')) slug+='-cut';
        if(existing.has(slug)) continue;
        existing.add(slug);
        lines.push(`${slug}|${String(it.topic).replace(/[|\n]/g,' ').trim()}`);
        added++;
      }
      if(lines.length){ fs.appendFileSync(QF, (fs.readFileSync(QF,'utf8').endsWith('\n')?'':'\n')+lines.join('\n')+'\n'); }
      console.log(`✓ added ${added} topics (queue now ${queued.length+added} total, ~${unmade+added} unmade)`);
      lines.slice(0,5).forEach(l=>console.log('   +',l.split('|')[0]));
    }catch(e){ console.error('parse failed:',e.message); console.error((d||'').slice(0,300)); process.exit(1); }
  });
});
req.on('error',e=>{console.error('groq error:',e.message);process.exit(1);});
req.write(body); req.end();
