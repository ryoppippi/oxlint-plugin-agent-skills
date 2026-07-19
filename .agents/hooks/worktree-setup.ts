#!/usr/bin/env bun
/**
 * Post-creation worktree setup, run by `git wt` via the `wt.hook` config
 * (see flake.nix). `git wt` executes the hook with the new worktree as the
 * working directory, so a fresh checkout is ready to use without a manual
 * `direnv allow` + first-shell wait.
 */

import { existsSync } from "node:fs";
import path from "node:path";

const target = path.resolve(process.argv[2] ?? process.cwd());

/**
 * Runs a command in the target worktree, streaming its output.
 *
 * @param cmd - Command and arguments to execute
 * @returns Whether the command exited successfully
 */
async function run(cmd: string[]): Promise<boolean> {
	const proc = Bun.spawn(cmd, { cwd: target, stdout: "inherit", stderr: "inherit" });
	return (await proc.exited) === 0;
}

// Approve the tracked .envrc so direnv activates the flake dev shell on cd.
if (existsSync(path.join(target, ".envrc")) && Bun.which("direnv") !== null) {
	await run(["direnv", "allow"]);
}

// Build the dev shell up front: entering it runs the flake shellHook, which
// installs node_modules from the lockfile. Doing it here means the first
// interactive shell in the worktree doesn't pay the realisation cost.
if (existsSync(path.join(target, "flake.nix")) && Bun.which("nix") !== null) {
	const ok = await run(["nix", "develop", ".", "--command", "true"]);
	if (!ok) process.exit(1);
}
