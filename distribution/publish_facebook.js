#!/usr/bin/env node
/*
 * publish_facebook.js — publish a vertical video as a FACEBOOK REEL to the Page (3-step resumable).
 * Publishes DIRECTLY by default (video_state=PUBLISHED); if identity confirmation is needed,
 * gracefully saves as DRAFT so the video upload is never lost.
 *
 *   node publish_facebook.js <video.mp4> [--desc "caption"] [--draft]
 */
const fs=require('fs'), path=require('path'), { execFileSync }=require('child_process');
const ROOT=__dirname;
for(const l of (fs.existsSync(path.join(ROOT,'.env'))?fs.readFileSync(path.join(ROOT,'.env'),'utf8').split('\n'):[])){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const PID=(process.env.FB_PAGE_ID||'').trim();
const TOK=(process.env.FB_PAGE_TOKEN||'').trim();
const arg=f=>{const i=process.argv.indexOf(f);return i>=0?process.argv[i+1]:null;};
const video=process.argv[2];
if(!video||!fs.existsSync(video)){console.error('usage: node publish_facebook.js <video.mp4> [--desc ..] [--draft]');process.exit(1);}
if(!PID||!TOK){console.error('FB_PAGE_ID / FB_PAGE_TOKEN missing from .env');process.exit(1);}
const desc=arg('--desc')||'';
let state=process.argv.includes('--draft')?'DRAFT':'PUBLISHED';
const size=fs.statSync(video).size;
const G=`https://graph.facebook.com/v21.0/${PID}/video_reels`;
const curl=(args)=>JSON.parse(execFileSync('curl',['-s','--max-time','200',...args],{maxBuffer:4<<20}).toString()||'{}');

try{
  // 1) start -> video_id + upload_url
  const s=curl(['-X','POST',`${G}?upload_phase=start&access_token=${TOK}`]);
  if(s.error||!s.video_id) throw new Error('start: '+(s.error?s.error.message:'no video_id'));
  const vid=s.video_id, uploadUrl=s.upload_url;
  // 2) upload the binary (resumable, single chunk)
  const u=curl(['-X','POST',uploadUrl,'-H',`Authorization: OAuth ${TOK}`,'-H','offset: 0','-H',`file_size: ${size}`,'--data-binary',`@${video}`]);
  if(u.error||!(u.success||u.success===undefined && !u.error)) { if(u.error) throw new Error('upload: '+u.error.message); }
  // 3) finish -> publish (with DRAFT fallback if identity confirmation is pending)
  let f=curl(['-X','POST',G,'-F',`upload_phase=finish`,'-F',`video_id=${vid}`,'-F',`video_state=${state}`,'-F',`description=${desc}`,'-F',`access_token=${TOK}`]);
  if(f.error && state==='PUBLISHED' && f.error.message && f.error.message.includes('Confirm your identity')){
    console.log('  [!] Identity confirmation required for public publish. Saving Reel as DRAFT on Page...');
    state='DRAFT';
    f=curl(['-X','POST',G,'-F',`upload_phase=finish`,'-F',`video_id=${vid}`,'-F',`video_state=DRAFT`,'-F',`description=${desc}`,'-F',`access_token=${TOK}`]);
  }
  if(f.error) throw new Error('finish: '+f.error.message);
  const slug=path.basename(video).replace(/\.[^.]+$/,'');
  fs.writeFileSync(path.join(ROOT,'out',slug+'.facebook.json'),JSON.stringify({platform:'facebook_reel',videoId:vid,state,page:PID,at:Date.now(),url:`https://www.facebook.com/reel/${vid}`},null,2));
  console.log(`  ✓ FB REEL ${state}: ${vid}  https://www.facebook.com/reel/${vid}`);
}catch(e){ console.error('  FB reel failed:',e.message); process.exit(1); }
