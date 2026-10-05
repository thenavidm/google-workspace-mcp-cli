/**
 * The Workspace app: everything Slipway needs to ship the MCP server and the CLI.
 *
 * This file only describes. It never starts anything, so `slipway check` and
 * tests can import it; `index.ts` is what runs.
 */

import { createRequire } from "node:module"
import { slipway, type DoctorCheck } from "@thenavidm/slipway"
import { gws, gwsBin } from "./gws.js"
import { INSTRUCTIONS } from "./instructions.js"
import { TOOLS } from "./tools/index.js"
import type { AppContext } from "./tools/kit.js"

const require = createRequire(import.meta.url)
export const VERSION: string = (require("../package.json") as { version: string }).version

const message = (error: unknown): string => (error as Error)?.message ?? String(error)

/**
 * The checks 0.2's doctor ran: is the gws CLI there and signed in, and does a
 * live call work. The credential is the CLI's, so this server only asks it.
 */
async function doctor(): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = []
  try {
    const status = (await gws({ service: "auth", path: ["status"] })) as Record<string, unknown>
    const method = status.auth_method
    if (!method || method === "none") {
      return [
        {
          name: "Sign-in",
          ok: false,
          detail: `the gws CLI at ${gwsBin()} is not signed in`,
          fix: "Run `gws auth login` on this machine. On a headless server, set GOOGLE_WORKSPACE_CLI_KEYRING_BACKEND=file first, so the credential lands in the config directory rather than an OS keyring.",
        },
      ]
    }
    checks.push({ name: "Sign-in", ok: true, detail: `${String(method)} through ${gwsBin()}, stored in ${String(status.storage)}, keyring ${String(status.keyring_backend)}` })
  } catch (error) {
    return [{ name: "gws CLI", ok: false, detail: message(error) }]
  }
  try {
    await gws({ service: "drive", path: ["files", "list"], params: { pageSize: 1, fields: "files(id)" } })
    checks.push({ name: "Drive", ok: true, detail: "a live API call succeeded" })
  } catch (error) {
    checks.push({ name: "Drive", ok: false, detail: message(error) })
  }
  return checks
}

/**
 * 0.2's CLI spelled every flag in kebab case, `--draft-id`, where Slipway keeps
 * an input's own name, `--draftId`; the old spelling still answers.
 */
function kebabAliases(): Record<string, string> {
  const aliases: Record<string, string> = {}
  for (const tool of TOOLS) {
    for (const key of Object.keys((tool.jsonSchema.properties as Record<string, unknown> | undefined) ?? {})) {
      const kebab = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
      if (kebab !== key) aliases[kebab] = key
    }
  }
  return aliases
}

/** 0.2's GWS_SERVICES names the services to show; each service is a toolset. */
function services(env: NodeJS.ProcessEnv): string[] | "all" {
  const raw = env.GWS_SERVICES?.trim()
  return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : "all"
}

export function createApp() {
  return slipway<AppContext>({
    name: "google-workspace",
    title: "Google Workspace",
    version: VERSION,
    package: "@thenavidm/google-workspace-mcp-cli",
    envPrefix: "GWS",
    description: "Gmail, Drive, Docs, Sheets, Slides, Calendar, Tasks, Forms and Contacts, through Google's own Workspace CLI on this machine.",
    instructions: INSTRUCTIONS,
    context: () => ({}),
    // The credential is the gws CLI's; doctor says whether it is signed in.
    configured: () => true,
    tools: TOOLS,
    doctor,
    doctorNetwork: true,
    toolsets: {
      gmail: "Search, read, draft and send mail, and labels",
      drive: "Search, read, export, share and trash files, and folders",
      sheets: "Read, write and append ranges, and create spreadsheets",
      docs: "Read, create and append to documents",
      calendar: "Events and calendars",
      tasks: "Task lists and tasks",
      slides: "Read and create presentations",
      forms: "Forms and their responses",
      contacts: "Search and list contacts",
    },
    defaults: { toolsets: services },
    flagAliases: kebabAliases(),
    login:
      "This server never sees a Google credential: the gws CLI holds it. Install the CLI from https://github.com/googleworkspace/cli and run `gws auth login` on this machine, then run google-workspace-cli doctor. This command does not open a browser or store anything.",
    settings: [
      { env: "GWS_BIN", description: "Path to the gws binary, when it is not on the PATH." },
      { env: "GWS_SERVICES", description: "Show only these services' tools, e.g. drive,gmail,calendar; every service when unset." },
      { env: "GWS_MCP_TOKEN", description: "Bearer token --http requires; 0.2's name for GWS_HTTP_TOKEN, still read.", secret: true },
    ],
    links: { repository: "https://github.com/thenavidm/google-workspace-mcp-cli" },
  })
}

export const app = createApp()
