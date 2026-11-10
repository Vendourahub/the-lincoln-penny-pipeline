import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { slide } from "@remotion/transitions/slide";
import { StickmanAvatar, StickmanEmotion } from "./components/StickmanAvatar";
import { BroadcastGrade } from "./components/BroadcastGrade";
import wordsData from "../public/rolex/words.json";

interface WordTiming {
  word: string;
  start: number;
  end: number;
}

const words: WordTiming[] = wordsData.words;

/**
 * High-End Word-Locked Kinetic Caption Component
 */
const KineticCaptions: React.FC<{ currentTimeSec: number }> = ({ currentTimeSec }) => {
  // Find current active word
  const activeIndex = words.findIndex(
    (w) => currentTimeSec >= w.start && currentTimeSec <= w.end
  );

  // Take a sliding window of 3-4 words centered on current word
  const windowWords = useMemo(() => {
    if (activeIndex === -1) {
      // Find nearest word
      const nextIdx = words.findIndex((w) => w.start > currentTimeSec);
      if (nextIdx > 0) {
        return words.slice(Math.max(0, nextIdx - 2), nextIdx + 2);
      }
      return words.slice(0, 4);
    }
    const startIdx = Math.max(0, activeIndex - 1);
    return words.slice(startIdx, startIdx + 4);
  }, [activeIndex, currentTimeSec]);

  if (currentTimeSec > 9.8) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 240,
        left: 0,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "rgba(10, 14, 24, 0.88)",
          backdropFilter: "blur(16px)",
          border: "2px solid rgba(255, 214, 58, 0.4)",
          borderRadius: 32,
          padding: "18px 44px",
          display: "flex",
          gap: 16,
          alignItems: "center",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
        }}
      >
        {windowWords.map((w, i) => {
          const isActive = currentTimeSec >= w.start && currentTimeSec <= w.end;
          return (
            <span
              key={i}
              style={{
                fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                fontSize: isActive ? 58 : 48,
                fontWeight: 900,
                color: isActive ? "#FFD63A" : "rgba(255, 255, 255, 0.75)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                transform: isActive ? "scale(1.12)" : "scale(1.0)",
                transition: "transform 0.08s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                textShadow: isActive
                  ? "0 0 24px rgba(255, 214, 58, 0.7), 0 4px 8px rgba(0,0,0,0.9)"
                  : "0 2px 6px rgba(0,0,0,0.8)",
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

/**
 * SCENE 1: The Production Surplus Paradox (0s – 5.6s)
 */
const SceneProduction: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Spring entrance for watch
  const watchSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  const watchY = interpolate(watchSpring, [0, 1], [-200, 520]);
  const watchRot = interpolate(frame, [0, 170], [-12, 15]);

  // Speaking detection
  const isSpeaking = words.some((w) => t >= w.start && t <= w.end);

  // Counter number: 0 -> 1,200,000
  const counterVal = Math.floor(
    interpolate(frame, [15, 80], [0, 1200000], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Background Volumetric Glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(26, 90, 160, 0.35) 0%, rgba(10, 14, 24, 0) 70%)",
          transform: "translate(-50%, -50%)",
          filter: "blur(40px)",
        }}
      />

      {/* Floating 3D Rolex Model */}
      <div
        style={{
          position: "absolute",
          top: watchY,
          left: "50%",
          transform: `translate(-50%, -50%) rotate(${watchRot}deg) scale(1.15)`,
          filter: "drop-shadow(0 30px 50px rgba(0, 0, 0, 0.75))",
        }}
      >
        <svg width="340" height="420" viewBox="-170 -210 340 420">
          <defs>
            <linearGradient id="steelBezel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#C8D4E2" />
              <stop offset="100%" stopColor="#7B8B9E" />
            </linearGradient>
            <radialGradient id="greenSunburst" cx="45%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#0E7848" />
              <stop offset="70%" stopColor="#084E2E" />
              <stop offset="100%" stopColor="#032515" />
            </radialGradient>
          </defs>

          {/* Steel Bracelet Top */}
          <rect x="-65" y="-190" width="130" height="90" rx="8" fill="url(#steelBezel)" stroke="#0E1726" strokeWidth="4" />
          <line x1="0" y1="-190" x2="0" y2="-100" stroke="#FFF" strokeWidth="6" />

          {/* Steel Bracelet Bottom */}
          <rect x="-65" y="100" width="130" height="90" rx="8" fill="url(#steelBezel)" stroke="#0E1726" strokeWidth="4" />
          <line x1="0" y1="100" x2="0" y2="190" stroke="#FFF" strokeWidth="6" />

          {/* Outer Watch Case */}
          <circle cx="0" cy="0" r="115" fill="url(#steelBezel)" stroke="#0E1726" strokeWidth="5" />

          {/* Cerachrom Emerald Green Bezel */}
          <circle cx="0" cy="0" r="98" fill="#0A5A36" stroke="#0E1726" strokeWidth="4" />

          {/* Dial Markers */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            return (
              <circle
                key={i}
                cx={Math.cos(angle) * 85}
                cy={Math.sin(angle) * 85}
                r="4"
                fill="#FFFFFF"
              />
            );
          })}

          {/* Sunburst Dial */}
          <circle cx="0" cy="0" r="80" fill="url(#greenSunburst)" />

          {/* Mercedes Hands */}
          <line x1="0" y1="0" x2="-25" y2="-35" stroke="#FFF" strokeWidth="6" strokeLinecap="round" />
          <line x1="0" y1="0" x2="42" y2="-15" stroke="#FFF" strokeWidth="5" strokeLinecap="round" />
          <line x1="0" y1="0" x2="-12" y2="50" stroke="#FFD63A" strokeWidth="3" strokeLinecap="round" />
          <circle cx="0" cy="0" r="6" fill="#FFD63A" />

          {/* Glass Crystal Reflection */}
          <path
            d="M -60 -40 L 20 -70 L -10 65 L -70 40 Z"
            fill="rgba(255, 255, 255, 0.28)"
          />
        </svg>
      </div>

      {/* Floating Production Counter Badge */}
      <div
        style={{
          position: "absolute",
          top: 860,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1E293B, #0F172A)",
            border: "2px solid #38BDF8",
            borderRadius: 20,
            padding: "12px 36px",
            boxShadow: "0 10px 30px rgba(56, 189, 248, 0.3)",
          }}
        >
          <span
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 48,
              fontWeight: 900,
              color: "#38BDF8",
              letterSpacing: "0.06em",
            }}
          >
            {counterVal.toLocaleString()} WATCHES / YEAR
          </span>
        </div>
      </div>

      {/* Business Stickman in Suit (Smirk / Pointing at Production) */}
      <StickmanAvatar
        x={540}
        y={1360}
        scale={1.85}
        emotion="smirk"
        isSpeaking={isSpeaking}
        arm="point"
        lookX={0.2}
      />
    </AbsoluteFill>
  );
};

/**
 * SCENE 2: The Empty Dealer Case Shock (5.6s – 10.0s)
 */
const SceneEmptyCase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = 5.6 + frame / fps;

  // Camera Shake on entrance
  const shakeEnv = Math.exp(-frame * 0.12) * 22;
  const shakeX = Math.sin(frame * 3.5) * shakeEnv;
  const shakeY = Math.cos(frame * 4.1) * shakeEnv;

  const isSpeaking = words.some((w) => t >= w.start && t <= w.end);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Dramatic Warning Backdrop */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "50%",
          width: 850,
          height: 850,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(220, 38, 38, 0.35) 0%, rgba(10, 14, 24, 0) 70%)",
          transform: "translate(-50%, -50%)",
          filter: "blur(45px)",
        }}
      />

      {/* Giant Neon "EMPTY CASE" Warning Tag */}
      <div
        style={{
          position: "absolute",
          top: 360,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "rgba(220, 38, 38, 0.95)",
            border: "4px solid #FFFFFF",
            borderRadius: 24,
            padding: "20px 48px",
            boxShadow: "0 0 50px rgba(220, 38, 38, 0.8), 0 20px 40px rgba(0,0,0,0.7)",
          }}
        >
          <span
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 64,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "0.08em",
            }}
          >
            DEALER CASES: 100% EMPTY?
          </span>
        </div>

        {/* Sub-badge */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.9)",
            border: "2px solid #F59E0B",
            borderRadius: 16,
            padding: "10px 32px",
          }}
        >
          <span
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 34,
              fontWeight: 800,
              color: "#F59E0B",
            }}
          >
            THE ARTIFICIAL SCARCITY LEVER
          </span>
        </div>
      </div>

      {/* Business Stickman in Pure Shock (Clutching Head / Wide Eyes) */}
      <StickmanAvatar
        x={540}
        y={1220}
        scale={2.2}
        emotion="shock"
        isSpeaking={isSpeaking}
        lookX={0}
      />
    </AbsoluteFill>
  );
};

/**
 * Main Rolex Stickman Short Composition (1080x1920, 30fps, 300 frames)
 */
export const RolexStickmanShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeSec = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: "#080C16" }}>
      {/* Kokoro Neural Voiceover (am_michael @ 1.05x) */}
      <Audio src={staticFile("rolex/audio.mp3")} />

      {/* Perspective Grid Floor */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 600,
          background:
            "linear-gradient(to bottom, rgba(30, 58, 138, 0) 0%, rgba(30, 58, 138, 0.18) 100%)",
          borderTop: "1px solid rgba(56, 189, 248, 0.25)",
        }}
      />

      {/* Header Stamp */}
      <div
        style={{
          position: "absolute",
          top: 90,
          left: 70,
          display: "flex",
          alignItems: "center",
          gap: 14,
          zIndex: 100,
        }}
      >
        <div
          style={{
            background: "rgba(30, 41, 59, 0.9)",
            border: "2px solid #38BDF8",
            borderRadius: 14,
            padding: "10px 24px",
          }}
        >
          <span
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 28,
              fontWeight: 900,
              color: "#38BDF8",
              letterSpacing: "0.08em",
            }}
          >
            THE LINCOLN PENNY #01
          </span>
        </div>
      </div>

      {/* --- SCENE TRANSITIONS (168 frames -> wipe -> 132 frames = 300 frames total) --- */}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={168}>
          <SceneProduction />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 12 })}
        />

        <TransitionSeries.Sequence durationInFrames={132}>
          <SceneEmptyCase />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Word-by-Word Kinetic Subtitle Bar (Faster-Whisper Millisecond Locked) */}
      <KineticCaptions currentTimeSec={currentTimeSec} />

      {/* Broadcast Grade Cinematic Overlay (Film Grain & Lighting) */}
      <BroadcastGrade dark={true} />
    </AbsoluteFill>
  );
};
