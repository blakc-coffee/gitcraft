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
