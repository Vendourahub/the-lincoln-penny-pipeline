export type CharacterRole = "host" | "insider";

export type HandPose = "rest" | "open" | "point" | "fist" | "chin" | "steeple" | "flat_desk";

export interface ArmPose {
  shoulderAngle: number; // degrees relative to torso
  elbowAngle: number;    // degrees relative to upper arm
  wristAngle: number;    // degrees relative to forearm
  hand: HandPose;
}

export interface LegPose {
  hipAngle: number;  // degrees
  kneeAngle: number; // degrees
}

export type MouthViseme = 
  | "rest"      // neutral closed lips
  | "closed"    // firm closed lips (m, b, p)
  | "open_a"    // wide open vowel (ah, uh)
  | "open_o"    // rounded vowel (oh, oo)
  | "wide_ee"   // stretched wide lips (ee, ay)
  | "dental"    // top teeth contact bottom lip (f, v, th)
  | "smile"     // happy closed smile
  | "smirk"     // asymmetric knowing grin
  | "shock";    // dropped jaw wide gasp

export interface FaceExpression {
  browLeftY: number;      // -10 (low) to +15 (raised)
  browLeftAngle: number;  // degrees
  browRightY: number;
  browRightAngle: number;
  eyeScale: number;       // 0.8 squint to 1.4 wide shock
  eyeBlink: number;       // 0 (open) to 1 (shut)
  pupilX: number;         // -1 (left) to 1 (right)
  pupilY: number;         // -1 (up) to 1 (down)
  mouthViseme: MouthViseme;
  mouthOpen: number;      // 0.0 (closed) to 1.0 (wide open)
}

export interface SkeletalPose {
  torsoLean: number;     // degrees (-15 leaning back to +25 leaning forward)
  torsoOffset: number;   // px vertical breathing / bounce
  headTilt: number;      // degrees (-25 to +25 tilt)
  headTurn: number;      // -1 (facing left/partner) to 0 (camera) to 1 (facing right)
  leftArm: ArmPose;
  rightArm: ArmPose;
  leftLeg?: LegPose;
  rightLeg?: LegPose;
  face: FaceExpression;
}

export type CharacterActionState =
  | "idle"
  | "curious"
  | "explaining"
  | "gesture_open"
  | "gesture_point"
  | "shock"
  | "lean_forward"
  | "smirk"
  | "deadpan"
  | "listening";
