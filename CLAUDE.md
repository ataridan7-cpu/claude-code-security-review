# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A GitHub Action that uses Claude Code to perform AI-powered security reviews on pull requests. It runs `claude --output-format json` against PR diffs, applies two-stage false-positive filtering, and posts findings as inline review comments.

## Commands

```bash
# Run Python unit tests (from repo root)
export PYTHONPATH="${PYTHONPATH}:${PWD}"
pytest claudecode -v

# Run a single test file
pytest claudecode/test_findings_filter.py -v

# Run JavaScript tests for the PR comment script
cd scripts && bun test

# Install Python dependencies
pip install pytest pytest-cov
pip install -r claudecode/requirements.txt
```

Note: `pytest.ini` sets `testpaths = tests` but tests live in `claudecode/` — always pass the path explicitly as `pytest claudecode`.

## Architecture

### Action Pipeline (`action.yml`)

1. Cache-checks whether Claude already ran on this PR commit (keyed on `repo_id + pr_number + sha`) — prevents double-scanning and false positive accumulation. Controlled by `.claudecode-marker/marker.json`; override with `run-every-commit: true`.
2. Installs Python deps + Claude CLI (`npm install -g @anthropic-ai/claude-code`).
3. Runs `claudecode/github_action_audit.py` as the main Python entry point.
4. Posts findings as inline PR review comments via `scripts/comment-pr-findings.js` using the `gh` CLI.

### Core Python Modules (`claudecode/`)

**`github_action_audit.py`** — Main orchestration. Reads env vars (`GITHUB_REPOSITORY`, `PR_NUMBER`, `ANTHROPIC_API_KEY`), fetches PR data + diff from the GitHub API, builds the prompt, invokes `claude --output-format json` with the prompt via **stdin** (avoids shell argument-length limits), parses the JSON output, applies two-stage filtering, and prints the final results JSON to stdout. Retries up to 3 times on transient failures; if Claude returns `"Prompt is too long"` it retries without the diff.

**`prompts.py`** — Builds the security audit prompt. Includes PR metadata, the unified diff, and explicit exclusion categories (DoS, rate limiting, secrets on disk). Appends content from `custom-security-scan-instructions` when provided.

**`findings_filter.py`** — Two-stage false-positive filter applied after the main scan:
1. `HardExclusionRules` — fast pre-compiled regex rules that drop DoS, rate limiting, resource leaks, open redirects, memory-safety findings in non-C/C++ files, and SSRF in HTML.
2. `FindingsFilter` with `ClaudeAPIClient` — per-finding Claude API calls for nuanced filtering. Falls back to keeping findings if the API call fails.

**`claude_api_client.py`** — Thin Anthropic SDK wrapper used only for second-stage filtering (not for the main security scan).

**`json_parser.py`** — Robust JSON extraction from Claude's structured output, with multiple fallback strategies for partial or malformed responses.

**`constants.py`** — Central config: `DEFAULT_CLAUDE_MODEL` (overridable via `CLAUDE_MODEL` env var), `SUBPROCESS_TIMEOUT` (1200s), exit codes.

### Exit Codes

- `0` — Success, no HIGH severity findings after filtering
- `1` — HIGH severity findings found, or audit execution failure
- `2` — Configuration error (missing env vars, bad inputs)

### Eval Framework (`claudecode/evals/`)

Standalone tool for running the scanner against any GitHub PR locally. Uses git worktrees for efficient repo management. Run via:

```bash
python -m claudecode.evals.run_eval owner/repo#123 --verbose
```

Requires `ANTHROPIC_API_KEY` and `GITHUB_TOKEN` env vars.

### PR Comment Script (`scripts/`)

`comment-pr-findings.js` reads `findings.json` produced by the Python audit and uses `gh api` (not the GitHub Actions toolkit) to post inline review comments at specific file/line positions. Tested with `scripts/comment-pr-findings.bun.test.js`.

## Customization

- **Custom scan instructions**: Pass a file path via `custom-security-scan-instructions` action input; its content is appended to the Claude prompt.
- **Custom false-positive filtering**: Pass a file path via `false-positive-filtering-instructions`; its content is passed to `ClaudeAPIClient` during second-stage filtering.
- See `docs/` and `examples/` for templates.
