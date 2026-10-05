# Google Workspace MCP Server & CLI changelog

| Component | Version | Last Updated |
|-----------|---------|--------------|
| google-workspace-mcp-cli | 0.3.0 | 2026-10-05 |
| `@thenavidm/slipway` | 0.1.21 | 2026-10-05 |
| Node | >= 22 | 2026-10-05 |

---

## 0.3.0, 2026-10-05

Built on [Slipway](https://github.com/thenavidm/slipway) 0.1.21. The 38 tools keep their names and arguments, and every difference below was measured against 0.2.2, the last version on npm, before release. A stand-in for the `gws` CLI answered every call, so no measurement touched a Google account.

- **`which <words>` finds a command**, and `agent-context` describes every command, flag and setting as JSON. In Codex 0.159.3, finding the command that appends rows to a Google Sheet, and its flags, took a median of 61,752 input tokens over the CLI instead of 83,609 (five runs each). Every 0.2.2 run read the general help, the command list and then the command's help; every 0.3.0 run read the general help and asked `which`, which answered with the command's help: two commands instead of three, and each one carries the conversation so far.
- **A person approves each irreversible call over MCP.** `gmail_send_draft`, `drive_trash`, `calendar_delete_event`, and `workspace_raw` when its method deletes, removes, trashes or clears, still need confirmation. Claude Code (2.1.246 and later) shows its own prompt, and a client that can show forms asks with an approval form whose one box starts unticked. Approvals are signed, bound to the exact call and work once. Where a client can do neither, the model's `confirm: true` still counts, and `GWS_CONFIRM=model` makes it enough everywhere. A refusal says what is lost in the words of 0.2.2's instructions, "sends the email, which cannot be recalled", and what was about to happen: "About to: send draft r-123."
- **`GWS_READ_ONLY=1` takes the 17 writes off the list**, where 0.2.2 listed all 38 tools and refused a write when it was called, so a read-only server's list is less than half as long. `workspace_raw` stays for reads, as in 0.2.2: a call that sends no body and deletes nothing runs, and any other is refused, confirmed or not.
- **`GWS_SERVICES` still picks the services**, now as Slipway toolsets, so `GWS_TOOLSETS` is the same choice by Slipway's name, and `workspace_raw` still refuses a service the setting leaves out.
- **The `gws` CLI's failures keep exit codes a script can act on.** No `gws` binary, or one that is not signed in, exits 10; arguments it rejects exit 2; anything else from Google exits 5. 1 now means an unexpected error.
- **Smaller answers over MCP.** A result is compact JSON, where 0.2.2 indented it, so the same answer costs fewer tokens. A failure is JSON too, with Slipway's `code`, where 0.2.2 sent the message alone.
- **A smaller tool list.** Each tool no longer repeats `$schema` or an `execution` block saying it runs no background tasks, so the list is 5,309 o200k tokens instead of 5,334 even with a title on every tool, and Claude Code 2.1.286 spends 5,722 tokens a message on it with every tool loaded instead of 6,680.
- **Less to install and start.** npx installs 4 packages instead of 94: Slipway brings the MCP SDK's 2.x server package, which carries no web framework. The entry turns on Node's compile cache, and the server spends 156 ms of CPU before its first answer where 0.2.2 spent 238, and answers in 112 ms of wall time instead of 165 (median of 21 runs, taking turns on one Mac).
- **`--http` still refuses to start without a bearer token, even on this machine.** `GWS_HTTP_TOKEN` is its name now, and 0.2.2's `GWS_MCP_TOKEN`, `--host` and `--port` still work. It also refuses a page from another site unless `GWS_HTTP_ALLOWED_ORIGINS` lists it.
- **0.2.2's flag spellings still answer**, `--draft-id` as well as `--draftId`. `install <client>` adds the server to Claude Code, Codex, Claude Desktop, Cursor, VS Code or Gemini CLI in each one's own format, and `doctor` runs 0.2.2's checks: the `gws` CLI, its sign-in and one live Drive call.
- **`GWS_AUDIT_LOG`** writes one JSON line per attempted write, allowed or refused, with who approved it, then whether it was done or failed.
- **Docs.** The README's costs are measured against 0.2.2, where they were 2026-09-27's, and a settings table lists every variable. `SKILL.md` lists exit codes 1 and 10, says sending needs confirming rather than `confirm: true`, and costs 1,754 tokens in Claude Code instead of 1,762.

What did not get better: over MCP, Codex's median rose from 39,895 input tokens to 48,582 across 10 runs each. Codex first asks with only the tools' names, and that request's text was identical for both versions. The model then writes a script that prints either the tool it wants or the server's whole list, and it printed the whole list in five 0.3.0 runs and one 0.2.2 run of 10 each, and something longer still in one run of each, a choice made before it had seen anything from either version. What the server put in front of it was the same or less each time: the one tool printed in the same 2,427 characters, and the whole list was cut to the same length, which left 0.3.0's request 15 tokens smaller. Claude Code's tool search measured 804 tokens a message for 0.2.2 and 806 for 0.3.0, within the spread of each version's own rounds, 803 to 810.

### Upgrading

Node 22 or later is required; 0.2.2 ran on 20. Over MCP, expect an approval prompt or form before sending, trashing or deleting; a headless agent that should run them with `confirm: true` alone needs `GWS_CONFIRM=model`. With `GWS_READ_ONLY=1`, a client that calls a hidden write gets "tool not found", and that call is not in the audit log; the CLI still names the setting. An error in the terminal is one JSON object with `error`, Slipway's `code` (`usage`, `refused`, `auth`, `not_found`, `rate_limited`, `timeout`, `api`, `not_configured`) and often a `hint`; over MCP an error is that JSON, where 0.2.2 sent its message as plain text, and a result is compact JSON rather than indented. Each confirmed tool's `confirm` argument now reads "Set true only when the user asked for exactly this action." A missing argument's error is 16 tokens longer, for its code and a hint.

## 0.2.2, 2026-10-04

- **`npx -y @thenavidm/google-workspace-mcp-cli` always starts the MCP server.** npx starts whichever binary the npm registry lists first when they share one file, and the registry does not keep the published order, so an MCP client set up with this README's install line could get `google-workspace-cli` and its command list instead of a server. A third binary named after the package now always starts the server, and npx picks it by name.

## 0.2.1

**A refusal says `--confirm` in a terminal.** The server words it for an AI, as `confirm: true`, and the CLI now rewrites that one phrase, so the command it asks for is the one you type. The command list only mentions `--confirm` where a tool takes it.

**The README shows the context cost measured in Claude Code**: every tool loaded, Claude Code's default tool search, and the CLI's `SKILL.md`, each from 2 real runs.

## 0.2.0

**A CLI.** `google-workspace-cli` runs every tool as a shell command. It builds the same server the MCP binary runs and calls it through the SDK's in-memory transport, so the flags, the validation and the write guard are the ones an MCP app gets, and the two surfaces cannot drift. Exit codes follow the house contract: 2 usage or a refused write, 3 not found, 4 auth, 5 API, 7 rate limited, 10 nothing configured.

**Renamed to google-workspace-mcp-cli**, the name every server with a CLI carries. The old package is deprecated with a pointer here, and GitHub redirects the old repo address.

**A Claude Desktop extension**, attached to each release.

**Tests and CI.** The repo had neither. The CLI's tests run against the real tool list, and CI checks the CLI lists all 38 tools.

Checked against a live account before release: the MCP tool list is byte-identical to 0.1.0's, and Calendar, Gmail and Drive answer through both surfaces.

## 0.1.0

First release.

### What it does

38 tools across Gmail, Drive, Docs, Sheets, Slides, Calendar, Tasks, Forms and
Contacts, over stdio and streamable HTTP.

### Why it wraps Google's CLI

Reading a mailbox needs `gmail.modify` and full Drive needs `drive`. Google
classes both as restricted, so any OAuth app declaring them faces an annual
third-party security assessment and a 100-user cap until it passes.

Google's Workspace CLI already handles authentication. Wrapping it means this
server never holds a Google credential, and the user's own login carries the
scopes.

### Notable

- 38 curated tools rather than the CLI's ~400 methods, plus `workspace_raw` and
  `workspace_schema` for everything else
- Email is drafted, never sent silently. Sending is a separate confirmed tool
- No permanent delete. `drive_trash` is recoverable for 30 days
- `GWS_READ_ONLY=1` and `GWS_SERVICES=` narrow the surface, removing tools from
  the list rather than failing when called
- `--http` refuses to start without a bearer token
- Arguments reach the CLI as an array, never a shell. Email headers reject CR/LF
- `deploy/install.sh` for systemd, and a Dockerfile pinned to a digest with the
  gws binary checksum-verified

### Verified at build time

- MCP TypeScript SDK 1.30.0, zod 4.5.4, Node 22
- Google Workspace CLI v0.22.5
- The CLI ships no OAuth client of its own, so a login uses yours. An unverified
  app in production still works: you click past one warning screen
- `GOOGLE_WORKSPACE_CLI_KEYRING_BACKEND=file` avoids the OS keyring, which is
  what makes headless servers work
