# Landing page decision and evidence

8 November 2026. Implemented as an extension of the existing app, not a workspace redesign or a public hosting release.

## Direction

Product-led introduction for beginners: a short promise, real screenshots, an optional first-commit walkthrough and an explicit single-learner collaboration model. Preserve warm charcoal, amber, ivory and square controls. Interpret the saved Herding reference through warm surfaces and restrained composition; do not import its lime gradient, rounded cards or proprietary typography. Native CSS/Web Animations provide entry, section and preview-change feedback without an animation dependency. Motion intensity is moderate, density low, composition asymmetric; reduced motion is static. Manrope is self-hosted for the landing surface; workspace typography is unchanged.

## Council

Three independent proposals compared an existing-shell Home with lazy initialization, a separate static homepage plus an /app migration, and an existing-shell third route retaining startup. All three peer reviews ranked the lazy-initialization proposal first. It preserves original hash links and in-memory workspace state while making a fresh landing visit independent of Git APIs. The separate-page approach was the useful dissent: cleaner isolation, but avoidable redirects and transcript/draft continuity work for this build.

Home is the default root and `#/home`; `#/workspace` and `#/commands/:command` remain valid. The workspace DOM is retained, not rebuilt. One initialization promise deduplicates initial inspection. Returning Home during a delayed legacy inspection prevents an automatic lesson switch there. Initial failure recovery uses the same explicit playground-entry helper; ordinary reconnect remains an inspection without command replay.

## Sources and assets

- Local reference: `C:/Users/dharu/Documents/Codex/design-references/herding-warm-charcoal.md`. Preserved unchanged. The live site did not expose readable content to the web research tool, so no claim of live visual fidelity is made.
- [Oh My Git!](https://ohmygit.org/) clearly presents its purpose, download path and actual Git support. Used as a content reference, not copied artwork.
- [Learn Git Branching](https://learngitbranching.js.org/) remains an interactive learning reference; GitCraft's page explains its own project/terminal approach without claiming uniqueness or superiority.
- `gitcraft/web/assets/workspace.jpg`, `collaboration.jpg` and `commands.jpg` are real 1440x960 captures from an isolated native-Git session. A fictional README was edited, staged, committed and pushed only in disposable practice repositories. No generated UI, learner data, fake endorsements or fabricated usage statistics.
- `docs/screenshots/landing.png` is a 1440x1000 capture of the finished local landing page, used by README.
- [Manrope source](https://github.com/google/fonts/tree/main/ofl/manrope). Variable font and OFL license are stored together under web/assets; visitors make no third-party font requests.

## Finish review and checks

An independent visual review returned ship, with a screenshot-description concern. Full-resolution source inspection confirmed the workspace image contains the native staged diff; the landing caption and alt text describe that real state. A separate technical review found initial reconnect/legacy setup and HTTP persistent-connection framing issues. Both were fixed and verified.

29 JavaScript checks and 10 HTTP/native-Git checks passed. HTTP checks include exact binary MIME/signatures, asset allowlist/path restrictions, unchanged repository state, and deliberate connection closure after malformed persistent requests. HTTP/1.1 plus bounded writes fixed the observed Windows screenshot/font delivery failures; no asset retries were added.

Isolated Chromium verified zero Git API requests on fresh Home; all three preview images; FAQ/setup anchors; direct Commands links; Home/Workspace/back/forward with drafts and transcript preserved; command suggestions without execution; failed initial setup recovery; delayed initialization returning Home; 1440/900/390/320px layouts; reduced motion; readable no-JavaScript introduction; and no page/asset errors. First-use/recovery regressions also passed. Narrow header overflow was corrected before final inspection.

The main local preview was updated using a verified copy of its practice repositories and original lesson identity, preserving files, index, commits and checkpoint. Runtime backup helpers and manifests remain ignored artifacts. This is not a product persistence feature. No account, deployment, paid service, browser-native Git runtime or repository push was performed.

Limits: no physical-device keyboard test, full screen-reader audit, Firefox/WebKit visual pass, Lighthouse lab score or real learner study. No learning-effectiveness or public-production readiness claim.
