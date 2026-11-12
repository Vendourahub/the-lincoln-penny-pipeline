/**
 * THE LINCOLN PENNY — ILLUSTRATED CUTOUT RIG CONTRACT
 * Strictly complies with docs/LINCOLN_PENNY_CHARACTER_ART_DIRECTION.md
 */

export type CharacterId = "host" | "insider";

export type ExpressionState =
  | "neutral"
  | "curious"
  | "skeptical"
  | "deadpan"
  | "suppressed_laughter"
  | "surprised";

export type GazeTarget =
  | "camera"
  | "other_host"
  | "up_thinking"
  | "down_notes"
  | "shock_wide";

export type EyelidState =
  | "wide_open"
  | "neutral"
  | "half_lidded"
  | "deadpan"
  | "closed_blink";

export type HandPose =
  | "desk_flat"
  | "point_forward"
  | "chin_listen"
  | "open_gesture"
  | "mug_hold";

export type CharacterPose =
  | "seated_neutral"
  | "seated_lean_forward"
  | "seated_slouch"
  | "seated_chin_on_hand"
  | "seated_turn_to_host"
  | "standing_lineup";

export interface CutoutCharacterProps {
  id: CharacterId;
  pose?: CharacterPose;
  expression?: ExpressionState;
  gaze?: GazeTarget;
  eyelid?: EyelidState;
  leftHand?: HandPose;
  rightHand?: HandPose;
  viseme?: string;
  mouthOpen?: number; // 0.0 (closed) to 1.0 (open)
  scale?: number;
  flipX?: boolean;
  silhouetteOnly?: boolean; // Must pass the silhouette gate
  frame?: number;
  breathingEnabled?: boolean;
}
