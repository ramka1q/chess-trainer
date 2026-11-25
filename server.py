"""Chess trainer local server.

Serves the trainer files on http://127.0.0.1:8799 and gives the page access to the
native Stockfish found in ./engine (much stronger than the in-browser WASM engine:
all CPU cores, full NNUE network).

  GET  /engine/ping  -> {"ok": true, "name": "..."}  (ok=false if no engine found)
  The website (https://ramka1q.github.io) may call /engine too (CORS), so the online trainer
  can think with this native engine while the PC version is running.
  POST /engine       -> {"slot","fen","depth","movetime","multipv","searchmoves","skill"}
                        returns {"best": uci, "lines": [{"cp","mate","pv","depth"}]}
"""
import glob
import json
import os
import re
import subprocess
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8799


def find_engine():
    """Pick the fastest Stockfish build this CPU can run (official zip ships several)."""
    exes = glob.glob(os.path.join(ROOT, "engine", "**", "stockfish*.exe"), recursive=True)
    if not exes:
        return None
    pref = ["avx512", "vnni", "bmi2", "avx2", "sse41", "x86-64"]
    def rank(p):
        n = os.path.basename(p).lower()
        for i, k in enumerate(pref):
            if k in n:
                return i
        return len(pref)
    ordered = sorted(exes, key=rank)
    for exe in ordered:  # first one that actually starts (unsupported CPU instructions crash at once)
        try:
            p = subprocess.run([exe], input="uci\nquit\n", capture_output=True, text=True, timeout=10)
            if "uciok" in p.stdout:
                return exe
        except Exception:
            pass
    return None


class UciEngine:
    def __init__(self, exe, threads, hash_mb):
        self.lock = threading.Lock()
        self.p = subprocess.Popen([exe], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.DEVNULL, text=True, bufsize=1,
                                  creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        self.name = "Stockfish"
        self.send("uci")
        for line in self.lines_until("uciok"):
            if line.startswith("id name"):
                self.name = line[8:].strip()
        self.send(f"setoption name Threads value {threads}")
        self.send(f"setoption name Hash value {hash_mb}")
        self.opts = {}
        self.sync()

    def send(self, cmd):
        self.p.stdin.write(cmd + "\n")
        self.p.stdin.flush()

    def lines_until(self, prefix):
        while True:
            line = self.p.stdout.readline()
            if not line:
                raise RuntimeError("engine stopped")
            line = line.strip()
            yield line
            if line.startswith(prefix):
                return

    def sync(self):
        self.send("isready")
        for _ in self.lines_until("readyok"):
            pass

    def setopt(self, name, value):
        if self.opts.get(name) != value:
            self.send(f"setoption name {name} value {value}")
            self.opts[name] = value

    def analyse(self, fen, depth=20, movetime=1000, multipv=1, searchmoves=None, skill=20):
        with self.lock:
            self.setopt("MultiPV", int(multipv))
            self.setopt("Skill Level", int(skill))
            self.sync()
            self.send("position fen " + fen)
            go = f"go depth {int(depth)} movetime {int(movetime)}"
            if searchmoves:
                go += " searchmoves " + searchmoves
            self.send(go)
            lines = {}
            best = None
            for line in self.lines_until("bestmove"):
                if line.startswith("bestmove"):
                    best = line.split()[1]
                    break
                if not line.startswith("info") or " pv " not in line:
                    continue
                m = re.search(r"score (cp|mate) (-?\d+)", line)
                if not m or " lowerbound" in line or " upperbound" in line:
                    continue
                mp = int((re.search(r"multipv (\d+)", line) or [0, 1])[1])
                d = int((re.search(r" depth (\d+)", line) or [0, 0])[1])
                v = int(m.group(2))
                if m.group(1) == "cp":
                    cp, mate = v, None
                else:
                    mate = v
                    cp = -10000 if v == 0 else (10000 - v * 10 if v > 0 else -10000 - v * 10)
                lines[mp] = {"cp": cp, "mate": mate, "pv": line.split(" pv ")[1].split(), "depth": d}
            arr = [lines[k] for k in sorted(lines)]
            if best in (None, "(none)"):
                best = None
            if not arr:
                arr = [{"cp": 0, "mate": None, "pv": [best] if best else [], "depth": 0}]
            return {"best": best, "lines": arr}


# ---------------- self-update from the GitHub release ----------------
import io, shutil, tempfile, urllib.request, zipfile
SITE = 'https://ramka1q.github.io/chess-trainer/'
ZIP_URL = 'https://github.com/ramka1q/chess-trainer/releases/latest/download/chess-trainer-pc.zip'
UPD = {'phase': 'idle', 'pct': 0, 'done': 0, 'total': 0, 'error': ''}
KEEP = {'engine', 'calib'}  # never touched by an update


def _update_worker():
    try:
        UPD.update(phase='download', pct=0, done=0, total=0, error='')
        req = urllib.request.Request(ZIP_URL, headers={'User-Agent': 'chess-trainer'})
        with urllib.request.urlopen(req, timeout=60) as r:
            total = int(r.headers.get('Content-Length') or 0)
            UPD['total'] = total
            buf = io.BytesIO()
            while True:
                chunk = r.read(64 * 1024)
                if not chunk:
                    break
                buf.write(chunk)
                UPD['done'] = buf.tell()
                UPD['pct'] = int(UPD['done'] * 100 / total) if total else 0
        UPD.update(phase='install', pct=100)
        z = zipfile.ZipFile(buf)
        names = [n for n in z.namelist() if n.endswith('index.html')]
        if not names:
            raise RuntimeError('архів оновлення пошкоджений')
        prefix = names[0][:-len('index.html')]
        tmp = tempfile.mkdtemp()
        z.extractall(tmp)
        src = os.path.join(tmp, prefix)
        for name in os.listdir(src):
            if name in KEEP:
                continue
            s, d = os.path.join(src, name), os.path.join(ROOT, name)
            if os.path.isdir(s):
                shutil.copytree(s, d, dirs_exist_ok=True)
            else:
                shutil.copy2(s, d)
        shutil.rmtree(tmp, ignore_errors=True)
        UPD.update(phase='done', pct=100)
    except Exception as e:
        UPD.update(phase='error', error=str(e))


ENGINE_EXE = find_engine()
POOL = {}
if ENGINE_EXE:
    cores = os.cpu_count() or 4
    # "coach" does game analysis; "eval" drives the eval bar; "bot" plays strong bots
    POOL["coach"] = UciEngine(ENGINE_EXE, max(1, cores - 2), 256)
    POOL["eval"] = UciEngine(ENGINE_EXE, 1, 64)
    POOL["bot"] = UciEngine(ENGINE_EXE, 1, 64)


ALLOWED_ORIGINS = ("https://ramka1q.github.io",)


def origin_ok(o):
    """the published site, or a local copy (localhost / 127.0.0.1 on any port)"""
    if not o:
        return False
    return o in ALLOWED_ORIGINS or re.match(r"^http://(localhost|127\.0\.0\.1)(:\d+)?$", o) is not None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def _cors(self):
        o = self.headers.get("Origin")
        if self.path.startswith("/engine") and origin_ok(o):
            self.send_header("Access-Control-Allow-Origin", o)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Private-Network", "true")

    def do_OPTIONS(self):
        """CORS / private-network preflight from the website"""
        self.send_response(204)
        self._cors()
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _json(self, obj, code=200):
        data = json.dumps(obj).encode()
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.startswith("/update/status"):
            return self._json(UPD)
        if self.path.startswith("/update/check"):
            try:
                req = urllib.request.Request(SITE + 'version.json?ts=' + str(int(__import__('time').time())), headers={'User-Agent': 'chess-trainer'})
                with urllib.request.urlopen(req, timeout=10) as r:
                    return self._json(json.loads(r.read().decode('utf-8')))
            except Exception as e:
                return self._json({'error': str(e)})
        if self.path.startswith("/engine/ping"):
            if POOL:
                return self._json({"ok": True, "name": POOL["coach"].name, "threads": max(1, (os.cpu_count() or 4) - 2)})
            return self._json({"ok": False})
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith("/update/start"):
            if UPD['phase'] not in ('download', 'install'):
                threading.Thread(target=_update_worker, daemon=True).start()
            return self._json({'ok': True})
        if not self.path.startswith("/engine"):
            return self._json({"error": "not found"}, 404)
        if not POOL:
            return self._json({"error": "no engine"}, 503)
        try:
            req = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
            eng = POOL.get(req.get("slot"), POOL["coach"])
            res = eng.analyse(req["fen"], req.get("depth", 20), req.get("movetime", 1000),
                              req.get("multipv", 1), req.get("searchmoves"), req.get("skill", 20))
            return self._json(res)
        except Exception as e:
            return self._json({"error": str(e)}, 500)


if __name__ == "__main__":
    print("Chess trainer:", f"http://127.0.0.1:{PORT}/")
    print("Engine:", POOL["coach"].name if POOL else "not found (browser engine will be used)")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
