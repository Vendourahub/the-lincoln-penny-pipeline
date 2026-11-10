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
import wordsData from "../public/mcdonalds/words.json";

interface WordItem {
  word: string;
  start: number;
  end: number;
}

const WORDS: WordItem[] = wordsData.words;

export const McDonaldsFoundersShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = frame / fps;

  // Active word calculation for kinetic caption bar
  const activeWordIdx = useMemo(() => {
    return WORDS.findIndex((w) => time >= w.start && time < w.end);
  }, [time]);

  // Optical micro-camera drift
  const camZoom = interpolate(frame, [0, 1253], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });
  const camPanY = interpolate(frame, [0, 1253], [0, -15], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080706",
        overflow: "hidden",
        fontFamily: FONTS.sans,
        color: "#ffffff",
      }}
    >
      <Audio src={staticFile("mcdonalds/audio.mp3")} />

      {/* Camera Stage */}
      <AbsoluteFill
        style={{
          transform: `scale(${camZoom}) translateY(${camPanY}px)`,
          transformOrigin: "center center",
        }}
      >
        {/* Background Grid & Architectural Atmosphere */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 50% 35%, #18120d 0%, #0a0705 60%, #030202 100%)",
          }}
        >
          {/* Subtle Technical Blueprint Grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(to right, rgba(255, 199, 44, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 199, 44, 0.04) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              opacity: 0.9,
            }}
          />

          {/* Top HUD Marks */}
          <div
            style={{
              position: "absolute",
              top: 70,
              left: 60,
              fontFamily: FONTS.mono,
              fontSize: 16,
              color: "rgba(255, 199, 44, 0.6)",
              letterSpacing: 2,
              fontWeight: 600,
            }}
          >
            THE LINCOLN PENNY // DOSSIER 01
          </div>
          <div
            style={{
              position: "absolute",
              top: 70,
              right: 60,
              fontFamily: FONTS.mono,
              fontSize: 16,
              color: "rgba(255, 75, 75, 0.8)",
              letterSpacing: 2,
              fontWeight: 700,
            }}
          >
            CASE: THE FORBIDDEN NAME
          </div>
        </AbsoluteFill>

        {/* ======================================================== */}
        {/* SCENE 1: THE GOLDEN ARCH HOOK (0s - 6.0s / f 0 - 180)    */}
        {/* ======================================================== */}
        {time < 6.2 && (
          <AbsoluteFill
            style={{
              opacity: interpolate(time, [5.5, 6.1], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <Scene1GoldenArchHook frame={frame} fps={fps} time={time} />
          </AbsoluteFill>
        )}

        {/* ======================================================== */}
        {/* SCENE 2: THE SPEEDEE BROTHERS (5.8s - 14.5s / f 174-435) */}
        {/* ======================================================== */}
        {time >= 5.6 && time < 14.8 && (
          <AbsoluteFill
            style={{
              opacity: interpolate(
                time,
                [5.6, 6.2, 14.0, 14.7],
                [0, 1, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              ),
            }}
          >
            <Scene2SpeedeeBrothers frame={frame} fps={fps} time={time} />
          </AbsoluteFill>
        )}

        {/* ======================================================== */}
        {/* SCENE 3: RAY KROC & THE MULTIMIXER (14.2s - 26.8s)       */}
        {/* ======================================================== */}
        {time >= 14.1 && time < 27.2 && (
          <AbsoluteFill
            style={{
              opacity: interpolate(
                time,
                [14.1, 14.8, 26.3, 27.1],
                [0, 1, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              ),
            }}
          >
            <Scene3RayKrocEmpire frame={frame} fps={fps} time={time} />
          </AbsoluteFill>
        )}

        {/* ======================================================== */}
        {/* SCENE 4: THE $2.7M BUYOUT BETRAYAL (26.5s - 33.2s)       */}
        {/* ======================================================== */}
        {time >= 26.4 && time < 33.6 && (
          <AbsoluteFill
            style={{
              opacity: interpolate(
                time,
                [26.4, 27.0, 32.8, 33.5],
                [0, 1, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              ),
            }}
          >
            <Scene4BuyoutBetrayal frame={frame} fps={fps} time={time} />
          </AbsoluteFill>
        )}

        {/* ======================================================== */}
        {/* SCENE 5: THE BIG M & SEAMLESS REPLAY LOOP (33.0s - 41.75s)*/}
        {/* ======================================================== */}
        {time >= 32.9 && (
          <AbsoluteFill
            style={{
              opacity: interpolate(time, [32.9, 33.5], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <Scene5TheBigMLoop frame={frame} fps={fps} time={time} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>

      {/* ======================================================== */}
      {/* WORD-LOCKED KINETIC CAPTION BAR (SAFE ZONE Y = 1380px)   */}
      {/* ======================================================== */}
      <ShortsKineticCaptions
        words={WORDS}
        activeIdx={activeWordIdx}
        time={time}
      />

      {/* Outer Cinematic Vignette */}
      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 160px rgba(0,0,0,0.85)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// =========================================================================
// SCENE 1: THE GOLDEN ARCH HOOK
// =========================================================================
const Scene1GoldenArchHook: React.FC<{
  frame: number;
  fps: number;
  time: number;
}> = ({ frame, fps, time }) => {
  const enterScale = interpolate(frame, [0, 180], [1.02, 1.1], {
    extrapolateRight: "clamp",
  });
  const signGlow = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.85, 1.05]
  );

  const stampPop = spring({
    frame: frame - 18,
    fps,
    config: { damping: 12, stiffness: 220 },
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background Neon Sign Hero */}
      <div
        style={{
          position: "absolute",
          width: 960,
          height: 1280,
          top: 140,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 25px 70px rgba(0,0,0,0.8)",
          transform: `scale(${enterScale})`,
          filter: `brightness(${signGlow})`,
        }}
      >
        <Img
          src={staticFile("mcdonalds/neon_sign.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* Dark gradient overlay for text readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(8,7,6,0.95) 0%, rgba(8,7,6,0.2) 50%, rgba(8,7,6,0.8) 100%)",
          }}
        />
      </div>

      {/* Shocking Headline HUD Overlay */}
      <div
        style={{
          position: "absolute",
          top: 180,
          width: 920,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 22,
            letterSpacing: 4,
            color: "#FFC72C",
            marginBottom: 16,
            textTransform: "uppercase",
            background: "rgba(255, 199, 44, 0.12)",
            padding: "8px 24px",
            borderRadius: 8,
            border: "1px solid rgba(255, 199, 44, 0.3)",
          }}
        >
          THE ORIGINAL FAST FOOD PARADOX
        </div>

        <h1
          style={{
            fontFamily: FONTS.serif,
            fontSize: 66,
            fontWeight: 800,
            lineHeight: 1.1,
            color: "#ffffff",
            margin: 0,
            textShadow: "0 4px 20px rgba(0,0,0,0.9)",
          }}
        >
          Losing The Right To Call It{" "}
          <span style={{ color: "#FFC72C" }}>McDonald's</span>
        </h1>
      </div>

      {/* Red Forensic Stamp: FORBIDDEN NAME */}
      {frame >= 18 && (
        <div
          style={{
            position: "absolute",
            top: 1100,
            transform: `scale(${stampPop}) rotate(-6deg)`,
            background: "rgba(220, 38, 38, 0.95)",
            border: "4px solid #ffffff",
            padding: "18px 42px",
            borderRadius: 16,
            boxShadow: "0 20px 50px rgba(220, 38, 38, 0.6)",
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 32,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            FORBIDDEN FROM THEIR OWN NAME
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// =========================================================================
// SCENE 2: THE SPEEDEE BROTHERS (DICK & MAC)
// =========================================================================
const Scene2SpeedeeBrothers: React.FC<{
  frame: number;
  fps: number;
  time: number;
}> = ({ frame, fps, time }) => {
  const enterSpring = spring({
    frame: frame - 170,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const photoZoom = interpolate(frame, [170, 435], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Archival Photograph of the Brothers */}
      <div
        style={{
          position: "absolute",
          width: 940,
          height: 1180,
          top: 170,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.9)",
          transform: `scale(${enterSpring * photoZoom})`,
          border: "2px solid rgba(255, 199, 44, 0.2)",
        }}
      >
        <Img
          src={staticFile("mcdonalds/brothers.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(8,7,6,0.92) 0%, rgba(8,7,6,0.1) 45%, rgba(8,7,6,0.7) 100%)",
          }}
        />
      </div>

      {/* Header Tag */}
      <div
        style={{
          position: "absolute",
          top: 200,
          display: "flex",
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 20,
            color: "#FFC72C",
            background: "rgba(0,0,0,0.7)",
            padding: "8px 20px",
            borderRadius: 6,
            border: "1px solid rgba(255, 199, 44, 0.4)",
            letterSpacing: 2,
          }}
        >
          SAN BERNARDINO, CA // 1948
        </div>
      </div>

      {/* Forensic Ledger: Speedee Assembly System */}
      <div
        style={{
          position: "absolute",
          bottom: 480,
          width: 880,
          background: "rgba(14, 11, 8, 0.88)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255, 199, 44, 0.25)",
          borderRadius: 16,
          padding: "24px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 20px 40px rgba(0,0,0,0.7)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 16,
              color: "rgba(255, 199, 44, 0.8)",
              letterSpacing: 1.5,
              marginBottom: 4,
            }}
          >
            INVENTION: SPEEDEE SERVICE SYSTEM
          </div>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: 32,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            Richard & Maurice McDonald
          </div>
        </div>

        <div
          style={{
            background: "#FFC72C",
            color: "#080706",
            padding: "12px 24px",
            borderRadius: 12,
            fontFamily: FONTS.mono,
            fontWeight: 900,
            fontSize: 28,
          }}
        >
          15¢ BURGERS
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =========================================================================
// SCENE 3: RAY KROC & THE MULTIMIXER EMPIRE
// =========================================================================
const Scene3RayKrocEmpire: React.FC<{
  frame: number;
  fps: number;
  time: number;
}> = ({ frame, fps, time }) => {
  const enterSpring = spring({
    frame: frame - 425,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const krocDrift = interpolate(frame, [425, 795], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Ray Kroc Portrait with Multimixer */}
      <div
        style={{
          position: "absolute",
          width: 940,
          height: 1180,
          top: 170,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.9)",
          transform: `scale(${enterSpring * krocDrift})`,
          border: "2px solid rgba(255, 199, 44, 0.2)",
        }}
      >
        <Img
          src={staticFile("mcdonalds/kroc.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(8,7,6,0.92) 0%, rgba(8,7,6,0.15) 50%, rgba(8,7,6,0.7) 100%)",
          }}
        />
      </div>

      {/* Header Tag */}
      <div
        style={{
          position: "absolute",
          top: 200,
          display: "flex",
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 20,
            color: "#FFC72C",
            background: "rgba(0,0,0,0.75)",
            padding: "8px 20px",
            borderRadius: 6,
            border: "1px solid rgba(255, 199, 44, 0.4)",
            letterSpacing: 2,
          }}
        >
          THE MILKSHAKE SALESMAN // 1954
        </div>
      </div>

      {/* Expansion Indicator Card */}
      <div
        style={{
          position: "absolute",
          bottom: 480,
          width: 880,
          background: "rgba(14, 11, 8, 0.88)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255, 199, 44, 0.25)",
          borderRadius: 16,
          padding: "24px 32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.7)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 16,
                color: "#FFC72C",
                letterSpacing: 2,
                marginBottom: 4,
              }}
            >
              PRINCE CASTLE MULTIMIXER REP
            </div>
            <div
              style={{
                fontFamily: FONTS.serif,
                fontSize: 34,
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              Ray A. Kroc
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              THE VISION
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 22,
                fontWeight: 800,
                color: "#FFC72C",
              }}
            >
              COAST-TO-COAST
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =========================================================================
// SCENE 4: THE $2.7M BUYOUT BETRAYAL
// =========================================================================
const Scene4BuyoutBetrayal: React.FC<{
  frame: number;
  fps: number;
  time: number;
}> = ({ frame, fps, time }) => {
  const enterSpring = spring({
    frame: frame - 785,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const stampSlam = spring({
    frame: frame - 820,
    fps,
    config: { damping: 10, stiffness: 240 },
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 1961 Buyout Agreement & Cashier Check */}
      <div
        style={{
          position: "absolute",
          width: 940,
          height: 1180,
          top: 170,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.9)",
          transform: `scale(${enterSpring})`,
          border: "2px solid rgba(220, 38, 38, 0.3)",
        }}
      >
        <Img
          src={staticFile("mcdonalds/buyout.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(8,7,6,0.95) 0%, rgba(8,7,6,0.1) 45%, rgba(8,7,6,0.7) 100%)",
          }}
        />
      </div>

      {/* Header Tag */}
      <div
        style={{
          position: "absolute",
          top: 200,
          display: "flex",
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 20,
            color: "#FF4B4B",
            background: "rgba(0,0,0,0.75)",
            padding: "8px 20px",
            borderRadius: 6,
            border: "1px solid rgba(255, 75, 75, 0.4)",
            letterSpacing: 2,
          }}
        >
          CORPORATE ACQUISITION // 1961
        </div>
      </div>

      {/* Massive Forensic Stamp: $2,700,000 CASH */}
      {frame >= 820 && (
        <div
          style={{
            position: "absolute",
            top: 480,
            transform: `scale(${stampSlam}) rotate(-8deg)`,
            background: "rgba(185, 28, 28, 0.96)",
            border: "4px solid #ffffff",
            padding: "24px 48px",
            borderRadius: 16,
            boxShadow: "0 25px 60px rgba(185, 28, 28, 0.7)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 20,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: 2,
              marginBottom: 4,
            }}
          >
            TOTAL RIGHTS BUYOUT
          </div>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: 64,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: 1,
            }}
          >
            $2.7 MILLION
          </div>
        </div>
      )}

      {/* The Crucial Catch */}
      <div
        style={{
          position: "absolute",
          bottom: 480,
          width: 880,
          background: "rgba(14, 11, 8, 0.9)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255, 75, 75, 0.3)",
          borderRadius: 16,
          padding: "24px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 32,
            fontWeight: 800,
            color: "#FF4B4B",
            marginBottom: 6,
          }}
        >
          "THE BROTHERS KEPT THE STORE... BUT NOT THE NAME."
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 16,
            color: "rgba(255,255,255,0.65)",
            letterSpacing: 1,
          }}
        >
          Kroc opened a rival McDonald's across the street.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =========================================================================
// SCENE 5: THE BIG M & THE SEAMLESS REPLAY LOOP
// =========================================================================
const Scene5TheBigMLoop: React.FC<{
  frame: number;
  fps: number;
  time: number;
}> = ({ frame, fps, time }) => {
  // Cross fade from The Big M to the opening Golden Arches between 38s and 41.75s
  const loopCrossFade = interpolate(time, [38.2, 41.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* The Big M Burger Stand Photo */}
      <div
        style={{
          position: "absolute",
          width: 940,
          height: 1180,
          top: 170,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.9)",
          opacity: 1 - loopCrossFade,
        }}
      >
        <Img
          src={staticFile("mcdonalds/the_big_m.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(8,7,6,0.95) 0%, rgba(8,7,6,0.1) 45%, rgba(8,7,6,0.7) 100%)",
          }}
        />
      </div>

      {/* Golden Arches Sign Fading Back In For Natural Loop */}
      <div
        style={{
          position: "absolute",
          width: 940,
          height: 1180,
          top: 170,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.9)",
          opacity: loopCrossFade,
        }}
      >
        <Img
          src={staticFile("mcdonalds/neon_sign.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(8,7,6,0.95) 0%, rgba(8,7,6,0.2) 50%, rgba(8,7,6,0.8) 100%)",
          }}
        />
      </div>

      {/* Header Tag */}
      <div
        style={{
          position: "absolute",
          top: 200,
          display: "flex",
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 20,
            color: "#FFC72C",
            background: "rgba(0,0,0,0.8)",
            padding: "8px 20px",
            borderRadius: 6,
            border: "1px solid rgba(255, 199, 44, 0.4)",
            letterSpacing: 2,
          }}
        >
          THE FINAL IRONY // THE BIG M
        </div>
      </div>

      {/* Final Callout Card */}
      <div
        style={{
          position: "absolute",
          bottom: 480,
          width: 880,
          background: "rgba(14, 11, 8, 0.92)",
          backdropFilter: "blur(14px)",
          border: "2px solid #FFC72C",
          borderRadius: 16,
          padding: "26px 36px",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(255, 199, 44, 0.2)",
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 18,
            color: "#FFC72C",
            letterSpacing: 2,
            marginBottom: 6,
            textTransform: "uppercase",
          }}
        >
          THE CIRCULAR RULE
        </div>
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 38,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.15,
          }}
        >
          Imagine having to rename your own{" "}
          <span style={{ color: "#FFC72C" }}>McDonald's.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =========================================================================
// KINETIC CAPTIONS COMPONENT (Word-by-word Whisper synchronization)
// =========================================================================
const ShortsKineticCaptions: React.FC<{
  words: WordItem[];
  activeIdx: number;
  time: number;
}> = ({ words, activeIdx, time }) => {
  if (activeIdx < 0 || activeIdx >= words.length) {
    return null;
  }

  // Group into tight 3-word windows centered on current word
  const startIdx = Math.max(0, activeIdx - 1);
  const endIdx = Math.min(words.length, activeIdx + 2);
  const windowWords = words.slice(startIdx, endIdx);

  return (
    <div
      style={{
        position: "absolute",
        top: 1400,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "rgba(5, 4, 3, 0.88)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 199, 44, 0.25)",
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
          const isSpecial =
            w.word.toLowerCase().includes("mcdonald") ||
            w.word.includes("2.7") ||
            w.word.toLowerCase().includes("brothers") ||
            w.word.toLowerCase().includes("rename");

          return (
            <span
              key={globalIdx}
              style={{
                fontFamily: FONTS.sans,
                fontSize: isCurrent ? 44 : 36,
                fontWeight: isCurrent ? 900 : 700,
                color: isCurrent
                  ? isSpecial
                    ? "#FF4B4B"
                    : "#FFC72C"
                  : "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                transform: isCurrent ? "scale(1.08)" : "scale(1)",
                transition: "all 0.08s ease-out",
                textShadow: isCurrent
                  ? "0 0 20px rgba(255, 199, 44, 0.4)"
                  : "none",
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
