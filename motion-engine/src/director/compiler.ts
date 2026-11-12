import { CompiledShot, SemanticNarrativeCue, CameraTransform, ShotType } from "./types";

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

    // Dynamic Semantic Shot Resolution
    let shotType: ShotType = isHost ? "host_closeup" : "insider_closeup";
    let visualPriority = cue.visualPriority || "speaker";
    let hostAction = isHost ? "explaining" : "listening";
    let insiderAction = isHost ? "listening" : "explaining";

    if (cue.shotType) {
      shotType = cue.shotType;
    } else if (visualPriority === "evidence" || cue.evidence) {
      shotType = "evidence_split";
      hostAction = "lean_forward";
      insiderAction = "gesture_open";
    } else if (visualPriority === "listener_reaction") {
      if (isHost) {
        shotType = "insider_reaction_smirk";
        hostAction = "listening";
        insiderAction = "smirk";
      } else {
        shotType = "host_reaction_shock";
        hostAction = "shock";
        insiderAction = "smirk";
      }
    } else if (cue.event.includes("two_shot") || cue.event.includes("wide") || cue.event.includes("hold")) {
      shotType = "establishing_wide";
      hostAction = cue.event.includes("disbelief") || cue.event.includes("deadpan") ? "deadpan" : "listening";
      insiderAction = cue.event.includes("disbelief") || cue.event.includes("deadpan") ? "deadpan" : "listening";
    } else if (isHost) {
      shotType = "host_closeup";
      if (cue.event.includes("challenge") || cue.event.includes("inquiry") || cue.event.includes("groceries")) {
        hostAction = "curious";
      } else if (cue.event.includes("punchline") || cue.event.includes("access") || cue.event.includes("house")) {
        hostAction = "smirk";
      } else if (cue.event.includes("deadpan") || cue.event.includes("agreed")) {
        hostAction = "deadpan";
      } else {
        hostAction = "explaining";
      }
      insiderAction = "listening";
    } else {
      shotType = "insider_closeup";
      if (cue.event.includes("revelation") || cue.event.includes("payoff") || cue.event.includes("subscription")) {
        insiderAction = "smirk";
        hostAction = "curious";
      } else if (cue.event.includes("millions") || cue.event.includes("yeah")) {
        insiderAction = "smirk";
        hostAction = "deadpan";
      } else {
        insiderAction = "explaining";
        hostAction = "listening";
      }
    }

    const camera = CAMERA_PRESETS[shotType] || CAMERA_PRESETS.establishing_wide;

    compiledShots.push({
      id: `shot_${i}_${cue.event}`,
      startFrame,
      endFrame,
      shotType,
      speaker: isHost ? "host" : "insider",
      listener: isHost ? "insider" : "host",
      visualPriority,
      camera,
      hostAction: hostAction as any,
      insiderAction: insiderAction as any,
      evidenceCard: cue.evidence,
      captionMode: "word_locked",
    });
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
