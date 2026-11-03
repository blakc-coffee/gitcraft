from pathlib import Path
import tempfile
import unittest
from gitcraft.engine import Lab, LabError, INITIAL, TARGET, ACCESS


class StagingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="gitcraft-test-")
        self.addCleanup(self.temp.cleanup)
        self.lab = Lab(Path(self.temp.name) / "lab")

    def test_stage_then_edit_saves_the_index_not_working_file(self):
        lab = self.lab
        lab.edit("you", "schedule.md", TARGET)
        lab.command("you", "git add schedule.md")
        later = TARGET.replace("11:00", "12:00")
        lab.edit("you", "schedule.md", later)
        result = lab.command("you", 'git commit -m "Correct start time"')
        self.assertEqual(result["code"], 0)
        # Independent inspection, not the state collector's own interpretation.
        self.assertEqual(lab._must("you", "show", "HEAD:schedule.md"), TARGET.strip())
        self.assertEqual((lab.repos / "you" / "schedule.md").read_text(), later)
        self.assertFalse(result["state"]["complete"])

    def test_wrong_commit_is_not_marked_complete(self):
        self.lab.command("you", "git add schedule.md")
        self.lab.edit("you", "schedule.md", TARGET)
        result = self.lab.command("you", 'git commit -m "Forgot to stage"')
        self.assertNotEqual(result["code"], 0)
        self.assertFalse(result["state"]["complete"])

    def test_unstage_retains_edits_and_alternate_add_syntax_passes(self):
        self.lab.edit("you", "schedule.md", TARGET)
        self.lab.command("you", "git add -- schedule.md")
        self.lab.command("you", "git restore --staged schedule.md")
        self.assertEqual((self.lab.repos / "you" / "schedule.md").read_text(), TARGET)
        self.assertEqual(self.lab._must("you", "show", ":schedule.md"), INITIAL.strip())
        self.lab.command("you", "git add schedule.md")
        self.assertTrue(self.lab.command("you", 'git commit -m "Move opening"')["state"]["complete"])

    def test_restore_checkpoint_includes_uncommitted_and_untracked_files(self):
        self.lab.edit("you", "schedule.md", TARGET)
        self.lab.command("you", "git add schedule.md")
        (self.lab.repos / "you" / "scratch.txt").write_text("scratch")
        state = self.lab.restore()
        self.assertEqual((self.lab.repos / "you" / "schedule.md").read_text(), INITIAL)
        self.assertFalse((self.lab.repos / "you" / "scratch.txt").exists())
        self.assertEqual(self.lab._must("you", "status", "--porcelain"), "")
        self.assertFalse(state["complete"])

    def test_gateway_rejects_execution_and_paths_without_changing_repo(self):
        before = self.lab._must("you", "rev-parse", "HEAD")
        for command in ["git -c core.editor=evil commit", "git add ../secret", "git add .git/config",
                        "git fetch https://example.com", "git status; whoami", "git config core.hooksPath /tmp", "git show HEAD:../secret", "git add -A", "git reset --hard"]:
            with self.subTest(command=command), self.assertRaises(LabError):
                self.lab.command("you", command)
        with self.assertRaises(LabError):
            self.lab.edit("you", "../../escape", "bad")
        self.assertEqual(before, self.lab._must("you", "rev-parse", "HEAD"))


class CollaborationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="gitcraft-test-")
        self.addCleanup(self.temp.cleanup)
        self.lab = Lab(Path(self.temp.name) / "lab", "collaboration")

    def test_push_does_not_refresh_learner_and_fetch_does_not_integrate(self):
        lab = self.lab
        original = lab._must("you", "rev-parse", "origin/main")
        lab.teammate()
        self.assertEqual(lab._must("you", "rev-parse", "origin/main"), original)
        self.assertNotEqual(lab._must("origin", "rev-parse", "main"), original)
        lab.command("you", "git fetch origin")
        self.assertEqual(lab._must("you", "rev-parse", "HEAD"), original)
        self.assertEqual((lab.repos / "you" / "accessibility.md").read_text(), "Entrance details pending.\n")
        self.assertEqual(lab._must("you", "rev-parse", "origin/main"), lab.sam_commit)

    def test_rejected_push_then_merge_retains_both_intentions(self):
        lab = self.lab
        lab.edit("you", "schedule.md", TARGET)
        lab.command("you", "git add schedule.md")
        lab.command("you", 'git commit -m "Correct start time"')
        local = lab._must("you", "rev-parse", "HEAD")
        lab.teammate()
        self.assertNotEqual(lab.command("you", "git push")["code"], 0)
        self.assertEqual(local, lab._must("you", "rev-parse", "HEAD"))
        lab.command("you", "git fetch origin")
        self.assertEqual(lab.command("you", "git merge origin/main")["code"], 0)
        self.assertFalse(lab.state()["complete"])
        self.assertTrue(lab.command("you", "git push origin main")["state"]["complete"])
        self.assertEqual(lab._must("origin", "show", "main:accessibility.md"), ACCESS.strip())

    def test_manual_teammate_workspace_commands_are_real(self):
        self.lab.edit("sam", "schedule.md", TARGET)
        self.lab.command("sam", "git add schedule.md")
        self.assertEqual(self.lab.command("sam", 'git commit -m "Sam changes time"')["code"], 0)
        self.assertEqual(self.lab._must("you", "show", "HEAD:schedule.md"), INITIAL.strip())
        with self.assertRaises(LabError):
            self.lab.command("origin", "git status")

    def test_missing_contributor_intention_never_passes(self):
        lab = self.lab
        lab.teammate()
        lab.command("you", "git fetch origin")
        lab.command("you", "git merge origin/main")
        lab.edit("you", "schedule.md", TARGET)
        lab.edit("you", "accessibility.md", "Entrance details pending.\n")
        lab.command("you", "git add schedule.md accessibility.md")
        lab.command("you", 'git commit -m "Lose access requirement"')
        self.assertFalse(lab.command("you", "git push")["state"]["complete"])

    def test_conflict_observation_and_abort_are_native(self):
        lab = self.lab
        lab.edit("you", "accessibility.md", "Entrance: east.\n")
        lab.command("you", "git add accessibility.md")
        lab.command("you", 'git commit -m "Suggest east entrance"')
        lab.teammate()
        lab.command("you", "git fetch origin")
        result = lab.command("you", "git merge origin/main")
        self.assertNotEqual(result["code"], 0)
        self.assertIn("<<<<<<<", (lab.repos / "you" / "accessibility.md").read_text())
        self.assertFalse(result["state"]["complete"])
        self.assertEqual(lab.command("you", "git merge --abort")["code"], 0)
        self.assertEqual((lab.repos / "you" / "accessibility.md").read_text(), "Entrance: east.\n")

    def test_restore_rewinds_all_three_repositories_and_event(self):
        self.lab.teammate()
        self.lab.command("you", "git fetch origin")
        self.lab.restore()
        for actor in ("you", "sam", "origin"):
            self.assertEqual(self.lab._must(actor, "rev-parse", "main"), self.lab.base)
        self.assertIsNone(self.lab.sam_commit)
        self.assertEqual(len(self.lab.events), 0)


if __name__ == "__main__":
    unittest.main()
