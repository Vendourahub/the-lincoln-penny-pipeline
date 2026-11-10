import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AlertTriangle } from "lucide-react";
import { FONTS } from "../fonts";

export const Scene1ParallaxHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps; // 0.0s -> 5.15s

  // Background slow ominous zoom + slight roll
  const bgScale = interpolate(frame, [0, 155], [1.04, 1.17], {
    extrapolateRight: "clamp",
  });
  const bgRotate = interpolate(frame, [0, 155], [-0.8, 0.7], {
    extrapolateRight: "clamp",
  });

  // "$400" slams in at 0.52s (frame 15)
  const priceSpring = spring({
    frame: frame - 14,
    fps,
    config: { damping: 12, stiffness: 185, mass: 0.9 },
  });

  // "lost" triggers at 3.54s (frame 106) -> 3D flip + camera shake + lightning flash
  const lossFrame = 104;
  const flipProgress = spring({
    frame: frame - lossFrame,
    fps,
    config: { damping: 13, stiffness: 170, mass: 0.85 },
  });

  const shakeEnv =
    frame >= lossFrame
      ? Math.exp(-(frame - lossFrame) * 0.16) * 16
      : 0;
  const shakeX = Math.sin(frame * 2.7) * shakeEnv;
  const shakeY = Math.cos(frame * 3.3) * shakeEnv * 0.7;

  // Lightning flash right on "lost"
  const lightningOpacity = interpolate(
    frame,
    [lossFrame - 1, lossFrame + 1, lossFrame + 5, lossFrame + 8, lossFrame + 16],
    [0, 0.45, 0.08, 0.25, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Foreground Boeing 737 2.5D flight path (glides bottom-left -> upper-right)
  const planeX = interpolate(frame, [0, 155], [-130, 115], {
    extrapolateRight: "clamp",
  });
  const planeY = interpolate(frame, [0, 155], [125, 25], {
    extrapolateRight: "clamp",
  });
  const planeScale = interpolate(frame, [0, 155], [0.94, 1.09], {
    extrapolateRight: "clamp",
  });
  const planeRotate = interpolate(frame, [0, 155], [-2.5, 1.8], {
    extrapolateRight: "clamp",
  });

  const isLossPhase = flipProgress > 0.5;

  // Deterministic rain streaks in foreground
  const rainDrops = Array.from({ length: 30 }, (_, i) => {
    const speed = 42 + (i % 5) * 9;
    const xBase = ((i * 173) % 2200) - 140;
    const yOffset = ((frame * speed + i * 190) % 1350) - 180;
    const xPos = xBase - yOffset * 0.22;
    const len = 75 + (i % 4) * 32;
    return { xPos, yOffset, len, opacity: 0.14 + (i % 3) * 0.07 };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#050811",
        overflow: "hidden",
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* LAYER 1: Stormy Runway Background Plate */}
      <AbsoluteFill
        style={{
          transform: `scale(${bgScale}) rotate(${bgRotate}deg)`,
          filter: isLossPhase
            ? " saturate(1.15) contrast(1.08) brightness(0.84)"
            : "contrast(1.05) brightness(0.9)",
        }}
      >
        <Img
          src={staticFile("assets/storm_runway_bg.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Subtle Crimson Atmosphere Tint on Loss */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 38%, rgba(220, 38, 38, 0.34), rgba(5, 8, 17, 0.45) 75%)",
          opacity: flipProgress,
        }}
      />

      {/* Top Documentary Telemetry Pill */}
      <div
        style={{
          position: "absolute",
          top: 46,
          left: 64,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 22px",
          borderRadius: 999,
          background: "rgba(7, 11, 20, 0.78)",
          border: "1px solid rgba(255,255,255,0.16)",
          backdropFilter: "blur(8px)",
          zIndex: 15,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: isLossPhase ? "#FF4444" : "#F5B942",
            boxShadow: `0 0 12px ${isLossPhase ? "#FF4444" : "#F5B942"}`,
          }}
        />
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 18,
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.88)",
            textTransform: "uppercase",
          }}
        >
          THE LINCOLN PENNY // SEAT ECONOMICS
        </span>
      </div>

      {/* LAYER 2: Giant Midground Typography (Positioned BEHIND the 2.5D Plane!) */}
      <div
        style={{
          position: "absolute",
          top: 82,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          perspective: 1100,
          zIndex: 10,
        }}
      >
        {!isLossPhase ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity: interpolate(priceSpring, [0, 0.4], [0, 1], {
                extrapolateRight: "clamp",
              }),
              transform: `scale(${interpolate(priceSpring, [0, 1], [1.45, 1])}) translateY(${interpolate(
                priceSpring,
                [0, 1],
                [-55, 0]
              )}px) rotateX(${interpolate(flipProgress, [0, 0.5], [0, 88])}deg)`,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 24,
                letterSpacing: "0.22em",
                color: "#FCD34D",
                background: "rgba(12, 18, 30, 0.78)",
                border: "1px solid rgba(252, 211, 77, 0.4)",
                padding: "8px 24px",
                borderRadius: 8,
                marginBottom: 4,
              }}
            >
              PASSENGER FARE PAID
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 285,
                fontWeight: 700,
                lineHeight: 0.96,
                letterSpacing: "-0.03em",
                color: "#FFFBEB",
                textShadow:
                  "0 18px 55px rgba(0,0,0,0.85), 0 0 70px rgba(245, 185, 66, 0.32)",
              }}
            >
              $400
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transform: `rotateX(${interpolate(
                flipProgress,
                [0.5, 1],
                [-88, 0]
              )}deg) scale(${interpolate(flipProgress, [0.5, 1], [1.18, 1])})`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: FONTS.mono,
                fontSize: 24,
                letterSpacing: "0.18em",
                color: "#FECACA",
                background: "rgba(127, 29, 29, 0.88)",
                border: "1px solid rgba(252, 165, 165, 0.55)",
                padding: "8px 24px",
                borderRadius: 8,
                marginBottom: 8,
                boxShadow: "0 10px 30px rgba(220, 38, 38, 0.45)",
              }}
            >
              <AlertTriangle size={24} color="#FCA5A5" />
              NET OPERATING MARGIN ON YOUR SEAT
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 248,
                fontWeight: 700,
                lineHeight: 0.96,
                letterSpacing: "-0.03em",
                color: "#FF4D4D",
                textShadow:
                  "0 18px 60px rgba(0,0,0,0.92), 0 0 85px rgba(239, 68, 68, 0.65)",
              }}
            >
              -$18.40
            </div>
          </div>
        )}
      </div>

      {/* LAYER 3: 2.5D Foreground Airliner Cutout (Flies OVER the bottom of the Giant Number!) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "52%",
          width: 1260,
          transform: `translate(-50%, -50%) translate(${planeX}px, ${planeY}px) scale(${planeScale}) rotate(${planeRotate}deg)`,
          zIndex: 22,
          filter: "drop-shadow(0 36px 48px rgba(0,0,0,0.82))",
        }}
      >
        <Img
          src={staticFile("assets/boeing_cutout.png")}
          style={{ width: "100%", height: "auto" }}
        />
      </div>

      {/* LAYER 4: Foreground Atmospheric Rain Streaks */}
      <svg
        width="1920"
        height="1080"
        style={{ position: "absolute", inset: 0, zIndex: 28, pointerEvents: "none" }}
      >
        {rainDrops.map((d, idx) => (
          <line
            key={idx}
            x1={d.xPos}
            y1={d.yOffset}
            x2={d.xPos - d.len * 0.22}
            y2={d.yOffset + d.len}
            stroke={`rgba(210, 230, 255, ${d.opacity})`}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
      </svg>

      {/* Lightning Flash Overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: "#E0F2FE",
          opacity: lightningOpacity,
          mixBlendMode: "screen",
          zIndex: 30,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
