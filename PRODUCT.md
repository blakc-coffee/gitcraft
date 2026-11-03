# GitCraft

<!-- impeccable:product-schema 1 -->

## Platform and stack
Web. Local prototype: Python standard library, native Git, buildless HTML/CSS/JavaScript. No framework or hosted architecture is locked.

## Users and purpose
Absolute beginners and learners who know commands but struggle with collaboration. Help them understand, inspect and recover shared Git work. Browser-first exploration should eventually transfer to an ordinary real-Git task. No learner efficacy has been established.

## Current experience
A full-window file workspace with a fictional bookshop website: index.html, styles.css and README.md. Learners author edits themselves, save files, preview the result, prepare selected content and explicitly commit it. They control separate You and Sam clones connected to Shared. Switching views, opening help, previewing and inspecting history do not author changes. Graph/history, file versions, explanations and commands are optional disclosures. No lesson gates or canned edits.

## Constraints
Single local learner; native Git source of truth; supplied project files only; no hosted hostile-code execution. Unlimited help, no scores, lives, timers or attempt penalties. One-step whole-playground Undo is an application convenience. Existing legacy exercise fixtures remain regression coverage, not the current home experience.

## Direction and themes
See PLAYGROUND-DIRECTION.md for references, alternatives and next tests. Keel, Quarry, Signal Console and other themes remain available for later exploration; Command is not locked. Staged curriculum remains a capability map for optional scaffolding and transfer, not a compulsory sequence.

## Accessibility
Keyboard actions, visible focus, responsive editor, text history alternative, plain feedback, reduced motion and light/dark tokens. Beginner usability needs direct testing.


Current interaction revision: Git commands are the primary learning activity. A persistent native-Git terminal shares the workspace with a smaller file editor; README opens first. A command-intent guide explains syntax and consequences without executing it. Helpers only populate the prompt; Enter/Run is required. Per-workspace terminal transcripts and up/down command recall remain available during the session. The editor supplies changes to investigate; it is not the product's main task. Inspect → edit a file → save → diff → add → diff --staged → commit → inspect is an optional discovery loop, not a gated lesson. Native Git runs through the existing bounded command gateway; this is not an unrestricted system shell. History remains secondary.

## Selected workspace revision
The user chose the Split Workbench image: a narrow sidebar for Help, History, Files and Git tools; a file workspace on the left; a larger native-Git terminal on the right. Theme matches the selected charcoal/amber concept. App scrollbars are thin and square. Commands execute only after explicit submission. Native inspection now reuses unchanged repository views and reads staged/committed files in one batch, while observing native repository/worktree changes before reusing a view.

Command feedback uses inspected before/after state and the native command result. It explains staging, commits, local versus shared changes and common recoverable errors in the existing terminal feedback area. Original output remains visible; hints do not execute or retry commands. Unrecognized errors fall back to inspection guidance, and transport/server failures explicitly retain uncertainty about whether an action ran. No hosted backend or AI service is required.
