import json
import http.client
import tempfile
import threading
import unittest
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from gitcraft.server import make_server


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix="gitcraft-http-test-")
        cls.server = make_server(cls.temp.name, 0)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f"http://127.0.0.1:{cls.server.server_port}"
        with urlopen(cls.url + "/api/state") as response:
            cls.token = json.load(response)["token"]

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        cls.temp.cleanup()

    def post(self, path, body, token=None, origin=None):
        headers = {"Content-Type": "application/json", "X-Gitcraft-Token": token or self.token}
        if origin:
            headers["Origin"] = origin
        request = Request(self.url + path, data=json.dumps(body).encode(), headers=headers)
        return urlopen(request)

    def test_browser_assets_and_security_headers(self):
        for path in ("/", "/app.js", "/style.css", "/lessons.mjs", "/playground.mjs", "/connection.mjs", "/landing.css", "/landing.mjs"):
            with urlopen(self.url + path) as response:
                self.assertEqual(response.status, 200)
                self.assertIn("frame-ancestors 'none'", response.headers["Content-Security-Policy"])

    def test_landing_assets_are_bounded_and_binary(self):
        with urlopen(self.url + "/api/state") as response:
            before = json.load(response)["state"]
        for path, mime, signature in (
            ("/assets/workspace.jpg", "image/jpeg", b"\xff\xd8"),
            ("/assets/collaboration.jpg", "image/jpeg", b"\xff\xd8"),
            ("/assets/commands.jpg", "image/jpeg", b"\xff\xd8"),
            ("/assets/manrope.ttf", "font/ttf", b"\x00\x01\x00\x00"),
        ):
            with self.subTest(path=path), urlopen(self.url + path) as response:
                self.assertEqual(response.headers["Content-Type"], mime)
                self.assertTrue(response.read().startswith(signature))
        for path in ("/assets/../server.py", "/assets/unknown.jpg"):
            with self.subTest(path=path), self.assertRaises(HTTPError) as error:
                urlopen(self.url + path)
            self.assertEqual(error.exception.code, 404)
        with urlopen(self.url + "/api/state") as response:
            self.assertEqual(json.load(response)["state"], before)

    def test_invalid_post_framing_closes_persistent_connection(self):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        self.addCleanup(connection.close)
        connection.request("POST", "/api/edit", body="{}", headers={"Content-Type": "text/plain"})
        response = connection.getresponse()
        self.assertEqual(response.status, 400)
        self.assertEqual(response.getheader("Connection"), "close")
        self.assertTrue(response.will_close)
        response.read()
        # The same client object reconnects cleanly instead of parsing leftover
        # bytes as another request on the rejected connection.
        connection.request("GET", "/")
        response = connection.getresponse()
        self.assertEqual(response.status, 200)
        self.assertIn(b"Make Git", response.read())

    def test_api_save_and_command_roundtrip(self):
        with self.post("/api/edit", {"actor":"you", "file":"schedule.md", "content":"# Community day\nStart: 11:00\n"}) as response:
            self.assertIn("11:00", json.load(response)["state"]["views"]["you"]["files"]["schedule.md"]["working"])
        with self.post("/api/command", {"actor":"you", "command":"git status"}) as response:
            result = json.load(response)
            self.assertIn("schedule.md", result["output"])
            self.assertNotIn("stdout", result)
            self.assertNotIn("stdout", result["state"]["events"][-1])

    def test_wrong_token_and_origin_are_rejected(self):
        for token, origin in [("wrong",None),(self.token,"https://example.com")]:
            with self.subTest(origin=origin):
                with self.assertRaises(HTTPError) as error:
                    self.post("/api/restore", {}, token, origin)
                self.assertEqual(error.exception.code, 403)

    def test_host_and_static_path_escape_are_rejected(self):
        request = Request(self.url + "/api/state", headers={"Host":"example.com"})
        with self.assertRaises(HTTPError) as error:
            urlopen(request)
        self.assertEqual(error.exception.code, 403)
        with self.assertRaises(HTTPError) as error:
            urlopen(self.url + "/../gitcraft/engine.py")
        self.assertEqual(error.exception.code, 404)

    def test_unsupported_command_is_honest_error(self):
        with self.assertRaises(HTTPError) as error:
            self.post("/api/command", {"actor":"you", "command":"git reset --hard"})
        self.assertEqual(error.exception.code, 400)
        self.assertIn("No command ran", json.load(error.exception)["error"])

    def test_switching_lessons_preserves_saved_work_and_identity(self):
        with self.post("/api/switch", {"mission":"staging"}) as response:
            original = json.load(response)["state"]["lessonId"]
        with self.post("/api/edit", {"actor":"you", "file":"schedule.md", "content":"# Community day\nStart: 12:00\n"}) as response:
            response.read()
        with self.post("/api/switch", {"mission":"collaboration"}) as response:
            self.assertNotEqual(json.load(response)["state"]["lessonId"],original)
        with self.post("/api/switch", {"mission":"staging"}) as response:
            state=json.load(response)["state"]
            self.assertEqual(state["lessonId"],original)
            self.assertIn("12:00",state["views"]["you"]["files"]["schedule.md"]["working"])

    def test_playground_snapshot_and_undo_routes(self):
        with urlopen(self.url + "/api/state") as response:
            state=json.load(response)["state"]
        before=state["views"]["you"]["head"]
        with self.post("/api/snapshot", {"actor":"you","commit":before}) as response:
            self.assertIn("schedule.md",json.load(response)["files"])
        with self.post("/api/command", {"actor":"you","command":"git switch -c apiidea"}) as response:
            self.assertEqual(json.load(response)["state"]["views"]["you"]["branch"],"apiidea")
        with self.post("/api/undo", {}) as response:
            result=json.load(response)
            self.assertEqual(result["state"]["views"]["you"]["branch"],"main")
            self.assertEqual(result["state"]["views"]["you"]["head"],before)

    def test_real_project_preview_is_read_only_and_sandboxed(self):
        with self.post("/api/switch", {"mission":"playground"}) as response:
            before=json.load(response)["state"]
        try:
            for name, mime in [("index.html", "text/html"), ("styles.css", "text/css")]:
                with urlopen(self.url + "/preview/you/" + name + "?v=1") as response:
                    self.assertIn(mime, response.headers["Content-Type"])
                    self.assertIn("script-src 'none'", response.headers["Content-Security-Policy"])
                    self.assertIn("sandbox", response.headers["Content-Security-Policy"])
                    self.assertTrue(response.read())
            for path in ["/preview/you/README.md", "/preview/origin/index.html", "/preview/you/../engine.py"]:
                with self.assertRaises(HTTPError) as error:
                    urlopen(self.url + path)
                self.assertEqual(error.exception.code, 404)
            with urlopen(self.url + "/api/state") as response:
                self.assertEqual(json.load(response)["state"]["views"], before["views"])
        finally:
            with self.post("/api/switch", {"mission":"staging"}) as response:
                response.read()
