#!/usr/bin/env node
/*
 * numguard.js — fact guard for generated Short copy.
 * Extracts every figure (digits or spelled-out words, as read aloud by TTS) from a hook/script and
 * rejects any that is not in the verified fact file. Allowed figures are written in natural form in
 * facts/<slug>.json ("$1.50", "52%", "nearly 200 million") and parsed with the same extractor, so
 * "one dollar and fifty cents", "$1.50" and "1.5 dollars" all match.
 *
 *   const { check } = require('./numguard');
 *   check(text, factFile) -> { ok, violations:[{text,value,unit}] }
 *   node numguard.js facts/x.json "script text"      (CLI)
 */
const ONES = { zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12,
  thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19 };
const TENS = { twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90 };
const SCALE = { thousand:1e3, million:1e6, billion:1e9, trillion:1e12 };
const SHORT_SCALE = { k:1e3, m:1e6, mm:1e6, bn:1e9, b:1e9 };
const isNumWord = t => t in ONES || t in TENS || t === 'hundred' || t in SCALE;

function tokenize(text) {
  const s = String(text).toLowerCase().replace(/[‐-―]/g, ' ').replace(/-/g, ' ').replace(/(\d),(?=\d{3}\b)/g, '$1').replace(/’/g, "'");
  // '|' = sentence/clause boundary so number phrases never run across punctuation
  return (s.match(/\$|\d+(?:\.\d+)?|%|[a-z']+|[,.;:!?]/g) || []).map(t => /^[,.;:!?]$/.test(t) ? '|' : t);
}

// spoken years: "nineteen eighty five" -> 1985, "twenty twenty four" -> 2024; decades ("eighties") are ignored
const DECADE = new Set(['twenties','thirties','forties','fifties','sixties','seventies','eighties','nineties','noughties']);
function parseYear(tk, i) {
  const t = tk[i];
  if (t !== 'nineteen' && !(t === 'twenty' && (tk[i+1] === 'twenty' || tk[i+1] === 'ten' || tk[i+1] === 'oh' || (tk[i+1] in ONES && ONES[tk[i+1]] >= 10)))) return null;
  const base = t === 'nineteen' ? 1900 : 2000;
  const nx = tk[i+1];
  if (DECADE.has(nx)) return { value: null, next: i + 2 };                       // "nineteen eighties"
  if (nx === 'oh' && tk[i+2] in ONES && ONES[tk[i+2]] < 10) return { value: base + ONES[tk[i+2]], next: i + 3 };
  if (nx in TENS) { let v = TENS[nx], n = i + 2; if (tk[n] in ONES && ONES[tk[n]] < 10) { v += ONES[tk[n]]; n++; } return { value: base + v, next: n }; }
  if (nx in ONES && ONES[nx] >= 10) return { value: base + ONES[nx], next: i + 2 };
  return null;
}

const FRACTIONS = [[/\bhalf\b/g, 50], [/\b(?:a|one)\s+third\b/g, 33.3], [/\btwo\s+thirds\b/g, 66.7], [/\b(?:a|one)\s+quarter\s+of\b/g, 25], [/\bthree\s+quarters\s+of\b/g, 75]];
function extractFractions(text) {
  const s = String(text).toLowerCase(), out = [];
  for (const [re, pct] of FRACTIONS) for (const m of s.matchAll(re)) out.push({ text: m[0], value: pct, unit: 'pct', approx: true });
  return out;
}

// parse a spelled-out number phrase starting at tokens[i]; returns {value, next} or null
function parseWords(tk, i) {
  let total = 0, cur = 0, j = i, used = false, prev = '';
  if (tk[j] === 'a' && (tk[j+1] === 'hundred' || tk[j+1] in SCALE)) { cur = 1; j++; }
  for (; j < tk.length; j++) {
    const t = tk[j];
    if (t in ONES) { cur += ONES[t]; used = true; }
    else if (t in TENS) { cur += TENS[t]; used = true; }
    else if (t === 'hundred') { cur = (cur || 1) * 100; used = true; }
    else if (t in SCALE) { total += (cur || 1) * SCALE[t]; cur = 0; used = true; }
    else if (t === 'and' && used && (prev === 'hundred' || prev in SCALE) && isNumWord(tk[j+1] || '')) { /* "two hundred and five" */ }
    else if (t === 'point' && used) {
      let frac = '', k = j + 1;
      while (k < tk.length && tk[k] in ONES && ONES[tk[k]] < 10) { frac += ONES[tk[k]]; k++; }
      if (frac) { return { value: total + cur + parseFloat('0.' + frac), next: k }; }
      break;
    }
    else break;
    prev = t;
  }
  return used ? { value: total + cur, next: j } : null;
}

const MONEY_W = new Set(['dollar','dollars','buck','bucks']);
const CENT_W = new Set(['cent','cents']);

// extract [{text,value,unit}] ; unit in usd | pct | x | year | n
function extract(text) {
  const tk = tokenize(text), out = [];
  for (let i = 0; i < tk.length; i++) {
    let value = null, next = i, dollarSign = false, start = i;
    if (tk[i] === '$' && /^\d/.test(tk[i+1] || '')) { dollarSign = true; i++; }
    if (/^\d/.test(tk[i] || '')) { value = parseFloat(tk[i]); next = i + 1; }
    else if (tk[i] === 'a' && MONEY_W.has(tk[i+1] || '')) { value = 1; next = i + 1; }
    else {
      const y = parseYear(tk, i);
      if (y) { if (y.value !== null) out.push({ text: tk.slice(i, y.next).join(' '), value: y.value, unit: 'year' }); i = y.next - 1; continue; }
      const w = parseWords(tk, i); if (w) { value = w.value; next = w.next; }
    }
    if (value === null) continue;
    if (Number.isInteger(value) && value >= 1900 && value <= 2090 && value % 10 === 0 && tk[next] === 's') { i = next; continue; }   // "1980s" is a decade, not a year
    let unit = 'n', j = next;
    const nx = tk[j] || '';
    if (SHORT_SCALE[nx] && /^\d/.test(tk[i] || '')) { value *= SHORT_SCALE[nx]; j++; }
    else if (nx in SCALE) { value *= SCALE[nx]; j++; }
    const u = tk[j] || '';
    if (dollarSign || MONEY_W.has(u)) {
      unit = 'usd'; if (MONEY_W.has(u)) j++;
      // "one dollar fifty cents" / "five dollar sixty nine cent" / "one dollar and fifty cents"
      let k = j; if (tk[k] === 'and') k++;
      const c = /^\d/.test(tk[k] || '') ? { value: parseFloat(tk[k]), next: k + 1 } : parseWords(tk, k);
      if (c && c.value < 100 && !SCALE[tk[c.next]] && (CENT_W.has(tk[c.next] || '') || MONEY_W.has(u))) { value += c.value / 100; j = c.next; if (CENT_W.has(tk[j] || '')) j++; }
    } else if (CENT_W.has(u)) {
      j++;
      // "thirty cents on the dollar" is a percentage, not an amount
      if (/^(?:per|on|of|for|from|out of)\s+(?:every |each |the |a |one )?dollar/.test(tk.slice(j, j + 5).join(' '))) unit = 'pct';
      else { unit = 'usd'; value /= 100; }
    }
    else if (u === 'percent' || u === '%') { unit = 'pct'; j++; }
    else if (u === 'times' || u === 'x') { unit = 'x'; j++; }
    else if (Number.isInteger(value) && value >= 1900 && value <= 2100) unit = 'year';
    out.push({ text: tk.slice(start, j).join(' '), value, unit });
    i = Math.max(i, j - 1);
  }
  return out;
}

function allowedFrom(facts) {
  const strings = [];
  for (const f of facts.facts || []) for (const s of f.say || []) strings.push(String(s));
  for (const d of facts.derived || []) for (const s of d.say || []) strings.push(String(s));
  const fromSay = strings.flatMap(s => extract(s).concat(extractFractions(s)));
  // the period a fact covers is written in its claim text ("in 2024", "fiscal 2023"), so those years are allowed too
  const claimYears = [].concat(...(facts.facts || []).map(f => extract(f.claim || '').filter(n => n.unit === 'year')));
  return fromSay.concat(claimYears);
}

const close = (a, b, tol = 0.03) => Math.abs(a - b) <= Math.max(tol * Math.abs(b), 1e-9);

// vague money quantities cannot be verified, so they are rejected unless a fact lists the exact phrase
const VAGUE = /\b(?:a few|a couple of|a couple|several|barely|just a few|only a few|a handful of)\s+(?:cents|dollars|pennies|bucks)\b|\bpennies\b|\bpocket change\b|\bpeanuts\b/g;
// relative time goes stale ("last year" was true when the fact was written); require the actual period instead
const RELTIME = /\b(?:last|this|next|past)\s+(?:year|quarter|month|fiscal year)\b|\brecently\b|\bthese days\b|\bnowadays\b/g;
function extractVague(text) { return [...String(text).toLowerCase().matchAll(VAGUE)].concat([...String(text).toLowerCase().matchAll(RELTIME)]).map(m => ({ text: m[0], value: null, unit: 'vague' })); }

function check(text, facts) {
  const allowed = allowedFrom(facts), violations = [];
  const factText = [].concat(...(facts.facts || []).map(f => f.say || [])).join(' ').toLowerCase();
  for (const v of extractVague(text)) if (!factText.includes(v.text)) violations.push(v);
  for (const n of extract(text).concat(extractFractions(text))) {
    if (n.unit === 'n' && Number.isInteger(n.value) && n.value < 10) continue;       // "two things"
    const ok = n.unit === 'year' ? allowed.some(a => a.unit === 'year' && a.value === n.value)               // years: exact
      : n.approx ? allowed.some(a => a.unit === 'pct' && close(n.value, a.value, 0.1))                        // "half", "a third": within 10% of a listed percent
      : allowed.some(a => a.unit === n.unit && close(n.value, a.value)) ||
        (n.unit === 'n' && allowed.some(a => close(n.value, a.value)));                                       // bare scaled counts
    if (!ok) violations.push(n);
  }
  return { ok: violations.length === 0, violations };
}

module.exports = { check, extract, allowedFrom };

if (require.main === module) {
  const fs = require('fs');
  const facts = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const r = check(process.argv.slice(3).join(' '), facts);
  console.log(JSON.stringify(r, null, 1)); process.exit(r.ok ? 0 : 3);
}
