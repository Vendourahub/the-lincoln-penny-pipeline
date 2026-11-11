const fs = require('fs');
const path = require('path');
const { ROOT_DIR, OUT_DIR } = require('./env');

/**
 * Resolves Google / YouTube OAuth tokens with prioritized fallbacks.
 * Prevents mismatch between youtube_tokens_lincoln.json and youtube_tokens.json.
 */
function getYoutubeTokensPath() {
  const candidates = [
    path.join(ROOT_DIR, 'youtube_tokens_lincoln.json'),
    path.join(ROOT_DIR, 'youtube_tokens.json'),
    '/opt/faceless/youtube_tokens_lincoln.json',
    '/opt/faceless/youtube_tokens.json'
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0]; // default expected location
}

/**
 * Resolves Google client_secret.json path.
 */
function getYoutubeClientSecretPath() {
  const candidates = [
    path.join(ROOT_DIR, 'client_secret.json'),
    '/opt/faceless/client_secret.json'
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

/**
 * Resolves TikTok token path.
 */
function getTiktokTokensPath() {
  const candidates = [
    path.join(OUT_DIR, 'tiktok_token.json'),
    path.join(ROOT_DIR, 'tiktok_token.json'),
    '/opt/faceless/out/tiktok_token.json'
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

/**
 * Safety gate for publishing.
 * Never allow unreviewed or default public publishing without explicit confirmation.
 */
function assertPublishingSafety(platform, requestedPrivacyStatus, argv = process.argv) {
  const isConfirmedPublic = argv.includes('--confirm-public') || process.env.ALLOW_PUBLIC_PUBLISH === '1';

  if (requestedPrivacyStatus === 'public') {
    if (!isConfirmedPublic) {
      console.warn(`[SAFETY GATE] Overriding public visibility to 'private' for ${platform}. Pass --confirm-public to publish publicly.`);
      return 'private';
    }
    return 'public';
  }

  // Default to private / unlisted / draft
  return requestedPrivacyStatus || 'private';
}

module.exports = {
  getYoutubeTokensPath,
  getYoutubeClientSecretPath,
  getTiktokTokensPath,
  assertPublishingSafety
};
