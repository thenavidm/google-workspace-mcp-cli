#!/usr/bin/env node
/**
 * Both binaries. `google-workspace-mcp` with no arguments serves MCP over
 * stdio, `--http` serves it over HTTP, and any command runs one tool from the
 * shell.
 *
 * Node's compile cache goes on before the app loads, so every launch after the
 * first skips compiling it again. NODE_DISABLE_COMPILE_CACHE=1 turns it off.
 */

import * as nodeModule from "node:module"

nodeModule.enableCompileCache?.()

const argv = process.argv.slice(2)
if (argv.includes("--http")) {
  // 0.2 named the token GWS_MCP_TOKEN and took --host; Slipway reads GWS_HTTP_TOKEN and GWS_HTTP_HOST.
  if (process.env.GWS_MCP_TOKEN && !process.env.GWS_HTTP_TOKEN) process.env.GWS_HTTP_TOKEN = process.env.GWS_MCP_TOKEN
  const at = argv.indexOf("--host")
  if (at !== -1 && argv[at + 1]) {
    process.env.GWS_HTTP_HOST = argv[at + 1]
    argv.splice(at, 2)
  }
  // HTTP exposes a Google account over the network, so 0.2 refused it without a token
  // even on this machine, and so does this.
  if (!process.env.GWS_HTTP_TOKEN?.trim()) {
    process.stderr.write(
      "GWS_HTTP_TOKEN is not set. HTTP mode exposes a Google account over the network, so it refuses to start without a bearer token. Generate one with: openssl rand -hex 32\n",
    )
    process.exit(10)
  }
}

const { app } = await import("./app.js")
await app.main(argv)
