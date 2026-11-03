"""Trusted fixtures and a deliberately small native Git command gateway.

This is a local developer prototype, not a hostile-code execution sandbox.
"""
from pathlib import Path
import os
import copy
import re
import shlex
import shutil
import stat
import subprocess
import threading
import uuid

FILES = ("schedule.md", "accessibility.md")
INITIAL = "# Community day\nStart: 10:00\n"
TARGET = "# Community day\nStart: 11:00\n"
ACCESS = "Step-free entrance: north door.\n"
PROJECT_FILES = {
    "index.html": '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Little Leaf Books</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <main>\n    <p class="shop-name">Little Leaf Books</p>\n    <h1>Find your next good read.</h1>\n    <p class="intro">A small bookshop for curious readers.</p>\n    <section>\n      <h2>On our shelf</h2>\n      <ul>\n        <li>Slow Sunday Stories</li>\n        <li>A Pocket Guide to Trees</li>\n        <li>The Last Light</li>\n      </ul>\n    </section>\n    <footer>A fictional shop. A real project to experiment with.</footer>\n  </main>\n</body>\n</html>\n',
    "styles.css": '* { box-sizing: border-box; }\nbody {\n  margin: 0;\n  padding: 48px 24px;\n  background: #f6f1e7;\n  color: #293e32;\n  font-family: Georgia, serif;\n  line-height: 1.7;\n}\nmain { max-width: 620px; margin: auto; }\n.shop-name { font-family: sans-serif; font-size: 14px; }\nh1 { font-size: 42px; line-height: 1.15; font-weight: normal; }\n.intro { font-size: 18px; }\nsection { margin-top: 36px; border-top: 1px solid #b8c6b3; padding-top: 20px; }\nh2 { font-size: 22px; font-weight: normal; }\nli { padding: 5px 0; }\nfooter { margin-top: 48px; font-family: sans-serif; font-size: 12px; }\n',
    "README.md": '# Little Leaf Books\n\nA fictional bookshop website for practising Git with a real, small project.\n\n## Files\n\n- index.html: the page and its reading list.\n- styles.css: the page colours, spacing and type.\n- README.md: notes about the project.\n\n## Explore\n\nEdit the files yourself. Preview your saved work. Prepare the changes you want to keep, then save a snapshot with a message.\n\nTry a different design on a branch, or switch to Sam\'s workspace and make a separate contribution. There is no required outcome.\n'
}


class LabError(ValueError):
    pass


class Lab:
    def __init__(self, root, mission="staging"):
        if mission not in ("staging", "collaboration", "playground"):
            raise LabError("Choose staging or collaboration.")
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self.mission = mission
        self.files = tuple(PROJECT_FILES) if mission == "playground" else FILES
        self.lock = threading.RLock()
        self.git = shutil.which("git")
        if not self.git:
            raise RuntimeError("Install Git before starting the local prototype.")
        self.home = self.root / "home"
        self.home.mkdir()
        self.hooks = self.root / "empty-hooks"
        self.hooks.mkdir()
        # Do not inherit Git config, credential, transport, or execution settings.
        self.env = {k: v for k, v in os.environ.items()
                    if not k.upper().startswith(("GIT_", "SSH_"))}
        self.env.update({"HOME": str(self.home), "USERPROFILE": str(self.home),
                         "XDG_CONFIG_HOME": str(self.home),
                         "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": os.devnull,
                         "GIT_TERMINAL_PROMPT": "0", "GIT_EDITOR": "true",
                         "GIT_MERGE_AUTOEDIT": "no", "GIT_PAGER": "cat",
                         "GIT_ALLOW_PROTOCOL": "file", "LC_ALL": "C"})
        self.repos = self.root / "repos"
        self.repos.mkdir()
        self.events = []
        self._view_cache = {}
        self.sam_commit = None
        self.undo_available = False
        self.undo_metadata = None
        self._setup()
        self.checkpoint = self.root / "checkpoint"
        shutil.copytree(self.repos, self.checkpoint)

    def _git(self, actor, *args, input_data=None):
        repo = self.repos / actor
        result = subprocess.run(
            [self.git, "--no-pager", "-c", "core.hooksPath=" + str(self.hooks),
             "-c", "core.autocrlf=false", "-c", "commit.gpgsign=false",
             "-c", "tag.gpgsign=false", "-c", "credential.helper=",
             "-c", "core.fsmonitor=false", *args], cwd=repo, env=self.env,
            stdin=subprocess.DEVNULL if input_data is None else None,
            input=input_data, capture_output=True, text=input_data is None,
            encoding="utf-8" if input_data is None else None,
            errors="replace" if input_data is None else None, timeout=10, shell=False)
        # Avoid exposing developer machine paths in instructional output.
        raw = result.stdout if input_data is not None else None
        stdout = result.stdout if raw is None else raw.decode("utf-8", "replace").replace("\r\n", "\n")
        stderr = result.stderr if raw is None else result.stderr.decode("utf-8", "replace")
        output = (stdout + stderr).replace(str(self.root), "<lab>")
        output = output.replace(self.root.as_posix(), "<lab>")
        return {"code": result.returncode, "output": output.strip(), "stdout": stdout, **({"raw":raw} if raw is not None else {})}

    def _must(self, actor, *args):
        result = self._git(actor, *args)
        if result["code"]:
            raise RuntimeError(result["output"])
        return result["output"]

    def _setup(self):
        learner = self.repos / "you"
        learner.mkdir()
        self._must("you", "init", "-b", "main")
        self._identity("you", "Learner")
        initial_files = PROJECT_FILES if self.mission == "playground" else {"schedule.md": INITIAL, "accessibility.md": "Entrance details pending.\n"}
        for name, content in initial_files.items():
            (learner / name).write_text(content, encoding="utf-8")
        self._must("you", "add", "--", *self.files)
        self._must("you", "commit", "-m", "Create bookshop website" if self.mission == "playground" else "Plan community day")
        self.base = self._must("you", "rev-parse", "HEAD")
        if self.mission in ("collaboration", "playground"):
            (self.repos / "origin").mkdir()
            self._must("origin", "init", "--bare", "-b", "main")
            self._must("you", "remote", "add", "origin", str(self.repos / "origin"))
            self._must("you", "push", "-u", "origin", "main")
            self._must("you", "clone", "--no-hardlinks", str(self.repos / "origin"),
                       str(self.repos / "sam"))
            self._identity("sam", "Sam")

    def _identity(self, actor, name):
        self._must(actor, "config", "user.name", name)
        self._must(actor, "config", "user.email", name.lower() + "@gitcraft.invalid")

    def _actor(self, actor, writable=False):
        allowed = ("you",) if self.mission == "staging" else ("you", "sam", "origin")
        if actor not in allowed or (writable and actor == "origin"):
            raise LabError("Choose an editable collaborator workspace. Origin has no working files.")
        return actor

    def _file(self, actor, name):
        self._actor(actor, writable=True)
        if name not in self.files:
            raise LabError("Choose one of the files in this sample project.")
        path = self.repos / actor / name
        if path.is_symlink() or path.resolve().parent != (self.repos / actor).resolve():
            raise LabError("The file is outside this workspace.")
        return path

    def edit(self, actor, name, content):
        with self.lock:
            if not isinstance(content, str) or len(content.encode("utf-8")) > 8192:
                raise LabError("Keep lesson files under 8 KB.")
            path = self._file(actor, name)
            self._save_undo()
            path.write_text(content, encoding="utf-8")
            return self.state()

    def _arguments(self, command):
        if not isinstance(command, str) or len(command) > 512:
            raise LabError("Enter a Git command under 512 characters.")
        if any(ord(char) < 32 for char in command):
            raise LabError("Use a single-line Git command.")
        try:
            args = shlex.split(command)
        except ValueError as error:
            raise LabError("Close the quoted command message and try again.") from error
        if not args or args.pop(0) != "git":
            raise LabError("This is a Git console. Try git status. Shell commands are not available.")
        fixed = [("status",), ("diff",), ("diff", "--staged"), ("diff", "--cached"),
                 ("log",), ("log", "--oneline"), ("log", "--oneline", "--graph", "--all"),
                 ("show", "HEAD"), ("branch",), ("branch", "-vv"), ("remote", "-v"),
                 ("fetch", "origin"), ("push",), ("push", "origin", "main"),
                 ("merge", "origin/main"), ("merge", "--abort")]
        if tuple(args) in fixed:
            return args
        if len(args) == 3 and args[:2] == ["commit", "-m"] and args[2].strip():
            return args
        branch = r"[A-Za-z][A-Za-z0-9_-]{0,31}"
        if len(args) == 2 and args[0] in ("branch", "switch") and re.fullmatch(branch, args[1]):
            return args
        if len(args) == 3 and args[:2] == ["switch", "-c"] and re.fullmatch(branch, args[2]):
            return args
        if len(args) == 2 and args[0] == "merge" and re.fullmatch(r"(?:origin/)?" + branch, args[1]):
            return args
        if ((len(args) == 3 and args[:2] == ["push", "origin"] and re.fullmatch(branch, args[2])) or
                (len(args) == 4 and args[:3] == ["push", "-u", "origin"] and re.fullmatch(branch, args[3]))):
            return args
        if args and args[0] in ("add", "restore"):
            tail = args[1:]
            if args[0] == "restore" and tail[:1] == ["--staged"]:
                tail = tail[1:]
            if tail[:1] == ["--"]:
                tail = tail[1:]
            if tail and all(name in self.files for name in tail):
                return [args[0]] + (["--staged"] if "--staged" in args else []) + ["--"] + tail
        file_pattern = "|".join(re.escape(name) for name in self.files)
        if len(args) == 2 and args[0] == "show" and re.fullmatch(r"(HEAD|origin/main):(?:" + file_pattern + ")", args[1]):
            return args
        raise LabError("That command form is outside this prototype. No command ran. Open Command reference for supported forms.")

    def command(self, actor, command):
        with self.lock:
            self._actor(actor, writable=True)
            args = self._arguments(command)
            creates_branch = (args[0] == "branch" and len(args) == 2 and not args[1].startswith("-")) or args[:2] == ["switch", "-c"]
            if creates_branch and len(self._must(actor, "for-each-ref", "--format=%(refname)", "refs/heads").splitlines()) >= 12:
                raise LabError("This small playground supports up to 12 branches per workspace.")
            if args[0] in ("add", "restore", "commit", "fetch", "push", "merge", "switch") or creates_branch:
                self._save_undo()
            result = self._git(actor, *args)
            public = {key: result[key] for key in ("code", "output")}
            self.events.append({"actor": actor, "command": command, **public})
            return {**public, "state": self.state()}

    def teammate(self):
        with self.lock:
            if self.mission != "collaboration":
                raise LabError("Sam joins in the collaboration exercise.")
            if self.sam_commit:
                raise LabError("Sam's update has already been published. Restore the lesson to repeat it.")
            if self._must("sam", "status", "--porcelain"):
                raise LabError("Sam has unsaved work. Commit or restore it before publishing the authored update.")
            self._save_undo()
            (self.repos / "sam" / "accessibility.md").write_text(ACCESS, encoding="utf-8")
            self._must("sam", "add", "--", "accessibility.md")
            self._must("sam", "commit", "-m", "Add step-free entrance")
            self.sam_commit = self._must("sam", "rev-parse", "HEAD")
            result = self._git("sam", "push", "origin", "main")
            if result["code"]:
                self.sam_commit = None
                raise LabError("Sam could not push. Restore the lesson and try the intended sequence.")
            public = {key: result[key] for key in ("code", "output")}
            self.events.append({"actor": "sam", "command": "Authored teammate update", **public})
            return {**public, "state": self.state()}

    def _remove_owned(self, directory):
        directory = Path(directory).resolve()
        if directory.parent != self.root or directory.name not in ("repos", "undo", "restore-ready"):
            raise LabError("Refusing to remove a path outside this playground.")
        def writable_retry(operation, path, error):
            target = Path(path).resolve()
            if directory not in target.parents or not isinstance(error[1], PermissionError):
                raise error[1]
            target.chmod(stat.S_IWRITE | stat.S_IREAD)
            operation(path)
        if directory.exists():
            shutil.rmtree(directory, onerror=writable_retry)

    def _save_undo(self):
        destination = self.root / "undo"
        self._remove_owned(destination)
        self.undo_available = False
        shutil.copytree(self.repos, destination)
        self.undo_metadata = {"events": [dict(event) for event in self.events], "sam_commit": self.sam_commit}
        self.undo_available = True

    def _restore_repositories(self, source):
        ready = self.root / "restore-ready"
        self._remove_owned(ready)
        shutil.copytree(source, ready)
        self._remove_owned(self.repos)
        ready.rename(self.repos)

    def undo(self):
        with self.lock:
            if not self.undo_available:
                raise LabError("There is no action to undo yet.")
            self._restore_repositories(self.root / "undo")
            self.events = self.undo_metadata["events"]
            self.sam_commit = self.undo_metadata["sam_commit"]
            self.undo_available = False
            return {"code": 0, "output": "Restored the entire playground to before the last action, including the other workspaces and shared repository.", "state": self.state()}

    def restore(self):
        with self.lock:
            self._save_undo()
            self._restore_repositories(self.checkpoint)
            self.sam_commit = None
            self.events.clear()
            return self.state()

    def _text(self, actor, revision, name):
        result = self._git(actor, "show", revision + ":" + name)
        return result["stdout"] if result["code"] == 0 else None

    def _ref(self, actor, ref):
        result = self._git(actor, "rev-parse", "--verify", ref)
        return result["output"] if result["code"] == 0 else None

    def snapshot(self, actor, commit):
        with self.lock:
            self._actor(actor)
            if not isinstance(commit, str) or not re.fullmatch(r"(?:[0-9a-f]{40}|[0-9a-f]{64})", commit):
                raise LabError("Choose a snapshot from the graph.")
            if self._git(actor, "cat-file", "-e", commit + "^{commit}")["code"]:
                raise LabError("That snapshot is not available in this workspace.")
            return {"commit": commit, "files": {name: self._text(actor, commit, name) for name in self.files}}

    def preview_file(self, actor, name):
        with self.lock:
            if self.mission != "playground" or name not in ("index.html", "styles.css"):
                raise LabError("Preview is available for the bookshop sample.")
            return self._file(actor, name).read_text(encoding="utf-8")

    def _graph(self, actor):
        rows = self._must(actor, "log", "--topo-order", "--all", "--format=%H%x1f%P%x1f%s%x1f%an", "-61").splitlines()
        commits = []
        for row in rows[:60]:
            oid, parents, message, author = row.split("\x1f", 3)
            commits.append({"id": oid, "parents": parents.split(), "message": message, "author": author})
        refs = []
        for row in self._must(actor, "for-each-ref", "--format=%(refname)%09%(objectname)", "refs/heads", "refs/remotes").splitlines():
            name, oid = row.split("\t", 1)
            refs.append({"name": name, "target": oid})
        return {"commits": commits, "refs": refs, "truncated": len(rows) > 60}

    def _repo_signature(self, actor):
        # These are small, owned fixtures. Observe native repo/worktree changes,
        # including changes made outside the gateway, without spawning Git.
        repo = self.repos / actor
        entries = []
        for path in sorted(repo.rglob("*")):
            info = path.lstat()
            # Git creates/removes index.lock during status. Directory mtimes
            # reflect that temporary bookkeeping, not a changed repository.
            entries.append((str(path.relative_to(repo)), info.st_mode,
                            None if stat.S_ISDIR(info.st_mode) else
                            (info.st_size, info.st_mtime_ns, info.st_ctime_ns)))
        return tuple(entries)

    def _file_versions(self, actor):
        queries = [(version, name, prefix + name) for version, prefix in
                   (("staged", ":"), ("committed", "HEAD:")) for name in self.files]
        response = self._git(actor, "cat-file", "--batch",
                             input_data=("\n".join(query[2] for query in queries) + "\n").encode())
        if response["code"]:
            raise RuntimeError(response["output"])
        data, offset, versions = response["raw"], 0, {}
        for version, name, query in queries:
            end = data.index(b"\n", offset)
            header, offset = data[offset:end], end + 1
            if header.endswith(b" missing"):
                versions[version, name] = None
                continue
            _, kind, size = header.split()
            if kind != b"blob":
                raise RuntimeError("Expected a project file.")
            size = int(size)
            versions[version, name] = data[offset:offset+size].decode("utf-8", "replace").replace("\r\n", "\n")
            offset += size + 1
        return versions

    def _view(self, actor):
        signature = self._repo_signature(actor)
        cached = self._view_cache.get(actor)
        if cached and cached[0] == signature:
            # A returned before-state must not alias a future cached view.
            return copy.deepcopy(cached[1])
        bare = actor == "origin"
        branch_result = self._git(actor, "symbolic-ref", "--short", "HEAD")
        branch_name = branch_result["output"] if branch_result["code"] == 0 else None
        upstream = None if bare else self._git(actor, "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}")
        result = {"bare": bare, "head": self._ref(actor, "HEAD"),
                        "branch": branch_name, "graph": self._graph(actor),
                        "trackingName": upstream["output"] if upstream and upstream["code"] == 0 else None,
                        "tracking": None if bare else self._ref(actor, "@{upstream}"),
                        "history": self._must(actor, "log", "--oneline", "--graph", "--all", "-8"),
                        "files": {}}
        if not bare:
            result["status"] = self._must(actor, "status", "--short")
            versions = self._file_versions(actor)
            for name in self.files:
                result["files"][name] = {
                    "working": self._file(actor, name).read_text(encoding="utf-8"),
                    "staged": versions["staged", name],
                    "committed": versions["committed", name]}
        self._view_cache[actor] = (self._repo_signature(actor), copy.deepcopy(result))
        return result

    def state(self):
        with self.lock:
            actors = ["you"] if self.mission == "staging" else ["you", "sam", "origin"]
            views = {actor: self._view(actor) for actor in actors}
            if self.mission == "playground":
                return {"lessonId": self.root.name, "mission": self.mission, "canUndo": self.undo_available, "views": views, "complete": False, "feedback": "Explore the files and make your own changes.", "events": self.events[-40:]}
            saved = self._text("you", "HEAD", "schedule.md") == TARGET
            changed = self._ref("you", "HEAD") != self.base
            clean = not self._must("you", "status", "--porcelain")
            if self.mission == "staging":
                complete = saved and changed and clean and self._text("you", "HEAD", "accessibility.md") == "Entrance details pending.\n"
                feedback = "Commit the 11:00 start time while leaving the entrance details unchanged."
                if changed and not saved:
                    feedback = "Your commit does not contain the 11:00 start time. Compare the working file, staged content, and saved commit."
                elif saved and not clean:
                    feedback = "The intended time is committed. Inspect the remaining changes before finishing."
            else:
                remote = self._ref("origin", "main")
                retains = bool(self.sam_commit) and self._git("you", "merge-base", "--is-ancestor", self.sam_commit, "HEAD")["code"] == 0
                complete = saved and clean and retains and self._text("you", "HEAD", "accessibility.md") == ACCESS and remote == self._ref("you", "HEAD")
                feedback = "Publish the 11:00 start time while keeping Sam's step-free entrance update."
                if self.sam_commit and views["you"]["tracking"] != remote:
                    feedback = "Origin has changed. Your locally remembered origin/main may be out of date. What would refresh that knowledge?"
                elif self.sam_commit and not retains:
                    feedback = "Your clone knows about Sam's update, but your current branch has not integrated it yet."
                elif retains and remote != self._ref("you", "HEAD"):
                    feedback = "Your branch includes Sam's commit. Check the project contents, then publish the combined work."
            if complete:
                feedback = "Task complete. Explain what changed, what stayed local, and how you verified the result."
            return {"lessonId": self.root.name, "mission": self.mission, "canUndo": self.undo_available, "views": views, "complete": complete,
                    "feedback": feedback, "events": self.events[-40:]}


def create_lab(parent, mission):
    return Lab(Path(parent) / uuid.uuid4().hex, mission)
