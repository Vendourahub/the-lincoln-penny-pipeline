#!/usr/bin/env python3
"""
Gemini Dual-Voice Podcast Synthesizer with Precision Alignment
Replaces Kokoro with Gemini 2.5 Flash TTS (Puck = Host, Charon = Insider/Guest)
"""

import os, sys, json, re, subprocess, wave
import numpy as np
from google import genai
from google.genai import types
from faster_whisper import WhisperModel

ROOT = os.environ.get("LINCOLN_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def main():
    dialogue = [
        {"speaker": "host", "voice": "Puck", "text": "Our last video about McDonald's blew up, and the comments are fighting over Ray Kroc. But almost nobody knows where their money actually comes from."},
        {"speaker": "guest", "voice": "Charon", "text": "Because McDonald's isn't a burger chain. They're a thirty billion dollar real estate empire."},
        {"speaker": "host", "voice": "Puck", "text": "Wait... what? They sell burgers!"},
        {"speaker": "guest", "voice": "Charon", "text": "The burgers are just the bait. Ray Kroc's genius was buying the physical land under every restaurant. If a franchisee wants to sell fries, they have to pay McDonald's rent first."},
        {"speaker": "host", "voice": "Puck", "text": "So they make more from rent than burgers?"},
        {"speaker": "guest", "voice": "Charon", "text": "Eighty percent of their profit is pure rent and franchise royalties. McDonald's is a real estate monopoly in disguise."},
        {"speaker": "host", "voice": "Puck", "text": "Which is why our last video was only the beginning."}
    ]

    out_dir = os.path.join(ROOT, "out", "mcdonalds-part2-gemini-short")
    os.makedirs(out_dir, exist_ok=True)

    # Load Gemini API key from .env if present
    env_file = os.path.join(ROOT, ".env")
    if os.path.exists(env_file):
        for line in open(env_file):
            if line.startswith('GEMINI_API_KEY='):
                os.environ['GEMINI_API_KEY'] = line.strip().split('=', 1)[1]

    print("[*] Initializing Gemini GenAI Client for Podcast Voices...")
    client = genai.Client()

    SR = 24000
    audio_parts = []
    line_timings = []
    cursor = 0.0
    turn_pause = np.zeros(int(SR * 0.16), dtype=np.float32)

    for i, line in enumerate(dialogue):
        spk = line["speaker"]
        voice = line["voice"]
        txt = line["text"]
        print(f"  [{i+1}/{len(dialogue)}] Synthesizing {spk.upper()} ({voice}): \"{txt[:40]}...\"")

        # Call Gemini TTS
        response = client.models.generate_content(
            model='gemini-2.5-flash-preview-tts',
            contents=txt,
            config=types.GenerateContentConfig(
                response_modalities=['AUDIO'],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice)
                    )
                )
            )
        )

        raw_bytes = response.candidates[0].content.parts[0].inline_data.data
        # Raw bytes are 16-bit PCM little-endian at 24000 Hz
        samples = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0

        dur = len(samples) / SR
        line_timings.append({
            "line_index": i,
            "speaker": spk,
            "text": txt,
            "start": round(cursor, 3),
            "end": round(cursor + dur, 3),
            "duration": round(dur, 3)
        })

        audio_parts.append(samples)
        audio_parts.append(turn_pause)
        cursor += dur + 0.16

    combined_samples = (np.concatenate(audio_parts) * 32767.0).clip(-32768, 32767).astype(np.int16)
    raw_wav_path = os.path.join(out_dir, "raw_dialogue.wav")
    with wave.open(raw_wav_path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(combined_samples.tobytes())
    print(f"[OK] Combined raw audio rendered: {cursor:.2f}s -> {raw_wav_path}")

    # Master audio with ffmpeg (-15 LUFS, light compression)
    master_mp3 = os.path.join(out_dir, "audio.mp3")
    cmd = [
        "ffmpeg", "-y", "-i", raw_wav_path,
        "-af", "loudnorm=I=-15:TP=-1.0:LRA=7,acompressor=threshold=-21dB:ratio=2.5:attack=15:release=120",
        "-b:a", "192k", master_mp3
    ]
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"[OK] Mastered podcast audio written: {master_mp3}")

    # Precision Word Alignment using Whisper
    print("[*] Running precision word-level alignment on Gemini audio...")
    whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
    segments, info = whisper_model.transcribe(master_mp3, word_timestamps=True, language="en")

    words_out = []
    for seg in segments:
        for w in (seg.words or []):
            word_clean = w.word.strip()
            if not word_clean:
                continue
            # Attribute speaker based on line_timings
            spk = "host"
            w_mid = (w.start + w.end) / 2.0
            for lt in line_timings:
                if lt["start"] <= w_mid <= lt["end"] + 0.2:
                    spk = lt["speaker"]
                    break

            words_out.append({
                "word": word_clean,
                "start": round(w.start, 2),
                "end": round(w.end, 2),
                "speaker": spk
            })

    # Save lines.json and words.json
    with open(os.path.join(out_dir, "lines.json"), "w", encoding="utf-8") as f:
        json.dump(line_timings, f, indent=2)

    with open(os.path.join(out_dir, "words.json"), "w", encoding="utf-8") as f:
        json.dump({"duration": round(cursor, 2), "words": words_out}, f, indent=2)

    print(f"[OK] Alignment complete: {len(words_out)} words mapped with speaker tags.")
    print(f"[OK] Artifacts ready in: {out_dir}")

if __name__ == "__main__":
    main()
