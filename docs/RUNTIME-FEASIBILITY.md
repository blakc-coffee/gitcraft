# Browser execution feasibility

Reviewed 8 November 2026. Target: public free GitCraft with near-zero recurring hosting cost. This is a proposed delivery decision, not an implemented engine replacement.

## Decision

Keep the current official native Git engine and terminal-led workbench. Do not add BrowserPod to the shipped app yet. It is a conditional evaluation candidate, not an established free public runtime. No account, API key, paid service or remote Git repository was used in this investigation.

Three independent council proposals and one peer-review round favored optional, minimal first-use help over an adaptive course. A targeted revision after the budget clarification favored evaluating browser-local execution before committing to public native-Git workers. Their shared condition was semantic parity; browser-local execution is not assumed faster or equivalent merely because it produces Git repositories.

## Evidence and implications

- **BrowserPod compiles official Git:** vendor release notes explicitly describe compiling the official Git repository to WebAssembly. This is a documented vendor claim; GitCraft has not executed or independently reproduced that build. [Release notes](https://browserpod.io/blog/browserpod-20/).
- **A key and metering remain required:** `boot({apiKey})` deducts ten tokens and fails with insufficient balance. A `storageKey` resumes a browser disk; without one, each boot is ephemeral. [Boot API](https://browserpod.io/docs/reference/BrowserPod/boot).
- **Free does not mean unlimited starts:** the listed free allowance is 10,000 tokens, up to 1,000 hours. At ten tokens per boot this permits at most 1,000 starts before any continuing-hour charges. Refreshes must be included in the budget. [Pricing](https://browserpod.io/pricing/).
- **Terms affect distribution:** the personal plan requires non-commercial eligibility and visible attribution. Runtime self-hosting is not listed for the free tier. Verify suitability before integration rather than inferring eligibility from the app being free to learners. [Terms](https://browserpod.io/terms/), [pricing](https://browserpod.io/pricing/).
- **The SDK is not a standalone open engine:** its public wrapper loads a vendor-hosted runtime. Confirm runtime licensing, origin restrictions, dependency availability and outage behavior before committing. [SDK source](https://github.com/leaningtech/browserpod-meta), [API keys](https://browserpod.io/docs/understanding-browserpod/api-key).
- **Browser support requires investigation:** cross-origin isolation and persistent storage alter hosting and browser requirements. Vendor support claims still need testing on GitCraft's target devices. [Isolation guide](https://browserpod.io/docs/understanding-browserpod/cross-origin-isolation).
- **wasm-git is a different engine:** the upstream project compiles libgit2 with an example CLI, not official Git. Replacing the native CLI with it is a material change requiring explicit review and parity tests. [Upstream](https://github.com/petersalomonsen/wasm-git).
- **GitAcademy is not evidence of browser-local execution:** its paper's implementation section provisions backend Docker containers. Its paired study supports investigating collaborator visibility, not claims of GitCraft learning efficacy or a free browser runtime. [Paper, sections 3.2–3.3](https://arxiv.org/html/2602.19714v1).
- **Static hosting is only part of delivery:** Cloudflare documents free static requests, but its static tier does not execute today's Python/native-Git backend. [Pricing documentation](https://developers.cloudflare.com/pages/functions/pricing/).

## Bounded execution experiment

If a suitable evaluation key and plan are available, use one browser runtime containing three separate repositories: You, Sam, and bare Shared. Do not boot a runtime per actor. Never put personal repository credentials in the fixture.

Compare browser execution against the current native engine for:

1. Save, stage, edit again, commit: the index version is committed and later working edits remain outside it.
2. Separate clone branches and refs: switching the visible actor performs no communication.
3. Local bare-origin clone/fetch/push: publishing does not update another clone's files, fetching does not integrate.
4. Rejected push and subsequent integration preserve both authors' intended content.
5. Merge conflict, unresolved index, explicit resolution and abort match native state and exit behavior.
6. Whole-playground Undo restores both clones, the remote, working files and index, not only visible text.
7. Export/import includes all repositories and Git metadata plus browser drafts; a Git bundle alone does not preserve uncommitted working/index state.
8. Refresh, crash, failed writes, eviction, private browsing and multi-tab access have defined outcomes.
9. Cold download/startup, memory and command latency are measured in Chromium, Firefox and WebKit on modest devices. Run away from the UI thread where the selected runtime supports it.
10. Exhausted tokens, denied origin, offline runtime assets and unsupported browsers show a useful explanation without silently falling back to a simulator or losing work.

No browser-native parity pass is claimed. Account-bound execution has not been performed; creating an account or choosing a paid runtime is outside this implementation increment.

## Fallbacks and next decision

Hosted isolated native workers remain the highest-reuse fidelity option. A public service needs per-session state, resource/time/output limits, process cleanup, session security, expiry/resume/export, monitoring and hard cost/capacity limits. The current single-lab loopback server is not that service. Python itself advises against using `http.server` in production. [Python documentation](https://docs.python.org/3/library/http.server.html).

The local companion remains useful for development and ordinary-Git practice, but cannot fulfill zero-install browser entry. If an official-Git browser runtime fails the tests or budget, explicitly choose a capped hosted service, a revised budget, or an approved different engine. Do not quietly downgrade the native-command promise.

Immediate next decision: whether a quota-limited, attributed BrowserPod evaluation is acceptable. First-use improvements do not depend on that choice.
