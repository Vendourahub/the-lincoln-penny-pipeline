#!/usr/bin/env node
/*
 * publish_instagram.js — publish a vertical video as an INSTAGRAM REEL to @lincolnpennystories.
 * IG requires a public video_url (not a file upload), so the clip is staged at the public
 * /media-staging/ path (nginx: /opt/faceless/out/instagram/, auth off) and IG fetches it.
 * 3 steps: create REELS container -> poll until FINISHED -> publish.
 *
 *   node publish_instagram.js <video.mp4> [--caption "text"]
 */
const fs = require('fs');
const path = require('path');
const { ROOT_DIR, OUT_DIR } = require('../config/env');

const ROOT = ROOT_DIR;
// Publish via the Facebook Graph API using the non-expiring SYSTEM_USER token (instagram_content_publish).
// This removes the 60-day Instagram-Login token expiry entirely.
const UID=(process.env.IG_BUSINESS_ID||'').trim();
const TOK=(process.env.META_SYSTEM_TOKEN||process.env.FB_PAGE_TOKEN||'').trim();
const BASE='https://graph.facebook.com/v21.0';
const PUBLIC='https://faceless.vendoura.com/media-staging';
const arg=f=>{const i=process.argv.indexOf(f);return i>=0?process.argv[i+1]:null;};
const video=process.argv[2];
if(!video||!fs.existsSync(video)){console.error('usage: node publish_instagram.js <video.mp4> [--caption ..]');process.exit(1);}
if(!UID||!TOK){console.error('INSTAGRAM_ACCOUNT_ID / INSTAGRAM_ACCESS_TOKEN missing');process.exit(1);}
const caption=arg('--caption')||'';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
  try{
    // stage the clip at the public path
    const stage = path.join(OUT_DIR, 'instagram'); fs.mkdirSync(stage, { recursive: true });
    const base=path.basename(video);
    fs.copyFileSync(video, path.join(stage, base));
    const videoUrl=`${PUBLIC}/${base}`;

    // 1) create REELS container
    let r=await fetch(`${BASE}/${UID}/media`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({media_type:'REELS',video_url:videoUrl,caption,access_token:TOK})});
    let d=await r.json();
    if(d.error||!d.id) throw new Error('create: '+(d.error?d.error.message:'no id'));
    const cid=d.id;

    // 2) poll until FINISHED
    let status='IN_PROGRESS';
    for(let i=0;i<40 && status==='IN_PROGRESS';i++){
      await sleep(6000);
      const s=await (await fetch(`${BASE}/${cid}?fields=status_code&access_token=${TOK}`)).json();
      status=s.status_code||'IN_PROGRESS';
      if(status==='ERROR') throw new Error('container processing ERROR');
    }
    if(status!=='FINISHED') throw new Error('container not ready (status '+status+')');

    // 3) publish
    r=await fetch(`${BASE}/${UID}/media_publish`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({creation_id:cid,access_token:TOK})});
    d=await r.json();
    if(d.error||!d.id) throw new Error('publish: '+(d.error?d.error.message:'no id'));
    const slug=base.replace(/\.[^.]+$/,'');
    fs.writeFileSync(path.join(OUT_DIR, slug + '.instagram.json'), JSON.stringify({platform:'instagram_reel',mediaId:d.id,at:Date.now()},null,2));
    console.log(`  ✓ IG REEL published: ${d.id}`);
  }catch(e){ console.error('  IG reel failed:',e.message); process.exit(1); }
})();
