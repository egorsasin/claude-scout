#!/usr/bin/env node
/**
 * clone_repo.mjs — Clone a GitHub repository to a temp directory for analysis.
 *
 * Auth priority:
 *   1. `gh` CLI (if installed and authenticated — handles private repos automatically)
 *   2. GITHUB_TOKEN env var (for CI or manual token setup)
 *   3. Regular `git clone` (SSH keys or git credential helper)
 *
 * Usage:
 *   node scripts/clone_repo.mjs <github-url-or-local-path>
 *
 * Output (JSON):
 *   { "path": "/tmp/scout-abc", "is_temp": true,  "repo": "user/repo", "auth_method": "gh|token|git", "error": null }
 *   { "path": "/abs/local/path","is_temp": false, "repo": null,        "auth_method": null,            "error": null }
 *   { "path": null,             "is_temp": false, "repo": null,        "auth_method": null,            "error": "..." }
 */

import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ALLOWED_HOST = "github.com";

function err(message) {
  return { path: null, is_temp: false, repo: null, auth_method: null, error: message };
}

/** Check if `gh` CLI is installed and the user is authenticated. */
function ghAvailable() {
  try {
    execSync("gh auth status", { stdio: "ignore", timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

/** Return a clone URL with GITHUB_TOKEN embedded, or null if no token. */
function tokenCloneUrl(owner, repo) {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (!token) return null;
  return `https://${token}@github.com/${owner}/${repo}.git`;
}

function runClone(cmd, args, tmpDir) {
  execFileSync(cmd, args, {
    timeout: 120_000,
    stdio: ["ignore", "ignore", "pipe"],
  });
}

function resolveTarget(target) {
  target = target.trim();

  // --- Local path ---
  if (!target.startsWith("http")) {
    const abs = resolve(target.replace(/^~/, process.env.HOME ?? "~"));
    if (!existsSync(abs)) return err(`Path does not exist: ${abs}`);
    return { path: abs, is_temp: false, repo: null, auth_method: null, error: null };
  }

  // --- URL validation: only github.com ---
  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return err(`Invalid URL: ${target}`);
  }

  if (parsed.hostname !== ALLOWED_HOST) {
    return err(`Only github.com URLs are supported. Got: ${parsed.hostname}`);
  }

  // Extract owner/repo and optional branch
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return err(`Cannot parse owner/repo from URL: ${target}`);

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, "");
  const repoSlug = `${owner}/${repo}`;
  const branch = parts[2] === "tree" && parts[3] ? parts[3] : null;

  const tmpDir = mkdtempSync(join(tmpdir(), "scout-"));

  // --- Auth strategy 1: gh CLI ---
  if (ghAvailable()) {
    try {
      const ghArgs = ["repo", "clone", repoSlug, tmpDir, "--", "--depth", "1", "--quiet"];
      if (branch) ghArgs.push("--branch", branch);
      runClone("gh", ghArgs, tmpDir);
      return { path: tmpDir, is_temp: true, repo: repoSlug, auth_method: "gh", error: null };
    } catch (e) {
      // Fall through to next strategy
    }
  }

  // --- Auth strategy 2: GITHUB_TOKEN ---
  const tokenUrl = tokenCloneUrl(owner, repo);
  if (tokenUrl) {
    try {
      const gitArgs = ["clone", "--depth", "1", "--quiet"];
      if (branch) gitArgs.push("--branch", branch);
      gitArgs.push(tokenUrl, tmpDir);
      runClone("git", gitArgs, tmpDir);
      return { path: tmpDir, is_temp: true, repo: repoSlug, auth_method: "token", error: null };
    } catch (e) {
      // Fall through to next strategy
    }
  }

  // --- Auth strategy 3: plain git (SSH keys or credential helper) ---
  try {
    const gitArgs = ["clone", "--depth", "1", "--quiet"];
    if (branch) gitArgs.push("--branch", branch);
    gitArgs.push(`https://github.com/${owner}/${repo}.git`, tmpDir);
    runClone("git", gitArgs, tmpDir);
    return { path: tmpDir, is_temp: true, repo: repoSlug, auth_method: "git", error: null };
  } catch (e) {
    const stderr = e.stderr?.toString().trim() ?? e.message;
    const isPrivate =
      stderr.toLowerCase().includes("not found") ||
      stderr.toLowerCase().includes("repository not found") ||
      stderr.toLowerCase().includes("authentication failed");

    if (isPrivate) {
      return err(
        `Could not clone ${repoSlug} — repository may be private or not found.\n` +
        `To fix, try one of:\n` +
        `  • Install and authenticate gh CLI: https://cli.github.com\n` +
        `  • Set GITHUB_TOKEN env var with a personal access token\n` +
        `  • Configure SSH: git@github.com:${repoSlug}.git\n` +
        `  • Clone manually and pass the local path instead`
      );
    }
    return err(`git clone failed: ${stderr}`);
  }
}

const arg = process.argv[2];
if (!arg) {
  console.log(JSON.stringify(err("Usage: node clone_repo.mjs <github-url-or-local-path>"), null, 2));
  process.exit(1);
}

const result = resolveTarget(arg);
console.log(JSON.stringify(result, null, 2));
process.exit(result.error ? 1 : 0);
