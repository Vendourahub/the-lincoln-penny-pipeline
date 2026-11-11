/**
 * Canonical Voice Profiles for The Lincoln Penny
 * Defines persistent voice identities across supported TTS providers (Edge-TTS, Gemini, Kokoro).
 */

const VOICE_PROFILES = {
  host: {
    character: "host",
    name: "The Host (Skeptical, Inquisitive, Expressive)",
    primary: {
      provider: "edge-tts",
      model: "neural",
      voiceId: "en-US-GuyNeural",
      rate: "+6%",
      pitch: "+2Hz",
      expressiveness: 0.85,
    },
    fallback: {
      provider: "gemini",
      model: "gemini-2.5-flash-preview-tts",
      voiceId: "Puck",
      expressiveness: 0.8,
    },
    pronunciationDict: {
      "McDonald's": "mic-DON-alds",
      "Kroc": "KRAHK",
      "real estate": "REEL-eh-state",
    },
  },
  insider: {
    character: "insider",
    name: "The Insider (Composed, Authoritative, Dry-witted)",
    primary: {
      provider: "edge-tts",
      model: "neural",
      voiceId: "en-US-ChristopherNeural",
      rate: "+2%",
      pitch: "-1Hz",
      expressiveness: 0.75,
    },
    fallback: {
      provider: "gemini",
      model: "gemini-2.5-flash-preview-tts",
      voiceId: "Charon",
      expressiveness: 0.75,
    },
    pronunciationDict: {
      "franchisee": "fran-chy-ZEE",
      "royalties": "ROY-al-tees",
      "monopoly": "muh-NAH-puh-lee",
    },
  },
};

function getVoiceProfile(role = "host") {
  const key = role.toLowerCase() === "guest" ? "insider" : role.toLowerCase();
  return VOICE_PROFILES[key] || VOICE_PROFILES.host;
}

module.exports = {
  VOICE_PROFILES,
  getVoiceProfile,
};
