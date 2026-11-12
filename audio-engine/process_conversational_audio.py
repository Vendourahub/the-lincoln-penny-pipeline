#!/usr/bin/env python3
"""
THE LINCOLN PENNY — CONVERSATIONAL AUDIO PROCESSOR & RENDER RUNNER
Picks up 'costco_conversational_raw.wav' from Downloads or project root,
runs:
1. Broadcast Studio DSP Mastering
2. Groq Whisper Word-Level Forced Alignment
3. Remotion Scene Rendering
4. Verification Still Extraction
"""

import os
import sys
import json
import subprocess
import glob

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DOWNLOADS_DIR = os.path.expanduser("~/Downloads")

def find_raw_audio():
    candidates = [
        os.path.join(ROOT_DIR, "audio-engine", "costco_conversational_raw.wav"),
        os.path.join(ROOT_DIR, "costco_conversational_raw.wav"),
        os.path.join(DOWNLOADS_DIR, "costco_conversational_raw.wav"),
        os.path.join(DOWNLOADS_DIR, "costco_conversational_raw (1).wav"),
    ]
    for c in candidates:
        if os.path.exists(c) and os.path.getsize(c) > 10000:
            return c
    return None

def main():
    raw_path = find_raw_audio()
    if not raw_path:
        print("[*] Waiting for 'costco_conversational_raw.wav' in Downloads or project directory...")
        sys.exit(1)

    print(f"[OK] Found conversational audio: {raw_path} ({os.path.getsize(raw_path)} bytes)")

    out_dir = os.path.join(ROOT_DIR, "motion-engine", "public", "episodes", "costco-hotdog-002")
    os.makedirs(out_dir, exist_ok=True)

    # Run chattts_synthesizer.py with --input-audio
    cmd = [
        sys.executable,
        os.path.join(ROOT_DIR, "audio-engine", "chattts_synthesizer.py"),
        "--input-audio", raw_path,
        "--out-dir", out_dir
    ]
    subprocess.check_call(cmd)

    # Get total audio duration
    dur_cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", os.path.join(out_dir, "audio.mp3")]
    dur_sec = float(subprocess.check_output(dur_cmd).decode().strip())
    total_frames = int(dur_sec * 30)
    print(f"[*] Total master audio duration: {dur_sec:.2f}s ({total_frames} frames)")

    # Update Root.tsx duration if needed
    root_tsx = os.path.join(ROOT_DIR, "motion-engine", "src", "Root.tsx")
    with open(root_tsx, "r", encoding="utf-8") as f:
        content = f.read()

    # Update CostcoComedicShort duration
    import re
    new_content = re.sub(
        r'id="CostcoComedicShort"[\s\S]*?durationInFrames=\{\d+\}',
        f'id="CostcoComedicShort"\n        component={{DirectedPodcastScene}}\n        defaultProps={{{{ episodeId: "costco-hotdog-002" }}}}\n        durationInFrames={{{total_frames}}}',
        content
    )
    with open(root_tsx, "w", encoding="utf-8") as f:
        f.write(new_content)

    # Render Remotion video
    print(f"[*] Rendering Remotion episode with new conversational audio ({total_frames} frames)...")
    render_cmd = [
        "npx", "remotion", "render", "src/index.ts", "CostcoComedicShort",
        "../out/the_lincoln_penny_costco_review_sample.mp4", "--concurrency=4"
    ]
    subprocess.check_call(render_cmd, cwd=os.path.join(ROOT_DIR, "motion-engine"), shell=True)

    # Copy to brain artifact directory
    brain_dir = r"C:\Users\pc\.gemini\antigravity\brain\4ad00f23-0ef8-4957-944f-f262bbae8fb5"
    out_mp4 = os.path.join(ROOT_DIR, "out", "the_lincoln_penny_costco_review_sample.mp4")
    dest_mp4 = os.path.join(brain_dir, "the_lincoln_penny_costco_review_sample.mp4")
    if os.path.exists(out_mp4):
        import shutil
        shutil.copyfile(out_mp4, dest_mp4)
        print(f"[OK] Copied master video to artifact dir: {dest_mp4}")

    print("\n================================================================")
    print(" [OK] PIPELINE COMPLETE: CONVERSATIONAL EPISODE READY")
    print("================================================================\n")

if __name__ == "__main__":
    main()
