import React from "react";
import { FONTS } from "../fonts";

interface StudioDeskProps {
  onAirText?: string;
  width?: number;
  height?: number;
}

export const StudioDeskEnvironment: React.FC<StudioDeskProps> = ({
  onAirText = "ON AIR // THE LINCOLN PENNY",
  width = 1080,
  height = 1920,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height,
        pointerEvents: "none",
        zIndex: 25, // In front of character torsos, behind foreground evidence
      }}
    >
      {/* ======================================================== */}
      {/* STUDIO PODCAST DESK                                      */}
      {/* ======================================================== */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        <defs>
          {/* Rich Mahogany Desk Surface Gradient */}
          <linearGradient id="deskBevelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A1B14" />
            <stop offset="35%" stopColor="#1E130D" />
            <stop offset="100%" stopColor="#0F0906" />
          </linearGradient>

          {/* Golden Warm Accent Rim */}
          <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="25%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="75%" stopColor="#D97706" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          {/* Microphone Metal Gradient */}
          <linearGradient id="micMetal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2D3748" />
            <stop offset="50%" stopColor="#4A5568" />
            <stop offset="100%" stopColor="#1A202C" />
          </linearGradient>
        </defs>

        {/* Studio Desk Main Beveled Body */}
        <path
          d="M -60 1020 L 1140 1020 L 1140 1920 L -60 1920 Z"
          fill="url(#deskBevelGrad)"
          stroke="#0F0906"
          strokeWidth={4}
        />

        {/* Acoustic Bevel Line and Gold Accent Edge */}
        <line x1={-60} y1={1020} x2={1140} y2={1020} stroke="url(#goldRim)" strokeWidth={5} />
        <line x1={-60} y1={1026} x2={1140} y2={1026} stroke="#3D261A" strokeWidth={2} />

        {/* Ambient Darkened Desk Front Fade */}
        <rect x={0} y={1080} width={width} height={840} fill="rgba(0, 0, 0, 0.45)" />

        {/* ======================================================== */}
        {/* SHURE SM7B BROADCAST MICROPHONES (Boom Arm Mounted)      */}
        {/* ======================================================== */}
        {/* Host Microphone (Left Speaker at x = 320, mic at x = 360, y = 870) */}
        <g id="host_mic" transform="translate(370, 870) rotate(-16)">
          {/* Boom arm rod extending from desk */}
          <line x1={-30} y1={160} x2={0} y2={0} stroke="#1A202C" strokeWidth={8} strokeLinecap="round" />
          <line x1={-26} y1={160} x2={4} y2={0} stroke="#4A5568" strokeWidth={2} strokeLinecap="round" />
          {/* Swivel Yoke Mount */}
          <path d="M -16 -12 C -16 16 16 16 16 -12" fill="none" stroke="#2D3748" strokeWidth={6} />
          {/* Mic Capsule Body */}
          <rect x={-14} y={-45} width={28} height={50} rx={6} fill="url(#micMetal)" stroke="#11141A" strokeWidth={2} />
          {/* Foam Pop Filter */}
          <rect x={-12} y={-72} width={24} height={32} rx={10} fill="#181B22" stroke="#0D0F14" strokeWidth={2} />
          {/* Yellow Host Accent Ring */}
          <rect x={-13} y={-44} width={26} height={4} fill="#FFC72C" />
        </g>

        {/* Insider Microphone (Right Speaker at x = 760, mic at x = 710, y = 870) */}
        <g id="insider_mic" transform="translate(710, 870) rotate(16)">
          {/* Boom arm rod extending from desk */}
          <line x1={30} y1={160} x2={0} y2={0} stroke="#1A202C" strokeWidth={8} strokeLinecap="round" />
          <line x1={26} y1={160} x2={-4} y2={0} stroke="#4A5568" strokeWidth={2} strokeLinecap="round" />
          {/* Swivel Yoke Mount */}
          <path d="M -16 -12 C -16 16 16 16 16 -12" fill="none" stroke="#2D3748" strokeWidth={6} />
          {/* Mic Capsule Body */}
          <rect x={-14} y={-45} width={28} height={50} rx={6} fill="url(#micMetal)" stroke="#11141A" strokeWidth={2} />
          {/* Foam Pop Filter */}
          <rect x={-12} y={-72} width={24} height={32} rx={10} fill="#181B22" stroke="#0D0F14" strokeWidth={2} />
          {/* Red Insider Accent Ring */}
          <rect x={-13} y={-44} width={26} height={4} fill="#EF4444" />
        </g>
      </svg>

      {/* ======================================================== */}
      {/* STUDIO "ON AIR" HEADER PILL (Top Center)                 */}
      {/* ======================================================== */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 22px",
          background: "rgba(18, 14, 12, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 24,
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#EF4444",
            boxShadow: "0 0 14px #EF4444",
          }}
        />
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 16,
            color: "#ffffff",
            letterSpacing: 2,
            fontWeight: 700,
          }}
        >
          {onAirText}
        </span>
      </div>
    </div>
  );
};
