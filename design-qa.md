# Split Workbench design QA

- Source visual truth: artifacts/split-workbench-reference.png (user-selected generated image).
- Implementation: http://127.0.0.1:8766/ . Desktop evidence: artifacts/split-workbench-desktop.jpg. Responsive evidence: artifacts/split-workbench-mobile.jpg.
- CSS viewports: desktop 1440×1024; mobile 390×844. Source pixels: 1487×1058. Desktop capture: 1309×931; mobile: 354×767. Captures reflect the browser's existing approximately 0.909 display scale; compare full-frame proportions after accounting for density, not raw glyph pixels. Source and desktop aspect ratios match closely.
- State: Your workspace/main, README open, native status output, panels collapsed, empty editable command prompt. Source has illustrative changed-file/diff content; implementation retains the learner's real existing file content and clean/ahead-of-origin state. Content differences are intentional; no sample edits were fabricated for fidelity.

## Full-view comparison
Opened the source and final implementation together in the same comparison input. Preserved the selected left-file/right-terminal structure, charcoal/amber theme and persistent command prompt. Added the explicitly requested compact tools rail and reduced app scrollbars to 5px with 0px thumb radius. Remaining region proportions allocate more width to Git. The source's illustrative typography is adapted to practical readable 16px desktop terminal text and 14px file text. No source imagery or icon assets require recreation.

## Findings and fixes
- P2 fixed: collapsed command help initially shifted the transcript into an auto-sized grid row. Assigned explicit terminal rows so output keeps the flexible region and input stays anchored.
- P2 fixed: native scrollbar styling was overriding custom Chromium scrollbar geometry. Set the standard override to auto in WebKit-capable browsers; verified computed 5px width/height and zero radius, then visually checked the square thin horizontal scrollbar in the final capture.
- P2 fixed: Help could obscure History when switching tools. Opening History now closes Help; browser interaction confirmed panel switching.
- P2 fixed: early desktop terminal text was small relative to the chosen concept. Raised desktop terminal text to 16px and file text to 14px, recaptured and compared again.
- No remaining actionable P0/P1/P2 findings in the selected format plus requested sidebar variation.

## Functional and responsive checks
Native status executed and preserved actual repository state. Sidebar Help, History and Commands opened; a command suggestion changed only the prompt. File preview remained available through Files and Back to file returned to editing. Mobile screenshot retained the rail, file access, terminal and Run control; document horizontal overflow was false. Keyboard Tab from command input reached Run command. Native Git engine suite passed 26 tests; JavaScript suite passed 12 checks; syntax check passed. Browser console errors/warnings: none observed. Reduced motion has no animated dependency; forced colours defer scrollbar styling to platform.

## Comparison history
Initial rendered desktop inspection found transcript sizing and scrollbar override defects; fixes were applied before the final source/implementation comparison. Final captures reflect corrected layout, square scrollbar and readable terminal typography. Mobile layout was inspected separately; its stacked panes are a deliberate adaptation, not a desktop fidelity claim.

## Limits and follow-up
In-app browser capture was unavailable; visual checks used a separate Brave verification tab without altering the user's original tab. No real learner usability study or Firefox visual verification. Consider resizable split panes later; not needed for this scope.

final result: passed

## Commands page verification — isolated headless browser

- New top-navigation route: http://127.0.0.1:8766/#/commands . Separate page view; workspace DOM remains mounted so drafts and terminal history are retained.
- Evidence: artifacts/commands-page-desktop.png (1440×1024), artifacts/commands-page-mobile.png (390×844), inspected as rendered captures.
- Sixteen commands grouped by purpose. Each detail has a plain-language purpose, use case, changes, unchanged state, examples and official Git documentation. init/clone/pull are clearly reference-only in this bounded playground.
- Checks passed: search and empty state, direct hash links and reload, draft/transcript preservation, suggestions never execute, native repo views unchanged, reference-only commands have no execution helper, desktop/mobile rendering, no horizontal page overflow, and no JavaScript errors.
- Reference navigation generated zero API requests. End-to-end command round trip in this check: 265 ms. Earlier live API measurements: 166–175 ms for status/diff/log; timing varies by machine and command.
- Visual fixes: search now indexes example text (so “stage” finds git add), and the mobile heading retains the space after the hidden line break.
- Verification used a separate headless Chromium instance and temporary browser context. No Brave tab, window, profile or input was used. The preview server had stopped; artifacts/resume_preview.py restored it from saved repositories without changing working files or commits. In-memory Undo history resets on restart.
- Existing 12 JavaScript checks pass. No new backend behavior was required for the reference page.

Commands page result: passed.

## Navigation and command discovery revision — 3 November 2026

Inspected the incumbent screenshot before editing. The all-catalog sidebar competed with the detail page, and a tall introduction plus a single content column wasted desktop space. The revision uses purpose navigation, a short contextual list, and side-by-side explanation/practice on wide screens. The reference has a single page scroll on mobile, wrapping command links and persistent global navigation.

Updated rendered evidence: artifacts/commands-page-desktop.png (1440×1024) and artifacts/commands-page-mobile.png (390×844). Both were visually inspected; isolated workspace captures also checked the shared header and mobile terminal. Verified 820px intermediate layout. No Brave session was accessed.

Headless interaction checks passed: all 16 commands reachable through search; purpose navigation; no-results and recovery; deep links/reload; unchanged native repository state; draft and transcript preservation; suggestions never execute; reference-only commands unavailable to run; keyboard skip link targets the current page; reduced-motion animation disabled; no horizontal page overflow at tested sizes; no JavaScript errors. Reference browsing made zero API requests. Native git status completed in 227ms in this run, including browser round trip; this is a local measurement, not a latency guarantee. All 12 existing JavaScript tests passed. Backend was unchanged. Native link keyboard behavior and visible focus were retained; no claim of a complete accessibility audit or learner validation.

## Council follow-up verification — 3 November 2026

Reproduced Ctrl/Cmd+S from Commands with an unsaved draft by intercepting and aborting the save request; one request proved the defect without modifying native files. After the route guard, Control+S and Meta+S generated zero saves on Commands. Workspace Control+S still requested a save; that request was aborted for this test as well. Browsing and command suggestions retained zero API requests and unchanged native repository views.

The isolated browser pass also covered a real examples jump/focus, live search count, retained-detail wording and no automatic command selection, reference-only and Shared restrictions, draft/transcript retention, reduced motion, consistent tablet source/visual order, 1440px desktop, 820px tablet, 390px mobile and 320px reflow, and no page overflow or JavaScript errors. Representative placeholder and secondary text pass 4.5:1 contrast after correcting the browser-default 3.54:1 placeholder. Updated desktop/mobile captures were visually inspected. All 12 JavaScript tests passed. Final native status round trip was 294ms; this is not a latency guarantee. Brave and learner files remained untouched. No full assistive-technology audit, actual browser zoom session or learner study was performed.

## Optional comparison verification

Sixteen JavaScript checks passed, including four new cases for published versus remembered refs, fetch without integration, staged/unstaged/conflicted files, unpublished/missing branches, truncated commit details and selected branch versus current checkout. Backend/API behavior was unchanged.

Isolated native-Git browser checks verified zero requests or repository changes from opening comparison, blocked Ctrl/Cmd+S saves of covered drafts, retained browser drafts and transcript, correct push/fetch distinctions, unpublished branches, Close/Escape focus restoration, focusable horizontal table scrolling, route cleanup of inert editor controls, and desktop/mobile layout without page overflow or JavaScript errors. Rendered evidence: docs/screenshots/compare-workspaces.png (1440×960) and local artifacts/compare-mobile.png (390×844). Mobile has an explicit sideways-scroll cue. The first test run exposed a missing route wait in the harness; waiting for the Commands view corrected that assertion race. No learner session or Brave window was used. No full screen-reader audit or learner validation is claimed.

## Dead-code cleanup, run early at the user's request

Traced HTML, JavaScript selectors/imports, CSS and tests before removal. Removed the obsolete embedded command-guide styles and empty terminal grid row; permanently CSS-hidden duplicate file selector, preview button and stage/unstage bar with their handlers/render updates; unused header/reference styles; unused fileNames export; duplicate terminal-output state; and new-commit/with-history class bookkeeping with no consuming styles or behavior. Visible preview, file tabs, staging helpers, history and comparison remain available through their existing controls.

Retained the staging/collaboration backend routes and legacy lesson module because they have explicit regression/API compatibility uses. Archived screenshots, planning material and ignored local tooling were not treated as dead runtime features. No backend behavior or dependencies changed.

All 16 JavaScript checks passed. An isolated browser compared desktop/mobile geometry before and after removal and found identical workspace, editor, terminal, output, feedback and prompt bounds. Rendered before/after views were inspected. Active saved-site preview, file tabs/save, stage/unstage prompt-only helpers, native commit/status, history/snapshot/return to editable file, comparison and Commands navigation passed, with no horizontal overflow or JavaScript errors. Temporary native repositories and headless Chromium were separate from learner sessions and Brave. This was a focused traced cleanup, not a claim that every possible unused path has been proved absent.

## State-aware command feedback verification

All 25 JavaScript checks passed, including nine new tests for unstaged versus clean commits, unknown-error fallback, empty diff with staged changes, excluded browser drafts, the two restore meanings, commit identity and unstaged leftovers, fetch versus integration, merge abort, branch/upstream failures, conflicts and uncertain request outcomes. The existing backend and Git gateway were unchanged.

An isolated headless browser exercised native clean/unstaged commit failures, staging and empty diff, later unstaged edits excluded from a commit, restore, missing branch and upstream, rejected push, fetch, real merge conflict, unresolved commit and merge abort. It also checked HTTP 400 gateway rejection, simulated network/HTTP 500 failures, absence of automatic retries, preservation of raw native output and typed commands, one live feedback region, and updated Undo feedback. Mobile hint and prompt remained visible with no page overflow or JavaScript errors. Desktop/mobile captures were inspected; the README includes docs/screenshots/command-feedback.png. No learner files or Brave session were used. These checks validate behavior, not learner efficacy or a complete assistive-technology audit.
