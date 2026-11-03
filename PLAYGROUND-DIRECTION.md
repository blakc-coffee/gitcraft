# File-first playground decision

## Recommendation
Make a small project the place learners work. They author changes themselves; Git explains and preserves those changes. Keep guidance optional and situational. The graph is an inspection tool opened through History, not the starting activity.

## References researched
- [Learn Git Branching](https://learngitbranching.js.org/) and its [official source](https://github.com/pcottle/learnGitBranching): interactive command execution, sandbox and visible branch relationships. Keep causal inspection and safe exploration; its command/graph emphasis does not meet this user's file-first direction.
- [W3Schools Git](https://www.w3schools.com/git/): accessible explanations organized by Git topic. Use concise lookup help, rather than impose its tutorial progression. Avoid implying every Git mistake or uncommitted edit is recoverable.
- [Official Git cheat sheet](https://git-scm.com/cheat-sheet): intent-based command reference. Keep commands discoverable alongside explicit actions and distinguish fetch, merge and push.

## Alternatives considered
| Approach | Strength | Cost | Decision |
| --- | --- | --- | --- |
| Linear guided course | Obvious next action | Low agency, encourages completing instructions | Optional scaffolding later |
| Command-first graph sandbox | Excellent branch topology visibility | Typing barrier; files feel abstract | Optional History and console |
| Project workspace with file editing and preview | Concrete ownership and visible consequences | Must explain files, staging and collaboration progressively | Current prototype |

This is a design hypothesis, not validated learning superiority. The latest user direction chooses file-first exploration and explicitly rejects automatic task completion.

## Current scope and boundaries
A fictional bookshop website (HTML/CSS/notes), separate You and Sam clones, bare Shared, explicit save/stage/commit, branch switching and exchange, optional history/console/help, one-step application Undo. The browser UI talks to local native Git. Thus the current prototype actually exercises Git; it is not evidence that an in-browser simulator alone teaches system setup, authentication, ordinary terminal navigation, editors, network failures or real team review. A later transfer task must cover a normal clone, independently authored contribution and recovery using real tools.

## Phases and tests
1. File-first vertical slice: no browsing action mutates a repository; saving does not stage; staging does not commit; committing does not push; preview reads only sandboxed saved working files. Verify native Git state and separate collaborators.
2. Observe five absolute beginners and five command-aware learners. Ask them to make a contribution they choose, preserve one version, try another version and exchange work with Sam. Provide unlimited optional help, no timing penalties. Record where they cannot identify an action or confuse saved files with commits. Success target: at least 8/10 complete their own contribution with optional help; at least 7/10 explain which workspace changed. These are proposed gates, not results.
3. Add contextual explanations for observed confusion, optional placement check and independent real-Git transfer. Require a fresh task without a command recipe and an explanation of working/index/HEAD/remote state before expanding scope.
4. Compare optional theme directions only after the workspace workflow is clear. Defer hosting, arbitrary repositories, live multiplayer, AI tutor/grading, advanced rebase and destructive recovery operations.

## Decisions still needing input
Whether the sample project should remain a website or use non-code documents; how much help should be open at first entry; which theme to try next. None blocks this reversible prototype. Browser-first then real Git and support for both learner groups remain accepted.
