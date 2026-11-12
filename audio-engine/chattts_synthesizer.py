#!/usr/bin/env python3
"""
THE LINCOLN PENNY — CHATTTS CONVERSATIONAL AUDIO SYNTHESIZER
End-to-End Conversational Dialogue Generation with:
1. Native Oral Elements: [laugh], [chuckle], [sigh], [breath]
2. Continuous Prosody & Turn-Taking: Generating dialogue as an organic conversational stream
3. Persistent Character Speaker Timbre Seeds (Host vs Insider)
4. Automated Groq Whisper Forced Alignment down to 0.01s precision
5. Broadcast Studio Mastering (SM7B EQ + Room Bed + EBU R128)
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

# Conversational oral mark-up for Costco episode
DEFAULT_CONVERSATIONAL_SCRIPT = [
    {
        "speaker": "insider",
        "text": "Costco charges people just to shop there.",
        "chatText": "Costco charges people just to shop there. [break_2]"
    },
    {
        "speaker": "host",
        "text": "Charges them how?",
        "chatText": "Wait... [chuckle] charges them how? [break_2]"
    },
    {
        "speaker": "insider",
        "text": "Membership. You pay annually.",
        "chatText": "Membership. You pay... annually. [break_2]"
    },
    {
        "speaker": "host",
        "text": "To buy groceries?",
        "chatText": "To buy... groceries?! [break_1]"
    },
    {
        "speaker": "insider",
        "text": "Yeah.",
        "chatText": "Yeah. [break_6]"
    },
    {
        "speaker": "host",
        "text": "...And people agreed?",
        "chatText": "...And people agreed?! [break_7]"
    },
    {
        "speaker": "insider",
        "text": "Millions of them.",
        "chatText": "Millions of them. [break_7]"
    },
    {
        "speaker": "host",
        "text": "I need to start charging people to visit my house.",
        "chatText": "Man... I need to start charging people just to visit my house. [break_3]"
    },
    {
        "speaker": "insider",
        "text": "For what?",
        "chatText": "For... what? [break_2]"
    },
    {
        "speaker": "host",
        "text": "Access.",
        "chatText": "Access. [break_3]"
    },
    {
        "speaker": "insider",
        "text": "To what?",
        "chatText": "To what?! [break_1]"
    },
    {
        "speaker": "host",
        "text": "That's what I'm working on.",
        "chatText": "Look... [laugh] that's what I'm workin' on. [break_5]"
    },
    {
        "speaker": "insider",
        "text": "Anyway... the hot dog is just the bait. In twenty twenty-four, Costco collected four point eight billion dollars purely in membership fees. That card is fifty-two percent of their operating income.",
        "chatText": "Right. Anyway... [break_2] the hot dog is just the bait. In 2024, Costco collected 4.8 billion dollars purely in membership fees. That card is 52 percent of their operating income. [break_3]"
    },
    {
        "speaker": "host",
        "text": "So Costco makes over half their operating profit before anyone buys a single item.",
        "chatText": "So Costco makes over half their operating profit before anyone buys a single item?! [break_2]"
    },
    {
        "speaker": "insider",
        "text": "Costco isn't a grocery store. It's a subscription club that happens to have pallets of paper towels in the back.",
        "chatText": "Costco isn't a grocery store. It's a subscription club that happens to have pallets of paper towels in the back."
    }
]

def align_audio_with_whisper(audio_path, dialogue_lines):
    """
    Runs Groq Whisper Large-v3 with word granularities across the full audio stream
    and groups words into respective dialogue lines.
    """
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        print("[!] GROQ_API_KEY not found. Word-level alignment requires Groq API.")
        return [], []

    from groq import Groq
    client = Groq(api_key=groq_api_key)

    print("[*] Running Groq Whisper Large-v3 forced alignment on master dialogue...")
    with open(audio_path, "rb") as f:
        transcription = client.audio.transcriptions.create(
            file=("dialogue.mp3", f.read()),
            model="whisper-large-v3",
            response_format="verbose_json",
            timestamp_granularities=["word"]
        )

    whisper_words = []
    if hasattr(transcription, "words") and transcription.words:
        for w in transcription.words:
            w_dict = w if isinstance(w, dict) else w.model_dump()
            clean_w = w_dict.get("word", "").strip()
            if clean_w:
                whisper_words.append({
                    "word": clean_w,
                    "start": round(float(w_dict["start"]), 3),
                    "end": round(float(w_dict["end"]), 3)
                })

    print(f"[OK] Aligned {len(whisper_words)} individual spoken words from audio stream.")

    # Associate words to dialogue turns based on sequential matching
    line_timings = []
    word_idx = 0
    num_words = len(whisper_words)

    for l_idx, line in enumerate(dialogue_lines):
        speaker = line.get("speaker", "host")
        expected_words = [w.lower().strip(".,?!\"'—") for w in line["text"].split()]
        line_word_count = len(expected_words)

        start_word_idx = word_idx
        end_word_idx = min(num_words, word_idx + line_word_count)

        if start_word_idx < num_words:
            line_start = whisper_words[start_word_idx]["start"]
            line_end = whisper_words[min(end_word_idx - 1, num_words - 1)]["end"]
            # Tag speaker onto words
            for wi in range(start_word_idx, end_word_idx):
                whisper_words[wi]["speaker"] = speaker
        else:
            line_start = 0.0
            line_end = 0.0

        line_timings.append({
            "lineIndex": l_idx,
            "speaker": speaker,
            "text": line["text"],
            "start": line_start,
            "end": line_end,
            "duration": round(line_end - line_start, 3),
            "pauseAfter": line.get("pauseAfter", 0.3)
        })

        word_idx = end_word_idx

    return line_timings, whisper_words

def master_audio_file(raw_wav, output_mp3):
    """
    Applies the full Lincoln Penny Broadcast DSP Chain:
    - 75Hz highpass
    - 180Hz low-shelf warmth (+3.5dB)
    - 450Hz anti-boxiness scoop (-2.2dB)
    - 9.5kHz airy presence (+2.8dB)
    - 14ms early room reflection
    - Dynamic compressor
    - Subtle room presence bed (-46dB pink noise)
    - EBU R128 (-15 LUFS)
    """
    temp_dir = tempfile.mkdtemp(prefix="lincoln_master_")
    dsp_wav = os.path.join(temp_dir, "dsp.wav")
    room_wav = os.path.join(temp_dir, "room.wav")

    # Get duration
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", raw_wav]
    dur = float(subprocess.check_output(cmd).decode().strip())

    filter_chain = (
        "highpass=f=75,"
        "equalizer=f=180:width_type=o:w=1.2:g=3.5,"
        "equalizer=f=450:width_type=o:w=1.0:g=-2.2,"
        "equalizer=f=9500:width_type=o:w=1.0:g=2.8,"
        "aecho=0.8:0.8:14:0.08,"
        "acompressor=threshold=-16dB:ratio=3.2:attack=8:release=60:makeup=2.5dB,"
        "loudnorm=I=-15:TP=-1.0:LRA=7"
    )

    subprocess.check_call(["ffmpeg", "-y", "-i", raw_wav, "-af", filter_chain, "-ar", "48000", dsp_wav],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    subprocess.check_call(["ffmpeg", "-y", "-f", "lavfi", "-i", f"anoisesrc=d={dur + 1.0}:c=pink:r=48000:a=0.0035",
                           "-af", "lowpass=f=1200,volume=-46dB", "-ar", "48000", room_wav],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    subprocess.check_call([
        "ffmpeg", "-y", "-i", dsp_wav, "-i", room_wav,
        "-filter_complex", "amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-15:TP=-1.0:LRA=7",
        "-c:a", "libmp3lame", "-b:a", "320k", "-ar", "48000",
        output_mp3
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print(f"[OK] Mastered broadcast audio saved to: {output_mp3}")

def generate_chattts_audio(dialogue, out_wav):
    """
    Executes ChatTTS to generate continuous conversational dialogue.
    Runs on CUDA GPU or CPU with torch.
    """
    try:
        import ChatTTS
        import torch
    except ImportError:
        print("[!] ChatTTS and torch must be installed to run this script.")
        print("    Run: pip install ChatTTS torch torchaudio")
        sys.exit(1)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[*] Initializing ChatTTS on device: {device}...")

    chat = ChatTTS.Chat()
    chat.load(compile=False) # compile=False for broad platform compatibility

    # Fixed seeds for Host and Insider
    torch.manual_seed(101)
    spk_host = chat.sample_random_speaker()
    torch.manual_seed(202)
    spk_insider = chat.sample_random_speaker()

    wavs = []
    for item in dialogue:
        speaker = item.get("speaker", "host")
        text = item.get("chatText", item.get("text", ""))
        spk = spk_host if speaker == "host" else spk_insider
        
        params_infer_code = ChatTTS.Chat.InferCodeParams(
            spk_emb=spk,
            temperature=0.3,
            top_P=0.7,
            top_K=20,
        )
        params_refine_text = ChatTTS.Chat.RefineTextParams(
            prompt='[oral_2][laugh_0][break_6]' if '[laugh]' in text else '[oral_2][break_4]'
        )
        print(f"  Generating [{speaker.upper()}]: {text}")
        wav = chat.infer([text], params_refine_text=params_refine_text, params_infer_code=params_infer_code)
        if wav and len(wav) > 0:
            wavs.append(wav[0][0])

    if not wavs:
        print("[!] No audio generated.")
        return False

    combined = np.concatenate(wavs)
    # ChatTTS sampling rate is 24000
    sf.write(out_wav, combined, 24000)
    print(f"[OK] Generated raw ChatTTS audio: {out_wav}")
    return True

def main():
    parser = argparse.ArgumentParser(description="Lincoln Penny ChatTTS Conversational Pipeline")
    parser.add_argument("--episode", help="Path to episode JSON", default=os.path.join(ROOT_DIR, "episodes/costco-hotdog-002.json"))
    parser.add_argument("--out-dir", help="Output directory", default=os.path.join(ROOT_DIR, "motion-engine/public/episodes/costco-hotdog-002"))
    parser.add_argument("--input-audio", help="Provide pre-rendered conversational audio WAV to bypass local inference")
    args = parser.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)
    temp_dir = tempfile.mkdtemp(prefix="lincoln_chattts_")

    dialogue = DEFAULT_CONVERSATIONAL_SCRIPT
    if os.path.exists(args.episode):
        with open(args.episode, "r", encoding="utf-8") as f:
            ep_data = json.load(f)
            if "dialogue" in ep_data:
                dialogue = ep_data["dialogue"]

    raw_wav = args.input_audio or os.path.join(temp_dir, "chattts_raw.wav")
    if not args.input_audio:
        success = generate_chattts_audio(dialogue, raw_wav)
        if not success:
            sys.exit(1)

    master_mp3 = os.path.join(args.out_dir, "audio.mp3")
    master_audio_file(raw_wav, master_mp3)

    lines_json = os.path.join(args.out_dir, "lines.json")
    words_json = os.path.join(args.out_dir, "words.json")

    line_timings, words = align_audio_with_whisper(master_mp3, dialogue)
    with open(lines_json, "w", encoding="utf-8") as f:
        json.dump(line_timings, f, indent=2)
    with open(words_json, "w", encoding="utf-8") as f:
        json.dump({"words": words}, f, indent=2)

    print("\n================================================================")
    print(" [OK] CONVERSATIONAL AUDIO SYNTHESIS & ALIGNMENT COMPLETE")
    print("================================================================")

if __name__ == "__main__":
    main()
