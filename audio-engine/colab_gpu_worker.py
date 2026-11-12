"""
THE LINCOLN PENNY — GOOGLE COLAB / REMOTE GPU AUDIO WORKER (V2 FIXED)
Run this on Google Colab (Free T4 GPU) or your remote GPU server.

Fixes:
1. Squeezes/flattens wav arrays to prevent 0D concatenation errors
2. Normalizes numbers (2024 -> twenty twenty-four) and special characters (?, !, ') for ChatTTS tokenizer
"""

# Cell 1: Install Dependencies
# !pip install -q ChatTTS soundfile numpy

import torch
import numpy as np
import soundfile as sf
from google.colab import files
import ChatTTS

print("CUDA Status:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("Using GPU:", torch.cuda.get_device_name(0))

print("[*] Initializing ChatTTS on GPU...")
chat = ChatTTS.Chat()
chat.load(compile=False)

# Fixed speaker seeds for character consistency
torch.manual_seed(42)
spk_host = chat.sample_random_speaker()

torch.manual_seed(99)
spk_insider = chat.sample_random_speaker()

# Script with normalized text for ChatTTS tokenizer and conversational oral markers
dialogue = [
    ("insider", "Costco charges people just to shop there. [break_2]"),
    ("host",    "Wait, [chuckle] charges them how, [break_2]"),
    ("insider", "Membership. You pay annually. [break_2]"),
    ("host",    "To buy groceries, [break_1]"),
    ("insider", "Yeah. [break_6]"),
    ("host",    "And people agreed, [break_7]"),
    ("insider", "Millions of them. [break_7]"),
    ("host",    "Man, I need to start charging people just to visit my house. [break_3]"),
    ("insider", "For what, [break_2]"),
    ("host",    "Access. [break_3]"),
    ("insider", "To what, [break_1]"),
    ("host",    "Look, [laugh] thats what Im workin on. [break_5]"),
    ("insider", "Right. Anyway, [break_2] the hot dog is just the bait. In twenty twenty-four, Costco collected four point eight billion dollars purely in membership fees. That card is fifty-two percent of their operating income. [break_3]"),
    ("host",    "So Costco makes over half their operating profit before anyone buys a single item, [break_2]"),
    ("insider", "Costco isnt a grocery store. Its a subscription club that happens to have pallets of paper towels in the back.")
]

wavs = []
for speaker, text in dialogue:
    spk = spk_host if speaker == "host" else spk_insider
    params_infer = ChatTTS.Chat.InferCodeParams(spk_emb=spk, temperature=0.3, top_P=0.7, top_K=20)
    params_refine = ChatTTS.Chat.RefineTextParams(
        prompt='[oral_2][laugh_0][break_6]' if ('[laugh]' in text or '[chuckle]' in text) else '[oral_2][break_4]'
    )
    print(f"Synthesizing [{speaker.upper()}]: {text}")
    res = chat.infer([text], params_refine_text=params_refine, params_infer_code=params_infer)
    if res and len(res) > 0:
        wav_data = np.array(res[0], dtype=np.float32).flatten()
        wavs.append(wav_data)

out_wav = "costco_conversational_raw.wav"
combined = np.concatenate(wavs)
sf.write(out_wav, combined, 24000)
print(f"\n[DONE] Generated {len(combined)/24000:.2f}s of conversational dialogue.")

# Automatically download to your PC
files.download(out_wav)
