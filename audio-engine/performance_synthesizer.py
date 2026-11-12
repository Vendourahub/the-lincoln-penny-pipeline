#!/usr/bin/env python3
"""
THE LINCOLN PENNY — HIGH-FIDELITY STUDIO VOICE & PERFORMANCE SYNTHESIZER
Implements:
1. Neural Studio Voice Blends:
   - Host: am_adam (50%) + am_puck (30%) + am_michael (20%) [charismatic, inquisitive, comedic timing]
   - Insider: am_onyx (70%) + bm_george (30%) [authoritative, dry, understated deadpan]
2. Actor Performance Directing (conversational punctuation, pitch inflections, colloquial delivery)
3. Groq Whisper Large-v3 High-Precision Forced Alignment (0.01s word boundaries)
4. Full Broadcast Audio DSP Suite:
   - Shure SM7B Vocal Warmth EQ (180Hz proximity boost, 450Hz boxiness cut, 9.5kHz airy presence)
   - Early Studio Reflections (14ms acoustic baffle room simulation)
   - Dynamic Vocal Compression & Leveling
   - Studio Ambient Noise Floor / Room Presence (-46 dB pink room tone)
   - EBU R128 Broadcast Normalization (-15 LUFS)
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

# Performance Speed Mapping
SPEED_MAP = {
    "deadpan_disbelief": 0.94,
    "genuine_curiosity": 1.05,
    "personal_offense": 1.08,
    "delayed_realization": 0.96,
    "dry_understatement": 0.92,
    "matter_of_fact": 0.98,
    "smug_revelation": 1.02,
    "inquisitive_skeptic": 1.04,
}

class PerformanceVoiceDirector:
    def __init__(self, model_path, voices_path):
        import kokoro_onnx
        self.kokoro = kokoro_onnx.Kokoro(model_path, voices_path)
        
        # Build composite persona voice vectors
        print("  [*] Synthesizing vocal persona blends...")
        # Host: Inquisitive podcast lead (Adam 50% + Puck 30% + Michael 20%)
        style_adam = self.kokoro.get_voice_style("am_adam")
        style_puck = self.kokoro.get_voice_style("am_puck")
        style_michael = self.kokoro.get_voice_style("am_michael")
        self.host_voice = style_adam * 0.50 + style_puck * 0.30 + style_michael * 0.20
        
        # Insider: Deadpan corporate insider (Onyx 70% + George 30%)
        style_onyx = self.kokoro.get_voice_style("am_onyx")
        style_george = self.kokoro.get_voice_style("bm_george")
        self.insider_voice = style_onyx * 0.70 + style_george * 0.30
        
    def get_voice(self, speaker):
        if speaker.lower() == "host":
            return self.host_voice
        return self.insider_voice

    def create(self, text, speaker, speed=1.0):
        voice = self.get_voice(speaker)
        return self.kokoro.create(text, voice=voice, speed=speed, lang="en-us")

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

def synthesize_episode(episode_data, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    temp_dir = tempfile.mkdtemp(prefix="lincoln_directing_")

    dialogue = episode_data.get("dialogue", [])
    print(f"[*] Synthesizing {len(dialogue)} dialogue lines with Vocal Performance Engine...")

    director = None
    if os.path.exists(KOKORO_MODEL) and os.path.exists(KOKORO_VOICES):
        try:
            director = PerformanceVoiceDirector(KOKORO_MODEL, KOKORO_VOICES)
            print("[OK] Vocal Persona Blends initialized (Host: Adam+Puck+Michael, Insider: Onyx+George)")
        except Exception as e:
            print(f"[!] Warning: Could not initialize Kokoro persona director ({e}). Falling back to Edge-TTS.")

    segments = []
    line_timings = []
    all_words = []
    cursor = 0.0

    for idx, line in enumerate(dialogue):
        speaker = line.get("speaker", "host").lower()
        clean_text = line.get("text", "")
        # Prioritize performance text for emotion & phrasing
        performance_text = line.get("performanceText", clean_text)
        direction = line.get("performanceDirection", "matter_of_fact")
        speed = SPEED_MAP.get(direction, 1.0)
        pause_val = line.get("pauseAfter", 0.25)
        pause_sec, pause_type = parse_pause(pause_val)

        line_wav = os.path.join(temp_dir, f"line_{idx:03d}.wav")

        if director:
            samples, sr = director.create(performance_text, speaker=speaker, speed=speed)
            sf.write(line_wav, samples, sr)
        else:
            # Edge-TTS fallback
            voice_edge = "en-US-BrianMultilingualNeural" if speaker == "host" else "en-US-AndrewMultilingualNeural"
            import asyncio, edge_tts
            communicate = edge_tts.Communicate(text=performance_text, voice=voice_edge)
            asyncio.run(communicate.save(line_wav))

        line_dur = get_audio_duration(line_wav)
        line_start = round(cursor, 3)
        line_end = round(cursor + line_dur, 3)

        segments.append(line_wav)
        print(f"  Line {idx:02d} [{speaker.upper()}] ({direction}) -> \"{performance_text}\" ({line_dur:.2f}s)")

        # Whisper Forced Alignment
        words = align_line_with_whisper(line_wav, clean_text, speaker, line_start)
        all_words.extend(words)

        cursor += line_dur

        line_timings.append({
            "lineIndex": idx,
            "speaker": speaker,
            "text": clean_text,
            "performanceText": performance_text,
            "performanceDirection": direction,
            "start": line_start,
            "end": line_end,
            "duration": round(line_dur, 3),
            "pauseAfter": pause_val
        })

        # Insert exact silence beat if pause > 0.05
        if pause_sec > 0.05:
            silence_wav = os.path.join(temp_dir, f"silence_{idx:03d}.wav")
            sr = 24000
            silence_samples = np.zeros(int(sr * pause_sec), dtype=np.float32)
            sf.write(silence_wav, silence_samples, sr)
            segments.append(silence_wav)
            print(f"    [Silence] {pause_sec:.2f}s ({pause_type})")
            cursor += pause_sec

    # Mux all segments into seamless dialogue track
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

    total_speech_dur = get_audio_duration(unmastered_wav)

    # Apply Broadcast Studio DSP Chain:
    # 1. Highpass 75Hz (rumble removal)
    # 2. Warm low-shelf EQ at 180Hz (+3.5dB broadcast proximity)
    # 3. Mid scoop at 450Hz (-2.2dB to remove nasal plastic resonance)
    # 4. Air presence at 9.5kHz (+2.8dB)
    # 5. Studio room baffle micro-reflection (aecho 14ms)
    # 6. Dynamic vocal leveling compression
    # 7. EBU R128 loudness normalization (-15 LUFS)
    dsp_wav = os.path.join(temp_dir, "dsp_vocal.wav")
    filter_chain = (
        "highpass=f=75,"
        "equalizer=f=180:width_type=o:w=1.2:g=3.5,"
        "equalizer=f=450:width_type=o:w=1.0:g=-2.2,"
        "equalizer=f=9500:width_type=o:w=1.0:g=2.8,"
        "aecho=0.8:0.8:14:0.08,"
        "acompressor=threshold=-16dB:ratio=3.2:attack=8:release=60:makeup=2.5dB,"
        "loudnorm=I=-15:TP=-1.0:LRA=7"
    )
    subprocess.check_call([
        "ffmpeg", "-y", "-i", unmastered_wav,
        "-af", filter_chain,
        "-ar", "48000",
        dsp_wav
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Generate subtle studio room ambience / presence bed (-46 dB pink room tone)
    # So silences feel like a real physical studio room rather than dead synthetic zero-clipping
    room_wav = os.path.join(temp_dir, "room_bed.wav")
    subprocess.check_call([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"anoisesrc=d={total_speech_dur + 1.0}:c=pink:r=48000:a=0.0035",
        "-af", "lowpass=f=1200,volume=-46dB",
        "-ar", "48000",
        room_wav
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    master_mp3 = os.path.join(output_dir, "audio.mp3")
    print(f"[*] Mixing Studio Room Atmosphere & Mastering -> {master_mp3}")
    subprocess.check_call([
        "ffmpeg", "-y",
        "-i", dsp_wav,
        "-i", room_wav,
        "-filter_complex", "amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-15:TP=-1.0:LRA=7",
        "-c:a", "libmp3lame", "-b:a", "320k", "-ar", "48000",
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
    print(" [OK] VOCAL PERFORMANCE & STUDIO MASTERING COMPLETE")
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
