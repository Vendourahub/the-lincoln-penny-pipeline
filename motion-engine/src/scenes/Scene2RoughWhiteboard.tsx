import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { evolvePath } from "@remotion/paths";
import rough from "roughjs";
import { Building2, Flame, Users } from "lucide-react";
import { FONTS } from "../fonts";

interface SubStroke {
  d: string;
  stroke: string;
  strokeWidth: number;
  fill: string;
}

/**
 * Splits multi-subpath Rough.js SVG strings into single continuous strokes
 * so every sketchy line & hachure shade draws sequentially by hand!
 */
function buildRoughStrokes(drawableSets: ReturnType<ReturnType<typeof rough.generator>["toPaths"]>): SubStroke[] {
  const out: SubStroke[] = [];
  for (const item of drawableSets) {
    if (item.fill && item.fill !== "none" && (!item.stroke || item.stroke === "none")) {
      out.push({
        d: item.d,
        stroke: item.stroke ?? "none",
        strokeWidth: item.strokeWidth ?? 0,
        fill: item.fill,
      });
      continue;
    }
    const parts = item.d
      .split(/(?=M)/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const part of parts) {
      out.push({
        d: part,
        stroke: item.stroke ?? "#1E293B",
        strokeWidth: item.strokeWidth ?? 2,
        fill: "none",
      });
    }
  }
  return out;
}

const RoughAnimatedGroup: React.FC<{
  strokes: SubStroke[];
  progress: number;
}> = ({ strokes, progress }) => {
  if (progress <= 0 || strokes.length === 0) return null;
  const total = strokes.length;

  return (
    <g>
      {strokes.map((st, idx) => {
        // Stagger strokes across progress [0..1]
        const start = (idx / total) * 0.72;
        const end = start + 0.28;
        const localP = interpolate(progress, [start, end], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        if (localP <= 0) return null;

        if (st.fill !== "none") {
          return <path key={idx} d={st.d} fill={st.fill} opacity={localP} />;
        }

        return (
          <path
            key={idx}
            d={st.d}
            fill="none"
            stroke={st.stroke}
            strokeWidth={st.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - localP}
          />
        );
      })}
    </g>
  );
};

// Hand-drawn double-looped Sharpie ellipse around $12.00 (single continuous path for @remotion/paths evolvePath!)
const SHARPIE_LOOP_PATH =
  "M 760 765 C 835 702, 1085 698, 1158 762 C 1228 824, 1145 898, 960 902 C 775 906, 705 836, 756 768 C 812 706, 1098 708, 1168 772 C 1215 815, 1155 888, 995 894";

export const Scene2RoughWhiteboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Scene 2 spans global 5.145s -> 13.531s (duration 8.386s = 252 frames)
  const localSec = frame / fps;

  // Trigger offsets relative to 5.145s:
  // "Jet fuel" @ 5.36s -> 0.215s
  // "pilot wages" @ 6.22s -> 1.075s
  // "airport gate fees" @ 7.54s -> 2.395s
  // "vaporize" @ 8.72s -> 3.575s
  // "$12" @ 11.62s -> 6.475s
  const pCard1 = interpolate(localSec, [0.15, 0.85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pCard2 = interpolate(localSec, [1.02, 1.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pCard3 = interpolate(localSec, [2.32, 3.08], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pVaporize = interpolate(localSec, [3.52, 4.15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pArrows = interpolate(localSec, [5.55, 6.25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pProfitPop = spring({
    frame: frame - Math.round(6.15 * fps),
    fps,
    config: { damping: 12, stiffness: 170 },
  });
  const pCircle = interpolate(localSec, [6.42, 7.18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Rolling ticket balance counter ($400 -> $258 -> $140 -> $12)
  const balance = useMemo(() => {
    if (localSec < 0.22) return 400;
    if (localSec < 1.05) {
      return Math.round(
        interpolate(localSec, [0.22, 0.85], [400, 258], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      );
    }
    if (localSec < 2.35) {
      return Math.round(
        interpolate(localSec, [1.05, 1.75], [258, 140], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      );
    }
    return Math.round(
      interpolate(localSec, [2.35, 3.15], [140, 12], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
  }, [localSec]);

  // Precompute deterministic Rough.js vector geometry once
  const shapes = useMemo(() => {
    const gen = rough.generator();
    const boxOpts = (seed: number) => ({
      seed,
      roughness: 1.55,
      bowing: 1.4,
      stroke: "#1E293B",
      strokeWidth: 3.6,
      fill: "rgba(239, 68, 68, 0.14)",
      fillStyle: "hachure" as const,
      fillWeight: 2.0,
      hachureGap: 14,
      hachureAngle: -38,
    });

    const c1 = buildRoughStrokes(gen.toPaths(gen.rectangle(130, 290, 490, 295, boxOpts(101))));
    const c2 = buildRoughStrokes(gen.toPaths(gen.rectangle(715, 290, 490, 295, boxOpts(202))));
    const c3 = buildRoughStrokes(gen.toPaths(gen.rectangle(1300, 290, 490, 295, boxOpts(303))));

    // Red slash X marks on "vaporize"
    const slashOpts = {
      seed: 404,
      roughness: 1.9,
      stroke: "#DC2626",
      strokeWidth: 6.5,
    };
    const slashes = buildRoughStrokes([
      ...gen.toPaths(gen.line(115, 560, 1805, 315, slashOpts)),
      ...gen.toPaths(gen.line(155, 320, 1775, 565, { ...slashOpts, seed: 505 })),
    ]);

    // Converging arrows down to $12 profit box
    const arrowOpts = {
      seed: 606,
      roughness: 1.4,
      stroke: "#334155",
      strokeWidth: 3.4,
    };
    const arrows = buildRoughStrokes([
      ...gen.toPaths(gen.linearPath([[375, 600], [440, 685], [750, 775]], arrowOpts)),
      ...gen.toPaths(gen.linearPath([[960, 600], [960, 695]], { ...arrowOpts, seed: 607 })),
      ...gen.toPaths(gen.linearPath([[1545, 600], [1480, 685], [1170, 775]], { ...arrowOpts, seed: 608 })),
    ]);

    return { c1, c2, c3, slashes, arrows };
  }, []);

  const sharpieEvolved = evolvePath(pCircle, SHARPIE_LOOP_PATH);

  // Subtle camera push toward the $12 profit reveal in the second half
  const camScale = interpolate(localSec, [0, 5.5, 8.3], [1.0, 1.02, 1.07], {
    extrapolateRight: "clamp",
  });
  const camY = interpolate(localSec, [0, 5.5, 8.3], [0, -6, -34], {
    extrapolateRight: "clamp",
  });

  const barPct = (balance / 400) * 100;

  const cards = [
    {
      title: "JET FUEL",
      cost: "-$142",
      sub: "35.5% of fare",
      x: 130,
      progress: pCard1,
      Icon: Flame,
      accent: "#DC2626",
    },
    {
      title: "PILOT & CREW",
      cost: "-$118",
      sub: "29.5% of fare",
      x: 715,
      progress: pCard2,
      Icon: Users,
      accent: "#B91C1C",
    },
    {
      title: "AIRPORT GATE FEES",
      cost: "-$128",
      sub: "32.0% of fare",
      x: 1300,
      progress: pCard3,
      Icon: Building2,
      accent: "#991B1B",
    },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#F5F1E6",
        overflow: "hidden",
      }}
    >
      {/* Editorial Drafting Grid Background */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(30, 41, 59, 0.065) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 41, 59, 0.065) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          transform: `scale(${camScale}) translateY(${camY}px)`,
          transformOrigin: "50% 78%",
        }}
      >
        {/* TOP LIVE TICKET BALANCE LEDGER */}
        <div
          style={{
            position: "absolute",
            top: 52,
            left: 130,
            right: 130,
            height: 162,
            background: "#FFFFFF",
            border: "3px solid #0F172A",
            borderRadius: 18,
            boxShadow: "10px 10px 0px #0F172A",
            padding: "22px 42px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 19,
                  letterSpacing: "0.14em",
                  color: "#475569",
                }}
              >
                LIVE SEAT COST BREAKDOWN // $400 ECONOMY TICKET
              </div>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 34,
                  fontWeight: 800,
                  color: "#0F172A",
                  marginTop: 4,
                }}
              >
                Fare Remaining After Operating Costs
              </div>
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 74,
                fontWeight: 700,
                color: balance <= 20 ? "#DC2626" : "#0F172A",
                letterSpacing: "-0.03em",
              }}
            >
              ${balance}.00
            </div>
          </div>

          {/* Shrinking Fuel-Tank Meter */}
          <div
            style={{
              width: "100%",
              height: 20,
              background: "#E2E8F0",
              borderRadius: 999,
              overflow: "hidden",
              border: "2px solid #0F172A",
            }}
          >
            <div
              style={{
                width: `${barPct}%`,
                height: "100%",
                background:
                  balance <= 20
                    ? "#DC2626"
                    : balance <= 160
                    ? "#F59E0B"
                    : "#10B981",
              }}
            />
          </div>
        </div>

        {/* SVG LAYER FOR LIVE ROUGH.JS STROKES */}
        <svg
          width="1920"
          height="1080"
          style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}
        >
          <RoughAnimatedGroup strokes={shapes.c1} progress={pCard1} />
          <RoughAnimatedGroup strokes={shapes.c2} progress={pCard2} />
          <RoughAnimatedGroup strokes={shapes.c3} progress={pCard3} />
          <RoughAnimatedGroup strokes={shapes.arrows} progress={pArrows} />
          <RoughAnimatedGroup strokes={shapes.slashes} progress={pVaporize} />

          {/* Live Double-Looped Red Sharpie Circle around $12.00 */}
          {pCircle > 0 && (
            <path
              d={SHARPIE_LOOP_PATH}
              fill="none"
              stroke="#DC2626"
              strokeWidth={8.5}
              strokeLinecap="round"
              strokeDasharray={sharpieEvolved.strokeDasharray}
              strokeDashoffset={sharpieEvolved.strokeDashoffset}
            />
          )}
        </svg>

        {/* CARD TYPOGRAPHY & ICONS (Pop in cleanly as Rough.js box draws) */}
        {cards.map((c, idx) => {
          const textOpacity = interpolate(c.progress, [0.25, 0.7], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const lift = interpolate(c.progress, [0.2, 0.8], [22, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const IconComp = c.Icon;
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: c.x,
                top: 290,
                width: 490,
                height: 295,
                padding: "32px 36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: textOpacity,
                transform: `translateY(${lift}px)`,
                zIndex: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 14,
                    background: "#0F172A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconComp size={32} color="#F8FAFC" />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: FONTS.sans,
                      fontWeight: 900,
                      fontSize: 28,
                      color: "#0F172A",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {c.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 18,
                      color: "#475569",
                    }}
                  >
                    {c.sub}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 102,
                  fontWeight: 700,
                  color: c.accent,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                }}
              >
                {c.cost}
              </div>
            </div>
          );
        })}

        {/* HANDWRITTEN "97% VAPORIZED!" STAMP ON VAPORIZE */}
        {pVaporize > 0.15 && (
          <div
            style={{
              position: "absolute",
              top: 392,
              left: "50%",
              transform: `translate(-50%, -50%) rotate(-6deg) scale(${interpolate(
                pVaporize,
                [0.15, 0.5, 1],
                [1.5, 0.96, 1],
                { extrapolateRight: "clamp" }
              )})`,
              background: "#DC2626",
              color: "#FFFBEB",
              fontFamily: FONTS.hand,
              fontSize: 64,
              fontWeight: 700,
              padding: "8px 38px",
              borderRadius: 12,
              border: "4px solid #0F172A",
              boxShadow: "8px 8px 0px #0F172A",
              zIndex: 18,
              whiteSpace: "nowrap",
            }}
          >
            97% OF YOUR TICKET VAPORIZED!
          </div>
        )}

        {/* BOTTOM-CENTER $12 PROFIT REVEAL */}
        <div
          style={{
            position: "absolute",
            top: 720,
            left: "50%",
            transform: `translateX(-50%) scale(${interpolate(
              pProfitPop,
              [0, 1],
              [0.65, 1]
            )})`,
            opacity: interpolate(pProfitPop, [0, 0.3], [0, 1], {
              extrapolateRight: "clamp",
            }),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 9,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 20,
              letterSpacing: "0.16em",
              color: "#334155",
              fontWeight: 700,
            }}
          >
            LEAVING JUST
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 112,
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.0,
              marginTop: 2,
            }}
          >
            $12.00
          </div>
          <div
            style={{
              fontFamily: FONTS.hand,
              fontSize: 38,
              color: "#DC2626",
              marginTop: -4,
            }}
          >
            razor-thin profit before a single delay!
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
