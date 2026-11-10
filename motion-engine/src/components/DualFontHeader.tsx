import React from "react";
import { FONTS } from "../fonts";

interface DualFontHeaderProps {
  breadcrumb?: string;
  line: string;
  accentWord?: string;
}

export const DualFontHeader: React.FC<DualFontHeaderProps> = ({
  breadcrumb,
  line,
  accentWord,
}) => {
  let before = line;
  let accent = "";
  let after = "";

  if (accentWord && line.includes(accentWord)) {
    const idx = line.indexOf(accentWord);
    before = line.slice(0, idx);
    accent = accentWord;
    after = line.slice(idx + accentWord.length);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      {breadcrumb && (
        <div
          style={{
            fontFamily: "monospace",
            fontWeight: 600,
            fontSize: 26,
            color: "#9CA3AF",
            letterSpacing: "0.02em",
          }}
        >
          {breadcrumb}
        </div>
      )}

      <div
        style={{
          fontFamily: FONTS.sans,
          fontWeight: 900,
          fontSize: 48,
          color: "#141414",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        <span>{before}</span>
        {accent && (
          <span
            style={{
              fontFamily: FONTS.serif,
              fontStyle: "italic",
              fontWeight: 800,
              color: "#DC2626", // Crimson Red
              marginLeft: before ? 6 : 0,
              marginRight: after ? 6 : 0,
            }}
          >
            {accent}
          </span>
        )}
        <span>{after}</span>
      </div>
    </div>
  );
};
