# Lincoln Penny — Production Readiness Re-Audit (2026-11-12)

**Scope:** GitHub source review of `main` and `feature/lincoln-penny-character-art-direction`; no live VPS, GPU, rendered-video playback, or fresh local build was performed. Existing `docs/audit/BASELINE_AUDIT.md` contains historical runtime checks, not evidence of current deployment health.

## Verdict

**NOT VISUALLY PRODUCTION-READY.** Infrastructure and libraries are present, but no approved, illustrated, identity-locked character asset pack is wired into the current render. The art-direction document added on the feature branch is a specification only.

## Confirmed source-level blockers

| Priority | Evidence | Defect | Required change | Acceptance test |
|---|---|---|---|---|
| P0 | `motion-engine/src/characters/SkeletalRig.tsx` | Straight-line arms/forearms, circular head, mechanically jointed geometry remain the primary rig | Replace visible skeleton primitives with approved illustrated SVG cutout assets and shape-based deformations; preserve joints only as hidden rigging | 2 characters distinguishable by black silhouettes in wide/close/profile shots |
| P0 | `motion-engine/src/components/StickmanAvatar.tsx` | `Math.sin` bob and periodic mouth toggle | Deprecate for final character acting; migrate compositions to one canonical rig | No periodic movement when beat says hold; silent mouth stays closed |
| P0 | `motion-engine/src/director/DirectedPodcastScene.tsx` | Imports `public/podcast/words.json` and `lines.json`; hardcoded McDonald's cues | Load per-episode versioned performance/shot manifest; derive duration from approved master audio | Two unrelated episodes render without editing component source |
| P0 | `audio-engine/performance_synthesizer.py` | `generate_word_alignments` allocates word duration proportionally to character count | Replace synthetic timestamps with real forced alignment; retain per-line take files, measured durations and provenance | Word boundaries validated against waveform; no claimed phoneme precision from character counts |
| P1 | `motion-engine/src/characters/lipSync.ts` | Infers visemes by character positions within written words | Use phoneme/viseme time marks from aligner or measured speech events; conservative fallback | Correct speaker only; lips closed in silence; visual review of plosives/vowels |
| P1 | `motion-engine/src/Root.tsx` | Podcast compositions use fixed durations and are 9:16; 16:9 long-form is not established as a production master | Create parametric 16:9 long-form master with automatic duration and vertical clip composition from edit decision list | One 8–15 minute test timeline and one extracted 9:16 clip from same assets |
| P1 | `bin/lincoln.js` `extract` | Costco lines 0–11 and 9–10/10 clip scores hardcoded | Candidate discovery from actual long-form timeline; reviewer-scored and evidence-backed gates | Different episode yields different candidates; no default perfect scores |
| P1 | `docs/editorial/PERFORMANCE_DIRECTIVE.md` | Correct philosophy exists, but quality gate isn't enforced in render CLI | Implement manifest validation and approval checkpoints; fail closed when art/voice/timing unapproved | CI rejects missing character sheet, unaligned dialogue, or unapproved render |
| P1 | `README.md` | Describes autonomous end-to-end system more confidently than code proves | Separate implemented/tested/planned claims and runtime deployment status | README has reproducible verification commands and honest capability matrix |
| P2 | `motion-engine/package.json` | Three.js, React Three Fiber, and Remotion installed | Do not add new framework without an identified need; use 3D for cutaways/sets, not as a substitute for illustrated characters | A/B test visual quality and render time |
| P2 | Distribution and agent scripts | Earlier audit flags hardcoded paths and publication safety | Recheck deployment and end-to-end approval gating before any publishing | Publish defaults private; explicit manual approval required |

## Implementation sequence — no more document-only fixes

1. **Design approval**: art director produces two character sheets, six expression states each, silhouettes, seated/standing poses, studio foreground/midground/background. Original designs, not traced reference characters.
2. **Rig replacement**: build `IllustratedCharacter` from approved SVG shapes; preserve facial, gaze, mouth, pose, depth anchors. Replace `SkeletalRig` in the production composition after side-by-side QA, not by deleting old files prematurely.
3. **Audio truth**: choose and approve recorded dialogue takes, run actual forced alignment, generate immutable beat timing/viseme tracks. Remove fake precision claims.
4. **Director compiler**: consume a validated episode manifest (assets, dialogue, audio, timing, poses, cameras, reactions); no hardcoded brand/episode text.
5. **Long-form first**: create 16:9 master; use edit decision lists to generate context-complete 9:16 Shorts.
6. **Golden scene**: 45–60 seconds with a real information discovery, restrained listening, deadpan hold, one documentary cutaway, and comedic payoff. Compare audio-only, mute-only, and final mix.
7. **Automated regression**: typecheck, deterministic still snapshots at marked frames, missing-asset checks, speaking/silence invariants, and render smoke test in CI.
8. **Operational verification**: independently check VPS/GPU hardware, job queue, codecs, fonts, FFmpeg, disk, memory, rendering speed, and artifact storage. No infrastructure readiness claim until measured.

## Stop conditions

Do not call the pipeline finished merely because Remotion compiles, the GPU is available, a 3D plugin is installed, or a rig has many pose parameters. Final approval requires an art-directed render reviewed at phone size and full resolution, stable character identity across angles, genuinely aligned vocal performance, and a coherent long-form-to-Short extraction.

## Suggested owner decisions

- Approve two original illustrated character designs **before** replacing rig code.
- Choose one 45–60-second scene as the golden reference.
- Keep the existing production branch intact until replacement passes visual QA.
