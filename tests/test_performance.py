"""Native-state and process-budget regressions; no machine-specific timing gates."""
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch, Mock

from gitcraft.engine import Lab, PROJECT_FILES
from gitcraft import server


class ComponentCacheTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory(prefix="gitcraft-components-")
        self.addCleanup(temp.cleanup)
        self.lab = Lab(Path(temp.name) / "lab", "playground")
        self.lab.state()

    def assert_native(self, actor="you"):
        lab = self.lab
        view = lab.state()["views"][actor]
        # These deliberately bypass the component caches.
        branch = lab._git(actor, "symbolic-ref", "--short", "HEAD")
        self.assertEqual(view["branch"], branch["output"] if branch["code"] == 0 else None)
        self.assertEqual(view["head"], lab._ref(actor, "HEAD"))
        self.assertEqual(view["graph"], lab._graph(actor))
        self.assertEqual(view["history"], lab._must(actor, "log", "--oneline", "--graph", "--all", "-8"))
        if actor != "origin":
            upstream = lab._git(actor, "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}")
            self.assertEqual(view["trackingName"], upstream["output"] if upstream["code"] == 0 else None)
            self.assertEqual(view["tracking"], lab._ref(actor, "@{upstream}"))
        if actor != "origin":
            self.assertEqual(view["status"], lab._must(actor, "status", "--short"))
            versions = lab._file_versions(actor)
            for name in lab.files:
                self.assertEqual(view["files"][name]["working"], (lab.repos / actor / name).read_text(encoding="utf-8"))
                for version in ("staged", "committed"):
                    self.assertEqual(view["files"][name][version], versions[version, name])

    def test_working_and_index_changes_do_not_reinspect_history_or_other_actors(self):
        lab = self.lab
        git, calls = lab._git, []
        def counted(actor, *args, **kwargs):
            calls.append((actor, args))
            return git(actor, *args, **kwargs)
        lab._git = counted
        lab.state()
        self.assertEqual(calls, [])
        lab.command("you", "git status")
        self.assertEqual(len(calls), 1, calls)
        calls.clear()
        text = PROJECT_FILES["README.md"] + "\nSaturday café 📚\n"
        before = lab.edit("you", "README.md", text)
        self.assertEqual(len(calls), 1, calls)
        self.assertTrue(all(actor == "you" for actor, _ in calls))
        calls.clear()
        staged = lab.command("you", "git add README.md")["state"]
        self.assertEqual(len(calls), 3, calls)
        self.assertTrue(all(actor == "you" for actor, _ in calls))
        self.assertEqual(staged["views"]["you"]["files"]["README.md"]["staged"], text)
        self.assertNotEqual(before["views"]["you"]["files"]["README.md"]["staged"], text)
        staged["views"]["you"]["graph"]["refs"].clear()
        self.assertTrue(lab.state()["views"]["you"]["graph"]["refs"])
        self.assert_native()

    def test_external_native_edits_refs_config_and_packed_refs_are_observed(self):
        lab = self.lab
        path = lab.repos / "you" / "README.md"
        path.write_text("# Café 📚\n", encoding="utf-8")
        self.assert_native()
        for args in [("add", "README.md"), ("commit", "-m", "External contribution"),
                     ("switch", "-c", "outside"), ("branch", "--set-upstream-to=main"),
                     ("pack-refs", "--all"), ("checkout", "--detach"), ("switch", "main")]:
            with self.subTest(args=args):
                lab._must("you", *args)
                self.assert_native()

    def test_object_additions_reuse_history_but_modified_objects_refresh(self):
        lab = self.lab
        raw = lab._git("you", "hash-object", "-w", "--stdin", input_data=b"Unreachable object\n")
        oid = raw["raw"].decode().strip()
        git, calls = lab._git, []
        def counted(actor, *args, **kwargs):
            calls.append((actor, args))
            return git(actor, *args, **kwargs)
        lab._git = counted
        lab.state()
        self.assertEqual(len(calls), 1, calls)
        obj = lab.repos / "you" / ".git" / "objects" / oid[:2] / oid[2:]
        info = obj.stat()
        os.utime(obj, ns=(info.st_atime_ns, info.st_mtime_ns + 1000000000))
        calls.clear()
        lab.state()
        self.assertTrue(any(args[0] == "log" for _, args in calls))
        obj.chmod(info.st_mode | 0o200)  # Native object files are read-only on Windows.
        obj.unlink()  # Only the known unreachable object inside this temp fixture.
        self.assert_native()

    def test_batched_refs_match_native_ambiguous_missing_and_detached_cases(self):
        lab = self.lab
        self.assert_native()
        self.assert_native("origin")
        lab._must("you", "tag", "main", "HEAD")
        self.assert_native()
        lab._must("you", "branch", "local-target", "HEAD")
        lab._must("you", "config", "branch.main.remote", ".")
        lab._must("you", "config", "branch.main.merge", "refs/heads/local-target")
        self.assert_native()
        lab._must("you", "update-ref", "-d", "refs/heads/local-target")
        self.assert_native()
        lab._must("you", "checkout", "--detach", "HEAD")
        self.assert_native()

    def test_undo_push_and_reset_reinspect_every_repository(self):
        lab = self.lab
        lab.edit("you", "README.md", "# An update\n")
        lab.command("you", "git add README.md")
        before = lab.command("you", 'git commit -m "Update notes"')["state"]
        self.assertEqual(lab.command("you", "git push origin main")["code"], 0)
        self.assertEqual(lab.undo()["state"]["views"], before["views"])
        # A failed mutation still has an accurate state and a working Undo.
        failed = lab.command("you", 'git commit -m "Nothing staged"')
        self.assertNotEqual(failed["code"], 0)
        self.assert_native()
        lab.undo()
        before_reset = lab.state()
        lab.restore()
        self.assertEqual(lab.undo()["state"]["views"], before_reset["views"])
        for actor in ("you", "sam", "origin"):
            self.assert_native(actor)

    def test_mid_inspection_external_change_is_not_cached_as_fresh(self):
        lab = self.lab
        path = lab.repos / "you" / "README.md"
        path.write_text("Before collection\n", encoding="utf-8")
        signature, calls = lab._repo_signature, 0
        def interrupted(actor):
            nonlocal calls
            if actor == "you":
                calls += 1
                if calls == 2:
                    path.write_text("Changed during collection\n", encoding="utf-8")
            return signature(actor)
        lab._repo_signature = interrupted
        lab.state()
        self.assertEqual(lab.state()["views"]["you"]["files"]["README.md"]["working"], "Changed during collection\n")


class StartupTests(unittest.TestCase):
    def test_cli_seeds_playground_once_using_existing_injection(self):
        # No actual server/repositories required to verify this construction path.
        lab = object()
        http = Mock()
        http.server_port = 8765
        http.serve_forever.side_effect = KeyboardInterrupt
        with patch.object(server, "create_lab", return_value=lab) as create, \
             patch.object(server, "make_server", return_value=http) as make, \
             patch("sys.argv", ["gitcraft.server"]), patch("builtins.print"):
            server.main()
        self.assertEqual(create.call_count, 1)
        self.assertEqual(create.call_args.args[1], "playground")
        self.assertIs(make.call_args.kwargs["initial_lab"], lab)
        http.server_close.assert_called_once()
