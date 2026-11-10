import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type StickmanEmotion = "neutral" | "shock" | "smirk" | "angry" | "happy" | "think";

interface StickmanProps {
  x: number;
  y: number;
  scale?: number;
  emotion?: StickmanEmotion;
  isSpeaking?: boolean;
  arm?: "point" | "think" | "shrug" | null;
  lookX?: number; // -1 to 1
}

export const StickmanAvatar: React.FC<StickmanProps> = ({
  x,
  y,
  scale = 1.0,
  emotion = "neutral",
  isSpeaking = false,
  arm = null,
  lookX = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Natural organic idle breathing/bobbing
  const bobY = Math.sin((frame / fps) * 3.2) * 8 * scale;
  const bobRot = Math.sin((frame / fps) * 1.6) * 1.2;

  // Blinking cycle: blink every ~3.5 seconds for 4 frames
  const blinkCycle = frame % 105;
  const isBlinking = blinkCycle < 4;

  // Talking mouth animation when speaking
  const talkCycle = (frame % 6);
  const isMouthOpen = isSpeaking && talkCycle < 3;

  const s = 110 * scale;
  const lw = Math.max(3, s * 0.07);
  const ink = "#141414";

  // Dimensions
  const neckY = s * 0.95;
  const shoulderY = s * 1.35;
  const bodyBottom = s * 3.1;
  const halfW = s * 1.65;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + bobY,
        transform: `translate(-50%, -50%) rotate(${bobRot}deg)`,
        pointerEvents: "none",
        filter: "drop-shadow(0px 18px 30px rgba(0, 0, 0, 0.45))",
      }}
    >
      <svg
        width={s * 5}
        height={s * 5}
        viewBox={`-${s * 2.5} -${s * 1.8} ${s * 5} ${s * 5}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Shaded 3D Suit Gradient */}
          <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2A3B5C" />
            <stop offset="70%" stopColor="#1E2B45" />
            <stop offset="100%" stopColor="#131C30" />
          </linearGradient>

          {/* Shaded Head 3D Spherical Toon Gradient */}
          <radialGradient id="headGrad" cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F4F5F8" />
            <stop offset="100%" stopColor="#D5DAE5" />
          </radialGradient>

          {/* Tie Red Gradient */}
          <linearGradient id="tieGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E24A3B" />
            <stop offset="50%" stopColor="#C83B2D" />
            <stop offset="100%" stopColor="#A8281B" />
          </linearGradient>
        </defs>

        {/* --- SUIT JACKET BODY --- */}
        <path
          d={`M ${-s * 0.42} ${neckY}
              L ${-halfW} ${shoulderY}
              L ${-halfW * 0.9} ${bodyBottom}
              L ${halfW * 0.9} ${bodyBottom}
              L ${halfW} ${shoulderY}
              L ${s * 0.42} ${neckY} Z`}
          fill="url(#suitGrad)"
          stroke={ink}
          strokeWidth={lw}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* White Shirt Collar V */}
        <path
          d={`M ${-s * 0.42} ${neckY}
              L 0 ${s * 2.1}
              L ${s * 0.42} ${neckY} Z`}
          fill="#F8FAFC"
          stroke={ink}
          strokeWidth={lw * 0.7}
          strokeLinejoin="round"
        />

        {/* Silk Red Tie */}
        <path
          d={`M ${-s * 0.14} ${neckY + s * 0.15}
              L ${s * 0.14} ${neckY + s * 0.15}
              L ${s * 0.22} ${s * 2.4}
              L 0 ${s * 2.75}
              L ${-s * 0.22} ${s * 2.4} Z`}
          fill="url(#tieGrad)"
          stroke={ink}
          strokeWidth={lw * 0.6}
          strokeLinejoin="round"
        />

        {/* --- ARMS / GESTURES --- */}
        {arm === "point" && (
          <g>
            <path
              d={`M ${halfW * 0.85} ${shoulderY + s * 0.2}
                  L ${halfW * 1.65} ${s * 0.25}`}
              stroke="#1E2B45"
              strokeWidth={lw * 1.5}
              strokeLinecap="round"
            />
            {/* Puffy White Cartoon Glove Pointing */}
            <circle
              cx={halfW * 1.65}
              cy={s * 0.25}
              r={s * 0.25}
              fill="#FFFFFF"
              stroke={ink}
              strokeWidth={lw * 0.8}
            />
            <path
              d={`M ${halfW * 1.65} ${s * 0.25} L ${halfW * 1.95} ${s * 0.15}`}
              stroke={ink}
              strokeWidth={lw * 0.8}
              strokeLinecap="round"
            />
          </g>
        )}

        {arm === "think" && (
          <g>
            <path
              d={`M ${halfW * 0.85} ${shoulderY + s * 0.2}
                  L ${s * 0.65} ${s * 0.4}
                  L ${s * 0.25} ${s * 0.2}`}
              stroke="#1E2B45"
              strokeWidth={lw * 1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle
              cx={s * 0.25}
              cy={s * 0.2}
              r={s * 0.22}
              fill="#FFFFFF"
              stroke={ink}
              strokeWidth={lw * 0.8}
            />
          </g>
        )}

        {/* --- 3D TOON HEAD --- */}
        <circle
          cx={0}
          cy={0}
          r={s}
          fill="url(#headGrad)"
          stroke={ink}
          strokeWidth={lw}
        />

        {/* Specular 3D rim highlight */}
        <ellipse
          cx={-s * 0.35}
          cy={-s * 0.38}
          rx={s * 0.32}
          ry={s * 0.18}
          fill="rgba(255, 255, 255, 0.75)"
          transform={`rotate(-25 ${-s * 0.35} ${-s * 0.38})`}
        />

        {/* --- EYES & BROWS --- */}
        {(() => {
          const ex = s * 0.38;
          const ey = -s * 0.08;
          const er = s * 0.17;
          const px = lookX * er * 0.5;

          if (isBlinking) {
            return (
              <g stroke={ink} strokeWidth={lw * 1.1} strokeLinecap="round">
                <line x1={-ex - er * 0.9} y1={ey} x2={-ex + er * 0.9} y2={ey} />
                <line x1={ex - er * 0.9} y1={ey} x2={ex + er * 0.9} y2={ey} />
              </g>
            );
          }

          if (emotion === "shock") {
            return (
              <g>
                {/* Shocked giant eyes */}
                <circle cx={-ex} cy={ey} r={er * 1.4} fill="#FFFFFF" stroke={ink} strokeWidth={lw * 0.8} />
                <circle cx={ex} cy={ey} r={er * 1.4} fill="#FFFFFF" stroke={ink} strokeWidth={lw * 0.8} />
                {/* Pupils */}
                <circle cx={-ex + px} cy={ey - 2} r={er * 0.65} fill={ink} />
                <circle cx={ex + px} cy={ey - 2} r={er * 0.65} fill={ink} />
                {/* Highlights */}
                <circle cx={-ex + px - 2} cy={ey - 5} r={er * 0.22} fill="#FFF" />
                <circle cx={ex + px - 2} cy={ey - 5} r={er * 0.22} fill="#FFF" />
                {/* High raised shocked eyebrows */}
                <path d={`M ${-ex - er} ${ey - er * 1.8} Q ${-ex} ${ey - er * 2.3} ${-ex + er} ${ey - er * 1.8}`} stroke={ink} strokeWidth={lw} fill="none" strokeLinecap="round" />
                <path d={`M ${ex - er} ${ey - er * 1.8} Q ${ex} ${ey - er * 2.3} ${ex + er} ${ey - er * 1.8}`} stroke={ink} strokeWidth={lw} fill="none" strokeLinecap="round" />
              </g>
            );
          }

          if (emotion === "smirk") {
            return (
              <g>
                <circle cx={-ex + px} cy={ey} r={er * 0.8} fill={ink} />
                <circle cx={ex + px} cy={ey} r={er * 0.8} fill={ink} />
                <circle cx={-ex + px - 2} cy={ey - 3} r={er * 0.25} fill="#FFF" />
                <circle cx={ex + px - 2} cy={ey - 3} r={er * 0.25} fill="#FFF" />
                {/* One raised eyebrow, one relaxed */}
                <line x1={-ex - er} y1={ey - er * 1.2} x2={-ex + er} y2={ey - er * 1.2} stroke={ink} strokeWidth={lw} strokeLinecap="round" />
                <path d={`M ${ex - er} ${ey - er * 1.5} Q ${ex} ${ey - er * 2.1} ${ex + er} ${ey - er * 1.3}`} stroke={ink} strokeWidth={lw} fill="none" strokeLinecap="round" />
              </g>
            );
          }

          if (emotion === "think") {
            return (
              <g>
                <circle cx={-ex + px} cy={ey} r={er * 0.75} fill={ink} />
                <circle cx={ex + px} cy={ey} r={er * 0.75} fill={ink} />
                {/* Furrowed inquisitive brow */}
                <line x1={-ex - er} y1={ey - er * 1.1} x2={-ex + er} y2={ey - er * 1.5} stroke={ink} strokeWidth={lw} strokeLinecap="round" />
                <line x1={ex - er} y1={ey - er * 1.6} x2={ex + er} y2={ey - er * 1.1} stroke={ink} strokeWidth={lw} strokeLinecap="round" />
              </g>
            );
          }

          // Default / Neutral
          return (
            <g>
              <circle cx={-ex + px} cy={ey} r={er * 0.8} fill={ink} />
              <circle cx={ex + px} cy={ey} r={er * 0.8} fill={ink} />
              <circle cx={-ex + px - 2} cy={ey - 3} r={er * 0.25} fill="#FFF" />
              <circle cx={ex + px - 2} cy={ey - 3} r={er * 0.25} fill="#FFF" />
              <line x1={-ex - er} y1={ey - er * 1.2} x2={-ex + er} y2={ey - er * 1.2} stroke={ink} strokeWidth={lw} strokeLinecap="round" />
              <line x1={ex - er} y1={ey - er * 1.2} x2={ex + er} y2={ey - er * 1.2} stroke={ink} strokeWidth={lw} strokeLinecap="round" />
            </g>
          );
        })()}

        {/* --- MOUTH --- */}
        {(() => {
          const my = s * 0.42;

          if (emotion === "shock") {
            return (
              <ellipse
                cx={0}
                cy={my + s * 0.08}
                rx={s * 0.22}
                ry={s * 0.32}
                fill="#8A2E2E"
                stroke={ink}
                strokeWidth={lw * 0.9}
              />
            );
          }

          if (isMouthOpen) {
            return (
              <ellipse
                cx={0}
                cy={my + s * 0.06}
                rx={s * 0.16}
                ry={s * 0.22}
                fill="#7A2828"
                stroke={ink}
                strokeWidth={lw * 0.8}
              />
            );
          }

          if (emotion === "smirk") {
            return (
              <path
                d={`M ${-s * 0.22} ${my} Q ${s * 0.1} ${my + s * 0.22} ${s * 0.38} ${my - s * 0.12}`}
                stroke={ink}
                strokeWidth={lw}
                fill="none"
                strokeLinecap="round"
              />
            );
          }

          if (emotion === "think") {
            return (
              <line
                x1={-s * 0.15}
                y1={my + s * 0.05}
                x2={s * 0.2}
                y2={my + s * 0.05}
                stroke={ink}
                strokeWidth={lw}
                strokeLinecap="round"
              />
            );
          }

          // Neutral line
          return (
            <line
              x1={-s * 0.22}
              y1={my}
              x2={s * 0.22}
              y2={my}
              stroke={ink}
              strokeWidth={lw}
              strokeLinecap="round"
            />
          );
        })()}
      </svg>
    </div>
  );
};
