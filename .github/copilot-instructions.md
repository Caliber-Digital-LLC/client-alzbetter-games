# CBDG AI Memory Instructions

This repo is onboarded to the shared CBDG Memory system.

## Required
- Keep .cbdg/project.json accurate (clientSlug/projectSlug) so memory routes correctly.
- When you make meaningful changes via Copilot, append a matching memory event under the brain repo:
  - Memory/events/<clientSlug>/<projectSlug>/timeline.jsonl
  - and regenerate Memory/summaries/<clientSlug>/<projectSlug>/SUMMARY.md if needed.

## Safety
- Never write secrets (API keys, tokens, passwords, connection strings) into memory.
- Limited PII only when operationally required.

<!-- CBDG:BEGIN -->
# CBDG Workspace Automation (Required)

## Shell + commands
- Use **PowerShell (`pwsh`)** for all terminal commands on Windows.
- Prefer PowerShell syntax (no bash). When showing commands, format for `pwsh`.

## Context7 (framework patterns)
- When working in a code repo (Next.js, Node, Python, etc.), use **Context7** for framework/library patterns **when relevant and available** before implementing.
- If Context7 isn’t available in this environment, proceed with best practices and the repo’s existing conventions.

## Memory safety (if repo is onboarded)
- Never write secrets (API keys/tokens/passwords/connection strings/private keys) into `Memory/`.
- Memory is append-only: never overwrite or delete anything under `Memory/events/**`.
<!-- CBDG:END -->

