import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../fonts";

export type MockCardType = "message" | "social" | "pill" | "stat";

interface MockUICardProps {
  type?: MockCardType;
  title?: string;
  body?: string;
  subtext?: string;
  author?: string;
  subauthor?: string;
  badge?: string;
  badgeColor?: string;
  reactions?: string;
  sentText?: string;
  sender?: string;
  status?: string;
  startFrame?: number;
  width?: number;
}

export const MockUICard: React.FC<MockUICardProps> = ({
  type = "stat",
  title,
  body,
  author = "You",
  subauthor = "Builder · 1h",
  badge,
  badgeColor = "#EF4444",
  reactions = "👍 0 likes",
  sentText = "check out my app!! 🙏 link →",
  sender = "👤 Friend",
  status = "delivered",
  startFrame = 0,
  width = 640,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - startFrame);
  const pop = spring({
    frame: relFrame,
    fps,
    config: {
      damping: 14,
      stiffness: 150,
      mass: 0.9,
    },
  });

  return (
    <div
      style={{
        width,
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        border: "3.5px solid #141414",
        boxShadow: "0 20px 45px rgba(0, 0, 0, 0.16)",
        padding: "24px 28px",
        boxSizing: "border-box",
        transform: `scale(${pop})`,
        transformOrigin: "center",
        zIndex: 50,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {type === "message" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Blue Sent Bubble */}
          <div
            style={{
              alignSelf: "flex-end",
              backgroundColor: "#0284C7",
              color: "#FFFFFF",
              borderRadius: 18,
              padding: "12px 20px",
              fontFamily: FONTS.sans,
              fontWeight: 700,
              fontSize: 22,
              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
            }}
          >
            {sentText}
          </div>

          {/* White Recipient Bubble */}
          <div
            style={{
              backgroundColor: "#F3F4F6",
              borderRadius: 16,
              border: "2px solid #E5E7EB",
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: FONTS.sans,
                fontWeight: 600,
                fontSize: 20,
                color: "#141414",
              }}
            >
              {sender}
            </span>
            <span
              style={{
                fontFamily: FONTS.sans,
                fontWeight: 500,
                fontSize: 18,
                color: "#9CA3AF",
              }}
            >
              {status}
            </span>
          </div>
        </div>
      )}

      {type === "social" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "#141414",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONTS.sans,
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              YOU
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontFamily: FONTS.sans,
                  fontWeight: 800,
                  fontSize: 22,
                  color: "#141414",
                }}
              >
                {author}
              </span>
              <span
                style={{
                  fontFamily: FONTS.sans,
                  fontWeight: 500,
                  fontSize: 16,
                  color: "#6B7280",
                }}
              >
                {subauthor}
              </span>
            </div>
            <div
              style={{
                marginLeft: "auto",
                fontFamily: FONTS.sans,
                fontWeight: 900,
                fontSize: 24,
                color: "#0A66C2",
              }}
            >
              in
            </div>
          </div>

          {/* Post text */}
          <div
            style={{
              fontFamily: FONTS.sans,
              fontWeight: 600,
              fontSize: 24,
              color: "#141414",
              lineHeight: 1.3,
            }}
          >
            {body || "I built a thing 🚀 Would love your feedback!"}
          </div>

          {/* Reactions */}
          <div
            style={{
              fontFamily: FONTS.sans,
              fontWeight: 600,
              fontSize: 19,
              color: "#6B7280",
            }}
          >
            {reactions}
          </div>
        </div>
      )}

      {type === "stat" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {title && (
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 32,
                color: "#141414",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </div>
          )}
          {body && (
            <div
              style={{
                fontFamily: FONTS.sans,
                fontWeight: 600,
                fontSize: 22,
                color: "#4B5563",
                lineHeight: 1.3,
              }}
            >
              {body}
            </div>
          )}
          {badge && (
            <div
              style={{
                alignSelf: "flex-start",
                padding: "8px 18px",
                borderRadius: 12,
                backgroundColor: badgeColor,
                color: "#FFFFFF",
                fontFamily: FONTS.sans,
                fontWeight: 800,
                fontSize: 20,
              }}
            >
              {badge}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
