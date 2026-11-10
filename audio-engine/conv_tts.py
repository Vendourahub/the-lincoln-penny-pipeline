#!/usr/bin/env python3
"""
conv_tts.py — single-line TTS for conversation shorts
Usage: tts-venv/bin/python conv_tts.py "<text>" <output.wav> [voice] [speed]
"""
import sys, os
os.environ.setdefault("OMP_NUM_THREADS", "2")
os.environ.setdefault("ORT_NUM_THREADS", "2")
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.abspath(__file__))
text     = sys.argv[1]
out_path = sys.argv[2]
voice    = sys.argv[3] if len(sys.argv) > 3 else "am_onyx"
speed    = float(sys.argv[4]) if len(sys.argv) > 4 else 1.05

kokoro = Kokoro(
    os.path.join(ROOT, "tts-models", "kokoro-v1.0.onnx"),
    os.path.join(ROOT, "tts-models", "voices-v1.0.bin"),
)
samples, sr = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
sf.write(out_path, samples, sr)
print(f"ok {out_path} {len(samples)/sr:.2f}s")
