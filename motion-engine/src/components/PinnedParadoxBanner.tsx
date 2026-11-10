import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";

interface PinnedParadoxBannerProps {
  title: string;
  leftPill?: string;
  rightPill?: string;
  startFrame?: number;
}

export const PinnedParadoxBanner: React.FC<PinnedParadoxBannerProps> = ({
  title,
  leftPill = "HARD: $100K",
  rightPill = "EASY: $1,000,000",
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - startFrame);
  const slideDown = spring({
    frame: relFrame,
    fps,
    config: {
      damping: 14,
      stiffness: 120,
    },
  });

  const translateY = interpolate(slideDown, [0, 1], [-180, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 40,
        right: 40,
        transform: `translateY(${translateY}px)`,
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: "24px 32px",
        boxShadow: "0 18px 40px rgba(0, 0, 0, 0.22)",
        border: "3.5px solid #141414",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 34,
          letterSpacing: "-0.02em",
          color: "#141414",
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          width: "100%",
        }}
      >
        <span
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 800,
            fontSize: 22,
            color: "#EF4444",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            padding: "6px 16px",
            borderRadius: 12,
            border: "2px solid #EF4444",
          }}
        >
          {leftPill}
        </span>

        <span
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 900,
            fontSize: 22,
            color: "#141414",
          }}
        >
          VS
        </span>

        <span
          style={{
            fontFamily: FONTS.sans,
            fontWeight: 800,
            fontSize: 22,
            color: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            padding: "6px 16px",
            borderRadius: 12,
            border: "2px solid #10B981",
          }}
        >
          {rightPill}
        </span>
      </div>
    </div>
  );
};
