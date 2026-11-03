# GitCraft performance implementation

Decision and implementation: 4 November 2026. The target is less waiting after startup, Save file, stage and commit, while retaining native Git state and whole-playground Undo.

## Council decision

Three fresh independent planner contexts evaluated the same code and measurements. One anonymized peer-review round followed; reviewers could recognize their own proposals. All used the inherited model. Criteria were correctness and native-state preservation, measured speed, compatibility, verification, and maintenance cost.

| Approach | Benefit and tradeoff | Decision |
| --- | --- | --- |
| Direct playground startup and fewer native queries | Removes the obsolete exercise from ordinary startup; batching reduces subprocess overhead on cold inspection and commits. Alone it still rereads history after file-only edits. | Include. Preserve the existing server factory's staging default and browser fallback for older/injected sessions. |
| Dependency-aware component caches | Reuses refs/history and staged/committed blobs until their observed native inputs change. Adds invalidation logic that needs differential tests. | Primary approach, combined with startup correction. |
| Persistent Git helper, parallel workers, or partial Undo snapshots | Potential further latency reduction, with lifecycle/locking/recovery complexity. A persistent cat-file process would help only one already-batched query. Partial or hardlinked snapshots risk corrupting recovery. | Excluded from this pass. |

All peer reviews preferred the startup/component-cache combination. The chairman chose the existing initial_lab injection rather than a new server parameter, retained the browser's defensive lesson-switch fallback, and kept complete Undo copies. A targeted batching follow-up was added after the first candidate still used ten Git subprocesses per commit and 23 for cold full-state inspection.

## Implemented phases

1. **Start in the intended project.** The normal CLI creates the playground and passes it to make_server through its existing injection parameter. Legacy factory callers still get staging; existing lesson-switch APIs remain available.
2. **Refresh only changed components.** Full filesystem signatures remain observed per actor. Native ref/history metadata and staged/committed blob results have separate keys. A worktree-only edit rereads native status and working files without rebuilding history. Staging rereads native status and one batch of file versions.
3. **Batch ref metadata.** One native for-each-ref call provides ref targets, the current branch and upstream information. Native fallbacks preserve detached/unusual HEAD and missing upstream behavior. The graph and textual history continue to come from Git; neither is fabricated in Python or JavaScript.
4. **Preserve recovery and external-change detection.** Undo still copies all repositories. Repository replacement clears all caches explicitly. Known immutable object additions do not invalidate ref-based history when refs are unchanged; object modifications/removals and unfamiliar Git metadata do. Ref/config/packed-ref changes are observed independently in each clone. A changed signature during collection is not published as a fresh cached view.

Git's optional-lock suppression avoids status rewriting index stat bookkeeping and causing a redundant refresh. It does not remove the mandatory locking used for mutations. See the official [Git environment documentation](https://git-scm.com/docs/git), [for-each-ref fields](https://git-scm.com/docs/git-for-each-ref), and [cat-file batch interface](https://git-scm.com/docs/git-cat-file).

## Verification and measurement

Native regression tests compare cached API fields to separate Git commands for branch, HEAD, upstream, graph refs, history and file versions. Cases include external edit/add/commit/switch, packed refs, configuration changes, ambiguous names, missing upstreams, detached HEAD, immutable object additions and modifications, cache isolation, mid-inspection changes, failed mutation, and whole-repository Undo/reset recovery. Existing conflict/abort, rejected push, collaboration separation, security and legacy API checks remain required.

Process-count checks are deterministic: warm state needs zero Git processes, warm git status needs one, Save file needs one, and stage needs three including the requested command. No absolute wall-clock latency is asserted in tests.

Paired measurements compare the source at df561a4 with the candidate using disposable repositories and the same startup/edit/stage/commit/push/fetch/merge sequence. Order is interleaved across three pairs. Report median and observed min/max rather than claiming a reliable tail percentile from three samples. Raw results are in [performance-results.json](performance-results.json). Engine measurements include recovery-copy and inspection costs, but exclude HTTP/browser overhead. Startup includes the obsolete staging setup only in the baseline, matching the old launch path.

Measured on the local Windows host with Git 2.52.0 and Python 3.10:

| Action | Baseline median | Candidate median | Git processes before → after |
| --- | ---: | ---: | ---: |
| Startup to initial playground state | 10.35 s | 5.43 s | 53 → 25 |
| Warm status | 206 ms | 190 ms | 1 → 1 |
| Save file | 1.53 s | 0.64 s | 9 → 1 |
| Stage | 1.85 s | 1.07 s | 10 → 3 |
| Commit | 1.87 s | 1.31 s | 10 → 6 |
| Push | 2.87 s | 2.21 s | 15 → 9 |
| Fetch | 2.45 s | 1.68 s | 10 → 6 |
| Merge | 1.97 s | 1.63 s | 10 → 6 |

Reproduce from the repository root with its Git history available:

```sh
python -S -m scripts.benchmark_performance --baseline df561a4 --pairs 3
```

This writes a fresh ignored report to artifacts/performance-results.json. It executes both revisions' engine code in separate disposable repositories and removes the fixtures afterward. The measured implementation is the candidate working tree; this is not a CI latency gate. Complete Undo copies still cost about 0.4–0.5 seconds on this host.

All 33 Python regression tests and 12 JavaScript checks passed against the complete implementation. The isolated browser pass confirmed one initial state request without an automatic lesson switch, actual save/stage/commit changes, Undo restoring every repository view, zero API requests for reference navigation, and usable desktop/mobile terminal layouts without horizontal overflow or JavaScript errors. It used a separate headless Chromium context and disposable preview; the existing learner preview and Brave were not changed.

## Remaining costs and boundaries

Native process launch, initial repository creation, recursive filesystem observation and complete Undo copies still take time. Local filesystem and antivirus load can change measurements. The single-learner local process serializes operations; this change does not add hosted execution, concurrent multiplayer or arbitrary repository support. The cache does not promise an atomic snapshot against an unrelated Git process mutating the same files simultaneously; it avoids publishing a detected mid-collection change as fresh and reinspects on the next request.

Only revisit snapshot storage, broader query batching or a persistent native process when new measurements identify those costs as the limiting factor. Preserve full recovery and honest native output even when that sets a latency floor.
