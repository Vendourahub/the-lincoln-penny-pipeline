import { SemanticNarrativeCue, EvidenceCardConfig } from "../director/types";

export interface EpisodeClaim {
  claimId: string;
  claim: string;
  sourceUrl: string;
  sourceType: "primary" | "secondary";
  verified: boolean;
}

export interface EpisodeDialogueTurn {
  speaker: "host" | "insider";
  text: string;
  emotion?: string;
  intensity?: number;
}

export interface CanonicalEpisode {
  episodeId: string;
  format: "stickman-dialogue" | "documentary" | "forensic-teardown";
  status: "draft" | "audio_ready" | "directed" | "qa_passed" | "approved";
  title: string;
  topic: string;
  durationTargetSeconds: number;
  characters: ("host" | "insider")[];
  research: {
    centralQuestion: string;
    businessMechanism: string;
    verifiedFacts: EpisodeClaim[];
    doNotClaim: string[];
    verifiedAt: string;
  };
  dialogue: EpisodeDialogueTurn[];
  narrativeCues: SemanticNarrativeCue[];
  evidenceCards: EvidenceCardConfig[];
  audio: {
    provider: string;
    voiceHost: string;
    voiceInsider: string;
    masterAudioFile: string;
    durationSeconds: number;
    lufsTarget: number;
  };
  render: {
    width: number;
    height: number;
    fps: number;
    compositionId: string;
  };
  distribution: {
    approved: boolean;
    defaultPrivacy: "private" | "unlisted" | "public";
    platforms: ("youtube" | "instagram" | "tiktok" | "facebook")[];
  };
}

export function validateEpisode(episode: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!episode.episodeId || typeof episode.episodeId !== "string") {
    errors.push("Missing or invalid 'episodeId'");
  }
  if (!episode.title || typeof episode.title !== "string") {
    errors.push("Missing or invalid 'title'");
  }
  if (!Array.isArray(episode.characters) || episode.characters.length < 2) {
    errors.push("Episode must specify at least 2 characters (host, insider)");
  }
  if (!episode.research || !Array.isArray(episode.research.verifiedFacts) || episode.research.verifiedFacts.length === 0) {
    errors.push("Episode must contain verified research facts");
  }
  if (!episode.dialogue || !Array.isArray(episode.dialogue) || episode.dialogue.length === 0) {
    errors.push("Episode must contain dialogue turns");
  }
  if (!episode.render || episode.render.width !== 1080 || episode.render.height !== 1920) {
    errors.push("Render dimensions must be 1080x1920");
  }
  if (episode.distribution?.approved !== false && episode.distribution?.defaultPrivacy === "public") {
    errors.push("Safety violation: Unapproved episode cannot have defaultPrivacy set to 'public'");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
