import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONTS } from "../fonts";
import { SkeletalRig } from "../characters/SkeletalRig";
import { StudioDeskEnvironment } from "../characters/StudioDeskEnvironment";
import { getBasePoseForState, computeProceduralPose } from "../characters/poses";
import { getVisemeForTime, WordAlignment } from "../characters/lipSync";
import { compileEpisodeTimeline, getShotAtFrame } from "./compiler";
import { SemanticNarrativeCue, CompiledShot } from "./types";
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

// Semantic Narrative Director Cues for McDonald's Real Estate Monopoly
const NARRATIVE_CUES: SemanticNarrativeCue[] = [
  {
    event: "inquiry_intro",
    lineIndex: 0,
    visualPriority: "speaker",
  },
  {
    event: "unexpected_revelation",
    lineIndex: 1,
    visualPriority: "speaker",
  },
  {
    event: "reaction_disbelief",
    lineIndex: 2,
    visualPriority: "listener_reaction",
  },
  {
    event: "evidence_breakdown",
    lineIndex: 3,
    visualPriority: "evidence",
    evidence: {
      title: "FRANCHISE REALTY CORPORATION // 1956",
      subtitle: "REAL ESTATE MONOPOLY DEED",
      statNumber: "$30,000,000,000",
      statLabel: "PROPERTY & LAND HOLDINGS",
      imageSrc: "podcast/deed.jpg",
    },
  },
  {
    event: "clarifying_challenge",
    lineIndex: 4,
    visualPriority: "speaker",
  },
  {
    event: "monopoly_payoff",
    lineIndex: 5,
    visualPriority: "speaker",
    evidence: {
      title: "OPERATING PROFIT BREAKDOWN",
      subtitle: "RENT & ROYALTIES VS BURGERS",
      statNumber: "80%",
      statLabel: "PURE RENT FROM FRANCHISEES",
    },
  },
];

export const DirectedPodcastScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Compile semantic shot timeline once
  const compiledShots = useMemo(() => {
    return compileEpisodeTimeline(LINES, NARRATIVE_CUES, fps);
  }, [fps]);

  // Pure deterministic lookup of camera, character action, and shot metadata at current frame
  const { shot, progress, cameraScale, cameraPanX, cameraPanY } = useMemo(() => {
    return getShotAtFrame(compiledShots, frame);
  }, [compiledShots, frame]);

  // Active word calculation
  const activeWord = useMemo(() => {
    return WORDS.find((w) => time >= w.start && time < w.end);
  }, [time]);

  // Compute Visemes
  const hostViseme = getVisemeForTime(time, WORDS, "host");
  const insiderViseme = getVisemeForTime(time, WORDS, "guest");

  // Generate Base Poses based on Shot Specification
  const hostBase = getBasePoseForState("host", shot.hostAction);
  const insiderBase = getBasePoseForState("insider", shot.insiderAction);

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

  // Add procedural breathing and eye blinking
  const hostFinalPose = computeProceduralPose("host", hostPoseWithVoice, frame, fps);
  const insiderFinalPose = computeProceduralPose("insider", insiderPoseWithVoice, frame, fps);

  // Subtle organic camera breathing drift
  const drift = Math.sin(time * 0.7) * 4;

  // Evidence card entrance animation
  const cardEntrance = shot.evidenceCard
    ? spring({
        frame: frame - shot.startFrame,
        fps,
        config: { damping: 14, stiffness: 180 },
      })
    : 0;

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
      {/* DIRECTED CAMERA RIG                                      */}
      {/* ======================================================== */}
      <AbsoluteFill
        style={{
          transform: `scale(${cameraScale}) translate(${cameraPanX + drift}px, ${cameraPanY}px)`,
          transformOrigin: "center 48%",
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
          onAirText="THE LINCOLN PENNY // AI DIRECTOR ENGINE"
          width={1080}
          height={1920}
        />

        {/* ======================================================== */}
        {/* SEMANTIC FLOATING EVIDENCE CARD                          */}
        {/* Appears when shot.evidenceCard is active                 */}
        {/* ======================================================== */}
        {shot.evidenceCard && (
          <div
            style={{
              position: "absolute",
              top: 360,
              left: 140,
              right: 140,
              background: "rgba(14, 12, 10, 0.94)",
              border: "2px solid #FFC72C",
              borderRadius: 22,
              padding: "26px 32px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.85), 0 0 30px rgba(255, 199, 44, 0.15)",
              transform: `scale(${cardEntrance})`,
              zIndex: 35,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255, 199, 44, 0.3)",
                paddingBottom: 10,
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 15,
                  color: "#FFC72C",
                  letterSpacing: 2,
                  fontWeight: 700,
                }}
              >
                {shot.evidenceCard.title}
              </span>
              <span
                style={{
                  background: "#EF4444",
                  color: "#ffffff",
                  padding: "3px 10px",
                  borderRadius: 6,
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                CONFIDENTIAL EVIDENCE
              </span>
            </div>

            <div style={{ textAlign: "center", margin: "8px 0" }}>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.65)",
                  letterSpacing: 2,
                  marginBottom: 4,
                }}
              >
                {shot.evidenceCard.statLabel}
              </div>
              <div
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: 48,
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: -1,
                  lineHeight: 1.1,
                  textShadow: "0 4px 15px rgba(0,0,0,0.8)",
                }}
              >
                {shot.evidenceCard.statNumber}
              </div>
            </div>

            {shot.evidenceCard.imageSrc && (
              <div
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  height: 140,
                }}
              >
                <Img
                  src={staticFile(shot.evidenceCard.imageSrc)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}
          </div>
        )}
      </AbsoluteFill>

      {/* ======================================================== */}
      {/* DIRECTOR HUD TELEMETRY BADGE (Top Center-Left)           */}
      {/* ======================================================== */}
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 36,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "10px 16px",
          background: "rgba(10, 12, 16, 0.88)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: 12,
          fontFamily: FONTS.mono,
          fontSize: 12,
          color: "#CBD5E1",
          zIndex: 60,
        }}
      >
        <div style={{ color: "#F59E0B", fontWeight: 700 }}>
          AI DIRECTOR SHOT ENGINE
        </div>
        <div>SHOT ID: {shot.id}</div>
        <div>TYPE: {shot.shotType.toUpperCase()} | PRIORITY: {shot.visualPriority.toUpperCase()}</div>
        <div>CAMERA: scale {cameraScale.toFixed(2)}x (panX: {cameraPanX.toFixed(0)}px)</div>
      </div>

      {/* ======================================================== */}
      {/* WORD-LOCKED KINETIC CAPTIONS                             */}
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
