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
import { FONTS } from "../fonts";

export const Scene5VaultFinale: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Scene 5 starts at frame 967 (32.23s), runs 233 frames to 1200 (40.00s)
  const localSec = frame / fps;

  // Whisper cues relative to 32.23s:
  // "Airlines aren't airlines anymore" @ 32.50..34.08s -> local 0.27..1.85s
  // "unregulated banks with wings" @ 35.10..37.06s -> local 2.87..4.83s
  // "and the planes are just the bait" @ 37.54..39.06s -> local 5.31..6.83s

  const bgScale = interpolate(frame, [0, 233], [1.14, 1.02], {
    extrapolateRight: "clamp",
  });

  // Strikethrough across "AIRLINES" at local 1.05s ("airlines anymore")
  const strikePct = interpolate(localSec, [0.95, 1.45], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "BANKS WITH WINGS" & 2.5D Winged Titanium Card spring in at local 2.75s
  const heroSpring = spring({
    frame: frame - Math.round(2.75 * fps),
    fps,
    config: { damping: 13, stiffness: 135 },
  });

  // "THE PLANES ARE JUST THE BAIT" badge slams in at local 5.35s
  const baitSpring = spring({
    frame: frame - Math.round(5.35 * fps),
    fps,
    config: { damping: 12, stiffness: 175 },
  });

  // Gentle 2.5D floating motion for the winged card cutout
  const floatY = Math.sin(frame * 0.08) * 12;
  const floatRot = Math.sin(frame * 0.05) * 2.2;

  // Specular shine sweeping across the card
  const shineX = interpolate(localSec, [3.2, 5.4], [-35, 135], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Rising golden vault dust motes
  const motes = Array.from({ length: 24 }, (_, i) => {
    const x = (i * 197 + Math.sin(frame * 0.03 + i) * 35) % 1920;
    const y = 1120 - ((frame * (1.4 + (i % 4) * 0.55) + i * 95) % 1180);
    const size = 3 + (i % 4) * 2;
    return { x, y, size, alpha: 0.22 + (i % 3) * 0.16 };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#050608",
        overflow: "hidden",
      }}
    >
      {/* LAYER 1: Obsidian Bank Vault Background Plate */}
      <AbsoluteFill
        style={{
          transform: `scale(${bgScale})`,
          filter: "brightness(0.76) contrast(1.12)",
        }}
      >
        <Img
          src={staticFile("assets/vault_bg.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Warm Volumetric Gold Spotlight */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 48%, rgba(245, 185, 66, 0.24) 0%, rgba(5, 6, 8, 0.72) 72%)",
        }}
      />

      {/* Rising Gold Dust Particles */}
      <svg
        width="1920"
        height="1080"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 8 }}
      >
        {motes.map((m, idx) => (
          <circle
            key={idx}
            cx={m.x}
            cy={m.y}
            r={m.size}
            fill={`rgba(253, 224, 71, ${m.alpha})`}
          />
        ))}
      </svg>

      {/* TOP STRIKETHROUGH STATEMENT ("AIRLINES AREN'T AIRLINES ANYMORE") */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <div
          style={{
            position: "relative",
            fontFamily: FONTS.mono,
            fontSize: 30,
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.85)",
            padding: "8px 24px",
          }}
        >
          AIRLINES AREN&apos;T AIRLINES ANYMORE
          <div
            style={{
              position: "absolute",
              left: "4%",
              top: "52%",
              height: 5,
              width: `${strikePct * 0.92}%`,
              background: "#EF4444",
              boxShadow: "0 0 18px #EF4444",
              borderRadius: 4,
            }}
          />
        </div>

        {/* MASSIVE GOLD HEADLINE: "BANKS WITH WINGS" */}
        {heroSpring > 0.01 && (
          <div
            style={{
              marginTop: 6,
              fontFamily: FONTS.display,
              fontSize: 122,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.0,
              background:
                "linear-gradient(180deg, #FFFBEB 0%, #FCD34D 52%, #D97706 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.9))",
              transform: `scale(${interpolate(heroSpring, [0, 1], [0.78, 1])})`,
              opacity: interpolate(heroSpring, [0, 0.35], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            BANKS WITH WINGS
          </div>
        )}
      </div>

      {/* LAYER 3: 2.5D PARALLAX WINGED CREDIT CARD HERO CUTOUT */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "56%",
          width: 1080,
          transform: `translate(-50%, -50%) translateY(${
            interpolate(heroSpring, [0, 1], [140, 0]) + floatY
          }px) scale(${interpolate(heroSpring, [0, 1], [0.65, 1.02])}) rotate(${floatRot}deg)`,
          opacity:
            localSec < 2.65
              ? interpolate(localSec, [0.3, 1.2], [0, 0.22], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 1,
          zIndex: 18,
          filter:
            "drop-shadow(0 42px 65px rgba(0,0,0,0.92)) drop-shadow(0 0 55px rgba(245, 185, 66, 0.28))",
        }}
      >
        <div style={{ position: "relative", overflow: "hidden" }}>
          <Img
            src={staticFile("assets/card_wings_cutout.png")}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
          {/* Specular Light Sweep Overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${shineX}%`,
              width: "22%",
              background:
                "linear-gradient(105deg, transparent 0%, rgba(255,250,220,0.32) 50%, transparent 100%)",
              transform: "skewX(-22deg)",
              mixBlendMode: "overlay",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* FINAL PUNCHLINE STAMP ("THE PLANES ARE JUST THE BAIT") */}
      {baitSpring > 0.01 && (
        <div
          style={{
            position: "absolute",
            bottom: 132,
            left: "50%",
            transform: `translateX(-50%) scale(${interpolate(
              baitSpring,
              [0, 1],
              [1.35, 1]
            )})`,
            opacity: interpolate(baitSpring, [0, 0.3], [0, 1], {
              extrapolateRight: "clamp",
            }),
            background: "rgba(12, 16, 26, 0.92)",
            border: "2px solid #F5B942",
            padding: "14px 44px",
            borderRadius: 14,
            boxShadow: "0 20px 55px rgba(0,0,0,0.85)",
            zIndex: 30,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.sans,
              fontWeight: 900,
              fontSize: 36,
              letterSpacing: "0.08em",
              color: "#FFFBEB",
            }}
          >
            THE PLANES ARE JUST{" "}
            <span style={{ color: "#FF5252" }}>THE BAIT.</span>
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
