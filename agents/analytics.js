#!/usr/bin/env node
/*
 * Analytics puller — ZERO-COST: CTR requires Reporting API bulk, not targeted queries. Playback metrics are free.
 * Analytics puller — the day-90 kill-criteria dashboard, from real channel data.
 *   node analytics.js
 * Writes out/analytics.json: channel totals + per-video views / retention / CTR / subs.
 * Uses the stored YouTube OAuth (yt-analytics.readonly + youtube.readonly).
 */
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const ROOT = __dirname;
const SECRET = path.join(ROOT, 'client_secret.json');
const TOKENS = path.join(ROOT, 'youtube_tokens.json');

function authed(){
  const cfg = (JSON.parse(fs.readFileSync(SECRET,'utf8')).installed) || JSON.parse(fs.readFileSync(SECRET,'utf8')).web;
  const o = new google.auth.OAuth2(cfg.client_id, cfg.client_secret, (cfg.redirect_uris||['http://localhost'])[0]);
  o.setCredentials(JSON.parse(fs.readFileSync(TOKENS,'utf8')));
  o.on('tokens', t => { const cur=JSON.parse(fs.readFileSync(TOKENS,'utf8')); fs.writeFileSync(TOKENS, JSON.stringify({...cur,...t},null,2)); });
  return o;
}
const today = () => new Date().toISOString().slice(0,10);

(async () => {
  const auth = authed();
  const yt = google.youtube({ version:'v3', auth });
  const yta = google.youtubeAnalytics({ version:'v2', auth });

  // channel totals
  const ch = (await yt.channels.list({ part:'snippet,statistics', mine:true })).data.items[0];
  const channel = {
    title: ch.snippet.title, id: ch.id,
    subs: +ch.statistics.subscriberCount, views: +ch.statistics.viewCount, videos: +ch.statistics.videoCount,
  };

  // per-video playback metrics (lifetime)
  const start = '2020-01-01', end = today();
  let rows = [];
  try {
    const r = await yta.reports.query({
      ids:'channel==MINE', startDate:start, endDate:end, dimensions:'video',
      metrics:'views,estimatedMinutesWatched,averageViewPercentage,averageViewDuration,subscribersGained,likes',
      sort:'-views', maxResults:50,
    });
    rows = r.data.rows || [];
  } catch(e){ console.error('  playback query:', e.message); }

  // impressions + CTR — NOT available via Analytics API reports.query (requires Reporting API bulk).
  // Zero-cost fallback: suppress expected "Unknown identifier" spam, keep playback metrics intact.
  const ctr = {};
  let ctrNote = "CTR not available via Analytics API targeted queries; check Studio > Analytics > Reach.";
  try {
    const r2 = await yta.reports.query({
      ids:'channel==MINE', startDate:start, endDate:end, dimensions:'video',
      metrics:'impressions,impressionClickThroughRate', sort:'-impressions', maxResults:50,
    });
    (r2.data.rows||[]).forEach(row => { ctr[row[0]] = { impressions:row[1], ctr:row[2] }; });
    ctrNote = null;
  } catch(e){
    if (!/Unknown identifier|not supported|unsupported/i.test(e.message)) console.error('  ctr query:', e.message);
  }

  // resolve titles
  const ids = rows.map(r=>r[0]).filter(Boolean);
  const titles = {};
  if(ids.length){
    const v = await yt.videos.list({ part:'snippet,status', id:ids.join(',') });
    v.data.items.forEach(it => titles[it.id] = { title:it.snippet.title, privacy:it.status.privacyStatus });
  }

  const videos = rows.map(r => {
    const id=r[0];
    return {
      id, url:'https://youtu.be/'+id,
      title:(titles[id]||{}).title || id, privacy:(titles[id]||{}).privacy || '?',
      views:r[1], minutesWatched:r[2], avgViewPct:+(r[3]||0).toFixed(1), avgViewSec:Math.round(r[4]||0),
      subsGained:r[5], likes:r[6],
      impressions:(ctr[id]||{}).impressions||0, ctr:+(((ctr[id]||{}).ctr)||0).toFixed(2),
      ctrNote: ctr[id] ? null : ctrNote,
    };
  });

  const totalWatchHrs = +(videos.reduce((a,v)=>a+v.minutesWatched,0)/60).toFixed(1);
  const out = {
    generatedAt: new Date().toISOString(), channel,
    ypp: { subs:channel.subs, subsTarget:1000, watchHours:totalWatchHrs, watchTarget:4000,
           subsPct:+(channel.subs/10).toFixed(1), watchPct:+(totalWatchHrs/40).toFixed(1) },
    videos,
    meta: { ctrNote },
  };
  fs.writeFileSync(path.join(ROOT,'out','analytics.json'), JSON.stringify(out,null,2));
  console.log(`  ✓ analytics: ${channel.title} — ${channel.subs} subs, ${totalWatchHrs}h watched, ${videos.length} videos`);
  console.log(`    YPP progress: subs ${out.ypp.subsPct}% of 1,000 · watch-hours ${out.ypp.watchPct}% of 4,000`);
  if (ctrNote) console.log(`    note: ${ctrNote}`);
  videos.slice(0,5).forEach(v => console.log(`    [${v.views} views · ${v.avgViewPct}% ret · ${v.ctrNote ? "Studio" : v.ctr + "% CTR"}] ${v.title.slice(0,50)}`));
})().catch(e => { console.error('  analytics failed:', e.message); process.exit(1); });
