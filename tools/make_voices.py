"""Generates the Ukrainian voice-over for the legendary films.
Reads legend/dialog.json and writes legend/voice/<film>/<n>.mp3 with Microsoft neural voices (edge-tts).
Each character has its own voice, pitch and speed; the punctuation of a line adds acting
(shouts are faster and louder, "…" is slower and quieter, questions go up).
Run from the chess-trainer folder:  python tools/make_voices.py   (add --force to regenerate everything)"""
import asyncio, json, os, re, sys
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORCE = '--force' in sys.argv
num = lambda s: int(re.sub(r'[^\-\d]', '', s) or 0)

def acting(text, v):
    rate, pitch, vol = num(v['rate']), num(v['pitch']), 0
    if '!' in text: rate += 7; pitch += 3; vol += 15
    if text.rstrip().endswith('?') or '?!' in text: pitch += 4
    if '…' in text or '...' in text: rate -= 7; vol -= 10
    if len(text) < 14 and text.endswith('!'): rate += 5; vol += 10
    s = lambda n, u: ('+' if n >= 0 else '') + str(n) + u
    return s(rate, '%'), s(pitch, 'Hz'), s(vol, '%')

async def one(text, v, path, sem):
    rate, pitch, vol = acting(text, v)
    async with sem:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(text, v['voice'], rate=rate, pitch=pitch, volume=vol).save(path)
                if os.path.getsize(path) > 1000: return
            except Exception as e:
                if attempt == 3: print('FAILED', os.path.basename(path), e)
            await asyncio.sleep(1.5)

async def main():
    d = json.load(open(os.path.join(ROOT, 'legend', 'dialog.json'), encoding='utf-8'))
    sem = asyncio.Semaphore(4)
    jobs = []
    for film, f in d['films'].items():
        out = os.path.join(ROOT, 'legend', 'voice', film)
        os.makedirs(out, exist_ok=True)
        for i, (t, who, text) in enumerate(f['lines']):
            p = os.path.join(out, f'{i}.mp3')
            if FORCE or not os.path.exists(p) or os.path.getsize(p) < 1000:
                jobs.append(one(text, d['voices'][who], p, sem))
    await asyncio.gather(*jobs)
    print('done', len(jobs))

asyncio.run(main())
