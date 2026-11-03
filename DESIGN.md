# GitCraft presentation: Split Workbench

The user selected the Split Workbench image and requested a tools sidebar and thinner square scrollbars. The desktop app now uses a narrow tools rail, file tabs and editor on the left, and a larger persistent native-Git terminal on the right. Help, History, Files, Commands and exchange tools are disclosed from the rail. Command helpers only suggest text; Enter/Run is required. On narrow screens the editor sits above the terminal and the rail stays accessible. Terminal focus can hide the editor.

Selected source: artifacts/split-workbench-reference.png. Charcoal/zinc/ivory with muted amber actions follows that selected image; no final global restriction on later themes. Keel, Quarry and Signal Console remain earlier named references whose actual artwork was not supplied. No invented fidelity to those themes is claimed.

All app overflow uses 5px square-corner scrollbars in Chromium with theme colours; Firefox uses its native thin scrollbar styling. Forced-colour mode retains platform accessibility. System sans typography and monospace file/terminal content preserve the buildless stack. Native Git state and existing learner-authored content remain authoritative.

The main learning loop remains inspect → edit/save → diff → stage → commit → share, without gates or automatic task completion. Explanation, native output and the repository's actual state provide feedback. A site preview is optional through Files. Desktop/mobile screenshots and interaction verification are recorded in design-qa.md.
