/**
 * The Workspace tools as Slipway tools.
 *
 * tools/index.ts registers each tool the way it did on the MCP SDK,
 * `server.registerTool(name, { description, inputSchema, annotations }, handler)`.
 * Here those calls are recorded and handed to Slipway, which builds the MCP
 * server and the CLI from them. Each tool belongs to the toolset of its
 * service, so GWS_SERVICES still decides which services this server shows.
 */

import { ApiError, NotConfiguredError, SlipwayError, UsageError, toolkit, z, type Risk, type Tool } from "@thenavidm/slipway"
import type { ZodRawShape } from "zod"
import { GwsError } from "../gws.js"

/** Every tool reaches Google through the gws CLI, which holds the credential, so there is nothing to build per call. */
export type AppContext = Record<string, never>

type Args = Record<string, unknown>
type JsonResult = { content: Array<{ type: "text"; text: string }> }
type Handler = (args: Args) => Promise<JsonResult>
type Config = { description: string; inputSchema: ZodRawShape; annotations: Record<string, boolean> }

/** What tools/index.ts registers its tools with: the MCP SDK's `registerTool`, recorded. */
export type ToolRegistrar = {
  registerTool<S extends ZodRawShape>(
    name: string,
    config: { description: string; inputSchema: S; annotations: Record<string, boolean> },
    handler: (args: z.infer<z.ZodObject<S>>) => Promise<JsonResult>,
  ): void
}

/** The services the curated tools reach, which are the toolsets. */
export const SERVICES = ["gmail", "drive", "sheets", "docs", "calendar", "tasks", "slides", "forms", "contacts"] as const

/**
 * A gws failure as the Slipway error that carries its exit code. The CLI's own
 * codes say what went wrong: 2 is no sign-in, 3 arguments it rejected, 127 no
 * CLI at all; anything else is Google or the network.
 */
export function toSlipway(error: unknown): unknown {
  if (error instanceof SlipwayError) return error
  if (error instanceof GwsError) {
    if (error.code === 2 || error.code === 127) return new NotConfiguredError(error.message)
    if (error.code === 3) return new UsageError(error.message)
    return new ApiError(error.message)
  }
  if (error instanceof Error && error.constructor === Error) return new UsageError(error.message)
  return error
}

function unwrap(result: JsonResult): unknown {
  return JSON.parse(result.content[0]?.text ?? "null")
}

function riskOf(annotations: Record<string, boolean>): Risk {
  return annotations.readOnlyHint ? "read" : annotations.destructiveHint ? "destructive" : "write"
}

/** A method name that removes something, as 0.2 read it. */
const deletes = (path: unknown): boolean => Array.isArray(path) && path.some((p) => /^(delete|remove|trash|clear)$/i.test(String(p)))

/** What a confirmed call does, in 0.2's words, for its refusal and the approval form. */
const CONSEQUENCES: Record<string, string> = {
  gmail_send_draft: "sends the email, which cannot be recalled",
  drive_trash: "moves the file to the trash",
  calendar_delete_event: "notifies the attendees and cannot be undone",
  workspace_raw: "looks like a delete",
}

/** What each confirmed call is about to do, for the audit log and a refusal. */
const SUMMARIES: Partial<Record<string, (a: Args) => string>> = {
  gmail_send_draft: (a) => `send draft ${String(a.draftId)}`,
  drive_trash: (a) => `trash file ${String(a.fileId)}`,
  calendar_delete_event: (a) => `delete event ${String(a.eventId)} from calendar ${String(a.calendarId ?? "primary")}`,
  workspace_raw: (a) => `${String(a.service)} ${Array.isArray(a.path) ? a.path.join(" ") : ""}`.trim(),
}

/** The name in words, for pickers and the command list: "Gmail send draft". */
function title(name: string): string {
  const words = name.split("_").join(" ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const kit = toolkit<AppContext>()

export function slipwayTools(register: (server: ToolRegistrar) => void): Tool<AppContext>[] {
  const recorded: Array<{ name: string; config: Config; handler: Handler }> = []
  register({
    registerTool: (name, config, handler) => {
      recorded.push({ name, config: config as unknown as Config, handler: handler as unknown as Handler })
    },
  })
  return recorded.map(({ name, config, handler }) => {
    const service = SERVICES.find((s) => name.startsWith(`${s}_`))
    const raw = name === "workspace_raw"
    const risk = riskOf(config.annotations)
    const summary = SUMMARIES[name]
    return kit.defineTool({
      name,
      title: title(name),
      description: config.description,
      input: z.object(config.inputSchema),
      risk,
      ...(config.annotations.idempotentHint !== undefined ? { idempotent: config.annotations.idempotentHint } : {}),
      // A raw call is a delete when its method says so, and a read when it sends no body,
      // so read-only mode keeps it for reads and refuses the rest, as 0.2 did.
      ...(raw ? { riskFor: (a: Args) => (deletes(a.path) ? "destructive" : a.body ? "write" : "read") as Risk, whenReadOnly: "reads" as const } : {}),
      ...(risk === "destructive" ? { consequence: CONSEQUENCES[name] ?? "cannot be undone" } : {}),
      ...(summary ? { summary } : {}),
      ...(service ? { tags: [service] } : {}),
      handler: async (args) => {
        try {
          return unwrap(await handler(args as Args))
        } catch (error) {
          throw toSlipway(error)
        }
      },
    })
  })
}
