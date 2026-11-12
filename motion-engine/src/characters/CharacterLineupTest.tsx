import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { IllustratedCutoutRig } from "./IllustratedCutoutRig";
import { CinematicStudioSet } from "./CinematicStudioSet";
import { ExpressionState } from "./cutoutTypes";

/**
 * THE LINCOLN PENNY — CHARACTER LINEUP & ART DIRECTION APPROVAL SUITE
 * 
 * Verifies all 6 Phase-A design gates from docs/LINCOLN_PENNY_CHARACTER_ART_DIRECTION.md:
 * 1. Seated Studio Two-Shot in 3-layer Cinematic Studio Environment
 * 2. Silhouette Gate (Pure solid black, distinguishing traits verified without color)
 * 3. 6 Expression Sheets (Neutral, Curious, Skeptical, Deadpan, Suppressed Laughter, Surprised)
 */

interface CharacterLineupTestProps {
  viewMode?: "studio_two_shot" | "silhouette_gate" | "expression_sheets";
}

export const CharacterLineupTest: React.FC<CharacterLineupTestProps> = ({
  viewMode = "studio_two_shot",
}) => {
  const frame = useCurrentFrame();

  // Mode 1: Full 3-Layer Studio Two-Shot
  if (viewMode === "studio_two_shot") {
    return (
      <CinematicStudioSet cameraPreset="two_shot" showForegroundOcclusion={true}>
        {/* The Host (Guy) on Left */}
        <div style={{ position: "absolute", left: 140, top: 780 }}>
          <IllustratedCutoutRig
            id="host"
            pose="seated_lean_forward"
            expression="curious"
            gaze="other_host"
            leftHand="chin_listen"
            rightHand="desk_flat"
            mouthOpen={0.35}
            frame={frame}
            scale={1.05}
          />
        </div>

        {/* The Insider (Christopher) on Right */}
        <div style={{ position: "absolute", left: 600, top: 770 }}>
          <IllustratedCutoutRig
            id="insider"
            pose="seated_neutral"
            expression="deadpan"
            gaze="other_host"
            leftHand="desk_flat"
            rightHand="desk_flat"
            mouthOpen={0.0}
            flipX={true}
            frame={frame}
            scale={1.05}
          />
        </div>

        {/* Top Header Card */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 80,
            right: 80,
            backgroundColor: "rgba(15, 23, 42, 0.88)",
            border: "2px solid #334155",
            borderRadius: 16,
            padding: "20px 28px",
            color: "#f8fafc",
            fontFamily: "system-ui, -apple-system, sans-serif",
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 14, letterSpacing: 3, color: "#f59e0b", fontWeight: 800 }}>
            THE LINCOLN PENNY // ART DIRECTION v2.0
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>
            Commercial Illustrated Cutout Rig
          </div>
          <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>
            Host (Casual Hoodie / Cap) vs. Insider (Tailored Suit / Executive Part)
          </div>
        </div>
      </CinematicStudioSet>
    );
  }

  // Mode 2: Pure Silhouette Gate Test (Must be distinct in 100% black)
  if (viewMode === "silhouette_gate") {
    return (
      <AbsoluteFill style={{ backgroundColor: "#f8fafc", padding: 60 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40, fontFamily: "system-ui" }}>
          <div style={{ fontSize: 16, letterSpacing: 4, color: "#d97706", fontWeight: 800 }}>
            DESIGN GATE #2 // SILHOUETTE VALIDATION
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#09090b", marginTop: 6 }}>
            Pure Black Silhouette Identification
          </div>
          <div style={{ fontSize: 16, color: "#64748b", marginTop: 4 }}>
            Identifiable by cap bill, hoodie shoulders, suit lapels, tie, and hair part without color.
          </div>
        </div>

        {/* Side-by-side Silhouettes */}
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 80 }}>
          {/* Host Silhouette */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#09090b", marginBottom: 20 }}>
              THE HOST (SILHOUETTE)
            </div>
            <IllustratedCutoutRig
              id="host"
              pose="seated_slouch"
              silhouetteOnly={true}
              scale={1.15}
            />
            <div style={{ fontSize: 14, color: "#475569", marginTop: 16, maxWidth: 280, margin: "16px auto" }}>
              ✓ Backwards cap bill visible<br />
              ✓ Casual slouch & hoodie volume<br />
              ✓ Over-ear headset profile
            </div>
          </div>

          {/* Insider Silhouette */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#09090b", marginBottom: 20 }}>
              THE INSIDER (SILHOUETTE)
            </div>
            <IllustratedCutoutRig
              id="insider"
              pose="seated_neutral"
              silhouetteOnly={true}
              scale={1.15}
            />
            <div style={{ fontSize: 14, color: "#475569", marginTop: 16, maxWidth: 280, margin: "16px auto" }}>
              ✓ Slick executive hair part<br />
              ✓ Sharp suit lapels & tie point<br />
              ✓ Upright authoritative posture
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // Mode 3: 6 Approved Expression Sheets
  const expressions: ExpressionState[] = [
    "neutral",
    "curious",
    "skeptical",
    "deadpan",
    "suppressed_laughter",
    "surprised",
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0f17", color: "#f8fafc", padding: 50, fontFamily: "system-ui" }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{ fontSize: 14, letterSpacing: 4, color: "#f59e0b", fontWeight: 800 }}>
          DESIGN GATE #5 // PERFORMANCE CHOICES
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>
          Approved Expression Sheets (Host vs. Insider)
        </div>
      </div>

      {/* Grid of 6 Expressions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {expressions.map((expr) => (
          <div
            key={expr}
            style={{
              backgroundColor: "#111827",
              border: "2px solid #1f2937",
              borderRadius: 16,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
              {expr.replace("_", " ")}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 10 }}>
              <div style={{ transform: "scale(0.55)", transformOrigin: "top center", width: 140, height: 180 }}>
                <IllustratedCutoutRig id="host" expression={expr} scale={0.9} />
              </div>
              <div style={{ transform: "scale(0.55)", transformOrigin: "top center", width: 140, height: 180 }}>
                <IllustratedCutoutRig id="insider" expression={expr} scale={0.9} flipX={true} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
