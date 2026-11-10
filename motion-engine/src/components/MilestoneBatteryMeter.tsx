import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";

interface MilestoneBatteryMeterProps {
  current: number;
  total?: number;
  label?: string;
  startFrame?: number;
}

export const MilestoneBatteryMeter: React.FC<MilestoneBatteryMeterProps> = ({
  current,
  total = 10,
  label,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - startFrame);
  const pop = spring({
    frame: relFrame,
    fps,
    config: {
      damping: 14,
      stiffness: 160,
    },
  });

  const batteryW = 280;
  const batteryH = 54;
  const pillW = 200;
  const pillH = 54;
  const gap = 16;

  const pad = 12;
  const segW = (batteryW - pad * 2 - (total - 1) * 6) / total;
  const segH = batteryH - pad * 2;

  const displayLabel = label || `LEVEL ${current}/${total}`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap,
        transform: `scale(${pop})`,
        transformOrigin: "center",
        pointerEvents: "none",
        zIndex: 60,
      }}
    >
      {/* Battery Outline Capsule */}
      <div
        style={{
          width: batteryW,
          height: batteryH,
          borderRadius: 27,
          backgroundColor: "#FFFFFF",
          border: "3.5px solid #141414",
          boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
          display: "flex",
          alignItems: "center",
          padding: `0 ${pad}px`,
          gap: 6,
          boxSizing: "border-box",
        }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i < current;
          const isWarning = i === current - 1 && current === 3;
          return (
            <div
              key={i}
              style={{
                width: segW,
                height: segH,
                borderRadius: 4,
                backgroundColor: isActive
                  ? isWarning
                    ? "#EF4444"
                    : "#141414"
                  : "#E5E7EB",
                transition: "background-color 0.15s ease",
              }}
            />
          );
        })}
      </div>

      {/* Black Pill Badge: LEVEL X/10 */}
      <div
        style={{
          height: pillH,
          padding: "0 24px",
          borderRadius: 20,
          backgroundColor: "#141414",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 900,
            fontSize: 24,
            letterSpacing: "-0.01em",
            color: "#FFFFFF",
            textTransform: "uppercase",
          }}
        >
          {displayLabel}
        </span>
      </div>
    </div>
  );
};
