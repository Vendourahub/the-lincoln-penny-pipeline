import React from "react";
import { CharacterRole, SkeletalPose, MouthViseme, HandPose } from "./types";

interface SkeletalRigProps {
  role: CharacterRole;
  pose: SkeletalPose;
  scale?: number;
  x?: number;
  y?: number;
  headsetAccent?: string;
  showMicrophone?: boolean;
}

export const SkeletalRig: React.FC<SkeletalRigProps> = ({
  role,
  pose,
  scale = 1.0,
  x = 0,
  y = 0,
  headsetAccent,
  showMicrophone = false,
}) => {
  const isHost = role === "host";
  const accentColor = headsetAccent || (isHost ? "#FFC72C" : "#EF4444");

  const {
    torsoLean,
    torsoOffset,
    headTilt,
    headTurn,
    leftArm,
    rightArm,
    face,
  } = pose;

  // Hand SVG Renderer
  const renderHand = (handPose: HandPose, side: "left" | "right") => {
    const isL = side === "left";
    switch (handPose) {
      case "chin":
        return (
          <g>
            {/* Curled hand supporting chin */}
            <ellipse cx={isL ? -4 : 4} cy={4} rx={12} ry={10} fill="#FFFFFF" stroke="#11141A" strokeWidth={4} />
            <path d={isL ? "M -10 6 Q -4 14 2 10" : "M 10 6 Q 4 14 -2 10"} stroke="#11141A" strokeWidth={3} fill="none" />
          </g>
        );
      case "point":
        return (
          <g>
            {/* Palm base */}
            <ellipse cx={0} cy={6} rx={9} ry={9} fill="#FFFFFF" stroke="#11141A" strokeWidth={4} />
            {/* Extended index finger */}
            <path
              d={isL ? "M -4 2 L -28 -6 Q -34 -8 -30 -14 Q -26 -16 -20 -10 L 0 0" : "M 4 2 L 28 -6 Q 34 -8 30 -14 Q 26 -16 20 -10 L 0 0"}
              fill="#FFFFFF"
              stroke="#11141A"
              strokeWidth={4}
              strokeLinejoin="round"
            />
            {/* Folded fingers */}
            <circle cx={isL ? 4 : -4} cy={8} r={5} fill="#FFFFFF" stroke="#11141A" strokeWidth={3} />
          </g>
        );
      case "open":
        return (
          <g>
            {/* Open gesturing palm */}
            <ellipse cx={0} cy={6} rx={10} ry={11} fill="#FFFFFF" stroke="#11141A" strokeWidth={4} />
            <path d="M -8 -2 L -14 -16 Q -12 -20 -8 -18 L -3 -3" fill="#FFFFFF" stroke="#11141A" strokeWidth={3} />
            <path d="M -3 -3 L -4 -22 Q 0 -24 3 -21 L 2 -3" fill="#FFFFFF" stroke="#11141A" strokeWidth={3} />
            <path d="M 2 -3 L 8 -18 Q 12 -19 12 -15 L 6 -2" fill="#FFFFFF" stroke="#11141A" strokeWidth={3} />
          </g>
        );
      case "flat_desk":
      case "rest":
      default:
        return (
          <g>
            {/* Clean resting hand */}
            <ellipse cx={0} cy={5} rx={11} ry={8} fill="#FFFFFF" stroke="#11141A" strokeWidth={4} />
            <path d="M -6 4 Q 0 8 6 4" stroke="#11141A" strokeWidth={2.5} fill="none" />
          </g>
        );
    }
  };

  // Facial Rig: Mouth Shapes (Visemes)
  const renderMouth = (viseme: MouthViseme, openAmount: number) => {
    switch (viseme) {
      case "shock":
        return (
          <g>
            {/* Dropped wide jaw */}
            <ellipse cx={headTurn * 12} cy={22} rx={12} ry={16 * Math.max(0.4, openAmount)} fill="#11141A" />
            <ellipse cx={headTurn * 12} cy={27} rx={7} ry={5} fill="#EF4444" />
            {/* Upper teeth bar */}
            <path d={`M ${headTurn * 12 - 9} 14 Q ${headTurn * 12} 16 ${headTurn * 12 + 9} 14`} stroke="#FFFFFF" strokeWidth={3} fill="none" />
          </g>
        );
      case "smirk":
        return (
          <g>
            {/* Asymmetric knowing smirk */}
            <path
              d={isHost 
                ? `M ${headTurn * 10 - 12} 21 Q ${headTurn * 10 - 2} 24 ${headTurn * 10 + 15} 15` 
                : `M ${headTurn * 10 - 15} 15 Q ${headTurn * 10 + 2} 24 ${headTurn * 10 + 12} 21`}
              stroke="#11141A"
              strokeWidth={4.5}
              strokeLinecap="round"
              fill="none"
            />
            {/* Dimple accent */}
            <circle cx={isHost ? headTurn * 10 + 16 : headTurn * 10 - 16} cy={14} r={2} fill="#11141A" />
          </g>
        );
      case "open_o":
        return (
          <g>
            {/* Rounded O-mouth */}
            <ellipse cx={headTurn * 12} cy={20} rx={9} ry={11 * Math.max(0.4, openAmount)} fill="#11141A" stroke="#11141A" strokeWidth={2} />
            <ellipse cx={headTurn * 12} cy={22} rx={5} ry={4} fill="#EF4444" />
          </g>
        );
      case "open_a":
        return (
          <g>
            {/* Open vowel talking mouth */}
            <path
              d={`M ${headTurn * 12 - 14} 17 Q ${headTurn * 12} 15 ${headTurn * 12 + 14} 17 Q ${headTurn * 12 + 10} ${19 + 14 * openAmount} ${headTurn * 12} ${20 + 15 * openAmount} Q ${headTurn * 12 - 10} ${19 + 14 * openAmount} ${headTurn * 12 - 14} 17 Z`}
              fill="#11141A"
              stroke="#11141A"
              strokeWidth={2}
            />
            <ellipse cx={headTurn * 12} cy={20 + 7 * openAmount} rx={7} ry={4 * openAmount} fill="#EF4444" />
          </g>
        );
      case "wide_ee":
        return (
          <g>
            <path
              d={`M ${headTurn * 12 - 15} 18 Q ${headTurn * 12} 22 ${headTurn * 12 + 15} 18`}
              stroke="#11141A"
              strokeWidth={4.5}
              fill="#11141A"
            />
            {/* Teeth slit */}
            <line x1={headTurn * 12 - 12} y1={19} x2={headTurn * 12 + 12} y2={19} stroke="#FFFFFF" strokeWidth={2.5} />
          </g>
        );
      case "dental":
        return (
          <g>
            {/* Upper teeth contacting bottom lip */}
            <ellipse cx={headTurn * 12} cy={20} rx={11} ry={5 * Math.max(0.3, openAmount)} fill="#11141A" />
            <rect x={headTurn * 12 - 7} y={18} width={14} height={3.5} fill="#FFFFFF" rx={1} />
            <path d={`M ${headTurn * 12 - 11} 20 Q ${headTurn * 12} 22 ${headTurn * 12 + 11} 20`} stroke="#11141A" strokeWidth={2.5} fill="none" />
          </g>
        );
      case "closed":
        return (
          <path
            d={`M ${headTurn * 12 - 10} 20 L ${headTurn * 12 + 10} 20`}
            stroke="#11141A"
            strokeWidth={4.5}
            strokeLinecap="round"
          />
        );
      case "smile":
        return (
          <path
            d={`M ${headTurn * 12 - 14} 17 Q ${headTurn * 12} 26 ${headTurn * 12 + 14} 17`}
            stroke="#11141A"
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
        );
      case "rest":
      default:
        return (
          <path
            d={`M ${headTurn * 12 - 11} 20 Q ${headTurn * 12} 22 ${headTurn * 12 + 11} 20`}
            stroke="#11141A"
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
        );
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -100%) scale(${scale})`,
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      <svg
        width={380}
        height={520}
        viewBox="-190 -380 380 520"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Head 3D Sphere Radial Gradient */}
          <radialGradient id={`headSpherical_${role}`} cx="35%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="68%" stopColor="#F3F4F8" />
            <stop offset="100%" stopColor="#CCD2E0" />
          </radialGradient>

          {/* Suit / Clothing Gradient */}
          <linearGradient id={`suitGrad_${role}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isHost ? "#3B4252" : "#1F2937"} />
            <stop offset="100%" stopColor={isHost ? "#2E3440" : "#111827"} />
          </linearGradient>

          {/* Tie Red Gradient */}
          <linearGradient id="tieSilk" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
        </defs>

        {/* ======================================================== */}
        {/* SEATED LOWER BODY / CHAIR BACK                           */}
        {/* ======================================================== */}
        <g id="chair_and_hips">
          {/* Studio Ergonomic Chair Headrest & Back */}
          <rect x={-55} y={-230} width={110} height={200} rx={24} fill="#14171F" stroke="#0B0D12" strokeWidth={5} />
          {/* Hips base */}
          <ellipse cx={0} cy={-10} rx={42} ry={18} fill="#181B22" stroke="#0B0D12" strokeWidth={5} />
          {/* Seated Thighs angled towards desk */}
          <path d="M -34 -12 L -48 40 L -22 42 L -14 -10 Z" fill="#242B38" stroke="#11141A" strokeWidth={4} />
          <path d="M 34 -12 L 48 40 L 22 42 L 14 -10 Z" fill="#242B38" stroke="#11141A" strokeWidth={4} />
        </g>

        {/* ======================================================== */}
        {/* HIERARCHICAL TORSO & UPPER BODY                          */}
        {/* Pivots around pelvis (0, 0) with torsoLean & torsoOffset */}
        {/* ======================================================== */}
        <g
          id="torso_group"
          transform={`translate(0, ${torsoOffset}) rotate(${torsoLean})`}
        >
          {/* Torso Silhouette */}
          <path
            d={isHost ? (
              // Host Casual Studio Hoodie / Jacket
              `M -20 -150
               L -54 -130
               L -44 -12
               L 44 -12
               L 54 -130
               L 20 -150 Z`
            ) : (
              // Insider Tailored Executive Suit Jacket
              `M -18 -152
               L -56 -132
               L -42 -12
               L 42 -12
               L 56 -132
               L 18 -152 Z`
            )}
            fill={`url(#suitGrad_${role})`}
            stroke="#11141A"
            strokeWidth={5}
            strokeLinejoin="round"
          />

          {/* Insider Formal Tie & Lapels */}
          {!isHost && (
            <g>
              {/* White collar shirt triangle */}
              <polygon points="0,-146 -16,-124 16,-124" fill="#FFFFFF" stroke="#CCD2E0" strokeWidth={2} />
              {/* Red Silk Tie */}
              <polygon points="0,-144 -8,-130 -6,-40 0,-24 6,-40 8,-130" fill="url(#tieSilk)" stroke="#7F1D1D" strokeWidth={1.5} />
            </g>
          )}

          {/* Host Hoodie Zipper / Collar Detail */}
          {isHost && (
            <g>
              <path d="M 0 -148 L 0 -12" stroke="#1A202C" strokeWidth={4} />
              <path d="M -16 -146 Q 0 -130 16 -146" stroke="#E2E8F0" strokeWidth={3.5} fill="none" />
            </g>
          )}

          {/* ======================================================== */}
          {/* LEFT ARM (Hierarchical Joint Chain)                      */}
          {/* Shoulder at (-50, -132) -> Upper Arm -> Elbow -> Forearm */}
          {/* ======================================================== */}
          <g id="left_arm" transform={`translate(-50, -132) rotate(${leftArm.shoulderAngle})`}>
            {/* Left Upper Arm */}
            <line x1={0} y1={0} x2={-10} y2={75} stroke="#11141A" strokeWidth={14} strokeLinecap="round" />
            <line x1={0} y1={0} x2={-10} y2={75} stroke={`url(#suitGrad_${role})`} strokeWidth={8} strokeLinecap="round" />

            {/* Left Elbow Joint */}
            <g transform={`translate(-10, 75) rotate(${leftArm.elbowAngle})`}>
              {/* Left Forearm */}
              <line x1={0} y1={0} x2={18} y2={70} stroke="#11141A" strokeWidth={12} strokeLinecap="round" />
              <line x1={0} y1={0} x2={18} y2={70} stroke={`url(#suitGrad_${role})`} strokeWidth={6} strokeLinecap="round" />

              {/* Left Wrist & Hand */}
              <g transform={`translate(18, 70) rotate(${leftArm.wristAngle})`}>
                {renderHand(leftArm.hand, "left")}
              </g>
            </g>
          </g>

          {/* ======================================================== */}
          {/* RIGHT ARM (Hierarchical Joint Chain)                     */}
          {/* Shoulder at (50, -132) -> Upper Arm -> Elbow -> Forearm  */}
          {/* ======================================================== */}
          <g id="right_arm" transform={`translate(50, -132) rotate(${-rightArm.shoulderAngle})`}>
            {/* Right Upper Arm */}
            <line x1={0} y1={0} x2={10} y2={75} stroke="#11141A" strokeWidth={14} strokeLinecap="round" />
            <line x1={0} y1={0} x2={10} y2={75} stroke={`url(#suitGrad_${role})`} strokeWidth={8} strokeLinecap="round" />

            {/* Right Elbow Joint */}
            <g transform={`translate(10, 75) rotate(${-rightArm.elbowAngle})`}>
              {/* Right Forearm */}
              <line x1={0} y1={0} x2={-18} y2={70} stroke="#11141A" strokeWidth={12} strokeLinecap="round" />
              <line x1={0} y1={0} x2={-18} y2={70} stroke={`url(#suitGrad_${role})`} strokeWidth={6} strokeLinecap="round" />

              {/* Right Wrist & Hand */}
              <g transform={`translate(-18, 70) rotate(${rightArm.wristAngle})`}>
                {renderHand(rightArm.hand, "right")}
              </g>
            </g>
          </g>

          {/* ======================================================== */}
          {/* NECK & HEAD GROUP                                        */}
          {/* Base at (0, -150), pivots at (0, -170) with headTilt     */}
          {/* ======================================================== */}
          <g id="head_group" transform={`translate(0, -165) rotate(${headTilt})`}>
            {/* Neck Pillar */}
            <line x1={0} y1={12} x2={0} y2={-8} stroke="#11141A" strokeWidth={14} strokeLinecap="round" />
            <line x1={0} y1={12} x2={0} y2={-8} stroke="#E2E8F0" strokeWidth={8} strokeLinecap="round" />

            {/* Head Sphere */}
            <circle
              cx={0}
              cy={-48}
              r={46}
              fill={`url(#headSpherical_${role})`}
              stroke="#11141A"
              strokeWidth={5}
            />

            {/* Studio Headphones (Headband + Earcups with Accent) */}
            <g id="headset">
              {/* Arch Headband */}
              <path
                d="M -48 -54 C -48 -108 48 -108 48 -54"
                fill="none"
                stroke="#1E2330"
                strokeWidth={9}
                strokeLinecap="round"
              />
              <path
                d="M -44 -56 C -44 -102 44 -102 44 -56"
                fill="none"
                stroke="#374151"
                strokeWidth={3}
                strokeLinecap="round"
              />
              {/* Left Earcup */}
              <rect x={-52} y={-64} width={10} height={26} rx={5} fill="#14171F" stroke="#0B0D12" strokeWidth={2} />
              <circle cx={-47} cy={-51} r={5} fill={accentColor} />
              {/* Right Earcup */}
              <rect x={42} y={-64} width={10} height={26} rx={5} fill="#14171F" stroke="#0B0D12" strokeWidth={2} />
              <circle cx={47} cy={-51} r={5} fill={accentColor} />
            </g>

            {/* ====================================================== */}
            {/* FACIAL EXPRESSIONS & EYES                              */}
            {/* ====================================================== */}
            <g id="face_features" transform={`translate(0, -48)`}>
              {/* Eyebrows */}
              <g id="brows">
                {/* Left Eyebrow */}
                <line
                  x1={headTurn * 10 - 24}
                  y1={-18 - face.browLeftY}
                  x2={headTurn * 10 - 6}
                  y2={-18 - face.browLeftY + face.browLeftAngle}
                  stroke="#11141A"
                  strokeWidth={4.5}
                  strokeLinecap="round"
                />
                {/* Right Eyebrow */}
                <line
                  x1={headTurn * 10 + 6}
                  y1={-18 - face.browRightY - face.browRightAngle}
                  x2={headTurn * 10 + 24}
                  y2={-18 - face.browRightY}
                  stroke="#11141A"
                  strokeWidth={4.5}
                  strokeLinecap="round"
                />
              </g>

              {/* Eyes (Left & Right) */}
              <g id="eyes">
                {/* Left Eye */}
                <g transform={`translate(${headTurn * 10 - 15}, -5) scale(${face.eyeScale})`}>
                  {face.eyeBlink >= 0.8 ? (
                    // Closed Eye line
                    <line x1={-8} y1={0} x2={8} y2={0} stroke="#11141A" strokeWidth={4} strokeLinecap="round" />
                  ) : (
                    // Open Eye with Pupil
                    <g>
                      <circle cx={0} cy={0} r={8} fill="#FFFFFF" stroke="#11141A" strokeWidth={2.5} />
                      <circle
                        cx={face.pupilX * 4}
                        cy={face.pupilY * 3}
                        r={4.2}
                        fill="#11141A"
                      />
                      {/* Pupil catchlight reflection */}
                      <circle cx={face.pupilX * 4 - 1.5} cy={face.pupilY * 3 - 1.5} r={1.2} fill="#FFFFFF" />
                    </g>
                  )}
                </g>

                {/* Right Eye */}
                <g transform={`translate(${headTurn * 10 + 15}, -5) scale(${face.eyeScale})`}>
                  {face.eyeBlink >= 0.8 ? (
                    <line x1={-8} y1={0} x2={8} y2={0} stroke="#11141A" strokeWidth={4} strokeLinecap="round" />
                  ) : (
                    <g>
                      <circle cx={0} cy={0} r={8} fill="#FFFFFF" stroke="#11141A" strokeWidth={2.5} />
                      <circle
                        cx={face.pupilX * 4}
                        cy={face.pupilY * 3}
                        r={4.2}
                        fill="#11141A"
                      />
                      <circle cx={face.pupilX * 4 - 1.5} cy={face.pupilY * 3 - 1.5} r={1.2} fill="#FFFFFF" />
                    </g>
                  )}
                </g>
              </g>

              {/* Host Specific Detail: Stylish Round Glasses */}
              {isHost && (
                <g id="host_glasses">
                  {/* Left Lens */}
                  <circle cx={headTurn * 10 - 15} cy={-5} r={12} fill="rgba(255,255,255,0.12)" stroke="#1E2330" strokeWidth={3} />
                  {/* Right Lens */}
                  <circle cx={headTurn * 10 + 15} cy={-5} r={12} fill="rgba(255,255,255,0.12)" stroke="#1E2330" strokeWidth={3} />
                  {/* Bridge */}
                  <path d={`M ${headTurn * 10 - 3} -5 Q ${headTurn * 10} -9 ${headTurn * 10 + 3} -5`} stroke="#1E2330" strokeWidth={3} fill="none" />
                </g>
              )}

              {/* Articulated Mouth Viseme */}
              <g id="mouth">{renderMouth(face.mouthViseme, face.mouthOpen)}</g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};
