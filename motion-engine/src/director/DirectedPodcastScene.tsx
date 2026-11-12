import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONTS } from "../fonts";
import { IllustratedCutoutRig } from "../characters/IllustratedCutoutRig";
import { CinematicStudioSet } from "../characters/CinematicStudioSet";
import { CharacterPose, ExpressionState, GazeTarget, HandPose, EyelidState } from "../characters/cutoutTypes";
import { getVisemeForTime, WordAlignment } from "../characters/lipSync";
import { compileEpisodeTimeline, getShotAtFrame } from "./compiler";
import { getEpisodeManifest } from "./episodeManifests";

export interface DirectedPodcastSceneProps {
  episodeId?: string;
  showDirectorHud?: boolean;
}

export const DirectedPodcastScene: React.FC<DirectedPodcastSceneProps> = ({
  episodeId = "costco-hotdog-002",
  showDirectorHud = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  // Resolve episode manifest (Costco Hot Dog, McDonald's Monopoly, etc.)
  const manifest = useMemo(() => {
    return getEpisodeManifest(episodeId);
  }, [episodeId]);

  // Compile semantic shot timeline dynamically
  const compiledShots = useMemo(() => {
    return compileEpisodeTimeline(manifest.lines, manifest.narrativeCues, fps);
  }, [manifest, fps]);

  // Pure deterministic lookup of shot metadata and camera transform
  const { shot, cameraScale, cameraPanX, cameraPanY } = useMemo(() => {
    return getShotAtFrame(compiledShots, frame);
  }, [compiledShots, frame]);

  // Active word calculation
  const activeWord = useMemo(() => {
    return manifest.words.find((w) => time >= w.start && time < w.end);
  }, [manifest.words, time]);

  // High-precision lip-sync visemes
  const hostViseme = getVisemeForTime(time, manifest.words, "host");
  const insiderViseme = getVisemeForTime(time, manifest.words, "insider");

  // Subtle organic camera breathing drift (restrained 2px oscillation)
  const drift = Math.sin(time * 0.8) * 2;

  // Evidence card entrance animation spring
  const cardEntrance = shot.evidenceCard
    ? spring({
        frame: frame - shot.startFrame,
        fps,
        config: { damping: 14, stiffness: 180 },
      })
    : 0;

  // Deterministic blinking cycle (blink every 3.6s for 3 frames, suppressed during deadpan/shock)
  const blinkCycle = frame % 108;
  const isBlinkFrame = blinkCycle >= 104 && blinkCycle <= 106;

  // =========================================================================
  // HOST ACTING & RIG CONFIGURATION
  // =========================================================================
  const isHostSpeaking = hostViseme.openAmount > 0.05;

  let hostPose: CharacterPose = "seated_neutral";
  let hostExpression: ExpressionState = "neutral";
  let hostGaze: GazeTarget = "other_host";
  let hostLeftHand: HandPose = "desk_flat";
  let hostRightHand: HandPose = "desk_flat";
  let hostEyelid: EyelidState | undefined = isBlinkFrame ? "closed_blink" : undefined;
  let hostMouthOpen = 0.0;

  if (isHostSpeaking) {
    hostMouthOpen = hostViseme.openAmount;
    hostPose = "seated_lean_forward";
    if (shot.hostAction === "curious") {
      hostExpression = "curious";
      hostLeftHand = "chin_listen";
    } else if (shot.hostAction === "smirk") {
      hostExpression = "suppressed_laughter";
      hostGaze = "camera";
      hostLeftHand = "point_forward";
    } else if (shot.hostAction === "deadpan") {
      hostExpression = "deadpan";
      hostEyelid = "deadpan";
      hostGaze = "camera";
    } else {
      hostExpression = "neutral";
      hostLeftHand = "open_gesture";
    }
  } else {
    // Host is Listening / Reacting (Mouth 100% closed)
    hostMouthOpen = 0.0;
    if (shot.hostAction === "deadpan") {
      hostExpression = "deadpan";
      hostEyelid = "deadpan";
      hostPose = "seated_neutral";
      hostGaze = shot.shotType === "establishing_wide" || shot.visualPriority === "listener_reaction" ? "camera" : "other_host";
      hostLeftHand = "desk_flat";
    } else if (shot.hostAction === "curious" || shot.hostAction === "lean_forward") {
      hostExpression = "curious";
      hostPose = "seated_lean_forward";
      hostLeftHand = "chin_listen";
      hostGaze = "other_host";
    } else if (shot.hostAction === "shock") {
      hostExpression = "surprised";
      hostEyelid = "wide_open";
      hostPose = "seated_lean_forward";
      hostLeftHand = "chin_listen";
      hostGaze = "other_host";
    } else if (shot.hostAction === "smirk") {
      hostExpression = "suppressed_laughter";
      hostPose = "seated_neutral";
      hostGaze = "camera";
    } else {
      hostExpression = "neutral";
      hostPose = "seated_neutral";
      hostGaze = "other_host";
    }
  }

  // =========================================================================
  // INSIDER ACTING & RIG CONFIGURATION
  // =========================================================================
  const isInsiderSpeaking = insiderViseme.openAmount > 0.05;

  let insiderPose: CharacterPose = "seated_neutral";
  let insiderExpression: ExpressionState = "neutral";
  let insiderGaze: GazeTarget = "other_host";
  let insiderLeftHand: HandPose = "desk_flat";
  let insiderRightHand: HandPose = "desk_flat";
  let insiderEyelid: EyelidState | undefined = isBlinkFrame ? "closed_blink" : undefined;
  let insiderMouthOpen = 0.0;

  if (isInsiderSpeaking) {
    insiderMouthOpen = insiderViseme.openAmount;
    insiderPose = "seated_neutral";
    if (shot.insiderAction === "smirk") {
      insiderExpression = "suppressed_laughter";
      insiderRightHand = "point_forward";
    } else {
      insiderExpression = "neutral";
      insiderRightHand = "open_gesture";
    }
  } else {
    // Insider is Listening / Reacting (Mouth 100% closed)
    insiderMouthOpen = 0.0;
    if (shot.insiderAction === "deadpan") {
      insiderExpression = "deadpan";
      insiderEyelid = "deadpan";
      insiderPose = "seated_neutral";
      insiderGaze = shot.shotType === "establishing_wide" || shot.visualPriority === "listener_reaction" ? "camera" : "other_host";
    } else if (shot.insiderAction === "smirk") {
      insiderExpression = "suppressed_laughter";
      insiderEyelid = "half_lidded";
      insiderGaze = shot.visualPriority === "listener_reaction" ? "camera" : "other_host";
    } else {
      insiderExpression = "neutral";
      insiderPose = "seated_neutral";
      insiderGaze = "other_host";
    }
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#07090e",
        overflow: "hidden",
        fontFamily: FONTS.sans,
        color: "#ffffff",
      }}
    >
      <Audio src={staticFile(manifest.audioSrc)} />

      {/* ======================================================== */}
      {/* DIRECTED CAMERA RIG (Pans & Scales 3-Layer Studio)       */}
      {/* ======================================================== */}
      <AbsoluteFill
        style={{
          transform: `scale(${cameraScale}) translate(${cameraPanX + drift}px, ${cameraPanY}px)`,
          transformOrigin: "center 48%",
        }}
      >
        <CinematicStudioSet
          cameraPreset={shot.shotType === "evidence_split" ? "evidence_split" : "two_shot"}
          showForegroundOcclusion={true}
        >
          {/* THE HOST (Chibi, Hoodie, Glasses, Yellow Headset) */}
          <div style={{ position: "absolute", left: 140, top: 780 }}>
            <IllustratedCutoutRig
              id="host"
              pose={hostPose}
              expression={hostExpression}
              gaze={hostGaze}
              eyelid={hostEyelid}
              leftHand={hostLeftHand}
              rightHand={hostRightHand}
              mouthOpen={hostMouthOpen}
              scale={1.05}
              frame={frame}
            />
          </div>

          {/* THE INSIDER (Sharp Part, Suit & Tie, Red Headset) */}
          <div style={{ position: "absolute", left: 600, top: 770 }}>
            <IllustratedCutoutRig
              id="insider"
              pose={insiderPose}
              expression={insiderExpression}
              gaze={insiderGaze}
              eyelid={insiderEyelid}
              leftHand={insiderLeftHand}
              rightHand={insiderRightHand}
              mouthOpen={insiderMouthOpen}
              flipX={true}
              scale={1.05}
              frame={frame}
            />
          </div>
        </CinematicStudioSet>

        {/* ======================================================== */}
        {/* SEMANTIC FLOATING EVIDENCE CARD                          */}
        {/* Appears when shot.evidenceCard is active                 */}
        {/* ======================================================== */}
        {shot.evidenceCard && (
          <div
            style={{
              position: "absolute",
              top: 340,
              left: 100,
              right: 100,
              background: "rgba(10, 15, 26, 0.96)",
              border: "2px solid #f59e0b",
              borderRadius: 22,
              padding: "24px 30px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.9), 0 0 40px rgba(245, 158, 11, 0.2)",
              transform: `scale(${cardEntrance})`,
              zIndex: 35,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(245, 158, 11, 0.35)",
                paddingBottom: 10,
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 15,
                  color: "#f59e0b",
                  letterSpacing: 2,
                  fontWeight: 800,
                }}
              >
                {shot.evidenceCard.title}
              </span>
              <span
                style={{
                  background: "#ef4444",
                  color: "#ffffff",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                CONFIDENTIAL FILING
              </span>
            </div>

            <div style={{ textAlign: "center", margin: "10px 0" }}>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: 2,
                  marginBottom: 4,
                }}
              >
                {shot.evidenceCard.statLabel}
              </div>
              <div
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: 52,
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: -1,
                  lineHeight: 1.1,
                  textShadow: "0 4px 15px rgba(0,0,0,0.8)",
                }}
              >
                {shot.evidenceCard.statNumber}
              </div>
              {shot.evidenceCard.subtitle && (
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 13,
                    color: "#94a3b8",
                    marginTop: 6,
                  }}
                >
                  {shot.evidenceCard.subtitle}
                </div>
              )}
            </div>

            {shot.evidenceCard.imageSrc && (
              <div
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  height: 140,
                }}
              >
                <Img
                  src={staticFile(shot.evidenceCard.imageSrc)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}
          </div>
        )}
      </AbsoluteFill>

      {/* ======================================================== */}
      {/* DIRECTOR HUD TELEMETRY BADGE (Top Center-Left)           */}
      {/* ======================================================== */}
      {showDirectorHud && (
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 36,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: "10px 16px",
            background: "rgba(10, 15, 26, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            borderRadius: 12,
            fontFamily: FONTS.mono,
            fontSize: 12,
            color: "#CBD5E1",
            zIndex: 60,
          }}
        >
          <div style={{ color: "#F59E0B", fontWeight: 700 }}>
            THE LINCOLN PENNY // AI DIRECTOR ENGINE
          </div>
          <div>EPISODE: {manifest.episodeId}</div>
          <div>SHOT ID: {shot.id} | TYPE: {shot.shotType.toUpperCase()}</div>
          <div>ACTING: Host [{shot.hostAction}] / Insider [{shot.insiderAction}]</div>
          <div>CAMERA: scale {cameraScale.toFixed(2)}x (panX: {cameraPanX.toFixed(0)}px)</div>
        </div>
      )}

      {/* ======================================================== */}
      {/* WORD-LOCKED KINETIC CAPTIONS                             */}
      {/* ======================================================== */}
      {activeWord && (
        <div
          style={{
            position: "absolute",
            bottom: 150,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(10, 15, 26, 0.94)",
            border: `2px solid ${activeWord.speaker === "host" ? "#facc15" : "#ef4444"}`,
            padding: "16px 36px",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 10px 40px rgba(0,0,0,0.85)",
            zIndex: 60,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: 36,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: 1,
            }}
          >
            {activeWord.word.toUpperCase()}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
