from pathlib import Path
import tempfile
import unittest
from gitcraft.engine import Lab, LabError, INITIAL, TARGET, ACCESS, PROJECT_FILES


class FileProjectTests(unittest.TestCase):
    def test_real_project_edits_are_explicit_and_separate_from_other_workspaces(self):
        with tempfile.TemporaryDirectory(prefix="gitcraft-files-test-") as root:
            lab = Lab(Path(root) / "lab", "playground")
            before = lab.state()
            self.assertEqual(set(before["views"]["you"]["files"]), set(PROJECT_FILES))
            self.assertEqual(lab.preview_file("you", "index.html"), PROJECT_FILES["index.html"])
            lab.snapshot("sam", lab.base)
            self.assertEqual(lab.state()["views"], before["views"])
            changed = PROJECT_FILES["index.html"].replace("The Last Light", "A New Chapter")
            lab.edit("you", "index.html", changed)
            lab.command("you", "git add index.html")
            result = lab.command("you", 'git commit -m "Add a new book"')
            self.assertEqual(result["code"], 0)
            self.assertEqual(lab.snapshot("you", result["state"]["views"]["you"]["head"])["files"]["index.html"], changed)
            self.assertEqual(result["state"]["views"]["sam"]["files"]["index.html"]["working"], PROJECT_FILES["index.html"])
            self.assertFalse(result["state"]["complete"])
            for actor, name in [("origin", "index.html"), ("you", "../index.html"), ("you", "README.md")]:
                with self.assertRaises(LabError):
                    lab.preview_file(actor, name)


class InspectionCacheTests(unittest.TestCase):
    def test_inspection_reuses_unchanged_repositories_and_observes_native_file_edits(self):
        with tempfile.TemporaryDirectory(prefix="gitcraft-cache-test-") as root:
            lab = Lab(Path(root)/"lab", "playground")
            original = lab.state()
            git = lab._git
            calls = []
            def counted(actor, *args, **kwargs):
                calls.append((actor, args))
                return git(actor, *args, **kwargs)
            lab._git = counted
            lab.command("you", "git status")
            self.assertEqual(len(calls), 1, calls)
            # Returned snapshots must never be aliases into the cache.
            original["views"]["you"]["files"]["README.md"]["working"] = "not real"
            self.assertNotEqual(lab.state()["views"]["you"]["files"]["README.md"]["working"], "not real")
            content = "# Café 📚\n\nFriday reading club at 6pm.\n"
            (lab.repos/"you"/"README.md").write_text(content, encoding="utf-8")
            changed = lab.state()
            self.assertEqual(changed["views"]["you"]["files"]["README.md"]["working"], content)
            self.assertEqual(changed["views"]["sam"], original["views"]["sam"])
            staged = lab.command("you", "git add README.md")["state"]
            self.assertEqual(staged["views"]["you"]["files"]["README.md"]["staged"], content)
            committed = lab.command("you", 'git commit -m "Add reading club"')["state"]
            self.assertEqual(committed["views"]["you"]["files"]["README.md"]["committed"], content)
            lab.undo()
            self.assertEqual(lab.state()["views"]["you"]["head"], changed["views"]["you"]["head"])


class PlaygroundTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="gitcraft-playground-test-")
        self.addCleanup(self.temp.cleanup)
        self.lab = Lab(Path(self.temp.name) / "lab", "collaboration")

    def test_branches_graph_and_snapshot_follow_native_git(self):
        lab = self.lab
        lab.command("you", "git switch -c experiment")
        lab.edit("you", "schedule.md", TARGET)
        lab.command("you", "git add schedule.md")
        state = lab.command("you", 'git commit -m "Try another time"')["state"]
        view = state["views"]["you"]
        topic = lab._must("you", "rev-parse", "HEAD")
        self.assertEqual(view["branch"], "experiment")
        self.assertEqual(view["head"], topic)
        refs = {ref["name"]: ref["target"] for ref in view["graph"]["refs"]}
        self.assertEqual(refs["refs/heads/main"], lab.base)
        self.assertEqual(refs["refs/heads/experiment"], topic)
        self.assertEqual(lab.snapshot("you", topic)["files"]["schedule.md"], TARGET)
        lab.command("you", "git switch main")
        lab.edit("you", "accessibility.md", ACCESS)
        lab.command("you", "git add accessibility.md")
        lab.command("you", 'git commit -m "Add entrance details"')
        before_merge = lab._must("you", "rev-parse", "HEAD")
        result = lab.command("you", "git merge experiment")
        self.assertEqual(result["code"], 0)
        head = result["state"]["views"]["you"]["head"]
        node = next(node for node in result["state"]["views"]["you"]["graph"]["commits"] if node["id"] == head)
        actual = lab._must("you", "rev-list", "--parents", "-n", "1", "HEAD").split()[1:]
        self.assertEqual(node["parents"], actual)
        self.assertEqual(set(node["parents"]), {topic, before_merge})

    def test_undo_restores_index_working_files_and_commit(self):
        lab = self.lab
        lab.edit("you", "schedule.md", TARGET)
        lab.command("you", "git add schedule.md")
        later = TARGET.replace("11:00", "12:00")
        lab.edit("you", "schedule.md", later)
        lab.command("you", 'git commit -m "Save prepared version"')
        result = lab.undo()
        self.assertEqual(lab._must("you", "rev-parse", "HEAD"), lab.base)
        self.assertEqual(lab._must("you", "show", ":schedule.md"), TARGET.strip())
        self.assertEqual((lab.repos / "you" / "schedule.md").read_text(), later)
        self.assertFalse(result["state"]["canUndo"])

    def test_undo_restores_teammate_remote_and_event_metadata(self):
        lab = self.lab
        lab.teammate()
        self.assertNotEqual(lab._must("origin", "rev-parse", "main"), lab.base)
        lab.undo()
        for actor in ("you", "sam", "origin"):
            self.assertEqual(lab._must(actor, "rev-parse", "HEAD"), lab.base)
        self.assertIsNone(lab.sam_commit)
        self.assertEqual(lab.events, [])
        self.assertEqual(lab.teammate()["code"], 0)

    def test_snapshot_inspection_never_fetches_and_rejects_path_input(self):
        lab = self.lab
        original = lab._must("you", "rev-parse", "origin/main")
        lab.teammate()
        snapshot = lab.snapshot("sam", lab.sam_commit)
        self.assertEqual(snapshot["files"]["accessibility.md"], ACCESS)
        self.assertEqual(lab._must("you", "rev-parse", "origin/main"), original)
        for value in ("HEAD:../../secret", "--help", "0" * 40):
            with self.subTest(value=value), self.assertRaises(LabError):
                lab.snapshot("you", value)
        for value in ("git switch -c ../../escape", "git switch --detach", 'git commit -m "bad\x1fmessage"'):
            with self.subTest(value=value), self.assertRaises(LabError):
                lab.command("you", value)

    def test_new_branch_can_be_published_without_changing_main(self):
        lab = self.lab
        lab.command("you", "git switch -c idea")
        lab.edit("you", "schedule.md", TARGET)
        lab.command("you", "git add schedule.md")
        lab.command("you", 'git commit -m "Try a start time"')
        result = lab.command("you", "git push -u origin idea")
        self.assertEqual(result["code"], 0)
        self.assertEqual(lab._must("origin", "rev-parse", "main"), lab.base)
        self.assertEqual(result["state"]["views"]["you"]["trackingName"], "origin/idea")
        self.assertEqual(lab._must("origin", "show", "idea:schedule.md"), TARGET.strip())
