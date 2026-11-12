#!/usr/bin/env python3
"""
THE LINCOLN PENNY — HIGH-FIDELITY STUDIO VOICE & PERFORMANCE SYNTHESIZER
Implements:
1. Kokoro v1.0 Offline Neural Studio Voices (Host: am_adam, Insider: am_onyx)
2. Groq Whisper Large-v3 High-Precision Forced Word Alignment
3. Intentional Comedic Silence Injection (1.2s processing, 2.0s deadpan hold, 1.0s comedic beat)
4. Fallback to Azure Neural (Edge-TTS) if Kokoro models are absent
5. EBU R128 Broadcast Audio Normalization to -15 LUFS
"""

import os
import sys
import json
import argparse
import subprocess
import tempfile
import numpy as np
import soundfile as sf

ROOT_DIR = os.environ.get("LINCOLN_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
KOKORO_MODEL = os.path.join(ROOT_DIR, "audio-engine", "tts-models", "kokoro-v1.0.onnx")
KOKORO_VOICES = os.path.join(ROOT_DIR, "audio-engine", "tts-models", "voices-v1.0.bin")

# Kokoro Voice Mapping
KOKORO_VOICE_MAP = {
    "host": "am_adam",       # Natural, charismatic, inquisitive podcast host
    "insider": "am_onyx",     # Deep, authoritative, deadpan corporate insider
    "guest": "am_onyx"
}

# Performance Speed Mapping
SPEED_MAP = {
    "deadpan_disbelief": 0.96,
    "genuine_curiosity": 1.06,
    "personal_offense": 1.08,
    "delayed_realization": 0.98,
    "dry_understatement": 0.95,
    "matter_of_fact": 1.02,
    "smug_revelation": 1.04,
    "inquisitive_skeptic": 1.05,
}

def get_kokoro_instance():
    if os.path.exists(KOKORO_MODEL) and os.path.exists(KOKORO_VOICES):
        try:
            from kokoro_onnx import Kokoro
            return Kokoro(KOKORO_MODEL, KOKORO_VOICES)
        except Exception as e:
            print(f"[!] Warning: Could not initialize Kokoro ({e}). Falling back to Edge-TTS.")
            return None
    return None

def align_line_with_whisper(wav_path, line_text, speaker, line_start_sec):
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_api_key)
            with open(wav_path, "rb") as f:
                transcription = client.audio.transcriptions.create(
                    file=("line.wav", f.read()),
                    model="whisper-large-v3",
                    response_format="verbose_json",
                    timestamp_granularities=["word"]
                )
            if hasattr(transcription, "words") and transcription.words:
                words_list = []
                for w in transcription.words:
                    w_dict = w if isinstance(w, dict) else w.model_dump()
                    clean_word = w_dict.get("word", "").strip()
                    if clean_word:
                        words_list.append({
                            "word": clean_word,
                            "start": round(line_start_sec + float(w_dict["start"]), 3),
                            "end": round(line_start_sec + float(w_dict["end"]), 3),
                            "speaker": speaker
                        })
                if words_list:
                    return words_list
        except Exception as e:
            print(f"    [!] Groq Whisper alignment warning: {e}. Using phonetic allocation.")

    # High-accuracy fallback proportional allocation
    raw_words = line_text.strip().split()
    cleaned_words = [w.strip() for w in raw_words if w.strip()]
    if not cleaned_words:
        return []

    duration = get_audio_duration(wav_path)
    weights = [max(1, len(w.replace("...", "").replace(",", "").replace(".", ""))) for w in cleaned_words]
    total_w = sum(weights)
    alignments = []
    curr = line_start_sec
    for i, w in enumerate(cleaned_words):
        w_dur = (weights[i] / total_w) * duration
        alignments.append({
            "word": w,
            "start": round(curr, 3),
            "end": round(curr + w_dur, 3),
            "speaker": speaker
        })
        curr += w_dur
    return alignments

def get_audio_duration(file_path):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path
    ]
    out = subprocess.check_output(cmd).decode("utf-8").strip()
    return float(out)

def parse_pause(val, default_sec=0.20):
    if val is None:
        return default_sec, "natural_turn"
    if isinstance(val, (int, float)):
        return float(val), "explicit"
    if isinstance(val, dict):
        return float(val.get("duration", default_sec)), val.get("type", "explicit")
    return default_sec, "natural_turn"

def synthesize_episode(episode_data, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    temp_dir = tempfile.mkdtemp(prefix="lincoln_kokoro_")

    dialogue = episode_data.get("dialogue", [])
    print(f"[*] Synthesizing {len(dialogue)} dialogue lines with High-Fidelity Neural Voices...")

    kokoro = get_kokoro_instance()
    is_kokoro = kokoro is not None
    if is_kokoro:
        print("[OK] Engine: Kokoro v1.0 Studio Neural Voices (Host: am_adam, Insider: am_onyx)")
    else:
        print("[!] Engine: Microsoft Edge Neural TTS fallback")

    segments = []
    line_timings = []
    all_words = []
    cursor = 0.0

    for idx, line in enumerate(dialogue):
        speaker = line.get("speaker", "host").lower()
        text = line.get("text", "")
        direction = line.get("performanceDirection", "matter_of_fact")
        speed = SPEED_MAP.get(direction, 1.02)
        pause_val = line.get("pauseAfter", 0.25)
        pause_sec, pause_type = parse_pause(pause_val)

        line_wav = os.path.join(temp_dir, f"line_{idx:03d}.wav")

        if is_kokoro:
            voice_name = KOKORO_VOICE_MAP.get(speaker, "am_adam")
            samples, sr = kokoro.create(text, voice=voice_name, speed=speed)
            sf.write(line_wav, samples, sr)
        else:
            # Edge-TTS fallback
            voice_edge = "en-US-GuyNeural" if speaker == "host" else "en-US-ChristopherNeural"
            import asyncio, edge_tts
            communicate = edge_tts.Communicate(text=text, voice=voice_edge)
            asyncio.run(communicate.save(line_wav))

        line_dur = get_audio_duration(line_wav)
        line_start = round(cursor, 3)
        line_end = round(cursor + line_dur, 3)

        segments.append(line_wav)
        print(f"  Line {idx:02d} [{speaker.upper()}] ({direction}) -> {line_dur:.2f}s")

        # Whisper Forced Alignment
        words = align_line_with_whisper(line_wav, text, speaker, line_start)
        all_words.extend(words)

        cursor += line_dur

        line_timings.append({
            "lineIndex": idx,
            "speaker": speaker,
            "text": text,
            "performanceDirection": direction,
            "start": line_start,
            "end": line_end,
            "duration": round(line_dur, 3),
            "pauseAfter": pause_val
        })

        # Insert exact silence beat if pause > 0.05
        if pause_sec > 0.05:
            silence_wav = os.path.join(temp_dir, f"silence_{idx:03d}.wav")
            # Generate pure silence wave
            sr = 24000
            silence_samples = np.zeros(int(sr * pause_sec), dtype=np.float32)
            sf.write(silence_wav, silence_samples, sr)
            segments.append(silence_wav)
            print(f"    [Silence] {pause_sec:.2f}s ({pause_type})")
            cursor += pause_sec

    # Mux all segments into seamless master track with -15 LUFS broadcast mastering
    concat_list = os.path.join(temp_dir, "concat.txt")
    with open(concat_list, "w", encoding="utf-8") as f:
        for seg in segments:
            f.write(f"file '{seg.replace(chr(92), '/')}'\n")

    unmastered_wav = os.path.join(temp_dir, "unmastered.wav")
    subprocess.check_call([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list,
        "-c:a", "pcm_s16le", "-ar", "24000", "-ac", "1",
        unmastered_wav
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    master_mp3 = os.path.join(output_dir, "audio.mp3")
    print(f"[*] Mastering dialogue to EBU R128 (-15 LUFS) -> {master_mp3}")
    subprocess.check_call([
        "ffmpeg", "-y", "-i", unmastered_wav,
        "-af", "loudnorm=I=-15:TP=-1.0:LRA=7",
        "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "48000",
        master_mp3
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    lines_json = os.path.join(output_dir, "lines.json")
    with open(lines_json, "w", encoding="utf-8") as f:
        json.dump(line_timings, f, indent=2)

    words_json = os.path.join(output_dir, "words.json")
    with open(words_json, "w", encoding="utf-8") as f:
        json.dump({"words": all_words}, f, indent=2)

    total_dur = get_audio_duration(master_mp3)
    print("\n================================================================")
    print(" [OK] HIGH-FIDELITY PERFORMANCE SYNTHESIS COMPLETE")
    print("================================================================")
    print(f" Total Master Duration: {total_dur:.2f} seconds ({len(all_words)} aligned words)")
    print(f" Master Audio:          {master_mp3}")
    print(f" Shot Alignment Data:   {lines_json}")
    print(f" Precision Viseme Map:  {words_json}")
    print("================================================================\n")

def main():
    parser = argparse.ArgumentParser(description="Lincoln Penny Voice & Performance Synthesizer")
    parser.add_argument("episode", help="Path to episode JSON specification")
    parser.add_argument("--out", "-o", help="Custom output directory")
    args = parser.parse_args()

    if not os.path.exists(args.episode):
        sys.exit(f"Episode file not found: {args.episode}")

    with open(args.episode, "r", encoding="utf-8") as f:
        episode_data = json.load(f)

    ep_id = episode_data.get("episodeId", "unnamed-episode")
    out_dir = args.out or os.path.join(ROOT_DIR, "out", ep_id)
    synthesize_episode(episode_data, out_dir)

if __name__ == "__main__":
    main()
