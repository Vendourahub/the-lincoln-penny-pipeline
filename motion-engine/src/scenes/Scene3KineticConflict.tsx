import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Lottie } from "@remotion/lottie";
import { HelpCircle, TrendingDown, TrendingUp } from "lucide-react";
import { FONTS } from "../fonts";
import { radarPulseLottie } from "../lottieData";

export const Scene3KineticConflict: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Scene 3 spans global 13.531s -> 22.025s (duration 8.494s = 255 frames)
  const localSec = frame / fps;

  // Key Whisper cues relative to 13.531s:
  // "billions" @ 15.40s -> local 1.87s
  // "flying planes destroys cash" @ 17.78s..19.30s -> local 4.25s..5.77s
  // "where does the money come from?" @ 20.28s -> local 6.75s

  const leftBarSpring = spring({
    frame: frame - Math.round(1.45 * fps),
    fps,
    config: { damping: 13, stiffness: 120 },
  });

  const rightDropSpring = spring({
    frame: frame - Math.round(4.15 * fps),
    fps,
    config: { damping: 12, stiffness: 145 },
  });

  const questionSpring = spring({
    frame: frame - Math.round(6.55 * fps),
    fps,
    config: { damping: 11, stiffness: 170 },
  });

  const billionsCounter = interpolate(leftBarSpring, [0, 1], [0, 5.2]).toFixed(1);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#060A14",
        overflow: "hidden",
      }}
    >
      {/* Animated Financial Terminal Perspective Grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(56, 189, 248, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.07) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          backgroundPosition: `0px ${-(frame * 0.8)}px`,
        }}
      />

      {/* Ambient Dual Glow */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 28% 55%, rgba(16, 185, 129, 0.16), transparent 50%), radial-gradient(circle at 74% 55%, rgba(239, 68, 68, 0.16), transparent 50%)",
        }}
      />

      {/* Top Header with Live @remotion/lottie Radar Vector */}
      <div
        style={{
          position: "absolute",
          top: 42,
          left: 72,
          right: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          paddingBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52 }}>
            <Lottie
              animationData={radarPulseLottie}
              style={{ width: 52, height: 52 }}
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 17,
                letterSpacing: "0.18em",
                color: "#F5B942",
              }}
            >
              THE MULTI-BILLION DOLLAR PARADOX
            </div>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 30,
                fontWeight: 800,
                color: "#F8FAFC",
              }}
            >
              Major U.S. Carrier Earnings vs. Passenger Flight Operations
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 20,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          GAAP EARNINGS AUDIT
        </div>
      </div>

      {/* SPLIT-SCREEN COMPARISON STAGE */}
      <div
        style={{
          position: "absolute",
          top: 165,
          left: 90,
          right: 90,
          bottom: 145,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 54,
          filter: questionSpring > 0.05 ? `blur(${questionSpring * 5}px) brightness(${1 - questionSpring * 0.45})` : "none",
        }}
      >
        {/* LEFT PANEL: BILLIONS IN ANNUAL PROFIT */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.78)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            borderRadius: 28,
            padding: "38px 46px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 18px",
                borderRadius: 999,
                background: "rgba(16, 185, 129, 0.16)",
                color: "#34D399",
                fontFamily: FONTS.mono,
                fontSize: 19,
                letterSpacing: "0.1em",
              }}
            >
              <TrendingUp size={22} /> REPORTED ANNUAL NET INCOME
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 122,
                fontWeight: 700,
                color: "#FCD34D",
                marginTop: 18,
                lineHeight: 1,
                textShadow: "0 0 50px rgba(252, 211, 77, 0.3)",
              }}
            >
              +${billionsCounter}B
            </div>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 28,
                color: "rgba(255,255,255,0.78)",
                marginTop: 10,
              }}
            >
              Wall Street headline profit reported to shareholders
            </div>
          </div>

          {/* Rising 3D Emerald/Gold Column */}
          <div
            style={{
              height: 290,
              display: "flex",
              alignItems: "flex-end",
              gap: 24,
              paddingTop: 20,
            }}
          >
            {[0.45, 0.62, 0.78, 1.0].map((mult, idx) => {
              const barH = Math.max(12, 250 * mult * leftBarSpring);
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: barH,
                    borderRadius: "14px 14px 4px 4px",
                    background:
                      idx === 3
                        ? "linear-gradient(180deg, #FCD34D 0%, #10B981 100%)"
                        : "linear-gradient(180deg, rgba(52,211,153,0.65) 0%, rgba(16,185,129,0.2) 100%)",
                    boxShadow:
                      idx === 3
                        ? "0 0 38px rgba(252, 211, 77, 0.35)"
                        : "none",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: FLYING PLANES DESTROYS CASH */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.78)",
            border: "1px solid rgba(239, 68, 68, 0.38)",
            borderRadius: 28,
            padding: "38px 46px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: interpolate(localSec, [3.8, 4.3], [0.22, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(rightDropSpring, [0, 1], [35, 0])}px)`,
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 18px",
                borderRadius: 999,
                background: "rgba(239, 68, 68, 0.18)",
                color: "#F87171",
                fontFamily: FONTS.mono,
                fontSize: 19,
                letterSpacing: "0.1em",
              }}
            >
              <TrendingDown size={22} /> CORE FLIGHT OPERATIONS
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 98,
                fontWeight: 700,
                color: "#FF5252",
                marginTop: 22,
                lineHeight: 1.04,
                textShadow: "0 0 45px rgba(239, 68, 68, 0.35)",
              }}
            >
              CASH FURNACE
            </div>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 28,
                color: "rgba(255,255,255,0.78)",
                marginTop: 12,
              }}
            >
              Fuel spikes, maintenance & weather wipe out ticket margins
            </div>
          </div>

          {/* Negative Bleed Bars */}
          <div
            style={{
              height: 250,
              borderTop: "2px dashed rgba(248, 113, 113, 0.55)",
              display: "flex",
              alignItems: "flex-start",
              gap: 24,
              paddingTop: 12,
            }}
          >
            {[0.5, 0.72, 0.86, 1.0].map((mult, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: Math.max(8, 195 * mult * rightDropSpring),
                  borderRadius: "4px 4px 14px 14px",
                  background:
                    "linear-gradient(180deg, rgba(239,68,68,0.28) 0%, #EF4444 100%)",
                  boxShadow: "0 12px 30px rgba(239, 68, 68, 0.28)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CENTER MYSTERY SPOTLIGHT OVERLAY ("WHERE DOES THE MONEY COME FROM?") */}
      {questionSpring > 0.01 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
          }}
        >
          <div
            style={{
              transform: `scale(${interpolate(questionSpring, [0, 1], [0.72, 1])})`,
              opacity: interpolate(questionSpring, [0, 0.35], [0, 1], {
                extrapolateRight: "clamp",
              }),
              background: "rgba(8, 13, 26, 0.94)",
              border: "2px solid #F5B942",
              borderRadius: 32,
              padding: "48px 78px",
              boxShadow:
                "0 35px 90px rgba(0,0,0,0.85), 0 0 80px rgba(245, 185, 66, 0.28)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              maxWidth: 1220,
            }}
          >
            <div
              style={{
                width: 82,
                height: 82,
                borderRadius: "50%",
                background: "rgba(245, 185, 66, 0.16)",
                border: "2px solid #F5B942",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 22,
              }}
            >
              <HelpCircle size={46} color="#FCD34D" />
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 82,
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              WHERE DOES THE{" "}
              <span style={{ color: "#FCD34D" }}>MONEY</span> COME FROM?
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
