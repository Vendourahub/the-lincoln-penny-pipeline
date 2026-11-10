import React, { useEffect, useMemo } from "react";
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
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { evolvePath } from "@remotion/paths";
import { Lottie } from "@remotion/lottie";
import rough from "roughjs";
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  XCircle,
  Award,
  Bell,
  Building2,
  CheckCircle2,
  Compass,
  FileText,
  Flame,
  HelpCircle,
  Layers,
  Share2,
  Sparkles,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { ensureFontsLoaded, FONTS } from "./fonts";
import { radarPulseLottie } from "./lottieData";
import { BroadcastGrade, KineticCaptionBar, WordItem } from "./components/BroadcastGrade";

export interface BeatItem {
  kicker: string;
  heading: string;
  big?: string;
  detail?: string;
  narration: string;
  sourceLabel?: string;
  bars?: Array<{ label: string; value: number; display: string }>;
  visual?: { type?: string; scene?: string };
}

export interface CompiledScene {
  index: number;
  beatIndex: number;
  archetype: "hook" | "whiteboard" | "terminal" | "sec3d" | "vault" | "outro" | "contrast";
  transitionAfter: "wipe-right" | "wipe-left" | "slide-up" | "fade" | "none";
  start: number;
  end: number;
  duration: number;
  kicker: string;
  heading: string;
  big: string;
  detail: string;
  sourceLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cues: Record<string, any>;
}

export interface BlueprintInputProps {
  slug: string;
  format: "long" | "short";
  title: string;
  beats: BeatItem[];
  sources: Array<{ claim: string; url: string }>;
  beatTimes: Array<{ start: number; end: number }>;
  scenes?: CompiledScene[];
  words: WordItem[];
  duration: number;
  audioFile: string;
}

interface SubStroke {
  d: string;
  stroke: string;
  strokeWidth: number;
  fill: string;
}

function buildRoughStrokes(
  drawableSets: ReturnType<ReturnType<typeof rough.generator>["toPaths"]>
): SubStroke[] {
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

/**
 * ARCHETYPE 0: Viral Pattern-Interrupt 2.5D Parallax Hook & Word-Locked 3D Flip
 */
const ArchetypeParallaxHook: React.FC<{
  scene: CompiledScene;
  slug: string;
  durFrames: number;
  isVertical: boolean;
}> = ({ scene, slug, durFrames, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isAirline = slug.includes("airline");
  const cues = scene.cues || {};

  const slamFrame = Math.max(2, Math.round((cues.heroSlamSec ?? 0.3) * fps));
  const flipFrame = Math.max(slamFrame + 25, Math.round((cues.flipSec ?? durFrames / fps * 0.55) * fps));

  const bgScale = interpolate(frame, [0, durFrames], [1.04, 1.18], { extrapolateRight: "clamp" });
  const bgRotate = interpolate(frame, [0, durFrames], [-0.7, 0.7], { extrapolateRight: "clamp" });

  const strapSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 210 },
  });

  const slamSpring = spring({
    frame: frame - slamFrame,
    fps,
    config: { damping: 12, stiffness: 185, mass: 0.9 },
  });

  const flipProgress = spring({
    frame: frame - flipFrame,
    fps,
    config: { damping: 13, stiffness: 170, mass: 0.85 },
  });

  const shakeEnv = frame >= flipFrame ? Math.exp(-(frame - flipFrame) * 0.16) * 16 : 0;
  const shakeX = Math.sin(frame * 2.7) * shakeEnv;
  const shakeY = Math.cos(frame * 3.3) * shakeEnv * 0.7;

  const lightningOpacity = interpolate(
    frame,
    [flipFrame - 1, flipFrame + 1, flipFrame + 5, flipFrame + 8, flipFrame + 16],
    [0, 0.46, 0.08, 0.25, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const isPhase2 = flipProgress > 0.5;

  const planeX = interpolate(frame, [0, durFrames], [-125, 110], { extrapolateRight: "clamp" });
  const planeY = interpolate(frame, [0, durFrames], [110, 15], { extrapolateRight: "clamp" });
  const planeScale = interpolate(frame, [0, durFrames], [0.94, 1.09], { extrapolateRight: "clamp" });
  const planeRot = interpolate(frame, [0, durFrames], [-2.2, 1.6], { extrapolateRight: "clamp" });

  const rainDrops = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        speed: 42 + (i % 5) * 8,
        xBase: ((i * 173) % 2150) - 120,
        len: 72 + (i % 4) * 30,
        opacity: 0.13 + (i % 3) * 0.06,
        seedOffset: i * 190,
      })),
    []
  );

  const heroText = String(cues.heroText || scene.big || "$400");
  const flipHeadline = String(cues.flipHeadline || scene.big || "VALUE TRAP");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#050811",
        overflow: "hidden",
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Background Plate */}
      {isAirline ? (
        <AbsoluteFill style={{ transform: `scale(${bgScale}) rotate(${bgRotate}deg)` }}>
          <Img
            src={staticFile("assets/storm_runway_bg.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            background: "radial-gradient(circle at 50% 36%, #18294D 0%, #070B14 68%, #030509 100%)",
            transform: `scale(${bgScale})`,
          }}
        >
          <AbsoluteFill
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(245, 185, 66, 0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(245, 185, 66, 0.09) 1px, transparent 1px)",
              backgroundSize: "68px 68px",
            }}
          />
        </AbsoluteFill>
      )}

      {/* Crimson Shift on Phase 2 */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 38%, rgba(220, 38, 38, 0.36), rgba(5, 8, 17, 0.54) 76%)",
          opacity: flipProgress,
        }}
      />

      {/* FRAME-0 INSTANT VIRAL CURIOSITY STRAP */}
      <div
        style={{
          position: "absolute",
          top: isVertical ? 82 : 40,
          left: isVertical ? 40 : 64,
          right: isVertical ? 40 : "auto",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: isVertical ? "center" : "flex-start",
          gap: 12,
          padding: isVertical ? "12px 24px" : "10px 24px",
          borderRadius: 999,
          background: isPhase2 ? "rgba(127, 29, 29, 0.92)" : "rgba(7, 11, 20, 0.90)",
          border: `1.5px solid ${isPhase2 ? "rgba(252,165,165,0.6)" : "rgba(245,185,66,0.55)"}`,
          boxShadow: "0 14px 34px rgba(0,0,0,0.65)",
          transform: `translateY(${interpolate(strapSpring, [0, 1], [-24, 0])}px)`,
          zIndex: 20,
        }}
      >
        <Zap size={20} color={isPhase2 ? "#FCA5A5" : "#FCD34D"} fill={isPhase2 ? "#FCA5A5" : "#FCD34D"} />
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: isVertical ? 20 : 18,
            fontWeight: 700,
            letterSpacing: "0.13em",
            color: "#FFFBEB",
            textTransform: "uppercase",
          }}
        >
          THE LINCOLN PENNY // {cues.hookStrap || scene.heading.toUpperCase()}
        </span>
      </div>

      {/* Midground Giant Typography (Slams right on spoken $ figure, flips 3D right on twist word!) */}
      <div
        style={{
          position: "absolute",
          top: isVertical ? 225 : 94,
          left: isVertical ? 42 : 80,
          right: isVertical ? 42 : 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          perspective: 1100,
          zIndex: 12,
        }}
      >
        {!isPhase2 ? (
          <div
            style={{
              opacity: interpolate(slamSpring, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
              transform: `scale(${interpolate(slamSpring, [0, 1], [1.42, 1])}) translateY(${interpolate(
                slamSpring,
                [0, 1],
                [-45, 0]
              )}px) rotateX(${interpolate(flipProgress, [0, 0.5], [0, 88])}deg)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: isVertical ? 23 : 22,
                letterSpacing: "0.20em",
                color: "#FCD34D",
                background: "rgba(12, 18, 30, 0.88)",
                border: "1px solid rgba(252, 211, 77, 0.45)",
                padding: "8px 24px",
                borderRadius: 8,
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              {cues.heroEyebrow || scene.kicker}
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize:
                  heroText.length > 7
                    ? isVertical
                      ? 108
                      : 156
                    : isVertical
                    ? 188
                    : 268,
                fontWeight: 700,
                lineHeight: 0.96,
                letterSpacing: "-0.03em",
                color: "#FFFBEB",
                textShadow: "0 18px 55px rgba(0,0,0,0.88), 0 0 65px rgba(245, 185, 66, 0.30)",
              }}
            >
              {heroText}
            </div>
          </div>
        ) : (
          <div
            style={{
              transform: `rotateX(${interpolate(flipProgress, [0.5, 1], [-88, 0])}deg) scale(${interpolate(
                flipProgress,
                [0.5, 1],
                [1.18, 1]
              )})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontFamily: FONTS.mono,
                fontSize: isVertical ? 21 : 22,
                letterSpacing: "0.14em",
                color: "#FECACA",
                background: "rgba(127, 29, 29, 0.92)",
                border: "1px solid rgba(252, 165, 165, 0.58)",
                padding: "8px 24px",
                borderRadius: 8,
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              <AlertTriangle size={22} color="#FCA5A5" />
              {cues.flipEyebrow || scene.detail}
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize:
                  flipHeadline.length > 10
                    ? isVertical
                      ? 96
                      : 148
                    : isVertical
                    ? 136
                    : 204,
                fontWeight: 700,
                lineHeight: 0.98,
                letterSpacing: "-0.03em",
                color: "#FF4D4D",
                textShadow: "0 18px 60px rgba(0,0,0,0.92), 0 0 80px rgba(239, 68, 68, 0.55)",
              }}
            >
              {flipHeadline}
            </div>
          </div>
        )}
      </div>

      {/* 2.5D Foreground Hero Layer */}
      {isAirline ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: isVertical ? "60%" : "55%",
            width: isVertical ? 1040 : 1250,
            transform: `translate(-50%, -50%) translate(${planeX}px, ${planeY}px) scale(${planeScale}) rotate(${planeRot}deg)`,
            zIndex: 22,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "12%",
              right: "12%",
              bottom: "4%",
              height: "36%",
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.82) 0%, transparent 72%)",
              zIndex: -1,
            }}
          />
          <Img src={staticFile("assets/boeing_cutout.png")} style={{ width: "100%", height: "auto" }} />
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: isVertical ? "63%" : "64%",
            transform: `translate(-50%, -50%) rotate(${frame * 0.45}deg)`,
            width: isVertical ? 440 : 380,
            height: isVertical ? 440 : 380,
            borderRadius: "50%",
            border: "2px dashed rgba(245, 185, 66, 0.36)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <Compass size={isVertical ? 190 : 165} color={isPhase2 ? "#EF4444" : "#F5B942"} strokeWidth={1.3} />
        </div>
      )}

      {/* Atmospheric Rain Streaks */}
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, zIndex: 26, pointerEvents: "none" }}
      >
        {rainDrops.map((d, idx) => {
          const yOffset = ((frame * d.speed + d.seedOffset) % 1980) - 160;
          const xPos = d.xBase - yOffset * 0.2;
          return (
            <line
              key={idx}
              x1={xPos}
              y1={yOffset}
              x2={xPos - d.len * 0.2}
              y2={yOffset + d.len}
              stroke={`rgba(210, 230, 255, ${d.opacity})`}
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Lightning Flash right on 3D Flip */}
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

/**
 * ARCHETYPE 1: Word-Locked Live Rough.js Editorial Whiteboard + Sharpie Circle
 */
const ArchetypeRoughWhiteboard: React.FC<{
  scene: CompiledScene;
  durFrames: number;
  isVertical: boolean;
}> = ({ scene, durFrames, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localSec = frame / fps;
  const cues = scene.cues || {};

  const cards = (cues.cards || []) as Array<{
    label: string;
    sub: string;
    badge: string;
    triggerSec: number;
  }>;
  const isCostDrain = cues.isCostDrain !== false;
  const t1 = cards[0]?.triggerSec ?? 0.35;
  const t2 = cards[1]?.triggerSec ?? 1.55;
  const t3 = cards[2]?.triggerSec ?? 2.75;
  const slashSec = cues.slashSec ?? t3 + 0.85;
  const arrowSec = cues.arrowSec ?? slashSec + 0.55;
  const boxTrig = cues.bottomBox?.triggerSec ?? arrowSec + 0.35;
  const sharpieSec = cues.bottomBox?.sharpieSec ?? boxTrig + 0.45;

  const pCard1 = interpolate(localSec, [t1, t1 + 0.72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pCard2 = interpolate(localSec, [t2, t2 + 0.72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pCard3 = interpolate(localSec, [t3, t3 + 0.72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pSlash = interpolate(localSec, [slashSec, slashSec + 0.62], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pArrows = interpolate(localSec, [arrowSec, arrowSec + 0.65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pCircle = interpolate(localSec, [sharpieSec, sharpieSec + 0.78], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const climaxSpring = spring({
    frame: frame - Math.round(boxTrig * fps),
    fps,
    config: { damping: 12, stiffness: 170 },
  });

  // Live balance meter locked to the 3 card triggers!
  const endBal = cues.endBalance ?? 12;
  const balance = useMemo(() => {
    if (!isCostDrain) {
      return Math.round(
        interpolate(localSec, [t1, t3 + 0.7], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      );
    }
    if (localSec < t1) return 400;
    if (localSec < t2) {
      return Math.round(interpolate(localSec, [t1, t1 + 0.65], [400, 258], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    }
    if (localSec < t3) {
      return Math.round(interpolate(localSec, [t2, t2 + 0.65], [258, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    }
    return Math.round(interpolate(localSec, [t3, t3 + 0.75], [140, endBal], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  }, [localSec, isCostDrain, t1, t2, t3, endBal]);

  const sharpieLoopPath = isVertical
    ? "M 185 1355 C 295 1264, 785 1262, 895 1352 C 975 1425, 865 1542, 540 1548 C 215 1552, 115 1435, 180 1358 C 280 1272, 798 1274, 902 1362"
    : "M 655 752 C 755 672, 1165 668, 1265 748 C 1350 818, 1245 914, 960 918 C 675 922, 575 828, 650 756 C 735 678, 1178 680, 1272 758";

  const sharpieEvolved = evolvePath(pCircle, sharpieLoopPath);

  const shapes = useMemo(() => {
    const gen = rough.generator();
    const boxOpts = (seed: number) => ({
      seed,
      roughness: 1.55,
      bowing: 1.4,
      stroke: "#1E293B",
      strokeWidth: 3.6,
      fill: isCostDrain ? "rgba(239, 68, 68, 0.14)" : "rgba(16, 185, 129, 0.14)",
      fillStyle: "hachure" as const,
      fillWeight: 2.0,
      hachureGap: 15,
      hachureAngle: -38,
    });

    if (isVertical) {
      return {
        c1: buildRoughStrokes(gen.toPaths(gen.rectangle(90, 385, 900, 232, boxOpts(101)))),
        c2: buildRoughStrokes(gen.toPaths(gen.rectangle(90, 655, 900, 232, boxOpts(202)))),
        c3: buildRoughStrokes(gen.toPaths(gen.rectangle(90, 925, 900, 232, boxOpts(303)))),
        arrows: buildRoughStrokes([
          ...gen.toPaths(gen.linearPath([[540, 1170], [540, 1295]], { seed: 606, roughness: 1.4, stroke: "#334155", strokeWidth: 4 })),
        ]),
        slashes: isCostDrain
          ? buildRoughStrokes(
              gen.toPaths(gen.line(80, 1140, 995, 410, { seed: 404, roughness: 1.8, stroke: "#DC2626", strokeWidth: 6.5 }))
            )
          : [],
      };
    }

    return {
      c1: buildRoughStrokes(gen.toPaths(gen.rectangle(130, 290, 490, 295, boxOpts(101)))),
      c2: buildRoughStrokes(gen.toPaths(gen.rectangle(715, 290, 490, 295, boxOpts(202)))),
      c3: buildRoughStrokes(gen.toPaths(gen.rectangle(1300, 290, 490, 295, boxOpts(303)))),
      arrows: buildRoughStrokes([
        ...gen.toPaths(gen.linearPath([[375, 600], [450, 685], [735, 770]], { seed: 606, roughness: 1.4, stroke: "#334155", strokeWidth: 3.4 })),
        ...gen.toPaths(gen.linearPath([[960, 600], [960, 695]], { seed: 607, roughness: 1.4, stroke: "#334155", strokeWidth: 3.4 })),
        ...gen.toPaths(gen.linearPath([[1545, 600], [1470, 685], [1185, 770]], { seed: 608, roughness: 1.4, stroke: "#334155", strokeWidth: 3.4 })),
      ]),
      slashes: isCostDrain
        ? buildRoughStrokes([
            ...gen.toPaths(gen.line(115, 560, 1805, 315, { seed: 404, roughness: 1.9, stroke: "#DC2626", strokeWidth: 6.5 })),
            ...gen.toPaths(gen.line(155, 320, 1775, 565, { seed: 505, roughness: 1.9, stroke: "#DC2626", strokeWidth: 6.5 })),
          ])
        : [],
    };
  }, [isVertical, isCostDrain]);

  const icons = [Flame, Users, Building2];
  const cardProgresses = [pCard1, pCard2, pCard3];

  const camScale = interpolate(
    localSec,
    [0, Math.max(1, boxTrig - 0.5), durFrames / fps],
    [1.0, 1.015, 1.055],
    { extrapolateRight: "clamp" }
  );

  const barPct = isCostDrain ? (balance / 400) * 100 : balance;

  return (
    <AbsoluteFill style={{ backgroundColor: "#F5F1E6", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(30, 41, 59, 0.065) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 41, 59, 0.065) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          transform: `scale(${camScale})`,
          transformOrigin: "50% 78%",
        }}
      >
        {/* Top Brutalist Ledger Header */}
        <div
          style={{
            position: "absolute",
            top: isVertical ? 84 : 50,
            left: isVertical ? 70 : 130,
            right: isVertical ? 70 : 130,
            background: "#FFFFFF",
            border: "3px solid #0F172A",
            borderRadius: 18,
            boxShadow: "10px 10px 0px #0F172A",
            padding: isVertical ? "22px 30px" : "20px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 18, letterSpacing: "0.14em", color: "#475569" }}>
                {scene.kicker.toUpperCase()}
              </div>
              <div style={{ fontFamily: FONTS.sans, fontSize: isVertical ? 31 : 34, fontWeight: 800, color: "#0F172A" }}>
                {scene.heading}
              </div>
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: isVertical ? 54 : 68,
                fontWeight: 700,
                color: isCostDrain ? (balance <= 25 ? "#DC2626" : "#0F172A") : "#047857",
              }}
            >
              {isCostDrain ? `$${balance}.00` : `${balance}%`}
            </div>
          </div>
          <div
            style={{
              width: "100%",
              height: 18,
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
                background: isCostDrain
                  ? balance <= 25
                    ? "#DC2626"
                    : balance <= 160
                    ? "#F59E0B"
                    : "#10B981"
                  : "#10B981",
              }}
            />
          </div>
        </div>

        {/* Live Rough.js Vector Layer */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 12 }}>
          <RoughAnimatedGroup strokes={shapes.c1} progress={pCard1} />
          <RoughAnimatedGroup strokes={shapes.c2} progress={pCard2} />
          <RoughAnimatedGroup strokes={shapes.c3} progress={pCard3} />
          <RoughAnimatedGroup strokes={shapes.arrows} progress={pArrows} />
          {isCostDrain && <RoughAnimatedGroup strokes={shapes.slashes} progress={pSlash} />}
          {pCircle > 0 && (
            <path
              d={sharpieLoopPath}
              fill="none"
              stroke={isCostDrain ? "#DC2626" : "#047857"}
              strokeWidth={8.5}
              strokeLinecap="round"
              strokeDasharray={sharpieEvolved.strokeDasharray}
              strokeDashoffset={sharpieEvolved.strokeDashoffset}
            />
          )}
        </svg>

        {/* Card Content */}
        {cards.slice(0, 3).map((it, idx) => {
          const prog = cardProgresses[idx];
          const IconComp = icons[idx % icons.length];
          const left = isVertical ? 90 : 130 + idx * 585;
          const top = isVertical ? 385 + idx * 270 : 290;
          const width = isVertical ? 900 : 490;
          const height = isVertical ? 232 : 295;

          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left,
                top,
                width,
                height,
                padding: isVertical ? "24px 32px" : "30px 36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: interpolate(prog, [0.2, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                transform: `translateY(${interpolate(prog, [0.2, 0.75], [22, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })}px)`,
                zIndex: 9,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: "#0F172A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconComp size={30} color="#F8FAFC" />
                </div>
                <div>
                  <div style={{ fontFamily: FONTS.sans, fontWeight: 900, fontSize: 27, color: "#0F172A" }}>
                    {it.label}
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 17, color: "#475569" }}>
                    {it.sub}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: isVertical ? 68 : 88,
                  fontWeight: 700,
                  color: isCostDrain ? "#B91C1C" : "#047857",
                  lineHeight: 1,
                }}
              >
                {it.badge}
              </div>
            </div>
          );
        })}

        {/* Handwritten Stamp on Slash / Pipeline Reveal */}
        {pSlash > 0.18 && (
          <div
            style={{
              position: "absolute",
              top: isVertical ? 765 : 412,
              left: "50%",
              transform: `translate(-50%, -50%) rotate(-5deg) scale(${interpolate(
                pSlash,
                [0.18, 0.55, 1],
                [1.45, 0.96, 1],
                { extrapolateRight: "clamp" }
              )})`,
              background: isCostDrain ? "#DC2626" : "#047857",
              color: "#FFFBEB",
              fontFamily: FONTS.hand,
              fontSize: isVertical ? 50 : 60,
              fontWeight: 700,
              padding: "8px 34px",
              borderRadius: 12,
              border: "4px solid #0F172A",
              boxShadow: "8px 8px 0px #0F172A",
              zIndex: 18,
              whiteSpace: "nowrap",
            }}
          >
            {cues.slashStamp || (isCostDrain ? "97% OF FARE CONSUMED!" : "PURE CASH PIPELINE!")}
          </div>
        )}

        {/* Bottom Climax Profit Reveal + Sharpie Target */}
        <div
          style={{
            position: "absolute",
            top: isVertical ? 1315 : 716,
            left: "50%",
            transform: `translateX(-50%) scale(${interpolate(climaxSpring, [0, 1], [0.66, 1])})`,
            opacity: interpolate(climaxSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            zIndex: 10,
            width: isVertical ? 920 : 1140,
          }}
        >
          <div style={{ fontFamily: FONTS.mono, fontSize: 19, letterSpacing: "0.16em", color: "#334155", fontWeight: 700 }}>
            {cues.bottomBox?.eyebrow || "NET RESULT"}
          </div>
          <div style={{ fontFamily: FONTS.display, fontSize: isVertical ? 88 : 104, fontWeight: 700, color: "#0F172A", lineHeight: 1.02 }}>
            {cues.bottomBox?.value || scene.big || "$12.00"}
          </div>
          <div style={{ fontFamily: FONTS.hand, fontSize: 38, color: "#DC2626", marginTop: 0 }}>
            {cues.bottomBox?.sub || scene.detail}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * ARCHETYPE 2: Dark Financial Terminal Paradox + Lottie Radar + Word-Locked Question/Answer Modal
 */
const ArchetypeKineticTerminal: React.FC<{
  scene: CompiledScene;
  isVertical: boolean;
}> = ({ scene, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cues = scene.cues || {};

  const leftSpring = spring({
    frame: frame - Math.round((cues.leftSec ?? 0.22) * fps),
    fps,
    config: { damping: 13, stiffness: 130 },
  });
  const rightSpring = spring({
    frame: frame - Math.round((cues.rightSec ?? 1.8) * fps),
    fps,
    config: { damping: 12, stiffness: 145 },
  });
  const modalSpring = spring({
    frame: frame - Math.round((cues.modalSec ?? 3.6) * fps),
    fps,
    config: { damping: 12, stiffness: 170 },
  });
  const modalFlip = cues.modalFlipSec
    ? spring({
        frame: frame - Math.round(cues.modalFlipSec * fps),
        fps,
        config: { damping: 13, stiffness: 165 },
      })
    : 0;

  const isFlippedAnswer = modalFlip > 0.5;
  const leftPos = Boolean(cues.leftPositive);
  const rightPos = Boolean(cues.rightPositive);

  return (
    <AbsoluteFill style={{ backgroundColor: "#060A14", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(56, 189, 248, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.07) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          backgroundPosition: `0px ${-(frame * 0.8)}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 28% 55%, rgba(16, 185, 129, 0.16), transparent 52%), radial-gradient(circle at 74% 55%, rgba(245, 185, 66, 0.16), transparent 52%)",
        }}
      />

      {/* Header with Live Lottie Radar */}
      <div
        style={{
          position: "absolute",
          top: isVertical ? 84 : 42,
          left: isVertical ? 54 : 72,
          right: isVertical ? 54 : 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.14)",
          paddingBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52 }}>
            <Lottie animationData={radarPulseLottie} style={{ width: 52, height: 52 }} />
          </div>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 17, letterSpacing: "0.18em", color: "#F5B942" }}>
              {scene.kicker.toUpperCase()}
            </div>
            <div style={{ fontFamily: FONTS.sans, fontSize: isVertical ? 30 : 32, fontWeight: 800, color: "#F8FAFC" }}>
              {scene.heading}
            </div>
          </div>
        </div>
      </div>

      {/* Split Comparison Panels */}
      <div
        style={{
          position: "absolute",
          top: isVertical ? 230 : 165,
          left: isVertical ? 54 : 90,
          right: isVertical ? 54 : 90,
          bottom: isVertical ? 300 : 145,
          display: "grid",
          gridTemplateColumns: isVertical ? "1fr" : "1fr 1fr",
          gap: isVertical ? 32 : 52,
          opacity: modalSpring > 0.05 ? 1 - modalSpring * 0.62 : 1,
          transform: `scale(${1 - modalSpring * 0.03})`,
        }}
      >
        {/* Left Panel */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.88)",
            border: `1.5px solid ${leftPos ? "rgba(16, 185, 129, 0.42)" : "rgba(239, 68, 68, 0.38)"}`,
            borderRadius: 26,
            padding: "34px 42px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: interpolate(leftSpring, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(leftSpring, [0, 1], [30, 0])}px)`,
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
                background: leftPos ? "rgba(16, 185, 129, 0.18)" : "rgba(239, 68, 68, 0.18)",
                color: leftPos ? "#34D399" : "#F87171",
                fontFamily: FONTS.mono,
                fontSize: 18,
              }}
            >
              {leftPos ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {cues.leftBadge || "OPERATING BASE"}
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: isVertical ? 68 : 88,
                fontWeight: 700,
                color: leftPos ? "#FCD34D" : "#FF5252",
                marginTop: 18,
                lineHeight: 1.04,
              }}
            >
              {cues.leftTitle || "LOW MARGIN"}
            </div>
            <div style={{ fontFamily: FONTS.sans, fontSize: 25, color: "rgba(255,255,255,0.8)", marginTop: 10 }}>
              {cues.leftSub}
            </div>
          </div>
          <div
            style={{
              height: isVertical ? 130 : 210,
              display: "flex",
              alignItems: leftPos ? "flex-end" : "flex-start",
              borderTop: leftPos ? "none" : "2px dashed rgba(248,113,113,0.5)",
              gap: 20,
              paddingTop: 12,
            }}
          >
            {[0.45, 0.65, 0.84, 1.0].map((m, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: Math.max(8, (isVertical ? 110 : 185) * m * leftSpring),
                  borderRadius: leftPos ? "12px 12px 4px 4px" : "4px 4px 12px 12px",
                  background: leftPos
                    ? idx === 3
                      ? "linear-gradient(180deg, #FCD34D 0%, #10B981 100%)"
                      : "linear-gradient(180deg, rgba(52,211,153,0.65) 0%, rgba(16,185,129,0.2) 100%)"
                    : "linear-gradient(180deg, rgba(239,68,68,0.28) 0%, #EF4444 100%)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.88)",
            border: `1.5px solid ${rightPos ? "rgba(16, 185, 129, 0.42)" : "rgba(239, 68, 68, 0.38)"}`,
            borderRadius: 26,
            padding: "34px 42px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: interpolate(rightSpring, [0, 0.35], [0.15, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(rightSpring, [0, 1], [34, 0])}px)`,
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
                background: rightPos ? "rgba(16, 185, 129, 0.18)" : "rgba(239, 68, 68, 0.18)",
                color: rightPos ? "#34D399" : "#F87171",
                fontFamily: FONTS.mono,
                fontSize: 18,
              }}
            >
              {rightPos ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {cues.rightBadge || "HIDDEN ENGINE"}
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: isVertical ? 68 : 88,
                fontWeight: 700,
                color: rightPos ? "#FCD34D" : "#FF5252",
                marginTop: 18,
                lineHeight: 1.04,
              }}
            >
              {cues.rightTitle || scene.big}
            </div>
            <div style={{ fontFamily: FONTS.sans, fontSize: 25, color: "rgba(255,255,255,0.82)", marginTop: 10 }}>
              {cues.rightSub}
            </div>
          </div>
          <div
            style={{
              height: isVertical ? 130 : 210,
              display: "flex",
              alignItems: rightPos ? "flex-end" : "flex-start",
              borderTop: rightPos ? "none" : "2px dashed rgba(248,113,113,0.5)",
              gap: 20,
              paddingTop: 12,
            }}
          >
            {[0.42, 0.62, 0.82, 1.0].map((m, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: Math.max(8, (isVertical ? 110 : 185) * m * rightSpring),
                  borderRadius: rightPos ? "12px 12px 4px 4px" : "4px 4px 12px 12px",
                  background: rightPos
                    ? idx === 3
                      ? "linear-gradient(180deg, #FCD34D 0%, #10B981 100%)"
                      : "linear-gradient(180deg, rgba(52,211,153,0.65) 0%, rgba(16,185,129,0.2) 100%)"
                    : "linear-gradient(180deg, rgba(239,68,68,0.28) 0%, #EF4444 100%)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center Word-Locked Question / Answer Spotlight Modal */}
      {modalSpring > 0.01 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            perspective: 1100,
            zIndex: 35,
            padding: isVertical ? "0 48px" : "0 120px",
          }}
        >
          <div
            style={{
              transform: `scale(${interpolate(modalSpring, [0, 1], [0.72, 1])}) rotateX(${
                cues.modalFlipSec
                  ? isFlippedAnswer
                    ? interpolate(modalFlip, [0.5, 1], [-88, 0])
                    : interpolate(modalFlip, [0, 0.5], [0, 88])
                  : 0
              }deg)`,
              opacity: interpolate(modalSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
              background: isFlippedAnswer
                ? "linear-gradient(135deg, #091A18 0%, #0F2922 100%)"
                : "rgba(8, 13, 26, 0.96)",
              border: `2.5px solid ${isFlippedAnswer ? "#34D399" : "#F5B942"}`,
              borderRadius: 32,
              padding: isVertical ? "42px 44px" : "46px 74px",
              boxShadow: "0 35px 90px rgba(0,0,0,0.88)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              maxWidth: 1240,
            }}
          >
            <div
              style={{
                width: 78,
                height: 78,
                borderRadius: "50%",
                background: isFlippedAnswer ? "rgba(52, 211, 153, 0.18)" : "rgba(245, 185, 66, 0.16)",
                border: `2px solid ${isFlippedAnswer ? "#34D399" : "#F5B942"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              {isFlippedAnswer ? (
                <Sparkles size={42} color="#34D399" />
              ) : (
                <HelpCircle size={44} color="#FCD34D" />
              )}
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: isVertical ? 58 : 74,
                fontWeight: 700,
                color: isFlippedAnswer ? "#FCD34D" : "#FFFFFF",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              {isFlippedAnswer ? cues.modalFlipTitle : cues.modalTitle}
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * ARCHETYPE: Illusion of Novelty (Contrast Framing & Bullseye Proof)
 * Visualizes the 4-beat cognitive reframing:
 * 1. Top Urgency Ribbon / Pill ("BREAKING DISCLOSURE" / "THE GAP")
 * 2. Left Card: "Old Belief" (Dimmed slate container with animated red strikethrough/rejection)
 * 3. Right Card: "New Reveal" (Illuminated 3D container with cyan/gold glow and pulse)
 * 4. Bottom Footer: "Bullseye Proof" (Verified document badge + official record stamp)
 */
const ArchetypeContrastNovelty: React.FC<{
  scene: CompiledScene;
  durFrames: number;
  isVertical: boolean;
}> = ({ scene, durFrames, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cues = scene.cues || {};

  const oldSpring = spring({
    frame: frame - Math.round((cues.oldSec ?? 0.2) * fps),
    fps,
    config: { damping: 13, stiffness: 125 },
  });

  const newSpring = spring({
    frame: frame - Math.round((cues.newSec ?? 1.8) * fps),
    fps,
    config: { damping: 12, stiffness: 140 },
  });

  const urgencySpring = spring({
    frame: frame - Math.round((cues.urgencySec ?? 3.0) * fps),
    fps,
    config: { damping: 12, stiffness: 160 },
  });

  const proofSpring = spring({
    frame: frame - Math.round((cues.proofSec ?? 4.2) * fps),
    fps,
    config: { damping: 12, stiffness: 160 },
  });

  const isFlipped = newSpring > 0.5;

  return (
    <AbsoluteFill style={{ backgroundColor: "#060A14", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(56, 189, 248, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.07) 1px, transparent 1px)",
          backgroundSize: isVertical ? "48px 48px" : "64px 64px",
          backgroundPosition: `0px ${-(frame * 0.8)}px`,
        }}
      />

      <AbsoluteFill
        style={{
          background: isVertical
            ? "radial-gradient(circle at 50% 30%, rgba(239, 68, 68, 0.14), transparent 50%), radial-gradient(circle at 50% 70%, rgba(56, 189, 248, 0.18), transparent 55%)"
            : "radial-gradient(circle at 25% 50%, rgba(239, 68, 68, 0.14), transparent 50%), radial-gradient(circle at 75% 50%, rgba(56, 189, 248, 0.18), transparent 50%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: isVertical ? 160 : 70,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 18px",
            borderRadius: 999,
            backgroundColor: "rgba(56, 189, 248, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            color: "#38BDF8",
            fontSize: isVertical ? 22 : 14,
            fontFamily: FONTS.mono,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <Sparkles size={isVertical ? 22 : 16} />
          {scene.kicker || "02 / THE CONTRAST FRAME"}
        </div>

        <div
          style={{
            transform: `scale(${urgencySpring})`,
            opacity: urgencySpring,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderRadius: 999,
            backgroundColor: "rgba(239, 68, 68, 0.2)",
            border: "1px solid rgba(239, 68, 68, 0.6)",
            color: "#FCA5A5",
            fontSize: isVertical ? 20 : 13,
            fontFamily: FONTS.mono,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          <Flame size={isVertical ? 20 : 14} color="#EF4444" />
          {cues.urgencyLabel || "BREAKING FILING AUDIT"}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: isVertical ? 320 : 220,
          bottom: isVertical ? 300 : 200,
          left: isVertical ? 60 : 100,
          right: isVertical ? 60 : 100,
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: isVertical ? 36 : 48,
          zIndex: 20,
        }}
      >
        <div
          style={{
            flex: 1,
            width: isVertical ? "100%" : "auto",
            height: isVertical ? "45%" : "80%",
            transform: `translateX(${interpolate(oldSpring, [0, 1], [-80, 0])}px) scale(${interpolate(
              oldSpring,
              [0, 1],
              [0.9, isFlipped ? 0.94 : 1]
            )})`,
            opacity: interpolate(oldSpring, [0, 1], [0, isFlipped ? 0.55 : 0.9]),
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            border: isFlipped ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(148, 163, 184, 0.3)",
            borderRadius: 24,
            padding: isVertical ? 32 : 40,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
            position: "relative",
            overflow: "hidden",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#94A3B8",
                fontFamily: FONTS.mono,
                fontSize: isVertical ? 20 : 14,
                fontWeight: 600,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              <XCircle size={isVertical ? 22 : 16} color={isFlipped ? "#EF4444" : "#94A3B8"} />
              {cues.oldTitle || "WHAT EVERYONE ASSUMES"}
            </div>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontWeight: 900,
                fontSize: isVertical ? 38 : 34,
                color: isFlipped ? "#94A3B8" : "#F8FAFC",
                textDecoration: isFlipped ? "line-through" : "none",
                lineHeight: 1.15,
                textTransform: "uppercase",
              }}
            >
              {cues.oldVal || scene.heading || "THE DEFAULT ASSUMPTION"}
            </div>
          </div>

          <div
            style={{
              fontFamily: FONTS.display,
              fontStyle: "italic",
              fontSize: isVertical ? 24 : 18,
              color: "#64748B",
              lineHeight: 1.4,
            }}
          >
            {cues.oldSub || scene.detail || "The common belief accepted as fact"}
          </div>

          {isFlipped && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(-12deg)",
                padding: "8px 24px",
                border: "3px solid #EF4444",
                borderRadius: 12,
                color: "#EF4444",
                fontFamily: FONTS.mono,
                fontWeight: 900,
                fontSize: isVertical ? 32 : 26,
                letterSpacing: 3,
                textTransform: "uppercase",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                pointerEvents: "none",
              }}
            >
              FALSE
            </div>
          )}
        </div>

        <div
          style={{
            transform: `scale(${newSpring}) rotate(${isVertical ? 90 : 0}deg)`,
            opacity: newSpring,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: isVertical ? 50 : 60,
            height: isVertical ? 50 : 60,
            borderRadius: "50%",
            backgroundColor: "rgba(56, 189, 248, 0.2)",
            border: "1px solid rgba(56, 189, 248, 0.5)",
            color: "#38BDF8",
          }}
        >
          <ArrowRight size={isVertical ? 28 : 32} />
        </div>

        <div
          style={{
            flex: 1.15,
            width: isVertical ? "100%" : "auto",
            height: isVertical ? "50%" : "86%",
            transform: `translateX(${interpolate(newSpring, [0, 1], [80, 0])}px) scale(${interpolate(
              newSpring,
              [0, 1],
              [0.85, 1.02]
            )})`,
            opacity: newSpring,
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            border: "2px solid #38BDF8",
            borderRadius: 24,
            padding: isVertical ? 36 : 44,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 0 60px rgba(56, 189, 248, 0.35)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(56, 189, 248, 0.35), transparent 70%)",
            }}
          />

          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#38BDF8",
                fontFamily: FONTS.mono,
                fontSize: isVertical ? 22 : 15,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              <Zap size={isVertical ? 24 : 18} color="#38BDF8" />
              {cues.newTitle || "THE NEW REVEAL"}
            </div>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontWeight: 900,
                fontSize: isVertical ? 44 : 40,
                color: "#FFFFFF",
                lineHeight: 1.1,
                letterSpacing: -0.5,
                textTransform: "uppercase",
              }}
            >
              {cues.newVal || scene.big || "WHAT THE RECORD PROVES"}
            </div>
          </div>

          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: isVertical ? 22 : 16,
              color: "#E2E8F0",
              lineHeight: 1.4,
              paddingTop: 12,
              borderTop: "1px solid rgba(56, 189, 248, 0.25)",
            }}
          >
            {cues.newSub || "The underlying economic driver operating in plain sight."}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: isVertical ? 160 : 70,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 30,
          transform: `translateY(${interpolate(proofSpring, [0, 1], [40, 0])}px)`,
          opacity: proofSpring,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: isVertical ? "14px 28px" : "10px 24px",
            borderRadius: 999,
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.5)",
            boxShadow: "0 10px 30px rgba(16, 185, 129, 0.2)",
          }}
        >
          <ShieldCheck size={isVertical ? 28 : 20} color="#10B981" />
          <span
            style={{
              fontFamily: FONTS.mono,
              fontWeight: 700,
              fontSize: isVertical ? 20 : 14,
              color: "#A7F3D0",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            BULLSEYE PROOF: {cues.proofLabel || scene.sourceLabel || "VERIFIED PUBLIC RECORD"}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * ARCHETYPE 3: 3D SEC Document Spotlight + Word-by-Word Whisper Neon Highlighter + Z-Space Callout
 */
const ArchetypeSecDocument3D: React.FC<{
  scene: CompiledScene;
  durFrames: number;
  isVertical: boolean;
}> = ({ scene, durFrames, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localSec = frame / fps;
  const p = frame / Math.max(1, durFrames);
  const cues = scene.cues || {};

  const camPush = interpolate(p, [0, 0.45, 1], [0, 0.78, 1], { extrapolateRight: "clamp" });
  const rotX = interpolate(camPush, [0, 1], [23, 8.5]);
  const rotY = interpolate(camPush, [0, 1], [-15, -2.8]);
  const rotZ = interpolate(camPush, [0, 1], [-4.0, -0.7]);
  const docScale = interpolate(camPush, [0, 1], [isVertical ? 0.88 : 0.86, isVertical ? 1.0 : 1.06]);

  const calloutSpring = spring({
    frame: frame - Math.round((cues.calloutSec ?? 3.5) * fps),
    fps,
    config: { damping: 12, stiffness: 158 },
  });

  const spokenWords = (cues.spokenWords || []) as Array<{
    word: string;
    relStart: number;
    relEnd: number;
  }>;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080D1A",
        backgroundImage: "radial-gradient(circle at 50% 42%, #172542 0%, #060913 78%)",
        perspective: 1350,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: isVertical ? 84 : 40,
          left: isVertical ? 48 : 68,
          right: isVertical ? 48 : "auto",
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 22px",
          borderRadius: 999,
          background: "rgba(15, 23, 42, 0.9)",
          border: "1px solid rgba(252, 211, 77, 0.38)",
          zIndex: 35,
        }}
      >
        <FileText size={20} color="#FCD34D" />
        <span style={{ fontFamily: FONTS.mono, fontSize: 18, letterSpacing: "0.12em", color: "#F8FAFC" }}>
          PRIMARY EVIDENCE // {cues.sourceHeader || "AUDITED DISCLOSURE"}
        </span>
      </div>

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
            width: isVertical ? 940 : 1320,
            background: "#FAF7F0",
            borderRadius: 14,
            padding: isVertical ? "44px 48px" : "52px 72px",
            boxShadow: "0 55px 110px rgba(0,0,0,0.85)",
            transform: `translateY(${isVertical ? -95 : -58}px) scale(${docScale}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
            transformStyle: "preserve-3d",
            color: "#111827",
          }}
        >
          <div
            style={{
              borderBottom: "3px double #111827",
              paddingBottom: 16,
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 16, letterSpacing: "0.14em", fontWeight: 700, color: "#374151" }}>
                UNITED STATES SECURITIES & INVESTOR DISCLOSURES
              </div>
              <div style={{ fontFamily: FONTS.display, fontSize: isVertical ? 34 : 42, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>
                {cues.docTitle || scene.heading}
              </div>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 16, color: "#B91C1C", fontWeight: 700 }}>
              ITEM 7. MD&A AUDIT
            </div>
          </div>

          {/* WORD-BY-WORD WHISPER HIGHLIGHTED FILING EXTRACT */}
          <div
            style={{
              background: "#FFFFFF",
              border: "2px solid #CBD5E1",
              borderRadius: 12,
              padding: "28px 34px",
            }}
          >
            <div style={{ fontFamily: FONTS.mono, fontSize: 15, letterSpacing: "0.12em", color: "#64748B", marginBottom: 14 }}>
              VERBATIM RECORD EXTRACT — {cues.sourceHeader}
            </div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: isVertical ? 30 : 33,
                lineHeight: 1.62,
                color: "#0F172A",
                fontWeight: 600,
              }}
            >
              “
              {spokenWords.map((sw, idx) => {
                const activeP = interpolate(
                  localSec,
                  [sw.relStart - 0.04, sw.relEnd],
                  [0, 100],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );
                const isKey = /^\$\d|billion|billions|million|cash|american|express|chase|loyalty/i.test(
                  sw.word.replace(/[^a-zA-Z0-9$]/g, "")
                );
                return (
                  <React.Fragment key={idx}>
                    <span
                      style={{
                        backgroundImage: isKey
                          ? "linear-gradient(90deg, rgba(250, 204, 21, 0.88), rgba(245, 158, 11, 0.78))"
                          : "linear-gradient(90deg, rgba(254, 240, 138, 0.78), rgba(253, 224, 71, 0.75))",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: `${activeP}% 90%`,
                        backgroundPosition: "0 86%",
                        padding: "1px 3px",
                        borderRadius: 4,
                        fontWeight: isKey && activeP > 20 ? 700 : 600,
                      }}
                    >
                      {sw.word}
                    </span>{" "}
                  </React.Fragment>
                );
              })}
              ”
            </div>
          </div>

          {cues.sourceUrl && (
            <div style={{ marginTop: 18, fontFamily: FONTS.mono, fontSize: 16, color: "#475569" }}>
              FILING SOURCE: {cues.sourceUrl}
            </div>
          )}
        </div>

        {/* Floating Z-Space Evidence Callout Card (Pops right on spoken $B figure!) */}
        {calloutSpring > 0.01 && (
          <div
            style={{
              position: "absolute",
              right: isVertical ? 60 : 105,
              left: isVertical ? 60 : "auto",
              bottom: isVertical ? 320 : 148,
              transform: `translateZ(120px) scale(${interpolate(calloutSpring, [0, 1], [0.65, 1])}) translateY(${interpolate(
                calloutSpring,
                [0, 1],
                [40, 0]
              )}px)`,
              opacity: interpolate(calloutSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
              background: "linear-gradient(135deg, #0B1325 0%, #162444 100%)",
              border: "2.5px solid #FCD34D",
              borderRadius: 24,
              padding: "26px 40px",
              boxShadow: "0 35px 75px rgba(0,0,0,0.88)",
              zIndex: 45,
              minWidth: isVertical ? 0 : 520,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: FONTS.mono, fontSize: 18, letterSpacing: "0.12em", color: "#34D399" }}>
              <CheckCircle2 size={22} color="#34D399" />
              AUDITED CASH REALITY
            </div>
            <div style={{ fontFamily: FONTS.display, fontSize: isVertical ? 74 : 92, fontWeight: 700, color: "#FCD34D", lineHeight: 1.04, marginTop: 8 }}>
              {cues.calloutValue || scene.big}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: FONTS.sans, fontSize: 23, fontWeight: 700, color: "#F8FAFC", marginTop: 8 }}>
              <Award size={22} color="#FCD34D" />
              {cues.calloutSub || scene.detail}
            </div>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * ARCHETYPE 4: Strategic Takeaway Vault & Word-Locked 2.5D Hero Cutout
 */
const ArchetypeVaultFinale: React.FC<{
  scene: CompiledScene;
  slug: string;
  durFrames: number;
  isVertical: boolean;
}> = ({ scene, slug, durFrames, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localSec = frame / fps;
  const isAirline = slug.includes("airline");
  const cues = scene.cues || {};

  const strikeSec = cues.strikeSec ?? 0.9;
  const heroSec = cues.heroSec ?? 2.6;
  const stampSec = cues.stampSec ?? 4.8;

  const bgScale = interpolate(frame, [0, durFrames], [1.14, 1.02], { extrapolateRight: "clamp" });
  const strikePct = interpolate(localSec, [strikeSec, strikeSec + 0.55], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const heroSpring = spring({
    frame: frame - Math.round(heroSec * fps),
    fps,
    config: { damping: 13, stiffness: 138 },
  });

  const stampSpring = spring({
    frame: frame - Math.round(stampSec * fps),
    fps,
    config: { damping: 12, stiffness: 175 },
  });

  const floatY = Math.sin(frame * 0.08) * 11;
  const floatRot = Math.sin(frame * 0.05) * 2.0;
  const shineX = interpolate(localSec, [heroSec + 0.35, heroSec + 2.4], [-35, 135], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const motes = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        xSeed: i * 197,
        speed: 1.4 + (i % 4) * 0.55,
        ySeed: i * 95,
        size: 3 + (i % 4) * 2,
        alpha: 0.22 + (i % 3) * 0.15,
      })),
    []
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#050608", overflow: "hidden" }}>
      {isAirline ? (
        <AbsoluteFill style={{ transform: `scale(${bgScale})` }}>
          <Img
            src={staticFile("assets/vault_bg.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.78 }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            background: "radial-gradient(circle at 50% 45%, #231B0C 0%, #090C15 65%, #040508 100%)",
            transform: `scale(${bgScale})`,
          }}
        />
      )}

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 48%, rgba(245, 185, 66, 0.22) 0%, rgba(5, 6, 8, 0.72) 74%)",
        }}
      />

      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 8 }}>
        {motes.map((m, idx) => {
          const x = (m.xSeed + Math.sin(frame * 0.03 + idx) * 30) % (isVertical ? 1080 : 1920);
          const maxH = isVertical ? 1980 : 1140;
          const y = maxH - ((frame * m.speed + m.ySeed) % maxH);
          return <circle key={idx} cx={x} cy={y} r={m.size} fill={`rgba(253, 224, 71, ${m.alpha})`} />;
        })}
      </svg>

      {/* Top Strikethrough & Hero Metallic Title */}
      <div
        style={{
          position: "absolute",
          top: isVertical ? 105 : 54,
          left: 48,
          right: 48,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          zIndex: 20,
        }}
      >
        <div
          style={{
            position: "relative",
            fontFamily: FONTS.mono,
            fontSize: isVertical ? 23 : 28,
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.88)",
            padding: "6px 20px",
            textTransform: "uppercase",
          }}
        >
          {cues.strikeLabel || scene.heading}
          <div
            style={{
              position: "absolute",
              left: "3%",
              top: "52%",
              height: 5,
              width: `${strikePct * 0.94}%`,
              background: "#EF4444",
              borderRadius: 4,
            }}
          />
        </div>

        {heroSpring > 0.01 && (
          <div
            style={{
              marginTop: 10,
              fontFamily: FONTS.display,
              fontSize: isVertical ? 78 : 110,
              fontWeight: 700,
              lineHeight: 1.02,
              background: "linear-gradient(180deg, #FFFBEB 0%, #FCD34D 52%, #D97706 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              transform: `scale(${interpolate(heroSpring, [0, 1], [0.78, 1])})`,
              opacity: interpolate(heroSpring, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            {cues.heroTitle || scene.big || "BANKS WITH WINGS"}
          </div>
        )}
      </div>

      {/* Center 2.5D Hero Cutout or Emblem */}
      {isAirline ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: isVertical ? "54%" : "56%",
            width: isVertical ? 940 : 1050,
            transform: `translate(-50%, -50%) translateY(${
              interpolate(heroSpring, [0, 1], [110, 0]) + floatY
            }px) scale(${interpolate(heroSpring, [0, 1], [0.68, 1.02])}) rotate(${floatRot}deg)`,
            opacity: localSec < heroSec - 0.1 ? 0.22 : 1,
            zIndex: 18,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "12%",
              background: "radial-gradient(ellipse at center, rgba(245,185,66,0.28) 0%, rgba(0,0,0,0.85) 68%, transparent 80%)",
              zIndex: -1,
            }}
          />
          <div style={{ position: "relative", overflow: "hidden" }}>
            <Img src={staticFile("assets/card_wings_cutout.png")} style={{ width: "100%", height: "auto" }} />
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${shineX}%`,
                width: "22%",
                background: "linear-gradient(105deg, transparent 0%, rgba(255,250,220,0.34) 50%, transparent 100%)",
                transform: "skewX(-22deg)",
                mixBlendMode: "overlay",
              }}
            />
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "53%",
            transform: `translate(-50%, -50%) translateY(${floatY}px) scale(${Math.max(0.25, heroSpring)})`,
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FCD34D 0%, #B45309 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 30px 80px rgba(245, 185, 66, 0.35)",
            zIndex: 18,
          }}
        >
          <Layers size={115} color="#0F172A" />
        </div>
      )}

      {/* Bottom Takeaway Stamp */}
      {stampSpring > 0.01 && (
        <div
          style={{
            position: "absolute",
            bottom: isVertical ? 315 : 132,
            left: 54,
            right: 54,
            display: "flex",
            justifyContent: "center",
            zIndex: 30,
          }}
        >
          <div
            style={{
              transform: `scale(${interpolate(stampSpring, [0, 1], [1.28, 1])})`,
              opacity: interpolate(stampSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
              background: "rgba(12, 16, 26, 0.94)",
              border: "2px solid #F5B942",
              padding: "16px 42px",
              borderRadius: 16,
              boxShadow: "0 20px 55px rgba(0,0,0,0.85)",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontFamily: FONTS.sans,
                fontWeight: 900,
                fontSize: isVertical ? 28 : 34,
                letterSpacing: "0.06em",
                color: "#FFFBEB",
                textTransform: "uppercase",
              }}
            >
              {cues.stampText || scene.detail}
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * ARCHETYPE 5: Dedicated "THE LINCOLN PENNY" Brand End-Screen + 1-Sentence Mission + Like / Subscribe / Share CTA
 */
const ArchetypeBrandOutro: React.FC<{
  scene: CompiledScene;
  durFrames: number;
  isVertical: boolean;
}> = ({ scene, durFrames, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localSec = frame / fps;
  const cues = scene.cues || {};

  const coinSpring = spring({
    frame: frame - Math.round((cues.coinSec ?? 0.1) * fps),
    fps,
    config: { damping: 12, stiffness: 145 },
  });

  const missionSpring = spring({
    frame: frame - Math.round((cues.missionSec ?? 0.8) * fps),
    fps,
    config: { damping: 14, stiffness: 155 },
  });

  const likeSpring = spring({
    frame: frame - Math.round((cues.likeSec ?? 2.2) * fps),
    fps,
    config: { damping: 11, stiffness: 190 },
  });

  const subSpring = spring({
    frame: frame - Math.round((cues.subSec ?? 2.75) * fps),
    fps,
    config: { damping: 11, stiffness: 195 },
  });

  const shareSpring = spring({
    frame: frame - Math.round((cues.shareSec ?? 3.3) * fps),
    fps,
    config: { damping: 11, stiffness: 190 },
  });

  const coinShine = interpolate(localSec, [0.3, 2.2], [-40, 140], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgZoom = interpolate(frame, [0, durFrames], [1.06, 1.0], { extrapolateRight: "clamp" });

  const ctaItems = [
    {
      label: "LIKE",
      sub: "Support the Audit",
      Icon: ThumbsUp,
      prog: likeSpring,
      accent: "#F59E0B",
      bg: "rgba(245, 158, 11, 0.16)",
      isHero: false,
    },
    {
      label: "SUBSCRIBE & FOLLOW",
      sub: "Never Miss an Episode",
      Icon: Bell,
      prog: subSpring,
      accent: "#EF4444",
      bg: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
      isHero: true,
    },
    {
      label: "SHARE",
      sub: "Send to a Builder",
      Icon: Share2,
      prog: shareSpring,
      accent: "#10B981",
      bg: "rgba(16, 185, 129, 0.16)",
      isHero: false,
    },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#04060C", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${bgZoom})`,
          background:
            "radial-gradient(circle at 50% 34%, rgba(217, 119, 6, 0.28) 0%, rgba(12, 18, 34, 0.88) 54%, #04060C 90%)",
        }}
      />

      {/* Precision Blueprint Grid */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(252, 211, 77, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(252, 211, 77, 0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: isVertical ? "90px 54px 230px" : "42px 110px 115px",
          gap: isVertical ? 34 : 26,
          zIndex: 20,
        }}
      >
        {/* Authentic Embossed Bronze Lincoln Penny Medallion */}
        <div
          style={{
            position: "relative",
            width: isVertical ? 220 : 184,
            height: isVertical ? 220 : 184,
            borderRadius: "50%",
            boxShadow:
              "0 24px 65px rgba(217, 119, 6, 0.55), 0 0 45px rgba(245, 158, 11, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            transform: `scale(${interpolate(coinSpring, [0, 1], [0.4, 1])}) rotateY(${interpolate(
              coinSpring,
              [0, 1],
              [-140, 0]
            )}deg)`,
          }}
        >
          <Img
            src={staticFile("assets/lincoln-penny-coin.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${coinShine}%`,
              width: "35%",
              background:
                "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
              transform: "skewX(-20deg)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Channel Masthead */}
        <div
          style={{
            textAlign: "center",
            transform: `translateY(${interpolate(coinSpring, [0, 1], [24, 0])}px)`,
            opacity: interpolate(coinSpring, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: isVertical ? 76 : 92,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.0,
              background: "linear-gradient(180deg, #FFFBEB 0%, #FCD34D 55%, #D97706 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {cues.channelName || "THE LINCOLN PENNY"}
          </div>
        </div>

        {/* One-Sentence Channel Mission Cue */}
        <div
          style={{
            maxWidth: isVertical ? 940 : 1240,
            background: "rgba(15, 23, 42, 0.88)",
            border: "1.5px solid rgba(252, 211, 77, 0.42)",
            borderRadius: 22,
            padding: isVertical ? "24px 36px" : "20px 48px",
            textAlign: "center",
            opacity: interpolate(missionSpring, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(missionSpring, [0, 1], [22, 0])}px)`,
            boxShadow: "0 18px 48px rgba(0,0,0,0.65)",
          }}
        >
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: isVertical ? 33 : 34,
              fontWeight: 700,
              color: "#F8FAFC",
              lineHeight: 1.35,
            }}
          >
            “{cues.missionText || "We uncover the hidden money engines behind everyday businesses."}”
          </span>
        </div>

        {/* Word-Locked Like / Subscribe & Follow / Share Buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
            alignItems: "stretch",
            justifyContent: "center",
            gap: isVertical ? 20 : 28,
            width: "100%",
            maxWidth: isVertical ? 860 : 1380,
            marginTop: 6,
          }}
        >
          {ctaItems.map((item, idx) => {
            const IconComp = item.Icon;
            const active = item.prog > 0.02;
            return (
              <div
                key={idx}
                style={{
                  flex: item.isHero ? 1.3 : 1,
                  background: active ? item.bg : "rgba(15, 23, 42, 0.55)",
                  border: `2.5px solid ${active ? (item.isHero ? "#FCA5A5" : item.accent) : "rgba(255,255,255,0.14)"}`,
                  borderRadius: 22,
                  padding: isVertical ? "22px 32px" : "22px 30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 18,
                  transform: `scale(${active ? interpolate(item.prog, [0, 0.6, 1], [0.82, 1.06, 1]) : 0.94})`,
                  opacity: active ? 1 : 0.38,
                  boxShadow: active ? "0 20px 45px rgba(0,0,0,0.65)" : "none",
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    background: item.isHero ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconComp size={28} color="#FFFBEB" />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontFamily: FONTS.sans,
                      fontWeight: 900,
                      fontSize: isVertical ? 30 : 28,
                      letterSpacing: "0.04em",
                      color: "#FFFBEB",
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
                    {item.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Multi-Outlet Bar */}
        <div
          style={{
            marginTop: 4,
            fontFamily: FONTS.mono,
            fontSize: isVertical ? 19 : 18,
            letterSpacing: "0.16em",
            color: "#FCD34D",
            opacity: 0.9,
            textAlign: "center",
          }}
        >
          {cues.outletsText || "YOUTUBE  •  INSTAGRAM  •  FACEBOOK  •  TIKTOK"} &nbsp;|&nbsp;{" "}
          <span style={{ color: "#FFFFFF" }}>{cues.handleText || "@TheLincolnPenny"}</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Master Word-Locked Blueprint Episode Composition (Supports 16:9 Longs & 9:16 Shorts)
 */
export const BlueprintStoryComposition: React.FC<BlueprintInputProps> = ({
  slug,
  format,
  beats,
  beatTimes,
  scenes: propScenes,
  words,
  duration,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const globalTimeSec = frame / fps;
  const isVertical = format === "short" || height > width;

  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  // Fallback scene list if rendered in Remotion Studio without pre-compiled props.scenes
  const scenes: CompiledScene[] = useMemo(() => {
    if (Array.isArray(propScenes) && propScenes.length > 0) {
      return propScenes;
    }
    return beats.map((b, idx) => {
      const bt = beatTimes[idx] || { start: idx * 5, end: (idx + 1) * 5 };
      const arch =
        idx === 0
          ? "hook"
          : b.visual?.type === "outro"
          ? "outro"
          : idx === beats.length - 1
          ? "vault"
          : (["whiteboard", "terminal", "sec3d"] as const)[(idx - 1) % 3];
      return {
        index: idx,
        beatIndex: idx,
        archetype: arch,
        transitionAfter: idx < beats.length - 1 ? "fade" : "none",
        start: bt.start,
        end: bt.end,
        duration: bt.end - bt.start,
        kicker: b.kicker,
        heading: b.heading,
        big: b.big || "",
        detail: b.detail || "",
        sourceLabel: b.sourceLabel || "",
        cues: {},
      };
    });
  }, [propScenes, beats, beatTimes]);

  const activeScene =
    scenes.find((s, idx) =>
      idx === scenes.length - 1
        ? globalTimeSec >= s.start
        : globalTimeSec >= s.start && globalTimeSec < s.end
    ) || scenes[0];

  const TRANSITION_FRAMES = 9;
  const totalFrames = Math.max(30, Math.round((Number(duration) || 10) * fps));

  const renderSceneNode = (sc: CompiledScene, durFrames: number) => {
    switch (sc.archetype) {
      case "hook":
        return <ArchetypeParallaxHook scene={sc} slug={slug} durFrames={durFrames} isVertical={isVertical} />;
      case "whiteboard":
        return <ArchetypeRoughWhiteboard scene={sc} durFrames={durFrames} isVertical={isVertical} />;
      case "terminal":
        return <ArchetypeKineticTerminal scene={sc} isVertical={isVertical} />;
      case "contrast":
        return <ArchetypeContrastNovelty scene={sc} durFrames={durFrames} isVertical={isVertical} />;
      case "sec3d":
        return <ArchetypeSecDocument3D scene={sc} durFrames={durFrames} isVertical={isVertical} />;
      case "outro":
        return <ArchetypeBrandOutro scene={sc} durFrames={durFrames} isVertical={isVertical} />;
      case "vault":
      default:
        return <ArchetypeVaultFinale scene={sc} slug={slug} durFrames={durFrames} isVertical={isVertical} />;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#050811" }}>
      {audioFile && <Audio src={staticFile(audioFile)} />}

      <TransitionSeries>
        {scenes.map((sc, idx) => {
          const isLast = idx === scenes.length - 1;
          const fStart = idx === 0 ? 0 : Math.round(sc.start * fps);
          const fNext = isLast ? totalFrames : Math.round(scenes[idx + 1].start * fps);
          const baseFrames = Math.max(15, fNext - fStart);
          // Add TRANSITION_FRAMES to non-final scenes so TransitionSeries subtraction keeps exact fNext alignment!
          const seqFrames = isLast ? baseFrames : baseFrames + TRANSITION_FRAMES;

          return (
            <React.Fragment key={sc.index}>
              <TransitionSeries.Sequence durationInFrames={seqFrames}>
                {renderSceneNode(sc, baseFrames)}
              </TransitionSeries.Sequence>
              {!isLast && sc.transitionAfter === "wipe-right" && (
                <TransitionSeries.Transition
                  presentation={wipe({ direction: "from-right" })}
                  timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
                />
              )}
              {!isLast && sc.transitionAfter === "wipe-left" && (
                <TransitionSeries.Transition
                  presentation={wipe({ direction: "from-left" })}
                  timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
                />
              )}
              {!isLast && sc.transitionAfter === "slide-up" && (
                <TransitionSeries.Transition
                  presentation={slide({ direction: "from-bottom" })}
                  timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
                />
              )}
              {!isLast &&
                sc.transitionAfter !== "wipe-right" &&
                sc.transitionAfter !== "wipe-left" &&
                sc.transitionAfter !== "slide-up" && (
                  <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
                  />
                )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>

      <KineticCaptionBar
        words={words}
        globalTimeSec={globalTimeSec}
        lightTheme={activeScene?.archetype === "whiteboard"}
      />

      <BroadcastGrade dark={activeScene?.archetype !== "whiteboard"} />
    </AbsoluteFill>
  );
};
