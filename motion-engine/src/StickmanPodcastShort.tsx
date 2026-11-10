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
import { FONTS } from "./fonts";
import wordsData from "../public/podcast/words.json";
import linesData from "../public/podcast/lines.json";

interface WordItem {
  word: string;
  start: number;
  end: number;
  speaker?: string;
}

interface LineItem {
  line: number;
  speaker: string;
  text: string;
  start: number;
  end: number;
}

const WORDS: WordItem[] = wordsData.words;
const LINES: LineItem[] = linesData;

export const StickmanPodcastShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Active word calculation
  const activeWordIdx = useMemo(() => {
    return WORDS.findIndex((w) => time >= w.start && time < w.end);
  }, [time]);

  // Current active speaker ("host" or "guest")
  const currentLine = useMemo(() => {
    return LINES.find((l) => time >= l.start && time < l.end) || LINES[0];
  }, [time]);

  const currentSpeaker = currentLine?.speaker || "host";

  // Dynamic Camera Switching Logic:
  // Shot 1 (0 - 8.17s): Host Close-up (scale: 1.22, panX: 180, panY: -20)
  // Shot 2 (8.17 - 14.12s): Guest Close-up (scale: 1.22, panX: -180, panY: -20)
  // Shot 3 (14.12 - 15.74s): Host Shock Snap (scale: 1.38, panX: 220, panY: -40)
  // Shot 4 (15.74 - 27.56s): Wide 2-Shot + Floating Evidence (scale: 1.0, panX: 0, panY: 0)
  // Shot 5 (27.56 - 37.76s): Guest Close-up with $30B Stat (scale: 1.25, panX: -160, panY: -20)
  // Shot 6 (37.76 - 41.65s): Wide 2-Shot Loop Outro (scale: 1.05, panX: 0, panY: 0)

  let targetScale = 1.0;
  let targetPanX = 0;
  let targetPanY = 0;

  if (time < 8.17) {
    targetScale = 1.22;
    targetPanX = 170;
    targetPanY = -20;
  } else if (time >= 8.17 && time < 14.12) {
    targetScale = 1.22;
    targetPanX = -170;
    targetPanY = -20;
  } else if (time >= 14.12 && time < 15.74) {
    targetScale = 1.38;
    targetPanX = 210;
    targetPanY = -40;
  } else if (time >= 15.74 && time < 27.56) {
    targetScale = 1.02;
    targetPanX = 0;
    targetPanY = 0;
  } else if (time >= 27.56 && time < 37.76) {
    targetScale = 1.24;
    targetPanX = -160;
    targetPanY = -20;
  } else {
    targetScale = 1.05;
    targetPanX = 0;
    targetPanY = 0;
  }

  // Smooth micro-drift
  const cameraDrift = Math.sin((frame / fps) * 0.8) * 4;

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

      {/* Camera Stage */}
      <AbsoluteFill
        style={{
          transform: `scale(${targetScale}) translate(${targetPanX + cameraDrift}px, ${targetPanY}px)`,
          transformOrigin: "center 48%",
          transition: "transform 0.12s cubic-bezier(0.2, 0.9, 0.3, 1.0)",
        }}
      >
        {/* Studio Background */}
        <AbsoluteFill>
          <Img
            src={staticFile("podcast/studio.jpg")}
            style={{
              position: "absolute",
              width: "130%",
              height: "130%",
              left: "-15%",
              top: "-15%",
              objectFit: "cover",
            }}
          />
          {/* Moody Ambient Lighting Vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 50% 40%, rgba(0,0,0,0.15) 0%, rgba(5,4,3,0.7) 70%, rgba(0,0,0,0.92) 100%)",
            }}
          />
        </AbsoluteFill>

        {/* Top Studio HUD */}
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 60,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(10, 8, 6, 0.75)",
            backdropFilter: "blur(10px)",
            padding: "8px 20px",
            borderRadius: 24,
            border: "1px solid rgba(255, 199, 44, 0.3)",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#EF4444",
              boxShadow: "0 0 12px #EF4444",
            }}
          />
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 16,
              color: "#ffffff",
              letterSpacing: 2,
              fontWeight: 700,
            }}
          >
            ON AIR // THE LINCOLN PENNY PODCAST
          </span>
        </div>

        {/* ======================================================== */}
        {/* CHARACTER 1: THE HOST (Left side of desk)                */}
        {/* ======================================================== */}
        <PodcastStickman
          x={320}
          y={930}
          scale={0.86}
          side="left"
          isSpeaking={currentSpeaker === "host"}
          emotion={
            time >= 14.12 && time < 16.0
              ? "shock"
              : time >= 27.56 && time < 29.5
              ? "think"
              : "neutral"
          }
          headsetAccent="#FFC72C"
          showMic={false}
        />

        {/* ======================================================== */}
        {/* CHARACTER 2: THE GUEST / INSIDER (Right side of desk)    */}
        {/* ======================================================== */}
        <PodcastStickman
          x={760}
          y={930}
          scale={0.86}
          side="right"
          isSpeaking={currentSpeaker === "guest"}
          emotion={
            time >= 8.17 && time < 14.12
              ? "smirk"
              : time >= 29.48 && time < 37.76
              ? "smirk"
              : "neutral"
          }
          headsetAccent="#EF4444"
          hasSuit
          showMic={false}
        />

        {/* ======================================================== */}
        {/* FLOATING EVIDENCE CARD (Appears during Shot 4 & 5)       */}
        {/* ======================================================== */}
        {time >= 15.74 && time < 37.8 && (
          <FloatingEvidenceCard frame={frame} fps={fps} time={time} />
        )}
      </AbsoluteFill>

      {/* ======================================================== */}
      {/* WORD-LOCKED KINETIC CAPTION BAR (SAFE ZONE Y = 1420px)   */}
      {/* ======================================================== */}
      <PodcastKineticCaptions
        words={WORDS}
        activeIdx={activeWordIdx}
        time={time}
        speaker={currentSpeaker}
      />
    </AbsoluteFill>
  );
};

// =========================================================================
// PODCAST STICKMAN COMPONENT (With Studio Headset & Mic)
// =========================================================================
interface PodcastStickmanProps {
  x: number;
  y: number;
  scale?: number;
  side: "left" | "right";
  isSpeaking: boolean;
  emotion?: "neutral" | "shock" | "smirk" | "think";
  headsetAccent?: string;
  hasSuit?: boolean;
  showMic?: boolean;
}

const PodcastStickman: React.FC<PodcastStickmanProps> = ({
  x,
  y,
  scale = 1.0,
  side,
  isSpeaking,
  emotion = "neutral",
  headsetAccent = "#FFC72C",
  hasSuit = false,
  showMic = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Natural idle breathing
  const bobY = Math.sin((frame / fps) * 3.5) * 6 * scale;
  const bobRot = Math.sin((frame / fps) * 1.8) * (side === "left" ? 1.0 : -1.0);

  // Blinking
  const blinkCycle = frame % 110;
  const isBlinking = blinkCycle < 4;

  // Mouth animation during speech
  const isMouthOpen = isSpeaking && frame % 6 < 3;

  const s = 100 * scale;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + bobY,
        transform: `translate(-50%, -50%) rotate(${bobRot}deg)`,
        pointerEvents: "none",
        filter: "drop-shadow(0px 15px 25px rgba(0, 0, 0, 0.7))",
        zIndex: 20,
      }}
    >
      <svg
        width={s * 4}
        height={s * 4.5}
        viewBox={`-${s * 2} -${s * 1.5} ${s * 4} ${s * 4.5}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Head 3D gradient */}
          <radialGradient id={`headGrad_${side}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="75%" stopColor="#F0F1F5" />
            <stop offset="100%" stopColor="#D2D6E0" />
          </radialGradient>
        </defs>

        {/* --- BODY (Torso / Suit) --- */}
        {hasSuit ? (
          // Sharp Charcoal Suit Body
          <path
            d={`M ${-s * 0.35} ${s * 0.9}
                L ${-s * 1.4} ${s * 1.3}
                L ${-s * 1.1} ${s * 2.8}
                L ${s * 1.1} ${s * 2.8}
                L ${s * 1.4} ${s * 1.3}
                L ${s * 0.35} ${s * 0.9} Z`}
            fill="#1E2330"
            stroke="#11141A"
            strokeWidth={5}
          />
        ) : (
          // Casual Hoodie / Shirt Body
          <path
            d={`M ${-s * 0.35} ${s * 0.9}
                L ${-s * 1.35} ${s * 1.3}
                L ${-s * 1.15} ${s * 2.8}
                L ${s * 1.15} ${s * 2.8}
                L ${s * 1.35} ${s * 1.3}
                L ${s * 0.35} ${s * 0.9} Z`}
            fill="#374151"
            stroke="#1F2937"
            strokeWidth={5}
          />
        )}

        {/* Tie (for Insider) */}
        {hasSuit && (
          <path
            d={`M 0 ${s * 1.0} L ${-s * 0.15} ${s * 1.3} L ${-s * 0.12} ${s * 2.2} L 0 ${s * 2.4} L ${s * 0.12} ${s * 2.2} L ${s * 0.15} ${s * 1.3} Z`}
            fill="#EF4444"
          />
        )}

        {/* --- HEAD (Spherical) --- */}
        <circle
          cx={0}
          cy={0}
          r={s * 0.8}
          fill={`url(#headGrad_${side})`}
          stroke="#11141A"
          strokeWidth={6}
        />

        {/* --- OVER-EAR STUDIO HEADPHONES --- */}
        {/* Headband */}
        <path
          d={`M ${-s * 0.82} -${s * 0.1} A ${s * 0.85} ${s * 0.85} 0 0 1 ${s * 0.82} -${s * 0.1}`}
          fill="none"
          stroke="#1E2330"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Left Ear Cushion */}
        <rect
          x={-s * 0.96}
          y={-s * 0.25}
          width={s * 0.22}
          height={s * 0.55}
          rx={s * 0.1}
          fill="#11141A"
          stroke={headsetAccent}
          strokeWidth={3}
        />
        {/* Right Ear Cushion */}
        <rect
          x={s * 0.74}
          y={-s * 0.25}
          width={s * 0.22}
          height={s * 0.55}
          rx={s * 0.1}
          fill="#11141A"
          stroke={headsetAccent}
          strokeWidth={3}
        />

        {/* --- FACIAL EXPRESSIONS --- */}
        {/* Eyes */}
        {isBlinking ? (
          // Closed Eyes
          <line
            x1={-s * 0.35}
            y1={-s * 0.05}
            x2={-s * 0.15}
            y2={-s * 0.05}
            stroke="#11141A"
            strokeWidth={5}
            strokeLinecap="round"
          />
        ) : emotion === "shock" ? (
          // Wide Shock Pupils
          <>
            <circle cx={-s * 0.25} cy={-s * 0.05} r={s * 0.18} fill="#11141A" />
            <circle cx={-s * 0.28} cy={-s * 0.09} r={s * 0.06} fill="#ffffff" />
            <circle cx={s * 0.25} cy={-s * 0.05} r={s * 0.18} fill="#11141A" />
            <circle cx={s * 0.22} cy={-s * 0.09} r={s * 0.06} fill="#ffffff" />
          </>
        ) : (
          // Normal Focused Eyes
          <>
            <circle
              cx={side === "left" ? -s * 0.15 : -s * 0.3}
              cy={-s * 0.05}
              r={s * 0.12}
              fill="#11141A"
            />
            <circle
              cx={side === "left" ? s * 0.35 : s * 0.2}
              cy={-s * 0.05}
              r={s * 0.12}
              fill="#11141A"
            />
          </>
        )}

        {/* Eyebrows */}
        {emotion === "shock" ? (
          <>
            <path
              d={`M ${-s * 0.4} -${s * 0.35} Q ${-s * 0.25} -${s * 0.45} ${-s * 0.1} -${s * 0.32}`}
              fill="none"
              stroke="#11141A"
              strokeWidth={5}
              strokeLinecap="round"
            />
            <path
              d={`M ${s * 0.1} -${s * 0.32} Q ${s * 0.25} -${s * 0.45} ${s * 0.4} -${s * 0.35}`}
              fill="none"
              stroke="#11141A"
              strokeWidth={5}
              strokeLinecap="round"
            />
          </>
        ) : emotion === "smirk" ? (
          // Knowing Eyebrow Arch
          <>
            <path
              d={`M ${-s * 0.35} -${s * 0.22} Q ${-s * 0.2} -${s * 0.25} ${-s * 0.05} -${s * 0.2}`}
              fill="none"
              stroke="#11141A"
              strokeWidth={4}
              strokeLinecap="round"
            />
            <path
              d={`M ${s * 0.05} -${s * 0.2} Q ${s * 0.2} -${s * 0.32} ${s * 0.35} -${s * 0.28}`}
              fill="none"
              stroke="#11141A"
              strokeWidth={4}
              strokeLinecap="round"
            />
          </>
        ) : (
          // Neutral Eyebrows
          <>
            <line
              x1={-s * 0.35}
              y1={-s * 0.22}
              x2={-s * 0.1}
              y2={-s * 0.2}
              stroke="#11141A"
              strokeWidth={4}
              strokeLinecap="round"
            />
            <line
              x1={s * 0.1}
              y1={-s * 0.2}
              x2={s * 0.35}
              y2={-s * 0.22}
              stroke="#11141A"
              strokeWidth={4}
              strokeLinecap="round"
            />
          </>
        )}

        {/* Mouth */}
        {isMouthOpen ? (
          // Open Speaking Mouth
          <ellipse cx={0} cy={s * 0.35} rx={s * 0.22} ry={s * 0.18} fill="#7F1D1D" stroke="#11141A" strokeWidth={4} />
        ) : emotion === "shock" ? (
          // Dropped Open O-Mouth
          <circle cx={0} cy={s * 0.42} r={s * 0.22} fill="#7F1D1D" stroke="#11141A" strokeWidth={5} />
        ) : emotion === "smirk" ? (
          // Smug Smile
          <path
            d={`M ${-s * 0.15} ${s * 0.32} Q 0 ${s * 0.42} ${s * 0.25} ${s * 0.26}`}
            fill="none"
            stroke="#11141A"
            strokeWidth={5}
            strokeLinecap="round"
          />
        ) : (
          // Closed Neutral Mouth
          <line
            x1={-s * 0.2}
            y1={s * 0.35}
            x2={s * 0.2}
            y2={s * 0.35}
            stroke="#11141A"
            strokeWidth={4}
            strokeLinecap="round"
          />
        )}

        {/* --- SHURE SM7B BROADCAST MICROPHONE --- */}
        {showMic && (
          <g
            transform={`translate(${side === "left" ? s * 0.55 : -s * 0.55}, ${s * 0.45}) rotate(${
              side === "left" ? -25 : 25
            })`}
          >
            {/* Black Foam Windscreen */}
            <rect
              x={-s * 0.14}
              y={-s * 0.35}
              width={s * 0.28}
              height={s * 0.55}
              rx={s * 0.08}
              fill="#18181B"
              stroke="#27272A"
              strokeWidth={2}
            />
            {/* Metal Body */}
            <rect
              x={-s * 0.12}
              y={s * 0.2}
              width={s * 0.24}
              height={s * 0.4}
              fill="#27272A"
              stroke="#09090B"
              strokeWidth={2}
            />
            {/* Yoke Mount Arm */}
            <path
              d={`M ${-s * 0.2} ${s * 0.1} L ${-s * 0.2} ${s * 0.6} L ${s * 0.2} ${s * 0.6} L ${s * 0.2} ${s * 0.1}`}
              fill="none"
              stroke="#52525B"
              strokeWidth={4}
            />
            <line x1={0} y1={s * 0.6} x2={0} y2={s * 1.1} stroke="#52525B" strokeWidth={6} />
          </g>
        )}
      </svg>
    </div>
  );
};

// =========================================================================
// FLOATING EVIDENCE CARD (The $30B Real Estate Monopoly)
// =========================================================================
const FloatingEvidenceCard: React.FC<{
  frame: number;
  fps: number;
  time: number;
}> = ({ frame, fps, time }) => {
  const enterSpring = spring({
    frame: frame - 472,
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 360,
        left: 120,
        right: 120,
        background: "rgba(12, 10, 8, 0.94)",
        backdropFilter: "blur(18px)",
        border: "2px solid #FFC72C",
        borderRadius: 24,
        padding: "32px 36px",
        boxShadow: "0 25px 70px rgba(0,0,0,0.85), 0 0 35px rgba(255, 199, 44, 0.15)",
        transform: `scale(${enterSpring})`,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 199, 44, 0.3)",
          paddingBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 16,
            color: "#FFC72C",
            letterSpacing: 2,
            fontWeight: 700,
          }}
        >
          FRANCHISE REALTY CORPORATION // 1956
        </span>
        <span
          style={{
            background: "#EF4444",
            color: "#ffffff",
            padding: "4px 12px",
            borderRadius: 6,
            fontFamily: FONTS.mono,
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          CONFIDENTIAL
        </span>
      </div>

      <div style={{ textAlign: "center", margin: "12px 0" }}>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 16,
            color: "rgba(255,255,255,0.65)",
            letterSpacing: 2,
            marginBottom: 4,
          }}
        >
          TRUE ASSET VALUATION
        </div>
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 54,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: 1,
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        >
          $30 BILLION
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 18,
            color: "#FFC72C",
            fontWeight: 700,
            marginTop: 4,
          }}
        >
          PHYSICAL COMMERCIAL REAL ESTATE
        </div>
      </div>

      {/* The 80% Profit Breakdown Pill */}
      <div
        style={{
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 16,
            color: "rgba(255,255,255,0.9)",
            fontWeight: 600,
          }}
        >
          FRANCHISE RENT & ROYALTIES
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 26,
            fontWeight: 900,
            color: "#EF4444",
          }}
        >
          80% OF PROFITS
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// PODCAST KINETIC CAPTIONS COMPONENT
// =========================================================================
const PodcastKineticCaptions: React.FC<{
  words: WordItem[];
  activeIdx: number;
  time: number;
  speaker: string;
}> = ({ words, activeIdx, time, speaker }) => {
  if (activeIdx < 0 || activeIdx >= words.length) {
    return null;
  }

  const startIdx = Math.max(0, activeIdx - 1);
  const endIdx = Math.min(words.length, activeIdx + 2);
  const windowWords = words.slice(startIdx, endIdx);

  const speakerColor = speaker === "guest" ? "#EF4444" : "#FFC72C";
  const speakerLabel = speaker === "guest" ? "THE INSIDER" : "THE HOST";

  return (
    <div
      style={{
        position: "absolute",
        top: 1420,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      {/* Speaker Badge */}
      <div
        style={{
          background: speakerColor,
          color: "#070605",
          padding: "4px 16px",
          borderRadius: 12,
          fontFamily: FONTS.mono,
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: 1.5,
          boxShadow: `0 0 15px ${speakerColor}66`,
        }}
      >
        {speakerLabel}
      </div>

      {/* Caption Text Box */}
      <div
        style={{
          background: "rgba(8, 7, 6, 0.92)",
          backdropFilter: "blur(14px)",
          border: `1px solid ${speakerColor}55`,
          borderRadius: 20,
          padding: "16px 36px",
          display: "flex",
          gap: 16,
          alignItems: "center",
          boxShadow: "0 12px 35px rgba(0,0,0,0.8)",
          maxWidth: 960,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {windowWords.map((w, idx) => {
          const globalIdx = startIdx + idx;
          const isCurrent = globalIdx === activeIdx;

          return (
            <span
              key={globalIdx}
              style={{
                fontFamily: FONTS.sans,
                fontSize: isCurrent ? 44 : 36,
                fontWeight: isCurrent ? 900 : 700,
                color: isCurrent ? speakerColor : "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                transform: isCurrent ? "scale(1.08)" : "scale(1)",
                transition: "all 0.08s ease-out",
                textShadow: isCurrent ? `0 0 20px ${speakerColor}66` : "none",
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
