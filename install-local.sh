#!/usr/bin/env bash
set -euo pipefail

# Claude Scout — Local Development Installer
# Installs directly from this directory (no GitHub clone).
# Use during development instead of install.sh.

main() {
    REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    SKILL_BASE="${HOME}/.claude/skills"
    AGENT_DIR="${HOME}/.claude/agents"

    echo "════════════════════════════════════════"
    echo "║   Claude Scout - Local Install       ║"
    echo "║   Source: ${REPO_DIR}"
    echo "════════════════════════════════════════"
    echo ""

    # Check prerequisites
    command -v node >/dev/null 2>&1 || {
        echo "✗ Node.js is required but not installed."
        echo "  Install via: brew install node"
        exit 1
    }

    NODE_MAJOR=$(node -e 'process.stdout.write(String(process.versions.node.split(".")[0]))')
    if [ "${NODE_MAJOR}" -lt 18 ]; then
        echo "✗ Node.js 18+ required, found $(node --version)"
        echo "  Upgrade via: brew upgrade node"
        exit 1
    fi
    echo "✓ Node.js $(node --version)"

    # Check we're running from the project root
    if [ ! -f "${REPO_DIR}/skills/scout/SKILL.md" ]; then
        echo "✗ Run this script from the claude-scout project root."
        exit 1
    fi

    # Create target directories
    mkdir -p "${SKILL_BASE}" "${AGENT_DIR}"

    # Install skills
    echo ""
    echo "→ Installing skills..."
    for skill_dir in "${REPO_DIR}/skills"/*/; do
        skill_name=$(basename "${skill_dir}")
        mkdir -p "${SKILL_BASE}/${skill_name}"
        cp -r "${skill_dir}"* "${SKILL_BASE}/${skill_name}/"
        echo "  ✓ ${skill_name}"
    done

    # Install scripts into main scout skill dir
    if [ -d "${REPO_DIR}/scripts" ]; then
        echo "→ Installing scripts..."
        mkdir -p "${SKILL_BASE}/scout/scripts"
        cp "${REPO_DIR}/scripts/"*.mjs "${SKILL_BASE}/scout/scripts/"
        echo "  ✓ $(ls "${REPO_DIR}/scripts/"*.mjs | wc -l | tr -d ' ') scripts"
    fi

    # Install agents
    echo "→ Installing agents..."
    cp "${REPO_DIR}/agents/"*.md "${AGENT_DIR}/"
    echo "  ✓ $(ls "${REPO_DIR}/agents/"*.md | wc -l | tr -d ' ') agents"

    echo ""
    echo "✓ Installed from local source."
    echo ""
    echo "  Restart your Claude Code session to pick up changes."
    echo "  Run again after every change: ./install-local.sh"
}

main "$@"
