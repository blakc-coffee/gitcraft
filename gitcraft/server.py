"""Loopback-only browser preview. Run with python -S -m gitcraft.server."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import json
import secrets
import tempfile
import threading
from urllib.parse import urlsplit
from .engine import LabError, create_lab

STATIC = Path(__file__).parent / "web"


def make_server(root, port=8765, initial_lab=None):
    lab = initial_lab if initial_lab is not None else create_lab(root, "staging")
    lessons = {lab.mission: lab}
    token = secrets.token_urlsafe(32)
    lock = threading.RLock()

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def send(self, status, body, mime="application/json; charset=utf-8", policy=None):
            data = body if isinstance(body, bytes) else json.dumps(body).encode()
            self.send_response(status)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy", policy or "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
            self.end_headers()
            self.wfile.write(data)

        def valid_host(self):
            return self.headers.get("Host") in (f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}")

        def do_GET(self):
            if not self.valid_host():
                return self.send(403, {"error": "Open this prototype through its loopback address."})
            if self.path == "/api/state":
                with lock:
                    return self.send(200, {"token": token, "state": lab.state()})
            preview_path = urlsplit(self.path).path
            if preview_path.startswith("/preview/"):
                parts = preview_path.strip("/").split("/")
                try:
                    if len(parts) != 3:
                        raise LabError("Unknown preview file.")
                    with lock:
                        content = lab.preview_file(parts[1], parts[2])
                    mime = "text/css" if parts[2] == "styles.css" else "text/html"
                    return self.send(200, content.encode("utf-8"), mime + "; charset=utf-8", "default-src 'none'; style-src 'self'; script-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'; sandbox")
                except LabError:
                    return self.send(404, {"error": "Preview file not available."})
            files = {"/": ("index.html", "text/html"), "/app.js": ("app.js", "text/javascript"),
                     "/style.css": ("style.css", "text/css"),
                     "/lessons.mjs": ("lessons.mjs", "text/javascript"),
                     "/playground.mjs": ("playground.mjs", "text/javascript")}
            if self.path not in files:
                return self.send(404, {"error": "Page not found."})
            name, mime = files[self.path]
            self.send(200, (STATIC / name).read_bytes(), mime + "; charset=utf-8")

        def do_POST(self):
            nonlocal lab
            # Drain bounded request bodies before an early rejection. Closing a
            # Windows socket with unread bytes can reset it before the client
            # receives the 403 response.
            try:
                self.connection.settimeout(5)
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 < length <= 16384 or self.headers.get_content_type() != "application/json":
                    raise LabError("Expected a small JSON request.")
                raw = self.rfile.read(length)
            except (ValueError, OSError):
                return self.send(400, {"error": "Expected a small JSON request."})
            origin = self.headers.get("Origin")
            allowed = (f"http://127.0.0.1:{self.server.server_port}", f"http://localhost:{self.server.server_port}")
            if not self.valid_host() or self.headers.get("X-Gitcraft-Token") != token or (origin and origin not in allowed):
                return self.send(403, {"error": "Refresh the local page before trying again."})
            try:
                body = json.loads(raw)
                if not isinstance(body, dict):
                    raise LabError("Expected a request object.")
                with lock:
                    if self.path == "/api/new":
                        # Build first, so a failed setup does not destroy the current lab.
                        replacement = create_lab(root, body.get("mission"))
                        lab = replacement
                        lessons[lab.mission] = lab
                        result = {"state": lab.state()}
                    elif self.path == "/api/switch":
                        mission = body.get("mission")
                        if mission not in ("staging", "collaboration", "playground"):
                            raise LabError("Choose one of the two lessons.")
                        if mission not in lessons:
                            lessons[mission] = create_lab(root, mission)
                        lab = lessons[mission]
                        result = {"state": lab.state()}
                    elif self.path == "/api/command":
                        result = lab.command(body.get("actor"), body.get("command"))
                    elif self.path == "/api/edit":
                        result = {"state": lab.edit(body.get("actor"), body.get("file"), body.get("content"))}
                    elif self.path == "/api/teammate":
                        result = lab.teammate()
                    elif self.path == "/api/undo":
                        result = lab.undo()
                    elif self.path == "/api/snapshot":
                        result = lab.snapshot(body.get("actor"), body.get("commit"))
                    elif self.path == "/api/restore":
                        result = {"state": lab.restore()}
                    else:
                        return self.send(404, {"error": "Unknown operation."})
                    self.send(200, result)
            except (LabError, ValueError, TypeError) as error:
                self.send(400, {"error": str(error)})
            except Exception:
                self.send(500, {"error": "The lab operation failed. Your last action may have run; refresh to inspect the current state before retrying."})

    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="gitcraft-") as root:
        server = make_server(root, args.port)
        print(f"GitCraft local prototype: http://127.0.0.1:{server.server_port}", flush=True)
        print("One learner; temporary lesson repositories. Ctrl+C stops the server and removes them.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()


if __name__ == "__main__":
    main()
