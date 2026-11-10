import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";

interface DivergenceCurveProps {
  x: number;
  y: number;
  width?: number;
  height?: number;
  startFrame?: number;
  durationFrames?: number;
}

export const DivergenceCurve: React.FC<DivergenceCurveProps> = ({
  x,
  y,
  width = 680,
  height = 380,
  startFrame = 0,
  durationFrames = 90,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - startFrame);
  const progress = Math.min(1.0, relFrame / Math.max(1, durationFrames));

  const gw = width;
  const gh = height;

  // Linear line calculation
  const linProgress = Math.min(1.0, progress * 1.15);
  const linX = gw * linProgress;
  const linY = gh - (gh * 0.22) * linProgress;

  // Exponential path building
  const steps = 40;
  const curStep = Math.floor(steps * progress);
  let expPath = `M 0 ${gh}`;
  for (let i = 1; i <= curStep; i++) {
    const t = i / steps;
    const px = t * gw;
    const py = gh - gh * Math.pow(t, 2.8);
    expPath += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
  }

  // Rocket head position
  const curT = progress;
  const rocketX = curT * gw;
  const rocketY = gh - gh * Math.pow(curT, 2.8);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: gw + 80,
        height: gh + 80,
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      <svg
        width={gw + 120}
        height={gh + 100}
        viewBox={`-60 -40 ${gw + 180} ${gh + 100}`}
        style={{ overflow: "visible" }}
      >
        {/* Axes */}
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={gh}
          stroke="#141414"
          strokeWidth={4.5}
          strokeLinecap="round"
        />
        <line
          x1={0}
          y1={gh}
          x2={gw}
          y2={gh}
          stroke="#141414"
          strokeWidth={4.5}
          strokeLinecap="round"
        />

        {/* Y Axis Labels */}
        <text
          x={-18}
          y={16}
          textAnchor="end"
          fontFamily={FONTS.sans}
          fontWeight={800}
          fontSize={22}
          fill="#141414"
        >
          $1M
        </text>
        <text
          x={-18}
          y={gh * 0.5}
          textAnchor="end"
          fontFamily={FONTS.sans}
          fontWeight={800}
          fontSize={22}
          fill="#141414"
        >
          $500K
        </text>
        <text
          x={-18}
          y={gh * 0.82}
          textAnchor="end"
          fontFamily={FONTS.sans}
          fontWeight={800}
          fontSize={22}
          fill="#141414"
        >
          $100K
        </text>

        {/* X Axis Labels */}
        <text
          x={gw * 0.33}
          y={gh + 34}
          textAnchor="middle"
          fontFamily={FONTS.sans}
          fontWeight={700}
          fontSize={20}
          fill="#141414"
        >
          Year 1
        </text>
        <text
          x={gw * 0.66}
          y={gh + 34}
          textAnchor="middle"
          fontFamily={FONTS.sans}
          fontWeight={700}
          fontSize={20}
          fill="#141414"
        >
          Year 2
        </text>
        <text
          x={gw}
          y={gh + 34}
          textAnchor="middle"
          fontFamily={FONTS.sans}
          fontWeight={700}
          fontSize={20}
          fill="#141414"
        >
          Year 3
        </text>

        {/* Linear Blue Path */}
        <line
          x1={0}
          y1={gh}
          x2={linX}
          y2={linY}
          stroke="#0284C7"
          strokeWidth={6}
          strokeLinecap="round"
        />

        {progress > 0.25 && (
          <text
            x={30}
            y={gh - 45}
            fontFamily={FONTS.sans}
            fontWeight={900}
            fontSize={20}
            fill="#0284C7"
          >
            TRADING TIME (SLOW)
          </text>
        )}

        {/* Exponential Red Curve */}
        {progress > 0.05 && (
          <path
            d={expPath}
            fill="none"
            stroke="#EF4444"
            strokeWidth={7}
            strokeLinecap="round"
          />
        )}

        {/* Rocket Indicator at Tip */}
        {progress > 0.08 && (
          <g transform={`translate(${rocketX}, ${rocketY})`}>
            <circle cx={0} cy={0} r={12} fill="#EF4444" />
            <text
              x={18}
              y={-4}
              fontFamily={FONTS.sans}
              fontWeight={900}
              fontSize={24}
              fill="#EF4444"
            >
              🚀 SCALE ENGINE
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
