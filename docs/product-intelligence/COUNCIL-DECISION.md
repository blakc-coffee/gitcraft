# GitCraft council decision and change record

Date: 2 November 2026. Status: proposed recommendation following three independent planner proposals, one peer-review round, and one targeted revision after the user's clarification.

## Method and criteria

Used the requested idea-research-and-prd-review and llm-council skills. Three fresh-context planner agents received the same brief, verified source pointers, constraints, and criteria. They worked independently before seeing neutral-label summaries of the competing proposals. Each then ranked those same summaries and identified its own proposal. This was anonymized presentation, not guaranteed blind review. No model diversity is claimed. All three participated; no missing votes were invented.

Priority order was fixed before proposals: semantic correctness and real-world transfer; learner benefit/causal understanding; meaningful differentiation; feasible testable MVP; safety/privacy; effort and maintenance. Rankings were advisory; the parent agent made the final recommendation against the user constraints and evidence.

## Initial proposals and review

| Proposal | Mechanism and delivery | Main strength | Main objection |
| --- | --- | --- | --- |
| A | Real-Git incident lab, roughly 8–10 scenarios; locally launched isolated container for prototype, possible hosting later | Complete checkpoints, causal evidence and replay | Beginner container installation and early content breadth |
| B | Real-Git mission lab, roughly eight missions; browser client with disposable hosted native-Git sessions | Browser access, deterministic teammates, outcome checks | Hosting assumed valuable before delivery constraints/budget were known |
| C | Real-Git diagnosis lab, validate two exercises against a workbook first; 6–8 missions later; candidate constrained local runner | Lowest-cost learning validation and ordinary-terminal transfer gate | A constrained local runner is not a full sandbox; installation tolerance unknown |

All reviewers ranked **C → A → B** in the initial peer round, including reviewers who recognized A or B as their own. Their agreement supported validation-first sequencing, not proof of efficacy and not unconditional approval of C's local runner.

The major shared objection: separate clones and a remote are the normal Git model and already appear in learning tools. They cannot justify GitCraft by themselves. The differentiating hypothesis must concern independent diagnosis/recovery after assistance disappears.

The preserved disagreement concerned delivery: local runner versus local container versus hosted execution. All entail setup, safety, or operating tradeoffs. The review rejected treating argument validation or a disposable container as a complete security solution. It also recommended moving amend/reflog out of the initial course and defining transfer tests before the guided lessons.

## User clarification and targeted revision

The user then confirmed:

- Both first-time learners and command-familiar learners should be served, with a short placement check.
- The first release should start in a browser, then require a real Git task.

This invalidated an installed local runner as the default entry experience. Each planner received the same new constraints and compared bounded browser simulation, hosted native Git, and unverified browser-native Git/WASM. All three recommended a narrowly scoped browser lab backed by isolated native Git, initially invited, while retaining the workbook comparator and independent terminal assessment. WASM remained a spike option, not an established dependency.

## Chairman recommendation

**Choose the native-Git diagnosis lab with browser entry and validation-first delivery.** Retain C's sequence of two exercises before a full course; use the revised browser delivery favored by all three after clarification; retain A's complete snapshots and B's outcome-based evaluation. This is a material delivery revision from the initially highest-ranked proposal, explicitly justified by the user's answer.

Why it wins:

1. Native Git directly serves the most error-sensitive teaching requirements: files/index, conflicts, remotes, and recovery.
2. Browser entry meets the user's confirmed accessibility constraint without installation at the first lesson.
3. Short placement supports both audiences without weakening the final standard.
4. Two exercises and a held-out assessment test the uncertain learning benefit before committing to eight missions or themed frontend work.
5. Explicit runtime safety and cost gates prevent hosting convenience from hiding operational obligations.

Why alternatives remain useful: the workbook is the low-cost comparator and possible fallback product; browser simulation is useful for labeled concepts; browser-native Git may reduce runtime cost if verified; direct coaching in personal repositories remains out of scope because its privacy/support burden does not serve the foundational MVP.

The recommendation is provisional on learning value and runtime feasibility. No learner study, semantic implementation, browser runtime benchmark, or independent security review has yet validated the plan. Consensus is not evidence that GitCraft will outperform existing tools.

## Changes from the original idea

| Change | Weakness addressed / support | Effort and risk | Priority / status |
| --- | --- | --- | --- |
| Narrow promise to independent diagnosis and recovery | Multiple workspaces alone overlap existing tools; [research](RESEARCH.md) documents the comparison | Requires stronger assessment; market value still unverified | P0 proposed product direction |
| Two-exercise gate before full course | Feature/content volume could grow before benefit is known | Low initial content scope; pilot recruitment/retention needed | P0 council recommendation |
| Placement for both learner groups | One fixed path can bore one group or overwhelm the other | Small diagnostic plus routing; risk of false prerequisite skips | P0 user-confirmed |
| Browser entry followed by real Git | Reduces initial setup while still demanding transfer | Hosted runtime effort; real-environment setup still needed later | P0 user-confirmed outcome |
| Native Git behind browser | Simulator drift could teach incorrect states/errors | Higher operational burden; budget and isolation gates | P0 proposed architecture |
| Two clones plus one bare remote | Makes collaborator perspective concrete without multiplayer scope | Manageable fixtures; omniscient-view misconception risk | P0 proposed mechanism |
| Guidance and observer visibility fade | Guided success could conceal dependency | Alternate fixtures and assessment design | P0 research-informed hypothesis |
| Authored feedback and state predicates | Command-sequence grading can reward imitation and reject valid work | Content review and invariant tests; avoids AI dependency | P0 proposed implementation |
| Advanced rewriting and hosting workflows deferred | Breadth threatens completion of foundations | Some professional topics remain uncovered and must be disclosed | P1 scope recommendation |
| Theme/layout decisions postponed | Attractive visuals could distract from product validation | No frontend built; actual named reference artifacts still needed | Confirmed user constraint |

This is the first proposed PRD, not an approved revision of a pre-existing document. Subsequent scope decisions should update the PRD and this record together.
