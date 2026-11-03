# Two-exercise prototype status

Implemented after the product-planning stage. Local preview only; no production deployment or paid resource.

## Implemented

- Native Git staging/content exercise and a collaboration exercise with two independent clones and bare origin.
- Browser file saving, supported Git command forms, native output, workspace switching, version comparison, history, authored teammate event, contextual hints and outcome checks.
- Whole-lesson restore, including staged/uncommitted state, both clones and origin. Windows read-only Git objects are handled within the owned lab path.
- Learning-aids toggle hides observer perspectives, version comparisons, step guidance and hints. It is practice mode, not a controlled examination.
- Local transfer assessment guide; a facilitator-prepared or self-prepared fixture is still required.

## Verification

Eleven engine checks passed: staged versus working content; incorrect commits; alternate add syntax and unstaging; checkpoint restoration; unsupported command/path rejection; push/fetch separation; rejected push and preserving both intentions; manual teammate control; lost contributor content; native conflict/abort; and restoring all three repositories.

Five HTTP checks passed after fixing a Windows socket reset caused by rejecting a POST with an unread body: API roundtrip/output boundary; static assets/security headers; Host/path rejection; unsupported command response; and token/Origin rejection. JavaScript syntax and Python compilation checks passed.

Browser verification completed the staging save/add/edit/commit/restore workflow with correct versions and task completion; published Sam's update; inspected Origin; switched perspectives; hid learning aids; and checked keyboard navigation from command input to Run. Desktop and narrow viewport screenshots are in `.impeccable/review/`; inspected layouts showed no horizontal document overflow. The viewport override was reset.

An independent read-only source/screenshot review returned **ship for the local prototype**, with no blocking defects. It did not independently execute tests, a browser or a screen reader. Its next-pass inspection item is asynchronous focus continuity after Save; this has not been established as a defect or fully tested.

The Impeccable launcher/detector did not run because its engine was absent and its cache location was unavailable. Project/product context was read directly. This is not an automated accessibility audit, hosted isolation review, or learner efficacy study.

## Next product work

Observe a learner doing both tasks, then an unfamiliar ordinary-Git task. Refine feedback and assistance withdrawal from those results. Formal placement, an automated transfer-fixture setup, persistent progress, eight missions, production runtime isolation and final theme choice remain pending.
