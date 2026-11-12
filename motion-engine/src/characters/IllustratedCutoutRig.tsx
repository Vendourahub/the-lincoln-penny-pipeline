import React from "react";
import { CutoutCharacterProps, HandPose, ExpressionState, GazeTarget, EyelidState } from "./cutoutTypes";

/**
 * THE LINCOLN PENNY — ILLUSTRATED CUTOUT RIG
 * 
 * Commercial-grade 2D cartoon cutout character system replacing wireframe stickmen.
 * Complies with docs/LINCOLN_PENNY_CHARACTER_ART_DIRECTION.md.
 */
export const IllustratedCutoutRig: React.FC<CutoutCharacterProps> = ({
  id,
  pose = "seated_neutral",
  expression = "neutral",
  gaze = "camera",
  eyelid,
  leftHand = "desk_flat",
  rightHand = "desk_flat",
  viseme = "rest",
  mouthOpen = 0.0,
  scale = 1.0,
  flipX = false,
  silhouetteOnly = false,
  frame = 0,
  breathingEnabled = true,
}) => {
  const isHost = id === "host";

  // Palette
  const strokeColor = silhouetteOnly ? "#09090b" : "#18181b";
  const skinFill = silhouetteOnly ? "#09090b" : "#ffffff";
  const shadowSkinFill = silhouetteOnly ? "#09090b" : "#f1f5f9";
  
  // Host colors: Hoodie (Slate Blue), Headset (Yellow), Cap (Charcoal)
  const hostHoodieFill = silhouetteOnly ? "#09090b" : "#334155";
  const hostHoodieShadow = silhouetteOnly ? "#09090b" : "#1e293b";
  const hostHeadset = silhouetteOnly ? "#09090b" : "#facc15";
  const hostCapFill = silhouetteOnly ? "#09090b" : "#1e293b";

  // Insider colors: Suit (Charcoal), Shirt (White), Tie & Headset (Crimson)
  const insiderSuitFill = silhouetteOnly ? "#09090b" : "#1e293b";
  const insiderLapelFill = silhouetteOnly ? "#09090b" : "#0f172a";
  const insiderShirtFill = silhouetteOnly ? "#09090b" : "#ffffff";
  const insiderTieFill = silhouetteOnly ? "#09090b" : "#ef4444";
  const insiderHeadset = silhouetteOnly ? "#09090b" : "#ef4444";

  // Micro-breathing oscillation (subtle 3-second organic wave)
  const breathY = breathingEnabled ? Math.sin((frame / 30) * (Math.PI / 1.5)) * 2.5 : 0;
  const breathScaleY = breathingEnabled ? 1.0 + Math.sin((frame / 30) * (Math.PI / 1.5)) * 0.008 : 1.0;

  // Determine Effective Eyelid State from expression if not explicitly passed
  const effectiveEyelid: EyelidState = eyelid ?? (
    expression === "deadpan" ? "deadpan" :
    expression === "skeptical" ? "half_lidded" :
    expression === "surprised" ? "wide_open" :
    "neutral"
  );

  // Pupil offsets based on gaze target
  let pupilOffsetX = 0;
  let pupilOffsetY = 0;
  if (gaze === "other_host") {
    pupilOffsetX = flipX ? -7 : 7;
    pupilOffsetY = 0;
  } else if (gaze === "camera") {
    pupilOffsetX = 0;
    pupilOffsetY = 1;
  } else if (gaze === "up_thinking") {
    pupilOffsetX = flipX ? -3 : 3;
    pupilOffsetY = -6;
  } else if (gaze === "down_notes") {
    pupilOffsetX = 0;
    pupilOffsetY = 6;
  } else if (gaze === "shock_wide") {
    pupilOffsetX = 0;
    pupilOffsetY = 0;
  }

  // Head tilt and offset based on pose
  let headTiltDeg = 0;
  let headOffsetX = 0;
  let headOffsetY = 0;
  let torsoSlouchDeg = 0;

  if (pose === "seated_lean_forward") {
    headOffsetX = flipX ? -12 : 12;
    headOffsetY = 8;
    headTiltDeg = flipX ? 4 : -4;
    torsoSlouchDeg = flipX ? 3 : -3;
  } else if (pose === "seated_slouch") {
    headOffsetY = 12;
    headTiltDeg = flipX ? -3 : 3;
    torsoSlouchDeg = flipX ? -4 : 4;
  } else if (pose === "seated_chin_on_hand") {
    headOffsetX = flipX ? -8 : 8;
    headOffsetY = 6;
    headTiltDeg = flipX ? 6 : -6;
  }

  // Helper: Render Hand
  const renderHand = (handPose: HandPose, x: number, y: number, isLeft: boolean) => {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {handPose === "desk_flat" && (
          // Relaxed resting hand on table
          <path
            d="M -16,4 C -16,-6 -6,-10 4,-10 C 14,-10 22,-4 22,4 C 22,10 14,14 2,14 C -10,14 -16,10 -16,4 Z"
            fill={skinFill}
            stroke={strokeColor}
            strokeWidth={6}
            strokeLinejoin="round"
          />
        )}
        {handPose === "chin_listen" && (
          // Hand tucked under chin
          <g>
            <path
              d="M -12,-8 C -8,-16 8,-16 14,-8 C 18,0 14,12 4,14 C -6,14 -14,6 -12,-8 Z"
              fill={skinFill}
              stroke={strokeColor}
              strokeWidth={6}
            />
            {/* Curled fingers */}
            <path d="M -4,-2 C 0,-6 6,-6 10,-2" fill="none" stroke={strokeColor} strokeWidth={4} strokeLinecap="round" />
            <path d="M -2,4 C 2,1 8,1 11,4" fill="none" stroke={strokeColor} strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
        {handPose === "point_forward" && (
          // Pointing index finger
          <g transform={isLeft ? "scale(-1, 1)" : "none"}>
            <path
              d="M -12,6 C -12,-2 -4,-6 4,-6 L 24,-6 C 27,-6 29,-3 29,0 C 29,3 27,6 24,6 L 8,6 C 8,12 2,16 -6,16 C -12,16 -12,12 -12,6 Z"
              fill={skinFill}
              stroke={strokeColor}
              strokeWidth={6}
              strokeLinejoin="round"
            />
          </g>
        )}
        {handPose === "open_gesture" && (
          // Open explanatory palm
          <g transform={isLeft ? "scale(-1, 1)" : "none"}>
            <path
              d="M -10,10 C -12,-2 -4,-12 6,-14 C 16,-16 26,-8 28,2 C 30,12 20,18 10,18 C 0,18 -8,16 -10,10 Z"
              fill={skinFill}
              stroke={strokeColor}
              strokeWidth={6}
              strokeLinejoin="round"
            />
            <path d="M 0,-4 L 14,-8" fill="none" stroke={strokeColor} strokeWidth={4} strokeLinecap="round" />
            <path d="M 4,2 L 18,-1" fill="none" stroke={strokeColor} strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
        {handPose === "mug_hold" && (
          // Wrapped around mug
          <g>
            <path
              d="M -14,-4 C -14,-12 2,-14 12,-10 C 18,-6 18,6 10,12 C 2,14 -12,10 -14,-4 Z"
              fill={skinFill}
              stroke={strokeColor}
              strokeWidth={6}
            />
          </g>
        )}
      </g>
    );
  };

  return (
    <svg
      width={460 * scale}
      height={640 * scale}
      viewBox="-230 -240 460 640"
      style={{
        overflow: "visible",
        transform: flipX ? "scaleX(-1)" : "none",
      }}
    >
      <defs>
        {/* Soft shadow gradients */}
        <radialGradient id={`headGlow_${id}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={shadowSkinFill} />
        </radialGradient>
      </defs>

      {/* ========================================================== */}
      {/* 1. SEATED TORSO & WARDROBE (Midground Layer)              */}
      {/* ========================================================== */}
      <g transform={`translate(0, ${breathY}) scale(1, ${breathScaleY}) rotate(${torsoSlouchDeg})`}>
        
        {/* Chair Backrest (Subtle background silhouette) */}
        {!silhouetteOnly && (
          <path
            d="M -75,90 C -85,-10 -75,-80 -65,-100 C -55,-120 55,-120 65,-100 C 75,-80 85,-10 75,90 Z"
            fill="#0f172a"
            stroke="#020617"
            strokeWidth={8}
            strokeLinejoin="round"
          />
        )}

        {/* Neck */}
        <path
          d="M -16,4 L 16,4 L 18,36 L -18,36 Z"
          fill={silhouetteOnly ? "#09090b" : shadowSkinFill}
          stroke={strokeColor}
          strokeWidth={7}
          strokeLinejoin="round"
        />

        {/* HOST BODY: Casual Hoodie */}
        {isHost && (
          <g id="host-hoodie">
            {/* Main curved bean torso */}
            <path
              d="M -54,34 C -30,30 30,30 54,34 C 70,54 74,130 68,170 C 60,195 -60,195 -68,170 C -74,130 -70,54 -54,34 Z"
              fill={hostHoodieFill}
              stroke={strokeColor}
              strokeWidth={7}
              strokeLinejoin="round"
            />
            {/* Hoodie Collar Fold */}
            {!silhouetteOnly && (
              <path
                d="M -30,32 C -18,50 0,54 0,54 C 0,54 18,50 30,32 C 16,38 -16,38 -30,32 Z"
                fill={hostHoodieShadow}
                stroke={strokeColor}
                strokeWidth={5}
                strokeLinejoin="round"
              />
            )}
            {/* Drawstring Cords */}
            {!silhouetteOnly && (
              <g>
                <path d="M -10,48 C -10,75 -14,88 -12,100" fill="none" stroke="#f8fafc" strokeWidth={3.5} strokeLinecap="round" />
                <path d="M 10,48 C 10,75 14,88 12,100" fill="none" stroke="#f8fafc" strokeWidth={3.5} strokeLinecap="round" />
              </g>
            )}
            {/* Kangaroo Pocket Arc */}
            {!silhouetteOnly && (
              <path
                d="M -40,125 C -25,120 25,120 40,125 C 45,150 -45,150 -40,125 Z"
                fill={hostHoodieShadow}
                stroke={strokeColor}
                strokeWidth={5}
              />
            )}
          </g>
        )}

        {/* INSIDER BODY: Sharp Executive Tailored Suit */}
        {!isHost && (
          <g id="insider-suit">
            {/* Main Torso */}
            <path
              d="M -56,32 C -28,30 28,30 56,32 C 72,55 76,135 70,175 C 60,195 -60,195 -70,175 C -76,135 -72,55 -56,32 Z"
              fill={insiderSuitFill}
              stroke={strokeColor}
              strokeWidth={7}
              strokeLinejoin="round"
            />
            {/* White Shirt Collar V */}
            {!silhouetteOnly && (
              <polygon
                points="-20,32 0,92 20,32"
                fill={insiderShirtFill}
                stroke={strokeColor}
                strokeWidth={5}
                strokeLinejoin="round"
              />
            )}
            {/* Silk Crimson Tie */}
            {!silhouetteOnly && (
              <polygon
                points="-7,36 7,36 10,125 0,145 -10,125"
                fill={insiderTieFill}
                stroke={strokeColor}
                strokeWidth={4.5}
                strokeLinejoin="round"
              />
            )}
            {/* Suit Lapels */}
            {!silhouetteOnly && (
              <g>
                <path
                  d="M -50,34 L -18,85 L -34,130 L -58,70 Z"
                  fill={insiderLapelFill}
                  stroke={strokeColor}
                  strokeWidth={5.5}
                  strokeLinejoin="round"
                />
                <path
                  d="M 50,34 L 18,85 L 34,130 L 58,70 Z"
                  fill={insiderLapelFill}
                  stroke={strokeColor}
                  strokeWidth={5.5}
                  strokeLinejoin="round"
                />
              </g>
            )}
          </g>
        )}

        {/* Arms (Thick organic curved vector paths) */}
        {/* Left Arm */}
        <path
          d={
            leftHand === "chin_listen"
              ? "M -52,50 C -75,80 -70,110 -30,95 L -20,60"
              : "M -52,50 C -80,85 -85,140 -50,165"
          }
          fill="none"
          stroke={strokeColor}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Left Hand */}
        {renderHand(leftHand, leftHand === "chin_listen" ? -18 : -50, leftHand === "chin_listen" ? 48 : 170, true)}

        {/* Right Arm */}
        <path
          d={
            rightHand === "chin_listen"
              ? "M 52,50 C 75,80 70,110 30,95 L 20,60"
              : rightHand === "point_forward"
              ? "M 52,50 C 75,70 85,90 80,120"
              : "M 52,50 C 80,85 85,140 50,165"
          }
          fill="none"
          stroke={strokeColor}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right Hand */}
        {renderHand(
          rightHand,
          rightHand === "chin_listen" ? 18 : rightHand === "point_forward" ? 86 : 50,
          rightHand === "chin_listen" ? 48 : rightHand === "point_forward" ? 120 : 170,
          false
        )}
      </g>

      {/* ========================================================== */}
      {/* 2. HEAD & EXPRESSION ENGINE (Foreground Head Layer)        */}
      {/* ========================================================== */}
      <g transform={`translate(${headOffsetX}, ${headOffsetY + breathY * 0.4}) rotate(${headTiltDeg})`}>
        
        {/* Head Contour (Oversized, expressive cartoon silhouette) */}
        <path
          d="M -70,-55 C -75,-125 -40,-155 0,-155 C 40,-155 75,-125 70,-55 C 68,15 48,22 0,22 C -48,22 -68,15 -70,-55 Z"
          fill={silhouetteOnly ? "#09090b" : `url(#headGlow_${id})`}
          stroke={strokeColor}
          strokeWidth={7}
          strokeLinejoin="round"
        />

        {/* HOST HAIR & BACKWARDS CAP */}
        {isHost && (
          <g id="host-cap">
            {/* Backwards Cap Crown */}
            <path
              d="M -72,-75 C -75,-140 -40,-162 0,-162 C 40,-162 75,-140 72,-75 C 50,-100 -50,-100 -72,-75 Z"
              fill={hostCapFill}
              stroke={strokeColor}
              strokeWidth={7}
              strokeLinejoin="round"
            />
            {/* Backwards Cap Visor / Bill (Sticking out behind right side) */}
            <path
              d="M 60,-82 C 85,-82 105,-72 110,-60 C 105,-55 80,-62 60,-68 Z"
              fill={hostCapFill}
              stroke={strokeColor}
              strokeWidth={6.5}
              strokeLinejoin="round"
            />
            {/* Casual Front Bangs */}
            {!silhouetteOnly && (
              <path
                d="M -50,-80 C -40,-60 -25,-65 -20,-75 C -15,-60 5,-60 10,-75"
                fill="none"
                stroke={strokeColor}
                strokeWidth={5}
                strokeLinecap="round"
              />
            )}
          </g>
        )}

        {/* INSIDER HAIR: Sharp Executive Side-Part */}
        {!isHost && (
          <g id="insider-hair">
            <path
              d="M -72,-68 C -75,-135 -45,-165 5,-165 C 50,-165 76,-135 72,-68 C 65,-95 40,-115 5,-115 C -35,-115 -55,-95 -72,-68 Z"
              fill={silhouetteOnly ? "#09090b" : "#0f172a"}
              stroke={strokeColor}
              strokeWidth={7}
              strokeLinejoin="round"
            />
            {/* Distinguished Hairline Swoop */}
            {!silhouetteOnly && (
              <path
                d="M -45,-128 C -15,-140 20,-135 55,-105"
                fill="none"
                stroke="#334155"
                strokeWidth={4.5}
                strokeLinecap="round"
              />
            )}
          </g>
        )}

        {/* BROADCAST HEADSET BAND */}
        <g id="headset">
          <path
            d="M -74,-50 C -82,-135 -40,-175 0,-175 C 40,-175 82,-135 74,-50"
            fill="none"
            stroke={isHost ? hostHeadset : insiderHeadset}
            strokeWidth={9}
            strokeLinecap="round"
          />
          {/* Left Earcup */}
          <rect
            x={-84}
            y={-65}
            width={16}
            height={36}
            rx={8}
            fill={silhouetteOnly ? "#09090b" : "#09090b"}
            stroke={isHost ? hostHeadset : insiderHeadset}
            strokeWidth={4}
          />
          {/* Right Earcup */}
          <rect
            x={68}
            y={-65}
            width={16}
            height={36}
            rx={8}
            fill={silhouetteOnly ? "#09090b" : "#09090b"}
            stroke={isHost ? hostHeadset : insiderHeadset}
            strokeWidth={4}
          />
        </g>

        {/* EYES ENGINE (Visible Sclera + Dynamic Pupils) */}
        {!silhouetteOnly && (
          <g id="eyes">
            {/* Left Eye White */}
            <g transform="translate(-28, -60)">
              <ellipse
                cx={0}
                cy={0}
                rx={17}
                ry={effectiveEyelid === "wide_open" ? 25 : 21}
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth={5}
              />
              {/* Left Pupil */}
              <circle
                cx={pupilOffsetX}
                cy={pupilOffsetY}
                r={effectiveEyelid === "wide_open" ? 7 : 8}
                fill="#18181b"
              />
              {/* Pupil Catchlight */}
              <circle
                cx={pupilOffsetX - 3}
                cy={pupilOffsetY - 3}
                r={2.5}
                fill="#ffffff"
              />
              {/* Heavy Upper Eyelid for Deadpan / Skeptical */}
              {(effectiveEyelid === "deadpan" || effectiveEyelid === "half_lidded") && (
                <path
                  d="M -18,-2 C -10,3 10,3 18,-2 L 18,-22 L -18,-22 Z"
                  fill={shadowSkinFill}
                  stroke={strokeColor}
                  strokeWidth={4.5}
                />
              )}
              {/* Closed Blink */}
              {effectiveEyelid === "closed_blink" && (
                <path
                  d="M -17,2 C -8,8 8,8 17,2"
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
              )}
            </g>

            {/* Right Eye White */}
            <g transform="translate(28, -60)">
              <ellipse
                cx={0}
                cy={0}
                rx={17}
                ry={effectiveEyelid === "wide_open" ? 25 : 21}
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth={5}
              />
              {/* Right Pupil */}
              <circle
                cx={pupilOffsetX}
                cy={pupilOffsetY}
                r={effectiveEyelid === "wide_open" ? 7 : 8}
                fill="#18181b"
              />
              {/* Pupil Catchlight */}
              <circle
                cx={pupilOffsetX - 3}
                cy={pupilOffsetY - 3}
                r={2.5}
                fill="#ffffff"
              />
              {/* Heavy Upper Eyelid for Deadpan / Skeptical */}
              {(effectiveEyelid === "deadpan" || effectiveEyelid === "half_lidded") && (
                <path
                  d="M -18,-2 C -10,3 10,3 18,-2 L 18,-22 L -18,-22 Z"
                  fill={shadowSkinFill}
                  stroke={strokeColor}
                  strokeWidth={4.5}
                />
              )}
              {/* Closed Blink */}
              {effectiveEyelid === "closed_blink" && (
                <path
                  d="M -17,2 C -8,8 8,8 17,2"
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
              )}
            </g>
          </g>
        )}

        {/* EYEBROWS (Carries 80% of Vocal Comedy & Skepticism) */}
        {!silhouetteOnly && (
          <g id="eyebrows">
            {expression === "neutral" && (
              <g>
                <path d="M -44,-88 C -34,-94 -16,-94 -12,-88" fill="none" stroke={strokeColor} strokeWidth={5.5} strokeLinecap="round" />
                <path d="M 12,-88 C 16,-94 34,-94 44,-88" fill="none" stroke={strokeColor} strokeWidth={5.5} strokeLinecap="round" />
              </g>
            )}
            {expression === "deadpan" && (
              // Completely flat, unbothered horizontal bars
              <g>
                <line x1={-44} y1={-84} x2={-12} y2={-84} stroke={strokeColor} strokeWidth={5.5} strokeLinecap="round" />
                <line x1={12} y1={-84} x2={44} y2={-84} stroke={strokeColor} strokeWidth={5.5} strokeLinecap="round" />
              </g>
            )}
            {expression === "skeptical" && (
              // One raised high in disbelief, one furrowed flat
              <g>
                <path d="M -44,-98 C -34,-106 -16,-106 -12,-98" fill="none" stroke={strokeColor} strokeWidth={6} strokeLinecap="round" />
                <line x1={12} y1={-82} x2={44} y2={-80} stroke={strokeColor} strokeWidth={5.5} strokeLinecap="round" />
              </g>
            )}
            {expression === "curious" && (
              // Raised high with soft inquisitive slant
              <g>
                <path d="M -44,-94 C -34,-102 -16,-98 -12,-90" fill="none" stroke={strokeColor} strokeWidth={5.5} strokeLinecap="round" />
                <path d="M 12,-90 C 16,-98 34,-102 44,-94" fill="none" stroke={strokeColor} strokeWidth={5.5} strokeLinecap="round" />
              </g>
            )}
            {expression === "surprised" && (
              // Floating high above eyes
              <g>
                <path d="M -44,-100 C -34,-108 -16,-108 -12,-100" fill="none" stroke={strokeColor} strokeWidth={6} strokeLinecap="round" />
                <path d="M 12,-100 C 16,-108 34,-108 44,-100" fill="none" stroke={strokeColor} strokeWidth={6} strokeLinecap="round" />
              </g>
            )}
            {expression === "suppressed_laughter" && (
              // Squeezed downward in laughing smirk
              <g>
                <path d="M -42,-84 C -32,-80 -18,-86 -14,-90" fill="none" stroke={strokeColor} strokeWidth={5.5} strokeLinecap="round" />
                <path d="M 14,-90 C 18,-86 32,-80 42,-84" fill="none" stroke={strokeColor} strokeWidth={5.5} strokeLinecap="round" />
              </g>
            )}
          </g>
        )}

        {/* NOSE (Clean minimal cartoon tick) */}
        {!silhouetteOnly && (
          <path d="M -2,-42 C 3,-42 5,-36 2,-34" fill="none" stroke={strokeColor} strokeWidth={4} strokeLinecap="round" />
        )}

        {/* MOUTH ENGINE (High-Aesthetic Cel Visemes) */}
        {!silhouetteOnly && (
          <g id="mouth" transform="translate(0, -14)">
            {/* 1. REST / CLOSED (During deadpan pauses or listening) */}
            {mouthOpen <= 0.05 && expression !== "deadpan" && expression !== "suppressed_laughter" && (
              <path d="M -16,0 C -8,2 8,2 16,0" fill="none" stroke={strokeColor} strokeWidth={5} strokeLinecap="round" />
            )}

            {/* 2. DEADPAN FLAT LINE */}
            {mouthOpen <= 0.05 && expression === "deadpan" && (
              <g>
                <line x1={-18} y1={0} x2={18} y2={0} stroke={strokeColor} strokeWidth={5} strokeLinecap="round" />
                <path d="M -18,0 L -19,3" stroke={strokeColor} strokeWidth={4} strokeLinecap="round" />
                <path d="M 18,0 L 19,3" stroke={strokeColor} strokeWidth={4} strokeLinecap="round" />
              </g>
            )}

            {/* 3. SMUG SMIRK / SUPPRESSED LAUGHTER */}
            {mouthOpen <= 0.05 && expression === "suppressed_laughter" && (
              <g>
                <path d="M -14,2 C -4,0 8,-4 18,-6" fill="none" stroke={strokeColor} strokeWidth={5} strokeLinecap="round" />
                <path d="M 18,-6 C 21,-9 22,-3 20,0" fill="none" stroke={strokeColor} strokeWidth={4} strokeLinecap="round" />
              </g>
            )}

            {/* 4. OPEN VISUAL SPEECH (With visible upper teeth and tongue) */}
            {mouthOpen > 0.05 && (
              <g>
                {/* Dark Cavity */}
                <path
                  d={`M -20,0 C -22,${mouthOpen * 24} 22,${mouthOpen * 24} 20,0 Z`}
                  fill="#18181b"
                  stroke={strokeColor}
                  strokeWidth={4.5}
                  strokeLinejoin="round"
                />
                {/* White Upper Teeth Strip */}
                <path
                  d="M -16,0 L 16,0 L 14,5 L -14,5 Z"
                  fill="#ffffff"
                />
                {/* Pink Curved Tongue (If open enough) */}
                {mouthOpen > 0.4 && (
                  <path
                    d={`M -12,${mouthOpen * 16} C -6,${mouthOpen * 10} 6,${mouthOpen * 10} 12,${mouthOpen * 16} Z`}
                    fill="#fb7185"
                  />
                )}
              </g>
            )}
          </g>
        )}

      </g>
    </svg>
  );
};
