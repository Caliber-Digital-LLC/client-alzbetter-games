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
