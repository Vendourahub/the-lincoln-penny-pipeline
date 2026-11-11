import { CharacterActionState } from "../characters/types";

export type ShotType =
  | "establishing_wide"
  | "two_shot_medium"
  | "host_closeup"
  | "insider_closeup"
  | "host_reaction_shock"
  | "insider_reaction_smirk"
  | "evidence_split";

export type VisualPriority = "speaker" | "listener_reaction" | "evidence";

export interface CameraTransform {
  startScale: number;
  endScale: number;
  startPanX: number;
  endPanX: number;
  startPanY: number;
  endPanY: number;
}

export interface EvidenceCardConfig {
  title: string;
  subtitle?: string;
  statNumber?: string;
  statLabel?: string;
  imageSrc?: string;
}

export interface CompiledShot {
  id: string;
  startFrame: number;
  endFrame: number;
  shotType: ShotType;
  speaker: "host" | "insider" | "none";
  listener: "host" | "insider" | "none";
  visualPriority: VisualPriority;
  camera: CameraTransform;
  hostAction: CharacterActionState;
  insiderAction: CharacterActionState;
  evidenceCard?: EvidenceCardConfig;
  captionMode: "word_locked" | "headline" | "none";
}

export interface SemanticNarrativeCue {
  event:
    | "inquiry_intro"
    | "unexpected_revelation"
    | "reaction_disbelief"
    | "evidence_breakdown"
    | "clarifying_challenge"
    | "monopoly_payoff";
  lineIndex: number;
  visualPriority: VisualPriority;
  evidence?: EvidenceCardConfig;
}
