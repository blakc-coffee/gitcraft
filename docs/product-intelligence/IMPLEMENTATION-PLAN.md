# GitCraft phased implementation plan — proposed v0.1

Date: 2 November 2026. This is a plan, not permission to start building or deploy. The [PRD](PRD-v0.1-proposed.md) is the product contract; [curriculum](CURRICULUM.md) and [technical choices](TECHNICAL-PLAN.md) define its behavior.

## Delivery assumptions

Browser entry and two learner groups with placement are confirmed. Hosted native Git is recommended, with a mandatory ordinary-terminal task. Assume one experienced full-stack engineer, access to a Git reviewer and part-time learning/content review, a small invited pilot, tiny text repositories, and no external authentication integration. A runtime/security specialist must review the execution boundary before external access.

Effort below is a rough engineering estimate, including implementation checks and basic content work but excluding recruitment waiting time, legal review if needed, vendor procurement, and major security remediation. It is not a committed calendar schedule. Parallelism and unfamiliar runtime infrastructure can materially change it.

## Phases and gates

| Phase | Concrete deliverable | Evidence required to continue | Rough effort / dependencies |
| --- | --- | --- | --- |
| 0 — Product definition | This proposed PRD, evidence register, eight-mission curriculum, council decision and technical/validation plans | User agrees on product direction, target release boundary, pilot budget/ownership, and assessment criteria | Desk planning completed; user decisions outstanding |
| 1 — Prove the narrow engine | Trusted fixtures for staged-then-edited content and a teammate push/divergence; a native-Git runner with no learner-facing product UI; separate state checks and checkpoint restore; runtime containment spike | Correctness tests pass; supported grammar documented; cost/startup measured; pre-external-access safety gate passes | 5–10 engineer-days; selected runtime candidate and budget |
| 2 — Test the learning mechanism | Minimal invited browser prototype: placement, task text, text editor, Git console/output, selective state explanation, checkpoint and hints for two exercises; separate transfer fixtures and workbook comparator | Both entry groups can use it; observed transfer/diagnosis benefit warrants richer lab; no serious semantic or isolation defect; placement does not bypass required knowledge | 5–8 engineer-days plus recruitment and a seven-day retention window |
| 3 — Build the learner MVP | Eight missions with supported/independent variants; replay/checkpoints; deterministic teammate and control switching; outcome feedback; bounded resume; real-Git setup bridge and capstone | R1–R8 satisfied; all hidden assessment variants reviewed; alternative solutions tested; both learning routes pass planned checks | 12–20 engineer-days; Phase 2 go decision and content review |
| 4 — Resolve presentation and quality | Compare workspace structures on actual learning tasks, then choose a visual direction; responsive implementation, textual graph equivalent, keyboard/focus/contrast/reduced-motion/error-state checks | No consequential usability/accessibility defect; observer view improves comprehension; chosen theme does not hide state or change semantics | 5–8 engineer-days; validated interaction needs and actual reference artifacts |
| 5 — Release readiness | Invited beta, independent runtime review, startup/reconnect/expiry tests, privacy/retention text, support and incident process, measured budget and capacity | Native correctness, learning transfer, runtime safety, accessibility, and operational gates all pass; owner accepts running costs | 5–10 engineer-days; review availability, remediation, user release authorization |
| Later — Expand only with evidence | Optional hosting/PR workflow, additional recovery topics, extra themes, stronger placement, instructor tools if demand appears | Each addition addresses observed learner need; core independent performance remains stable | Separate estimates and scope decisions |

Total initial engineering estimate: roughly 32–56 days after product approval, or about 7–12 full-time weeks before recruitment/review delays. A usable two-exercise invited experiment should arrive much earlier than the complete MVP. A two-week deadline would justify narrowing to that experiment, not relabeling it a full zero-to-confident product.

No phase requires a polished marketing site. Content, execution, evaluation, and safety are the critical path; visual themes are intentionally downstream.

## First vertical slice

The first slice must cover both the simple local mental model and the proposed multi-person value:

1. Open an authorized browser session; choose new-to-Git or attempt short placement.
2. In a one-clone fixture, edit → stage → edit again → commit. Ask one prediction and show precise evidence.
3. In a two-clone fixture, inspect Sam's action, return to the learner clone, encounter stale knowledge and divergent history, and preserve both contributions.
4. Show a tiered hint when requested; accept supported alternate correct solutions.
5. Restore the whole lesson to a known checkpoint and verify that every repository is consistent.
6. Complete a changed task in ordinary installed Git with documentation allowed and no observer.

This demonstrates the hardest product claim more honestly than a large mock course. Conflict resolution can be part of the second fixture, but first test nonconflicting divergence so learners do not equate every rejected push with conflicting lines. Full M7 coverage belongs in Phase 3.

## Learning validation protocol

Recruit eight pilot learners, four new to Git and four command-familiar with collaboration difficulties. No recruitment has been performed. Obtain consent for any recorded research; ordinary access does not require transcript consent.

Before sessions, reserve unseen fixture variants and write the rubric. Observe the placement check and browser setup. Compare the same teaching objectives using a workbook-style condition and a condition with selected predictions/state evidence/hints. Counterbalance equivalent task order and equalize assistance/time. Record carryover and facilitator help rather than treating the comparison as a randomized efficacy result.

Assess in an unfamiliar ordinary terminal task: intentional commit, diagnose divergent shared work, preserve both contributions, recover from one mistake, and explain the evidence. Documentation is allowed. An exact-command hint converts that attempt to supported practice. Repeat a shorter changed task after seven days.

Proposed go criteria: at least six of eight demonstrate the PRD's independent pass standard, including three of four in each group; no recurring serious misconception caused by the observer; browser entry succeeds without installation; setup and cost are acceptable; qualitative comparison shows a useful diagnostic/transfer advantage worth further investment. Counts alone do not prove the product caused improvement. Report completion and retention against the original assigned cohort, with dropout reasons.

If benefit is unclear, run one focused revision of the explanation/scaffolding mechanism, not a broad feature expansion. If it remains indistinguishable from the workbook, publish a focused exercise pack or recommend existing tools. If learners succeed only with all collaborators visible, remove dependence before writing more missions.

## Browser execution fallback policy

If native hosted execution fails the safety or budget gate, do not quietly substitute a fake terminal. Options are to narrow the invited experiment, investigate a browser-native Git runtime within a fixed spike budget, or present explicitly labeled concept demonstrations while pausing the practical-lab release. Browser-first entry remains a requirement; a locally installed command service is not an equivalent replacement without the user's agreement.

The browser-native spike should stop after roughly 2–3 engineer-days if no credible supported runtime emerges. A positive result must still prove staging, independent repositories, local remotes, divergence, merge/abort/conflicts, persistence, startup, and supported browser behavior. Do not make a research prototype the release's hidden dependency.

## Workspace and theme decision, after validation

Compare structures by task performance, not visual appeal alone:

| Candidate structure | Hypothesis | Risk / test |
| --- | --- | --- |
| Guided task with one active repository and optional evidence | Lowest novice overload | Check whether collaboration relationships remain understandable |
| Command workspace with context-aware inspectors | Efficient command/feedback loop | Check whether novices can find the relevant file/index version without panel hunting |
| Perspective comparison and event replay | Strongest cross-person cause/effect explanation | Check whether simultaneous views create false omniscience or overwhelm; likely lesson-specific, not always-on |

These may become modes of one experience rather than three separate products. Do not build them all before comparing low-cost representations on the same tasks.

Keel, Quarry, and Signal Console remain theme references; other themes remain possible. Obtain the actual reference artifacts when entering visual exploration. Keep semantic colors/labels, typography roles, spacing, and component behavior tokenized so a theme experiment does not rewrite the engine or curriculum. Test one selected theme thoroughly before adding another. Preserve the saved reference source files.

Desktop is the full-practice target. Narrow-screen review must remain accessible, with a clear path to continue intensive practice on desktop. During implementation inspect real desktop/mobile renders and keyboard, zoom/reflow, contrast, loading/empty/error/expiry states, and reduced motion. No such visual inspection has occurred in this planning task.

## Decisions required before dependent work

| Decision | Recommended default | Needed by |
| --- | --- | --- |
| Native Git browser lab as product direction | Approve a two-exercise experiment first, conditional full MVP | Before Phase 1 |
| Pilot runtime spend and operating owner | Small capped invitation-only pilot; name an owner and budget | Before any paid provisioning |
| First real-Git transfer OS support | Support recruited learners; Windows plus one Unix-like platform before a broader release | Before capstone implementation |
| Core Git versus external hosting graduation | Core Git is mandatory; actual GitHub/PR workflow later and explicitly separate | Before curriculum copy is finalized |
| Learning gate and evidence standard | Proposed rubric/counters above; no efficacy marketing based on the pilot alone | Before learner sessions |
| Theme and workspace selection | Defer; compare actual references against validated tasks | Phase 4 |

No paid service, public deployment, external message, recruitment, or repository push has been performed as part of this plan.
