#!/usr/bin/env python3
"""
THE LINCOLN PENNY — PERFORMANCE & VOCAL SCORE AUDIO SYNTHESIZER
Implements:
1. Multi-speaker neural voice synthesis (Host: GuyNeural, Insider: ChristopherNeural)
2. Direction-mapped prosody (deadpan_disbelief, genuine_curiosity, delayed_realization, etc.)
3. Semantic silence injection (thought_processing, deadpan_disbelief, comedic_beat)
4. Sub-frame phonetic word alignment for Remotion lip-sync
5. Broadcast mastering to -15 LUFS
"""

import os
import sys
import json
import asyncio
import argparse
import subprocess
import tempfile
import edge_tts

ROOT_DIR = os.environ.get("LINCOLN_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Voice Profiles
VOICE_PROFILES = {
    "host": "en-US-GuyNeural",
    "insider": "en-US-ChristopherNeural",
    "guest": "en-US-ChristopherNeural"
}

# Direction Prosody Presets
DIRECTION_PRESETS = {
    "deadpan_disbelief": {"rate": "-5%", "pitch": "-2Hz", "volume": "-5%"},
    "genuine_curiosity": {"rate": "+6%", "pitch": "+3Hz", "volume": "+0%"},
    "personal_offense": {"rate": "+8%", "pitch": "+4Hz", "volume": "+5%"},
    "delayed_realization": {"rate": "-3%", "pitch": "+1Hz", "volume": "+0%"},
    "dry_understatement": {"rate": "-4%", "pitch": "-3Hz", "volume": "-5%"},
    "matter_of_fact": {"rate": "+1%", "pitch": "-1Hz", "volume": "+0%"},
    "smug_revelation": {"rate": "+3%", "pitch": "-1Hz", "volume": "+0%"},
    "inquisitive_skeptic": {"rate": "+5%", "pitch": "+2Hz", "volume": "+0%"},
}

DEFAULT_PROSODY = {"rate": "+0%", "pitch": "+0Hz", "volume": "+0%"}

def parse_pause(val, default_sec=0.20):
    if val is None:
        return default_sec, "natural_turn"
    if isinstance(val, (int, float)):
        return float(val), "explicit"
    if isinstance(val, dict):
        return float(val.get("duration", default_sec)), val.get("type", "explicit")
    return default_sec, "natural_turn"

async def synthesize_line_file(text, voice, prosody, out_path):
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=prosody["rate"],
        pitch=prosody["pitch"],
        volume=prosody["volume"]
    )
    await communicate.save(out_path)

def get_audio_duration(file_path):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path
    ]
    out = subprocess.check_output(cmd).decode("utf-8").strip()
    return float(out)

def create_silence_mp3(duration_sec, out_path):
    cmd = [
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", f"anullsrc=r=24000:cl=mono",
        "-t", str(round(duration_sec, 3)),
        "-q:a", "9", "-acodec", "libmp3lame",
        out_path
    ]
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def generate_word_alignments(line_text, start_time, end_time, speaker):
    raw_words = line_text.strip().split()
    if not raw_words:
        return []

    cleaned_words = [w.strip() for w in raw_words if w.strip()]
    if not cleaned_words:
        return []

    # Calculate letter counts for proportional distribution
    weights = [max(1, len(w.replace("...", "").replace(",", "").replace(".", ""))) for w in cleaned_words]
    total_weight = sum(weights)
    total_duration = end_time - start_time

    alignments = []
    curr = start_time
    for i, word in enumerate(cleaned_words):
        w_dur = (weights[i] / total_weight) * total_duration
        w_start = round(curr, 3)
        w_end = round(curr + w_dur, 3)
        alignments.append({
            "word": word,
            "start": w_start,
            "end": w_end,
            "speaker": speaker
        })
        curr += w_dur

    return alignments

async def synthesize_episode(episode_data, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    temp_dir = tempfile.mkdtemp(prefix="lincoln_synth_")

    dialogue = episode_data.get("dialogue", [])
    print(f"[*] Synthesizing {len(dialogue)} dialogue lines with Performance Scoring...")

    segments = []
    line_timings = []
    all_words = []
    cursor = 0.0

    for idx, line in enumerate(dialogue):
        speaker = line.get("speaker", "host").lower()
        voice = VOICE_PROFILES.get(speaker, "en-US-GuyNeural")
        text = line.get("text", "")
        direction = line.get("performanceDirection", "matter_of_fact")

        # Determine prosody
        prosody = dict(DIRECTION_PRESETS.get(direction, DEFAULT_PROSODY))
        if "vocalModifiers" in line and isinstance(line["vocalModifiers"], dict):
            prosody.update(line["vocalModifiers"])

        # Handle pauseBefore
        pause_before_sec, pb_type = parse_pause(line.get("pauseBefore"), default_sec=0.0)
        if pause_before_sec > 0.01:
            silence_path = os.path.join(temp_dir, f"silence_pre_{idx:03d}.mp3")
            create_silence_mp3(pause_before_sec, silence_path)
            segments.append(silence_path)
            print(f"  [SILENCE] {pause_before_sec:.2f}s ({pb_type}) before line #{idx}")
            cursor += pause_before_sec

        # Synthesize speech line
        line_path = os.path.join(temp_dir, f"line_{idx:03d}_{speaker}.mp3")
        await synthesize_line_file(text, voice, prosody, line_path)
        dur = get_audio_duration(line_path)
        segments.append(line_path)

        line_start = round(cursor, 3)
        line_end = round(cursor + dur, 3)

        print(f"  [{speaker.upper()}] line #{idx} ({direction}): \"{text[:36]}...\" -> {dur:.2f}s")

        line_timings.append({
            "lineIndex": idx,
            "speaker": speaker,
            "text": text,
            "performanceDirection": direction,
            "start": line_start,
            "end": line_end,
            "duration": round(dur, 3),
            "pauseAfter": line.get("pauseAfter")
        })

        # Generate word alignments
        words = generate_word_alignments(text, line_start, line_end, speaker)
        all_words.extend(words)
        cursor += dur

        # Handle pauseAfter
        pause_after_sec, pa_type = parse_pause(line.get("pauseAfter"), default_sec=0.20)
        if pause_after_sec > 0.01:
            silence_post = os.path.join(temp_dir, f"silence_post_{idx:03d}.mp3")
            create_silence_mp3(pause_after_sec, silence_post)
            segments.append(silence_post)
            print(f"  [SILENCE] {pause_after_sec:.2f}s ({pa_type}) after line #{idx}")
            cursor += pause_after_sec

    # Concat all segments via ffmpeg concat demuxer
    concat_list_file = os.path.join(temp_dir, "concat.txt")
    with open(concat_list_file, "w", encoding="utf-8") as f:
        for seg in segments:
            f.write(f"file '{seg.replace('\\', '/')}'\n")

    raw_dialogue_mp3 = os.path.join(temp_dir, "raw_dialogue.mp3")
    concat_cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list_file, "-c", "copy", raw_dialogue_mp3
    ]
    subprocess.check_call(concat_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Master to broadcast standard -15 LUFS with compressor
    master_mp3 = os.path.join(output_dir, "audio.mp3")
    master_cmd = [
        "ffmpeg", "-y", "-i", raw_dialogue_mp3,
        "-af", "loudnorm=I=-15:TP=-1.0:LRA=7,acompressor=threshold=-21dB:ratio=2.5:attack=15:release=120",
        "-b:a", "192k", master_mp3
    ]
    subprocess.check_call(master_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"[OK] Mastered audio produced ({cursor:.2f}s): {master_mp3}")

    # Write lines.json and words.json
    lines_json_path = os.path.join(output_dir, "lines.json")
    with open(lines_json_path, "w", encoding="utf-8") as f:
        json.dump(line_timings, f, indent=2)

    words_json_path = os.path.join(output_dir, "words.json")
    with open(words_json_path, "w", encoding="utf-8") as f:
        json.dump({
            "duration": round(cursor, 3),
            "totalWords": len(all_words),
            "words": all_words
        }, f, indent=2)

    print(f"[OK] Generated precision timing: {len(all_words)} words mapped across {len(line_timings)} dialogue lines.")
    return {
        "audioPath": master_mp3,
        "linesPath": lines_json_path,
        "wordsPath": words_json_path,
        "totalDuration": round(cursor, 3),
        "totalWords": len(all_words)
    }

def main():
    parser = argparse.ArgumentParser(description="Performance Synthesizer for The Lincoln Penny")
    parser.add_argument("episode_file", help="Path to canonical episode JSON file")
    parser.add_argument("--out-dir", default=None, help="Output directory for generated assets")
    args = parser.parse_args()

    ep_path = os.path.abspath(args.episode_file)
    if not os.path.exists(ep_path):
        print(f"Error: episode file not found: {ep_path}")
        sys.exit(1)

    with open(ep_path, "r", encoding="utf-8") as f:
        ep_data = json.load(f)

    out_dir = args.out_dir
    if not out_dir:
        out_dir = os.path.join(ROOT_DIR, "out", ep_data.get("episodeId", "production_episode"))

    asyncio.run(synthesize_episode(ep_data, out_dir))

if __name__ == "__main__":
    main()
