#!/usr/bin/env node
/*
 * token_refresh.js — keep the Meta tokens alive so IG/FB publishing never dies silently.
 * - Instagram long-lived token: refreshes it (extends 60 days) and writes the new one back to .env.
 * - Facebook page token: checks expiry and warns if it's near/expired (page tokens can't self-refresh;
 *   a near-expiry one needs a manual re-grant, surfaced loudly).
 * On any failure it writes out/TOKEN_ALERT.txt and exits non-zero so a problem is visible, not silent.
 *
 *   node token_refresh.js            # refresh IG + check FB
 */
const fs=require('fs'), path=require('path');
const ROOT=__dirname, ENV=path.join(ROOT,'.env');
const env={}; const rawLines=fs.readFileSync(ENV,'utf8').split('\n');
for(const l of rawLines){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const alerts=[];
function setEnv(k,v){ const i=rawLines.findIndex(l=>l.match(new RegExp('^\\s*'+k+'\\s*='))); if(i>=0) rawLines[i]=`${k}=${v}`; else rawLines.push(`${k}=${v}`); }

(async()=>{
  const now=Date.now();
  // 1) Instagram long-lived token refresh
  try{
    const t=(env.INSTAGRAM_ACCESS_TOKEN||'').trim();
    const r=await (await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${t}`)).json();
    if(r.access_token){
      setEnv('INSTAGRAM_ACCESS_TOKEN', r.access_token);
      const days=Math.round((r.expires_in||0)/86400);
      console.log(`✓ IG token refreshed — valid ~${days} more days`);
    } else {
      throw new Error((r.error&&r.error.message)||'no access_token returned');
    }
  }catch(e){ alerts.push('INSTAGRAM token refresh FAILED: '+e.message+' — re-auth @lincolnpennystories needed'); }

  // 2) Facebook page token expiry check (debug_token)
  try{
    const pt=(env.FB_PAGE_TOKEN||'').trim();
    const app=(env.META_SYSTEM_TOKEN||pt).trim();
    const r=await (await fetch(`https://graph.facebook.com/v21.0/debug_token?input_token=${pt}&access_token=${app}`)).json();
    const d=r.data||{};
    const exp=d.expires_at||0; // 0 = never expires
    if(!d.is_valid){ alerts.push('FACEBOOK page token is INVALID: '+((d.error&&d.error.message)||'unknown')); }
    else if(exp===0){ console.log('✓ FB page token: valid, never expires'); }
    else {
      const days=Math.round((exp*1000-now)/86400000);
      console.log(`  FB page token: valid, ~${days} days left`);
      if(days<14) alerts.push(`FACEBOOK page token expires in ${days} days — re-grant soon`);
    }
  }catch(e){ alerts.push('FACEBOOK token check error: '+e.message); }

  // persist refreshed .env
  fs.writeFileSync(ENV+'.bak-'+new Date().toISOString().slice(0,10), fs.readFileSync(ENV));
  fs.writeFileSync(ENV, rawLines.join('\n'));
  fs.chmodSync(ENV,0o600);

  const alertFile=path.join(ROOT,'out','TOKEN_ALERT.txt');
  if(alerts.length){
    const msg=`[${new Date().toISOString()}] TOKEN ALERTS:\n`+alerts.map(a=>'  - '+a).join('\n')+'\n';
    fs.appendFileSync(alertFile, msg);
    console.error('‼ '+msg);
    process.exit(1);
  } else {
    try{ fs.existsSync(alertFile)&&fs.unlinkSync(alertFile); }catch(e){}
    console.log('all tokens healthy');
  }
})();
