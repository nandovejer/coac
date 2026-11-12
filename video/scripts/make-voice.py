"""Narración del tráiler con Piper (código abierto, en local) y una voz de España.

Uso: python scripts/make-voice.py <es_ES-davefx-medium.onnx>
Necesita `pip install piper-tts` y la voz (con su `.onnx.json` al lado), de
https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/davefx/medium
Lee `scripts/voice-lines.txt` (id|texto) y escribe `assets/voice/<id>.wav`.
"""
import sys
import wave
from pathlib import Path

from piper import PiperVoice, SynthesisConfig

root = Path(__file__).resolve().parent.parent
voice = PiperVoice.load(sys.argv[1])
# Un poco más despacio y con más variación que por defecto: suena menos plano.
config = SynthesisConfig(length_scale=1.04, noise_scale=0.8, noise_w_scale=0.9)
for line in (root / "scripts/voice-lines.txt").read_text(encoding="utf-8").splitlines():
    if not line.strip():
        continue
    name, text = line.split("|", 1)
    with wave.open(str(root / f"assets/voice/{name}.wav"), "wb") as out:
        voice.synthesize_wav(text, out, syn_config=config)
    with wave.open(str(root / f"assets/voice/{name}.wav"), "rb") as done:
        print(f"{name} {done.getnframes() / done.getframerate():.2f} s  {text}")
