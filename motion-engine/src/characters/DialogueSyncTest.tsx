import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONTS } from "../fonts";
import { SkeletalRig } from "./SkeletalRig";
import { StudioDeskEnvironment } from "./StudioDeskEnvironment";
import { getBasePoseForState, computeProceduralPose } from "./poses";
import { getVisemeForTime, WordAlignment } from "./lipSync";
import wordsData from "../../public/podcast/words.json";
import linesData from "../../public/podcast/lines.json";

interface LineItem {
  line: number;
  speaker: string;
  text: string;
  start: number;
  end: number;
}

const WORDS: WordAlignment[] = wordsData.words;
const LINES: LineItem[] = linesData;

export const DialogueSyncTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Active word calculation
  const activeWord = useMemo(() => {
    return WORDS.find((w) => time >= w.start && time < w.end);
  }, [time]);

  // Current active line
  const currentLine = useMemo(() => {
    return LINES.find((l) => time >= l.start && time < l.end);
  }, [time]);

  const currentSpeaker = currentLine?.speaker || "none";

  // Compute Visemes for Host and Insider
  const hostViseme = getVisemeForTime(time, WORDS, "host");
  const insiderViseme = getVisemeForTime(time, WORDS, "guest");

  // Determine Character Action State
  let hostState: any = "listening";
  let insiderState: any = "listening";

  if (time < 8.17) {
    // Shot 1: Host introducing McDonald's inquiry
    hostState = "explaining";
    insiderState = "listening";
  } else if (time >= 8.17 && time < 14.12) {
    // Shot 2: Insider explaining $30B real estate empire
    hostState = "curious";
    insiderState = "explaining";
  } else if (time >= 14.12 && time < 16.06) {
    // Shot 3: Host shock: "Wait... what? They sell burgers!"
    hostState = "shock";
    insiderState = "smirk";
  } else if (time >= 16.06 && time < 28.04) {
    // Shot 4: Insider deep explanation of Ray Kroc & land monopoly
    hostState = "lean_forward";
    insiderState = "gesture_open";
  } else if (time >= 28.04 && time < 30.12) {
    // Shot 5: Host asks "So they make more from rent than burgers?"
    hostState = "curious";
    insiderState = "listening";
  } else {
    // Shot 6: Insider concludes 80% profit is rent
    hostState = "listening";
    insiderState = "smirk";
  }

  // Generate Base Poses
  const hostBase = getBasePoseForState("host", hostState);
  const insiderBase = getBasePoseForState("insider", insiderState);

  // Apply Speech Visemes
  const hostPoseWithVoice = {
    ...hostBase,
    face: {
      ...hostBase.face,
      mouthViseme: hostViseme.viseme,
      mouthOpen: hostViseme.openAmount,
    },
  };

  const insiderPoseWithVoice = {
    ...insiderBase,
    face: {
      ...insiderBase.face,
      mouthViseme: insiderViseme.viseme,
      mouthOpen: insiderViseme.openAmount,
    },
  };

  // Add procedural breathing and blinking
  const hostFinalPose = computeProceduralPose("host", hostPoseWithVoice, frame, fps);
  const insiderFinalPose = computeProceduralPose("insider", insiderPoseWithVoice, frame, fps);

  // Dynamic Camera for Dialogue Scene:
  // Smooth cuts between speaker close-ups and 2-shots
  let camScale = 1.0;
  let camPanX = 0;
  let camPanY = 0;

  if (time < 8.17) {
    // Host Close-up
    camScale = 1.2;
    camPanX = 180;
    camPanY = -20;
  } else if (time >= 8.17 && time < 14.12) {
    // Insider Close-up
    camScale = 1.2;
    camPanX = -180;
    camPanY = -20;
  } else if (time >= 14.12 && time < 16.06) {
    // Host Shock Punch-in
    camScale = 1.35;
    camPanX = 220;
    camPanY = -40;
  } else {
    // Wide 2-Shot Studio Desk
    camScale = 1.02;
    camPanX = 0;
    camPanY = 0;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#070605",
        overflow: "hidden",
        fontFamily: FONTS.sans,
        color: "#ffffff",
      }}
    >
      <Audio src={staticFile("podcast/audio.mp3")} />

      {/* ======================================================== */}
      {/* CAMERA STAGE                                             */}
      {/* ======================================================== */}
      <AbsoluteFill
        style={{
          transform: `scale(${camScale}) translate(${camPanX}px, ${camPanY}px)`,
          transformOrigin: "center 50%",
        }}
      >
        {/* Studio Background */}
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

        {/* CHARACTER 1: THE HOST */}
        <SkeletalRig
          role="host"
          pose={hostFinalPose}
          scale={0.92}
          x={320}
          y={1040}
          headsetAccent="#FFC72C"
        />

        {/* CHARACTER 2: THE INSIDER */}
        <SkeletalRig
          role="insider"
          pose={insiderFinalPose}
          scale={0.92}
          x={760}
          y={1040}
          headsetAccent="#EF4444"
        />

        {/* STUDIO DESK & SM7B MICROPHONES */}
        <StudioDeskEnvironment
          onAirText="THE LINCOLN PENNY // SPEECH & LIP-SYNC PROOF"
          width={1080}
          height={1920}
        />
      </AbsoluteFill>

      {/* ======================================================== */}
      {/* REAL-TIME PHONETIC VISEME DIAGNOSTIC OVERLAY (Top Left)  */}
      {/* ======================================================== */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "12px 18px",
          background: "rgba(10, 12, 16, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: 12,
          fontFamily: FONTS.mono,
          fontSize: 13,
          color: "#CBD5E1",
          zIndex: 60,
        }}
      >
        <div style={{ color: "#F59E0B", fontWeight: 700 }}>
          SPEECH SYNCHRONIZATION MONITOR
        </div>
        <div>TIME: {time.toFixed(2)}s | FRAME: {frame}</div>
        <div>SPEAKER: <span style={{ color: currentSpeaker === "host" ? "#FFC72C" : "#EF4444", fontWeight: 700 }}>{currentSpeaker.toUpperCase()}</span></div>
        <div>ACTIVE WORD: "{activeWord?.word || "(pause)"}"</div>
        <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
          <span>HOST: [{hostViseme.viseme.toUpperCase()}] ({(hostViseme.openAmount * 100).toFixed(0)}%)</span>
          <span>INSIDER: [{insiderViseme.viseme.toUpperCase()}] ({(insiderViseme.openAmount * 100).toFixed(0)}%)</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* KINETIC CAPTION BAR (Safe Zone Bottom)                   */}
      {/* ======================================================== */}
      {activeWord && (
        <div
          style={{
            position: "absolute",
            bottom: 140,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 12, 10, 0.92)",
            border: `2px solid ${activeWord.speaker === "host" ? "#FFC72C" : "#EF4444"}`,
            padding: "16px 36px",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
            zIndex: 60,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: 36,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: 1,
            }}
          >
            {activeWord.word.toUpperCase()}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
