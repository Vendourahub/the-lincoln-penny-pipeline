import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONTS } from "./fonts";
import { ThreeExplodedConsole } from "./components/ThreeExplodedConsole";
import {
  AlertTriangle,
  Cpu,
  Flame,
  Layers,
  Lock,
  MinusCircle,
  Percent,
  PlusCircle,
  ShieldAlert,
  Zap,
} from "lucide-react";

export const SonyExplodedTeardownShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localSec = frame / fps;

  // Screen shake on mechanical impact (at frame 42 and frame 235)
  const isImpact1 = frame >= 40 && frame <= 55;
  const isImpact2 = frame >= 230 && frame <= 245;
  const shakeIntensity = isImpact1
    ? interpolate(frame, [40, 55], [16, 0])
    : isImpact2
    ? interpolate(frame, [230, 245], [20, 0])
    : 0;
  const shakeX = Math.sin(frame * 1.5) * shakeIntensity;
  const shakeY = Math.cos(frame * 1.8) * shakeIntensity;

  // Phase Springs
  // Phase 1: Hook (0 - 1.5s / 0-45 frames)
  const hookSpring = spring({
    frame,
    fps,
    config: { damping: 11, stiffness: 180 },
  });

  // Phase 2: Exploded BOM Callouts (1.5 - 7.5s / 45-225 frames)
  const bomSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 12, stiffness: 140 },
  });

  const apuCallout = spring({
    frame: frame - 65,
    fps,
    config: { damping: 11, stiffness: 160 },
  });

  const ramCallout = spring({
    frame: frame - 105,
    fps,
    config: { damping: 11, stiffness: 160 },
  });

  const heatsinkCallout = spring({
    frame: frame - 145,
    fps,
    config: { damping: 11, stiffness: 160 },
  });

  // Phase 3: Hardware Bleed (7.5 - 11.5s / 225-345 frames)
  const bleedSpring = spring({
    frame: frame - 230,
    fps,
    config: { damping: 12, stiffness: 170 },
  });

  // Phase 4: Tollbooth Lock (11.5 - 15.0s / 345-450 frames)
  const tollSpring = spring({
    frame: frame - 345,
    fps,
    config: { damping: 11, stiffness: 190 },
  });

  // Dynamic Tally calculation (Frame 50 to 220 rolls from $0 to $600)
  const currentCost = Math.round(
    interpolate(frame, [50, 95, 140, 185, 220], [0, 180, 265, 410, 600], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#030712",
        overflow: "hidden",
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* 1. LAYER: VIBRANT CYBER-SLATE BACKGROUND WITH VOLUMETRIC GRADIENT */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(30, 58, 138, 0.42) 0%, rgba(15, 23, 42, 0.85) 55%, #030712 95%)",
        }}
      />

      {/* Pulsing Blueprint Laser Grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: interpolate(frame, [0, 60], [0.4, 0.85]),
        }}
      />

      {/* 2. LAYER: FULL-SCREEN 3D THREE.JS EXPLODED HARDWARE CONSOLE */}
      <AbsoluteFill style={{ zIndex: 5 }}>
        <ThreeExplodedConsole width={1080} height={1920} />
      </AbsoluteFill>

      {/* 3. LAYER: TOP BRAND & STEP PROGRESSION */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 48,
          right: 48,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(15, 23, 42, 0.88)",
            border: "1.5px solid rgba(56, 189, 248, 0.35)",
            padding: "8px 20px",
            borderRadius: 999,
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#38BDF8",
              boxShadow: "0 0 12px #38BDF8",
            }}
          />
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 18,
              fontWeight: 700,
              color: "#E0F2FE",
              letterSpacing: "0.12em",
            }}
          >
            FORENSIC TEARDOWN 01
          </span>
        </div>

        {/* Live Rolling Bill of Materials Counter */}
        <div
          style={{
            background:
              currentCost >= 500
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(185, 28, 28, 0.6) 100%)"
                : "rgba(15, 23, 42, 0.88)",
            border: `1.5px solid ${currentCost >= 500 ? "#EF4444" : "rgba(252, 211, 77, 0.4)"}`,
            padding: "8px 22px",
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: currentCost >= 500 ? "0 0 25px rgba(239, 68, 68, 0.6)" : "none",
          }}
        >
          <span style={{ fontFamily: FONTS.mono, fontSize: 16, color: "#94A3B8" }}>
            BOM COST:
          </span>
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 26,
              fontWeight: 800,
              color: currentCost >= 500 ? "#FCA5A5" : "#FDE68A",
            }}
          >
            ${currentCost}
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PHASE 1 OVERLAY: THE INSTANT SHOCK HOOK (0 - 2.5s) */}
      {/* ========================================================= */}
      {localSec < 3.2 && (
        <div
          style={{
            position: "absolute",
            top: 240,
            left: 48,
            right: 48,
            textAlign: "center",
            zIndex: 30,
            transform: `scale(${interpolate(hookSpring, [0, 1], [0.75, 1])})`,
            opacity: interpolate(localSec, [2.5, 3.2], [1, 0]),
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(239, 68, 68, 0.22)",
              border: "2px solid #EF4444",
              color: "#FCA5A5",
              padding: "10px 24px",
              borderRadius: 14,
              fontFamily: FONTS.mono,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.15em",
              marginBottom: 16,
              boxShadow: "0 0 35px rgba(239, 68, 68, 0.5)",
            }}
          >
            <ShieldAlert size={28} />
            CASH LOSS CONFIRMED
          </div>

          <h1
            style={{
              fontFamily: FONTS.display,
              fontSize: 82,
              fontWeight: 900,
              lineHeight: 0.95,
              color: "#FFFFFF",
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
              textShadow: "0 10px 40px rgba(0,0,0,0.85)",
              margin: 0,
            }}
          >
            Sony Loses <span style={{ color: "#EF4444" }}>$100</span>
          </h1>

          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 38,
              fontWeight: 700,
              color: "#FEF08A",
              marginTop: 12,
              textShadow: "0 4px 20px rgba(0,0,0,0.9)",
            }}
          >
            On Every Single Console Sold
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PHASE 2 OVERLAY: EXPLODED HUD CALLOUTS (2.5 - 7.5s) */}
      {/* ========================================================= */}
      {localSec >= 1.5 && localSec < 8.0 && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 35 }}>
          {/* 1. AMD APU Callout (Left Anchor) */}
          <div
            style={{
              position: "absolute",
              top: 520,
              left: 48,
              background: "rgba(15, 23, 42, 0.92)",
              border: "2px solid #38BDF8",
              borderRadius: 18,
              padding: "16px 24px",
              boxShadow: "0 15px 45px rgba(2, 132, 199, 0.4)",
              transform: `translateX(${interpolate(apuCallout, [0, 1], [-250, 0])}px)`,
              opacity: apuCallout,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#38BDF8" }}>
              <Cpu size={26} />
              <span style={{ fontFamily: FONTS.mono, fontSize: 16, fontWeight: 700 }}>
                CUSTOM AMD ZEN 2 APU
              </span>
            </div>
            <div style={{ fontFamily: FONTS.display, fontSize: 44, fontWeight: 800, color: "#FFF" }}>
              $180 <span style={{ fontSize: 20, color: "#94A3B8" }}>/ unit</span>
            </div>
          </div>

          {/* 2. GDDR6 RAM Callout (Right Anchor) */}
          <div
            style={{
              position: "absolute",
              top: 720,
              right: 48,
              background: "rgba(15, 23, 42, 0.92)",
              border: "2px solid #818CF8",
              borderRadius: 18,
              padding: "16px 24px",
              textAlign: "right",
              boxShadow: "0 15px 45px rgba(99, 102, 241, 0.4)",
              transform: `translateX(${interpolate(ramCallout, [0, 1], [250, 0])}px)`,
              opacity: ramCallout,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, color: "#818CF8" }}>
              <span style={{ fontFamily: FONTS.mono, fontSize: 16, fontWeight: 700 }}>
                16GB GDDR6 MEMORY
              </span>
              <Layers size={26} />
            </div>
            <div style={{ fontFamily: FONTS.display, fontSize: 44, fontWeight: 800, color: "#FFF" }}>
              $85 <span style={{ fontSize: 20, color: "#94A3B8" }}>/ unit</span>
            </div>
          </div>

          {/* 3. Liquid Metal & Copper Heatsink (Bottom Center) */}
          <div
            style={{
              position: "absolute",
              bottom: 420,
              left: 64,
              right: 64,
              background: "rgba(15, 23, 42, 0.92)",
              border: "2px solid #F59E0B",
              borderRadius: 18,
              padding: "16px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 15px 45px rgba(217, 119, 6, 0.4)",
              transform: `translateY(${interpolate(heatsinkCallout, [0, 1], [150, 0])}px)`,
              opacity: heatsinkCallout,
            }}
          >
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 16, fontWeight: 700, color: "#FBBF24" }}>
                LIQUID METAL & THERMAL SINK
              </div>
              <div style={{ fontFamily: FONTS.display, fontSize: 38, fontWeight: 800, color: "#FFF" }}>
                $60 <span style={{ fontSize: 18, color: "#94A3B8" }}>Custom Cooling</span>
              </div>
            </div>
            <Flame size={42} color="#F59E0B" />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PHASE 3 OVERLAY: THE MASSIVE HARDWARE BLEED (7.5 - 11.5s) */}
      {/* ========================================================= */}
      {localSec >= 7.5 && localSec < 12.0 && (
        <div
          style={{
            position: "absolute",
            top: 240,
            left: 48,
            right: 48,
            zIndex: 45,
            textAlign: "center",
            transform: `scale(${interpolate(bleedSpring, [0, 1], [0.8, 1])})`,
            opacity: interpolate(localSec, [7.5, 7.8], [0, 1]),
          }}
        >
          {/* Big Balance Sheet Comparison Card */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.95)",
              border: "3px solid #EF4444",
              borderRadius: 28,
              padding: "36px 32px",
              boxShadow: "0 25px 70px rgba(239, 68, 68, 0.55)",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 20,
                fontWeight: 800,
                color: "#FCA5A5",
                letterSpacing: "0.15em",
                marginBottom: 12,
              }}
            >
              PLAYGROUND ARITHMETIC
            </div>

            <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: FONTS.body, fontSize: 20, color: "#94A3B8" }}>
                  Retail Price
                </div>
                <div style={{ fontFamily: FONTS.display, fontSize: 52, fontWeight: 900, color: "#10B981" }}>
                  $499
                </div>
              </div>

              <div style={{ fontFamily: FONTS.display, fontSize: 56, fontWeight: 900, color: "#64748B" }}>
                -
              </div>

              <div>
                <div style={{ fontFamily: FONTS.body, fontSize: 20, color: "#94A3B8" }}>
                  Factory Cost
                </div>
                <div style={{ fontFamily: FONTS.display, fontSize: 52, fontWeight: 900, color: "#EF4444" }}>
                  $600
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: "2px dashed rgba(255,255,255,0.2)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 16,
              }}
            >
              <MinusCircle size={48} color="#EF4444" />
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 68,
                  fontWeight: 900,
                  color: "#EF4444",
                  lineHeight: 1,
                }}
              >
                -$101 LOSS
              </div>
            </div>

            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 26,
                fontWeight: 700,
                color: "#E2E8F0",
                marginTop: 16,
              }}
            >
              Before Sony even pays shipping or retail margins.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PHASE 4 OVERLAY: THE 30% DIGITAL TOLLBOOTH (11.5 - 15.0s) */}
      {/* ========================================================= */}
      {localSec >= 11.2 && (
        <div
          style={{
            position: "absolute",
            top: 220,
            left: 48,
            right: 48,
            zIndex: 45,
            textAlign: "center",
            transform: `scale(${interpolate(tollSpring, [0, 1], [0.75, 1])})`,
            opacity: interpolate(localSec, [11.2, 11.6], [0, 1]),
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)",
              border: "3px solid #F59E0B",
              borderRadius: 28,
              padding: "36px 32px",
              boxShadow: "0 25px 70px rgba(245, 158, 11, 0.5)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#F59E0B",
                color: "#000",
                padding: "8px 20px",
                borderRadius: 999,
                fontFamily: FONTS.mono,
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: "0.12em",
                marginBottom: 16,
              }}
            >
              <Lock size={20} />
              THE DIGITAL TOLLBOOTH
            </div>

            <h2
              style={{
                fontFamily: FONTS.display,
                fontSize: 72,
                fontWeight: 900,
                color: "#FFFBEB",
                lineHeight: 0.95,
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              The 30% Tax
            </h2>

            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 32,
                fontWeight: 700,
                color: "#FDE68A",
                marginTop: 18,
                lineHeight: 1.25,
              }}
            >
              Every $70 Game You Buy Hands Sony $21 in Pure Profit.
            </div>

            {/* Seamless Loop Cue */}
            <div
              style={{
                marginTop: 28,
                padding: "16px 20px",
                background: "rgba(0,0,0,0.55)",
                borderRadius: 18,
                border: "1.5px solid rgba(252, 211, 77, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <Zap size={28} color="#FCD34D" />
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#FFF",
                  letterSpacing: "0.08em",
                }}
              >
                AND THAT IS WHY SONY LOSES $100...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Subtitle HUD Bar at 68% height */}
      <div
        style={{
          position: "absolute",
          bottom: 240,
          left: 48,
          right: 48,
          textAlign: "center",
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1.5px solid rgba(255,255,255,0.18)",
            padding: "16px 32px",
            borderRadius: 22,
            boxShadow: "0 15px 40px rgba(0,0,0,0.9)",
          }}
        >
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 36,
              fontWeight: 800,
              color:
                localSec < 2.5
                  ? "#F87171"
                  : localSec < 7.5
                  ? "#38BDF8"
                  : localSec < 11.5
                  ? "#EF4444"
                  : "#FCD34D",
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
            }}
          >
            {localSec < 2.5 && "Every time Sony sells a PS5, they lose $100."}
            {localSec >= 2.5 && localSec < 5.0 && "Inside the box: $180 custom AMD processor..."}
            {localSec >= 5.0 && localSec < 7.5 && "...$85 RAM, $60 cooling. Total cost: $600."}
            {localSec >= 7.5 && localSec < 11.5 && "They bleed cash the second you leave the store."}
            {localSec >= 11.5 && "Because the console is just bait for the 30% tollbooth."}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
