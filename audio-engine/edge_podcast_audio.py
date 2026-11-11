#!/usr/bin/env python3
"""
Edge Neural TTS Dual-Voice Podcast Synthesizer
Zero-Cost, Unlimited, Studio-Quality Microsoft Azure Neural Voices
Host: en-US-GuyNeural (Lively, engaging conversational host)
Guest/Insider: en-US-ChristopherNeural (Deep, authoritative investigative insider)
"""

import os, sys, json, subprocess
import numpy as np
from faster_whisper import WhisperModel

def main():
    dialogue = [
        {"speaker": "host", "voice": "en-US-GuyNeural", "rate": "+6%", "pitch": "+2Hz", "text": "Our last video about McDonald's blew up, and the comments are fighting over Ray Kroc. But almost nobody knows where their money actually comes from."},
        {"speaker": "guest", "voice": "en-US-ChristopherNeural", "rate": "+2%", "pitch": "-1Hz", "text": "Because McDonald's isn't a burger chain. They're a thirty billion dollar real estate empire."},
        {"speaker": "host", "voice": "en-US-GuyNeural", "rate": "+8%", "pitch": "+3Hz", "text": "Wait... what? They sell burgers!"},
        {"speaker": "guest", "voice": "en-US-ChristopherNeural", "rate": "+3%", "pitch": "-1Hz", "text": "The burgers are just the bait. Ray Kroc's genius was buying the physical land under every restaurant. If a franchisee wants to sell fries, they have to pay McDonald's rent first."},
        {"speaker": "host", "voice": "en-US-GuyNeural", "rate": "+6%", "pitch": "+1Hz", "text": "So they make more from rent than burgers?"},
        {"speaker": "guest", "voice": "en-US-ChristopherNeural", "rate": "+2%", "pitch": "-1Hz", "text": "Eighty percent of their profit is pure rent and franchise royalties. McDonald's is a real estate monopoly in disguise."},
        {"speaker": "host", "voice": "en-US-GuyNeural", "rate": "+4%", "pitch": "+0Hz", "text": "Which is why our last video was only the beginning."}
    ]

    import tempfile
    root_dir = os.environ.get("LINCOLN_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    out_dir = os.path.join(root_dir, "out", "mcdonalds-part2-edge-short")
    os.makedirs(out_dir, exist_ok=True)
    temp_dir = os.path.join(tempfile.gettempdir(), "edge_podcast_lines")
    os.makedirs(temp_dir, exist_ok=True)

    print("[*] Generating lines with Edge-TTS Microsoft Neural...")
    line_files = []
    line_timings = []
    cursor = 0.0

    for i, line in enumerate(dialogue):
        spk = line["speaker"]
        voice = line["voice"]
        txt = line["text"]
        rate = line["rate"]
        pitch = line["pitch"]
        fpath = os.path.join(temp_dir, f"line_{i:02d}_{spk}.mp3")

        cmd = [
            "edge-tts",
            "--voice", voice,
            f"--rate={rate}",
            f"--pitch={pitch}",
            "--text", txt,
            "--write-media", fpath
        ]
        subprocess.check_call(cmd)

        # Get duration using ffprobe
        dur_cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", fpath]
        dur = float(subprocess.check_output(dur_cmd).decode('utf-8').strip())

        line_timings.append({
            "line_index": i,
            "speaker": spk,
            "text": txt,
            "start": round(cursor, 3),
            "end": round(cursor + dur, 3),
            "duration": round(dur, 3)
        })

        line_files.append(fpath)
        cursor += dur + 0.18 # Natural conversational pause between speaker turns

    # Build concat demuxer list for ffmpeg
    concat_list_path = os.path.join(temp_dir, "concat.txt")
    with open(concat_list_path, "w") as f:
        for fpath in line_files:
            f.write(f"file '{fpath}'\n")

    raw_mp3_path = os.path.join(out_dir, "raw_dialogue.mp3")
    concat_cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list_path, "-c", "copy", raw_mp3_path]
    subprocess.check_call(concat_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Master audio to -15 LUFS with light studio compression
    master_mp3 = os.path.join(out_dir, "audio.mp3")
    master_cmd = [
        "ffmpeg", "-y", "-i", raw_mp3_path,
        "-af", "loudnorm=I=-15:TP=-1.0:LRA=7,acompressor=threshold=-21dB:ratio=2.5:attack=15:release=120",
        "-b:a", "192k", master_mp3
    ]
    subprocess.check_call(master_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"[OK] Mastered Edge-TTS audio created ({cursor:.2f}s): {master_mp3}")

    # Word-level alignment using Whisper
    print("[*] Running precision word-level alignment...")
    whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
    segments, _ = whisper_model.transcribe(master_mp3, word_timestamps=True, language="en")

    words_out = []
    for seg in segments:
        for w in (seg.words or []):
            word_clean = w.word.strip()
            if not word_clean:
                continue
            spk = "host"
            w_mid = (w.start + w.end) / 2.0
            for lt in line_timings:
                if lt["start"] <= w_mid <= lt["end"] + 0.25:
                    spk = lt["speaker"]
                    break

            words_out.append({
                "word": word_clean,
                "start": round(w.start, 2),
                "end": round(w.end, 2),
                "speaker": spk
            })

    with open(os.path.join(out_dir, "lines.json"), "w", encoding="utf-8") as f:
        json.dump(line_timings, f, indent=2)

    with open(os.path.join(out_dir, "words.json"), "w", encoding="utf-8") as f:
        json.dump({"duration": round(cursor, 2), "words": words_out}, f, indent=2)

    print(f"[OK] Alignment complete: {len(words_out)} words mapped.")
    print(f"[OK] All assets ready in {out_dir}")

if __name__ == "__main__":
    main()
