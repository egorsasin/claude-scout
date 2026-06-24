#!/usr/bin/env bash
set -euo pipefail

# Claude Scout Installer (macOS)
# Wraps everything in main() to prevent partial execution on network failure

main() {
    SKILL_DIR="${HOME}/.claude/skills/scout"
    AGENT_DIR="${HOME}/.claude/agents"
    REPO_URL="https://github.com/egorsasin/claude-scout"
    # TODO: switch default to a tagged release (e.g. v1.0.0) once tags are published.
    # For now we install from a branch. Override with CLAUDE_SCOUT_REF=<tag|branch>.
    REPO_REF="${CLAUDE_SCOUT_REF:-main}"

    echo "════════════════════════════════════════"
    echo "║   Claude Scout - Installer           ║"
    echo "║   Claude Code Skill                  ║"
    echo "════════════════════════════════════════"
    echo ""

    # Check prerequisites
    command -v node >/dev/null 2>&1 || {
        echo "✗ Node.js is required but not installed."
        echo "  Install via: brew install node"
        exit 1
    }
    command -v git >/dev/null 2>&1 || {
        echo "✗ Git is required but not installed."
        echo "  Install via: xcode-select --install"
        exit 1
    }

    # Check Node.js version (18+ required)
    NODE_MAJOR=$(node -e 'process.stdout.write(String(process.versions.node.split(".")[0]))')
    if [ "${NODE_MAJOR}" -lt 18 ]; then
        echo "✗ Node.js 18+ is required but $(node --version) was found."
        echo "  Upgrade via: brew upgrade node"
        exit 1
    fi
    echo "✓ Node.js $(node --version) detected"
    echo "✓ Git $(git --version | awk '{print $3}') detected"

    # Create directories
    mkdir -p "${SKILL_DIR}"
    mkdir -p "${AGENT_DIR}"

    # Clone to temp
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf ${TEMP_DIR}" EXIT

    echo ""
    echo "↓ Downloading Claude Scout (${REPO_REF})..."
    if ! git clone --depth 1 --branch "${REPO_REF}" "${REPO_URL}" "${TEMP_DIR}/claude-scout" 2>&1; then
        echo "✗ Failed to download Claude Scout (ref: ${REPO_REF})."
        echo "  Check the ref exists: git ls-remote ${REPO_URL} ${REPO_REF}"
        exit 1
    fi

    # Copy all skills
    echo "→ Installing skills..."
    for skill_dir in "${TEMP_DIR}/claude-scout/skills"/*/; do
        skill_name=$(basename "${skill_dir}")
        target="${HOME}/.claude/skills/${skill_name}"
        mkdir -p "${target}"
        cp -r "${skill_dir}"* "${target}/"
        echo "  ✓ ${skill_name}"
    done

    # Copy agents
    echo "→ Installing agents..."
    cp -r "${TEMP_DIR}/claude-scout/agents/"*.md "${AGENT_DIR}/"
    echo "  ✓ scout-docs.md, scout-stack.md, scout-arch.md"

    # Copy scripts into main skill dir so Claude can find them
    if [ -d "${TEMP_DIR}/claude-scout/scripts" ]; then
        echo "→ Installing scripts..."
        mkdir -p "${SKILL_DIR}/scripts"
        cp -r "${TEMP_DIR}/claude-scout/scripts/"* "${SKILL_DIR}/scripts/"
        chmod +x "${SKILL_DIR}/scripts/"*.mjs 2>/dev/null || true
        echo "  ✓ clone_repo.mjs, detect_monorepo.mjs"
    fi

    echo ""
    echo "✓ Claude Scout installed successfully!"
    echo ""
    echo "Open Claude Code and run:"
    echo "  /scout ./path/to/project"
    echo "  /scout https://github.com/user/repo"
    echo ""
    echo "To uninstall:"
    echo "  rm -rf ~/.claude/skills/scout ~/.claude/skills/scout-stack ~/.claude/skills/scout-arch"
    echo "  rm -f ~/.claude/agents/scout-*.md"
}

main "$@"
