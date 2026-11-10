#!/usr/bin/env python3
"""
Stage 04 — TTS. Turn a Line Item script into narration audio with Kokoro (CPU, offline).

    tts-venv/bin/python tts.py <slug> [voice] [speed]

Reads models/<slug>.script.json, synthesizes each beat (sentence-chunked, with pauses
between sentences and beats), writes out/<slug>.mp3. Runs CPU-only, thread-limited so the
live Obairawo stream on this box is not starved.
"""
import os, sys, json, re, subprocess, tempfile, base64, time, urllib.request, urllib.error

# keep onnxruntime from grabbing every core (protects the live stream)
os.environ.setdefault("OMP_NUM_THREADS", "2")
os.environ.setdefault("ORT_NUM_THREADS", "2")

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.abspath(__file__))
# load .env (for GROQ_API_KEY, used by Whisper caption alignment)
_envf = os.path.join(ROOT, ".env")
if os.path.exists(_envf):
    for _l in open(_envf):
        _m = re.match(r"^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$", _l)
        if _m and _m.group(1) not in os.environ:
            os.environ[_m.group(1)] = _m.group(2)
slug = (sys.argv[1] if len(sys.argv) > 1 else "").strip()
ENGINE = os.environ.get("TTS_ENGINE", "kokoro").lower()   # "kokoro" (free/offline, default) | "gemini" (expressive, billing-gated)
_default_voice = "Charon" if ENGINE == "gemini" else "am_onyx"   # am_onyx: deep, authoritative narrator
voice = sys.argv[2] if len(sys.argv) > 2 else _default_voice
speed = float(sys.argv[3]) if len(sys.argv) > 3 else (1.0 if ENGINE == "gemini" else 1.13)  # brisker = higher retention
if not slug:
    sys.exit("usage: python tts.py <slug> [voice] [speed]")

script_path = os.path.join(ROOT, "models", slug + ".script.json")
if not os.path.exists(script_path):
    sys.exit(f"  no script at {script_path} — run script.js {slug} first")
data = json.load(open(script_path, encoding="utf-8"))
beats = data.get("beats", [])

SR = 24000
kokoro = None
if ENGINE == "kokoro":
    kokoro = Kokoro(os.path.join(ROOT, "tts-models", "kokoro-v1.0.onnx"),
                    os.path.join(ROOT, "tts-models", "voices-v1.0.bin"))

def sentences(text):
    parts = re.split(r'(?<=[.!?])\s+', (text or "").strip())
    return [p.strip() for p in parts if p.strip()]

from num2words import num2words
def _money_words(raw):
    s = raw.replace(",", "")
    if "." in s:
        dollars, cents = s.split(".", 1); cents = (cents + "00")[:2]
        d, c = int(dollars or 0), int(cents)
    else:
        d, c = int(s), 0
    parts = []
    if d > 0 or c == 0:
        parts.append(num2words(d) + (" dollar" if d == 1 else " dollars"))
    if c > 0:
        if d > 0: parts.append("and")
        parts.append(num2words(c) + (" cent" if c == 1 else " cents"))
    return " ".join(parts)
def _pct_words(raw):
    if "." in raw:
        i, f = raw.split(".", 1)
        return num2words(int(i)) + " point " + " ".join(num2words(int(x)) for x in f) + " percent"
    return num2words(int(raw)) + " percent"
def spoken(text):
    """Expand currency/percent so the TTS says 'three dollars and fifty cents', not 'dollar 3'."""
    text = re.sub(r'\$\s?([0-9][0-9,]*(?:\.[0-9]+)?)', lambda m: _money_words(m.group(1)), text)
    text = re.sub(r'([0-9]+(?:\.[0-9]+)?)\s?%', lambda m: _pct_words(m.group(1)), text)
    return text

def silence(seconds):
    return np.zeros(int(SR * seconds), dtype=np.float32)

# ---- Gemini TTS (expressive, directable) ---------------------------------
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"
# Delivery direction — this is the "energy" lever (brisk, confident, lands on numbers).
DIRECTIVE = os.environ.get("TTS_DIRECTIVE") or ("Narrate as a sharp, confident business-documentary host — brisk and energetic with real "
             "momentum, credible and authoritative (never hype), landing hard on the key numbers and "
             "taking a short dramatic pause just before each big reveal. Read:\n")
_last_gem = [0.0]
def gemini_say(text, gap=7.0):
    """Synthesize one chunk via Gemini TTS -> float32 mono @24kHz. Paced + retried."""
    body = json.dumps({
        "contents": [{"parts": [{"text": DIRECTIVE + text}]}],
        "generationConfig": {"responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}},
    }).encode()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_TTS_MODEL}:generateContent?key={GEMINI_KEY}"
    for attempt in range(4):
        wait = gap - (time.time() - _last_gem[0])
        if wait > 0: time.sleep(wait)
        _last_gem[0] = time.time()
        try:
            req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
            resp = json.loads(urllib.request.urlopen(req, timeout=120).read())
            part = resp["candidates"][0]["content"]["parts"][0]
            pcm = base64.b64decode(part["inlineData"]["data"])
            return (np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0)
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(10 * (attempt + 1)); continue
            raise RuntimeError(f"Gemini TTS HTTP {e.code}: {e.read()[:200].decode(errors='ignore')}")
        except Exception as e:
            if attempt == 3: raise
            time.sleep(4)
    raise RuntimeError("Gemini TTS: exhausted retries")

# ---- narrator consistency gate -----------------------------------------
# Gemini's "same" voice drifts run to run (median pitch measured 98-130 Hz for one voice). Accept a take only if its
# median pitch sits in the approved deep band and it has no high-pitched squeal, otherwise retry; after the retries the
# caller falls back to Kokoro, so every video has the same kind of narrator.
VOICE_BAND = (float(os.environ.get("VOICE_F0_MIN", "80")), float(os.environ.get("VOICE_F0_MAX", "108")))
VOICE_P90_MAX = float(os.environ.get("VOICE_P90_MAX", "175"))
def voice_f0_stats(x, sr=24000):
    hop, win = int(0.05 * sr), int(0.04 * sr); f = []
    for i in range(0, len(x) - win, hop):
        w = x[i:i + win]
        if np.sqrt(np.mean(w ** 2)) < 0.02: continue
        w = w - w.mean(); ac = np.correlate(w, w, "full")[len(w) - 1:]; lo, hi = int(sr / 300), int(sr / 70)
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.35 * ac[0]: f.append(sr / k)
    if len(f) < 20: return None
    return float(np.median(f)), float(np.percentile(f, 90))
def voice_ok(x):
    st_ = voice_f0_stats(x)
    if st_ is None: return True, 0.0, 0.0           # too little voiced audio to judge; do not block
    med, p90 = st_
    return (VOICE_BAND[0] <= med <= VOICE_BAND[1] and p90 <= VOICE_P90_MAX), med, p90

chunks = []
captions = []          # [{start,end,text}] in seconds — perfectly synced, for burned-in subtitles
clock = 0.0            # running audio time in seconds
total_sent = sum(len(sentences(b.get("narration", ""))) for b in beats)
done = 0
def add_captions(text, start, dur):
    """Coarse proportional 2-word captions across `dur` (Whisper re-aligns these precisely later)."""
    groups = []
    for s in sentences(text):
        w = s.split()
        gs = [w[i:i+2] for i in range(0, len(w), 2)]
        if len(gs) >= 2 and len(gs[-1]) == 1: gs[-2] += gs[-1]; gs.pop()
        groups += gs
    ntot = sum(len(g) for g in groups) or 1
    tcur = start
    for g in groups:
        span = dur * (len(g) / ntot)
        captions.append({"start": round(tcur, 3), "end": round(tcur + span, 3), "text": " ".join(g)})
        tcur += span

if ENGINE == "gemini":
    for bi, b in enumerate(beats):
        text = (b.get("narration", "") or "").strip()
        if not text: continue
        sys.stderr.write(f"\r  Gemini TTS ({voice}) beat {bi+1}/{len(beats)} …   "); sys.stderr.flush()
        samples = None; tries = []
        for _try in range(4):
            cand = gemini_say(spoken(text)); ok, med, p90 = voice_ok(cand); tries.append({"median_hz": round(med), "p90_hz": round(p90), "accepted": bool(ok)})
            sys.stderr.write(f"\n  voice take {_try+1}: median {med:.0f} Hz, p90 {p90:.0f} Hz -> {'accepted' if ok else 'REJECTED (voice drift)'}\n")
            if ok: samples = cand; break
        try: json.dump(tries, open(os.path.join(ROOT, "models", slug + ".voice_check.json"), "w"))
        except Exception: pass
        if samples is None: raise RuntimeError("voice drift: no Gemini take landed in the approved band after 4 tries; falling back to Kokoro")
        start = clock; chunks.append(samples); dur = len(samples) / SR; clock += dur
        add_captions(text, start, dur)
        chunks.append(silence(0.42)); clock += 0.42       # beat boundary
    sys.stderr.write("\r" + " " * 48 + "\r")
else:
    for bi, b in enumerate(beats):
        for s in sentences(b.get("narration", "")):
            samples, sr = kokoro.create(spoken(s), voice=voice, speed=speed, lang="en-us")
            samples = np.asarray(samples, dtype=np.float32)
            start = clock
            chunks.append(samples); sent_dur = len(samples) / SR; clock += sent_dur
            add_captions(s, start, sent_dur)
            chunks.append(silence(0.18)); clock += 0.18   # breath between sentences
            done += 1
            sys.stderr.write(f"\r  synthesizing {done}/{total_sent} sentences …   "); sys.stderr.flush()
        chunks.append(silence(0.45)); clock += 0.45       # longer beat boundary
    sys.stderr.write("\r" + " " * 48 + "\r")

def srt_ts(t):
    h = int(t // 3600); m = int((t % 3600) // 60); s = int(t % 60); ms = int(round((t - int(t)) * 1000))
    return "%02d:%02d:%02d,%03d" % (h, m, s, ms)
def ass_ts(t):
    h = int(t // 3600); m = int((t % 3600) // 60); s = t % 60
    return "%d:%02d:%05.2f" % (h, m, s)
ASS_HEADER = ("[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 0\n\n"
    "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
    "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, "
    "MarginL, MarginR, MarginV, Encoding\n"
    "Style: Cap,DejaVu Sans,60,&H00FFFFFF,&H00FFFFFF,&H00000000,&HA0141A0F,-1,0,0,0,100,100,0,0,4,3,0,2,120,120,150,1\n\n"
    "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, Effect, Text\n")

def write_captions(caps):
    json.dump(caps, open(os.path.join(ROOT, "models", slug + ".captions.json"), "w"), indent=2)
    with open(os.path.join(ROOT, "models", slug + ".srt"), "w", encoding="utf-8") as f:
        for i, c in enumerate(caps, 1):
            f.write("%d\n%s --> %s\n%s\n\n" % (i, srt_ts(c["start"]), srt_ts(c["end"]), c["text"]))
    with open(os.path.join(ROOT, "models", slug + ".ass"), "w", encoding="utf-8") as f:
        f.write(ASS_HEADER)
        for c in caps:
            f.write("Dialogue: 0,%s,%s,Cap,,0,0,,%s\n" % (ass_ts(c["start"]), ass_ts(c["end"]), c["text"].replace("\n", " ")))

def group_words(words):
    """words: [{'text','start','end'}] -> 2-word caption chunks (merge trailing single -> up to 3)."""
    caps = []
    i = 0
    while i < len(words):
        g = words[i:i+2]
        # merge a lone trailing word into the previous chunk
        if i + 2 == len(words) - 1:
            g = words[i:i+3]; i += 3
        else:
            i += 2
        if not g: break
        caps.append({"start": round(g[0]["start"], 3), "end": round(g[-1]["end"], 3),
                     "text": " ".join(w["text"].strip() for w in g).strip()})
    return caps

def whisper_align(mp3):
    """Real word-level timings from faster-whisper (local 0$) or Groq Whisper -> smooth captions. Returns caps or None."""
    # ZERO-COST: try local faster-whisper first (offline, no API)
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel("small", device="cpu", compute_type="int8")
        segments, info = model.transcribe(mp3, word_timestamps=True, vad_filter=True)
        words = []
        for seg in segments:
            for w in (seg.words or []):
                words.append({"text": w.word.strip(), "start": float(w.start), "end": float(w.end)})
        if len(words) >= 5:
            return group_words(words)
    except Exception as e:
        sys.stderr.write(f"  (local Whisper skip: {e})\n")
        pass
    if os.environ.get("ZERO_COST") == "1":
        return None

    key = os.environ.get("GROQ_API_KEY")
    if not key:
        return None
    try:
        out = subprocess.run(["curl", "-s", "--max-time", "120",
            "https://api.groq.com/openai/v1/audio/transcriptions",
            "-H", "Authorization: Bearer " + key,
            "-F", "file=@" + mp3,
            "-F", "model=whisper-large-v3-turbo",
            "-F", "response_format=verbose_json",
            "-F", "timestamp_granularities[]=word"], capture_output=True, text=True, timeout=140)
        data = json.loads(out.stdout)
        words = data.get("words") or []
        words = [{"text": w.get("word", ""), "start": float(w["start"]), "end": float(w["end"])}
                 for w in words if "start" in w and "end" in w]
        if len(words) < 5:
            return None
        return group_words(words)
    except Exception as e:
        sys.stderr.write("  (whisper align skipped: %s)\n" % e)
        return None

# 1) write proportional captions first (guaranteed fallback)
write_captions(captions)

# 2) build audio + mp3
audio = np.concatenate(chunks) if chunks else silence(0.5)
dur = len(audio) / SR
with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
    wav_path = tf.name
sf.write(wav_path, audio, SR)
mp3_path = os.path.join(ROOT, "out", slug + ".mp3")
os.makedirs(os.path.dirname(mp3_path), exist_ok=True)
# voice mastering: de-rumble, tame mud, add presence, even out levels (final loudness done in render.js)
MASTER = ("highpass=f=85,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3200:t=q:w=1.8:g=3.5,"
          "acompressor=threshold=-18dB:ratio=3:attack=6:release=140")
subprocess.run(["nice", "-n", "19", "ffmpeg", "-y", "-loglevel", "error",
                "-i", wav_path, "-af", MASTER, "-c:a", "libmp3lame", "-b:a", "160k", mp3_path], check=True)
os.unlink(wav_path)

# 3) replace with Whisper-aligned captions (real word timing) if available
sys.stderr.write("  aligning captions to speech (Whisper)…\n")
aligned = whisper_align(mp3_path)
if aligned:
    write_captions(aligned)
    align_note = "word-aligned (Whisper)"
else:
    align_note = "proportional timing (Whisper unavailable)"

mm, ss = divmod(int(round(dur)), 60)
print(f"  ✓ narration: out/{slug}.mp3  ({mm}:{ss:02d}, voice {voice}, {total_sent} sentences) — captions {align_note}")
