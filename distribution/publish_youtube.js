#!/usr/bin/env node
/*
 * publish_youtube.js — publish a vertical stickman clip as a YouTube SHORT
 * on The Lincoln Penny channel, reusing the existing OAuth refresh token.
 * Vertical + under 3 min + "#Shorts" => YouTube classifies it as a Short automatically.
 * If LONGFORM_PLAYLIST_URL is set in .env, a funnel CTA to the full-breakdowns playlist
 * is appended to the description (Shorts -> long-form funnel).
 *
 * SAFETY DEFAULT:
 *   Uploads default to 'private' to prevent accidental unreviewed public distribution.
 *   Pass --confirm-public to publish publicly.
 *
 *   node publish_youtube.js <video.mp4> --title "HOOK TEXT" [--desc "..."] [--tags "a,b,c"] [--confirm-public] [--dry-run]
 *
 * Auth resolved via config/credentials.js:
 *   client_secret.json + youtube_tokens_lincoln.json (or fallback youtube_tokens.json)
 * Writes out/<slug>.youtube-short.json on success.
 */
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { ROOT_DIR, OUT_DIR } = require('../config/env');
const { getYoutubeTokensPath, getYoutubeClientSecretPath, assertPublishingSafety } = require('../config/credentials');

const CHANNEL = process.env.YOUTUBE_CHANNEL_ID || 'UCFUGcnwtRN2O_fc5GY8AdPQ'; // The Lincoln Penny
const SECRET = getYoutubeClientSecretPath();
const TOKENS = getYoutubeTokensPath();
const PLAYLIST = (process.env.LONGFORM_PLAYLIST_URL || '').trim();

const arg = f => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : null; };
const isDryRun = process.argv.includes('--dry-run');
const video = process.argv[2];

if (!video || !fs.existsSync(video)) {
  console.error('usage: node publish_youtube.js <video.mp4> --title "..." [--desc ..] [--tags a,b,c] [--confirm-public] [--dry-run]');
  process.exit(1);
}

const rawTitle = (arg('--title') || '').trim();
if (!rawTitle) { console.error('  YT: --title is required'); process.exit(1); }
let title = rawTitle;
if (!/#shorts/i.test(title)) {
  const suffix = ' #Shorts';
  if ((title + suffix).length > 100) title = title.slice(0, 100 - suffix.length).trim();
  title = title + suffix;
} else if (title.length > 100) {
  title = title.slice(0, 100).trim();
}

const tags = (arg('--tags') || 'business,money,finance,economics,shorts').split(',').map(s => s.trim()).filter(Boolean);
const baseDesc = (arg('--desc') || 'The Lincoln Penny — where your money really goes.').trim();
const funnel = PLAYLIST ? `\n\n📊 Full breakdown of where the REST of your money goes:\n${PLAYLIST}` : '';
const description = `${baseDesc}${funnel}\n\n#Shorts #business #money #finance #economics #sidehustle`;

const requestedPrivacy = arg('--privacy') || 'public';
const privacyStatus = assertPublishingSafety('youtube', requestedPrivacy, process.argv);

console.log(`[YouTube Publisher] Video: ${video}`);
console.log(`[YouTube Publisher] Title: ${title}`);
console.log(`[YouTube Publisher] Target Privacy: ${privacyStatus}`);
console.log(`[YouTube Publisher] Credentials: ${TOKENS} | Secret: ${SECRET}`);

if (isDryRun) {
  console.log(`[YouTube Publisher] Dry-run enabled. Skipping network upload.`);
  process.exit(0);
}

(async () => {
  try {
    if (!fs.existsSync(SECRET)) throw new Error(`client_secret.json not found at ${SECRET}`);
    if (!fs.existsSync(TOKENS)) throw new Error(`YouTube tokens not found at ${TOKENS}`);

    const raw = JSON.parse(fs.readFileSync(SECRET, 'utf8'));
    const c = raw.installed || raw.web || raw;
    const auth = new google.auth.OAuth2(c.client_id, c.client_secret, (c.redirect_uris && c.redirect_uris[0]) || 'http://localhost');
    auth.setCredentials(JSON.parse(fs.readFileSync(TOKENS, 'utf8')));
    const yt = google.youtube({ version: 'v3', auth });

    const ch = (await yt.channels.list({ part: ['id'], mine: true })).data.items[0];
    if (!ch || ch.id !== CHANNEL) throw new Error('wrong channel: ' + (ch && ch.id));

    const res = await yt.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: { title, description, tags, categoryId: '27', defaultLanguage: 'en', defaultAudioLanguage: 'en' },
        status: { privacyStatus, selfDeclaredMadeForKids: false, madeForKids: false },
      },
      media: { body: fs.createReadStream(video) },
    });

    const id = res.data.id;
    const slug = path.basename(video).replace(/\.[^.]+$/, '').replace(/-stickman$/, '');
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, slug + '.youtube-short.json'),
      JSON.stringify({ platform: 'youtube_short', videoId: id, title, privacyStatus, url: 'https://youtu.be/' + id, at: Date.now() }, null, 2));
    console.log(`  ✓ YT SHORT published (${privacyStatus}): https://youtu.be/${id}  (${title})`);
  } catch (e) {
    const msg = (e && e.errors && e.errors[0] && e.errors[0].reason) ? `${e.errors[0].reason}: ${e.message}` : (e.message || String(e));
    console.error('  YT short failed:', msg);
    process.exit(1);
  }
})();
