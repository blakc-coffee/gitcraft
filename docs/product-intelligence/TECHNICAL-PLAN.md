# GitCraft technical choices — proposed v0.1

Date: 2 November 2026. Planning only. No runtime, library, vendor, package, frontend, or deployment has been implemented or provisioned.

## Architecture decision

Use a browser client with native Git executing in isolated, disposable, server-side lab sessions. The first prototype is invite-only and restricted to trusted authored fixtures. A real Git capstone then runs in the learner's ordinary local terminal. Browser delivery does not require that Git itself be simulated.

The primary reason is semantic correctness: the learning tasks depend on actual staged content, failures, unmerged state, ancestry, and independent repositories. Native execution does not guarantee good teaching or correct instrumentation; it eliminates the need to reimplement these Git behaviors as the default engine.

| Choice | Recommendation and tradeoff | Revisit trigger |
| --- | --- | --- |
| Git engine | Native Git, version pinned per lab release; actual output retained | Required behavior fails or deployment cannot meet safety/cost gates |
| Browser-only JS Git model | Suitable for a clearly labeled conceptual demonstration; not the practical command source of truth | A tightly scoped prototype needs no command-fidelity claims |
| isomorphic-git | Do not select by convenience alone. Its [merge API](https://isomorphic-git.org/docs/en/merge) documents different API-level conflict handling and limitations; validate a pinned version against required fixtures | It passes conformance, reduces total maintenance, and can honestly expose the supported CLI surface |
| Browser-native Git/WASM | Time-box a feasibility spike only if hosted cost or privacy warrants it. No runtime has been verified here | Demonstrates all required commands, local transport between repos, persistence, browser support, and acceptable startup/memory |
| Hosting boundary | Reuse a maintained hardened sandbox or equivalent isolation primitive; one lab filesystem per authorized session. A generic container alone is not a completed isolation design | Independent review and abuse tests establish acceptable risk; provider/budget approved |
| Client technology | TypeScript is a reasonable proposed shared-schema language; React/Vite is a candidate for the later interactive client. No existing stack to preserve; choose after prototype needs are measured | Existing team expertise or a simpler accessible implementation argues otherwise |
| Feedback | Authored rules using observed evidence and mission predicates; human-scored explanation rubric in pilot | Proven need for richer feedback, with measured correctness before any AI addition |
| Persistence | Native whole-lab checkpoints plus small progress metadata; no distributed event platform required | Course scale or authoring needs exceed this simple model |

## Components and data flow

1. **Scenario package:** versioned initial fixture, competencies, available perspectives, supported operations, deterministic teammate events, acceptance predicates, hint rules, and independent variants.
2. **Browser client:** task, small text editor, Git command console, native output, optional state inspection, perspective selection, and progress. Presentation does not own Git truth.
3. **Session service:** authorizes session access, assigns the isolated worker, enforces limits, manages expiry/checkpoints, and serializes actions.
4. **Command gateway:** parses a documented grammar into explicit argument arrays; identifies the active clone; rejects unsupported operations before execution. It never invokes a host shell with learner input.
5. **Native Git worker:** controlled environment and fixture filesystem. The learner clone and teammate clone have separate repositories; origin is bare. Git supplies the actual behavior.
6. **State collector:** obtains repository facts through stable Git output/plumbing, plus controlled file reads. It reports source repository and observation time. It does not infer an action's outcome from the requested command alone.
7. **Evaluator and feedback:** checks postconditions, preserved intentions, and relevant history. Returns completion, mismatch, or unknown; never invents a diagnosis if evidence is unavailable.

Flow: request with session/repository/action/version → authorization and grammar/path validation → serialized execution → capture native result → collect actual post-state → evaluate → persist acknowledged action/checkpoint metadata → return evidence and feedback. Teammate actions travel through the same execution and observation path.

Use a small action journal for debugging/replay, not as a second Git implementation. Store action IDs and observed revisions so a reconnect can recover the acknowledged result. A repeated request must not run a commit twice. A crash in an uncertain state requires reconciliation from Git and a checkpoint option; it must not be automatically retried as if nothing happened.

## State model and semantic invariants

Per clone: working files; index entries including unmerged stages; HEAD target/detached state; local refs; remote-tracking refs; relevant object/history facts; remote configuration; operation-in-progress state. Per bare remote: objects and refs, without fabricated working files or staging. Per session: active perspective, scenario version, teammate event cursor, assessment assistance, and checkpoint references.

Use independent clones for people. [Linked worktrees share repository data](https://git-scm.com/docs/git-worktree), so they are not interchangeable with separate collaborators. A [bare repository](https://git-scm.com/docs/gitrepository-layout) is the right constrained remote for this lab.

Must preserve these distinctions:

- Working content, staged content, and committed content can all differ. Untracked and ignored content are separate concepts.
- Branches name commits; HEAD identifies the current checkout context. Branches are not people or duplicate folders.
- Clone-local tracking refs are observations, not a live view of origin. Label ahead/behind with the comparison ref and observation freshness; “unknown since last communication” is valid.
- Observer mode may inspect all repositories but must not write local refs or silently fetch. The active-clone view only exposes that clone's evidence.
- A rejected command may have meaningful output or partial effects; determine actual post-state. Do not assume every nonzero exit is a no-op.
- Merging can fast-forward, create a merge commit, fail before changing state, or leave an unfinished merge. Grade the particular fixture's valid outcomes.
- Git snapshot history does not automatically protect every uncommitted edit. Lab checkpoint restoration is a separate product facility.

Canonical behavior is checked against [Git fetch](https://git-scm.com/docs/git-fetch), [push](https://git-scm.com/docs/git-push), and [pull](https://git-scm.com/docs/git-pull). Do not generalize a fixture-specific observation to every possible flag/configuration.

## Command and editing contract

Initial supported command families: init, status, diff including staged comparisons, add explicit paths, commit with message, log, show, branch inspection, switch/create branch, merge/abort, clone from the lesson origin, remote inspection, fetch, push with taught upstream forms, restore, and revert of simple non-merge commits. Teach `pull --ff-only` explicitly; divergence should lead to deliberate integration. Specify actual options and quoting rules during the engine spike, not just executable names.

The console is a Git practice console, not Bash or PowerShell. It supports normal quoted commit messages but no pipes, redirection, command substitution, arbitrary environment assignment, or command chaining. Navigation/editing are bounded lab controls initially; the real-Git bridge teaches the learner's actual shell.

Reject arbitrary `-c`, executable helpers, arbitrary config writes, user-supplied Git paths, external URLs, custom hooks/filters, signing programs, aliases that execute commands, and unrestricted help/viewer execution. A restricted config lesson can set only fictional local identity through a trusted operation; it must not expose general configuration mutation.

File edits allow only authored text paths, bounded file sizes, and no `.git` metadata editing. Path checks apply to reads as well as writes; canonicalize inside the lab and reject traversal, symlink/junction escape, or device paths. A command being “Git” is not a security boundary.

Equivalent solutions inside the supported grammar should pass. If a valid external Git solution is outside it, identify the lab limit and provide a supported route without claiming the external solution is wrong. Assessment tooling must not punish documentation lookup or harmless inspection commands.

## Deterministic scenarios, feedback, and checkpoint design

Prefer declarative, versioned fixture specifications and trusted setup helpers over learner-supplied scripts. A mission includes a starting state, contributor intentions, event triggers, goal predicates, disallowed destructive shortcuts, hints, and a known-correct demonstration used only for author testing. Goal checks target outcomes rather than a prescribed command transcript.

For example, a conflict task requires the corrected schedule and accessibility instruction in the resulting file, both contributor commits retained in acceptable ancestry, no unfinished merge, and the intended remote ref updated. No conflict markers is only one check. Define each task's invariants carefully so legitimate alternate histories are accepted where appropriate.

Hints use the actual changed and unchanged facts. Explanations should be short and local to the mistake. Never conceal the native error behind a generic failure badge. Distinguish command failure, successful command but unmet goal, observation failure, and infrastructure failure.

Checkpoint all repositories, working files including untracked content, indexes, operation state, refs/config within the lab, and the scenario event cursor. Pause the action queue while capturing/restoring; verify completeness before publishing a checkpoint. Replay uses recorded actor order and fixture version; it need not reproduce wall-clock timestamps or commit hashes unless metadata is controlled.

Restore returns the whole lab to one consistent point, including Sam and origin. A partial rewind would teach impossible histories. Assessment checkpoints are disabled as an aid; a restart begins a new attempt, not an independent success.

## Execution, privacy, and lifecycle

Before any invited external browser session: enforce per-session authorization, unprivileged execution, separate filesystem/process boundaries, no host or personal-folder mounts, no container-control socket, no host secrets, scrubbed environment and Git configuration, no inherited credentials, blocked internet egress, local lab remotes only, memory/CPU/process/disk/time quotas, and tested cleanup. Use the isolation system's own controls; a command parser complements them.

The service must protect against cross-session IDs, replayed mutation requests, CSRF, path escape, unsafe rendered output, and resource exhaustion. Render source/output as text; sanitize terminal controls and prevent file contents from becoming executable HTML. Lab fixtures contain no learner-controlled executable hooks. No arbitrary package installation or network fetch is exposed.

Provisional pilot limits: 30-minute idle worker stop; checkpoint retention up to 24 hours; at most five retained checkpoints per session; explicit total session lifetime/size limits set from the spike. Show expiry and resume behavior clearly. Store course milestone metadata locally with versioning; it is a convenience record, not an authoritative completion certificate. Losing browser storage can lose anonymous resume access, which must be explained. Allow a user to clear progress and request session deletion.

Keep operational logs content-free where possible. Research consent is separate from course access. Default analytics: scenario/competency ID, coarse outcome, hint level, runtime duration, error category. Do not store raw personal commands, file contents, IP-derived profiles, or explanations as learning analytics by default. Exact retention, worker provider, operating region, and privacy text remain pre-release decisions.

## Real Git bridge

Provide OS-specific installation/location/editor guidance only at the transfer stage. Create a new disposable task folder, configure identity locally, and establish a local bare remote plus independent clone; do not change global settings or existing repositories. The learner uses an ordinary terminal and editor, with docs available and no special observer.

During the pilot a facilitator can verify evidence locally. For the MVP, a transparent read-only local checker is a candidate: it checks only the explicit task root, displays what it inspected, and does not upload files or credentials. Scope/authentication/setup of an actual external Git service is a later optional module. A download's instructions must be inspectable; do not make opaque shell installation the graduation requirement.

## Verification matrix

| Test | Required result | Requirements |
| --- | --- | --- |
| Edit A → stage A → edit B → commit | Commit contains A, working file retains B, observations and feedback agree | R2, R3, R6 |
| Selected file + ignored/untracked scratch | Only intended content enters the commit; ignore does not retroactively untrack existing content | R2, R3 |
| Branch/merge fixtures | Correct active branch/HEAD, fast-forward and non-fast-forward outcomes; dirty-worktree cases preserve edits or produce native refusal as appropriate; no fictional separate folders | R3 |
| Sam push, then learner fetch | No automatic update in learner; fetch changes the intended local observations without implicit integration in this fixture | R3, R4 |
| Divergent push | Rejection preserves local work; later integration retains both required contributions | R4, R6 |
| Conflict, abort, resolve | Correct unmerged observation; abort clean-start fixture restores expected state; completed merge preserves both intentions | R5, R6 |
| Unstage, restore, revert | Correct layer affected; unwanted edit discard distinguished from undoing a committed change | R5 |
| Alternate valid solutions and harmful shortcuts | All supported valid variants accepted; marker removal with lost intention, reset/reclone cheating, or wrong remote result rejected | R6, R7 |
| Whole-lab restore | All clones/origin and event cursor match a consistent checkpoint, including uncommitted/untracked state | R5, R8 |
| Reconnect/duplicate request/crash | Acknowledged action not lost or executed twice; uncertain state surfaced and reconciled | R8 |
| Placement tests | Both cohorts routed by demonstrated prerequisites; keyboard and slower completion do not cause false failure | R1, R9 |
| Boundary and abuse probes | No host/cross-session access, helper execution, egress, metadata edit, unbounded consumption, or retained data past policy | R10 |
| Browser/accessibility | Supported desktop browsers; narrow review mode; full keyboard flow, visible focus, text graph equivalent, zoom/reflow, contrast and reduced motion | R9, R11 |
| Performance | Proposed targets: warm commands p95 under 1 second for tiny fixtures; session ready p95 under 10 seconds on the declared test connection; measure cold starts separately | R1, R10 |
| Unfamiliar terminal task and delayed task | Curriculum rubric passes without lab aids; setup failures recorded separately | R7 |

The correctness suite must inspect raw Git repository facts separately from the UI collector/evaluator, so a shared parsing bug cannot trivially validate itself. Keep known-good and deliberately wrong outcomes. Run the suite against the pinned Git release and supported local capstone versions; do not assert compatibility with every version.

## Cost and build-versus-reuse

Reuse native Git, an established isolation/runtime facility, small accessible editor/input primitives where needed, and standard storage. Build the competency map, trusted fixtures, evidence projection, narrow command contract, assessment predicates, and feedback rules. Avoid a custom Git implementation, orchestration platform, general IDE, and AI dependency.

Measure cost per completed learner as worker compute + startup/idle allocation + checkpoint storage + service overhead + transfer/support time, divided by completed learners. Separately report cost per started session so abandonment is visible. Do not quote a provider price before selecting and verifying it. Budget and maximum concurrency need user input before provisioning; an invitation cap controls the first pilot.
