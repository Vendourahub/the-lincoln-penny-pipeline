"""
THE LINCOLN PENNY — GOOGLE COLAB / REMOTE GPU AUDIO WORKER
Run this on Google Colab (Free T4 GPU) or your remote GPU server.

Steps for Google Colab:
1. Open a new Colab notebook: https://colab.research.google.com
2. Change Runtime to GPU: Runtime -> Change runtime type -> T4 GPU
3. Paste and run this script.
4. Download the generated 'costco_conversational_raw.wav' and place it in the pipeline!
"""

# Cell 1: Install Dependencies
# !pip install -q ChatTTS torch torchaudio soundfile numpy

import torch
import numpy as np
import soundfile as sf

print("CUDA Available:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))

import ChatTTS
chat = ChatTTS.Chat()
chat.load(compile=False)

# Fixed speaker seeds for character consistency
torch.manual_seed(42)
spk_host = chat.sample_random_speaker()

torch.manual_seed(99)
spk_insider = chat.sample_random_speaker()

# Script with conversational markers, chuckles, pauses, and oral nuances
dialogue = [
    ("insider", "Costco charges people just to shop there. [break_2]"),
    ("host", "Wait... [chuckle] charges them how? [break_2]"),
    ("insider", "Membership. You pay... annually. [break_2]"),
    ("host", "To buy... groceries?! [break_1]"),
    ("insider", "Yeah. [break_6]"),
    ("host", "...And people agreed?! [break_7]"),
    ("insider", "Millions of them. [break_7]"),
    ("host", "Man... I need to start charging people just to visit my house. [break_3]"),
    ("insider", "For... what? [break_2]"),
    ("host", "Access. [break_3]"),
    ("insider", "To what?! [break_1]"),
    ("host", "Look... [laugh] that's what I'm workin' on. [break_5]"),
    ("insider", "Right. Anyway... [break_2] the hot dog is just the bait. In 2024, Costco collected 4.8 billion dollars purely in membership fees. That card is 52 percent of their operating income. [break_3]"),
    ("host", "So Costco makes over half their operating profit before anyone buys a single item?! [break_2]"),
    ("insider", "Costco isn't a grocery store. It's a subscription club that happens to have pallets of paper towels in the back.")
]

wavs = []
for speaker, text in dialogue:
    spk = spk_host if speaker == "host" else spk_insider
    params_infer = ChatTTS.Chat.InferCodeParams(spk_emb=spk, temperature=0.3, top_P=0.7, top_K=20)
    params_refine = ChatTTS.Chat.RefineTextParams(
        prompt='[oral_2][laugh_0][break_6]' if '[laugh]' in text or '[chuckle]' in text else '[oral_2][break_4]'
    )
    print(f"Synthesizing [{speaker}]: {text}")
    res = chat.infer([text], params_refine_text=params_refine, params_infer_code=params_infer)
    if res and len(res) > 0:
        wavs.append(res[0][0])

out_wav = "costco_conversational_raw.wav"
combined = np.concatenate(wavs)
sf.write(out_wav, combined, 24000)
print(f"\n[DONE] Saved: {out_wav} ({len(combined)/24000:.2f}s)")
print("You can now download this file and pass it to the pipeline!")
