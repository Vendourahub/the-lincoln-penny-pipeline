import { CharacterRole, SkeletalPose, MouthViseme, CharacterActionState } from "./types";

/**
 * Seated Default Resting Poses for Host (left side) and Insider (right side)
 */
export const DEFAULT_HOST_IDLE: SkeletalPose = {
  torsoLean: 4, // slight engaged lean
  torsoOffset: 0,
  headTilt: 2,
  headTurn: 0.3, // looking slightly right toward Insider
  leftArm: {
    shoulderAngle: 25,
    elbowAngle: 75,
    wristAngle: 0,
    hand: "flat_desk",
  },
  rightArm: {
    shoulderAngle: 28,
    elbowAngle: 80,
    wristAngle: 0,
    hand: "flat_desk",
  },
  face: {
    browLeftY: 0,
    browLeftAngle: 0,
    browRightY: 0,
    browRightAngle: 0,
    eyeScale: 1.0,
    eyeBlink: 0,
    pupilX: 0.35,
    pupilY: 0,
    mouthViseme: "rest",
    mouthOpen: 0,
  },
};

export const DEFAULT_INSIDER_IDLE: SkeletalPose = {
  torsoLean: -2, // relaxed composed upright posture
  torsoOffset: 0,
  headTilt: -1,
  headTurn: -0.3, // looking slightly left toward Host
  leftArm: {
    shoulderAngle: 24,
    elbowAngle: 78,
    wristAngle: 0,
    hand: "flat_desk",
  },
  rightArm: {
    shoulderAngle: 22,
    elbowAngle: 72,
    wristAngle: 0,
    hand: "flat_desk",
  },
  face: {
    browLeftY: 1,
    browLeftAngle: -2,
    browRightY: 1,
    browRightAngle: 2,
    eyeScale: 0.95,
    eyeBlink: 0,
    pupilX: -0.35,
    pupilY: 0,
    mouthViseme: "rest",
    mouthOpen: 0,
  },
};

/**
 * Linear angle interpolation handling shortest angular path
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function interpolatePose(a: SkeletalPose, b: SkeletalPose, t: number): SkeletalPose {
  const clampT = Math.max(0, Math.min(1, t));
  return {
    torsoLean: lerp(a.torsoLean, b.torsoLean, clampT),
    torsoOffset: lerp(a.torsoOffset, b.torsoOffset, clampT),
    headTilt: lerp(a.headTilt, b.headTilt, clampT),
    headTurn: lerp(a.headTurn, b.headTurn, clampT),
    leftArm: {
      shoulderAngle: lerp(a.leftArm.shoulderAngle, b.leftArm.shoulderAngle, clampT),
      elbowAngle: lerp(a.leftArm.elbowAngle, b.leftArm.elbowAngle, clampT),
      wristAngle: lerp(a.leftArm.wristAngle, b.leftArm.wristAngle, clampT),
      hand: clampT < 0.5 ? a.leftArm.hand : b.leftArm.hand,
    },
    rightArm: {
      shoulderAngle: lerp(a.rightArm.shoulderAngle, b.rightArm.shoulderAngle, clampT),
      elbowAngle: lerp(a.rightArm.elbowAngle, b.rightArm.elbowAngle, clampT),
      wristAngle: lerp(a.rightArm.wristAngle, b.rightArm.wristAngle, clampT),
      hand: clampT < 0.5 ? a.rightArm.hand : b.rightArm.hand,
    },
    face: {
      browLeftY: lerp(a.face.browLeftY, b.face.browLeftY, clampT),
      browLeftAngle: lerp(a.face.browLeftAngle, b.face.browLeftAngle, clampT),
      browRightY: lerp(a.face.browRightY, b.face.browRightY, clampT),
      browRightAngle: lerp(a.face.browRightAngle, b.face.browRightAngle, clampT),
      eyeScale: lerp(a.face.eyeScale, b.face.eyeScale, clampT),
      eyeBlink: lerp(a.face.eyeBlink, b.face.eyeBlink, clampT),
      pupilX: lerp(a.face.pupilX, b.face.pupilX, clampT),
      pupilY: lerp(a.face.pupilY, b.face.pupilY, clampT),
      mouthViseme: clampT < 0.5 ? a.face.mouthViseme : b.face.mouthViseme,
      mouthOpen: lerp(a.face.mouthOpen, b.face.mouthOpen, clampT),
    },
  };
}

/**
 * Returns distinct key poses for states according to character identity
 */
export function getBasePoseForState(role: CharacterRole, state: CharacterActionState): SkeletalPose {
  const isHost = role === "host";

  switch (state) {
    case "idle":
    case "listening":
      return isHost ? {
        ...DEFAULT_HOST_IDLE,
        torsoLean: 6,
        headTurn: 0.45,
        face: {
          ...DEFAULT_HOST_IDLE.face,
          pupilX: 0.5,
          browLeftY: 2,
          browRightY: 2,
        }
      } : {
        ...DEFAULT_INSIDER_IDLE,
        torsoLean: -1,
        headTurn: -0.4,
        face: {
          ...DEFAULT_INSIDER_IDLE.face,
          pupilX: -0.5,
        }
      };

    case "curious":
      return isHost ? {
        torsoLean: 14, // leans noticeably toward partner
        torsoOffset: -6,
        headTilt: 12, // inquisitive head tilt
        headTurn: 0.55,
        leftArm: {
          shoulderAngle: 25,
          elbowAngle: 75,
          wristAngle: 0,
          hand: "flat_desk",
        },
        rightArm: {
          shoulderAngle: 55, // raises hand toward chin
          elbowAngle: 110,
          wristAngle: -15,
          hand: "chin",
        },
        face: {
          browLeftY: 8, // raised left brow
          browLeftAngle: -8,
          browRightY: 3,
          browRightAngle: 4,
          eyeScale: 1.15,
          eyeBlink: 0,
          pupilX: 0.6,
          pupilY: -0.2,
          mouthViseme: "open_o",
          mouthOpen: 0.35,
        },
      } : {
        ...DEFAULT_INSIDER_IDLE,
        headTilt: -6,
        face: {
          ...DEFAULT_INSIDER_IDLE.face,
          browRightY: 6,
          pupilX: -0.5,
        }
      };

    case "explaining":
      return isHost ? {
        torsoLean: 10,
        torsoOffset: -2,
        headTilt: 4,
        headTurn: 0.4,
        leftArm: { shoulderAngle: 30, elbowAngle: 80, wristAngle: 0, hand: "flat_desk" },
        rightArm: { shoulderAngle: 45, elbowAngle: 75, wristAngle: 10, hand: "open" },
        face: { ...DEFAULT_HOST_IDLE.face, mouthViseme: "wide_ee", mouthOpen: 0.5 }
      } : {
        torsoLean: 3, // slightly forward, confident
        torsoOffset: -4,
        headTilt: -4,
        headTurn: -0.45,
        leftArm: {
          shoulderAngle: 25,
          elbowAngle: 78,
          wristAngle: 0,
          hand: "flat_desk",
        },
        rightArm: {
          shoulderAngle: 42, // deliberate open-palm explanation
          elbowAngle: 65,
          wristAngle: 15,
          hand: "open",
        },
        face: {
          browLeftY: 3,
          browLeftAngle: -3,
          browRightY: 3,
          browRightAngle: 3,
          eyeScale: 1.0,
          eyeBlink: 0,
          pupilX: -0.5,
          pupilY: 0,
          mouthViseme: "open_a",
          mouthOpen: 0.45,
        },
      };

    case "gesture_open":
      return isHost ? {
        torsoLean: 12,
        torsoOffset: -4,
        headTilt: 2,
        headTurn: 0.3,
        leftArm: { shoulderAngle: 35, elbowAngle: 70, wristAngle: 15, hand: "open" },
        rightArm: { shoulderAngle: 38, elbowAngle: 70, wristAngle: 15, hand: "open" },
        face: { ...DEFAULT_HOST_IDLE.face, eyeScale: 1.1, mouthViseme: "open_a", mouthOpen: 0.5 }
      } : {
        torsoLean: 4,
        torsoOffset: -3,
        headTilt: -2,
        headTurn: -0.5,
        leftArm: { shoulderAngle: 24, elbowAngle: 76, wristAngle: 0, hand: "flat_desk" },
        rightArm: {
          shoulderAngle: 58, // wide deliberate gesture
          elbowAngle: 50,
          wristAngle: 20,
          hand: "open",
        },
        face: {
          browLeftY: 4,
          browLeftAngle: -2,
          browRightY: 5,
          browRightAngle: 2,
          eyeScale: 1.05,
          eyeBlink: 0,
          pupilX: -0.55,
          pupilY: -0.1,
          mouthViseme: "wide_ee",
          mouthOpen: 0.55,
        },
      };

    case "gesture_point":
      return isHost ? {
        torsoLean: 15,
        torsoOffset: -6,
        headTilt: 5,
        headTurn: 0.5,
        leftArm: { shoulderAngle: 25, elbowAngle: 75, wristAngle: 0, hand: "flat_desk" },
        rightArm: { shoulderAngle: 62, elbowAngle: 30, wristAngle: 0, hand: "point" },
        face: { ...DEFAULT_HOST_IDLE.face, eyeScale: 1.15, mouthViseme: "open_a", mouthOpen: 0.4 }
      } : {
        torsoLean: 2,
        torsoOffset: -3,
        headTilt: -3,
        headTurn: -0.4,
        leftArm: { shoulderAngle: 25, elbowAngle: 75, wristAngle: 0, hand: "flat_desk" },
        rightArm: { shoulderAngle: 50, elbowAngle: 35, wristAngle: 5, hand: "point" },
        face: { ...DEFAULT_INSIDER_IDLE.face, mouthViseme: "open_o", mouthOpen: 0.4 }
      };

    case "shock":
      return isHost ? {
        torsoLean: -10, // jerks back in chair in utter disbelief
        torsoOffset: 12,
        headTilt: -5,
        headTurn: 0.15, // facing camera/partner in shock
        leftArm: {
          shoulderAngle: 52, // hands fly up from table
          elbowAngle: 95,
          wristAngle: 20,
          hand: "open",
        },
        rightArm: {
          shoulderAngle: 55,
          elbowAngle: 92,
          wristAngle: 20,
          hand: "open",
        },
        face: {
          browLeftY: 14, // high arch
          browLeftAngle: -12,
          browRightY: 14,
          browRightAngle: 12,
          eyeScale: 1.45, // huge wide eyes
          eyeBlink: 0,
          pupilX: 0.1,
          pupilY: -0.1,
          mouthViseme: "shock",
          mouthOpen: 0.95, // jaw drops open
        },
      } : {
        torsoLean: -6,
        torsoOffset: 6,
        headTilt: 4,
        headTurn: -0.2,
        leftArm: { shoulderAngle: 35, elbowAngle: 85, wristAngle: 0, hand: "open" },
        rightArm: { shoulderAngle: 35, elbowAngle: 85, wristAngle: 0, hand: "open" },
        face: { ...DEFAULT_INSIDER_IDLE.face, eyeScale: 1.3, mouthViseme: "shock", mouthOpen: 0.7 }
      };

    case "lean_forward":
      return isHost ? {
        torsoLean: 22, // aggressive curiosity forward into the desk
        torsoOffset: -12,
        headTilt: 8,
        headTurn: 0.5,
        leftArm: {
          shoulderAngle: 38,
          elbowAngle: 90,
          wristAngle: 0,
          hand: "flat_desk",
        },
        rightArm: {
          shoulderAngle: 45,
          elbowAngle: 100,
          wristAngle: -10,
          hand: "chin", // hand planted under chin, staring intently
        },
        face: {
          browLeftY: 5,
          browLeftAngle: -5,
          browRightY: 2,
          browRightAngle: 2,
          eyeScale: 1.2,
          eyeBlink: 0,
          pupilX: 0.65, // laser focused on Insider
          pupilY: 0,
          mouthViseme: "open_o",
          mouthOpen: 0.25,
        },
      } : {
        torsoLean: 8,
        torsoOffset: -4,
        headTilt: -4,
        headTurn: -0.4,
        leftArm: { shoulderAngle: 30, elbowAngle: 80, wristAngle: 0, hand: "flat_desk" },
        rightArm: { shoulderAngle: 30, elbowAngle: 80, wristAngle: 0, hand: "flat_desk" },
        face: { ...DEFAULT_INSIDER_IDLE.face, mouthViseme: "rest", mouthOpen: 0 }
      };

    case "smirk":
      return isHost ? {
        ...DEFAULT_HOST_IDLE,
        face: { ...DEFAULT_HOST_IDLE.face, mouthViseme: "smirk", mouthOpen: 0.2 }
      } : {
        torsoLean: -5, // leans comfortably back in chair
        torsoOffset: 4,
        headTilt: -6, // subtle cocked head
        headTurn: -0.35,
        leftArm: {
          shoulderAngle: 22,
          elbowAngle: 75,
          wristAngle: 0,
          hand: "flat_desk",
        },
        rightArm: {
          shoulderAngle: 30,
          elbowAngle: 68,
          wristAngle: 10,
          hand: "open", // relaxed open hand
        },
        face: {
          browLeftY: -1,
          browLeftAngle: 2,
          browRightY: 5, // one eyebrow subtly raised
          browRightAngle: -3,
          eyeScale: 0.95, // knowing squint
          eyeBlink: 0,
          pupilX: -0.45,
          pupilY: 0,
          mouthViseme: "smirk", // characteristic knowing smirk
          mouthOpen: 0.2,
        },
      };

    default:
      return isHost ? DEFAULT_HOST_IDLE : DEFAULT_INSIDER_IDLE;
  }
}

/**
 * Computes the frame-deterministic final skeletal pose with breathing and organic blinking
 */
export function computeProceduralPose(
  role: CharacterRole,
  basePose: SkeletalPose,
  frame: number,
  fps: number
): SkeletalPose {
  const time = frame / fps;

  // Natural organic breathing: subtle torso elevation and lean oscillation (approx 16 breaths per min = ~3.7s period)
  const breathCycle = Math.sin(time * 1.7);
  const breathTorsoLean = breathCycle * 0.8;
  const breathTorsoY = breathCycle * 2.5;

  // Secondary subtle head stabilization
  const headCounterTilt = -breathCycle * 0.4;

  // Frame-deterministic blinking: blink every ~3.6s (108 frames at 30fps) for 4 frames
  const blinkCycle = frame % 108;
  let blink = 0;
  if (blinkCycle < 2) blink = 0.6;
  else if (blinkCycle < 4) blink = 1.0;
  else if (blinkCycle < 6) blink = 0.4;

  return {
    ...basePose,
    torsoLean: basePose.torsoLean + breathTorsoLean,
    torsoOffset: basePose.torsoOffset + breathTorsoY,
    headTilt: basePose.headTilt + headCounterTilt,
    face: {
      ...basePose.face,
      eyeBlink: Math.max(basePose.face.eyeBlink, blink),
    },
  };
}
