import React, { useEffect } from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { ensureFontsLoaded } from "./fonts";
import timingData from "./timing_data.json";
import { BroadcastGrade, KineticCaptionBar } from "./components/BroadcastGrade";
import { Scene1ParallaxHook } from "./scenes/Scene1ParallaxHook";
import { Scene2RoughWhiteboard } from "./scenes/Scene2RoughWhiteboard";
import { Scene3KineticConflict } from "./scenes/Scene3KineticConflict";
import { Scene4SecSpotlight } from "./scenes/Scene4SecSpotlight";
import { Scene5VaultFinale } from "./scenes/Scene5VaultFinale";
import { BlueprintInputProps, BlueprintStoryComposition } from "./BlueprintStoryComposition";
// import { RolexStickmanShort } from "./RolexStickmanShort";
import { SonyForensicTeardownShort } from "./SonyForensicTeardownShort";
import { McDonaldsFoundersShort } from "./McDonaldsFoundersShort";
import { StickmanPodcastShort } from "./StickmanPodcastShort";
import { SilentActingTest } from "./characters/SilentActingTest";
import { DialogueSyncTest } from "./characters/DialogueSyncTest";
import { DirectedPodcastScene } from "./director/DirectedPodcastScene";
import { VenWardMasterShort } from "./VenWardMasterShort";
import { CharacterLineupTest } from "./characters/CharacterLineupTest";

const AirlineHookMaster: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const globalTimeSec = frame / fps;

  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  const isWhiteboardScene = globalTimeSec >= 5.12 && globalTimeSec < 13.52;

  return (
    <AbsoluteFill style={{ backgroundColor: "#050811" }}>
      <Audio src={staticFile("master_audio.wav")} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={159}>
          <Scene1ParallaxHook />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 10 })}
        />

        <TransitionSeries.Sequence durationInFrames={262}>
          <Scene2RoughWhiteboard />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: 10 })}
        />

        <TransitionSeries.Sequence durationInFrames={265}>
          <Scene3KineticConflict />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />

        <TransitionSeries.Sequence durationInFrames={321}>
          <Scene4SecSpotlight />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />

        <TransitionSeries.Sequence durationInFrames={233}>
          <Scene5VaultFinale />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <KineticCaptionBar
        words={timingData.words}
        globalTimeSec={globalTimeSec}
        lightTheme={isWhiteboardScene}
      />

      <BroadcastGrade dark={!isWhiteboardScene} />
    </AbsoluteFill>
  );
};

const defaultBlueprintProps: BlueprintInputProps = {
  slug: "airline-miles-profit",
  format: "long",
  title: "Why Airlines Don't Fly Planes for Profit",
  beats: [
    {
      kicker: "01 / The Paradox",
      heading: "The $400 Ticket Illusion",
      big: "$12 SEAT MARGIN",
      detail: "Capital intensity crushes passenger tickets.",
      narration: "When you book a four hundred dollar flight, the airline keeps almost nothing.",
      sourceLabel: "IATA Global Airline Financial Health",
    },
  ],
  sources: [
    {
      claim: "Delta Air Lines reports billions in annual cash remuneration from American Express.",
      url: "https://ir.delta.com/financials/default.aspx",
    },
  ],
  beatTimes: [{ start: 0, end: 10 }],
  words: [],
  duration: 10,
  audioFile: "",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AirlineHook"
        component={AirlineHookMaster}
        durationInFrames={1200}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="BlueprintStory"
        component={BlueprintStoryComposition as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultBlueprintProps as unknown as Record<string, unknown>}
        calculateMetadata={({ props }) => {
          const p = props as unknown as BlueprintInputProps;
          const isShort = p.format === "short";
          const fps = 30;
          const totalFrames = Math.max(30, Math.round((Number(p.duration) || 10) * fps));
          return {
            fps,
            durationInFrames: totalFrames,
            width: isShort ? 1080 : 1920,
            height: isShort ? 1920 : 1080,
          };
        }}
      />

      <Composition
        id="SonyForensicTeardownShort"
        component={SonyForensicTeardownShort}
        durationInFrames={1693}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="McDonaldsFoundersShort"
        component={McDonaldsFoundersShort}
        durationInFrames={1253}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="StickmanPodcastShort"
        component={StickmanPodcastShort}
        durationInFrames={1250}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="SilentActingTest"
        component={SilentActingTest}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="DialogueSyncTest"
        component={DialogueSyncTest}
        durationInFrames={1250}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="DirectedPodcastScene"
        component={DirectedPodcastScene}
        durationInFrames={1250}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="VenWardLaunchCampaign"
        component={VenWardMasterShort}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="VenWardLaunchReel"
        component={VenWardMasterShort}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CharacterLineupStudio"
        component={CharacterLineupTest}
        defaultProps={{ viewMode: "studio_two_shot" }}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="CharacterLineupSilhouette"
        component={CharacterLineupTest}
        defaultProps={{ viewMode: "silhouette_gate" }}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="CharacterLineupExpressions"
        component={CharacterLineupTest}
        defaultProps={{ viewMode: "expression_sheets" }}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
