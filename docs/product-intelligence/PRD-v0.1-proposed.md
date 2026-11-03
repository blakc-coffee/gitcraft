# GitCraft — proposed PRD v0.1

Drafted: 2 November 2026. Planning review completed: 3 November 2026. Status: historical planning baseline. A local native-Git prototype now exists. The current file-first playground direction supersedes the compulsory course and graph-first presentation; see [current direction](../../PLAYGROUND-DIRECTION.md).

**Recommendation:** build a browser-first Git diagnosis and recovery lab. A learner changes a small project, sees the evidence of what happened, explores a teammate's separate workspace when it helps, and graduates by solving a fresh task in ordinary Git without the teaching aids.

The initial investment should be a two-exercise validation, not a complete course or themed frontend. If the learning mechanism proves useful, expand to the eight-mission MVP described here.

## Baseline and decision status

The baseline comes from the user's request in this chat; no pre-existing PRD was supplied.

| Status | Requirements and proposals |
| --- | --- |
| Confirmed requirements | Teach practical Git from zero; practise commands; expose working files, staging, commits, branches, remotes, and collaboration; safe mistakes and useful feedback; move from guidance to independence; research alternatives before design/code |
| Confirmed clarification | Serve both absolute beginners and learners who know commands but struggle with collaboration; include a short placement check; start in a browser and finish with a real Git task |
| Confirmed design constraints | Retain Keel, Quarry, and Signal Console as references; allow other themes later; Command is a promising workspace format, not a locked decision |
| User idea to investigate | Switch between collaborators' workspaces to understand how different people's actions propagate |
| Research-backed improvements | Explicit local-versus-shared state, diagnosis and recovery practice, assessed transfer; see [research](RESEARCH.md) for evidence and limits |
| Proposed implementation choices | Native Git in isolated browser-accessible sessions; one learner plus one scripted teammate and a bare remote; deterministic feedback; eight missions; no account required for entry |
| Unverified hypotheses | Cross-perspective inspection plus fading assistance improves independent performance enough to justify a new product; placement can shorten the path without creating gaps |
| Material choices needing user input | Hosting budget/operational ownership, first supported learner OS for the final task, assessment success threshold, and whether a real hosting-service workflow belongs in a later release |

Planning does not authorize deployment, purchases, user recruitment, or implementation. The recommendations are concrete enough to approve or revise without silently locking an architecture or theme.

## Problem, users, and outcome

An absolute beginner may not know which folder a command acts on or the difference between saving a file and saving a commit. A command-familiar learner may successfully repeat add/commit/push but be unable to explain a rejected push, a stale branch indicator, or a conflict. The shared need is to choose a safe next action using evidence.

The current-workflow hypothesis is tutorial or video → copied command sequence → real collaboration surprise → guessing, asking for an exact command, or starting over. It needs interviews and observed attempts; it is not an established description of every learner.

Primary users are individual desktop/laptop learners preparing to contribute to a small shared project. Both entry groups use one competency map and the same final standard. Teachers and bootcamps may later distribute GitCraft, but classroom administration is outside the MVP. Other stakeholders are content authors, Git reviewers, and the operator responsible for safe runtime execution.

The desired outcome is independent foundational use: inspect, create intentional commits, branch, integrate, share, preserve another contributor's work, recover from common mistakes, and explain what evidence supports the result. The product does not promise expert Git mastery or successful human teamwork from a simulated teammate.

## Why this might deserve to exist

Existing tools already cover visual command practice and multiple repositories. [Learn Git Branching](https://github.com/pcottle/learnGitBranching) provides visual exercises; [Oh My Git!](https://ohmygit.org/) combines real Git and multi-repository learning. GitCraft's differentiation remains a testable proposition: coherent practice that teaches diagnosis and then demonstrates transfer after help disappears.

The strongest product moment is not watching a graph animate. It is a learner saying: “Sam has pushed a change, my local information is stale, and I know how to inspect and integrate it without losing either contribution.”

Keep the product only if this outcome is meaningfully better or easier to attain than with a simpler exercise pack or established tools. A more attractive interface, more commands, and more lessons are insufficient proof.

## Alternatives and recommendation

Criteria, in order: Git correctness and transfer; learner understanding; meaningful added value; feasible and testable MVP; safety/privacy; effort and maintainability. Relative effort is a planning judgment, not a measured score.

| Mechanism | Learner benefit / data and dependencies | Cost, feasibility, and safety | Main limit / demo value | Decision |
| --- | --- | --- | --- | --- |
| Browser workbook plus real-Git exercises | Authored tasks, documentation, fixtures; low visual complexity | Lowest custom engineering; eventual learner setup needed | Strong baseline; weaker immediate state feedback; can demonstrate recovery today | Use as comparator and fallback product |
| Browser-only command simulator | Instant safe experimentation; custom state engine and authored command grammar | Cheap hosting; semantic fidelity and a separate native transfer path require ongoing work | Good concept demo; simulated errors and conflict behavior may mislead | Do not make it the default practical-training engine |
| Browser lab backed by native Git | Real consequences, observed state, structured hints; isolated workers and scenario engine | Higher runtime/operational cost; safety and cost gates mandatory | Best fit for file/index/remotes reasoning; compelling two-workspace demonstration; efficacy unproven | Recommended, starting with an invited two-exercise pilot |
| Coach attached to a learner's own repository | Authentic tasks; access to arbitrary local histories/files, potentially AI | Highest privacy/safety variability and support burden | Personalized help but difficult reliable assessment; unnecessary for beginners | Exclude |

A browser-native Git/WASM implementation is an alternative execution substrate for the recommended lab, not a different learning product. Its feasibility is unverified; a time-boxed spike may replace hosting only if it passes the same behavior and browser tests. See [technical choices](TECHNICAL-PLAN.md).

## Core experience and collaboration model

The learning loop is a concrete task → selected prediction → edit or command → native output and relevant state evidence → explanation or hint → retry → unfamiliar task with less assistance. Predictions appear only at important conceptual changes.

Begin with a small text project. When collaboration becomes relevant, introduce three distinct places: **Your workspace**, **Sam's workspace**, and **Origin**. The first two are independent clones with separate files, staging areas, branches, and locally known remote state. Origin is a bare repository, inspected through history/refs without working files or staging.

The learner can explicitly take control of either person's workspace in early lessons. Switching is a teaching feature, not a Git command. The active repository remains unmistakable. Later, Sam performs deterministic authored actions and the learner loses privileged access to Sam's internals. There is no live multiplayer and no invented AI persona required.

One example: both people start from the same revision. Sam commits and pushes an accessibility correction. The learner has independently changed the schedule. The learner's attempted push is rejected. They inspect what they know, fetch, integrate both intentions, resolve an overlap if present, and verify the remote result. A later assessment repeats the underlying problem with different files and no observer view.

The exercise must reveal unchanged state too. A teammate's push does not refresh the learner's clone. Fetch is not automatically integration. A branch is not a person's workspace. Removing conflict markers does not establish that the result is correct. These are the teaching opportunities that justify multiple perspectives.

## Requirements and acceptance criteria

| ID | Requirement | Acceptance evidence |
| --- | --- | --- |
| R1 | Browser entry and placement | No install/account before first practice; 5–8 minute check routes by demonstrated prerequisites; new learners can enter M1 directly; both routes can revisit basics |
| R2 | Honest command and file practice | Supported forms execute native Git; editable text files and raw Git output remain available; unsupported input is explicitly rejected without mutation; console is not presented as a full shell |
| R3 | Scoped state inspection | Show working files, staged content, HEAD/branches, history, and relevant remote knowledge progressively; tests distinguish staged-then-edited content and stale tracking refs |
| R4 | Multiple perspectives | Two independent clones plus bare origin; control and inspect modes explicit; scripted actions reproducible; observer mode clearly privileged; no automatic fetch caused by viewing |
| R5 | Safe mistakes and recovery | Named whole-lab checkpoints restore all participants consistently; Git recovery exercises use real commands; UI explains the difference; required contributor content cannot disappear unnoticed |
| R6 | Useful assessment and feedback | Check content/ancestry/state and contributor intent, accept alternative correct solutions, explain one relevant mismatch, offer escalating hints; native failure and lesson-incomplete states remain distinct |
| R7 | Independent transfer | Fresh ordinary-terminal task, documentation allowed, no recipe/observer/checkpoint aid; score diagnosis, preserved work, recovery, and explanation; lab-only completion has a separate status |
| R8 | Resume and progress | Refresh does not lose an acknowledged action; local milestone record, visible session expiry, and bounded checkpoint retention; recovery from an expired session does not falsely report success |
| R9 | Accessible learning interactions | Keyboard-operable editing/commands/perspective changes; visible focus; graph has a readable textual equivalent; meaning never relies on color/motion; reduced-motion option |
| R10 | Contained, affordable execution | Session ownership, storage/process/network boundaries, abuse limits, expiry and cleanup pass before external access; measured per-session usage fits an approved budget |
| R11 | Flexible visual direction | Presentation and semantic state are independent; theme tokens can change without changing curriculum/behavior; none of the named references or Command layout is silently selected |

## MVP scope

After the validation gates: placement; eight missions with scaffolded and assessment variants; one text project; up to two clones and one bare remote per session; a modest editor and Git console; context-sensitive inspection; deterministic teammate events; native output; authored hints; semantic checks; whole-lab checkpoint/restore; resumable progress within documented limits; and a real Git bridge and capstone. The [curriculum map](CURRICULUM.md) specifies the route.

MVP collaboration means understanding distributed work and preserving both contributors' intentions. Human communication practice is limited to interpreting a short authored requirement; it is not a substitute for actual team negotiation.

Explicit exclusions: live multiplayer; accounts and social profiles; payments; LMS/classroom dashboards; leaderboards, streaks, certificates, or speed scoring; arbitrary repo import; access to user credentials or personal files; public external remotes from the lab; AI chat or AI grading authority; unrestricted shell execution; pull-request hosting integration; advanced rebase/reset/reflog training; an entire IDE; many simultaneous themes; mobile equivalence for intensive terminal work.

Responsive access remains required: reading/review and simple tasks must remain usable on narrow screens, with no essential information lost. Desktop is the supported setting for the full course and capstone in v1. Theme extensibility is in scope; building every theme now is not.

## Success measures and tests

Primary outcome: unfamiliar real-Git task completion with contributor work preserved and an adequate explanation, with documentation but no step-by-step assistance. Count all assigned learners in reporting; distinguish setup failure, abandonment, supported completion, and independent success.

Proposed formative pilot: 8 learners, four from each entry group. Before testing, agree on the curriculum's 8/10 rubric and no-work-loss rule. Target at least 6/8 independent completions, including at least 3/4 in each group; at least 6/8 should perform a meaningful browser action, including placement practice, within five minutes without setup intervention. Seek a seven-day retest from all eight; report both return rate and success among the original cohort. These are product gates, not statistical evidence of efficacy.

Use matched alternate tasks and counterbalanced order against workbook-style instruction, with equal time/help budgets. Record explanation quality, diagnostic choices, substantive misconceptions, and hints. Small samples and learning carryover limit causal claims. If the richer view offers no observable practical advantage, narrow it and retest before adding content. A larger effectiveness claim requires a separate study design and sample-size calculation.

Secondary measures: setup friction at transfer, placement misrouting, independent-versus-supported completion, voluntary return, repeated misconceptions, time to recover, session launch failures, and cost per completed learner. Confidence ratings are useful only alongside performance. Command count and daily engagement are not primary success metrics.

Technical acceptance is specified in [the technical test matrix](TECHNICAL-PLAN.md); product gates and estimates are in [the implementation plan](IMPLEMENTATION-PLAN.md). No acceptance tests or learner studies have yet been run.

## Data and privacy

Use authored fictional projects and identities. Each hosted session needs an unguessable capability tied to authorization checks; no public account is required. Store only progress needed to resume by default. Raw commands, file contents, and explanations are not analytics payloads by default. Collect research transcripts only by explicit consent, with a stated retention period and deletion process.

The first lab does not ask for a GitHub token, SSH key, personal repository, or credential upload. Final practice happens locally in a newly created disposable folder; any verification helper must operate only there and report checks rather than upload repository contents. See the technical plan for provisional retention and execution boundaries.

## Risks and responses

| Risk | Early signal | Response / owner |
| --- | --- | --- |
| Another attractive tutorial without better learning | Course success but no independent improvement | Product/learning owner compares transfer against workbook; narrow or stop custom lab |
| Observer view teaches omniscience | Learner expects all clones to update together | Content owner labels privileged visibility and removes it in independent tasks |
| Overload from too much state | Learners cannot identify the active repo or relevant version | Product owner reveals fewer concepts; compare single view versus perspective switching |
| Valid solutions rejected, harmful outcomes accepted | Correct alternative fails; conflict resolution drops required work | Git reviewer adds semantic invariants and counterexamples |
| Hosted execution escape or abuse | Boundary or exhaustion test fails | Runtime owner blocks external release until resolved; command restrictions alone are insufficient |
| Browser-only success fails to transfer | Installation abandonment or reliance on UI | Learning owner provides a setup bridge, ordinary-tool rehearsal, and distinct completion statuses |
| Placement skips fundamentals | Repeated basic hints after fast-track routing | Content owner revises probes and offers targeted refreshers |
| Scenario maintenance exceeds benefit | Repeated one-off checks and brittle scripts | Engineering owner limits grammar/content and uses versioned fixtures and common predicates |
| Hosting cost or slow starts undermines access | Budget breach, poor startup reliability | Runtime owner measures first; cap invitations/concurrency; investigate qualified browser-native execution |

## Decisions for the user

Confirmed: both audiences with placement; browser start followed by real Git. Recommended but not yet approved: native Git browser lab and the gated MVP above.

1. **Pilot audience and access:** recruit a small invited group before public access? Recommended: yes; no recruitment has occurred.
2. **Operating budget and owner:** what monthly/experiment cap and who will maintain hosted execution? Needed before provisioning, not before completing this plan.
3. **Transfer platforms:** which OS must work first? Recommend Windows plus one Unix-like platform for a broad release; a narrower pilot can support the recruited learners' actual machines.
4. **Completion promise:** accept core Git competence without GitHub authentication/PR review in v1? Recommended: yes, with that boundary explicit.
5. **Validation gate:** accept the proposed independent-task rubric and pilot targets, or adjust before testing?

Theme selection and Command-versus-other workspace structure come later, after the learning workflow is validated. Original theme artifacts will be needed for faithful visual comparison; the references remain preserved by name in the meantime.
