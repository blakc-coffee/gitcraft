# GitCraft research and evidence

Research date: 2 November 2026. Status: desk research for a proposed product, not validated demand or a learning efficacy study.

The project directory was empty when inspected. No framework, existing product, local PRD, or installed application was available to assess. The supplied AGENTS.md instructions govern this planning work. No learners were interviewed and no competitor course was completed during this review.

## What problem deserves solving?

The working hypothesis is that beginners often acquire a sequence of commands before they understand the states those commands affect. When the situation changes, they cannot tell what is saved, staged, shared, stale, or safe to discard. GitCraft should test whether it can improve diagnosis and independent recovery, rather than assume that a more attractive tutorial solves this problem.

| Evidence | Exact support and limits | Status | Product implication |
| --- | --- | --- | --- |
| [Isomöttönen and Cochez, Challenges and Confusions in Learning Version Control with Git](https://www.cochez.nl/papers/dvcs-misconceptions-final.pdf), survey conducted spring 2013 | 21 of 26 students responded. Reports include conflict difficulties, avoiding features, and re-cloning as a workaround. This is a small, older educational sample, not prevalence evidence for all beginners. | Verified source findings | Include diagnosis and recovery; investigate these problems with current target learners. |
| [Wagner and Thurner, Rethinking How We Teach Git](https://jise.org/Volume36/n1/JISE2025v36n1pp1-12.pdf), published 15 March 2025 | A teaching tip advocates a conceptual overview beginning with branches, followed by committing and collaboration, separating conceptual and applied learning and adding transfer questions later. It is not proof that this ordering outperforms alternatives. | Verified recommendations; efficacy unverified | Test a short parallel-work overview before details. Keep practical work early and assess transfer separately. |
| [Pro Git: Recording Changes](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository), accessed 2 November 2026 | Explains tracked/untracked files, staged and unstaged differences, and commits built from the staging area. | Verified semantics | Make edit → stage → edit again a central diagnostic exercise. |
| [Pro Git: Remote Branches](https://git-scm.com/book/en/v2/Git-Branching-Remote-Branches), accessed 2 November 2026 | Explains remote-tracking refs and locally cached ahead/behind information. | Verified semantics | Distinguish each clone's knowledge from an observer's view of the actual remote. |

The proposed learning loop—predict at selected moments, act, inspect evidence, explain, recover, and later repeat without aids—is a product hypothesis informed by these sources. No source establishes that GitCraft's particular combination will work.

## Existing tools and the burden of differentiation

Features below are verified from official pages or repositories. Limitations are implications for this product, not claims that a competitor lacks every undocumented feature.

| Tool / approach | What is established | Implication for GitCraft |
| --- | --- | --- |
| [Learn Git Branching](https://github.com/pcottle/learnGitBranching), plus its [live course](https://learngitbranching.js.org/?locale=en_US) | Browser visualization, command-driven levels, a sandbox, and remote lessons. | Visual command practice and moving branch pointers are already available. GitCraft needs to demonstrate value in file-level reasoning and independent work, rather than claim an unoccupied category. |
| [Oh My Git!](https://ohmygit.org/) and its [official repository](https://github.com/git-learning-game/oh-my-git) | Real Git, a terminal, visual repository structures, introductory command cards, and levels with multiple repositories. The repository describes low-maintenance status. | The closest conceptual comparison. Multiple workspaces and real Git are established capabilities; maintenance status does not establish a learning-quality gap. |
| [GitHub Skills: Introduction to GitHub](https://github.com/skills/introduction-to-github) | An exercise in the learner's account covering a branch, file commit, pull request, and merge. | Authentic hosted contribution practice exists. GitCraft should distinguish Git concepts from hosting-provider workflow. |
| [GitHub Skills: Resolve Merge Conflicts](https://github.com/skills/resolve-merge-conflicts) | An account-based exercise using a web editor to resolve conflicting Markdown changes. | Conflict practice is not novel. Compare the quality of diagnosis and later CLI transfer, not feature names. |
| [Git Exercises](https://gitexercises.fracz.com/) and its [source repository](https://github.com/fracz/git-exercises) | An existing Git practice platform with exercise/progress navigation. Search indexing exposed a clone-based setup; the dynamic exercise contents were not readable in this review. | Include it in hands-on follow-up. Do not claim to have audited its grading, curriculum coverage, or feedback depth. |
| A small real-repository workbook with an instructor | A proposed comparison condition using seeded repos, documentation, and explicit tasks; not a newly discovered commercial product. | This inexpensive baseline could be sufficient. The richer product must justify its cost against it. |

The former [Skills entry point](https://skills.github.com/) now points to GitHub Learn. The Learn landing page exposed no readable content through the research tool; the official course repositories support the claims above.

## Differentiation to test

Candidate promise: **Learn to explain and repair a shared Git project when nobody gives you the next command.**

The potential contribution is the integrated curriculum and evidence of transfer: deliberately mismatched collaborator knowledge; file/index/history inspection; mistakes with consequences; feedback tied to observed state; and withdrawal of the very aids that made early learning approachable. This is a plausible implementation and teaching improvement, not verified novelty or a defensible moat by itself.

Reject these claims: first visual Git trainer, first multiple-repository learning tool, real collaboration because animated teammates exist, or professional readiness based only on completion badges. No market-size, willingness-to-pay, or efficacy claim is established.

## Technical evidence that changes the plan

| Source, accessed 2 November 2026 | Supported finding | Consequence |
| --- | --- | --- |
| [Git repository layout](https://git-scm.com/docs/gitrepository-layout) | A bare repository has no working tree and is commonly used to exchange history. | The origin view must not show an editable checkout or staging area. |
| [Git worktree](https://git-scm.com/docs/git-worktree) | Linked worktrees share substantial repository metadata. | Represent collaborators with independent clones, not branches or linked worktrees masquerading as separate people. |
| [git-fetch](https://git-scm.com/docs/git-fetch), [git-push](https://git-scm.com/docs/git-push), [git-pull](https://git-scm.com/docs/git-pull) | Native references define transport, ref updates, push rejection, and fetch/integration behavior. Pull behavior depends on options/configuration. | Pin and test the taught behavior. Teach fetch plus explicit integration first; avoid an ambiguous bare pull recipe. |
| [isomorphic-git merge API](https://isomorphic-git.org/docs/en/merge) | Documents merge limitations and conflict handling that requires API-level choices. Its navigation and limitation text also warrant version-specific checking. | A browser Git library is not automatically equivalent to the native CLI. Require a pinned-version conformance spike before adopting it; do not assert that it cannot handle conflicts. |

## Research gaps and smallest useful next steps

| Hypothesis / uncertainty | Smallest next check | What would change the plan |
| --- | --- | --- |
| Beginners cannot diagnose what is local versus shared | Observe 5–8 first-time learners doing staged-edit and stale-remote tasks; record confusion without leading them | If failures are predominantly terminal navigation, strengthen orientation before investing in multiple perspectives |
| Cross-workspace inspection improves learning | Give matched tasks with and without an observer view; counterbalance task variants, then test without either aid | Remove or narrow observer mode if it increases misconceptions or adds no practical benefit |
| Learners value recovery over another tutorial | Ask about recent real incidents, observe attempted repair, and offer a small follow-up task | If there is no relevant need or voluntary return, narrow the audience or publish a workbook |
| A browser start improves activation enough to justify hosting | Compare time to first successful action and assistance required for hosted access versus a supported local setup | Choose local distribution if setup is acceptable and hosted operations dominate effort |
| Learners transfer skill after assistance disappears | Fresh ordinary-terminal task immediately and after seven days | Rework guidance and curriculum before adding content if gains disappear |
| Existing products already meet the need | Complete representative lessons in Learn Git Branching, Oh My Git!, and GitHub Skills; conduct a fair matched-task comparison | Integrate/recommend existing tools if GitCraft cannot improve the target outcome |

Small formative samples reveal failure patterns. They do not support broad efficacy claims; a later comparative study needs a sample-size rationale and predefined outcomes.

## Design references retained, not selected

Keel, Quarry, and Signal Console remain named user-provided references. Command remains a workspace-format candidate. Their original artifacts were not available in the project or saved-reference folder, so this plan assigns no invented colors, layouts, or screenshots to them.

The saved folder contained only [Herding warm charcoal](C:/Users/dharu/Documents/Codex/design-references/herding-warm-charcoal.md). It was inspected as context and left untouched. It does not override the user's references. Visual exploration, rendered desktop/mobile inspection, and theme selection belong after product and interaction validation.
