import { SemanticNarrativeCue } from "./types";
import costcoEpisodeData from "../../../episodes/costco-hotdog-002.json";
import mcdonaldsEpisodeData from "../../../episodes/mcdonalds-real-estate-001.json";
import costcoLines from "../../public/episodes/costco-hotdog-002/lines.json";
import costcoWords from "../../public/episodes/costco-hotdog-002/words.json";
import mcdonaldsLines from "../../public/episodes/mcdonalds-real-estate-001/lines.json";
import mcdonaldsWords from "../../public/episodes/mcdonalds-real-estate-001/words.json";

export interface EpisodeManifest {
  episodeId: string;
  title: string;
  audioSrc: string;
  lines: Array<{
    line: number;
    speaker: string;
    text: string;
    start: number;
    end: number;
    performanceDirection?: string;
  }>;
  words: Array<{
    word: string;
    start: number;
    end: number;
    speaker?: string;
  }>;
  narrativeCues: SemanticNarrativeCue[];
  durationInFrames: number;
}

// Transform lines to ensure uniform `line` index
function normalizeLines(rawLines: any[]): EpisodeManifest["lines"] {
  return rawLines.map((l, idx) => ({
    line: typeof l.line === "number" ? l.line : (l.lineIndex ?? idx),
    speaker: l.speaker,
    text: l.text,
    start: l.start,
    end: l.end,
    performanceDirection: l.performanceDirection,
  }));
}

export const EPISODE_MANIFESTS: Record<string, EpisodeManifest> = {
  "costco-hotdog-002": {
    episodeId: "costco-hotdog-002",
    title: costcoEpisodeData.title,
    audioSrc: "episodes/costco-hotdog-002/audio.mp3",
    lines: normalizeLines(costcoLines),
    words: (costcoWords as any).words || costcoWords,
    narrativeCues: costcoEpisodeData.narrativeCues as SemanticNarrativeCue[],
    durationInFrames: Math.ceil((costcoLines[costcoLines.length - 1].end + 0.8) * 30),
  },
  "mcdonalds-real-estate-001": {
    episodeId: "mcdonalds-real-estate-001",
    title: mcdonaldsEpisodeData.title,
    audioSrc: "episodes/mcdonalds-real-estate-001/audio.mp3",
    lines: normalizeLines(mcdonaldsLines),
    words: (mcdonaldsWords as any).words || mcdonaldsWords,
    narrativeCues: (mcdonaldsEpisodeData as any).narrativeCues as SemanticNarrativeCue[],
    durationInFrames: Math.ceil((mcdonaldsLines[mcdonaldsLines.length - 1].end + 0.5) * 30),
  },
};

export function getEpisodeManifest(episodeId: string = "costco-hotdog-002"): EpisodeManifest {
  return EPISODE_MANIFESTS[episodeId] || EPISODE_MANIFESTS["costco-hotdog-002"];
}
