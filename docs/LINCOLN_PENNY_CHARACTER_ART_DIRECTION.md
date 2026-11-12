# The Lincoln Penny — Character Art Direction and Cutout Animation Contract

Status: implementation specification. This document does not claim the existing renders have been replaced.

## Creative priority

Audio carries the comedy. Characters visibly **think, listen, hesitate, and react**; they do not continuously gesture or emote. Two hosts must remain identifiable in silhouette, at thumbnail scale, and with their faces hidden. The visual system is an illustrated cartoon, never a skeletal wireframe.

## Design gates (must pass before rigging)

1. Produce a character lineup: front, three-quarter, profile, seated, standing, and silhouette-only for BOTH hosts.
2. Distinguish characters by at least three stable traits: head/torso silhouette, clothing/hair/accessory, posture. Do not rely solely on color.
3. Define approved palette, stroke weights, line caps, eye geometry, eyebrow shapes, and facial proportions in a versioned asset sheet.
4. Build a podcast set with foreground, midground and background layers. Foreground occlusion must be deliberate, not a permanent blur effect.
5. Approve six expression sheets per character: neutral/listening, curious, skeptical, deadpan, suppressed laughter, surprised. These are *performance choices*, not a loop of facial morphs.
6. Create a still-frame approval sheet at 1080×1920 and 1920×1080 before animation begins. Inspect at phone size.

## Rigging contract

Each character is a reusable, deterministic 2D cutout rig composed of independently transformable groups:

- silhouette/body: illustrated torso shape, neck, upper/lower arms, hands, legs, feet;
- face: eye whites, independently positionable pupils, eyelids, eyebrows, mouth shape;
- wardrobe: approved hair, clothing and accessories fixed to character identity;
- anchors: headPivot, gazeTarget, shoulderL/R, elbowL/R, wristL/R, hip, seatContact;
- depth: ordered layer groups, including behind/in-front-of-torso hand positions.

**Do not use** thin straight lines as the final body art, dot-only eyes, generic circles as interchangeable heads, rigid pivot-only limb movement, or global transforms that make every gesture identical.

Use SVG paths with rounded/variable-width illustrated contours or hand-authored vector assets. Keep identity features constant between shots. Pupil movement should be small and motivated. Mouth poses must not turn a silent character into a speaking character.

## Performance schema (per conversational beat)

```json
{
  "beatId": "lp-e01-004",
  "startFrame": 280,
  "endFrame": 356,
  "speaker": "host",
  "listener": "guest",
  "intent": "quiet disbelief",
  "audioAsset": "audio/host-004.wav",
  "audioMarkers": [
    {"frame": 290, "type": "inhale"},
    {"frame": 312, "type": "emphasis", "word": "agreed"},
    {"frame": 337, "type": "silence"}
  ],
  "host": {
    "pose": "seated-neutral",
    "gaze": "guest",
    "face": "deadpan",
    "gesture": "none",
    "mouth": "audio-driven"
  },
  "guest": {
    "pose": "seated-slouch",
    "gaze": "host",
    "face": "processing",
    "gesture": "none",
    "mouth": "closed"
  },
  "camera": {"preset": "two-shot", "cutOnFrame": 280},
  "set": "podcast-studio-v1"
}
```

Frames are integer and locked to the composition FPS. Actual dialogue timestamps must be aligned to final approved audio, not estimated from text length.

## Motion direction

- Animate poses **between intentional key poses**, with anticipation, hold and settle; never generate perpetual idle arm-waving.
- Deadpan is often a *held* pose. A two-frame pupil shift or delayed head turn may be funnier than an exaggerated reaction.
- Use pose-to-pose timing, including asymmetrical easing and deliberate holds. Do not spring-animate every body part.
- Listener remains alive through micro-behavior (gaze, small breath, occasional posture shift) only when motivated.
- Camera cuts follow the thought or reaction, not a rigid 2–3-second interval. Hold a frame as long as the joke requires.
- Avoid lip sync as a substitute for acting. A minimal, stable mouth-shape set is preferable to random mouth flapping.

## Stage and depth

Create reusable sets with layered backgrounds and parallax only when camera movement justifies it. Standard coverage:
1. two-shot (relationship);
2. host close-up (information);
3. guest close-up (discovery);
4. reaction hold (silence);
5. illustrative cutaway (business fact);
6. return two-shot (conversational reset).

Depth should come from composition, occlusion, lighting/value separation, and layered props. 3D is optional, not a requirement for cartoon quality.

## Implementation order

**Phase A — Art approval:** two illustrated characters + expression sheets + seated silhouettes + podcast set; export SVG assets and visual snapshots.

**Phase B — Reusable rigs:** React/SVG cutout components with typed pose/expression/gaze props; create tests for identity traits, mouth states, and deterministic frames.

**Phase C — Performance:** audio-aligned beat manifest; pauses, gazes, micro-gestures, reaction holds; frame-accurate Remotion timeline.

**Phase D — Camera:** presets, foreground occlusion, cutaway templates, 16:9 master with protected 9:16 crop-safe area.

**Phase E — Quality gate:** render 45–60 seconds of the same two characters across wide, close-up, profile and reaction shots; approve only after listening without visuals and viewing without audio.

## Rejection criteria

Reject renders when any of these occurs:
- characters look like geometry exercises or uncostumed skeletons;
- identities collapse when color is removed;
- eyes are static dots and gaze has no intentionality;
- arms swing while the character is listening without motivation;
- every reaction is exaggerated or every line triggers a camera cut;
- a speaker's mouth moves during the other speaker's line;
- foreground layers obscure key acting;
- 9:16 crops cut away the listener's reaction;
- a static scene is rejected merely because it lasts more than three seconds;
- visuals overpower a deadpan vocal punchline.

## Reference handling

Instagram examples supplied by the creative director are *references for visual qualities*, not assets to copy. Do not trace distinctive character designs, import their frames as backgrounds, or assume their original software/production method can be determined from appearance alone.

## Definition of done

A reviewed, reproducible pilot with both characters recognizable in 16:9 and 9:16, stable art assets across shots, convincing listening behavior, audio-aligned pauses, and a laugh that survives an audio-only test. A written specification alone is not completion.
