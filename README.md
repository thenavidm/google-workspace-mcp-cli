<img src="https://cdn.navid.media/connectors/google-workspace-icon.png" alt="Google Workspace" width="88">

# Google Workspace MCP Server & CLI

[![npm](https://img.shields.io/npm/v/@thenavidm%2Fgoogle-workspace-mcp-cli?color=orange&label=npm)](https://www.npmjs.com/package/@thenavidm/google-workspace-mcp-cli)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![YouTube](https://img.shields.io/badge/YouTube-@thenavidm-red?logo=youtube&logoColor=white)](https://youtube.com/@thenavidm?sub_confirmation=1)
[![X](https://img.shields.io/badge/X-@thenavidm-black?logo=x)](https://x.com/thenavidm)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-thenavidm-0A66C2?logo=linkedin&logoColor=white)](https://linkedin.com/in/thenavidm)

Google Workspace MCP server and CLI for Claude Code, Codex and AI agents. 38 tools for Gmail, Drive, Sheets, Docs, Slides, Calendar, Tasks, Forms and Contacts through Google's official Workspace CLI, so your credential never leaves your machine.

One install gives you both surfaces, the same 38 tools under the same names, from the same server, so they cannot drift apart.

It wraps Google's own Workspace CLI, so your credential is created by you and stays on your machine. That also sidesteps the security assessment a third-party OAuth app needs for mailbox and Drive access.

Built by [Navid Moazzez](https://navid.me?utm_source=github&utm_medium=referral&utm_campaign=google-workspace-mcp-cli&utm_content=readme). Built on [Slipway](https://github.com/thenavidm/slipway), which turns one definition of each tool into the MCP server and the CLI.

<img src="https://cdn.navid.media/repos/google-workspace-mcp.gif?v=1" alt="Claude Code using the Google Workspace MCP server" width="520">

## Two ways to use it

### Command line

`google-workspace-cli` runs every tool as a command. Agents that run commands, like
Claude Code, Codex and OpenCode, use it on their own, and you can type the same
commands in a terminal, a script or a cron job:

```bash
google-workspace-cli                                          # every command, one line each
google-workspace-cli gmail-search --q "from:sarah newer_than:30d" --max 5
google-workspace-cli calendar-list-events --json
google-workspace-cli drive-search --q "name contains 'invoice'" --agent
google-workspace-cli gmail-create-draft --to a@example.com --subject Hi --body "See you Friday"
google-workspace-cli gmail-send-draft --draftId r-123 --confirm
google-workspace-cli which append rows to a sheet              # find the command for a task
google-workspace-cli <command> --help                         # what any command takes
```

`--confirm` is the shell spelling of the confirmation sending a draft needs. `--json` gives JSON, `--compact` puts it on one line, `--select` keeps only the fields you name, and `--agent` turns on all of it for a script. Exit codes are 0 ok, 1 unexpected, 2 usage or a refused write, 3 not found, 4 auth, 5 API, 7 rate limited and 10 nothing configured, so a script branches on the number.

`google-workspace-cli schema <command>` prints the exact JSON Schema an MCP client
receives for that tool.

### MCP server, for AI agents

`google-workspace-mcp` is what Claude Code, Claude Desktop, Cursor and the rest launch.
You never run it by hand:

```bash
claude mcp add google-workspace -- npx -y @thenavidm/google-workspace-mcp-cli
```

In Claude Desktop, the [`.mcpb` extension](https://github.com/thenavidm/google-workspace-mcp-cli/releases/latest)
installs on a double click. Section 4 has every other client.

### What each costs

Both surfaces are the same program with the same 38 tools. The
difference is when the model pays for them. Measured in Claude Code:

| | MCP server | CLI |
|---|---|---|
| Every message, with every tool loaded | 5,700 tokens | nothing |
| Every message, Claude Code's default | 810 tokens | nothing |
| When Google Workspace comes up | nothing more, or the tools it picks | 1,800 tokens for `SKILL.md`, once |
| 20 messages with Google Workspace in 1, every tool loaded | 114,000 tokens | 1,800 tokens |

Claude Code's [tool search](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search)
is on by default: it sends only the tool names and the server instructions,
and loads a tool's full definition when the model reaches for it. An app that
loads every tool up front pays the first line on every message, whether
Google Workspace comes up or not. With the skill added, Claude Code also lists its
one-line description, about 140 tokens.

To spend less, turn the server off when you are not using it, which in Claude
Code is the `/mcp` panel. `GWS_SERVICES=gmail,calendar` lists only the services you name, and the rest cost nothing.
Or install the CLI and add the server on the days it earns its place.

Measured on 2026-10-05 against 0.2.2, with Claude Code 2.1.286 on Claude Opus
5.5 (one short prompt with and without the server connected, once with
`ENABLE_TOOL_SEARCH=false` and once with the default, the difference read from
the API's own usage figures; `SKILL.md` the same way) and Codex 0.159.3 on
gpt-6.1-sol, with a stand-in for the `gws` CLI so nothing reached a Google
account:

| Cost | 0.2.2 | 0.3.0 |
| --- | --- | --- |
| Claude Code, every tool loaded, every message | 6,680 | 5,722 |
| Claude Code's default, tool search, every message | 804 | 806 |
| `SKILL.md`, read once | 1,762 | 1,754 |
| Codex over the CLI, one task, median of five | 83,609 | 61,752 |
| Codex over MCP, the same task, median of 10 | 39,895 | 48,582 |

The task was "find the command that appends rows to a Google Sheet, and the
flags it requires". Every tool loaded costs less because each tool no longer
repeats `$schema` and an `execution` block. Over the CLI, every 0.2.2 run read
the general help, the command list and the command's help, three requests that
each carry the conversation so far, and every 0.3.0 run read the general help
and asked `which`, which answered with the command's help: two. Over MCP,
Codex's model writes a script that prints either the tool it wants or the whole
list, and it chose the whole list in five 0.3.0 runs and one 0.2.2 run of 10
each, before it had seen either version's tools; what each printout cost was
the same or less for 0.3.0. Tool search costs the same within the spread of
each version's own rounds, 803 to 810 tokens. Other apps and models count tokens a little
differently, and tool-list characters divided by four are not API usage.

## Contents

| | Section | |
|---|---|---|
| 1 | [What you can ask it](#1-what-you-can-ask-it-) | Real prompts, not features |
| 2 | [Quick install](#2-quick-install-) | Node, one command |
| 3 | [Setup](#3-setup-) | Sign in once |
| 4 | [Connect your client](#4-connect-your-client-) | Every client, copy and paste |
| 5 | [Check it worked](#5-check-it-worked-) | `doctor` |
| 6 | [Tools](#6-tools-%EF%B8%8F) | All 38 |
| 7 | [Running it on a server](#7-running-it-on-a-server-%EF%B8%8F) | For claude.ai |
| 8 | [Safety](#8-safety-%EF%B8%8F) | What it will not do |
| 9 | [Troubleshooting](#9-troubleshooting-) | When something breaks |
| 10 | [FAQ](#10-faq-) | Start here if you are new |

## 1. What you can ask it 💬

- What did I agree to with the agency, and is it in the calendar?
- Summarize every unread email from this week and tell me which need a reply.
- Draft replies to the three that matter. Do not send them.
- Find the pricing spreadsheet and tell me what changed since March.
- Pull every response to the onboarding form into a new sheet.
- Who did I email about the launch, and did they reply?
- Build a doc from the notes in that folder.
- What is on my calendar next week that I could move?

The first one is the point. It reads mail and calendar together, which no single Google product does for you.

## 2. Quick install ⚡

Node 22 or newer. Nothing else.

```bash
npx -y @thenavidm/google-workspace-mcp-cli --version
```

That is the whole install. `npx` fetches it on demand, so there is nothing to update later.

For the CLI as a command you or your agent can run anywhere, install it once:

```bash
npm install -g @thenavidm/google-workspace-mcp-cli
google-workspace-cli
```

You also need Google's Workspace CLI, which is what actually talks to Google:

```bash
# macOS
brew install googleworkspace/tap/gws

# or download a binary
# https://github.com/googleworkspace/cli/releases
```

## 3. Setup 🔑

One command, once.

```bash
gws auth login
```

A browser opens, you approve, and you are done. The credential belongs to the CLI, not to this server.

Limit what it can touch while you are there:

```bash
gws auth login --services drive,gmail,calendar
gws auth login --readonly
```

### You will see an "unverified app" warning

That is expected and it is not a problem. Google shows it for any OAuth app it has not reviewed, and reviewing an app that only you use is not worth the process. Click **Advanced**, then **Go to (your app)**.

If you would rather not see it, `gws auth setup` walks you through creating your own Google Cloud project, and then the app is yours.

### Revoking

```bash
gws auth logout
```

Or remove access at [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

## 4. Connect your client 🔌

### Claude Code

```bash
claude mcp add google-workspace -- npx -y @thenavidm/google-workspace-mcp-cli@latest
```

`--scope user` makes it available in every project rather than the current one.

### Claude Desktop

The short way: download the [`.mcpb` extension](https://github.com/thenavidm/google-workspace-mcp-cli/releases/latest)
from the latest release and double-click it. It carries its own dependencies,
so there is no config file to edit and nothing to install first. Install and sign in to gws first (section 3), because the extension talks to Google through it.

The long way, if you would rather edit the config yourself:

| Platform | Config path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "@thenavidm/google-workspace-mcp-cli@latest"]
    }
  }
}
```

> **Tip**
> Claude Desktop does not inherit your shell PATH, so it may not find `npx` or `gws`. If it fails, use absolute paths from `which npx` and `which gws`, and set `GWS_BIN` to the second one.

Quit Claude Desktop completely and reopen it.

### claude.ai on the web

claude.ai runs connectors from Anthropic's cloud, not from your machine, so it cannot launch a local command. It needs this server running somewhere with a public HTTPS address. See [section 7](#7-running-it-on-a-server-%EF%B8%8F).

### Cursor

`.cursor/mcp.json`

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["-y", "@thenavidm/google-workspace-mcp-cli@latest"]
    }
  }
}
```

### Windsurf

`~/.codeium/windsurf/mcp_config.json`, same shape as Cursor.

### VS Code

`.vscode/mcp.json`. The key is `servers`, not `mcpServers`.

```json
{
  "servers": {
    "google-workspace": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@thenavidm/google-workspace-mcp-cli@latest"]
    }
  }
}
```

### Codex CLI

`~/.codex/config.toml`

```toml
[mcp_servers.google-workspace]
command = "npx"
args = ["-y", "@thenavidm/google-workspace-mcp-cli@latest"]
```

### Everything else

Any stdio MCP client takes the same two things: the command `npx` and those arguments.

## 5. Check it worked 🩺

```bash
npx -y @thenavidm/google-workspace-mcp-cli doctor
```

It checks the CLI is present, that you are authenticated, and makes one live API call. It exits 0 when everything works and 1 when something does not. If every line is fine, restart your client and ask it `what is on my calendar today`.

## 6. Tools 🛠️

38 tools. The named ones cover what an assistant reaches for; `workspace_raw` covers the rest.

### Gmail

| Tool | Does |
|---|---|
| `gmail_search` | search with Gmail's own query syntax |
| `gmail_get_message` | one message in full |
| `gmail_get_thread` | a whole conversation in order |
| `gmail_create_draft` | write a draft, never sends |
| `gmail_send_draft` | send an existing draft, needs confirming |
| `gmail_modify_labels` | archive, mark read, triage |
| `gmail_list_labels` | label ids, which differ from their names |

### Drive

| Tool | Does |
|---|---|
| `drive_search` | find files with Drive query syntax |
| `drive_get_file` | metadata, sharing, link |
| `drive_export` | the **content** of a Doc, Sheet or Slide as text |
| `drive_create_folder` | |
| `drive_share` | grant someone access |
| `drive_trash` | to the trash, recoverable, needs confirming |

### Sheets, Docs, Slides

`sheets_read` · `sheets_write` · `sheets_append` · `sheets_get` · `sheets_create`
`docs_get` · `docs_create` · `docs_append`
`slides_get` · `slides_create`

### Calendar and Tasks

`calendar_list_events` · `calendar_create_event` · `calendar_update_event` · `calendar_delete_event` · `calendar_list_calendars`
`tasks_lists` · `tasks_list` · `tasks_create` · `tasks_complete`

### Forms and Contacts

`forms_get` · `forms_responses` · `contacts_search` · `contacts_list`

### Everything else

| Tool | Does |
|---|---|
| `workspace_schema` | the exact shape a method expects, from Google's discovery service |
| `workspace_raw` | call any of the ~400 methods the tools above do not cover |

Read the schema before using `workspace_raw`, rather than guessing field names.

## 7. Running it on a server 🖥️

Needed for claude.ai, and useful if you want it always on.

```bash
curl -fsSL https://raw.githubusercontent.com/thenavidm/google-workspace-mcp-cli/main/deploy/install.sh | sudo bash
```

That creates a dedicated user, installs the `gws` binary with its checksum verified, generates a bearer token, and runs a systemd service bound to `127.0.0.1:8787`. Nothing is exposed to the internet by the script: put it behind your existing reverse proxy, which is where TLS belongs.

Then authenticate as the service user. The script prints the exact command.

Docker instead:

```bash
docker build -t google-workspace-mcp .
docker run -d --name gws-mcp -p 127.0.0.1:8787:8787 \
  -e GWS_MCP_TOKEN="$(openssl rand -hex 32)" \
  -v ~/.config/gws:/home/node/.config/gws \
  google-workspace-mcp
```

The config mount must be read-write: `gws` stores its encryption key and cached discovery documents there, not just a token.

> **Note**
> On macOS the credential lives in the OS keyring, so copying `~/.config/gws` to a Linux box does not work. Set `GOOGLE_WORKSPACE_CLI_KEYRING_BACKEND=file` and authenticate on the server itself.

## 8. Safety 🛡️

**Email is drafted, never sent silently.** `gmail_create_draft` writes to Drafts and stops. Sending is a separate tool that needs confirming, because a sent email cannot be recalled.

**Confirmation on what cannot be undone:** `gmail_send_draft`, `drive_trash`, `calendar_delete_event`, and `workspace_raw` when its method deletes, removes, trashes or clears. Over MCP a person approves each call: Claude Code (2.1.246 and later) shows its own prompt, and a client that can show forms asks with an approval form whose one box starts unticked. Where a client can do neither, the model's `confirm: true` still counts, and `GWS_CONFIRM=model` makes it enough everywhere. In a terminal the flag is `--confirm`, which `--agent` never adds.

**Nothing is deleted permanently.** `drive_trash` is recoverable for 30 days. There is no hard-delete tool.

**Turn writes off, or narrow the surface:**

```bash
GWS_READ_ONLY=1                  # hide and refuse every write; workspace_raw stays for reads
GWS_SERVICES=drive,calendar      # nothing else is even listed
GWS_AUDIT_LOG=~/gws-audit.jsonl  # one line per attempted write, with who approved it
```

`GWS_SERVICES` removes the other tools from the list rather than failing when called. A model cannot reach for a tool it cannot see.

### Settings

The program reads the environment directly. It does not load `.env` files. The Google credential is the `gws` CLI's, so none is set here.

| Variable | Default | Purpose |
| --- | --- | --- |
| `GWS_BIN` | `gws` on the PATH | Path to the gws binary |
| `GWS_SERVICES` | Every service | Show only these services' tools, e.g. `drive,gmail,calendar` |
| `GWS_READ_ONLY` | Off | `1` or `true` hides every write, and `workspace_raw` runs only calls that send no body and delete nothing |
| `GWS_ALLOW_DESTRUCTIVE` | On | `0` refuses sending, trashing, deleting and raw deletes |
| `GWS_CONFIRM` | `human` | `model` lets `confirm: true` alone approve over MCP, for an agent with no person to ask |
| `GWS_AUDIT_LOG` | Empty | Append guard decisions to this local path |
| `GWS_TOOLSETS` | `GWS_SERVICES`, or all | The same choice by Slipway's name |
| `GWS_SURFACE` | `full` | `search` lists three tools that find, describe and run the rest |
| `GWS_TOOL_TIMEOUT_MS` | None | Give up on any tool after this long |
| `GWS_HTTP_TOKEN` | None | Bearer token `--http` requires, here even on this machine; `GWS_MCP_TOKEN`, its 0.2 name, still works |
| `GWS_HTTP_PORT`, `GWS_HTTP_HOST` | 8787, 127.0.0.1 | For `--http`; `--port` and `--host` still work |
| `GWS_HTTP_ALLOWED_ORIGINS` | None | Comma-separated browser origins allowed to call `--http`; a page from any other site is refused |
| `GWS_DEBUG` | `0` | `1` prints debug lines on stderr |

**Prompt injection.** Anything read from a mailbox or a shared document was written by someone else and can contain text shaped like an instruction. The server tells the model to treat it as data. That helps and is not a guarantee: for an agent working unattended on other people's content, `GWS_READ_ONLY=1` is the real defence.

Full detail in [SECURITY.md](./SECURITY.md).

## 9. Troubleshooting 🔧

Run `doctor` first. It answers most of it.

| Symptom | Cause |
|---|---|
| "The `gws` CLI was not found" | not installed, or not on the PATH your client uses. Set `GWS_BIN` to its full path |
| "Not authenticated" | run `gws auth login` on the machine running the server |
| Works in the terminal, not in Claude Desktop | Desktop does not inherit your shell PATH. Use absolute paths |
| "unverified app" warning | expected. Advanced, then Go to. See [section 3](#3-setup-) |
| A tool says the service is disabled | `GWS_SERVICES` is set and does not include it |
| `--http` refuses to start | `GWS_HTTP_TOKEN`, or 0.2's `GWS_MCP_TOKEN`, is not set. That is deliberate |
| claude.ai cannot see it | it needs a public HTTPS URL, see [section 7](#7-running-it-on-a-server-%EF%B8%8F) |

## 10. FAQ ❓

<details>
<summary><b>What is an MCP server?</b></summary>

An MCP server is a standard way to give an AI assistant real access to a tool, so it can act rather than guess. You install it once, your assistant gains a set of tools, and the same server works in Claude, Cursor, ChatGPT and anything else that speaks MCP.

Without one, an assistant can only talk about your email. With one, it can read it.

</details>

<details>
<summary><b>What is the CLI?</b></summary>

`google-workspace-cli` is the same program as the MCP server, run as commands. AI agents that run commands, like Claude Code, Codex and OpenCode, use it on their own, and you can type the same commands in a terminal, a script or a cron job. Every tool is a command with dashes, so `gmail_search` runs as `google-workspace-cli gmail-search`.

</details>

<details>
<summary><b>Should I use the MCP server or the CLI?</b></summary>

Use the MCP server in an app with no terminal, like Claude Desktop's chat. Use the CLI anywhere commands run: an agent like Claude Code, Codex or OpenCode, a script or a cron job. The MCP server's tools take up context on every message, and the CLI costs nothing until it runs.

</details>

<details>
<summary><b>What is Google Workspace?</b></summary>

Google's suite of work apps: Gmail, Drive, Docs, Sheets, Slides, Calendar, Tasks, Forms and Contacts. If you use a Gmail address, you already have it.

</details>

<details>
<summary><b>Do I need to be technical to use this?</b></summary>

You need to be comfortable running two commands in a terminal: one to install, one to sign in. After that it is all conversation with your assistant.

If a terminal is unfamiliar, the Claude Desktop path in [section 4](#4-connect-your-client-) is the shortest route.

</details>

<details>
<summary><b>Is my data sent anywhere? Who can see it?</b></summary>

Your Google data goes from Google to the machine running this server, and from there to whichever AI client you connected. It does not pass through any server of ours, because there isn't one.

The exception is deliberate and worth understanding: whatever your assistant reads, it sends to its own model provider, the same as anything else you paste into a chat.

</details>

<details>
<summary><b>What can it do that I cannot do in the app already?</b></summary>

Work across apps in one step. Gmail cannot search your Drive, and Calendar cannot read your mail. An assistant with this server does both in a single question, and it can act on the answer: draft the reply, create the event, update the sheet.

</details>

<details>
<summary><b>Can it delete something by accident?</b></summary>

It can trash a Drive file and delete a calendar event, and both need confirming: over MCP a person approves each in the client, and in a terminal it takes `--confirm`. Trashed files are recoverable for 30 days. There is no permanent-delete tool.

It cannot send an email by accident: drafting and sending are separate tools, and sending needs confirmation.

If you want none of that, run it with `GWS_READ_ONLY=1`.

</details>

<details>
<summary><b>Does it cost anything?</b></summary>

It costs nothing. The server is free and open source, Google's CLI is free, and the Workspace APIs are free at any volume a person generates.

</details>

<details>
<summary><b>Does it work with ChatGPT, Cursor and claude.ai, or only Claude?</b></summary>

It works with any MCP client. Claude Code, Claude Desktop, Cursor, Windsurf, VS Code, Codex CLI and Gemini CLI all run it locally.

claude.ai is the exception: it connects from Anthropic's cloud rather than your machine, so it needs the server running somewhere with a public HTTPS address. See [section 7](#7-running-it-on-a-server-%EF%B8%8F).

</details>

<details>
<summary><b>Can I connect more than one Google account?</b></summary>

One account per server. The `gws` CLI holds a single login.

For a second account, run a second copy with `GOOGLE_WORKSPACE_CLI_CONFIG_DIR` pointing somewhere else, and add it to your client under a different name.

</details>

<details>
<summary><b>What happens when my token expires?</b></summary>

It refreshes itself. The CLI holds a refresh token and renews access silently, so you sign in once.

If you ever do need to sign in again, `doctor` says so plainly rather than failing with a permissions error.

</details>

## Questions

Run into a problem or have a question? [Open an issue](https://github.com/thenavidm/google-workspace-mcp-cli/issues) and I will help.

## About the author

Navid Moazzez is a leading AI business strategist, and the host of the AI Creator Summit, watched by 100,000+ creators. He helps creators and founders master AI and build their own AI Operating System (AI OS) to automate their business and life. He creates useful free tools, MCP servers and CLIs that creators and founders can use in their own workflows.

**Links**

- Personal website: [navid.me](https://navid.me?utm_source=github&utm_medium=referral&utm_campaign=google-workspace-mcp-cli&utm_content=readme)
- Navid Media: [navid.media](https://navid.media?utm_source=github&utm_medium=referral&utm_campaign=google-workspace-mcp-cli&utm_content=readme)
- YouTube: [@thenavidm](https://youtube.com/@thenavidm?sub_confirmation=1) and [@thenavidai](https://youtube.com/@thenavidai?sub_confirmation=1)
- X: [@thenavidm](https://x.com/thenavidm)
- Instagram: [@thenavidm](https://instagram.com/thenavidm)
- LinkedIn: [thenavidm](https://linkedin.com/in/thenavidm)

If this is useful, star the repo and come say hi on [X](https://x.com/thenavidm).

## Dependencies

| Library | License | What it does |
|---|---|---|
| [Google Workspace CLI](https://github.com/googleworkspace/cli) | Apache-2.0 | Talks to Google, and owns the credential |
| [Slipway](https://github.com/thenavidm/slipway) | Apache-2.0 | The MCP server, the CLI and the HTTP transport from one definition of each tool |
| [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) | Apache-2.0 | The MCP protocol and its transports, through Slipway |
| [zod](https://github.com/colinhacks/zod) | MIT | Tool argument schemas |

## License

[MIT](./LICENSE). Free to use, modify, and share.

Not affiliated with, endorsed by, or sponsored by Google LLC. Google Workspace, Gmail, Google Drive, Google Docs, Google Sheets, Google Slides, Google Calendar, Google Tasks, Google Forms and Google Contacts are trademarks of Google LLC. This project wraps the official Google Workspace CLI and holds no credentials of its own.

---

© 2026 [Navid Media](https://navid.media?utm_source=github&utm_medium=referral&utm_campaign=google-workspace-mcp-cli&utm_content=readme). Made with ❤️ by [Navid Moazzez](https://navid.me?utm_source=github&utm_medium=referral&utm_campaign=google-workspace-mcp-cli&utm_content=readme).
