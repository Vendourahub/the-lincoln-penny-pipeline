import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";

interface ThoughtBubbleMathProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  lines: string[];
  startFrame?: number;
}

export const ThoughtBubbleMath: React.FC<ThoughtBubbleMathProps> = ({
  x,
  y,
  width = 440,
  height = 240,
  lines,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - startFrame);

  // Elastic pop-in spring
  const scale = spring({
    frame: relFrame,
    fps,
    config: {
      damping: 12,
      stiffness: 140,
      mass: 0.8,
    },
  });

  const floatY = Math.sin((frame / fps) * 2.5) * 6;

  const r = 32;
  const bw = width;
  const bh = height;
  const x0 = -bw / 2;
  const y0 = -bh / 2;
  const x1 = bw / 2;
  const y1 = bh / 2;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + floatY,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "bottom left",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <svg
        width={bw + 80}
        height={bh + 140}
        viewBox={`${x0 - 40} ${y0 - 40} ${bw + 80} ${bh + 140}`}
        style={{
          overflow: "visible",
          filter: "drop-shadow(0px 16px 32px rgba(0,0,0,0.22))",
        }}
      >
        {/* Thought trailing bubbles pointing to character head */}
        <circle
          cx={x0 * 0.35}
          cy={y1 + 45}
          r={16}
          fill="#FFFFFF"
          stroke="#141414"
          strokeWidth={4}
        />
        <circle
          cx={x0 * 0.18}
          cy={y1 + 90}
          r={9}
          fill="#FFFFFF"
          stroke="#141414"
          strokeWidth={4}
        />

        {/* Cloud Body using rounded blob rect / path */}
        <rect
          x={x0}
          y={y0}
          width={bw}
          height={bh}
          rx={36}
          ry={36}
          fill="#FFFFFF"
          stroke="#141414"
          strokeWidth={4.5}
        />

        {/* Decorative cloud puffs */}
        <circle cx={x0 + 40} cy={y0} r={r} fill="#FFFFFF" />
        <circle cx={0} cy={y0 - 8} r={r * 1.15} fill="#FFFFFF" />
        <circle cx={x1 - 40} cy={y0} r={r} fill="#FFFFFF" />
        <circle cx={x1} cy={0} r={r} fill="#FFFFFF" />
        <circle cx={x1 - 50} cy={y1} r={r} fill="#FFFFFF" />
        <circle cx={0} cy={y1 + 6} r={r * 1.1} fill="#FFFFFF" />
        <circle cx={x0 + 50} cy={y1} r={r} fill="#FFFFFF" />
        <circle cx={x0} cy={0} r={r} fill="#FFFFFF" />

        {/* Outline overlays for cloud feel */}
        <path
          d={`M ${x0 + 10} ${y0 + 20} Q ${0} ${y0 - 25} ${x1 - 10} ${y0 + 20}`}
          fill="none"
          stroke="#141414"
          strokeWidth={4}
        />
      </svg>

      {/* Arithmetic Chalk Overlay */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: bw - 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          textAlign: "center",
        }}
      >
        {lines.map((line, idx) => {
          const isResult = idx === lines.length - 1 && lines.length > 1;
          return (
            <div
              key={idx}
              style={{
                fontFamily: FONTS.sans,
                fontWeight: isResult ? 900 : 800,
                fontSize: isResult ? 34 : 28,
                letterSpacing: "-0.02em",
                color: isResult ? "#EF4444" : "#141414",
                lineHeight: 1.15,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
};
