# GitCraft curriculum map — proposed v0.1

Date: 2 November 2026. Confirmed audience: both first-time Git learners and people who know basic commands but struggle with collaboration. Confirmed delivery: start in a browser, then complete a real Git task. Programming knowledge is unnecessary. All timings and mastery thresholds below are planning hypotheses to calibrate with learners.

Use a small shared community-event handbook: `welcome.md`, `schedule.md`, and `accessibility.md`. Changes have understandable intentions, such as correcting a start time while preserving an accessibility note. Start with one file; introduce the others as needed. The capstone uses a different project and vocabulary.

## What graduating means

A learner can inspect a repository, make an intentional commit, work on a branch, integrate and share changes, resolve a small text conflict while preserving both intentions, recover from common mistakes, and establish whether their local knowledge is current. They can use documentation without needing a step-by-step solution.

This is foundational practical competence. It does not certify advanced Git, production incident response, authentication expertise, or effective collaboration with humans.

## Short placement check

Offer “I am new to Git” to enter M1 immediately, or a 5–8 minute browser check. Use three compact probes: distinguish working/staged/committed content after an edit; make an intentional commit in a prepared fixture; predict what a teammate push and a local fetch change. No installation or account is required at entry.

Route by demonstrated prerequisites, not self-confidence or typing speed. A conceptual guess alone cannot skip practical foundations. A learner who demonstrates the M1–M3 outcomes can begin M4; one who also demonstrates branch/integration prerequisites can begin M5. Add a brief branch task only for that second skip. Uncertainty routes to a short refresher, and learners can choose the full path. Keep the check low stakes, accessible, and restartable. Reuse the competency map, not the hidden final-assessment fixtures.

## Eight missions and the dependency chain

| Mission | Goal and prerequisite | Commands / concepts introduced | Mistake and useful feedback | Evidence of understanding |
| --- | --- | --- | --- | --- |
| M1 — Where is my work? | No prerequisite. Locate the current folder, edit a file, identify a repository. Briefly preview why two people need independent lines of work. | Files, current directory, shell versus Git, `git init`, `git status`; lab navigation, then native `pwd`/`cd`/listing in the bridge | Running Git outside the repo: show the actual error and how to establish location | Find a fresh repo, distinguish a file edit from a saved Git snapshot, and explain what status reports |
| M2 — What did I actually save? | M1. Create an intentional snapshot without including an unrelated note. | `git diff`, `git add <path>`, `git diff --staged`, `git commit -m`, `git log --oneline`, `git show`; tracked/untracked; `.gitignore` for a scratch file | Stage version A, then edit to B. Commit contains A; use the two diffs and saved content to explain the difference | Predict the saved version on a changed fixture; make the intended commit and leave unrelated work uncommitted |
| M3 — Fix the right layer | M2. Correct an accidentally staged file, then undo an unwanted edit and a committed mistake | `git restore --staged <path>`, `git restore <path>`, `git revert <commit>` on a simple non-merge commit; local versus shared consequences | Confusing unstaging with deleting edits: identify which content is retained or discarded before executing | Recover with Git operations in a new fixture, preserve required content, and distinguish a lab checkpoint from Git recovery |
| M4 — Work in parallel | M2–M3. Build a small change on a topic branch, then integrate a nonconflicting change | `git branch`, `git switch -c`, `git switch`, `git log --oneline --graph --all`, `git merge`; HEAD, branch tips, fast-forward and two-parent merge | Treating branches as separate folders: inspect current branch and files; changing branch does not mean another person's checkout changed | Finish a branch task with clean intended history/content; explain which branch moved and why a merge need not create a new commit |
| M5 — Who has my change? | M4. Use learner clone, Sam's clone, and a bare origin to distinguish saving from sharing | `git clone`, `git remote -v`, `git push -u origin <branch>`, `git fetch origin`, explicit integration; local branches, remote-tracking refs, actual remote refs | Sam pushes but learner files and locally remembered remote state stay unchanged until the learner communicates | Predict which states change at each step, then inspect evidence from the active clone; identify the bare remote as having no working files/index |
| M6 — Why was my push rejected? | M5. Preserve both valid changes when histories diverge | Fetch, inspect ancestry/diffs, `git merge origin/main`, push; teach explicit `git pull --ff-only` only after fetch/integration is understood | A non-fast-forward rejection protects existing history; hint asks what the learner has not integrated, instead of suggesting force push | Resolve a new divergence using diagnostic commands; remote history retains both required contributions |
| M7 — Agree on the file | M6. Combine overlapping changes using written contributor intentions | Conflict markers and unmerged state; `git status`, inspect both versions, edit, add, commit; `git merge --abort` for a clean-start scenario | Removing markers alone may lose a valid requirement. Feedback names the missing intention and points to relevant lines | Produce an agreed result, finish the merge, verify history/content; separately demonstrate aborting and retrying |
| M8 — Deliver independently | M1–M7. Complete a fresh shared task with a small incident and one recovery requirement | Ordinary installed Git, editor, shell navigation, local identity config, documentation; no new core Git concepts | The learner must choose what to inspect; no unsolicited command hints or omniscient graph | Pass the transfer rubric below, then a changed delayed task seven days later |

Estimated practice: M1 15–25 minutes; M2–M5 20–35 minutes each; M6–M7 25–40 minutes each; M8 40–60 minutes. With repetition and setup, plan roughly 4–6 hours spread across sessions, not a guaranteed completion time. Let learners pause at checkpoints.

The placement check is part of the MVP. It changes the route through these missions, not the final competence standard. Track placement mistakes during the pilot: a learner repeatedly needing prerequisite hints should receive an offered refresher, not an unexplained failure.

## How assistance fades

Each mission has a worked example, a supported attempt, and a changed independent variant. These are fixture variants within eight missions, not eight additional courses.

| Mode | Learner receives | Learner must supply | What completion records |
| --- | --- | --- | --- |
| Demonstrated | Short explanation, one command example, relevant before/after evidence | A prediction at one critical moment and an attempt | Exposure only |
| Supported | Goal, native output, relevant state inspection, optional hint ladder | Command choice and interpretation | Practised; record assistance used |
| Independent lab | Goal and acceptance criteria, ordinary output, documentation access | Diagnosis, commands, verification | Independent lab result; optional hints convert it back to practice |
| Real-environment transfer | A fresh task in an ordinary terminal/editor; no lab observer, restore button, or recipe | Own workflow and evidence-based explanation | Practical transfer result, separately from lab completion |

Do not force a prediction before every command. Use it where a misconception matters: editing after staging, switching branches, a teammate pushing, fetching, discarding edits, or resolving a conflict. Show explanations after attempts so prompts do not become answer keys.

Hint ladder: identify an observable symptom → name the relevant concept → suggest an inspection command → show a worked command example. Hints are help, not penalties. After a worked solution, require a different variant before recording independence. Permit reference lookup throughout; memorizing flags is not the objective.

## Collaboration sequence: one person explores two perspectives

During M5, the learner explicitly controls both clones in turn. The active identity and repository path are always clear. Origin is inspect-only. During M6–M7, Sam's actions are deterministic authored events, triggered at named lesson boundaries rather than surprise timers. The learner can inspect Sam in teaching mode; independent mode withholds that privileged view.

Example causal trace, starting with commit C0 everywhere:

| Action | Learner clone | Sam clone | Bare origin |
| --- | --- | --- | --- |
| Sam edits and commits C1 | Still at C0; no automatic update | `main` at C1; working file reflects C1 | `main` still C0 |
| Sam pushes C1 | Still at C0; learner's `origin/main` still C0 | Sam has published C1 | `main` at C1 |
| Learner fetches | Learner's `origin/main` at C1; local `main` and working file still C0 in this fixture | Unchanged | Unchanged |
| Learner integrates with a fast-forward | Local `main` and working file now reflect C1 | Unchanged | Unchanged |

Then vary the situation: the learner independently commits C2 based on C0 before fetching. Their next push is rejected; fetching reveals C1; integrating may produce a merge or a conflict depending on the changes. The learner must preserve both requirements and push the integrated result. Do not conflate divergence with a textual conflict: include a nonconflicting variant first.

The observer can expose all three repositories for teaching. It must say that this is special lab visibility. The ordinary view must never silently fetch or present remote truth as if the learner's clone already knew it. In real Git, the learner cannot inspect another person's unpushed files through origin. These distinctions follow [Git's remote-branch model](https://git-scm.com/book/en/v2/Git-Branching-Remote-Branches).

## Feedback examples

Staged content: “Your commit saved the 10:00 start time. You changed the working file to 11:00 after staging. Compare the staged and unstaged differences to decide which version belongs in the next commit.”

Rejected push: “The remote contains a commit your current branch does not include. Your local change is still present. Inspect what arrived before deciding how to combine the work.”

Incomplete resolution: “The conflict markers are gone, but the step-free entrance instruction is missing. The task requires both the corrected start time and that instruction.”

Unsupported command: “This command form is outside this lab's supported set. No command ran. Here is the command reference.” Never fabricate native Git success or mislabel a product restriction as a Git rule.

## Browser simulation, native Git lab, and transfer

| Environment | What it can establish | What it cannot establish by itself |
| --- | --- | --- |
| Bounded browser simulator | Selected state transitions, predictions, pointer movement, rehearsal and vocabulary, if its semantics are correct | General CLI behavior, arbitrary repository workflows, real installation/configuration, authentication, or independent transfer |
| Browser interface backed by native Git | Actual file/index/history/ref behavior for supported operations, real errors and conflicts, repeatable two-clone collaboration mechanics | Familiarity with the learner's own shell/editor, platform-specific setup, real hosting permissions, or human coordination |
| Ordinary local Git with a local bare remote | Installation, repo location, identity configuration, editor/shell workflow, genuine commit/fetch/merge/push, documentation use | Internet authentication, remote-service policy, pull-request review, or network failure handling |
| Optional real hosting bridge | Authentication and permissions, a remote URL, a small pull request and human review | Broad professional judgment from one exercise |

The optional hosted bridge is a later extension; the MVP must not claim its outcomes. A GitHub pull request is a hosting workflow, not a Git command. Core collaboration mechanics can be practised with two real clones on one machine without credentials.

## Mastery rubric and assessment integrity

Use a fresh fixture with changed files, branch names, and incident order. Allow documentation; do not grade command count or speed. Independent assessment offers a way to request help, but then records a supported attempt and supplies a new variant for reassessment.

Five dimensions, each scored 0 (not demonstrated), 1 (partly correct or prompted), 2 (independent with evidence): inspect and diagnose; construct intentional commits; integrate/share work; recover safely; explain and verify state. Proposed pass: at least 8/10, with no loss of required contributor content and no destructive shortcut that defeats the task. Time is diagnostic, not a hard failure for accessibility or unfamiliar typing.

The evaluator checks final content, ancestry, clean/unmerged state as relevant, and required work preserved. A short explanation records why the learner chose their actions. During the pilot a human scores this with the rubric; automated factual checks can assist, but an LLM is not the authority. Include variants where correct content alone is insufficient because required history was overwritten.

Record confidence before and after separately. Improvement in self-confidence without correct independent performance is a warning signal. Repeat a shorter unseen task after seven days; report nonattendance rather than counting it as demonstrated retention.

## After the MVP

Optional next modules: amend and reflog-based recovery; stash; interactive staging; rebase and rewritten history; cherry-pick; tags; real hosting and review; filesystem/line-ending differences. Do not teach force push, reset modes, or advanced rewriting as shortcuts around the foundational recovery lessons. Add them only with explicit consequences and suitable fixtures.
