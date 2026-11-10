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
import wordsData from "../public/sony/words.json";

interface WordItem {
  word: string;
  start: number;
  end: number;
}

const WORDS: WordItem[] = wordsData.words;

export const SonyForensicTeardownShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = frame / fps;

  // Active word calculation for kinetic caption bar
  const activeWordIdx = useMemo(() => {
    return WORDS.findIndex((w) => time >= w.start && time < w.end);
  }, [time]);

  // Optical micro-camera drift
  const camZoom = interpolate(frame, [0, 1693], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });
  const camPanY = interpolate(frame, [0, 1693], [0, -20], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#05070e",
        overflow: "hidden",
        fontFamily: FONTS.sans,
        color: "#ffffff",
      }}
    >
      <Audio src={staticFile("sony/audio.mp3")} />

      {/* Camera Stage */}
      <AbsoluteFill
        style={{
          transform: `scale(${camZoom}) translateY(${camPanY}px)`,
          transformOrigin: "center center",
        }}
      >
        {/* Background Grid & Forensic Atmosphere */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 50% 32%, #0e1526 0%, #060913 65%, #020408 100%)",
          }}
        >
          {/* Subtle Technical Blueprint Grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(to right, rgba(245, 185, 66, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(245, 185, 66, 0.05) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              opacity: 0.85,
            }}
          />
          {/* Corner Coordinate HUD Marks */}
          <div
            style={{
              position: "absolute",
              top: 70,
              left: 60,
              fontFamily: FONTS.mono,
              fontSize: 16,
              color: "rgba(245, 185, 66, 0.45)",
              letterSpacing: 2,
            }}
          >
            LP // FORENSIC TEARDOWN 04-B
          </div>
          <div
            style={{
              position: "absolute",
              top: 70,
              right: 60,
              fontFamily: FONTS.mono,
              fontSize: 16,
              color: "rgba(255, 75, 75, 0.7)",
              letterSpacing: 2,
              fontWeight: 700,
            }}
          >
            SYS: HARDWARE DEFICIT
          </div>
        </AbsoluteFill>

        {/* ======================================================== */}
        {/* SCENE 1: THE $100 HARDWARE BLEED (0s - 11.68s / f 0-350)  */}
        {/* ======================================================== */}
        {time < 12.0 && (
          <AbsoluteFill
            style={{
              opacity: interpolate(time, [11.2, 11.9], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <Scene1HardwareBleed frame={frame} fps={fps} time={time} />
          </AbsoluteFill>
        )}

        {/* ======================================================== */}
        {/* SCENE 2: THE SEC FILING & BOM BREAKDOWN (11.68s - 21.07s) */}
        {/* ======================================================== */}
        {time >= 11.2 && time < 21.5 && (
          <AbsoluteFill
            style={{
              opacity: interpolate(
                time,
                [11.2, 11.8, 20.6, 21.4],
                [0, 1, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              ),
            }}
          >
            <Scene2SecBOM frame={frame} fps={fps} time={time} />
          </AbsoluteFill>
        )}

        {/* ======================================================== */}
        {/* SCENE 3: 30% TOLLBOOTH & $4B PROFIT FLIP (21.07s - 36.55s)*/}
        {/* ======================================================== */}
        {time >= 20.7 && time < 37.0 && (
          <AbsoluteFill
            style={{
              opacity: interpolate(
                time,
                [20.7, 21.3, 36.2, 36.9],
                [0, 1, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              ),
            }}
          >
            <Scene3TollboothFlip frame={frame} fps={fps} time={time} />
          </AbsoluteFill>
        )}

        {/* ======================================================== */}
        {/* SCENE 4: THE EXECUTIVE RULE & CTA (36.55s - 47.27s)      */}
        {/* ======================================================== */}
        {time >= 36.3 && time < 47.8 && (
          <AbsoluteFill
            style={{
              opacity: interpolate(
                time,
                [36.3, 36.9, 47.0, 47.7],
                [0, 1, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              ),
            }}
          >
            <Scene4ExecutivePlaybook frame={frame} fps={fps} time={time} />
          </AbsoluteFill>
        )}

        {/* ======================================================== */}
        {/* SCENE 5: AUTHENTIC LINCOLN COIN OUTRO (47.27s - 56.43s)  */}
        {/* ======================================================== */}
        {time >= 47.0 && (
          <AbsoluteFill
            style={{
              opacity: interpolate(time, [47.0, 47.6], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <Scene5LincolnCoinOutro frame={frame} fps={fps} time={time} />
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

      {/* Optical Vignette & Film Grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 58%, rgba(2,4,10,0.7) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `url(${staticFile("assets/grain_tile.png")})`,
          backgroundRepeat: "repeat",
          backgroundPosition: `${(frame * 67) % 256}px ${(frame * 131) % 256}px`,
          opacity: 0.045,
          mixBlendMode: "overlay",
        }}
      />
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------
// SCENE 1: THE $100 HARDWARE BLEED
// -------------------------------------------------------------
const Scene1HardwareBleed: React.FC<{
  frame: number;
  fps: number;
  time: number;
}> = ({ frame, fps, time }) => {
  // Swipe-stop slam spring for console (0 - 15 frames)
  const consoleEntrance = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 220, mass: 0.8 },
  });

  // Emergency red alarm pulse
  const alarmPulse = Math.sin(frame * 0.28) * 0.5 + 0.5;

  // Stamp slam at frame 32 (around 1.07s on "$500")
  const stampSpring = spring({
    frame: frame - 32,
    fps,
    config: { damping: 11, stiffness: 240, mass: 0.9 },
  });

  // Forensic separation trigger at 6.2s ("In reality...")
  const sepProgress = spring({
    frame: frame - Math.round(6.2 * fps),
    fps,
    config: { damping: 14, stiffness: 130, mass: 1.0 },
  });

  // Floating cash bleed particles
  const particles = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => ({
      xBase: 180 + (i * 55) % 720,
      speedY: 2.4 + (i % 3) * 1.5,
      sway: 35 + (i % 4) * 15,
      delay: i * 7,
      rot: (i * 47) % 360,
    }));
  }, []);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Red Emergency Strobe on Background */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 850,
          height: 850,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(239,68,68,0.22) 0%, transparent 70%)",
          opacity: alarmPulse * 0.85,
          pointerEvents: "none",
        }}
      />

      {/* Floating Cash Loss Particles */}
      {particles.map((p, idx) => {
        const pFrame = frame - p.delay;
        if (pFrame < 0) return null;
        const py = 750 + ((pFrame * p.speedY * 5) % 750);
        const px = p.xBase + Math.sin(pFrame * 0.08) * p.sway;
        const pOpacity = interpolate(py, [750, 950, 1450], [0, 0.8, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: px,
              top: py,
              opacity: pOpacity,
              transform: `rotate(${p.rot + pFrame * 1.5}deg)`,
              fontFamily: FONTS.mono,
              fontWeight: 800,
              fontSize: 22,
              color: "#ef4444",
              textShadow: "0 0 12px rgba(239,68,68,0.85)",
              pointerEvents: "none",
            }}
          >
            -$100
          </div>
        );
      })}

      {/* Hardware Teardown Multi-Plane Layer System */}
      <div
        style={{
          position: "absolute",
          top: 220,
          left: "50%",
          transform: `translateX(-50%) perspective(1200px) rotateY(${sepProgress * -18}deg)`,
          width: 850,
          height: 950,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Layer 3: Motherboard APU Die (Back layer, expands right-down) */}
        {sepProgress > 0.02 && (
          <div
            style={{
              position: "absolute",
              width: 440,
              height: 440,
              transform: `translate3d(${sepProgress * 210}px, ${sepProgress * 150}px, ${sepProgress * -120}px) scale(${0.85 + sepProgress * 0.15})`,
              opacity: sepProgress,
              filter: "drop-shadow(0 20px 45px rgba(0,0,0,0.9))",
            }}
          >
            <Img
              src={staticFile("assets/ps5_motherboard_apu.png")}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            {/* Silicon Tag */}
            <div
              style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                padding: "6px 14px",
                background: "rgba(5, 7, 14, 0.9)",
                border: "1px solid #f5b942",
                borderRadius: 8,
                fontFamily: FONTS.mono,
                fontSize: 14,
                color: "#f5b942",
                fontWeight: 800,
                boxShadow: "0 4px 15px rgba(0,0,0,0.8)",
              }}
            >
              AMD APU: +$180
            </div>
          </div>
        )}

        {/* Layer 2: Massive Cooling Assembly (Middle layer, expands right-up) */}
        {sepProgress > 0.02 && (
          <div
            style={{
              position: "absolute",
              width: 440,
              height: 440,
              transform: `translate3d(${sepProgress * 200}px, ${sepProgress * -130}px, ${sepProgress * -50}px) scale(${0.85 + sepProgress * 0.15})`,
              opacity: sepProgress,
              filter: "drop-shadow(0 20px 45px rgba(0,0,0,0.9))",
            }}
          >
            <Img
              src={staticFile("assets/ps5_cooling_assembly.png")}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            {/* Thermal Tag */}
            <div
              style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                padding: "6px 14px",
                background: "rgba(5, 7, 14, 0.9)",
                border: "1px solid #ef4444",
                borderRadius: 8,
                fontFamily: FONTS.mono,
                fontSize: 14,
                color: "#ef4444",
                fontWeight: 800,
                boxShadow: "0 4px 15px rgba(0,0,0,0.8)",
              }}
            >
              HEATSINK & FAN: +$100
            </div>
          </div>
        )}

        {/* Layer 1: Hero PS5 Console (Center layer, shifts left during separation) */}
        <div
          style={{
            position: "absolute",
            width: 760,
            height: 980,
            transform: `scale(${0.9 + consoleEntrance * 0.1}) translate3d(${sepProgress * -170}px, 0, ${sepProgress * 60}px)`,
            filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.95))",
          }}
        >
          <Img
            src={staticFile("assets/ps5_hero_console.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      </div>

      {/* SWIPE STOPPER: GIANT HARDWARE DEFICIT STAMP (Fades out when separation begins) */}
      {frame >= 32 && frame < 225 && (
        <div
          style={{
            position: "absolute",
            top: 610,
            left: "50%",
            transform: `translateX(-50%) scale(${0.4 + stampSpring * 0.6}) rotate(-8deg)`,
            opacity: interpolate(frame, [32, 45, 180, 215], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            padding: "18px 46px",
            background: "linear-gradient(135deg, rgba(239,68,68,0.96) 0%, rgba(185,28,28,0.96) 100%)",
            border: "4px solid #ffffff",
            borderRadius: 16,
            boxShadow: "0 0 60px rgba(239,68,68,0.85), 0 20px 40px rgba(0,0,0,0.9)",
            textAlign: "center",
            zIndex: 40,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 18,
              letterSpacing: 4,
              color: "#fee2e2",
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            CORPORATE LOSS-LEADER
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontWeight: 900,
              fontSize: 58,
              color: "#ffffff",
              letterSpacing: -1,
              marginTop: 4,
            }}
          >
            -$100 HARDWARE LOSS
          </div>
        </div>
      )}

      {/* Real-time Ledger Bar (Appears when separation begins) */}
      {sepProgress > 0.3 && (
        <div
          style={{
            position: "absolute",
            top: 170,
            left: 60,
            right: 60,
            background: "rgba(10, 15, 28, 0.94)",
            border: "1px solid rgba(239, 68, 68, 0.5)",
            borderRadius: 16,
            padding: "16px 26px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
            opacity: sepProgress,
          }}
        >
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              ESTIMATED FACTORY BOM
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 26, fontWeight: 800, color: "#ffffff" }}>
              $500+ / UNIT
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              RETAIL ENTRY
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 26, fontWeight: 800, color: "#ef4444" }}>
              $399 - $499
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------
// SCENE 2: SEC FORM 20-F & FORENSIC BOM BREAKDOWN
// -------------------------------------------------------------
const Scene2SecBOM: React.FC<{
  frame: number;
  fps: number;
  time: number;
}> = ({ frame, fps, time }) => {
  const localSec = time - 11.68;
  const entrance = spring({
    frame: Math.round(localSec * fps),
    fps,
    config: { damping: 14, stiffness: 180 },
  });

  // Highlighter sweep progress across the quote (starts at ~1.8s)
  const highlightProgress = interpolate(localSec, [1.4, 4.0], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // BOM items stagger entrance
  const bomItems = [
    { name: "AMD OBERON 7NM APU", cost: "$180", cat: "SOC SILICON", delay: 3.2 },
    { name: "16GB GDDR6 + 825GB NVMe", cost: "$120", cat: "MEMORY & STORAGE", delay: 4.2 },
    { name: "LIQUID METAL & COPPER RAD", cost: "$100", cat: "THERMAL SUITE", delay: 5.2 },
    { name: "CHASSIS, BLU-RAY & 350W PSU", cost: "$100", cat: "MECHANICAL", delay: 6.2 },
  ];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* SEC 20-F Official Dossier Card */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 60,
          right: 60,
          background: "linear-gradient(180deg, #101626 0%, #0a0d18 100%)",
          border: "1px solid rgba(245, 185, 66, 0.4)",
          borderRadius: 18,
          padding: "24px 30px",
          transform: `translateY(${interpolate(entrance, [0, 1], [-40, 0])}px)`,
          opacity: entrance,
          boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: "#f5b942", letterSpacing: 2 }}>
            UNITED STATES SEC // FORM 20-F
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              padding: "3px 10px",
              background: "rgba(245,185,66,0.15)",
              color: "#f5b942",
              borderRadius: 6,
            }}
          >
            DISCLOSURE NOTE 14
          </div>
        </div>

        {/* Audited Quote with Dynamic Highlighter */}
        <div
          style={{
            position: "relative",
            fontFamily: FONTS.serif,
            fontSize: 22,
            lineHeight: 1.45,
            color: "#e2e8f0",
            marginTop: 14,
            fontStyle: "italic",
          }}
        >
          <span style={{ position: "relative", zIndex: 2 }}>
            "Hardware operating results reflect strategic price points below manufacturing cost to accelerate user base adoption..."
          </span>
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: `${highlightProgress * 100}%`,
              background: "rgba(245, 185, 66, 0.28)",
              zIndex: 1,
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      {/* Bill of Materials (BOM) Teardown List */}
      <div
        style={{
          position: "absolute",
          top: 390,
          left: 60,
          right: 60,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 14,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: 2,
            marginBottom: 12,
          }}
        >
          PHYSICAL HARDWARE BILL OF MATERIALS (BOM):
        </div>

        {bomItems.map((item, idx) => {
          const itemSpring = spring({
            frame: Math.round((localSec - item.delay) * fps),
            fps,
            config: { damping: 13, stiffness: 200 },
          });

          return (
            <div
              key={idx}
              style={{
                background: "rgba(12, 17, 30, 0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: "16px 22px",
                marginBottom: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transform: `translateX(${interpolate(itemSpring, [0, 1], [-30, 0])}px)`,
                opacity: itemSpring,
              }}
            >
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: "#f5b942" }}>
                  {item.cat}
                </div>
                <div style={{ fontFamily: FONTS.sans, fontWeight: 700, fontSize: 18, color: "#ffffff" }}>
                  {item.name}
                </div>
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#ef4444",
                }}
              >
                {item.cost}
              </div>
            </div>
          );
        })}

        {/* Grand Total Card */}
        {localSec >= 6.8 && (
          <div
            style={{
              marginTop: 16,
              background: "linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(10,14,24,0.92) 100%)",
              border: "2px solid #ef4444",
              borderRadius: 16,
              padding: "18px 26px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 10px 30px rgba(239,68,68,0.3)",
            }}
          >
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: "#ef4444" }}>
                TOTAL FACTORY COST
              </div>
              <div style={{ fontFamily: FONTS.sans, fontSize: 32, fontWeight: 900, color: "#ffffff" }}>
                $500.00+
              </div>
            </div>
            <div
              style={{
                padding: "8px 18px",
                background: "#ef4444",
                borderRadius: 8,
                fontFamily: FONTS.mono,
                fontSize: 16,
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              -$100 SUBSIDY
            </div>
          </div>
        )}
      </div>

      {/* Transparent Component Peek on Bottom Right */}
      <div
        style={{
          position: "absolute",
          bottom: 450,
          right: -20,
          width: 440,
          height: 380,
          opacity: 0.9,
          transform: "rotate(-10deg)",
          filter: "drop-shadow(0 20px 45px rgba(0,0,0,0.95))",
          pointerEvents: "none",
        }}
      >
        <Img
          src={staticFile("assets/ps5_motherboard_apu.png")}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------
// SCENE 3: 30% TOLLBOOTH & $4B PROFIT FLIP
// -------------------------------------------------------------
const Scene3TollboothFlip: React.FC<{
  frame: number;
  fps: number;
  time: number;
}> = ({ frame, fps, time }) => {
  const localSec = time - 21.07;

  // The Big Flip Moment at 8.7s (time = 29.8s: "turns a one hundred dollar loss into four billion dollars...")
  const flipTrigger = localSec >= 8.5;
  const flipSpring = spring({
    frame: Math.round((localSec - 8.5) * fps),
    fps,
    config: { damping: 12, stiffness: 190, mass: 0.9 },
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Dynamic Background Glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: flipTrigger
            ? "radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Phase A: The 30% Tollbooth Ecosystem (0s - 8.5s) */}
      {!flipTrigger ? (
        <div style={{ position: "absolute", top: 160, left: 60, right: 60 }}>
          {/* Header */}
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 15,
              color: "#3b82f6",
              letterSpacing: 3,
              fontWeight: 800,
            }}
          >
            THE DIGITAL TOLLBOOTH MODEL
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 44,
              fontWeight: 900,
              color: "#ffffff",
              marginTop: 6,
            }}
          >
            The 30% Digital Gate
          </div>

          {/* Floating Transparent DualSense Controller Packshot */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 380,
              marginTop: 10,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 520,
                height: 360,
                filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.95))",
              }}
            >
              <Img
                src={staticFile("assets/ps5_dualsense_controller.png")}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>

          {/* 30% Cut Breakdown Card */}
          <div
            style={{
              marginTop: 10,
              background: "rgba(10, 16, 30, 0.94)",
              border: "2px solid #3b82f6",
              borderRadius: 20,
              padding: "24px 28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700 }}>
                Every $70 Digital Game Download:
              </div>
              <div
                style={{
                  padding: "4px 12px",
                  background: "#3b82f6",
                  color: "#ffffff",
                  fontFamily: FONTS.mono,
                  fontSize: 14,
                  fontWeight: 800,
                  borderRadius: 6,
                }}
              >
                AUTOMATIC CUT
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                  GAME PUBLISHER (70%)
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 28, fontWeight: 700, color: "#94a3b8" }}>
                  $49.00
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: "#60a5fa" }}>
                  SONY TOLL (30% PURE MARGIN)
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 32, fontWeight: 900, color: "#60a5fa" }}>
                  +$21.00
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Phase B: The $4,000,000,000 Profit Flip (8.5s - 15.5s) */
        <div
          style={{
            position: "absolute",
            top: 170,
            left: 60,
            right: 60,
            transform: `scale(${0.85 + flipSpring * 0.15})`,
            opacity: flipSpring,
            textAlign: "center",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-block",
              padding: "8px 24px",
              background: "rgba(16, 185, 129, 0.2)",
              border: "1px solid #10b981",
              borderRadius: 30,
              fontFamily: FONTS.mono,
              fontSize: 15,
              fontWeight: 800,
              color: "#10b981",
              letterSpacing: 3,
            }}
          >
            THE 7-YEAR PLATFORM PAYOFF
          </div>

          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 32,
              fontWeight: 700,
              color: "rgba(255,255,255,0.8)",
              marginTop: 16,
            }}
          >
            Turning a -$100 Deficit Into:
          </div>

          {/* Giant $4 Billion Vault Metric */}
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 84,
              fontWeight: 900,
              color: "#10b981",
              letterSpacing: -3,
              marginTop: 6,
              textShadow: "0 0 50px rgba(16, 185, 129, 0.6)",
            }}
          >
            +$4.0B
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 18,
              letterSpacing: 3,
              color: "#6ee7b7",
              fontWeight: 700,
            }}
          >
            CUMULATIVE NETWORK REVENUE
          </div>

          {/* Comparison Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 30,
              textAlign: "left",
            }}
          >
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 16,
                padding: "20px 22px",
              }}
            >
              <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: "#fca5a5" }}>
                DAY ONE CONSOLE
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 32, fontWeight: 900, color: "#ef4444" }}>
                -$100
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                One-time loss leader
              </div>
            </div>

            <div
              style={{
                background: "rgba(16, 185, 129, 0.12)",
                border: "2px solid #10b981",
                borderRadius: 16,
                padding: "20px 22px",
              }}
            >
              <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: "#6ee7b7" }}>
                7-YEAR ECOSYSTEM
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 32, fontWeight: 900, color: "#10b981" }}>
                +$1,400+
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                Per active player
              </div>
            </div>
          </div>

          {/* Ecosystem Breakdown Flywheel */}
          <div
            style={{
              marginTop: 24,
              background: "rgba(10, 16, 28, 0.9)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 16,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                PS PLUS MEMBERSHIPS
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 700, color: "#10b981" }}>
                +$80/YR
              </div>
            </div>
            <div style={{ width: 1, height: 35, background: "rgba(255,255,255,0.1)" }} />
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                DIGITAL STORE COMMISSIONS
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 700, color: "#10b981" }}>
                30% ON ALL TITLES
              </div>
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------
// SCENE 4: EXECUTIVE PLAYBOOK RULE & ENGAGEMENT CTA
// -------------------------------------------------------------
const Scene4ExecutivePlaybook: React.FC<{
  frame: number;
  fps: number;
  time: number;
}> = ({ frame, fps, time }) => {
  const localSec = time - 36.55;
  const cardSpring = spring({
    frame: Math.round(localSec * fps),
    fps,
    config: { damping: 14, stiffness: 180 },
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 180,
          left: 60,
          right: 60,
          transform: `scale(${0.9 + cardSpring * 0.1})`,
          opacity: cardSpring,
        }}
      >
        {/* Playbook Header */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 14,
              color: "#f5b942",
              letterSpacing: 3,
              fontWeight: 800,
            }}
          >
            THE LINCOLN PENNY // PLAYBOOK 08
          </div>
          <div
            style={{
              fontFamily: FONTS.serif,
              fontSize: 38,
              fontWeight: 700,
              color: "#ffffff",
              marginTop: 8,
              lineHeight: 1.25,
            }}
          >
            "Subsidize the Front Gate. Monopolize the Cash Register."
          </div>
        </div>

        {/* 3-Tier Business Model Hierarchy */}
        <div style={{ marginTop: 32 }}>
          {[
            {
              level: "LEVEL 1",
              title: "Sell Commodity Hardware",
              margin: "NEGATIVE MARGIN (-15%)",
              color: "#ef4444",
            },
            {
              level: "LEVEL 2",
              title: "Sell High-Margin Accessories",
              margin: "HEALTHY CASH (50% MARGIN)",
              color: "#f5b942",
            },
            {
              level: "LEVEL 3",
              title: "Control the Digital Tollbooth",
              margin: "PURE RECURRING RENT (85%+)",
              color: "#10b981",
            },
          ].map((lvl, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(11, 16, 29, 0.9)",
                border: `1px solid ${lvl.color}`,
                borderRadius: 14,
                padding: "18px 24px",
                marginBottom: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: lvl.color, fontWeight: 800 }}>
                  {lvl.level}
                </div>
                <div style={{ fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700, color: "#ffffff" }}>
                  {lvl.title}
                </div>
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  fontWeight: 800,
                  color: lvl.color,
                  padding: "6px 12px",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 6,
                }}
              >
                {lvl.margin}
              </div>
            </div>
          ))}
        </div>

        {/* Viral Engagement Box */}
        <div
          style={{
            marginTop: 24,
            background: "linear-gradient(135deg, rgba(245,185,66,0.18) 0%, rgba(10,14,24,0.95) 100%)",
            border: "2px solid #f5b942",
            borderRadius: 18,
            padding: "24px 28px",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 14,
              color: "#f5b942",
              letterSpacing: 2,
              fontWeight: 800,
            }}
          >
            WHICH LEVEL ARE YOU ON?
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 26,
              fontWeight: 900,
              color: "#ffffff",
              marginTop: 6,
            }}
          >
            Comment "PLAYBOOK" Below
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 15,
              color: "rgba(255,255,255,0.6)",
              marginTop: 4,
            }}
          >
            I'll send you the complete 7-page breakdown PDF
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------
// SCENE 5: AUTHENTIC LINCOLN PENNY COIN OUTRO
// -------------------------------------------------------------
const Scene5LincolnCoinOutro: React.FC<{
  frame: number;
  fps: number;
  time: number;
}> = ({ frame, fps, time }) => {
  const localSec = time - 47.27;

  // 3D Coin Flip Entrance (-140deg to 0deg)
  const coinRotateY = interpolate(localSec, [0, 1.8], [-140, 0], {
    extrapolateRight: "clamp",
  });
  const coinScale = interpolate(localSec, [0, 1.8], [0.65, 1.0], {
    extrapolateRight: "clamp",
  });

  // Specular sheen sweep across the coin
  const sheenX = interpolate(localSec, [1.6, 3.4], [-400, 400], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Golden Bronze Ambient Glow */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245, 185, 66, 0.28) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* 3D Bronze Coin Medallion */}
      <div
        style={{
          width: 440,
          height: 440,
          transform: `perspective(1000px) rotateY(${coinRotateY}deg) scale(${coinScale})`,
          filter: "drop-shadow(0 25px 60px rgba(0,0,0,0.95)) drop-shadow(0 0 45px rgba(245, 185, 66, 0.45))",
          position: "relative",
          borderRadius: "50%",
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile("assets/lincoln-penny-coin.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* Specular Light Sweep */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.45) 50%, transparent 65%)",
            transform: `translateX(${sheenX}px)`,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Brand Identity */}
      <div style={{ marginTop: 34 }}>
        <div
          style={{
            fontFamily: FONTS.serif,
            fontSize: 52,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: 2,
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          }}
        >
          THE LINCOLN PENNY
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 18,
            letterSpacing: 6,
            color: "#f5b942",
            fontWeight: 700,
            marginTop: 8,
            textTransform: "uppercase",
          }}
        >
          Follow Every Cent
        </div>
      </div>

      {/* Action Prompt */}
      <div
        style={{
          marginTop: 40,
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 36px",
          background: "linear-gradient(135deg, #f5b942 0%, #d97706 100%)",
          borderRadius: 30,
          fontFamily: FONTS.sans,
          fontSize: 22,
          fontWeight: 900,
          color: "#05070e",
          boxShadow: "0 10px 30px rgba(245, 185, 66, 0.4)",
        }}
      >
        <span>SUBSCRIBE FOR THE NEXT BREAKDOWN</span>
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------
// SHORTS KINETIC CAPTION BAR (SAFE ZONE Y = 1380px)
// -------------------------------------------------------------
const ShortsKineticCaptions: React.FC<{
  words: WordItem[];
  activeIdx: number;
  time: number;
}> = ({ words, activeIdx, time }) => {
  if (activeIdx < 0 || activeIdx >= words.length) return null;

  // Window of surrounding words (previous, active, next)
  const windowStart = Math.max(0, activeIdx - 1);
  const windowEnd = Math.min(words.length, activeIdx + 3);
  const currentChunk = words.slice(windowStart, windowEnd);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 240,
        left: 50,
        right: 50,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px 14px",
          background: "rgba(5, 8, 17, 0.88)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: 22,
          padding: "16px 28px",
          boxShadow: "0 20px 45px rgba(0,0,0,0.85)",
          maxWidth: 960,
        }}
      >
        {currentChunk.map((w, idx) => {
          const isCurrent = words.indexOf(w) === activeIdx;

          return (
            <span
              key={idx}
              style={{
                fontFamily: FONTS.sans,
                fontWeight: isCurrent ? 900 : 700,
                fontSize: isCurrent ? 36 : 30,
                color: isCurrent ? "#f5b942" : "rgba(255,255,255,0.7)",
                textTransform: "uppercase",
                transform: isCurrent ? "scale(1.12)" : "scale(1.0)",
                textShadow: isCurrent
                  ? "0 0 25px rgba(245, 185, 66, 0.75)"
                  : "0 2px 8px rgba(0,0,0,0.8)",
                transition: "all 0.08s ease-out",
                display: "inline-block",
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
