#!/bin/bash
set -euo pipefail

# Only run in Claude Code cloud sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install the OpenSpec CLI used by the openspec-* skills and /opsx:* commands.
# Keep in sync with the version that generated the files in .claude/ (see `generatedBy`).
OPENSPEC_VERSION="1.14.0"

if command -v openspec >/dev/null 2>&1 && [ "$(openspec --version 2>/dev/null)" = "$OPENSPEC_VERSION" ]; then
  echo "OpenSpec $OPENSPEC_VERSION already installed"
  exit 0
fi

npm install -g "@fission-ai/openspec@${OPENSPEC_VERSION}"
openspec --version
