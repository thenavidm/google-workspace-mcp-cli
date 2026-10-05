/**
 * The server and CLI, now built by Slipway from the same tools.
 *
 * Parsing, help and output shapes are Slipway's and tested there. These cover
 * what this repo promises: every tool is a command, GWS_SERVICES still picks
 * the services, the irreversible calls ask first in 0.2's words, the gws CLI's
 * failures keep useful exit codes, and the docs stay in step with the code.
 * A fake gws stands in for Google's, so nothing leaves the machine.
 */

import { spawnSync } from "node:child_process"
import { chmodSync, existsSync, readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { checkApp, cli, connect } from "@thenavidm/slipway/testing"
import { app } from "../src/app.js"
import { TOOLS } from "../src/tools/index.js"

const fake = fileURLToPath(new URL("./fixtures/fake-gws.mjs", import.meta.url))
beforeAll(() => chmodSync(fake, 0o755))
afterEach(() => vi.unstubAllEnvs())

/** Runs the CLI with the fake gws, and its exit code if one is given. */
async function run(args: string[], exit?: number, stderr?: string) {
  vi.stubEnv("GWS_BIN", fake)
  if (exit) vi.stubEnv("FAKE_GWS_EXIT", String(exit))
  if (stderr) vi.stubEnv("FAKE_GWS_STDERR", stderr)
  return cli(app, args, { env: {} })
}

describe("Workspace on Slipway", () => {
  it("makes all 38 tools commands, the four irreversible ones needing confirmation", async () => {
    const context = JSON.parse((await cli(app, ["agent-context", "--brief"], { env: {} })).stdout)
    const commands = context.commands as Array<{ command: string; requires_confirm?: boolean }>
    expect(commands.map((c) => c.command).sort()).toEqual(TOOLS.map((tool) => tool.name.replace(/_/g, "-")).sort())
    expect(commands).toHaveLength(38)
    expect(commands.filter((c) => c.requires_confirm).map((c) => c.command).sort()).toEqual(
      ["calendar-delete-event", "drive-trash", "gmail-send-draft", "workspace-raw"],
    )
  })

  it("shows only the services GWS_SERVICES names, and the two raw tools", async () => {
    const mcp = await connect(app, { env: { GWS_SERVICES: "gmail,drive" } })
    const names = (await mcp.listTools()).map((t) => t.name)
    await mcp.close()
    expect(names).toContain("gmail_search")
    expect(names).toContain("drive_trash")
    expect(names).toContain("workspace_raw")
    expect(names).not.toContain("calendar_list_events")
    expect(names).not.toContain("sheets_read")
  })

  it("hides every write under GWS_READ_ONLY=1, and keeps the raw tool for reads, as 0.2 did", async () => {
    const readOnly = { env: { GWS_READ_ONLY: "1" } }
    const mcp = await connect(app, readOnly)
    const names = (await mcp.listTools()).map((t) => t.name)
    await mcp.close()
    expect(names).toContain("gmail_search")
    expect(names).not.toContain("gmail_create_draft")
    expect(names).toContain("workspace_raw")
    vi.stubEnv("GWS_BIN", fake)
    expect((await cli(app, ["workspace-raw", "--service", "drive", "--path", "files", "--path", "list", "--agent"], readOnly)).code).toBe(0)
    const write = await cli(app, ["workspace-raw", "--service", "drive", "--path", "files", "--path", "create", "--body", '{"name":"x"}', "--agent"], readOnly)
    expect(write.code).toBe(2)
    expect(JSON.parse(write.stderr).error).toMatch(/^workspace_raw only reads while this server is running with GWS_READ_ONLY=1, and this call writes/)
    const del = await cli(app, ["workspace-raw", "--service", "drive", "--path", "files", "--path", "delete", "--confirm", "--agent"], readOnly)
    expect(del.code).toBe(2)
  })

  it("finds the command for a task described in words", async () => {
    const first = async (...words: string[]) => (await cli(app, ["which", ...words], { env: {} })).stdout.split("\n")[0]
    expect(await first("send", "a", "draft")).toContain("gmail-send-draft")
    expect(await first("append", "rows", "to", "a", "sheet")).toContain("sheets-append")
  })

  it("passes a read to gws as arguments, never through a shell", async () => {
    const out = await run(["gmail-search", "--q", "from:sarah; rm -rf /", "--agent"])
    expect(out.code).toBe(0)
    expect(JSON.parse(out.stdout).called.slice(0, 3)).toEqual(["gmail", "users", "messages"])
    expect(JSON.parse(out.stdout).called).toContain(JSON.stringify({ userId: "me", q: "from:sarah; rm -rf /", maxResults: 25 }))
  })

  it("refuses to send a draft without --confirm, in 0.2's words, and sends it with it", async () => {
    const refused = await run(["gmail-send-draft", "--draft-id", "d1", "--agent"])
    expect(refused.code).toBe(2)
    expect(JSON.parse(refused.stderr).error).toBe(
      "gmail_send_draft sends the email, which cannot be recalled, so it will not run without --confirm. About to: send draft d1. Call again with --confirm if that is what was asked for.",
    )
    expect((await run(["gmail-send-draft", "--draft-id", "d1", "--confirm", "--agent"])).code).toBe(0)
  })

  it("asks for --confirm on a raw delete, and not on a raw read", async () => {
    expect((await run(["workspace-raw", "--service", "drive", "--path", "files", "--path", "list", "--agent"])).code).toBe(0)
    const del = await run(["workspace-raw", "--service", "drive", "--path", "files", "--path", "delete", "--agent"])
    expect(del.code).toBe(2)
    expect(JSON.parse(del.stderr).error).toMatch(/^workspace_raw looks like a delete/)
  })

  it("gives the gws CLI's failures exit codes a script can act on", async () => {
    expect((await run(["gmail-list-labels", "--agent"], 2, "not signed in")).code).toBe(10)
    expect((await run(["gmail-list-labels", "--agent"], 3, "bad params")).code).toBe(2)
    expect((await run(["gmail-list-labels", "--agent"], 1, "Google said no")).code).toBe(5)
    vi.stubEnv("GWS_BIN", "/nonexistent/gws")
    const missing = await cli(app, ["gmail-list-labels", "--agent"], { env: {} })
    expect(missing.code).toBe(10)
    expect(JSON.parse(missing.stderr).error).toMatch(/gws` CLI was not found/)
  })

  it("refuses --http without a bearer token, even on this machine, as 0.2 did", () => {
    const entry = fileURLToPath(new URL("../dist/index.js", import.meta.url))
    if (!existsSync(entry)) return // CI builds before it tests; a bare checkout has no dist yet.
    const run = spawnSync(process.execPath, [entry, "--http"], { env: { PATH: process.env.PATH, HOME: "/nonexistent" }, encoding: "utf8" })
    expect(run.status).toBe(10)
    expect(run.stderr).toMatch(/GWS_HTTP_TOKEN is not set/)
  })

  it("passes slipway check", async () => {
    const report = await checkApp(app, { env: {} })
    expect(report.findings.filter((finding) => finding.level === "error")).toEqual([])
  })
})

describe("documentation stays in step with the code", () => {
  const read = (p: string): string => readFileSync(new URL(p, import.meta.url), "utf-8")
  const names = (text: string): Set<string> => new Set((text.match(/GWS_[A-Z_]+/g) ?? []).filter((name) => !name.endsWith("_")))
  const source = (dir: string): string =>
    readdirSync(new URL(dir, import.meta.url), { withFileTypes: true })
      .map((entry) => (entry.isDirectory() ? source(`${dir}${entry.name}/`) : entry.name.endsWith(".ts") ? read(`${dir}${entry.name}`) : ""))
      .join("\n")

  /** Every variable the server reads: this repo's code, and Slipway's as agent-context lists them. */
  const used = async (): Promise<Set<string>> => {
    const context = JSON.parse((await cli(app, ["agent-context"], { env: {} })).stdout)
    return new Set([...names(source("../src/")), ...context.settings.map((setting: { env: string }) => setting.env)])
  }

  it("documents every environment variable the code reads", async () => {
    const documented = names(read("../README.md"))
    expect([...(await used())].filter((v) => !documented.has(v))).toEqual([])
  })

  it.each(["../README.md", "../INSTALL.md"])("has no dead in-page anchors in %s", (file) => {
    if (!existsSync(new URL(file, import.meta.url))) return
    const md = read(file).replace(/```[\s\S]*?```/g, "")
    // GitHub's slug keeps letters, marks, numbers and connector punctuation, so an
    // emoji's variation selector (U+FE0F) stays in the anchor and a link has to carry it.
    const slugs = new Set(
      [...md.matchAll(/^#{1,6} (.+)$/gm)].map(([, heading]) =>
        (heading as string).trim().toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\s-]/gu, "").replace(/ /g, "-"),
      ),
    )
    const dead = [...md.matchAll(/\[[^\]]+\]\(#([^)]+)\)/g)].map((m) => decodeURIComponent(m[1] as string)).filter((a) => !slugs.has(a))
    expect(dead).toEqual([])
  })
})
