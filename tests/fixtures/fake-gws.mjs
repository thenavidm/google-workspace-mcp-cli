#!/usr/bin/env node
// Stands in for Google's gws CLI: answers `auth status` as signed in, echoes every other call's
// arguments as JSON, and exits with FAKE_GWS_EXIT when that is set, writing FAKE_GWS_STDERR.
const args = process.argv.slice(2);
const code = Number(process.env.FAKE_GWS_EXIT ?? 0);
if (code) {
  process.stderr.write(process.env.FAKE_GWS_STDERR ?? "failed");
  process.exit(code);
}
if (args[0] === "auth" && args[1] === "status") {
  process.stdout.write(JSON.stringify({ auth_method: "oauth", storage: "keyring", keyring_backend: "macos" }));
} else {
  process.stdout.write(JSON.stringify({ called: args }));
}
