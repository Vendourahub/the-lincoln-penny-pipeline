import React from "react";

/**
 * THE LINCOLN PENNY — CINEMATIC PODCAST STUDIO SET
 * 
 * 3-Layer Staging Environment:
 * 1. Background (Acoustic wood slat wall, warm backlight, framed archival art)
 * 2. Midground (Mahogany desk, brass rim, Shure SM7B broadcast boom arms)
 * 3. Foreground (Deliberate foreground silhouettes providing cinematic depth without CSS blur lag)
 */

interface CinematicStudioSetProps {
  children?: React.ReactNode;
  cameraPreset?: "two_shot" | "host_cu" | "insider_cu" | "evidence_split";
  showForegroundOcclusion?: boolean;
}

export const CinematicStudioSet: React.FC<CinematicStudioSetProps> = ({
  children,
  cameraPreset = "two_shot",
  showForegroundOcclusion = true,
}) => {
  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#07090e",
      }}
    >
      {/* ========================================================== */}
      {/* 1. BACKGROUND LAYER (Z = 0)                                */}
      {/* ========================================================== */}
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", top: 0, left: 0, zIndex: 0 }}
      >
        <defs>
          {/* Warm Studio Ambient Light Sweep */}
          <radialGradient id="studioAmberGlow" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#d97706" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#07090e" stopOpacity="0.0" />
          </radialGradient>

          {/* Slat Wood Pattern */}
          <pattern id="acousticSlats" width="36" height="1920" patternUnits="userSpaceOnUse">
            {/* Dark backing wall */}
            <rect width="36" height="1920" fill="#0b0f17" />
            {/* Wood slat */}
            <rect x="6" width="24" height="1920" fill="#1c1917" />
            {/* Slat subtle highlight */}
            <rect x="6" width="3" height="1920" fill="#292524" />
          </pattern>
        </defs>

        {/* Acoustic Slat Wall */}
        <rect width={1080} height={1920} fill="url(#acousticSlats)" />

        {/* Ambient Light Glow */}
        <circle cx={540} cy={760} r={650} fill="url(#studioAmberGlow)" />

        {/* Studio Neon Accent Bar (Top Horizon) */}
        <line x1={0} y1={280} x2={1080} y2={280} stroke="#1e293b" strokeWidth={2} />
        <line x1={120} y1={280} x2={960} y2={280} stroke="#f59e0b" strokeWidth={3} strokeOpacity={0.6} />

        {/* Background Framed Archival Art: 1956 McDonald's Real Estate Deed */}
        <g transform="translate(180, 360)">
          <rect width={220} height={280} rx={8} fill="#090d16" stroke="#334155" strokeWidth={4} />
          <rect x={16} y={16} width={188} height={248} fill="#111827" />
          <line x1={36} y1={45} x2={184} y2={45} stroke="#64748b" strokeWidth={3} />
          <line x1={36} y1={65} x2={150} y2={65} stroke="#475569" strokeWidth={2} />
          <line x1={36} y1={85} x2={170} y2={85} stroke="#475569" strokeWidth={2} />
          {/* Gold corporate seal */}
          <circle cx={150} cy={200} r={24} fill="#d97706" fillOpacity={0.7} stroke="#f59e0b" strokeWidth={2} />
          <text x={110} y={260} fill="#64748b" fontSize={11} fontFamily="system-ui" fontWeight="bold">
            ARCHIVAL DEED // 1956
          </text>
        </g>

        {/* Background Framed Chart: Franchise Realty Cash Flow */}
        <g transform="translate(680, 360)">
          <rect width={220} height={280} rx={8} fill="#090d16" stroke="#334155" strokeWidth={4} />
          <rect x={16} y={16} width={188} height={248} fill="#111827" />
          {/* Financial Bar Graph in Background */}
          <rect x={40} y={180} width={24} height={60} fill="#3b82f6" fillOpacity={0.4} />
          <rect x={76} y={140} width={24} height={100} fill="#3b82f6" fillOpacity={0.6} />
          <rect x={112} y={110} width={24} height={130} fill="#3b82f6" fillOpacity={0.8} />
          <rect x={148} y={70} width={24} height={170} fill="#10b981" />
          <text x={40} y={50} fill="#64748b" fontSize={11} fontFamily="system-ui" fontWeight="bold">
            OPERATING INCOME RATIO
          </text>
        </g>
      </svg>

      {/* ========================================================== */}
      {/* 2. MIDGROUND CHARACTERS LAYER (Z = 1)                      */}
      {/* ========================================================== */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1920, zIndex: 1 }}>
        {children}
      </div>

      {/* ========================================================== */}
      {/* 3. PODCAST DESK & BROADCAST MICS LAYER (Z = 2)            */}
      {/* ========================================================== */}
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", top: 0, left: 0, zIndex: 2, pointerEvents: "none" }}
      >
        <defs>
          {/* Mahogany Desk Gradient */}
          <linearGradient id="mahoganyDeskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2e1a11" />
            <stop offset="4%" stopColor="#3f2316" />
            <stop offset="15%" stopColor="#26150d" />
            <stop offset="100%" stopColor="#140a06" />
          </linearGradient>

          {/* Brass Rim Highlight */}
          <linearGradient id="brassRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>

        {/* The Podcast Desk (Angled Perspective Trapezoid) */}
        <g id="podcast-desk" transform="translate(0, 1180)">
          {/* Golden Brass Beveled Trim Edge */}
          <polygon points="0,0 1080,0 1080,12 0,12" fill="url(#brassRimGrad)" />
          
          {/* Main Mahogany Tabletop Surface */}
          <polygon points="0,12 1080,12 1080,740 0,740" fill="url(#mahoganyDeskGrad)" />

          {/* Desk Surface Highlight Reflection */}
          <ellipse cx={270} cy={60} rx={160} ry={25} fill="#f59e0b" fillOpacity={0.06} />
          <ellipse cx={810} cy={60} rx={160} ry={25} fill="#f59e0b" fillOpacity={0.06} />

          {/* Digital Tablet / Brief Notes in Center */}
          <g transform="translate(480, 50)">
            <rect width={120} height={80} rx={6} fill="#090d16" stroke="#334155" strokeWidth={3} />
            <rect x={6} y={6} width={108} height={68} rx={4} fill="#1e293b" />
            <line x1={18} y1={22} x2={102} y2={22} stroke="#38bdf8" strokeWidth={3} />
            <line x1={18} y1={36} x2={85} y2={36} stroke="#64748b" strokeWidth={2} />
            <line x1={18} y1={50} x2={95} y2={50} stroke="#64748b" strokeWidth={2} />
          </g>

          {/* HOST BROADCAST MIC (Shure SM7B on Articulated Arm) */}
          <g id="host-mic" transform="translate(340, -40)">
            {/* Boom Arm */}
            <line x1={-50} y1={120} x2={-10} y2={30} stroke="#1e293b" strokeWidth={10} strokeLinecap="round" />
            <circle cx={-10} cy={30} r={10} fill="#0f172a" stroke="#475569" strokeWidth={3} />
            <line x1={-10} y1={30} x2={20} y2={-20} stroke="#1e293b" strokeWidth={8} strokeLinecap="round" />
            {/* Swivel Yoke */}
            <path d="M 10,-35 L 35,-5 L 25,5" fill="none" stroke="#475569" strokeWidth={5} />
            {/* Shure SM7B Mic Body */}
            <g transform="rotate(-35, 20, -20)">
              {/* Metal Barrel */}
              <rect x={-8} y={-45} width={26} height={55} rx={5} fill="#090d16" stroke="#334155" strokeWidth={3} />
              {/* Foam Windscreen */}
              <rect x={-10} y={-85} width={30} height={42} rx={10} fill="#1e293b" stroke="#0f172a" strokeWidth={2} />
              {/* Yellow studio identity band for Host */}
              <line x1={-10} y1={-44} x2={20} y2={-44} stroke="#facc15" strokeWidth={4} />
            </g>
          </g>

          {/* INSIDER BROADCAST MIC (Shure SM7B on Articulated Arm) */}
          <g id="insider-mic" transform="translate(740, -40) scale(-1, 1)">
            {/* Boom Arm */}
            <line x1={-50} y1={120} x2={-10} y2={30} stroke="#1e293b" strokeWidth={10} strokeLinecap="round" />
            <circle cx={-10} cy={30} r={10} fill="#0f172a" stroke="#475569" strokeWidth={3} />
            <line x1={-10} y1={30} x2={20} y2={-20} stroke="#1e293b" strokeWidth={8} strokeLinecap="round" />
            {/* Swivel Yoke */}
            <path d="M 10,-35 L 35,-5 L 25,5" fill="none" stroke="#475569" strokeWidth={5} />
            {/* Shure SM7B Mic Body */}
            <g transform="rotate(-35, 20, -20)">
              {/* Metal Barrel */}
              <rect x={-8} y={-45} width={26} height={55} rx={5} fill="#090d16" stroke="#334155" strokeWidth={3} />
              {/* Foam Windscreen */}
              <rect x={-10} y={-85} width={30} height={42} rx={10} fill="#1e293b" stroke="#0f172a" strokeWidth={2} />
              {/* Crimson studio identity band for Insider */}
              <line x1={-10} y1={-44} x2={20} y2={-44} stroke="#ef4444" strokeWidth={4} />
            </g>
          </g>
        </g>
      </svg>

      {/* ========================================================== */}
      {/* 4. FOREGROUND OCCLUSION & DEPTH LAYER (Z = 3)              */}
      {/* ========================================================== */}
      {showForegroundOcclusion && (
        <svg
          width={1080}
          height={1920}
          style={{ position: "absolute", top: 0, left: 0, zIndex: 3, pointerEvents: "none" }}
        >
          {/* Left Foreground Bokeh / Attendee Shoulder Silhouette */}
          <path
            d="M -60,1920 L -60,1650 C 40,1620 120,1720 160,1920 Z"
            fill="#030508"
            fillOpacity={0.88}
          />

          {/* Right Foreground Bokeh / Studio Monitor Silhouette */}
          <path
            d="M 1140,1920 L 1140,1680 C 1020,1660 960,1760 940,1920 Z"
            fill="#030508"
            fillOpacity={0.88}
          />
        </svg>
      )}
    </div>
  );
};
