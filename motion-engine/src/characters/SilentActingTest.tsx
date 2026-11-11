import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";
import { SkeletalRig } from "./SkeletalRig";
import { StudioDeskEnvironment } from "./StudioDeskEnvironment";
import { getBasePoseForState, computeProceduralPose, interpolatePose } from "./poses";
import { CharacterActionState } from "./types";

interface ActingBeat {
  startFrame: number;
  endFrame: number;
  title: string;
  hostState: CharacterActionState;
  insiderState: CharacterActionState;
}

const BEATS: ActingBeat[] = [
  {
    startFrame: 0,
    endFrame: 54, // 0.0s - 1.8s
    title: "1. THE HOST SITS NATURALLY",
    hostState: "idle",
    insiderState: "idle",
  },
  {
    startFrame: 54,
    endFrame: 114, // 1.8s - 3.8s
    title: "2. THE HOST BECOMES CURIOUS",
    hostState: "curious",
    insiderState: "listening",
  },
  {
    startFrame: 114,
    endFrame: 174, // 3.8s - 5.8s
    title: "3. THE INSIDER BEGINS EXPLAINING",
    hostState: "curious",
    insiderState: "explaining",
  },
  {
    startFrame: 174,
    endFrame: 240, // 5.8s - 8.0s
    title: "4. THE INSIDER GESTURES WITH EVIDENCE",
    hostState: "listening",
    insiderState: "gesture_open",
  },
  {
    startFrame: 240,
    endFrame: 306, // 8.0s - 10.2s
    title: "5. THE HOST REACTS WITH SURPRISE",
    hostState: "shock",
    insiderState: "explaining",
  },
  {
    startFrame: 306,
    endFrame: 360, // 10.2s - 12.0s
    title: "6. THE HOST LEANS FORWARD INTO DESK",
    hostState: "lean_forward",
    insiderState: "smirk",
  },
  {
    startFrame: 360,
    endFrame: 414, // 12.0s - 13.8s
    title: "7. THE INSIDER SMILES & KNOWING SMIRK",
    hostState: "lean_forward",
    insiderState: "smirk",
  },
  {
    startFrame: 414,
    endFrame: 450, // 13.8s - 15.0s
    title: "8. BOTH RETURN TO NATURAL LISTENING POSES",
    hostState: "listening",
    insiderState: "listening",
  },
];

export const SilentActingTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find active beat index
  const activeBeatIdx = BEATS.findIndex(
    (b) => frame >= b.startFrame && frame < b.endFrame
  );
  const currentBeat = activeBeatIdx >= 0 ? BEATS[activeBeatIdx] : BEATS[BEATS.length - 1];
  const prevBeat = activeBeatIdx > 0 ? BEATS[activeBeatIdx - 1] : currentBeat;

  // Transition smoothing: 10-frame hermite / spring blend between beats
  const framesIntoBeat = frame - currentBeat.startFrame;
  const blendProgress = Math.min(1, framesIntoBeat / 10);

  // Compute Host Poses
  const hostPrevBase = getBasePoseForState("host", prevBeat.hostState);
  const hostCurrBase = getBasePoseForState("host", currentBeat.hostState);
  const hostBlendedBase = interpolatePose(hostPrevBase, hostCurrBase, blendProgress);
  const hostFinalPose = computeProceduralPose("host", hostBlendedBase, frame, fps);

  // Compute Insider Poses
  const insiderPrevBase = getBasePoseForState("insider", prevBeat.insiderState);
  const insiderCurrBase = getBasePoseForState("insider", currentBeat.insiderState);
  const insiderBlendedBase = interpolatePose(insiderPrevBase, insiderCurrBase, blendProgress);
  const insiderFinalPose = computeProceduralPose("insider", insiderBlendedBase, frame, fps);

  // Dynamic Camera for Acting Test:
  // Slight slow push-in over the 15s sequence
  const cameraScale = interpolate(frame, [0, 450], [1.02, 1.12], { extrapolateRight: "clamp" });
  const cameraDriftX = Math.sin((frame / fps) * 0.6) * 6;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#070605",
        overflow: "hidden",
        fontFamily: FONTS.sans,
        color: "#ffffff",
      }}
    >
      {/* ======================================================== */}
      {/* CAMERA ROOT                                              */}
      {/* ======================================================== */}
      <AbsoluteFill
        style={{
          transform: `scale(${cameraScale}) translateX(${cameraDriftX}px)`,
          transformOrigin: "center 52%",
        }}
      >
        {/* Studio Background Image */}
        <AbsoluteFill>
          <Img
            src={staticFile("podcast/studio.jpg")}
            style={{
              position: "absolute",
              width: "125%",
              height: "125%",
              left: "-12.5%",
              top: "-12.5%",
              objectFit: "cover",
              filter: "brightness(0.55) contrast(1.1) saturate(0.85)",
            }}
          />
        </AbsoluteFill>

        {/* Ambient Dark Studio Vignette */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(217, 119, 6, 0.08) 0%, rgba(5, 5, 5, 0.82) 80%)",
            mixBlendMode: "screen",
          }}
        />

        {/* ======================================================== */}
        {/* CHARACTER 1: THE HOST (Left side of desk at x = 320, y = 1040) */}
        {/* ======================================================== */}
        <SkeletalRig
          role="host"
          pose={hostFinalPose}
          scale={0.92}
          x={320}
          y={1040}
          headsetAccent="#FFC72C"
        />

        {/* ======================================================== */}
        {/* CHARACTER 2: THE INSIDER (Right side of desk at x = 760, y = 1040) */}
        {/* ======================================================== */}
        <SkeletalRig
          role="insider"
          pose={insiderFinalPose}
          scale={0.92}
          x={760}
          y={1040}
          headsetAccent="#EF4444"
        />

        {/* ======================================================== */}
        {/* STUDIO DESK & SM7B MICROPHONES                           */}
        {/* Placed in front of characters to establish physical depth*/}
        {/* ======================================================== */}
        <StudioDeskEnvironment
          onAirText="SILENT ACTING TEST // 15 SECONDS"
          width={1080}
          height={1920}
        />
      </AbsoluteFill>

      {/* ======================================================== */}
      {/* ACCEPTANCE TEST STAGE OVERLAY BANNER                     */}
      {/* ======================================================== */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: "16px 32px",
          background: "rgba(12, 10, 8, 0.92)",
          border: "2px solid #D97706",
          borderRadius: 18,
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.8)",
          zIndex: 50,
          maxWidth: "88%",
        }}
      >
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 14,
            color: "#D97706",
            letterSpacing: 3,
            fontWeight: 800,
            textTransform: "uppercase",
          }}
        >
          {`STAGE ${activeBeatIdx + 1} OF 8 (${(frame / fps).toFixed(1)}s / 15.0s)`}
        </span>
        <span
          style={{
            fontFamily: FONTS.sans,
            fontSize: 24,
            fontWeight: 800,
            color: "#FFFFFF",
            textAlign: "center",
            letterSpacing: 0.5,
          }}
        >
          {currentBeat.title}
        </span>
      </div>
    </AbsoluteFill>
  );
};
