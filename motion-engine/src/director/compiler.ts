import { CompiledShot, SemanticNarrativeCue, CameraTransform } from "./types";

interface DialogueLine {
  line: number;
  speaker: string;
  text: string;
  start: number;
  end: number;
}

const CAMERA_PRESETS: Record<string, CameraTransform> = {
  host_closeup: {
    startScale: 1.20,
    endScale: 1.24,
    startPanX: 175,
    endPanX: 185,
    startPanY: -20,
    endPanY: -22,
  },
  insider_closeup: {
    startScale: 1.21,
    endScale: 1.25,
    startPanX: -175,
    endPanX: -185,
    startPanY: -20,
    endPanY: -22,
  },
  host_reaction_shock: {
    startScale: 1.36,
    endScale: 1.40,
    startPanX: 215,
    endPanX: 220,
    startPanY: -38,
    endPanY: -42,
  },
  insider_reaction_smirk: {
    startScale: 1.23,
    endScale: 1.26,
    startPanX: -165,
    endPanX: -170,
    startPanY: -20,
    endPanY: -22,
  },
  evidence_split: {
    startScale: 1.02,
    endScale: 1.06,
    startPanX: 0,
    endPanX: 0,
    startPanY: 0,
    endPanY: -10,
  },
  establishing_wide: {
    startScale: 1.0,
    endScale: 1.03,
    startPanX: 0,
    endPanX: 0,
    startPanY: 0,
    endPanY: 0,
  },
};

/**
 * Compiles dialogue lines and semantic narrative cues into a frame-addressable shot timeline
 */
export function compileEpisodeTimeline(
  lines: DialogueLine[],
  cues: SemanticNarrativeCue[],
  fps: number = 30
): CompiledShot[] {
  const compiledShots: CompiledShot[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cue = cues.find((c) => c.lineIndex === i);
    const startFrame = Math.round(line.start * fps);
    // Expand endFrame to meet next line's startFrame to avoid dead frames between turns
    const nextLine = lines[i + 1];
    const endFrame = nextLine ? Math.round(nextLine.start * fps) : Math.round(line.end * fps);

    const isHost = line.speaker.toLowerCase() === "host";

    if (!cue) {
      // Default to speaker close-up
      const shotType = isHost ? "host_closeup" : "insider_closeup";
      compiledShots.push({
        id: `shot_${i}_default`,
        startFrame,
        endFrame,
        shotType,
        speaker: isHost ? "host" : "insider",
        listener: isHost ? "insider" : "host",
        visualPriority: "speaker",
        camera: CAMERA_PRESETS[shotType],
        hostAction: isHost ? "explaining" : "listening",
        insiderAction: isHost ? "listening" : "explaining",
        captionMode: "word_locked",
      });
      continue;
    }

    switch (cue.event) {
      case "inquiry_intro":
        compiledShots.push({
          id: `shot_${i}_inquiry_intro`,
          startFrame,
          endFrame,
          shotType: "host_closeup",
          speaker: "host",
          listener: "insider",
          visualPriority: "speaker",
          camera: CAMERA_PRESETS.host_closeup,
          hostAction: "explaining",
          insiderAction: "listening",
          captionMode: "word_locked",
        });
        break;

      case "unexpected_revelation":
        compiledShots.push({
          id: `shot_${i}_revelation`,
          startFrame,
          endFrame,
          shotType: "insider_closeup",
          speaker: "insider",
          listener: "host",
          visualPriority: "speaker",
          camera: CAMERA_PRESETS.insider_closeup,
          hostAction: "curious",
          insiderAction: "explaining",
          captionMode: "word_locked",
        });
        break;

      case "reaction_disbelief":
        compiledShots.push({
          id: `shot_${i}_shock`,
          startFrame,
          endFrame,
          shotType: "host_reaction_shock",
          speaker: "host",
          listener: "insider",
          visualPriority: "listener_reaction",
          camera: CAMERA_PRESETS.host_reaction_shock,
          hostAction: "shock",
          insiderAction: "smirk",
          captionMode: "word_locked",
        });
        break;

      case "evidence_breakdown":
        compiledShots.push({
          id: `shot_${i}_evidence`,
          startFrame,
          endFrame,
          shotType: "evidence_split",
          speaker: "insider",
          listener: "host",
          visualPriority: "evidence",
          camera: CAMERA_PRESETS.evidence_split,
          hostAction: "lean_forward",
          insiderAction: "gesture_open",
          evidenceCard: cue.evidence,
          captionMode: "word_locked",
        });
        break;

      case "clarifying_challenge":
        compiledShots.push({
          id: `shot_${i}_challenge`,
          startFrame,
          endFrame,
          shotType: "host_closeup",
          speaker: "host",
          listener: "insider",
          visualPriority: "speaker",
          camera: CAMERA_PRESETS.host_closeup,
          hostAction: "curious",
          insiderAction: "listening",
          captionMode: "word_locked",
        });
        break;

      case "monopoly_payoff":
        compiledShots.push({
          id: `shot_${i}_payoff`,
          startFrame,
          endFrame,
          shotType: "insider_reaction_smirk",
          speaker: "insider",
          listener: "host",
          visualPriority: "speaker",
          camera: CAMERA_PRESETS.insider_reaction_smirk,
          hostAction: "listening",
          insiderAction: "smirk",
          evidenceCard: cue.evidence,
          captionMode: "word_locked",
        });
        break;
    }
  }

  return compiledShots;
}

/**
 * Pure frame-addressable lookup helper
 * Remotion can request any frame out of order and receive deterministic camera transforms and character states.
 */
export function getShotAtFrame(
  shots: CompiledShot[],
  frame: number
): {
  shot: CompiledShot;
  progress: number;
  cameraScale: number;
  cameraPanX: number;
  cameraPanY: number;
} {
  const activeShot =
    shots.find((s) => frame >= s.startFrame && frame < s.endFrame) || shots[shots.length - 1];

  const duration = Math.max(1, activeShot.endFrame - activeShot.startFrame);
  const progress = Math.max(0, Math.min(1, (frame - activeShot.startFrame) / duration));

  // Hermite smooth interpolation for camera motion within shot
  const smooth = progress * progress * (3 - 2 * progress);

  const { camera } = activeShot;
  const cameraScale = camera.startScale + (camera.endScale - camera.startScale) * smooth;
  const cameraPanX = camera.startPanX + (camera.endPanX - camera.startPanX) * smooth;
  const cameraPanY = camera.startPanY + (camera.endPanY - camera.startPanY) * smooth;

  return {
    shot: activeShot,
    progress,
    cameraScale,
    cameraPanX,
    cameraPanY,
  };
}
