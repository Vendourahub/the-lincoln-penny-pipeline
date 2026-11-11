#!/usr/bin/env node
/**
 * TikTok Direct Post Publisher for The Lincoln Penny
 * Uses official Content Posting API v2 with chunked FILE_UPLOAD.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const { ROOT_DIR, OUT_DIR } = require('../config/env');
const { getTiktokTokensPath } = require('../config/credentials');

const ROOT = ROOT_DIR;
const TOKEN_FILE = getTiktokTokensPath();
const ENV_FILE = path.join(ROOT, '.env');

function loadTokens() {
  if (fs.existsSync(TOKEN_FILE)) {
    try { return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8')); } catch(e){}
  }
  return null;
}

function saveTokens(data) {
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function refreshAccessToken(tokens) {
  if (!tokens || !tokens.refresh_token) throw new Error("No refresh token available");
  
  // Read client credentials
  let clientKey = process.env.TIKTOK_CLIENT_KEY;
  let clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (fs.existsSync(ENV_FILE)) {
    const lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n');
    for (const l of lines) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) {
        if (m[1] === 'TIKTOK_CLIENT_KEY') clientKey = m[2].trim();
        if (m[1] === 'TIKTOK_CLIENT_SECRET') clientSecret = m[2].trim();
      }
    }
  }

  const querystring = require('querystring');
  const postData = querystring.stringify({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token
  });

  const res = await apiRequest('open.tiktokapis.com', '/v2/oauth/token/', 'POST', {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cache-Control': 'no-cache'
  }, postData);

  if (res && res.access_token) {
    const updated = { ...tokens, ...res, refreshedAt: new Date().toISOString() };
    saveTokens(updated);
    console.log("  ✓ TikTok access token refreshed successfully.");
    return updated.access_token;
  }
  throw new Error("Failed to refresh token: " + JSON.stringify(res));
}

function apiRequest(hostname, pathStr, method = 'GET', headers = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path: pathStr, method, headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function publishToTikTok(videoPath, caption, slug) {
  console.log(`\n[*] [TikTok Publisher] Initializing direct post for: ${slug}`);
  console.log(`  File: ${videoPath}`);
  
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file does not exist: ${videoPath}`);
  }

  const stat = fs.statSync(videoPath);
  const videoSize = stat.size;
  console.log(`  Video size: ${(videoSize / (1024 * 1024)).toFixed(2)} MB`);

  let tokens = loadTokens();
  if (!tokens || !tokens.access_token) {
    throw new Error("No TikTok tokens found. Please authorize via /auth/tiktok/callback first.");
  }

  let accessToken = tokens.access_token;

  // 1. Verify creator info
  console.log("  [*] Querying creator settings...");
  let creatorRes = await apiRequest('open.tiktokapis.com', '/v2/post/publish/creator_info/query/', 'POST', {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json; charset=UTF-8'
  }, JSON.stringify({}));

  if (creatorRes.error && creatorRes.error.code === 'access_token_invalid') {
    console.log("  [!] Access token expired. Refreshing...");
    accessToken = await refreshAccessToken(tokens);
    creatorRes = await apiRequest('open.tiktokapis.com', '/v2/post/publish/creator_info/query/', 'POST', {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8'
    }, JSON.stringify({}));
  }

  if (!creatorRes.data || creatorRes.error.code !== 'ok') {
    throw new Error(`TikTok creator query failed: ${JSON.stringify(creatorRes)}`);
  }

  const creatorName = creatorRes.data.creator_username || creatorRes.data.creator_nickname;
  console.log(`  ✓ Authenticated as: @${creatorName}`);

  // 2. Init post
  console.log("  [*] Initializing upload container...");
  
  // Note: Unaudited/sandbox TikTok apps can only post with privacy_level: "SELF_ONLY".
  // Once the Production app is approved by TikTok review, "PUBLIC_TO_EVERYONE" is accepted.
  let privacyLevel = process.env.TIKTOK_PRIVACY_LEVEL || "PUBLIC_TO_EVERYONE";

  async function attemptInit(level) {
    const initPayload = {
      post_info: {
        title: caption.slice(0, 150),
        privacy_level: level,
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1
      }
    };

    return await apiRequest('open.tiktokapis.com', '/v2/post/publish/video/init/', 'POST', {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8'
    }, JSON.stringify(initPayload));
  }

  let initRes = await attemptInit(privacyLevel);

  // If unaudited client error, fallback gracefully to SELF_ONLY
  if (initRes.error && initRes.error.code === 'unaudited_client_can_only_post_to_private_accounts' && privacyLevel !== 'SELF_ONLY') {
    console.log("  [!] App is in sandbox/unaudited mode. Falling back to privacy_level: SELF_ONLY...");
    privacyLevel = 'SELF_ONLY';
    initRes = await attemptInit(privacyLevel);
  }

  if (!initRes.data || !initRes.data.upload_url) {
    throw new Error(`TikTok upload init failed: ${JSON.stringify(initRes)}`);
  }

  const uploadUrl = initRes.data.upload_url;
  const publishId = initRes.data.publish_id;
  console.log(`  ✓ Container initialized! Publish ID: ${publishId}`);

  // 3. Upload file bytes to upload_url
  console.log("  [*] Uploading video stream to TikTok storage...");
  const uploadParsed = new URL(uploadUrl);
  
  await new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(videoPath);
    const ureq = https.request({
      hostname: uploadParsed.hostname,
      path: uploadParsed.pathname + uploadParsed.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
        'Content-Length': videoSize
      }
    }, (ures) => {
      let ubody = '';
      ures.on('data', c => ubody += c);
      ures.on('end', () => {
        if (ures.statusCode >= 200 && ures.statusCode < 300) {
          resolve(ubody);
        } else {
          reject(new Error(`Upload failed with status ${ures.statusCode}: ${ubody}`));
        }
      });
    });
    ureq.on('error', reject);
    fileStream.pipe(ureq);
  });

  console.log("  ✓ Video binary uploaded successfully!");

  // 4. Poll publish status
  console.log("  [*] Checking publish status...");
  let attempts = 0;
  while (attempts < 10) {
    await new Promise(r => setTimeout(r, 3000));
    attempts++;
    const statusRes = await apiRequest('open.tiktokapis.com', '/v2/post/publish/status/fetch/', 'POST', {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8'
    }, JSON.stringify({ publish_id: publishId }));

    const status = statusRes.data && statusRes.data.status;
    console.log(`  [Poll #${attempts}] Status: ${status}`);

    if (status === 'PUBLISH_COMPLETE') {
      console.log(`  🎉 TIKTOK VIDEO PUBLISHED LIVE! Publish ID: ${publishId}`);
      return { success: true, publishId, status };
    }
    if (status === 'FAILED') {
      throw new Error(`TikTok publish failed: ${JSON.stringify(statusRes)}`);
    }
  }

  console.log(`  ✓ Video upload accepted by TikTok (processing asynchronously). Publish ID: ${publishId}`);
  return { success: true, publishId, status: 'PROCESSING_UPLOAD' };
}

module.exports = { publishToTikTok };

// CLI direct test
if (require.main === module) {
  const testSlug = process.argv[2] || 'ikea-shipping-air';
  const testVideo = process.argv[3] || path.join(OUT_DIR, `${testSlug}-short.mp4`);
  const testCaption = "Every penny tells a story. #thelincolnpenny #uniteconomics #forensicbreakdown";
  publishToTikTok(testVideo, testCaption, testSlug)
    .then(r => console.log("Result:", r))
    .catch(e => { console.error("Error:", e); process.exit(1); });
}
