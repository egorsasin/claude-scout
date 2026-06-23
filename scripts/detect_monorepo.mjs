#!/usr/bin/env node
/**
 * detect_monorepo.mjs — Detect monorepo structure in a git repository.
 *
 * Supports: Nx, Turborepo, pnpm workspaces, npm/yarn workspaces, Lerna, Rush.
 *
 * Usage:
 *   node scripts/detect_monorepo.mjs <local-path>
 *
 * Output (JSON):
 *   {
 *     "is_monorepo": true,
 *     "tool": "nx",
 *     "apps": [{ "name": "web", "path": "apps/web", "type": "app" }],
 *     "libs": [{ "name": "ui",  "path": "packages/ui", "type": "lib" }],
 *     "error": null
 *   }
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve, basename } from "node:path";

function err(message) {
  return { is_monorepo: false, tool: null, apps: [], libs: [], error: message };
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readYaml(filePath) {
  // Minimal YAML reader — just extract workspace glob patterns
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

/** List immediate subdirectories of a directory. */
function subdirs(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((n) => !n.startsWith(".") && n !== "node_modules");
  } catch {
    return [];
  }
}

/** Detect the monorepo tool and workspace patterns from root config files. */
function detectTool(root) {
  if (existsSync(join(root, "nx.json"))) return "nx";
  if (existsSync(join(root, "turbo.json"))) return "turborepo";
  if (existsSync(join(root, "lerna.json"))) return "lerna";
  if (existsSync(join(root, "rush.json"))) return "rush";
  if (existsSync(join(root, "pnpm-workspace.yaml"))) return "pnpm-workspaces";

  // npm/yarn workspaces: package.json with "workspaces" key
  const pkg = readJson(join(root, "package.json"));
  if (pkg?.workspaces) return "npm-workspaces";

  return null;
}

/**
 * Determine which directories are "apps" vs "libs" based on known conventions.
 * Returns { apps: [], libs: [] } where each item is { name, path, type }
 */
function collectWorkspaces(root, tool) {
  const apps = [];
  const libs = [];

  // Known app roots and lib roots per tool/convention
  const appDirs = [
    "apps",
    "application",
    "frontend",
    "backend",
    "services",
    "examples",
  ];
  const libDirs = [
    "packages",
    "libs",
    "libraries",
    "shared",
    "common",
    "modules",
  ];

  function addEntries(parentDir, type) {
    const target = type === "app" ? apps : libs;
    for (const name of subdirs(join(root, parentDir))) {
      const relPath = `${parentDir}/${name}`;
      // Only include if it looks like a real package (has package.json, tsconfig, or src/)
      const fullPath = join(root, relPath);
      const isPackage =
        existsSync(join(fullPath, "package.json")) ||
        existsSync(join(fullPath, "tsconfig.json")) ||
        existsSync(join(fullPath, "src")) ||
        existsSync(join(fullPath, "lib")) ||
        existsSync(join(fullPath, "index.ts")) ||
        existsSync(join(fullPath, "index.js"));

      if (isPackage) {
        const pkg = readJson(join(fullPath, "package.json"));
        target.push({
          name: pkg?.name ?? name,
          path: relPath,
          type,
        });
      }
    }
  }

  // Scan known app directories
  for (const dir of appDirs) {
    if (existsSync(join(root, dir))) addEntries(dir, "app");
  }

  // Scan known lib directories
  for (const dir of libDirs) {
    if (existsSync(join(root, dir))) addEntries(dir, "lib");
  }

  // For Nx: also read project.json files for better names
  if (tool === "nx") {
    const nxConfig = readJson(join(root, "nx.json"));
    // nx.json itself doesn't list projects in newer Nx — they're discovered
    // from project.json files, which we already pick up via subdirs above
  }

  return { apps, libs };
}

function detect(repoPath) {
  const root = resolve(repoPath);
  if (!existsSync(root)) return err(`Path does not exist: ${root}`);

  const tool = detectTool(root);
  if (!tool) {
    return { is_monorepo: false, tool: null, apps: [], libs: [], error: null };
  }

  const { apps, libs } = collectWorkspaces(root, tool);

  // If no apps/libs found despite having a tool config, still report as monorepo
  return {
    is_monorepo: true,
    tool,
    apps,
    libs,
    error: null,
  };
}

const arg = process.argv[2];
if (!arg) {
  console.log(
    JSON.stringify(
      err("Usage: node detect_monorepo.mjs <local-path>"),
      null,
      2,
    ),
  );
  process.exit(1);
}

const result = detect(arg);
console.log(JSON.stringify(result, null, 2));
process.exit(result.error ? 1 : 0);
