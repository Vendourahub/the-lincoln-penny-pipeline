#!/usr/bin/env node
/**
 * Direct TikTok Publisher for Stickman & Blueprint Shorts
 * The Lincoln Penny (@thelincolnpenny)
 *
 * Usage:
 *   node publish_tiktok.js <video.mp4> [--desc "caption"]
 */

const fs = require('fs');
const path = require('path');
const { publishToTikTok } = require('./blueprint/tiktok_publisher');

const ROOT = __dirname;
const video = process.argv[2];
const arg = f => { const i = process.argv.indexOf(f); return i >= 0 ? process.argv[i + 1] : null; };

if (!video || !fs.existsSync(video)) {
  console.error('usage: node publish_tiktok.js <video.mp4> [--desc "caption"]');
  process.exit(1);
}

const desc = arg('--desc') || arg('--caption') || 'The Lincoln Penny — where your money really goes. #thelincolnpenny #business #finance';
const slug = path.basename(video).replace(/\.[^.]+$/, '');

(async () => {
  try {
    const res = await publishToTikTok(video, desc, slug);
    console.log(`  ✓ TIKTOK SUBMITTED: ${res.publishId} (${res.status})`);
  } catch(e) {
    console.error('  TikTok publish error:', e.message || e);
    // Exit cleanly if unaudited sandbox restriction so pipeline continues
    if (e.message && e.message.includes('unaudited_client')) {
      console.log('  [!] TikTok sandbox mode active: account must be private or app approved in review.');
    }
  }
})();
