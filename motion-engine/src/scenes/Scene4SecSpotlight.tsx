import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Award, CheckCircle2, FileText } from "lucide-react";
import { FONTS } from "../fonts";

export const Scene4SecSpotlight: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Scene 4 starts at frame 656 (21.87s), runs 321 frames to 977 (32.57s)
  const localSec = frame / fps;

  // Whisper cues relative to 21.87s:
  // "Delta's SEC filing" @ 22.84..24.72s -> local 0.97..2.85s
  // "American Express paid them" @ 26.00..27.54s -> local 4.13..5.67s
  // "$6.5 billion" @ 27.54..29.12s -> local 5.67..7.25s
  // "just for frequent flyer miles" @ 29.12..31.86s -> local 7.25..9.99s

  // Smooth 3D camera push-in onto Item 7 of the 10-K page
  const camPush = interpolate(localSec, [0, 3.8, 10.4], [0, 0.78, 1], {
    extrapolateRight: "clamp",
  });

  const rotX = interpolate(camPush, [0, 1], [24, 9]);
  const rotY = interpolate(camPush, [0, 1], [-16, -3]);
  const rotZ = interpolate(camPush, [0, 1], [-4.5, -0.8]);
  const docScale = interpolate(camPush, [0, 1], [0.86, 1.07]);
  const docY = interpolate(camPush, [0, 1], [35, -75]);

  // Neon yellow marker sweeps across the exact SEC sentence from 4.0s -> 6.8s
  const hlLine1 = interpolate(localSec, [4.0, 5.3], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hlLine2 = interpolate(localSec, [5.3, 6.8], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Floating 3D Evidence Callout Card springs out above the page at 5.5s ("$6.5 billion")
  const calloutSpring = spring({
    frame: frame - Math.round(5.45 * fps),
    fps,
    config: { damping: 12, stiffness: 155 },
  });

  const billionVal = interpolate(
    localSec,
    [5.55, 6.95],
    [0.0, 6.5],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  ).toFixed(1);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080D1A",
        backgroundImage:
          "radial-gradient(circle at 50% 42%, #172542 0%, #060913 78%)",
        perspective: 1350,
        overflow: "hidden",
      }}
    >
      {/* Top Evidence Stamp */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 68,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 22px",
          borderRadius: 999,
          background: "rgba(15, 23, 42, 0.85)",
          border: "1px solid rgba(252, 211, 77, 0.35)",
          zIndex: 35,
        }}
      >
        <FileText size={20} color="#FCD34D" />
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 18,
            letterSpacing: "0.14em",
            color: "#F8FAFC",
          }}
        >
          PRIMARY SOURCE // DELTA AIR LINES FORM 10-K
        </span>
      </div>

      {/* 3D PERSPECTIVE STAGE */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            width: 1320,
            background: "#FAF7F0",
            borderRadius: 14,
            padding: "54px 74px",
            boxShadow:
              "0 60px 120px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.3)",
            transform: `translateY(${docY}px) scale(${docScale}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
            transformStyle: "preserve-3d",
            color: "#111827",
          }}
        >
          {/* Official SEC 10-K Header */}
          <div
            style={{
              borderBottom: "3px double #111827",
              paddingBottom: 18,
              marginBottom: 26,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 17,
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                  color: "#374151",
                }}
              >
                UNITED STATES SECURITIES AND EXCHANGE COMMISSION
              </div>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 42,
                  fontWeight: 700,
                  color: "#0F172A",
                  marginTop: 4,
                }}
              >
                DELTA AIR LINES, INC. — FORM 10-K
              </div>
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 18,
                color: "#4B5563",
                textAlign: "right",
              }}
            >
              <div>COMMISSION FILE NO. 001-05424</div>
              <div style={{ color: "#B91C1C", fontWeight: 700 }}>
                ITEM 7. MD&A — LOYALTY PROGRAM
              </div>
            </div>
          </div>

          {/* Muted Surrounding Context Paragraph */}
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 23,
              lineHeight: 1.55,
              color: "rgba(31, 41, 55, 0.52)",
              marginBottom: 24,
            }}
          >
            Our SkyMiles loyalty program generates high-margin cash flows through
            partnerships with financial institutions, retail brands, and hotel
            chains. The most significant partner agreement is our co-brand credit
            card relationship with American Express.
          </p>

          {/* SPOTLIGHT EXTRACT WITH LIVE NEON MARKER SWEEP */}
          <div
            style={{
              background: "#FFFFFF",
              border: "2px solid #CBD5E1",
              borderRadius: 12,
              padding: "28px 34px",
              position: "relative",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 16,
                letterSpacing: "0.12em",
                color: "#64748B",
                marginBottom: 12,
              }}
            >
              NOTE 3 — LOYALTY PROGRAM REMUNERATION (AUDITED)
            </div>

            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 31,
                lineHeight: 1.58,
                color: "#0F172A",
                fontWeight: 600,
              }}
            >
              <span>“During the fiscal year, </span>
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(250, 204, 21, 0.65), rgba(253, 224, 71, 0.72))",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${hlLine1}% 92%`,
                  backgroundPosition: "0 85%",
                  padding: "2px 4px",
                }}
              >
                American Express cash remuneration to Delta
              </span>{" "}
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(250, 204, 21, 0.72), rgba(245, 158, 11, 0.55))",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${hlLine2}% 92%`,
                  backgroundPosition: "0 85%",
                  padding: "2px 6px",
                  fontWeight: 700,
                }}
              >
                totaled $6.5 billion just for SkyMiles frequent flyer miles.”
              </span>
            </div>
          </div>

          {/* Financial Table Excerpt */}
          <div
            style={{
              marginTop: 26,
              display: "grid",
              gridTemplateColumns: "2.2fr 1fr 1fr 1fr",
              borderTop: "2px solid #1E293B",
              borderBottom: "2px solid #1E293B",
              padding: "14px 8px",
              fontFamily: FONTS.mono,
              fontSize: 20,
              color: "#334155",
            }}
          >
            <div style={{ fontWeight: 700 }}>Amex Co-Brand Cash Inflow</div>
            <div>$4.5B (2021)</div>
            <div>$5.5B (2022)</div>
            <div style={{ color: "#047857", fontWeight: 700 }}>$6.5B (Current)</div>
          </div>
        </div>

        {/* FLOATING 3D CALLOUT CARD IN FOREGROUND Z-SPACE */}
        {calloutSpring > 0.01 && (
          <div
            style={{
              position: "absolute",
              right: 105,
              bottom: 155,
              transform: `translateZ(120px) scale(${interpolate(
                calloutSpring,
                [0, 1],
                [0.65, 1]
              )}) translateY(${interpolate(calloutSpring, [0, 1], [45, 0])}px)`,
              opacity: interpolate(calloutSpring, [0, 0.3], [0, 1], {
                extrapolateRight: "clamp",
              }),
              background: "linear-gradient(135deg, #0B1325 0%, #162444 100%)",
              border: "2px solid #FCD34D",
              borderRadius: 24,
              padding: "28px 42px",
              boxShadow:
                "0 35px 75px rgba(0,0,0,0.85), 0 0 55px rgba(252, 211, 77, 0.32)",
              zIndex: 45,
              minWidth: 530,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: FONTS.mono,
                fontSize: 18,
                letterSpacing: "0.14em",
                color: "#34D399",
              }}
            >
              <CheckCircle2 size={22} color="#34D399" />
              AMERICAN EXPRESS → DELTA AIR LINES
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 104,
                fontWeight: 700,
                color: "#FCD34D",
                lineHeight: 1.02,
                marginTop: 8,
              }}
            >
              ${billionVal}B
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: FONTS.sans,
                fontSize: 24,
                fontWeight: 700,
                color: "#F8FAFC",
                marginTop: 6,
              }}
            >
              <Award size={24} color="#FCD34D" />
              Paid purely for Frequent Flyer Miles
            </div>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
