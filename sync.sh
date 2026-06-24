#!/usr/bin/env bash
# Sync local development files to ~/.claude
# Run after any changes: ./sync.sh

set -euo pipefail

SKILL_BASE="${HOME}/.claude/skills"
AGENT_DIR="${HOME}/.claude/agents"

echo "Syncing claude-scout to ~/.claude..."

# Skills
for skill_dir in skills/*/; do
  skill_name=$(basename "${skill_dir}")
  mkdir -p "${SKILL_BASE}/${skill_name}"
  cp -r "${skill_dir}"* "${SKILL_BASE}/${skill_name}/"
  echo "  ✓ skills/${skill_name}"
done

# Scripts (go into the main scout skill dir)
if [ -d "scripts" ]; then
  mkdir -p "${SKILL_BASE}/scout/scripts"
  cp scripts/*.mjs "${SKILL_BASE}/scout/scripts/"
  echo "  ✓ scripts/"
fi

# Agents
cp agents/*.md "${AGENT_DIR}/"
echo "  ✓ agents/"

echo "Done. Restart Claude Code session to pick up changes."
