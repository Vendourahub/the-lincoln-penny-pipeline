#!/usr/bin/env node
/**
 * Autonomous Multi-Channel Community Manager & Growth Agent
 * The Lincoln Penny (@thelincolnpenny / @lincolnpennystories)
 * 
 * Platforms supported:
 *   - YouTube Channel: UCFUGcnwtRN2O_fc5GY8AdPQ ("The Lincoln Penny")
 *   - Instagram: @lincolnpennystories (ID: 17841463206250115 / 29536356082616396)
 *   - Facebook Page: "The Lincoln Penny" (ID: 1154263411349161)
 * 
 * Capabilities:
 *   - Autonomous comment moderation & spam classification
 *   - Audience topic harvesting (feeds content pipeline into blueprint/research)
 *   - Autonomous brand engagement & helpful replies in brand voice
 *   - Growth audit & audience analytics tracking
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = '/opt/faceless';
const BP_DIR = path.join(ROOT, 'blueprint');
const OUT_DIR = path.join(ROOT, 'out');
const RESEARCH_DIR = path.join(BP_DIR, 'research');
const BRIEFS_DIR = path.join(RESEARCH_DIR, 'growth-briefs');

const dry = process.argv.includes('--dry-run');
const autoEngage = false; // Review-only: outbound replies require explicit authorization.

function classify(text = '') {
  const spam = /(?:(?:t\.me\/|wa\.link\/|cashapp|whatsapp|telegram).*?(?:guaranteed|double your|dm me|invest|crypto)|(?:guaranteed|double your).*?(?:returns|money|profit)|(?:check bio|click link in bio))/i.test(text);
  const isTopicRequest = /(?:can you do|please do|what about|make a video|cover|breakdown|explain the business of|how does .* make money)/i.test(text);
  
  return {
    kind: spam ? 'spam_review' : (isTopicRequest ? 'research_request' : 'reply_review'),
    text: text.slice(0, 4000),
    status: spam ? 'flagged_spam' : (isTopicRequest ? 'pipeline_candidate' : 'engaged')
  };
}

// Generate brand-aligned reply
function generateBrandReply(text, kind, authorName) {
  const name = authorName ? `@${authorName} ` : '';
  if (kind === 'research_request') {
    return `${name}Spot on suggestion. Every business has an overlooked lever that changes the whole unit economics — putting this onto our forensic breakdown investigation board! 🪙`;
  }
  
  if (/love this|great video|amazing|informative|good job/i.test(text)) {
    return `${name}Appreciate you watching! We believe every penny tells a story — glad the breakdown resonated with you. 🪙`;
  }

  if (/\?/i.test(text)) {
    return `${name}Great question. That's often where the conventional assumption breaks down and the real margin hides. More forensic breakdowns dropping daily! 🪙`;
  }

  return `${name}Thanks for watching and sharing your perspective! 🪙`;
}

function httpsRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, res => {
      let body = '';
      res.on('data', b => body += b);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          try { return reject(JSON.parse(body)); } catch(e) { return reject(new Error('HTTP ' + res.statusCode + ': ' + body)); }
        }
        try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
      });
    });
    req.setTimeout(25000, () => req.destroy(new Error('Network timeout')));
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function loadEnv() {
  const env = {};
  const envFile = path.join(ROOT, '.env');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && ['INSTAGRAM_ACCESS_TOKEN','INSTAGRAM_ACCOUNT_ID'].includes(m[1])) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim();
    }
  }
  return env;
}

// ========================================================
// 1. INSTAGRAM COMMUNITY MANAGEMENT
// ========================================================
async function instagram(mode, inbox, env) {
  const token = env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) throw new Error('Instagram credential unavailable');
  const base = 'https://graph.instagram.com/v21.0';

  const me = await httpsRequest(`${base}/me?fields=id,username,followers_count,media_count`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (me.username !== 'lincolnpennystories') throw new Error(`Wrong Instagram account: ${me.username}`);
  if (mode === '--growth-audit') {
    return { profile: me, platform: 'instagram' };
  }

  const posts = await httpsRequest(`${base}/${me.id}/media?fields=id,comments_count,caption&limit=50`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  let scanned = 0;
  let replied = 0;

  for (const post of posts.data || []) {
    if (!post.comments_count) continue;
    const comments = await httpsRequest(`${base}/${post.id}/comments?fields=id,text,from,timestamp,like_count&limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    for (const c of comments.data || []) {
      if (c.from?.username === me.username) continue; // Skip own comments
      const key = 'instagram:' + c.id;
      if (!inbox[key]) {
        const classified = classify(c.text);
        inbox[key] = {
          ...classified,
          platform: 'instagram',
          commentId: c.id,
          mediaId: post.id,
          author: c.from?.username || 'user',
          seenAt: new Date().toISOString()
        };
        scanned++;

        // Autonomous reply if enabled and not spam
        if (autoEngage && classified.kind !== 'spam_review' && !inbox[key].repliedAt && !dry) {
          try {
            const replyMsg = generateBrandReply(c.text, classified.kind, c.from?.username);
            const postParams = new URLSearchParams({ message: replyMsg, access_token: token }).toString();
            await httpsRequest(`${base}/${c.id}/replies`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }, postParams);
            inbox[key].repliedAt = new Date().toISOString();
            inbox[key].replyText = replyMsg;
            replied++;
            console.log(`  ✓ [Instagram] Replied to @${c.from?.username}: "${replyMsg}"`);
          } catch(err) {
            console.error(`  [!] [Instagram] Reply error on comment ${c.id}:`, err.message || err);
          }
        }
      }
    }
  }

  return { scanned, replied, moreMedia: !!posts.paging?.next };
}

// ========================================================
// 2. FACEBOOK PAGE COMMUNITY MANAGEMENT
// ========================================================
async function facebook(mode, inbox, env) {
  const token = env.FB_PAGE_TOKEN || env.META_SYSTEM_TOKEN;
  const pageId = env.FB_PAGE_ID || '1154263411349161';
  if (!token) throw new Error('Facebook credential unavailable');
  const base = 'https://graph.facebook.com/v21.0';

  const page = await httpsRequest(`${base}/${pageId}?fields=id,name,fan_count,followers_count&access_token=${token}`);
  if (mode === '--growth-audit') {
    return { page, platform: 'facebook' };
  }

  const feed = await httpsRequest(`${base}/${pageId}/feed?fields=id,message,comments{id,message,from,created_time}&limit=25&access_token=${token}`);
  let scanned = 0;
  let replied = 0;

  for (const item of feed.data || []) {
    const comments = item.comments?.data || [];
    for (const c of comments) {
      if (c.from?.id === pageId) continue;
      const key = 'facebook:' + c.id;
      if (!inbox[key]) {
        const classified = classify(c.message);
        inbox[key] = {
          ...classified,
          platform: 'facebook',
          commentId: c.id,
          postId: item.id,
          author: c.from?.name || 'user',
          seenAt: new Date().toISOString()
        };
        scanned++;

        if (autoEngage && classified.kind !== 'spam_review' && !inbox[key].repliedAt && !dry) {
          try {
            const replyMsg = generateBrandReply(c.message, classified.kind, c.from?.name);
            const postParams = new URLSearchParams({ message: replyMsg, access_token: token }).toString();
            await httpsRequest(`${base}/${c.id}/comments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }, postParams);
            inbox[key].repliedAt = new Date().toISOString();
            inbox[key].replyText = replyMsg;
            replied++;
            console.log(`  ✓ [Facebook] Replied on comment ${c.id}: "${replyMsg}"`);
          } catch(err) {
            console.error(`  [!] [Facebook] Reply error on comment ${c.id}:`, err.message || err);
          }
        }
      }
    }
  }

  return { scanned, replied };
}

// ========================================================
// 3. YOUTUBE COMMUNITY MANAGEMENT
// ========================================================
async function youtube(mode, inbox, env) {
  const { google } = require('googleapis');
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'client_secret.json'), 'utf8'));
  const cfg = raw.installed || raw.web;
  const auth = new google.auth.OAuth2(cfg.client_id, cfg.client_secret);
  auth.setCredentials(JSON.parse(fs.readFileSync(path.join(ROOT, 'youtube_tokens_lincoln.json'), 'utf8')));
  
  const yt = google.youtube({ version: 'v3', auth });
  const channel = (await yt.channels.list({ part: ['id', 'statistics', 'snippet'], mine: true })).data.items?.[0];
  if (channel?.id !== 'UCFUGcnwtRN2O_fc5GY8AdPQ') throw new Error(`Wrong YouTube channel: ${channel?.id}`);

  if (mode === '--growth-audit') {
    return { channel: { id: channel.id, title: channel.snippet.title, statistics: channel.statistics }, platform: 'youtube' };
  }

  const result = (await yt.commentThreads.list({
    part: ['snippet'],
    allThreadsRelatedToChannelId: channel.id,
    maxResults: 100,
    order: 'time',
    textFormat: 'plainText'
  })).data;

  let scanned = 0;
  let replied = 0;

  for (const thread of result.items || []) {
    const c = thread.snippet.topLevelComment;
    const s = c.snippet;
    if (s.authorChannelId?.value === channel.id) continue;
    const key = 'youtube:' + c.id;

    if (!inbox[key]) {
      const text = s.textOriginal || s.textDisplay || '';
      const classified = classify(text);
      inbox[key] = {
        ...classified,
        platform: 'youtube',
        commentId: c.id,
        videoId: s.videoId,
        author: s.authorDisplayName || 'user',
        seenAt: new Date().toISOString()
      };
      scanned++;

      if (autoEngage && classified.kind !== 'spam_review' && !inbox[key].repliedAt && !dry) {
        try {
          const replyMsg = generateBrandReply(text, classified.kind, s.authorDisplayName);
          await yt.comments.insert({
            part: ['snippet'],
            requestBody: {
              snippet: {
                parentId: c.id,
                textOriginal: replyMsg
              }
            }
          });
          inbox[key].repliedAt = new Date().toISOString();
          inbox[key].replyText = replyMsg;
          replied++;
          console.log(`  ✓ [YouTube] Replied to ${s.authorDisplayName}: "${replyMsg}"`);
        } catch(err) {
          console.error(`  [!] [YouTube] Reply error on comment ${c.id}:`, err.message || err);
        }
      }
    }
  }

  // Autonomous Viral Performance & Sequel Trigger Flywheel
  await analyzePerformanceAndTriggerSequels(yt, inbox);

  return { scanned, replied, moreComments: !!result.nextPageToken };
}

// ========================================================
// 4. VIRAL PERFORMANCE & SEQUEL TRIGGER FLYWHEEL
// ========================================================
async function analyzePerformanceAndTriggerSequels(yt, inbox) {
  const SEQUELS_DB = {
    'mcdonald': {
      brand: "McDonald's",
      sequelSlug: 'mcdonalds-taylor-machine-cut',
      sequelTopic: 'why McDonald soft-serve ice cream machines are always broken and the secret maintenance racket',
      exposeAngle: 'The secret FTC investigation and Taylor exclusive diagnostic repair lock'
    },
    'sony': {
      brand: 'Sony',
      sequelSlug: 'sony-spider-man-cut',
      sequelTopic: 'how Sony bought the film rights to Spider-Man for seven million dollars while rejecting all of Marvel for twenty five million',
      exposeAngle: 'The disastrous Marvel auction where Sony executives laughed at Iron Man'
    },
    'apple': {
      brand: 'Apple',
      sequelSlug: 'apple-battery-throttle-cut',
      sequelTopic: 'how the five hundred million dollar Apple battery lawsuit exposed secret slowdowns on older iPhones',
      exposeAngle: 'Secret code in iOS updates that halved clock speed when battery health dropped'
    },
    'starbucks': {
      brand: 'Starbucks',
      sequelSlug: 'starbucks-giftcard-bank-cut',
      sequelTopic: 'how Starbucks holds almost two billion dollars in unspent gift cards functioning as an unregulated bank',
      exposeAngle: 'The 100 million dollar annual breakage revenue earned without selling a drop of coffee'
    },
    'costco': {
      brand: 'Costco',
      sequelSlug: 'costco-rotisserie-chicken-cut',
      sequelTopic: 'why Costco deliberately loses forty million dollars a year on five dollar rotisserie chickens',
      exposeAngle: 'The strategic path past 4,000 high-margin items to reach the rear rotisserie'
    }
  };

  try {
    const channelId = 'UCFUGcnwtRN2O_fc5GY8AdPQ';
    const channelRes = await yt.channels.list({ part: ['contentDetails'], id: [channelId] });
    const uploadsId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return;

    const playlist = await yt.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: uploadsId,
      maxResults: 10
    });

    const vids = playlist.data.items || [];
    if (!vids.length) return;

    const ids = vids.map(v => v.contentDetails.videoId);
    const statsRes = await yt.videos.list({
      part: ['id', 'snippet', 'statistics'],
      id: ids
    });

    const videos = statsRes.data.items || [];
    console.log(`[*] Auditing performance across ${videos.length} recent channel Shorts...`);

    const qPath = path.join(ROOT, 'stickman_queue.txt');
    let qContent = fs.existsSync(qPath) ? fs.readFileSync(qPath, 'utf8') : '';

    for (const v of videos) {
      const views = parseInt(v.statistics?.viewCount || '0', 10);
      const comments = parseInt(v.statistics?.commentCount || '0', 10);
      const title = v.snippet?.title || '';

      const isTopPerformer = views > 50 || comments >= 1 || /mcdonald|sony|playstation/i.test(title);

      if (isTopPerformer) {
        let matchedBrand = null;
        for (const key of Object.keys(SEQUELS_DB)) {
          if (new RegExp(key, 'i').test(title)) {
            matchedBrand = key;
            break;
          }
        }

        if (matchedBrand) {
          const sequel = SEQUELS_DB[matchedBrand];
          if (!qContent.includes(sequel.sequelSlug)) {
            let topComment = null;
            for (const item of Object.values(inbox)) {
              if (item.videoId === v.id && item.kind !== 'spam_review') {
                topComment = item.text;
                break;
              }
            }

            const callbackHook = topComment
              ? `Our last video about ${sequel.brand} blew up and the comments were arguing: "${topComment.slice(0, 50)}..."`
              : `Our last video about ${sequel.brand} sparked a huge debate in the comments...`;

            console.log(`  🔥 [Viral Performer Detected] "${title}" (${views} views, ${comments} comments)`);
            console.log(`  🚀 [Sequel Auto-Queued] ${sequel.sequelSlug} | ${sequel.sequelTopic}`);
            console.log(`  💬 [Callback Hook Synthesized] "${callbackHook}"`);

            const newLine = `${sequel.sequelSlug}|${sequel.sequelTopic}\n`;
            qContent = newLine + qContent;
            fs.writeFileSync(qPath, qContent, 'utf8');

            fs.mkdirSync(BRIEFS_DIR, { recursive: true });
            const briefPath = path.join(BRIEFS_DIR, `${sequel.sequelSlug}-brief.json`);
            fs.writeFileSync(briefPath, JSON.stringify({
              triggeredByVideoId: v.id,
              originalTitle: title,
              brand: sequel.brand,
              slug: sequel.sequelSlug,
              topic: sequel.sequelTopic,
              exposeAngle: sequel.exposeAngle,
              callbackHook,
              queuedAt: new Date().toISOString()
            }, null, 2), 'utf8');
          }
        }
      }
    }
  } catch (err) {
    console.error('  [!] Error in analyzePerformanceAndTriggerSequels:', err.message || err);
  }
}

// ========================================================
// 5. FEED CONTENT CREATION PIPELINE
// ========================================================
function feedContentPipeline(inbox) {
  fs.mkdirSync(BRIEFS_DIR, { recursive: true });
  const audienceRequestsFile = path.join(RESEARCH_DIR, 'audience-topic-requests.json');
  
  let existingRequests = [];
  if (fs.existsSync(audienceRequestsFile)) {
    try { existingRequests = JSON.parse(fs.readFileSync(audienceRequestsFile, 'utf8')); } catch(e){}
  }

  const newRequests = [];
  for (const [key, item] of Object.entries(inbox)) {
    if (item.kind === 'research_request' && !item.harvestedToPipeline) {
      newRequests.push({
        sourceKey: key,
        platform: item.platform,
        text: item.text,
        author: item.author,
        discoveredAt: item.seenAt || new Date().toISOString()
      });
      item.harvestedToPipeline = true;
    }
  }

  if (newRequests.length > 0) {
    const combined = [...existingRequests, ...newRequests];
    fs.writeFileSync(audienceRequestsFile + '.tmp', JSON.stringify(combined, null, 2), 'utf8');
    fs.renameSync(audienceRequestsFile + '.tmp', audienceRequestsFile);
    console.log(`  💡 [Pipeline Feed] Harvested ${newRequests.length} new audience topic request(s) into research pipeline.`);
  }
}

// ========================================================
// 5. MAIN ORCHESTRATOR
// ========================================================
async function main() {
  const mode = process.argv[2] || '--moderate';
  if (!['--moderate', '--growth-audit'].includes(mode)) {
    throw new Error('Valid modes: --moderate or --growth-audit (with optional --engage / --dry-run)');
  }

  const env = loadEnv();
  const lock = path.join(OUT_DIR, 'community-review.lock');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const fd = fs.openSync(lock, 'wx');
  fs.writeFileSync(fd, String(process.pid));

  try {
    const reviewFile = path.join(OUT_DIR, 'community_review.json');
    const inbox = fs.existsSync(reviewFile) ? JSON.parse(fs.readFileSync(reviewFile, 'utf8')) : {};
    const report = {
      at: new Date().toISOString(),
      mode,
      action: autoEngage ? 'moderate_and_engage' : 'review_only',
      platforms: {},
      errors: {}
    };

    const runners = [
      ['youtube', youtube],
      ['instagram', instagram]
    ];

    for (const [name, fn] of runners) {
      try {
        console.log(`[*] Running ${name} community manager (${mode})...`);
        report.platforms[name] = await fn(mode, inbox, env);
      } catch(e) {
        console.error(`  [!] Error on ${name}:`, e.message || e);
        report.errors[name] = {
          code: e.code || null,
          message: e.message || 'Platform request failed'
        };
      }
    }

    if (!dry) {
      // Save updated inbox
      fs.writeFileSync(reviewFile + '.tmp', JSON.stringify(inbox, null, 2), 'utf8');
      fs.renameSync(reviewFile + '.tmp', reviewFile);

      // Feed topic requests to content pipeline
      // Review-only: do not promote viewer requests into the production pipeline.

      // Save health / audit report
      const healthFile = path.join(OUT_DIR, 'community_health.json');
      const health = fs.existsSync(healthFile) ? JSON.parse(fs.readFileSync(healthFile, 'utf8')) : {};
      health[mode] = report;
      fs.writeFileSync(healthFile + '.tmp', JSON.stringify(health, null, 2), 'utf8');
      fs.renameSync(healthFile + '.tmp', healthFile);
    }

    console.log("\n=======================================================");
    console.log("Community Management & Growth Audit Summary:");
    console.log(JSON.stringify(report, null, 2));
    console.log("=======================================================");

  } finally {
    fs.closeSync(fd);
    try { fs.unlinkSync(lock); } catch(e){}
  }
}

module.exports = { classify, generateBrandReply };

if (require.main === module) {
  main().catch(e => {
    console.error('Fatal community manager error:', e.message);
    process.exit(1);
  });
}
