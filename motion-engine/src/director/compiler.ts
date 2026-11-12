import { CompiledShot, SemanticNarrativeCue, CameraTransform, ShotType } from "./types";

interface DialogueLine {
  line: number;
  speaker: string;
  text: string;
  start: number;
  end: number;
  pauseAfter?: any;
}

const CAMERA_PRESETS: Record<string, CameraTransform> = {
  host_closeup: {
    startScale: 1.34,
    endScale: 1.37,
    startPanX: 205,
    endPanX: 210,
    startPanY: -70,
    endPanY: -72,
  },
  insider_closeup: {
    startScale: 1.34,
    endScale: 1.37,
    startPanX: -205,
    endPanX: -210,
    startPanY: -70,
    endPanY: -72,
  },
  host_reaction_shock: {
    startScale: 1.48,
    endScale: 1.51,
    startPanX: 225,
    endPanX: 228,
    startPanY: -95,
    endPanY: -98,
  },
  insider_reaction_smirk: {
    startScale: 1.40,
    endScale: 1.43,
    startPanX: -215,
    endPanX: -218,
    startPanY: -80,
    endPanY: -82,
  },
  evidence_split: {
    startScale: 1.02,
    endScale: 1.05,
    startPanX: 0,
    endPanX: 0,
    startPanY: 20,
    endPanY: 15,
  },
  establishing_wide: {
    startScale: 1.04,
    endScale: 1.07,
    startPanX: 0,
    endPanX: 0,
    startPanY: -15,
    endPanY: -20,
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
    const matchingCues = cues.filter((c) => c.lineIndex === i);
    const primaryCue = matchingCues[0];
    const secondaryCue = matchingCues[1];

    const isHost = line.speaker.toLowerCase() === "host";
    const lineStartFrame = Math.round(line.start * fps);
    const lineEndFrame = Math.round(line.end * fps);
    const nextLine = lines[i + 1];
    const turnEndFrame = nextLine ? Math.round(nextLine.start * fps) : lineEndFrame;
    const pauseFrames = turnEndFrame - lineEndFrame;

    // Helper: resolve shot properties from cue and speaker
    const resolveShot = (
      cue: SemanticNarrativeCue | undefined,
      startF: number,
      endF: number,
      idSuffix: string,
      isReactionBeat: boolean = false
    ): CompiledShot => {
      let shotType: ShotType = isHost ? "host_closeup" : "insider_closeup";
      let visualPriority = cue?.visualPriority || "speaker";
      let hostAction = isHost ? "explaining" : "listening";
      let insiderAction = isHost ? "listening" : "explaining";

      if (cue?.shotType) {
        shotType = cue.shotType;
      } else if (cue?.evidence || visualPriority === "evidence") {
        shotType = "evidence_split";
        hostAction = "lean_forward";
        insiderAction = "gesture_open";
      } else if (cue?.event.includes("two_shot") || cue?.event.includes("wide") || cue?.event.includes("hold")) {
        shotType = "establishing_wide";
        hostAction = cue.event.includes("disbelief") || cue.event.includes("deadpan") ? "deadpan" : "listening";
        insiderAction = cue.event.includes("disbelief") || cue.event.includes("deadpan") ? "deadpan" : "listening";
      } else if (visualPriority === "listener_reaction" || isReactionBeat) {
        if (isHost) {
          shotType = "insider_reaction_smirk";
          hostAction = "listening";
          insiderAction = "smirk";
        } else {
          shotType = "host_reaction_shock";
          hostAction = cue?.event.includes("deadpan") ? "deadpan" : "curious";
          insiderAction = "listening";
        }
      } else if (isHost) {
        shotType = "host_closeup";
        if (cue?.event.includes("challenge") || cue?.event.includes("inquiry") || cue?.event.includes("groceries")) {
          hostAction = "curious";
        } else if (cue?.event.includes("punchline") || cue?.event.includes("access") || cue?.event.includes("house")) {
          hostAction = "smirk";
        } else if (cue?.event.includes("deadpan") || cue?.event.includes("agreed")) {
          hostAction = "deadpan";
        } else {
          hostAction = "explaining";
        }
        insiderAction = "listening";
      } else {
        shotType = "insider_closeup";
        if (cue?.event.includes("revelation") || cue?.event.includes("payoff") || cue?.event.includes("subscription")) {
          insiderAction = "smirk";
          hostAction = "curious";
        } else if (cue?.event.includes("millions") || cue?.event.includes("yeah")) {
          insiderAction = "smirk";
          hostAction = "deadpan";
        } else {
          insiderAction = "explaining";
          hostAction = "listening";
        }
      }

      const camera = CAMERA_PRESETS[shotType] || CAMERA_PRESETS.establishing_wide;

      return {
        id: `shot_${i}_${idSuffix}`,
        startFrame: startF,
        endFrame: endF,
        shotType,
        speaker: isHost ? "host" : "insider",
        listener: isHost ? "insider" : "host",
        visualPriority,
        camera,
        hostAction: hostAction as any,
        insiderAction: insiderAction as any,
        evidenceCard: cue?.evidence,
        captionMode: "word_locked",
      };
    };

    // If there is an intentional silence beat (>= 0.4s / 12 frames) after the spoken line:
    // Split into Spoken Shot + Comedic Reaction/Hold Shot!
    if (pauseFrames >= 12) {
      // 1. Spoken beat
      compiledShots.push(resolveShot(primaryCue, lineStartFrame, lineEndFrame, "speech"));

      // 2. Silence / Reaction beat
      const reactionCue = secondaryCue || primaryCue;
      let holdCue = reactionCue;
      // If the line has deadpan or disbelief pause: force two-shot deadpan hold
      if (typeof line.pauseAfter === "object" || pauseFrames >= 25) {
        holdCue = {
          event: "deadpan_two_shot_hold",
          lineIndex: i,
          visualPriority: "listener_reaction",
        };
      }
      compiledShots.push(resolveShot(holdCue, lineEndFrame, turnEndFrame, "hold", true));
    } else {
      // Single continuous shot covering line through natural micro-turn
      compiledShots.push(resolveShot(primaryCue, lineStartFrame, turnEndFrame, "full"));
    }
  }

  return compiledShots;
}

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
